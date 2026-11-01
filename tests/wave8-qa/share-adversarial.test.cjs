'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createProviders,DRIVERS}=require('../../tools/wave5-fixture-providers.cjs');
const {request}=require('../../tools/wave7-share-review.cjs');
const {createReviewedShare}=require('../../tools/wave8-reviewed-share.cjs');
const qr=()=>({qr_data_url:'data:image/png;base64,ZmljdGlvbmFs',modules:21,quiet_zone_modules:4,error_correction:'M'});
for(const state of ['revoked','expired','wrong-account','education-revoked','logout','consent-revoked'])test('real authority transition during QR encoding fails closed '+state,async()=>{
 const p=createProviders(),reader=createReviewedShare({providers:p,encodeQr:async()=>{p.transition(state);return qr();}}),result=await reader.execute(request(p.manifest(),'email',DRIVERS[0]));
 assert.equal(result.status,'held');assert.equal(result.reason,'source_version_mismatch');assert.equal(result.copy,undefined);assert.equal(result.education,undefined);assert.equal(result.qr_data_url,undefined);
});
test('exact unchanged provider renewal is allowed, without new event or identity join',async()=>{
 const p=createProviders(),m=p.manifest(),result=await createReviewedShare({providers:p,encodeQr:async()=>{p.transition('renewed');return qr();}}).execute(request(m,'email',DRIVERS[0]));
 assert.equal(result.status,'ready');assert.equal(result.boundaries.recordsEvent,false);assert.equal(result.boundaries.joinsClientIdentity,false);
 const event=await p.shareAdapter.execute({...p.manifest().share,action:'touchpoint',channel:'email',event_id:'fictional-wave8-independent-first',event_type:'share.created'});assert.equal(event.event_count,1);assert.equal(event.duplicate,false);
});
test('documented trusted-provider contract limitation: stale manifest is not independent revocation proof',async()=>{
 const p=createProviders(),m=p.manifest(),wrapped={...p,manifest:()=>m};
 const result=await createReviewedShare({providers:wrapped,encodeQr:async()=>{p.transition('revoked');return qr();}}).execute(request(m,'email',DRIVERS[0]));
 // This deliberately violates the current provider's monotonic authority-revision contract.
 // Record observed boundary honestly; never certify this adapter for such a provider.
 assert.equal(result.status,'ready');assert.equal((await p.shareAdapter.execute({...m.share,channel:'email'})).status,'held');
});
