const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('secondary member modules load only after the dashboard is visible',()=>{
  const loadStart=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',loadStart);
  const deferredCall=js.indexOf('loadDeferredMemberModules(loadSequence,{',show);
  assert(loadStart>=0&&show>loadStart&&deferredCall>show);

  const initial=js.slice(loadStart,js.indexOf('const requiredResults=[',loadStart));
  for(const view of [
    'my_household','my_goals','my_habits','my_client_assignments','my_recent_progress',
    'my_active_meal_plan','my_upcoming_meals','my_active_fitness_plan','my_upcoming_workouts',
    'my_grocery_list','my_courses','my_resources','my_challenges',
    'my_health_connection_center','my_community_spaces','my_community_feed',
    'my_refuel_access','my_documents','my_coaching_entitlements',
    'my_companion_question_types','my_companion_requests',
    'my_health_metric_permissions','my_health_data_snapshot'
  ])assert(!initial.includes('from("'+view+'")'),view+' should not block first screen');
});

test('deferred member modules retain per-module failure isolation and stale-response protection',()=>{
  const start=js.indexOf('async function loadDeferredMemberModules');
  const end=js.indexOf('async function loadDashboard()',start);
  const block=js.slice(start,end);
  assert.match(block,/Deferred member module unavailable:/);
  assert((block.match(/loadSequence!==dashboardLoadSequence/g)||[]).length>=2);
  for(const view of ['my_household','my_courses','my_community_feed','my_documents','my_companion_requests','my_health_data_snapshot'])assert(block.includes(view),view);
});

test('paid access and core reads still fail closed before deferred features',()=>{
  const start=js.indexOf('async function loadDashboard()');
  assert(js.indexOf('const loadSequence=clearMemberPrivateState()',start)<js.indexOf('rpc("member_paid_access_allowed")',start));
  assert(js.indexOf('rpc("member_paid_access_allowed")',start)<js.indexOf('from("my_app_bootstrap_v2")',start));
  assert.match(js,/const requiredResults=\[[\s\S]*my_app_bootstrap_v2[\s\S]*my_member_dashboard[\s\S]*my_member_entitlements/);
});
