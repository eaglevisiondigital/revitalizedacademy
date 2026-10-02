-- Coach/staff read model for client Health & Progress review.
-- Returns effective configured metrics with latest measured/manual value and 30-day descriptive change.

create or replace function public.admin_get_client_health_progress_review(
  p_contact_id uuid,
  p_days integer default 30
)
returns table (
  metric_key text,
  label text,
  category text,
  configured_unit text,
  tracking_mode text,
  allow_manual boolean,
  source_preference text,
  display_order integer,
  latest_value numeric,
  latest_boolean boolean,
  latest_unit text,
  latest_at timestamptz,
  latest_source text,
  first_period_value numeric,
  first_period_at timestamptz,
  absolute_change numeric,
  reading_count bigint
)
language plpgsql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
  v_program_code text;
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

  return query
  with effective as (
    select
      h.metric_key,
      h.label,
      h.category,
      h.unit,
      coalesce(o.tracking_mode,s.tracking_mode,'hidden') as tracking_mode,
      coalesce(o.allow_manual,s.allow_manual,false) as allow_manual,
      coalesce(o.source_preference,s.source_preference,'connected_or_manual') as source_preference,
      coalesce(o.display_order,s.display_order,h.display_order) as display_order
    from public.health_metric_catalog h
    left join public.program_health_metric_settings s
      on s.program_code=v_program_code and s.metric_key=h.metric_key
    left join public.client_health_metric_overrides o
      on o.contact_id=p_contact_id and o.metric_key=h.metric_key
    where h.active
  ),
  readings as (
    select
      ho.metric_key,
      ho.value_numeric,
      ho.value_boolean,
      ho.unit,
      ho.observed_at as measured_at,
      coalesce(ho.provider_key,'connected') as source
    from public.health_observations ho
    where ho.contact_id=p_contact_id
    union all
    select
      pe.metric_key,
      pe.value_numeric,
      pe.value_boolean,
      pm.unit,
      pe.recorded_at as measured_at,
      coalesce(pe.source,'manual') as source
    from public.progress_entries pe
    left join public.progress_metric_catalog pm on pm.metric_key=pe.metric_key
    where pe.contact_id=p_contact_id
  ),
  ranked as (
    select
      r.*,
      row_number() over(partition by r.metric_key order by r.measured_at desc) as rn_latest
    from readings r
  ),
  latest as (
    select metric_key,value_numeric,value_boolean,unit,measured_at,source
    from ranked where rn_latest=1
  ),
  period_readings as (
    select *
    from readings
    where measured_at>=now()-(v_days||' days')::interval
  ),
  first_period as (
    select distinct on (metric_key)
      metric_key,value_numeric,measured_at
    from period_readings
    where value_numeric is not null
    order by metric_key,measured_at asc
  ),
  counts as (
    select metric_key,count(*)::bigint as reading_count
    from period_readings
    where value_numeric is not null or value_boolean is not null
    group by metric_key
  )
  select
    e.metric_key,
    e.label,
    e.category,
    e.unit as configured_unit,
    e.tracking_mode,
    e.allow_manual,
    e.source_preference,
    e.display_order,
    l.value_numeric as latest_value,
    l.value_boolean as latest_boolean,
    coalesce(l.unit,e.unit) as latest_unit,
    l.measured_at as latest_at,
    l.source as latest_source,
    f.value_numeric as first_period_value,
    f.measured_at as first_period_at,
    case
      when l.value_numeric is not null and f.value_numeric is not null
        then l.value_numeric-f.value_numeric
      else null
    end as absolute_change,
    coalesce(c.reading_count,0)::bigint as reading_count
  from effective e
  left join latest l on l.metric_key=e.metric_key
  left join first_period f on f.metric_key=e.metric_key
  left join counts c on c.metric_key=e.metric_key
  where e.tracking_mode<>'hidden'
  order by
    case e.tracking_mode when 'highlighted' then 0 else 1 end,
    e.display_order,
    e.metric_key;
end;
$$;

create or replace function public.admin_get_client_health_metric_trend(
  p_contact_id uuid,
  p_metric_key text,
  p_days integer default 30
)
returns table (
  measured_at timestamptz,
  value_numeric numeric,
  value_boolean boolean,
  unit text,
  source text
)
language plpgsql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),365));
begin
  if auth.uid() is null
     or not private.active_staff_session()
     or not private.staff_can_access_contact(auth.uid(),p_contact_id) then
    raise exception 'Staff access to this client is required' using errcode='42501';
  end if;

  return query
  select *
  from (
    select
      ho.observed_at as measured_at,
      ho.value_numeric,
      ho.value_boolean,
      ho.unit,
      coalesce(ho.provider_key,'connected') as source
    from public.health_observations ho
    where ho.contact_id=p_contact_id
      and ho.metric_key=p_metric_key
      and ho.observed_at>=now()-(v_days||' days')::interval
    union all
    select
      pe.recorded_at as measured_at,
      pe.value_numeric,
      pe.value_boolean,
      pm.unit,
      coalesce(pe.source,'manual') as source
    from public.progress_entries pe
    left join public.progress_metric_catalog pm on pm.metric_key=pe.metric_key
    where pe.contact_id=p_contact_id
      and pe.metric_key=p_metric_key
      and pe.recorded_at>=now()-(v_days||' days')::interval
  ) x
  order by x.measured_at asc;
end;
$$;

revoke all on function public.admin_get_client_health_progress_review(uuid,integer) from public,anon;
revoke all on function public.admin_get_client_health_metric_trend(uuid,text,integer) from public,anon;
grant execute on function public.admin_get_client_health_progress_review(uuid,integer) to authenticated;
grant execute on function public.admin_get_client_health_metric_trend(uuid,text,integer) to authenticated;
