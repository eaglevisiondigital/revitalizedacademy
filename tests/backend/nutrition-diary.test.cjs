const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const metadata = require('../../supabase/baselines/2026-09-26/metadata.json');
if (!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE || '')) throw Error('Disposable local database required');
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
  await q("INSERT INTO public.client_nutrient_targets(contact_id,nutrient_id,target_value,source) VALUES($1,$3,80,'program'),($2,$3,60,'program')", [contact, otherContact, nutrient]);
});
afterEach(() => q('ROLLBACK'));

test('nutrition: active member self access and only own diary/targets', async () => {
  const id = await log(); await log(other);
  const d = await day(); assert.equal(d.items.length, 1); assert.equal(d.items[0].id, id);
  assert.equal(d.targets.find(t => t.nutrient_key === 'protein_g').target, 80);
  assert.equal(await count(member, 'nutrition_diary_items'), 1); assert.equal(await count(member, 'client_nutrient_targets'), 1);
});
test('nutrition: unrelated member cannot read or delete another diary', async () => {
  const id = await log(); assert.deepEqual((await day(other)).items, []);
  assert.equal(await remove(id, other), false); assert.equal((await day()).items.length, 1);
  assert.equal((await act(other, 'SELECT id FROM public.nutrition_diary_items WHERE id=$1', [id])).rowCount, 0);
  await assert.rejects(act(other, "INSERT INTO public.nutrition_diary_items(contact_id,custom_label,created_by) VALUES($1,'forged',$2)", [contact, other]), /row-level security/);
});
for (const state of ['ready', 'invited', 'onboarding', 'payment_suspended', 'inactive']) test(`nutrition: ${state} lifecycle denied by RPC and table RLS`, async () => {
  const id = await log(); await q('UPDATE public.client_access SET status=$1 WHERE user_id=$2', [state, member]);
  for (const call of [() => day(), () => sources(), () => log(), () => remove(id), () => rpc(member, 'SELECT public.get_my_nutrition_trends(7)')]) await assert.rejects(call(), /Active member access required/);
  assert.equal(await count(member, 'nutrition_diary_items'), 0); assert.equal(await count(member, 'client_nutrient_targets'), 0);
  await assert.rejects(act(member, "INSERT INTO public.nutrition_diary_items(contact_id,custom_label,created_by) VALUES($1,'forged',$2)", [contact, member]), /row-level security/);
});
test('nutrition: unclaimed active account cannot read or log', async () => {
  await q('UPDATE public.client_access SET needs_onboarding_claim=true WHERE user_id=$1', [member]);
  await assert.rejects(day(), /Active member/); assert.equal(await count(member, 'client_nutrient_targets'), 0);
});
test('nutrition: active label without paid enrollment does not confer access', async () => {
  await q('UPDATE public.client_access SET membership_id=null WHERE user_id=$1', [member]);
  await assert.rejects(log(), /Active member/); assert.equal(await count(member, 'client_nutrient_targets'), 0);
});
test('nutrition: scoped private staff read succeeds without target override', async () => {
  await permissions({ 'health.private.view': true }); await log();
  const d = await rpc(staff, 'SELECT public.admin_get_client_nutrition_day($1,$2)', [contact, today]);
  assert.equal(d.items.length, 1); assert.equal(d.totals.energy_kcal, 100);
  assert.equal(await count(staff, 'client_nutrient_targets'), 1);
  assert.equal((await act(staff, 'UPDATE public.client_nutrient_targets SET target_value=1 RETURNING id')).rowCount, 0);
});
test('nutrition: private staff out of scope denied', async () => {
  await permissions({ 'health.private.view': true }); await log(other);
  await assert.rejects(rpc(staff, 'SELECT public.admin_get_client_nutrition_day($1,$2)', [otherContact, today]), /Not authorized/);
  assert.equal((await act(staff, 'SELECT id FROM public.client_nutrient_targets WHERE contact_id=$1', [otherContact])).rowCount, 0);
});
test('nutrition: plan.override alone never grants private read', async () => {
  await permissions({ 'plan.override': true }); await log();
  await assert.rejects(rpc(staff, 'SELECT public.admin_get_client_nutrition_day($1,$2)', [contact, today]), /Not authorized/);
  assert.equal(await count(staff, 'nutrition_diary_items'), 0); assert.equal(await count(staff, 'client_nutrient_targets'), 0);
});
test('nutrition: inactive private staff denied', async () => {
  await permissions({ 'health.private.view': true }); await q("UPDATE public.staff_access SET status='inactive' WHERE user_id=$1", [staff]);
  await assert.rejects(rpc(staff, 'SELECT public.admin_get_client_nutrition_day($1,$2)', [contact, today]), /Not authorized/);
});
test('nutrition: wellness management alone never grants private review', async () => {
  await permissions({ 'health.progress.manage': true }); await log();
  await assert.rejects(rpc(staff, 'SELECT public.admin_get_client_nutrition_day($1,$2)', [contact, today]), /Not authorized/);
});
test('nutrition: all 101 catalog nutrients snapshot, multiply and aggregate', async () => {
  const keys = (await q('SELECT nutrient_key FROM public.nutrition_nutrient_catalog WHERE active ORDER BY sort_order')).rows.map(r => r.nutrient_key);
  assert.equal(keys.length, 101);
  const profile = Object.fromEntries(keys.map((k, i) => [k, i]));
  await q('UPDATE public.food_catalog SET nutrition=$1 WHERE id=$2', [JSON.stringify(profile), food]);
  await log(member, 'food', food, 2); await log(member, 'food', food, .5);
  const d = await day(); assert.equal(Object.keys(d.totals).length, 101);
  for (const [i, k] of keys.entries()) { assert.equal(d.totals[k], i * 2.5, k); assert.equal(d.items[0].nutrients[k], i * 2, k); }
});
test('nutrition: zero preserved; null blank and non-numeric values omitted', async () => {
  await q('UPDATE public.food_catalog SET nutrition=$1 WHERE id=$2', [JSON.stringify({ fat_g: 0, protein_g: 12, energy_kcal: null, fiber_g: '', water_g: '50', invalid: false, list: [], object: {} }), food]);
  await log(member, 'food', food, 2.5);
  assert.deepEqual((await day()).totals, { fat_g: 0, protein_g: 30 });
});
test('nutrition: whole non-object profile is unknown rather than fabricated', async () => {
  await q("UPDATE public.food_catalog SET nutrition='null'::jsonb WHERE id=$1", [food]);
  await log(); assert.deepEqual((await day()).totals, {});
});
test('nutrition: historical snapshot and label remain stable after source edits', async () => {
  await log(); const before = await day();
  await q("UPDATE public.food_catalog SET nutrition='{\"energy_kcal\":999}',name='Changed source' WHERE id=$1", [food]);
  const after = await day(); assert.deepEqual(after.totals, before.totals); assert.deepEqual(after.items[0].nutrients, before.items[0].nutrients); assert.equal(after.items[0].label, 'Synthetic food');
});
test('nutrition: recipe snapshot uses per-serving profile without second division', async () => {
  await log(member, 'recipe', recipe, 2); const d = await day();
  assert.deepEqual(d.totals, { energy_kcal: 160, fiber_g: 6 }); assert.equal(d.items[0].serving_quantity, 1);
});
test('nutrition: own-item delete removes only that entry', async () => {
  const id = await log(); await log(other); assert.equal(await remove(id), true); assert.equal(await remove(id), false);
  assert.deepEqual((await day()).totals, {}); assert.equal((await day(other)).items.length, 1);
});
test('nutrition: coach precedence beats newer program and member values', async () => {
  await q("INSERT INTO public.client_nutrient_targets(contact_id,nutrient_id,target_value,minimum_value,maximum_value,source) VALUES($1,$2,100,75,150,'coach'),($1,$2,999,null,null,'member')", [contact, nutrient]);
  const t = (await day()).targets.find(t => t.nutrient_key === 'protein_g');
  assert.deepEqual([t.source, t.minimum, t.target, t.maximum], ['coach', 75, 100, 150]);
  await q("UPDATE public.client_nutrient_targets SET active=false WHERE contact_id=$1 AND source='coach'", [contact]);
  assert.equal((await day()).targets.find(t => t.nutrient_key === 'protein_g').target, 80);
  await assert.rejects(act(member, "INSERT INTO public.client_nutrient_targets(contact_id,nutrient_id,target_value,source) VALUES($1,$2,1000,'system')", [contact, nutrient]), /row-level security/);
});
test('nutrition: seven-day trends contain only logged days, own totals and numeric zero', async () => {
  const yesterday = await val("SELECT (current_date-1)::text"), old = await val("SELECT (current_date-7)::text"), future = await val("SELECT (current_date+1)::text");
  await log(); await log(member, 'food', food, 2, yesterday); await log(member, 'food', food, 9, old); await log(member, 'food', food, 9, future); await log(other);
  const trends = await rpc(member, 'SELECT public.get_my_nutrition_trends(7)');
  assert.equal(trends.length, 2); assert.deepEqual(trends.map(r => r.date), [yesterday, today]);
  assert.equal(trends[0].totals.protein_g, 20); assert.equal(trends[1].totals.fat_g, 0);
  assert.equal((await rpc(member, 'SELECT public.get_my_nutrition_trends(1)')).length, 1);
});
test('nutrition: trend end date follows the member calendar day across UTC boundaries', async () => {
  const end = await val('SELECT (current_date-1)::text'), first = await val('SELECT (current_date-7)::text');
  await log(member, 'food', food, 2, first); await log(member, 'food', food, 3, end); await log();
  const rows = await rpc(member, 'SELECT public.get_my_nutrition_trends(7,$1)', [end]);
  assert.deepEqual(rows.map(r => r.date), [first, end]);
  assert.deepEqual(rows.map(r => r.totals.energy_kcal), [200, 300]);
});
test('nutrition: sources and log both require active food or published recipe and published methodology', async () => {
  let s = await sources(); assert.deepEqual(s.foods.map(f => f.id), [food]); assert.deepEqual(s.recipes.map(r => r.id), [recipe]);
  await q('UPDATE public.food_catalog SET active=false WHERE id=$1', [food]); await q("UPDATE public.recipes SET status='draft' WHERE id=$1", [recipe]);
  s = await sources(); assert.deepEqual(s, { foods: [], recipes: [] });
  await assert.rejects(log(), /unavailable/); await assert.rejects(log(member, 'recipe', recipe), /unavailable/);
  await q('UPDATE public.food_catalog SET active=true WHERE id=$1', [food]); await q("UPDATE public.recipes SET status='published' WHERE id=$1", [recipe]); await q("UPDATE public.nutrition_methodologies SET status='draft' WHERE id=$1", [method]);
  assert.deepEqual(await sources(), { foods: [], recipes: [] }); await assert.rejects(log(), /unavailable/); await assert.rejects(log(member, 'recipe', recipe), /unavailable/);
});
test('nutrition: malformed quantity, slot and source cannot write', async () => {
  for (const n of [0, -1, null, 'NaN', 'Infinity', '-Infinity']) await assert.rejects(log(member, 'food', food, n), /Quantity/);
  for (const slot of ['invalid', null]) await assert.rejects(log(member, 'food', food, 1, today, slot), /meal slot/);
  await assert.rejects(log(member, 'draft', food), /source type/); assert.equal((await day()).items.length, 0);
});
test('nutrition: scoped target writes retain independent plan.override gate', async () => {
  await permissions({ 'health.private.view': true, 'plan.override': true });
  assert.equal((await act(staff, 'UPDATE public.client_nutrient_targets SET target_value=90 WHERE contact_id=$1 RETURNING id', [contact])).rowCount, 1);
  assert.equal((await act(staff, 'UPDATE public.client_nutrient_targets SET target_value=90 WHERE contact_id=$1 RETURNING id', [otherContact])).rowCount, 0);
  assert.equal((await act(staff, 'DELETE FROM public.client_nutrient_targets WHERE contact_id=$1 RETURNING id', [otherContact])).rowCount, 0);
  await assert.rejects(act(staff, "INSERT INTO public.client_nutrient_targets(contact_id,nutrient_id,target_value,source) VALUES($1,$2,90,'coach')", [otherContact, nutrient]), /row-level security/);
});
test('nutrition: staff diary edits require health.progress.manage and scope', async () => {
  await log(); await log(other); await permissions({ 'health.private.view': true });
  assert.equal((await act(staff, "UPDATE public.nutrition_diary_items SET note='Denied' RETURNING id")).rowCount, 0);
  await permissions({ 'health.private.view': true, 'health.progress.manage': true });
  assert.equal((await act(staff, "UPDATE public.nutrition_diary_items SET note='Scoped edit' RETURNING id")).rowCount, 1);
});
test('nutrition: internal arbitrary-contact aggregator is not executable by clients', async () => {
  await assert.rejects(act(member, 'SELECT private.nutrition_totals_for_day($1,$2)', [otherContact, today]), /permission denied/);
});
test('nutrition: anonymous has no public Nutrition RPC grants', async () => {
  for (const sql of ['SELECT public.get_my_nutrition_sources()', 'SELECT public.get_my_nutrition_day()', 'SELECT public.get_my_nutrition_trends(7)', 'SELECT public.delete_my_nutrition_item(null)', 'SELECT public.admin_get_client_nutrition_day(null)', "SELECT public.log_my_nutrition_item(null,'breakfast','food',null)"])
    await assert.rejects(act(null, sql, [], 'anon'), /permission denied/);
});
