'use strict';
// Operator library ONLY. No connection, CLI, credentials, record IDs or automatic execution.
// Import only in an independently approved protected operator process after BOTH gates.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const migration=fs.readFileSync(path.join(__dirname,'../supabase/environment-migrations/production/20261018194500_staff_agreement_trigger_42703_fix.sql'),'utf8');
const repairedBody=migration.match(/as \$fn\$([\s\S]*?)\$fn\$/i)[1];
const repairedBodyHash=createHash('sha256').update(repairedBody).digest('hex');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireGuard(ok,label){if(!ok)throw Object.assign(Error('NDA recovery blocked'),{code:'RVA_NDA_GUARD',guard:label});}
async function reconcileExistingAcceptance(db,input){
 requireGuard(input?.separatelyApproved===true,'separate_owner_recovery_approval');
 for(const k of ['staffUserId','agreementId','acceptanceId','operatorActorId'])requireGuard(uuid.test(input[k]||''),'exact_private_bindings');
 requireGuard(/^[a-f0-9]{64}$/.test(input.expectedAcceptanceDigest||''),'previously_verified_acceptance_pin');
 requireGuard(typeof input.approvalReference==='string'&&input.approvalReference.trim().length>=12&&input.approvalReference.length<=400,'private_approval_reference');
 const v=async(q,p=[])=>(await db.query(q,p)).rows[0];
 let begun=false;
 try{
  await db.query('begin');begun=true;
  await db.query("set local lock_timeout='3s'; set local statement_timeout='15s'");
  const fn=await v("select encode(extensions.digest(prosrc,'sha256'),'hex') h from pg_proc where oid='private.sync_staff_onboarding_from_agreements()'::regprocedure");
  requireGuard(fn?.h===repairedBodyHash,'tested_trigger_installed_first');
  await db.query('select pg_advisory_xact_lock(hashtextextended($1,184927))',[input.agreementId]);
  const locked=await db.query('select 1 from public.staff_agreements where id=$1 and staff_user_id=$2 for update',[input.agreementId,input.staffUserId]);
  requireGuard(locked.rowCount===1,'one_exact_existing_agreement');
  requireGuard((await db.query('select 1 from public.staff_agreement_acceptances where id=$1 and staff_agreement_id=$2 and staff_user_id=$3 for update',[input.acceptanceId,input.agreementId,input.staffUserId])).rowCount===1,'one_exact_existing_acceptance');
  requireGuard((await db.query('select 1 from public.staff_access where user_id=$1 for update',[input.staffUserId])).rowCount===1,'one_exact_existing_staff');
  await db.query('select 1 from public.agreement_templates where id=(select agreement_template_id from public.staff_agreements where id=$1) for share',[input.agreementId]);
  const actor=await v("select exists(select 1 from public.staff_access s join auth.users u on u.id=s.user_id where s.user_id=$1 and s.role in ('owner','admin') and s.status='active' and s.onboarding_status='complete' and u.email_confirmed_at is not null and u.deleted_at is null and (u.banned_until is null or u.banned_until<clock_timestamp()) and private.staff_has_permission(s.user_id,'staff.manage')) ok",[input.operatorActorId]);
  requireGuard(actor?.ok,'authorized_owner_admin_audit_actor');
  const before=await v(`select s.role,s.status,s.contact_scope,s.onboarding_status,
   a.status as agreement_status,a.signed_at is null as agreement_unsigned,
   a.required and t.audience='staff' and t.document_type='coach_nda' and t.status='published' as required_staff_nda,
   u.email_confirmed_at is not null and u.deleted_at is null and (u.banned_until is null or u.banned_until<clock_timestamp()) as account_valid,
   acc.accepted_terms and acc.signature_type='typed' and length(trim(acc.signer_name))>=2
    and lower(regexp_replace(trim(acc.signer_name),'\\s+',' ','g'))=lower(regexp_replace(trim(s.display_name),'\\s+',' ','g'))
    and lower(trim(acc.signer_email))=lower(trim(u.email)) as genuine_matching_acceptance,
   acc.signed_at>=a.created_at and acc.signed_at<=clock_timestamp() as valid_original_time,
   acc.content_hash=a.rendered_content_hash and encode(extensions.digest(a.rendered_content_text,'sha256'),'hex')=a.rendered_content_hash
    and a.content_hash=t.content_hash and a.template_version=t.version and a.agreement_key=t.agreement_key as content_integrity,
   encode(extensions.digest(to_jsonb(acc)::text,'sha256'),'hex') as acceptance_digest,
   encode(extensions.digest((to_jsonb(a)-array['status','signed_at','updated_at'])::text,'sha256'),'hex') as agreement_rest_digest,
   encode(extensions.digest((to_jsonb(s)-array['onboarding_status','updated_at'])::text,'sha256'),'hex') as staff_rest_digest,
   (select count(*)::int from public.staff_agreements x where x.staff_user_id=s.user_id and x.id<>a.id and x.required and x.status not in ('signed','waived')) as other_required_incomplete,
   (select encode(extensions.digest(coalesce(string_agg(to_jsonb(x)::text,E'\\n' order by x.id),''),'sha256'),'hex') from public.staff_access_audit x where x.staff_user_id=s.user_id) as previous_audit_digest
   from public.staff_agreements a join public.staff_access s on s.user_id=a.staff_user_id join auth.users u on u.id=s.user_id
   join public.staff_agreement_acceptances acc on acc.staff_agreement_id=a.id and acc.staff_user_id=s.user_id
   join public.agreement_templates t on t.id=a.agreement_template_id where a.id=$1 and s.user_id=$2 and acc.id=$3`,[input.agreementId,input.staffUserId,input.acceptanceId]);
  requireGuard(before&&before.role==='coach'&&before.status==='active'&&before.onboarding_status==='pending'&&before.contact_scope==='assigned','expected_existing_coach_state');
  requireGuard(['sent','viewed'].includes(before.agreement_status)&&before.agreement_unsigned,'existing_sent_viewed_unsigned');
  for(const k of ['required_staff_nda','account_valid','genuine_matching_acceptance','valid_original_time','content_integrity'])requireGuard(before[k]===true,k);
  requireGuard(before.acceptance_digest===input.expectedAcceptanceDigest,'unchanged_verified_acceptance');
  requireGuard(before.other_required_incomplete===0,'no_other_unsigned_required_agreements');
  const changed=await db.query(`update public.staff_agreements a set status='signed',signed_at=acc.signed_at,updated_at=clock_timestamp()
   from public.staff_agreement_acceptances acc where a.id=$1 and a.staff_user_id=$2 and acc.id=$3 and acc.staff_agreement_id=a.id
    and acc.staff_user_id=a.staff_user_id and a.status=$4 and a.signed_at is null returning 1`,[input.agreementId,input.staffUserId,input.acceptanceId,before.agreement_status]);
  requireGuard(changed.rowCount===1,'exactly_one_agreement_updated');
  const after=await v(`select a.status='signed' and a.signed_at=acc.signed_at as signed_at_original_time,s.onboarding_status,
   encode(extensions.digest(to_jsonb(acc)::text,'sha256'),'hex') as acceptance_digest,
   encode(extensions.digest((to_jsonb(a)-array['status','signed_at','updated_at'])::text,'sha256'),'hex') as agreement_rest_digest,
   encode(extensions.digest((to_jsonb(s)-array['onboarding_status','updated_at'])::text,'sha256'),'hex') as staff_rest_digest
   from public.staff_agreements a join public.staff_agreement_acceptances acc on acc.staff_agreement_id=a.id
   join public.staff_access s on s.user_id=a.staff_user_id where a.id=$1 and acc.id=$2`,[input.agreementId,input.acceptanceId]);
  requireGuard(after?.signed_at_original_time&&after.onboarding_status==='complete','trigger_calculated_expected_complete_state');
  for(const k of ['acceptance_digest','agreement_rest_digest','staff_rest_digest'])requireGuard(after[k]===before[k],'preserved_'+k);
  const audit=await db.query(`insert into public.staff_access_audit(staff_user_id,action,actor_user_id,previous_value,new_value,reason)
   values($1,'staff_agreement_acceptance_reconciled',$2,$3,$4,$5) returning id`,[input.staffUserId,input.operatorActorId,
    {agreement_status:before.agreement_status,onboarding_status:before.onboarding_status},
    {agreement_status:'signed',onboarding_status:'complete',staff_agreement_id:input.agreementId,original_acceptance_preserved:true},
    'Approved operator state reconciliation; original electronic acceptance and timestamp retained. '+input.approvalReference]);
  requireGuard(audit.rowCount===1,'one_truthful_recovery_audit');
  const oldAudit=await v("select encode(extensions.digest(coalesce(string_agg(to_jsonb(x)::text,E'\\n' order by x.id),''),'sha256'),'hex') h from public.staff_access_audit x where x.staff_user_id=$1 and x.id<>$2",[input.staffUserId,audit.rows[0].id]);
  requireGuard(oldAudit.h===before.previous_audit_digest,'existing_audit_history_preserved');
  await db.query('commit');begun=false;
  return{agreement_signed:true,onboarding_complete:true,original_acceptance_unchanged:true,original_timestamp_reused:true,role_scope_unchanged:true,recovery_audit_rows:1};
 }catch(e){
  if(begun)await db.query('rollback').catch(()=>{});
  if(e.code==='RVA_NDA_GUARD')throw e;
  throw Object.assign(Error('NDA recovery transaction aborted; no recovery committed'),{code:/^[A-Z0-9]{5}$/.test(e.code||'')?e.code:'RVA_NDA_SQL'});
 }
}
module.exports={reconcileExistingAcceptance,repairedBodyHash};
