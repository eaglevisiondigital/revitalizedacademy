const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Home vNext remains additive behind a runtime flag and keeps bootstrap v2',()=>{
  const js=read('member/member110.js');
  assert.match(js,/from\("my_app_bootstrap_v2"\)/);
  assert.doesNotMatch(js,/from\("my_app_bootstrap_v27"\)/);
  assert.match(js,/feature_member_home_vnext/);
  for(const view of ['my_next_best_actions','my_up_next','my_weekly_progress_story'])assert(js.includes(view),view);
  assert.doesNotMatch(js,/from\("my_home_priority_summary"\)/);
  assert.match(js,/Home vNext optional read unavailable:/);
});

test('Home vNext evolves the existing priority card instead of adding a duplicate priority card',()=>{
  const html=read('member/index.html');
  const js=read('member/member110.js');
  assert.equal((html.match(/id="rm-attention-card"/g)||[]).length,1);
  assert.equal((html.match(/id="rm-up-next-card"/g)||[]).length,1);
  assert.match(html,/id="rm-up-next-card"[^>]*hidden/);
  assert.match(js,/renderAttentionCenter\(\{[\s\S]*nextBestActions:nextBestResult\.error\?\[\]:\(nextBestResult\.data\|\|\[\]\)/);
  assert.match(js,/function renderAttentionCenter\(context\)/);
});

test('Home vNext does not surface score formulas or health/AI generation as part of the first slice',()=>{
  const js=read('member/member110.js');
  const block=js.slice(js.indexOf('function homeVNextTarget'),js.indexOf('function renderProgramHub'));
  assert.doesNotMatch(block,/wellness_score|family_health_score|health_score|generation_provider/);
});

test('Home vNext loads progressively after the core dashboard is visible',()=>{
  const js=read('member/member110.js');
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadHomeVNextEnhancements(loadSequence,attentionContext',show);
  assert(load>=0&&show>load&&launch>show);
});

test('staging seeds Home vNext disabled until explicit hosted acceptance',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_home_vnext/);
  assert.match(provision,/feature_member_home_vnext','false'::jsonb/);
});
