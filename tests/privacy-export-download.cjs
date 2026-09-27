const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');
const html=fs.readFileSync('member/index.html','utf8');

test('Privacy Center loads member-scoped export records',()=>{
  const start=js.indexOf('async function loadPrivacyCenterEnhancement');
  const end=js.indexOf('async function submitPrivacyRequest',start);
  const block=js.slice(start,end);
  assert.match(block,/from\("my_privacy_exports"\)/);
  assert.match(block,/available_storage_path/);
});

test('Privacy export download uses a five-minute private signed URL',()=>{
  const start=js.indexOf('async function downloadPrivacyExport');
  const end=js.indexOf('async function loadPrivacyCenterEnhancement',start);
  const block=js.slice(start,end);
  assert.match(block,/from\("privacy-exports"\)/);
  assert.match(block,/createSignedUrl\(storagePath,300\)/);
  assert.doesNotMatch(block,/getPublicUrl/);
});

test('raw privacy export storage path is never rendered directly',()=>{
  const start=js.indexOf('function renderPrivacyCenter');
  const end=js.indexOf('async function downloadPrivacyExport',start);
  const block=js.slice(start,end);
  assert.doesNotMatch(block,/textContent\s*=\s*row\.available_storage_path/);
  assert.doesNotMatch(block,/href\s*=\s*row\.available_storage_path/);
  assert.match(html,/id="rm-privacy-exports"/);
});
