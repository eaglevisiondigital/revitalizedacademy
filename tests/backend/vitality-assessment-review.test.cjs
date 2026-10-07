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

test('decoder preserves literal and escaped Unicode, plus, malformed escapes and empty/null input', async () => {
  for (const [encoded, expected] of [
    ['', ''], [null, null], ['literal été 😀', 'literal été 😀'],
    ['a%2Bb+c%26d%3De%25', 'a+b c&d=e%'],
    ['%E2%80%94%F0%9F%98%80', '—😀'], ['%ZZ%2%tail', '%ZZ%2%tail'],
    ['%FF', null], ['%E2%80', null], ['%00', null]
  ]) assert.equal(await value('select private.vitality_url_decode_component($1)', [encoded]), expected);
});

test('long completed review succeeds for two separate default Owners within the API timeout', async () => {
  // Match observed production Owner defaults in this disposable historical baseline.
  await q("insert into public.staff_role_permission_defaults(role,permission_key,allowed) values('owner','crm.view',true),('owner','health.private.view',true) on conflict(role,permission_key) do update set allowed=excluded.allowed");
  const secondOwner = await staff('Second Separate Owner', 'owner', 'all');
  await q('delete from public.staff_permission_overrides where user_id=$1', [owner]);
  const summary = 'Measured progress — énergie and hydration.\n'.repeat(900);
  const form = new URLSearchParams({assessment_summary: summary, coach_review_flags: 'None reported'}).toString();
  await q('update private.vitality_assessment_drafts set final_form=$1 where contact_id=$2', [form, assignedContact]);
  await q("set local statement_timeout='2s'");
  for (const uid of [owner, secondOwner]) {
    const permissions = (await act(uid, 'select * from public.my_staff_permissions_view')).rows;
    assert.equal(permissions.find(p => p.permission_key === 'health.private.view').allowed, true);
    const review = (await act(uid, 'select public.get_vitality_assessment_review($1) review', [assignedContact])).rows[0].review;
    assert.equal(review.coach_summary, summary);
    assert.equal(review.answers.hydration_strong_thirst_frequency[0].value, 'Often');
    assert.equal(review.sales_rep_name, 'Synthetic Rep');
    assert.equal(review.status, 'completed');
  }
  assert.equal(await value('select count(*)::int from public.staff_permission_overrides where user_id=any($1::uuid[])', [[owner, secondOwner]]), 0);
});

async function legacyCompleted() {
 await q('delete from private.vitality_assessment_drafts where contact_id=$1',[assignedContact]);
 return (await q("select id,completed_at from public.workflow_records where contact_id=$1 and workflow_type='vitality_assessment'",[assignedContact])).rows[0];
}
async function importLegacy(w,summary='Original submitted summary',flags='Original flag') {
 return value('select private.reconcile_vitality_history($1,$2,$3,$4,$4,$5,$6,$7,$8)',
 [w.id,assignedContact,'assigned@example.invalid',w.completed_at,summary,flags,'Adult','Myself']);
}
test('historical completed and incomplete workflows appear without fake drafts or duplicates',async()=>{
 await legacyCompleted();
 await q('delete from private.vitality_assessment_drafts where contact_id=$1',[otherContact]);
 const list=(await act(owner,"select public.list_vitality_assessment_reviews('all') review")).rows.map(x=>x.review);
 assert.equal(list.length,2);assert(list.every(x=>x.historical_record===true));
 assert.equal(list.filter(x=>x.status==='completed').length,1);
 assert(list.every(x=>!('coach_summary' in x)&&!('answers' in x)));
});
test('secure draft takes precedence over historical metadata for the same workflow',async()=>{
 const w=(await q("select id from public.workflow_records where contact_id=$1 and workflow_type='vitality_assessment'",[assignedContact])).rows[0];
 await q("insert into private.vitality_historical_reviews(workflow_id,contact_id,source_key,source_received_at,assessment_summary,source_digest) values($1,$2,'synthetic-source',now(),'Older summary',repeat('a',64))",[w.id,assignedContact]);
 const list=(await act(owner,"select public.list_vitality_assessment_reviews('all') review")).rows.map(x=>x.review);
 assert.equal(list.filter(x=>x.contact_id===assignedContact).length,1);
 assert.equal('historical_record' in list.find(x=>x.contact_id===assignedContact),false);
 const review=(await act(owner,'select public.get_vitality_assessment_review($1) review',[assignedContact])).rows[0].review;
 assert.equal(review.coach_summary,'Stored coach summary\nSecond line');
});
test('controlled import preserves original records, summary, flags, timestamps and identity',async()=>{
 const w=await legacyCompleted();
 const before=await value('select to_jsonb(w) from public.workflow_records w where id=$1',[w.id]);
 assert.equal(await importLegacy(w),'reconciled');
 assert.equal(await importLegacy(w),'already_reconciled');
 assert.deepEqual(await value('select to_jsonb(w) from public.workflow_records w where id=$1',[w.id]),before);
 const review=(await act(scoped,'select public.get_vitality_assessment_review($1) review',[assignedContact])).rows[0].review;
 assert.equal(review.coach_summary,'Original submitted summary');assert.deepEqual(review.coach_review_flags,['Original flag']);
 assert.equal(new Date(review.completed_at).getTime(),new Date(w.completed_at).getTime());
 assert.equal(review.referral_source,'Sales Rep');assert.equal(review.sales_rep_name,'Synthetic Rep');
 assert.deepEqual(review.answers,{});assert.equal(review.historical_summary_available,true);
});
test('historical archive conflicts are rejected rather than overwriting',async()=>{
 const w=await legacyCompleted();await importLegacy(w);
 await assert.rejects(importLegacy(w,'Replacement invented summary'),/Conflicting historical source/);
});
test('historical source requires matching contact, email, completed status and timestamp',async()=>{
 const w=await legacyCompleted();
 await assert.rejects(q('select private.reconcile_vitality_history($1,$2,$3,$4,$4,$5,$6,$7,$8)',[w.id,otherContact,'assigned@example.invalid',w.completed_at,'Summary','None reported','Adult','Myself']),/does not match/);
});
test('historical import is inaccessible to browser and service roles',async()=>{
 const w=await legacyCompleted();
 for(const role of ['authenticated','anon','service_role']) {
 await assert.rejects(act(owner,'select private.reconcile_vitality_history($1,$2,$3,$4,$4,$5,$6,$7,$8)',[w.id,assignedContact,'assigned@example.invalid',w.completed_at,'Summary','None reported','Adult','Myself'],role),/permission denied/);
 }
});
test('historical out-of-scope and health permission denial remain enforced',async()=>{
 await legacyCompleted();
 await assert.rejects(act(noHealth,'select public.get_vitality_assessment_review($1)',[assignedContact]),/unavailable/);
 await q('delete from private.vitality_assessment_drafts where contact_id=$1',[otherContact]);
 await assert.rejects(act(scoped,'select public.get_vitality_assessment_review($1)',[otherContact]),/unavailable/);
});
test('incomplete historical workflows withhold summaries and original answer data',async()=>{
 await q('delete from private.vitality_assessment_drafts where contact_id=$1',[otherContact]);
 const review=(await act(owner,'select public.get_vitality_assessment_review($1) review',[otherContact])).rows[0].review;
 assert.equal(review.status,'in_progress');assert.equal('answers' in review,false);assert.equal('coach_summary' in review,false);
});
const unlinkedSource=()=>({email:'historical-new@example.invalid',first_name:'Historical',last_name:'Participant',phone:'5551230987',status:'Complete - coach review requested',received_at:'2026-09-18T19:56:14Z',submitted_at:'2026-09-18T19:56:15Z',first_lead_at:'2026-09-18T14:00:00Z',summary:'Original historical answers',flags:'None reported',pathway:'Adult',assessment_for:'Myself',referral_source:'Other',referral_source_other:'Original source'});
test('verified unlinked historical source imports once with original timestamps',async()=>{
 const src=unlinkedSource();const r=await value('select private.reconcile_unlinked_vitality_source($1)',[src]);
 const again=await value('select private.reconcile_unlinked_vitality_source($1)',[src]);assert.equal(again.result,'already_reconciled');assert.equal(again.contact_id,r.contact_id);
 const w=(await q('select * from public.workflow_records where id=$1',[r.workflow_id])).rows[0];assert.equal(w.status,'completed');assert.equal(w.completion_percent,100);assert.equal(new Date(w.created_at).getTime(),Date.parse(src.first_lead_at));
 const c=(await q('select * from public.contacts where id=$1',[r.contact_id])).rows[0];assert.equal(c.referral_source_other,'Original source');
 assert.equal(await value('select count(*)::int from private.vitality_assessment_drafts where contact_id=$1',[r.contact_id]),0);
});
test('ambiguous unlinked historical identity refuses duplicate contact creation',async()=>{
 await q("insert into public.contacts(first_name,last_name,email) values('Historical','Participant','alternate@example.invalid')");
 await assert.rejects(q('select private.reconcile_unlinked_vitality_source($1)',[unlinkedSource()]),/Existing identity/);
});
test('confirmed alternate-email association retains existing contact identity',async()=>{
 const id=await value("insert into public.contacts(first_name,last_name,email) values('Historical','Participant','alternate@example.invalid') returning id");
 const before=await value('select to_jsonb(c) from public.contacts c where id=$1',[id]);
 const r=await value('select private.reconcile_unlinked_vitality_source($1,$2,$3)',[unlinkedSource(),id,'Owner confirmed original personal-email association']);assert.equal(r.contact_id,id);
 assert.deepEqual(await value('select to_jsonb(c) from public.contacts c where id=$1',[id]),before);
 assert.equal(await value('select source_email from private.vitality_historical_reviews where contact_id=$1',[id]),'historical-new@example.invalid');
});
test('unlinked import is inaccessible to members, staff and service role',async()=>{
 for(const role of ['authenticated','anon','service_role'])await assert.rejects(act(owner,'select private.reconcile_unlinked_vitality_source($1)',[unlinkedSource()],role),/permission denied/);
});
