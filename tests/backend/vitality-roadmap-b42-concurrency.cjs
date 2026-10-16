// True eight-session overlap; wholly fictional local database.
const {Client}=require('pg'),{randomUUID}=require('node:crypto'),assert=require('node:assert/strict'),{seed}=require('../fixtures/roadmap-b42.cjs');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||'')||process.env.PGHOST!=='127.0.0.1')throw Error('Local disposable database only');
(async()=>{const db=new Client();await db.connect();await db.query('begin');const f=await seed(db);await db.query('commit');const results=[];
try{for(const group of ['competing_decisions','identical_retry','source_change','session_revocation']){
 await db.query('begin');const rows=[];for(let i=0;i<8;i++)rows.push((await f.search()).find(x=>x.eligible));await db.query('commit');
 const same=f.payload(rows[0]);const payloads=rows.map(r=>group==='identical_retry'?same:f.payload(r));
 const workers=await Promise.all(Array.from({length:8},async()=>{const c=new Client({application_name:'b42-race-'+group});await c.connect();return c;}));
 try{await db.query('begin');await db.query('select pg_advisory_xact_lock(hashtextextended($1,416))',[f.report]);
 const jobs=workers.map(async(c,i)=>{await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[f.justyn,JSON.stringify({sub:f.justyn,role:'authenticated',iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:f.sessions.get(f.justyn)})]);try{const data=(await c.query("select public.roadmap_b42('attest',$1) result",[JSON.stringify(payloads[i])])).rows[0].result;await c.query('commit');return{ok:true,idempotent:!!data.idempotent};}catch(e){await c.query('rollback');return{ok:false,code:e.code};}});
 let waiting=0;for(let i=0;i<250;i++){waiting=Number((await db.query("select count(*) from pg_stat_activity where application_name=$1 and wait_event='advisory'",['b42-race-'+group])).rows[0].count);if(waiting===8)break;await new Promise(r=>setTimeout(r,5));}assert.equal(waiting,8);
 if(group==='source_change')await db.query("update private.vitality_assessment_drafts set final_form='assessment_summary=FICTIONAL_B42_CHANGED' where id=$1",[f.draft]);
 if(group==='session_revocation')await db.query('delete from auth.sessions where user_id=$1',[f.justyn]);
 await db.query('commit');const actual=await Promise.all(jobs);const pids=await Promise.all(workers.map(c=>c.query('select pg_backend_pid() pid')));assert.equal(new Set(pids.map(x=>x.rows[0].pid)).size,8);
 if(group==='competing_decisions'){assert.equal(actual.filter(x=>x.ok).length,1);assert.equal(actual.filter(x=>x.code==='40001').length,7);}
 if(group==='identical_retry'){assert.equal(actual.filter(x=>x.ok).length,8);assert.equal(actual.filter(x=>x.idempotent).length,7);}
 if(group==='source_change')assert.equal(actual.filter(x=>x.code==='40001').length,8);
 if(group==='session_revocation')assert.equal(actual.filter(x=>x.code==='42501').length,8);
 results.push({group,workers:8,overlapping:waiting,successes:actual.filter(x=>x.ok).length,safeDenials:actual.filter(x=>!x.ok).length});
 }finally{await db.query('rollback').catch(()=>{});await Promise.all(workers.map(c=>c.end()));}
}
assert.equal(await f.v('select count(*) from private.roadmap_b42_verifications'),'2');assert.equal(await f.v('select count(*) from private.roadmap_b42_sop_attestations'),'2');assert.equal(await f.v('select count(*) from private.roadmap_b4_cohort_events'),'0');assert.equal(await f.v('select count(*) from private.roadmap_b4_versions'),'0');console.log(JSON.stringify({b42RaceGroups:results.length,results}));
}finally{await db.end();}})().catch(e=>{console.error(e);process.exitCode=1;});
