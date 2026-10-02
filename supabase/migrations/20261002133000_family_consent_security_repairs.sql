-- Repair Family Hub consent/security defects F1-F7.
-- Preserve adult self-access, explicit adult sharing, guardian control, staff contact scope,
-- and deny-by-default behavior for minors.

-- F3: allow coaching-team grants to use a null contact recipient safely.
alter table public.family_data_sharing_grants
  drop constraint if exists family_data_sharing_grants_pkey;

alter table public.family_data_sharing_grants
  alter column grantee_contact_id drop not null;

alter table public.family_data_sharing_grants
  add column if not exists id uuid default gen_random_uuid();

update public.family_data_sharing_grants
set id=gen_random_uuid()
where id is null;

alter table public.family_data_sharing_grants
  alter column id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='family_data_sharing_grants_id_pkey'
      and conrelid='public.family_data_sharing_grants'::regclass
  ) then
    alter table public.family_data_sharing_grants
      add constraint family_data_sharing_grants_id_pkey primary key(id);
  end if;
end $$;

create unique index if not exists family_data_sharing_member_unique
  on public.family_data_sharing_grants(
    household_id,subject_contact_id,grantee_type,grantee_contact_id,data_scope
  )
  where grantee_type='household_member';

create unique index if not exists family_data_sharing_coaching_unique
  on public.family_data_sharing_grants(
    household_id,subject_contact_id,grantee_type,data_scope
  )
  where grantee_type='coaching_team';

create or replace function public.set_my_family_data_sharing(
  p_subject_contact_id uuid,
  p_grantee_type text,
  p_grantee_contact_id uuid,
  p_data_scope text,
  p_allowed boolean
)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  v_actor uuid:=private.family_current_contact();
  v_household uuid;
  v_subject_minor boolean;
  v_updated integer;
begin
  select ca.household_id into v_household
  from public.client_access ca
  where ca.user_id=auth.uid()
    and ca.status='active'
    and ca.household_id is not null
  limit 1;

  if v_actor is null or v_household is null then
    raise exception 'Active Family Hub membership is required';
  end if;

  if p_grantee_type not in ('household_member','coaching_team') then
    raise exception 'Invalid family sharing recipient';
  end if;

  if p_data_scope not in (
    'health_progress','goals_habits','nutrition_fitness','schedule',
    'progress_photos','all'
  ) then
    raise exception 'Invalid family sharing scope';
  end if;

  if not exists(
    select 1 from public.household_members hm
    where hm.household_id=v_household
      and hm.contact_id=p_subject_contact_id
      and hm.status='active'
  ) then
    raise exception 'Family subject is not in your household';
  end if;

  v_subject_minor:=private.family_contact_is_minor(
    p_subject_contact_id,v_household
  );

  if v_subject_minor then
    if not private.family_guardian_controls_minor(
      v_household,p_subject_contact_id,v_actor
    ) then
      raise exception 'Only this minor''s guardian/head-of-household can change sharing';
    end if;
  elsif p_subject_contact_id<>v_actor then
    raise exception 'An adult can only change sharing for their own data';
  end if;

  if p_grantee_type='household_member' then
    if p_grantee_contact_id is null
       or p_grantee_contact_id=p_subject_contact_id
       or not exists(
         select 1 from public.household_members hm
         where hm.household_id=v_household
           and hm.contact_id=p_grantee_contact_id
           and hm.status='active'
       ) then
      raise exception 'Sharing recipient must be another household member';
    end if;

    if private.family_contact_is_minor(p_grantee_contact_id,v_household)
       or not private.family_adult_consent_accepted(
         v_household,p_grantee_contact_id
       ) then
      raise exception 'Recipient adult must first consent to Family Hub';
    end if;
  elsif p_grantee_contact_id is not null then
    raise exception 'Coaching-team sharing does not use a household contact recipient';
  end if;

  update public.family_data_sharing_grants g
  set
    granted_by_contact_id=v_actor,
    allowed=p_allowed,
    granted_at=case when p_allowed then now() else g.granted_at end,
    revoked_at=case when p_allowed then null else now() end,
    updated_at=now()
  where g.household_id=v_household
    and g.subject_contact_id=p_subject_contact_id
    and g.grantee_type=p_grantee_type
    and g.data_scope=p_data_scope
    and (
      (p_grantee_type='coaching_team' and g.grantee_contact_id is null)
      or
      (p_grantee_type='household_member' and g.grantee_contact_id=p_grantee_contact_id)
    );

  get diagnostics v_updated=row_count;

  if v_updated=0 then
    insert into public.family_data_sharing_grants(
      household_id,subject_contact_id,granted_by_contact_id,
      grantee_type,grantee_contact_id,data_scope,allowed,
      granted_at,revoked_at,updated_at
    )
    values(
      v_household,p_subject_contact_id,v_actor,
      p_grantee_type,p_grantee_contact_id,p_data_scope,p_allowed,
      case when p_allowed then now() else null end,
      case when p_allowed then null else now() end,
      now()
    );
  end if;

  return true;
end;
$$;

-- F1/F7: direct table reads must honor the same subject/contact/guardian boundaries.
drop policy if exists progress_entries_select on public.progress_entries;
create policy progress_entries_select
on public.progress_entries
for select
to authenticated
using (
  contact_id in (
    select ca.contact_id
    from public.client_access ca
    where ca.user_id=(select auth.uid())
  )
  or (
    private.active_staff_session()
    and private.family_scope_visible_to_staff(
      progress_entries.contact_id,'health_progress',(select auth.uid())
    )
  )
);

drop policy if exists health_observations_access on public.health_observations;
create policy health_observations_access
on public.health_observations
for select
to authenticated
using (
  contact_id in (
    select ca.contact_id
    from public.client_access ca
    where ca.user_id=(select auth.uid())
  )
  or (
    private.staff_has_permission((select auth.uid()),'health.private.view')
    and private.family_scope_visible_to_staff(
      health_observations.contact_id,'health_progress',(select auth.uid())
    )
  )
);

drop policy if exists household_members_staff_or_member_select on public.household_members;
create policy household_members_staff_or_member_select
on public.household_members
for select
to authenticated
using (
  (
    private.active_staff_session()
    and private.staff_can_access_contact((select auth.uid()),household_members.contact_id)
  )
  or
  household_members.contact_id=private.family_current_contact()
  or (
    not private.family_contact_is_minor(
      household_members.contact_id,household_members.household_id
    )
    and private.family_adult_consent_accepted(
      household_members.household_id,household_members.contact_id
    )
  )
  or private.family_guardian_controls_minor(
    household_members.household_id,
    household_members.contact_id,
    private.family_current_contact()
  )
);

-- F5/F6: family-facing views apply explicit sharing rules themselves and must not depend
-- on direct grants/table SELECT or subject-only wellness RLS underneath.
alter view public.my_household set (security_invoker=false);
alter view public.my_family_progress_dashboard set (security_invoker=false);
alter view public.my_family_wellness_summary set (security_invoker=false);
alter view public.my_family_dashboard_summary_v2 set (security_invoker=false);

-- F4: qualify all metric identifiers so output-column names cannot conflict with SQL columns.
create or replace function public.admin_get_client_health_progress_review(
  p_contact_id uuid,
  p_days integer default 30
)
returns table (
  metric_key text,label text,category text,configured_unit text,
  tracking_mode text,allow_manual boolean,source_preference text,
  display_order integer,latest_value numeric,latest_boolean boolean,
  latest_unit text,latest_at timestamptz,latest_source text,
  first_period_value numeric,first_period_at timestamptz,
  absolute_change numeric,reading_count bigint
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
     or not private.family_scope_visible_to_staff(
       p_contact_id,'health_progress',auth.uid()
     ) then
    raise exception 'Guardian/client consent and staff access are required' using errcode='42501';
  end if;

  select cm.program_code into v_program_code
  from public.client_access ca
  join public.client_memberships cm on cm.id=ca.membership_id
  where ca.contact_id=p_contact_id
  order by cm.starts_at desc nulls last,cm.created_at desc
  limit 1;

  return query
  with effective as (
    select
      h.metric_key as metric_key,
      h.label as label,
      h.category as category,
      h.unit as configured_unit,
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
      ho.metric_key as metric_key,
      ho.value_numeric as value_numeric,
      ho.value_boolean as value_boolean,
      ho.unit as unit,
      ho.observed_at as measured_at,
      coalesce(ho.provider_key,'connected') as source
    from public.health_observations ho
    where ho.contact_id=p_contact_id
    union all
    select
      pe.metric_key as metric_key,
      pe.value_numeric as value_numeric,
      pe.value_boolean as value_boolean,
      pm.unit as unit,
      pe.recorded_at as measured_at,
      coalesce(pe.source,'manual') as source
    from public.progress_entries pe
    left join public.progress_metric_catalog pm on pm.metric_key=pe.metric_key
    where pe.contact_id=p_contact_id
  ),
  ranked as (
    select
      r.metric_key,r.value_numeric,r.value_boolean,r.unit,r.measured_at,r.source,
      row_number() over(partition by r.metric_key order by r.measured_at desc) as rn_latest
    from readings r
  ),
  latest as (
    select
      r.metric_key,r.value_numeric,r.value_boolean,r.unit,r.measured_at,r.source
    from ranked r
    where r.rn_latest=1
  ),
  period_readings as (
    select
      r.metric_key,r.value_numeric,r.value_boolean,r.unit,r.measured_at,r.source
    from readings r
    where r.measured_at>=now()-(v_days||' days')::interval
  ),
  first_period as (
    select distinct on (r.metric_key)
      r.metric_key,r.value_numeric,r.measured_at
    from period_readings r
    where r.value_numeric is not null
    order by r.metric_key,r.measured_at asc
  ),
  counts as (
    select r.metric_key,count(*)::bigint as reading_count
    from period_readings r
    where r.value_numeric is not null or r.value_boolean is not null
    group by r.metric_key
  )
  select
    e.metric_key,e.label,e.category,e.configured_unit,e.tracking_mode,e.allow_manual,
    e.source_preference,e.display_order,l.value_numeric,l.value_boolean,
    coalesce(l.unit,e.configured_unit),l.measured_at,l.source,
    f.value_numeric,f.measured_at,
    case
      when l.value_numeric is not null and f.value_numeric is not null
        then l.value_numeric-f.value_numeric
      else null
    end,
    coalesce(c.reading_count,0)::bigint
  from effective e
  left join latest l on l.metric_key=e.metric_key
  left join first_period f on f.metric_key=e.metric_key
  left join counts c on c.metric_key=e.metric_key
  where e.tracking_mode<>'hidden'
  order by
    case e.tracking_mode when 'highlighted' then 0 else 1 end,
    e.display_order,e.metric_key;
end;
$$;

-- Protect direct wellness reads consistently while preserving self and staff visibility.
drop policy if exists wellness_score_snapshots_select on public.wellness_score_snapshots;
create policy wellness_score_snapshots_select
on public.wellness_score_snapshots
for select
to authenticated
using (
  exists(
    select 1
    from public.client_access ca
    where ca.user_id=(select auth.uid())
      and ca.contact_id=wellness_score_snapshots.contact_id
      and ca.status='active'
  )
  or (
    private.staff_has_permission((select auth.uid()),'health.private.view')
    and private.family_scope_visible_to_staff(
      wellness_score_snapshots.contact_id,'health_progress',(select auth.uid())
    )
  )
);
