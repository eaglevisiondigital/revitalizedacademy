const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=(p)=>fs.readFileSync(p,'utf8');

test('Nutrition Engine migration defines scalable nutrient catalog and diary',()=>{
  const sql=read('supabase/migrations/20261004013000_nutrition_engine_nutrient_catalog.sql');
  assert.match(sql,/create table if not exists public\.nutrition_nutrient_catalog/);
  assert.match(sql,/create table if not exists public\.client_nutrient_targets/);
  assert.match(sql,/create table if not exists public\.nutrition_diary_items/);
  assert.match(sql,/source text not null default 'member'/);
});

test('approved methodology shells are seeded without invented guidance',()=>{
  const sql=read('supabase/migrations/20261004013000_nutrition_engine_nutrient_catalog.sql');
  assert.match(sql,/'the-living-diet','The Living Diet','1\.0','draft'/);
  assert.match(sql,/'functional-fitness','Functional Fitness','1\.0','draft'/);
  assert.doesNotMatch(sql,/insert into public\.nutrition_methodologies\([^)]*philosophy/i);
  assert.doesNotMatch(sql,/insert into public\.fitness_methodologies\([^)]*philosophy/i);
});

test('food catalog supports source barcode and serving metadata',()=>{
  const sql=read('supabase/migrations/20261004013000_nutrition_engine_nutrient_catalog.sql');
  assert.match(sql,/brand text/);
  assert.match(sql,/barcode text/);
  assert.match(sql,/serving_size numeric/);
  assert.match(sql,/serving_unit text/);
  assert.match(sql,/grams_per_serving numeric/);
  assert.match(sql,/data_source text/);
  assert.match(sql,/source_record_id text/);
  assert.match(sql,/source_verified boolean/);
});

test('recipe ingredients can link catalog foods for future calculated nutrition',()=>{
  const sql=read('supabase/migrations/20261004013000_nutrition_engine_nutrient_catalog.sql');
  assert.match(sql,/add column if not exists food_id uuid references public\.food_catalog/);
  assert.match(sql,/add column if not exists weight_grams numeric/);
});

test('Recipe and Food forms are catalog driven instead of seven hard coded nutrients',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/nutrition_nutrient_catalog/);
  assert.match(js,/function nutritionFieldsMarkup\(\)/);
  assert.match(js,/data-nutrient-key/);
  assert.match(js,/Full Nutrient Profile/);
  assert.match(js,/querySelectorAll\("\[data-nutrient-key\]"\)/);
  assert.doesNotMatch(js,/id="content-calories"/);
  assert.doesNotMatch(js,/id="content-protein"/);
});

test('blank nutrient values stay unknown rather than zero',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/if\(input\.value===""\)return;/);
  assert.match(js,/Number\.isFinite\(amount\)/);
});
