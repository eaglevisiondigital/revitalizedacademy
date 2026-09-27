const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('member journey loads after the dashboard first paint',()=>{
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const journeyLaunch=js.indexOf('loadJourneyEnhancement(loadSequence)',show);
  assert(load>=0&&show>load&&journeyLaunch>show);
  const initial=js.slice(load,js.indexOf('const requiredResults=[',load));
  assert.doesNotMatch(initial,/from\("my_member_journey"\)/);
});

test('journey loader degrades locally and never reports temporary failure as complete',()=>{
  const start=js.indexOf('async function loadJourneyEnhancement');
  const end=js.indexOf('async function loadHomeVNextEnhancements',start);
  const block=js.slice(start,end);
  assert.match(block,/Optional member module unavailable:/);
  assert.match(block,/renderJourneyCard\(null,result\.error\)/);
  assert.match(js,/Journey details are temporarily unavailable/);
});
