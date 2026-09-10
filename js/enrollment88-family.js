/* Build 88 — family-aware Step 1 enrollment context.
   This only controls enrollment-page presentation and fields. No assessment-owned files are touched. */
(() => {
  'use strict';

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
})();
