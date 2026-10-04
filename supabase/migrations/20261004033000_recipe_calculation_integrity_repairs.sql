-- Recipe calculation repair: skip JSON null/non-numeric nutrients and clear stale
-- calculation state for ingredients that cannot participate in the current calculation.

create or replace function public.recalculate_recipe_nutrition(p_recipe_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_recipe public.recipes%rowtype;
  v_total jsonb := '{}'::jsonb;
  v_per_serving jsonb := '{}'::jsonb;
  v_missing jsonb := '[]'::jsonb;
  v_used integer := 0;
  v_missing_count integer := 0;
  v_now timestamptz := now();
  r record;
  n record;
  v_factor numeric;
  v_servings numeric;
  v_amount numeric;
  v_numeric_count integer;
  v_basis text;
begin
  if not private.staff_has_permission((select auth.uid()), 'learning.manage') then
    raise exception 'Not authorized to calculate recipe nutrition';
  end if;

  select * into v_recipe
  from public.recipes
  where id = p_recipe_id;

  if not found then
    raise exception 'Recipe not found';
  end if;

  v_servings := nullif(v_recipe.servings,0);

  for r in
    select
      ri.id,
      ri.ingredient,
      ri.quantity,
      ri.unit,
      ri.weight_grams,
      ri.food_id,
      f.name as food_name,
      f.nutrition,
      f.serving_size,
      f.serving_unit,
      f.grams_per_serving,
      f.data_source,
      f.source_record_id,
      f.source_verified
    from public.recipe_ingredients ri
    left join public.food_catalog f on f.id = ri.food_id
    where ri.recipe_id = p_recipe_id
    order by ri.sort_order,ri.id
  loop
    v_factor := null;
    v_basis := null;
    v_numeric_count := 0;

    if r.food_id is null or r.nutrition is null or r.nutrition = '{}'::jsonb then
      update public.recipe_ingredients
      set calculation_basis=null,
          nutrition_multiplier=null,
          nutrition_snapshot='{}'::jsonb
      where id=r.id;

      v_missing := v_missing || jsonb_build_array(jsonb_build_object(
        'ingredient_id',r.id,
        'ingredient',r.ingredient,
        'reason',case when r.food_id is null then 'food_not_linked' else 'food_nutrition_missing' end
      ));
      v_missing_count := v_missing_count + 1;
      continue;
    end if;

    if r.weight_grams is not null and r.weight_grams > 0
       and r.grams_per_serving is not null and r.grams_per_serving > 0 then
      v_factor := r.weight_grams / r.grams_per_serving;
      v_basis := 'weight_grams';
    elsif r.quantity is not null and r.quantity > 0
       and r.serving_size is not null and r.serving_size > 0
       and nullif(lower(trim(coalesce(r.unit,''))),'') = nullif(lower(trim(coalesce(r.serving_unit,''))),'') then
      v_factor := r.quantity / r.serving_size;
      v_basis := 'serving_unit';
    elsif r.quantity is not null and r.quantity > 0
       and lower(trim(coalesce(r.unit,''))) in ('serving','servings') then
      v_factor := r.quantity;
      v_basis := 'servings';
    else
      update public.recipe_ingredients
      set calculation_basis=null,
          nutrition_multiplier=null,
          nutrition_snapshot='{}'::jsonb
      where id=r.id;

      v_missing := v_missing || jsonb_build_array(jsonb_build_object(
        'ingredient_id',r.id,
        'ingredient',r.ingredient,
        'food_id',r.food_id,
        'reason','serving_conversion_unavailable'
      ));
      v_missing_count := v_missing_count + 1;
      continue;
    end if;

    -- Only JSON numbers participate. JSON null, strings, booleans, arrays and
    -- objects are ignored and cannot null-out a previously accumulated total.
    for n in
      select key,value
      from jsonb_each(r.nutrition)
      where jsonb_typeof(value)='number'
    loop
      v_amount := (n.value #>> '{}')::numeric * v_factor;
      v_total := jsonb_set(
        v_total,
        array[n.key],
        to_jsonb(coalesce((v_total->>n.key)::numeric,0) + v_amount),
        true
      );
      v_numeric_count := v_numeric_count + 1;
    end loop;

    if v_numeric_count = 0 then
      update public.recipe_ingredients
      set calculation_basis=null,
          nutrition_multiplier=null,
          nutrition_snapshot='{}'::jsonb
      where id=r.id;

      v_missing := v_missing || jsonb_build_array(jsonb_build_object(
        'ingredient_id',r.id,
        'ingredient',r.ingredient,
        'food_id',r.food_id,
        'reason','food_nutrition_has_no_numeric_values'
      ));
      v_missing_count := v_missing_count + 1;
      continue;
    end if;

    update public.recipe_ingredients
    set calculation_basis=v_basis,
        nutrition_multiplier=v_factor,
        nutrition_snapshot=jsonb_build_object(
          'food_id',r.food_id,
          'food_name',r.food_name,
          'data_source',r.data_source,
          'source_record_id',r.source_record_id,
          'source_verified',r.source_verified,
          'food_nutrition',r.nutrition,
          'factor',v_factor,
          'captured_at',v_now
        )
    where id=r.id;

    v_used := v_used + 1;
  end loop;

  if v_servings is not null then
    for n in
      select key,value
      from jsonb_each(v_total)
      where jsonb_typeof(value)='number'
    loop
      v_per_serving := jsonb_set(
        v_per_serving,
        array[n.key],
        to_jsonb(round(((n.value #>> '{}')::numeric / v_servings),6)),
        true
      );
    end loop;
  else
    v_per_serving := v_total;
  end if;

  update public.recipes
  set nutrition=v_per_serving,
      nutrition_calculated_at=v_now,
      nutrition_calculation_meta=jsonb_build_object(
        'calculation_version',2,
        'basis','ingredient_food_catalog',
        'servings',v_recipe.servings,
        'ingredients_used',v_used,
        'ingredients_incomplete',v_missing_count,
        'complete',v_missing_count=0,
        'recipe_total',v_total,
        'missing',v_missing,
        'calculated_at',v_now
      ),
      updated_at=v_now
  where id=p_recipe_id;

  return jsonb_build_object(
    'recipe_id',p_recipe_id,
    'nutrition_per_serving',v_per_serving,
    'recipe_total',v_total,
    'servings',v_recipe.servings,
    'ingredients_used',v_used,
    'ingredients_incomplete',v_missing_count,
    'complete',v_missing_count=0,
    'missing',v_missing,
    'calculated_at',v_now
  );
end;
$$;

revoke all on function public.recalculate_recipe_nutrition(uuid) from public;
grant execute on function public.recalculate_recipe_nutrition(uuid) to authenticated;
