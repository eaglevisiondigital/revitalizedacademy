const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('low-priority member modules are deferred until after the dashboard is visible',()=>{
  const loadStart=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',loadStart);
  const deferredCall=js.indexOf('loadDeferredMemberModules(loadSequence,askEnabled)',show);
  assert(loadStart>=0&&show>loadStart&&deferredCall>show);

  const initial=js.slice(loadStart,js.indexOf('const requiredResults=[',loadStart));
  for(const view of [
    'my_health_connection_center','my_community_spaces','my_community_feed',
    'my_refuel_access','my_documents','my_coaching_entitlements',
    'my_companion_question_types','my_companion_requests',
    'my_health_metric_permissions','my_health_data_snapshot'
  ])assert(!initial.includes('from("'+view+'")'),view+' should not block first screen');
});

test('deferred member modules retain per-module failure isolation',()=>{
  const start=js.indexOf('async function loadDeferredMemberModules');
  const end=js.indexOf('async function loadDashboard()',start);
  const block=js.slice(start,end);
  assert.match(block,/Deferred member module unavailable:/);
  assert.match(block,/loadSequence!==dashboardLoadSequence/);
  for(const view of ['my_community_feed','my_documents','my_companion_requests','my_health_data_snapshot'])assert(block.includes(view),view);
});

test('paid access and core reads still fail closed before deferred features',()=>{
  assert(js.indexOf('rpc("member_paid_access_allowed")')<js.indexOf('const loadSequence=++dashboardLoadSequence'));
  assert.match(js,/const requiredResults=\[[\s\S]*my_app_bootstrap_v2[\s\S]*my_member_dashboard[\s\S]*my_member_entitlements/);
});
