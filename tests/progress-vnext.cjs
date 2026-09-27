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
  const launch=js.indexOf('loadProgressVNextEnhancements(loadSequence)',show);
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

test('Progress vNext keeps Progress Photos on the separate private-viewing path',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  const progressStart=js.indexOf('async function loadProgressVNextEnhancements');
  const progressEnd=js.indexOf('function renderFamilyRequests',progressStart);
  const progressBlock=js.slice(progressStart,progressEnd);
  assert.doesNotMatch(progressBlock,/my_progress_photos|my_progress_photo_sets|storage_path/);

  const photoStart=js.indexOf('async function loadProgressPhotosVNext');
  const photoEnd=js.indexOf('function updatePrivacyProviderScope',photoStart);
  const photoBlock=js.slice(photoStart,photoEnd);
  assert.match(photoBlock,/my_progress_photos/);
  assert.match(photoBlock,/my_progress_photo_sets/);
  assert.match(photoBlock,/createSignedUrl\(row\.storage_path,300\)/);
  assert.doesNotMatch(photoBlock,/getPublicUrl/);
  assert.doesNotMatch(html,/storage_path/i);
});

test('staging seeds Progress vNext disabled by default',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_progress_vnext/);
  assert.match(provision,/feature_member_progress_vnext','false'::jsonb/);
});
