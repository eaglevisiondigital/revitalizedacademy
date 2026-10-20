-- Approved twelve-month event retention. Local forward candidate; activation held.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
CREATE FUNCTION private.hhl_expires_at(p_start timestamptz) RETURNS timestamptz
LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT (((p_start+interval '30 minutes') AT TIME ZONE 'America/New_York')+interval '12 months') AT TIME ZONE 'America/New_York';
$$;
ALTER TABLE private.hhl_settings ADD COLUMN retention_enabled boolean NOT NULL DEFAULT false,
 ADD COLUMN retention_healthy_at timestamptz, ADD COLUMN provider_retention_ready boolean NOT NULL DEFAULT false;
ALTER TABLE private.hhl_sessions ADD COLUMN expired_at timestamptz,
 ADD COLUMN provider_cleanup_ready boolean NOT NULL DEFAULT false;
ALTER TABLE private.hhl_registrations ADD COLUMN privacy_hold boolean NOT NULL DEFAULT false,
 ADD COLUMN delivery_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE private.hhl_jobs ADD COLUMN delivery_status text
 CHECK(delivery_status IN ('delivered','bounced','complained','failed','suppressed'));
ALTER TABLE private.hhl_audit ADD COLUMN event_session_id uuid REFERENCES private.hhl_sessions(id),
 ADD COLUMN expires_at timestamptz NOT NULL DEFAULT now()+interval '12 months';
CREATE INDEX hhl_audit_expiry ON private.hhl_audit(expires_at);
CREATE TABLE private.hhl_session_totals(
 session_id uuid PRIMARY KEY REFERENCES private.hhl_sessions(id),
 registered bigint NOT NULL DEFAULT 0, attended bigint NOT NULL DEFAULT 0,
 cancelled bigint NOT NULL DEFAULT 0,no_show bigint NOT NULL DEFAULT 0,erased bigint NOT NULL DEFAULT 0
);
-- Short-lived verified request authority; export contents are never persisted.
CREATE TABLE private.hhl_privacy_cases(
 id uuid PRIMARY KEY,actor_id uuid NOT NULL REFERENCES auth.users(id),contact_id uuid REFERENCES public.contacts(id),
 kind text NOT NULL CHECK(kind IN ('export','delete')),
 state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','complete','expired')),
 verification text NOT NULL CHECK(verification IN ('verified_contact_request','verified_member_request')),
 created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
 safe_after timestamptz NOT NULL DEFAULT now(),completed_at timestamptz, records_count int NOT NULL DEFAULT 0,
 CHECK(state='open' OR contact_id IS NULL)
);
CREATE INDEX hhl_privacy_cases_contact ON private.hhl_privacy_cases(contact_id) WHERE state='open';
-- Operator audit only: deliberately no participant/contact/case/provider IDs or free text.
CREATE TABLE private.hhl_privacy_log(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid REFERENCES auth.users(id),
 action text NOT NULL CHECK(action IN ('request_opened','exported','deleted','expired','provider_manifest','provider_attested','maintenance','provider_cleanup_overdue')),
 records_count int NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hhl_privacy_log_expiry ON private.hhl_privacy_log(created_at);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['hhl_session_totals','hhl_privacy_cases','hhl_privacy_log'] LOOP
  EXECUTE format('ALTER TABLE private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON private.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;
CREATE VIEW private.hhl_live_registrations WITH(security_invoker=true) AS
 SELECT r.* FROM private.hhl_registrations r JOIN private.hhl_sessions s ON s.id=r.session_id
 WHERE s.expired_at IS NULL AND private.hhl_expires_at(s.starts_at)>now();
CREATE VIEW private.hhl_deliverable_registrations WITH(security_invoker=true) AS
 SELECT * FROM private.hhl_live_registrations WHERE NOT privacy_hold AND NOT delivery_blocked;
REVOKE ALL ON private.hhl_live_registrations,private.hhl_deliverable_registrations FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.hhl_audit_expiry() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE sid uuid; ts timestamptz;
BEGIN
 SELECT session_id INTO sid FROM private.hhl_registrations WHERE id=NEW.subject_id;
 IF sid IS NULL THEN SELECT r.session_id INTO sid FROM private.hhl_jobs j JOIN private.hhl_registrations r ON r.id=j.registration_id WHERE j.id=NEW.subject_id; END IF;
 IF sid IS NULL THEN SELECT id INTO sid FROM private.hhl_sessions WHERE id=NEW.subject_id; END IF;
 IF sid IS NULL AND NEW.action LIKE 'guest-stage:%' THEN
  SELECT session_id INTO sid FROM private.hhl_registrations WHERE contact_id=NEW.subject_id ORDER BY registered_at DESC LIMIT 1;
 END IF;
 SELECT starts_at INTO ts FROM private.hhl_sessions WHERE id=sid;
 NEW.event_session_id:=sid;NEW.expires_at:=coalesce(private.hhl_expires_at(ts),now()+interval '12 months');RETURN NEW;
END $$;
CREATE TRIGGER hhl_audit_expiry BEFORE INSERT ON private.hhl_audit FOR EACH ROW EXECUTE FUNCTION private.hhl_audit_expiry();
UPDATE private.hhl_audit SET expires_at=created_at+interval '12 months';
-- Historical candidate audits are bounded too; never alter unrelated CRM audit.
UPDATE private.hhl_audit a SET event_session_id=r.session_id,expires_at=private.hhl_expires_at(s.starts_at)
 FROM private.hhl_registrations r JOIN private.hhl_sessions s ON s.id=r.session_id WHERE a.subject_id=r.id;
UPDATE private.hhl_audit a SET event_session_id=s.id,expires_at=private.hhl_expires_at(s.starts_at)
 FROM private.hhl_sessions s WHERE a.subject_id=s.id;

CREATE FUNCTION private.hhl_cleanup_invalidated() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE private.hhl_sessions SET provider_cleanup_ready=false WHERE id=NEW.session_id;
 RETURN NEW;
END $$;
CREATE TRIGGER hhl_registration_cleanup_invalidated AFTER INSERT OR UPDATE OF zoom_registrant_id ON private.hhl_registrations FOR EACH ROW EXECUTE FUNCTION private.hhl_cleanup_invalidated();
CREATE TRIGGER hhl_attendance_cleanup_invalidated AFTER INSERT ON private.hhl_attendance FOR EACH ROW EXECUTE FUNCTION private.hhl_cleanup_invalidated();
CREATE FUNCTION private.hhl_mail_cleanup_invalidated() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.provider_id IS NOT NULL THEN
  UPDATE private.hhl_sessions SET provider_cleanup_ready=false WHERE id=(SELECT session_id FROM private.hhl_registrations WHERE id=NEW.registration_id);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER hhl_mail_cleanup_invalidated AFTER INSERT OR UPDATE OF provider_id ON private.hhl_jobs FOR EACH ROW EXECUTE FUNCTION private.hhl_mail_cleanup_invalidated();

CREATE FUNCTION private.hhl_forget(p_ids uuid[]) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ids uuid[]; contacts uuid[]; emails text[]; n int;
BEGIN
 SELECT array_agg(id),array_agg(DISTINCT contact_id),array_agg(DISTINCT email) INTO ids,contacts,emails FROM private.hhl_registrations WHERE id=ANY(p_ids);
 IF ids IS NULL THEN RETURN 0; END IF;
 -- Anonymous counters are updated only for rows actually removed, in this transaction.
 INSERT INTO private.hhl_session_totals(session_id,registered,attended,cancelled,no_show,erased)
 SELECT r.session_id,count(*),count(r.attended_at),count(*) FILTER(WHERE r.state='cancelled' OR s.status='cancelled'),
 count(*) FILTER(WHERE r.attendance_status='no_show' AND r.attended_at IS NULL AND r.state<>'cancelled' AND s.status<>'cancelled'),count(*)
 FROM private.hhl_registrations r JOIN private.hhl_sessions s ON s.id=r.session_id WHERE r.id=ANY(ids) GROUP BY r.session_id
 ON CONFLICT(session_id) DO UPDATE SET registered=hhl_session_totals.registered+excluded.registered,attended=hhl_session_totals.attended+excluded.attended,
 cancelled=hhl_session_totals.cancelled+excluded.cancelled,no_show=hhl_session_totals.no_show+excluded.no_show,erased=hhl_session_totals.erased+excluded.erased;
 DELETE FROM private.hhl_audit WHERE subject_id=ANY(ids) OR subject_id IN(SELECT id FROM private.hhl_jobs WHERE registration_id=ANY(ids));
 DELETE FROM private.hhl_requests WHERE registration_id=ANY(ids);
 DELETE FROM private.hhl_attendance a WHERE a.registration_id=ANY(ids)
 OR EXISTS(SELECT 1 FROM private.hhl_registrations r WHERE r.id=ANY(ids) AND r.session_id=a.session_id AND r.zoom_registrant_id=a.registrant_id AND r.zoom_registrant_id IS NOT NULL);
 DELETE FROM private.hhl_jobs WHERE registration_id=ANY(ids);
 DELETE FROM private.hhl_registrations WHERE id=ANY(ids);GET DIAGNOSTICS n=ROW_COUNT;
 DELETE FROM private.hhl_limits WHERE key_hash IN(SELECT encode(extensions.digest('hhl-email:'||e,'sha256'),'hex') FROM unnest(emails) e);
 -- Remove only event-owned derivatives. Shared contact lifecycle/source and all
 -- independently governed health, client, finance and consent records survive.
 DELETE FROM public.contact_tags t WHERE t.contact_id=ANY(contacts) AND t.tag='health_hope_live_guest' AND t.source='system' AND t.rule_key='health_hope_live'
 AND NOT EXISTS(SELECT 1 FROM private.hhl_registrations r WHERE r.contact_id=t.contact_id);
 DELETE FROM public.contact_activity a WHERE a.contact_id=ANY(contacts) AND a.activity_type='hhl_guest_progression' AND a.metadata->>'source'='health_hope_live'
 AND NOT EXISTS(SELECT 1 FROM private.hhl_registrations r WHERE r.contact_id=a.contact_id);
 DELETE FROM private.hhl_audit a WHERE a.subject_id=ANY(contacts) AND a.action LIKE 'guest-stage:%'
 AND NOT EXISTS(SELECT 1 FROM private.hhl_registrations r WHERE r.contact_id=a.subject_id);
 UPDATE private.hhl_privacy_cases c SET state='complete',contact_id=NULL,completed_at=now()
 WHERE c.contact_id=ANY(contacts) AND NOT EXISTS(SELECT 1 FROM private.hhl_registrations r WHERE r.contact_id=c.contact_id);
 RETURN n;
END $$;

CREATE FUNCTION private.hhl_maintain() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s private.hhl_sessions%rowtype; ids uuid[]; n int:=0; overdue int:=0; requires_cleanup boolean;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));
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

CREATE FUNCTION private.hhl_privacy_staff(p_action text,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c private.hhl_privacy_cases%rowtype; cid uuid; sid uuid; ids uuid[]; n int; result jsonb; all_people boolean; needed boolean; safe timestamptz;
BEGIN
 IF NOT private.hhl_staff_allowed(true) THEN RAISE EXCEPTION 'event_management_denied' USING ERRCODE='42501';END IF;
 all_people:=EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=auth.uid() AND contact_scope='all');
 IF p_action='privacy-overview' THEN
  RETURN jsonb_build_object('can_manage_all',all_people,'retention',(SELECT jsonb_build_object('enabled',retention_enabled,'healthy_at',retention_healthy_at,'provider_ready',provider_retention_ready) FROM private.hhl_settings),
   'sessions',CASE WHEN all_people THEN(SELECT coalesce(jsonb_agg(jsonb_build_object('session_id',id,'starts_at',starts_at,'expires_at',private.hhl_expires_at(starts_at),'provider_cleanup_ready',provider_cleanup_ready) ORDER BY starts_at),'[]') FROM private.hhl_sessions WHERE expired_at IS NULL AND private.hhl_expires_at(starts_at)<now()+interval '30 days') ELSE '[]'::jsonb END,
   'totals',CASE WHEN all_people THEN(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]') FROM private.hhl_session_totals t) ELSE '[]'::jsonb END);
 ELSIF p_action IN ('privacy-provider-manifest','privacy-provider-attest') THEN
  IF NOT all_people THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501';END IF;
  sid:=(p_data->>'session_id')::uuid;
  IF NOT EXISTS(SELECT 1 FROM private.hhl_sessions WHERE id=sid AND expired_at IS NULL AND private.hhl_expires_at(starts_at)>now()) THEN RAISE EXCEPTION 'privacy_session_unavailable';END IF;
  IF p_action='privacy-provider-manifest' THEN
   SELECT jsonb_build_object('session',jsonb_build_object('id',s.id,'starts_at',s.starts_at,'meeting_id',s.zoom_meeting_id,'occurrence_id',s.zoom_occurrence_id,'instance_uuid',s.zoom_instance_uuid),
    'registrants',(SELECT coalesce(jsonb_agg(jsonb_build_object('registrant_id',zoom_registrant_id,'email',email)),'[]') FROM private.hhl_registrations WHERE session_id=s.id),
    'mail_ids',(SELECT coalesce(jsonb_agg(j.provider_id),'[]') FROM private.hhl_jobs j JOIN private.hhl_registrations r ON r.id=j.registration_id WHERE r.session_id=s.id AND j.provider_id IS NOT NULL)) INTO result FROM private.hhl_sessions s WHERE s.id=sid;
   INSERT INTO private.hhl_privacy_log(actor_id,action) VALUES(auth.uid(),'provider_manifest');RETURN result;
  END IF;
  IF p_data->'provider_cleanup_confirmed' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'provider_cleanup_required';END IF;
  UPDATE private.hhl_sessions SET provider_cleanup_ready=true WHERE id=sid;
  INSERT INTO private.hhl_privacy_log(actor_id,action) VALUES(auth.uid(),'provider_attested');RETURN '{"saved":true}'::jsonb;
 ELSIF p_action='privacy-open' THEN
  cid:=(p_data->>'contact_id')::uuid;
  IF cid IS NULL OR NOT private.hhl_staff_allowed(true,cid) OR p_data->'identity_verified' IS DISTINCT FROM 'true'::jsonb
   OR coalesce(p_data->>'kind','') NOT IN ('export','delete') OR coalesce(p_data->>'verification','') NOT IN ('verified_contact_request','verified_member_request')
   OR NOT EXISTS(SELECT 1 FROM private.hhl_live_registrations WHERE contact_id=cid) THEN RAISE EXCEPTION 'privacy_request_denied' USING ERRCODE='42501';END IF;
  SELECT * INTO c FROM private.hhl_privacy_cases WHERE id=(p_data->>'request_id')::uuid;
  IF c.id IS NOT NULL THEN
   IF c.actor_id<>auth.uid() OR c.kind<>p_data->>'kind' OR c.contact_id IS NOT NULL AND c.contact_id<>cid THEN RAISE EXCEPTION 'privacy_request_conflict';END IF;
   RETURN jsonb_build_object('case_id',c.id,'state',c.state,'safe_after',c.safe_after);
  END IF;
  safe:=now();
  IF p_data->>'kind'='delete' THEN
   SELECT greatest(now(),coalesce(max(j.leased_at)+interval '3 minutes',now())) INTO safe FROM private.hhl_jobs j JOIN private.hhl_registrations r ON r.id=j.registration_id WHERE r.contact_id=cid;
   UPDATE private.hhl_registrations SET privacy_hold=true WHERE contact_id=cid;
   UPDATE private.hhl_jobs SET state='cancelled',lease=NULL WHERE registration_id IN(SELECT id FROM private.hhl_registrations WHERE contact_id=cid) AND state IN ('pending','leased');
  END IF;
  INSERT INTO private.hhl_privacy_cases(id,actor_id,contact_id,kind,verification,safe_after) VALUES((p_data->>'request_id')::uuid,auth.uid(),cid,p_data->>'kind',p_data->>'verification',safe) RETURNING * INTO c;
  INSERT INTO private.hhl_privacy_log(actor_id,action) VALUES(auth.uid(),'request_opened');
  RETURN jsonb_build_object('case_id',c.id,'state',c.state,'safe_after',c.safe_after,'expires_at',c.expires_at);
 ELSIF p_action IN ('privacy-export','privacy-delete') THEN
  SELECT * INTO c FROM private.hhl_privacy_cases WHERE id=(p_data->>'case_id')::uuid FOR UPDATE;
  IF c.id IS NULL OR c.actor_id<>auth.uid() THEN RAISE EXCEPTION 'privacy_request_denied' USING ERRCODE='42501';END IF;
  IF c.state='complete' THEN RETURN jsonb_build_object('saved',true,'state','complete','records_count',c.records_count);END IF;
  IF c.state<>'open' OR c.expires_at<=now() OR c.contact_id IS NULL OR NOT private.hhl_staff_allowed(true,c.contact_id)
   OR c.kind<>(CASE WHEN p_action='privacy-export' THEN 'export' ELSE 'delete' END) THEN RAISE EXCEPTION 'privacy_request_denied' USING ERRCODE='42501';END IF;
  IF p_action='privacy-export' THEN
   SELECT jsonb_build_object('scope','health_hope_live_only','registrations',coalesce(jsonb_agg(jsonb_build_object('registration_id',r.id,'session_id',r.session_id,'contact_id',r.contact_id,'first_name',r.first_name,'last_name',r.last_name,'email',r.email,'status',r.state,'source',r.source,'registered_at',r.registered_at,'attended_at',r.attended_at,'attendance_status',r.attendance_status,'event_notifications',r.event_notifications,'event_notices_withdrawn_at',r.event_notices_withdrawn_at,'marketing_requested',r.marketing_requested,'marketing_withdrawn_at',r.marketing_withdrawn_at,'consent_version',r.consent_version,'consent_at',r.consent_at,'zoom_registrant_id',r.zoom_registrant_id,'delivery_blocked',r.delivery_blocked)||jsonb_build_object('starts_at',s.starts_at,'session_status',s.status,'expires_at',private.hhl_expires_at(s.starts_at))),'[]')) INTO result
   FROM private.hhl_live_registrations r JOIN private.hhl_sessions s ON s.id=r.session_id WHERE r.contact_id=c.contact_id;
   UPDATE private.hhl_privacy_cases SET state='complete',contact_id=NULL,completed_at=now() WHERE id=c.id;
   INSERT INTO private.hhl_privacy_log(actor_id,action,records_count) VALUES(auth.uid(),'exported',jsonb_array_length(result->'registrations'));RETURN result;
  END IF;
  IF c.safe_after>now() THEN RAISE EXCEPTION 'privacy_delivery_drain_required' USING ERRCODE='55000';END IF;
  SELECT EXISTS(SELECT 1 FROM private.hhl_jobs j JOIN private.hhl_registrations r ON r.id=j.registration_id WHERE r.contact_id=c.contact_id AND (j.provider_id IS NOT NULL OR j.attempts>0))
   OR EXISTS(SELECT 1 FROM private.hhl_registrations WHERE contact_id=c.contact_id AND zoom_registrant_id IS NOT NULL) INTO needed;
  IF needed AND p_data->'provider_cleanup_confirmed' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'provider_cleanup_required';END IF;
  SELECT array_agg(id) INTO ids FROM private.hhl_registrations WHERE contact_id=c.contact_id;
  n:=private.hhl_forget(ids);
  UPDATE private.hhl_privacy_cases SET state='complete',contact_id=NULL,completed_at=now(),records_count=n WHERE id=c.id;
  INSERT INTO private.hhl_privacy_log(actor_id,action,records_count) VALUES(auth.uid(),'deleted',n);
  RETURN jsonb_build_object('saved',true,'state','complete','records_count',n);
 END IF;
 RAISE EXCEPTION 'invalid_privacy_action';
END $$;

ALTER FUNCTION private.hhl_service(text,jsonb) RENAME TO hhl_service_guest_core;
ALTER FUNCTION private.hhl_staff(text,jsonb) RENAME TO hhl_staff_guest_core;
CREATE OR REPLACE FUNCTION private.hhl_service_guest_core(p_action text,p_data jsonb DEFAULT '{}')
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
  SELECT * INTO r FROM private.hhl_live_registrations WHERE session_id=s.id AND email=e;
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
  SELECT q.* INTO j FROM private.hhl_jobs q JOIN private.hhl_deliverable_registrations reg ON reg.id=q.registration_id JOIN private.hhl_sessions ses ON ses.id=reg.session_id
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
  SELECT * INTO r FROM private.hhl_live_registrations WHERE id=j.registration_id;
  SELECT * INTO s FROM private.hhl_sessions WHERE id=r.session_id;
  IF j.id IS NULL OR j.revision<>s.revision OR (j.kind='zoom' AND NOT cfg.zoom_enabled) OR (j.kind<>'zoom' AND NOT cfg.notifications_enabled) OR (s.status<>'published' AND j.kind<>'cancellation') OR (j.kind<>'cancellation' AND r.state NOT IN ('pending','confirmed')) THEN RAISE EXCEPTION 'job_unavailable'; END IF;
  RETURN jsonb_build_object('id',j.id,'lease',j.lease,'kind',j.kind,'revision',j.revision,'first_attempt_at',j.first_attempt_at,'attempts',j.attempts,'registration_id',r.id,'first_name',r.first_name,'last_name',r.last_name,'email',r.email,'starts_at',s.starts_at,'session_id',s.id,'join_mode',s.join_mode,'meeting_id',s.zoom_meeting_id,'occurrence_id',s.zoom_occurrence_id,'join_url',CASE WHEN s.join_mode='zoom' THEN r.zoom_join_url ELSE s.manual_join_url END);
 ELSIF p_action='finish' THEN
  SELECT q.* INTO j FROM private.hhl_jobs q WHERE id=(p_data->>'id')::uuid AND lease=(p_data->>'lease')::uuid AND state='leased' FOR UPDATE;
  SELECT * INTO r FROM private.hhl_live_registrations WHERE id=j.registration_id FOR UPDATE;
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
   SELECT id INTO rid FROM private.hhl_live_registrations WHERE session_id=s.id AND state='confirmed' AND zoom_registrant_id=p_data->>'registrant_id';
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
   UPDATE private.hhl_jobs SET state='cancelled',lease=NULL WHERE registration_id IN (SELECT id FROM private.hhl_live_registrations WHERE session_id=s.id) AND state IN ('pending','leased');
   IF p_data->>'kind'='updated' AND s.join_mode='zoom' THEN UPDATE private.hhl_registrations SET state='pending',zoom_join_url=NULL WHERE session_id=s.id AND state='confirmed'; END IF;
   IF p_data->>'kind'='deleted' THEN
    INSERT INTO private.hhl_jobs(registration_id,kind,revision) SELECT id,'cancellation',s.revision FROM private.hhl_live_registrations WHERE session_id=s.id AND state IN ('pending','confirmed') ON CONFLICT DO NOTHING;
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
CREATE OR REPLACE FUNCTION private.hhl_staff_guest_core(p_action text,p_data jsonb DEFAULT '{}')
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
   'registered',(SELECT count(*) FROM private.hhl_live_registrations r WHERE r.session_id=s.id AND r.contact_id IS NOT NULL AND private.hhl_staff_allowed(false,r.contact_id)),
   'attended',(SELECT count(*) FROM private.hhl_live_registrations r WHERE r.session_id=s.id AND r.attended_at IS NOT NULL AND private.hhl_staff_allowed(false,r.contact_id))) x FROM private.hhl_sessions s ORDER BY s.starts_at DESC LIMIT 52) q),
   'people',(SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT jsonb_build_object('contact_id',c.id,'name',concat_ws(' ',c.first_name,c.last_name),'email',c.email,'guest_classification','registered_guest','relationship_stage',c.lifecycle_stage,'active_client',EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.contact_id=c.id AND ca.status='active'),'can_progress',manage AND c.lifecycle_stage IN ('registered_guest','engaged_guest'),'registered',count(*),'attended',count(r.attended_at)) x FROM private.hhl_live_registrations r JOIN public.contacts c ON c.id=r.contact_id WHERE private.hhl_staff_allowed(false,c.id) AND (nullif(trim(p_data->>'query'),'') IS NULL OR c.email ILIKE '%'||left(p_data->>'query',160)||'%' OR concat_ws(' ',c.first_name,c.last_name) ILIKE '%'||left(p_data->>'query',160)||'%' OR c.id::text=p_data->>'query') GROUP BY c.id ORDER BY max(r.registered_at) DESC LIMIT 100) q),
   'review_count',CASE WHEN manage AND EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=auth.uid() AND contact_scope='all') THEN (SELECT count(*) FROM private.hhl_live_registrations WHERE state='identity_review')+(SELECT count(*) FROM private.hhl_attendance WHERE state='review')+(SELECT count(*) FROM private.hhl_jobs WHERE state='review' OR state IN ('pending','leased') AND (attempts>=5 OR first_attempt_at<now()-interval '23 hours')) ELSE 0 END);
 ELSIF p_action='history' THEN
  IF NOT private.hhl_staff_allowed(false,(p_data->>'contact_id')::uuid) OR p_data->>'contact_id' IS NULL THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('registration_id',r.id,'session_id',s.id,'starts_at',s.starts_at,'status',r.state,'session_status',s.status,'attendance_status',CASE WHEN r.attended_at IS NOT NULL THEN 'verified_attended' WHEN r.state='cancelled' OR s.status='cancelled' THEN 'cancelled' ELSE r.attendance_status END,'can_review_no_show',manage AND r.state='confirmed' AND s.status='published' AND s.starts_at+interval '30 minutes'<=now() AND r.attended_at IS NULL,'registered_at',r.registered_at,'attended_at',r.attended_at,'source',r.source,'marketing_requested',r.marketing_requested,'event_notifications',r.event_notifications) ORDER BY s.starts_at DESC),'[]') INTO result FROM private.hhl_live_registrations r JOIN private.hhl_sessions s ON s.id=r.session_id WHERE r.contact_id=(p_data->>'contact_id')::uuid;
  RETURN result;
 ELSIF p_action='join-info' THEN
  SELECT * INTO r FROM private.hhl_live_registrations WHERE id=(p_data->>'registration_id')::uuid;
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
   OR NOT EXISTS(SELECT 1 FROM private.hhl_live_registrations WHERE contact_id=c.id)
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
  SELECT * INTO r FROM private.hhl_live_registrations WHERE id=(p_data->>'registration_id')::uuid FOR UPDATE;
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
  UPDATE private.hhl_jobs j SET state='cancelled',lease=NULL WHERE j.registration_id IN (SELECT id FROM private.hhl_live_registrations WHERE session_id=sid) AND j.state IN ('pending','leased') AND j.revision<>s.revision;
  IF session_status='cancelled' THEN
   INSERT INTO private.hhl_jobs(registration_id,kind,revision) SELECT id,'cancellation',s.revision FROM private.hhl_live_registrations WHERE session_id=sid AND state IN ('confirmed','pending') ON CONFLICT DO NOTHING;
   UPDATE private.hhl_registrations SET state='cancelled' WHERE session_id=sid AND state IN ('confirmed','pending');
  ELSIF session_status='published' THEN
   INSERT INTO private.hhl_jobs(registration_id,kind,revision) SELECT id,'zoom',s.revision FROM private.hhl_live_registrations WHERE session_id=sid AND state='pending' ON CONFLICT DO NOTHING;
   INSERT INTO private.hhl_jobs(registration_id,kind,revision) SELECT id,'update',s.revision FROM private.hhl_live_registrations WHERE session_id=sid AND state='confirmed' ON CONFLICT DO NOTHING;
   INSERT INTO private.hhl_jobs(registration_id,kind,revision,run_after) SELECT id,'reminder',s.revision,greatest(now(),s.starts_at-interval '1 hour') FROM private.hhl_live_registrations WHERE session_id=sid AND state IN ('confirmed','pending') ON CONFLICT DO NOTHING;
  END IF;
 ELSIF p_action='review-list' THEN
  IF NOT EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=auth.uid() AND contact_scope='all') THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object('identities',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT id,session_id,first_name,last_name,email FROM private.hhl_live_registrations WHERE state='identity_review' ORDER BY registered_at LIMIT 100) q),
   'attendance',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT event_key,session_id,meeting_id,instance_uuid,registrant_id,observed_at FROM private.hhl_attendance WHERE state='review' ORDER BY created_at LIMIT 100) q),
   'jobs',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT id,registration_id,kind,state,last_error,attempts FROM private.hhl_jobs WHERE state='review' OR state IN ('pending','leased') AND (attempts>=5 OR first_attempt_at<now()-interval '23 hours') ORDER BY run_after LIMIT 100) q));
 ELSIF p_action='withdraw-consent' THEN
  SELECT * INTO r FROM private.hhl_live_registrations WHERE id=(p_data->>'registration_id')::uuid FOR UPDATE;
  IF r.id IS NULL OR r.contact_id IS NULL OR NOT private.hhl_staff_allowed(false,r.contact_id) OR (p_data->>'withdraw_event' IS DISTINCT FROM 'true' AND p_data->>'withdraw_marketing' IS DISTINCT FROM 'true') THEN RAISE EXCEPTION 'invalid_consent_withdrawal'; END IF;
  UPDATE private.hhl_registrations SET event_notifications=CASE WHEN p_data->>'withdraw_event'='true' THEN false ELSE event_notifications END,event_notices_withdrawn_at=CASE WHEN p_data->>'withdraw_event'='true' THEN coalesce(event_notices_withdrawn_at,now()) ELSE event_notices_withdrawn_at END,marketing_requested=CASE WHEN p_data->>'withdraw_marketing'='true' THEN false ELSE marketing_requested END,marketing_withdrawn_at=CASE WHEN p_data->>'withdraw_marketing'='true' THEN coalesce(marketing_withdrawn_at,now()) ELSE marketing_withdrawn_at END WHERE id=r.id;
  IF p_data->>'withdraw_event'='true' THEN UPDATE private.hhl_jobs SET state='cancelled',lease=NULL WHERE registration_id=r.id AND kind<>'zoom' AND state IN ('pending','leased'); END IF;
 ELSIF p_action='identity-resolve' THEN
  SELECT * INTO r FROM private.hhl_live_registrations WHERE id=(p_data->>'registration_id')::uuid FOR UPDATE;
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
  SELECT * INTO r FROM private.hhl_live_registrations WHERE id=(p_data->>'registration_id')::uuid;
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

CREATE FUNCTION private.hhl_service(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
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
 IF p_action IN ('register','sessions','claim') AND (NOT cfg.retention_enabled OR NOT cfg.provider_retention_ready OR cfg.retention_healthy_at IS NULL OR cfg.retention_healthy_at<now()-interval '5 minutes') THEN
  IF p_action='sessions' THEN RETURN '{"sessions":[],"timezone":"America/New_York"}'::jsonb; END IF;
  IF p_action='claim' THEN RETURN 'null'::jsonb;END IF;
  RAISE EXCEPTION 'privacy_readiness_required' USING ERRCODE='55000';
 END IF;
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

CREATE FUNCTION private.hhl_staff(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- Exclusive privacy operations serialize with normal event writes and delivery
 -- claims; external sends already in flight drain before a deletion completes.
 IF p_action LIKE 'privacy-%' THEN
  IF NOT private.hhl_staff_allowed(true) THEN RAISE EXCEPTION 'event_management_denied' USING ERRCODE='42501';END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));
  RETURN private.hhl_privacy_staff(p_action,p_data);
 END IF;
 IF p_action IN ('overview','history','review-list') THEN
  PERFORM pg_catalog.pg_advisory_xact_lock_shared(pg_catalog.hashtextextended('hhl-privacy',0));
 ELSE PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));END IF;
 IF p_action='identity-resolve' AND EXISTS(SELECT 1 FROM private.hhl_registrations WHERE contact_id=(p_data->>'contact_id')::uuid AND privacy_hold) THEN RAISE EXCEPTION 'privacy_request_pending' USING ERRCODE='55000';END IF;
 IF p_action='join-info' AND EXISTS(SELECT 1 FROM private.hhl_registrations WHERE id=(p_data->>'registration_id')::uuid AND privacy_hold) THEN RAISE EXCEPTION 'event_access_denied' USING ERRCODE='42501';END IF;
 RETURN private.hhl_staff_guest_core(p_action,p_data);
END $$;

REVOKE ALL ON FUNCTION private.hhl_expires_at(timestamptz),private.hhl_audit_expiry(),private.hhl_cleanup_invalidated(),private.hhl_mail_cleanup_invalidated(),private.hhl_forget(uuid[]),private.hhl_maintain(),private.hhl_privacy_staff(text,jsonb),private.hhl_service_guest_core(text,jsonb),private.hhl_staff_guest_core(text,jsonb),private.hhl_service(text,jsonb),private.hhl_staff(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.hhl_service(text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION private.hhl_staff(text,jsonb) TO authenticated;
COMMIT;
