'use strict';
// Entire suite uses fictional answers/accounts in a disposable LOCAL database.
const {test,beforeEach,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID}=require('node:crypto'),{Client}=require('pg');
const {seed}=require('../fixtures/b6-session-continuity.cjs'),{acks}=require('../fixtures/roadmap-b6.cjs'),{processOne}=require('../../netlify/lib/roadmap-processing.cjs');
const file='supabase/environment-migrations/production/20261022135700_roadmap_saved_revision_review_only.sql';
const migration=fs.readFileSync(file,'utf8').replace(/\bbegin;/,'').replace(/commit;\s*$/,'');
if(process.env.PGHOST!=='127.0.0.1'||!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable local database required');
let db,f,sources,r1,r2,pin,hash,grant,expires,definitions;
const review=(action='read',report=sources[0].report,payload={},user=f.justyn,claims={})=>f.as(user,'roadmap_saved_review',[action,report,JSON.stringify(payload)],'authenticated',claims);
const authorize=(options={})=>f.v('select private.roadmap_saved_review_authorize($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[options.founder||f.justyn,options.session||f.sessions.get(f.justyn),options.report||sources[0].report,options.version||r2.version_id,options.pin||pin,options.hash||hash,options.expires||expires,options.operator||f.owner,options.operatorSession||f.sessions.get(f.owner),options.reference||'LOCAL SYNTHETIC exact one-case review-only owner authorization']);
const denied=fn=>assert.rejects(fn,e=>['42501','22023','40001','55000'].includes(e.code));
async function failedSql(sql,args=[]){await f.q('savepoint expected_failure');try{await denied(()=>f.q(sql,args));}finally{await f.q('rollback to savepoint expected_failure');await f.q('release savepoint expected_failure');}}
async function state(){return f.v("select jsonb_build_object('jobs',(select jsonb_agg(to_jsonb(j)order by id)from private.roadmap_processing_jobs j),'versions',(select jsonb_agg(to_jsonb(v)order by id)from private.roadmap_processing_versions v),'purposes',(select jsonb_agg(to_jsonb(p)order by sequence)from private.roadmap_processing_purposes p),'b6',(select jsonb_agg(to_jsonb(p)order by sequence)from private.roadmap_b6_purpose_events p),'grants',(select jsonb_agg(to_jsonb(g)order by sequence)from private.roadmap_processing_grants g),'batches',(select jsonb_agg(to_jsonb(b)order by sequence)from private.roadmap_processing_pilot_batches b),'keys',(select jsonb_agg(to_jsonb(k)order by id)from private.roadmap_processing_seal_keys k),'controls',(select to_jsonb(c)from private.roadmap_processing_controls c))");}
async function freshSession(){const old=f.sessions.get(f.justyn),sid=randomUUID();await f.q('delete from auth.sessions where id=$1',[old]);await f.q('insert into auth.sessions(id,user_id,not_after)values($1,$2,clock_timestamp()+interval\'1 hour\')',[sid,f.justyn]);f.sessions.set(f.justyn,sid);}
beforeEach(async t=>{
 db=new Client();await db.connect();await db.query('begin');f=await seed(db);sources=await f.prepare();
 // Fictional case explicitly uses the case-contract name; its email, answers and IDs are synthetic.
 await f.q("update public.contacts set first_name='Caroline',last_name='Risi' where id=$1",[f.contact]);
 const email=await f.v('select email from public.contacts where id=$1',[f.contact]);
 const row=(await f.b42(f.justyn,'search',{query:email})).find(r=>r.eligible);assert(row);
 await f.b42(f.justyn,'attest',f.identityPayload(row,{starts_at:new Date(Date.now()-1000).toISOString()}));
 const verification=await f.v('select id from private.roadmap_b42_verifications where report_id=$1 order by revision desc limit 1',[f.report]);
 await f.q('select private.roadmap_b5_set_pilot($1,$2,$3)',[verification,new Date(Date.now()+3600000).toISOString(),'LOCAL SYNTHETIC refreshed case identity']);
 await f.b6(f.justyn,'attest',f.report,{active:true,sop:require('../../js/vitality-roadmap-b6-adapter.cjs').pins.sop,acknowledgments:acks});
 const purpose=await f.v('select max(sequence)from private.roadmap_b6_purpose_events where report_id=$1',[f.report]);
 await f.q('select private.roadmap_b6_set_pilot($1,$2,$3,$4,true,$5)',[purpose,new Date(Date.now()+1800000).toISOString(),'LOCAL SYNTHETIC separate case purpose','LOCAL independent operator','LOCAL SYNTHETIC feedback permission']);
 await f.authorize(sources);const batch=await f.freeze(sources);await f.configure(batch);for(const s of sources)await f.enqueue(batch,s);await f.q('update private.roadmap_processing_controls set process=true,review=true');
 const process=()=>processOne(f.report,(a,r,p)=>f.rpc(f.justyn,a,r,p),(j,l,d)=>f.narrowSeal(f.justyn,j,l,d));
 r1=await process();await f.rpc(f.justyn,'regenerate',f.report,{version_id:r1.version_id,request_key:randomUUID()});r2=await process();assert.equal(r2.revision,2);
 pin=await f.v('select fingerprint from private.roadmap_processing_versions where id=$1',[r2.version_id]);hash=await f.v('select document_hash from private.roadmap_processing_versions where id=$1',[r2.version_id]);
 // Simulate already expired original scopes before the local renewal. No hosted data.
 for(const [table,updates]of [['roadmap_b5_pilot_events',"starts_at=clock_timestamp()-interval'2 hours',expires_at=clock_timestamp()-interval'1 hour'"],['roadmap_b42_sop_attestations',"starts_at=clock_timestamp()-interval'2 hours',revoke_by=clock_timestamp()-interval'1 hour'"],['roadmap_processing_pilot_batches',"expires_at=clock_timestamp()-interval'1 hour'"],['roadmap_processing_grants',"expires_at=clock_timestamp()-interval'1 hour'"]]){
 await f.q('alter table private.'+table+' disable trigger user');await f.q('update private.'+table+' set '+updates);await f.q('alter table private.'+table+' enable trigger user');}
 await f.q("update private.roadmap_processing_seal_keys set expires_at=clock_timestamp()-interval'1 hour'");
 await freshSession();
 definitions=(await f.q("select p.oid,pg_get_functiondef(p.oid) definition,proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private')and p.prokind='f'")).rows;
 await f.q(migration);assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'0');assert.equal(await f.v('select count(*)from private.roadmap_saved_review_audit'),'0');expires=new Date(Math.min(Date.now()+(t.name.startsWith('server-clock')?1500:600000),Date.parse('2026-10-22T22:00:00Z'))).toISOString();grant=await authorize();
});
afterEach(async()=>{try{await f?.drainScope();await f?.drainProcessing();await f?.drain6();await f?.drain5();await f?.drain();}finally{await db.query('rollback');await db.end();}});
test('new current session reads exactly saved R2 after old batch/B5/SOP/key expiration; originals and jobs remain exact',async()=>{
 assert.equal(await f.v("select extract(epoch from(timestamp '2026-10-22 17:00:00' at time zone 'America/Chicago'))::bigint"),String(Date.parse('2026-10-22T22:00:00Z')/1000));
 const before=await state(),list=await review('list',null);assert.equal(list.length,1);assert.equal(list[0].revision,2);
 for(let i=0;i<3;i++){const r=await review();assert.equal(r.version_id,r2.version_id);assert.equal(r.revision,2);assert.equal(r.review_only,true);assert.equal(Date.parse(r.expires_at),Date.parse(expires));}
 assert.deepEqual(await state(),before);assert.equal(before.versions.length,2);assert.equal(before.jobs.filter(j=>j.status==='pending').length,2);
});
test('renewal cannot authorize original process/claim/finish/regenerate/enqueue/approve/pdf or B6 source reads',async()=>{
 const before=await state();for(const action of ['claim','finish','regenerate','approve','pdf','read'])await denied(()=>f.rpc(f.justyn,action,f.report,{}));
 for(const action of ['process','claim','finish','regenerate','enqueue','score','approve','pdf','email','deliver','attest'])await denied(()=>review(action));
 await denied(()=>f.b6(f.justyn,'read',f.report));
 await failedSql('select private.roadmap_processing_enqueue_historical($1,$2,$3,$4,$5,$6,$7)',[await f.v('select id from private.roadmap_processing_pilot_batches order by sequence desc limit 1'),f.report,pin,sources[0].grant,f.owner,f.sessions.get(f.owner),'LOCAL SYNTHETIC forbidden enqueue']);
 assert.deepEqual(await state(),before);
});
test('source-cited feedback is append-only/versioned, idempotent and cannot alter saved documents',async()=>{
 const before=await state(),payload={version_id:r2.version_id,expected_revision:0,request_key:randomUUID(),proposal:{driver:'cellular_hydration',decision:'needs_adjustment',interpretation:'FICTIONAL proposed correction only',rationale:'FICTIONAL evidence-grounded reason',citations:['water_intake_consistency']}};
 const x=await review('review',f.report,payload);assert.equal(x.revision,1);assert.equal(x.rules_adopted,false);assert.equal((await review('review',f.report,payload)).idempotent,true);
 await denied(()=>review('review',f.report,{...payload,proposal:{...payload.proposal,rationale:'Changed same-key retry'}}));
 await denied(()=>review('review',f.report,{...payload,request_key:randomUUID()}));
 for(const change of [{version_id:r1.version_id},{proposal:{...payload.proposal,citations:[]}},{proposal:{...payload.proposal,citations:['unrelated_field']}},{proposal:{...payload.proposal,score:0}}])await denied(()=>review('review',f.report,{...payload,expected_revision:1,request_key:randomUUID(),...change}));
 const r=await review();assert.equal(r.reviews.length,1);assert.equal(r.reviews[0].actor,f.justyn);assert.deepEqual(await state(),before);
 assert.equal(await f.v("select count(*)from private.roadmap_saved_review_audit where action='review'"),'1');
});
test('wrong founder/account/session/issuer/role and all other sources fail closed',async()=>{
 for(const user of [f.elle,f.owner,f.coach,f.member,null])await denied(()=>review('read',f.report,{},user));
 for(const report of [sources[1].report,sources[2].report,randomUUID()])await denied(()=>review('read',report));
 for(const claims of [{session_id:randomUUID()},{session_id:f.sessions.get(f.elle)},{iss:'https://ilykgwgmxtrrikreacrz.supabase.co/auth/v1'},{is_anonymous:true}])await denied(()=>review('read',f.report,{},f.justyn,claims));
 await f.q("update auth.sessions set not_after=clock_timestamp()-interval'1 second'where id=$1",[f.sessions.get(f.justyn)]);await denied(()=>review());
});
test('fresh current founder session is accepted without repeating or rewriting durable consent',async()=>{const before=await state();await freshSession();assert.equal((await review()).revision,2);assert.deepEqual(await state(),before);});
test('revocation is append-only, immediate, idempotent and prevents reauthorization',async()=>{
 const before=await state();for(let i=0;i<2;i++)await f.q('select private.roadmap_saved_review_revoke($1,$2,$3,$4)',[grant,f.owner,f.sessions.get(f.owner),'LOCAL SYNTHETIC immediate review revocation']);
 await denied(()=>review());await failedSql('select private.roadmap_saved_review_authorize($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[f.justyn,f.sessions.get(f.justyn),f.report,r2.version_id,pin,hash,expires,f.owner,f.sessions.get(f.owner),'LOCAL SYNTHETIC exact one-case review-only owner authorization']);
 assert.equal(await f.v("select count(*)from private.roadmap_saved_review_audit where action='revoke'"),'1');assert.deepEqual(await state(),before);
});
test('operator grant pins founder/source/version/hash/time and is exact idempotent',async()=>{
 assert.equal(await authorize(),grant);
 for(const options of [{founder:f.elle},{session:randomUUID()},{report:sources[1].report},{version:r1.version_id},{pin:'a'.repeat(64)},{hash:'b'.repeat(64)},{expires:'2026-10-22T22:00:01Z'},{expires:'2026-10-22T13:45:00Z'},{operator:f.coach},{operatorSession:randomUUID()},{reference:'changed authorization reference'}]){
 await f.q('savepoint bad_grant');try{await denied(()=>authorize(options));}finally{await f.q('rollback to savepoint bad_grant');await f.q('release savepoint bad_grant');}
 }
 assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'1');
});
test('source drift, latest consent/storage withdrawals and current permission changes terminate review',async()=>{
 for(const sql of ["update public.staff_access set status='inactive' where user_id=$1","update public.staff_access set role='admin' where user_id=$1","update auth.users set email='different@example.invalid' where id=$1","update public.staff_permission_overrides set allowed=false where user_id=$1 and permission_key='health.private.view'","update auth.users set banned_until=clock_timestamp()+interval'1 day' where id=$1"]){await f.q('savepoint changed_access');await f.q(sql,[f.justyn]);await denied(()=>review());await f.q('rollback to savepoint changed_access');}
 for(const table of ['roadmap_b6_purpose_events','roadmap_processing_purposes','roadmap_b6_grant_events','roadmap_b5_pilot_events','roadmap_processing_grants','roadmap_b4_cohort_events']){await f.q('savepoint withdraw');await f.q('alter table private.'+table+' disable trigger user');await f.q('update private.'+table+' set active=false');await denied(()=>review());await f.q('rollback to savepoint withdraw');}
 await f.q("update private.vitality_assessment_drafts set final_form='FICTIONAL source changed'where id=$1",[f.draft]);await denied(()=>review());
});
test('independent review uses the review kill switch, works with process=false and never changes controls',async()=>{
 await f.q('update private.roadmap_processing_controls set process=false');assert.equal((await review()).revision,2);
 await f.q('update private.roadmap_processing_controls set review=false');await denied(()=>review());
});
test('RLS/ACLs/immutability deny direct private access; all original functions stay byte-identical',async()=>{
 for(const role of ['anon','authenticated','service_role'])for(const table of ['grants','audit'])assert.equal(await f.v("select has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')",[role,'private.roadmap_saved_review_'+table]),false);
 for(const role of ['anon','service_role'])assert.equal(await f.v("select has_function_privilege($1,'public.roadmap_saved_review(text,uuid,jsonb)','EXECUTE')",[role]),false);
 for(const fn of ['basis(uuid,uuid,uuid,text,text)','authorize(uuid,uuid,uuid,uuid,text,text,timestamptz,uuid,uuid,text)','revoke(uuid,uuid,uuid,text)','context(uuid,boolean)'])assert.equal(await f.v("select has_function_privilege('authenticated',$1,'EXECUTE')",['private.roadmap_saved_review_'+fn]),false);
 for(const table of ['grants','audit']){assert.equal(await f.v("select relrowsecurity from pg_class where oid=$1::regclass",['private.roadmap_saved_review_'+table]),true);for(const statement of ['delete from','truncate','update'])await failedSql(statement+' private.roadmap_saved_review_'+table+(statement==='update'?' set '+(table==='grants'?'expires_at=expires_at':'action=action'):statement==='truncate'?' cascade':''));}
 assert.equal(await f.v("select count(*)from pg_proc where proname like 'roadmap_saved_review%' and not proconfig @> array['search_path=\"\"']"),'0');
 for(const old of definitions){const row=(await f.q('select pg_get_functiondef($1::oid)definition,proacl::text acl from pg_proc where oid=$1',[old.oid])).rows[0];assert.deepEqual(row,{definition:old.definition,acl:old.acl});}
});

test('server-clock expiration fails closed even within an old transaction timestamp',async()=>{const before=await state();assert.equal((await review()).revision,2);await f.q('select pg_sleep(1.6)');await denied(()=>review());await denied(()=>review('list',null));assert.deepEqual(await state(),before);});
test('eight genuine concurrent sessions serialize read/feedback and session loss while waiting fails closed',async()=>{
 const before=await state();await db.query('commit');
 const auth=async c=>{await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[f.justyn,JSON.stringify({sub:f.justyn,role:'authenticated',iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:f.sessions.get(f.justyn)})]);};
 const invoke=async(c,action,payload={})=>{try{await auth(c);const r=await c.query('select public.roadmap_saved_review($1,$2,$3)r',[action,f.report,JSON.stringify(payload)]);await c.query('commit');return{ok:true,value:r.rows[0].r};}catch(e){await c.query('rollback');return{ok:false,code:e.code};}};
 const workers=await Promise.all(Array.from({length:8},async()=>{const c=new Client();await c.connect();return c;}));
 try{
 assert.equal(new Set((await Promise.all(workers.map(c=>c.query('select pg_backend_pid()pid')))).map(r=>r.rows[0].pid)).size,8);
 const reads=await Promise.all(workers.map(c=>invoke(c,'read')));assert(reads.every(r=>r.ok&&r.value.version_id===r2.version_id));
 const payload={version_id:r2.version_id,expected_revision:0,request_key:randomUUID(),proposal:{driver:'cellular_hydration',decision:'accurate',rationale:'FICTIONAL concurrent cited feedback',citations:['water_intake_consistency']}};
 const same=await Promise.all(workers.map(c=>invoke(c,'review',payload)));assert(same.every(r=>r.ok&&r.value.revision===1));assert.equal(await f.v('select count(*)from private.roadmap_processing_reviews'),'1');
 const different=await Promise.all(workers.map(c=>invoke(c,'review',{...payload,expected_revision:1,request_key:randomUUID()})));assert.equal(different.filter(r=>r.ok).length,1);assert(different.filter(r=>!r.ok).every(r=>r.code==='40001'));assert.deepEqual(await state(),before);
 // Hold the same global lock while the next authenticated request is already waiting.
 await db.query('begin');await db.query('select pg_advisory_xact_lock(18062026)');const pending=invoke(workers[0],'read');
 let waiting=false;for(let n=0;n<100;n++){waiting=Number(await f.v("select count(*)from pg_locks where locktype='advisory'and not granted"))>0;if(waiting)break;await new Promise(r=>setTimeout(r,5));}assert(waiting);
 await db.query("update auth.sessions set not_after=clock_timestamp()-interval'1 second'where id=$1",[f.sessions.get(f.justyn)]);await db.query('commit');const loss=await pending;assert.equal(loss.ok,false);assert.equal(loss.code,'42501');
 }finally{await db.query('rollback');await Promise.all(workers.map(c=>c.end()));}
});
