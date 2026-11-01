-- LOCAL regression proof only: restores known authenticated TRUNCATE exposure.
-- NOT a recommended production rollback or installation authorization.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE public.profiles IN ACCESS EXCLUSIVE MODE;
DO $guard$
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Profiles revert requires the reviewed installer'; END IF;
 IF NOT EXISTS(SELECT FROM pg_class WHERE oid='public.profiles'::regclass AND relkind='r' AND relrowsecurity AND NOT relforcerowsecurity AND pg_get_userbyid(relowner)='postgres') THEN RAISE EXCEPTION 'Profiles revert table security drift'; END IF;
 IF (SELECT relacl::text FROM pg_class WHERE oid='public.profiles'::regclass) IS DISTINCT FROM '{postgres=arwdDxtm/postgres,anon=rxtm/postgres,authenticated=rxtm/postgres,service_role=arwdDxtm/postgres}' THEN RAISE EXCEPTION 'Profiles revert exact ACL drift'; END IF;
 IF (SELECT count(*) FROM pg_roles WHERE rolname IN('authenticated','anon') AND NOT rolsuper AND NOT rolbypassrls)=2 IS NOT TRUE THEN RAISE EXCEPTION 'Profiles revert caller-role drift'; END IF;
END $guard$;
GRANT TRUNCATE ON TABLE public.profiles TO anon,authenticated;
COMMIT;
