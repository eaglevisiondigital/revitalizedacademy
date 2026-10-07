const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');const {Client}=require('pg');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable database required');
const db=new Client();let owner,admin,member,contact;
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
beforeEach(async()=>{await db.query('begin');await db.query("insert into public.app_runtime_config(config_key,config_value,active) values('deployment_environment','{\"environment\":\"staging\",\"supabase_ref\":\"bvooallokgfktssadsrv\",\"payment_mode\":\"synthetic\"}',true) on conflict(config_key) do update set config_value=excluded.config_value,active=true");owner=await make('owner');admin=await make('admin');member=await make();
 contact=(await db.query("insert into public.contacts(first_name,last_name,email,record_kind) values('Beta','Client','beta-client@example.invalid','crm') returning id")).rows[0].id;});
afterEach(()=>db.query('rollback'));
const approve="select public.set_beta_test_recipient($1,$2,$3) result";
test('active Owner approves exact existing client; registry and immutable audit persist',async()=>{
 const r=await actor(owner,approve,['BETA-CLIENT@example.invalid',true,'Approved synthetic client acceptance']);assert.equal(r.rows[0].result.approved,true);
 const state=(await db.query('select * from private.beta_test_recipients')).rows[0];assert.equal(state.email,'beta-client@example.invalid');assert.equal(state.approved_by,owner);
 assert.equal((await db.query('select count(*)::int n from private.beta_test_recipient_audit')).rows[0].n,1);
});
test('Admin, member and anonymous callers cannot approve',async()=>{for(const u of [admin,member])await assert.rejects(actor(u,approve,['beta-client@example.invalid',true,'Unapproved attempt']),/Owner/);
 await assert.rejects(actor(null,approve,['beta-client@example.invalid',true,'Unapproved attempt'],'anon'),/permission denied/);});
test('pending or inactive Owner fails closed',async()=>{await db.query("update public.staff_access set status='inactive' where user_id=$1",[owner]);await assert.rejects(actor(owner,approve,['beta-client@example.invalid',true,'Approval']),/Owner/);});
test('wildcards, unregistered contacts and missing reason are rejected',async()=>{
 for(const e of ['*@example.invalid','another@example.invalid'])await assert.rejects(actor(owner,approve,[e,true,'Approval']),/required/);
 await assert.rejects(actor(owner,approve,['beta-client@example.invalid',true,'']),/required/);});
test('approved recipient checker is service-only and exact; neighboring recipients remain denied',async()=>{
 await actor(owner,approve,['beta-client@example.invalid',true,'Approval']);
 assert.equal((await actor(null,'select public.beta_test_recipient_approved($1) approved',['beta-client@example.invalid'],'service_role')).rows[0].approved,true);
 assert.equal((await actor(null,'select public.beta_test_recipient_approved($1) approved',['another@example.invalid'],'service_role')).rows[0].approved,false);
 await assert.rejects(actor(owner,'select public.beta_test_recipient_approved($1)',['beta-client@example.invalid']),/permission denied/);
});
test('revocation is audited and changing client email invalidates previous approval',async()=>{
 await actor(owner,approve,['beta-client@example.invalid',true,'Approval']);await db.query("update public.contacts set email='changed@example.invalid' where id=$1",[contact]);
 assert.equal((await actor(null,'select public.beta_test_recipient_approved($1) approved',['beta-client@example.invalid'],'service_role')).rows[0].approved,false);
 await db.query("update public.contacts set email='beta-client@example.invalid' where id=$1",[contact]);await actor(owner,approve,['beta-client@example.invalid',false,'Revocation']);
 assert.equal((await db.query('select approved from private.beta_test_recipients')).rows[0].approved,false);
 assert.equal((await db.query('select count(*)::int n from private.beta_test_recipient_audit')).rows[0].n,2);
});
test('registry and audit deny direct browser writes and reads',async()=>{
 await assert.rejects(actor(owner,'select * from private.beta_test_recipients'),/permission denied/);
 await assert.rejects(actor(owner,'delete from private.beta_test_recipient_audit'),/permission denied/);
});

test('production marker denies approval and recipient checker',async()=>{
 await db.query("update public.app_runtime_config set config_value='{\"environment\":\"production\",\"supabase_ref\":\"voalfpxiyznnqfcqcymd\"}' where config_key='deployment_environment'");
 await assert.rejects(actor(owner,approve,['beta-client@example.invalid',true,'Approval']),/staging-only/);
 assert.equal((await actor(null,'select public.beta_test_recipient_approved($1) approved',['beta-client@example.invalid'],'service_role')).rows[0].approved,false);
});

test('existing dedicated-site constraint migrates to exact beta origin and still rejects production',async()=>{
 await db.query("insert into public.app_runtime_config(config_key,config_value,active) values('client_onboarding','{\"origin\":\"https://revitalizedacademy-staging.netlify.app\"}',true) on conflict(config_key) do update set config_value=excluded.config_value,active=true");
 await db.query("alter table public.app_runtime_config add constraint staging_onboarding_origin check(config_key<>'client_onboarding' or (active and config_value->>'origin'='https://revitalizedacademy-staging.netlify.app'))");
 const migration=require('node:fs').readFileSync(require('node:path').join(__dirname,'../../supabase/migrations/20261007011000_beta_test_recipient_approval.sql'),'utf8');
 await db.query(migration.split('-- BEGIN BETA ORIGIN RECONCILIATION')[1].split('-- END BETA ORIGIN RECONCILIATION')[0]);
 assert.equal((await db.query("select config_value->>'origin' origin from public.app_runtime_config where config_key='client_onboarding'")).rows[0].origin,'https://beta.revitalizedacademy.com');
 await assert.rejects(db.query("update public.app_runtime_config set config_value='{\"origin\":\"https://revitalizedacademy.com\"}' where config_key='client_onboarding'"),/staging_onboarding_origin/);
});
