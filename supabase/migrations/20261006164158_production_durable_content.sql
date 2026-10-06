-- Content-only release. Does not migrate client data, roles, grants or staging settings.
-- Preserve current staff permission defaults/overrides; independently require active approved staff.
create or replace function private.can_author_durable_content()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists (
   select 1 from public.staff_access s
   where s.user_id=(select auth.uid()) and s.status='active'
     and (s.role <> 'coach' or s.onboarding_status='complete')
     and private.staff_has_permission(s.user_id,'learning.manage')
 );
$$;
revoke all on function private.can_author_durable_content() from public, anon;
grant execute on function private.can_author_durable_content() to authenticated;

-- Content Builder v1: media, macros, exercise classification.
-- Adds staff-manageable nutrition and fitness metadata without changing existing assignments.

alter table public.recipes
  add column if not exists image_url text,
  add column if not exists image_alt text;

alter table public.food_catalog
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists nutrition jsonb not null default '{}'::jsonb;

alter table public.exercise_catalog
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists primary_muscle_group text,
  add column if not exists secondary_muscle_groups jsonb not null default '[]'::jsonb,
  add column if not exists movement_type text,
  add column if not exists low_impact boolean not null default false;

alter table public.workout_templates
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists workout_type text,
  add column if not exists muscle_groups jsonb not null default '[]'::jsonb,
  add column if not exists equipment jsonb not null default '[]'::jsonb;

alter table public.fitness_programs
  add column if not exists image_url text,
  add column if not exists image_alt text;

comment on column public.recipes.nutrition is
  'Per-serving nutrition/macros JSON. Intended keys include calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg.';

comment on column public.food_catalog.nutrition is
  'Optional per-serving ingredient nutrition/macros JSON using the same macro keys as recipes.';

comment on column public.exercise_catalog.primary_muscle_group is
  'Primary coach-facing classification such as chest, back, shoulders, biceps, triceps, core, glutes, quadriceps, hamstrings, calves, full_body.';

comment on column public.exercise_catalog.secondary_muscle_groups is
  'Optional JSON string array of additional muscle groups.';

comment on column public.exercise_catalog.movement_type is
  'Coach-facing exercise type such as strength, cardio, mobility, hiit, bodyweight, bands, recovery, aquatic.';

comment on column public.workout_templates.workout_type is
  'Coach-facing workout classification such as strength, cardio, hiit, mobility, recovery, aquatic, circuit.';

comment on column public.workout_templates.muscle_groups is
  'JSON string array describing workout muscle-group focus.';

comment on column public.workout_templates.equipment is
  'JSON string array of equipment used in the workout.';

create table if not exists public.nutrition_nutrient_catalog (
  id uuid primary key default gen_random_uuid(),
  nutrient_key text not null unique,
  name text not null,
  category text not null,
  unit text not null,
  default_visible boolean not null default false,
  supports_min_target boolean not null default true,
  supports_max_target boolean not null default true,
  official_target_available boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 1000,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nutrition_nutrient_catalog enable row level security;

insert into public.nutrition_nutrient_catalog
  (nutrient_key,name,category,unit,default_visible,sort_order)
values
  ('energy_kcal','Calories','energy','kcal',true,1),
  ('water_g','Water','general','g',true,2),
  ('protein_g','Protein','protein','g',true,3),
  ('carbohydrate_g','Carbohydrates','carbohydrates','g',true,4),
  ('net_carbs_g','Net Carbs','carbohydrates','g',false,5),
  ('fiber_g','Fiber','carbohydrates','g',true,6),
  ('soluble_fiber_g','Soluble Fiber','carbohydrates','g',false,7),
  ('insoluble_fiber_g','Insoluble Fiber','carbohydrates','g',false,8),
  ('starch_g','Starch','carbohydrates','g',false,9),
  ('sugars_g','Sugars','carbohydrates','g',true,10),
  ('added_sugars_g','Added Sugars','carbohydrates','g',false,11),
  ('sugar_alcohol_g','Sugar Alcohols','carbohydrates','g',false,12),
  ('fructose_g','Fructose','carbohydrates','g',false,13),
  ('galactose_g','Galactose','carbohydrates','g',false,14),
  ('glucose_g','Glucose','carbohydrates','g',false,15),
  ('lactose_g','Lactose','carbohydrates','g',false,16),
  ('maltose_g','Maltose','carbohydrates','g',false,17),
  ('sucrose_g','Sucrose','carbohydrates','g',false,18),
  ('fat_g','Total Fat','lipids','g',true,19),
  ('saturated_fat_g','Saturated Fat','lipids','g',true,20),
  ('monounsaturated_fat_g','Monounsaturated Fat','lipids','g',false,21),
  ('polyunsaturated_fat_g','Polyunsaturated Fat','lipids','g',false,22),
  ('trans_fat_g','Trans Fat','lipids','g',false,23),
  ('cholesterol_mg','Cholesterol','lipids','mg',true,24),
  ('omega3_g','Omega-3','lipids','g',false,25),
  ('omega3_ala_g','Omega-3 ALA','lipids','g',false,26),
  ('omega3_epa_g','Omega-3 EPA','lipids','g',false,27),
  ('omega3_dha_g','Omega-3 DHA','lipids','g',false,28),
  ('omega3_dpa_g','Omega-3 DPA','lipids','g',false,29),
  ('omega6_g','Omega-6','lipids','g',false,30),
  ('omega6_la_g','Omega-6 LA','lipids','g',false,31),
  ('omega6_aa_g','Omega-6 AA','lipids','g',false,32),
  ('omega6_gla_g','Omega-6 GLA','lipids','g',false,33),
  ('omega6_dgla_g','Omega-6 DGLA','lipids','g',false,34),
  ('phytosterols_mg','Phytosterols','lipids','mg',false,35),
  ('campesterol_mg','Campesterol','lipids','mg',false,36),
  ('beta_sitosterol_mg','Beta-Sitosterol','lipids','mg',false,37),
  ('stigmasterol_mg','Stigmasterol','lipids','mg',false,38),
  ('alanine_g','Alanine','amino_acids','g',false,39),
  ('arginine_g','Arginine','amino_acids','g',false,40),
  ('aspartic_acid_g','Aspartic Acid','amino_acids','g',false,41),
  ('cystine_g','Cystine','amino_acids','g',false,42),
  ('glutamic_acid_g','Glutamic Acid','amino_acids','g',false,43),
  ('glycine_g','Glycine','amino_acids','g',false,44),
  ('histidine_g','Histidine','amino_acids','g',false,45),
  ('hydroxyproline_g','Hydroxyproline','amino_acids','g',false,46),
  ('isoleucine_g','Isoleucine','amino_acids','g',false,47),
  ('leucine_g','Leucine','amino_acids','g',false,48),
  ('lysine_g','Lysine','amino_acids','g',false,49),
  ('methionine_g','Methionine','amino_acids','g',false,50),
  ('phenylalanine_g','Phenylalanine','amino_acids','g',false,51),
  ('proline_g','Proline','amino_acids','g',false,52),
  ('serine_g','Serine','amino_acids','g',false,53),
  ('threonine_g','Threonine','amino_acids','g',false,54),
  ('tryptophan_g','Tryptophan','amino_acids','g',false,55),
  ('tyrosine_g','Tyrosine','amino_acids','g',false,56),
  ('valine_g','Valine','amino_acids','g',false,57),
  ('vitamin_a_rae_ug','Vitamin A (RAE)','vitamins','µg',false,58),
  ('retinol_ug','Retinol','vitamins','µg',false,59),
  ('alpha_carotene_ug','Alpha-Carotene','vitamins','µg',false,60),
  ('beta_carotene_ug','Beta-Carotene','vitamins','µg',false,61),
  ('beta_cryptoxanthin_ug','Beta-Cryptoxanthin','vitamins','µg',false,62),
  ('lutein_zeaxanthin_ug','Lutein + Zeaxanthin','vitamins','µg',false,63),
  ('lycopene_ug','Lycopene','vitamins','µg',false,64),
  ('thiamin_mg','Vitamin B1 (Thiamin)','vitamins','mg',false,65),
  ('riboflavin_mg','Vitamin B2 (Riboflavin)','vitamins','mg',false,66),
  ('niacin_mg','Vitamin B3 (Niacin)','vitamins','mg',false,67),
  ('pantothenic_acid_mg','Vitamin B5 (Pantothenic Acid)','vitamins','mg',false,68),
  ('vitamin_b6_mg','Vitamin B6','vitamins','mg',false,69),
  ('biotin_ug','Biotin','vitamins','µg',false,70),
  ('folate_ug','Folate','vitamins','µg',false,71),
  ('vitamin_b12_ug','Vitamin B12','vitamins','µg',false,72),
  ('choline_mg','Choline','vitamins','mg',false,73),
  ('vitamin_c_mg','Vitamin C','vitamins','mg',false,74),
  ('vitamin_d_ug','Vitamin D','vitamins','µg',false,75),
  ('vitamin_e_mg','Vitamin E','vitamins','mg',false,76),
  ('vitamin_k_ug','Vitamin K','vitamins','µg',false,77),
  ('beta_tocopherol_mg','Beta-Tocopherol','vitamins','mg',false,78),
  ('gamma_tocopherol_mg','Gamma-Tocopherol','vitamins','mg',false,79),
  ('delta_tocopherol_mg','Delta-Tocopherol','vitamins','mg',false,80),
  ('calcium_mg','Calcium','minerals','mg',false,81),
  ('chromium_ug','Chromium','minerals','µg',false,82),
  ('copper_mg','Copper','minerals','mg',false,83),
  ('fluoride_ug','Fluoride','minerals','µg',false,84),
  ('iodine_ug','Iodine','minerals','µg',false,85),
  ('iron_mg','Iron','minerals','mg',false,86),
  ('magnesium_mg','Magnesium','minerals','mg',false,87),
  ('manganese_mg','Manganese','minerals','mg',false,88),
  ('molybdenum_ug','Molybdenum','minerals','µg',false,89),
  ('phosphorus_mg','Phosphorus','minerals','mg',false,90),
  ('potassium_mg','Potassium','minerals','mg',false,91),
  ('selenium_ug','Selenium','minerals','µg',false,92),
  ('sodium_mg','Sodium','minerals','mg',true,93),
  ('zinc_mg','Zinc','minerals','mg',false,94),
  ('caffeine_mg','Caffeine','other_compounds','mg',false,95),
  ('alcohol_g','Alcohol','other_compounds','g',false,96),
  ('ash_g','Ash','other_compounds','g',false,97),
  ('betaine_mg','Betaine','other_compounds','mg',false,98),
  ('theobromine_mg','Theobromine','other_compounds','mg',false,99),
  ('oxalate_mg','Oxalate','other_compounds','mg',false,100),
  ('phytate_mg','Phytate','other_compounds','mg',false,101)
on conflict (nutrient_key) do update
set name=excluded.name,
    category=excluded.category,
    unit=excluded.unit,
    default_visible=excluded.default_visible,
    sort_order=excluded.sort_order,
    updated_at=now();

-- Food records gain source/serving/barcode fields needed for accurate logging.
alter table public.food_catalog
  add column if not exists brand text,
  add column if not exists barcode text,
  add column if not exists serving_size numeric,
  add column if not exists serving_unit text,
  add column if not exists grams_per_serving numeric,
  add column if not exists data_source text,
  add column if not exists source_record_id text,
  add column if not exists source_verified boolean not null default false;

create index if not exists food_catalog_barcode_idx
on public.food_catalog(barcode)
where barcode is not null;

-- Recipe ingredients can link to a catalog food for automatic nutrient calculation later.
alter table public.recipe_ingredients
  add column if not exists food_id uuid references public.food_catalog(id) on delete set null,
  add column if not exists weight_grams numeric;

-- Recipe Ingredient Builder + automatic full nutrient calculation.
-- Food nutrition JSON is treated as nutrition per configured food serving.
-- Recipe nutrition JSON is stored per recipe serving after calculation.

alter table public.recipe_ingredients
  add column if not exists calculation_basis text,
  add column if not exists nutrition_multiplier numeric,
  add column if not exists nutrition_snapshot jsonb not null default '{}'::jsonb,
  add constraint recipe_ingredients_calculation_basis_check
    check (calculation_basis is null or calculation_basis in ('weight_grams','serving_unit','servings','manual'));

alter table public.recipes
  add column if not exists nutrition_calculated_at timestamptz,
  add column if not exists nutrition_calculation_meta jsonb not null default '{}'::jsonb;

-- Replace only the audited legacy content policies. No client/contact policy changes.
alter table public.recipes enable row level security;
drop policy if exists recipes_read on public.recipes;
drop policy if exists recipes_staff_insert on public.recipes;
drop policy if exists recipes_staff_update on public.recipes;
drop policy if exists recipes_staff_delete on public.recipes;
create policy recipes_read on public.recipes for select to authenticated using ((status='published') or (select private.can_author_durable_content()));
create policy recipes_staff_insert on public.recipes for insert to authenticated with check ((select private.can_author_durable_content()));
create policy recipes_staff_update on public.recipes for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
alter table public.food_catalog enable row level security;
drop policy if exists food_catalog_read on public.food_catalog;
drop policy if exists food_catalog_staff_insert on public.food_catalog;
drop policy if exists food_catalog_staff_update on public.food_catalog;
drop policy if exists food_catalog_staff_delete on public.food_catalog;
create policy food_catalog_read on public.food_catalog for select to authenticated using ((active and exists (select 1 from public.nutrition_methodologies m where m.id=food_catalog.methodology_id and m.status='published')) or (select private.can_author_durable_content()));
create policy food_catalog_staff_insert on public.food_catalog for insert to authenticated with check ((select private.can_author_durable_content()));
create policy food_catalog_staff_update on public.food_catalog for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
alter table public.exercise_catalog enable row level security;
drop policy if exists exercise_catalog_read on public.exercise_catalog;
drop policy if exists exercise_catalog_staff_insert on public.exercise_catalog;
drop policy if exists exercise_catalog_staff_update on public.exercise_catalog;
drop policy if exists exercise_catalog_staff_delete on public.exercise_catalog;
create policy exercise_catalog_read on public.exercise_catalog for select to authenticated using ((status='published') or (select private.can_author_durable_content()));
create policy exercise_catalog_staff_insert on public.exercise_catalog for insert to authenticated with check ((select private.can_author_durable_content()));
create policy exercise_catalog_staff_update on public.exercise_catalog for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
alter table public.meal_plan_templates enable row level security;
drop policy if exists meal_plan_templates_read on public.meal_plan_templates;
drop policy if exists meal_plan_templates_staff_insert on public.meal_plan_templates;
drop policy if exists meal_plan_templates_staff_update on public.meal_plan_templates;
drop policy if exists meal_plan_templates_staff_delete on public.meal_plan_templates;
create policy meal_plan_templates_read on public.meal_plan_templates for select to authenticated using ((status='published') or (select private.can_author_durable_content()));
create policy meal_plan_templates_staff_insert on public.meal_plan_templates for insert to authenticated with check ((select private.can_author_durable_content()));
create policy meal_plan_templates_staff_update on public.meal_plan_templates for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
alter table public.workout_templates enable row level security;
drop policy if exists workout_templates_read on public.workout_templates;
drop policy if exists workout_templates_staff_insert on public.workout_templates;
drop policy if exists workout_templates_staff_update on public.workout_templates;
drop policy if exists workout_templates_staff_delete on public.workout_templates;
create policy workout_templates_read on public.workout_templates for select to authenticated using ((status='published') or (select private.can_author_durable_content()));
create policy workout_templates_staff_insert on public.workout_templates for insert to authenticated with check ((select private.can_author_durable_content()));
create policy workout_templates_staff_update on public.workout_templates for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
alter table public.fitness_programs enable row level security;
drop policy if exists fitness_programs_read on public.fitness_programs;
drop policy if exists fitness_programs_staff_insert on public.fitness_programs;
drop policy if exists fitness_programs_staff_update on public.fitness_programs;
drop policy if exists fitness_programs_staff_delete on public.fitness_programs;
create policy fitness_programs_read on public.fitness_programs for select to authenticated using ((status='published') or (select private.can_author_durable_content()));
create policy fitness_programs_staff_insert on public.fitness_programs for insert to authenticated with check ((select private.can_author_durable_content()));
create policy fitness_programs_staff_update on public.fitness_programs for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
alter table public.nutrition_methodologies enable row level security;
drop policy if exists nutrition_methodologies_read on public.nutrition_methodologies;
drop policy if exists nutrition_methodologies_staff_insert on public.nutrition_methodologies;
drop policy if exists nutrition_methodologies_staff_update on public.nutrition_methodologies;
drop policy if exists nutrition_methodologies_staff_delete on public.nutrition_methodologies;
create policy nutrition_methodologies_read on public.nutrition_methodologies for select to authenticated using ((status='published') or (select private.can_author_durable_content()));
create policy nutrition_methodologies_staff_insert on public.nutrition_methodologies for insert to authenticated with check ((select private.can_author_durable_content()));
create policy nutrition_methodologies_staff_update on public.nutrition_methodologies for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
alter table public.fitness_methodologies enable row level security;
drop policy if exists fitness_methodologies_read on public.fitness_methodologies;
drop policy if exists fitness_methodologies_staff_insert on public.fitness_methodologies;
drop policy if exists fitness_methodologies_staff_update on public.fitness_methodologies;
drop policy if exists fitness_methodologies_staff_delete on public.fitness_methodologies;
create policy fitness_methodologies_read on public.fitness_methodologies for select to authenticated using ((status='published') or (select private.can_author_durable_content()));
create policy fitness_methodologies_staff_insert on public.fitness_methodologies for insert to authenticated with check ((select private.can_author_durable_content()));
create policy fitness_methodologies_staff_update on public.fitness_methodologies for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
alter table public.recipe_ingredients enable row level security;
drop policy if exists recipe_ingredients_read on public.recipe_ingredients;
drop policy if exists recipe_ingredients_staff_insert on public.recipe_ingredients;
drop policy if exists recipe_ingredients_staff_update on public.recipe_ingredients;
drop policy if exists recipe_ingredients_staff_delete on public.recipe_ingredients;
create policy recipe_ingredients_read on public.recipe_ingredients for select to authenticated using ((exists (select 1 from public.recipes p where p.id=recipe_ingredients.recipe_id and p.status='published')) or (select private.can_author_durable_content()));
create policy recipe_ingredients_staff_insert on public.recipe_ingredients for insert to authenticated with check ((select private.can_author_durable_content()));
create policy recipe_ingredients_staff_update on public.recipe_ingredients for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
create policy recipe_ingredients_staff_delete on public.recipe_ingredients for delete to authenticated using ((select private.can_author_durable_content()));
alter table public.meal_plan_template_items enable row level security;
drop policy if exists meal_plan_template_items_read on public.meal_plan_template_items;
drop policy if exists meal_plan_template_items_staff_insert on public.meal_plan_template_items;
drop policy if exists meal_plan_template_items_staff_update on public.meal_plan_template_items;
drop policy if exists meal_plan_template_items_staff_delete on public.meal_plan_template_items;
create policy meal_plan_template_items_read on public.meal_plan_template_items for select to authenticated using ((exists (select 1 from public.meal_plan_templates p where p.id=meal_plan_template_items.template_id and p.status='published')) or (select private.can_author_durable_content()));
create policy meal_plan_template_items_staff_insert on public.meal_plan_template_items for insert to authenticated with check ((select private.can_author_durable_content()));
create policy meal_plan_template_items_staff_update on public.meal_plan_template_items for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
create policy meal_plan_template_items_staff_delete on public.meal_plan_template_items for delete to authenticated using ((select private.can_author_durable_content()));
alter table public.workout_template_exercises enable row level security;
drop policy if exists workout_template_exercises_read on public.workout_template_exercises;
drop policy if exists workout_template_exercises_staff_insert on public.workout_template_exercises;
drop policy if exists workout_template_exercises_staff_update on public.workout_template_exercises;
drop policy if exists workout_template_exercises_staff_delete on public.workout_template_exercises;
create policy workout_template_exercises_read on public.workout_template_exercises for select to authenticated using ((exists (select 1 from public.workout_templates p where p.id=workout_template_exercises.workout_id and p.status='published')) or (select private.can_author_durable_content()));
create policy workout_template_exercises_staff_insert on public.workout_template_exercises for insert to authenticated with check ((select private.can_author_durable_content()));
create policy workout_template_exercises_staff_update on public.workout_template_exercises for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
create policy workout_template_exercises_staff_delete on public.workout_template_exercises for delete to authenticated using ((select private.can_author_durable_content()));
alter table public.fitness_program_workouts enable row level security;
drop policy if exists fitness_program_workouts_read on public.fitness_program_workouts;
drop policy if exists fitness_program_workouts_staff_insert on public.fitness_program_workouts;
drop policy if exists fitness_program_workouts_staff_update on public.fitness_program_workouts;
drop policy if exists fitness_program_workouts_staff_delete on public.fitness_program_workouts;
create policy fitness_program_workouts_read on public.fitness_program_workouts for select to authenticated using ((exists (select 1 from public.fitness_programs p where p.id=fitness_program_workouts.program_id and p.status='published')) or (select private.can_author_durable_content()));
create policy fitness_program_workouts_staff_insert on public.fitness_program_workouts for insert to authenticated with check ((select private.can_author_durable_content()));
create policy fitness_program_workouts_staff_update on public.fitness_program_workouts for update to authenticated using ((select private.can_author_durable_content())) with check ((select private.can_author_durable_content()));
create policy fitness_program_workouts_staff_delete on public.fitness_program_workouts for delete to authenticated using ((select private.can_author_durable_content()));

create policy nutrition_nutrient_catalog_read on public.nutrition_nutrient_catalog
for select to authenticated using (active or (select private.can_author_durable_content()));
-- Catalog is reference data in this package; no browser catalog mutation policy.
grant select on public.nutrition_nutrient_catalog to authenticated;
revoke all on public.nutrition_nutrient_catalog from anon;

-- Recipe calculation repair: skip JSON null/non-numeric nutrients and clear stale
-- calculation state for ingredients that cannot participate in the current calculation.

create or replace function public.recalculate_recipe_nutrition(p_recipe_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
  if not private.can_author_durable_content() then
    raise exception 'Not authorized to calculate recipe nutrition';
  end if;

  select * into v_recipe
  from public.recipes
  where id = p_recipe_id
  for update;

  if not found then
    raise exception 'Recipe not found';
  end if;

  v_servings := case when v_recipe.servings>0 then v_recipe.servings else null end;

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
      from jsonb_each(case when jsonb_typeof(r.nutrition)='object' then r.nutrition else '{}'::jsonb end)
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
    v_per_serving := '{}'::jsonb;
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
        'complete',v_missing_count=0 and v_used>0 and v_servings is not null,
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
    'complete',v_missing_count=0 and v_used>0 and v_servings is not null,
    'missing',v_missing,
    'calculated_at',v_now
  );
end;
$$;

revoke all on function public.recalculate_recipe_nutrition(uuid) from public, anon;
grant execute on function public.recalculate_recipe_nutrition(uuid) to authenticated;
