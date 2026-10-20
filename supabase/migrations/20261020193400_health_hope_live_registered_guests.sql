-- Approved 2026-10-20: event participation is a guest relationship, never client onboarding.
-- Forward-only candidate; do not apply remotely until registration release gates pass.
-- No new person table, auth identity, RLS policy, permission, enrollment or health record.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
ALTER TABLE public.contacts DROP CONSTRAINT contacts_lifecycle_stage_check;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_lifecycle_stage_check
 CHECK(lifecycle_stage IN ('lead','assessment_lead','webinar_lead','applicant','client','inactive','registered_guest','engaged_guest','prospective_client')) NOT VALID;
ALTER TABLE public.contacts VALIDATE CONSTRAINT contacts_lifecycle_stage_check;
ALTER TABLE private.hhl_registrations ADD COLUMN attendance_status text NOT NULL DEFAULT 'unreviewed'
 CHECK(attendance_status IN ('unreviewed','no_show'));

-- Membership in the event audience is independent of the contact's existing
-- relationship. Existing prospects and clients keep their classification.
CREATE FUNCTION private.hhl_guest_link() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.contact_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.contact_id IS DISTINCT FROM OLD.contact_id) THEN
  INSERT INTO public.contact_tags(contact_id,tag,source,rule_key)
   VALUES(NEW.contact_id,'health_hope_live_guest','system','health_hope_live') ON CONFLICT(contact_id,tag) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.hhl_guest_link() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER hhl_guest_link AFTER INSERT OR UPDATE OF contact_id ON private.hhl_registrations
 FOR EACH ROW EXECUTE FUNCTION private.hhl_guest_link();

-- A late verified match corrects a reviewed no-show. It never promotes a guest.
CREATE FUNCTION private.hhl_attendance_correction() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.attended_at IS NOT NULL AND OLD.attendance_status='no_show' THEN
  NEW.attendance_status:='unreviewed';
  INSERT INTO private.hhl_audit(actor_id,action,subject_id,reason)
   VALUES(auth.uid(),'no-show-corrected-by-verified-attendance',NEW.id,'Verified attendance supersedes the earlier staff outcome');
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.hhl_attendance_correction() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER hhl_attendance_correction BEFORE UPDATE OF attended_at ON private.hhl_registrations
 FOR EACH ROW EXECUTE FUNCTION private.hhl_attendance_correction();

CREATE OR REPLACE FUNCTION private.hhl_service(p_action text,p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
#variable_conflict use_column
DECLARE cfg private.hhl_settings%rowtype; s private.hhl_sessions%rowtype; r private.hhl_registrations%rowtype;
 j private.hhl_jobs%rowtype; old private.hhl_requests%rowtype; e text; fn text; ln text; h text; ids uuid[];
 cid uuid; key text; cnt int; result jsonb; stamp timestamptz; sid uuid; rid uuid;
BEGIN
 SELECT * INTO STRICT cfg FROM private.hhl_settings WHERE singleton;
 IF p_action='sessions' THEN
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'starts_at'),'[]') INTO result FROM (
   SELECT jsonb_build_object('id',id,'starts_at',starts_at,'closes_at',closes_at,'status',status,'public_note',public_note) x
   FROM private.hhl_sessions WHERE cfg.registration_enabled AND status='published' AND starts_at>now() AND closes_at>now()
    AND (join_mode='manual' AND manual_join_url IS NOT NULL OR join_mode='zoom' AND zoom_validated_at>now()-interval '10 minutes' AND cfg.zoom_enabled)
   ORDER BY starts_at LIMIT 12) q;
  RETURN jsonb_build_object('sessions',result,'timezone','America/New_York');
 ELSIF p_action='register' THEN
  IF NOT cfg.registration_enabled THEN RAISE EXCEPTION 'registration_unavailable' USING ERRCODE='55000'; END IF;
  IF jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_data) x WHERE x NOT IN ('request_id','session_id','first_name','last_name','email','event_notifications','marketing_requested','source','ip_hash','guest_model_version')) THEN RAISE EXCEPTION 'invalid_registration' USING ERRCODE='22023'; END IF;
  IF p_data->>'guest_model_version' IS DISTINCT FROM 'hhl-guest-v1' THEN RAISE EXCEPTION 'guest_model_required' USING ERRCODE='55000'; END IF;
  e:=lower(trim(p_data->>'email')); fn:=trim(p_data->>'first_name'); ln:=trim(p_data->>'last_name');
  IF e IS NULL OR length(e)>254 OR e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR coalesce(length(fn),0) NOT BETWEEN 1 AND 100 OR coalesce(length(ln),0) NOT BETWEEN 1 AND 100 OR p_data->>'event_notifications' IS DISTINCT FROM 'true' OR p_data->>'source' IS DISTINCT FROM 'health_hope_live_website' OR p_data->>'ip_hash' !~ '^[a-f0-9]{64}$' OR p_data->>'ip_hash' IS NULL OR jsonb_typeof(p_data->'marketing_requested') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'invalid_registration' USING ERRCODE='22023'; END IF;
  h:=encode(extensions.digest((p_data-'ip_hash')::text,'sha256'),'hex');
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-request:'||(p_data->>'request_id')::uuid::text,0));
  SELECT * INTO old FROM private.hhl_requests WHERE request_id=(p_data->>'request_id')::uuid;
  IF old.request_id IS NOT NULL THEN
   IF old.payload_hash<>h THEN RAISE EXCEPTION 'request_conflict' USING ERRCODE='22023'; END IF;
   RETURN '{"received":true}'::jsonb;
  END IF;
  -- Match the existing manual-CRM email lock; never rewrite an existing identity.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rva-production-client:email:'||e,0));
  FOR key IN SELECT v FROM unnest(ARRAY[p_data->>'ip_hash',encode(extensions.digest('hhl-email:'||e,'sha256'),'hex')]) v ORDER BY v LOOP
   INSERT INTO private.hhl_limits(key_hash,window_at,count) VALUES(key,now(),1)
   ON CONFLICT(key_hash) DO UPDATE SET window_at=CASE WHEN hhl_limits.window_at<now()-interval '1 hour' THEN now() ELSE hhl_limits.window_at END,
    count=CASE WHEN hhl_limits.window_at<now()-interval '1 hour' THEN 1 ELSE hhl_limits.count+1 END RETURNING count INTO cnt;
   IF cnt>20 THEN RAISE EXCEPTION 'registration_rate_limited' USING ERRCODE='54000'; END IF;
  END LOOP;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=(p_data->>'session_id')::uuid FOR UPDATE;
  IF s.id IS NULL OR s.status<>'published' OR s.starts_at<=now() OR s.closes_at<=now() OR (s.join_mode='manual' AND s.manual_join_url IS NULL) OR (s.join_mode='zoom' AND (NOT cfg.zoom_enabled OR s.zoom_validated_at IS NULL OR s.zoom_validated_at<=now()-interval '10 minutes')) THEN RAISE EXCEPTION 'session_unavailable' USING ERRCODE='55000'; END IF;
  SELECT * INTO r FROM private.hhl_registrations WHERE session_id=s.id AND email=e;
  IF r.id IS NULL THEN
   SELECT array_agg(c.id) INTO ids FROM public.contacts c WHERE lower(trim(c.email))=e;
   IF cardinality(ids)=1 THEN
    SELECT c.id INTO cid FROM public.contacts c WHERE c.id=ids[1] AND c.record_kind='crm' AND lower(trim(c.first_name))=lower(fn) AND lower(trim(c.last_name))=lower(ln);
   ELSIF ids IS NULL THEN
    INSERT INTO public.contacts(first_name,last_name,email,lifecycle_stage,first_source,last_source) VALUES(fn,ln,e,'registered_guest','health_hope_live','health_hope_live') RETURNING id INTO cid;
   END IF;
   INSERT INTO private.hhl_registrations(session_id,contact_id,first_name,last_name,email,state,source,event_notifications,marketing_requested)
   VALUES(s.id,cid,fn,ln,e,CASE WHEN cid IS NULL THEN 'identity_review' WHEN s.join_mode='zoom' THEN 'pending' ELSE 'confirmed' END,'health_hope_live_website',true,(p_data->>'marketing_requested')::boolean) RETURNING * INTO r;
   IF r.state<>'identity_review' THEN
    INSERT INTO private.hhl_jobs(registration_id,kind,revision,run_after) VALUES(r.id,CASE WHEN s.join_mode='zoom' THEN 'zoom' ELSE 'confirmation' END,s.revision,now()),(r.id,'reminder',s.revision,greatest(now(),s.starts_at-interval '1 hour')) ON CONFLICT DO NOTHING;
   END IF;
  END IF;
  INSERT INTO private.hhl_requests(request_id,payload_hash,registration_id) VALUES((p_data->>'request_id')::uuid,h,r.id);
  RETURN '{"received":true}'::jsonb;
 ELSIF p_action='claim' THEN
  -- No retry of a possibly accepted non-idempotent Zoom POST. Expired leases
  -- become review items; idempotent mail retries stop before provider key expiry.
  UPDATE private.hhl_jobs SET state='review',last_error='notification_retry_window_expired' WHERE kind<>'zoom' AND state IN ('pending','leased') AND (attempts>=5 OR first_attempt_at<now()-interval '23 hours');
  UPDATE private.hhl_jobs SET state='review',last_error='zoom_outcome_uncertain' WHERE kind='zoom' AND state='leased' AND leased_at<now()-interval '3 minutes';
  SELECT q.* INTO j FROM private.hhl_jobs q JOIN private.hhl_registrations reg ON reg.id=q.registration_id JOIN private.hhl_sessions ses ON ses.id=reg.session_id
  WHERE q.run_after<=now() AND q.attempts<5 AND q.revision=ses.revision
   AND (q.kind='cancellation' OR ses.join_mode='manual' OR (cfg.zoom_enabled AND coalesce(p_data->>'allow_zoom','false')='true' AND ses.zoom_validated_at>now()-interval '10 minutes'))
   AND (q.state='pending' OR q.kind<>'zoom' AND q.state='leased' AND q.leased_at<now()-interval '3 minutes')
   AND (q.first_attempt_at IS NULL OR q.first_attempt_at>now()-interval '23 hours')
   AND ((q.kind='zoom' AND cfg.zoom_enabled AND coalesce(p_data->>'allow_zoom','false')='true' AND reg.state='pending' AND ses.status='published' AND ses.starts_at>now())
     OR (q.kind<>'zoom' AND cfg.notifications_enabled AND coalesce(p_data->>'allow_notifications','false')='true' AND reg.event_notifications AND reg.state='confirmed' AND ses.status='published' AND ses.starts_at>now())
     OR (q.kind='cancellation' AND cfg.notifications_enabled AND coalesce(p_data->>'allow_notifications','false')='true' AND reg.event_notifications AND ses.status='cancelled'))
  ORDER BY q.run_after,q.id FOR UPDATE OF q SKIP LOCKED LIMIT 1;
  IF j.id IS NULL THEN RETURN 'null'::jsonb; END IF;
  UPDATE private.hhl_jobs SET state='leased',lease=gen_random_uuid(),leased_at=now(),first_attempt_at=coalesce(first_attempt_at,now()),attempts=attempts+1 WHERE id=j.id RETURNING * INTO j;
  RETURN jsonb_build_object('id',j.id,'lease',j.lease);
 ELSIF p_action='job' THEN
  SELECT * INTO j FROM private.hhl_jobs WHERE id=(p_data->>'id')::uuid AND lease=(p_data->>'lease')::uuid AND state='leased' AND leased_at>now()-interval '3 minutes';
  SELECT * INTO r FROM private.hhl_registrations WHERE id=j.registration_id;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=r.session_id;
  IF j.id IS NULL OR j.revision<>s.revision OR (j.kind='zoom' AND NOT cfg.zoom_enabled) OR (j.kind<>'zoom' AND NOT cfg.notifications_enabled) OR (s.status<>'published' AND j.kind<>'cancellation') OR (j.kind<>'cancellation' AND r.state NOT IN ('pending','confirmed')) THEN RAISE EXCEPTION 'job_unavailable'; END IF;
  RETURN jsonb_build_object('id',j.id,'lease',j.lease,'kind',j.kind,'revision',j.revision,'first_attempt_at',j.first_attempt_at,'attempts',j.attempts,'registration_id',r.id,'first_name',r.first_name,'last_name',r.last_name,'email',r.email,'starts_at',s.starts_at,'session_id',s.id,'join_mode',s.join_mode,'meeting_id',s.zoom_meeting_id,'occurrence_id',s.zoom_occurrence_id,'join_url',CASE WHEN s.join_mode='zoom' THEN r.zoom_join_url ELSE s.manual_join_url END);
 ELSIF p_action='finish' THEN
  SELECT q.* INTO j FROM private.hhl_jobs q WHERE id=(p_data->>'id')::uuid AND lease=(p_data->>'lease')::uuid AND state='leased' FOR UPDATE;
  SELECT * INTO r FROM private.hhl_registrations WHERE id=j.registration_id FOR UPDATE;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=r.session_id;
  IF j.id IS NULL OR j.revision<>s.revision OR j.leased_at<=now()-interval '3 minutes' THEN RAISE EXCEPTION 'job_unavailable'; END IF;
  IF p_data->>'state' NOT IN ('done','pending','review') OR length(p_data->>'provider_id')>200 OR length(p_data->>'error')>80 THEN RAISE EXCEPTION 'invalid_job_result'; END IF;
  IF j.kind='zoom' AND p_data->>'state'='done' THEN
   IF s.status<>'published' OR r.state<>'pending' OR NOT cfg.zoom_enabled OR coalesce(length(p_data->>'registrant_id'),0) NOT BETWEEN 1 AND 200 OR coalesce(p_data->>'join_url','') !~ '^https://([a-z0-9-]+\.)?zoom\.us/j/[0-9]+([?][^[:space:]]*)?$' THEN RAISE EXCEPTION 'invalid_zoom_result'; END IF;
   UPDATE private.hhl_registrations SET state='confirmed',zoom_registrant_id=p_data->>'registrant_id',zoom_join_url=p_data->>'join_url' WHERE id=r.id;
   INSERT INTO private.hhl_jobs(registration_id,kind,revision) VALUES(r.id,'confirmation',s.revision) ON CONFLICT DO NOTHING;
  END IF;
  UPDATE private.hhl_jobs SET state=CASE WHEN attempts>=5 AND p_data->>'state'='pending' THEN 'review' ELSE p_data->>'state' END,
   run_after=now()+make_interval(secs=>least(3600,60*(2^least(attempts,5))::integer)),last_error=p_data->>'error',provider_id=p_data->>'provider_id',lease=NULL,leased_at=NULL WHERE id=j.id;
  RETURN '{"saved":true}'::jsonb;
 ELSIF p_action='attendance' THEN
  IF p_data->>'event_key' !~ '^[a-f0-9]{64}$' OR p_data->>'meeting_id' !~ '^[0-9]{9,12}$' THEN RAISE EXCEPTION 'invalid_attendance'; END IF;
  SELECT * INTO s FROM private.hhl_sessions WHERE zoom_meeting_id=p_data->>'meeting_id' AND zoom_instance_uuid=p_data->>'instance_uuid';
  IF s.id IS NOT NULL AND s.status='published' THEN
   SELECT id INTO rid FROM private.hhl_registrations WHERE session_id=s.id AND state='confirmed' AND zoom_registrant_id=p_data->>'registrant_id';
  END IF;
  stamp:=(p_data->>'observed_at')::timestamptz;
  IF NOT cfg.zoom_enabled THEN RAISE EXCEPTION 'zoom_held'; END IF;
  IF stamp>now()+interval '5 minutes' OR (s.id IS NOT NULL AND (stamp<s.starts_at-interval '30 minutes' OR stamp>s.starts_at+interval '2 hours')) THEN rid:=NULL; END IF;
  INSERT INTO private.hhl_attendance(event_key,session_id,meeting_id,instance_uuid,registrant_id,registration_id,state,observed_at)
   VALUES(p_data->>'event_key',s.id,p_data->>'meeting_id',p_data->>'instance_uuid',p_data->>'registrant_id',rid,CASE WHEN rid IS NULL THEN 'review' ELSE 'matched' END,stamp) ON CONFLICT DO NOTHING;
  IF FOUND AND rid IS NOT NULL THEN UPDATE private.hhl_registrations SET attended_at=coalesce(attended_at,stamp) WHERE id=rid; END IF;
  RETURN '{"received":true}'::jsonb;
 ELSIF p_action='zoom-sessions' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'session_id',id,'meeting_id',zoom_meeting_id,'occurrence_id',zoom_occurrence_id,'starts_at',starts_at,'revision',revision)),'[]') INTO result FROM (SELECT * FROM private.hhl_sessions WHERE cfg.zoom_enabled AND join_mode='zoom' AND status='published' AND starts_at>now() ORDER BY starts_at LIMIT 12) available;
  RETURN result;
 ELSIF p_action='zoom-change' THEN
  IF NOT cfg.zoom_enabled OR p_data->>'event_key' IS NULL OR p_data->>'event_key' !~ '^[a-f0-9]{64}$' OR p_data->>'kind' NOT IN ('updated','deleted') THEN RAISE EXCEPTION 'invalid_zoom_change'; END IF;
  INSERT INTO private.hhl_audit(action,reason,provider_event_key) VALUES('zoom_'||(p_data->>'kind'),'Provider schedule changed; staff review required',p_data->>'event_key') ON CONFLICT(provider_event_key) DO NOTHING;
  IF NOT FOUND THEN RETURN '{"received":true}'::jsonb; END IF;
  FOR s IN SELECT * FROM private.hhl_sessions WHERE zoom_meeting_id=p_data->>'meeting_id' AND status='published' AND starts_at>now() AND (p_data->>'occurrence_id' IS NULL OR zoom_occurrence_id=p_data->>'occurrence_id') ORDER BY id FOR UPDATE LOOP
   UPDATE private.hhl_sessions SET status=CASE WHEN p_data->>'kind'='deleted' THEN 'cancelled' ELSE 'draft' END,zoom_validated_at=NULL,revision=revision+1,updated_at=now() WHERE id=s.id RETURNING * INTO s;
   UPDATE private.hhl_jobs SET state='cancelled',lease=NULL WHERE registration_id IN (SELECT id FROM private.hhl_registrations WHERE session_id=s.id) AND state IN ('pending','leased');
   IF p_data->>'kind'='updated' AND s.join_mode='zoom' THEN UPDATE private.hhl_registrations SET state='pending',zoom_join_url=NULL WHERE session_id=s.id AND state='confirmed'; END IF;
   IF p_data->>'kind'='deleted' THEN
    INSERT INTO private.hhl_jobs(registration_id,kind,revision) SELECT id,'cancellation',s.revision FROM private.hhl_registrations WHERE session_id=s.id AND state IN ('pending','confirmed') ON CONFLICT DO NOTHING;
    UPDATE private.hhl_registrations SET state='cancelled' WHERE session_id=s.id AND state IN ('pending','confirmed');
   END IF;
  END LOOP;
  RETURN '{"received":true}'::jsonb;
 ELSIF p_action='zoom-sync' THEN
  IF NOT cfg.zoom_enabled THEN RAISE EXCEPTION 'zoom_held'; END IF;
  UPDATE private.hhl_sessions SET zoom_validated_at=now() WHERE id=(p_data->>'session_id')::uuid AND join_mode='zoom' AND zoom_meeting_id=p_data->>'meeting_id' AND zoom_occurrence_id=p_data->>'occurrence_id' AND starts_at=(p_data->>'starts_at')::timestamptz AND status<>'cancelled';
  IF NOT FOUND THEN RAISE EXCEPTION 'zoom_session_mismatch'; END IF;
  RETURN '{"saved":true}'::jsonb;
 END IF;
 RAISE EXCEPTION 'invalid_event_action' USING ERRCODE='22023';
END $$;

CREATE OR REPLACE FUNCTION private.hhl_staff(p_action text,p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
#variable_conflict use_column
DECLARE s private.hhl_sessions%rowtype; prior_session private.hhl_sessions%rowtype; r private.hhl_registrations%rowtype; a private.hhl_attendance%rowtype;
 result jsonb; d date; ts timestamptz; closing timestamptz; manage boolean; session_status text; sid uuid; reason text; weeks integer; n integer; c public.contacts%rowtype; target_stage text;
BEGIN
 manage:=private.hhl_staff_allowed(true);
 IF NOT private.hhl_staff_allowed(false) THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501'; END IF;
 IF p_action='overview' THEN
  RETURN jsonb_build_object('can_manage',manage,'settings',CASE WHEN manage THEN (SELECT to_jsonb(c)-'singleton' FROM private.hhl_settings c) ELSE '{}'::jsonb END,
   'sessions',(SELECT coalesce(jsonb_agg(x ORDER BY x->>'starts_at' DESC),'[]') FROM (SELECT jsonb_build_object('id',s.id,'regular_date',s.regular_date,'starts_at',s.starts_at,'closes_at',s.closes_at,'status',s.status,'join_mode',s.join_mode,'revision',s.revision,'public_note',s.public_note,'zoom_ready',s.zoom_validated_at IS NOT NULL,'zoom_meeting_id',CASE WHEN manage THEN s.zoom_meeting_id END,'zoom_occurrence_id',CASE WHEN manage THEN s.zoom_occurrence_id END,
   'registered',(SELECT count(*) FROM private.hhl_registrations r WHERE r.session_id=s.id AND r.contact_id IS NOT NULL AND private.hhl_staff_allowed(false,r.contact_id)),
   'attended',(SELECT count(*) FROM private.hhl_registrations r WHERE r.session_id=s.id AND r.attended_at IS NOT NULL AND private.hhl_staff_allowed(false,r.contact_id))) x FROM private.hhl_sessions s ORDER BY s.starts_at DESC LIMIT 52) q),
   'people',(SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT jsonb_build_object('contact_id',c.id,'name',concat_ws(' ',c.first_name,c.last_name),'email',c.email,'guest_classification','registered_guest','relationship_stage',c.lifecycle_stage,'active_client',EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.contact_id=c.id AND ca.status='active'),'can_progress',manage AND c.lifecycle_stage IN ('registered_guest','engaged_guest'),'registered',count(*),'attended',count(r.attended_at)) x FROM private.hhl_registrations r JOIN public.contacts c ON c.id=r.contact_id WHERE private.hhl_staff_allowed(false,c.id) AND (nullif(trim(p_data->>'query'),'') IS NULL OR c.email ILIKE '%'||left(p_data->>'query',160)||'%' OR concat_ws(' ',c.first_name,c.last_name) ILIKE '%'||left(p_data->>'query',160)||'%' OR c.id::text=p_data->>'query') GROUP BY c.id ORDER BY max(r.registered_at) DESC LIMIT 100) q),
   'review_count',CASE WHEN manage AND EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=auth.uid() AND contact_scope='all') THEN (SELECT count(*) FROM private.hhl_registrations WHERE state='identity_review')+(SELECT count(*) FROM private.hhl_attendance WHERE state='review')+(SELECT count(*) FROM private.hhl_jobs WHERE state='review' OR state IN ('pending','leased') AND (attempts>=5 OR first_attempt_at<now()-interval '23 hours')) ELSE 0 END);
 ELSIF p_action='history' THEN
  IF NOT private.hhl_staff_allowed(false,(p_data->>'contact_id')::uuid) OR p_data->>'contact_id' IS NULL THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('registration_id',r.id,'session_id',s.id,'starts_at',s.starts_at,'status',r.state,'session_status',s.status,'attendance_status',CASE WHEN r.attended_at IS NOT NULL THEN 'verified_attended' WHEN r.state='cancelled' OR s.status='cancelled' THEN 'cancelled' ELSE r.attendance_status END,'can_review_no_show',manage AND r.state='confirmed' AND s.status='published' AND s.starts_at+interval '30 minutes'<=now() AND r.attended_at IS NULL,'registered_at',r.registered_at,'attended_at',r.attended_at,'source',r.source,'marketing_requested',r.marketing_requested,'event_notifications',r.event_notifications) ORDER BY s.starts_at DESC),'[]') INTO result FROM private.hhl_registrations r JOIN private.hhl_sessions s ON s.id=r.session_id WHERE r.contact_id=(p_data->>'contact_id')::uuid;
  RETURN result;
 ELSIF p_action='join-info' THEN
  SELECT * INTO r FROM private.hhl_registrations WHERE id=(p_data->>'registration_id')::uuid;
  IF r.id IS NULL OR r.state<>'confirmed' OR r.contact_id IS NULL OR NOT private.hhl_staff_allowed(false,r.contact_id) THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501'; END IF;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=r.session_id;
  IF s.status<>'published' OR s.starts_at+interval '30 minutes'<=now() THEN RAISE EXCEPTION 'session_unavailable'; END IF;
  INSERT INTO private.hhl_audit(actor_id,action,subject_id) VALUES(auth.uid(),'manual_join_info_access',r.id);
  RETURN jsonb_build_object('join_url',CASE WHEN s.join_mode='zoom' THEN r.zoom_join_url ELSE s.manual_join_url END);
 END IF;
 IF NOT manage THEN RAISE EXCEPTION 'event_management_denied' USING ERRCODE='42501'; END IF;
 reason:=trim(p_data->>'reason');
 IF coalesce(length(reason),0) NOT BETWEEN 5 AND 500 THEN RAISE EXCEPTION 'review_reason_required' USING ERRCODE='22023'; END IF;
 IF p_action='guest-stage' THEN
  SELECT * INTO c FROM public.contacts WHERE id=(p_data->>'contact_id')::uuid FOR UPDATE;
  target_stage:=p_data->>'stage';
  IF c.id IS NULL OR c.record_kind<>'crm' OR NOT private.hhl_staff_allowed(false,c.id)
   OR NOT EXISTS(SELECT 1 FROM private.hhl_registrations WHERE contact_id=c.id)
   THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501'; END IF;
  IF c.lifecycle_stage IS DISTINCT FROM p_data->>'expected_stage' THEN RAISE EXCEPTION 'guest_stage_conflict' USING ERRCODE='40001'; END IF;
  -- Registration, attendance and optional marketing consent never advance this stage.
  -- A deliberate authorized staff action, with a reason, is required. This path
  -- cannot write 'client', create enrollment, or grant account access.
  IF NOT (c.lifecycle_stage='registered_guest' AND target_stage='engaged_guest'
    OR c.lifecycle_stage='engaged_guest' AND target_stage='prospective_client') OR target_stage IS NULL
   THEN RAISE EXCEPTION 'invalid_guest_progression' USING ERRCODE='22023'; END IF;
  UPDATE public.contacts SET lifecycle_stage=target_stage WHERE id=c.id;
  INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata)
   VALUES(c.id,'hhl_guest_progression','Guest relationship updated',auth.uid(),jsonb_build_object('from',c.lifecycle_stage,'to',target_stage,'reason',reason,'source','health_hope_live'));
  INSERT INTO private.hhl_audit(actor_id,action,subject_id,reason)
   VALUES(auth.uid(),'guest-stage:'||c.lifecycle_stage||':'||target_stage,c.id,reason);
  RETURN jsonb_build_object('saved',true,'relationship_stage',target_stage);
 ELSIF p_action='attendance-status' THEN
  SELECT * INTO r FROM private.hhl_registrations WHERE id=(p_data->>'registration_id')::uuid FOR UPDATE;
  IF r.id IS NULL OR r.contact_id IS NULL OR NOT private.hhl_staff_allowed(false,r.contact_id)
   THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501'; END IF;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=r.session_id;
  IF r.state<>'confirmed' OR s.status<>'published' OR s.starts_at+interval '30 minutes'>now() OR r.attended_at IS NOT NULL
   OR p_data->>'attendance_status' IS NULL OR p_data->>'attendance_status' NOT IN ('unreviewed','no_show')
   THEN RAISE EXCEPTION 'invalid_attendance_status' USING ERRCODE='22023'; END IF;
  IF r.attendance_status IS DISTINCT FROM p_data->>'expected_status' THEN RAISE EXCEPTION 'attendance_status_conflict' USING ERRCODE='40001'; END IF;
  -- Unmatched participants may be this guest. Resolve those identities first.
  IF p_data->>'attendance_status'='no_show' AND EXISTS(SELECT 1 FROM private.hhl_attendance a WHERE a.state='review'
    AND (a.session_id=s.id OR a.meeting_id=s.zoom_meeting_id AND a.observed_at BETWEEN s.starts_at-interval '30 minutes' AND s.starts_at+interval '2 hours'))
   THEN RAISE EXCEPTION 'attendance_review_required' USING ERRCODE='55000'; END IF;
  UPDATE private.hhl_registrations SET attendance_status=p_data->>'attendance_status' WHERE id=r.id;
  INSERT INTO private.hhl_audit(actor_id,action,subject_id,reason)
   VALUES(auth.uid(),'attendance-status:'||r.attendance_status||':'||(p_data->>'attendance_status'),r.id,reason);
  RETURN jsonb_build_object('saved',true);
 ELSIF p_action='settings' THEN
  IF jsonb_typeof(p_data->'registration_enabled') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_data->'zoom_enabled') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_data->'notifications_enabled') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'invalid_settings'; END IF;
  UPDATE private.hhl_settings SET registration_enabled=(p_data->>'registration_enabled')::boolean,zoom_enabled=(p_data->>'zoom_enabled')::boolean,notifications_enabled=(p_data->>'notifications_enabled')::boolean;
 ELSIF p_action='prepare-weekly' THEN
  d:=(p_data->>'first_thursday')::date; weeks:=(p_data->>'weeks')::integer;
  IF d IS NULL OR extract(isodow FROM d)<>4 OR d<=(now() AT TIME ZONE 'America/New_York')::date OR weeks IS NULL OR weeks NOT BETWEEN 1 AND 12 THEN RAISE EXCEPTION 'invalid_weekly_schedule'; END IF;
  FOR n IN 0..weeks-1 LOOP
   ts:=((d+n*7)+time '18:30') AT TIME ZONE 'America/New_York';
   INSERT INTO private.hhl_sessions(regular_date,starts_at,closes_at,manual_join_url,zoom_meeting_id)
   VALUES(d+n*7,ts,ts,nullif(p_data->>'manual_join_url',''),(regexp_match(p_data->>'manual_join_url','/j/([0-9]+)'))[1]) ON CONFLICT(regular_date) DO NOTHING;
  END LOOP;
 ELSIF p_action='session-save' THEN
  d:=(p_data->>'regular_date')::date; sid:=coalesce((p_data->>'id')::uuid,gen_random_uuid());
  ts:=coalesce((p_data->>'eastern_start')::timestamp AT TIME ZONE 'America/New_York',(p_data->>'starts_at')::timestamptz,(d+time '18:30') AT TIME ZONE 'America/New_York');
  IF p_data->>'eastern_start' IS NOT NULL AND ((ts AT TIME ZONE 'America/New_York') IS DISTINCT FROM (p_data->>'eastern_start')::timestamp OR ((ts+interval '1 hour') AT TIME ZONE 'America/New_York')=(p_data->>'eastern_start')::timestamp OR ((ts-interval '1 hour') AT TIME ZONE 'America/New_York')=(p_data->>'eastern_start')::timestamp) THEN RAISE EXCEPTION 'ambiguous_or_nonexistent_eastern_time'; END IF;
  closing:=coalesce((p_data->>'eastern_close')::timestamp AT TIME ZONE 'America/New_York',(p_data->>'closes_at')::timestamptz,ts); session_status:=coalesce(p_data->>'status','draft');
  SELECT * INTO s FROM private.hhl_sessions WHERE id=sid FOR UPDATE;
  IF s.id IS NOT NULL AND (p_data->>'revision')::integer IS DISTINCT FROM s.revision THEN RAISE EXCEPTION 'session_revision_conflict'; END IF;
  prior_session:=s;
  IF s.id IS NOT NULL AND s.status='cancelled' AND session_status<>'cancelled' THEN RAISE EXCEPTION 'cancelled_session_immutable'; END IF;
  IF s.id IS NOT NULL AND s.starts_at<=now() THEN RAISE EXCEPTION 'historical_session_immutable'; END IF;
  IF d IS NULL OR ts<=now() OR closing>ts OR session_status NOT IN ('draft','published','cancelled') OR p_data->>'join_mode' NOT IN ('manual','zoom') THEN RAISE EXCEPTION 'invalid_session'; END IF;
  IF session_status='published' AND p_data->>'join_mode'='manual' AND coalesce(nullif(p_data->>'manual_join_url',''),s.manual_join_url,'')='' THEN RAISE EXCEPTION 'joining_info_required'; END IF;
  -- Any changed Zoom binding must be validated server-side again before publication.
  IF session_status='published' AND p_data->>'join_mode'='zoom' AND (s.zoom_validated_at IS NULL OR s.zoom_validated_at<=now()-interval '10 minutes' OR s.starts_at<>ts OR s.zoom_meeting_id IS DISTINCT FROM p_data->>'zoom_meeting_id' OR s.zoom_occurrence_id IS DISTINCT FROM p_data->>'zoom_occurrence_id') THEN RAISE EXCEPTION 'zoom_validation_required'; END IF;
  INSERT INTO private.hhl_sessions(id,regular_date,starts_at,closes_at,status,join_mode,manual_join_url,zoom_meeting_id,zoom_occurrence_id,public_note)
   VALUES(sid,d,ts,closing,session_status,p_data->>'join_mode',coalesce(nullif(p_data->>'manual_join_url',''),s.manual_join_url),coalesce(nullif(p_data->>'zoom_meeting_id',''),(regexp_match(coalesce(nullif(p_data->>'manual_join_url',''),s.manual_join_url),'/j/([0-9]+)'))[1]),nullif(p_data->>'zoom_occurrence_id',''),coalesce(p_data->>'public_note',''))
  ON CONFLICT(id) DO UPDATE SET starts_at=excluded.starts_at,closes_at=excluded.closes_at,status=excluded.status,join_mode=excluded.join_mode,manual_join_url=excluded.manual_join_url,zoom_meeting_id=excluded.zoom_meeting_id,zoom_occurrence_id=excluded.zoom_occurrence_id,public_note=excluded.public_note,revision=hhl_sessions.revision+1,updated_at=now(),zoom_validated_at=CASE WHEN hhl_sessions.starts_at=excluded.starts_at AND hhl_sessions.zoom_meeting_id IS NOT DISTINCT FROM excluded.zoom_meeting_id AND hhl_sessions.zoom_occurrence_id IS NOT DISTINCT FROM excluded.zoom_occurrence_id THEN hhl_sessions.zoom_validated_at END;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=sid;
  IF prior_session.id IS NOT NULL AND (prior_session.join_mode IS DISTINCT FROM s.join_mode OR prior_session.zoom_meeting_id IS DISTINCT FROM s.zoom_meeting_id OR prior_session.zoom_occurrence_id IS DISTINCT FROM s.zoom_occurrence_id) THEN
   UPDATE private.hhl_registrations SET state=CASE WHEN s.join_mode='zoom' THEN 'pending' ELSE 'confirmed' END,zoom_registrant_id=NULL,zoom_join_url=NULL WHERE session_id=sid AND state IN ('pending','confirmed');
  END IF;
  UPDATE private.hhl_jobs j SET state='cancelled',lease=NULL WHERE j.registration_id IN (SELECT id FROM private.hhl_registrations WHERE session_id=sid) AND j.state IN ('pending','leased') AND j.revision<>s.revision;
  IF session_status='cancelled' THEN
   INSERT INTO private.hhl_jobs(registration_id,kind,revision) SELECT id,'cancellation',s.revision FROM private.hhl_registrations WHERE session_id=sid AND state IN ('confirmed','pending') ON CONFLICT DO NOTHING;
   UPDATE private.hhl_registrations SET state='cancelled' WHERE session_id=sid AND state IN ('confirmed','pending');
  ELSIF session_status='published' THEN
   INSERT INTO private.hhl_jobs(registration_id,kind,revision) SELECT id,'zoom',s.revision FROM private.hhl_registrations WHERE session_id=sid AND state='pending' ON CONFLICT DO NOTHING;
   INSERT INTO private.hhl_jobs(registration_id,kind,revision) SELECT id,'update',s.revision FROM private.hhl_registrations WHERE session_id=sid AND state='confirmed' ON CONFLICT DO NOTHING;
   INSERT INTO private.hhl_jobs(registration_id,kind,revision,run_after) SELECT id,'reminder',s.revision,greatest(now(),s.starts_at-interval '1 hour') FROM private.hhl_registrations WHERE session_id=sid AND state IN ('confirmed','pending') ON CONFLICT DO NOTHING;
  END IF;
 ELSIF p_action='review-list' THEN
  IF NOT EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=auth.uid() AND contact_scope='all') THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object('identities',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT id,session_id,first_name,last_name,email FROM private.hhl_registrations WHERE state='identity_review' ORDER BY registered_at LIMIT 100) q),
   'attendance',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT event_key,session_id,meeting_id,instance_uuid,registrant_id,observed_at FROM private.hhl_attendance WHERE state='review' ORDER BY created_at LIMIT 100) q),
   'jobs',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT id,registration_id,kind,state,last_error,attempts FROM private.hhl_jobs WHERE state='review' OR state IN ('pending','leased') AND (attempts>=5 OR first_attempt_at<now()-interval '23 hours') ORDER BY run_after LIMIT 100) q));
 ELSIF p_action='withdraw-consent' THEN
  SELECT * INTO r FROM private.hhl_registrations WHERE id=(p_data->>'registration_id')::uuid FOR UPDATE;
  IF r.id IS NULL OR r.contact_id IS NULL OR NOT private.hhl_staff_allowed(false,r.contact_id) OR (p_data->>'withdraw_event' IS DISTINCT FROM 'true' AND p_data->>'withdraw_marketing' IS DISTINCT FROM 'true') THEN RAISE EXCEPTION 'invalid_consent_withdrawal'; END IF;
  UPDATE private.hhl_registrations SET event_notifications=CASE WHEN p_data->>'withdraw_event'='true' THEN false ELSE event_notifications END,event_notices_withdrawn_at=CASE WHEN p_data->>'withdraw_event'='true' THEN coalesce(event_notices_withdrawn_at,now()) ELSE event_notices_withdrawn_at END,marketing_requested=CASE WHEN p_data->>'withdraw_marketing'='true' THEN false ELSE marketing_requested END,marketing_withdrawn_at=CASE WHEN p_data->>'withdraw_marketing'='true' THEN coalesce(marketing_withdrawn_at,now()) ELSE marketing_withdrawn_at END WHERE id=r.id;
  IF p_data->>'withdraw_event'='true' THEN UPDATE private.hhl_jobs SET state='cancelled',lease=NULL WHERE registration_id=r.id AND kind<>'zoom' AND state IN ('pending','leased'); END IF;
 ELSIF p_action='identity-resolve' THEN
  SELECT * INTO r FROM private.hhl_registrations WHERE id=(p_data->>'registration_id')::uuid FOR UPDATE;
  IF r.state IS DISTINCT FROM 'identity_review' OR NOT private.hhl_staff_allowed(false,(p_data->>'contact_id')::uuid) OR p_data->>'contact_id' IS NULL THEN RAISE EXCEPTION 'invalid_identity_review'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.contacts WHERE id=(p_data->>'contact_id')::uuid AND record_kind='crm' AND lower(trim(email))=r.email) THEN RAISE EXCEPTION 'identity_mismatch'; END IF;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=r.session_id;
  IF s.status<>'published' OR s.closes_at<=now() THEN RAISE EXCEPTION 'session_unavailable'; END IF;
  UPDATE private.hhl_registrations SET contact_id=(p_data->>'contact_id')::uuid,state=CASE WHEN s.join_mode='zoom' THEN 'pending' ELSE 'confirmed' END WHERE id=r.id;
  INSERT INTO private.hhl_jobs(registration_id,kind,revision,run_after) VALUES(r.id,CASE WHEN s.join_mode='zoom' THEN 'zoom' ELSE 'confirmation' END,s.revision,now()),(r.id,'reminder',s.revision,greatest(now(),s.starts_at-interval '1 hour')) ON CONFLICT DO NOTHING;
 ELSIF p_action='bind-instance' THEN
  UPDATE private.hhl_sessions SET zoom_instance_uuid=p_data->>'instance_uuid' WHERE id=(p_data->>'session_id')::uuid AND zoom_meeting_id=p_data->>'meeting_id'
   AND EXISTS(SELECT 1 FROM private.hhl_attendance a WHERE a.meeting_id=p_data->>'meeting_id' AND a.instance_uuid=p_data->>'instance_uuid' AND a.observed_at BETWEEN hhl_sessions.starts_at-interval '30 minutes' AND hhl_sessions.starts_at+interval '2 hours');
  IF NOT FOUND THEN RAISE EXCEPTION 'instance_binding_unavailable'; END IF;
 ELSIF p_action='attendance-resolve' THEN
  SELECT * INTO a FROM private.hhl_attendance WHERE event_key=p_data->>'event_key' AND state='review' FOR UPDATE;
  SELECT * INTO r FROM private.hhl_registrations WHERE id=(p_data->>'registration_id')::uuid;
  IF a.event_key IS NULL OR r.id IS NULL OR r.state<>'confirmed' OR r.contact_id IS NULL OR NOT private.hhl_staff_allowed(false,r.contact_id) THEN RAISE EXCEPTION 'invalid_attendance_review'; END IF;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=r.session_id;
  IF s.zoom_meeting_id IS DISTINCT FROM a.meeting_id OR s.zoom_instance_uuid IS DISTINCT FROM a.instance_uuid OR a.session_id IS NOT NULL AND a.session_id<>s.id THEN RAISE EXCEPTION 'attendance_session_mismatch'; END IF;
  UPDATE private.hhl_attendance SET registration_id=r.id,session_id=s.id,state='matched' WHERE event_key=a.event_key;
  UPDATE private.hhl_registrations SET attended_at=coalesce(attended_at,a.observed_at) WHERE id=r.id;
 ELSE RAISE EXCEPTION 'invalid_staff_event_action' USING ERRCODE='22023';
 END IF;
 INSERT INTO private.hhl_audit(actor_id,action,subject_id,reason) VALUES(auth.uid(),p_action,coalesce(sid,(p_data->>'registration_id')::uuid,(p_data->>'session_id')::uuid),reason);
 RETURN jsonb_build_object('saved',true,'session_id',sid);
END $$;

-- CREATE OR REPLACE preserves existing RPC ACLs; restate the intended grants.
REVOKE ALL ON FUNCTION private.hhl_service(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.hhl_service(text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION private.hhl_staff(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.hhl_staff(text,jsonb) TO authenticated;
COMMIT;
