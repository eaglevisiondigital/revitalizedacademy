const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('vNext feature state resets on every dashboard refresh',()=>{
  const load=js.slice(js.indexOf('async function loadDashboard()'),js.indexOf('const homeVNextFlagPromise'));
  assert.match(load,/homeVNextEnabled=false/);
  assert.match(load,/progressVNextEnabled=false/);
  assert.match(load,/goalProgressById=new Map\(\)/);
});

test('turning Progress vNext off clears enhanced goal state and hidden cards',()=>{
  const start=js.indexOf('async function loadProgressVNextEnhancements');
  const end=js.indexOf('function renderFamilyRequests',start);
  const block=js.slice(start,end);
  assert.match(block,/if\(!progressVNextEnabled\)/);
  assert.match(block,/goalProgressById=new Map\(\)/);
  assert.match(block,/if\(latestGoalRows\.length\)renderGoals\(latestGoalRows\)/);
  assert.match(block,/renderAchievements\(\[\]\)/);
  assert.match(block,/renderProgressInsights\(\[\]\)/);
});
