// Eight genuinely overlapping PostgreSQL workers; fictional task database only.
const {Client}=require('pg'),assert=require('node:assert/strict'),{seed}=require('../fixtures/roadmap-b5.cjs');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||'')||process.env.PGHOST!=='127.0.0.1')throw Error('Local DB only');
(async()=>{const db=new Client();await db.connect();await db.query('begin');const f=await seed(db);await f.grant({write:true});await db.query('commit');const results=[];
try{for(const group of ['competing_proposals','identical_retry','source_change','cohort_revocation','session_revocation']){
 const revision=Number(await f.v('select coalesce(max(revision),0) from private.roadmap_b5_proposals')),same=f.payload({expected_revision:revision});
 const workers=await Promise.all(Array.from({length:8},async()=>{const c=new Client({application_name:'b5-race-'+group});await c.connect();return c;}));
 try{await db.query('begin');await db.query('select pg_advisory_xact_lock(hashtextextended($1,416))',[f.report]);
 const jobs=workers.map(async(c,i)=>{await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[f.justyn,JSON.stringify({sub:f.justyn,role:'authenticated',iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:f.sessions.get(f.justyn)})]);try{const r=(await c.query("select public.roadmap_b5('save',$1,$2) result",[f.report,JSON.stringify(group==='identical_retry'?same:f.payload({expected_revision:revision}))])).rows[0].result;await c.query('commit');return{ok:true,idempotent:!!r.idempotent};}catch(e){await c.query('rollback');return{ok:false,code:e.code};}});
 let overlap=0;for(let i=0;i<300;i++){overlap=Number((await db.query("select count(*) from pg_stat_activity where application_name=$1 and wait_event='advisory'",['b5-race-'+group])).rows[0].count);if(overlap===8)break;await new Promise(r=>setTimeout(r,5));}assert.equal(overlap,8);
 if(group==='source_change')await db.query("update private.vitality_assessment_drafts set final_form='FICTIONAL CONCURRENT CHANGE' where id=$1",[f.draft]);
 if(group==='cohort_revocation')await f.enroll(false);
 if(group==='session_revocation')await db.query('delete from auth.sessions where user_id=$1',[f.justyn]);
 // For negative groups restore coordinator changes after proving all waiting requests see them.
 await db.query('commit');const r=await Promise.all(jobs);
 if(group==='competing_proposals'){assert.equal(r.filter(x=>x.ok).length,1);assert.equal(r.filter(x=>x.code==='40001').length,7);}
 if(group==='identical_retry'){assert.equal(r.filter(x=>x.ok).length,8);assert.equal(r.filter(x=>x.idempotent).length,7);}
 if(group==='source_change')assert.equal(r.filter(x=>x.code==='40001').length,8);
 if(group==='cohort_revocation'||group==='session_revocation')assert.equal(r.filter(x=>!x.ok).length,8);
 const pids=await Promise.all(workers.map(c=>c.query('select pg_backend_pid() pid')));assert.equal(new Set(pids.map(r=>r.rows[0].pid)).size,8);
 results.push({group,workers:8,overlap,successes:r.filter(x=>x.ok).length,safeDenials:r.filter(x=>!x.ok).length});
 if(group==='source_change'){await db.query("update private.vitality_assessment_drafts set final_form='assessment_summary=FICTIONAL_STORED_SUMMARY&coach_review_flags=None+reported' where id=$1",[f.draft]);}
 if(group==='cohort_revocation')await f.enroll(true,true);
 }finally{await db.query('rollback').catch(()=>{});await Promise.all(workers.map(c=>c.end()));}
}assert.equal(await f.v('select count(*) from private.roadmap_b5_proposals'),'2');console.log(JSON.stringify({b5RaceGroups:results.length,results}));}finally{await db.end();}})().catch(e=>{console.error(e);process.exitCode=1;});
