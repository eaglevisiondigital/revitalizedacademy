-- Additive referral attribution for the initial secure Vitality contact capture.
ALTER TABLE public.contacts
 ADD COLUMN referral_source text,
 ADD COLUMN sales_rep_name text,
 ADD COLUMN referral_source_other text,
 ADD CONSTRAINT contacts_referral_source_allowed CHECK(referral_source IS NULL OR referral_source=ANY(ARRAY['Facebook','Instagram','Google Search','YouTube','LinkedIn','TikTok','Friend / Family','Existing Client','Event / Webinar','Church / Community','Podcast','Email','Sales Rep','Other'])),
 ADD CONSTRAINT contacts_sales_rep_name_length CHECK(sales_rep_name IS NULL OR length(trim(sales_rep_name)) BETWEEN 1 AND 160),
 ADD CONSTRAINT contacts_referral_other_length CHECK(referral_source_other IS NULL OR length(trim(referral_source_other)) BETWEEN 1 AND 240),
 ADD CONSTRAINT contacts_referral_details_match_source CHECK(
  (referral_source='Sales Rep' OR sales_rep_name IS NULL) AND
  (referral_source IS DISTINCT FROM 'Sales Rep' OR sales_rep_name IS NOT NULL) AND
  (referral_source='Other' OR referral_source_other IS NULL) AND
  (referral_source IS DISTINCT FROM 'Other' OR referral_source_other IS NOT NULL)
 );
COMMENT ON COLUMN public.contacts.referral_source IS 'Participant-reported first-touch referral source.';
COMMENT ON COLUMN public.contacts.sales_rep_name IS 'Participant-entered sales representative name when referral_source is Sales Rep.';
COMMENT ON COLUMN public.contacts.referral_source_other IS 'Participant-entered source detail when referral_source is Other.';

CREATE OR REPLACE FUNCTION private.vitality_resume_command(p_action text,p_hash text,p_next_hash text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d private.vitality_assessment_drafts%rowtype; c uuid; w uuid; j uuid; e text; n integer; s jsonb; r integer; b text; referral text; sales_rep text; referral_other text; lim private.vitality_resume_rate_limits%rowtype;
BEGIN
 IF p_action IN ('start','recover') THEN
  e:=lower(trim(p_payload->>'email'));
  IF e IS NULL OR length(e)>254 OR e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR p_next_hash IS NULL OR p_next_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid request' USING ERRCODE='22023'; END IF;
  IF p_action='start' THEN
   referral:=trim(coalesce(p_payload->>'referral_source', ''));
   sales_rep:=CASE WHEN referral='Sales Rep' THEN trim(coalesce(p_payload->>'sales_rep_name', '')) ELSE '' END;
   referral_other:=CASE WHEN referral='Other' THEN trim(coalesce(p_payload->>'referral_source_other', '')) ELSE '' END;
   IF NOT referral=ANY(ARRAY['Facebook','Instagram','Google Search','YouTube','LinkedIn','TikTok','Friend / Family','Existing Client','Event / Webinar','Church / Community','Podcast','Email','Sales Rep','Other'])
    OR (referral='Sales Rep' AND (sales_rep='' OR length(sales_rep)>160))
    OR (referral='Other' AND (referral_other='' OR length(referral_other)>240)) THEN RAISE EXCEPTION 'Invalid referral details' USING ERRCODE='22023'; END IF;
  END IF;
  -- Serialize exact normalized-email matching and rate limiting; never ILIKE a user email.
  PERFORM pg_advisory_xact_lock(hashtextextended('vitality:'||e,0));
  b:=encode(extensions.digest(e,'sha256'),'hex');
  SELECT * INTO lim FROM private.vitality_resume_rate_limits WHERE bucket=b FOR UPDATE;
  IF FOUND AND (lim.last_request>now()-interval '60 seconds' OR (lim.window_start>now()-interval '1 hour' AND lim.attempts>=3)) THEN RETURN '{}'::jsonb; END IF;
  INSERT INTO private.vitality_resume_rate_limits VALUES(b,now(),1,now())
   ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN private.vitality_resume_rate_limits.window_start>now()-interval '1 hour' THEN private.vitality_resume_rate_limits.attempts+1 ELSE 1 END,
    window_start=CASE WHEN private.vitality_resume_rate_limits.window_start>now()-interval '1 hour' THEN private.vitality_resume_rate_limits.window_start ELSE now() END,last_request=now();
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
   INSERT INTO public.journey_events(contact_id,journey_id,event_type,source,metadata,dedupe_key)
    VALUES(c,j,'vitality_started','website_vitality_assessment','{}','vitality_started:'||w) ON CONFLICT(dedupe_key) DO NOTHING;
   UPDATE public.contact_journey_steps SET status='in_progress',started_at=coalesce(started_at,now()),updated_at=now() WHERE journey_id=j AND step_key='vitality_assessment' AND status='pending';
  END IF;
  IF d.id IS NULL OR d.status<>'draft' THEN RETURN '{}'::jsonb; END IF;
  -- Recovery requests replace only an unredeemed mail credential, never a live session.
  UPDATE private.vitality_assessment_drafts SET recovery_hash=p_next_hash,recovery_expires_at=now()+interval '30 days' WHERE id=d.id;
  RETURN jsonb_build_object('recipient',d.recipient);
 END IF;
 IF p_action='cancel_mail' THEN
  UPDATE private.vitality_assessment_drafts SET recovery_hash=NULL,recovery_expires_at=NULL WHERE recovery_hash=p_hash;
  RETURN '{}'::jsonb;
 END IF;
 IF p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Resume unavailable' USING ERRCODE='42501'; END IF;
 IF p_action='redeem' THEN
  SELECT * INTO d FROM private.vitality_assessment_drafts WHERE recovery_hash=p_hash FOR UPDATE;
  IF d.id IS NULL OR d.recovery_expires_at<=now() OR p_next_hash IS NULL OR p_next_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Resume unavailable' USING ERRCODE='42501'; END IF;
  IF d.status='completed' THEN RETURN jsonb_build_object('status','completed'); END IF;
  IF d.status<>'draft' THEN RETURN jsonb_build_object('status',d.status); END IF;
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
