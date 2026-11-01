'use strict';
const {test,before,after,beforeEach,afterEach}=require('node:test'),assert=require('node:assert/strict');
const {db,q,val,actor,fixture,session,used,usage,review,Client,config}=require('../wave4-access/fixture.cjs');
const current=require('../wave3-allowance/current-subset.json');let f;
before(async()=>{await db.connect();for(const r of current.permissionCatalog)await q("insert into staff_permission_catalog(permission_key,label,category,active,sensitive) values($1,$1,'Fictional fixture',$2,$3) on conflict do nothing",[r.key,r.active,r.sensitive]);for(const [table,rows]of [['staff_role_permission_defaults',current.permissionDefaults],['staff_role_permissions',current.permissionLegacy]])for(const r of rows)await q('insert into '+table+'(role,permission_key,allowed) values($1,$2,$3) on conflict do nothing',[r.role,r.key,r.allowed]);});
after(()=>db.end());beforeEach(async()=>{await q('begin');f=await fixture();});afterEach(()=>q('rollback'));
const settle=p=>p.then(value=>({ok:true,value}),error=>({ok:false,error}));
async function connection(){const c=new Client(config);await c.connect();await c.query("set lock_timeout='2s';set statement_timeout='5s';set deadlock_timeout='100ms'");await c.query('begin');return c;}
async function close(c){try{await c.query('rollback');}finally{await c.end();}}
async function waitLock(c){for(let n=0;n<100;n++){if(await val("select coalesce((select wait_event_type='Lock' from pg_stat_activity where pid=$1),false)",[c.processID]))return true;await new Promise(r=>setTimeout(r,10));}return false;}
async function exact(){const total=await val("select coalesce(sum(usage_units),0)::int from coaching_entitlement_usage where membership_id=$1 and status='consumed'",[f.membership]);assert.equal(await used(f.membership),total);return total;}
const update=(c,id,status='consumed')=>actor(f.coach,'update coaching_entitlement_usage set status=$1 where id=$2',[status,id],'authenticated',c);
for(const operation of ['direct','rpc'])test('[E02 availability] opposing session and '+operation+' updates both commit without retry',async()=>{
 const s=await session(f,'no_show'),id=await usage(s);await q('commit');const a=await connection(),b=await connection();let pending;
 try{
  await a.query('select id from coaching_entitlement_usage where id=$1 for update',[id]);
  pending=settle(actor(f.coach,"update coaching_sessions set status='completed' where id=$1",[s],'authenticated',b));
  assert.equal(await waitLock(b),true,'second transaction must really block on first usage row');
  const ra=await settle(operation==='direct'?update(a,id):actor(f.coach,"select resolve_coaching_entitlement_review($1,'consumed','Fictional reviewed concurrent action')",[id],'authenticated',a));
  await a.query(ra.ok?'commit':'rollback');const rb=await pending;await b.query(rb.ok?'commit':'rollback');
  assert.equal(ra.ok,true,ra.error?.code+': '+ra.error?.message);assert.equal(rb.ok,true,rb.error?.code+': '+rb.error?.message);
  assert.equal(await exact(),1);assert.equal(await val('select count(*)::int from coaching_entitlement_usage where coaching_session_id=$1',[s]),1);
 }finally{await close(a);await close(b);if(pending)await pending;}
});
for(const direction of ['insert-first','move-first'])test('[E02 tuple race] first ledger INSERT versus session move '+direction,async()=>{
 const s=await session(f);await q('delete from coaching_entitlement_usage where coaching_session_id=$1',[s]);await q('commit');const a=await connection(),b=await connection();let pending;
 try{
  if(direction==='insert-first'){
   await actor(f.coach,'insert into coaching_entitlement_usage(contact_id,membership_id,coaching_session_id) values($1,$2,$3)',[f.contact,f.membership,s],'authenticated',a);
   pending=settle(actor(f.coach,'update coaching_sessions set membership_id=$1 where id=$2',[f.sameClientOtherProgram,s],'authenticated',b));
   assert.equal(await waitLock(b),true);await a.query('commit');const r=await pending;assert.equal(r.ok,false);assert.equal(r.error.code,'23514');await b.query('rollback');
  }else{
   await actor(f.coach,'update coaching_sessions set membership_id=$1 where id=$2',[f.sameClientOtherProgram,s],'authenticated',a);
   pending=settle(actor(f.coach,'insert into coaching_entitlement_usage(contact_id,membership_id,coaching_session_id) values($1,$2,$3)',[f.contact,f.membership,s],'authenticated',b));
   assert.equal(await waitLock(b),true);await a.query('commit');const r=await pending;assert.equal(r.ok,false);assert.equal(r.error.code,'23514');await b.query('rollback');
  }
  assert.equal(await val('select count(*)::int from coaching_entitlement_usage u join coaching_sessions s on s.id=u.coaching_session_id where u.coaching_session_id=$1 and (u.contact_id is distinct from s.contact_id or u.membership_id is distinct from s.membership_id)',[s]),0);await exact();
 }finally{await close(a);await close(b);if(pending)await pending;}
});
test('[E02 durable uniqueness] concurrent repeated session completion uses exactly one existing usage row',async()=>{
 const s=await session(f);await q('commit');const clients=await Promise.all([connection(),connection(),connection()]);
 try{const results=await Promise.all(clients.map(async c=>{const r=await settle(actor(f.coach,"update coaching_sessions set status='completed' where id=$1",[s],'authenticated',c));await c.query(r.ok?'commit':'rollback');return r;}));assert.ok(results.every(r=>r.ok),JSON.stringify(results.map(r=>r.error?.code)));assert.equal(await val('select count(*)::int from coaching_entitlement_usage where coaching_session_id=$1',[s]),1);assert.equal(await exact(),1);}finally{await Promise.all(clients.map(close));}
});
test('[E02 durable state replay] lost response after committed review reconciles by immutable ID before an explicit repeat',async()=>{
 const s=await session(f,'no_show'),id=await usage(s);await q('commit');const a=await connection();
 try{await actor(f.coach,"select resolve_coaching_entitlement_review($1,'consumed','Fictional explicit decision')",[id],'authenticated',a);await a.query('commit');await a.query('begin');const saved=(await actor(f.coach,'select id,coaching_session_id,status,updated_by from coaching_entitlement_usage where id=$1',[id],'authenticated',a)).rows[0];assert.equal(saved.status,'consumed');assert.equal(saved.updated_by,f.coach);await actor(f.coach,"select resolve_coaching_entitlement_review($1,'consumed','Fictional explicit decision')",[id],'authenticated',a);await a.query('commit');assert.equal(await exact(),1);assert.equal(await val('select count(*)::int from coaching_entitlement_usage where coaching_session_id=$1',[s]),1);}finally{await close(a);}
});
test('[E02 atomic rollback] known transaction abort does not charge or create a duplicate',async()=>{
 const s=await session(f,'no_show'),id=await usage(s);await q('savepoint command');await review(f.coach,id);assert.equal(await exact(),1);await q('rollback to command');assert.equal(await exact(),0);assert.equal(await val('select status from coaching_entitlement_usage where id=$1',[id]),'review');await review(f.coach,id);assert.equal(await exact(),1);
});
for(const key of ['contact_id','membership_id','coaching_session_id'])test('[N02 relation invariant] immutable usage '+key+' cannot transfer after lock correction',async()=>{
 const s=await session(f,'no_show'),id=await usage(s),other=await session(f,'no_show',f.otherMembership,f.otherContact);const v={contact_id:f.otherContact,membership_id:f.otherMembership,coaching_session_id:other}[key];await assert.rejects(actor(f.coach,'update coaching_entitlement_usage set '+key+'=$1 where id=$2',[v,id]));assert.equal(await exact(),0);
});
test('[N02 current session scope] unrelated Coach cannot read or resolve original usage',async()=>{const id=await usage(await session(f,'no_show'));assert.equal((await actor(f.wrongCoach,'select id from coaching_entitlement_usage where id=$1',[id])).rowCount,0);await assert.rejects(review(f.wrongCoach,id));assert.equal(await exact(),0);});
test('[N06 revoked scope] inactive or explicit-denied Coach cannot write after lock correction',async()=>{const id=await usage(await session(f,'no_show'));await q("update staff_access set status='inactive' where user_id=$1",[f.coach]);await assert.rejects(review(f.coach,id));assert.equal(await exact(),0);});
test('[N04 metadata] function remains postgres-only trigger with identical RLS and no public execution',async()=>{const meta=(await q("select prosecdef,pg_get_userbyid(proowner) owner,proconfig,proacl::text acl from pg_proc where oid='private.wave4_usage_before()'::regprocedure")).rows[0];assert.deepEqual(meta,{prosecdef:true,owner:'postgres',proconfig:['search_path=""'],acl:'{postgres=X/postgres}'});assert.equal(await val("select has_function_privilege('authenticated','private.wave4_usage_before()','EXECUTE')"),false);assert.equal(await val("select count(*)::int from pg_policy where polrelid in ('coaching_entitlement_usage'::regclass,'membership_entitlements'::regclass) and polname like 'wave4_%'"),6);});
