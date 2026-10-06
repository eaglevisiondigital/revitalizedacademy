const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const moduleSource = fs.readFileSync(path.join(root, 'portal/portal-vitality-assessments.js'), 'utf8');
const catalogSource = fs.readFileSync(path.join(root, 'portal/vitality-question-catalog.js'), 'utf8');
const html = `<!doctype html><body>
<section id="vitality-assessments-panel"><button data-vitality-filter="all" class="active">All</button><button data-vitality-filter="in_progress">In Progress</button><button data-vitality-filter="completed">Completed</button><button data-vitality-filter="needs_review">Needs Review</button><button id="vitality-assessments-refresh">Refresh</button><p id="vitality-assessments-status"></p><div id="vitality-assessments-list"></div></section>
<div id="vitality-review-drawer" class="hidden" aria-hidden="true"><div data-vitality-review-close></div><aside><button data-vitality-review-close>Close</button><h2 id="vitality-review-title"></h2><div id="vitality-review-content"></div></aside></div>
</body>`;
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
const base = {
  contact_id: '11111111-1111-1111-1111-111111111111', participant_name: 'Synthetic Person', email: 'synthetic@example.invalid',
  status: 'completed', email_verified: true, current_section: 'complete', completion_percent: 100,
  started_at: '2026-10-01T12:00:00Z', completed_at: '2026-10-02T12:00:00Z', last_saved_at: '2026-10-02T12:00:00Z',
  pathway: 'Adult', assessment_for: 'Myself', referral_source: 'Sales Rep', sales_rep_name: 'Synthetic Rep', assigned_staff: 'Synthetic Coach', needs_review: true
};

function page({ rows = [base], reviews = {} } = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(error.message));
  virtualConsole.on('error', (error) => errors.push(String(error)));
  const dom = new JSDOM(html, { url: 'https://revitalizedacademy.com/portal/', runScripts: 'outside-only', virtualConsole });
  const calls = [];
  dom.window.RA_PORTAL = {
    authClient: { rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'list_vitality_assessment_reviews') return { data: rows, error: null };
      return { data: reviews[args.p_contact_id] || null, error: reviews[args.p_contact_id] ? null : { message: 'denied' } };
    } },
    openContact: (id) => calls.push({ name: 'openContact', id })
  };
  dom.window.eval(catalogSource);
  dom.window.eval(moduleSource);
  return { dom, document: dom.window.document, calls, errors };
}

test('generated catalog covers approved Adult and Child section structures', () => {
  const p = page();
  const catalog = p.dom.window.RVA_VITALITY_QUESTION_CATALOG;
  assert.equal(catalog.Adult.sections.includes('Whole-Person Snapshot'), true);
  assert.equal(catalog.Adult.sections.includes('Wise Budgeting'), true);
  assert.equal(catalog['Child (ages 0–18)'].sections.includes('Whole-Child Snapshot'), true);
  assert.equal(catalog['Child (ages 0–18)'].fields.child_gender.label, 'What is your child’s gender?');
  p.dom.window.close();
});

test('list renders completion, referral, Sales Rep and assignment metadata', async () => {
  const p = page();
  p.document.dispatchEvent(new p.dom.window.CustomEvent('ra:workspace-changed', { detail: { target: '#vitality-assessments-panel' } }));
  await tick();
  const copy = p.document.getElementById('vitality-assessments-list').textContent;
  for (const expected of ['Synthetic Person', 'Completed', '100%', 'Sales Rep', 'Synthetic Rep', 'Synthetic Coach']) assert.match(copy, new RegExp(expected));
  assert.deepEqual(p.errors, []);
  p.dom.window.close();
});

test('filters call only the secured list RPC with the selected filter', async () => {
  const p = page({ rows: [] });
  p.document.querySelector('[data-vitality-filter="in_progress"]').click();
  await tick();
  assert.equal(p.calls[0].name, 'list_vitality_assessment_reviews');
  assert.equal(p.calls[0].args.p_filter, 'in_progress');
  p.dom.window.close();
});

test('in-progress review remains status-only even if unexpected answer data is present', async () => {
  const record = { ...base, status: 'in_progress', completion_percent: 40, current_section: 'Functional Training', answers: { secret_answer: [{ type: 'text', value: 'must not render' }] } };
  const p = page({ rows: [record], reviews: { [record.contact_id]: record } });
  p.document.dispatchEvent(new p.dom.window.CustomEvent('ra:workspace-changed', { detail: { target: '#vitality-assessments-panel' } }));
  await tick(); p.document.querySelector('.vitality-assessment-actions button').click(); await tick();
  const copy = p.document.getElementById('vitality-review-content').textContent;
  assert.match(copy, /Private answers remain unavailable/);
  assert.doesNotMatch(copy, /must not render/);
  p.dom.window.close();
});

test('completed Adult review renders coach summary, flags, tags, conditional and symptom details', async () => {
  const record = { ...base, coach_summary: 'Accepted stored coach summary.', coach_review_flags: ['URGENT SYMPTOM / SAFETY RESPONSE'], derived_tags: ['goal:energy', 'concern:sleep'], answers: {
    assessment_for: [{ type: 'radio', value: 'Myself', checked: true }],
    primary_goals: [{ type: 'checkbox', value: 'Energy', checked: true }, { type: 'checkbox', value: 'Sleep', checked: false }],
    diagnosed_conditions: [{ type: 'radio', value: 'Yes', checked: true }],
    diagnosed_conditions_details: [{ type: 'textarea', value: 'Long but factual submitted detail.' }],
    hydration_symptoms: [{ type: 'checkbox', value: 'Strong thirst', checked: true }],
    hydration_strong_thirst_frequency: [{ type: 'select-one', value: 'Often' }]
  } };
  const p = page({ reviews: { [record.contact_id]: record } });
  p.document.dispatchEvent(new p.dom.window.CustomEvent('ra:workspace-changed', { detail: { target: '#vitality-assessments-panel' } }));
  await tick(); p.document.querySelector('.vitality-assessment-actions button').click(); await tick();
  const copy = p.document.getElementById('vitality-review-content').textContent;
  for (const expected of ['Accepted stored coach summary.', 'URGENT SYMPTOM', 'goal:energy', 'Long but factual submitted detail.', 'Strong thirst — How often?', 'Often']) assert.match(copy, new RegExp(expected));
  assert.doesNotMatch(copy, /Sleep,?\s*Long/);
  p.dom.window.close();
});

test('completed Child review uses Whole-Child labels and preserves submitted wording', async () => {
  const record = { ...base, pathway: 'Child (ages 0–18)', assessment_for: 'My child', assessed_first_name: 'Synthetic', assessed_last_name: 'Child', coach_summary: '', coach_review_flags: [], derived_tags: [], answers: {
    child_gender: [{ type: 'radio', value: 'Female', checked: true }],
    child_hydration_concerns: [{ type: 'checkbox', value: 'Headaches', checked: true }],
    child_hydration_concerns_headaches_distress: [{ type: 'select-one', value: 'Mild' }]
  } };
  const p = page({ reviews: { [record.contact_id]: record } });
  p.document.dispatchEvent(new p.dom.window.CustomEvent('ra:workspace-changed', { detail: { target: '#vitality-assessments-panel' } }));
  await tick(); p.document.querySelector('.vitality-assessment-actions button').click(); await tick();
  const copy = p.document.getElementById('vitality-review-content').textContent;
  assert.match(copy, /Synthetic Child/);
  assert.match(copy, /What is your child’s gender\?/);
  assert.match(copy, /Headaches — How uncomfortable or distressing\?/);
  p.dom.window.close();
});

test('empty values are omitted and genuine numeric zero is preserved', async () => {
  const record = { ...base, coach_summary: '', coach_review_flags: [], derived_tags: [], answers: {
    overall_quality_of_life: [{ type: 'range', value: 0 }],
    additional_context: [{ type: 'textarea', value: '' }],
    primary_goals: [{ type: 'checkbox', value: 'Energy', checked: false }]
  } };
  const p = page({ reviews: { [record.contact_id]: record } });
  p.document.dispatchEvent(new p.dom.window.CustomEvent('ra:workspace-changed', { detail: { target: '#vitality-assessments-panel' } }));
  await tick(); p.document.querySelector('.vitality-assessment-actions button').click(); await tick();
  const copy = p.document.getElementById('vitality-review-content').textContent;
  assert.match(copy, /How would you rate your current overall quality of life\?0/);
  assert.doesNotMatch(copy, /Additional Context/);
  p.dom.window.close();
});

test('frontend uses text nodes for private values and contains no direct private-table read', () => {
  assert.doesNotMatch(moduleSource, /innerHTML\s*=/);
  assert.doesNotMatch(moduleSource, /nutrition_diary_items|vitality_assessment_drafts|\.from\s*\(/);
  assert.match(moduleSource, /list_vitality_assessment_reviews/);
  assert.match(moduleSource, /get_vitality_assessment_review/);
});

test('responsive CSS protects long health answers at desktop, tablet and mobile breakpoints', () => {
  const css = fs.readFileSync(path.join(root, 'portal/portal-vitality-assessments.css'), 'utf8');
  assert.match(css, /overflow-wrap:anywhere/);
  assert.match(css, /@media\(max-width:980px\)/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /max-width:100vw/);
});

test('secured SQL never returns credentials, draft IDs or raw final form', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261006135457_vitality_assessment_staff_review.sql'), 'utf8');
  const returnedKeys = [...sql.matchAll(/'([^']+)'\s*,/g)].map((match) => match[1]);
  for (const key of ['draft_id', 'session_hash', 'recovery_hash', 'dispatch_hash', 'final_form']) assert.equal(returnedKeys.includes(key), false, key);
  assert.match(sql, /health\.private\.view/);
  assert.match(sql, /staff_can_access_contact/);
  assert.match(sql, /if draft\.status <> 'completed' then\s+return base;/);
});
