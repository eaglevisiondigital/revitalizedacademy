'use strict';
// Prepared actual-PG probes. Never a JS policy simulation or generic-error denial proof.
const {test,before,after,beforeEach,afterEach}=require('node:test'),a=require('node:assert/strict');
const {db,q,val,actor,fixture}=require('../wave4-access/fixture.cjs');
const current=require('../wave3-allowance/current-subset.json');let f,template;
before(async()=>{await db.connect();for(const r of current.permissionCatalog)await q("insert into staff_permission_catalog(permission_key,label,category,active,sensitive) values($1,$1,'Independent fictional QA',$2,$3) on conflict do nothing",[r.key,r.active,r.sensitive]);for(const[t,rows]of[['staff_role_permission_defaults',current.permissionDefaults],['staff_role_permissions',current.permissionLegacy]])for(const r of rows)await q('insert into '+t+'(role,permission_key,allowed) values($1,$2,$3) on conflict do nothing',[r.role,r.key,r.allowed]);});
after(()=>db.end());beforeEach(async()=>{await q('begin');f=await fixture();template=await val("insert into checkin_templates(template_key,name) values(gen_random_uuid()::text,'Independent fictional template') returning id");});afterEach(()=>q('rollback'));
async function denied(sql,args){await a.rejects(actor(f.coach,sql,args),e=>e.code==='42501');}
test('independent positive-paired assignment: same actor valid tuple commits, mismatched membership rejects42501 with no notification',async()=>{
 const args=[f.contact,f.membership,f.coach];a.equal((await actor(f.coach,"insert into client_assignments(contact_id,membership_id,assigned_by,title) values($1,$2,$3,'Independent positive') returning id",args)).rowCount,1);
 const before=await val('select count(*)::int from client_assignments where contact_id=$1',[f.contact]);
 await denied("insert into client_assignments(contact_id,membership_id,assigned_by,title) values($1,$2,$3,'Independent negative')",[f.contact,f.otherMembership,f.coach]);
 a.equal(await val('select count(*)::int from client_assignments where contact_id=$1',[f.contact]),before);
});
test('independent actor identity: same valid tuple but forged assigned_by rejects42501 and cannot corrupt source',async()=>{
 await denied("insert into client_assignments(contact_id,membership_id,assigned_by,title) values($1,$2,$3,'Independent forged actor')",[f.contact,f.membership,f.owner]);
 a.equal(await val('select count(*)::int from client_assignments where contact_id=$1',[f.contact]),0);
});
test('independent query parses and returns exact scoped row for assigned Coach but no row for unassigned Coach',async()=>{
 const id=await val("insert into client_checkins(contact_id,membership_id,template_id,created_by) values($1,$2,$3,$4) returning id",[f.contact,f.membership,template,f.owner]);
 a.equal((await actor(f.coach,'select id from public.client_checkins where id=$1',[id])).rowCount,1);
 a.equal((await actor(f.wrongCoach,'select id from public.client_checkins where id=$1',[id])).rowCount,0);
});
test('independent no permissive policy or trigger role escalation was introduced',async()=>{
 a.equal(await val("select count(*)::int from pg_policy where polname like 'wave6_%' and polpermissive"),0);
 const p=(await q("select prosecdef,proconfig,pg_get_userbyid(proowner) owner from pg_proc where oid='private.wave6_operation_tuple_before()'::regprocedure")).rows[0];a.equal(p.prosecdef,false);a.deepEqual(p.proconfig,['search_path=""']);a.equal(p.owner,'postgres');
 for(const role of['anon','authenticated','service_role'])a.equal(await val("select has_function_privilege($1,'private.wave6_operation_tuple_before()','EXECUTE')",[role]),false);
});
