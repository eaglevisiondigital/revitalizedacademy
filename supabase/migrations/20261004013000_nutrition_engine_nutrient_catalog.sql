-- ReVitalized Nutrition Engine v1.
-- Flexible nutrient catalog sized for Cronometer-class nutrition tracking.
-- Publicly documented Cronometer capabilities are used as compatibility requirements;
-- exact field-for-field parity can be extended without another schema change.

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

drop policy if exists nutrition_nutrient_catalog_read on public.nutrition_nutrient_catalog;
create policy nutrition_nutrient_catalog_read
on public.nutrition_nutrient_catalog
for select to authenticated
using (active or (select private.active_staff_session()));

drop policy if exists nutrition_nutrient_catalog_staff_manage on public.nutrition_nutrient_catalog;
create policy nutrition_nutrient_catalog_staff_manage
on public.nutrition_nutrient_catalog
for all to authenticated
using ((select private.staff_has_permission((select auth.uid()), 'learning.manage')))
with check ((select private.staff_has_permission((select auth.uid()), 'learning.manage')));

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

-- Store nutrient targets separately so coaches can configure any catalog nutrient
-- without adding new columns when the catalog expands.
create table if not exists public.client_nutrient_targets (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  nutrient_id uuid not null references public.nutrition_nutrient_catalog(id) on delete cascade,
  minimum_value numeric,
  target_value numeric,
  maximum_value numeric,
  source text not null default 'coach'
    check (source in ('program','coach','member','system')),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contact_id,nutrient_id,source)
);

alter table public.client_nutrient_targets enable row level security;

drop policy if exists client_nutrient_targets_read on public.client_nutrient_targets;
create policy client_nutrient_targets_read
on public.client_nutrient_targets
for select to authenticated
using (
  contact_id in (select ca.contact_id from public.client_access ca where ca.user_id=(select auth.uid()))
  or (select private.active_staff_session())
);

drop policy if exists client_nutrient_targets_staff_manage on public.client_nutrient_targets;
create policy client_nutrient_targets_staff_manage
on public.client_nutrient_targets
for all to authenticated
using ((select private.staff_has_permission((select auth.uid()), 'plan.override')))
with check ((select private.staff_has_permission((select auth.uid()), 'plan.override')));

-- Structured diary items sit below the existing nutrition_logs summary/adherence layer.
create table if not exists public.nutrition_diary_items (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete set null,
  log_date date not null default current_date,
  meal_slot text,
  food_id uuid references public.food_catalog(id) on delete set null,
  recipe_id uuid references public.recipes(id) on delete set null,
  custom_label text,
  quantity numeric not null default 1 check (quantity > 0),
  serving_quantity numeric,
  serving_unit text,
  nutrient_snapshot jsonb not null default '{}'::jsonb,
  source text not null default 'member'
    check (source in ('member','coach','barcode','photo','voice','import','system')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (food_id is not null or recipe_id is not null or custom_label is not null)
);

create index if not exists nutrition_diary_items_contact_date_idx
on public.nutrition_diary_items(contact_id,log_date);

alter table public.nutrition_diary_items enable row level security;

drop policy if exists nutrition_diary_items_read on public.nutrition_diary_items;
create policy nutrition_diary_items_read
on public.nutrition_diary_items
for select to authenticated
using (
  contact_id in (select ca.contact_id from public.client_access ca where ca.user_id=(select auth.uid()))
  or (select private.active_staff_session())
);

drop policy if exists nutrition_diary_items_insert on public.nutrition_diary_items;
create policy nutrition_diary_items_insert
on public.nutrition_diary_items
for insert to authenticated
with check (
  contact_id in (select ca.contact_id from public.client_access ca where ca.user_id=(select auth.uid()))
  or (select private.active_staff_session())
);

drop policy if exists nutrition_diary_items_update on public.nutrition_diary_items;
create policy nutrition_diary_items_update
on public.nutrition_diary_items
for update to authenticated
using (
  contact_id in (select ca.contact_id from public.client_access ca where ca.user_id=(select auth.uid()))
  or (select private.active_staff_session())
)
with check (
  contact_id in (select ca.contact_id from public.client_access ca where ca.user_id=(select auth.uid()))
  or (select private.active_staff_session())
);

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

-- Approved staging methodology shells. Guidance stays intentionally blank until supplied.
insert into public.nutrition_methodologies(methodology_key,name,version,status)
select 'the-living-diet','The Living Diet','1.0','draft'
where not exists (
  select 1 from public.nutrition_methodologies
  where methodology_key='the-living-diet' or name='The Living Diet'
);

insert into public.fitness_methodologies(methodology_key,name,version,status)
select 'functional-fitness','Functional Fitness','1.0','draft'
where not exists (
  select 1 from public.fitness_methodologies
  where methodology_key='functional-fitness' or name='Functional Fitness'
);
