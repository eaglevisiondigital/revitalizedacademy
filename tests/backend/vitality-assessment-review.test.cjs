const { test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
if (!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE || '')) throw Error('Disposable local database required');
const db = new Client();
const q = (sql, params = []) => db.query(sql, params);
const value = async (sql, params = []) => Object.values((await q(sql, params)).rows[0])[0];
let owner, scoped, noHealth, member, assignedContact, otherContact;

async function act(uid, sql, params = [], role = 'authenticated') {
  await q('savepoint vitality_review_actor');
  try {
    await q('set local role ' + role);
    await q("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)", [uid || '', role]);
    const result = await q(sql, params);
    await q('rollback to savepoint vitality_review_actor');
    await q('release savepoint vitality_review_actor');
    return result;
  } catch (error) {
    await q('rollback to savepoint vitality_review_actor');
    await q('release savepoint vitality_review_actor');
    throw error;
  }
}
async function user(label) {
  const id = randomUUID();
  await q('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, `${label}-${id}@example.invalid`]);
  return id;
}
async function staff(label, role, scope) {
  const id = await user(label);
  await q("insert into public.staff_access(user_id,role,display_name,status,onboarding_status,contact_scope) values($1,$2,$3,'active','complete',$4)", [id, role, label, scope]);
  return id;
}
async function allow(uid, key, allowed = true) {
  await q('insert into public.staff_permission_overrides(user_id,permission_key,allowed,updated_by) values($1,$2,$3,$4) on conflict(user_id,permission_key) do update set allowed=excluded.allowed', [uid, key, allowed, owner]);
}
const snapshot = (pathway, section, percent, fields) => ({ version: 1, pathway, section: 3, section_label: section, percent, fields });
async function assessment(contactId, status, pathway, fields, form = '') {
  const workflow = await value("insert into public.workflow_records(contact_id,workflow_type,status,current_step,completion_percent,started_at,completed_at,last_activity_at) values($1,'vitality_assessment',$2,$3,$4,now()-interval '1 day',case when $2='completed' then now() else null end,now()) returning id", [contactId, status === 'completed' ? 'completed' : 'in_progress', status === 'completed' ? 'complete' : 'Functional Training', status === 'completed' ? 100 : 40]);
  return value("insert into private.vitality_assessment_drafts(contact_id,workflow_id,recipient,identity,snapshot,status,verified_at,session_hash,recovery_hash,completed_at,final_form) values($1,$2,$3,$4,$5,$6,now(),encode(extensions.gen_random_bytes(32),'hex'),encode(extensions.gen_random_bytes(32),'hex'),case when $6='completed' then now() else null end,$7) returning id", [contactId, workflow, `person-${contactId}@example.invalid`, JSON.stringify({ first_name: 'Synthetic', last_name: 'Person' }), JSON.stringify(snapshot(pathway, status === 'completed' ? 'Final Thoughts & Submit' : 'Functional Training', status === 'completed' ? 100 : 40, fields)), status, form]);
}

before(async () => {
  await db.connect();
  await q("insert into public.staff_permission_catalog(permission_key,label,description,category,sensitive,sort_order,active) values('crm.view','View People & CRM','View CRM contacts.','People',false,10,true),('health.private.view','View Private Health Data','View private health context.','Health',true,50,true) on conflict(permission_key) do nothing");
});
after(() => db.end());
beforeEach(async () => {
  await q('begin');
  owner = await staff('Synthetic Owner', 'owner', 'all');
  scoped = await staff('Synthetic Scoped Coach', 'coach', 'assigned');
  noHealth = await staff('Synthetic Ordinary Staff', 'admin', 'assigned');
  member = await user('Synthetic Member');
  assignedContact = await value("insert into public.contacts(first_name,last_name,email,lifecycle_stage,assigned_to,referral_source,sales_rep_name) values('Assigned','Adult','assigned@example.invalid','assessment_lead',$1,'Sales Rep','Synthetic Rep') returning id", [scoped]);
  otherContact = await value("insert into public.contacts(first_name,last_name,email,lifecycle_stage,referral_source) values('Other','Child','other@example.invalid','assessment_lead','Friend / Family') returning id");
  for (const uid of [scoped, noHealth]) await allow(uid, 'crm.view');
  // The synthetic Coach fixture represents a fully approved staff account; production onboarding remains unchanged.
  await q("update public.staff_access set onboarding_status='complete' where user_id=$1", [scoped]);
  await allow(owner, 'crm.view');
  await allow(owner, 'health.private.view');
  await allow(scoped, 'health.private.view');
  await q('update public.contacts set assigned_to=$1 where id=$2', [noHealth, assignedContact]);
  await q('insert into public.client_coach_assignments(contact_id,coach_user_id,status) values($1,$2,$3)', [assignedContact, scoped, 'active']);
  await assessment(assignedContact, 'completed', 'Adult', {
    assessment_for: [{ type: 'radio', value: 'Myself', checked: true }],
    primary_goals: [{ type: 'checkbox', value: 'Energy', checked: true }],
    hydration_symptoms: [{ type: 'checkbox', value: 'Strong thirst', checked: true }],
    hydration_strong_thirst_frequency: [{ type: 'select-one', value: 'Often' }],
    urgent_safety_flag: [{ type: 'radio', value: 'Yes', checked: true }]
  }, 'assessment_summary=Stored+coach+summary%0ASecond+line&coach_review_flags=URGENT+SYMPTOM+%2F+SAFETY+RESPONSE&assessment_resume_id=never-expose');
  await q("insert into public.contact_tags(contact_id,tag,source,rule_key) values($1,'goal:energy','automatic','assessment-derived')", [assignedContact]);
  await assessment(otherContact, 'draft', 'Child (ages 0–18)', {
    assessment_for: [{ type: 'radio', value: 'My child', checked: true }],
    child_gender: [{ type: 'radio', value: 'Female', checked: true }],
    child_own_words: [{ type: 'textarea', value: 'Private unfinished answer' }]
  });
});
afterEach(() => q('rollback'));

test('authorized scoped Coach lists assigned completed assessment only', async () => {
  const rows = (await act(scoped, "select public.list_vitality_assessment_reviews('all') review")).rows.map((row) => row.review);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].contact_id, assignedContact);
  assert.equal(rows[0].sales_rep_name, 'Synthetic Rep');
  assert.equal(rows[0].needs_review, true);
});
test('Owner lists completed and in-progress status with no answer payload', async () => {
  const rows = (await act(owner, "select public.list_vitality_assessment_reviews('all') review")).rows.map((row) => row.review);
  assert.equal(rows.length, 2);
  const unfinished = rows.find((row) => row.status === 'in_progress');
  assert.equal(unfinished.pathway, 'Child (ages 0–18)');
  assert.equal(unfinished.completion_percent, 40);
  assert.equal('answers' in unfinished, false);
});
test('completed detail returns sanitized answers, stored summary, flags and approved tags', async () => {
  const review = (await act(scoped, 'select public.get_vitality_assessment_review($1) review', [assignedContact])).rows[0].review;
  assert.equal(review.coach_summary, 'Stored coach summary\nSecond line');
  assert.deepEqual(review.coach_review_flags, ['URGENT SYMPTOM / SAFETY RESPONSE']);
  assert.deepEqual(review.derived_tags, ['goal:energy']);
  assert.equal(review.answers.hydration_strong_thirst_frequency[0].value, 'Often');
  const serialized = JSON.stringify(review);
  for (const secret of ['draft_id', 'session_hash', 'recovery_hash', 'dispatch_hash', 'final_form', 'never-expose', 'a'.repeat(64)]) assert.equal(serialized.includes(secret), false, secret);
});
test('in-progress detail is status-only and omits unfinished private answers', async () => {
  const review = (await act(owner, 'select public.get_vitality_assessment_review($1) review', [otherContact])).rows[0].review;
  assert.equal(review.status, 'in_progress');
  assert.equal(review.email_verified, true);
  assert.equal('answers' in review, false);
  assert.equal('coach_summary' in review, false);
  assert.equal(JSON.stringify(review).includes('Private unfinished answer'), false);
});
test('assigned Coach cannot review an unassigned contact', async () => {
  await assert.rejects(act(scoped, 'select public.get_vitality_assessment_review($1)', [otherContact]), /Vitality review unavailable/);
});
test('staff without private-health permission cannot list or review assigned contact', async () => {
  await assert.rejects(act(noHealth, "select public.list_vitality_assessment_reviews('all')"), /Vitality review unavailable/);
  await assert.rejects(act(noHealth, 'select public.get_vitality_assessment_review($1)', [assignedContact]), /Vitality review unavailable/);
});
test('ordinary member and anonymous callers are denied', async () => {
  await assert.rejects(act(member, "select public.list_vitality_assessment_reviews('all')"), /Vitality review unavailable/);
  await assert.rejects(act(null, "select public.list_vitality_assessment_reviews('all')", [], 'anon'), /permission denied/);
});
test('direct private draft reads remain denied to browser roles', async () => {
  await assert.rejects(act(scoped, 'select * from private.vitality_assessment_drafts'), /permission denied/);
  await assert.rejects(act(member, 'select * from private.vitality_assessment_drafts'), /permission denied/);
});
test('completed and needs-review filters are deterministic', async () => {
  assert.equal((await act(owner, "select count(*)::int n from public.list_vitality_assessment_reviews('completed')")).rows[0].n, 1);
  assert.equal((await act(owner, "select count(*)::int n from public.list_vitality_assessment_reviews('needs_review')")).rows[0].n, 1);
  assert.equal((await act(owner, "select count(*)::int n from public.list_vitality_assessment_reviews('in_progress')")).rows[0].n, 1);
  await assert.rejects(act(owner, "select public.list_vitality_assessment_reviews('invalid')"), /Invalid assessment filter/);
});
test('form decoder preserves UTF-8, line breaks and malformed encoding safely', async () => {
  assert.equal(await value("select private.vitality_form_value('assessment_summary=Hello+%E2%80%94+world%0Aagain','assessment_summary')"), 'Hello — world\nagain');
  assert.equal(await value("select private.vitality_form_value('x=%ZZliteral','x')"), '%ZZliteral');
});
