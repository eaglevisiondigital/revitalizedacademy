'use strict';
// FICTIONAL local staff. No real agreement, identity, signature or timestamp.
const fs=require('node:fs'),{randomUUID,createHash}=require('node:crypto');
const sha=s=>createHash('sha256').update(s).digest('hex');
const fix=fs.readFileSync('supabase/environment-migrations/production/20261018194500_staff_agreement_trigger_42703_fix.sql','utf8').replace(/^begin;\s*/im,'').replace(/commit;\s*$/,'');
const baseline=fs.readFileSync('../revitalizedacademy/supabase/baselines/2026-09-26/schema.sql','utf8');
const oldFunction=baseline.match(/CREATE OR REPLACE FUNCTION private\.sync_staff_onboarding_from_agreements\(\)[\s\S]*?\$function\$\s*;/)[0];
async function seed(db){const q=(s,p=[])=>db.query(s,p),v=async(s,p=[])=>Object.values((await q(s,p)).rows[0])[0];
 await q(fix);
 async function user(role='coach',scope='assigned',status='active',onboarding='pending'){
  const id=randomUUID(),email='fictional-'+id+'@example.invalid';await q('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email]);
  await q("insert into public.staff_access(user_id,role,status,onboarding_status,contact_scope,display_name) values($1,$2,$3,$4,$5,'Fictional Coach')",[id,role,status,onboarding,scope]);return{id,email};}
 const actor=await user('owner','all','active','complete'),staff=await user(),other=await user('admin','all','active','complete');
 await q("insert into public.staff_permission_catalog(permission_key,label,category,active) values('staff.manage','Manage synthetic staff','Staff',true) on conflict do nothing");
 await q("insert into public.staff_permission_overrides(user_id,permission_key,allowed,updated_by) values($1,'staff.manage',true,$1) on conflict(user_id,permission_key) do update set allowed=true",[actor.id]);
 const templateText='LOCAL FICTIONAL NDA: {{staff_name}} agrees to example terms.',rendered='LOCAL FICTIONAL NDA: Fictional Coach agrees to example terms.';
 async function agreement({required=true,status='sent',target=staff.id,kind='coach_nda'}={}){const key='fictional_nda_'+randomUUID();
  const template=await v("insert into public.agreement_templates(agreement_key,name,version,content_text,content_hash,status,audience,document_type,published_at) values($1,'Fictional NDA','local-v1',$2,$3,'published','staff',$4,now()) returning id",[key,templateText,sha(templateText),kind]);
  const id=await v("insert into public.staff_agreements(staff_user_id,agreement_template_id,agreement_key,template_version,content_hash,rendered_content_text,rendered_content_hash,status,required,created_at,sent_at) values($1,$2,$3,'local-v1',$4,$5,$6,$7,$8,now()-interval '2 days',now()-interval '1 day') returning id",[target,template,key,sha(templateText),rendered,sha(rendered),status,required]);return{id,template,key};}
 const a=await agreement();
 async function acceptance({agreement=a.id,target=staff.id,email=staff.email,terms=true,type='typed',hash=sha(rendered),name='Fictional Coach'}={}){
  return v("insert into public.staff_agreement_acceptances(staff_agreement_id,staff_user_id,signer_name,signer_email,signature_type,accepted_terms,content_hash,signed_at,metadata) values($1,$2,$3,$4,$5,$6,$7,now()-interval '5 minutes','{\"fixture\":\"LOCAL_FICTIONAL_ONLY\"}') returning id",[agreement,target,name,email,type,terms,hash]);}
 await q("insert into public.staff_access_audit(staff_user_id,action,actor_user_id,reason) values($1,'local_fixture_prior_audit',$2,'LOCAL FICTIONAL history')",[staff.id,actor.id]);
 async function input(acceptanceId){return{separatelyApproved:true,staffUserId:staff.id,agreementId:a.id,acceptanceId,operatorActorId:actor.id,expectedAcceptanceDigest:await v("select encode(extensions.digest(to_jsonb(x)::text,'sha256'),'hex') from public.staff_agreement_acceptances x where id=$1",[acceptanceId]),approvalReference:'LOCAL FICTIONAL separate owner recovery approval'};}
 // Let the operator library use a real rollback boundary inside the fixture transaction.
 const transactional={query:async(s,p)=>{if(s==='begin')return q('savepoint recovery_operator');if(s==='commit')return q('release savepoint recovery_operator');if(s==='rollback'){await q('rollback to savepoint recovery_operator');return q('release savepoint recovery_operator');}return q(s,p);}};
 return{q,v,staff,actor,other,a,agreement,acceptance,input,transactional,user,rendered,sha};
}
module.exports={seed,fix,oldFunction,sha};
