'use strict';
// Entire suite uses fictional answers/accounts in a disposable LOCAL database.
const {test,beforeEach,afterEach}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID}=require('node:crypto'),{Client}=require('pg');
const {seed}=require('../fixtures/b6-session-continuity.cjs'),{acks}=require('../fixtures/roadmap-b6.cjs'),{processOne}=require('../../netlify/lib/roadmap-processing.cjs');
const file='supabase/environment-migrations/production/20261022135700_roadmap_saved_revision_review_only.sql';
const migration=fs.readFileSync(file,'utf8').replace(/\bbegin;/,'').replace(/commit;\s*$/,'');
if(process.env.PGHOST!=='127.0.0.1'||!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable local database required');
const replacementFile='supabase/environment-migrations/production/20261023012739_roadmap_saved_review_replacement_window.sql';
const replacement=fs.readFileSync(replacementFile,'utf8').replace(/\bbegin;/,'').replace(/commit;\s*$/,'');
let db,f,sources,r1,r2,pin,hash,grant,expires,definitions,oldRecord,oldAudit,baseline;
const review=(action='read',report=sources[0].report,payload={},user=f.justyn,claims={})=>f.as(user,'roadmap_saved_review',[action,report,JSON.stringify(payload)],'authenticated',claims);
const authorize=(o={})=>f.v('select private.roadmap_saved_review_renew($1,$2,$3,$4,$5)',[o.session||f.sessions.get(f.justyn),o.expires||expires,o.operator||f.owner,o.operatorSession||f.sessions.get(f.owner),o.reference||'LOCAL SYNTHETIC ONE replacement saved-R2 read and cited feedback']);
const denied=fn=>assert.rejects(fn,e=>['42501','22023','40001','55000','P0001'].includes(e.code));
async function failedSql(sql,args=[]){await f.q('savepoint expected_failure');try{await denied(()=>f.q(sql,args));}finally{await f.q('rollback to savepoint expected_failure');await f.q('release savepoint expected_failure');}}
async function state(){return f.v("select jsonb_build_object('jobs',(select jsonb_agg(to_jsonb(j)order by id)from private.roadmap_processing_jobs j),'versions',(select jsonb_agg(to_jsonb(v)order by id)from private.roadmap_processing_versions v),'purposes',(select jsonb_agg(to_jsonb(p)order by sequence)from private.roadmap_processing_purposes p),'b6',(select jsonb_agg(to_jsonb(p)order by sequence)from private.roadmap_b6_purpose_events p),'grants',(select jsonb_agg(to_jsonb(g)order by sequence)from private.roadmap_processing_grants g),'batches',(select jsonb_agg(to_jsonb(b)order by sequence)from private.roadmap_processing_pilot_batches b),'keys',(select jsonb_agg(to_jsonb(k)order by id)from private.roadmap_processing_seal_keys k),'controls',(select to_jsonb(c)from private.roadmap_processing_controls c))");}
async function freshSession(){const old=f.sessions.get(f.justyn),sid=randomUUID();await f.q('delete from auth.sessions where id=$1',[old]);await f.q('insert into auth.sessions(id,user_id,not_after)values($1,$2,clock_timestamp()+interval\'1 hour\')',[sid,f.justyn]);f.sessions.set(f.justyn,sid);}
beforeEach(async t=>{
 db=new Client();await db.connect();await db.query('begin');f=await seed(db);await f.q('alter table auth.sessions add column if not exists created_at timestamptz default clock_timestamp()');sources=await f.prepare();
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
 await f.q(migration);
 const pins=await f.v('select private.roadmap_saved_review_basis($1,$2,$3,$4,$5)',[f.justyn,f.report,r2.version_id,pin,hash]);
 // Fixture inserts a historical expired grant/audit directly, not by changing old constraints.
 grant=await f.v("insert into private.roadmap_saved_review_grants(founder_id,founder_session,report_id,version_id,fingerprint,document_hash,consent_pins,starts_at,expires_at,operator_id,operator_session,authorization_reference)values($1,$2,$3,$4,$5,$6,$7,'2026-10-22T13:45Z','2026-10-22T22:00Z',$8,$9,'LOCAL SYNTHETIC historical review authority')returning id",[f.justyn,f.sessions.get(f.justyn),f.report,r2.version_id,pin,hash,JSON.stringify(pins),f.owner,f.sessions.get(f.owner)]);
 await f.q("insert into private.roadmap_saved_review_audit(grant_id,actor_id,session_id,action,authorization_reference,created_at)values($1,$2,$3,'grant','LOCAL SYNTHETIC historical review authority','2026-10-22T15:09Z')",[grant,f.owner,f.sessions.get(f.owner)]);
 oldRecord=await f.v('select to_jsonb(g)from private.roadmap_saved_review_grants g where id=$1',[grant]);oldAudit=await f.v('select jsonb_agg(to_jsonb(a)order by sequence)from private.roadmap_saved_review_audit a');baseline=await state();
 await f.q('create schema if not exists supabase_migrations;create table if not exists supabase_migrations.schema_migrations(version text primary key,name text,statements text[])');await f.q('insert into supabase_migrations.schema_migrations(version,name,statements)values($1,$2,$3)on conflict(version)do nothing',['20261022144239','roadmap_saved_revision_review_only',[fs.readFileSync(file,'utf8')]]);
 if(t.name.startsWith('migration drift'))return;
 await f.q(replacement);assert.deepEqual(await state(),baseline);assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'1');assert.equal(await f.v('select count(*)from private.roadmap_saved_review_audit'),'1');
 expires=new Date(Math.min(Date.now()+(t.name.startsWith('server-clock')?1800:600000),Date.parse('2026-10-24T13:00:00Z'))).toISOString();
 if(!t.name.startsWith('migration')&&!t.name.startsWith('concurrent issuance'))grant=await authorize();

});
afterEach(async()=>{try{await f?.drainScope();await f?.drainProcessing();await f?.drain6();await f?.drain5();await f?.drain();}finally{await db.query('rollback');await db.end();}});
test('migration installs no grant, preserves exact old row/audit and changes only guarded review objects',async()=>{
 assert.deepEqual(await f.v('select to_jsonb(g)from private.roadmap_saved_review_grants g'),oldRecord);assert.deepEqual(await f.v('select jsonb_agg(to_jsonb(a)order by sequence)from private.roadmap_saved_review_audit a'),oldAudit);assert.deepEqual(await state(),baseline);
 assert.equal(await f.v("select extract(epoch from(timestamp '2026-10-24 08:00:00' at time zone 'America/Chicago'))::bigint"),String(Date.parse('2026-10-24T13:00Z')/1000));
 const expected=JSON.parse(fs.readFileSync('../deployment-evidence/2026-10-22-review-renewal-authority/REVIEW_FUNCTION_CONTRACT.json'));for(const e of expected)assert.equal(await f.v("select encode(extensions.digest(prosrc,'sha256'),'hex')from pg_proc where oid=to_regproc($1)",[e.name]),e.hash);
 const allowed=['roadmap_saved_review_context','roadmap_saved_review_api'];for(const d of definitions){const row=(await f.q('select proname,pg_get_functiondef(oid)definition,proacl::text acl from pg_proc where oid=$1',[d.oid])).rows[0];if(!allowed.includes(row.proname)){assert.equal(row.definition,d.definition);assert.equal(row.acl,d.acl);}}
 await failedSql(replacement);assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'1');
});
test('replacement permits only exact saved R2 read/cited feedback and preserves the historical record',async()=>{
 assert.equal((await review('list',null)).length,1);const r=await review();assert.equal(r.version_id,r2.version_id);assert.equal(Date.parse(r.expires_at),Date.parse(expires));assert.equal(r.review_only,true);assert.deepEqual(await state(),baseline);
 assert.deepEqual(await f.v("select to_jsonb(g)from private.roadmap_saved_review_grants g where purpose='caroline-r2-justyn-read-cited-feedback-20261022'"),oldRecord);assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'2');
 for(const action of ['process','claim','finish','regenerate','enqueue','score','approve','pdf','email','deliver','attest'])await denied(()=>review(action));
 for(const action of ['claim','finish','regenerate','approve','pdf','read'])await denied(()=>f.rpc(f.justyn,action,f.report,{}));
});
test('wrong founders, clients, document, session, role and missing consent remain denied',async()=>{
 for(const user of [f.elle,f.owner,f.coach,f.member,null])await denied(()=>review('read',f.report,{},user));for(const report of [sources[1].report,sources[2].report,randomUUID()])await denied(()=>review('read',report));
 for(const options of [{session:f.sessions.get(f.elle)},{session:randomUUID()},{operator:f.justyn},{operatorSession:f.sessions.get(f.justyn)},{expires:'2026-10-24T13:00:01Z'},{expires:new Date(Date.now()-1).toISOString()},{reference:'Changed replay authority'}])await failedSql('select private.roadmap_saved_review_renew($1,$2,$3,$4,$5)',[options.session||f.sessions.get(f.justyn),options.expires||expires,options.operator||f.owner,options.operatorSession||f.sessions.get(f.owner),options.reference||'LOCAL SYNTHETIC ONE replacement saved-R2 read and cited feedback']);
 for(const table of ['roadmap_b6_purpose_events','roadmap_processing_purposes','roadmap_b6_grant_events','roadmap_b5_pilot_events','roadmap_processing_grants','roadmap_b4_cohort_events']){await f.q('savepoint withdrawn');await f.q('alter table private.'+table+' disable trigger user');await f.q('update private.'+table+' set active=false');await denied(()=>review());await f.q('rollback to savepoint withdrawn');}
 await f.q("update private.vitality_assessment_drafts set final_form='FICTIONAL changed source'where id=$1",[f.draft]);await denied(()=>review());
});
test('identical replay returns the same grant without duplicate audit; changed or revoked replay cannot renew',async()=>{
 for(let n=0;n<3;n++)assert.equal(await authorize(),grant);assert.equal(await f.v("select count(*)from private.roadmap_saved_review_audit where action='grant'"),'2');
 await f.q('select private.roadmap_saved_review_revoke($1,$2,$3,$4)',[grant,f.owner,f.sessions.get(f.owner),'LOCAL SYNTHETIC replacement revocation']);await denied(()=>review());await failedSql('select private.roadmap_saved_review_renew($1,$2,$3,$4,$5)',[f.sessions.get(f.justyn),expires,f.owner,f.sessions.get(f.owner),'LOCAL SYNTHETIC ONE replacement saved-R2 read and cited feedback']);assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'2');
});
test('source-cited corrections append new feedback and cannot edit the original proposal or either report',async()=>{
 const p={version_id:r2.version_id,expected_revision:0,request_key:randomUUID(),proposal:{driver:'cellular_hydration',decision:'needs_adjustment',interpretation:'FICTIONAL first interpretation',rationale:'FICTIONAL first reason',citations:['water_intake_consistency']}};
 await review('review',f.report,p);const original=await f.v('select to_jsonb(r)from private.roadmap_processing_reviews r where revision=1');const correction={...p,expected_revision:1,request_key:randomUUID(),proposal:{...p.proposal,interpretation:'FICTIONAL deliberate corrected interpretation'}};
 assert.equal((await review('review',f.report,correction)).revision,2);assert.equal((await review('review',f.report,correction)).idempotent,true);assert.deepEqual(await f.v('select to_jsonb(r)from private.roadmap_processing_reviews r where revision=1'),original);assert.deepEqual(await state(),baseline);
 for(const change of [{version_id:r1.version_id},{proposal:{...p.proposal,citations:[]}},{proposal:{...p.proposal,citations:['other_source_field']}}])await denied(()=>review('review',f.report,{...p,request_key:randomUUID(),expected_revision:2,...change}));
});
test('RLS, immutable history and private operator helper prevent browser/service grant writes',async()=>{
 for(const role of ['anon','authenticated','service_role']){
  assert.equal(await f.v("select has_function_privilege($1,'private.roadmap_saved_review_renew(uuid,timestamptz,uuid,uuid,text)','EXECUTE')",[role]),false);
  for(const table of ['grants','audit'])assert.equal(await f.v("select has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')",[role,'private.roadmap_saved_review_'+table]),false);
 }
 for(const table of ['grants','audit'])for(const statement of ['update private.roadmap_saved_review_'+table+' set '+(table==='grants'?'expires_at=expires_at':'action=action'),'delete from private.roadmap_saved_review_'+table,'truncate private.roadmap_saved_review_'+table+' cascade'])await failedSql(statement);
 assert.equal(await f.v("select bool_and(relrowsecurity)from pg_class where oid in('private.roadmap_saved_review_grants'::regclass,'private.roadmap_saved_review_audit'::regclass)"),true);
});
test('fixed windows and unique purpose prohibit a third grant or overlapping historical scope',async()=>{
 await f.q('savepoint duplicate');await assert.rejects(()=>f.q("insert into private.roadmap_saved_review_grants select singleton,gen_random_uuid(),founder_id,report_id,version_id,fingerprint,document_hash,consent_pins,starts_at,expires_at,operator_id,operator_session,founder_session,authorization_reference,purpose from private.roadmap_saved_review_grants where id=$1",[grant]),e=>e.code==='23505');await f.q('rollback to savepoint duplicate');
 await f.q('savepoint overlap');await assert.rejects(()=>f.q("insert into private.roadmap_saved_review_grants select singleton,gen_random_uuid(),founder_id,report_id,version_id,fingerprint,document_hash,consent_pins,'2026-10-22T21:00Z',expires_at,operator_id,operator_session,founder_session,authorization_reference,'unapproved_window' from private.roadmap_saved_review_grants where id=$1",[grant]),e=>['23514','23505'].includes(e.code));await f.q('rollback to savepoint overlap');assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'2');
});
test('server-clock expiry fails closed without updating history or reviving the old grant',async()=>{
 await review();await new Promise(r=>setTimeout(r,1900));await denied(()=>review());await failedSql('select private.roadmap_saved_review_renew($1,$2,$3,$4,$5)',[f.sessions.get(f.justyn),expires,f.owner,f.sessions.get(f.owner),'LOCAL SYNTHETIC ONE replacement saved-R2 read and cited feedback']);assert.deepEqual(await state(),baseline);
});
test('migration drift in ledger, ACLs, RLS, source or function configuration stops before any authority change',async()=>{
 for(const sql of ["update supabase_migrations.schema_migrations set name='wrong_ledger'", "grant execute on function private.roadmap_saved_review_basis(uuid,uuid,uuid,text,text)to authenticated", "alter table private.roadmap_saved_review_grants disable row level security", "alter function public.roadmap_saved_review(text,uuid,jsonb)reset search_path", "update private.vitality_assessment_drafts set final_form='FICTIONAL changed source'"]){await f.q('savepoint drift');await f.q(sql);await failedSql(replacement);await f.q('rollback to savepoint drift');assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'1');assert.equal(await f.v("select to_regprocedure('private.roadmap_saved_review_renew(uuid,timestamptz,uuid,uuid,text)')is null"),true);}
});

test('concurrent issuance, reads and idempotent feedback serialize without duplicate grants or proposals',async()=>{
 const core=require('../../../deployment-evidence/2026-10-22-review-renewal-authority/renewal-core.cjs');
 const r1hash=await f.v('select document_hash from private.roadmap_processing_versions where id=$1',[r1.version_id]);const metadataSql=fs.readFileSync('../deployment-evidence/2026-10-22-saved-review-release/preservation.sql','utf8').replace('6e7941cd6de59d790f73be58ee368d9d0680581a6571f021ef4a5357b1de7e61',r1hash);
 const metadata=(await f.q(metadataSql)).rows[0].status;await db.query('commit');const receipt=await core.run({db,session:{actor:f.owner,session:f.sessions.get(f.owner)},baseline:metadata,metadataSql});assert(receipt.pass);expires=core.deadline;
 const workers=await Promise.all(Array.from({length:8},async()=>{const c=new Client();await c.connect();return c;}));
 try{
  const args=[f.sessions.get(f.justyn),expires,f.owner,f.sessions.get(f.owner),core.reference];
  const grants=await Promise.all(workers.map(async c=>(await c.query('select private.roadmap_saved_review_renew($1,$2,$3,$4,$5)id',args)).rows[0].id));assert.equal(new Set(grants).size,1);assert.equal(await f.v('select count(*)from private.roadmap_saved_review_grants'),'2');assert.equal(await f.v("select count(*)from private.roadmap_saved_review_audit where action='grant'"),'2');
  const invoke=async(c,action,payload={})=>{try{await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[f.justyn,JSON.stringify({sub:f.justyn,role:'authenticated',iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:f.sessions.get(f.justyn)})]);const r=await c.query('select public.roadmap_saved_review($1,$2,$3)r',[action,f.report,JSON.stringify(payload)]);await c.query('commit');return{ok:true,value:r.rows[0].r};}catch(e){await c.query('rollback');return{ok:false,code:e.code};}};
  assert((await Promise.all(workers.map(c=>invoke(c,'read')))).every(r=>r.ok&&r.value.version_id===r2.version_id));
  const payload={version_id:r2.version_id,expected_revision:0,request_key:randomUUID(),proposal:{driver:'cellular_hydration',decision:'accurate',rationale:'FICTIONAL concurrent cited review',citations:['water_intake_consistency']}};
  assert((await Promise.all(workers.map(c=>invoke(c,'review',payload)))).every(r=>r.ok&&r.value.revision===1));assert.equal(await f.v('select count(*)from private.roadmap_processing_reviews'),'1');
  const different=await Promise.all(workers.map(c=>invoke(c,'review',{...payload,expected_revision:1,request_key:randomUUID()})));assert.equal(different.filter(r=>r.ok).length,1);assert(different.filter(r=>!r.ok).every(r=>r.code==='40001'));
  await db.query('begin');await db.query('select pg_advisory_xact_lock(18062026)');const waiting=invoke(workers[0],'read');let blocked=false;for(let n=0;n<100;n++){blocked=Number(await f.v("select count(*)from pg_locks where locktype='advisory'and not granted"))>0;if(blocked)break;await new Promise(r=>setTimeout(r,5));}assert(blocked);await db.query("update auth.sessions set not_after=clock_timestamp()-interval'1 second'where id=$1",[f.sessions.get(f.justyn)]);await db.query('commit');assert.equal((await waiting).ok,false);assert.deepEqual(await state(),baseline);
 }finally{await db.query('rollback');await Promise.all(workers.map(c=>c.end()));}
});

