const fs = require('fs');
const assert = require('assert');

const plans = fs.readFileSync('plans.html', 'utf8');
const enroll = fs.readFileSync('enroll.html', 'utf8');
const thankYou = fs.readFileSync('enrollment-thank-you.html', 'utf8');
const css = fs.readFileSync('css/enrollment82.css', 'utf8');
const js = fs.readFileSync('js/enrollment82.js', 'utf8');

const requiredPrograms = [
  'Holistic Foundations',
  'Vitality Accelerator Cohort',
  'Vitality Accelerator',
  '6-Month Intensive',
  'Total Wellness Intensive — 12 Month'
];
requiredPrograms.forEach((name) => assert(plans.includes(name), `Missing plan: ${name}`));

assert(plans.includes('$25'), 'Holistic Foundations public price missing');
assert(plans.includes('$89/month'), 'Holistic Foundations monthly payment option missing');
assert(plans.includes('3-month minimum'), 'Holistic Foundations minimum commitment missing');
assert(enroll.includes('$25/week or $89/month · 3-month minimum'), 'Enrollment Foundations billing summary missing');
assert(plans.includes('$1,000'), 'Cohort public price missing');
assert(plans.includes('$2,000'), 'Accelerator public price missing');
assert(plans.includes('Personalized investment'), 'Private pricing language missing');
['$7,500', '$30,000', '$1,250', '$2,500', '$3,750', '$10,000', '$20,000'].forEach((amount) => {
  assert(!plans.includes(amount), `Private/high-tier amount leaked on public programs page: ${amount}`);
  assert(!enroll.includes(amount), `Private/high-tier amount leaked on enrollment page: ${amount}`);
});

assert(enroll.includes('name="enrollment"'), 'Netlify enrollment form name changed');
assert(enroll.includes('data-netlify="true"'), 'Netlify form detection missing');
assert(enroll.includes('action="enrollment-thank-you.html"'), 'Confirmation route missing');
assert(enroll.includes('name="enrollment_stage" value="initial-lead-capture"'), 'Lead-capture stage marker missing');

const planValues = [...enroll.matchAll(/name="program_interest" value="([^"]+)"/g)].map((m) => m[1]);
assert.strictEqual(planValues.length, 6, `Expected 6 program choices including undecided; found ${planValues.length}`);
assert(planValues.includes("I'm not sure yet"), 'Undecided plan option missing');

const requiredLeadFields = ['full_name', 'email', 'phone', 'age', 'sex', 'biggest_goals', 'program_interest', 'start_timeline'];
requiredLeadFields.forEach((name) => assert(enroll.includes(`name="${name}"`), `Missing Step 1 field: ${name}`));
assert(enroll.includes('name="referral_source"'), 'Optional referral source missing');
assert(enroll.includes('name="application_contact_consent"'), 'Application follow-up consent missing');

assert(thankYou.includes('Step 1 complete'), 'Confirmation copy missing');
assert(css.includes('--ra-forest:#154734'), 'Approved emerald styling missing');
assert(css.includes('--ra-cream:#fcf5ee'), 'Approved cream styling missing');
assert(css.includes('--ra-gold:#b18845'), 'Approved gold styling missing');
assert(enroll.includes('css/enrollment82-program-picker.css?v=82.1'), 'Premium program picker stylesheet missing');
assert(enroll.includes('Which path feels closest to where you want to begin?'), 'Premium program picker heading missing');
assert(fs.existsSync('css/enrollment82-program-picker.css'), 'Program picker refinement CSS missing');
assert(js.includes("allowedPlans"), 'Plan preselection logic missing');
assert(js.includes("utm_source"), 'Attribution capture missing');

const protectedFiles = ['consult.html','js/vitality55.js','css/vitality55.css','disclaimer.html','tests/assessment-person.cjs','.github/workflows/assessment-regression.yml','BUILD71-ASSESSMENT-RESTORE.md'];
protectedFiles.forEach((path) => assert(fs.existsSync(path), `Protected assessment file missing: ${path}`));

console.log('Enrollment Build 82 static checks passed.');
