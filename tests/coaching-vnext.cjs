const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Coaching Hub vNext enriches the existing hub behind a default-off flag',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  assert.match(js,/feature_member_coaching_vnext/);
  assert.match(js,/from\("my_coaching_momentum"\)/);
  assert.match(html,/id="rm-coaching-momentum"[^>]*hidden/);
  assert.equal((html.match(/rm183-coaching-hub-card/g)||[]).length,1);
});

test('Coaching Hub vNext loads after first paint and fails locally',()=>{
  const js=read('member/member110.js');
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadCoachingVNextEnhancement(loadSequence)',show);
  assert(show>load&&launch>show);
  const start=js.indexOf('async function loadCoachingVNextEnhancement');
  const end=js.indexOf('function renderCoachingRequests',start);
  const block=js.slice(start,end);
  assert.match(block,/Coaching vNext optional read unavailable:/);
  assert.match(block,/loadSequence!==dashboardLoadSequence/);
});

test('Coaching Hub vNext exposes context, not raw health values or scoring',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function renderCoachingMomentum');
  const end=js.indexOf('function renderCoachingRequests',start);
  const block=js.slice(start,end);
  for(const field of ['plan_completion_7d','last_checkin_at','last_progress_at','active_goals','overdue_goals'])assert(block.includes(field),field);
  assert.doesNotMatch(block,/health_observations|value_numeric|health_score|diagnos|treatment/i);
});

test('staging seeds Coaching Hub vNext disabled by default',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_coaching_vnext/);
  assert.match(provision,/feature_member_coaching_vnext','false'::jsonb/);
});
