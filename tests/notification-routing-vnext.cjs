const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('member/member110.js','utf8');
const provision=fs.readFileSync('scripts/staging/provision.cjs','utf8');

test('notification routing uses route_key and not resolved arbitrary URLs',()=>{
  const start=js.indexOf('function notificationRouteTarget');
  const end=js.indexOf('function renderNotifications',start);
  const block=js.slice(start,end);
  assert.match(block,/my_notification_routes/);
  assert.match(block,/route_key/);
  assert.doesNotMatch(block,/resolved_link_url/);
  assert.doesNotMatch(block,/window\.location|location\.href/);
});

test('notification routing only maps known in-page dashboard targets',()=>{
  const start=js.indexOf('function notificationRouteTarget');
  const end=js.indexOf('async function openNotificationRoute',start);
  const block=js.slice(start,end);
  for(const key of ['today','coaching','messages','courses','family_hub','health','progress','progress_photos','settings','billing','ask_revitalized'])assert(block.includes(key),key);
  assert.match(block,/\|\|null/);
});

test('notification routing preserves existing read and dismiss behavior',()=>{
  assert.match(js,/p_action:"read"/);
  assert.match(js,/p_action:"dismissed"/);
});

test('notification routing is disabled in staging by default',()=>{
  assert.match(provision,/feature_member_notification_routing_vnext/);
  assert.match(provision,/feature_member_notification_routing_vnext','false'::jsonb/);
});
