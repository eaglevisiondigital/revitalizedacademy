const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(p)=>fs.readFileSync(p,'utf8');

test('coach Nutrition Review markup and script are published',()=>{
  const html=read('portal/index.html');
  const files=JSON.parse(read('config/public-files.json'));
  assert.match(html,/id="client-nutrition-review-panel"/);
  assert.match(html,/portal-nutrition-review\.js\?v=100/);
  assert.ok(files.includes('portal/portal-nutrition-review.js'));
});

test('coach Nutrition Review uses scoped admin RPC only',()=>{
  const js=read('portal/portal-nutrition-review.js');
  assert.match(js,/admin_get_client_nutrition_day/);
  assert.match(js,/p_contact_id:contactId/);
  assert.doesNotMatch(js,/nutrition_diary_items"\)\.select/);
});

test('coach Nutrition Review is read only',()=>{
  const js=read('portal/portal-nutrition-review.js');
  assert.doesNotMatch(js,/\.insert\(/);
  assert.doesNotMatch(js,/\.update\(/);
  assert.doesNotMatch(js,/\.delete\(/);
});

test('coach Nutrition Review renders core daily nutrition and meals',()=>{
  const js=read('portal/portal-nutrition-review.js');
  for(const key of ['energy_kcal','protein_g','carbohydrate_g','fat_g','fiber_g','water_g']){
    assert.match(js,new RegExp(key));
  }
  assert.match(js,/breakfast/);
  assert.match(js,/lunch/);
  assert.match(js,/dinner/);
});
