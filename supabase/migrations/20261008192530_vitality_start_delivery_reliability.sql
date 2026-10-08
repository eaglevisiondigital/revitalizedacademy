-- Narrow forward repair; never replay the original secure-resume migration.
-- Attempts contain hashes/provider references only. No new public read surface.
CREATE TABLE private.vitality_resume_mail_attempts (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 draft_id uuid NOT NULL REFERENCES private.vitality_assessment_drafts(id),
 purpose text NOT NULL CHECK(purpose IN ('start','recover')),
 credential_hash text NOT NULL UNIQUE CHECK(credential_hash ~ '^[a-f0-9]{64}$'),
 expires_at timestamptz NOT NULL,
 request_key text UNIQUE,
 delivery_state text NOT NULL DEFAULT 'dispatching' CHECK(delivery_state IN ('dispatching','accepted','uncertain','failed')),
 credential_state text NOT NULL DEFAULT 'pending' CHECK(credential_state IN ('pending','consumed','superseded','rejected')),
 lead_status text NOT NULL CHECK(lead_status IN ('dispatching','accepted','uncertain','failed','not_applicable','legacy_browser')),
 provider_id text,
 provider_status integer,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX vitality_single_start_mail ON private.vitality_resume_mail_attempts(draft_id) WHERE purpose='start';
CREATE INDEX vitality_mail_draft_order ON private.vitality_resume_mail_attempts(draft_id,id DESC);
ALTER TABLE private.vitality_resume_mail_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.vitality_resume_mail_attempts FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE private.vitality_resume_mail_attempts_id_seq FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION private.vitality_resume_command(p_action text,p_hash text,p_next_hash text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d private.vitality_assessment_drafts%rowtype; c uuid; w uuid; j uuid; e text; n integer; s jsonb; r integer; b text; referral text; sales_rep text; referral_other text; lim private.vitality_resume_rate_limits%rowtype; m private.vitality_resume_mail_attempts%rowtype; new_draft boolean:=false; request_hash text;
BEGIN
 IF p_action IN ('start','recover') THEN
  e:=lower(trim(p_payload->>'email'));
  IF e IS NULL OR length(e)>254 OR e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_next_hash IS NULL OR p_next_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid request' USING ERRCODE='22023'; END IF;
  IF p_action='start' THEN
   referral:=nullif(trim(coalesce(p_payload->>'referral_source', '')), '');
   sales_rep:=CASE WHEN referral='Sales Rep' THEN trim(coalesce(p_payload->>'sales_rep_name', '')) ELSE '' END;
   referral_other:=CASE WHEN referral='Other' THEN trim(coalesce(p_payload->>'referral_source_other', '')) ELSE '' END;
   IF referral IS NOT NULL AND (NOT referral=ANY(ARRAY['Facebook','Instagram','Google Search','YouTube','LinkedIn','TikTok','Friend / Family','Existing Client','Event / Webinar','Church / Community','Podcast','Email','Sales Rep','Other'])
    OR (referral='Sales Rep' AND (sales_rep='' OR length(sales_rep)>160))
    OR (referral='Other' AND (referral_other='' OR length(referral_other)>240))) THEN RAISE EXCEPTION 'Invalid referral details' USING ERRCODE='22023'; END IF;
  END IF;
  -- Serialize exact normalized-email matching and rate limiting; never ILIKE a user email.
  PERFORM pg_advisory_xact_lock(hashtextextended('vitality:'||e,0));
  b:=encode(extensions.digest(e,'sha256'),'hex');
  SELECT count(*),min(id::text)::uuid INTO n,c FROM public.contacts WHERE lower(trim(email))=e;
  IF n>1 THEN RETURN '{}'::jsonb; END IF; -- Ambiguous historical identity fails closed.
  IF c IS NULL AND p_action='start' THEN
   BEGIN
    INSERT INTO public.contacts(first_name,last_name,email,phone,lifecycle_stage,first_source,last_source,referral_source,sales_rep_name,referral_source_other)
     VALUES(left(p_payload->>'first_name',100),left(p_payload->>'last_name',100),e,left(p_payload->>'phone',40),'assessment_lead','website_vitality_assessment','website_vitality_assessment',referral,nullif(sales_rep,''),nullif(referral_other,'')) RETURNING id INTO c;
   EXCEPTION WHEN unique_violation THEN
    SELECT id INTO c FROM public.contacts WHERE lower(email)=e;
   END;
  END IF;
  IF c IS NULL THEN RETURN '{}'::jsonb; END IF;
  IF p_action='start' THEN
   UPDATE public.contacts SET
    sales_rep_name=CASE WHEN referral_source IS NULL THEN nullif(sales_rep,'') ELSE sales_rep_name END,
    referral_source_other=CASE WHEN referral_source IS NULL THEN nullif(referral_other,'') ELSE referral_source_other END,
    referral_source=coalesce(referral_source,referral),updated_at=now()
   WHERE id=c;
  END IF;
  SELECT * INTO d FROM private.vitality_assessment_drafts WHERE contact_id=c AND status<>'completed' FOR UPDATE;
  IF NOT FOUND AND p_action='start' THEN
   IF EXISTS(SELECT 1 FROM public.workflow_records WHERE contact_id=c AND workflow_type='vitality_assessment' AND status='completed') THEN RETURN '{}'::jsonb; END IF;
   SELECT id INTO w FROM public.workflow_records WHERE contact_id=c AND workflow_type='vitality_assessment' AND status='in_progress' ORDER BY created_at DESC,id LIMIT 1;
   IF w IS NULL THEN
    INSERT INTO public.workflow_records(contact_id,workflow_type,status,current_step,completion_percent,started_at,last_activity_at)
     VALUES(c,'vitality_assessment','in_progress','lead_capture',0,now(),now()) RETURNING id INTO w;
   END IF;
   SELECT id INTO j FROM public.contact_journeys WHERE contact_id=c AND status IN ('active','paused','nurture') ORDER BY created_at DESC,id LIMIT 1;
   IF j IS NULL THEN j:=public.ensure_contact_journey(c,'assessment_first','{"source":"website_vitality_assessment"}'); END IF;
   INSERT INTO private.vitality_assessment_drafts(contact_id,workflow_id,journey_id,recipient,identity)
    VALUES(c,w,j,e,jsonb_build_object('first_name',left(p_payload->>'first_name',100),'last_name',left(p_payload->>'last_name',100),'email',e,'phone',left(p_payload->>'phone',40),'referral_source',referral,'sales_rep_name',sales_rep,'referral_source_other',referral_other)) RETURNING * INTO d;
   new_draft:=true;
   INSERT INTO public.journey_events(contact_id,journey_id,event_type,source,metadata,dedupe_key)
    VALUES(c,j,'vitality_started','website_vitality_assessment','{}','vitality_started:'||w) ON CONFLICT(dedupe_key) DO NOTHING;
   UPDATE public.contact_journey_steps SET status='in_progress',started_at=coalesce(started_at,now()),updated_at=now() WHERE journey_id=j AND step_key='vitality_assessment' AND status='pending';
  END IF;
  IF d.id IS NULL OR d.status<>'draft' THEN RETURN '{}'::jsonb; END IF;
  -- Start is the durable logical event, not a resend API. Existing drafts are untouched.
  IF p_action='start' AND NOT new_draft THEN RETURN '{}'::jsonb; END IF;
  IF p_payload ? 'request_id' THEN
   IF p_payload->>'request_id' !~ '^[a-f0-9-]{36}$' THEN RAISE EXCEPTION 'Invalid request' USING ERRCODE='22023'; END IF;
   request_hash:=encode(extensions.digest(b||':'||(p_payload->>'request_id'),'sha256'),'hex');
   IF EXISTS(SELECT 1 FROM private.vitality_resume_mail_attempts WHERE request_key=request_hash) THEN RETURN '{}'::jsonb; END IF;
  END IF;
  SELECT * INTO lim FROM private.vitality_resume_rate_limits WHERE bucket=b FOR UPDATE;
  IF FOUND AND (lim.last_request>now()-interval '60 seconds' OR (lim.window_start>now()-interval '1 hour' AND lim.attempts>=3)) THEN RETURN '{}'::jsonb; END IF;
  INSERT INTO private.vitality_resume_rate_limits VALUES(b,now(),1,now())
   ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN private.vitality_resume_rate_limits.window_start>now()-interval '1 hour' THEN private.vitality_resume_rate_limits.attempts+1 ELSE 1 END,
    window_start=CASE WHEN private.vitality_resume_rate_limits.window_start>now()-interval '1 hour' THEN private.vitality_resume_rate_limits.window_start ELSE now() END,last_request=now();
  -- Reserve a send before network I/O. No raw credential or email body is persisted.
  INSERT INTO private.vitality_resume_mail_attempts(draft_id,purpose,credential_hash,expires_at,request_key,lead_status)
   VALUES(d.id,p_action,p_next_hash,now()+interval '30 days',request_hash,CASE WHEN new_draft AND p_payload->>'lead_owner'='edge' THEN 'dispatching' WHEN new_draft THEN 'legacy_browser' ELSE 'not_applicable' END) RETURNING * INTO m;
  RETURN jsonb_build_object('recipient',d.recipient,'mail_id',m.id,'start_identity',CASE WHEN new_draft AND p_payload->>'lead_owner'='edge' THEN d.identity ELSE NULL END);
 END IF;
 IF p_action IN ('mail_result','lead_result') THEN
  -- Lock the draft before its attempt in the same order as redeem/start.
  SELECT * INTO d FROM private.vitality_assessment_drafts WHERE id=(SELECT draft_id FROM private.vitality_resume_mail_attempts WHERE credential_hash=p_hash) FOR UPDATE;
  SELECT * INTO m FROM private.vitality_resume_mail_attempts WHERE credential_hash=p_hash FOR UPDATE;
  IF m.id IS NULL THEN RETURN '{}'::jsonb; END IF;
  IF p_action='lead_result' THEN
   IF m.lead_status='dispatching' AND p_payload->>'state' IN ('accepted','uncertain','failed') THEN
    UPDATE private.vitality_resume_mail_attempts SET lead_status=p_payload->>'state' WHERE id=m.id;
   END IF;
   RETURN '{}'::jsonb;
  END IF;
  IF m.delivery_state<>'dispatching' THEN RETURN '{}'::jsonb; END IF;
  IF p_payload->>'state' NOT IN ('accepted','uncertain','failed') THEN RAISE EXCEPTION 'Invalid delivery state' USING ERRCODE='22023'; END IF;
  UPDATE private.vitality_resume_mail_attempts SET delivery_state=p_payload->>'state',provider_id=CASE WHEN p_payload->>'provider_id' ~ '^[a-zA-Z0-9_-]{1,128}$' THEN p_payload->>'provider_id' ELSE NULL END,provider_status=CASE WHEN p_payload->>'provider_status' ~ '^[0-9]{3}$' THEN (p_payload->>'provider_status')::integer ELSE NULL END,updated_at=now() WHERE id=m.id AND delivery_state='dispatching';
  -- A definitive rejection never invalidates the previously usable link. Uncertain
  -- transport can have delivered; retain the issued credential instead of cancelling it.
  IF p_payload->>'state' IN ('accepted','uncertain') AND m.credential_state='pending' AND d.status='draft'
   AND m.id=(SELECT max(id) FROM private.vitality_resume_mail_attempts WHERE draft_id=d.id) THEN
   UPDATE private.vitality_assessment_drafts SET recovery_hash=m.credential_hash,recovery_expires_at=m.expires_at WHERE id=d.id;
   UPDATE private.vitality_resume_mail_attempts SET credential_state='superseded' WHERE draft_id=d.id AND id<m.id AND credential_state='pending';
  ELSIF p_payload->>'state'='failed' AND m.credential_state='pending' THEN
   UPDATE private.vitality_resume_mail_attempts SET credential_state='rejected' WHERE id=m.id;
  END IF;
  RETURN '{}'::jsonb;
 END IF;
 IF p_action='cancel_mail' THEN
  UPDATE private.vitality_assessment_drafts SET recovery_hash=NULL,recovery_expires_at=NULL WHERE recovery_hash=p_hash;
  RETURN '{}'::jsonb;
 END IF;
 IF p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Resume unavailable' USING ERRCODE='42501'; END IF;
 IF p_action='redeem' THEN
  SELECT * INTO d FROM private.vitality_assessment_drafts WHERE recovery_hash=p_hash OR id=(
   SELECT a.draft_id FROM private.vitality_resume_mail_attempts a WHERE a.credential_hash=p_hash AND a.credential_state='pending' AND a.delivery_state IN ('dispatching','accepted','uncertain') AND a.expires_at>now()
    AND a.id=(SELECT max(b.id) FROM private.vitality_resume_mail_attempts b WHERE b.draft_id=a.draft_id)) FOR UPDATE;
  IF d.id IS NULL OR (d.recovery_hash=p_hash AND (d.recovery_expires_at IS NULL OR d.recovery_expires_at<=now())) OR p_next_hash IS NULL OR p_next_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Resume unavailable' USING ERRCODE='42501'; END IF;
  IF d.status='completed' THEN RETURN jsonb_build_object('status','completed'); END IF;
  IF d.status<>'draft' THEN RETURN jsonb_build_object('status',d.status); END IF;
  UPDATE private.vitality_resume_mail_attempts SET credential_state=CASE WHEN credential_hash=p_hash THEN 'consumed' ELSE 'superseded' END,updated_at=now() WHERE draft_id=d.id AND (credential_hash=p_hash OR credential_state='pending');
  UPDATE private.vitality_assessment_drafts SET session_hash=p_next_hash,session_expires_at=now()+interval '30 days',recovery_hash=NULL,recovery_expires_at=NULL,verified_at=now() WHERE id=d.id RETURNING * INTO d;
 ELSE
  SELECT * INTO d FROM private.vitality_assessment_drafts WHERE session_hash=p_hash FOR UPDATE;
  IF d.id IS NULL OR d.session_expires_at<=now() OR d.verified_at IS NULL THEN RAISE EXCEPTION 'Resume unavailable' USING ERRCODE='42501'; END IF;
 END IF;
 IF p_payload ? 'draft_id' AND p_payload->>'draft_id' IS DISTINCT FROM d.id::text THEN RAISE EXCEPTION 'Resume unavailable' USING ERRCODE='42501'; END IF;
 IF d.status='completed' THEN RETURN jsonb_build_object('status','completed','draft_id',d.id); END IF;
 IF p_action='save' THEN
  IF d.status<>'draft' THEN RAISE EXCEPTION 'Assessment is locked' USING ERRCODE='55000'; END IF;
  s:=p_payload->'snapshot'; r:=(p_payload->>'revision')::integer;
  IF r IS DISTINCT FROM d.revision THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE='40001'; END IF;
  IF s IS NULL OR jsonb_typeof(s)<>'object' OR (s->>'version') IS DISTINCT FROM '1' OR jsonb_typeof(s->'fields') IS DISTINCT FROM 'object'
   OR length(s::text)>250000 OR NOT coalesce((s->>'section')::integer BETWEEN 0 AND 30,false) OR NOT coalesce((s->>'percent')::integer BETWEEN 0 AND 99,false)
   OR NOT coalesce(s->>'pathway' IN ('Adult','Child (ages 0–18)'),false) THEN RAISE EXCEPTION 'Invalid snapshot' USING ERRCODE='22023'; END IF;
  UPDATE private.vitality_assessment_drafts SET snapshot=s,revision=revision+1,updated_at=now(),session_expires_at=now()+interval '30 days' WHERE id=d.id RETURNING * INTO d;
  UPDATE public.workflow_records SET current_step=left(coalesce(s->>'section_label','assessment'),160),completion_percent=(s->>'percent')::integer,last_activity_at=now(),updated_at=now() WHERE id=d.workflow_id AND status<>'completed';
  UPDATE public.contact_journeys SET last_activity_at=now(),updated_at=now() WHERE id=d.journey_id;
 ELSIF p_action='prepare_final' THEN
  IF d.status<>'draft' THEN RETURN jsonb_build_object('status',d.status,'draft_id',d.id); END IF;
  IF (p_payload->>'revision')::integer IS DISTINCT FROM d.revision OR NOT coalesce(length(p_payload->>'form') BETWEEN 1 AND 500000,false) OR p_next_hash IS NULL OR p_next_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid finalization' USING ERRCODE='22023'; END IF;
  UPDATE private.vitality_assessment_drafts SET status='submitting',final_form=p_payload->>'form',dispatch_hash=p_next_hash,dispatched_at=now(),updated_at=now() WHERE id=d.id;
  -- Only this transaction returns permission to send. A retry never issues it twice.
  RETURN jsonb_build_object('status','dispatch','draft_id',d.id,'identity',d.identity);
 ELSIF p_action IN ('finish_final','uncertain_final') THEN
  IF d.status<>'submitting' OR d.dispatch_hash IS DISTINCT FROM p_next_hash THEN RAISE EXCEPTION 'Invalid finalization' USING ERRCODE='42501'; END IF;
  IF p_action='uncertain_final' THEN
   UPDATE private.vitality_assessment_drafts SET status='delivery_uncertain',updated_at=now() WHERE id=d.id;
   RETURN jsonb_build_object('status','delivery_uncertain');
  END IF;
  UPDATE private.vitality_assessment_drafts SET status='completed',completed_at=now(),updated_at=now(),snapshot=jsonb_set(snapshot,'{percent}','100'),dispatch_hash=NULL WHERE id=d.id;
  UPDATE public.workflow_records SET status='completed',current_step='complete',completion_percent=100,completed_at=now(),last_activity_at=now(),updated_at=now() WHERE id=d.workflow_id;
  UPDATE public.contact_journey_steps SET status='completed',completion_source='website_assessment',completed_at=now(),updated_at=now() WHERE journey_id=d.journey_id AND step_key='vitality_assessment' AND status<>'completed';
  INSERT INTO public.journey_events(contact_id,journey_id,event_type,source,metadata,dedupe_key)
   VALUES(d.contact_id,d.journey_id,'vitality_completed','website_vitality_assessment',jsonb_build_object('assessment_id',d.id),'vitality_completed:'||d.workflow_id) ON CONFLICT(dedupe_key) DO NOTHING;
  -- Preserve the existing assessment-derived tags, never accept arbitrary CRM tags.
  INSERT INTO public.contact_tags(contact_id,tag,source,rule_key,updated_at)
   SELECT d.contact_id,tag,'automatic','assessment-derived',now()
   FROM jsonb_array_elements_text(coalesce(p_payload->'derived_tags','[]'::jsonb)) AS tags(tag)
   WHERE tag IN ('concern:low-energy','concern:fatigue','concern:pain','concern:sleep','concern:stress','concern:digestion','concern:chronic-condition','goal:energy','goal:weight','goal:strength','goal:mobility','goal:longevity','goal:family-health')
   ON CONFLICT(contact_id,tag) DO NOTHING;
  INSERT INTO public.contact_activity(contact_id,activity_type,title,detail,metadata)
   VALUES(d.contact_id,'vitality_completed','Vitality Assessment completed','The Vitality Assessment was completed on the website.',jsonb_build_object('workflow_id',d.workflow_id,'journey_id',d.journey_id));
  RETURN jsonb_build_object('status','completed','draft_id',d.id);
 ELSIF p_action NOT IN ('read','redeem') THEN RAISE EXCEPTION 'Invalid action' USING ERRCODE='22023';
 END IF;
 IF d.status<>'draft' THEN RETURN jsonb_build_object('status',d.status,'draft_id',d.id); END IF;
 RETURN jsonb_build_object('status','draft','draft_id',d.id,'identity',d.identity,'snapshot',d.snapshot,'revision',d.revision,'expires_at',d.session_expires_at);
END;
$$;
