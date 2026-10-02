-- Family Hub consent and scoped data-sharing model.
-- Adults must explicitly accept Family Hub membership.
-- Adults control sharing of their own Health & Progress data with another adult.
-- A minor's guardian/head-of-household controls sharing of the minor's Health & Progress
-- with another consenting adult and with the ReVitalized coaching team.

create table if not exists public.household_adult_consents (
  household_id uuid not null references public.households(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','revoked')),
  consented_at timestamptz,
  revoked_at timestamptz,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id,contact_id)
);

create table if not exists public.family_data_sharing_grants (
  household_id uuid not null references public.households(id) on delete cascade,
  subject_contact_id uuid not null references public.contacts(id) on delete cascade,
  granted_by_contact_id uuid not null references public.contacts(id) on delete cascade,
  grantee_type text not null
    check (grantee_type in ('household_member','coaching_team')),
  grantee_contact_id uuid references public.contacts(id) on delete cascade,
  data_scope text not null
    check (data_scope in (
      'health_progress','goals_habits','nutrition_fitness','schedule',
      'progress_photos','all'
    )),
  allowed boolean not null default true,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (
    household_id,subject_contact_id,grantee_type,
    grantee_contact_id,data_scope
  ),
  constraint family_grantee_shape check (
    (grantee_type='household_member' and grantee_contact_id is not null)
    or
    (grantee_type='coaching_team' and grantee_contact_id is null)
  )
);

alter table public.household_adult_consents enable row level security;
alter table public.family_data_sharing_grants enable row level security;
revoke all on public.household_adult_consents from anon,authenticated;
revoke all on public.family_data_sharing_grants from anon,authenticated;

-- The household primary adult is already the account owner/head-of-household.
-- Seed only that adult as accepted. No spouse/other adult is auto-consented.
insert into public.household_adult_consents(
  household_id,contact_id,status,consented_at,updated_at
)
select h.id,h.primary_contact_id,'accepted',coalesce(h.created_at,now()),now()
from public.households h
join public.household_members hm
  on hm.household_id=h.id and hm.contact_id=h.primary_contact_id and hm.status='active'
where h.primary_contact_id is not null
  and (hm.date_of_birth is null or hm.date_of_birth<=current_date-interval '18 years')
on conflict (household_id,contact_id) do nothing;

create or replace function private.family_current_contact()
returns uuid
language sql
stable
security definer
set search_path to 'pg_catalog','public'
as $$
  select p.contact_id
  from public.profiles p
  where p.user_id=auth.uid()
  limit 1;
$$;

create or replace function private.family_contact_is_minor(p_contact_id uuid,p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog','public'
as $$
  select coalesce(
    (
      select hm.date_of_birth is not null
         and hm.date_of_birth>current_date-interval '18 years'
      from public.household_members hm
      where hm.household_id=p_household_id
        and hm.contact_id=p_contact_id
        and hm.status='active'
      limit 1
    ),
    false
  );
$$;

create or replace function private.family_adult_consent_accepted(
  p_household_id uuid,
  p_contact_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog','public'
as $$
  select exists(
    select 1
    from public.household_adult_consents c
    where c.household_id=p_household_id
      and c.contact_id=p_contact_id
      and c.status='accepted'
  );
$$;

create or replace function private.family_guardian_controls_minor(
  p_household_id uuid,
  p_minor_contact_id uuid,
  p_guardian_contact_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog','public'
as $$
  select private.family_contact_is_minor(p_minor_contact_id,p_household_id)
    and exists(
      select 1
      from public.household_members hm
      join public.households h on h.id=hm.household_id
      where hm.household_id=p_household_id
        and hm.contact_id=p_minor_contact_id
        and hm.status='active'
        and (
          hm.guardian_contact_id=p_guardian_contact_id
          or (
            hm.guardian_contact_id is null
            and h.primary_contact_id=p_guardian_contact_id
          )
        )
    );
$$;

create or replace function private.family_scope_visible_to_member(
  p_household_id uuid,
  p_subject_contact_id uuid,
  p_viewer_contact_id uuid,
  p_scope text
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
  select case
    when p_subject_contact_id=p_viewer_contact_id then true
    when private.family_contact_is_minor(p_subject_contact_id,p_household_id)
      and private.family_guardian_controls_minor(
        p_household_id,p_subject_contact_id,p_viewer_contact_id
      ) then true
    else
      private.family_adult_consent_accepted(p_household_id,p_viewer_contact_id)
      and exists(
        select 1
        from public.family_data_sharing_grants g
        where g.household_id=p_household_id
          and g.subject_contact_id=p_subject_contact_id
          and g.grantee_type='household_member'
          and g.grantee_contact_id=p_viewer_contact_id
          and g.allowed
          and g.data_scope in (p_scope,'all')
      )
  end;
$$;

create or replace function private.family_scope_visible_to_staff(
  p_subject_contact_id uuid,
  p_scope text,
  p_staff_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
  select case
    when not private.staff_can_access_contact(p_staff_user_id,p_subject_contact_id)
      then false
    else coalesce((
      select case
        when not private.family_contact_is_minor(hm.contact_id,hm.household_id)
          then true
        else exists(
          select 1
          from public.family_data_sharing_grants g
          where g.household_id=hm.household_id
            and g.subject_contact_id=hm.contact_id
            and g.grantee_type='coaching_team'
            and g.grantee_contact_id is null
            and g.allowed
            and g.data_scope in (p_scope,'all')
        )
      end
      from public.household_members hm
      where hm.contact_id=p_subject_contact_id
        and hm.status='active'
      limit 1
    ), true)
  end;
$$;

create or replace function public.get_my_family_consent_center()
returns table (
  household_id uuid,
  household_member_id uuid,
  contact_id uuid,
  first_name text,
  last_name text,
  relationship_type text,
  is_primary boolean,
  is_minor boolean,
  is_self boolean,
  adult_consent_status text,
  current_user_is_guardian boolean,
  can_manage_subject boolean
)
language plpgsql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  v_contact uuid:=private.family_current_contact();
  v_household uuid;
begin
  select ca.household_id into v_household
  from public.client_access ca
  where ca.user_id=auth.uid()
    and ca.status='active'
    and ca.household_id is not null
  limit 1;

  if v_contact is null or v_household is null then return; end if;

  return query
  select
    hm.household_id,
    hm.id,
    hm.contact_id,
    c.first_name,
    c.last_name,
    hm.relationship_type,
    hm.is_primary,
    private.family_contact_is_minor(hm.contact_id,hm.household_id),
    hm.contact_id=v_contact,
    case
      when private.family_contact_is_minor(hm.contact_id,hm.household_id)
        then 'not_required'
      else coalesce(ac.status,'pending')
    end,
    private.family_guardian_controls_minor(hm.household_id,hm.contact_id,v_contact),
    (
      hm.contact_id=v_contact
      or private.family_guardian_controls_minor(hm.household_id,hm.contact_id,v_contact)
    )
  from public.household_members hm
  join public.contacts c on c.id=hm.contact_id
  left join public.household_adult_consents ac
    on ac.household_id=hm.household_id and ac.contact_id=hm.contact_id
  where hm.household_id=v_household
    and hm.status='active'
  order by hm.is_primary desc,c.first_name,c.last_name;
end;
$$;

create or replace function public.get_my_family_sharing_grants()
returns table (
  subject_contact_id uuid,
  grantee_type text,
  grantee_contact_id uuid,
  data_scope text,
  allowed boolean
)
language sql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
  with me as (
    select private.family_current_contact() as contact_id
  ),
  household as (
    select ca.household_id
    from public.client_access ca
    where ca.user_id=auth.uid()
      and ca.status='active'
      and ca.household_id is not null
    limit 1
  )
  select
    g.subject_contact_id,
    g.grantee_type,
    g.grantee_contact_id,
    g.data_scope,
    g.allowed
  from public.family_data_sharing_grants g
  cross join me
  cross join household h
  where g.household_id=h.household_id
    and (
      g.subject_contact_id=me.contact_id
      or private.family_guardian_controls_minor(
        g.household_id,g.subject_contact_id,me.contact_id
      )
    );
$$;

create or replace function public.accept_my_family_hub_membership()
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  v_contact uuid:=private.family_current_contact();
  v_household uuid;
begin
  select ca.household_id into v_household
  from public.client_access ca
  where ca.user_id=auth.uid()
    and ca.status='active'
    and ca.household_id is not null
  limit 1;

  if v_contact is null or v_household is null then
    raise exception 'Active Family Hub membership is required';
  end if;

  if private.family_contact_is_minor(v_contact,v_household) then
    raise exception 'Adult consent is not required for a minor household member';
  end if;

  insert into public.household_adult_consents(
    household_id,contact_id,status,consented_at,accepted_by_user_id,updated_at
  )
  values(v_household,v_contact,'accepted',now(),auth.uid(),now())
  on conflict (household_id,contact_id) do update set
    status='accepted',
    consented_at=now(),
    revoked_at=null,
    accepted_by_user_id=auth.uid(),
    updated_at=now();

  return true;
end;
$$;

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
  )
  on conflict (
    household_id,subject_contact_id,grantee_type,
    grantee_contact_id,data_scope
  ) do update set
    granted_by_contact_id=excluded.granted_by_contact_id,
    allowed=excluded.allowed,
    granted_at=case when excluded.allowed then now() else family_data_sharing_grants.granted_at end,
    revoked_at=case when excluded.allowed then null else now() end,
    updated_at=now();

  return true;
end;
$$;

-- Basic Family Hub membership: self, accepted adults, and minors the viewer is
-- guardian for or has at least one explicit sharing grant to see.
create or replace view public.my_household
with (security_invoker=true)
as
with viewer as (
  select ca.user_id,ca.household_id,p.contact_id as viewer_contact_id
  from public.client_access ca
  join public.profiles p on p.user_id=ca.user_id
  where ca.user_id=(select auth.uid())
    and ca.status='active'
    and ca.household_id is not null
)
select
  v.user_id,
  hm.household_id,
  hm.id as household_member_id,
  hm.contact_id,
  hm.relationship_type,
  hm.sex,
  hm.is_primary,
  hm.date_of_birth,
  hm.status,
  c.first_name,
  c.last_name,
  c.email
from viewer v
join public.household_members hm on hm.household_id=v.household_id
join public.contacts c on c.id=hm.contact_id
where hm.status='active'
  and (
    hm.contact_id=v.viewer_contact_id
    or (
      not private.family_contact_is_minor(hm.contact_id,hm.household_id)
      and private.family_adult_consent_accepted(
        hm.household_id,hm.contact_id
      )
    )
    or private.family_guardian_controls_minor(
      hm.household_id,hm.contact_id,v.viewer_contact_id
    )
    or exists(
      select 1
      from public.family_data_sharing_grants g
      where g.household_id=hm.household_id
        and g.subject_contact_id=hm.contact_id
        and g.grantee_type='household_member'
        and g.grantee_contact_id=v.viewer_contact_id
        and g.allowed
    )
  );

-- Family progress/wellness views now require scope visibility.
create or replace view public.my_family_progress_dashboard
with (security_invoker=true)
as
with access_rows as (
  select distinct ca.user_id,ca.household_id,p.contact_id as viewer_contact_id
  from public.client_access ca
  join public.profiles p on p.user_id=ca.user_id
  where ca.user_id=(select auth.uid())
    and ca.status='active'
    and ca.household_id is not null
),
family_members as (
  select
    hm.household_id,
    hm.id as household_member_id,
    hm.contact_id,
    hm.relationship_type,
    hm.is_primary,
    hm.date_of_birth,
    c.first_name,
    c.last_name
  from public.household_members hm
  join access_rows ar on ar.household_id=hm.household_id
  join public.contacts c on c.id=hm.contact_id
  where hm.status='active'
    and private.family_scope_visible_to_member(
      hm.household_id,hm.contact_id,ar.viewer_contact_id,'health_progress'
    )
),
latest_score as (
  select distinct on (ws.contact_id,ws.score_type)
    ws.contact_id,ws.score_type,ws.score,ws.methodology_version,ws.calculated_at
  from public.wellness_score_snapshots ws
  join family_members fm on fm.contact_id=ws.contact_id
  order by ws.contact_id,ws.score_type,ws.calculated_at desc
),
achievement_counts as (
  select ma.contact_id,count(*)::integer as achievement_count,max(ma.unlocked_at) as latest_achievement_at
  from public.member_achievements ma
  join family_members fm on fm.contact_id=ma.contact_id
  group by ma.contact_id
),
goal_counts as (
  select g.contact_id,
    count(*) filter(where g.status='active')::integer as active_goals,
    count(*) filter(where g.status='completed')::integer as completed_goals
  from public.client_goals g
  join family_members fm on fm.contact_id=g.contact_id
  group by g.contact_id
),
challenge_counts as (
  select ce.contact_id,
    count(*) filter(where ce.status='active')::integer as active_challenges,
    count(*) filter(where ce.status='completed')::integer as completed_challenges,
    coalesce(sum(ce.points_earned),0)::integer as challenge_points
  from public.challenge_enrollments ce
  join family_members fm on fm.contact_id=ce.contact_id
  group by ce.contact_id
)
select
  fm.household_id,
  fm.household_member_id,
  fm.contact_id,
  fm.first_name,
  fm.last_name,
  fm.relationship_type,
  fm.is_primary,
  fm.date_of_birth,
  ls.score_type,
  ls.score as health_score,
  ls.methodology_version as health_score_methodology_version,
  ls.calculated_at as health_score_calculated_at,
  coalesce(gc.active_goals,0) as active_goals,
  coalesce(gc.completed_goals,0) as completed_goals,
  coalesce(cc.active_challenges,0) as active_challenges,
  coalesce(cc.completed_challenges,0) as completed_challenges,
  coalesce(cc.challenge_points,0) as challenge_points,
  coalesce(ac.achievement_count,0) as achievement_count,
  ac.latest_achievement_at,
  round(avg(ls.score) over(partition by fm.household_id,ls.score_type),2)
    as household_average_health_score
from family_members fm
left join latest_score ls on ls.contact_id=fm.contact_id
left join achievement_counts ac on ac.contact_id=fm.contact_id
left join goal_counts gc on gc.contact_id=fm.contact_id
left join challenge_counts cc on cc.contact_id=fm.contact_id
order by fm.is_primary desc,fm.first_name,fm.last_name;

create or replace view public.my_family_wellness_summary
with (security_invoker=true)
as
with viewer as (
  select distinct ca.household_id,p.contact_id as viewer_contact_id
  from public.client_access ca
  join public.profiles p on p.user_id=ca.user_id
  where ca.user_id=(select auth.uid())
    and ca.status='active'
    and ca.household_id is not null
),
visible_members as (
  select hm.*
  from public.household_members hm
  join viewer v on v.household_id=hm.household_id
  where hm.status='active'
    and private.family_scope_visible_to_member(
      hm.household_id,hm.contact_id,v.viewer_contact_id,'health_progress'
    )
),
latest_scores as (
  select distinct on (ws.contact_id,ws.score_type)
    ws.contact_id,ws.household_id,ws.score_type,ws.score,
    ws.methodology_version,ws.components,ws.calculated_at
  from public.wellness_score_snapshots ws
  join visible_members vm on vm.contact_id=ws.contact_id
  order by ws.contact_id,ws.score_type,ws.calculated_at desc
)
select
  hm.household_id,
  hm.id as household_member_id,
  hm.contact_id,
  c.first_name,
  c.last_name,
  hm.relationship_type,
  hm.is_primary,
  ls.score_type,
  ls.score,
  ls.methodology_version,
  ls.components,
  ls.calculated_at,
  round(avg(ls.score) over(partition by hm.household_id,ls.score_type),2)
    as household_average_score
from visible_members hm
join public.contacts c on c.id=hm.contact_id
left join latest_scores ls on ls.contact_id=hm.contact_id
order by hm.is_primary desc,c.first_name,c.last_name;

-- Re-protect coach Health review/configuration for minors behind guardian consent.
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
    select h.metric_key,h.label,h.category,h.unit,
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
    select ho.metric_key,ho.value_numeric,ho.value_boolean,ho.unit,
      ho.observed_at as measured_at,coalesce(ho.provider_key,'connected') as source
    from public.health_observations ho
    where ho.contact_id=p_contact_id
    union all
    select pe.metric_key,pe.value_numeric,pe.value_boolean,pm.unit,
      pe.recorded_at as measured_at,coalesce(pe.source,'manual') as source
    from public.progress_entries pe
    left join public.progress_metric_catalog pm on pm.metric_key=pe.metric_key
    where pe.contact_id=p_contact_id
  ),
  ranked as (
    select r.*,row_number() over(partition by r.metric_key order by r.measured_at desc) as rn_latest
    from readings r
  ),
  latest as (
    select metric_key,value_numeric,value_boolean,unit,measured_at,source
    from ranked where rn_latest=1
  ),
  period_readings as (
    select * from readings
    where measured_at>=now()-(v_days||' days')::interval
  ),
  first_period as (
    select distinct on(metric_key) metric_key,value_numeric,measured_at
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
  select e.metric_key,e.label,e.category,e.unit,e.tracking_mode,e.allow_manual,
    e.source_preference,e.display_order,l.value_numeric,l.value_boolean,
    coalesce(l.unit,e.unit),l.measured_at,l.source,f.value_numeric,f.measured_at,
    case when l.value_numeric is not null and f.value_numeric is not null
      then l.value_numeric-f.value_numeric else null end,
    coalesce(c.reading_count,0)::bigint
  from effective e
  left join latest l on l.metric_key=e.metric_key
  left join first_period f on f.metric_key=e.metric_key
  left join counts c on c.metric_key=e.metric_key
  where e.tracking_mode<>'hidden'
  order by case e.tracking_mode when 'highlighted' then 0 else 1 end,
    e.display_order,e.metric_key;
end;
$$;

create or replace function public.admin_get_client_health_metric_trend(
  p_contact_id uuid,p_metric_key text,p_days integer default 30
)
returns table (
  measured_at timestamptz,value_numeric numeric,value_boolean boolean,
  unit text,source text
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
     or not private.family_scope_visible_to_staff(
       p_contact_id,'health_progress',auth.uid()
     ) then
    raise exception 'Guardian/client consent and staff access are required' using errcode='42501';
  end if;

  return query
  select * from (
    select ho.observed_at,ho.value_numeric,ho.value_boolean,ho.unit,
      coalesce(ho.provider_key,'connected')
    from public.health_observations ho
    where ho.contact_id=p_contact_id
      and ho.metric_key=p_metric_key
      and ho.observed_at>=now()-(v_days||' days')::interval
    union all
    select pe.recorded_at,pe.value_numeric,pe.value_boolean,pm.unit,
      coalesce(pe.source,'manual')
    from public.progress_entries pe
    left join public.progress_metric_catalog pm on pm.metric_key=pe.metric_key
    where pe.contact_id=p_contact_id
      and pe.metric_key=p_metric_key
      and pe.recorded_at>=now()-(v_days||' days')::interval
  ) x
  order by x.observed_at asc;
end;
$$;

revoke all on function public.get_my_family_consent_center() from public,anon;
revoke all on function public.get_my_family_sharing_grants() from public,anon;
revoke all on function public.accept_my_family_hub_membership() from public,anon;
revoke all on function public.set_my_family_data_sharing(uuid,text,uuid,text,boolean) from public,anon;
grant execute on function public.get_my_family_consent_center() to authenticated;
grant execute on function public.get_my_family_sharing_grants() to authenticated;
grant execute on function public.accept_my_family_hub_membership() to authenticated;
grant execute on function public.set_my_family_data_sharing(uuid,text,uuid,text,boolean) to authenticated;
