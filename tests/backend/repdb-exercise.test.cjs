const {test,before,after,beforeEach,afterEach}=require('node:test');const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');const {Client}=require('pg');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||'')||process.env.PGHOST!=='127.0.0.1')throw Error('Isolated local database required');
const db=new Client(),q=(s,p=[])=>db.query(s,p),val=async(s,p=[])=>Object.values((await q(s,p)).rows[0])[0];
let owner,admin,coach,support,inactive,pending,member,nutrition,fitness;
async function actor(uid,sql,args=[],role='authenticated'){
 await q('savepoint actor');
 try{await q('set local role '+role);await q("select set_config('request.jwt.claim.sub',$1,true)",[uid||'']);const r=await q(sql,args);await q('reset role');await q('release actor');return r;}
 catch(e){await q('rollback to actor');await q('release actor');throw e;}
}
async function user(role,status='active',onboarding='complete'){
 const id=randomUUID();await q('insert into auth.users(id,email) values($1,$2)',[id,id+'@example.invalid']);
 if(role){await q('insert into public.staff_access(user_id,role,status,onboarding_status,contact_scope) values($1,$2,$3,$4,$5)',[id,role,status,onboarding,role==='coach'?'assigned':'all']);await q('update public.staff_access set onboarding_status=$2 where user_id=$1',[id,onboarding]);}
 return id;
}
before(async()=>{await db.connect();});after(()=>db.end());
beforeEach(async()=>{
 await q('begin');
 await q("insert into public.staff_permission_catalog(permission_key,label,category) values('learning.manage','Manage Content','Learning') on conflict do nothing");
 await q("insert into public.staff_role_permission_defaults(role,permission_key,allowed) values('owner','learning.manage',true),('admin','learning.manage',true),('coach','learning.manage',true),('support','learning.manage',false) on conflict(role,permission_key) do update set allowed=excluded.allowed");
 owner=await user('owner');admin=await user('admin');coach=await user('coach');support=await user('support');inactive=await user('coach','inactive');pending=await user('coach','active','pending');member=await user(null);
 await q('insert into public.staff_permission_overrides(user_id,permission_key,allowed,updated_by) values($1,$2,true,$3)',[inactive,'learning.manage',owner]);
 nutrition=await val("insert into public.nutrition_methodologies(methodology_key,name,status) values($1,'Synthetic Local Nutrition','draft') returning id",[randomUUID()]);
 fitness=await val("insert into public.fitness_methodologies(methodology_key,name,status) values($1,'Synthetic Local Fitness','draft') returning id",[randomUUID()]);
});afterEach(()=>q('rollback'));

const {normalize}=require('../../netlify/lib/repdb.cjs'),source=require('../../netlify/private-repdb/exercises.json').exercises;
const sample=()=>normalize(source.find(r=>r.id==='goblet-squat')||source.find(r=>r.name_en.toLowerCase().includes('squat')));
const imported=async(row=sample(),action='import',who=owner)=>(await actor(null,'select public.exercise_library_server($1,$2,$3,$4) result',[who,action,row,fitness],'service_role')).rows[0].result;
test('Owner/Admin source import publishes existing UUID/methodology; repeat prevents duplicates',async()=>{const a=await imported();const b=await imported();assert.equal(a.id,b.id);assert.equal(a.status,'published');assert.equal(a.methodology_id,fitness);assert.equal(await val('select count(*)::int from exercise_catalog'),1);const x=await imported(normalize(source.find(r=>r.id!==a.provider_exercise_id)), 'import',admin);assert.notEqual(x.id,a.id);});
test('same named variations with different stable IDs remain separate',async()=>{const a=sample(),b={...sample(),id:'other-squat-variation'};const x=await imported(a),y=await imported(b);assert.notEqual(x.id,y.id);assert.notEqual(x.name,y.name);assert.equal(y.exercise_source.name,b.name);});
test('Coach with learning.manage, member, inactive and null cannot import; RPC browser bypass denied',async()=>{for(const who of [coach,member,inactive,null])await assert.rejects(imported(sample(),'import',who),/Owner\/Admin/);await assert.rejects(actor(owner,"select public.exercise_library_server($1,'authorize')",[owner]),/permission denied/);await assert.rejects(actor(null,"select public.exercise_library_server($1,'authorize')",[owner],'anon'),/permission denied/);});
test('source forgery, imported Coach mutations and invalid taxonomy are denied',async()=>{const a=await imported();await assert.rejects(actor(owner,"update exercise_catalog set exercise_source='{}' where id=$1",[a.id]),/protected exercise refresh/);await assert.rejects(actor(coach,"update exercise_catalog set name='Bad' where id=$1",[a.id]),/Owner\/Admin/);assert.equal((await actor(coach,"delete from exercise_catalog where id=$1 returning id",[a.id])).rowCount,0);await assert.rejects(actor(owner,"update exercise_catalog set rva_muscles=array['unknown'] where id=$1",[a.id]),/exercise_rva_muscles/);});
test('local muscles/movement/cues/notes/name/approval survive source version refresh',async()=>{const a=await imported();await actor(owner,"update exercise_catalog set name='Local override',rva_muscles=array['Neck'],functional_movement='Squat',coaching_cues='Local cue',restriction_notes='Local note',revitalized_approved=true where id=$1",[a.id]);const next={...sample(),version:'b'.repeat(40),name:'Updated source',instructions:['Updated provider steps']};const b=await imported(next,'refresh');assert.equal(b.id,a.id);assert.equal(b.name,'Local override');assert.equal(b.revitalized_approved,true);assert.deepEqual(b.rva_muscles,['Neck']);assert.equal(b.functional_movement,'Squat');assert.equal(b.coaching_cues,'Local cue');assert.equal(b.restriction_notes,'Local note');assert.equal(b.exercise_source.name,'Updated source');assert.equal(b.exercise_source_version,next.version);assert.equal(await val("select count(*)::int from private.exercise_source_audit where action='refresh'"),1);});
test('custom exercise coexists; allowed custom authoring preserved and approval independently gated',async()=>{const a=await imported();const custom=(await actor(owner,"insert into exercise_catalog(methodology_id,name,category,rva_muscles,functional_movement,coaching_cues) values($1,'Custom','strength',array['Shoulders'],'Push','Custom cue') returning *",[fitness])).rows[0];assert.equal(custom.exercise_provider,null);assert.equal(custom.coaching_cues,'Custom cue');await assert.rejects(actor(coach,"update exercise_catalog set revitalized_approved=true where id=$1",[custom.id]),/Owner\/Admin/);await actor(admin,"update exercise_catalog set revitalized_approved=true where id=$1",[custom.id]);assert.notEqual(a.id,custom.id);});
test('published import integrates with workout fields and 12-week/ongoing programs',async()=>{const a=await imported();const workout=(await actor(owner,"insert into workout_templates(methodology_id,title,category,environment,status) values($1,'Local Workout','strength','either','published') returning id",[fitness])).rows[0].id;await actor(owner,"insert into workout_template_exercises(workout_id,exercise_id,sort_order,sets,reps,duration_seconds,rest_seconds,notes) values($1,$2,0,3,8,60,30,'Own cue')",[workout,a.id]);for(const weeks of [4,12,null]){const program=(await actor(owner,"insert into fitness_programs(methodology_id,title,weeks,environment) values($1,'Local Program',$2,'either') returning id",[fitness,weeks])).rows[0].id;await actor(owner,'insert into fitness_program_workouts(program_id,workout_id,week_number,day_number) values($1,$2,1,1)',[program,workout]);}await imported({...sample(),version:'c'.repeat(40)},'refresh');assert.equal(await val('select exercise_id from workout_template_exercises'),a.id);assert.equal(await val('select notes from workout_template_exercises'),'Own cue');assert.equal(await val('select count(*)::int from fitness_program_workouts'),3);});
test('malformed source/schema/MET and no source record refresh fail closed',async()=>{for(const row of [{...sample(),id:'../bad'},{...sample(),provider:'other'},{...sample(),name:null},{...sample(),instructions:null}])await assert.rejects(imported(row),/Invalid RepDB/);await assert.rejects(imported(sample(),'refresh'),/Import this exercise first/);assert.equal(await val('select count(*)::int from exercise_catalog'),0);});

test('real push/pull/hinge/lunge provider variants retain source metadata without inferred movement',async()=>{for(const term of ['push-up','row','deadlift','lunge']){const raw=source.find(r=>r.id.includes(term));assert.ok(raw,term);const src=normalize(raw),x=await imported(src);assert.equal(x.provider_exercise_id,raw.id);assert.deepEqual(x.equipment,src.equipment);assert.equal(x.functional_movement,null);assert.equal(x.exercise_source.met,src.met);assert.deepEqual(x.exercise_source.instructions,src.instructions);}});

test('partial source identity with SQL null cannot bypass paired provenance constraint',async()=>{for(const [fields,v] of [["exercise_provider,provider_exercise_id","'repdb','goblet-squat'"],["exercise_provider,exercise_source_version","'repdb','"+'a'.repeat(40)+"'"],["exercise_provider,provider_exercise_id","null,'goblet-squat'"],["exercise_provider,exercise_source_version","null,'"+'a'.repeat(40)+"'"]]){await assert.rejects(q("savepoint partial").then(()=>q("insert into exercise_catalog(methodology_id,name,category,"+fields+") values($1,'Invalid partial','strength',"+v+")",[fitness])),/exercise_repdb_pair/);await q('rollback to partial');await q('release partial');}});

test('multiple real squat variations keep separate canonical IDs and approved mapping',async()=>{const variants=source.filter(x=>x.id.includes('squat')).slice(0,3);assert.equal(variants.length,3);const ids=[];for(const raw of variants){const a=await imported(normalize(raw));ids.push(a.id);assert.equal(a.provider_exercise_id,raw.id);assert.deepEqual(a.rva_muscles,normalize(raw).rva_muscles);assert.equal((await imported(normalize(raw))).id,a.id);}assert.equal(new Set(ids).size,3);});


// DELETE-contract regressions: same local-only fixture and transaction rollback as above.
async function archiveSourceAudit(exerciseId){
 const evidence=(await q('select * from private.exercise_source_audit where exercise_id=$1 order by id',[exerciseId])).rows;
 assert.ok(evidence.length>0,'preserve audit evidence before disposable cleanup');
 await q('delete from private.exercise_source_audit where exercise_id=$1',[exerciseId]);
 return evidence;
}
async function attemptBlockedDelete(who,id,role='authenticated'){
 try{assert.equal((await actor(who,'delete from public.exercise_catalog where id=$1 returning id',[id],role)).rowCount,0);}
 catch(e){assert.equal(e.code,'42501');}
 assert.equal(await val('select count(*)::int from public.exercise_catalog where id=$1',[id]),1);
}
test('DELETE repair retains BEFORE ROW INSERT/UPDATE/DELETE trigger, invoker and empty search path',async()=>{
 const t=(await q("select tgtype,tgenabled from pg_trigger where tgname='exercise_source_guard' and tgrelid='public.exercise_catalog'::regclass")).rows[0];
 assert.equal(t.tgtype,31);assert.equal(t.tgenabled,'O');
 const p=(await q("select prosecdef,proconfig,has_function_privilege('authenticated',oid,'EXECUTE') browser_exec,has_function_privilege('anon',oid,'EXECUTE') anon_exec from pg_proc where oid='private.guard_exercise_source()'::regprocedure")).rows[0];
 assert.equal(p.prosecdef,false);assert.deepEqual(p.proconfig,['search_path=""']);assert.equal(p.browser_exec,false);assert.equal(p.anon_exec,false);
 // Beta has an existing restrictive ALL gate; it does not grant DELETE access.
 assert.equal(await val("select count(*)::int from pg_policies where schemaname='public' and tablename='exercise_catalog' and permissive='PERMISSIVE' and cmd in ('DELETE','ALL')"),0);
});
test('privileged postgres DELETE succeeds after explicit audit retention and bounded beta mapping cleanup',async()=>{
 const a=await imported(),other=await imported({...sample(),id:'unrelated-repdb-fixture',name:'Unrelated Fixture'});
 const otherHash=await val('select md5(to_jsonb(e)::text) from public.exercise_catalog e where id=$1',[other.id]);
 const mapping=await val("select to_regclass('public.production_content_sources') is not null");
 let sourceId,otherSourceId;
 if(mapping){
  sourceId=randomUUID();otherSourceId=randomUUID();
  await q("insert into public.production_content_sources(content_type,source_id,target_id,source_version,exported_at) values('exercise_catalog',$1,$2,'fixture',now()),('exercise_catalog',$3,$4,'fixture',now())",[sourceId,a.id,otherSourceId,other.id]);
 }
 const evidence=await archiveSourceAudit(a.id);assert.equal(evidence[0].exercise_id,a.id);
 if(mapping)assert.equal((await q("delete from public.production_content_sources where content_type='exercise_catalog' and source_id=$1 and target_id=$2",[sourceId,a.id])).rowCount,1);
 assert.equal((await q('delete from public.exercise_catalog where id=$1 returning id',[a.id])).rowCount,1);
 assert.equal(await val('select count(*)::int from public.exercise_catalog where id=$1',[a.id]),0);
 assert.equal(await val('select count(*)::int from private.exercise_source_audit where exercise_id=$1',[a.id]),0);
 assert.equal(await val('select md5(to_jsonb(e)::text) from public.exercise_catalog e where id=$1',[other.id]),otherHash);
 if(mapping){assert.equal(await val('select count(*)::int from public.production_content_sources where source_id=$1',[sourceId]),0);assert.equal(await val('select target_id from public.production_content_sources where source_id=$1',[otherSourceId]),other.id);}
});
test('service_role DELETE returns OLD and removes the disposable import after privileged audit cleanup',async()=>{
 const a=await imported();await archiveSourceAudit(a.id);
 assert.equal((await actor(null,'delete from public.exercise_catalog where id=$1 returning id',[a.id],'service_role')).rowCount,1);
 assert.equal(await val('select count(*)::int from public.exercise_catalog where id=$1',[a.id]),0);
});
test('source audit FK still blocks unaudited DELETE rather than deleting evidence implicitly',async()=>{
 const a=await imported();await q('savepoint protected_audit');
 await assert.rejects(q('delete from public.exercise_catalog where id=$1',[a.id]),e=>e.code==='23503');
 await q('rollback to protected_audit');await q('release protected_audit');
 assert.equal(await val('select count(*)::int from public.exercise_catalog where id=$1',[a.id]),1);
 assert.equal(await val('select count(*)::int from private.exercise_source_audit where exercise_id=$1',[a.id]),1);
});
test('methodology FK CASCADE removes only its disposable exercises, never unrelated workout/program content',async()=>{
 const a=await imported();await archiveSourceAudit(a.id);
 await q("insert into public.exercise_catalog(methodology_id,name,category) values($1,'Same disposable methodology custom','strength')",[fitness]);
 const elsewhere=await val("insert into public.fitness_methodologies(methodology_key,name) values($1,'Unrelated Methodology') returning id",[randomUUID()]);
 const workout=await val("insert into public.workout_templates(methodology_id,title) values($1,'Unrelated Workout') returning id",[elsewhere]);
 const program=await val("insert into public.fitness_programs(methodology_id,title,weeks) values($1,'Unrelated Program',4) returning id",[elsewhere]);
 const hashes=(await q('select md5(to_jsonb(w)::text) w,md5(to_jsonb(p)::text) p from public.workout_templates w cross join public.fitness_programs p where w.id=$1 and p.id=$2',[workout,program])).rows[0];
 assert.equal((await q('delete from public.fitness_methodologies where id=$1 returning id',[fitness])).rowCount,1);
 assert.equal(await val('select count(*)::int from public.exercise_catalog where methodology_id=$1',[fitness]),0);
 assert.equal(await val('select count(*)::int from public.exercise_catalog e left join public.fitness_methodologies m on m.id=e.methodology_id where m.id is null'),0);
 assert.deepEqual((await q('select md5(to_jsonb(w)::text) w,md5(to_jsonb(p)::text) p from public.workout_templates w cross join public.fitness_programs p where w.id=$1 and p.id=$2',[workout,program])).rows[0],hashes);
});
test('workout exercise RESTRICT blocks privileged deletion and preserves the referencing workout/program',async()=>{
 const a=await imported();await archiveSourceAudit(a.id);
 const workout=await val("insert into public.workout_templates(methodology_id,title) values($1,'Protected Workout') returning id",[fitness]);
 const program=await val("insert into public.fitness_programs(methodology_id,title,weeks) values($1,'Protected Program',4) returning id",[fitness]);
 await q('insert into public.workout_template_exercises(workout_id,exercise_id,sort_order) values($1,$2,0)',[workout,a.id]);
 await q('insert into public.fitness_program_workouts(program_id,workout_id,week_number,day_number) values($1,$2,1,1)',[program,workout]);
 await q('savepoint protected_workout');
 await assert.rejects(q('delete from public.exercise_catalog where id=$1',[a.id]),e=>e.code==='23503');
 await q('rollback to protected_workout');await q('release protected_workout');
 assert.equal(await val('select exercise_id from public.workout_template_exercises where workout_id=$1',[workout]),a.id);
 assert.equal(await val('select workout_id from public.fitness_program_workouts where program_id=$1',[program]),workout);
 assert.equal(await val('select count(*)::int from public.fitness_programs where id=$1',[program]),1);
});
test('exercise restriction FK CASCADE operates on local disposable fixture only',async()=>{
 const a=await imported();await archiveSourceAudit(a.id);
 const contact=await val("insert into public.contacts(first_name,last_name,email) values('Local','Delete Fixture',$1) returning id",[randomUUID()+'@example.invalid']);
 const restriction=await val("insert into public.client_exercise_restrictions(contact_id,exercise_id,restriction_type) values($1,$2,'avoid') returning id",[contact,a.id]);
 assert.equal((await q('delete from public.exercise_catalog where id=$1 returning id',[a.id])).rowCount,1);
 assert.equal(await val('select count(*)::int from public.client_exercise_restrictions where id=$1',[restriction]),0);
 assert.equal(await val('select count(*)::int from public.contacts where id=$1',[contact]),1);
});
test('DELETE policies stay closed for Owner/Admin, unauthorized staff, members and anonymous',async()=>{
 const a=await imported();await archiveSourceAudit(a.id);
 for(const who of [owner,admin,coach,support,inactive,pending,member])await attemptBlockedDelete(who,a.id);
 await attemptBlockedDelete(null,a.id,'anon');
});
test('Archive remains Owner lifecycle UPDATE and leaves source provenance/audit intact',async()=>{
 const a=await imported();const before=await val('select md5(exercise_source::text) from public.exercise_catalog where id=$1',[a.id]);
 assert.equal((await actor(owner,"update public.exercise_catalog set status='archived' where id=$1 returning id",[a.id])).rowCount,1);
 assert.equal(await val('select status from public.exercise_catalog where id=$1',[a.id]),'archived');
 assert.equal(await val('select md5(exercise_source::text) from public.exercise_catalog where id=$1',[a.id]),before);
 assert.equal(await val('select count(*)::int from private.exercise_source_audit where exercise_id=$1',[a.id]),1);
 assert.equal((await actor(owner,"update public.exercise_catalog set status='published' where id=$1 returning id",[a.id])).rowCount,1);
});
