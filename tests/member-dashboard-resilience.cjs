const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('member dashboard treats only bootstrap, dashboard and entitlements as fatal',()=>{
  const start=js.indexOf('const requiredResults=[');
  const end=js.indexOf('const boot=bootstrapResult.data||{};',start);
  const gate=js.slice(start,end);
  for(const name of ['my_app_bootstrap_v2','my_member_dashboard','my_member_entitlements'])assert(gate.includes(name),name);
  assert.match(gate,/failed\?\.\[1\]\?\.error/);
  assert.match(gate,/throw failed\[1\]\.error/);
});

test('secondary member modules degrade instead of throwing the entire dashboard',()=>{
  assert.match(js,/Deferred member module unavailable:/);
  assert.match(js,/Home vNext optional read unavailable:/);
  assert.match(js,/Optional weekly check-in fields unavailable:/);
  assert.match(js,/Optional weekly check-in state unavailable:/);
  const checkin=js.slice(js.indexOf('async function renderCheckinForm'),js.indexOf('function weekPeriod'));
  assert.doesNotMatch(checkin,/if \(error\) throw error/);
});

test('paid access preflight remains ahead of member data loading',()=>{
  const preflight=js.indexOf('rpc("member_paid_access_allowed")');
  const bootstrap=js.indexOf('from("my_app_bootstrap_v2")');
  assert(preflight>=0&&bootstrap>preflight);
});

test('signed-in members without full access receive an immediate restricted-access view',()=>{
  assert.match(js,/if\(lifecycle!==true\)\{showOnly\("rm-denied"\);return;\}/);
  assert.doesNotMatch(js,/if\(lifecycle!==true\)\{window\.location\.replace\("\/member\/onboarding\/"\);return;\}/);
  const html=fs.readFileSync('member/index.html','utf8');
  assert.match(html,/Your member access is not active\./);
  assert.match(html,/href="\/member\/onboarding\/">Review Enrollment Status<\/a>/);
});
