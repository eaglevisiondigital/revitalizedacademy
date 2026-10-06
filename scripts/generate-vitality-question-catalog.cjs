const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const dom = new JSDOM(fs.readFileSync(path.join(root, 'consult.html'), 'utf8'), {
  url: 'https://revitalizedacademy.com/consult.html',
  runScripts: 'outside-only'
});
const { window } = dom;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.CSS ||= {};
window.CSS.escape ||= (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);

window.eval(fs.readFileSync(path.join(root, 'js/vitality-child.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(root, 'js/vitality55.js'), 'utf8'));

const clean = (value) => String(value || '').replace(/\s*\*\s*$/, '').replace(/\s+/g, ' ').trim();
function labelFor(control) {
  const question = control.closest('.vitality-question');
  const direct = question && (question.querySelector(':scope > legend') || question.querySelector(':scope > .vitality-question-label'));
  if (direct) return clean(direct.textContent);
  if (control.id) {
    const explicit = window.document.querySelector(`label[for="${window.CSS.escape(control.id)}"]`);
    if (explicit) return clean(explicit.textContent);
  }
  const wrapped = control.closest('label');
  if (wrapped) {
    const clone = wrapped.cloneNode(true);
    clone.querySelectorAll('input,select,textarea').forEach((node) => node.remove());
    return clean(clone.textContent);
  }
  return clean(control.name.replaceAll('_', ' '));
}

function capture() {
  const sections = [];
  const fields = {};
  window.document.querySelectorAll('[data-assessment-stage] > [data-panel]').forEach((panel, index) => {
    const title = clean(panel.querySelector('.vitality-panel-head h2')?.textContent || `Section ${index + 1}`);
    sections.push(title);
    panel.querySelectorAll('input[name],select[name],textarea[name]').forEach((control) => {
      if (control.type === 'hidden' || control.name === 'bot-field' || control.hasAttribute('data-assessment-summary')) return;
      fields[control.name] ||= { label: labelFor(control), section: title, kind: control.type || control.tagName.toLowerCase() };
    });
  });
  return { sections, fields };
}

const catalog = { Adult: capture() };
const form = window.document.querySelector('[data-assessment-form]');
const child = form.querySelector('[name="assessment_for"][value="My child"]');
child.checked = true;
child.dispatchEvent(new window.Event('input', { bubbles: true }));
const age = form.elements.assessed_age;
age.value = '8';
age.dispatchEvent(new window.Event('input', { bubbles: true }));
catalog['Child (ages 0–18)'] = capture();

const target = path.join(root, 'portal/vitality-question-catalog.js');
fs.writeFileSync(target, `window.RVA_VITALITY_QUESTION_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`);
console.log(JSON.stringify({ target, adultFields: Object.keys(catalog.Adult.fields).length, childFields: Object.keys(catalog['Child (ages 0–18)'].fields).length }));
dom.window.close();
