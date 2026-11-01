-- LOCAL PROPOSAL REVERT; restores known baseline direct-access defects, not a production rollback recommendation.
BEGIN;
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
DO $guard$ BEGIN
IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_membership_allowed(uuid,text)'::regprocedure) IS DISTINCT FROM 'f461830d750a349391812a73bc57be99' THEN RAISE EXCEPTION 'Wave4 revert source drift: private.wave4_membership_allowed(uuid,text)'; END IF;
IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres,authenticated=X/postgres}' FROM pg_proc WHERE oid='private.wave4_membership_allowed(uuid,text)'::regprocedure) THEN RAISE EXCEPTION 'Wave4 revert security drift'; END IF;
IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_usage_before()'::regprocedure) IS DISTINCT FROM 'af337b7d4c7afccddf3a63ce6308297f' THEN RAISE EXCEPTION 'Wave4 revert source drift: private.wave4_usage_before()'; END IF;
IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid='private.wave4_usage_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave4 revert security drift'; END IF;
IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_usage_after()'::regprocedure) IS DISTINCT FROM 'a941c3991c55034f50fbba4ad12731a8' THEN RAISE EXCEPTION 'Wave4 revert source drift: private.wave4_usage_after()'; END IF;
IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid='private.wave4_usage_after()'::regprocedure) THEN RAISE EXCEPTION 'Wave4 revert security drift'; END IF;
IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_entitlement_before()'::regprocedure) IS DISTINCT FROM 'be91626bb13c4c74a2462ce987b0d31e' THEN RAISE EXCEPTION 'Wave4 revert source drift: private.wave4_entitlement_before()'; END IF;
IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid='private.wave4_entitlement_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave4 revert security drift'; END IF;
IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_session_binding_before()'::regprocedure) IS DISTINCT FROM '80325a9c1722e12cfc78705092928f0d' THEN RAISE EXCEPTION 'Wave4 revert source drift: private.wave4_session_binding_before()'; END IF;
IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid='private.wave4_session_binding_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave4 revert security drift'; END IF;
IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.recalculate_coaching_entitlement_used_value(uuid,text)'::regprocedure) IS DISTINCT FROM 'ff9667f40c39056e3cc46e798791cd11' THEN RAISE EXCEPTION 'Wave4 revert source drift: private.recalculate_coaching_entitlement_used_value(uuid,text)'; END IF;
IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='public.resolve_coaching_entitlement_review(uuid,text,text)'::regprocedure) IS DISTINCT FROM '25db707673040e1ae0a58e17a9d21682' THEN RAISE EXCEPTION 'Wave4 revert source drift: public.resolve_coaching_entitlement_review(uuid,text,text)'; END IF;
END $guard$;
DROP TRIGGER wave4_usage_before ON public.coaching_entitlement_usage;
DROP TRIGGER wave4_usage_after ON public.coaching_entitlement_usage;
DROP TRIGGER wave4_entitlement_before ON public.membership_entitlements;
DROP TRIGGER wave4_session_binding_before ON public.coaching_sessions;
DROP POLICY wave4_usage_scope_select ON public.coaching_entitlement_usage;
DROP POLICY wave4_usage_scope_insert ON public.coaching_entitlement_usage;
DROP POLICY wave4_usage_scope_update ON public.coaching_entitlement_usage;
DROP POLICY wave4_entitlement_scope_select ON public.membership_entitlements;
DROP POLICY wave4_entitlement_scope_insert ON public.membership_entitlements;
DROP POLICY wave4_entitlement_scope_update ON public.membership_entitlements;
CREATE OR REPLACE FUNCTION private.recalculate_coaching_entitlement_used_value(p_membership_id uuid, p_entitlement_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
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
DROP FUNCTION private.wave4_session_binding_before();
DROP FUNCTION private.wave4_entitlement_before();
DROP FUNCTION private.wave4_usage_after();
DROP FUNCTION private.wave4_usage_before();
DROP FUNCTION private.wave4_membership_allowed(uuid,text);
COMMIT;
