'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createFixtureAdapter}=require('../../tools/affiliate-share-preview/adapter.cjs');
const {adapterFixture,touch,deferred}=require('./fixture.cjs');
const held=(r,reason)=>{assert.equal(r.status,'held');assert.equal(r.productionEligible,false);assert.equal(r.fixtureOnly,true);if(reason)assert.equal(r.reason,reason);};
for(const channel of ['email','sms','dm','social'])test('resolver-backed '+channel+' share returns only approved own copy/link/QR input',async()=>{
 const f=adapterFixture();const r=await f.adapter.execute({...f.shareRequest,channel});assert.equal(r.status,'ready');assert.equal(new URL(r.intent.referral_url).hostname,'academy.synthetic.invalid');assert.equal(new URL(r.intent.referral_url).searchParams.get('ref'),f.share.profile.referral_code);assert.equal(r.intent.qr_payload,r.intent.referral_url);assert.ok(r.intent.copy_text.includes('Fictional approved disclosure'));assert.equal(r.fixtureOnly,true);assert.equal(r.productionEligible,false);assert.equal(Object.hasOwn(r,'session'),false);assert.equal(Object.hasOwn(r,'profile'),false);assert.ok(Object.isFrozen(r.intent));
 const call=f.calls.find(c=>c.kind==='share');assert.ok(Object.isFrozen(call.args.actor));assert.equal(call.args.actor.user_id,f.session.user_id);
});
for(const key of ['identity','user_id','contact_id','profile','approval','destination_url','copy','consent','now','state'])test('caller '+key+' rejected before any session/resolver call',async()=>{
 const f=adapterFixture();held(await f.adapter.execute({...f.shareRequest,[key]:'FORGED PRIVATE SHOULD NOT LEAK'}),'unexpected_fields');assert.equal(f.calls.length,0);
});
test('request getters and prototype pollution are rejected without executing accessors',async()=>{
 const f=adapterFixture();let invoked=false;const input={...f.shareRequest};Object.defineProperty(input,'profile',{enumerable:true,get(){invoked=true;throw Error('PRIVATE');}});held(await f.adapter.execute(input));assert.equal(invoked,false);held(await f.adapter.execute(JSON.parse('{"action":"referral","referral_id":"fictional-referral","__proto__":{}}')));assert.equal(f.calls.length,0);
});
test('caller mutation across await cannot replace the snapshotted channel/resource',async()=>{
 const f=adapterFixture(),gate=deferred(),arrived=deferred();let first=true;f.hooks.share=async()=>{if(first){first=false;arrived.resolve();await gate.promise;}};const request={...f.shareRequest},work=f.adapter.execute(request);await arrived.promise;request.channel='send';request.campaign_id='fictional-forged';gate.resolve();const r=await work;assert.equal(r.status,'ready');assert.equal(r.intent.channel,'email');
});
for(const change of ['logout','switch','scope','role','epoch','revoke','version'])test('async share '+change+' invalidates pending authority/source',async()=>{
 const f=adapterFixture(),gate=deferred(),arrived=deferred();let first=true;f.hooks.share=async()=>{if(first){first=false;arrived.resolve();await gate.promise;}};const task=f.adapter.execute(f.shareRequest);await arrived.promise;
 if(change==='logout')f.session.authenticated=false;
 if(change==='switch')f.identity('b');
 if(change==='scope')f.session.scope_id='fictional-other-scope';
 if(change==='role')f.session.role='coach';
 if(change==='epoch')f.session.authorization_epoch='fixture-epoch-b';
 if(change==='revoke'){f.share.creative.revoked_at='2026-11-01T12:00:00Z';f.bump();}
 if(change==='version'){f.share.creative.revision++;f.bump();}
 gate.resolve();held(await task);
});
test('same-account token renewal across async share preserves current request',async()=>{
 const f=adapterFixture(),gate=deferred(),arrived=deferred();let first=true;f.hooks.share=async()=>{if(first){first=false;arrived.resolve();await gate.promise;}};const task=f.adapter.execute(f.shareRequest);await arrived.promise;f.session.transport_revision='transport-2';gate.resolve();assert.equal((await task).status,'ready');
});
test('source changes without declared authority revision still fail snapshot comparison',async()=>{
 const f=adapterFixture();let count=0;f.hooks.share=()=>{if(++count===1)f.share.creative.copy.email.text='Fictional changed text';};held(await f.adapter.execute(f.shareRequest),'source_changed');
});
test('final synchronous authority read prevents revocation after the last async session snapshot',async()=>{
 const f=adapterFixture();f.hooks.clock=()=>{f.share.creative.revoked_at='2026-11-01T12:00:00Z';f.bump();};held(await f.adapter.execute(f.shareRequest),'authority_changed');
});
test('expiry is rechecked using server clock after resolver awaits',async()=>{
 const f=adapterFixture();f.hooks.share=()=>f.setNow('2026-11-03T00:00:00Z');held(await f.adapter.execute(f.shareRequest),'not_current');
});
for(const field of ['campaign','creative'])test(field+' expected revision is mandatory and exact',async()=>{
 const f=adapterFixture();held(await f.adapter.execute({...f.shareRequest,['expected_'+field+'_revision']:99}),'source_version_mismatch');
});
test('wrong resolver resource or version tag cannot satisfy request',async()=>{
 const f=adapterFixture();f.share.authority_revision=2;held(await f.adapter.execute(f.shareRequest),'source_version_mismatch');
 const g=adapterFixture();g.share.creative.id='fictional-other';held(await g.adapter.execute(g.shareRequest),'source_version_mismatch');
});
test('owner role uses same own-profile constraint and never cross-affiliate override',async()=>{
 const f=adapterFixture();f.session.role='owner';assert.equal((await f.adapter.execute(f.shareRequest)).status,'ready');f.share.profile.contact_id='fictional-contact-b';held(await f.adapter.execute(f.shareRequest),'wrong_affiliate');
});
test('server action scope cannot be overridden by Owner role or request',async()=>{
 const f=adapterFixture();f.session.role='owner';f.session.allowed_actions=['referral'];held(await f.adapter.execute(f.shareRequest),'operation_denied');
});
test('minimal referral response never exposes resolver identity, names, money or disclosure',async()=>{
 const f=adapterFixture(),r=await f.adapter.execute(f.referralRequest);assert.equal(r.status,'ready');assert.deepEqual(r.referral,{referral_id:'fictional-referral',status:'engaged'});assert.equal(JSON.stringify(r).includes('contact'),false);assert.equal(Object.hasOwn(r,'disclosure'),false);
});
for(const change of ['wrong-owner','withdrawn','expired','wrong-subject','private-row'])test('referral '+change+' cannot cross disclosure boundary',async()=>{
 const f=adapterFixture();if(change==='wrong-owner')f.referral.referral.referrer_contact_id='fictional-contact-b';if(change==='withdrawn')f.referral.disclosure.revoked_at='2026-11-01T11:00:00Z';if(change==='expired')f.referral.disclosure.expires_at='2026-11-01T12:00:00Z';if(change==='wrong-subject')f.referral.referral.referral_id='fictional-b';if(change==='private-row')f.referral.referral.assessment_answers='PRIVATE FIXTURE NEVER EXPOSE';const r=await f.adapter.execute(f.referralRequest);held(r);assert.equal(JSON.stringify(r).includes('PRIVATE'),false);
});
test('referral revoked during async resolver does not return old projection',async()=>{
 const f=adapterFixture(),gate=deferred(),arrived=deferred();let first=true;f.hooks.referral=async()=>{if(first){first=false;arrived.resolve();await gate.promise;}};const task=f.adapter.execute(f.referralRequest);await arrived.promise;f.referral.disclosure.approved=false;f.bump();gate.resolve();held(await task);
});
test('production destinations and malformed resolver snapshots remain unavailable',async()=>{
 const f=adapterFixture();f.share.policy.destination_urls=['https://not-a-fixture.example/enroll'];held(await f.adapter.execute(f.shareRequest),'fictional_url_required');
 const g=adapterFixture();g.deps.resolveShare=async()=>{throw Error('PRIVATE RAW RESOLVER ERROR');};const r=await g.adapter.execute(g.shareRequest);held(r,'dependency_unavailable');assert.equal(JSON.stringify(r).includes('PRIVATE'),false);
});
test('resolver snapshot getters are rejected without invocation',async()=>{
 const f=adapterFixture();let invoked=false;f.deps.resolveShare=async()=>{const x={};Object.defineProperty(x,'profile',{enumerable:true,get(){invoked=true;throw Error('PRIVATE');}});return x;};held(await f.adapter.execute(f.shareRequest));assert.equal(invoked,false);
});
test('synchronous current-authority dependency cannot be an async snapshot',async()=>{
 const f=adapterFixture();f.deps.currentAuthority=async()=>f.session;held(await f.adapter.execute(f.shareRequest));
});
test('fixture mode is mandatory; no dependencies or real mode cannot construct adapter',()=>{
 assert.throws(()=>createFixtureAdapter({mode:'production'}),/fixture_dependencies_required/);assert.throws(()=>createFixtureAdapter(null),/fixture_dependencies_required/);
});
test('100 parallel duplicates atomically create one isolated evidence row',async()=>{
 const f=adapterFixture(),results=await Promise.all(Array.from({length:100},()=>f.adapter.execute(touch(f))));assert.equal(results.filter(r=>r.status==='recorded').length,100);assert.equal(results.filter(r=>r.duplicate===false).length,1);assert.equal(results.filter(r=>r.duplicate===true).length,99);assert.ok(results.every(r=>r.event_count===1));assert.ok(results.every(r=>!JSON.stringify(r).includes('fictional-contact')));
 f.setNow('2026-11-01T13:00:00Z');const replay=await f.adapter.execute(touch(f));assert.equal(replay.duplicate,true);assert.equal(replay.event_count,1);
});
test('parallel changed retry conflicts without overwriting the first evidence row',async()=>{
 const f=adapterFixture();const [a,b]=await Promise.all([f.adapter.execute(touch(f)),f.adapter.execute(touch(f,'fictional-event',{channel:'dm'}))]);assert.equal(a.status,'recorded');held(b,'event_conflict');const replay=await f.adapter.execute(touch(f));assert.equal(replay.duplicate,true);assert.equal(replay.event_count,1);
});
test('separate actors and separate adapter instances do not share fixture journals',async()=>{
 const f=adapterFixture();assert.equal((await f.adapter.execute(touch(f))).event_count,1);f.identity('b');assert.equal((await f.adapter.execute(touch(f))).duplicate,false);f.identity('a');assert.equal((await f.adapter.execute(touch(f))).duplicate,true);
 const other=adapterFixture();assert.equal((await other.adapter.execute(touch(other))).duplicate,false);
});
for(const type of ['payment.settled','commission.earned','payout.requested','reward.granted'])test(type+' rejected before any dependency call',async()=>{
 const f=adapterFixture();held(await f.adapter.execute(touch(f,'fictional-event',{event_type:type})),'unsupported_event');assert.equal(f.calls.length,0);
});
test('withdrawn tracking consent produces no hidden journal write',async()=>{
 const f=adapterFixture();f.share.trackingConsent.approved=false;held(await f.adapter.execute(touch(f)),'tracking_denied');f.share.trackingConsent.approved=true;const r=await f.adapter.execute(touch(f));assert.equal(r.event_count,1);assert.equal(r.duplicate,false);
});
test('bounded queue rejects overflow while accepted distinct writes remain atomic',async()=>{
 const f=adapterFixture();const all=await Promise.all(Array.from({length:129},(_,i)=>f.adapter.execute(touch(f,'fictional-event-'+i))));assert.equal(all.filter(r=>r.status==='recorded').length,128);assert.equal(all.filter(r=>r.reason==='queue_capacity').length,1);assert.equal(all.filter(r=>r.status==='recorded').at(-1).event_count,128);
});

test('queued requests retain entry actor and never migrate into a later account',async()=>{
 const f=adapterFixture(),gate=deferred(),arrived=deferred();let first=true;f.hooks.share=async()=>{if(first){first=false;arrived.resolve();await gate.promise;}};
 const one=f.adapter.execute(touch(f,'fictional-one'));await arrived.promise;const two=f.adapter.execute(touch(f,'fictional-two'));f.identity('b');gate.resolve();
 held(await one);held(await two,'authority_changed');const current=await f.adapter.execute(touch(f,'fictional-current'));assert.equal(current.status,'recorded');assert.equal(current.event_count,1);
});
test('rejected async current-authority dependency is consumed and fails closed',async()=>{
 const f=adapterFixture();f.deps.currentAuthority=async()=>{throw Error('PRIVATE PROMISE ERROR');};const r=await f.adapter.execute(f.shareRequest);held(r,'synchronous_dependency_required');assert.equal(JSON.stringify(r).includes('PRIVATE'),false);await new Promise(resolve=>setImmediate(resolve));
});
test('rejected async clock cannot leak or authorize a write',async()=>{
 const f=adapterFixture();f.deps.clock=async()=>{throw Error('PRIVATE CLOCK ERROR');};const r=await f.adapter.execute(touch(f));held(r,'synchronous_dependency_required');assert.equal(JSON.stringify(r).includes('PRIVATE'),false);await new Promise(resolve=>setImmediate(resolve));
});
