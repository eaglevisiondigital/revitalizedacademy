const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Family Hub vNext enriches the existing hub with a default-off shared calendar',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  assert.match(js,/feature_member_family_vnext/);
  assert.match(js,/from\("my_family_calendar_summary"\)/);
  assert.match(html,/id="rm-family-calendar"[^>]*hidden/);
  assert.equal((html.match(/id="rm-family-hub-card"/g)||[]).length,1);
});

test('Family Hub vNext loads post-first-paint and only with Family Hub entitlement',()=>{
  const js=read('member/member110.js');
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadFamilyVNextEnhancement(loadSequence,hasFamilyHub)',show);
  assert(show>load&&launch>show);
  const start=js.indexOf('async function loadFamilyVNextEnhancement');
  const end=js.indexOf('function renderFamilyRequests',start);
  const block=js.slice(start,end);
  assert.match(block,/if\(!hasFamilyHub\)/);
  assert.match(block,/Family Hub vNext optional read unavailable:/);
  assert.match(block,/loadSequence!==dashboardLoadSequence/);
});

test('Family Hub vNext excludes health-score and detailed family health views',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function renderFamilyCalendar');
  const end=js.indexOf('function renderFamilyRequests',start);
  const block=js.slice(start,end);
  assert.doesNotMatch(block,/family_progress_dashboard|family_dashboard_summary_v2|family_wellness_summary|health_score|health_observations/i);
  for(const field of ['coaching_sessions','workouts','meals','goals_due','challenges_ending'])assert(block.includes(field),field);
});

test('staging seeds Family Hub vNext disabled by default',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_family_vnext/);
  assert.match(provision,/feature_member_family_vnext','false'::jsonb/);
});
