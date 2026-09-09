(() => {
  'use strict';

  const form = document.getElementById('enrollment-step-one');
  const navButton = document.querySelector('.ra-menu-toggle');
  const nav = document.querySelector('.ra-nav');

  if (navButton && nav) {
    navButton.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navButton.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navButton.setAttribute('aria-expanded', 'false');
    }));
  }

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const allowedPlans = new Set([
    'holistic-foundations',
    'vitality-accelerator-cohort',
    'vitality-accelerator',
    'total-wellness-6',
    'total-wellness-12',
    'not-sure'
  ]);
  const requestedPlan = params.get('plan');
  if (requestedPlan && allowedPlans.has(requestedPlan)) {
    const input = form.querySelector(`[data-plan="${CSS.escape(requestedPlan)}"]`);
    if (input) {
      input.checked = true;
      document.getElementById('program-source').value = 'plans-page-or-linked-cta';
    }
  }

  const utmMap = {
    utm_source: 'utm-source',
    utm_medium: 'utm-medium',
    utm_campaign: 'utm-campaign'
  };
  Object.entries(utmMap).forEach(([param, id]) => {
    const value = params.get(param);
    if (value) document.getElementById(id).value = value.slice(0, 250);
  });

  const fields = [...form.querySelectorAll('[data-field]')];
  const programFieldset = form.querySelector('[data-program-fieldset]');
  const programError = form.querySelector('[data-program-error]');
  const status = document.getElementById('form-status');
  const submit = document.getElementById('enrollment-submit');
  const consent = form.querySelector('[name="application_contact_consent"]');

  const setFieldState = (wrapper, valid) => {
    wrapper.classList.toggle('is-invalid', !valid);
    const control = wrapper.querySelector('input, select, textarea');
    if (control) {
      if (valid) control.removeAttribute('aria-invalid');
      else control.setAttribute('aria-invalid', 'true');
    }
  };

  const validateField = (wrapper) => {
    const control = wrapper.querySelector('input, select, textarea');
    if (!control || !control.required) {
      setFieldState(wrapper, true);
      return true;
    }
    let valid = control.validity.valid && String(control.value || '').trim().length > 0;
    if (control.type === 'email' && control.value) valid = control.validity.valid;
    if (control.id === 'phone' && control.value) valid = control.value.replace(/\D/g, '').length >= 10;
    setFieldState(wrapper, valid);
    return valid;
  };

  const validatePrograms = () => {
    const valid = Boolean(form.querySelector('[name="program_interest"]:checked'));
    programFieldset.classList.toggle('is-invalid', !valid);
    programError.style.display = valid ? 'none' : 'block';
    return valid;
  };

  fields.forEach((wrapper) => {
    wrapper.addEventListener('input', () => {
      if (wrapper.classList.contains('is-invalid')) validateField(wrapper);
    });
    wrapper.addEventListener('change', () => validateField(wrapper));
  });

  form.querySelectorAll('[name="program_interest"]').forEach((input) => input.addEventListener('change', validatePrograms));

  form.addEventListener('submit', (event) => {
    let firstInvalid = null;
    fields.forEach((wrapper) => {
      const valid = validateField(wrapper);
      if (!valid && !firstInvalid) firstInvalid = wrapper.querySelector('input, select, textarea');
    });
    const programsValid = validatePrograms();
    const consentValid = consent && consent.checked;
    if (!consentValid && !firstInvalid) firstInvalid = consent;

    if (!programsValid && !firstInvalid) firstInvalid = form.querySelector('[name="program_interest"]');

    if (firstInvalid || !programsValid || !consentValid) {
      event.preventDefault();
      status.textContent = 'Please complete the required information before continuing.';
      status.className = 'ra-form-status is-error';
      if (!consentValid) consent.setAttribute('aria-invalid', 'true');
      firstInvalid?.focus();
      return;
    }

    consent.removeAttribute('aria-invalid');
    submit.disabled = true;
    submit.innerHTML = 'Saving Step 1…';
  });
})();
