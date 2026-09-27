const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('first network wave contains only the three critical member reads',()=>{
  const loadStart=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',loadStart);
  const beforeShow=js.slice(loadStart,show);
  assert.equal((beforeShow.match(/client\.from\(/g)||[]).length,3);
  assert.doesNotMatch(beforeShow,/feature_member_home_vnext|feature_member_progress_vnext/);
});

test('vNext runtime flags are fetched only in post-render enhancement loaders',()=>{
  const homeStart=js.indexOf('async function loadHomeVNextEnhancements');
  const homeEnd=js.indexOf('async function loadDeferredMemberModules',homeStart);
  const home=js.slice(homeStart,homeEnd);
  assert.match(home,/feature_member_home_vnext/);

  const progressStart=js.indexOf('async function loadProgressVNextEnhancements');
  const progressEnd=js.indexOf('function renderFamilyRequests',progressStart);
  const progress=js.slice(progressStart,progressEnd);
  assert.match(progress,/feature_member_progress_vnext/);
});
