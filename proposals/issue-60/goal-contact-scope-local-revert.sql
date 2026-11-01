-- LOCAL REGRESSION REVERSION ONLY; reopens known broad staff access.
-- Production recommendation: hold/fail closed and forward repair. Separate authorization required.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SET LOCAL search_path=public;
LOCK TABLE public.client_goals IN ACCESS EXCLUSIVE MODE;
DO $guard$ DECLARE actual text; BEGIN SELECT encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') INTO actual FROM (SELECT jsonb_build_object(
 'table',(SELECT jsonb_build_object('owner',pg_get_userbyid(relowner),'rls',relrowsecurity,'force_rls',relforcerowsecurity,'acl',ARRAY(SELECT a::text FROM unnest(relacl) a ORDER BY a::text)) FROM pg_class WHERE oid='public.client_goals'::regclass),
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'default',pg_get_expr(d.adbin,d.adrelid),'not_null',a.attnotnull) ORDER BY a.attnum) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid='public.client_goals'::regclass AND a.attnum>0 AND NOT a.attisdropped),
 'policies',(SELECT jsonb_agg(jsonb_build_object('name',polname,'command',polcmd,'permissive',polpermissive,'roles',ARRAY(SELECT CASE WHEN x=0 THEN 'public' ELSE pg_get_userbyid(x)::text END FROM unnest(polroles) x),'using',pg_get_expr(polqual,polrelid),'check',pg_get_expr(polwithcheck,polrelid)) ORDER BY polname) FROM pg_policy WHERE polrelid='public.client_goals'::regclass),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('name',conname,'definition',pg_get_constraintdef(oid)) ORDER BY conname) FROM pg_constraint WHERE conrelid='public.client_goals'::regclass),
 'triggers',(SELECT jsonb_agg(jsonb_build_object('name',tgname,'enabled',tgenabled,'definition',pg_get_triggerdef(oid)) ORDER BY tgname) FROM pg_trigger WHERE tgrelid='public.client_goals'::regclass AND NOT tgisinternal),
 'helpers',(SELECT jsonb_agg(jsonb_build_object('name',n.nspname||'.'||p.proname,'args',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(proowner),'definer',prosecdef,'config',proconfig,'acl',ARRAY(SELECT a::text FROM unnest(coalesce(proacl,acldefault('f',proowner))) a ORDER BY a::text)) ORDER BY n.nspname,p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='private' AND p.proname IN ('active_staff_session','full_member_access','enrollment_gates_complete','enrollment_payment_satisfied','staff_can_access_contact','staff_has_permission')) OR (n.nspname='public' AND p.proname IN ('create_my_goal','update_my_goal_status')))
 ) AS snapshot) q; IF actual IS DISTINCT FROM 'b910261dcb90e564e6f16ef25ca9ba2fd85d90152ced4f2535c77a1c19f8854c' THEN RAISE EXCEPTION 'Issue60 catalog drift; no policy change' USING ERRCODE='55000'; END IF; END $guard$;
DROP POLICY client_goals_contact_scope_v1 ON public.client_goals;
COMMIT;
