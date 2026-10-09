const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');const {randomUUID,randomBytes,createHash}=require('node:crypto');const {Client}=require('pg');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||'')||process.env.PGHOST!=='127.0.0.1')throw Error('Disposable local database required');
const db=new Client(),q=(s,p=[])=>db.query(s,p),value=async(s,p=[])=>Object.values((await q(s,p)).rows[0])[0];
let owner,admin,coach,member,other,contact,program;
async function actor(uid,sql,args=[],role='authenticated'){
 await q('savepoint lifecycle_actor');
 try{await q('set local role '+role);await q("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[uid||'',role]);const r=await q(sql,args);await q('reset role');await q("select set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','',true)");await q('release lifecycle_actor');return r;}
 catch(e){await q('rollback to lifecycle_actor');await q('release lifecycle_actor');throw e;}
}
async function user(role,email){const id=randomUUID();await q('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email||id+'@example.invalid']);if(role){await q("insert into staff_access(user_id,role,status,onboarding_status,contact_scope) values($1,$2,'active','complete',$3)",[id,role,role==='coach'?'assigned':'all']);await q("update staff_access set onboarding_status='complete' where user_id=$1",[id]);}return id;}
async function seedPermissions(){const m=require('../../../revitalizedacademy/supabase/baselines/2026-09-26/metadata.json');for(const r of m.permission_catalog){const k=Object.keys(r);await q('insert into staff_permission_catalog('+k.join(',')+') values('+k.map((_,i)=>'$'+(i+1)).join(',')+') on conflict do nothing',Object.values(r));}for(const r of m.permission_defaults)await q('insert into staff_role_permission_defaults(role,permission_key,allowed) values($1,$2,$3) on conflict do nothing',[r.role,r.permission_key,r.allowed]);}
before(()=>db.connect());
after(()=>db.end());beforeEach(async()=>{await q('begin');await seedPermissions();owner=await user('owner');admin=await user('admin');coach=await user('coach');member=await user();other=await user();contact=await value("insert into contacts(first_name,last_name,email) values('Local','Client',$1) returning id",['client-'+randomUUID()+'@example.invalid']);program='holistic-foundations';await q("insert into program_catalog(program_code,name,program_type,default_commitment_months) values($1,'Local Foundations','membership',6) on conflict(program_code) do nothing",[program]);await q("insert into journey_definitions(journey_key,name,audience) values('direct_membership','Local membership','client') on conflict do nothing");await q("insert into journey_step_definitions(journey_key,step_key,step_order,name,step_type,required) values('direct_membership','application_capture',1,'Contact','form',true),('direct_membership','payment_agreement',2,'Agreement','form',true) on conflict do nothing");});afterEach(()=>q('rollback'));
const create='select public.create_production_client($1,$2) id',save='select public.save_production_client_enrollment($1,$2,$3,$4,$5) state';
const payload=()=>({first_name:'Local',last_name:'Client',email:'MixedCase-'+randomUUID()+'@EXAMPLE.INVALID',phone:'+1 (819) 598-3893',source:'manual_staff_entry',referral_source:'Sales Rep',sales_rep_name:'Local Rep'});
async function saveEnrollment(){return (await actor(owner,save,[contact,program,'monthly',8900,'CAD'])).rows[0].state;}
test('creation normalizes email/phone, keeps source/Sales Rep, retry reuses exact contact without duplicate audit',async()=>{const p=payload(),r=randomUUID(),a=(await actor(owner,create,[r,p])).rows[0].id,b=(await actor(owner,create,[r,p])).rows[0].id;assert.equal(a,b);const c=(await q('select * from contacts where id=$1',[a])).rows[0];assert.equal(c.email,p.email.toLowerCase());assert.equal(c.phone,'8195983893');assert.equal(c.sales_rep_name,'Local Rep');assert.equal(c.first_source,'manual_staff_entry');assert.equal(await value("select count(*)::int from contact_activity where contact_id=$1 and activity_type='production_client_record_prepared'",[a]),1);});
test('existing contact reused and original referral/Sales Rep attribution preserved',async()=>{await q("update contacts set phone='8195983893',first_source='original',referral_source='Sales Rep',sales_rep_name='Original Rep' where id=$1",[contact]);const email=await value('select email from contacts where id=$1',[contact]),p={...payload(),email,referral_source:'Other',referral_source_other:'Later source'};assert.equal((await actor(owner,create,[randomUUID(),p])).rows[0].id,contact);const c=(await q('select * from contacts where id=$1',[contact])).rows[0];assert.equal(c.first_source,'original');assert.equal(c.sales_rep_name,'Original Rep');assert.equal(c.referral_source,'Sales Rep');assert.equal(c.referral_source_other,null);});
test('phone collision with different email rejects without duplicate or identity overwrite',async()=>{await q("update contacts set phone='+1 819 598 3893' where id=$1",[contact]);await assert.rejects(actor(owner,create,[randomUUID(),payload()]),/different email/);assert.equal(await value("select count(*)::int from contacts where phone='+1 819 598 3893'"),1);});
test('creation rejects member/Coach/anonymous, unsupported fields, missing conditional values and request reuse',async()=>{for(const u of [member,coach])await assert.rejects(actor(u,create,[randomUUID(),payload()]),/Authorized/);await assert.rejects(actor(null,create,[randomUUID(),payload()],'anon'),/permission denied/);await assert.rejects(actor(owner,create,[randomUUID(),{...payload(),status:'active'}]),/Unsupported/);await assert.rejects(actor(owner,create,[randomUUID(),{...payload(),sales_rep_name:''}]),/conditional/);const r=randomUUID(),p=payload();await actor(owner,create,[r,p]);await assert.rejects(actor(owner,create,[r,{...p,last_name:'Changed'}]),/details changed/);});
test('Owner/Admin enrollment saves active catalog program/billing/amount/currency without mail or payment and retry reuses identity',async()=>{const s=await saveEnrollment();assert.equal(s.program_code,program);assert.equal(s.amount_cents,8900);assert.equal(s.currency,'CAD');assert.equal(s.payment_status,'pending');assert.equal(s.member_access,'onboarding');assert.equal(s.invitation,null);assert.equal(s.agreement_mapping_ready,false);await actor(admin,save,[contact,program,'monthly',8900,'CAD']);assert.equal(await value('select count(*)::int from journey_enrollment_activations where contact_id=$1',[contact]),1);assert.equal(await value('select count(*)::int from payment_records'),0);});
test('enrollment rejects member/Coach/anonymous/inactive/out-of-scope Admin and invalid program/billing',async()=>{for(const u of [member,coach])await assert.rejects(actor(u,save,[contact,program,'monthly',8900,'CAD']),/Authorized/);await assert.rejects(actor(null,save,[contact,program,'monthly',8900,'CAD'],'anon'),/permission denied/);await q("update staff_access set contact_scope='assigned' where user_id=$1",[admin]);await assert.rejects(actor(admin,save,[contact,program,'monthly',8900,'CAD']),/scope/);await q("update staff_access set status='inactive' where user_id=$1",[owner]);await assert.rejects(saveEnrollment(),/Authorized/);});
test('payment holds deny manual paid/waived state, URL, ledger writes, even zero-price full access',async()=>{await saveEnrollment();for(const s of ['paid','waived','partially_paid'])await assert.rejects(actor(owner,'update journey_enrollment_activations set payment_status=$1 where contact_id=$2',[s,contact]),/Payments v1/);await assert.rejects(actor(owner,"update journey_enrollment_activations set payment_url='https://example.invalid/pay' where contact_id=$1",[contact]),/Payments v1/);await q('savepoint forbidden_payment');await assert.rejects(q("insert into payment_records(contact_id,amount_cents,payment_method) values($1,8900,'cash')",[contact]),/payment recording/);await q('rollback to forbidden_payment');await q('release forbidden_payment');await q('update journey_enrollment_activations set amount_cents=0 where contact_id=$1',[contact]);assert.equal(await value('select private.enrollment_payment_satisfied(a) from journey_enrollment_activations a where contact_id=$1',[contact]),false);assert.equal((await actor(member,'select public.member_paid_access_allowed() ok')).rows[0].ok,false);});
test('production origin configured and no beta recipient registry or synthetic recorder promoted',async()=>{assert.deepEqual(await value("select config_value from app_runtime_config where config_key='client_onboarding'"),{origin:'https://revitalizedacademy.com'});assert.equal(await value("select to_regprocedure('public.record_enrollment_payment(uuid,integer,text,text,text,text)') is not null"),false);assert.equal(await value("select to_regclass('private.beta_test_recipients') is not null"),false);});
test('new private request table RLS enabled and browser/service cannot read cached identity',async()=>{assert.equal(await value("select relrowsecurity from pg_class where oid='private.production_client_creation_requests'::regclass"),true);for(const role of ['authenticated','anon','service_role'])await assert.rejects(actor(member,'select * from private.production_client_creation_requests',[],role),/permission denied/);});
test('wrong/unverified/modified invitation cannot claim existing enrollment; verified intended user can',async()=>{await saveEnrollment();const email=await value('select email from contacts where id=$1',[contact]);const intended=await user(null,email),token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');await q("insert into journey_access_links(contact_id,journey_id,token_hash,expires_at) select contact_id,journey_id,$2,now()+interval '1 day' from journey_enrollment_activations where contact_id=$1",[contact,hash]);await assert.rejects(actor(other,'select public.claim_onboarding_enrollment($1)',[token]),/unavailable/);await q('update auth.users set email_confirmed_at=null where id=$1',[intended]);await assert.rejects(actor(intended,'select public.claim_onboarding_enrollment($1)',[token]),/verified/);await q('update auth.users set email_confirmed_at=now() where id=$1',[intended]);await actor(intended,'select public.claim_onboarding_enrollment($1)',[token]);const c=(await actor(intended,'select public.my_onboarding_context() c')).rows[0].c;assert.equal(c.full_access,false);assert.equal(c.enrollments.length,1);assert.equal(c.enrollments[0].payment_url,null);assert.equal((await actor(other,'select public.my_onboarding_context() c')).rows[0].c.enrollments.length,0);});

async function agreementFixture(){
 await saveEnrollment();const email=await value('select email from contacts where id=$1',[contact]);const client=await user(null,email);
 await q('update client_access set user_id=$2,needs_onboarding_claim=false where contact_id=$1',[contact,client]);
 await q("update app_runtime_config set config_value='{\"status\":\"released\",\"reason\":\"local_test_only\"}' where config_key='production_client_agreement_publication'");
 const text='Local disposable contract for {{client_name}}',h=createHash('sha256').update(text).digest('hex');
 const template=await value("insert into agreement_templates(agreement_key,name,version,content_text,content_hash,status,audience,document_type,merge_schema) values($1,'Local contract','local',$2,$3,'published','client','client_contract','{\"required\":[\"client_name\"],\"optional\":[]}') returning id",['local-'+randomUUID(),text,h]);
 await q("insert into program_agreement_requirements(program_code,agreement_template_id,required,active,billing_choice,currency) values($1,$2,true,true,'monthly','CAD')",[program,template]);
 const id=(await actor(owner,'select public.prepare_client_contract($1,$2,$3,true) id',[contact,template,{client_name:'Local Adult'}])).rows[0].id;
 const a=(await q('select * from client_agreements where id=$1',[id])).rows[0];return {client,a,template};
}
test('authorized contract preparation queues production-only mail, immutable authenticated signature is idempotent, paid access remains denied',async()=>{
 const {client,a}=await agreementFixture(),args=[a.id,JSON.stringify([{signer_role:'primary_client',signer_name:'Local Adult'}]),a.rendered_content_hash];
 const job=(await q('select recipient,body from notification_delivery_jobs where client_agreement_id=$1',[a.id])).rows[0];assert.ok(job.body.includes('https://revitalizedacademy.com/member/onboarding/'));assert.ok(!job.body.includes('beta.revitalizedacademy.com'));
 const first=(await actor(client,'select public.sign_client_agreement_atomic($1,$2,$3) id',args)).rows[0].id;
 const before=(await q('select * from agreement_acceptances where id=$1',[first])).rows[0];
 assert.equal((await actor(client,'select public.sign_client_agreement_atomic($1,$2,$3) id',args)).rows[0].id,first);assert.deepEqual((await q('select * from agreement_acceptances where id=$1',[first])).rows[0],before);
 await assert.rejects(actor(owner,"update client_agreements set rendered_content_text='tampered' where id=$1",[a.id]),/immutable/);
 assert.equal((await actor(client,'select public.member_paid_access_allowed() ok')).rows[0].ok,false);
});
test('agreement signing denies unrelated, stale-hash, double-signature and unverified requests; browser cannot forge acceptance',async()=>{
 const {client,a}=await agreementFixture(),sig=[{signer_role:'primary_client',signer_name:'Local Adult'}];
 await assert.rejects(actor(other,'select public.sign_client_agreement_atomic($1,$2,$3)',[a.id,JSON.stringify(sig),a.rendered_content_hash]),/not found/);
 await assert.rejects(actor(client,'select public.sign_client_agreement_atomic($1,$2,$3)',[a.id,JSON.stringify(sig),'stale']),/content changed/);
 await assert.rejects(actor(client,'select public.sign_client_agreement_atomic($1,$2,$3)',[a.id,JSON.stringify([...sig,...sig]),a.rendered_content_hash]),/Exactly one/);
 await q('update auth.users set email_confirmed_at=null where id=$1',[client]);await assert.rejects(actor(client,'select public.sign_client_agreement_atomic($1,$2,$3)',[a.id,JSON.stringify(sig),a.rendered_content_hash]),/Verified/);
 await assert.rejects(actor(client,"insert into agreement_acceptances(client_agreement_id,contact_id,signed_by_user_id,signer_name,accepted_terms,content_hash) values($1,$2,$3,'Forged',true,$4)",[a.id,contact,client,a.rendered_content_hash]),/permission denied/);
 assert.equal(await value('select count(*)::int from agreement_acceptances'),0);
});
test('contract preparation denies Coach/member/out-of-scope Admin and missing mapping',async()=>{
 const {a,template}=await agreementFixture();for(const who of [coach,member])await assert.rejects(actor(who,'select public.prepare_client_contract($1,$2,$3,false)',[contact,template,{client_name:'Local Adult'}]),/Authorized/);
 await q("update staff_access set contact_scope='assigned' where user_id=$1",[admin]);await assert.rejects(actor(admin,'select public.prepare_client_contract($1,$2,$3,false)',[contact,template,{client_name:'Local Adult'}]),/scope/);
 await q('delete from program_agreement_requirements where program_code=$1',[program]);await assert.rejects(actor(owner,'select public.prepare_client_contract($1,$2,$3,false)',[contact,template,{client_name:'Local Adult'}]),/mapping required/);
});
test('tampered beta onboarding origin cannot issue production invitation',async()=>{
 const {a}=await agreementFixture();await q("update app_runtime_config set config_value='{\"origin\":\"https://beta.revitalizedacademy.com\"}' where config_key='client_onboarding'");
 await assert.rejects(actor(owner,"update client_agreements set sent_at=now()+interval '1 second' where id=$1",[a.id]),/approved HTTPS/);
});

test('only approved Holistic Foundations billing intent is accepted; future custom architecture stays held',async()=>{
 for(const args of [[contact,program,'monthly',0,'CAD'],[contact,program,'monthly',8901,'CAD'],[contact,program,'custom',8900,'CAD'],[contact,program,'monthly',8900,'USD'],[contact,'unknown','monthly',8900,'CAD']])await assert.rejects(actor(owner,save,args),/Holistic Foundations/);
 await actor(owner,save,[contact,program,'one_time',96000,'CAD']);const s=(await actor(owner,'select public.production_client_enrollment_state($1) s',[contact])).rows[0].s;assert.equal(s.amount_cents,96000);assert.equal(s.currency,'CAD');assert.equal(s.payment_status,'pending');assert.equal(await value('select commitment_months from journey_enrollment_activations where contact_id=$1',[contact]),12);
});
test('legal gate stores enrollment but blocks publication, mapping, preparation and delivery fail closed',async()=>{
 const s=await saveEnrollment();assert.equal(s.agreement_publication_status,'held');assert.equal(s.agreement_mapping_ready,false);assert.equal(s.agreement_count,0);
 const text='Held local contract for {{client_name}}',h=createHash('sha256').update(text).digest('hex');
 const draft=await value("insert into agreement_templates(agreement_key,name,version,content_text,content_hash,status,audience,document_type,merge_schema) values($1,'Held contract','local',$2,$3,'draft','client','client_contract','{\"required\":[\"client_name\"],\"optional\":[]}') returning id",['held-'+randomUUID(),text,h]);
 await assert.rejects(actor(owner,"update agreement_templates set status='published' where id=$1",[draft]),/publication is held/);
 await assert.rejects(actor(owner,"insert into program_agreement_requirements(program_code,agreement_template_id,required,active,billing_choice,currency) values($1,$2,true,true,'monthly','CAD')",[program,draft]),/publication is held/);
 await assert.rejects(actor(owner,'select public.prepare_client_contract($1,$2,$3,true)',[contact,draft,{client_name:'Local Adult'}]),/publication is held/);
 assert.equal(await value('select count(*)::int from notification_delivery_jobs'),0);
});
test('billing-specific agreement mapping cannot cross monthly and pay-in-full enrollments',async()=>{
 await q("update app_runtime_config set config_value='{\"status\":\"released\",\"reason\":\"local_test_only\"}' where config_key='production_client_agreement_publication'");
 await actor(owner,save,[contact,program,'one_time',96000,'CAD']);
 const text='Monthly-only local contract for {{client_name}}',h=createHash('sha256').update(text).digest('hex');
 const template=await value("insert into agreement_templates(agreement_key,name,version,content_text,content_hash,status,audience,document_type,merge_schema) values($1,'Monthly contract','local',$2,$3,'published','client','client_contract','{\"required\":[\"client_name\"],\"optional\":[]}') returning id",['monthly-'+randomUUID(),text,h]);
 await q("insert into program_agreement_requirements(program_code,agreement_template_id,required,active,billing_choice,currency) values($1,$2,true,true,'monthly','CAD')",[program,template]);
 const state=(await actor(owner,'select public.production_client_enrollment_state($1) s',[contact])).rows[0].s;assert.equal(state.agreement_mapping_ready,false);assert.equal(state.agreement_count,0);
 await assert.rejects(actor(owner,'select public.prepare_client_contract($1,$2,$3,false)',[contact,template,{client_name:'Local Adult'}]),/billing-specific/);
});
test('service-only agreement dispatch preserves contact scope, leases once, redacts private link after provider acceptance',async()=>{
 const {a}=await agreementFixture();const claim='select public.claim_production_agreement_delivery($1,$2) job';
 for(const role of ['anon','authenticated'])await assert.rejects(actor(owner,claim,[owner,a.id],role),/permission denied/);
 await assert.rejects(actor(null,claim,[member,a.id],'service_role'),/Owner\/Admin/);
 await q("update staff_access set contact_scope='assigned' where user_id=$1",[admin]);await assert.rejects(actor(null,claim,[admin,a.id],'service_role'),/scope/);
 const job=(await actor(null,claim,[owner,a.id],'service_role')).rows[0].job;assert.ok(job.body.includes('https://revitalizedacademy.com'));
 assert.equal((await actor(null,claim,[owner,a.id],'service_role')).rows[0].job,null);
 await actor(null,'select public.finish_production_agreement_delivery($1,$2,$3)',[owner,job.id,'local-message-id'],'service_role');
 const row=(await q('select * from notification_delivery_jobs where id=$1',[job.id])).rows[0];assert.equal(row.status,'sent');assert.equal(row.provider_message_id,'local-message-id');assert.ok(!row.body.includes('https://'));assert.equal(row.attempt_count,1);
});
test('recovery reservations are service-only, normalized, persistent, non-enumerating and minute/hour limited',async()=>{
 const call='select public.reserve_production_member_recovery($1) ok',email='Local-Recovery@example.invalid';
 for(const role of ['anon','authenticated'])await assert.rejects(actor(member,call,[email],role),/permission denied/);
 assert.equal((await actor(null,call,[email],'service_role')).rows[0].ok,true);
 assert.equal((await actor(null,call,[email.toLowerCase()],'service_role')).rows[0].ok,false);
 assert.equal(await value('select count(*)::int from private.production_member_recovery_limits'),1);
 for(let i=1;i<6;i++){await q("update private.production_member_recovery_limits set last_requested=now()-interval '2 minutes'");assert.equal((await actor(null,call,[email],'service_role')).rows[0].ok,true);}
 await q("update private.production_member_recovery_limits set last_requested=now()-interval '2 minutes'");assert.equal((await actor(null,call,[email],'service_role')).rows[0].ok,false);
 await assert.rejects(actor(null,'select * from private.production_member_recovery_limits',[],'service_role'),/permission denied/);
});
test('assigned Coach scope and private-health permission remain independent; member/anonymous admin mutation denied',async()=>{
 await q('update contacts set assigned_to=$2 where id=$1',[contact,coach]);const unseen=await value("insert into contacts(first_name,last_name,email) values('Other','Client',$1) returning id",['other-'+randomUUID()+'@example.invalid']);
 assert.equal((await actor(coach,'select public.staff_action_allowed($1,$2) ok',['health.private.view',contact])).rows[0].ok,true);
 assert.equal((await actor(coach,'select public.staff_action_allowed($1,$2) ok',['health.private.view',unseen])).rows[0].ok,false);
 await q("insert into staff_permission_overrides(user_id,permission_key,allowed,updated_by) values($1,'health.private.view',false,$1) on conflict(user_id,permission_key) do update set allowed=false",[coach]);
 assert.equal((await actor(coach,'select public.staff_action_allowed($1,$2) ok',['health.private.view',contact])).rows[0].ok,false);
 await assert.rejects(actor(member,save,[contact,program,'monthly',8900,'CAD']),/Authorized/);
});
test('exact approved six program defaults are inherited without granting paid access or enabling unfinished modules',async()=>{
 const keys=['biometrics','fitness_plans','habit_builder','nutrition_plans','platform_access','tracking'];
 assert.deepEqual((await q("select entitlement_key from program_entitlement_templates where program_code=$1 and active order by entitlement_key",[program])).rows.map(r=>r.entitlement_key),keys);
 await saveEnrollment();const id=await value('select membership_id from client_access where contact_id=$1',[contact]);
 assert.deepEqual((await q("select entitlement_key from membership_entitlements where membership_id=$1 and status='active' order by entitlement_key",[id])).rows.map(r=>r.entitlement_key),keys);
 assert.equal(await value('select private.full_member_access()'),false);
});
