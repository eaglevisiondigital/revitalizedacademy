const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Progress vNext is additive, post-first-paint and feature flagged',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  assert.match(js,/feature_member_progress_vnext/);
  for(const view of ['my_goal_progress','my_achievements','my_progress_insights'])assert(js.includes(view),view);
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadProgressVNextEnhancements(loadSequence,progressVNextFlagPromise)',show);
  assert(show>load&&launch>show);
  assert.match(html,/id="rm-progress-achievements-card"[^>]*hidden/);
  assert.match(html,/id="rm-progress-trends-card"[^>]*hidden/);
});

test('Progress vNext preserves descriptive-only trend language',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function renderProgressInsights');
  const end=js.indexOf('async function loadProgressVNextEnhancements',start);
  const block=js.slice(start,end);
  assert.match(block,/insight_text/);
  assert.doesNotMatch(block,/health is improving|healthy|unhealthy|diagnos|treatment/i);
});

test('Progress vNext enriches existing goals without inventing missing completion',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function renderGoals');
  const end=js.indexOf('function renderHabits',start);
  const block=js.slice(start,end);
  assert.match(block,/goalProgressById\.get\(row\.id\)/);
  assert.match(block,/completion_percent!==null/);
  assert.match(block,/awaiting_data/);
});

test('Progress vNext does not expose progress-photo storage paths',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  assert.doesNotMatch(js,/from\("my_progress_photos"\)|from\("my_progress_photo_sets"\)/);
  assert.doesNotMatch(html,/storage_path/i);
});

test('staging seeds Progress vNext disabled by default',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_progress_vnext/);
  assert.match(provision,/feature_member_progress_vnext','false'::jsonb/);
});
