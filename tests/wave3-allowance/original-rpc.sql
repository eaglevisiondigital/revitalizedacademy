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

  select * into u from public.coaching_entitlement_usage where id=p_usage_id;
  if u.id is null then raise exception 'Entitlement usage record not found'; end if;

  update public.coaching_entitlement_usage
  set status=p_resolution,
      consumed_at=case when p_resolution='consumed' then now() else null end,
      released_at=case when p_resolution='released' then now() else null end,
      review_reason=trim(p_reason),
      updated_by=(select auth.uid()),
      updated_at=now()
  where id=u.id;

  perform private.recalculate_coaching_entitlement_used_value(u.membership_id,u.entitlement_key);
end;
$function$
;
