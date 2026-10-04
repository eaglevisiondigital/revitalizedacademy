const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const metadata = require('../../supabase/baselines/2026-09-26/metadata.json');
if (!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE || '')) throw Error('Disposable local database required');
if (!['127.0.0.1','localhost','/private/tmp','/tmp'].includes(process.env.PGHOST || '')) throw Error('Loopback host required');
const db = new Client();
const q = (s, p = []) => db.query(s, p);
const val = async (s, p) => Object.values((await q(s, p)).rows[0])[0];
let owner, member, other, contact, otherContact, scoped, support, method, fitMethod, recipe, mealTemplate, exercise, workout, program, mealPlan, fitnessPlan, mealItem, workoutItem, clients;
async function act(uid, sql, params = [], role = 'authenticated') {
  await q('SAVEPOINT diary_actor');
  try {
    await q('SET LOCAL ROLE ' + role);
    await q("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)", [uid || '', role]);
    const r = await q(sql, params);
    await q('RESET ROLE');
    await q("SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','',true)");
    await q('RELEASE SAVEPOINT diary_actor');
    return r;
  } catch (e) { await q('ROLLBACK TO SAVEPOINT diary_actor'); await q('RELEASE SAVEPOINT diary_actor'); throw e; }
}
const rpc = async (uid, sql, params) => Object.values((await act(uid, sql, params)).rows[0])[0];
async function user(label) {
  const id = randomUUID();
  await q('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())', [id, `${label}-${id}@example.invalid`]);
  return id;
}
async function paid(uid) {
  const cid = await val('SELECT contact_id FROM public.profiles WHERE user_id=$1', [uid]);
  const code = 'diary-' + randomUUID();
  await q("INSERT INTO public.program_catalog(program_code,name,program_type) VALUES($1,'Synthetic diary program','membership')", [code]);
  await q("INSERT INTO public.journey_definitions(journey_key,name,audience) VALUES($1,'Synthetic diary','client')", [code]);
  const journey = await val('INSERT INTO public.contact_journeys(contact_id,journey_key) VALUES($1,$2) RETURNING id', [cid, code]);
  const activation = await val("INSERT INTO public.journey_enrollment_activations(contact_id,journey_id,program_code,program_name,amount_cents,created_by) VALUES($1,$2,$3,'Synthetic diary',100,$4) RETURNING id", [cid, journey, code, owner]);
  // Privileged fixture setup only: explicit synthetic agreement waiver, real test ledger payment.
  await q("UPDATE public.client_access SET user_id=$1,needs_onboarding_claim=false WHERE contact_id=$2", [uid, cid]);
  await q("UPDATE public.journey_enrollment_activations SET agreement_status='waived' WHERE id=$1", [activation]);
  await q("INSERT INTO public.payment_records(contact_id,activation_id,amount_cents,payment_method,recorded_by) VALUES($1,$2,100,'cash',$3)", [cid, activation, owner]);
  assert.equal(await rpc(uid, 'SELECT public.member_paid_access_allowed()'), true);
  return cid;
}
before(async () => {
  await db.connect();
  for (const p of metadata.permission_catalog) {
    const keys = Object.keys(p);
    await q('INSERT INTO public.staff_permission_catalog(' + keys.join(',') + ') VALUES(' + keys.map((_, i) => '$' + (i + 1)).join(',') + ') ON CONFLICT DO NOTHING', Object.values(p));
  }
  for (const r of metadata.permission_defaults) await q('INSERT INTO public.staff_role_permission_defaults(role,permission_key,allowed) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [r.role, r.permission_key, r.allowed]);
});
after(() => db.end());

beforeEach(async()=>{
 await q('BEGIN');
 await q("INSERT INTO public.progress_metric_catalog(metric_key,label,category,unit) VALUES('nutrition_adherence','Nutrition adherence','nutrition','%') ON CONFLICT DO NOTHING");owner=await user('owner');scoped=await user('scoped');support=await user('support');
 await q("INSERT INTO public.staff_access(user_id,role,contact_scope,onboarding_status) VALUES($1,'owner','all','complete'),($2,'coach','assigned','complete'),($3,'support','all','complete')",[owner,scoped,support]);
 // Coach NDA completion is a local fixture precondition; never a hosted grant.
 await q("UPDATE public.staff_access SET onboarding_status='complete' WHERE user_id=$1",[scoped]);
 clients=[];for(let i=0;i<6;i++){const uid=await user('beta'+i);clients.push({uid,cid:await paid(uid)});}
 ({uid:member,cid:contact}=clients[0]);({uid:other,cid:otherContact}=clients[1]);
 await q('UPDATE public.contacts SET assigned_to=$1 WHERE id=$2',[scoped,contact]);
 await q("INSERT INTO public.membership_entitlements(membership_id,entitlement_key,label) SELECT membership_id,k,k FROM public.client_access CROSS JOIN unnest(ARRAY['nutrition_plans','fitness_plans']) k WHERE contact_id=ANY($1::uuid[]) ON CONFLICT DO NOTHING",[clients.map(x=>x.cid)]);
 method=await val("INSERT INTO public.nutrition_methodologies(methodology_key,name,status) VALUES($1,'Synthetic beta','published') RETURNING id",['beta-'+randomUUID()]);
 fitMethod=await val("INSERT INTO public.fitness_methodologies(methodology_key,name,status) VALUES($1,'Synthetic beta','published') RETURNING id",['beta-'+randomUUID()]);
 recipe=await val("INSERT INTO public.recipes(methodology_id,title,status,instructions,servings,nutrition) VALUES($1,'Synthetic meal','published','Mix carefully',2,'{\"energy_kcal\":0}') RETURNING id",[method]);
 await q("INSERT INTO public.recipe_ingredients(recipe_id,ingredient,quantity,unit) VALUES($1,'Synthetic ingredient',2,'cup')",[recipe]);
 mealTemplate=await val("INSERT INTO public.meal_plan_templates(methodology_id,title,status,days_count) VALUES($1,'Synthetic meals','published',2) RETURNING id",[method]);
 await q("INSERT INTO public.meal_plan_template_items(template_id,day_number,meal_slot,recipe_id) VALUES($1,1,'dinner',$2)",[mealTemplate,recipe]);
 exercise=await val("INSERT INTO public.exercise_catalog(methodology_id,name,category,status,instructions) VALUES($1,'Synthetic exercise','strength','published','Move safely') RETURNING id",[fitMethod]);
 workout=await val("INSERT INTO public.workout_templates(methodology_id,title,status) VALUES($1,'Synthetic workout','published') RETURNING id",[fitMethod]);
 await q("INSERT INTO public.workout_template_exercises(workout_id,exercise_id,sets,reps,rest_seconds) VALUES($1,$2,2,'8',30)",[workout,exercise]);
 program=await val("INSERT INTO public.fitness_programs(methodology_id,title,status,weeks) VALUES($1,'Synthetic fitness','published',1) RETURNING id",[fitMethod]);
 await q("INSERT INTO public.fitness_program_workouts(program_id,week_number,day_number,workout_id) VALUES($1,1,1,$2)",[program,workout]);
 mealPlan=await rpc(owner,'SELECT public.assign_meal_plan_template($1,$2,current_date)',[contact,mealTemplate]);
 fitnessPlan=await rpc(owner,'SELECT public.assign_fitness_program($1,$2,current_date)',[contact,program]);
 mealItem=await val('SELECT id FROM public.client_meal_plan_items WHERE meal_plan_id=$1',[mealPlan]);
 workoutItem=await val('SELECT id FROM public.client_workout_assignments WHERE fitness_plan_id=$1',[fitnessPlan]);
});
afterEach(()=>q('ROLLBACK'));
for(const table of ['client_meal_plans','client_meal_plan_items','client_fitness_plans','client_workout_assignments']){
 test('beta scoped staff cannot read other client '+table,async()=>{assert.equal((await act(scoped,'SELECT * FROM public.'+table+' WHERE contact_id=$1',[contact])).rowCount,1);await q('UPDATE public.contacts SET assigned_to=null WHERE id=$1',[contact]);assert.equal((await act(scoped,'SELECT * FROM public.'+table)).rowCount,0);});
 test('beta ordinary support cannot read private '+table,async()=>{assert.equal((await act(support,'SELECT * FROM public.'+table)).rowCount,0);});
 test('beta six member identities isolated in '+table,async()=>{for(const [i,c]of clients.entries())assert.equal((await act(c.uid,'SELECT * FROM public.'+table)).rowCount,i===0?1:0);});
}
for(const [fn,id]of [['assign_meal_plan_template','meal'],['assign_fitness_program','fitness']]){
 test('beta scoped assignment cannot cross client: '+fn,async()=>{await assert.rejects(rpc(scoped,'SELECT public.'+fn+'($1,$2,current_date)',[otherContact,id==='meal'?mealTemplate:program]),/permission|scope|denied|row.level/i);});
 test('beta support cannot assign without health management: '+fn,async()=>{await assert.rejects(rpc(support,'SELECT public.'+fn+'($1,$2,current_date)',[contact,id==='meal'?mealTemplate:program]),/permission|scope|denied|row.level/i);});
 test('beta permitted scoped operator can assign: '+fn,async()=>{assert(await rpc(scoped,'SELECT public.'+fn+'($1,$2,current_date)',[contact,id==='meal'?mealTemplate:program]));});
}
for(const [kind,item]of [['meal','meal'],['workout','workout']]){
 test('beta member '+kind+' details use own assignment and return usable content',async()=>{const data=await rpc(member,'SELECT public.get_my_assigned_'+kind+'($1)',[item==='meal'?mealItem:workoutItem]);assert.match(JSON.stringify(data),/Synthetic/);assert.match(JSON.stringify(data),item==='meal'?/Mix carefully/:/Move safely/);});
 test('beta other member cannot read '+kind+' detail by supplied ID',async()=>{await assert.rejects(rpc(other,'SELECT public.get_my_assigned_'+kind+'($1)',[item==='meal'?mealItem:workoutItem]),/unavailable|denied|access/i);});
 test('beta revoked member cannot read '+kind+' detail',async()=>{await q("UPDATE public.client_access SET status='inactive' WHERE contact_id=$1",[contact]);await assert.rejects(rpc(member,'SELECT public.get_my_assigned_'+kind+'($1)',[item==='meal'?mealItem:workoutItem]),/unavailable|denied|access/i);});
}
test('beta member cannot repoint a meal assignment to another recipe',async()=>{await assert.rejects(act(member,"UPDATE public.client_meal_plan_items SET recipe_id=null,custom_title='tampered' WHERE id=$1",[mealItem]),/protected|assignment|permission/i);});
test('beta member cannot move a workout assignment to another plan',async()=>{await assert.rejects(act(member,"UPDATE public.client_workout_assignments SET fitness_plan_id=null WHERE id=$1",[workoutItem]),/protected|assignment|permission/i);});
test('beta authorized member completion preserves existing completion path',async()=>{assert.equal((await act(member,"UPDATE public.client_meal_plan_items SET status='completed',adherence_percent=100,completed_at=now() WHERE id=$1 RETURNING id",[mealItem])).rowCount,1);});
for(const [table,sql,args]of [
 ['meal_plan_template_items',"INSERT INTO public.meal_plan_template_items(template_id,day_number,meal_slot,recipe_id) VALUES($1,2,'lunch',$2)",()=>[mealTemplate,recipe]],
 ['workout_template_exercises',"INSERT INTO public.workout_template_exercises(workout_id,exercise_id,sets,sort_order) VALUES($1,$2,3,101)",()=>[workout,exercise]],
 ['fitness_program_workouts',"INSERT INTO public.fitness_program_workouts(program_id,week_number,day_number,workout_id) VALUES($1,1,2,$2)",()=>[program,workout]]])test('beta content child write requires learning.manage: '+table,async()=>{await assert.rejects(act(support,sql,args()),/permission|row.level/i);await act(owner,sql,args());});
test('beta inactive staff loses all assignment data',async()=>{await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1",[scoped]);assert.equal((await act(scoped,'SELECT * FROM public.client_meal_plans')).rowCount,0);});
test('beta grocery rows inherit client scope and member checkbox-only writes',async()=>{const id=await rpc(scoped,'SELECT public.generate_grocery_list_for_meal_plan($1)',[mealPlan]);assert(id);const item=await val('SELECT id FROM public.grocery_list_items WHERE grocery_list_id=$1',[id]);assert.equal((await act(support,'SELECT * FROM public.grocery_list_items')).rowCount,0);assert.equal((await act(other,'SELECT * FROM public.grocery_list_items')).rowCount,0);assert.equal((await act(member,'UPDATE public.grocery_list_items SET checked=true WHERE id=$1 RETURNING id',[item])).rowCount,1);await assert.rejects(act(member,"UPDATE public.grocery_list_items SET item='tampered' WHERE id=$1",[item]),/Protected/);});
test('beta membership entitlement removal denies assignment details and raw rows',async()=>{await q("UPDATE public.membership_entitlements SET status='inactive' WHERE membership_id=(SELECT membership_id FROM public.client_access WHERE contact_id=$1)",[contact]);assert.equal((await act(member,'SELECT * FROM public.client_meal_plan_items')).rowCount,0);await assert.rejects(rpc(member,'SELECT public.get_my_assigned_workout($1)',[workoutItem]),/unavailable/);});
test('beta assignment rejects empty or unpublished content without replacing existing plan',async()=>{await q("UPDATE public.recipes SET status='draft' WHERE id=$1",[recipe]);await assert.rejects(rpc(owner,'SELECT public.assign_meal_plan_template($1,$2,current_date)',[contact,mealTemplate]),/unavailable/);assert.equal(await val('SELECT status FROM public.client_meal_plans WHERE id=$1',[mealPlan]),'active');await q('DELETE FROM public.workout_template_exercises WHERE workout_id=$1',[workout]);await assert.rejects(rpc(owner,'SELECT public.assign_fitness_program($1,$2,current_date)',[contact,program]),/empty/);assert.equal(await val('SELECT status FROM public.client_fitness_plans WHERE id=$1',[fitnessPlan]),'active');});
test('beta completion cannot reference another client assignment',async()=>{await assert.rejects(act(other,'INSERT INTO public.workout_completions(assignment_id,contact_id) VALUES($1,$2)',[workoutItem,otherContact]),/mismatch/);});
test('beta email identity has case-insensitive duplicate protection',async()=>{const email=await val('SELECT email FROM public.contacts WHERE id=$1',[contact]);await assert.rejects(act(owner,"INSERT INTO public.contacts(first_name,last_name,email) VALUES('Synthetic','Duplicate',$1)",[email.toUpperCase()]),/unique|duplicate/);});
