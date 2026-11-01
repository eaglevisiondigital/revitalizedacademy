'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createFictionalLookupAdapter}=require('../../tools/coach-companion-catalog/async-fixture-adapter.cjs');
const {v3Fixture}=require('./v3-async-fixture.cjs');const {deferred}=require('./fixture.cjs');
const held=r=>{assert.equal(r.status,'held_for_review');assert.equal(r.results.length,0);assert.equal(r.productionEligible,false);};
test('async fictional catalog resolves exact educational citation from independent server receipt snapshot',async()=>{
 const f=v3Fixture(),r=await f.adapter.execute(f.request);assert.equal(r.status,'supported_education');assert.equal(r.results[0].text,f.claim.text);assert.equal(r.results[0].citation.sourceHash,f.source.sha256);assert.equal(r.results[0].citation.claimHash,f.claim.sha256);assert.equal(r.results[0].contentType,'untrusted_source_text');assert.equal(r.fixtureOnly,true);assert.equal(r.productionEligible,false);assert.ok(Object.isFrozen(r.results[0].citation));assert.equal(JSON.stringify(r).includes('principal_ref'),false);
});
for(const key of ['session','principal_ref','source','catalog','receipt','approval','audience','operation','intent','safetyHold'])test('caller '+key+' cannot become V3 verifier authority',async()=>{
 const f=v3Fixture();held(await f.adapter.execute({...f.request,[key]:'FORGED PRIVATE DATA'}));assert.equal(f.calls.length,0);
});
for(const change of ['principal','audience','generation','epoch','revoked','catalog'])test('async V3 '+change+' drift fails closed',async()=>{
 const f=v3Fixture(),gate=deferred(),arrived=deferred();let first=true;f.hooks.receipts=async()=>{if(first){first=false;arrived.resolve();await gate.promise;}};const task=f.adapter.execute(f.request);await arrived.promise;
 if(change==='principal')f.session.principal_ref='fictional-reviewer-b';if(change==='audience')f.session.audience='unavailable_audience';if(change==='generation')f.session.approval_generation=2;if(change==='epoch')f.session.authorization_epoch='fictional-epoch-b';if(change==='revoked'){f.receipts.records[1].verdict='revoked';f.bump();}if(change==='catalog'){f.catalog.claims[0].text+=' Changed';f.bump();}gate.resolve();held(await task);
});
test('same-principal token renewal does not discard a legitimate educational lookup',async()=>{
 const f=v3Fixture(),gate=deferred(),arrived=deferred();let first=true;f.hooks.catalog=async()=>{if(first){first=false;arrived.resolve();await gate.promise;}};const task=f.adapter.execute(f.request);await arrived.promise;f.session.transport_revision='token-two';gate.resolve();assert.equal((await task).status,'supported_education');
});
test('receipt changes without authority bump cannot pass independent second snapshot',async()=>{
 const f=v3Fixture();let first=true;f.hooks.receipts=()=>{if(first){first=false;f.receipts.records[1].verdict='revoked';}};held(await f.adapter.execute(f.request));
});
test('forged locally approved hashes do not replace independently resolved receipt pins',async()=>{
 const f=v3Fixture();f.receipts.records[1].targetHash='d'.repeat(64);held(await f.adapter.execute(f.request));
});
test('final synchronous current authority catches late revocation',async()=>{
 const f=v3Fixture();let count=0;f.hooks.current=()=>{if(++count===2)f.session.educationAllowed=false;};held(await f.adapter.execute(f.request));
});
test('missing or duplicate receipts and source audience mismatch remain held',async()=>{
 for(const mode of ['missing','duplicate','audience']){const f=v3Fixture();if(mode==='missing')f.receipts.records=[];if(mode==='duplicate')f.receipts.records.push(structuredClone(f.receipts.records[0]));if(mode==='audience')f.receipts.audience='unavailable_audience';held(await f.adapter.execute(f.request));}
});
test('raw dependency error and getter cannot leak or execute through V3 snapshots',async()=>{
 const f=v3Fixture();f.deps.resolveCatalog=async()=>{throw Error('PRIVATE RAW ERROR');};const r=await f.adapter.execute(f.request);held(r);assert.equal(JSON.stringify(r).includes('PRIVATE'),false);
 const g=v3Fixture();let invoked=false;g.deps.resolveCatalog=async()=>Object.defineProperty({},'catalog',{enumerable:true,get(){invoked=true;throw Error('PRIVATE');}});held(await g.adapter.execute(g.request));assert.equal(invoked,false);
});
test('real mode and private request refuse before source resolver or verifier work',async()=>{
 assert.throws(()=>createFictionalLookupAdapter({mode:'production'}),/fixture_dependencies_required/);const f=v3Fixture();held(await f.adapter.execute({...f.request,answers:['PRIVATE FIXTURE']}));assert.equal(f.calls.length,0);
});
