'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {preview,createPreviewServer}=require('../../tools/affiliate-share-preview/server.cjs');
function decode(file){const r=cp.spawnSync('swift',['-module-cache-path',process.env.RVA_SWIFT_CACHE||'/private/tmp/rva-wave3-swift-cache',path.resolve('tests/wave3-unaffected/decode-qr.swift'),file],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
for(const channel of ['email','sms','dm','social'])test('real '+channel+' QR independently decodes to exact personal synthetic URL',()=>{
 const result=preview({channel,state:'active'}),dir=fs.mkdtempSync(path.join(os.tmpdir(),'rva-wave3-qr-'));try{
 const file=path.join(dir,'qr.png');fs.writeFileSync(file,Buffer.from(result.qr_data_url.split(',')[1],'base64'));
 assert.deepEqual(decode(file),[result.url]);assert.equal(result.modules,49);assert.equal(result.quiet_zone_modules,4);assert.equal(result.error_correction,'M');assert.equal(new URL(result.url).hostname,'academy.synthetic.invalid');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
for(const state of ['revoked','expired','wrong-account'])test(state+' fixture produces no QR/copy/link',()=>{const r=preview({channel:'email',state});assert.equal(r.status,'held');assert.equal(Object.hasOwn(r,'qr_data_url'),false);assert.equal(Object.hasOwn(r,'copy'),false);});
test('unknown channel/state cannot select arbitrary fixture or URL',()=>{assert.throws(()=>preview({channel:'email',state:'https://evil.invalid'}));assert.throws(()=>preview({channel:'send',state:'active'}));});
test('loopback tool rejects foreign origin and arbitrary payload fields',async()=>{
 const s=createPreviewServer();await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+s.address().port;
 try{
 const foreign=await fetch(origin+'/api/preview',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.invalid'},body:'{}'});assert.equal(foreign.status,403);
 const extra=await fetch(origin+'/api/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({channel:'email',state:'active',url:'https://evil.invalid'})});assert.equal(extra.status,400);
 const missing=await fetch(origin+'/not-a-file');assert.equal(missing.status,404);assert.match(missing.headers.get('content-security-policy'),/connect-src 'self'/);
 }finally{await new Promise(resolve=>s.close(resolve));}
});
module.exports={decode};
