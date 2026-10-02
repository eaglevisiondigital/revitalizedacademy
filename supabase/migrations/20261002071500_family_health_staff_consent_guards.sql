-- Extend Family Hub consent rules to staff Health configuration and summary access.
-- Adult staff access remains subject to normal staff/contact scope.
-- Minor Health & Progress requires an explicit coaching-team grant from the guardian/head of household.

create or replace view public.admin_client_health_integration_summary
with (security_invoker=true)
as
select
  c.id as contact_id,
  count(hc.id) filter(where hc.status='connected') as connected_providers,
  max(hc.last_successful_sync_at) as last_successful_sync_at,
  count(hc.id) filter(where hc.status='attention_needed') as connections_needing_attention,
  (
    select count(*)
    from public.health_observations ho
    where ho.contact_id=c.id
      and ho.observed_at>=now()-interval '24 hours'
  ) as observations_24h
from public.contacts c
left join public.health_integration_connections hc on hc.contact_id=c.id
where exists(
  select 1 from public.client_access ca where ca.contact_id=c.id
)
and private.family_scope_visible_to_staff(c.id,'health_progress',auth.uid())
group by c.id;

create or replace function public.admin_get_client_health_metric_configuration(p_contact_id uuid)
returns table (
  metric_key text,
  label text,
  category text,
  unit text,
  coaching_use text,
  sensitive boolean,
  program_code text,
  program_tracking_mode text,
  program_allow_manual boolean,
  program_source_preference text,
  program_display_order integer,
  tracking_mode text,
  allow_manual boolean,
  source_preference text,
  display_order integer,
  client_override boolean,
  override_notes text,
  can_edit boolean
)
language plpgsql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  v_program_code text;
  v_can_edit boolean;
begin
  if auth.uid() is null
     or not private.active_staff_session()
     or not private.family_scope_visible_to_staff(
       p_contact_id,'health_progress',auth.uid()
     ) then
    raise exception 'Guardian/client consent and staff access are required' using errcode='42501';
  end if;

  select cm.program_code
  into v_program_code
  from public.client_access ca
  join public.client_memberships cm on cm.id=ca.membership_id
  where ca.contact_id=p_contact_id
  order by cm.starts_at desc nulls last,cm.created_at desc
  limit 1;

  v_can_edit:=private.staff_has_permission(auth.uid(),'plan.override');

  return query
  select
    h.metric_key,h.label,h.category,h.unit,h.coaching_use,h.sensitive,
    v_program_code,
    coalesce(s.tracking_mode,'hidden'),
    coalesce(s.allow_manual,false),
    coalesce(s.source_preference,'connected_or_manual'),
    coalesce(s.display_order,h.display_order),
    coalesce(o.tracking_mode,s.tracking_mode,'hidden'),
    coalesce(o.allow_manual,s.allow_manual,false),
    coalesce(o.source_preference,s.source_preference,'connected_or_manual'),
    coalesce(o.display_order,s.display_order,h.display_order),
    (o.metric_key is not null),
    o.notes,
    v_can_edit
  from public.health_metric_catalog h
  left join public.program_health_metric_settings s
    on s.program_code=v_program_code and s.metric_key=h.metric_key
  left join public.client_health_metric_overrides o
    on o.contact_id=p_contact_id and o.metric_key=h.metric_key
  where h.active
  order by
    case coalesce(o.tracking_mode,s.tracking_mode,'hidden')
      when 'highlighted' then 0
      when 'available' then 1
      else 2
    end,
    coalesce(o.display_order,s.display_order,h.display_order),
    h.metric_key;
end;
$$;

create or replace function public.set_client_health_metric_override(
  p_contact_id uuid,
  p_metric_key text,
  p_tracking_mode text,
  p_allow_manual boolean,
  p_source_preference text,
  p_display_order integer default null,
  p_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $$
begin
  if auth.uid() is null
     or not private.active_staff_session()
     or not private.staff_has_permission(auth.uid(),'plan.override')
     or not private.family_scope_visible_to_staff(
       p_contact_id,'health_progress',auth.uid()
     ) then
    raise exception 'Plan override permission, guardian/client consent and staff access are required' using errcode='42501';
  end if;

  if p_tracking_mode not in ('hidden','available','highlighted') then
    raise exception 'Invalid tracking mode';
  end if;

  if p_source_preference not in ('connected','manual','connected_or_manual') then
    raise exception 'Invalid source preference';
  end if;

  if not exists (
    select 1 from public.health_metric_catalog
    where metric_key=p_metric_key and active
  ) then
    raise exception 'Health metric not found';
  end if;

  insert into public.client_health_metric_overrides(
    contact_id,metric_key,tracking_mode,allow_manual,source_preference,
    display_order,notes,set_by,updated_at
  )
  values(
    p_contact_id,p_metric_key,p_tracking_mode,coalesce(p_allow_manual,false),
    p_source_preference,p_display_order,nullif(trim(coalesce(p_notes,'')),''),
    auth.uid(),now()
  )
  on conflict (contact_id,metric_key) do update set
    tracking_mode=excluded.tracking_mode,
    allow_manual=excluded.allow_manual,
    source_preference=excluded.source_preference,
    display_order=excluded.display_order,
    notes=excluded.notes,
    set_by=auth.uid(),
    updated_at=now();

  return true;
end;
$$;

create or replace function public.clear_client_health_metric_override(
  p_contact_id uuid,
  p_metric_key text
)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $$
begin
  if auth.uid() is null
     or not private.active_staff_session()
     or not private.staff_has_permission(auth.uid(),'plan.override')
     or not private.family_scope_visible_to_staff(
       p_contact_id,'health_progress',auth.uid()
     ) then
    raise exception 'Plan override permission, guardian/client consent and staff access are required' using errcode='42501';
  end if;

  delete from public.client_health_metric_overrides
  where contact_id=p_contact_id and metric_key=p_metric_key;

  return true;
end;
$$;
