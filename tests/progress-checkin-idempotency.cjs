const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');

test('progress entries use stable client-generated replay identities',()=>{
  const start=js.indexOf('el("rm-progress-form").addEventListener');
  const end=js.indexOf('el("rm-checkin-form").addEventListener',start);
  const block=js.slice(start,end);
  assert.match(block,/pendingProgressRequestId/);
  assert.match(block,/pendingProgressPayloadKey/);
  assert.match(block,/pendingProgressRecordedAt/);
  assert.match(block,/id:pendingProgressRequestId/);
  assert.match(block,/recorded_at:pendingProgressRecordedAt/);
  assert.match(block,/error\.code!=="23505"/);
  assert.match(block,/Progress retry identity conflict/);
});

test('progress replay validates the existing row before accepting duplicate UUID',()=>{
  const start=js.indexOf('el("rm-progress-form").addEventListener');
  const end=js.indexOf('el("rm-checkin-form").addEventListener',start);
  const block=js.slice(start,end);
  for(const field of ['contact_id','metric_key','value_numeric','recorded_at','source','created_by','note'])assert(block.includes('existing.'+field)||block.includes('existing?.'+field),field);
});

test('weekly check-in uses existing weekly uniqueness as exact-response replay guard',()=>{
  const start=js.indexOf('el("rm-checkin-form").addEventListener');
  const end=js.indexOf('client.auth.onAuthStateChange',start);
  const block=js.slice(start,end);
  assert.match(block,/error\.code!=="23505"/);
  assert.match(block,/\.eq\("contact_id",currentMember\.contact_id\)/);
  assert.match(block,/\.eq\("template_id",checkinTemplate\.id\)/);
  assert.match(block,/\.eq\("period_start",period\.start\)/);
  assert.match(block,/Object\.keys\(value\|\|\{\}\)\.sort\(\)/);
  assert.match(block,/already been submitted with different answers/);
});

test('progress and check-in submit buttons are disabled while writes are active',()=>{
  const progress=js.slice(js.indexOf('el("rm-progress-form").addEventListener'),js.indexOf('el("rm-checkin-form").addEventListener'));
  const checkin=js.slice(js.indexOf('el("rm-checkin-form").addEventListener'),js.indexOf('client.auth.onAuthStateChange'));
  assert.match(progress,/submit\.disabled=true/);
  assert.match(progress,/finally\{[\s\S]*submit\.disabled=false/);
  assert.match(checkin,/submit\.disabled=true/);
  assert.match(checkin,/finally\{[\s\S]*submit\.disabled=false/);
});

test('fresh dashboard loads clear pending progress retry identity',()=>{
  const start=js.indexOf('async function loadDashboard()');
  const end=js.indexOf('const [',start);
  const block=js.slice(start,end);
  assert.match(block,/pendingProgressRequestId=null/);
  assert.match(block,/pendingProgressPayloadKey=null/);
  assert.match(block,/pendingProgressRecordedAt=null/);
});
