const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('dashboard refresh clears cached vNext goal state before new member data loads',()=>{
  const load=js.slice(js.indexOf('async function loadDashboard()'),js.indexOf('const homeVNextFlagPromise'));
  assert.match(load,/goalProgressById=new Map\(\)/);
  assert.match(load,/latestGoalRows=\[\]/);
});

test('signout performs a clean member-page reload to clear rendered private state',()=>{
  const start=js.indexOf('async function signOut()');
  const end=js.indexOf('el("rm-community-new-post")',start);
  const block=js.slice(start,end);
  assert.match(block,/client\.auth\.signOut\(\)/);
  assert.match(block,/window\.location\.replace\("\/member\/"\)/);
  assert.doesNotMatch(block,/showOnly\("rm-auth"\)/);
});
