'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const P=require('../js/vitality-roadmap-processing.cjs'),{context}=require('./fixtures/roadmap-b6.cjs');
function fixture({empty=false,request:override,expires=Date.now()+60000,report='fictional-source'}={}){
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://revitalizedacademy.com/portal/'}),w=dom.window;
 w.eval(fs.readFileSync('js/vitality-roadmap-view.js','utf8'));w.eval(fs.readFileSync('portal/portal-roadmap-processing.js','utf8'));
 const document=P.buildDraft(context(),{personalized:false}),result={document:empty?null:document,revision:empty?null:1,version_id:empty?null:'fictional-version-1',reviews:[],expires_at:new Date(expires).toISOString()},calls=[],host=w.document.querySelector('main');
 const controller=w.RVA_ROADMAP_PROCESSING.mount(host,{report,request:async b=>{calls.push(b);return override?override(b,result):result;}});
 return{dom,w,host,controller,result,document,calls,close(){controller.stop();w.close();}};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('repeated/concurrent opening and refresh retrieve only read; preserve immutable document and all tabs',async()=>{
 const f=fixture(),original=P.digest(f.document);try{
  await Promise.all([f.controller.start(),f.controller.start(),f.controller.start()]);assert.deepEqual(f.calls.map(x=>x.action),['read']);
  await f.controller.start();assert.deepEqual(f.calls.map(x=>x.action),['read','read']);
  assert.equal(f.host.dataset.revision,'1');assert.equal(f.host.querySelector('h2').textContent,'Revision 1');assert.equal(f.host.querySelectorAll('.roadmap-driver').length,12);
  for(const label of ['My Overview','My 12 Drivers','My Action Plan'])assert(f.host.textContent.includes(label));
  assert.equal(f.host.querySelectorAll('button').length>0,true);assert(!f.host.textContent.includes('Generate authorized founder draft'));assert.equal(P.digest(f.document),original);
 }finally{f.close();}
});
test('no saved draft never processes on open; explicit generation is single-flight',async()=>{
 let release;const f=fixture({empty:true,request:async(b,r)=>b.action==='process'?new Promise(resolve=>{release=()=>resolve({...r,document:f.document,revision:1,version_id:'fictional-version-1'});}):r});try{
  await f.controller.start();assert.deepEqual(f.calls.map(x=>x.action),['read']);
  const button=[...f.host.querySelectorAll('button')].find(b=>b.textContent==='Generate authorized founder draft');assert(button);
  button.click();button.dispatchEvent(new f.w.Event('click'));await tick();assert.equal(f.calls.filter(x=>x.action==='process').length,1);assert.equal(button.disabled,true);
  await f.controller.start();release();await tick();assert.equal(f.host.dataset.revision,'1');assert.equal(f.calls.some(x=>['regenerate','claim','attest'].includes(x.action)),false);
 }finally{f.close();}
});
test('regeneration requires its explicit button and keeps server version provenance',async()=>{
 let resolve;const f=fixture({request:async(b,r)=>{if(b.action==='regenerate')return new Promise(done=>{resolve=()=>done({queued:true});});return b.action==='process'?{...r,revision:2,version_id:'fictional-version-2'}:r;}});try{
  const original=P.digest(f.document);await f.controller.start();const button=[...f.host.querySelectorAll('button')].find(b=>b.textContent==='Return for regeneration');
  button.click();button.dispatchEvent(new f.w.Event('click'));await tick();assert.deepEqual(f.calls.map(x=>x.action),['read','regenerate']);assert.equal(f.calls[1].payload.version_id,'fictional-version-1');
  resolve();await tick();assert.deepEqual(f.calls.map(x=>x.action),['read','regenerate','process']);assert.equal(f.host.dataset.revision,'2');assert.equal(P.digest(f.document),original);
 }finally{f.close();}
});
test('network failure gives visible read-only feedback without retry or generation',async()=>{
 const f=fixture({request:async()=>{throw Error('FICTIONAL_NETWORK_FAILURE');}});try{await f.controller.start();await tick();assert(f.host.textContent.includes('Saved draft unavailable.'));assert(f.host.textContent.includes('No processing was requested.'));assert.deepEqual(f.calls.map(x=>x.action),['read']);assert.equal(f.host.querySelectorAll('form').length,0);}finally{f.close();}
});
test('logout during read prevents stale private rendering and subsequent access',async()=>{
 let release;const f=fixture({request:async(b,r)=>new Promise(resolve=>{release=()=>resolve(r);})});try{const opening=f.controller.start();f.w.document.dispatchEvent(new f.w.Event('ra:staff-access-reset'));release();await opening;assert.equal(f.host.textContent,'');await f.controller.start();f.w.dispatchEvent(new f.w.Event('focus'));assert.equal(f.calls.length,1);assert.equal(f.host.dataset.revision,undefined);}finally{f.close();}
});
test('expired authorization never renders the saved report or generation controls',async()=>{
 for(const empty of [false,true]){const f=fixture({empty,expires:Date.now()-1000});try{await f.controller.start();assert.equal(f.host.textContent,'');assert.equal(f.host.querySelectorAll('button,form').length,0);assert.deepEqual(f.calls.map(x=>x.action),['read']);}finally{f.close();}}
});
test('concurrent source views retain distinct identities and never share report state',async()=>{
 const a=fixture({report:'fictional-source-a'}),b=fixture({report:'fictional-source-b'});try{a.document.roadmap.summary='SYNTHETIC_SOURCE_A';b.document.roadmap.summary='SYNTHETIC_SOURCE_B';await Promise.all([a.controller.start(),b.controller.start()]);assert(a.host.textContent.includes('SYNTHETIC_SOURCE_A'));assert(!a.host.textContent.includes('SYNTHETIC_SOURCE_B'));assert(b.host.textContent.includes('SYNTHETIC_SOURCE_B'));assert.deepEqual(a.calls.map(x=>[x.action,x.report]),[['read','fictional-source-a']]);assert.deepEqual(b.calls.map(x=>[x.action,x.report]),[['read','fictional-source-b']]);}finally{a.close();b.close();}
});
test('unknown revision is never fabricated as Revision 1',async()=>{
 const f=fixture();try{f.result.revision=null;await f.controller.start();assert(f.host.textContent.includes('Saved draft · revision unavailable'));assert.equal(f.host.dataset.revision,undefined);}finally{f.close();}
});
