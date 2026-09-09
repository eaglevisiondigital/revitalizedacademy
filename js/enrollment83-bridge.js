/* Build 83 — enrollment data bridge
   Adds stable, non-visible identifiers for future backend/profile integration.
   No health answers are stored in browser storage. */
(() => {
  'use strict';

  const form = document.getElementById('enrollment-step-one');
  if (!form) return;

  const byId = (id) => document.getElementById(id);
  const setValue = (id, value) => {
    const input = byId(id);
    if (input) input.value = value || '';
  };

  const makeSessionId = () => {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `ra-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  };

  let sessionId = '';
  try {
    sessionId = sessionStorage.getItem('ra_enrollment_session_id') || makeSessionId();
    sessionStorage.setItem('ra_enrollment_session_id', sessionId);
  } catch (_) {
    sessionId = makeSessionId();
  }

  setValue('enrollment-session-id', sessionId);
  setValue('client-started-at', new Date().toISOString());

  const fullName = byId('full-name');
  const syncName = () => {
    const raw = String(fullName?.value || '').trim().replace(/\s+/g, ' ');
    if (!raw) {
      setValue('first-name-hidden', '');
      setValue('last-name-hidden', '');
      return;
    }
    const parts = raw.split(' ');
    setValue('first-name-hidden', parts.shift() || '');
    setValue('last-name-hidden', parts.join(' '));
  };

  const syncPlan = () => {
    const selected = form.querySelector('[name="program_interest"]:checked');
    setValue('selected-plan-code', selected?.dataset.plan || '');
  };

  fullName?.addEventListener('input', syncName);
  form.querySelectorAll('[name="program_interest"]').forEach((radio) => {
    radio.addEventListener('change', syncPlan);
  });

  syncName();
  syncPlan();

  form.addEventListener('submit', (event) => {
    if (event.defaultPrevented) return;
    syncName();
    syncPlan();
    const now = new Date().toISOString();
    setValue('client-submitted-at', now);
    const consent = form.querySelector('[name="application_contact_consent"]');
    setValue('contact-consent-at', consent?.checked ? now : '');
  });
})();
