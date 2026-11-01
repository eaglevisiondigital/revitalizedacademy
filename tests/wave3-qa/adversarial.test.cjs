'use strict';
// Independent fictional probes. No network, real identity or production adapter.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const {JSDOM}=require('../wave2-client/dependencies.cjs').jsdom();
const {memberFixture}=require('../wave3-unaffected/member-fixture.cjs');
const settle=()=>new Promise(r=>setTimeout(r,0));
function previewFixture(){
 const dom=new JSDOM(fs.readFileSync('tools/affiliate-share-preview/index.html','utf8'),{runScripts:'outside-only',url:'http://127.0.0.1:44444/'});
 const pending=[];dom.window.fetch=()=>new Promise(resolve=>pending.push(resolve));
 dom.window.eval(fs.readFileSync('tools/affiliate-share-preview/preview.js','utf8'));
 const el=id=>dom.window.document.getElementById(id),prepare=()=>el('prepare').click();
 function change(id,value){el(id).value=value;el(id).dispatchEvent(new dom.window.Event('change'));}
 function release(index,data,ok=true){pending[index]({ok,json:async()=>data});}
 return {dom,el,pending,prepare,change,release,close(){dom.window.close();}};
}
const ready={status:'ready',copy:'SYNTHETIC ONLY',url:'https://academy.synthetic.invalid/fictional',qr_data_url:'data:image/png;base64,AA==',modules:49};
for(const state of ['revoked','expired','wrong-account'])test('independent pending QR result cannot revive '+state+' selection',async()=>{
 const f=previewFixture();try{f.prepare();assert.equal(f.pending.length,1);f.change('state',state);f.release(0,ready);await settle();assert.equal(f.el('copy').value,'');assert.equal(f.el('url').value,'');assert.equal(f.el('qr').getAttribute('src'),null);assert.equal(f.el('preview').hidden,true);}finally{f.close();}
});
test('independent out-of-order QR responses retain only latest selected channel',async()=>{
 const f=previewFixture();try{f.prepare();f.change('channel','sms');f.prepare();f.release(1,{...ready,copy:'SYNTHETIC SMS'});await settle();f.release(0,ready);await settle();assert.equal(f.el('copy').value,'SYNTHETIC SMS');assert.equal(f.el('preview').hidden,false);}finally{f.close();}
});
test('independent non-OK QR response cannot expose returned copy or image',async()=>{
 const f=previewFixture();try{f.prepare();f.release(0,{...ready,error:'Fictional denied'},false);await settle();assert.equal(f.el('copy').value,'');assert.equal(f.el('qr').getAttribute('src'),null);assert.equal(f.el('preview').hidden,true);}finally{f.close();}
});
test('independent repeated same-account renewal retains one pending weekly write',async()=>{
 const f=await memberFixture({writeGate:true});try{f.w.document.querySelector('[name="checkin_fictional_note"]').value='SYNTHETIC ONLY';const task=f.submit('rm-checkin-form');for(let i=0;i<20&&!f.pending.length;i++)await f.tick();assert.equal(f.pending.length,1);f.refresh();f.refresh();f.refresh();f.release();await task;assert.equal(f.calls.filter(c=>c.kind==='write').length,1);assert.equal(f.w.document.getElementById('rm-checkin-status').textContent,'Check-in submitted to your coaching team.');assert.deepEqual(f.errors,[]);}finally{f.close();}
});
test('independent switched-then-restored actor cannot resurrect ended member document',async()=>{
 const f=await memberFixture();try{f.w.document.querySelector('[name="checkin_fictional_note"]').value='SYNTHETIC ONLY';f.gateGetUser();const task=f.submit('rm-checkin-form');for(let i=0;i<20&&!f.pending.length;i++)await f.tick();f.switchActor('synthetic-b');f.switchActor('synthetic-a');f.release();await task;assert.equal(f.calls.filter(c=>c.kind==='write').length,0);assert.equal(f.w.document.querySelectorAll('input,textarea').length,0);assert.deepEqual(f.errors,[]);}finally{f.close();}
});
test('independent diff confinement: member runtime differs only inside weekly-checkin handler',()=>{
 const before=cp.execFileSync('git',['show','fad394ef683b711ba34866ec614bed71a26cee93:member/member110.js'],{encoding:'utf8'}),after=fs.readFileSync('member/member110.js','utf8');
 const start='  el("rm-checkin-form").addEventListener("submit", async (event) => {';
 const split=s=>{const i=s.indexOf(start);assert(i>=0);const j=s.indexOf('\n  client.auth.onAuthStateChange(',i+start.length);assert(j>i);return [s.slice(0,i),s.slice(j)];};
 assert.deepEqual(split(after),split(before));
});
test('independent inventory preserves exact 101 requirements, 10 details and 57 package IDs',()=>{
 for(const [file,key,count] of [['docs/orchestration/requirements.json','requirements',101],['docs/orchestration/requirements-source-details.json','details',10],['docs/orchestration/issue-56/ACCEPTANCE_MATRIX.json','cases',57]]){
  const current=JSON.parse(fs.readFileSync(file)),before=JSON.parse(cp.execFileSync('git',['show','fad394ef683b711ba34866ec614bed71a26cee93:'+file],{encoding:'utf8'}));assert.deepEqual(current,before);assert.equal(current[key].length,count);
 }
});
test('independent protected runtime, canonical migrations and approved image families remain byte-identical to accepted checkpoint',()=>{
 const protectedPaths=['netlify/functions','supabase/migrations','portal','assets','css','index.html','netlify.toml','_headers','_redirects','js/vitality-roadmap-founder-direction.cjs','js/vitality-roadmap-founder-methodology-v2.cjs'];
 const changed=cp.execFileSync('git',['diff','--name-only','fad394ef683b711ba34866ec614bed71a26cee93','--',...protectedPaths],{encoding:'utf8'}).trim();assert.equal(changed,'');
});
for(const change of ['source-hash','locator'])test('independent detached V3 '+change+' substitution fails frozen citation approval',()=>{
 const A=require('../../tools/coach-companion-catalog/index.cjs'),H='a'.repeat(64),R='b'.repeat(64),omit=(x,keys)=>Object.fromEntries(Object.entries(x).filter(([k])=>!keys.includes(k)));
 const approval=()=>({state:'approved',receiptHash:R,targetHash:H,generation:1,scopes:['education']});
 const s={id:'fictional-independent-source',version:'fictional-independent-v1',sha256:H,dataClass:'fictional',category:'approved_education',speakerStatus:'founder_authored_document',attributionReceiptHash:H,approval:approval(),conflict:{state:'none'},audiences:['fictional_reviewer']};
 const x={id:'fictional-independent-claim',sourceId:s.id,sourceVersion:s.version,sourceHash:H,dataClass:'fictional',driver:'wise_budgeting',topic:'independent-fictional-topic',kind:'education',text:'SYNTHETIC ONLY: independently invented QA paragraph.',locator:'fictional paragraph one',approval:approval(),conflict:{state:'none'},scope:'global',clinicalProtocol:false,safetyHold:false,audiences:['fictional_reviewer']};
 const c={schemaVersion:A.CATALOG_SCHEMA,dataClass:'fictional',version:'fictional-independent-v1',foundationHash:H,approvalGeneration:1,sources:[s],claims:[x]};
 const seal=()=>{s.approval.targetHash=A.fingerprint(omit(s,['approval']));x.sha256=A.fingerprint(omit(x,['approval','sha256']));x.approval.targetHash=x.sha256;c.sha256=A.fingerprint(omit(c,['sha256']));};seal();
 const pins=new Map([['source:'+s.id,structuredClone(s.approval)],['claim:'+x.id,structuredClone(x.approval)]]);
 const options={mode:'fictional-preview',fixtureVerifier:e=>{const p=pins.get(e.kind+':'+e.id);return {fixtureOnly:true,verdict:'approved',targetHash:p.targetHash,receiptHash:p.receiptHash,generation:p.generation};}};
 const request=()=>({schemaVersion:A.REQUEST_SCHEMA,dataClass:'fictional',operation:'educational_lookup',catalogVersion:c.version,catalogHash:c.sha256,approvalGeneration:1,audience:'fictional_reviewer',driver:x.driver,topic:x.topic,intent:'education',safetyHold:false,limit:1});
 assert.equal(A.lookupEducational(c,request(),options).status,'supported_education');
 if(change==='source-hash'){s.sha256='d'.repeat(64);x.sourceHash=s.sha256;}else{x.locator='fictional substituted paragraph';}seal();
 const result=A.lookupEducational(c,request(),options);assert.equal(result.status,'held_for_review');assert.equal(result.results.length,0);assert.equal(result.productionEligible,false);
});
