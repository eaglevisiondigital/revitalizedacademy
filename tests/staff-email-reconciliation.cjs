const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'portal/index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'portal/portal-staff-access.js'),'utf8');

test('pending staff email recovery is exposed through the current staff manager',()=>{
  assert.match(html,/id="staff-edit-email"[^>]*type="email"/);
  assert.match(html,/id="staff-reconcile-email"/);
  assert.match(html,/portal-staff-access\.js\?v=183/);
  assert.match(source,/action:"reconcile_pending_email"/);
  assert.match(source,/user_id:activeStaff\.user_id/);
  assert.match(source,/Enter a reason before changing a staff email/);
  assert.match(source,/Email updated and a fresh secure setup message was sent/);
});

test('the staff email recovery does not create a second invite in the browser',()=>{
  const fn=source.match(/async function reconcilePendingEmail\(\)\{[\s\S]*?\n  \}/)?.[0]||'';
  assert.match(fn,/reconcile_pending_email/);
  assert.doesNotMatch(fn,/action:"invite"/);
  assert.doesNotMatch(fn,/from\("staff_invitations"\)/);
});
