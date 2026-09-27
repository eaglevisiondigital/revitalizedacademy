const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Calendar vNext is unified, post-first-paint and default hidden',()=>{
  const js=read('member/member110.js');
  const html=read('member/index.html');
  assert.match(js,/feature_member_calendar_vnext/);
  assert.match(js,/from\("my_calendar_feed_60d"\)/);
  assert.match(html,/id="rm-calendar-card"[^>]*hidden/);
  const load=js.indexOf('async function loadDashboard()');
  const show=js.indexOf('showOnly("rm-dashboard")',load);
  const launch=js.indexOf('loadCalendarVNext(loadSequence)',show);
  assert(show>load&&launch>show);
});

test('Calendar vNext queries only safe presentation columns',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('async function loadCalendarVNext');
  const end=js.indexOf('function renderProgressPhotos',start);
  const block=js.slice(start,end);
  assert.match(block,/source_id,item_type,title,status,starts_at,ends_at,item_date,all_day,location_url/);
  assert.doesNotMatch(block,/metadata/);
});

test('Calendar vNext exposes only approved client-side filters',()=>{
  const html=read('member/index.html');
  const start=html.indexOf('id="rm-calendar-card"');
  const end=html.indexOf('rm185-app-home-card',start);
  const block=html.slice(start,end);
  for(const filter of ['all','coaching','workouts','meals','goals','challenges'])assert(block.includes('data-calendar-filter="'+filter+'"'),filter);
});

test('staging seeds Calendar vNext disabled by default',()=>{
  const provision=read('scripts/staging/provision.cjs');
  assert.match(provision,/feature_member_calendar_vnext/);
  assert.match(provision,/feature_member_calendar_vnext','false'::jsonb/);
});
