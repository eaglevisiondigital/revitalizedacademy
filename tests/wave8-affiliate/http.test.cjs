'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createProviders}=require('../../tools/wave5-fixture-providers.cjs');
const {request}=require('../../tools/wave7-share-review.cjs');
const {createPreviewServer}=require('../../tools/affiliate-share-preview/server.cjs');
async function fixture(fn){const p=createProviders(),s=createPreviewServer({providers:p});await new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});try{await fn('http://127.0.0.1:'+s.address().port,p);}finally{s.closeAllConnections();await new Promise(r=>s.close(r));}}
const post=(base,data,headers={})=>fetch(base+'/api/reviewed-preview',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
for(const channel of ['email','sms','dm','social'])test('actual HTTP copy/source/encoded QR '+channel,()=>fixture(async(base,p)=>{const r=await post(base,request(p.manifest(),channel,'cellular_hydration'));assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const data=await r.json();assert.equal(data.status,'ready');assert.match(data.copy,new RegExp(channel));assert.match(data.qr_data_url,/^data:image\/png;base64,iVBOR/);assert.equal(data.quiet_zone_modules,4);assert.equal(data.boundaries.recordsEvent,false);assert.equal(data.pins.driver,'cellular_hydration');assert.match(data.url,/synthetic.invalid/);}));
test('actual cross-origin denial',()=>fixture(async(base,p)=>{const r=await post(base,request(p.manifest(),'email','cellular_hydration'),{Origin:'https://attacker.synthetic.invalid'});assert.equal(r.status,403);}));
test('actual size limit / body rejection',()=>fixture(async(base,p)=>{const r=await post(base,{...request(p.manifest(),'email','cellular_hydration'),health_answers:'x'.repeat(4100)});assert.equal(r.status,413);}));
test('actual missing source scope is held without copy or QR',()=>fixture(async(base,p)=>{p.transition('education-revoked');const r=await post(base,request(p.manifest(),'email','cellular_hydration')),data=await r.json();assert.equal(data.status,'held');assert.equal(data.copy,undefined);assert.equal(data.qr_data_url,undefined);}));
