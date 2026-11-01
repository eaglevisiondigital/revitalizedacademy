-- LOCAL PROPOSAL ONLY. Requires exact Wave7 core predecessor; no production approval.
BEGIN;
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
LOCK TABLE public.client_access,public.households,public.household_members IN ACCESS EXCLUSIVE MODE;
DO $guard$
BEGIN
 IF to_regprocedure('private.wave6_operation_tuple_before()') IS NULL OR NOT EXISTS(SELECT FROM pg_policy WHERE polrelid='public.client_access'::regclass AND polname='wave5_client_access_scope_update' AND NOT polpermissive) THEN RAISE EXCEPTION 'Wave7 predecessor absent'; END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname IN('authenticated','anon') AND(rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Wave7 caller-role drift'; END IF;
 IF EXISTS(SELECT FROM pg_class WHERE oid IN('public.households'::regclass,'public.client_access'::regclass) AND (NOT relrowsecurity OR relforcerowsecurity OR pg_get_userbyid(relowner)<>'postgres')) THEN RAISE EXCEPTION 'Wave7 table security drift'; END IF;
 IF (SELECT proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] OR prosecdef OR pg_get_userbyid(proowner)<>'postgres' FROM pg_proc WHERE oid='private.wave6_operation_tuple_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave7 invoker predecessor drift'; END IF;
 IF (SELECT jsonb_agg(jsonb_build_object('name',polname,'check',pg_get_expr(polwithcheck,polrelid),'roles',ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(polroles) ORDER BY rolname),'using',pg_get_expr(polqual,polrelid),'command',polcmd::text,'permissive',polpermissive) ORDER BY polname) FROM pg_policy WHERE polrelid='public.households'::regclass) IS DISTINCT FROM '[{"name":"households_staff_insert","check":"(EXISTS ( SELECT 1\n   FROM staff_access s\n  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))","roles":["authenticated"],"using":null,"command":"a","permissive":true},{"name":"households_staff_or_member_select","check":null,"roles":["authenticated"],"using":"((EXISTS ( SELECT 1\n   FROM staff_access s\n  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))) OR (id IN ( SELECT ca.household_id\n   FROM client_access ca\n  WHERE (ca.user_id = ( SELECT auth.uid() AS uid)))))","command":"r","permissive":true},{"name":"households_staff_update","check":"(EXISTS ( SELECT 1\n   FROM staff_access s\n  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))","roles":["authenticated"],"using":"(EXISTS ( SELECT 1\n   FROM staff_access s\n  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))","command":"w","permissive":true},{"name":"lifecycle_paid_access","check":"(( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))","roles":["authenticated"],"using":"(( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))","command":"*","permissive":false}]'::jsonb THEN RAISE EXCEPTION 'Wave7 parent policy drift'; END IF;
 IF (SELECT relacl::text IS DISTINCT FROM '{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}' FROM pg_class WHERE oid='public.households'::regclass) OR (SELECT relacl::text IS DISTINCT FROM '{postgres=arwdDxtm/postgres,authenticated=arwdxtm/postgres,service_role=arwdDxtm/postgres}' FROM pg_class WHERE oid='public.client_access'::regclass) THEN RAISE EXCEPTION 'Wave7 exact table ACL drift'; END IF;
 IF (SELECT md5(prosrc) IS DISTINCT FROM '2fa6fbba9ce8c6f6f9cd281236711b27' FROM pg_proc WHERE oid='private.wave6_operation_tuple_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave7 core body drift'; END IF;
 IF to_regprocedure('private.wave7_identity_tuple_before()') IS NOT NULL THEN RAISE EXCEPTION 'Wave7 object collision'; END IF;
END $guard$;
CREATE FUNCTION private.wave7_identity_tuple_before() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $function$
BEGIN
 IF current_user NOT IN('authenticated','anon') THEN RETURN NEW; END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated actor required' USING ERRCODE='42501'; END IF;
 IF TG_TABLE_NAME='client_access' THEN
  IF TG_OP='INSERT' AND (NEW.user_id IS NOT NULL OR NEW.household_id IS NOT NULL) THEN RAISE EXCEPTION 'Account binding requires existing reviewed provisioning workflow' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' AND ROW(NEW.user_id,NEW.contact_id,NEW.household_id) IS DISTINCT FROM ROW(OLD.user_id,OLD.contact_id,OLD.household_id) THEN RAISE EXCEPTION 'Direct account identity transfer is held' USING ERRCODE='42501'; END IF;
 ELSIF TG_TABLE_NAME='household_members' THEN
  IF TG_OP='INSERT' AND NOT EXISTS(SELECT FROM public.households h WHERE h.id=NEW.household_id AND private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'crm.manage',h.primary_contact_id)) THEN RAISE EXCEPTION 'Household scope denied' USING ERRCODE='42501'; END IF;
 ELSIF TG_TABLE_NAME='households' THEN
  IF TG_OP='UPDATE' AND NEW.primary_contact_id IS DISTINCT FROM OLD.primary_contact_id THEN RAISE EXCEPTION 'Direct household primary identity transfer is held' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $function$;
ALTER FUNCTION private.wave7_identity_tuple_before() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.wave7_identity_tuple_before() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER a_wave7_identity_tuple_before BEFORE INSERT OR UPDATE ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.wave7_identity_tuple_before();
CREATE TRIGGER a_wave7_identity_tuple_before BEFORE INSERT OR UPDATE ON public.households FOR EACH ROW EXECUTE FUNCTION private.wave7_identity_tuple_before();
CREATE TRIGGER a0_wave7_identity_tuple_before BEFORE INSERT ON public.household_members FOR EACH ROW EXECUTE FUNCTION private.wave7_identity_tuple_before();
CREATE POLICY wave7_households_select ON public.households AS RESTRICTIVE FOR SELECT TO authenticated USING((private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'crm.view',primary_contact_id)) OR EXISTS(SELECT FROM public.client_access ca WHERE ca.household_id=households.id AND ca.user_id=auth.uid() AND ca.status='active' AND NOT ca.needs_onboarding_claim));
CREATE POLICY wave7_households_insert ON public.households AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'crm.manage',primary_contact_id));
CREATE POLICY wave7_households_update ON public.households AS RESTRICTIVE FOR UPDATE TO authenticated USING(private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'crm.manage',primary_contact_id)) WITH CHECK(private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'crm.manage',primary_contact_id));
REVOKE TRUNCATE ON TABLE public.households FROM authenticated;
COMMIT;
