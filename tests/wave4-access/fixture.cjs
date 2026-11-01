// Fixture plumbing only: business authorization and allowance logic come from pinned SQL.
const assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),path=require('node:path');
const pgdir=process.env.RVA_WAVE4_DEPENDENCIES||path.resolve(__dirname,'../../../revitalizedacademy/node_modules');
assert.equal(require(path.join(pgdir,'pg/package.json')).version,'8.16.3');
const {Client}=require(path.join(pgdir,'pg'));
const socket=process.env.RVA_WAVE4_SOCKET;
if(!socket||!socket.includes('rva-wave4-access-')||!['/private/','/var/'].some(x=>socket.startsWith(x)))throw Error('Owned disposable UNIX socket required');
if(process.env.RVA_WAVE4_DATABASE!=='wave4_access')throw Error('Owned fixture database required');
const config={host:socket,port:Number(process.env.RVA_WAVE4_PORT),user:'postgres',database:'wave4_access'};
const db=new Client(config),q=(s,p=[])=>db.query(s,p),val=async(s,p=[])=>Object.values((await q(s,p)).rows[0])[0];
async function actor(uid,sql,args=[],role='authenticated',client=db){
 if(!['authenticated','anon'].includes(role))throw Error('Unsupported fixture role');
 await client.query('savepoint actor');
 try{await client.query('set local role '+role);await client.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[uid||'',role]);const r=await client.query(sql,args);await client.query('reset role');await client.query("select set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','',true)");await client.query('release actor');return r;}
 catch(e){await client.query('rollback to actor');await client.query('release actor');throw e;}
}
async function user(name,role){const id=randomUUID();await q('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,name+'-'+id+'@example.invalid']);if(role){await q("insert into staff_access(user_id,role,status,onboarding_status,contact_scope) values($1,$2,'active','complete',$3)",[id,role,role==='owner'?'all':'assigned']);await q("update staff_access set onboarding_status='complete' where user_id=$1",[id]);}return id;}
async function fixture(){
 const owner=await user('fictional-owner','owner'),coach=await user('fictional-coach','coach'),wrongCoach=await user('fictional-other-coach','coach'),member=await user('fictional-client-a'),otherMember=await user('fictional-client-b');
 const contact=await val('select contact_id from profiles where user_id=$1',[member]),otherContact=await val('select contact_id from profiles where user_id=$1',[otherMember]);
 await q('update contacts set assigned_to=$1 where id=$2',[coach,contact]);
 for(const code of ['wave4-a','wave4-b'])await q("insert into program_catalog(program_code,name,program_type) values($1,'Fictional program only','membership') on conflict do nothing",[code]);
 const membership=await val("insert into client_memberships(primary_contact_id,program_code,status,starts_at) values($1,'wave4-a','active',now()-interval '1 day') returning id",[contact]);
 const otherMembership=await val("insert into client_memberships(primary_contact_id,program_code,status) values($1,'wave4-b','active') returning id",[otherContact]);
 const sameClientOtherProgram=await val("insert into client_memberships(primary_contact_id,program_code,status) values($1,'wave4-b','active') returning id",[contact]);
 await q("insert into client_access(contact_id,user_id,membership_id,status) values($1,$2,$3,'active'),($4,$5,$6,'active')",[contact,member,membership,otherContact,otherMember,otherMembership]);
 for(const m of [membership,otherMembership,sameClientOtherProgram])await q("insert into membership_entitlements(membership_id,entitlement_key,label,limit_value) values($1,'private_coaching','Fictional sessions',3)",[m]);
 for(const uid of [coach,wrongCoach])for(const key of ['coaching.manage','coaching.view','crm.view'])await q('insert into staff_permission_overrides(user_id,permission_key,allowed,updated_by) values($1,$2,true,$3) on conflict(user_id,permission_key) do update set allowed=excluded.allowed',[uid,key,owner]);
 return {owner,coach,wrongCoach,member,otherMember,contact,otherContact,membership,otherMembership,sameClientOtherProgram};
}
async function session(f,status='scheduled',membership=f.membership,contact=f.contact){return val("insert into coaching_sessions(contact_id,membership_id,coach_user_id,scheduled_start,scheduled_end,status) values($1,$2,$3,now()+interval '1 day',now()+interval '1 day 30 minutes',$4) returning id",[contact,membership,f.coach,status]);}
const used=m=>val("select used_value from membership_entitlements where membership_id=$1 and entitlement_key='private_coaching'",[m]);
const usage=s=>val('select id from coaching_entitlement_usage where coaching_session_id=$1',[s]);
const review=(uid,id,resolution='consumed',reason='Fictional reviewed decision')=>actor(uid,'select public.resolve_coaching_entitlement_review($1,$2,$3)',[id,resolution,reason]);
module.exports={Client,config,db,q,val,actor,fixture,session,used,usage,review};
