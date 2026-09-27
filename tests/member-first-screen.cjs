const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('first-screen blocking member batch is reduced to three reads',()=>{
  const start=js.indexOf('async function loadDashboard()');
  const open=js.indexOf('const [',start);
  const end=js.indexOf(']);',open);
  const block=js.slice(open,end);
  const reads=(block.match(/client\.from\(/g)||[]).length;
  assert.equal(reads,3);
  for(const view of ['my_app_bootstrap_v2','my_member_dashboard','my_member_entitlements'])assert(block.includes(view),view);
});

test('secondary program, wellness and community modules load after first render',()=>{
  const deferredStart=js.indexOf('async function loadDeferredMemberModules');
  const deferredEnd=js.indexOf('async function loadDashboard()',deferredStart);
  const deferred=js.slice(deferredStart,deferredEnd);
  for(const view of [
    'my_household','my_goals','my_habits','my_client_assignments','my_recent_progress',
    'my_active_meal_plan','my_upcoming_meals','my_active_fitness_plan','my_upcoming_workouts',
    'my_grocery_list','my_courses','my_resources','my_challenges','my_community_feed',
    'my_health_connection_center','my_companion_requests'
  ])assert(deferred.includes(view),view);
  const load=js.slice(js.indexOf('async function loadDashboard()'),js.indexOf('async function resolveSession()'));
  assert(load.indexOf('showOnly("rm-dashboard")')<load.indexOf('loadDeferredMemberModules(loadSequence,{'));
});

test('journey read failure no longer falsely reports journey complete',()=>{
  assert.match(js,/Journey details are temporarily unavailable/);
  assert.match(js,/journeyResult\.error/);
});
