const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(p)=>fs.readFileSync(p,'utf8');

test('recipe calculation migration adds snapshot and calculation metadata',()=>{
  const sql=read('supabase/migrations/20261004030000_recipe_ingredient_calculation_engine.sql');
  assert.match(sql,/nutrition_multiplier numeric/);
  assert.match(sql,/nutrition_snapshot jsonb/);
  assert.match(sql,/nutrition_calculated_at timestamptz/);
  assert.match(sql,/nutrition_calculation_meta jsonb/);
});

test('recipe calculation RPC is permission gated and aggregates food nutrition',()=>{
  const sql=read('supabase/migrations/20261004030000_recipe_ingredient_calculation_engine.sql');
  assert.match(sql,/private\.staff_has_permission\(\(select auth\.uid\(\)\), 'learning\.manage'\)/);
  assert.match(sql,/jsonb_each_text\(r\.nutrition\)/);
  assert.match(sql,/r\.weight_grams \/ r\.grams_per_serving/);
  assert.match(sql,/r\.quantity \/ r\.serving_size/);
  assert.match(sql,/nutrition=v_per_serving/);
  assert.match(sql,/ingredients_incomplete/);
});

test('recipe ingredient writes require learning manage',()=>{
  const sql=read('supabase/migrations/20261004030000_recipe_ingredient_calculation_engine.sql');
  assert.match(sql,/recipe_ingredients_staff_insert/);
  assert.match(sql,/recipe_ingredients_staff_update/);
  assert.match(sql,/recipe_ingredients_staff_delete/);
  assert.match(sql,/learning\.manage/);
});

test('Content Library exposes Build Recipe action',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/buildRecipe\.textContent="Build Recipe"/);
  assert.match(js,/RA_RECIPE_BUILDER\?\.open\(row\)/);
});

test('Food editor captures serving conversion and provenance',()=>{
  const js=read('portal/portal-programs.js');
  for(const id of [
    'content-brand','content-barcode','content-serving-size','content-serving-unit',
    'content-grams-serving','content-data-source','content-source-record-id','content-source-verified'
  ]){
    assert.match(js,new RegExp(id));
  }
  assert.match(js,/payload\.grams_per_serving/);
  assert.match(js,/payload\.source_verified/);
});

test('Recipe Builder supports food linking grams servings and recalculate',()=>{
  const js=read('portal/portal-recipe-builder.js');
  assert.match(js,/recipe_ingredients/);
  assert.match(js,/food_catalog/);
  assert.match(js,/weight_grams/);
  assert.match(js,/serving_size/);
  assert.match(js,/grams_per_serving/);
  assert.match(js,/recalculate_recipe_nutrition/);
  assert.match(js,/nutrition_calculation_meta/);
  assert.match(js,/Calculated Nutrition Per Serving/);
});

test('Recipe Builder preserves source provenance in its UI',()=>{
  const js=read('portal/portal-recipe-builder.js');
  assert.match(js,/data_source/);
  assert.match(js,/source_record_id/);
  assert.match(js,/source_verified/);
  assert.match(js,/Source: /);
});
