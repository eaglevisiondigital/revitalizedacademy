// Eight real backend sessions held behind the same PostgreSQL server barrier.
const {Client}=require('pg'),{randomUUID}=require('node:crypto'),assert=require('node:assert/strict');
const {seed}=require('../fixtures/roadmap-b4.cjs'),{emptyDocument}=require('../../js/vitality-roadmap-b4-coverage.js');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||'')||process.env.PGHOST!=='127.0.0.1')throw Error('Local disposable database required');
(async()=>{const coordinator=new Client();await coordinator.connect();const f=await seed(coordinator);await f.enroll(true,true);const results=[];
try{for(const group of ['competing_versions','same_request','revocation','source_change']){
 if(group==='source_change')await f.enroll(true,true);
 const workers=await Promise.all(Array.from({length:8},async()=>{const c=new Client({application_name:'b4-race-'+group});await c.connect();return c;}));
 try{
 await coordinator.query('begin');await coordinator.query('select pg_advisory_xact_lock(hashtextextended($1,416))',[f.report]);
 const request=randomUUID(),expected=group==='competing_versions'?0:group==='same_request'?1:2;
 const pending=workers.map(async c=>{await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[f.justyn,JSON.stringify({sub:f.justyn,role:'authenticated',iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:f.sessions.get(f.justyn)})]);try{const p={request_id:group==='same_request'?request:randomUUID(),expected_version:expected,action:'save',state:'draft',reason:'Fictional overlap',document:emptyDocument(),corrections:[]};const r=await c.query("select public.roadmap_b4('save',$1,$2) result",[f.report,JSON.stringify(p)]);await c.query('commit');return{ok:true,result:r.rows[0].result};}catch(e){await c.query('rollback');return{ok:false,code:e.code};}});
 let count=0;for(let i=0;i<200;i++){count=Number((await coordinator.query("select count(*) from pg_stat_activity where application_name=$1 and wait_event='advisory'",['b4-race-'+group])).rows[0].count);if(count===8)break;await new Promise(r=>setTimeout(r,5));}assert.equal(count,8,'All eight operations overlap behind the PostgreSQL barrier');
 if(group==='revocation')await f.enroll(false);
 if(group==='source_change')await coordinator.query("update private.vitality_assessment_drafts set final_form='assessment_summary=CHANGED_FICTIONAL_SUMMARY' where id=$1",[f.draft]);
 await coordinator.query('commit');const actual=await Promise.all(pending);
 if(group==='competing_versions'){assert.equal(actual.filter(x=>x.ok).length,1);assert.equal(actual.filter(x=>x.code==='40001').length,7);}
 if(group==='same_request'){assert.equal(actual.filter(x=>x.ok).length,8);assert.equal(actual.filter(x=>x.result.idempotent).length,7);}
 if(group==='revocation')assert.equal(actual.filter(x=>x.code==='42501').length,8);
 if(group==='source_change')assert.equal(actual.filter(x=>x.code==='40001').length,8);
 const pids=await Promise.all(workers.map(c=>c.query('select pg_backend_pid() pid')));assert.equal(new Set(pids.map(r=>r.rows[0].pid)).size,8);
 results.push({group,workers:8,overlapping:8,success:actual.filter(x=>x.ok).length,safeDenials:actual.filter(x=>!x.ok).length});
 }finally{await coordinator.query('rollback').catch(()=>{});await Promise.all(workers.map(c=>c.end()));}
}
assert.equal(await f.v('select count(*) from private.roadmap_b4_versions where report_id=$1',[f.report]),'2');console.log(JSON.stringify({b4RaceGroups:results.length,results}));
}finally{await coordinator.end();}})().catch(e=>{console.error(e);process.exitCode=1;});
