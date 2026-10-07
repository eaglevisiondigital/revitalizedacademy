const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');const {Client}=require('pg');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable database required');
const db=new Client();let owner,admin,member,contact,program;
async function actor(uid,sql,args=[],role='authenticated'){
 await db.query('savepoint beta_actor');try{
 await db.query('set local role '+role);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[uid||'']);
 const r=await db.query(sql,args);await db.query('reset role');await db.query("select set_config('request.jwt.claim.sub','',true)");await db.query('release savepoint beta_actor');return r;
 }catch(e){await db.query('rollback to beta_actor');await db.query('release savepoint beta_actor');throw e;}
}
async function make(role){const id=randomUUID();await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,id+'@example.invalid']);
 if(role)await db.query("insert into public.staff_access(user_id,role,display_name,status,onboarding_status,contact_scope) values($1,$2,'Synthetic','active','complete','all')",[id,role]);return id;}
before(async()=>{await db.connect();const metadata=require('../../supabase/baselines/2026-09-26/metadata.json');
 for(const p of metadata.permission_catalog){const keys=Object.keys(p);await db.query('insert into public.staff_permission_catalog('+keys.join(',')+') values('+keys.map((_,i)=>'$'+(i+1)).join(',')+') on conflict do nothing',Object.values(p));}
 for(const r of metadata.permission_defaults)await db.query('insert into public.staff_role_permission_defaults(role,permission_key,allowed) values($1,$2,$3) on conflict do nothing',[r.role,r.permission_key,r.allowed]);
});after(()=>db.end());

beforeEach(async()=>{
 await db.query('begin');
 await db.query("insert into public.app_runtime_config(config_key,config_value,active) values('deployment_environment','{\"environment\":\"staging\",\"supabase_ref\":\"bvooallokgfktssadsrv\",\"payment_mode\":\"synthetic\",\"origin\":\"https://beta.revitalizedacademy.com\"}',true) on conflict(config_key) do update set config_value=excluded.config_value,active=true");
 owner=await make('owner');admin=await make('admin');member=await make();
 contact=(await db.query("insert into public.contacts(first_name,last_name,email) values('Synthetic','Client','enrollment@example.invalid') returning id")).rows[0].id;
 program='beta-'+randomUUID();await db.query("insert into public.program_catalog(program_code,name,program_type,default_commitment_months) values($1,'Synthetic program','membership',6)",[program]);
 await db.query("insert into public.journey_definitions(journey_key,name,audience) values('direct_membership','Synthetic direct','client') on conflict do nothing");
 await db.query("insert into public.journey_step_definitions(journey_key,step_key,step_order,name,step_type,required) values('direct_membership','application_capture',1,'Contact','form',true),('direct_membership','payment_agreement',2,'Agreement','form',true) on conflict do nothing");
});afterEach(()=>db.query('rollback'));
const save='select public.save_beta_client_enrollment($1,$2,$3,$4,$5) state';
const args=()=>[contact,program,'monthly',8900,'USD'];
const read='select public.beta_client_enrollment_state($1) state';
test('unstarted client has approval/enrollment/invitation/access states without secrets',async()=>{const s=(await actor(owner,read,[contact])).rows[0].state;assert.equal(s.enrollment_created,false);assert.equal(s.recipient_approved,false);assert.equal(s.invitation,null);assert.equal(s.ready_for_access,false);assert(!/token|hash|body/.test(JSON.stringify(s)));});
test('Owner saves one pending enrollment atomically; retry preserves identity and creates no mail/auth',async()=>{await actor(owner,save,args());await actor(owner,save,args());assert.equal((await db.query('select count(*)::int n from public.journey_enrollment_activations where contact_id=$1',[contact])).rows[0].n,1);assert.equal((await db.query('select count(*)::int n from public.contact_journeys where contact_id=$1',[contact])).rows[0].n,1);const s=(await actor(owner,read,[contact])).rows[0].state;assert.equal(s.program_code,program);assert.equal(s.payment_status,'pending');assert.equal(s.agreement_status,'not_sent');assert.equal(s.ready_for_access,false);assert.equal(s.invitation,null);assert.equal((await db.query("select count(*)::int n from auth.users where email='enrollment@example.invalid'")).rows[0].n,0);});
test('recipient approval is distinct from enrollment and never sends',async()=>{await actor(owner,'select public.set_beta_test_recipient($1,true,$2)',['enrollment@example.invalid','Approved synthetic acceptance']);const s=(await actor(owner,read,[contact])).rows[0].state;assert.equal(s.recipient_approved,true);assert.equal(s.enrollment_created,false);assert.equal(s.invitation,null);});
test('Admin with finance permission and scope may configure',async()=>{await actor(admin,save,args());});
test('member, anonymous, inactive Owner and out-of-scope Admin are denied',async()=>{await assert.rejects(actor(member,save,args()),/Authorized/);await assert.rejects(actor(null,read,[contact],'anon'),/permission denied/);await db.query("update public.staff_access set status='inactive' where user_id=$1",[owner]);await assert.rejects(actor(owner,read,[contact]),/Authorized/);await db.query("update public.staff_access set contact_scope='assigned' where user_id=$1",[admin]);await assert.rejects(actor(admin,save,args()),/scope/);});
test('production runtime guard fails closed',async()=>{await db.query("update public.app_runtime_config set config_value='{\"environment\":\"production\"}' where config_key='deployment_environment'");await assert.rejects(actor(owner,save,args()),/staging-only/);});
test('invalid program, missing/negative amount and unsupported billing/currency denied',async()=>{for(const [i,v]of [[1,'missing'],[2,null],[2,'bad'],[3,-1],[3,null],[4,'EUR'],[4,null]]){const a=args();a[i]=v;await assert.rejects(actor(owner,save,a),/required/);}});
test('recorded payment locks existing enrollment terms and identical retry remains safe',async()=>{await actor(owner,save,args());const a=(await db.query('select id from public.journey_enrollment_activations where contact_id=$1',[contact])).rows[0];await db.query("insert into public.payment_records(contact_id,activation_id,amount_cents,payment_method,recorded_by) values($1,$2,100,'other',$3)",[contact,a.id,owner]);const changed=args();changed[3]=9000;await assert.rejects(actor(owner,save,changed),/locked/);await actor(owner,save,args());assert.equal((await db.query('select count(*)::int n from public.payment_records where activation_id=$1',[a.id])).rows[0].n,1);});
