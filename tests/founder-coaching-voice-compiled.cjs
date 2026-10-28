'use strict';
// Run only against the locally built archive. Every network operation is intercepted.
const {test,before}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const P=require('../js/vitality-roadmap-processing.cjs'),V=require('../js/vitality-roadmap-founder-voice.cjs'),G=require('../js/vitality-roadmap-v2-gate.cjs');
const {fictional}=require('./fixtures/roadmap-narrative.cjs');
const file=process.env.RVA_VOICE_COMPILED;if(!file||!path.isAbsolute(file))throw Error('Explicit local compiled artifact required');
let handler,calls=[],document,mode='read';const context=fictional(),old=P.buildDraft(context,{founderDirection:true});
const ctx={site:{id:'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06'},deploy:{context:'production'}};
const request=(action,extra={})=>new Request('https://revitalizedacademy.com/.netlify/functions/roadmap-processing',{method:'POST',headers:{origin:'https://revitalizedacademy.com',authorization:'Bearer fictional.token','content-type':'application/json'},body:JSON.stringify({action,report:'00000000-0000-4000-8000-000000000001',payload:{},...extra})});
before(async()=>{
 process.env.ROADMAP_PROCESSING_SEAL_KEY_ID='00000000-0000-4000-8000-000000000002';process.env.ROADMAP_PROCESSING_SEAL_SECRET='f'.repeat(64); // SYNTHETIC ONLY
 global.fetch=async(url,init)=>{
  const u=new URL(url);assert.equal(u.protocol,'https:');assert(u.pathname.startsWith('/rest/v1/rpc/'));
  const name=u.pathname.split('/').at(-1),b=JSON.parse(init.body);calls.push(name==='roadmap_processing'?b.p_action:name);
  if(name==='roadmap_alex_key_preflight')return Response.json(b.p_proof?{ready:true,processing:false}:{protocol:'rva-alex-key-possession-v1',challenge:'FICTIONAL KEY CUSTODY'});
  if(name==='roadmap_processing_seal_challenge'){document=b.p_document;return Response.json({protocol:'rva-roadmap-seal-hmac-sha256-v1',challenge:'FICTIONAL DOCUMENT CHALLENGE'});}
  if(name==='roadmap_processing_worker_seal')return Response.json('FICTIONAL SIGNATURE');
  assert.equal(name,'roadmap_processing');
  if(b.p_action==='read')return Response.json({document:mode==='process'&&document?document:old,revision:mode==='process'?2:1});
  if(b.p_action==='claim')return Response.json({claimed:true,context,previous_reviews:[],job:'FICTIONAL JOB',lease:'FICTIONAL LEASE'});
  assert.equal(b.p_action,'finish');return Response.json({ok:true});
 };
 handler=(await import(pathToFileURL(file).href)).default;
});
test('compiled candidate denies signed-out requests before any RPC',async()=>{
 calls=[];const req=request('read');req.headers.delete('authorization');assert.equal((await handler(req,ctx)).status,401);assert.deepEqual(calls,[]);
});
test('compiled saved read returns original document byte-for-byte without revoicing',async()=>{
 mode='read';calls=[];const r=await(await handler(request('read'),ctx)).json();assert.equal(P.digest(r.document),P.digest(old));assert.equal(r.document.narrative.presentation,undefined);assert.deepEqual(calls,['read']);
});
test('actual compiled generation path applies pinned voice, all45 directions and source gate before sealing',async()=>{
 mode='process';calls=[];const r=await(await handler(request('process'),ctx)).json();assert(r.document,'Compiled generation must complete');assert(V.verifyDocument(r.document));assert(G.verifyDocument(r.document,context));
 assert.deepEqual(r.document,P.buildDraft(context,{founderDirection:true,founderVoice:V.VERSION}));
 assert.equal(r.document.narrative.generationGate.loadedDirections,45);assert.equal(r.document.roadmap.founderComparison.rows.length,12);assert.equal(r.document.roadmap.phases.length,3);
 assert.deepEqual(calls,['read','roadmap_alex_key_preflight','roadmap_alex_key_preflight','claim','roadmap_processing_seal_challenge','roadmap_processing_worker_seal','finish','read']);
});
test('compiled entry rejects browser-selected engine/voice and unauthorized payload fields',async()=>{
 calls=[];for(const extra of [{founderVoice:V.VERSION},{payload:{founderVoice:V.VERSION}},{payload:{source:context}}])assert.equal((await handler(request('process',extra),ctx)).status,400);assert.deepEqual(calls,[]);
});
