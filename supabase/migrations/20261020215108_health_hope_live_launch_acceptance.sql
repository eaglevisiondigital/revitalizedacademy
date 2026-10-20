-- Additive local candidate: manual evidence and one-case confirmation acceptance.
-- No new tables, policies or roles; no activation or production installation.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
ALTER TABLE private.hhl_settings ADD COLUMN acceptance_case jsonb;
ALTER TABLE private.hhl_settings ADD CONSTRAINT hhl_acceptance_case_shape CHECK(acceptance_case IS NULL OR coalesce(
 jsonb_typeof(acceptance_case)='object' AND acceptance_case ?& ARRAY['email','session_id','request_id','operator_id','revision','starts_at','expires_at']
 AND acceptance_case->>'email' ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+[.][^[:space:]@<>]+$'
 AND (acceptance_case->>'session_id')::uuid IS NOT NULL AND (acceptance_case->>'request_id')::uuid IS NOT NULL AND (acceptance_case->>'operator_id')::uuid IS NOT NULL
 AND (acceptance_case->>'revision')::int>0 AND (acceptance_case->>'expires_at')::timestamptz>(acceptance_case->>'starts_at')::timestamptz
 AND (acceptance_case->>'expires_at')::timestamptz-(acceptance_case->>'starts_at')::timestamptz<=interval '30 minutes',false));
CREATE FUNCTION private.hhl_manual_attendance(p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.hhl_registrations%rowtype;s private.hhl_sessions%rowtype;a private.hhl_audit%rowtype;
 stamp timestamptz;local_stamp timestamp;instance text;source text;reason text;key text;
BEGIN
 IF NOT private.hhl_staff_allowed(true) THEN RAISE EXCEPTION 'event_management_denied' USING ERRCODE='42501';END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));
 SELECT * INTO r FROM private.hhl_registrations WHERE id=(p_data->>'registration_id')::uuid FOR UPDATE;
 IF r.id IS NULL OR r.contact_id IS NULL OR NOT private.hhl_staff_allowed(true,r.contact_id) THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501';END IF;
 SELECT * INTO s FROM private.hhl_sessions WHERE id=r.session_id;
 IF r.state<>'confirmed' OR r.privacy_hold OR s.status<>'published' OR s.starts_at+interval '30 minutes'>now()
  OR s.expired_at IS NOT NULL OR private.hhl_expires_at(s.starts_at)<=now() OR s.zoom_meeting_id IS NULL THEN RAISE EXCEPTION 'manual_attendance_unavailable';END IF;
 source:=p_data->>'evidence_source';reason:=trim(p_data->>'reason');
 IF p_data->'identity_verified' IS DISTINCT FROM 'true'::jsonb OR source IS NULL OR source NOT IN ('host_observed','verified_zoom_report')
  OR reason IS NULL OR length(reason)<5 OR length(reason)>500 OR reason~'[[:cntrl:]]'
  OR NOT(p_data?'expected_attended_at') THEN RAISE EXCEPTION 'manual_attendance_evidence_required' USING ERRCODE='22023';END IF;
 local_stamp:=(p_data->>'eastern_observed_at')::timestamp;stamp:=local_stamp AT TIME ZONE 'America/New_York';
 IF stamp IS NULL OR (stamp AT TIME ZONE 'America/New_York')<>local_stamp
  OR ((stamp+interval '1 hour') AT TIME ZONE 'America/New_York')=local_stamp OR ((stamp-interval '1 hour') AT TIME ZONE 'America/New_York')=local_stamp
  OR stamp<s.starts_at-interval '30 minutes' OR stamp>s.starts_at+interval '2 hours' OR stamp>now() THEN RAISE EXCEPTION 'manual_attendance_time_invalid' USING ERRCODE='22023';END IF;
 key:=encode(extensions.digest('hhl-manual:'||((p_data->>'request_id')::uuid)::text,'sha256'),'hex');
 IF key IS NULL THEN RAISE EXCEPTION 'manual_attendance_request_required';END IF;
 SELECT * INTO a FROM private.hhl_audit WHERE provider_event_key=key;
 IF a.id IS NOT NULL THEN
  IF a.actor_id IS DISTINCT FROM auth.uid() OR a.subject_id<>r.id OR a.action<>'manual-attendance:'||source OR a.reason<>reason OR r.attended_at IS DISTINCT FROM stamp
   THEN RAISE EXCEPTION 'manual_attendance_conflict' USING ERRCODE='40001';END IF;
  RETURN jsonb_build_object('saved',true,'attended_at',r.attended_at,'method','manual');
 END IF;
 IF r.attended_at IS DISTINCT FROM (p_data->>'expected_attended_at')::timestamptz OR r.attended_at IS NOT NULL THEN RAISE EXCEPTION 'manual_attendance_conflict' USING ERRCODE='40001';END IF;
 instance:=nullif(p_data->>'instance_uuid','');
 IF instance IS NOT NULL THEN
  IF length(instance)>200 OR instance~'[[:cntrl:]]' OR s.zoom_instance_uuid IS NOT NULL AND s.zoom_instance_uuid<>instance
   OR EXISTS(SELECT 1 FROM private.hhl_sessions WHERE id<>s.id AND zoom_instance_uuid=instance) THEN RAISE EXCEPTION 'attendance_session_mismatch';END IF;
  UPDATE private.hhl_sessions SET zoom_instance_uuid=instance WHERE id=s.id;
 END IF;
 INSERT INTO private.hhl_attendance(event_key,session_id,meeting_id,instance_uuid,registration_id,state,observed_at)
 VALUES(key,s.id,s.zoom_meeting_id,coalesce(instance,s.zoom_instance_uuid),r.id,'matched',stamp);
 UPDATE private.hhl_registrations SET attended_at=stamp,attendance_status='unreviewed' WHERE id=r.id;
 INSERT INTO private.hhl_audit(actor_id,action,subject_id,reason,provider_event_key) VALUES(auth.uid(),'manual-attendance:'||source,r.id,reason,key);
 RETURN jsonb_build_object('saved',true,'attended_at',stamp,'method','manual');
END $$;

CREATE FUNCTION private.hhl_acceptance_scope() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c jsonb;begins timestamptz;ends timestamptz;
BEGIN
 IF NOT private.hhl_staff_allowed(true) OR NOT EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=auth.uid() AND contact_scope='all') THEN RETURN NULL;END IF;
 SELECT acceptance_case INTO c FROM private.hhl_settings;
 IF c IS NULL OR (c->>'operator_id')::uuid IS DISTINCT FROM auth.uid() THEN RETURN NULL;END IF;
 begins:=(c->>'starts_at')::timestamptz;ends:=(c->>'expires_at')::timestamptz;
 IF begins IS NULL OR ends IS NULL OR ends<=begins OR ends-begins>interval '30 minutes' OR now()<begins OR now()>=ends THEN RETURN NULL;END IF;
 RETURN c;
END $$;
CREATE FUNCTION private.hhl_acceptance_register(p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c jsonb;result jsonb;rid uuid;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));
 c:=private.hhl_acceptance_scope();
 IF c IS NULL OR p_data->>'request_id' IS DISTINCT FROM c->>'request_id' OR p_data->>'session_id' IS DISTINCT FROM c->>'session_id'
 OR lower(trim(p_data->>'email')) IS DISTINCT FROM c->>'email' OR p_data->'marketing_requested' IS DISTINCT FROM 'false'::jsonb
 OR NOT EXISTS(SELECT 1 FROM private.hhl_sessions WHERE id=(c->>'session_id')::uuid AND revision=(c->>'revision')::int) THEN RAISE EXCEPTION 'acceptance_scope_mismatch' USING ERRCODE='42501';END IF;
 result:=private.hhl_service('register',p_data);
 SELECT registration_id INTO rid FROM private.hhl_requests WHERE request_id=(c->>'request_id')::uuid;
 INSERT INTO private.hhl_audit(actor_id,action,subject_id,provider_event_key) VALUES(auth.uid(),'acceptance_registration',rid,encode(extensions.digest('hhl-acceptance:'||(c->>'request_id'),'sha256'),'hex')) ON CONFLICT(provider_event_key) DO NOTHING;
 RETURN result;
END $$;

CREATE FUNCTION private.hhl_acceptance_claim(p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j private.hhl_jobs%rowtype;begins timestamptz;ends timestamptz;
BEGIN
 -- Called only by the existing service-role command wrapper; scope is pinned
 -- independently in server configuration. Never claim reminders/other guests.
 begins:=(p_data->>'starts_at')::timestamptz;ends:=(p_data->>'expires_at')::timestamptz;
 IF begins IS NULL OR ends IS NULL OR ends<=begins OR ends-begins>interval '30 minutes' OR now()<begins OR now()>=ends
  OR p_data->'allow_notifications' IS DISTINCT FROM 'true'::jsonb THEN RETURN 'null'::jsonb;END IF;
 IF NOT EXISTS(SELECT 1 FROM private.hhl_settings WHERE registration_enabled AND notifications_enabled AND acceptance_case IS NOT NULL AND p_data @> acceptance_case) THEN RETURN 'null'::jsonb;END IF;
 IF NOT EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=(p_data->>'operator_id')::uuid AND role IN ('owner','admin') AND status='active' AND onboarding_status IN ('complete','waived') AND contact_scope='all')
 OR NOT private.staff_has_permission((p_data->>'operator_id')::uuid,'crm.manage') THEN RETURN 'null'::jsonb;END IF;
 SELECT q.* INTO j FROM private.hhl_jobs q JOIN private.hhl_deliverable_registrations r ON r.id=q.registration_id
 JOIN private.hhl_sessions s ON s.id=r.session_id JOIN private.hhl_requests x ON x.registration_id=r.id
 WHERE x.request_id=(p_data->>'request_id')::uuid AND r.email=lower(trim(p_data->>'email')) AND r.session_id=(p_data->>'session_id')::uuid
 AND r.state='confirmed' AND r.event_notifications AND s.join_mode='manual' AND s.status='published' AND s.starts_at>now()
 AND q.kind='confirmation' AND q.revision=s.revision AND q.revision=(p_data->>'revision')::int AND q.run_after<=now() AND q.attempts<5
 AND (q.state='pending' OR q.state='leased' AND q.leased_at<now()-interval '3 minutes')
 AND (q.first_attempt_at IS NULL OR q.first_attempt_at>now()-interval '23 hours')
 ORDER BY q.run_after LIMIT 1 FOR UPDATE OF q SKIP LOCKED;
 IF j.id IS NULL THEN RETURN 'null'::jsonb;END IF;
 UPDATE private.hhl_jobs SET state='leased',lease=gen_random_uuid(),leased_at=now(),first_attempt_at=coalesce(first_attempt_at,now()),attempts=attempts+1 WHERE id=j.id RETURNING * INTO j;
 RETURN jsonb_build_object('id',j.id,'lease',j.lease);
END $$;

CREATE OR REPLACE FUNCTION private.hhl_service(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cfg private.hhl_settings%rowtype; j private.hhl_jobs%rowtype; result jsonb; expiry timestamptz; mail_state text;
BEGIN
 IF p_action='privacy-maintain' THEN
  IF p_data->>'allow_retention' IS DISTINCT FROM 'true' THEN RETURN '{"held":true}'::jsonb;END IF;
  RETURN private.hhl_maintain();
 END IF;
 IF p_action IN ('sessions','zoom-sessions','job') THEN
  PERFORM pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('hhl-privacy',0));
 ELSE PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));END IF;
 SELECT * INTO STRICT cfg FROM private.hhl_settings WHERE singleton;
 IF p_action IN ('register','sessions','claim','acceptance-claim') AND (NOT cfg.retention_enabled OR NOT cfg.provider_retention_ready OR cfg.retention_healthy_at IS NULL OR cfg.retention_healthy_at<now()-interval '5 minutes') THEN
  IF p_action='sessions' THEN RETURN '{"sessions":[],"timezone":"America/New_York"}'::jsonb; END IF;
  IF p_action IN ('claim','acceptance-claim') THEN RETURN 'null'::jsonb;END IF;
  RAISE EXCEPTION 'privacy_readiness_required' USING ERRCODE='55000';
 END IF;
 IF p_action='acceptance-claim' THEN RETURN private.hhl_acceptance_claim(p_data);END IF;
 IF p_action='register' THEN
  IF p_data->>'privacy_model_version' IS DISTINCT FROM 'hhl-privacy-v1' THEN RAISE EXCEPTION 'privacy_model_required' USING ERRCODE='55000';END IF;
  IF EXISTS(SELECT 1 FROM private.hhl_registrations WHERE email=lower(trim(p_data->>'email')) AND privacy_hold) THEN RAISE EXCEPTION 'privacy_request_pending' USING ERRCODE='55000';END IF;
  result:=private.hhl_service_guest_core(p_action,p_data-'privacy_model_version');
  UPDATE private.hhl_registrations r SET delivery_blocked=true WHERE r.email=lower(trim(p_data->>'email')) AND NOT r.delivery_blocked AND EXISTS(SELECT 1 FROM private.hhl_registrations blocked WHERE blocked.email=r.email AND blocked.delivery_blocked);
  RETURN result;
 ELSIF p_action='attendance' THEN
  IF private.hhl_expires_at((p_data->>'observed_at')::timestamptz)<=now() THEN RETURN '{"received":true}'::jsonb;END IF;
 ELSIF p_action='job' THEN
  SELECT s.starts_at INTO expiry FROM private.hhl_jobs q JOIN private.hhl_deliverable_registrations r ON r.id=q.registration_id JOIN private.hhl_sessions s ON s.id=r.session_id WHERE q.id=(p_data->>'id')::uuid;
  IF expiry IS NULL THEN RAISE EXCEPTION 'job_unavailable';END IF;
  result:=private.hhl_service_guest_core(p_action,p_data);RETURN result||jsonb_build_object('expires_at',private.hhl_expires_at(expiry));
 ELSIF p_action='mail-status' THEN
  IF NOT cfg.notifications_enabled THEN RAISE EXCEPTION 'notifications_held';END IF;
  mail_state:=p_data->>'status';
  IF mail_state IS NULL OR mail_state NOT IN ('delivered','bounced','complained','failed','suppressed') OR coalesce(p_data->>'event_key','')!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid_mail_event';END IF;
  SELECT q.* INTO j FROM private.hhl_jobs q JOIN private.hhl_live_registrations r ON r.id=q.registration_id WHERE q.id=(p_data->>'job_id')::uuid AND (q.provider_id IS NULL OR q.provider_id=p_data->>'provider_id') AND q.kind<>'zoom';
  IF j.id IS NULL THEN RETURN '{"received":true}'::jsonb;END IF;
  INSERT INTO private.hhl_audit(action,subject_id,provider_event_key) VALUES('email_'||mail_state,j.id,p_data->>'event_key') ON CONFLICT(provider_event_key) DO NOTHING;
  IF FOUND THEN
   UPDATE private.hhl_jobs SET provider_id=coalesce(provider_id,p_data->>'provider_id'),delivery_status=mail_state WHERE id=j.id AND (delivery_status IS NULL OR delivery_status='delivered');
   IF mail_state IN ('bounced','complained','suppressed') THEN
    UPDATE private.hhl_registrations SET delivery_blocked=true WHERE email=(SELECT email FROM private.hhl_registrations WHERE id=j.registration_id);
    UPDATE private.hhl_jobs SET state='cancelled',lease=NULL WHERE kind<>'zoom' AND state IN ('pending','leased') AND registration_id IN(SELECT id FROM private.hhl_registrations WHERE delivery_blocked);
   END IF;
  END IF;
  RETURN '{"received":true}'::jsonb;
 END IF;
 RETURN private.hhl_service_guest_core(p_action,p_data);
END $$;

CREATE OR REPLACE FUNCTION private.hhl_staff(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 -- Exclusive privacy operations serialize with normal event writes and delivery
 -- claims; external sends already in flight drain before a deletion completes.
 IF p_action LIKE 'privacy-%' THEN
  IF NOT private.hhl_staff_allowed(true) THEN RAISE EXCEPTION 'event_management_denied' USING ERRCODE='42501';END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));
  RETURN private.hhl_privacy_staff(p_action,p_data);
 END IF;
 IF p_action='acceptance-info' THEN RETURN private.hhl_acceptance_scope();END IF;
 IF p_action='acceptance-register' THEN RETURN private.hhl_acceptance_register(p_data);END IF;
 IF p_action='manual-attendance' THEN RETURN private.hhl_manual_attendance(p_data);END IF;
 IF p_action IN ('overview','history','review-list') THEN
  PERFORM pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('hhl-privacy',0));
 ELSE PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));END IF;
 IF p_action='overview' THEN RETURN private.hhl_staff_guest_core(p_action,p_data)#-'{settings,acceptance_case}';END IF;
 IF p_action='history' THEN
  -- Authorize contact scope through the existing core before annotating results.
  result:=private.hhl_staff_guest_core(p_action,p_data);
  SELECT COALESCE(jsonb_agg(item || jsonb_build_object('attendance_method',CASE
   WHEN item->>'attended_at' IS NULL THEN 'unreviewed'
   WHEN EXISTS(SELECT 1 FROM private.hhl_audit a WHERE a.subject_id=(item->>'registration_id')::uuid AND a.action LIKE 'manual-attendance:%') THEN 'manual'
   ELSE 'verified' END) ORDER BY ordinal),'[]'::jsonb) INTO result
  FROM jsonb_array_elements(result) WITH ORDINALITY AS h(item,ordinal);
  RETURN result;
 END IF;
 IF p_action='identity-resolve' AND EXISTS(SELECT 1 FROM private.hhl_registrations WHERE contact_id=(p_data->>'contact_id')::uuid AND privacy_hold) THEN RAISE EXCEPTION 'privacy_request_pending' USING ERRCODE='55000';END IF;
 IF p_action='join-info' AND EXISTS(SELECT 1 FROM private.hhl_registrations WHERE id=(p_data->>'registration_id')::uuid AND privacy_hold) THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501';END IF;
 RETURN private.hhl_staff_guest_core(p_action,p_data);
END $$;

CREATE OR REPLACE FUNCTION private.hhl_maintain() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s private.hhl_sessions%rowtype; ids uuid[]; n int:=0; overdue int:=0; requires_cleanup boolean;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));
 UPDATE private.hhl_settings SET acceptance_case=NULL WHERE acceptance_case IS NOT NULL AND (acceptance_case->>'expires_at')::timestamptz<=now();
 IF NOT EXISTS(SELECT 1 FROM private.hhl_settings WHERE retention_enabled) THEN RETURN '{"held":true}'::jsonb; END IF;
 FOR s IN SELECT * FROM private.hhl_sessions WHERE expired_at IS NULL AND private.hhl_expires_at(starts_at)<=now() ORDER BY starts_at LIMIT 4 FOR UPDATE LOOP
  requires_cleanup:=EXISTS(SELECT 1 FROM private.hhl_registrations WHERE session_id=s.id AND zoom_registrant_id IS NOT NULL)
   OR EXISTS(SELECT 1 FROM private.hhl_attendance WHERE session_id=s.id)
   OR EXISTS(SELECT 1 FROM private.hhl_jobs j JOIN private.hhl_registrations r ON r.id=j.registration_id WHERE r.session_id=s.id AND (j.provider_id IS NOT NULL OR j.attempts>0));
  IF requires_cleanup AND NOT s.provider_cleanup_ready THEN overdue:=overdue+1;END IF;
  SELECT array_agg(id) INTO ids FROM private.hhl_registrations WHERE session_id=s.id;n:=n+private.hhl_forget(ids);
  DELETE FROM private.hhl_attendance WHERE session_id=s.id;
  DELETE FROM private.hhl_audit WHERE event_session_id=s.id;
  UPDATE private.hhl_sessions SET expired_at=now(),manual_join_url=NULL,zoom_meeting_id=NULL,zoom_occurrence_id=NULL,zoom_instance_uuid=NULL,zoom_validated_at=NULL,public_note='' WHERE id=s.id;
 END LOOP;
 DELETE FROM private.hhl_attendance WHERE private.hhl_expires_at(observed_at)<=now();
 DELETE FROM private.hhl_audit WHERE expires_at<=now();
 -- Event-derived progression notes expire independently even for a returning guest.
 DELETE FROM public.contact_activity WHERE activity_type='hhl_guest_progression' AND metadata->>'source'='health_hope_live' AND created_at<=now()-interval '12 months';
 DELETE FROM private.hhl_limits WHERE window_at<now()-interval '1 day';
 UPDATE private.hhl_privacy_cases SET state='expired',contact_id=NULL WHERE state='open' AND expires_at<=now();
 DELETE FROM private.hhl_privacy_cases WHERE state<>'open' AND created_at<now()-interval '1 day';
 DELETE FROM private.hhl_privacy_log WHERE created_at<now()-interval '12 months';
 IF overdue>0 THEN
  UPDATE private.hhl_settings SET registration_enabled=false,zoom_enabled=false,notifications_enabled=false,provider_retention_ready=false;
  INSERT INTO private.hhl_privacy_log(action,records_count) VALUES('provider_cleanup_overdue',overdue);
 END IF;
 UPDATE private.hhl_settings SET retention_healthy_at=CASE WHEN EXISTS(SELECT 1 FROM private.hhl_sessions WHERE expired_at IS NULL AND private.hhl_expires_at(starts_at)<=now()) THEN NULL ELSE now() END;
 IF n>0 THEN INSERT INTO private.hhl_privacy_log(action,records_count) VALUES('expired',n);END IF;
 RETURN jsonb_build_object('erased',n,'provider_cleanup_overdue',overdue);
END $$;

REVOKE ALL ON FUNCTION private.hhl_manual_attendance(jsonb),private.hhl_acceptance_claim(jsonb),private.hhl_acceptance_scope(),private.hhl_acceptance_register(jsonb) FROM PUBLIC,anon,authenticated,service_role;
-- CREATE OR REPLACE retains existing wrapper ACLs and owners; no new grant.
COMMIT;
