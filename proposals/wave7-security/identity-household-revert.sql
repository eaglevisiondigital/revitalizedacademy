-- LOCAL REGRESSION ONLY: restores known exposure; not a recommended production rollback.
BEGIN;
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
LOCK TABLE public.client_access,public.households,public.household_members IN ACCESS EXCLUSIVE MODE;
DO $guard$ BEGIN
 IF (SELECT count(*) FROM pg_policy WHERE polrelid='public.households'::regclass AND polname IN('wave7_households_select','wave7_households_insert','wave7_households_update') AND NOT polpermissive)<>3 THEN RAISE EXCEPTION 'Wave7 revert policy drift'; END IF;
 IF (SELECT prosecdef OR pg_get_userbyid(proowner)<>'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] FROM pg_proc WHERE oid='private.wave7_identity_tuple_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave7 revert function drift'; END IF;
END $guard$;
DROP TRIGGER a_wave7_identity_tuple_before ON public.client_access;
DROP TRIGGER a_wave7_identity_tuple_before ON public.households;
DROP POLICY wave7_households_select ON public.households;
DROP POLICY wave7_households_insert ON public.households;
DROP POLICY wave7_households_update ON public.households;
DROP TRIGGER a0_wave7_identity_tuple_before ON public.household_members;
DROP FUNCTION private.wave7_identity_tuple_before();
GRANT TRUNCATE ON public.households TO authenticated;
COMMIT;
