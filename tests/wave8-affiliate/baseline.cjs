'use strict';
const assert=require('node:assert/strict');
const {createPreviewServer}=require('../../tools/affiliate-share-preview/server.cjs');
const {createProviders}=require('../../tools/wave5-fixture-providers.cjs');
const {request}=require('../../tools/wave7-share-review.cjs');
(async()=>{const s=createPreviewServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));try{const r=await fetch('http://127.0.0.1:'+s.address().port+'/api/reviewed-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request(createProviders().manifest(),'email','cellular_hydration'))});assert.equal(r.status,404);console.log('BASELINE_CONFIRMED: no source-pinned combined manual-copy / QR / educational-reference action; existing endpoint404. This is missing composition, not missing source approval or permission.');}finally{s.closeAllConnections();await new Promise(r=>s.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
