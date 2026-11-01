'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const contract = require('../../js/rva-affiliate-share-contract.cjs');
const { fixture } = require('./fixtures.cjs');
for (const channel of contract.CHANNELS) test(`approved ${channel} returns own link/copy/disclosure and exact QR input`, () => {
  const f = fixture(); f.channel = channel;
  const result = contract.shareIntent(f), url = new URL(result.referral_url);
  assert.equal(url.origin, 'https://academy.invalid');
  assert.equal(url.searchParams.get('ref'), f.profile.referral_code);
  assert.equal(url.searchParams.get('rva_channel'), channel);
  assert.equal(url.searchParams.get('rva_campaign'), f.campaign.id);
  assert.equal(result.qr_payload, result.referral_url);
  assert.ok(result.copy_text.includes(f.campaign.disclosure));
  assert.ok(result.copy_text.includes(`resource for ${channel}`));
  assert.equal(result.asset_url, f.creative.asset_url);
  assert.equal(Object.hasOwn(result, 'user_id'), false);
  assert.equal(Object.hasOwn(result, 'contact_id'), false);
  assert.ok(Object.isFrozen(result));
});
const deny = (name, mutate, error) => test(name, () => { const f = fixture(); mutate(f); assert.throws(() => contract.shareIntent(f), error); });
deny('default disabled', f => delete f.context.enabled, /share_disabled/);
deny('unauthenticated snapshot', f => f.context.authenticated = false, /share_disabled/);
deny('wrong user', f => f.profile.user_id = 'fictional-b', /wrong_affiliate/);
deny('wrong contact', f => f.profile.contact_id = 'fictional-b', /wrong_affiliate/);
deny('revoked profile', f => f.profile.referral_profile_status = 'disabled', /inactive_affiliate/);
deny('draft campaign', f => f.campaign.status = 'draft', /unapproved_campaign/);
deny('campaign edit requires reapproval', f => f.campaign.revision++, /unapproved_campaign/);
deny('stale creative campaign pin', f => f.creative.campaign_revision--, /stale_creative/);
deny('unapproved creative', f => f.creative.status = 'draft', /unapproved_creative/);
deny('creative edit requires reapproval', f => f.creative.revision++, /unapproved_creative/);
deny('unapproved copy revision', f => f.creative.copy.email.approved_revision--, /unapproved_copy/);
deny('unsupported channel', f => f.channel = 'automatic_send', /invalid_channel/);
deny('channel not approved for creative', f => f.creative.channels = ['sms'], /channel_or_market_denied/);
deny('market not approved', f => f.context.market = 'US', /channel_or_market_denied/);
deny('blank disclosure', f => f.campaign.disclosure = '', /invalid_text/);
deny('oversized copy', f => f.creative.copy.email.text = 'x'.repeat(4001), /invalid_text/);
deny('control byte in copy', f => f.creative.copy.email.text = 'x\u0000y', /invalid_text/);
for (const record of ['campaign','creative']) {
 deny(`${record} revoked`, f => f[record].revoked_at = '2026-11-01T11:00:00Z', /not_current/);
 deny(`${record} expired at exact boundary`, f => f.context.now = f[record].expires_at, /not_current/);
 deny(`${record} future availability`, f => f[record].starts_at = '2026-11-02T00:00:00Z', /not_current/);
 deny(`${record} malformed time`, f => f[record].expires_at = 'yesterday', /invalid_time/);
}
for (const url of ['javascript:alert(1)','data:text/html,x','//evil.invalid/enroll','http://academy.invalid/enroll',
 'https://academy.invalid.evil.invalid/enroll','https://evil.invalid/enroll','https://a@academy.invalid/enroll',
 'https://academy.invalid/enroll#x','https://academy.invalid/enroll?redirect=https://evil.invalid',
 'https://academy.invalid/%2fenroll','https://academy.invalid/enroll%0A','https://academy.invalid\\evil/enroll']) {
 deny(`destination rejects ${url}`, f => f.campaign.destination_url = url, /unsafe_url|unapproved_destination/);
}
for (const url of ['javascript:alert(1)','https://evil.invalid/a.pdf','https://media.invalid/a.pdf?token=private','https://u:p@media.invalid/a.pdf']) {
 deny(`asset rejects ${url}`, f => f.creative.asset_url = url, /unsafe_url|unapproved_asset/);
}
deny('wrong affiliate URL code', f => f.profile.share_url = 'https://academy.invalid/enroll?ref=RVA-FICTIONAL002', /wrong_referral_link/);
deny('duplicate ref query', f => f.profile.share_url += '&ref=RVA-FICTIONAL001', /wrong_referral_link/);
deny('extra URL field can carry PII', f => f.profile.share_url += '&email=private', /wrong_referral_link/);
deny('invalid code', f => f.profile.referral_code = 'somebody@example.invalid', /invalid_referral_code/);
test('HTML copy stays data; never becomes markup', () => {
 const f = fixture(); f.creative.copy.email.text = '<img src=x onerror=alert(1)>';
 assert.ok(contract.shareIntent(f).copy_text.startsWith('<img'));
});
test('minimal CRM projection discards health, identity, money and arbitrary metadata', () => {
 assert.deepEqual(contract.projectReferral(fixture()), { referral_id:'fictional-referral', status:'engaged' });
});
for (const [name, mutate] of [
 ['wrong affiliate', f => f.referral.referrer_contact_id = 'b'],
 ['wrong disclosure user', f => f.disclosure.viewer_user_id = 'b'],
 ['wrong disclosure subject', f => f.disclosure.referral_id = 'b'],
 ['no approved disclosure', f => f.disclosure.approved = false],
 ['revoked disclosure', f => f.disclosure.revoked_at = f.context.now],
 ['expired disclosure', f => f.disclosure.expires_at = f.context.now],
 ['future disclosure', f => f.disclosure.starts_at = '2026-11-02T00:00:00Z'],
 ['unconsented converted stage', f => f.referral.status = 'converted'],
 ['health stage value', f => { f.referral.status = 'diagnosis'; f.disclosure.statuses = ['diagnosis']; }]
]) test(`CRM denies ${name}`, () => { const f=fixture(); mutate(f); assert.throws(() => contract.projectReferral(f)); });
test('100 duplicate clicks result in one minimal evidence row, no earning', () => {
 const f=fixture(), before=JSON.stringify(f); let state=f.state;
 for(let n=0;n<100;n++) { const result=contract.recordTouchpoint({...f,state}); state=result.state; assert.equal(result.duplicate,n>0); }
 assert.equal(state.events.length,1); assert.equal(JSON.stringify(state).includes('NEVER PROJECT'),false);
 assert.equal(JSON.stringify(state).includes('earning'),false); assert.equal(JSON.stringify(f),before);
});
test('changed attribution under same event key is rejected without state mutation', () => {
 const f=fixture(); f.state=contract.recordTouchpoint(f).state; const before=JSON.stringify(f.state);
 f.event.campaign_id='different'; assert.throws(()=>contract.recordTouchpoint(f),/event_conflict/);
 assert.equal(JSON.stringify(f.state),before);
});
for(const type of ['share.created','share.clicked','appointment.booked']) test(`${type} is nonfinancial evidence only`,()=>{
 const f=fixture();f.event.event_type=type;assert.equal(contract.recordTouchpoint(f).state.events[0].event_type,type);
});
for(const type of ['payment.settled','commission.earned','payout.requested']) test(`${type} cannot enter touchpoint reducer`,()=>{
 const f=fixture();f.event.event_type=type;assert.throws(()=>contract.recordTouchpoint(f),/unsupported_event/);
});
for(const [name,mutate] of [
 ['wrong state scope',f=>f.state.scope_id='b'],['wrong state owner',f=>f.state.user_id='b'],
 ['wrong event owner',f=>f.event.referrer_contact_id='b'],['future event',f=>f.event.occurred_at='2026-11-02T00:00:00Z'],
 ['missing tracking consent',f=>delete f.trackingConsent],['revoked tracking consent',f=>f.trackingConsent.revoked_at=f.context.now],
 ['expired tracking consent',f=>f.trackingConsent.expires_at=f.context.now]
])test(`touchpoint denies ${name}`,()=>{const f=fixture();mutate(f);assert.throws(()=>contract.recordTouchpoint(f));});
test('replay reprojects previous state and drops private extra fields',()=>{
 const f=fixture();f.state=structuredClone(contract.recordTouchpoint(f).state);
 f.state.health='NEVER PROJECT';f.state.events[0].notes='NEVER PROJECT';
 const r=contract.recordTouchpoint(f);assert.equal(r.duplicate,true);assert.equal(JSON.stringify(r.state).includes('NEVER PROJECT'),false);
});
test('bounded event state has an explicit capacity boundary',()=>{
 const f=fixture();f.state.events=Array.from({length:1000},(_,i)=>({...f.event,event_id:'event-'+i}));
 assert.throws(()=>contract.recordTouchpoint(f),/capacity_reached/);
});

test('preexisting duplicate state is rejected rather than amplified',()=>{
 const f=fixture();f.state.events=[{...f.event},{...f.event}];
 assert.throws(()=>contract.recordTouchpoint(f),/invalid_state/);
});
