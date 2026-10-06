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
const insertRecipe=async()=> (await actor(owner,"insert into public.recipes(methodology_id,title,servings) values($1,'Local Recipe',2) returning id",[nutrition])).rows[0].id;
const insertFood=async(json={energy_kcal:100,protein_g:10})=>(await actor(owner,"insert into public.food_catalog(methodology_id,name,active,nutrition,serving_size,serving_unit,grams_per_serving) values($1,$3,false,$2,1,'cup',50) returning id",[nutrition,json,randomUUID()])).rows[0].id;
test('101 active nutrient definitions; no client-target/diary schema is promoted',async()=>{
 assert.equal(Number(await val('select count(*) from public.nutrition_nutrient_catalog where active')),101);
 assert.equal(await val("select to_regclass('public.nutrition_diary_items')"),null);assert.equal(await val("select to_regclass('public.client_nutrient_targets')"),null);
});
test('Owner/Admin and approved Coach content permission succeeds; inactive override/pending denied',async()=>{
 for(const u of [owner,admin,coach])assert.equal((await actor(u,'select private.can_author_durable_content() allowed')).rows[0].allowed,true);
 for(const u of [support,inactive,pending,member])assert.equal((await actor(u,'select private.can_author_durable_content() allowed')).rows[0].allowed,false);
});
test('explicit deny override takes precedence over role default',async()=>{
 await q('insert into public.staff_permission_overrides(user_id,permission_key,allowed,updated_by) values($1,$2,false,$3)',[coach,'learning.manage',owner]);
 await assert.rejects(actor(coach,"insert into public.food_catalog(methodology_id,name) values($1,'Denied')",[nutrition]),/row-level security/);
});
for(const [table,field,kind]of [['food_catalog','name','nutrition'],['recipes','title','nutrition'],['meal_plan_templates','title','nutrition'],['exercise_catalog','name','fitness'],['workout_templates','title','fitness'],['fitness_programs','title','fitness']]){
 test(table+' create/edit/publish-or-activate/archive persistence and protected browser writes',async()=>{
  const extra=table==='exercise_catalog'?",category":'';const extraValue=table==='exercise_catalog'?",'strength'":'';
  const id=(await actor(owner,`insert into public.${table}(methodology_id,${field}${extra}) values($1,'Original'${extraValue}) returning id`,[kind==='nutrition'?nutrition:fitness])).rows[0].id;
  await actor(admin,`update public.${table} set ${field}='Edited' where id=$1`,[id]);
  assert.equal((await actor(owner,`select ${field} from public.${table} where id=$1`,[id])).rows[0][field],'Edited');
  const lifecycle=table==='food_catalog'?'active':'status';const published=table==='food_catalog'?true:'published';const archived=table==='food_catalog'?false:'archived';
  await actor(owner,`update public.${table} set ${lifecycle}=$2 where id=$1`,[id,published]);
  assert.equal((await actor(owner,`select ${lifecycle} from public.${table} where id=$1`,[id])).rows[0][lifecycle],published);
  await actor(owner,`update public.${table} set ${lifecycle}=$2 where id=$1`,[id,archived]);
  assert.equal((await actor(owner,`select ${lifecycle} from public.${table} where id=$1`,[id])).rows[0][lifecycle],archived);
  for(const u of [support,inactive,pending,member]){
   assert.equal((await actor(u,`select * from public.${table} where id=$1`,[id])).rowCount,0);
   assert.equal((await actor(u,`update public.${table} set ${field}='Bad' where id=$1 returning id`,[id])).rowCount,0);
   await assert.rejects(actor(u,`insert into public.${table}(methodology_id,${field}${extra}) values($1,'Bad'${extraValue})`,[kind==='nutrition'?nutrition:fitness]),/row-level security/);
  }
  await assert.rejects(actor(null,`insert into public.${table}(methodology_id,${field}${extra}) values($1,'Bad'${extraValue})`,[kind==='nutrition'?nutrition:fitness],'anon'),/permission denied|row-level security/);
 });
}
test('member can read published reusable library but not drafts or authoring mutations',async()=>{
 const id=await insertRecipe();await actor(owner,"update public.recipes set status='published' where id=$1",[id]);
 assert.equal((await actor(member,'select * from public.recipes where id=$1',[id])).rowCount,1);
 assert.equal((await actor(member,"update public.recipes set title='Bad' where id=$1 returning id",[id])).rowCount,0);
});
test('methodology philosophy edits retain existing keys/guidance and no guidance is seeded',async()=>{
 await actor(owner,"update public.nutrition_methodologies set philosophy='Approved owner content',version='1.1' where id=$1",[nutrition]);
 assert.equal((await actor(owner,'select philosophy from public.nutrition_methodologies where id=$1',[nutrition])).rows[0].philosophy,'Approved owner content');
 assert.equal(await val("select count(*)::int from public.nutrition_methodologies where methodology_key='the-living-diet'"),0);
});
test('recipe sums only measured numeric JSON; JSON null and non-numeric cannot erase totals',async()=>{
 const recipe=await insertRecipe(),first=await insertFood(),second=await insertFood({energy_kcal:null,protein_g:0,fiber_g:'bad',sugars_g:true});
 for(const f of [first,second])await actor(owner,"insert into public.recipe_ingredients(recipe_id,food_id,ingredient,quantity,unit) values($1,$2,'Ingredient',2,'servings')",[recipe,f]);
 const result=(await actor(owner,'select public.recalculate_recipe_nutrition($1) result',[recipe])).rows[0].result;
 assert.deepEqual(result.recipe_total,{energy_kcal:200,protein_g:20});assert.deepEqual(result.nutrition_per_serving,{energy_kcal:100,protein_g:10});assert.equal(result.complete,true);
});
test('incomplete ingredient clears prior snapshot/multiplier and calculation is incomplete',async()=>{
 const recipe=await insertRecipe(),food=await insertFood();
 const id=(await actor(owner,"insert into public.recipe_ingredients(recipe_id,food_id,ingredient,weight_grams) values($1,$2,'Ingredient',100) returning id",[recipe,food])).rows[0].id;
 await actor(owner,'select public.recalculate_recipe_nutrition($1)',[recipe]);
 await actor(owner,'update public.recipe_ingredients set food_id=null where id=$1',[id]);
 const result=(await actor(owner,'select public.recalculate_recipe_nutrition($1) result',[recipe])).rows[0].result;assert.equal(result.complete,false);
 const row=(await actor(owner,'select calculation_basis,nutrition_multiplier,nutrition_snapshot from public.recipe_ingredients where id=$1',[id])).rows[0];assert.deepEqual(row,{calculation_basis:null,nutrition_multiplier:null,nutrition_snapshot:{}});
});
test('empty/non-object nutrient data produces no fabricated total or complete result',async()=>{
 const recipe=await insertRecipe(),food=await insertFood([]);await actor(owner,"insert into public.recipe_ingredients(recipe_id,food_id,ingredient,quantity,unit) values($1,$2,'Ingredient',1,'servings')",[recipe,food]);
 const r=(await actor(owner,'select public.recalculate_recipe_nutrition($1) r',[recipe])).rows[0].r;assert.equal(r.complete,false);assert.deepEqual(r.recipe_total,{});
 await actor(owner,'delete from public.recipe_ingredients where recipe_id=$1',[recipe]);
 assert.equal((await actor(owner,'select public.recalculate_recipe_nutrition($1) r',[recipe])).rows[0].r.complete,false);
});
test('calculator RPC denies member/unsupported staff/inactive/pending/anonymous',async()=>{
 const id=await insertRecipe();for(const u of [support,inactive,pending,member])await assert.rejects(actor(u,'select public.recalculate_recipe_nutrition($1)',[id]),/Not authorized/);
 await assert.rejects(actor(null,'select public.recalculate_recipe_nutrition($1)',[id],'anon'),/permission denied/);
});
test('composition author writes and deletion are gated; blank duration and schedule persist',async()=>{
 const recipe=await insertRecipe(),meal=await val("insert into public.meal_plan_templates(methodology_id,title) values($1,'Meal') returning id",[nutrition]);
 const exercise=await val("insert into public.exercise_catalog(methodology_id,name,category) values($1,'Exercise','strength') returning id",[fitness]);
 const workout=await val("insert into public.workout_templates(methodology_id,title) values($1,'Workout') returning id",[fitness]);
 const program=await val("insert into public.fitness_programs(methodology_id,title,weeks) values($1,'Program',12) returning id",[fitness]);
 const sqls=[['meal_plan_template_items',"insert into public.meal_plan_template_items(template_id,recipe_id,day_number,meal_slot,sort_order) values($1,$2,1,'breakfast',0) returning id",[meal,recipe]],['workout_template_exercises',"insert into public.workout_template_exercises(workout_id,exercise_id,sets,reps,duration_seconds,rest_seconds) values($1,$2,3,'10',null,60) returning id",[workout,exercise]],['fitness_program_workouts',"insert into public.fitness_program_workouts(program_id,workout_id,week_number,day_number) values($1,$2,12,7) returning id",[program,workout]]];
 for(const [table,sql,args]of sqls){const id=(await actor(owner,sql,args)).rows[0].id;await assert.rejects(actor(support,sql,args),/row-level security/);assert.equal((await actor(member,`delete from public.${table} where id=$1 returning id`,[id])).rowCount,0);assert.equal((await actor(owner,`delete from public.${table} where id=$1 returning id`,[id])).rowCount,1);}
});
test('all promoted tables retain RLS and definer functions have fixed empty search path',async()=>{
 const rows=(await q("select relname,relrowsecurity from pg_class where relname=any($1)",[['food_catalog','recipes','recipe_ingredients','meal_plan_templates','meal_plan_template_items','exercise_catalog','workout_templates','workout_template_exercises','fitness_programs','fitness_program_workouts','nutrition_methodologies','fitness_methodologies','nutrition_nutrient_catalog']])).rows;
 assert.equal(rows.length,13);assert(rows.every(r=>r.relrowsecurity));
 for(const fn of ['private.can_author_durable_content()','public.recalculate_recipe_nutrition(uuid)'])assert.match(await val('select proconfig::text from pg_proc where oid=$1::regprocedure',[fn]),/search_path=\\"\\"|search_path=""/);
});

test('missing recipe servings never masquerade as per-serving nutrition',async()=>{
 const recipe=await insertRecipe(),food=await insertFood();
 await actor(owner,"insert into public.recipe_ingredients(recipe_id,food_id,ingredient,quantity,unit) values($1,$2,'Ingredient',1,'servings')",[recipe,food]);
 for(const servings of [null]){await actor(owner,'update public.recipes set servings=$2 where id=$1',[recipe,servings]);const r=(await actor(owner,'select public.recalculate_recipe_nutrition($1) r',[recipe])).rows[0].r;assert.deepEqual(r.nutrition_per_serving,{});assert.equal(r.complete,false);assert.deepEqual(r.recipe_total,{energy_kcal:100,protein_g:10});}
});
