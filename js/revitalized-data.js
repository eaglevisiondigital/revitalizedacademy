(() => {
  const ENDPOINT = 'https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/public-intake';
  const API_KEY = 'sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd';

  const updateWebinarCounter = (count) => {
    document.querySelectorAll('[data-webinar-priority-count]').forEach(el => el.textContent = String(count));
    document.querySelectorAll('[data-webinar-counter-copy]').forEach(el => {
      el.textContent = count > 0
        ? count + (count === 1 ? ' person has' : ' people have') + ' already joined the priority list.'
        : 'Be among the first to pre-register.';
    });
  };

  const loadWebinarCounter = () => {
    if (!document.querySelector('[data-webinar-priority-count]')) return;
    fetch(ENDPOINT + '?event_slug=founders-webinar-2026', {
      method: 'GET',
      headers: { 'apikey': API_KEY },
      cache: 'no-store'
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && Number.isFinite(Number(data.priority_count))) updateWebinarCounter(Number(data.priority_count)); })
      .catch(() => {});
  };

  const send = (payload, onSuccess) => {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify(payload),
      keepalive: true
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && payload.type === 'webinar' && Number.isFinite(Number(data.registration_count))) {
          updateWebinarCounter(Number(data.registration_count));
        }
        if (data && data.ok && typeof onSuccess === 'function') onSuccess(data);
      })
      .catch(() => {});
  };

  loadWebinarCounter();

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.matches('[data-refuel-notify-form]')) {
      event.preventDefault();
      const fd = new FormData(form);
      const button = form.querySelector('button[type="submit"]');
      const status = form.querySelector('[data-refuel-status]');
      if (button) button.disabled = true;
      if (status) status.textContent = 'Saving your spot on the ReFuel launch list...';
      send({
        type: 'refuel_notify',
        source: 'website_refuel_launch',
        first_name: fd.get('first_name'),
        email: fd.get('email'),
        website: fd.get('website') || ''
      }, () => {
        form.reset();
        if (button) button.disabled = false;
        if (status) status.textContent = 'You are on the list. We will let you know when ReFuel launches.';
      });
      setTimeout(() => { if (button) button.disabled = false; }, 6000);
      return;
    }

    if (form.matches('[data-vitality-lead-form]')) {
      const fd = new FormData(form);
      send({
        type: 'vitality_start',
        source: 'website_vitality_assessment',
        first_name: fd.get('first_name'),
        last_name: fd.get('last_name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        website: fd.get('bot-field') || ''
      });
      return;
    }

    if (form.id === 'enrollment-step-one') {
      const fd = new FormData(form);
      const fullName = String(fd.get('full_name') || '').trim();
      const parts = fullName.split(/\s+/);
      const checkedProgram = form.querySelector('input[name="program_interest"]:checked');
      send({
        type: 'enrollment_start',
        source: 'website_enrollment',
        first_name: parts.shift() || '',
        last_name: parts.join(' '),
        email: fd.get('email'),
        phone: fd.get('phone'),
        website: fd.get('bot-field') || '',
        answers: {
          enrollment_for: fd.get('enrollment_for'),
          completed_by_name: fd.get('completed_by_name'),
          age: fd.get('age'),
          sex: fd.get('sex'),
          referral_source: fd.get('referral_source'),
          biggest_goals: fd.get('biggest_goals'),
          program_interest: checkedProgram ? checkedProgram.value : '',
          start_timeline: fd.get('start_timeline')
        }
      });
      return;
    }

    if (form.name === 'revitalized-founders-webinar-priority') {
      const fd = new FormData(form);
      send({
        type: 'webinar',
        source: 'founders_webinar_priority',
        event_slug: 'founders-webinar-2026',
        first_name: fd.get('first-name'),
        last_name: fd.get('last-name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        primary_goal: fd.get('primary-goal'),
        referral_source: 'website_webinar',
        website: fd.get('company-site') || ''
      });
    }
  }, true);

  // Journey Engine bridge for the protected Vitality Assessment.
  // This observes progress/completion only. It does not read or transmit health answers.
  const installVitalityJourneyBridge = () => {
    const assessmentForm = document.querySelector('[data-vitality-assessment-form], form[data-assessment-form], form[name="vitality-assessment"]')
      || document.querySelector('[data-assessment-step] form');
    const completeStep = document.querySelector('[data-complete-step]');
    const progressPercent = document.querySelector('[data-progress-percent]');
    const sectionLabel = document.querySelector('[data-section-label]');

    if (!assessmentForm || !completeStep) return;

    let lastProgress = -1;
    let completionSent = false;
    let progressTimer = null;

    const fieldValue = (selector, fallbackName) => {
      const field = assessmentForm.querySelector(selector)
        || (fallbackName ? assessmentForm.elements.namedItem(fallbackName) : null);
      return field ? String(field.value || '').trim() : '';
    };

    const identity = () => ({
      first_name: fieldValue('[data-copy-field="first_name"]', 'first_name'),
      last_name: fieldValue('[data-copy-field="last_name"]', 'last_name'),
      email: fieldValue('[data-copy-field="email"]', 'email'),
      phone: fieldValue('[data-copy-field="phone"]', 'phone')
    });

    const sendProgress = () => {
      const person = identity();
      if (!person.email) return;

      const raw = String(progressPercent?.textContent || '').replace(/[^0-9]/g, '');
      const percent = Math.max(1, Math.min(99, Number(raw || 1)));
      const step = String(sectionLabel?.textContent || 'assessment').trim().slice(0, 160);

      if (percent === lastProgress) return;
      lastProgress = percent;

      send({
        type: 'vitality_progress',
        source: 'website_vitality_assessment',
        ...person,
        completion_percent: percent,
        current_step: step
      });
    };

    const queueProgress = () => {
      window.clearTimeout(progressTimer);
      progressTimer = window.setTimeout(sendProgress, 350);
    };

    const sendCompletion = () => {
      if (completionSent || completeStep.hidden) return;
      const person = identity();
      if (!person.email) return;

      completionSent = true;
      try {
        sessionStorage.setItem('ra_vitality_completed', 'true');
        sessionStorage.setItem('ra_vitality_completed_at', new Date().toISOString());
      } catch (_) {}

      send({
        type: 'vitality_complete',
        source: 'website_vitality_assessment',
        ...person,
        completion_percent: 100,
        current_step: 'complete'
      });
    };

    if (progressPercent) {
      new MutationObserver(queueProgress).observe(progressPercent, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    if (sectionLabel) {
      new MutationObserver(queueProgress).observe(sectionLabel, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    new MutationObserver(() => {
      sendCompletion();
    }).observe(completeStep, { attributes: true, attributeFilter: ['hidden'] });

    queueProgress();
    sendCompletion();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installVitalityJourneyBridge, { once: true });
  } else {
    installVitalityJourneyBridge();
  }

})();
