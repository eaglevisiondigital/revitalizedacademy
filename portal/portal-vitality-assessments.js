(() => {
  'use strict';

  const portal = window.RA_PORTAL;
  const panel = document.getElementById('vitality-assessments-panel');
  const list = document.getElementById('vitality-assessments-list');
  const status = document.getElementById('vitality-assessments-status');
  const drawer = document.getElementById('vitality-review-drawer');
  const content = document.getElementById('vitality-review-content');
  const title = document.getElementById('vitality-review-title');
  if (!portal?.authClient || !panel || !list || !status || !drawer || !content || !title) return;

  const filters = [...panel.querySelectorAll('[data-vitality-filter]')];
  const catalogRoot = window.RVA_VITALITY_QUESTION_CATALOG || {};
  let activeFilter = 'all';
  let loaded = false;
  let listRequest = 0;
  let reviewRequest = 0;

  const text = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value == null || value === '' ? 'Not recorded' : String(value);
    return node;
  };
  const date = (value, withTime = false) => {
    if (!value) return 'Not recorded';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Not recorded';
    return new Intl.DateTimeFormat(undefined, withTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' }).format(parsed);
  };
  const humanize = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  const slug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const setStatus = (message, tone = '') => {
    status.textContent = message;
    status.className = `form-status vitality-assessments-status${tone ? ` ${tone}` : ''}`;
  };

  function selectedValues(rows) {
    if (!Array.isArray(rows)) return [];
    const values = [];
    rows.forEach((row) => {
      if (!row || !Object.prototype.hasOwnProperty.call(row, 'value')) return;
      if (['checkbox', 'radio'].includes(row.type) && row.checked !== true) return;
      const candidates = Array.isArray(row.value) ? row.value : [row.value];
      candidates.forEach((value) => {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return;
        values.push(String(value));
      });
    });
    return values;
  }

  function assessmentIdentity(row) {
    const choice = row.assessment_for || 'Not recorded';
    if (choice === 'Myself') return row.participant_name || 'Not recorded';
    const assessed = [row.assessed_first_name, row.assessed_last_name].filter(Boolean).join(' ').trim();
    return assessed || choice;
  }

  function addOverviewItem(grid, label, value) {
    const item = document.createElement('div');
    item.className = 'vitality-review-overview-item';
    item.append(text('span', '', label), text('strong', '', value));
    grid.append(item);
  }

  function renderList(rows) {
    list.replaceChildren();
    if (!rows.length) {
      list.append(text('div', 'empty-state', 'No Vitality Assessments match this view.'));
      return;
    }
    rows.forEach((row) => {
      const card = document.createElement('article');
      card.className = 'vitality-assessment-row';
      const main = document.createElement('div');
      main.className = 'vitality-assessment-person';
      main.append(text('strong', '', row.participant_name || 'Unnamed participant'), text('span', '', row.email));

      const progress = document.createElement('div');
      progress.className = 'vitality-assessment-progress';
      const badge = text('span', `vitality-status ${row.status === 'completed' ? 'is-complete' : 'is-progress'}`, row.status === 'completed' ? 'Completed' : 'In Progress');
      progress.append(badge, text('strong', '', `${Number(row.completion_percent) || 0}%`), text('span', '', row.current_section || 'Not started'));

      const details = document.createElement('dl');
      details.className = 'vitality-assessment-meta';
      const pairs = [
        ['Pathway', row.pathway],
        ['Started', date(row.started_at)],
        ['Completed', date(row.completed_at)],
        ['Referral', row.referral_source === 'Other' ? row.referral_source_other || 'Other' : row.referral_source],
        ['Sales Rep', row.sales_rep_name],
        ['Assigned', row.assigned_staff]
      ];
      pairs.forEach(([label, value]) => {
        details.append(text('dt', '', label), text('dd', '', value));
      });

      const actions = document.createElement('div');
      actions.className = 'vitality-assessment-actions';
      const review = text('button', 'primary-button compact', row.status === 'completed' ? 'Open Review' : 'View Status');
      review.type = 'button';
      review.addEventListener('click', () => openReview(row.contact_id));
      const contact = text('button', 'secondary-button compact', 'Open Contact');
      contact.type = 'button';
      contact.addEventListener('click', () => portal.openContact(row.contact_id));
      actions.append(review, contact);
      if (row.needs_review) actions.prepend(text('span', 'vitality-needs-review', 'Needs Review'));
      card.append(main, progress, details, actions);
      list.append(card);
    });
  }

  async function loadList(force = false) {
    if (loaded && !force) return;
    const request = ++listRequest;
    loaded = false;
    list.replaceChildren(text('div', 'empty-state', 'Loading Vitality Assessments…'));
    setStatus('');
    const { data, error } = await portal.authClient.rpc('list_vitality_assessment_reviews', { p_filter: activeFilter });
    if (request !== listRequest) return;
    if (error) {
      list.replaceChildren(text('div', 'empty-state', 'Vitality Assessment review is unavailable for this staff account.'));
      setStatus('Private-health permission and contact scope are required.', 'is-error');
      return;
    }
    loaded = true;
    renderList(Array.isArray(data) ? data : []);
    setStatus(`${Array.isArray(data) ? data.length : 0} assessment${data?.length === 1 ? '' : 's'} in this view.`, 'is-success');
  }

  function findFieldMeta(pathwayCatalog, name, answers) {
    if (pathwayCatalog.fields?.[name]) return pathwayCatalog.fields[name];
    const suffixes = {
      frequency: 'How often?', disruption: 'How disruptive?', duration: 'How long?',
      distress: 'How uncomfortable or distressing?', impact: 'Effect on daily life?',
      professional_review: 'Reviewed by a healthcare professional?', care_plan: 'Current care plan or additional context'
    };
    const suffix = Object.keys(suffixes).find((key) => name.endsWith(`_${key}`));
    if (!suffix) return null;
    const candidates = Object.entries(pathwayCatalog.fields || {}).filter(([key, meta]) =>
      (key.endsWith('_symptoms') || meta.kind === 'checkbox') && name.startsWith(`${key.endsWith('_symptoms') ? key.slice(0, -9) : key}_`)
    ).sort((a, b) => b[0].length - a[0].length);
    for (const [groupName, meta] of candidates) {
      const prefix = groupName.endsWith('_symptoms') ? groupName.slice(0, -9) : groupName;
      const middle = name.slice(prefix.length + 1, -(suffix.length + 1));
      const symptom = selectedValues(answers[groupName]).find((value) => slug(value) === middle);
      if (symptom) return { label: `${symptom} — ${suffixes[suffix]}`, section: meta.section, kind: 'detail' };
    }
    return null;
  }

  function renderAnswers(review) {
    const wrapper = document.createElement('section');
    wrapper.className = 'vitality-review-section';
    wrapper.append(text('h3', '', 'Full Question & Answer Review'));
    const pathwayCatalog = catalogRoot[review.pathway] || catalogRoot.Adult || { sections: [], fields: {} };
    const grouped = new Map();
    Object.entries(review.answers || {}).forEach(([name, rows]) => {
      const values = selectedValues(rows);
      if (!values.length) return;
      const meta = findFieldMeta(pathwayCatalog, name, review.answers) || { label: humanize(name), section: 'Additional Submitted Answers' };
      if (!grouped.has(meta.section)) grouped.set(meta.section, []);
      grouped.get(meta.section).push({ name, label: meta.label, values });
    });
    const order = [...(pathwayCatalog.sections || []), 'Additional Submitted Answers'];
    const names = [...grouped.keys()].sort((a, b) => {
      const ai = order.indexOf(a); const bi = order.indexOf(b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
    if (!names.length) {
      wrapper.append(text('p', 'vitality-review-empty', 'No submitted answers are available.'));
      return wrapper;
    }
    names.forEach((sectionName) => {
      const section = document.createElement('section');
      section.className = 'vitality-review-answer-section';
      section.append(text('h4', '', sectionName));
      grouped.get(sectionName).forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'vitality-review-answer';
        item.append(text('dt', '', entry.label), text('dd', '', entry.values.join(', ')));
        section.append(item);
      });
      wrapper.append(section);
    });
    return wrapper;
  }

  function renderReview(review) {
    content.replaceChildren();
    title.textContent = review.participant_name || 'Vitality Assessment';
    const overview = document.createElement('section');
    overview.className = 'vitality-review-section';
    overview.append(text('h3', '', 'Overview'));
    const grid = document.createElement('div');
    grid.className = 'vitality-review-overview';
    addOverviewItem(grid, 'Participant / contact', review.participant_name);
    addOverviewItem(grid, 'Assessment for', assessmentIdentity(review));
    addOverviewItem(grid, 'Adult / child pathway', review.pathway);
    addOverviewItem(grid, 'Status', review.status === 'completed' ? 'Completed' : 'In Progress');
    addOverviewItem(grid, 'Progress', `${Number(review.completion_percent) || 0}% · ${review.current_section || 'Not started'}`);
    addOverviewItem(grid, 'Email verified', review.email_verified ? 'Yes' : 'No');
    addOverviewItem(grid, 'Started', date(review.started_at, true));
    addOverviewItem(grid, 'Completed', date(review.completed_at, true));
    addOverviewItem(grid, 'Last saved', date(review.last_saved_at, true));
    addOverviewItem(grid, 'Referral source', review.referral_source === 'Other' ? review.referral_source_other || 'Other' : review.referral_source);
    addOverviewItem(grid, 'Sales Rep', review.sales_rep_name);
    addOverviewItem(grid, 'Assigned staff', review.assigned_staff);
    overview.append(grid);
    content.append(overview);

    if (review.status !== 'completed') {
      const notice = document.createElement('section');
      notice.className = 'vitality-review-section vitality-review-incomplete';
      notice.append(text('h3', '', 'Assessment in progress'), text('p', '', 'Private answers remain unavailable until the participant completes and submits the assessment.'));
      content.append(notice);
      return;
    }

    const flags = Array.isArray(review.coach_review_flags) ? review.coach_review_flags : [];
    const tags = Array.isArray(review.derived_tags) ? review.derived_tags : [];
    const signals = document.createElement('section');
    signals.className = 'vitality-review-section';
    signals.append(text('h3', '', 'Key Goals / Concerns'));
    if (!flags.length && !tags.length) signals.append(text('p', 'vitality-review-empty', 'No existing coach-review flags or assessment-derived tags were recorded.'));
    if (flags.length) {
      const flagList = document.createElement('ul');
      flagList.className = 'vitality-review-flags';
      flags.forEach((flag) => flagList.append(text('li', '', flag)));
      signals.append(flagList);
    }
    if (tags.length) {
      const tagList = document.createElement('div');
      tagList.className = 'vitality-review-tags';
      tags.forEach((tag) => tagList.append(text('span', '', tag)));
      signals.append(tagList);
    }
    content.append(signals);

    const summary = document.createElement('section');
    summary.className = 'vitality-review-section';
    summary.append(text('h3', '', 'Coach Summary'));
    summary.append(review.coach_summary
      ? text('pre', 'vitality-coach-summary', review.coach_summary)
      : text('p', 'vitality-review-empty', 'No generated coach summary was stored for this completed assessment.'));
    content.append(summary, renderAnswers(review));
  }

  async function openReview(contactId) {
    const request = ++reviewRequest;
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('vitality-review-open');
    title.textContent = 'Loading Vitality Assessment…';
    content.replaceChildren(text('div', 'empty-state', 'Loading secure review…'));
    const { data, error } = await portal.authClient.rpc('get_vitality_assessment_review', { p_contact_id: contactId });
    if (request !== reviewRequest) return;
    if (error || !data) {
      title.textContent = 'Vitality Assessment unavailable';
      content.replaceChildren(text('div', 'empty-state', 'This assessment cannot be reviewed with the current permission and contact scope.'));
      return;
    }
    renderReview(data);
  }

  function closeReview() {
    reviewRequest += 1;
    drawer.classList.add('hidden');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('vitality-review-open');
  }

  filters.forEach((button) => button.addEventListener('click', () => {
    activeFilter = button.dataset.vitalityFilter;
    filters.forEach((candidate) => candidate.classList.toggle('active', candidate === button));
    loadList(true);
  }));
  document.getElementById('vitality-assessments-refresh')?.addEventListener('click', () => loadList(true));
  document.querySelectorAll('[data-vitality-review-close]').forEach((node) => node.addEventListener('click', closeReview));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !drawer.classList.contains('hidden')) closeReview(); });
  document.addEventListener('ra:workspace-changed', (event) => {
    if (event.detail?.target === '#vitality-assessments-panel') loadList();
  });
})();
