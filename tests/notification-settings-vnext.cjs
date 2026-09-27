const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(path)=>fs.readFileSync(path,'utf8');

test('Notification Settings vNext exposes quiet hours and time zone in the existing form',()=>{
  const html=read('member/index.html');
  for(const id of ['pref-quiet-enabled','pref-quiet-start','pref-quiet-end','pref-time-zone'])assert(html.includes('id="'+id+'"'),id);
  assert.equal((html.match(/id="rm-notification-form"/g)||[]).length,1);
});

test('notification preferences save through the authenticated RPC instead of direct table upsert',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('async function saveNotificationPreferences');
  const end=js.indexOf('function safeFilename',start);
  const block=js.slice(start,end);
  assert.match(block,/rpc\("update_my_notification_preferences"/);
  assert.doesNotMatch(block,/from\("notification_preferences"\).*upsert/);
  for(const key of ['quiet_hours_enabled','quiet_hours_start','quiet_hours_end','time_zone'])assert(block.includes(key),key);
});

test('quiet hours require both times and use browser time zone as a fallback',()=>{
  const js=read('member/member110.js');
  const start=js.indexOf('async function saveNotificationPreferences');
  const end=js.indexOf('function safeFilename',start);
  const block=js.slice(start,end);
  assert.match(block,/quietEnabled&&\(!quietStart\|\|!quietEnd\)/);
  assert.match(block,/Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/);
});

test('Notification Settings vNext does not expose unverified push toggles',()=>{
  const html=read('member/index.html');
  const start=html.indexOf('id="rm-notification-form"');
  const end=html.indexOf('</form>',start);
  const block=html.slice(start,end);
  assert.doesNotMatch(block,/pref-push|Push notifications|push_messages/i);
});
