// FICTIONAL ONLY. These are local test actors, never hosted participant records.
const fs=require('node:fs'),{randomUUID}=require('node:crypto'),{seed:seedB4}=require('./roadmap-b4.cjs');
const migration=fs.readFileSync('supabase/environment-migrations/production/20261016195245_vitality_roadmap_b42_identity_verification.sql','utf8').replace(/^([\s\S]*?)\bbegin;/,'$1').replace(/commit;\s*$/,'');
const acks={internal_only:true,founders_only:true,read_only:true,no_ai_exports:true,no_scores_emails:true,manual_revocation_14_days:true,separate_enrollment:true};
async function seed(db){
 const f=await seedB4(db);await f.q(migration);
 await f.q("update public.contacts set first_name='Robin',last_name='Vale' where id=$1",[f.contact]);
 let duplicate=await f.v("select id from public.contacts where lower(email)='other-owner@example.invalid'").catch(()=>null);
 if(duplicate)await f.q("update public.contacts set first_name='Robin',last_name='Vale' where id=$1",[duplicate]);
 else duplicate=await f.v("insert into public.contacts(first_name,last_name,email) values('Robin','Vale','other-owner@example.invalid') returning id");
 const historical=await f.v("insert into public.contacts(first_name,last_name,email) values('Cedar','Quill','cedar@example.invalid') returning id");
 const wf=await f.v("insert into public.workflow_records(contact_id,workflow_type,status,current_step,completion_percent,completed_at) values($1,'vitality_assessment','completed','complete',100,now()) returning id",[historical]);
 const historicalReport=await f.v('insert into public.vitality_reports(contact_id,workflow_id) values($1,$2) returning id',[historical,wf]);
 let tail=Promise.resolve();
 function b42(user,action,payload={},role='authenticated',claims={}){const work=tail.then(async()=>{
 await f.q('savepoint b42_actor');try{await f.q('set local role '+role);await f.q("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",[user||'',JSON.stringify({sub:user,role,iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:f.sessions.get(user),...claims})]);const r=await f.v('select public.roadmap_b42($1,$2)',[action,JSON.stringify(payload)]);await f.q('reset role');await f.q('release savepoint b42_actor');return r;}catch(e){await f.q('rollback to savepoint b42_actor');await f.q('release savepoint b42_actor');throw e;}});tail=work.catch(()=>{});return work;}
 const search=()=>b42(f.justyn,'search',{query:'Robin Vale'});
 const payload=(row,extra={})=>({request:row.request,request_key:randomUUID(),expected_revision:row.revision,decision:'confirmed',reason_code:'identity_date_match',sop_version:'RVA-B4-PILOT-READONLY-v1-2026-10-16',acknowledgments:{...acks},revocation_owner:'justyn',backup_owner:'elle',starts_at:new Date(Date.now()+3600000).toISOString(),revoke_by:new Date(Date.now()+86400000).toISOString(),...extra});
 return{...f,duplicate,historical,historicalReport,b42,search,payload,drain:()=>tail};
}
module.exports={seed,migration,acks};
