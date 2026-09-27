const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Health Trends vNext enriches the existing health card behind a default-off flag',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  assert.match(js,/feature_member_health_trends_vnext/);
  assert.match(js,/from\("my_health_dashboard_cards_30d"\)/);
  assert.match(js,/rpc\("get_my_health_metric_trend"/);
  assert.match(html,/id="rm-health-trends"[^>]*hidden/);
  assert.equal((html.match(/rm123-health-card/g)||[]).length,1);
});

test('Health Trends is biometrics-gated, post-first-paint, and limited to four cards',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('async function loadHealthTrendsVNext');
  const end=js.indexOf('function renderHealthConnections',start);
  const block=js.slice(start,end);
  assert.match(block,/if\(!biometricsEnabled\|\|!currentMember\)/);
  assert.match(block,/\.limit\(4\)/);
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadHealthTrendsVNext(loadSequence,biometricsEnabled)',show);
  assert(show>load&&launch>show);
});

test('Health Trends remains descriptive and excludes health scores/medical interpretation',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function sparklinePoints');
  const end=js.indexOf('function renderHealthConnections',start);
  const block=js.slice(start,end);
  assert.doesNotMatch(block,/health_score|family_health_score|diagnos|treatment|healthy|unhealthy|improving|worsening/i);
  assert.match(block,/30-day change/);
});

test('staging seeds Health Trends disabled by default',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_health_trends_vnext/);
  assert.match(provision,/feature_member_health_trends_vnext','false'::jsonb/);
});
