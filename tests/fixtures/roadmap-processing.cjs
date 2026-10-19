// Synthetic only. Applies candidate migration to a disposable LOCAL database.
const fs=require('fs'),{seed:seed6}=require('./roadmap-b6.cjs');
const file='supabase/environment-migrations/production/20261019180611_roadmap_internal_processing_v1.sql';
const migration=fs.readFileSync(file,'utf8').replace(/^([\s\S]*?)\bbegin;/,'$1').replace(/commit;\s*$/,'');
async function seed(db){for(const key of ['crm.view','health.private.view','health.progress.manage','staff.manage'])await db.query("insert into public.staff_permission_catalog(permission_key,label,category,active)values($1,$1,'LOCAL TEST',true)on conflict do nothing",[key]);const f=await seed6(db);const originalFunctions=await f.v("select md5(jsonb_agg(jsonb_build_array(p.oid,pg_get_functiondef(p.oid),p.proowner,p.proacl)order by p.oid)::text)from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')and p.prokind='f'and p.proname not like 'roadmap_processing%'");await f.q(migration);let tail=Promise.resolve();
 function rpc(user,action,report=f.report,payload={},role='authenticated',claims={}){
 const job=tail.then(async()=>{await f.q('savepoint process_actor');try{await f.q('set local role '+role);await f.q("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[user||'',JSON.stringify({sub:user,role,iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:f.sessions.get(user),...claims})]);const result=await f.v('select public.roadmap_processing($1,$2,$3)',[action,report,JSON.stringify(payload)]);await f.q('reset role');await f.q('release savepoint process_actor');return result;}catch(e){await f.q('rollback to savepoint process_actor');await f.q('release savepoint process_actor');throw e;}});tail=job.catch(()=>{});return job;}
 async function enable({feedback=true,approval=true,pdf=false}={}){
 await f.grant6({feedback});await f.q("update private.roadmap_processing_controls set ingest=true,process=true,review=$1,approve=$2,internal_pdf=$3",[feedback,approval,pdf]);
 await f.q("insert into public.staff_permission_overrides(user_id,permission_key,allowed,updated_by)values($1,'staff.manage',true,$1)on conflict(user_id,permission_key)do update set allowed=true",[f.owner]);
 await rpc(f.justyn,'attest',f.report,{active:true,acknowledgment:'private_internal_draft_storage_review_separate_from_read_only_pilot_v1'});
 const purpose=await f.v('select max(sequence)from private.roadmap_processing_purposes');
 return f.v('select private.roadmap_processing_set_grant($1,$2,$3,$4,$5,$6,$7,$8)',[purpose,new Date(Date.now()+300000).toISOString(),f.owner,f.sessions.get(f.owner),'LOCAL FICTIONAL separate private storage/review permission',feedback,approval,pdf]);}
 const seal=(job,lease,document)=>f.v('select public.roadmap_processing_seal($1,$2,$3)',[job,lease,JSON.stringify(document)]);
 return{...f,originalFunctions,rpc,enable,seal,drainProcessing:()=>tail};}
module.exports={seed,migration};
