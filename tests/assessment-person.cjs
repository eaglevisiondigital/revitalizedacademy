// Run with jsdom available on NODE_PATH: node --test tests/assessment-person.cjs
// All contact/health values are synthetic. No network requests are made.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { JSDOM } = require('jsdom');
const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'consult.html'), 'utf8');
const source = readFileSync(resolve(root, 'js/vitality55.js'), 'utf8');
const childSource = readFileSync(resolve(root, 'js/vitality-child.js'), 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture(leadFails = false, childLoads = true) {
  const dom = new JSDOM(html, { url: 'https://assessment.invalid/consult', runScripts: 'outside-only' });
  const w = dom.window;
  const d = w.document;
  const posts = [];
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.CSS = { escape: value => String(value).replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`) };
  w.fetch = async (url, options) => {
    posts.push(new URLSearchParams(options.body));
    return { ok: !leadFails, status: leadFails ? 500 : 200 };
  };
  if (childLoads) w.eval(childSource);
  w.eval(source);
  const form = d.querySelector('[data-assessment-form]');
  function input(control, value) {
    if (['checkbox', 'radio'].includes(control.type)) control.checked = value;
    else control.value = value;
    control.dispatchEvent(new w.Event('input', { bubbles: true }));
  }
  const set = (name, value) => input(form.elements.namedItem(name), value);
  const choose = value => input([...form.querySelectorAll('[name="assessment_for"]')].find(c => c.value === value), true);
  const index = () => Number(d.querySelector('[data-panel]:not([hidden])').dataset.panel);
  const next = async () => { d.querySelector('[data-next]').click(); await settle(); };
  async function start() {
    const lead = d.querySelector('[data-vitality-lead-form]');
    for (const [name, value] of Object.entries({first_name:'Synthetic',last_name:'Respondent',email:'synthetic@example.invalid',phone:'0000000000'})) {
      input(lead.elements.namedItem(name), value);
    }
    lead.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
  }
  function person(choice, age = '35') {
    choose(choice);
    if (choice !== 'Myself') {
      set('assessed_first_name', 'Synthetic');
      set('assessed_last_name', 'Subject');
      set('assessed_age', age);
      if (choice === 'Someone else') set('assessed_relationship', 'Sibling');
      set('assessment_authorization', true);
    }
    input(form.querySelector('[name="assessment_consent"]'), true);
    set('disclaimer_acknowledgment', true);
  }
  const active = c => !c.disabled && !c.closest('[hidden]');
  function fillPanel(reproductive, hormone) {
    const panel = d.querySelector('[data-panel]:not([hidden])');
    for (const [name, value] of [['reproductive_screen_path',reproductive],['hormone_pathway',hormone]]) {
      const options = [...panel.querySelectorAll(`[name="${name}"]`)];
      if (options.length) {
        const control = options.find(c => c.tagName === 'SELECT' || c.value === value);
        assert.ok(control, `Unknown pathway: ${value}`);
        input(control, control.type === 'radio' ? true : value);
      }
    }
    for (const screen of panel.querySelectorAll('[data-symptom-screen]')) {
      if (!active(screen)) continue;
      input([...screen.querySelectorAll('input')].find(c => c.value === 'None of these'), true);
    }
    if (index() === 1) input(panel.querySelector('[name="primary_goals"]'), true);
    for (const c of panel.querySelectorAll('[required]')) {
      if (!active(c) || c.checkValidity()) continue;
      if (['radio', 'checkbox'].includes(c.type)) input(c, true);
      else input(c, c.tagName === 'SELECT' ? c.options[1].value : 'Synthetic answer');
    }
  }
  return {dom,w,d,form,posts,input,set,choose,index,next,start,person,fillPanel};
}

test('first lead saves independently; failed lead does not advance', async () => {
  for (const fails of [false,true]) {
    const f = fixture(fails);
    await f.start();
    assert.equal(f.posts.length,1);
    assert.equal(f.posts[0].get('form-name'),'vitality-lead');
    assert.equal(f.posts[0].has('assessment_for'),false);
    assert.equal(f.posts[0].has('assessed_first_name'),false);
    assert.equal(f.d.querySelector('[data-assessment-step]').hidden,fails);
    f.dom.window.close();
  }
});

test('proxy details, relationship, age and authorization are required; switching hides stale values', async () => {
  const f = fixture();
  await f.start();
  f.person('Someone else');
  for (const [name,bad,good] of [['assessed_first_name','   ','Synthetic'],['assessed_last_name','','Subject'],['assessed_age','-1','35'],['assessed_age','126','35'],['assessed_age','1.5','35'],['assessed_relationship','   ','Sibling']]) {
    f.set(name,bad); f.set('assessment_authorization',true);
    await f.next(); assert.equal(f.index(),0,`${name} must block`);
    f.set(name,good);
  }
  assert.equal(f.form.elements.assessment_authorization.checked,false);
  await f.next(); assert.equal(f.index(),0,'permission must be confirmed after changes');
  f.set('assessment_authorization',true);
  f.choose('Myself');
  assert.equal(f.form.elements.assessment_authorization.checked,false);
  const payload = new f.w.FormData(f.form);
  for (const name of ['assessed_first_name','assessed_last_name','assessed_age','assessed_relationship','assessment_authorization']) assert.equal(payload.has(name),false);
  await f.next(); assert.equal(f.index(),1);
  assert.equal(f.form.elements.assessment_for_name.value,'Synthetic Respondent');
  f.dom.window.close();
});

const completions = [
  ['Myself','', 'Neither / prefer not to answer','Male'],
  ['My child','19','Male','Male'],
  ['My spouse','35','Female','Pregnant'],
  ['Someone else','35','Female','Postpartum'],
  ['Someone else','55','Female','Perimenopause'],
  ['Someone else','60','Female','Menopause']
];
for (const [choice,age,reproductive,hormone] of completions) {
  test(`full completion: ${choice}, age ${age || 'self'}, ${reproductive}, ${hormone}`, async () => {
    const f = fixture();
    await f.start(); f.person(choice,age);
    assert.equal(f.form.querySelector('[data-assessment-person]').closest('[data-panel]').dataset.panel,'0');
    await f.next(); assert.equal(f.index(),1);
    for (let section=1;section<14;section++) {
      assert.equal(f.index(),section);
      f.fillPanel(reproductive,hormone);
      await f.next();
      assert.equal(f.d.querySelector('[data-assessment-error]').classList.contains('show'),false,`blocked on ${section}`);
    }
    assert.equal(f.posts.length,2);
    const response=f.posts[1];
    assert.equal(response.get('form-name'),'vitality-assessment');
    assert.equal(response.get('reproductive_screen_path'),reproductive);
    assert.equal(response.get('hormone_pathway'),hormone);
    assert.equal(response.get('first_name'),'Synthetic');
    assert.equal(response.get('last_name'),'Respondent');
    assert.equal(response.get('assessment_for_name'),choice==='Myself'?'Synthetic Respondent':'Synthetic Subject');
    assert.match(response.get('assessment_summary'),/Completed by: Synthetic Respondent/);
    if (choice!=='Myself') {
      assert.match(response.get('assessment_summary'),/Assessment for: Synthetic Subject/);
      assert.equal(response.get('assessed_age'),age);
      assert.equal(response.get('assessment_authorization'),Number(age)<18?'Parent or legal guardian authorization':'Permission to complete and share assessment');
    }
    assert.equal(response.has('assessed_relationship'),choice==='Someone else');
    assert.equal(f.d.querySelector('[data-complete-step]').hidden,false);
    assert.equal(f.w.localStorage.length,0);
    assert.equal(f.w.sessionStorage.length,0);
    f.dom.window.close();
  });
}

test('new subject display is text-only and never alters clinical section markup', async () => {
  const f = fixture();
  await f.start();
  const clinicalBefore=[...f.d.querySelectorAll('[data-panel]')].slice(1).map(p=>p.innerHTML);
  f.person('Someone else');
  f.set('assessed_first_name','<img src=x onerror=alert(1)>');
  f.set('assessment_authorization',true);
  await f.next();
  assert.equal(f.d.querySelector('[data-person-context] img'),null);
  assert.match(f.d.querySelector('[data-person-context]').textContent,/<img/);
  const clinicalAfter=[...f.d.querySelectorAll('[data-panel]')].slice(1).map(p=>p.innerHTML);
  assert.deepEqual(clinicalAfter,clinicalBefore);
  f.dom.window.close();
});

function fillChildPanel(f, concerns = false) {
  const panel = f.d.querySelector('[data-panel]:not([hidden])');
  for (const group of panel.querySelectorAll('[data-child-required]')) {
    if (group.closest('[hidden]')) continue;
    const boxes = [...group.querySelectorAll('input[type="checkbox"]:not([disabled])')];
    const choice = concerns && group.hasAttribute('data-child-concerns')
      ? boxes.find(c=>!['Easy to pass','Generally comfortable'].includes(c.value))
      : boxes.find(c=>c.value === 'Not applicable to age or development');
    if (choice) f.input(choice, true);
  }
  for (const c of panel.querySelectorAll('[required]')) {
    if (c.disabled || c.closest('[hidden]') || c.checkValidity()) continue;
    if (['radio','checkbox'].includes(c.type)) f.input(c,true);
    else if (c.tagName==='SELECT') f.input(c,[...c.options].find(o=>o.value==='Not applicable to age or development')?.value || c.options[1].value);
    else f.input(c,'Not sure yet');
  }
}

for (const age of ['0','8','18']) {
  test(`child age ${age}: full approved questionnaire, independent lead, child-only coach record`, async () => {
    const f=fixture();
    await f.start(); f.person('My child',age);
    assert.equal(f.form.elements.assessment_pathway.value,'Child (ages 0–18)');
    assert.equal(f.d.querySelectorAll('[data-panel]').length,14);
    assert.equal(f.form.querySelector('[name="hormone_pathway"]'),null);
    assert.equal(f.form.querySelector('[name="reproductive_screen_path"]'),null);
    assert.equal(f.form.querySelector('[name="self_harm_safety_flag"]'),null);
    assert.equal(f.form.elements.assessment_authorization.value,Number(age)<18?'Parent or legal guardian authorization':'Permission to complete and share assessment');
    await f.next();
    assert.equal(f.d.querySelector('[data-section-label]').textContent,'Whole-Child Snapshot');
    for (let section=1;section<14;section++) {
      assert.equal(f.index(),section);
      fillChildPanel(f, age==='8');
      await f.next();
      assert.equal(f.d.querySelector('[data-assessment-error]').classList.contains('show'),false,`child blocked on section ${section}`);
    }
    assert.equal(f.posts.length,2);
    assert.equal(f.posts[0].get('form-name'),'vitality-lead');
    const payload=f.posts[1];
    assert.equal(payload.get('form-name'),'vitality-assessment');
    assert.equal(payload.get('assessment_pathway'),'Child (ages 0–18)');
    assert.equal(payload.get('assessed_age'),age);
    assert.match(payload.get('assessment_summary'),/WHOLE-CHILD SNAPSHOT/);
    assert.match(payload.get('assessment_summary'),/Assessment for: Synthetic Subject/);
    assert.match(payload.get('assessment_summary'),/What one change would make daily life better/);
    assert.equal(payload.has('hormone_pathway'),false);
    assert.equal(payload.has('reproductive_screen_path'),false);
    assert.equal(payload.has('health_spectrum_stage'),false);
    assert.equal(f.d.querySelector('[data-complete-step]').hidden,false);
    assert.equal(f.w.localStorage.length+f.w.sessionStorage.length,0);
    f.dom.window.close();
  });
}

test('switching child/adult question sets drops stale answers and preserves lead and identity controls', async () => {
  const f=fixture(); await f.start(); f.person('Myself');
  f.input(f.form.querySelector('[name="primary_goals"]'),true);
  f.person('My child','12');
  assert.equal(f.form.elements.primary_goals,undefined);
  f.set('child_goal_90_days','Synthetic child-only goal');
  f.set('assessed_age','18');
  assert.equal(f.form.elements.assessment_pathway.value,'Child (ages 0–18)');
  assert.equal(f.form.elements.child_goal_90_days.value,'Synthetic child-only goal');
  f.set('assessed_age','19');
  assert.equal(f.form.elements.assessment_pathway.value,'Adult');
  assert.equal(f.form.elements.child_goal_90_days,undefined);
  assert.equal(f.form.querySelector('[name="primary_goals"]:checked'),null);
  assert.equal(f.form.elements.assessment_authorization.checked,false);
  assert.equal(f.form.elements.first_name.value,'Synthetic');
  f.set('assessed_age','0');
  assert.equal(f.form.elements.assessment_pathway.value,'Child (ages 0–18)');
  assert.equal(f.form.elements.child_goal_90_days.value,'');
  f.choose('Myself');
  assert.equal(f.form.elements.assessment_pathway.value,'Adult');
  assert.equal(new f.w.FormData(f.form).has('assessed_age'),false);
  assert.equal(f.posts.length,1);
  f.dom.window.close();
});

test('child follow-ups clear deselected concerns; period and digestion branches disable hidden answers', async () => {
  const f=fixture(); await f.start(); f.person('My child','13');
  const selectCheck=(name,value)=>f.input([...f.form.querySelectorAll(`[name="${name}"]`)].find(c=>c.value===value),true);
  selectCheck('child_stool_concerns','Hard or pellet-like');
  assert.equal(f.form.querySelectorAll('[name^="child_stool_concerns_hard_or_pellet_like_"]').length,6);
  selectCheck('child_stool_concerns','Not applicable to age or development');
  assert.equal(f.form.querySelectorAll('[name^="child_stool_concerns_hard_or_pellet_like_"]').length,0);
  selectCheck('child_digestion_concerns','Tummy pain');
  selectCheck('child_digestion_timing','During or after meals');
  assert.equal(new f.w.FormData(f.form).has('child_digestion_timing'),true);
  selectCheck('child_digestion_concerns','None observed');
  assert.equal(new f.w.FormData(f.form).has('child_digestion_timing'),false);
  f.set('child_periods_begun','Yes');
  f.set('child_period_concerns','Some effect');
  assert.equal(new f.w.FormData(f.form).get('child_period_concerns'),'Some effect');
  f.set('child_periods_begun','No');
  assert.equal(f.form.elements.child_period_concerns.disabled,true);
  assert.equal(new f.w.FormData(f.form).has('child_period_concerns'),false);
  selectCheck('child_sleep_concerns','Frequent snoring');
  assert.equal(f.d.querySelector('[data-child-sleep-guidance]').hidden,false);
  assert.equal(f.w.ReVitalizedChildAssessment.reviewFlags(f.form).length,1);
  selectCheck('child_sleep_concerns','None observed');
  assert.equal(f.d.querySelector('[data-child-sleep-guidance]').hidden,true);
  assert.equal(f.w.ReVitalizedChildAssessment.reviewFlags(f.form).length,0);
  f.dom.window.close();
});

test('child required choices and detail questions block precisely; skipped optional puberty does not block', async () => {
  const f=fixture(); await f.start(); f.person('My child','10'); await f.next();
  fillChildPanel(f);
  f.form.querySelectorAll('[name="child_goals"]').forEach(c=>{c.checked=false;});
  await f.next(); assert.equal(f.index(),1);
  assert.match(f.d.querySelector('[data-assessment-error]').textContent,/What would you most like support/);
  f.form.querySelectorAll('[name="child_goals"]').forEach((c,i)=>{c.checked=i<4;});
  await f.next(); assert.equal(f.index(),1);
  assert.match(f.d.querySelector('[data-assessment-error]').textContent,/no more than 3/);
  f.input([...f.form.querySelectorAll('[name="child_goals"]')].find(c=>c.value==='Not sure / not observed'),true);
  await f.next(); assert.equal(f.index(),2);
  fillChildPanel(f);
  f.input([...f.form.querySelectorAll('[name="child_hydration_concerns"]')].find(c=>c.value==='Dry mouth or lips'),true);
  await f.next(); assert.equal(f.index(),2,'empty concern details must block');
  f.input([...f.form.querySelectorAll('[name="child_hydration_concerns"]')].find(c=>c.value==='None observed'),true);
  await f.next(); assert.equal(f.index(),3,'deselected concern details must not block');
  f.dom.window.close();
});

test('missing child module blocks child continuation without losing captured lead or breaking adults', async () => {
  const f=fixture(false,false); await f.start(); f.person('My child','8');
  await f.next(); assert.equal(f.index(),0);
  assert.match(f.d.querySelector('[data-assessment-error]').textContent,/children’s questions could not load/);
  assert.equal(f.posts.length,1);
  f.person('Myself'); await f.next(); assert.equal(f.index(),1);
  f.dom.window.close();
});
