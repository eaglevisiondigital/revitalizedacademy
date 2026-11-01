'use strict';
const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {db,q,val,actor}=require('../wave4-access/fixture.cjs');
const root=path.resolve(__dirname,'../..');
const correction=fs.readFileSync(path.join(root,'proposals/wave8-provisioning/profiles-truncate.sql'),'utf8');
const guard=correction.split('DO $guard$')[1].split('END $guard$;')[0];
const runGuard=()=>q('DO $guard$'+guard+'END $guard$;');
const corrected=process.env.RVA_WAVE8_PROFILE_STAGE==='corrected';let uid;
before(()=>db.connect());after(()=>db.end());
beforeEach(async()=>{await q('begin');uid=crypto.randomUUID();await q('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[uid,'profiles-'+uid+'@example.invalid']);});afterEach(()=>q('rollback'));
for(const role of ['authenticated','anon'])test('STRICT '+role+' cannot TRUNCATE profiles; precise42501 and all mapping rows preserved',async()=>{
 const before=(await q('select * from profiles order by user_id')).rows;assert.ok(before.length>0);
 await q('savepoint truncate_probe');let denial=null,inside;
 try{try{await actor(role==='anon'?null:uid,'truncate table public.profiles',[],role);}catch(e){denial=e.code;}inside=(await q('select * from profiles order by user_id')).rows;}finally{await q('rollback to truncate_probe');await q('release truncate_probe');}
 assert.deepEqual((await q('select * from profiles order by user_id')).rows,before,'probe always rolls back actual mappings');
 console.log(JSON.stringify({scope:'FICTIONAL_LOCAL_ONLY',stage:process.env.RVA_WAVE8_PROFILE_STAGE,role,profileRowsBefore:before.length,profileRowsAfterAttempt:inside.length,denialCode:denial,rollbackRestored:before.length}));
 assert.equal(denial,'42501','only privilege denial passes; success/FK errors do not');assert.deepEqual(inside,before);
});
test('scope is exactly TRUNCATE for anon/authenticated; all other profile ACL bits preserved',async()=>{
 for(const role of ['postgres','service_role'])for(const privilege of ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'])assert.equal(await val('select has_table_privilege($1,\'public.profiles\',$2)',[role,privilege]),true);
 for(const role of ['anon','authenticated'])for(const privilege of ['SELECT','REFERENCES','TRIGGER','MAINTAIN'])assert.equal(await val('select has_table_privilege($1,\'public.profiles\',$2)',[role,privilege]),true);
 for(const role of ['anon','authenticated'])for(const privilege of ['INSERT','UPDATE','DELETE'])assert.equal(await val('select has_table_privilege($1,\'public.profiles\',$2)',[role,privilege]),false);
 assert.equal(await val("select has_table_privilege('authenticated','public.profiles','TRUNCATE')"),!corrected);
 assert.equal(await val("select has_table_privilege('anon','public.profiles','TRUNCATE')"),!corrected);
});
test('profile mapping UPDATE remains denied with precise42501',async()=>{await assert.rejects(actor(uid,'update profiles set contact_id=gen_random_uuid() where user_id=$1',[uid]),e=>e.code==='42501');});
if(corrected){
 test('noninstaller authenticated cannot run the guarded correction',async()=>{await assert.rejects(actor(uid,'DO $guard$'+guard+'END $guard$;'),/reviewed installer/);});
 test('replay installation fails before a second privilege change',async()=>{await assert.rejects(runGuard(),/Profiles exact ACL drift/);});
 for(const[title,change]of[
  ['row security','alter table public.profiles disable row level security'],
  ['forced row security','alter table public.profiles force row level security'],
  ['owner','alter table public.profiles owner to service_role'],
  ['extra authenticated UPDATE','grant update on public.profiles to authenticated'],
  ['extra anonymous UPDATE','grant update on public.profiles to anon'],
  ['caller BYPASSRLS','alter role authenticated bypassrls'],
  ['caller SUPERUSER','alter role authenticated superuser'],
  ['inherited privilege','grant service_role to authenticated']
 ])test('installation guard rejects '+title+' drift atomically',async()=>{
  await q('savepoint drift');await q('grant truncate on profiles to anon,authenticated');await q(change);
  await assert.rejects(runGuard(),/Profiles .* drift/);await q('rollback to drift');await q('release drift');
  assert.equal(await val("select has_table_privilege('authenticated','public.profiles','TRUNCATE')"),false);assert.equal(await val("select relrowsecurity from pg_class where oid='public.profiles'::regclass"),true);
 });
 test('transaction rollback restores pre-proposal ACL without changing mappings',async()=>{
  const before=(await q('select * from profiles order by user_id')).rows;
  await q('savepoint acl_rollback');await q('grant truncate on profiles to anon,authenticated');const expected=await val("select relacl::text from pg_class where oid='public.profiles'::regclass");
  await q('savepoint correction_rollback');await runGuard();await q('revoke truncate on profiles from anon,authenticated');assert.equal(await val("select has_table_privilege('authenticated','public.profiles','TRUNCATE')"),false);await q('rollback to correction_rollback');
  assert.equal(await val("select relacl::text from pg_class where oid='public.profiles'::regclass"),expected);await q('rollback to acl_rollback');assert.deepEqual((await q('select * from profiles order by user_id')).rows,before);assert.equal(await val("select has_table_privilege('authenticated','public.profiles','TRUNCATE')"),false);
 });
}
