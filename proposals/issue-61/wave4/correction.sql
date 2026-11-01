-- LOCAL PROPOSAL ONLY; no hosted authority. Baseline includes accepted LOCAL Wave3 RPC proposal.
BEGIN;
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
DO $guard$
DECLARE p oid;
BEGIN
 p := 'public.resolve_coaching_entitlement_review(uuid,text,text)'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM 'cc951508409cc6cfe4a1de0ea91bcafb' THEN RAISE EXCEPTION 'Issue61 routine definition drift: public.resolve_coaching_entitlement_review(uuid,text,text)'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM false OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=public, pg_temp']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: public.resolve_coaching_entitlement_review(uuid,text,text)'; END IF;
 p := 'private.recalculate_coaching_entitlement_used_value(uuid,text)'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM '43284b2dafa1c271c8e075722a11730a' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.recalculate_coaching_entitlement_used_value(uuid,text)'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public, private']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.recalculate_coaching_entitlement_used_value(uuid,text)'; END IF;
 p := 'private.staff_action_allowed(uuid,text,uuid)'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM '8a56153aee64b660f01935262b086670' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.staff_action_allowed(uuid,text,uuid)'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public, private']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres,authenticated=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.staff_action_allowed(uuid,text,uuid)'; END IF;
 p := 'private.staff_has_permission(uuid,text)'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM 'd9a0fcfb28e77a3a27d8c3f65abd174c' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.staff_has_permission(uuid,text)'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public, private']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.staff_has_permission(uuid,text)'; END IF;
 p := 'private.staff_can_access_contact(uuid,uuid)'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM 'aa4d04cd7dec9516446b2a350b8664ac' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.staff_can_access_contact(uuid,uuid)'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public, private']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.staff_can_access_contact(uuid,uuid)'; END IF;
 p := 'private.active_staff_session()'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM '7ebd797cf44e280fdbf9fe5272a3877a' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.active_staff_session()'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres,authenticated=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.active_staff_session()'; END IF;
 p := 'private.full_member_access()'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM 'e007e0c9403d511c0f687ef4e883d19d' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.full_member_access()'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public, private']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres,authenticated=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.full_member_access()'; END IF;
 p := 'private.sync_coaching_session_entitlement()'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM '8e4cc6d2ecde5ef89393049a1eda5173' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.sync_coaching_session_entitlement()'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public, private']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.sync_coaching_session_entitlement()'; END IF;
 p := 'private.sync_coaching_session_status()'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM 'da81344260e94c887aa00d8d22431252' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.sync_coaching_session_status()'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public, private']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.sync_coaching_session_status()'; END IF;
 p := 'private.create_coaching_session_prep_task()'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM '4338279d01ad2c31bc3a7a33b0361c97' THEN RAISE EXCEPTION 'Issue61 routine definition drift: private.create_coaching_session_prep_task()'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, public, private']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: private.create_coaching_session_prep_task()'; END IF;
 IF EXISTS(SELECT FROM pg_trigger WHERE tgrelid IN ('public.coaching_entitlement_usage'::regclass,'public.membership_entitlements'::regclass) AND NOT tgisinternal) THEN RAISE EXCEPTION 'Issue61 usage/entitlement trigger drift'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false OR pg_get_userbyid(relowner) IS DISTINCT FROM 'postgres' OR relacl::text IS DISTINCT FROM '{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}' FROM pg_class WHERE oid='public.coaching_entitlement_usage'::regclass) THEN RAISE EXCEPTION 'Issue61 table security drift: coaching_entitlement_usage'; END IF;
 IF (SELECT jsonb_agg(jsonb_build_object('name',polname,'check',pg_get_expr(polwithcheck,polrelid),'roles',ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(polroles) ORDER BY rolname),'using',pg_get_expr(polqual,polrelid),'command',polcmd::text,'permissive',polpermissive) ORDER BY polname) FROM pg_policy WHERE polrelid='public.coaching_entitlement_usage'::regclass) IS DISTINCT FROM '[{"name":"coaching_entitlement_usage_access","check":null,"roles":["authenticated"],"using":"((contact_id IN ( SELECT ca.contact_id\n   FROM client_access ca\n  WHERE (ca.user_id = ( SELECT auth.uid() AS uid)))) OR private.staff_has_permission(( SELECT auth.uid() AS uid), ''coaching.view''::text))","command":"r","permissive":true},{"name":"coaching_entitlement_usage_staff_insert","check":"private.staff_has_permission(( SELECT auth.uid() AS uid), ''coaching.manage''::text)","roles":["authenticated"],"using":null,"command":"a","permissive":true},{"name":"coaching_entitlement_usage_staff_update","check":"private.staff_has_permission(( SELECT auth.uid() AS uid), ''coaching.manage''::text)","roles":["authenticated"],"using":"private.staff_has_permission(( SELECT auth.uid() AS uid), ''coaching.manage''::text)","command":"w","permissive":true},{"name":"lifecycle_paid_access","check":"(( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))","roles":["authenticated"],"using":"(( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))","command":"*","permissive":false}]'::jsonb THEN RAISE EXCEPTION 'Issue61 policy drift: coaching_entitlement_usage'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false OR pg_get_userbyid(relowner) IS DISTINCT FROM 'postgres' OR relacl::text IS DISTINCT FROM '{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}' FROM pg_class WHERE oid='public.membership_entitlements'::regclass) THEN RAISE EXCEPTION 'Issue61 table security drift: membership_entitlements'; END IF;
 IF (SELECT jsonb_agg(jsonb_build_object('name',polname,'check',pg_get_expr(polwithcheck,polrelid),'roles',ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(polroles) ORDER BY rolname),'using',pg_get_expr(polqual,polrelid),'command',polcmd::text,'permissive',polpermissive) ORDER BY polname) FROM pg_policy WHERE polrelid='public.membership_entitlements'::regclass) IS DISTINCT FROM '[{"name":"lifecycle_paid_access","check":"(( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))","roles":["authenticated"],"using":"(( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))","command":"*","permissive":false},{"name":"membership_entitlements_staff_insert","check":"(EXISTS ( SELECT 1\n   FROM staff_access s\n  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))","roles":["authenticated"],"using":null,"command":"a","permissive":true},{"name":"membership_entitlements_staff_or_member_select","check":null,"roles":["authenticated"],"using":"((EXISTS ( SELECT 1\n   FROM staff_access s\n  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))) OR (membership_id IN ( SELECT ca.membership_id\n   FROM client_access ca\n  WHERE (ca.user_id = ( SELECT auth.uid() AS uid)))))","command":"r","permissive":true},{"name":"membership_entitlements_staff_update","check":"(EXISTS ( SELECT 1\n   FROM staff_access s\n  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))","roles":["authenticated"],"using":"(EXISTS ( SELECT 1\n   FROM staff_access s\n  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))","command":"w","permissive":true}]'::jsonb THEN RAISE EXCEPTION 'Issue61 policy drift: membership_entitlements'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false OR pg_get_userbyid(relowner) IS DISTINCT FROM 'postgres' OR relacl::text IS DISTINCT FROM '{postgres=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}' FROM pg_class WHERE oid='public.coaching_sessions'::regclass) THEN RAISE EXCEPTION 'Issue61 table security drift: coaching_sessions'; END IF;
 IF (SELECT jsonb_agg(jsonb_build_object('name',polname,'check',pg_get_expr(polwithcheck,polrelid),'roles',ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(polroles) ORDER BY rolname),'using',pg_get_expr(polqual,polrelid),'command',polcmd::text,'permissive',polpermissive) ORDER BY polname) FROM pg_policy WHERE polrelid='public.coaching_sessions'::regclass) IS DISTINCT FROM '[{"name":"coaching_sessions_select","check":null,"roles":["authenticated"],"using":"((contact_id IN ( SELECT ca.contact_id\n   FROM client_access ca\n  WHERE (ca.user_id = ( SELECT auth.uid() AS uid)))) OR (private.staff_has_permission(( SELECT auth.uid() AS uid), ''coaching.view''::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id)))","command":"r","permissive":true},{"name":"coaching_sessions_staff_insert","check":"(private.staff_has_permission(( SELECT auth.uid() AS uid), ''coaching.manage''::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id))","roles":["authenticated"],"using":null,"command":"a","permissive":true},{"name":"coaching_sessions_staff_update","check":"(private.staff_has_permission(( SELECT auth.uid() AS uid), ''coaching.manage''::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id))","roles":["authenticated"],"using":"(private.staff_has_permission(( SELECT auth.uid() AS uid), ''coaching.manage''::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id))","command":"w","permissive":true},{"name":"lifecycle_paid_access","check":"(( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))","roles":["authenticated"],"using":"(( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))","command":"*","permissive":false}]'::jsonb THEN RAISE EXCEPTION 'Issue61 policy drift: coaching_sessions'; END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname IN ('authenticated','anon') AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Issue61 caller role boundary drift'; END IF;
END $guard$;
DO $integrity$ BEGIN
 IF EXISTS(SELECT 1 FROM public.coaching_sessions s WHERE s.membership_id IS NOT NULL AND NOT EXISTS(
   SELECT 1 FROM public.client_memberships cm WHERE cm.id=s.membership_id AND (cm.primary_contact_id=s.contact_id OR EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.contact_id=s.contact_id AND ca.membership_id=cm.id))))
 THEN RAISE EXCEPTION 'Preexisting invalid session membership relationship; bounded separate remediation required'; END IF;
 IF EXISTS(SELECT 1 FROM public.coaching_entitlement_usage u LEFT JOIN public.coaching_sessions s ON s.id=u.coaching_session_id
   LEFT JOIN public.membership_entitlements me ON me.id=u.entitlement_id
   WHERE s.id IS NULL OR u.contact_id IS DISTINCT FROM s.contact_id OR u.membership_id IS DISTINCT FROM s.membership_id
     OR u.entitlement_key IS DISTINCT FROM 'private_coaching'
     OR NOT EXISTS(SELECT 1 FROM public.client_memberships cm WHERE cm.id=u.membership_id AND (cm.primary_contact_id=u.contact_id OR EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.contact_id=u.contact_id AND ca.membership_id=cm.id)))
     OR (u.entitlement_id IS NOT NULL AND (me.id IS NULL OR me.membership_id IS DISTINCT FROM u.membership_id OR me.entitlement_key IS DISTINCT FROM u.entitlement_key)))
 THEN RAISE EXCEPTION 'Preexisting malformed usage relationships; bounded separate remediation required'; END IF;
 IF EXISTS(SELECT 1 FROM public.membership_entitlements me WHERE me.entitlement_key='private_coaching' AND me.used_value IS DISTINCT FROM
   (SELECT coalesce(sum(u.usage_units),0) FROM public.coaching_entitlement_usage u WHERE u.membership_id=me.membership_id AND u.entitlement_key=me.entitlement_key AND u.status='consumed'))
 THEN RAISE EXCEPTION 'Preexisting inconsistent allowance cache; bounded separate remediation required'; END IF;
END $integrity$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_policy WHERE polrelid='public.coaching_entitlement_usage'::regclass AND polname='wave4_usage_scope_select') THEN RAISE EXCEPTION 'Wave4 policy collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_policy WHERE polrelid='public.coaching_entitlement_usage'::regclass AND polname='wave4_usage_scope_insert') THEN RAISE EXCEPTION 'Wave4 policy collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_policy WHERE polrelid='public.coaching_entitlement_usage'::regclass AND polname='wave4_usage_scope_update') THEN RAISE EXCEPTION 'Wave4 policy collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_policy WHERE polrelid='public.membership_entitlements'::regclass AND polname='wave4_entitlement_scope_select') THEN RAISE EXCEPTION 'Wave4 policy collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_policy WHERE polrelid='public.membership_entitlements'::regclass AND polname='wave4_entitlement_scope_insert') THEN RAISE EXCEPTION 'Wave4 policy collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_policy WHERE polrelid='public.membership_entitlements'::regclass AND polname='wave4_entitlement_scope_update') THEN RAISE EXCEPTION 'Wave4 policy collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_trigger WHERE tgrelid='public.coaching_entitlement_usage'::regclass AND tgname='wave4_usage_before') THEN RAISE EXCEPTION 'Wave4 trigger collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_trigger WHERE tgrelid='public.coaching_entitlement_usage'::regclass AND tgname='wave4_usage_after') THEN RAISE EXCEPTION 'Wave4 trigger collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_trigger WHERE tgrelid='public.membership_entitlements'::regclass AND tgname='wave4_entitlement_before') THEN RAISE EXCEPTION 'Wave4 trigger collision'; END IF; END $x$;
DO $x$ BEGIN IF EXISTS(SELECT FROM pg_trigger WHERE tgrelid='public.coaching_sessions'::regclass AND tgname='wave4_session_binding_before') THEN RAISE EXCEPTION 'Wave4 trigger collision'; END IF; END $x$;
DO $x$ BEGIN IF to_regprocedure('private.wave4_membership_allowed(uuid,text)') IS NOT NULL THEN RAISE EXCEPTION 'Wave4 object collision'; END IF; END $x$;
CREATE FUNCTION private.wave4_membership_allowed(p_membership_id uuid,p_permission text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $function$
declare v_actor uuid:=auth.uid();
begin
  if p_permission is null or p_permission not in ('coaching.view','coaching.manage') then return false; end if;
  if v_actor is null or not private.active_staff_session()
     or not private.staff_has_permission(v_actor,p_permission) then return false; end if;
  return exists(select 1 from public.client_memberships cm where cm.id=p_membership_id)
    and not exists(
      select 1 from (
        select cm.primary_contact_id as contact_id from public.client_memberships cm where cm.id=p_membership_id
        union select ca.contact_id from public.client_access ca where ca.membership_id=p_membership_id
        union select cs.contact_id from public.coaching_sessions cs where cs.membership_id=p_membership_id
        union select u.contact_id from public.coaching_entitlement_usage u where u.membership_id=p_membership_id
      ) participants
      where not coalesce(private.staff_can_access_contact(v_actor,participants.contact_id),false)
    );
end;
$function$;

ALTER FUNCTION private.wave4_membership_allowed(uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION private.wave4_membership_allowed(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.wave4_membership_allowed(uuid,text) TO authenticated,postgres;
DO $x$ BEGIN IF to_regprocedure('private.wave4_usage_before()') IS NOT NULL THEN RAISE EXCEPTION 'Wave4 object collision'; END IF; END $x$;
CREATE FUNCTION private.wave4_usage_before() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
declare v_key text; s public.coaching_sessions%rowtype;
begin
  for v_key in
    select distinct k from unnest(array[
      case when TG_OP<>'INSERT' then OLD.membership_id::text||'/'||OLD.entitlement_key end,
      case when TG_OP<>'DELETE' then NEW.membership_id::text||'/'||NEW.entitlement_key end
    ]) k where k is not null order by k
  loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rva-allowance-v1/'||v_key,0));
  end loop;
  if TG_OP='DELETE' then return OLD; end if;
  if TG_OP='UPDATE' and (
    NEW.coaching_session_id is distinct from OLD.coaching_session_id
    or NEW.membership_id is distinct from OLD.membership_id
    or NEW.contact_id is distinct from OLD.contact_id
    or NEW.entitlement_key is distinct from OLD.entitlement_key
  ) then raise exception 'Session-backed usage binding cannot be transferred' using errcode='23514'; end if;
  select * into s from public.coaching_sessions where id=NEW.coaching_session_id for share;
  if not found or NEW.contact_id is distinct from s.contact_id
     or NEW.membership_id is distinct from s.membership_id
     or NEW.entitlement_key is distinct from 'private_coaching' then
    raise exception 'Invalid session-backed usage relationship' using errcode='23514';
  end if;
  if not exists(select 1 from public.client_memberships cm where cm.id=NEW.membership_id
    and (cm.primary_contact_id=NEW.contact_id or exists(select 1 from public.client_access ca where ca.contact_id=NEW.contact_id and ca.membership_id=cm.id))) then
    raise exception 'Session contact has no explicit membership relationship' using errcode='23514';
  end if;
  if NEW.entitlement_id is not null and not exists(
    select 1 from public.membership_entitlements me where me.id=NEW.entitlement_id
      and me.membership_id=NEW.membership_id and me.entitlement_key=NEW.entitlement_key
  ) then raise exception 'Invalid session-backed entitlement relationship' using errcode='23514'; end if;
  if auth.uid() is not null then NEW.updated_by:=auth.uid(); end if;
  return NEW;
end;
$function$;

ALTER FUNCTION private.wave4_usage_before() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.wave4_usage_before() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.wave4_usage_before() TO postgres;
DO $x$ BEGIN IF to_regprocedure('private.wave4_usage_after()') IS NOT NULL THEN RAISE EXCEPTION 'Wave4 object collision'; END IF; END $x$;
CREATE FUNCTION private.wave4_usage_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
declare v_membership uuid; v_entitlement text;
begin
  for v_membership,v_entitlement in
    select distinct m,k from (values
      (case when TG_OP<>'INSERT' then OLD.membership_id end,case when TG_OP<>'INSERT' then OLD.entitlement_key end),
      (case when TG_OP<>'DELETE' then NEW.membership_id end,case when TG_OP<>'DELETE' then NEW.entitlement_key end)
    ) pairs(m,k) where m is not null and k is not null order by m,k
  loop
    perform private.recalculate_coaching_entitlement_used_value(v_membership,v_entitlement);
  end loop;
  return null;
end;
$function$;

ALTER FUNCTION private.wave4_usage_after() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.wave4_usage_after() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.wave4_usage_after() TO postgres;
DO $x$ BEGIN IF to_regprocedure('private.wave4_entitlement_before()') IS NOT NULL THEN RAISE EXCEPTION 'Wave4 object collision'; END IF; END $x$;
CREATE FUNCTION private.wave4_entitlement_before() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
declare v_key text; v_total bigint;
begin
  if NEW.entitlement_key is distinct from 'private_coaching' and (TG_OP='INSERT' or OLD.entitlement_key is distinct from 'private_coaching') then return NEW; end if;
  for v_key in
    select distinct k from unnest(array[
      case when TG_OP<>'INSERT' then OLD.membership_id::text||'/'||OLD.entitlement_key end,
      case when TG_OP<>'DELETE' then NEW.membership_id::text||'/'||NEW.entitlement_key end
    ]) k where k is not null order by k
  loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rva-allowance-v1/'||v_key,0));
  end loop;
  if TG_OP='DELETE' then return OLD; end if;
  if TG_OP='UPDATE' and (NEW.membership_id is distinct from OLD.membership_id or NEW.entitlement_key is distinct from OLD.entitlement_key)
     and exists(select 1 from public.coaching_entitlement_usage u where u.entitlement_id=OLD.id
       or (u.membership_id=OLD.membership_id and u.entitlement_key=OLD.entitlement_key)) then
    raise exception 'Referenced allowance binding cannot be transferred' using errcode='23514';
  end if;
  select coalesce(sum(u.usage_units),0) into v_total from public.coaching_entitlement_usage u
    where u.membership_id=NEW.membership_id and u.entitlement_key=NEW.entitlement_key and u.status='consumed';
  if NEW.used_value is distinct from v_total then
    raise exception 'Allowance used_value must match the complete usage ledger' using errcode='23514';
  end if;
  return NEW;
end;
$function$;

ALTER FUNCTION private.wave4_entitlement_before() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.wave4_entitlement_before() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.wave4_entitlement_before() TO postgres;
DO $x$ BEGIN IF to_regprocedure('private.wave4_session_binding_before()') IS NOT NULL THEN RAISE EXCEPTION 'Wave4 object collision'; END IF; END $x$;
CREATE FUNCTION private.wave4_session_binding_before() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
begin
  if NEW.membership_id is not null and not exists(
    select 1 from public.client_memberships cm where cm.id=NEW.membership_id
      and (cm.primary_contact_id=NEW.contact_id or exists(select 1 from public.client_access ca where ca.contact_id=NEW.contact_id and ca.membership_id=cm.id))
  ) then raise exception 'Session contact has no explicit membership relationship' using errcode='23514'; end if;
  if TG_OP='UPDATE' and (NEW.contact_id is distinct from OLD.contact_id or NEW.membership_id is distinct from OLD.membership_id)
     and exists(select 1 from public.coaching_entitlement_usage u where u.coaching_session_id=OLD.id) then
    raise exception 'Existing session usage cannot be transferred' using errcode='23514';
  end if;
  return NEW;
end;
$function$;

ALTER FUNCTION private.wave4_session_binding_before() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.wave4_session_binding_before() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.wave4_session_binding_before() TO postgres;
CREATE OR REPLACE FUNCTION private.recalculate_coaching_entitlement_used_value(p_membership_id uuid, p_entitlement_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v_updated integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rva-allowance-v1/'||p_membership_id::text||'/'||p_entitlement_key,0));
  update public.membership_entitlements me
  set used_value=coalesce((
        select sum(ceu.usage_units)
        from public.coaching_entitlement_usage ceu
        where ceu.membership_id=p_membership_id
          and ceu.entitlement_key=p_entitlement_key
          and ceu.status='consumed'
      ),0),
      updated_at=now()
  where me.membership_id=p_membership_id
    and me.entitlement_key=p_entitlement_key;
  get diagnostics v_updated = row_count;
  if v_updated is distinct from 1 and exists(select 1 from public.membership_entitlements me where me.membership_id=p_membership_id and me.entitlement_key=p_entitlement_key) then
    raise exception 'Existing allowance was not recalculated' using errcode='42501';
  end if;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.resolve_coaching_entitlement_review(p_usage_id uuid, p_resolution text, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  u public.coaching_entitlement_usage%rowtype;
begin
  if not private.staff_has_permission((select auth.uid()),'coaching.manage') then
    raise exception 'Coaching management permission required';
  end if;

  if p_resolution not in ('consumed','released') then
    raise exception 'Resolution must be consumed or released';
  end if;

  if nullif(trim(p_reason),'') is null then
    raise exception 'Resolution reason is required';
  end if;

  select * into u from public.coaching_entitlement_usage where id=p_usage_id for update;
  if u.id is null then raise exception 'Entitlement usage record not found'; end if;

  -- Existing contact authority is evaluated against the server-selected ledger row.
  if not private.staff_action_allowed((select auth.uid()),'coaching.manage',u.contact_id) then
    raise exception 'Coaching contact access required' using errcode='42501';
  end if;
  -- A partial ledger view must never produce a partial allowance total.
  if not private.staff_has_permission((select auth.uid()),'coaching.view') then
    raise exception 'Complete coaching usage visibility required' using errcode='42501';
  end if;
  -- Visibility is conservative; no caller-side aggregate or early allowance row lock.
  perform 1 from public.membership_entitlements me
  where me.membership_id=u.membership_id and me.entitlement_key=u.entitlement_key;
  if not found then raise exception 'Coaching allowance is not available' using errcode='42501'; end if;

  update public.coaching_entitlement_usage
  set status=p_resolution,
      consumed_at=case when p_resolution='consumed' then now() else null end,
      released_at=case when p_resolution='released' then now() else null end,
      review_reason=trim(p_reason),
      updated_by=(select auth.uid()),
      updated_at=now()
  where id=u.id;

  -- The guarded private ledger trigger recalculates the complete aggregate.

end;
$function$
;
CREATE POLICY wave4_usage_scope_select ON public.coaching_entitlement_usage AS RESTRICTIVE FOR SELECT TO authenticated USING (((private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'coaching.view',contact_id)) OR (private.full_member_access() AND EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.user_id=auth.uid() AND ca.contact_id=coaching_entitlement_usage.contact_id))));
CREATE POLICY wave4_usage_scope_insert ON public.coaching_entitlement_usage AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK ((private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'coaching.manage',contact_id) AND EXISTS(SELECT 1 FROM public.coaching_sessions s WHERE s.id=coaching_entitlement_usage.coaching_session_id AND s.contact_id=coaching_entitlement_usage.contact_id AND s.membership_id=coaching_entitlement_usage.membership_id)));
CREATE POLICY wave4_usage_scope_update ON public.coaching_entitlement_usage AS RESTRICTIVE FOR UPDATE TO authenticated USING ((private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'coaching.manage',contact_id) AND EXISTS(SELECT 1 FROM public.coaching_sessions s WHERE s.id=coaching_entitlement_usage.coaching_session_id AND s.contact_id=coaching_entitlement_usage.contact_id AND s.membership_id=coaching_entitlement_usage.membership_id))) WITH CHECK ((private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'coaching.manage',contact_id) AND EXISTS(SELECT 1 FROM public.coaching_sessions s WHERE s.id=coaching_entitlement_usage.coaching_session_id AND s.contact_id=coaching_entitlement_usage.contact_id AND s.membership_id=coaching_entitlement_usage.membership_id)));
CREATE POLICY wave4_entitlement_scope_select ON public.membership_entitlements AS RESTRICTIVE FOR SELECT TO authenticated USING (entitlement_key<>'private_coaching' OR (private.wave4_membership_allowed(membership_id,'coaching.view') OR (private.full_member_access() AND EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.user_id=auth.uid() AND ca.membership_id=membership_entitlements.membership_id))));
CREATE POLICY wave4_entitlement_scope_insert ON public.membership_entitlements AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (entitlement_key<>'private_coaching' OR private.wave4_membership_allowed(membership_id,'coaching.manage'));
CREATE POLICY wave4_entitlement_scope_update ON public.membership_entitlements AS RESTRICTIVE FOR UPDATE TO authenticated USING (entitlement_key<>'private_coaching' OR private.wave4_membership_allowed(membership_id,'coaching.manage')) WITH CHECK (entitlement_key<>'private_coaching' OR private.wave4_membership_allowed(membership_id,'coaching.manage'));
CREATE TRIGGER wave4_usage_before BEFORE INSERT OR UPDATE OR DELETE ON public.coaching_entitlement_usage FOR EACH ROW EXECUTE FUNCTION private.wave4_usage_before();
CREATE TRIGGER wave4_usage_after AFTER INSERT OR UPDATE OR DELETE ON public.coaching_entitlement_usage FOR EACH ROW EXECUTE FUNCTION private.wave4_usage_after();
CREATE TRIGGER wave4_entitlement_before BEFORE INSERT OR UPDATE ON public.membership_entitlements FOR EACH ROW EXECUTE FUNCTION private.wave4_entitlement_before();
CREATE TRIGGER wave4_session_binding_before BEFORE INSERT OR UPDATE OF contact_id,membership_id ON public.coaching_sessions FOR EACH ROW EXECUTE FUNCTION private.wave4_session_binding_before();
COMMIT;
