const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const {Client}=require('pg');
const {randomUUID,randomBytes,createHash}=require('node:crypto');
const metadata=require('../../supabase/baselines/2026-09-26/metadata.json');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable local database required');
const db=new Client();let member,secondary,other,owner,contact,activation,agreement,membership;
const q=(s,p=[])=>db.query(s,p),one=async(s,p)=>(await q(s,p)).rows[0],val=async(s,p)=>Object.values(await one(s,p))[0];
const hash=s=>createHash('sha256').update(s).digest('hex');
async function act(uid,sql,args=[],role='authenticated'){
 await q('SAVEPOINT lifecycle_call');try{await q('SET LOCAL ROLE '+role);await q("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[uid||'',role]);const r=await q(sql,args);await q('RESET ROLE');await q("SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','',true)");await q('RELEASE SAVEPOINT lifecycle_call');return r;}
 catch(e){await q('ROLLBACK TO SAVEPOINT lifecycle_call');await q('RELEASE SAVEPOINT lifecycle_call');throw e;}
}
async function user(label){const id=randomUUID();await q('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())',[id,label+'-'+id+'@example.invalid']);return id;}
async function context(uid=member){return (await act(uid,'SELECT public.my_onboarding_context() AS data')).rows[0].data;}
async function sign(uid=member,role='primary_client',h=agreement.content_hash){return act(uid,'SELECT public.sign_client_agreement_atomic($1,$2,$3)',[agreement.id,JSON.stringify([{signer_role:role,signer_name:'Synthetic Adult'}]),h]);}
async function pay(amount=10000,type='payment',status='recorded'){return val("INSERT INTO public.payment_records(contact_id,activation_id,amount_cents,payment_method,recorded_by,transaction_type,status) VALUES($1,$2,$3,'cash',$4,$5,$6) RETURNING id",[contact,activation.id,amount,owner,type,status]);}
async function state(){return one('SELECT status,restriction_reason FROM public.client_access WHERE contact_id=$1',[contact]);}
async function full(){return (await act(member,'SELECT public.member_paid_access_allowed() ok')).rows[0].ok;}
async function invite(){const email=await val('SELECT email FROM auth.users WHERE id=$1',[secondary]);const id=(await act(member,'SELECT public.invite_secondary_signer($1,$2) id',[agreement.id,email])).rows[0].id;const job=await one('SELECT * FROM public.notification_delivery_jobs WHERE signer_invitation_id=$1',[id]);return {id,token:job.body.match(/#invite=([a-f0-9]{64})/)[1],job};}
async function redeem(token,uid=secondary){return act(uid,'SELECT public.redeem_secondary_signer_invitation($1)',[token]);}
async function two(){await q('UPDATE public.client_agreements SET required_client_signatures=2 WHERE id=$1',[agreement.id]);}
async function waived(gate,id=null,enabled=true,uid=owner){return act(uid,'SELECT public.set_enrollment_waiver($1,$2,$3,$4,$5)',[activation.id,id,gate,enabled,'Synthetic authorized reason']);}
async function active(){await pay();await sign();assert.equal((await state()).status,'active');assert.equal(await full(),true);}
before(async()=>{await db.connect();for(const p of metadata.permission_catalog){const keys=Object.keys(p);await q('INSERT INTO public.staff_permission_catalog('+keys.join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+') ON CONFLICT DO NOTHING',Object.values(p));}for(const [table,rows]of [['staff_role_permission_defaults',metadata.permission_defaults],['staff_role_permissions',metadata.legacy_permissions]])for(const r of rows)await q(`INSERT INTO public.${table}(role,permission_key,allowed) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[r.role,r.permission_key,r.allowed]);});
after(()=>db.end());
beforeEach(async()=>{
 await q('BEGIN');await q("UPDATE public.app_runtime_config SET active=true,config_value='{\"origin\":\"https://staging.example.invalid\"}' WHERE config_key='client_onboarding'");member=await user('primary');secondary=await user('secondary');other=await user('other');owner=await user('owner');await q("INSERT INTO public.staff_access(user_id,role) VALUES($1,'owner')",[owner]);contact=await val('SELECT contact_id FROM public.profiles WHERE user_id=$1',[member]);
 const program='lifecycle-'+randomUUID();await q("INSERT INTO public.program_catalog(program_code,name,program_type) VALUES($1,'Synthetic program','membership')",[program]);
 const journeyKey='lifecycle-'+randomUUID();await q("INSERT INTO public.journey_definitions(journey_key,name,audience) VALUES($1,'Synthetic','client')",[journeyKey]);
 const journey=await val('INSERT INTO public.contact_journeys(contact_id,journey_key) VALUES($1,$2) RETURNING id',[contact,journeyKey]);
 activation=await one("INSERT INTO public.journey_enrollment_activations(contact_id,journey_id,amount_cents,program_code,program_name,commitment_months,created_by) VALUES($1,$2,10000,$3,'Synthetic program',6,$4) RETURNING *",[contact,journey,program,owner]);
 membership=await val('SELECT id FROM public.client_memberships WHERE activation_id=$1',[activation.id]);
 const content='Synthetic immutable contract for test purposes only.',h=hash(content),key='synthetic-'+randomUUID();
 const template=await val("INSERT INTO public.agreement_templates(agreement_key,name,version,content_text,content_hash,status,audience,document_type) VALUES($1,'Synthetic agreement','1',$2,$3,'published','client','general') RETURNING id",[key,content,h]);
 agreement=await one("INSERT INTO public.client_agreements(contact_id,membership_id,activation_id,agreement_template_id,agreement_key,template_version,content_hash,rendered_content_text,rendered_content_hash,status) VALUES($1,$2,$3,$4,$5,'1',$6,$7,$6,'sent') RETURNING *",[contact,membership,activation.id,template,key,h,content]);
 const claimToken=randomBytes(32).toString('hex');await q('INSERT INTO public.journey_access_links(contact_id,journey_id,token_hash) VALUES($1,$2,$3)',[contact,activation.journey_id,hash(claimToken)]);await act(member,'SELECT public.claim_onboarding_enrollment($1)',[claimToken]);

});
afterEach(()=>q('ROLLBACK'));

test('new enrollment provisions restricted access in the existing membership/access tables',async()=>{assert.equal((await state()).status,'onboarding');assert.equal(await full(),false);const c=await context();assert.equal(c.enrollments[0].commitment_months,6);assert.equal(c.agreements[0].content_hash,agreement.content_hash);assert.equal(c.access_state,'onboarding');assert(!('household' in c));});
test('payment alone cannot activate',async()=>{await pay();assert.equal((await state()).status,'onboarding');assert.equal(await full(),false);});
test('agreement alone cannot activate',async()=>{await sign();assert.equal((await state()).status,'onboarding');assert.equal(await full(),false);});
test('both gates automatically activate without changing bootstrap v2',async()=>{await active();assert.equal((await act(member,'SELECT count(*)::int n FROM public.my_app_bootstrap_v2')).rows[0].n,1);});
test('payment waiver satisfies only payment and produces audit',async()=>{await waived('payment');assert.equal((await state()).status,'onboarding');assert.equal((await context()).enrollments[0].payment_satisfied,true);await sign();assert.equal(await full(),true);assert.equal(await val("SELECT count(*)::int FROM public.manual_override_audit WHERE action='lifecycle_waiver_recorded'"),1);});
test('individual agreement waiver satisfies only that agreement',async()=>{await waived('agreement',agreement.id);assert.equal(await full(),false);await pay();assert.equal(await full(),true);});
test('ordinary client and inactive owner cannot waive either gate',async()=>{await assert.rejects(waived('payment',null,true,member),/authorized owner/);await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1",[owner]);await assert.rejects(waived('agreement',agreement.id),/authorized owner/);});
test('direct authenticated waiver bypass is rejected',async()=>{await assert.rejects(act(owner,"UPDATE public.journey_enrollment_activations SET payment_status='waived' WHERE id=$1",[activation.id]),/recorded payment waiver/);await assert.rejects(act(owner,"UPDATE public.client_agreements SET status='waived' WHERE id=$1",[agreement.id]),/recorded agreement waiver/);});
test('one account cannot send two signatures or occupy the secondary slot',async()=>{await two();await assert.rejects(act(member,'SELECT public.sign_client_agreement_atomic($1,$2,$3)',[agreement.id,JSON.stringify([{signer_role:'primary_client',signer_name:'One'},{signer_role:'secondary_client',signer_name:'Two'}]),agreement.content_hash]),/one authenticated adult/);await assert.rejects(sign(member,'secondary_client'),/signer role/);});
test('two distinct authenticated adults complete the required contract',async()=>{await two();await pay();await sign();assert.equal(await full(),false);const i=await invite();await redeem(i.token);await sign(secondary,'secondary_client');assert.equal(await full(),true);assert.equal(await val('SELECT count(DISTINCT signed_by_user_id)::int FROM public.agreement_acceptances WHERE client_agreement_id=$1',[agreement.id]),2);assert.equal(await val('SELECT status FROM public.client_agreements WHERE id=$1',[agreement.id]),'signed');});
test('invitation is hashed, exact-content bound and queued in the existing outbox',async()=>{await two();const i=await invite();const row=await one('SELECT * FROM private.agreement_signer_invitations WHERE id=$1',[i.id]);assert.equal(row.token_hash,hash(i.token));assert(!JSON.stringify(row).includes(i.token));assert.equal(row.content_hash,agreement.content_hash);assert.equal(row.activation_id,activation.id);assert.equal(i.job.provider,'resend');assert.equal((await act(owner,'SELECT count(*)::int n FROM public.notification_delivery_jobs WHERE id=$1',[i.job.id])).rows[0].n,0);});
test('primary identity cannot invite itself',async()=>{await two();const email=await val('SELECT email FROM auth.users WHERE id=$1',[member]);await assert.rejects(act(member,'SELECT public.invite_secondary_signer($1,$2)',[agreement.id,email]),/different adult/);});
for(const failure of ['wrong-recipient','unverified-email','expired','revoked','changed-content'])test(failure+' invitation fails safely',async()=>{
 await two();const i=await invite();if(failure==='unverified-email')await q('UPDATE auth.users SET email_confirmed_at=null WHERE id=$1',[secondary]);if(failure==='expired')await q("UPDATE private.agreement_signer_invitations SET expires_at=now()-interval '1 second' WHERE id=$1",[i.id]);if(failure==='revoked')await act(member,'SELECT public.revoke_secondary_signer_invitation($1)',[i.id]);if(failure==='changed-content')await q("UPDATE public.client_agreements SET rendered_content_hash='changed' WHERE id=$1",[agreement.id]);await assert.rejects(redeem(i.token,failure==='wrong-recipient'?other:secondary),/unavailable|changed/);assert.equal(await val('SELECT count(*)::int FROM public.agreement_acceptances WHERE client_agreement_id=$1',[agreement.id]),0);
});
test('redeeming twice is idempotent and a different account cannot replay',async()=>{await two();const i=await invite();await redeem(i.token);await redeem(i.token);await assert.rejects(redeem(i.token,other),/unavailable/);assert.equal(await val("SELECT count(*)::int FROM public.contact_activity WHERE activity_type='secondary_invitation_redeemed'"),1);});
test('repeated signature does not overwrite the acceptance or add signatures',async()=>{await sign();const before=await one('SELECT * FROM public.agreement_acceptances WHERE client_agreement_id=$1',[agreement.id]);await sign();assert.deepEqual(await one('SELECT * FROM public.agreement_acceptances WHERE client_agreement_id=$1',[agreement.id]),before);});
test('secondary signer cannot overwrite primary or sign a stale hash',async()=>{await two();const i=await invite();await redeem(i.token);await assert.rejects(sign(secondary,'primary_client'),/role/);await assert.rejects(sign(secondary,'secondary_client','stale'),/content changed/);});
test('signed rendered content and identity remain immutable',async()=>{await sign();await assert.rejects(act(owner,"UPDATE public.client_agreements SET rendered_content_text='changed' WHERE id=$1",[agreement.id]),/immutable/);});
test('co-signer sees only invited agreement and no enrollment, household or primary health data',async()=>{await two();const i=await invite();await redeem(i.token);const c=await context(secondary);assert.equal(c.agreements.length,1);assert.equal(c.enrollments.length,0);assert.equal(c.full_access,false);for(const table of ['client_agreements','agreement_acceptances','household_members','client_goals','health_observations','client_memberships'])assert.equal((await act(secondary,`SELECT count(*)::int n FROM public.${table}`)).rows[0].n,0,table);});
test('known minor cannot redeem an adult invitation',async()=>{await two();const secondContact=await val('SELECT contact_id FROM public.profiles WHERE user_id=$1',[secondary]),household=await val('SELECT household_id FROM public.client_access WHERE contact_id=$1',[contact]);await q("UPDATE public.households SET household_type='family' WHERE id=$1",[household]);await q("INSERT INTO public.household_members(household_id,contact_id,relationship_type,sex,date_of_birth) VALUES($1,$2,'child','male',current_date-interval '10 years')",[household,secondContact]);const i=await invite();await assert.rejects(redeem(i.token),/adult signer/);});
test('partial refund above required threshold retains full access',async()=>{await pay(15000);await sign();await pay(3000,'refund');assert.equal(await full(),true);assert.equal((await state()).status,'active');});
for(const kind of ['refund','reversal'])test(kind+' below required amount suspends active access and preserves account and goals',async()=>{await active();await q("INSERT INTO public.client_goals(contact_id,title) VALUES($1,'Preserved synthetic progress')",[contact]);await pay(1,kind);assert.equal((await state()).status,'payment_suspended');assert.equal(await full(),false);assert.equal(await val('SELECT count(*)::int FROM public.client_goals WHERE contact_id=$1',[contact]),1);assert.equal(await val('SELECT count(*)::int FROM auth.users WHERE id=$1',[member]),1);const c=await context();assert.equal(c.agreements.length,1);assert.equal(c.enrollments.length,1);assert(c.notifications.some(n=>n.title==='Payment resolution needed'));assert.equal((await act(member,'SELECT count(*)::int n FROM public.client_goals')).rows[0].n,0);});
test('repayment restores only when independent agreement gate remains satisfied',async()=>{await active();await pay(100,'refund');await pay(100);assert.equal(await full(),true);assert((await context()).notifications.some(n=>n.title==='Your member access is ready'));});
test('onboarding account retains privacy center and privacy-request access without paid benefits',async()=>{
 assert.equal((await state()).status,'onboarding');
 assert.equal(await full(),false);
 const privacy=(await act(member,'SELECT * FROM public.my_privacy_center')).rows;
 assert.equal(privacy.length,1);
 assert.equal(privacy[0].contact_id,contact);
 const requestId=(await act(member,"SELECT public.submit_my_privacy_request('data_export','{}'::jsonb,'Synthetic onboarding privacy request') id")).rows[0].id;
 assert.equal(await val('SELECT count(*)::int FROM public.member_privacy_requests WHERE id=$1 AND contact_id=$2',[requestId,contact]),1);
});

test('payment-suspended account retains privacy center and request access while paid access stays denied',async()=>{
 await active();
 await pay(1,'refund');
 assert.equal((await state()).status,'payment_suspended');
 assert.equal(await full(),false);
 const privacy=(await act(member,'SELECT * FROM public.my_privacy_center')).rows;
 assert.equal(privacy.length,1);
 const requestId=(await act(member,"SELECT public.submit_my_privacy_request('correction','{}'::jsonb,'Synthetic suspended privacy request') id")).rows[0].id;
 assert.equal(await val('SELECT count(*)::int FROM public.member_privacy_requests WHERE id=$1',[requestId]),1);
 assert.equal((await act(member,'SELECT count(*)::int n FROM public.client_goals')).rows[0].n,0);
});

test('manually inactive account cannot open privacy center or submit a new privacy request',async()=>{
 await q("UPDATE public.client_access SET status='inactive' WHERE contact_id=$1",[contact]);
 assert.equal(await full(),false);
 assert.equal((await act(member,'SELECT count(*)::int n FROM public.my_privacy_center')).rows[0].n,0);
 await assert.rejects(
   act(member,"SELECT public.submit_my_privacy_request('other','{}'::jsonb,'Synthetic inactive request')"),
   /Eligible account access is required/
 );
});

test('payment-suspended account can read its ready privacy export metadata but not paid data',async()=>{
 await active();
 await pay(1,'refund');
 const requestId=await val("INSERT INTO public.member_privacy_requests(user_id,contact_id,request_type,status) VALUES($1,$2,'data_export','submitted') RETURNING id",[member,contact]);
 await q("INSERT INTO public.member_privacy_exports(privacy_request_id,user_id,contact_id,status,storage_path,ready_at,expires_at) VALUES($1,$2,$3,'ready',$4,now(),now()+interval '1 hour')",[requestId,member,contact,contact+'/synthetic-export.zip']);
 const rows=(await act(member,'SELECT export_id,status,available_storage_path FROM public.my_privacy_exports')).rows;
 assert.equal(rows.length,1);
 assert.equal(rows[0].status,'ready');
 assert.equal(rows[0].available_storage_path,contact+'/synthetic-export.zip');
 assert.equal((await act(member,'SELECT count(*)::int n FROM public.client_goals')).rows[0].n,0);
});

test('manually inactive account cannot read privacy export metadata through the restricted view',async()=>{
 const requestId=await val("INSERT INTO public.member_privacy_requests(user_id,contact_id,request_type,status) VALUES($1,$2,'data_export','submitted') RETURNING id",[member,contact]);
 await q("INSERT INTO public.member_privacy_exports(privacy_request_id,user_id,contact_id,status,storage_path,ready_at,expires_at) VALUES($1,$2,$3,'ready',$4,now(),now()+interval '1 hour')",[requestId,member,contact,contact+'/inactive-export.zip']);
 await q("UPDATE public.client_access SET status='inactive' WHERE contact_id=$1",[contact]);
 assert.equal((await act(member,'SELECT count(*)::int n FROM public.my_privacy_exports')).rows[0].n,0);
});

test('privacy lifecycle migration keeps Storage globally gated with only owner ready-export exception',async()=>{
 const definition=await val("SELECT qual FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='lifecycle_storage'");
 assert.match(definition,/privacy-exports/);
 assert.match(definition,/member_privacy_exports/);
 assert.match(definition,/payment_suspended/);
 assert.match(definition,/full_member_access/);
});


test('repayment cannot bypass a newly required unsigned agreement',async()=>{await active();await pay(100,'refund');const template=await val("INSERT INTO public.agreement_templates(agreement_key,name,version,content_text,content_hash,status,audience,document_type) VALUES('extra-'||gen_random_uuid(),'Extra','1','Synthetic','hash','published','client','general') RETURNING id");await q("INSERT INTO public.client_agreements(contact_id,activation_id,agreement_template_id,agreement_key,template_version,content_hash,status) VALUES($1,$2,$3,'extra','1','hash','sent')",[contact,activation.id,template]);await pay(100);assert.equal(await full(),false);assert.equal((await state()).status,'onboarding');});
test('recorded payment waiver prevents refund suspension; removing it reconciles again',async()=>{await active();await waived('payment');await pay(10000,'refund');assert.equal(await full(),true);await waived('payment',null,false);assert.equal(await full(),false);assert.equal((await state()).status,'payment_suspended');});
test('voided refund has no effect; reversing a recorded payment restricts access',async()=>{await active();await pay(10000,'refund','voided');assert.equal(await full(),true);await q("UPDATE public.payment_records SET status='reversed' WHERE activation_id=$1 AND transaction_type='payment'",[activation.id]);assert.equal((await state()).status,'payment_suspended');});
test('repayment never resurrects manually inactive access',async()=>{await active();await q("UPDATE public.client_access SET status='inactive' WHERE contact_id=$1",[contact]);await pay(100,'refund');await pay(100);assert.equal((await state()).status,'inactive');assert.equal(await full(),false);});
test('restricted account cannot relink its profile or promote client access',async()=>{await assert.rejects(act(member,'UPDATE public.profiles SET contact_id=$1 WHERE user_id=$2',[contact,secondary]),/permission denied/);assert.equal((await act(member,"UPDATE public.client_access SET status='active' WHERE contact_id=$1 RETURNING *",[contact])).rowCount,0);});
test('restricted direct RLS scans return no paid-domain rows, including catalog/resource tables',async()=>{const tables=(await q("SELECT tablename FROM pg_policies WHERE schemaname='public' AND policyname='lifecycle_paid_access' ORDER BY tablename")).rows;assert(tables.length>140);for(const {tablename}of tables){try{assert.equal((await act(member,'SELECT count(*)::int n FROM public."'+tablename+'"')).rows[0].n,0,tablename);}catch(e){if(!/permission denied/.test(e.message))throw e;}}});
test('active member can read owned goals; restricted member paid RPCs fail',async()=>{await q("INSERT INTO public.client_goals(contact_id,title) VALUES($1,'Synthetic goal')",[contact]);await active();assert.equal((await act(member,'SELECT count(*)::int n FROM public.client_goals')).rows[0].n,1);await pay(1,'refund');await assert.rejects(act(member,"SELECT public.create_my_goal('Bypass',null,null,null,null,3)"),/active|permission|row.level/i);await assert.rejects(act(member,"SELECT private.submit_member_companion_question($1,'other','Synthetic question')",[member]),/Active member access/);await assert.rejects(act(member,"SELECT private.create_member_coaching_request($1,'[]',null)",[other]),/Active member access/);});
test('anonymous protected lifecycle RPCs are denied',async()=>{for(const sql of ["SELECT public.my_onboarding_context()","SELECT public.redeem_secondary_signer_invitation('invalid')","SELECT public.invite_secondary_signer(null,'x@example.invalid')","SELECT public.claim_onboarding_enrollment('invalid')","SELECT public.set_enrollment_waiver(null,null,'payment',true,'reason')"])await assert.rejects(act(null,sql,[],'anon'),/permission denied/);});
test('verified primary can claim its enrollment link; another identity cannot',async()=>{const token=randomBytes(32).toString('hex');await q('INSERT INTO public.journey_access_links(contact_id,journey_id,token_hash) VALUES($1,$2,$3)',[contact,activation.journey_id,hash(token)]);await assert.rejects(act(other,'SELECT public.claim_onboarding_enrollment($1)',[token]),/unavailable/);await act(member,'SELECT public.claim_onboarding_enrollment($1)',[token]);assert.equal((await state()).status,'onboarding');assert.equal(await full(),false);});

test('refund preserves stored health and coaching history but RLS denies both',async()=>{await active();await q("INSERT INTO public.health_integration_providers(provider_key,name,provider_type,connection_mode) VALUES('synthetic-history','Synthetic','manual_import','manual')");await q("INSERT INTO public.health_observations(contact_id,provider_key,metric_key,observed_at,value_numeric) VALUES($1,'synthetic-history','synthetic',now(),123)",[contact]);await q("INSERT INTO public.coaching_sessions(contact_id,coach_user_id,status) VALUES($1,$2,'completed')",[contact,owner]);await pay(1,'refund');for(const table of ['health_observations','coaching_sessions']){assert.equal(await val(`SELECT count(*)::int FROM public.${table} WHERE contact_id=$1`,[contact]),1);assert.equal((await act(member,`SELECT count(*)::int n FROM public.${table}`)).rows[0].n,0);}});

test('active member can disconnect only their own health provider and revoke its consents',async()=>{
 await active();
 const provider='disconnect-'+randomUUID();
 await q("INSERT INTO public.health_integration_providers(provider_key,name,provider_type,connection_mode) VALUES($1,'Synthetic Disconnect','manual_import','manual')",[provider]);
 await q("INSERT INTO public.health_integration_connections(contact_id,membership_id,user_id,provider_key,status,credential_reference,granted_scopes) VALUES($1,$2,$3,$4,'connected','secret-ref','[\"steps\"]'::jsonb)",[contact,membership,member,provider]);
 const metric='disconnect-metric-'+randomUUID();
 await q("INSERT INTO public.health_metric_catalog(metric_key,label,category,sensitive,active) VALUES($1,'Synthetic Disconnect Metric','synthetic',true,true)",[metric]);
 await q("INSERT INTO public.health_metric_consents(user_id,contact_id,provider_key,metric_key,allowed,consented_at) VALUES($1,$2,$3,$4,true,now())",[member,contact,provider,metric]);
 await act(member,'SELECT public.disconnect_my_health_provider($1,true)',[provider]);
 const connection=await one('SELECT status,credential_reference,granted_scopes FROM public.health_integration_connections WHERE contact_id=$1 AND provider_key=$2',[contact,provider]);
 assert.equal(connection.status,'disconnected');
 assert.equal(connection.credential_reference,null);
 assert.deepEqual(connection.granted_scopes,[]);
 const consent=await one('SELECT allowed,revoked_at FROM public.health_metric_consents WHERE user_id=$1 AND provider_key=$2',[member,provider]);
 assert.equal(consent.allowed,false);
 assert(consent.revoked_at);
});

test('payment-suspended account cannot use full-member provider disconnect',async()=>{
 await active();
 const provider='disconnect-suspended-'+randomUUID();
 await q("INSERT INTO public.health_integration_providers(provider_key,name,provider_type,connection_mode) VALUES($1,'Synthetic Disconnect','manual_import','manual')",[provider]);
 await q("INSERT INTO public.health_integration_connections(contact_id,membership_id,user_id,provider_key,status) VALUES($1,$2,$3,$4,'connected')",[contact,membership,member,provider]);
 await pay(1,'refund');
 await assert.rejects(act(member,'SELECT public.disconnect_my_health_provider($1,true)',[provider]),/Full member access is required/);
 assert.equal(await val('SELECT status FROM public.health_integration_connections WHERE contact_id=$1 AND provider_key=$2',[contact,provider]),'connected');
});

test('unrelated identity cannot disconnect another members provider',async()=>{
 await active();
 const provider='disconnect-other-'+randomUUID();
 await q("INSERT INTO public.health_integration_providers(provider_key,name,provider_type,connection_mode) VALUES($1,'Synthetic Disconnect','manual_import','manual')",[provider]);
 await q("INSERT INTO public.health_integration_connections(contact_id,membership_id,user_id,provider_key,status) VALUES($1,$2,$3,$4,'connected')",[contact,membership,member,provider]);
 await assert.rejects(act(other,'SELECT public.disconnect_my_health_provider($1,true)',[provider]),/Full member access is required/);
 assert.equal(await val('SELECT status FROM public.health_integration_connections WHERE contact_id=$1 AND provider_key=$2',[contact,provider]),'connected');
});

test('existing individual agreement waiver API delegates to the audited lifecycle',async()=>{await act(owner,'SELECT public.waive_client_agreement($1,$2)',[agreement.id,'Synthetic valid reason']);assert.equal(await val('SELECT status FROM public.client_agreements WHERE id=$1',[agreement.id]),'waived');assert.equal(await val("SELECT count(*)::int FROM public.manual_override_audit WHERE action='lifecycle_waiver_recorded'"),1);});
test('revocation after redemption prevents a new secondary signature',async()=>{await two();const i=await invite();await redeem(i.token);await act(member,'SELECT public.revoke_secondary_signer_invitation($1)',[i.id]);await assert.rejects(sign(secondary,'secondary_client'),/not found/);});
test('cross-enrollment or wrong-currency payment records are rejected',async()=>{await assert.rejects(act(null,"INSERT INTO public.payment_records(contact_id,activation_id,amount_cents,payment_method,recorded_by,currency) VALUES($1,$2,10000,'cash',$3,'CAD')",[contact,activation.id,owner],'service_role'),/currency mismatch/);});
test('new public lifecycle RPCs are invoker and invitation table cannot be queried by clients',async()=>{assert.equal(await val("SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND p.proname IN ('my_onboarding_context','set_enrollment_waiver','invite_secondary_signer','redeem_secondary_signer_invitation','claim_onboarding_enrollment','member_paid_access_allowed')"),0);await assert.rejects(act(member,'SELECT * FROM private.agreement_signer_invitations'),/permission denied/);});
test('invitation cannot silently use production when staging origin is missing',async()=>{await two();await q("UPDATE public.app_runtime_config SET active=false WHERE config_key='client_onboarding'");await assert.rejects(invite(),/approved HTTPS onboarding origin/);assert.equal(await val('SELECT count(*)::int FROM private.agreement_signer_invitations'),0);});
test('a co-signer with their own full membership still cannot read the primary adult health data',async()=>{
 await two();const i=await invite();await redeem(i.token);
 const secondContact=await val('SELECT contact_id FROM public.profiles WHERE user_id=$1',[secondary]);
 const journey=await val('INSERT INTO public.contact_journeys(contact_id,journey_key) SELECT $1,journey_key FROM public.contact_journeys WHERE id=$2 RETURNING id',[secondContact,activation.journey_id]);
 await q("INSERT INTO public.journey_enrollment_activations(contact_id,journey_id,amount_cents,program_code,payment_status,agreement_status) VALUES($1,$2,10000,$3,'waived','waived')",[secondContact,journey,activation.program_code]);
 const ownToken=randomBytes(32).toString('hex');await q('INSERT INTO public.journey_access_links(contact_id,journey_id,token_hash) VALUES($1,$2,$3)',[secondContact,journey,hash(ownToken)]);await act(secondary,'SELECT public.claim_onboarding_enrollment($1)',[ownToken]);
 assert.equal((await act(secondary,'SELECT public.member_paid_access_allowed() ok')).rows[0].ok,true);
 await q("INSERT INTO public.health_integration_providers(provider_key,name,provider_type,connection_mode) VALUES('synthetic-private','Synthetic','manual_import','manual')");
 await q("INSERT INTO public.health_observations(contact_id,provider_key,metric_key,observed_at,value_numeric) VALUES($1,'synthetic-private','synthetic',now(),1),($2,'synthetic-private','synthetic',now(),2)",[contact,secondContact]);
 const rows=(await act(secondary,'SELECT contact_id FROM public.health_observations')).rows;assert(rows.every(r=>r.contact_id!==contact));
 assert.equal((await context(secondary)).agreements.filter(a=>a.client_agreement_id===agreement.id).length,1);
});
test('email-based profile linkage alone grants no enrollment/signing or paid data',async()=>{
 await q('UPDATE public.client_access SET needs_onboarding_claim=true WHERE contact_id=$1',[contact]);
 const c=await context();assert.equal(c.access_state,'invitation_required');assert.equal(c.enrollments.length,0);assert.equal(c.agreements.length,0);
 assert.equal((await act(member,'SELECT count(*)::int n FROM public.client_agreements')).rows[0].n,0);
 await assert.rejects(sign(),/not found/);assert.equal(await full(),false);
});
// Last test commits only synthetic fixtures inside the disposable test database,
// allowing two real connections to exercise contention rather than mocking locks.
test('concurrent refunds serialize net reconciliation and leave access suspended',async()=>{
 await active();await q('COMMIT');const c1=new Client(),c2=new Client();await c1.connect();await c2.connect();
 try{
  await c1.query('BEGIN');await c2.query('BEGIN');
  const sql="INSERT INTO public.payment_records(contact_id,activation_id,amount_cents,payment_method,recorded_by,transaction_type) VALUES($1,$2,1,'cash',$3,'refund')";
  await c1.query(sql,[contact,activation.id,owner]);
  const pending=c2.query(sql,[contact,activation.id,owner]);
  await c1.query('COMMIT');await pending;await c2.query('COMMIT');
  assert.equal((await state()).status,'payment_suspended');
  assert.equal(await val("SELECT sum(amount_cents)::int FROM public.payment_records WHERE activation_id=$1 AND transaction_type='refund'",[activation.id]),2);
 }finally{await c1.query('ROLLBACK');await c2.query('ROLLBACK');await c1.end();await c2.end();await q('BEGIN');}
});
