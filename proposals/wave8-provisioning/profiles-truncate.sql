-- LOCAL proposal only. One existing privilege on one table; no production authorization.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE public.profiles IN ACCESS EXCLUSIVE MODE;
DO $guard$
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Profiles correction requires the reviewed installer'; END IF;
 IF NOT EXISTS(SELECT FROM pg_class WHERE oid='public.profiles'::regclass AND relkind='r' AND relrowsecurity AND NOT relforcerowsecurity AND pg_get_userbyid(relowner)='postgres') THEN RAISE EXCEPTION 'Profiles table security drift'; END IF;
 IF (SELECT relacl::text FROM pg_class WHERE oid='public.profiles'::regclass) IS DISTINCT FROM '{postgres=arwdDxtm/postgres,anon=rDxtm/postgres,authenticated=rDxtm/postgres,service_role=arwdDxtm/postgres}' THEN RAISE EXCEPTION 'Profiles exact ACL drift'; END IF;
 IF (SELECT count(*) FROM pg_roles WHERE rolname IN('authenticated','anon') AND NOT rolsuper AND NOT rolbypassrls)=2 IS NOT TRUE THEN RAISE EXCEPTION 'Profiles caller-role security drift'; END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname IN('postgres','service_role') AND (pg_has_role('authenticated',oid,'USAGE') OR pg_has_role('anon',oid,'USAGE'))) THEN RAISE EXCEPTION 'Profiles inherited caller privilege drift'; END IF;
END $guard$;
REVOKE TRUNCATE ON TABLE public.profiles FROM anon,authenticated;
DO $verify$
BEGIN
 IF has_table_privilege('authenticated','public.profiles','TRUNCATE') OR has_table_privilege('anon','public.profiles','TRUNCATE') OR (SELECT relacl::text FROM pg_class WHERE oid='public.profiles'::regclass) IS DISTINCT FROM '{postgres=arwdDxtm/postgres,anon=rxtm/postgres,authenticated=rxtm/postgres,service_role=arwdDxtm/postgres}' THEN RAISE EXCEPTION 'Profiles correction verification failed'; END IF;
END $verify$;
COMMIT;
