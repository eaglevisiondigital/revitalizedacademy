-- Staff/coach controls for per-client Health & Progress metric visibility.
-- Reads are contact-scoped; writes require plan.override plus contact scope.

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
     or not private.staff_can_access_contact(auth.uid(),p_contact_id) then
    raise exception 'Staff access to this client is required' using errcode='42501';
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
    h.metric_key,
    h.label,
    h.category,
    h.unit,
    h.coaching_use,
    h.sensitive,
    v_program_code,
    coalesce(s.tracking_mode,'hidden') as program_tracking_mode,
    coalesce(s.allow_manual,false) as program_allow_manual,
    coalesce(s.source_preference,'connected_or_manual') as program_source_preference,
    coalesce(s.display_order,h.display_order) as program_display_order,
    coalesce(o.tracking_mode,s.tracking_mode,'hidden') as tracking_mode,
    coalesce(o.allow_manual,s.allow_manual,false) as allow_manual,
    coalesce(o.source_preference,s.source_preference,'connected_or_manual') as source_preference,
    coalesce(o.display_order,s.display_order,h.display_order) as display_order,
    (o.metric_key is not null) as client_override,
    o.notes as override_notes,
    v_can_edit as can_edit
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
     or not private.staff_can_access_contact(auth.uid(),p_contact_id) then
    raise exception 'Plan override permission is required' using errcode='42501';
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
     or not private.staff_can_access_contact(auth.uid(),p_contact_id) then
    raise exception 'Plan override permission is required' using errcode='42501';
  end if;

  delete from public.client_health_metric_overrides
  where contact_id=p_contact_id and metric_key=p_metric_key;

  return true;
end;
$$;

revoke all on function public.admin_get_client_health_metric_configuration(uuid) from public,anon;
revoke all on function public.set_client_health_metric_override(uuid,text,text,boolean,text,integer,text) from public,anon;
revoke all on function public.clear_client_health_metric_override(uuid,text) from public,anon;

grant execute on function public.admin_get_client_health_metric_configuration(uuid) to authenticated;
grant execute on function public.set_client_health_metric_override(uuid,text,text,boolean,text,integer,text) to authenticated;
grant execute on function public.clear_client_health_metric_override(uuid,text) to authenticated;
