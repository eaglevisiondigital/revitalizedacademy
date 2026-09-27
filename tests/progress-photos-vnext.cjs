const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Progress Photos vNext is private-viewing only and default hidden',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  assert.match(js,/feature_member_progress_photos_vnext/);
  assert.match(js,/from\("my_progress_photo_sets"\)/);
  assert.match(js,/from\("my_progress_photos"\)/);
  assert.match(html,/id="rm-progress-photos-card"[^>]*hidden/);
});

test('Progress Photos uses short-lived signed URLs and never public URLs',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function renderProgressPhotos');
  const end=js.indexOf('function updatePrivacyProviderScope',start);
  const block=js.slice(start,end);
  assert.match(block,/createSignedUrl\(row\.storage_path,300\)/);
  assert.doesNotMatch(block,/getPublicUrl/);
  assert.match(block,/referrerPolicy="no-referrer"/);
});

test('Progress Photos does not expose raw storage paths into rendered DOM',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function renderProgressPhotos');
  const end=js.indexOf('async function loadProgressPhotosVNext',start);
  const renderBlock=js.slice(start,end);
  assert.doesNotMatch(renderBlock,/storage_path/);
  assert.doesNotMatch(renderBlock,/dataset\..*path|textContent=.*path|href=.*storage/i);
});

test('Progress Photos browser has no direct Storage upload or photo-row mutation workflow',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('function renderProgressPhotos');
  const end=js.indexOf('function updatePrivacyProviderScope',start);
  const block=js.slice(start,end);
  assert.doesNotMatch(block,/client\.storage[\s\S]*\.upload\(/);
  assert.doesNotMatch(block,/from\("progress_photos"\)[\s\S]*\.(insert|update|delete)\(/);
  assert.doesNotMatch(block,/from\("progress_photo_sets"\)[\s\S]*\.(insert|update|delete)\(/);
  assert.match(block,/edgeBaseUrl\+"\/progress-photo-upload"/);
});

test('Progress Photos loads after first paint and is sequence guarded',()=>{
  const js=read('member/member110.js');
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadProgressPhotosVNext(loadSequence)',show);
  assert(show>load&&launch>show);
  const start=js.indexOf('async function loadProgressPhotosVNext');
  const end=js.indexOf('function updatePrivacyProviderScope',start);
  const block=js.slice(start,end);
  assert((block.match(/loadSequence!==dashboardLoadSequence/g)||[]).length>=2);
});

test('staging seeds Progress Photos vNext disabled by default',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_progress_photos_vnext/);
  assert.match(provision,/feature_member_progress_photos_vnext','false'::jsonb/);
});
