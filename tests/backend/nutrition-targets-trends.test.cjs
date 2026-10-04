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
let owner, staff, member, other, contact, otherContact, method, food, recipe, nutrient, today;
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
const day = (uid = member, date = today) => rpc(uid, 'SELECT public.get_my_nutrition_day($1)', [date]);
const sources = (uid = member) => rpc(uid, 'SELECT public.get_my_nutrition_sources()');
const log = (uid = member, type = 'food', id = food, quantity = 1, date = today, slot = 'breakfast') => rpc(uid,
  'SELECT public.log_my_nutrition_item($1,$2,$3,$4,$5,$6)', [date, slot, type, id, quantity, 'Synthetic note']);
const remove = (id, uid = member) => rpc(uid, 'SELECT public.delete_my_nutrition_item($1)', [id]);
const count = async (uid, table) => (await act(uid, `SELECT count(*)::int n FROM public.${table}`)).rows[0].n;
async function user(label) {
  const id = randomUUID();
  await q('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())', [id, `${label}-${id}@example.invalid`]);
  return id;
}
async function permissions(values = {}) {
  for (const key of ['health.private.view', 'plan.override', 'health.progress.manage']) {
    await q("INSERT INTO public.staff_permission_overrides(user_id,permission_key,allowed,updated_by) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,permission_key) DO UPDATE SET allowed=excluded.allowed", [staff, key, !!values[key], owner]);
  }
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
beforeEach(async () => {
  await q('BEGIN');
  today = await val('SELECT current_date::text');
  owner = await user('owner'); staff = await user('scoped'); member = await user('member'); other = await user('other');
  await q("INSERT INTO public.staff_access(user_id,role,contact_scope) VALUES($1,'owner','all'),($2,'admin','assigned')", [owner, staff]);
  contact = await paid(member); otherContact = await paid(other);
  await q('UPDATE public.contacts SET assigned_to=$1 WHERE id=$2', [staff, contact]);
  await permissions();
  method = await val("INSERT INTO public.nutrition_methodologies(methodology_key,name,status) VALUES($1,'Synthetic published method','published') RETURNING id", ['diary-' + randomUUID()]);
  food = await val("INSERT INTO public.food_catalog(methodology_id,name,active,nutrition,serving_size,serving_unit) VALUES($1,'Synthetic food',true,'{\"energy_kcal\":100,\"protein_g\":10,\"fat_g\":0,\"water_g\":50}',2,'cup') RETURNING id", [method]);
  recipe = await val("INSERT INTO public.recipes(methodology_id,title,status,nutrition,servings) VALUES($1,'Synthetic recipe','published','{\"energy_kcal\":80,\"fiber_g\":3}',4) RETURNING id", [method]);
  nutrient = await val("SELECT id FROM public.nutrition_nutrient_catalog WHERE nutrient_key='protein_g'");
  await q("UPDATE public.nutrition_methodologies SET status='draft' WHERE id=$1", [method]);
  const template = await val("INSERT INTO public.meal_plan_templates(methodology_id,title) VALUES($1,'Synthetic targets only') RETURNING id", [method]);
  await q("INSERT INTO public.client_meal_plans(contact_id,template_id,assigned_by,title) VALUES($1,$2,$3,'Synthetic local plan')", [contact,template,owner]);
  await q("INSERT INTO public.nutrition_methodology_targets(methodology_id,nutrient_id,minimum_value,target_value,maximum_value) VALUES($1,$2,60,80,120)", [method,nutrient]);
});
afterEach(() => q('ROLLBACK'));

const targets=(uid=staff,cid=contact)=>rpc(uid,'SELECT public.admin_get_client_nutrition_targets($1)',[cid]);
const trends=(days=7,uid=staff,cid=contact,end=today)=>rpc(uid,'SELECT public.admin_get_client_nutrition_trends($1,$2,$3)',[cid,days,end]);
const setTarget=(uid=staff,cid=contact,min=75,target=100,max=150)=>rpc(uid,'SELECT public.admin_set_client_nutrient_target($1,$2,$3,$4,$5)',[cid,'protein_g',min,target,max]);
const clearTarget=(uid=staff,cid=contact)=>rpc(uid,'SELECT public.admin_clear_client_nutrient_target($1,$2)',[cid,'protein_g']);
const protein=rows=>rows.find(t=>t.nutrient_key==='protein_g');
async function snapshot(offset,values,cid=contact){
  await q("INSERT INTO public.nutrition_diary_items(contact_id,log_date,custom_label,nutrient_snapshot,created_by) VALUES($1,current_date+$2::int,'Isolated target/trend fixture',$3,$4)",[cid,offset,JSON.stringify(values),member]);
}
async function rejectSQL(sql,params,pattern){
  await q('SAVEPOINT expected_failure');
  try{await assert.rejects(q(sql,params),pattern);}finally{await q('ROLLBACK TO SAVEPOINT expected_failure');await q('RELEASE SAVEPOINT expected_failure');}
}

test('targets: schema fields and methodology/nutrient uniqueness',async()=>{
  const cols=(await q("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='nutrition_methodology_targets'")).rows.map(r=>r.column_name);
  for(const name of ['methodology_id','nutrient_id','minimum_value','target_value','maximum_value','active'])assert.ok(cols.includes(name));
  await rejectSQL('INSERT INTO public.nutrition_methodology_targets(methodology_id,nutrient_id) VALUES($1,$2)',[method,nutrient],/duplicate key/);
});
for(const field of ['minimum_value','target_value','maximum_value'])test('targets: negative methodology '+field+' rejected',async()=>{
  await rejectSQL('UPDATE public.nutrition_methodology_targets SET '+field+'=-1 WHERE methodology_id=$1',[method],/check constraint/);
});
test('targets: program default from active assigned methodology, shell stays draft',async()=>{
  await permissions({'health.private.view':true});
  const t=protein(await targets());assert.deepEqual([t.source,t.minimum,t.target,t.maximum],['program',60,80,120]);
  assert.equal(await val('SELECT status FROM public.nutrition_methodologies WHERE id=$1',[method]),'draft');
});
test('targets: scoped override writer succeeds without private read grant',async()=>{
  await permissions({'plan.override':true});
  const id=await setTarget();assert.ok(id);
  assert.equal(await val('SELECT target_value::int FROM public.client_nutrient_targets WHERE id=$1',[id]),100);
  await assert.rejects(targets(),/Not authorized/);
});
test('targets: coach precedence wins over program and newer member target',async()=>{
  await permissions({'plan.override':true,'health.private.view':true});await setTarget();
  await q("INSERT INTO public.client_nutrient_targets(contact_id,nutrient_id,target_value,source,updated_at) VALUES($1,$2,999,'member',now()+interval '1 hour')",[contact,nutrient]);
  const t=protein(await targets());assert.deepEqual([t.source,t.minimum,t.target,t.maximum],['coach',75,100,150]);
});
test('targets: clear override restores program default, member never overrides program',async()=>{
  await permissions({'plan.override':true,'health.private.view':true});await setTarget();
  await q("INSERT INTO public.client_nutrient_targets(contact_id,nutrient_id,target_value,source) VALUES($1,$2,999,'member')",[contact,nutrient]);
  assert.equal(await clearTarget(),true);assert.equal(await clearTarget(),false);
  const t=protein(await targets());assert.deepEqual([t.source,t.minimum,t.target,t.maximum],['program',60,80,120]);
  assert.equal(await val("SELECT active FROM public.client_nutrient_targets WHERE contact_id=$1 AND source='coach'",[contact]),false);
});
test('targets: zero/null survive; repeated save updates same override',async()=>{
  await permissions({'plan.override':true,'health.private.view':true});const id=await setTarget();
  assert.equal(await setTarget(staff,contact,null,0,null),id);
  const t=protein(await targets());assert.deepEqual([t.minimum,t.target,t.maximum],[null,0,null]);
});
for(const field of [0,1,2])test('targets: negative client target position '+field+' rejected',async()=>{
  await permissions({'plan.override':true});const vals=[60,80,120];vals[field]=-1;
  await assert.rejects(setTarget(staff,contact,...vals),/cannot be negative/);
});
for(const kind of ['targets','trends']){
  const read=(uid,cid)=>kind==='targets'?targets(uid,cid):trends(7,uid,cid);
  test(kind+': in-scope private-health reader allowed',async()=>{await permissions({'health.private.view':true});assert.ok(await read(staff,contact));});
  test(kind+': out-of-scope reader denied',async()=>{await permissions({'health.private.view':true});await assert.rejects(read(staff,otherContact),/Not authorized/);});
  test(kind+': override-only reader denied',async()=>{await permissions({'plan.override':true});await assert.rejects(read(staff,contact),/Not authorized/);});
  test(kind+': wellness-management-only reader denied',async()=>{await permissions({'health.progress.manage':true});await assert.rejects(read(staff,contact),/Not authorized/);});
  test(kind+': ordinary member cannot call admin read',async()=>{await assert.rejects(read(member,contact),/Not authorized/);});
  test(kind+': inactive staff reader denied',async()=>{await permissions({'health.private.view':true});await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1",[staff]);await assert.rejects(read(staff,contact),/Not authorized/);});
}
for(const [kind,write] of [['set',setTarget],['clear',clearTarget]]){
  test('targets '+kind+': out-of-scope writer denied',async()=>{await permissions({'plan.override':true});await assert.rejects(write(staff,otherContact),/Not authorized/);});
  test('targets '+kind+': private-health-only writer denied',async()=>{await permissions({'health.private.view':true});await assert.rejects(write(),/Not authorized/);});
  test('targets '+kind+': ordinary member denied',async()=>{await assert.rejects(write(member),/Not authorized/);});
  test('targets '+kind+': inactive staff denied',async()=>{await permissions({'plan.override':true});await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1",[staff]);await assert.rejects(write(),/Not authorized/);});
}
test('trends: 7-day daily aggregation, zero preservation, actual logged-day denominator and bounds',async()=>{
  await permissions({'health.private.view':true});
  await snapshot(0,{energy_kcal:100,protein_g:10,fiber_g:0});await snapshot(0,{energy_kcal:100,protein_g:10});
  await snapshot(-6,{energy_kcal:400,protein_g:40,fiber_g:10});
  await snapshot(-7,{energy_kcal:9999});await snapshot(1,{energy_kcal:9999});await snapshot(0,{energy_kcal:9999},otherContact);
  const t=await trends();assert.equal(t.days,7);assert.equal(t.end_date,today);assert.equal(t.logged_days,2);assert.equal(t.series.length,2);
  assert.deepEqual(t.averages,{energy_kcal:300,protein_g:30,fiber_g:5});assert.equal(t.series[1].totals.energy_kcal,200);
});
test('trends: 30-day range uses only actual logged days and excludes older/future days',async()=>{
  await permissions({'health.private.view':true});
  await snapshot(0,{energy_kcal:100,protein_g:10});await snapshot(-7,{energy_kcal:200,protein_g:20});await snapshot(-29,{energy_kcal:300,protein_g:30});
  await snapshot(-30,{energy_kcal:9999});await snapshot(1,{energy_kcal:9999});
  const t=await trends(30);assert.equal(t.days,30);assert.equal(t.logged_days,3);assert.equal(t.series.length,3);assert.deepEqual(t.averages,{energy_kcal:200,protein_g:20});
});
test('trends: custom end date and empty range never generate missing days',async()=>{
  await permissions({'health.private.view':true});await snapshot(-7,{energy_kcal:200});await snapshot(0,{energy_kcal:999});
  const end=await val("SELECT (current_date-1)::text");const t=await trends(7,staff,contact,end);assert.equal(t.end_date,end);assert.equal(t.logged_days,1);assert.equal(t.averages.energy_kcal,200);
  const empty=await trends(7,staff,contact,await val("SELECT (current_date-50)::text"));assert.equal(empty.logged_days,0);assert.deepEqual(empty.series,[]);assert.deepEqual(empty.averages,{});
});
test('trends: missing/null/non-numeric nutrients omitted; measured zero remains in averages',async()=>{
  await permissions({'health.private.view':true});
  await snapshot(0,{energy_kcal:0,fiber_g:null,protein_g:'',water_g:'50'});await snapshot(-1,{energy_kcal:200,fiber_g:10});
  const t=await trends();assert.equal(t.logged_days,2);assert.deepEqual(t.averages,{energy_kcal:100,fiber_g:10});assert.deepEqual(t.series[1].totals,{energy_kcal:0});
});
test('targets/trends: private helper unavailable and all admin RPCs denied to anonymous',async()=>{
  await assert.rejects(act(member,'SELECT * FROM private.effective_nutrient_targets_for_contact($1)',[contact]),/permission denied/);
  for(const sql of ['SELECT public.admin_get_client_nutrition_targets($1)','SELECT public.admin_get_client_nutrition_trends($1,7,current_date)',"SELECT public.admin_set_client_nutrient_target($1,'protein_g',null,1,null)","SELECT public.admin_clear_client_nutrient_target($1,'protein_g')"]){await assert.rejects(act(null,sql,[contact],'anon'),/permission denied/);}
});
