/* Build 94 — Step 3 Coaching Path client-side bridge.
   Carries only non-health enrollment context plus a Step 2 completion marker. */
(() => {
  'use strict';
  const content = document.querySelector('[data-cp94-content]');
  const recovery = document.querySelector('[data-cp94-recovery]');
  const person = document.querySelector('[data-cp94-person]');
  const program = document.querySelector('[data-cp94-program]');
  const programNote = document.querySelector('[data-cp94-program-note]');
  const form = document.querySelector('[data-cp94-form]');
  const status = document.querySelector('[data-cp94-status]');
  if (!content || !form) return;

  let context = null;
  let step2 = null;
  try {
    const rawContext = sessionStorage.getItem('ra_enrollment_context_v2');
    if (rawContext) context = JSON.parse(rawContext);
    const rawStep2 = sessionStorage.getItem('ra_health_profile_complete_v1');
    if (rawStep2) step2 = JSON.parse(rawStep2);
  } catch (_) {}

  const validContext = context && context.full_name && context.email && context.enrollment_for;
  const validStep2 = step2 && step2.completed === true && (!step2.enrollment_session_id || !context?.enrollment_session_id || step2.enrollment_session_id === context.enrollment_session_id);
  if (!validContext || !validStep2) {
    content.hidden = true;
    if (recovery) recovery.hidden = false;
    return;
  }

  if (person) person.textContent = `Coaching path for ${context.full_name}`;
  if (program) program.textContent = context.program_interest || 'I’m not sure yet';
  if (programNote) {
    programNote.textContent = context.program_interest && context.program_interest !== "I'm not sure yet"
      ? 'This is the starting point you selected in Step 1. The team can still confirm fit before your program begins.'
      : 'You chose to have the ReVitalized team help determine the best fit. Your coach can use Steps 1 and 2 to guide that conversation.';
  }

  const fields = {
    enrollment_session_id: context.enrollment_session_id || '',
    full_name: context.full_name || '',
    email: context.email || '',
    phone: context.phone || '',
    enrollment_for: context.enrollment_for || '',
    program_interest: context.program_interest || '',
    selected_plan_code: context.selected_plan_code || ''
  };
  Object.entries(fields).forEach(([name, value]) => {
    const el = form.elements.namedItem(name);
    if (el) el.value = value;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const original = button?.innerHTML || '';
    if (button) {
      button.disabled = true;
      button.textContent = 'Saving Step 3…';
    }
    if (status) {
      status.textContent = 'Saving your coaching preferences…';
      status.className = 'cp94-form-status is-working';
    }
    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!response.ok) throw new Error('submit failed');
      try {
        sessionStorage.setItem('ra_coaching_path_complete_v1', JSON.stringify({ completed: true, enrollment_session_id: context.enrollment_session_id || '', completed_at: new Date().toISOString() }));
      } catch (_) {}
      form.innerHTML = `<div class="cp94-complete-inline"><span>✓</span><div><strong>Step 3 complete.</strong><p>Your coaching and scheduling preferences have been saved. ReVitalized now has the information needed to prepare the next conversation and coach review.</p></div></div>`;
      if (status) status.textContent = '';
      window.scrollTo({ top: Math.max(0, form.getBoundingClientRect().top + window.scrollY - 150), behavior: 'smooth' });
    } catch (_) {
      if (button) {
        button.disabled = false;
        button.innerHTML = original;
      }
      if (status) {
        status.textContent = 'We could not save Step 3 just now. Please try again; your selections are still on this page.';
        status.className = 'cp94-form-status is-error';
      }
    }
  });
})();
