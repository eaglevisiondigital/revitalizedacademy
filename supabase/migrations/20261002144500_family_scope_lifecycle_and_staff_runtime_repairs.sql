-- Repair expanded Family Hub security findings R1/R2.
-- R1: raw household rows must never be exposed merely because the subject adult consented.
-- R2: owner-executed family views must honor the existing full-member lifecycle gate.

drop policy if exists household_members_staff_or_member_select on public.household_members;
create policy household_members_staff_or_member_select
on public.household_members
for select
to authenticated
using (
  (
    private.active_staff_session()
    and private.staff_can_access_contact(
      (select auth.uid()),
      household_members.contact_id
    )
  )
  or (
    private.full_member_access()
    and household_members.contact_id=private.family_current_contact()
  )
  or (
    private.full_member_access()
    and private.family_guardian_controls_minor(
      household_members.household_id,
      household_members.contact_id,
      private.family_current_contact()
    )
  )
);

create or replace view public.my_household
with (security_invoker=false)
as
with viewer as (
  select
    ca.user_id,
    ca.household_id,
    p.contact_id as viewer_contact_id
  from public.client_access ca
  join public.profiles p on p.user_id=ca.user_id
  where ca.user_id=(select auth.uid())
    and ca.status='active'
    and ca.household_id is not null
    and private.full_member_access()
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

create or replace view public.my_family_progress_dashboard
with (security_invoker=false)
as
with access_rows as (
  select distinct
    ca.user_id,
    ca.household_id,
    p.contact_id as viewer_contact_id
  from public.client_access ca
  join public.profiles p on p.user_id=ca.user_id
  where ca.user_id=(select auth.uid())
    and ca.status='active'
    and ca.household_id is not null
    and private.full_member_access()
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
  select
    ma.contact_id,
    count(*)::integer as achievement_count,
    max(ma.unlocked_at) as latest_achievement_at
  from public.member_achievements ma
  join family_members fm on fm.contact_id=ma.contact_id
  group by ma.contact_id
),
goal_counts as (
  select
    g.contact_id,
    count(*) filter(where g.status='active')::integer as active_goals,
    count(*) filter(where g.status='completed')::integer as completed_goals
  from public.client_goals g
  join family_members fm on fm.contact_id=g.contact_id
  group by g.contact_id
),
challenge_counts as (
  select
    ce.contact_id,
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
with (security_invoker=false)
as
with viewer as (
  select distinct
    ca.household_id,
    p.contact_id as viewer_contact_id
  from public.client_access ca
  join public.profiles p on p.user_id=ca.user_id
  where ca.user_id=(select auth.uid())
    and ca.status='active'
    and ca.household_id is not null
    and private.full_member_access()
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
    ws.contact_id,
    ws.household_id,
    ws.score_type,
    ws.score,
    ws.methodology_version,
    ws.components,
    ws.calculated_at
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

create or replace view public.my_family_dashboard_summary_v2
with (security_invoker=false)
as
select
  f.household_id,
  max(f.household_average_health_score) as family_health_score,
  count(*)::integer as family_member_count,
  sum(f.active_goals)::integer as active_goals,
  sum(f.completed_goals)::integer as completed_goals,
  sum(f.active_challenges)::integer as active_challenges,
  sum(f.completed_challenges)::integer as completed_challenges,
  sum(f.challenge_points)::integer as challenge_points,
  sum(f.achievement_count)::integer as achievements_unlocked,
  max(f.latest_achievement_at) as latest_achievement_at
from public.my_family_progress_dashboard f
where private.full_member_access()
group by f.household_id;
