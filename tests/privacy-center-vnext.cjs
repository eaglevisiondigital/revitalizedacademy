const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Privacy Center vNext lives inside My Account and defaults hidden',()=>{
  const html=read('member/index.html');
  const js=read('member/member110.js');
  assert.match(html,/id="rm-member-account-card"[\s\S]*id="rm-privacy-center"[^>]*hidden/);
  assert.match(js,/feature_member_privacy_center/);
  assert.match(js,/from\("my_privacy_center"\)/);
});

test('Privacy Center uses request RPCs and provider disconnect without direct destructive deletion',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function updatePrivacyProviderScope');
  const end=js.indexOf('function homeVNextTarget',start);
  const block=js.slice(start,end);
  assert.match(block,/submit_my_privacy_request/);
  assert.match(block,/disconnect_my_health_provider/);
  assert.doesNotMatch(block,/\.delete\(|execute_health_data_delete_request|auth\.admin\.deleteUser/);
});

test('Privacy Center keeps export storage paths internal and uses signed delivery only',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  const start=js.indexOf('function renderPrivacyCenter');
  const end=js.indexOf('async function submitPrivacyRequest',start);
  const block=js.slice(start,end);
  assert.match(block,/my_privacy_exports/);
  assert.match(block,/available_storage_path/);
  assert.match(block,/createSignedUrl\(storagePath,300\)/);
  assert.doesNotMatch(block,/textContent\s*=\s*row\.available_storage_path/);
  assert.doesNotMatch(block,/href\s*=\s*row\.available_storage_path/);
  assert.doesNotMatch(block,/getPublicUrl/);
  const accountStart=html.indexOf('id="rm-member-account-card"');
  const accountEnd=html.indexOf('rm121-settings-card',accountStart);
  const account=html.slice(accountStart,accountEnd);
  assert.doesNotMatch(account,/available_storage_path|storage_path/);
});

test('Privacy Center loads after first paint and fails locally',()=>{
  const js=read('member/member110.js');
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadPrivacyCenterEnhancement(loadSequence)',show);
  assert(show>load&&launch>show);
  const start=js.indexOf('async function loadPrivacyCenterEnhancement');
  const end=js.indexOf('async function submitPrivacyRequest',start);
  const block=js.slice(start,end);
  assert.match(block,/Privacy Center optional read unavailable:/);
  assert.match(block,/loadSequence!==dashboardLoadSequence/);
});

test('staging seeds Privacy Center disabled by default',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_privacy_center/);
  assert.match(provision,/feature_member_privacy_center','false'::jsonb/);
});
