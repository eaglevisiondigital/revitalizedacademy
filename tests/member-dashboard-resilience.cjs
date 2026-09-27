const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('member dashboard only treats bootstrap, dashboard and entitlements as fatal initial reads',()=>{
  const gate=js.slice(js.indexOf('const requiredResults=['),js.indexOf('const homeFlagResult='));
  for(const name of ['my_app_bootstrap_v2','my_member_dashboard','my_member_entitlements'])assert(gate.includes(name),name);
  assert.match(gate,/if\(failed\?\.\[1\]\?\.error\) throw failed\[1\]\.error/);
  for(const optional of ['my_household','my_courses','my_health_connection_center','my_community_feed','my_refuel_access','my_companion_requests'])assert.match(gate,new RegExp('Optional member module unavailable:|'+optional));
});

test('optional member modules degrade instead of throwing the entire dashboard',()=>{
  assert.match(js,/Optional member module unavailable:/);
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
