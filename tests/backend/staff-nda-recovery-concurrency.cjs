'use strict';
// Eight independent local sessions overlap at a coordinator-held advisory barrier.
const {Client}=require('pg'),assert=require('node:assert/strict'),{seed}=require('../fixtures/staff-nda.cjs'),{reconcileExistingAcceptance:recover}=require('../../scripts/reconcile-staff-nda.cjs');
if(process.env.PGHOST!=='127.0.0.1'||!/^rva_nda_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Local fictional database required');
(async()=>{const db=new Client();await db.connect();let workers=[];
 try{await db.query('begin');const f=await seed(db),id=await f.acceptance(),input=await f.input(id);await db.query('commit');
  const before=await f.v('select md5(to_jsonb(x)::text) from public.staff_agreement_acceptances x where id=$1',[id]);
  workers=await Promise.all(Array.from({length:8},async()=>{const c=new Client({application_name:'nda-recovery-race'});await c.connect();return c;}));
  const pids=await Promise.all(workers.map(c=>c.query('select pg_backend_pid() pid')));assert.equal(new Set(pids.map(r=>r.rows[0].pid)).size,8);
  await db.query('begin');await db.query('select pg_advisory_xact_lock(hashtextextended($1,184927))',[input.agreementId]);
  const jobs=workers.map(async c=>{try{return{ok:true,result:await recover(c,input)};}catch(e){return{ok:false,code:e.code};}});
  let waiting=0;for(let n=0;n<300;n++){waiting=Number((await db.query("select count(*) from pg_stat_activity where application_name='nda-recovery-race' and wait_event='advisory'")).rows[0].count);if(waiting===8)break;await new Promise(r=>setTimeout(r,5));}assert.equal(waiting,8);
  await db.query('commit');const results=await Promise.all(jobs);assert.equal(results.filter(r=>r.ok).length,1);assert.equal(results.filter(r=>r.code==='RVA_NDA_GUARD').length,7);
  assert.equal(await f.v('select md5(to_jsonb(x)::text) from public.staff_agreement_acceptances x where id=$1',[id]),before);
  assert.equal(await f.v("select count(*) from public.staff_access_audit where staff_user_id=$1 and action='staff_agreement_acceptance_reconciled'",[f.staff.id]),'1');
  assert.equal(await f.v('select onboarding_status from public.staff_access where user_id=$1',[f.staff.id]),'complete');
  console.log(JSON.stringify({local_concurrency_workers:8,overlapping_at_barrier:waiting,independent_backend_ids:8,successful_exact_recoveries:1,safe_repeated_attempt_denials:7,new_recovery_audits:1,acceptance_and_signature_unchanged:true}));
 }finally{await db.query('rollback').catch(()=>{});await Promise.all(workers.map(c=>c.end()));await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
