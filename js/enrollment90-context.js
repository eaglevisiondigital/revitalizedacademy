/* Build 90 — carry non-health Step 1 enrollment context into the next page.
   This stores identity/contact/routing context in sessionStorage only. It does not store health answers. */
(() => {
  'use strict';
  const form = document.getElementById('enrollment-step-one');
  if (!form) return;

  const value = (name) => {
    const control = form.elements.namedItem(name);
    if (!control) return '';
    if (control instanceof RadioNodeList) return String(control.value || '').trim();
    return String(control.value || '').trim();
  };

  form.addEventListener('submit', (event) => {
    if (event.defaultPrevented) return;
    const selectedPlan = form.querySelector('[name="program_interest"]:checked');
    const context = {
      version: 'enrollment-step1-v2',
      enrollment_session_id: value('enrollment_session_id'),
      enrollment_for: value('enrollment_for'),
      completed_by_name: value('completed_by_name'),
      full_name: value('full_name'),
      email: value('email'),
      phone: value('phone'),
      age: value('age'),
      gender: value('sex'),
      referral_source: value('referral_source'),
      program_interest: selectedPlan ? selectedPlan.value : '',
      selected_plan_code: selectedPlan ? (selectedPlan.dataset.plan || '') : '',
      start_timeline: value('start_timeline'),
      captured_at: new Date().toISOString()
    };
    try {
      sessionStorage.setItem('ra_enrollment_context_v2', JSON.stringify(context));
    } catch (_) {}
  });
})();
