const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('member/onboarding/index.html','utf8');
const js=fs.readFileSync('member/onboarding/onboarding.js','utf8');

test('Enrollment center includes a restricted Privacy Center but no provider disconnect control',()=>{
  assert.match(html,/id="restricted-privacy-center"[^>]*hidden/);
  assert.match(html,/id="restricted-privacy-form"/);
  assert.match(html,/id="restricted-privacy-exports"/);
  assert.match(html,/id="restricted-privacy-requests"/);
  const start=html.indexOf('id="restricted-privacy-center"');
  const end=html.indexOf('id="refresh"',start);
  const block=html.slice(start,end);
  assert.doesNotMatch(block,/Disconnect/);
});

test('restricted Privacy Center uses lifecycle-safe privacy views and request RPC',()=>{
  assert.match(js,/from\('my_privacy_center'\)/);
  assert.match(js,/from\('my_privacy_exports'\)/);
  assert.match(js,/rpc\('submit_my_privacy_request'/);
});

test('restricted export download uses a five-minute private signed URL',()=>{
  const start=js.indexOf('async function downloadRestrictedPrivacyExport');
  const end=js.indexOf('function renderRestrictedPrivacy',start);
  const block=js.slice(start,end);
  assert.match(block,/from\('privacy-exports'\)\.createSignedUrl\(storagePath,300\)/);
  assert.doesNotMatch(block,/getPublicUrl/);
});

test('restricted Privacy Center never renders raw export storage paths',()=>{
  const start=js.indexOf('function renderRestrictedPrivacy');
  const end=js.indexOf('async function loadRestrictedPrivacy',start);
  const block=js.slice(start,end);
  assert.doesNotMatch(block,/textContent\s*=\s*row\.available_storage_path/);
  assert.doesNotMatch(block,/href\s*=\s*row\.available_storage_path/);
});

test('restricted Privacy Center can scope health-data removal to a provider without disconnecting it',()=>{
  const start=js.indexOf('async function submitRestrictedPrivacyRequest');
  const end=js.indexOf('async function load',start);
  const block=js.slice(start,end);
  assert.match(block,/health_data_delete/);
  assert.match(block,/provider_key:provider/);
  assert.doesNotMatch(block,/disconnect_my_health_provider/);
});
