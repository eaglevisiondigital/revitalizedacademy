-- ReVitalized Nutrition Diary + Daily Targets v1.
-- Member food/recipe logging, daily nutrient totals, effective targets and trend payloads.

create or replace function private.current_member_access()
returns table(contact_id uuid,membership_id uuid)
language sql
stable
security definer
set search_path=''
as $$
  select ca.contact_id,ca.membership_id
  from public.client_access ca
  join public.client_memberships cm on cm.id=ca.membership_id
  join public.journey_enrollment_activations a on a.id=cm.activation_id
  where ca.user_id=(select auth.uid())
    and ca.status='active'
    and ca.needs_onboarding_claim=false
    and cm.status='active' and a.access_status='active'
    and private.enrollment_gates_complete(a)
  order by ca.activated_at desc nulls last,ca.updated_at desc
  limit 1
$$;

revoke all on function private.current_member_access() from public,anon,authenticated;
grant execute on function private.current_member_access() to authenticated;

create or replace function private.nutrition_totals_for_day(p_contact_id uuid,p_date date)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  with numeric_values as (
    select e.key,(e.value #>> '{}')::numeric as amount
    from public.nutrition_diary_items d
    cross join lateral jsonb_each(case when jsonb_typeof(d.nutrient_snapshot)='object' then d.nutrient_snapshot else '{}'::jsonb end) e
    where d.contact_id=p_contact_id
      and d.log_date=p_date
      and jsonb_typeof(e.value)='number'
  ), summed as (
    select key,sum(amount) amount
    from numeric_values
    group by key
  )
  select coalesce(jsonb_object_agg(key,to_jsonb(amount)),'{}'::jsonb)
  from summed
$$;

revoke all on function private.nutrition_totals_for_day(uuid,date) from public,anon,authenticated;

create or replace function public.get_my_nutrition_sources()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_access record;
begin
  select * into v_access from private.current_member_access();
  if v_access.contact_id is null or not private.full_member_access() then
    raise exception 'Active member access required';
  end if;

  return jsonb_build_object(
    'foods',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',f.id,'name',f.name,'brand',f.brand,'category',f.category,
        'serving_size',f.serving_size,'serving_unit',f.serving_unit,
        'grams_per_serving',f.grams_per_serving,'image_url',f.image_url,
        'data_source',f.data_source,'source_verified',f.source_verified,
        'nutrition',f.nutrition
      ) order by f.name)
      from public.food_catalog f
      join public.nutrition_methodologies m on m.id=f.methodology_id
      where f.active=true and m.status='published'
    ),'[]'::jsonb),
    'recipes',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',r.id,'title',r.title,'meal_type',r.meal_type,'servings',r.servings,
        'image_url',r.image_url,'nutrition',r.nutrition,
        'nutrition_calculated_at',r.nutrition_calculated_at
      ) order by r.title)
      from public.recipes r
      join public.nutrition_methodologies m on m.id=r.methodology_id
      where r.status='published' and m.status='published'
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_my_nutrition_sources() from public,anon,authenticated;
grant execute on function public.get_my_nutrition_sources() to authenticated;

create or replace function public.log_my_nutrition_item(
  p_log_date date,
  p_meal_slot text,
  p_source_type text,
  p_source_id uuid,
  p_quantity numeric default 1,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_access record;
  v_snapshot jsonb;
  v_scaled jsonb:='{}'::jsonb;
  v_label text;
  v_food_id uuid;
  v_recipe_id uuid;
  v_serving_quantity numeric;
  v_serving_unit text;
  v_id uuid;
  n record;
begin
  select * into v_access from private.current_member_access();
  if v_access.contact_id is null or not private.full_member_access() then
    raise exception 'Active member access required';
  end if;
  if p_quantity is null or p_quantity<=0 or p_quantity::text in ('NaN','Infinity','-Infinity') then raise exception 'Quantity must be greater than zero'; end if;
  if p_meal_slot is null or p_meal_slot not in ('breakfast','lunch','dinner','snack','supplement','water','other') then
    raise exception 'Unsupported meal slot';
  end if;

  if p_source_type='food' then
    select f.id,f.name,f.nutrition,coalesce(f.serving_size,1),coalesce(f.serving_unit,'serving')
      into v_food_id,v_label,v_snapshot,v_serving_quantity,v_serving_unit
    from public.food_catalog f
    join public.nutrition_methodologies m on m.id=f.methodology_id
    where f.id=p_source_id and f.active=true and m.status='published';
  elsif p_source_type='recipe' then
    select r.id,r.title,r.nutrition,1,'serving'
      into v_recipe_id,v_label,v_snapshot,v_serving_quantity,v_serving_unit
    from public.recipes r
    join public.nutrition_methodologies m on m.id=r.methodology_id
    where r.id=p_source_id and r.status='published' and m.status='published';
  else
    raise exception 'Unsupported nutrition source type';
  end if;

  if v_label is null then raise exception 'Nutrition source is unavailable'; end if;
  v_snapshot:=case when jsonb_typeof(v_snapshot)='object' then v_snapshot else '{}'::jsonb end;

  for n in select key,value from jsonb_each(v_snapshot) where jsonb_typeof(value)='number'
  loop
    v_scaled:=jsonb_set(v_scaled,array[n.key],to_jsonb(round(((n.value #>> '{}')::numeric*p_quantity),6)),true);
  end loop;

  insert into public.nutrition_diary_items(
    contact_id,membership_id,log_date,meal_slot,food_id,recipe_id,custom_label,
    quantity,serving_quantity,serving_unit,nutrient_snapshot,source,note,created_by
  ) values (
    v_access.contact_id,v_access.membership_id,coalesce(p_log_date,current_date),p_meal_slot,
    v_food_id,v_recipe_id,v_label,p_quantity,v_serving_quantity,v_serving_unit,
    v_scaled,'member',nullif(trim(p_note),''),(select auth.uid())
  ) returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.log_my_nutrition_item(date,text,text,uuid,numeric,text) from public,anon,authenticated;
grant execute on function public.log_my_nutrition_item(date,text,text,uuid,numeric,text) to authenticated;

create or replace function public.delete_my_nutrition_item(p_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_access record;
begin
  select * into v_access from private.current_member_access();
  if v_access.contact_id is null or not private.full_member_access() then
    raise exception 'Active member access required';
  end if;

  delete from public.nutrition_diary_items
  where id=p_item_id and contact_id=v_access.contact_id;

  return found;
end;
$$;

revoke all on function public.delete_my_nutrition_item(uuid) from public,anon,authenticated;
grant execute on function public.delete_my_nutrition_item(uuid) to authenticated;

create or replace function public.get_my_nutrition_day(p_log_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_access record;
  v_date date:=coalesce(p_log_date,current_date);
begin
  select * into v_access from private.current_member_access();
  if v_access.contact_id is null or not private.full_member_access() then
    raise exception 'Active member access required';
  end if;

  return jsonb_build_object(
    'date',v_date,
    'totals',private.nutrition_totals_for_day(v_access.contact_id,v_date),
    'items',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,'meal_slot',d.meal_slot,'label',coalesce(d.custom_label,f.name,r.title,'Nutrition item'),
        'brand',f.brand,'food_id',d.food_id,'recipe_id',d.recipe_id,'quantity',d.quantity,
        'serving_quantity',d.serving_quantity,'serving_unit',d.serving_unit,
        'nutrients',d.nutrient_snapshot,'source',d.source,'note',d.note,'created_at',d.created_at
      ) order by
        case d.meal_slot when 'breakfast' then 1 when 'lunch' then 2 when 'dinner' then 3
          when 'snack' then 4 when 'supplement' then 5 when 'water' then 6 else 7 end,
        d.created_at)
      from public.nutrition_diary_items d
      left join public.food_catalog f on f.id=d.food_id
      left join public.recipes r on r.id=d.recipe_id
      where d.contact_id=v_access.contact_id and d.log_date=v_date
    ),'[]'::jsonb),
    'targets',coalesce((
      with ranked as (
        select c.nutrient_key,c.name,c.unit,c.category,c.default_visible,
               t.minimum_value,t.target_value,t.maximum_value,t.source,
               row_number() over(partition by c.id order by
                 case t.source when 'coach' then 1 when 'program' then 2 when 'member' then 3 else 4 end,
                 t.updated_at desc) rn
        from public.nutrition_nutrient_catalog c
        left join public.client_nutrient_targets t
          on t.nutrient_id=c.id and t.contact_id=v_access.contact_id and t.active=true
        where c.active=true
      )
      select jsonb_agg(jsonb_build_object(
        'nutrient_key',nutrient_key,'name',name,'unit',unit,'category',category,
        'default_visible',default_visible,'minimum',minimum_value,'target',target_value,
        'maximum',maximum_value,'source',source
      ) order by default_visible desc,nutrient_key)
      from ranked where rn=1
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_my_nutrition_day(date) from public,anon,authenticated;
grant execute on function public.get_my_nutrition_day(date) to authenticated;

create or replace function public.get_my_nutrition_trends(p_days integer default 7,p_end_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_access record;
  v_days integer:=greatest(1,least(coalesce(p_days,7),90));
begin
  select * into v_access from private.current_member_access();
  if v_access.contact_id is null or not private.full_member_access() then
    raise exception 'Active member access required';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object('date',d,'totals',private.nutrition_totals_for_day(v_access.contact_id,d)) order by d)
    from (select distinct log_date d from public.nutrition_diary_items
          where contact_id=v_access.contact_id
            and log_date between coalesce(p_end_date,current_date)-(v_days-1) and coalesce(p_end_date,current_date)) logged_days
  ),'[]'::jsonb);
end;
$$;

revoke all on function public.get_my_nutrition_trends(integer,date) from public,anon,authenticated;
grant execute on function public.get_my_nutrition_trends(integer,date) to authenticated;

create or replace function public.admin_get_client_nutrition_day(p_contact_id uuid,p_log_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if not private.staff_has_permission((select auth.uid()),'health.private.view')
     or not private.staff_can_access_contact((select auth.uid()),p_contact_id) then
    raise exception 'Not authorized to view client nutrition';
  end if;

  return jsonb_build_object(
    'date',coalesce(p_log_date,current_date),
    'totals',private.nutrition_totals_for_day(p_contact_id,coalesce(p_log_date,current_date)),
    'items',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,'meal_slot',d.meal_slot,'label',coalesce(d.custom_label,f.name,r.title,'Nutrition item'),
        'brand',f.brand,'quantity',d.quantity,'serving_quantity',d.serving_quantity,
        'serving_unit',d.serving_unit,'nutrients',d.nutrient_snapshot,'source',d.source,'note',d.note
      ) order by d.created_at)
      from public.nutrition_diary_items d
      left join public.food_catalog f on f.id=d.food_id
      left join public.recipes r on r.id=d.recipe_id
      where d.contact_id=p_contact_id and d.log_date=coalesce(p_log_date,current_date)
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_get_client_nutrition_day(uuid,date) from public,anon,authenticated;
grant execute on function public.admin_get_client_nutrition_day(uuid,date) to authenticated;

-- These tables predate the lifecycle-aware diary RPCs. Preserve their existing
-- private staff/scope and target-write policies, while closing direct member
-- reads/writes when the paid-access gate is not satisfied for this contact.
create policy nutrition_diary_paid_access
on public.nutrition_diary_items as restrictive for all to authenticated
using ((select private.active_staff_session())
       or contact_id=(select contact_id from private.current_member_access()))
with check ((select private.active_staff_session())
       or contact_id=(select contact_id from private.current_member_access()));

create policy nutrition_targets_paid_access
on public.client_nutrient_targets as restrictive for all to authenticated
using ((select private.active_staff_session())
       or contact_id=(select contact_id from private.current_member_access()))
with check ((select private.active_staff_session())
       or contact_id=(select contact_id from private.current_member_access()));
