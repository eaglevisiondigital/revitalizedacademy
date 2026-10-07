const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(p)=>fs.readFileSync(p,'utf8');

test('Recipe Builder asset is in public deployment manifest',()=>{
  const files=JSON.parse(read('config/public-files.json'));
  assert.ok(files.includes('portal/portal-recipe-builder.js'));
  const html=read('portal/index.html');
  assert.match(html,/portal-recipe-builder\.js\?v=104/);
});

test('recipe calculator accepts numeric JSON only',()=>{
  const sql=read('supabase/migrations/20261004033000_recipe_calculation_integrity_repairs.sql');
  assert.match(sql,/jsonb_each\(r\.nutrition\)/);
  assert.match(sql,/jsonb_typeof\(value\)='number'/);
  assert.match(sql,/food_nutrition_has_no_numeric_values/);
  assert.doesNotMatch(sql,/jsonb_each_text\(r\.nutrition\)/);
});

test('incomplete ingredients clear stale calculation state',()=>{
  const sql=read('supabase/migrations/20261004033000_recipe_calculation_integrity_repairs.sql');
  const clears=(sql.match(/calculation_basis=null,[\s\S]*?nutrition_multiplier=null,[\s\S]*?nutrition_snapshot='\{\}'::jsonb/g)||[]).length;
  assert.ok(clears>=3,'expected stale-state clearing in every incomplete branch');
});

test('recipe calculation metadata version advances',()=>{
  const sql=read('supabase/migrations/20261004033000_recipe_calculation_integrity_repairs.sql');
  assert.match(sql,/'calculation_version',2/);
});
