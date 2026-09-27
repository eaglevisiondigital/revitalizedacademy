const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('Home vNext enhancements run only after the core dashboard is visible',()=>{
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadHomeVNextEnhancements(loadSequence,homeVNextFlagPromise',show);
  assert(load>=0&&show>load&&launch>show);
  const beforeShow=js.slice(load,show);
  assert.doesNotMatch(beforeShow,/from\("my_next_best_actions"\)/);
  assert.doesNotMatch(beforeShow,/from\("my_up_next"\)/);
  assert.doesNotMatch(beforeShow,/from\("my_weekly_progress_story"\)/);
});

test('Home vNext preserves v2 content until enhancements arrive',()=>{
  const load=js.slice(js.indexOf('async function loadDashboard()'),js.indexOf('async function resolveSession()'));
  assert.match(load,/renderAttentionCenter\(\{[\s\S]*notifications:notificationsResult\.data\|\|\[\][\s\S]*\}\);/);
  assert.match(load,/renderUpNext\(\[\]\);/);
  assert.match(load,/renderWeeklySummary\(weeklySummaryResult\.data\|\|null\);/);
});

test('Home vNext enhancement reads remain nonfatal and sequence guarded',()=>{
  const start=js.indexOf('async function loadHomeVNextEnhancements');
  const end=js.indexOf('async function loadDeferredMemberModules',start);
  const block=js.slice(start,end);
  for(const view of ['my_next_best_actions','my_up_next','my_weekly_progress_story'])assert(block.includes(view),view);
  assert.match(block,/Home vNext optional read unavailable:/);
  assert((block.match(/loadSequence!==dashboardLoadSequence/g)||[]).length>=2);
});
