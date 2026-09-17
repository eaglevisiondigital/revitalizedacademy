/*
 * ReVitalized Enrollment Backend Bridge
 *
 * Transitional integration between the existing Netlify enrollment
 * experience and the Global Propel backend.
 *
 * IMPORTANT:
 * - If REVITALIZED_API_BASE is not configured, this file does nothing.
 * - The existing Netlify enrollment submission remains the fallback.
 * - No health-assessment answers are handled here.
 * - Resume tokens are stored only in sessionStorage for the current
 *   browser session and are never placed in the URL.
 */

(() => {
  'use strict';

  const form = document.getElementById('enrollment-step-one');
  if (!form) return;

  const status = document.getElementById('form-status');

  let bridgeSubmitting = false;

  const getApiBase = () =>
    String(window.REVITALIZED_API_BASE || '')
      .trim()
      .replace(/\/+$/, '');

  const value = (name) => {
    const control = form.elements.namedItem(name);
    return control ? String(control.value || '').trim() : '';
  };

  const splitName = (raw) => {
    const parts = String(raw || '')
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(Boolean);

    return {
      firstName: parts.shift() || '',
      lastName: parts.join(' ')
    };
  };

  const saveResumeContext = (apiBase, result) => {
    const context = {
      version: 'public-enrollment-v1',
      apiBase,
      enrollmentApplicationId: result.enrollmentApplicationId,
      resumeToken: result.resumeToken,
      resumeTokenExpiresAt: result.resumeTokenExpiresAt,
      currentStep: result.currentStep,
      status: result.status,
      savedAt: new Date().toISOString()
    };

    try {
      sessionStorage.setItem(
        'ra_public_enrollment_v1',
        JSON.stringify(context)
      );
    } catch (error) {
      console.warn(
        'ReVitalized enrollment resume context could not be stored.',
        error
      );
    }
  };

  const continueExistingEnrollmentFlow = () => {
    HTMLFormElement.prototype.submit.call(form);
  };

  form.addEventListener('submit', async (event) => {
    /*
     * Existing ReVitalized validation scripts load before this bridge.
     * If they rejected the form, we do nothing.
     */
    if (event.defaultPrevented) return;

    const apiBase = getApiBase();

    /*
     * Production-safe feature flag:
     * without an API base, the existing Netlify submission proceeds
     * exactly as it does today.
     */
    if (!apiBase) return;

    event.preventDefault();

    if (bridgeSubmitting) return;
    bridgeSubmitting = true;

    const hiddenFirstName = value('first_name');
    const hiddenLastName = value('last_name');
    const parsedName = splitName(value('full_name'));

    const firstName =
      hiddenFirstName || parsedName.firstName;

    const lastName =
      hiddenLastName || parsedName.lastName;

    const payload = {
      firstName,
      lastName,
      email: value('email'),
      phone: value('phone'),

      /*
       * Website plan codes are not yet mapped to Programs-module GUIDs.
       * Program selection will be connected in the next integration
       * layer rather than guessing IDs here.
       */
      programId: null,

      /*
       * ReVitalized enrollment Step 2 is the Health Profile.
       * 2 = HealthProfile in the public API contract.
       *
       * The standalone Free Vitality Assessment remains separate.
       */
      assessmentPath: 2
    };

    try {
      const response = await fetch(
        `${apiBase}/api/public/enrollment/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(
          `Enrollment API returned ${response.status}.`
        );
      }

      const result = await response.json();

      if (
        !result ||
        !result.enrollmentApplicationId ||
        !result.resumeToken
      ) {
        throw new Error(
          'Enrollment API returned an incomplete response.'
        );
      }

      saveResumeContext(apiBase, result);

      /*
       * Keep the existing Netlify submission too during the transition.
       * This preserves today's lead notification / form backup behavior
       * and keeps the current thank-you → Health Profile flow intact.
       */
      continueExistingEnrollmentFlow();
    } catch (error) {
      console.warn(
        'Global Propel enrollment bridge unavailable; using existing Netlify fallback.',
        error
      );

      /*
       * Never block a real applicant because the new backend is
       * temporarily unavailable.
       */
      if (status) {
        status.textContent =
          'Saving your first step and continuing…';
        status.className = 'ra-form-status';
      }

      continueExistingEnrollmentFlow();
    }
  });
})();
