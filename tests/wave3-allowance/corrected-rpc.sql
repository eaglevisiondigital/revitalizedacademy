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
