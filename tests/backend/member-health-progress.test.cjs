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
let owner, member, other, contact, otherContact, household, minor;
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
 await q('BEGIN');owner=await user('owner');member=await user('member');other=await user('other');
 await q("INSERT INTO public.staff_access(user_id,role) VALUES($1,'owner')",[owner]);
 contact=await paid(member);otherContact=await paid(other);
 await q("INSERT INTO public.progress_metric_catalog(metric_key,label,category,unit) VALUES('weight','Weight','body','lb') ON CONFLICT(metric_key) DO NOTHING");
 await q("INSERT INTO public.progress_entries(contact_id,metric_key,value_numeric,recorded_at) VALUES($1,'weight',0,now()),($1,'weight',180,now()-interval '4 days'),($1,'weight',181,now()-interval '20 days'),($2,'weight',999,now())",[contact,otherContact]);
 await q("INSERT INTO public.client_goals(contact_id,title,goal_key,target_value,target_unit,baseline_value) VALUES($1,'Own goal','weight',170,'lb',190),($2,'Other adult goal','weight',150,'lb',190)",[contact,otherContact]);
 await q("INSERT INTO public.client_habits(contact_id,title,unit) VALUES($1,'Own habit','walk'),($2,'Other adult habit','walk')",[contact,otherContact]);
 household=await val("SELECT id FROM public.households WHERE primary_contact_id=$1",[contact]);
 await q("UPDATE public.households SET household_type='family' WHERE id=$1",[household]);
 await q('DELETE FROM public.household_members WHERE contact_id=ANY($1::uuid[])',[[contact,otherContact]]);
 await q("INSERT INTO public.household_members(household_id,contact_id,relationship_type,is_primary,date_of_birth,sex) VALUES($1,$2,'husband',true,'1980-01-01','male'),($1,$3,'wife',false,'1980-01-01','female')",[household,contact,otherContact]);
 minor=await val("INSERT INTO public.contacts(first_name,last_name) VALUES('Synthetic','Minor') RETURNING id");
 await q("INSERT INTO public.household_members(household_id,contact_id,relationship_type,date_of_birth,guardian_contact_id) VALUES($1,$2,'child',current_date-interval '10 years',$3)",[household,minor,contact]);
});
afterEach(()=>q('ROLLBACK'));
for(const view of ['my_health_metric_latest','my_recent_progress','my_goals','my_habits','my_goal_progress']){
 test('Health dashboard '+view+': own records only, even in shared household',async()=>{
  const rows=(await act(member,'SELECT * FROM public.'+view)).rows;
  assert(rows.length>0);assert(rows.every(r=>r.contact_id===contact));
  assert.equal((await act(other,'SELECT * FROM public.'+view+' WHERE contact_id=$1',[contact])).rowCount,0);
 });
 test('Health dashboard '+view+': inactive access reveals no private rows',async()=>{
  await q("UPDATE public.client_access SET status='inactive' WHERE contact_id=$1",[contact]);
  assert.equal((await act(member,'SELECT * FROM public.'+view)).rowCount,0);
 });
}
test('Health latest and trends preserve zero, actual dates, seven/thirty-day windows',async()=>{
 const latest=(await act(member,"SELECT * FROM public.my_health_metric_latest WHERE metric_key='weight'")).rows[0];assert.equal(Number(latest.value_numeric),0);assert.equal(latest.origin,'manual');
 const seven=(await act(member,"SELECT * FROM public.get_my_health_metric_trend($1,'weight',7)",[contact])).rows;
 const thirty=(await act(member,"SELECT * FROM public.get_my_health_metric_trend($1,'weight',30)",[contact])).rows;
 assert.equal(seven.length,2);assert.equal(thirty.length,3);assert(thirty.every(r=>Number(r.value_numeric)!==999));assert.equal(Number(seven[1].value_numeric),0);
});
test('Health trend supplied other-adult contact parameter never widens access',async()=>{
 assert.equal((await act(member,"SELECT * FROM public.get_my_health_metric_trend($1,'weight',30)",[otherContact])).rowCount,0);
});
test('Existing guardian controls minor; unrelated adult does not inherit guardian control',async()=>{
 assert.equal(await val('SELECT private.family_guardian_controls_minor($1,$2,$3)',[household,minor,contact]),true);
 assert.equal(await val('SELECT private.family_guardian_controls_minor($1,$2,$3)',[household,minor,otherContact]),false);
 assert.equal(await val("SELECT private.family_scope_visible_to_member($1,$2,$3,'health_progress')",[household,minor,contact]),true);
 assert.equal(await val("SELECT private.family_scope_visible_to_member($1,$2,$3,'health_progress')",[household,minor,otherContact]),false);
});
test('Existing adult-family private sharing stays denied by default',async()=>{
 assert.equal(await val("SELECT private.family_scope_visible_to_member($1,$2,$3,'health_progress')",[household,contact,otherContact]),false);
});
test('Guardian relationship does not broaden the dashboard own-contact contract',async()=>{
 await q("INSERT INTO public.progress_entries(contact_id,metric_key,value_numeric) VALUES($1,'weight',777)",[minor]);
 assert.equal((await act(member,'SELECT * FROM public.my_recent_progress WHERE contact_id=$1',[minor])).rowCount,0);
 assert.equal((await act(member,"SELECT * FROM public.get_my_health_metric_trend($1,'weight',30)",[minor])).rowCount,0);
});
test('Existing guardian consent remains required for staff access to minor health',async()=>{
 assert.equal(await val("SELECT private.family_scope_visible_to_staff($1,'health_progress',$2)",[minor,owner]),false);
});
