-- Nutrition Targets + Trends/Reports v1.
-- Adds methodology defaults, secure client override management, and coach trend reports.

create table if not exists public.nutrition_methodology_targets (
  id uuid primary key default gen_random_uuid(),
  methodology_id uuid not null references public.nutrition_methodologies(id) on delete cascade,
  nutrient_id uuid not null references public.nutrition_nutrient_catalog(id) on delete cascade,
  minimum_value numeric,
  target_value numeric,
  maximum_value numeric,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(methodology_id,nutrient_id),
  check (minimum_value is null or minimum_value>=0),
  check (target_value is null or target_value>=0),
  check (maximum_value is null or maximum_value>=0)
);

alter table public.nutrition_methodology_targets enable row level security;

drop policy if exists nutrition_methodology_targets_read on public.nutrition_methodology_targets;
create policy nutrition_methodology_targets_read
on public.nutrition_methodology_targets
for select to authenticated
using (
  exists (
    select 1
    from public.nutrition_methodologies m
    where m.id=nutrition_methodology_targets.methodology_id
      and (m.status='published' or private.active_staff_session())
  )
);

drop policy if exists nutrition_methodology_targets_manage on public.nutrition_methodology_targets;
create policy nutrition_methodology_targets_manage
on public.nutrition_methodology_targets
for all to authenticated
using (private.staff_has_permission((select auth.uid()),'plan.override'))
with check (private.staff_has_permission((select auth.uid()),'plan.override'));

create or replace function private.effective_nutrient_targets_for_contact(p_contact_id uuid)
returns table(
  nutrient_key text,
  name text,
  unit text,
  category text,
  default_visible boolean,
  minimum_value numeric,
  target_value numeric,
  maximum_value numeric,
  source text
)
language sql
stable
security definer
set search_path=''
as $$
  with active_methodology as (
    select t.methodology_id
    from public.client_meal_plans cmp
    join public.meal_plan_templates t on t.id=cmp.template_id
    where cmp.contact_id=p_contact_id
      and cmp.status='active'
      and cmp.starts_on<=current_date
      and (cmp.ends_on is null or cmp.ends_on>=current_date)
    order by cmp.starts_on desc,cmp.created_at desc
    limit 1
  ),
  program_targets as (
    select mt.nutrient_id,mt.minimum_value,mt.target_value,mt.maximum_value,'program'::text source,2 priority,mt.updated_at
    from public.nutrition_methodology_targets mt
    join active_methodology am on am.methodology_id=mt.methodology_id
    where mt.active=true
  ),
  client_targets as (
    select ct.nutrient_id,ct.minimum_value,ct.target_value,ct.maximum_value,ct.source,
      case ct.source when 'coach' then 1 when 'program' then 2 when 'member' then 3 else 4 end priority,
      ct.updated_at
    from public.client_nutrient_targets ct
    where ct.contact_id=p_contact_id and ct.active=true
  ),
  ranked as (
    select x.*,row_number() over(partition by nutrient_id order by priority,updated_at desc) rn
    from (
      select * from client_targets
      union all
      select * from program_targets
    ) x
  )
  select c.nutrient_key,c.name,c.unit,c.category,c.default_visible,
         r.minimum_value,r.target_value,r.maximum_value,r.source
  from public.nutrition_nutrient_catalog c
  left join ranked r on r.nutrient_id=c.id and r.rn=1
  where c.active=true
  order by c.default_visible desc,c.sort_order,c.name
$$;

revoke all on function private.effective_nutrient_targets_for_contact(uuid) from public,anon,authenticated;

create or replace function public.admin_get_client_nutrition_targets(p_contact_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if not private.staff_has_permission((select auth.uid()),'health.private.view')
     or not private.staff_can_access_contact((select auth.uid()),p_contact_id) then
    raise exception 'Not authorized to view client nutrition targets';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'nutrient_key',t.nutrient_key,'name',t.name,'unit',t.unit,'category',t.category,
      'default_visible',t.default_visible,'minimum',t.minimum_value,'target',t.target_value,
      'maximum',t.maximum_value,'source',t.source
    ) order by t.default_visible desc,t.name)
    from private.effective_nutrient_targets_for_contact(p_contact_id) t
  ),'[]'::jsonb);
end;
$$;

revoke all on function public.admin_get_client_nutrition_targets(uuid) from public,anon,authenticated;
grant execute on function public.admin_get_client_nutrition_targets(uuid) to authenticated;

create or replace function public.admin_set_client_nutrient_target(
  p_contact_id uuid,
  p_nutrient_key text,
  p_minimum numeric default null,
  p_target numeric default null,
  p_maximum numeric default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_nutrient_id uuid;
  v_id uuid;
begin
  if not private.staff_has_permission((select auth.uid()),'plan.override')
     or not private.staff_can_access_contact((select auth.uid()),p_contact_id) then
    raise exception 'Not authorized to modify client nutrition targets';
  end if;
  if p_minimum is not null and p_minimum<0 then raise exception 'Minimum cannot be negative'; end if;
  if p_target is not null and p_target<0 then raise exception 'Target cannot be negative'; end if;
  if p_maximum is not null and p_maximum<0 then raise exception 'Maximum cannot be negative'; end if;

  select id into v_nutrient_id
  from public.nutrition_nutrient_catalog
  where nutrient_key=p_nutrient_key and active=true;

  if v_nutrient_id is null then raise exception 'Unknown nutrient'; end if;

  insert into public.client_nutrient_targets(
    contact_id,nutrient_id,minimum_value,target_value,maximum_value,source,active,created_by
  ) values (
    p_contact_id,v_nutrient_id,p_minimum,p_target,p_maximum,'coach',true,(select auth.uid())
  )
  on conflict (contact_id,nutrient_id,source)
  do update set
    minimum_value=excluded.minimum_value,
    target_value=excluded.target_value,
    maximum_value=excluded.maximum_value,
    active=true,
    updated_at=now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.admin_set_client_nutrient_target(uuid,text,numeric,numeric,numeric) from public,anon,authenticated;
grant execute on function public.admin_set_client_nutrient_target(uuid,text,numeric,numeric,numeric) to authenticated;

create or replace function public.admin_clear_client_nutrient_target(
  p_contact_id uuid,
  p_nutrient_key text
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_nutrient_id uuid;
begin
  if not private.staff_has_permission((select auth.uid()),'plan.override')
     or not private.staff_can_access_contact((select auth.uid()),p_contact_id) then
    raise exception 'Not authorized to modify client nutrition targets';
  end if;

  select id into v_nutrient_id
  from public.nutrition_nutrient_catalog
  where nutrient_key=p_nutrient_key;

  update public.client_nutrient_targets
  set active=false,updated_at=now()
  where contact_id=p_contact_id
    and nutrient_id=v_nutrient_id
    and source='coach'
    and active=true;

  return found;
end;
$$;

revoke all on function public.admin_clear_client_nutrient_target(uuid,text) from public,anon,authenticated;
grant execute on function public.admin_clear_client_nutrient_target(uuid,text) to authenticated;

create or replace function public.admin_get_client_nutrition_trends(
  p_contact_id uuid,
  p_days integer default 30,
  p_end_date date default current_date
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_days integer:=greatest(1,least(coalesce(p_days,30),90));
  v_end date:=coalesce(p_end_date,current_date);
begin
  if not private.staff_has_permission((select auth.uid()),'health.private.view')
     or not private.staff_can_access_contact((select auth.uid()),p_contact_id) then
    raise exception 'Not authorized to view client nutrition trends';
  end if;

  return jsonb_build_object(
    'days',v_days,
    'end_date',v_end,
    'logged_days',(
      select count(distinct log_date)
      from public.nutrition_diary_items
      where contact_id=p_contact_id
        and log_date between v_end-(v_days-1) and v_end
    ),
    'series',coalesce((
      select jsonb_agg(jsonb_build_object(
        'date',d.log_date,
        'totals',private.nutrition_totals_for_day(p_contact_id,d.log_date)
      ) order by d.log_date)
      from (
        select distinct log_date
        from public.nutrition_diary_items
        where contact_id=p_contact_id
          and log_date between v_end-(v_days-1) and v_end
      ) d
    ),'[]'::jsonb),
    'averages',coalesce((
      with day_totals as (
        select d.log_date,private.nutrition_totals_for_day(p_contact_id,d.log_date) totals
        from (
          select distinct log_date
          from public.nutrition_diary_items
          where contact_id=p_contact_id
            and log_date between v_end-(v_days-1) and v_end
        ) d
      ),
      values as (
        select e.key,(e.value #>> '{}')::numeric amount
        from day_totals dt
        cross join lateral jsonb_each(dt.totals) e
        where jsonb_typeof(e.value)='number'
      ),
      averaged as (
        select key,avg(amount) amount
        from values
        group by key
      )
      select jsonb_object_agg(key,to_jsonb(amount))
      from averaged
    ),'{}'::jsonb)
  );
end;
$$;

revoke all on function public.admin_get_client_nutrition_trends(uuid,integer,date) from public,anon,authenticated;
grant execute on function public.admin_get_client_nutrition_trends(uuid,integer,date) to authenticated;
