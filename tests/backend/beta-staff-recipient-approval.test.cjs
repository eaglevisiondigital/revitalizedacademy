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
beforeEach(async()=>{await db.query('begin');await db.query("insert into public.app_runtime_config(config_key,config_value,active) values('deployment_environment','{\"environment\":\"staging\",\"supabase_ref\":\"bvooallokgfktssadsrv\",\"payment_mode\":\"synthetic\",\"origin\":\"https://beta.revitalizedacademy.com\"}',true) on conflict(config_key) do update set config_value=excluded.config_value,active=true");owner=await make('owner');admin=await make('admin');member=await make();
 contact=(await db.query("insert into public.contacts(first_name,last_name,email,record_kind) values('Beta','Client','beta-client@example.invalid','crm') returning id")).rows[0].id;});
afterEach(()=>db.query('rollback'));
const approve="select public.set_beta_staff_test_recipient($1,$2,$3) result";

const email='staff-test@example.invalid',args=[email,true,'Approved staff beta acceptance'];
const check="select public.beta_staff_test_recipient_approved($1) approved";
test('Owner and Admin can approve a new exact staff recipient, with actor audit and no identity creation',async()=>{
 for(const uid of [owner,admin])await actor(uid,approve,args);
 const row=(await db.query('select * from private.beta_staff_test_recipients')).rows[0];assert.equal(row.approved_by,admin);assert.equal(row.email,email);
 const audit=(await db.query('select * from private.beta_staff_test_recipient_audit order by id')).rows;assert.equal(audit.length,2);assert.equal(audit[0].actor_user_id,owner);assert.equal(audit[1].actor_user_id,admin);
 assert.equal((await db.query('select count(*)::int n from auth.users where email=$1',[email])).rows[0].n,0);
});
test('member, anonymous and Coach with staff.manage still cannot approve',async()=>{
 const coach=await make('coach');await db.query("insert into public.staff_permission_overrides(user_id,permission_key,allowed,reason,updated_by) values($1,'staff.manage',true,'Fixture',$2)",[coach,owner]);
 for(const uid of [member,coach])await assert.rejects(actor(uid,approve,args),/Owner or Administrator/);
 await assert.rejects(actor(null,approve,args,'anon'),/permission denied/);
});
test('inactive, pending and staff.manage-denied administrators fail closed',async()=>{
 await db.query("update public.staff_access set status='inactive' where user_id=$1",[admin]);await assert.rejects(actor(admin,approve,args),/approval required/);
 await db.query("update public.staff_access set status='active',onboarding_status='pending' where user_id=$1",[admin]);await assert.rejects(actor(admin,approve,args),/approval required/);
 await db.query("update public.staff_access set onboarding_status='complete' where user_id=$1",[admin]);
 await db.query("insert into public.staff_permission_overrides(user_id,permission_key,allowed,reason,updated_by) values($1,'staff.manage',false,'Fixture',$2)",[admin,owner]);await assert.rejects(actor(admin,approve,args),/approval required/);
});
test('wildcards and invalid/missing approval inputs are rejected',async()=>{
 for(const e of ['*@example.invalid','example.invalid','staff@example.invalid,another@example.invalid'])await assert.rejects(actor(owner,approve,[e,true,'Approval']),/required/);
 await assert.rejects(actor(owner,approve,[email,true,'']),/required/);await assert.rejects(actor(owner,approve,[email,null,'Approval']),/required/);
});
test('checker is service-only, exact and normalizes casing',async()=>{
 await actor(owner,approve,['STAFF-TEST@example.invalid',true,'Approval']);
 assert.equal((await actor(null,check,[email],'service_role')).rows[0].approved,true);
 assert.equal((await actor(null,check,['other@example.invalid'],'service_role')).rows[0].approved,false);
 await assert.rejects(actor(owner,check,[email]),/permission denied/);
});
test('staff and client approvals never substitute for each other',async()=>{
 await actor(owner,"select public.set_beta_test_recipient($1,$2,$3)",['beta-client@example.invalid',true,'Client approval']);
 assert.equal((await actor(null,check,['beta-client@example.invalid'],'service_role')).rows[0].approved,false);
 await actor(owner,approve,args);assert.equal((await actor(null,"select public.beta_test_recipient_approved($1) approved",[email],'service_role')).rows[0].approved,false);
});
test('revocation is audited and immediately denies the exact staff email',async()=>{
 await actor(owner,approve,args);await actor(admin,approve,[email,false,'Revoked test']);assert.equal((await actor(null,check,[email],'service_role')).rows[0].approved,false);
 assert.equal((await db.query('select count(*)::int n from private.beta_staff_test_recipient_audit')).rows[0].n,2);
});
test('registry and audit are inaccessible directly to browser and service',async()=>{
 for(const role of ['authenticated','service_role'])for(const table of ['beta_staff_test_recipients','beta_staff_test_recipient_audit'])await assert.rejects(actor(owner,'select * from private.'+table,[],role),/permission denied/);
});
test('production and wrong beta origin refuse approval and checking',async()=>{
 for(const config of [{environment:'production',supabase_ref:'voalfpxiyznnqfcqcymd'}, {environment:'staging',supabase_ref:'bvooallokgfktssadsrv',payment_mode:'synthetic',origin:'https://other.invalid'}]){
 await db.query("update public.app_runtime_config set config_value=$1 where config_key='deployment_environment'",[JSON.stringify(config)]);
 await assert.rejects(actor(owner,approve,args),/staging-only/);assert.equal((await actor(null,check,[email],'service_role')).rows[0].approved,false);
 }
});
