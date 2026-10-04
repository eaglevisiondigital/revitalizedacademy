const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(p)=>fs.readFileSync(p,'utf8');

test('nutrition targets and trends UI is present',()=>{
  const html=read('portal/index.html');
  assert.match(html,/id="client-nutrition-targets"/);
  assert.match(html,/id="client-nutrition-trends"/);
  assert.match(html,/data-nutrition-days="7"/);
  assert.match(html,/data-nutrition-days="30"/);
});

test('target editing uses secure RPCs and plan override UI gate',()=>{
  const js=read('portal/portal-nutrition-review.js');
  assert.match(js,/admin_get_client_nutrition_targets/);
  assert.match(js,/admin_set_client_nutrient_target/);
  assert.match(js,/admin_clear_client_nutrient_target/);
  assert.match(js,/hasPermission\?\.\("plan\.override"\)/);
});

test('trend review uses secure RPC and no direct private table reads',()=>{
  const js=read('portal/portal-nutrition-review.js');
  assert.match(js,/admin_get_client_nutrition_trends/);
  assert.doesNotMatch(js,/\.from\("nutrition_diary_items"\)/);
  assert.doesNotMatch(js,/\.from\("client_nutrient_targets"\)/);
});

test('migration defines methodology defaults and coach override precedence',()=>{
  const sql=read('supabase/migrations/20261004062000_nutrition_targets_trends_reports.sql');
  assert.match(sql,/create table if not exists public\.nutrition_methodology_targets/);
  assert.match(sql,/case ct\.source when 'coach' then 1 when 'program' then 2/);
  assert.match(sql,/admin_set_client_nutrient_target/);
  assert.match(sql,/admin_get_client_nutrition_trends/);
});
