/* Build 90 — bridge transient Step 1 identity/contact context into the post-enrollment health profile.
   The approved assessment engines remain unchanged. No health answers are stored here. */
(() => {
  'use strict';

  const body = document.body;
  const assessmentForm = document.querySelector('[data-assessment-form]');
  const assessmentStep = document.querySelector('[data-assessment-step]');
  const recovery = document.querySelector('[data-health90-recovery]');
  const personSection = document.querySelector('[data-assessment-person]');
  const contextPill = document.querySelector('[data-health90-person-pill]');
  const contextNote = document.querySelector('[data-health90-context-note]');
  if (!assessmentForm || !assessmentStep) return;

  const splitName = (raw) => {
    const parts = String(raw || '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
    return { first: parts.shift() || '', last: parts.join(' ') };
  };

  let context = null;
  try {
    const raw = sessionStorage.getItem('ra_enrollment_context_v2');
    if (raw) context = JSON.parse(raw);
  } catch (_) {}

  if (!context || !context.full_name || !context.email || !context.phone || !context.enrollment_for) {
    assessmentStep.hidden = true;
    if (recovery) recovery.hidden = false;
    body.classList.add('health90-context-missing');
    return;
  }

  const target = splitName(context.full_name);
  const proxy = context.enrollment_for === 'spouse' || context.enrollment_for === 'child';
  const respondent = splitName(proxy ? context.completed_by_name : context.full_name);

  const setValue = (selector, value) => {
    const el = assessmentForm.querySelector(selector);
    if (el) el.value = value == null ? '' : String(value);
    return el;
  };

  setValue('[data-copy-field="first_name"]', respondent.first);
  setValue('[data-copy-field="last_name"]', respondent.last);
  setValue('[data-copy-field="email"]', context.email);
  setValue('[data-copy-field="phone"]', context.phone);
  setValue('[name="enrollment_session_id"]', context.enrollment_session_id);
  setValue('[name="enrollment_program_interest"]', context.program_interest);
  setValue('[name="enrollment_plan_code"]', context.selected_plan_code);
  setValue('[name="enrollment_for_context"]', context.enrollment_for);

  const routeMap = { self: 'Myself', spouse: 'My spouse', child: 'My child' };
  const routeValue = routeMap[context.enrollment_for] || 'Myself';
  const route = assessmentForm.querySelector(`[name="assessment_for"][value="${routeValue}"]`);
  if (route) {
    route.checked = true;
    route.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (proxy) {
    const first = setValue('[name="assessed_first_name"]', target.first);
    const last = setValue('[name="assessed_last_name"]', target.last);
    const age = setValue('[name="assessed_age"]', context.age);
    [first, last, age].forEach((el) => {
      if (!el) return;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  const reproductive = assessmentForm.elements.namedItem('reproductive_screen_path');
  if (reproductive && (context.gender === 'Male' || context.gender === 'Female')) {
    reproductive.value = context.gender;
    reproductive.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const displayName = context.full_name;
  if (contextPill) contextPill.textContent = `Health profile for ${displayName}`;
  if (contextNote) {
    if (context.enrollment_for === 'spouse') {
      contextNote.innerHTML = `<strong>Continuing ${displayName}’s health profile.</strong> The adult being enrolled should answer these health questions personally whenever possible. If they need help navigating the form, you may assist them with their permission.`;
    } else if (context.enrollment_for === 'child') {
      contextNote.innerHTML = `<strong>Continuing ${displayName}’s health profile.</strong> A parent or guardian may answer and assist with the child’s questions. The child’s information remains connected to their own individual profile within the family journey.`;
    } else {
      contextNote.innerHTML = `<strong>Step 1 is saved.</strong> We already have your basic enrollment information, so this page begins directly with the deeper health profile instead of asking you to enter it again.`;
    }
  }

  if (personSection) {
    const routeFieldset = personSection.querySelector('fieldset.vitality-question');
    if (routeFieldset) routeFieldset.hidden = true;

    if (!proxy) {
      personSection.hidden = true;
      body.classList.add('health90-self');
    } else {
      body.classList.add('health90-proxy');
      const proxyWrap = personSection.querySelector('[data-show-when="assessment_for:My child|My spouse|Someone else"]');
      if (proxyWrap) proxyWrap.classList.add('health90-prefilled-proxy');
      const heading = personSection.querySelector('h3');
      if (heading) heading.textContent = 'Confirm before continuing';
      const authLabel = personSection.querySelector('[data-authorization-label]');
      if (authLabel) {
        authLabel.textContent = context.enrollment_for === 'child'
          ? `I confirm that I am the parent, legal guardian, or otherwise authorized to complete and share this health profile for ${displayName}.`
          : `I confirm that ${displayName} is answering these health questions personally, or that I am assisting with their permission because they need help navigating the form.`;
      }
    }
  }

  body.classList.add('health90-context-ready');
})();
