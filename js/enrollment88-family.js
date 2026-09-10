/* Build 88 — family-aware Step 1 enrollment context.
   Build 90 adds a transient Step 1 handoff for the post-enrollment health profile.
   No health answers are stored here and no assessment-owned files are touched. */
(() => {
  'use strict';

  /* Build 89 changes the shared header, not the enrollment-content styling baseline. */
  if (document.body?.classList.contains('ra-journey')) document.body.dataset.enrollmentBuild = '88';

  const form = document.getElementById('enrollment-step-one');
  if (!form) return;

  const choices = [...form.querySelectorAll('[name="enrollment_for"]')];
  const panel = document.getElementById('on-behalf-panel');
  const panelTitle = document.getElementById('on-behalf-title');
  const panelCopy = document.getElementById('on-behalf-copy');
  const authorization = document.getElementById('on-behalf-authorization');
  const completedBy = document.getElementById('completed-by-name');
  const aboutTitle = document.getElementById('about-person-title');
  const aboutHelp = document.getElementById('about-person-help');
  const fullNameLabel = document.getElementById('full-name-label-text');
  const ageLabel = document.getElementById('age-label-text');
  const emailHelp = document.getElementById('email-context-help');
  const phoneHelp = document.getElementById('phone-context-help');

  const copy = {
    self: {
      aboutTitle: 'About you',
      aboutHelp: 'The basics we’ll use to begin your ReVitalized profile.',
      fullName: 'Full name',
      age: 'Age',
      emailHelp: 'Use the email where you want to receive enrollment updates.',
      phoneHelp: 'Use the best number for enrollment follow-up.'
    },
    spouse: {
      aboutTitle: 'About your spouse',
      aboutHelp: 'We’ll begin a separate ReVitalized profile for the person being enrolled.',
      fullName: 'Spouse’s full name',
      age: 'Spouse’s age',
      emailHelp: 'Use the best email for this enrollment. It may be yours for this first step.',
      phoneHelp: 'Use the best number for enrollment follow-up.',
      panelTitle: 'You’re starting this enrollment for your spouse.',
      panelCopy: 'You can complete this initial enrollment on their behalf. When the health assessment begins, the adult being enrolled should answer their own health questions whenever possible so the information reflects their own experience. If they are not able to navigate the form independently, you may assist them.',
      authorization: 'By continuing, you’re confirming that you have your spouse’s permission to begin this enrollment and provide this initial information.'
    },
    child: {
      aboutTitle: 'About your child',
      aboutHelp: 'We’ll begin a separate ReVitalized profile for the child being enrolled.',
      fullName: 'Child’s full name',
      age: 'Child’s age',
      emailHelp: 'Use the parent or guardian email that should receive enrollment updates.',
      phoneHelp: 'Use the parent or guardian number for enrollment follow-up.',
      panelTitle: 'You’re starting this enrollment for your child.',
      panelCopy: 'A parent or guardian may complete this initial enrollment and assist with the child’s health questions. Each child will ultimately have a separate profile within the family experience so their information stays connected to the right person.',
      authorization: 'By continuing, you’re confirming that you are the parent, guardian or otherwise authorized to begin this child’s enrollment.'
    }
  };

  const applyContext = (value) => {
    const selected = copy[value] || copy.self;

    if (aboutTitle) aboutTitle.textContent = selected.aboutTitle;
    if (aboutHelp) aboutHelp.textContent = selected.aboutHelp;
    if (fullNameLabel) fullNameLabel.textContent = selected.fullName;
    if (ageLabel) ageLabel.textContent = selected.age;
    if (emailHelp) emailHelp.textContent = selected.emailHelp;
    if (phoneHelp) phoneHelp.textContent = selected.phoneHelp;

    const onBehalf = value === 'spouse' || value === 'child';
    if (panel) panel.hidden = !onBehalf;
    if (completedBy) {
      completedBy.disabled = !onBehalf;
      completedBy.required = onBehalf;
      if (!onBehalf) completedBy.value = '';
    }

    if (onBehalf) {
      if (panelTitle) panelTitle.textContent = selected.panelTitle;
      if (panelCopy) panelCopy.textContent = selected.panelCopy;
      if (authorization) authorization.textContent = selected.authorization;
    }
  };

  choices.forEach((choice) => {
    choice.addEventListener('change', () => {
      if (choice.checked) applyContext(choice.value);
    });
  });

  const initial = form.querySelector('[name="enrollment_for"]:checked');
  if (initial) applyContext(initial.value);

  const value = (name) => {
    const control = form.elements.namedItem(name);
    return control ? String(control.value || '').trim() : '';
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

/* Build 93 — keep program comparison inside Step 1 instead of opening a new page/tab. */
(() => {
  'use strict';
  const form = document.getElementById('enrollment-step-one');
  const trigger = document.querySelector('.ra-program-help a');
  if (!form || !trigger) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'css/enrollment93-program-modal.css?v=93';
  document.head.appendChild(css);

  const plans = [
    {
      code: 'holistic-foundations',
      label: 'Most flexible',
      name: 'Holistic Foundations',
      price: '$25/week or $89/month · 3-month minimum',
      best: 'Families who want the most budget-friendly way to begin, learn the ReVitalized approach and move at their own pace.',
      bullets: ['Family access for up to 5 profiles','ReVitalized Academy platform access','Private like-minded community','Educational content + monthly community Q&A','AI advisor and signature nutrition/fitness plans','Tracking, habit builder, challenges and Family Health Hub']
    },
    {
      code: 'vitality-accelerator-cohort',
      label: 'Group experience',
      name: 'Vitality Accelerator Cohort',
      price: '$1,000 · 40 days',
      best: 'Someone who wants the focused 40-day Accelerator structure in a more affordable group-coaching format.',
      bullets: ['40-day structured coaching experience','Group coaching format','Individual or couple enrollment','Up to 2 participants','No ongoing one-on-one coaching except emergencies']
    },
    {
      code: 'vitality-accelerator',
      label: 'Focused coaching',
      name: 'Vitality Accelerator',
      price: '$2,000 · 40 days',
      best: 'Someone who wants a faster-paced coaching experience with private guidance plus group coaching.',
      bullets: ['Full ReVitalized Academy app access','4 one-on-one video meetings with a coach','Direct coach support through messages and calls','Weekly live group coaching','Holistic Clarity Course included','Individual or couple enrollment, up to 2 people']
    },
    {
      code: 'total-wellness-6',
      label: 'Ongoing support',
      name: '6-Month Intensive',
      price: 'Personalized investment · discussed with coach',
      best: 'Clients who want a higher standard of ongoing coaching, more personal support and a custom plan that evolves month by month.',
      premium: true,
      bullets: ['Full ReVitalized Academy app access','Monthly 90-minute private coaching meeting','2–3 direct coach check-ins each week','Custom Longevity Lifestyle plan','Plan built around all 12 Drivers of Holistic Health','Weekly live group coaching + Holistic Clarity Course']
    },
    {
      code: 'total-wellness-12',
      label: 'Highest-touch support',
      name: '12-Month Intensive',
      price: 'Personalized investment · discussed with coach',
      best: 'Clients who want the highest level of private support and an ongoing coaching relationship with Justyn & Elle.',
      premium: true,
      bullets: ['Private coaching with Justyn & Elle','Monthly 60–90 minute private meeting','2–3 direct weekly check-ins','Custom 12-Driver Longevity Lifestyle plan','Custom plan updated monthly','Live group coaching + Holistic Clarity Course']
    }
  ];

  const esc = (value) => String(value).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const card = (plan) => `<article class="ra93-program-card${plan.premium ? ' ra93-premium' : ''}" data-ra93-plan="${esc(plan.code)}"><span class="ra93-program-label">${esc(plan.label)}</span><h3>${esc(plan.name)}</h3><p class="ra93-program-price">${esc(plan.price)}</p><p class="ra93-program-best"><strong>Best for:</strong> ${esc(plan.best)}</p><ul class="ra93-program-list">${plan.bullets.map(item => `<li>${esc(item)}</li>`).join('')}</ul><div class="ra93-program-actions"><button class="ra93-program-select" type="button" data-ra93-select="${esc(plan.code)}">Choose ${esc(plan.name)}</button></div></article>`;

  const modal = document.createElement('div');
  modal.className = 'ra93-program-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `<section class="ra93-program-dialog" role="dialog" aria-modal="true" aria-labelledby="ra93-program-title"><header class="ra93-program-head"><div><span class="ra93-program-kicker">Compare your starting options</span><h2 id="ra93-program-title">Choose the support that fits you best.</h2><p>Review the main differences without leaving your enrollment. You can select a program here, or close this window and keep deciding in the form.</p></div><button class="ra93-program-close" type="button" aria-label="Close program comparison">×</button></header><div class="ra93-program-scroll"><div class="ra93-program-grid">${plans.map(card).join('')}</div><div class="ra93-undecided"><div><strong>Still not sure?</strong><span>You do not have to decide today. Choose “I’m not sure yet” and the ReVitalized team can help you determine the best fit.</span></div><button type="button" data-ra93-select="not-sure">Choose “I’m not sure yet”</button></div></div></section>`;
  document.body.appendChild(modal);

  trigger.classList.add('ra93-compare-trigger');
  trigger.removeAttribute('target');
  trigger.removeAttribute('rel');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', 'ra93-program-comparison');
  modal.id = 'ra93-program-comparison';

  let lastFocus = null;
  const dialog = modal.querySelector('.ra93-program-dialog');
  const closeButton = modal.querySelector('.ra93-program-close');
  const scroll = modal.querySelector('.ra93-program-scroll');

  const open = (focusCode = '') => {
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ra93-modal-lock');
    modal.querySelectorAll('.ra93-program-card').forEach(el => el.classList.remove('is-focused'));
    if (focusCode) {
      const focused = modal.querySelector(`[data-ra93-plan="${CSS.escape(focusCode)}"]`);
      if (focused) {
        focused.classList.add('is-focused');
        requestAnimationFrame(() => focused.scrollIntoView({ block: 'start' }));
      }
    } else if (scroll) {
      scroll.scrollTop = 0;
    }
    closeButton?.focus();
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ra93-modal-lock');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    open();
  });
  closeButton?.addEventListener('click', close);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
    const select = event.target.closest('[data-ra93-select]');
    if (!select) return;
    const code = select.dataset.ra93Select;
    const radio = form.querySelector(`[name="program_interest"][data-plan="${CSS.escape(code)}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      close();
      setTimeout(() => radio.closest('.ra-program-choice')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab' && dialog) {
      const focusable = [...dialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
})();
