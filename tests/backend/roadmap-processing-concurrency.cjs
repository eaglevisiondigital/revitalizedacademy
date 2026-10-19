// Eight independent PG17 sessions, shared server barrier, local fictional records only.
const assert=require('node:assert/strict'),{Client}=require('pg'),{randomUUID}=require('node:crypto'),{seed}=require('../fixtures/roadmap-processing.cjs'),P=require('../../js/vitality-roadmap-processing.cjs');
if(process.env.PGHOST!=='127.0.0.1'||!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Local only');
(async()=>{const db=new Client();await db.connect();const f=await(async()=>{await db.query('begin');const f=await seed(db);await f.enable();await db.query('commit');return f;})();
async function overlap(operation){const coordinator=new Client();await coordinator.connect();const workers=await Promise.all(Array.from({length:8},async()=>{const c=new Client();await c.connect();return c;}));const barrier=19062027;try{
 await coordinator.query('begin');await coordinator.query('select pg_advisory_xact_lock($1)',[barrier]);
 const pids=(await Promise.all(workers.map(c=>c.query('select pg_backend_pid() pid')))).map(r=>r.rows[0].pid);assert.equal(new Set(pids).size,8);
 const pending=workers.map(async(c,i)=>{try{await c.query('begin');await c.query('select pg_advisory_xact_lock_shared($1)',[barrier]);await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[f.justyn,JSON.stringify({sub:f.justyn,role:'authenticated',iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:f.sessions.get(f.justyn)})]);const result=await operation(c,i);await c.query('commit');return{ok:true,result};}catch(e){await c.query('rollback');return{ok:false,code:e.code};}});
 let waiting=0;for(let n=0;n<200;n++){waiting=Number((await coordinator.query("select count(*)from pg_locks where locktype='advisory' and not granted and pid=any($1::int[])",[pids])).rows[0].count);if(waiting===8)break;await new Promise(r=>setTimeout(r,5));}assert.equal(waiting,8);await coordinator.query('commit');return await Promise.all(pending);
 }finally{await coordinator.query('rollback');await coordinator.end();await Promise.all(workers.map(c=>c.end()));}}
const rpc=(c,a,p={})=>c.query('select public.roadmap_processing($1,$2,$3)r',[a,f.report,JSON.stringify(p)]).then(r=>r.rows[0].r);
try{
 const claims=await overlap(c=>rpc(c,'claim'));assert.equal(claims.filter(x=>x.ok&&x.result.claimed).length,1);const claim=claims.find(x=>x.result?.claimed).result,doc=P.buildDraft(claim.context),seal=await f.seal(claim.job,claim.lease,doc),finish={job:claim.job,lease:claim.lease,seal,document:doc};
 const completions=await overlap(c=>rpc(c,'finish',finish));assert.equal(completions.filter(x=>x.ok).length,8);assert.equal(await f.v('select count(*)from private.roadmap_processing_versions'),'1');
 const version=await f.v('select id from private.roadmap_processing_versions');
 const proposals=await overlap(c=>rpc(c,'review',{version_id:version,expected_revision:0,request_key:randomUUID(),proposal:{driver:'cellular_hydration',decision:'accurate',rationale:'Fictional independent concurrent review',citations:[]}}));assert.equal(proposals.filter(x=>x.ok).length,1);assert.equal(proposals.filter(x=>x.code==='40001').length,7);
 const key=randomUUID(),regens=await overlap(c=>rpc(c,'regenerate',{version_id:version,request_key:key}));assert.equal(regens.filter(x=>x.ok).length,8);assert.equal(await f.v('select count(*)from private.roadmap_processing_jobs'),'2');
 console.log(JSON.stringify({processingConcurrency:{workers:8,distinctBackends:8,serverBarrier:true,oneLease:true,oneVersion:true,reviewSuccesses:1,safeReviewConflicts:7,idempotentRegeneration:true}}));
}finally{await db.end();}})().catch(e=>{console.error(e);process.exitCode=1;});
