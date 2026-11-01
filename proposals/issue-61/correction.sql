-- PROPOSAL ONLY. Local disposable execution authorized; production requires separate exact approval.
BEGIN;
DO $guard$
DECLARE p oid;
BEGIN
 p := 'public.resolve_coaching_entitlement_review(uuid,text,text)'::regprocedure;
 IF md5(pg_get_functiondef(p)) IS DISTINCT FROM '5efb1a3fdb53ef516e0504fd78ddfff8' THEN RAISE EXCEPTION 'Issue61 routine definition drift: public.resolve_coaching_entitlement_review(uuid,text,text)'; END IF;
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
CREATE OR REPLACE FUNCTION public.resolve_coaching_entitlement_review(p_usage_id uuid, p_resolution text, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  u public.coaching_entitlement_usage%rowtype;
  v_updated integer;
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
  -- Lock the ledger row first, then its allowance before the mutation and fresh SUM.
  perform 1 from public.membership_entitlements me
  where me.membership_id=u.membership_id and me.entitlement_key=u.entitlement_key
  for update;
  if not found then
    raise exception 'Coaching allowance is not available' using errcode='42501';
  end if;

  update public.coaching_entitlement_usage
  set status=p_resolution,
      consumed_at=case when p_resolution='consumed' then now() else null end,
      released_at=case when p_resolution='released' then now() else null end,
      review_reason=trim(p_reason),
      updated_by=(select auth.uid()),
      updated_at=now()
  where id=u.id;

  -- Same aggregate as the existing private helper, evaluated under caller RLS.
  update public.membership_entitlements me
  set used_value=coalesce((
        select sum(ceu.usage_units)
        from public.coaching_entitlement_usage ceu
        where ceu.membership_id=u.membership_id
          and ceu.entitlement_key=u.entitlement_key
          and ceu.status='consumed'
      ),0),
      updated_at=now()
  where me.membership_id=u.membership_id
    and me.entitlement_key=u.entitlement_key;
  get diagnostics v_updated = row_count;
  if v_updated is distinct from 1 then
    raise exception 'Coaching allowance update was not authorized' using errcode='42501';
  end if;
end;
$function$
;
COMMIT;
