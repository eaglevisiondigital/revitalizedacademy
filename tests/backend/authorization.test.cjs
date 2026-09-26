const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const {Client}=require('pg');
const {randomUUID,createHash}=require('node:crypto');
const metadata=require('../../supabase/baselines/2026-09-26/metadata.json');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Run npm run test:backend; isolated database required');
const db=new Client();let owner,admin,scoped,member,other,contact,otherContact;
const q=(sql,args=[])=>db.query(sql,args);
const scalar=async(sql,args)=>Object.values((await q(sql,args)).rows[0])[0];
const hash=s=>createHash('sha256').update(s).digest('hex');
async function actor(uid,sql,args=[],role='authenticated'){
 await q('SAVEPOINT actor_call');
 try{await q('SET LOCAL ROLE '+role);await q("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[uid||'',role]);const r=await q(sql,args);await q('ROLLBACK TO SAVEPOINT actor_call');await q('RELEASE SAVEPOINT actor_call');return r;}
 catch(e){await q('ROLLBACK TO SAVEPOINT actor_call');await q('RELEASE SAVEPOINT actor_call');throw e;}
}
// Actor mutations must persist in the outer test transaction; reset identity, not data.
async function act(uid,sql,args=[],role='authenticated'){
 await q('SAVEPOINT actor_write');
 try{await q('SET LOCAL ROLE '+role);await q("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[uid||'',role]);const r=await q(sql,args);await q('RESET ROLE');await q("SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','',true)");await q('RELEASE SAVEPOINT actor_write');return r;}
 catch(e){await q('ROLLBACK TO SAVEPOINT actor_write');await q('RELEASE SAVEPOINT actor_write');throw e;}
}
async function user(name){const id=randomUUID();await q("INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)",[id,name+'@example.invalid',JSON.stringify({first_name:name})]);return id;}
async function staff(name,role='admin',scope='all'){const id=await user(name);await q("INSERT INTO public.staff_access(user_id,role,display_name,contact_scope) VALUES($1,$2,$3,$4)",[id,role,name,scope]);return id;}
async function override(uid,key,allowed=true){await q("INSERT INTO public.staff_permission_overrides(user_id,permission_key,allowed,updated_by) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,permission_key) DO UPDATE SET allowed=excluded.allowed",[uid,key,allowed,owner]);}
async function template(audience='client',key='synthetic-contract'){
 const text='Synthetic fixture only. I agree to this test document.';return (await q("INSERT INTO public.agreement_templates(agreement_key,name,version,content_text,content_hash,status,audience,document_type) VALUES($1,'Synthetic only','1',$2,$3,'published',$4,$5) RETURNING *",[key,text,hash(text),audience,audience==='staff'?'coach_nda':'general'])).rows[0];
}
async function activation(){await q("INSERT INTO public.journey_definitions(journey_key,name,audience) VALUES('synthetic','Synthetic','client') ON CONFLICT DO NOTHING");const journey=await scalar("INSERT INTO public.contact_journeys(contact_id,journey_key) VALUES($1,'synthetic') RETURNING id",[contact]);return (await q("INSERT INTO public.journey_enrollment_activations(contact_id,journey_id,amount_cents,program_code,program_name) VALUES($1,$2,10000,'synthetic','Synthetic') RETURNING *",[contact,journey])).rows[0];}
async function agreement(a,required=1){const t=await template();return (await q("INSERT INTO public.client_agreements(contact_id,activation_id,agreement_template_id,agreement_key,template_version,content_hash,rendered_content_text,rendered_content_hash,status,required_client_signatures) VALUES($1,$2,$3,$4,'1',$5,$6,$5,'sent',$7) RETURNING *",[contact,a.id,t.id,t.agreement_key,t.content_hash,t.content_text,required])).rows[0];}
async function payment(a,amount){await q("INSERT INTO public.payment_records(contact_id,activation_id,amount_cents,payment_method,recorded_by) VALUES($1,$2,$3,'cash',$4)",[contact,a.id,amount,owner]);}
const ready=async a=>scalar('SELECT private.enrollment_gates_complete(a) FROM public.journey_enrollment_activations a WHERE id=$1',[a.id]);
const sign=async(a,signatures=[{signer_role:'primary_client',signer_name:'Synthetic Member'}],h=a.content_hash,uid=member)=>act(uid,'SELECT public.sign_client_agreement_atomic($1,$2,$3)',[a.id,JSON.stringify(signatures),h]);
before(async()=>{await db.connect();
 for(const p of metadata.permission_catalog){const keys=Object.keys(p);await q('INSERT INTO public.staff_permission_catalog('+keys.join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+')',Object.values(p));}
 for(const [table,rows] of [['staff_role_permission_defaults',metadata.permission_defaults],['staff_role_permissions',metadata.legacy_permissions]])for(const r of rows)await q(`INSERT INTO public.${table}(role,permission_key,allowed) VALUES($1,$2,$3)`,[r.role,r.permission_key,r.allowed]);
});
after(()=>db.end());
beforeEach(async()=>{await q('BEGIN');owner=await staff('owner','owner');admin=await staff('admin');scoped=await staff('scoped','admin','assigned');member=await user('member');other=await user('other');contact=await scalar('SELECT contact_id FROM public.profiles WHERE user_id=$1',[member]);otherContact=await scalar('SELECT contact_id FROM public.profiles WHERE user_id=$1',[other]);await q('UPDATE public.contacts SET assigned_to=$1 WHERE id=$2',[scoped,contact]);await q("INSERT INTO public.client_access(contact_id,user_id,status) VALUES($1,$2,'active'),($3,$4,'active')",[contact,member,otherContact,other]);});
afterEach(()=>q('ROLLBACK'));
for(const roleName of ['owner','admin'])test(roleName+' retains active permissions and financial override limits',async()=>{
 const uid=roleName==='owner'?owner:admin;const r=await actor(uid,"SELECT public.staff_action_allowed('companion.manage',$1) companion,public.staff_action_allowed('finance.record_payment',$1) finance",[contact]);assert.deepEqual(r.rows[0],{companion:true,finance:true});
});
for(const status of ['inactive','suspended','removed'])test(status+' staff overrides cannot retain permission, contact scope, or manual finance access',async()=>{
 await override(scoped,'companion.manage');await override(scoped,'finance.manage');
 if(status==='removed')await q('DELETE FROM public.staff_access WHERE user_id=$1',[scoped]);else await q('UPDATE public.staff_access SET status=$1 WHERE user_id=$2',[status,scoped]);
 const r=await actor(scoped,"SELECT public.staff_action_allowed('companion.manage',$1) companion,public.staff_action_allowed('finance.record_payment',$1) finance,private.staff_can_access_contact(auth.uid(),$1) scope",[contact]);assert.deepEqual(r.rows[0],{companion:false,finance:false,scope:false});
});
test('explicit permission denial wins over active owner default',async()=>{await override(owner,'companion.manage',false);assert.equal((await actor(owner,"SELECT public.staff_action_allowed('companion.manage',$1) allowed",[contact])).rows[0].allowed,false);});
test('assigned staff companion access allows own contact and denies cross-contact',async()=>{assert.equal((await actor(scoped,"SELECT public.staff_action_allowed('companion.manage',$1) ok",[contact])).rows[0].ok,true);assert.equal((await actor(scoped,"SELECT public.staff_action_allowed('companion.manage',$1) ok",[otherContact])).rows[0].ok,false);});
test('member never obtains privileged staff action',async()=>{assert.equal((await actor(member,"SELECT public.staff_action_allowed('companion.manage',$1) ok",[contact])).rows[0].ok,false);});
for(const who of ['owner','admin','scoped'])test(who+' permitted export returns ordinary columns, scoped rows and durable matching audit',async()=>{
 const uid={owner,admin,scoped}[who];if(who!=='owner')await override(uid,'people.export');
 const rows=(await act(uid,"SELECT public.export_people('{}') AS rows")).rows[0].rows;
 assert(rows.length>0);if(who==='scoped')assert.deepEqual(rows.map(r=>r.email),['member@example.invalid']);
 const keys=['first_name','last_name','email','phone','lifecycle_stage','vitality_status','enrollment_status','assigned_name','first_source','created_at','enrolled_at','last_activity_at','next_follow_up_at'].sort();rows.forEach(r=>assert.deepEqual(Object.keys(r).sort(),keys));
 const audit=(await q("SELECT * FROM public.staff_access_audit WHERE actor_user_id=$1 AND action='people_csv_exported'",[uid])).rows;assert.equal(audit.length,1);assert.equal(audit[0].new_value.row_count,rows.length);
});
for(const action of ['export','log'])test('staff without people.export cannot '+action+' or create authorized export audit',async()=>{await assert.rejects(act(admin,action==='export'?"SELECT public.export_people('{}')":"SELECT public.log_people_export(1,'{}')"),/permission required/i);assert.equal(await scalar("SELECT count(*)::int FROM public.staff_access_audit WHERE action='people_csv_exported'"),0);});
test('legacy audit RPC succeeds for permitted actual scoped count and rejects forged count',async()=>{await override(scoped,'people.export');await act(scoped,"SELECT public.log_people_export(1,'{}')");await assert.rejects(act(scoped,"SELECT public.log_people_export(999,'{}')"),/row count changed/i);assert.equal(await scalar("SELECT count(*)::int FROM public.staff_access_audit WHERE action='people_csv_exported'"),1);});
test('export filters and denial produce no inaccessible contacts',async()=>{await override(scoped,'people.export');assert.deepEqual((await act(scoped,'SELECT public.export_people($1) rows',[JSON.stringify({search:'other@example.invalid'})])).rows[0].rows,[]);});
test('audit insert failure rolls back the entire export',async()=>{await q("CREATE FUNCTION public.test_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic audit unavailable'; END $$");await q('CREATE TRIGGER synthetic_audit_failure BEFORE INSERT ON public.staff_access_audit FOR EACH ROW EXECUTE FUNCTION public.test_audit_failure()');await assert.rejects(act(owner,"SELECT public.export_people('{}')"),/synthetic audit unavailable/);});
test('anonymous cannot call signing/export/authorization RPCs',async()=>{for(const sql of ["SELECT public.export_people('{}')","SELECT public.staff_action_allowed('companion.manage',null)","SELECT public.sign_my_staff_agreement(null,'Tester','typed',null,'hash')"])await assert.rejects(actor(null,sql,[],'anon'),/permission denied/);});
test('inactive owner cannot directly update enrollment through RLS',async()=>{const a=await activation();await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1",[owner]);assert.equal((await act(owner,"UPDATE public.journey_enrollment_activations SET payment_status='waived' WHERE id=$1 RETURNING id",[a.id])).rowCount,0);});
test('payment shortfall blocks even if status was manually marked paid',async()=>{const a=await activation();await payment(a,100);await q("UPDATE public.journey_enrollment_activations SET payment_status='paid',agreement_status='waived' WHERE id=$1",[a.id]);assert.equal(await ready(a),false);const row=(await actor(owner,'SELECT ready_for_access,blockers FROM public.admin_enrollment_readiness WHERE activation_id=$1',[a.id])).rows[0];assert.equal(row.ready_for_access,false);assert(row.blockers.includes('payment_amount_short'));await assert.rejects(act(owner,"UPDATE public.journey_enrollment_activations SET access_status='active' WHERE id=$1",[a.id]),/Payment and required agreements/);});
test('payment completion alone does not waive the independent agreement gate',async()=>{const a=await activation();await payment(a,10000);assert.equal(await ready(a),false);});
test('complete payment plus explicit agreement waiver permits activation',async()=>{const a=await activation();await payment(a,10000);await q("UPDATE public.journey_enrollment_activations SET agreement_status='waived' WHERE id=$1",[a.id]);assert.equal(await ready(a),true);await act(owner,"UPDATE public.journey_enrollment_activations SET access_status='active' WHERE id=$1",[a.id]);});
test('explicit payment and agreement waivers satisfy both gates',async()=>{const a=await activation();await q("UPDATE public.journey_enrollment_activations SET payment_status='waived',agreement_status='waived' WHERE id=$1",[a.id]);assert.equal(await ready(a),true);});
test('correct signature records displayed hash; full payment and signatures activate',async()=>{const a=await activation(),ag=await agreement(a);await payment(a,10000);await sign(ag);assert.equal(await scalar('SELECT content_hash FROM public.agreement_acceptances WHERE client_agreement_id=$1',[ag.id]),ag.content_hash);assert.equal(await ready(a),true);assert.equal((await actor(member,'SELECT enrollment_requirements_complete AS ok FROM public.my_enrollment_readiness')).rows[0].ok,true);await act(owner,"UPDATE public.journey_enrollment_activations SET access_status='active' WHERE id=$1",[a.id]);});
test('missing second signature blocks readiness despite signed status',async()=>{const a=await activation(),ag=await agreement(a,2);await payment(a,10000);await sign(ag);await q("UPDATE public.client_agreements SET status='signed' WHERE id=$1",[ag.id]);assert.equal(await ready(a),false);await sign(ag,[{signer_role:'primary_client',signer_name:'One Person'},{signer_role:'secondary_client',signer_name:'Second Person'}]);assert.equal(await ready(a),true);});
for(const variant of ['stale','missing','changed-content','cross-user'])test(variant+' client signing is rejected without acceptance',async()=>{const a=await activation(),ag=await agreement(a);if(variant==='changed-content')await q("UPDATE public.client_agreements SET rendered_content_text='changed' WHERE id=$1",[ag.id]);await assert.rejects(sign(ag,undefined,variant==='stale'?'wrong':variant==='missing'?null:ag.content_hash,variant==='cross-user'?other:member),/content changed|integrity|not found/i);assert.equal(await scalar('SELECT count(*)::int FROM public.agreement_acceptances WHERE client_agreement_id=$1',[ag.id]),0);});
test('waived individual required agreement needs no signatures',async()=>{const a=await activation(),ag=await agreement(a,2);await q("UPDATE public.client_agreements SET status='waived' WHERE id=$1",[ag.id]);await payment(a,10000);assert.equal(await ready(a),true);const r=(await actor(owner,'SELECT blockers FROM public.admin_enrollment_readiness WHERE activation_id=$1',[a.id])).rows[0];assert(!r.blockers.includes('required_signatures_missing'));});
async function coachFixture(){await template('staff','revitalized-nation-coach-nda');const coach=await staff('coach','coach');return {coach,nda:(await q('SELECT * FROM public.staff_agreements WHERE staff_user_id=$1',[coach])).rows[0]};}
async function staffSign(coach,a,h=a.rendered_content_hash){return act(coach,'SELECT public.sign_my_staff_agreement($1,$2,$3,$4,$5)',[a.id,'Synthetic Coach','typed',null,h]);}
test('coach NDA is issued automatically; unsigned NDA keeps permissions pending',async()=>{const {coach,nda}=await coachFixture();assert(nda.required);assert.equal(await scalar('SELECT onboarding_status FROM public.staff_access WHERE user_id=$1',[coach]),'pending');assert.equal((await actor(coach,"SELECT public.staff_action_allowed('companion.manage',null) ok")).rows[0].ok,false);});
test('one signed NDA cannot complete onboarding when another required agreement is unsigned',async()=>{const {coach,nda}=await coachFixture();const t=await template('staff','other-required');await q("INSERT INTO public.staff_agreements(staff_user_id,agreement_template_id,agreement_key,template_version,content_hash,rendered_content_text,rendered_content_hash) VALUES($1,$2,$3,'1',$4,$5,$4)",[coach,t.id,t.agreement_key,t.content_hash,t.content_text]);await staffSign(coach,nda);assert.equal(await scalar('SELECT onboarding_status FROM public.staff_access WHERE user_id=$1',[coach]),'pending');const second=(await q('SELECT * FROM public.staff_agreements WHERE agreement_template_id=$1',[t.id])).rows[0];await staffSign(coach,second);assert.equal(await scalar('SELECT onboarding_status FROM public.staff_access WHERE user_id=$1',[coach]),'complete');assert.equal(await scalar('SELECT content_hash FROM public.staff_agreement_acceptances WHERE staff_agreement_id=$1',[nda.id]),nda.rendered_content_hash);});
test('declined required NDA blocks onboarding',async()=>{const {coach,nda}=await coachFixture();await q("UPDATE public.staff_agreements SET status='declined' WHERE id=$1",[nda.id]);assert.equal(await scalar('SELECT onboarding_status FROM public.staff_access WHERE user_id=$1',[coach]),'blocked');await assert.rejects(staffSign(coach,nda),/current status/);});
test('inactive staff cannot sign to regain privileges',async()=>{const {coach,nda}=await coachFixture();await override(coach,'companion.manage');await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1",[coach]);await assert.rejects(staffSign(coach,nda),/Active staff access required/);assert.equal(await scalar('SELECT status FROM public.staff_access WHERE user_id=$1',[coach]),'inactive');});
test('stale staff content hash is rejected',async()=>{const {coach,nda}=await coachFixture();await assert.rejects(staffSign(coach,nda,'outdated'),/content changed/);});
test('reactivating coach with completed NDA does not unnecessarily lock them out',async()=>{const {coach,nda}=await coachFixture();await staffSign(coach,nda);await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1",[coach]);await q("UPDATE public.staff_access SET status='active' WHERE user_id=$1",[coach]);assert.equal(await scalar('SELECT onboarding_status FROM public.staff_access WHERE user_id=$1',[coach]),'complete');});

test('inactive and pending staff cannot satisfy legacy raw staff-row RLS, but self status remains readable',async()=>{
 await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1",[admin]);
 assert.equal((await actor(admin,'SELECT count(*)::int n FROM public.staff_access')).rows[0].n,0);
 assert.equal((await actor(admin,'SELECT * FROM public.get_my_staff_access()')).rows[0].status,'inactive');
 const {coach}=await coachFixture();assert.equal((await actor(coach,'SELECT count(*)::int n FROM public.staff_access')).rows[0].n,0);
 assert.equal((await actor(coach,'SELECT * FROM public.get_my_staff_access()')).rows[0].onboarding_status,'pending');
});
test('account-activation readiness API is unavailable to anonymous or ordinary authenticated users',async()=>{
 for(const role of ['anon','authenticated'])await assert.rejects(actor(member,'SELECT public.member_activation_ready($1)',[contact],role),/permission denied/);
 assert.equal((await actor(null,'SELECT public.member_activation_ready($1) ready',[contact],'service_role')).rows[0].ready,false);
});

test('current member and staff agreement views supply the displayed signing hashes',async()=>{
 const a=await activation(),ag=await agreement(a);
 const view=(await actor(member,'SELECT * FROM public.my_agreements WHERE client_agreement_id=$1',[ag.id])).rows[0];
 assert.equal(view.content_hash,ag.content_hash);assert.equal(hash(view.content_text),view.rendered_content_hash);
 const {coach,nda}=await coachFixture();const staffView=(await actor(coach,'SELECT * FROM public.my_staff_agreements WHERE staff_agreement_id=$1',[nda.id])).rows[0];
 assert.equal(hash(staffView.content_text),staffView.rendered_content_hash);
});
test('account activation rechecks actual payment and agreement gates, including later shortfall',async()=>{
 const a=await activation(),ag=await agreement(a);
 await q("INSERT INTO public.program_catalog(program_code,name,program_type) VALUES('synthetic','Synthetic','membership')");
 const membership=await scalar("INSERT INTO public.client_memberships(primary_contact_id,activation_id,program_code,status) VALUES($1,$2,'synthetic','active') RETURNING id",[contact,a.id]);
 await q('UPDATE public.client_access SET membership_id=$1 WHERE contact_id=$2',[membership,contact]);
 const eligible=async()=>(await actor(null,'SELECT public.member_activation_ready($1) ok',[contact],'service_role')).rows[0].ok;
 assert.equal(await eligible(),false);await payment(a,10000);assert.equal(await eligible(),false);await sign(ag);assert.equal(await eligible(),true);
 await q("INSERT INTO public.payment_records(contact_id,activation_id,amount_cents,payment_method,recorded_by,transaction_type) VALUES($1,$2,10000,'cash',$3,'refund')",[contact,a.id,owner]);assert.equal(await eligible(),false);
});

test('active financial staff retain configured scoped payment permission without unrelated CRM management',async()=>{
 const financial=await staff('finance','financial','assigned');await q('UPDATE public.contacts SET assigned_to=$1 WHERE id=$2',[financial,contact]);
 assert.equal((await actor(financial,"SELECT public.staff_action_allowed('finance.record_payment',$1) ok",[contact])).rows[0].ok,true);
 assert.equal((await actor(financial,"SELECT public.staff_action_allowed('finance.record_payment',$1) ok",[otherContact])).rows[0].ok,false);
});
