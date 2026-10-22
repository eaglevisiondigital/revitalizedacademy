'use strict';
// Actual local RPC, restricted worker handler and renderer. Fictional sources only.
const {test,beforeEach,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{Client}=require('pg'),{JSDOM}=require('jsdom');
const {seed}=require('../fixtures/roadmap-processing-scope.cjs'),{createHandler,processOne}=require('../../netlify/lib/roadmap-processing.cjs');
if(process.env.PGHOST!=='127.0.0.1'||!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable local database only');
let db,f,sources,saved;
beforeEach(async()=>{db=new Client();await db.connect();await db.query('begin');f=await seed(db);({sources}=await f.enableScope());saved=await processOne(sources[0].report,(a,r,p)=>f.rpc(f.justyn,a,r,p),(j,l,d)=>f.narrowSeal(f.justyn,j,l,d));});
afterEach(async()=>{try{await f?.drainScope();await f?.drainProcessing();await f?.drain6();await f?.drain5();await f?.drain();}finally{await db.query('rollback');await db.end();}});
async function state(){return f.v("select jsonb_build_object('jobs',(select jsonb_agg(to_jsonb(j)order by id)from private.roadmap_processing_jobs j),'versions',(select jsonb_agg(to_jsonb(v)order by id)from private.roadmap_processing_versions v),'reviews',(select jsonb_agg(to_jsonb(r)order by sequence)from private.roadmap_processing_reviews r),'purposes',(select jsonb_agg(to_jsonb(p)order by sequence)from private.roadmap_processing_purposes p),'grants',(select jsonb_agg(to_jsonb(g)order by sequence)from private.roadmap_processing_grants g),'controls',(select to_jsonb(c)from private.roadmap_processing_controls c))");}
function ui({actor=f.justyn,report=sources[0].report}={}){
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://revitalizedacademy.com/portal/'}),w=dom.window,calls=[];
 w.eval(fs.readFileSync('js/vitality-roadmap-view.js','utf8'));w.eval(fs.readFileSync('portal/portal-roadmap-processing.js','utf8'));
 const handler=createHandler({identity:()=>{throw Error('Read must never request sealing identity');},fetch:async(url,options)=>{assert(url.endsWith('/rest/v1/rpc/roadmap_processing'));const args=JSON.parse(options.body);try{return Response.json(await f.call(actor,'roadmap_processing',args));}catch(e){return Response.json({code:e.code},{status:403});}}});
 const host=w.document.querySelector('main'),controller=w.RVA_ROADMAP_PROCESSING.mount(host,{report,request:async body=>{calls.push(body.action);const r=await handler(new Request('https://revitalizedacademy.com/.netlify/functions/roadmap-processing',{method:'POST',headers:{origin:'https://revitalizedacademy.com',authorization:'Bearer fictional.token','content-type':'application/json'},body:JSON.stringify(body)}),{site:{id:'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06'},deploy:{context:'production'}});return r.json();}});
 return{host,controller,calls,close(){controller.stop();w.close();}};
}
test('repeated and concurrent authenticated views preserve version/hash/feedback/consents/grants and other pending jobs',async()=>{
 await f.rpc(f.justyn,'review',sources[0].report,{version_id:saved.version_id,expected_revision:0,request_key:require('node:crypto').randomUUID(),proposal:{driver:'cellular_hydration',decision:'request_inputs',rationale:'FICTIONAL existing attributed feedback must remain unchanged',citations:['water_intake_consistency'],missingInputRequest:'FICTIONAL clarify available measurements'}});
 const before=await state(),a=ui(),b=ui();try{await Promise.all([a.controller.start(),a.controller.start(),b.controller.start()]);await a.controller.start();assert.deepEqual(a.calls,['read','read']);assert.deepEqual(b.calls,['read']);assert.equal(a.host.dataset.revision,'1');assert.equal(a.host.querySelectorAll('.roadmap-driver').length,12);assert.deepEqual(await state(),before);assert.equal((await f.rpc(f.justyn,'read',sources[0].report,{})).version_id,saved.version_id);assert.equal(await f.v("select count(*)from private.roadmap_processing_audit where action='read'")>0,true);}finally{a.close();b.close();}
});
test('wrong role, unapproved fourth source and founder without personal consent fail closed without processing',async()=>{
 const fourth=await f.participant('read-only-excluded'),before=await state();
 for(const args of [{actor:f.coach},{actor:f.elle},{report:fourth.report}]){const x=ui(args);try{await x.controller.start();assert(x.host.textContent.includes('Saved draft unavailable.'));assert.equal(x.host.querySelectorAll('.roadmap-driver,form').length,0);assert.deepEqual(x.calls,['read']);}finally{x.close();}}
 assert.deepEqual(await state(),before);
});
test('expired founder session and held processing permission deny reads without exposing document',async()=>{
 const before=await state();await f.q("update auth.sessions set not_after=clock_timestamp()-interval '1 second'where id=$1",[f.sessions.get(f.justyn)]);let x=ui();try{await x.controller.start();assert(x.host.textContent.includes('Saved draft unavailable.'));assert.deepEqual(x.calls,['read']);}finally{x.close();}
 await f.q('update auth.sessions set not_after=null where id=$1',[f.sessions.get(f.justyn)]);await f.q("update private.roadmap_processing_controls set process=false");x=ui();try{await x.controller.start();assert(x.host.textContent.includes('Saved draft unavailable.'));}finally{x.close();}
 const after=await state();assert.deepEqual(after.jobs,before.jobs);assert.deepEqual(after.versions,before.versions);assert.deepEqual(after.reviews,before.reviews);
});
test('expired source batch denies saved-draft retrieval without changing versions or pending jobs',async()=>{
 const before=await state();await f.freeze(sources,new Date(Date.now()+500).toISOString());
 assert.equal((await f.rpc(f.justyn,'read',sources[0].report,{})).version_id,saved.version_id);
 await new Promise(resolve=>setTimeout(resolve,600));const x=ui();try{await x.controller.start();assert(x.host.textContent.includes('Saved draft unavailable.'));assert.deepEqual(x.calls,['read']);assert.equal(x.host.querySelectorAll('.roadmap-driver').length,0);}finally{x.close();}
 const after=await state();assert.deepEqual(after.jobs,before.jobs);assert.deepEqual(after.versions,before.versions);assert.deepEqual(after.reviews,before.reviews);
});
