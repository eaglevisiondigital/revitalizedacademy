/* Founder-only metadata verification. No answers, source IDs, hashes or PHI storage. */
(function(root) {
  'use strict';
  const SOP = 'RVA-B4-PILOT-READONLY-v1-2026-10-16';
  const acknowledgments = {
    internal_only: 'Internal quality testing only; original answers remain read-only.',
    founders_only: 'Only Justyn and Elle may review the selected sources.',
    no_ai_exports: 'No AI processing, screenshots, downloads or copied private data.',
    no_scores_emails: 'No scores, stages, approval, release, notifications or emails.',
    manual_revocation_14_days: 'Maximum 14 days; named owner and backup arrange manual operator revocation. There is no automatic expiry.',
    separate_enrollment: 'This confirms identity and SOP only. Operator enrollment needs separate authorization.',
    read_only: 'Drafts, corrections and scoring remain disabled.'
  };
  const kinds = {eligible_detailed: 'Detailed Adult/Myself source', historical_only: 'Not eligible for detailed B4 review · Historical source',
    no_report: 'No assessment report on this contact', incomplete_link: 'Assessment completion/link needs clarification',
    ambiguous_source: 'Multiple secure sources · Operator clarification needed', ineligible_detailed: 'Not eligible for detailed B4 review'};
  const reasons = {identity_date_match: 'All three identity checks match', different_person: 'Different person/contact',
    different_assessment: 'Different assessment', identifier_unclear: 'Identifier needs clarification', historical_only: 'Historical source needs review'};
  function createApp({portal, panel, api, onContact = () => {}, onHistorical = () => {}}) {
    const doc = panel.ownerDocument, win = doc.defaultView, guard = portal.createAuthenticatedTaskGuard();
    const n = (tag, value, cls) => {const el = doc.createElement(tag); if (value != null) el.textContent = value; if (cls) el.className = cls; return el;};
    const btn = (text, fn, cls = 'rv42-button') => {const b = n('button', text, cls); b.type = 'button'; b.onclick = fn; return b;};
    const launch = btn('Founder Pilot Verification', open, 'secondary-button compact'); launch.hidden = true; launch.dataset.founderVerification = 'launch';
    const heading = panel.querySelector('.panel-heading'); (heading || panel).append(launch);
    const controllers = new Set();
    let dialog, surface, statusHost, results, feedback, selected = null, pending = false, timer, initTask, focusBack;
    const notices = {conflict: 'The source, identity or latest decision changed. Close and search again.', invalid: 'Check the exact name/email and required verification/SOP fields.', unavailable: 'Founder verification unavailable. No identity was confirmed.'};
    function setPending(value) {pending = value; if (dialog) for (const el of dialog.querySelectorAll('form input,form select,form button,.rv42-actions button')) el.disabled = value;}
    const clear = () => {
      guard.cancel(); for (const c of controllers) c.abort(); controllers.clear(); win.clearTimeout(timer); timer = null; selected = null; setPending(false);
      dialog?.remove(); dialog = null; surface = null; results = null; statusHost = null; feedback = null;
      doc.body.classList.remove('rv42-private-open'); if (portal.captureStaffSession()) focusBack?.focus(); focusBack = null;
    };
    function reset() {clear(); launch.hidden = true; panel.querySelector('[data-rv42-notice]')?.remove(); initTask = null;}
    async function call(action, payload, task) {
      if (!guard.current(task)) return null;
      const controller = new win.AbortController(); controllers.add(controller);
      const timeout = win.setTimeout(() => controller.abort(), 12000);
      try {
        const value = await api(action, payload, {signal: controller.signal, current: () => guard.current(task)});
        if (!guard.current(task)) return null;
        if (value?.unavailable) {const e = Error('Unavailable'); e.kind = value.conflict ? 'conflict' : value.invalid ? 'invalid' : 'unavailable'; throw e;}
        return value;
      } finally {win.clearTimeout(timeout); controllers.delete(controller);}
    }
    async function initialize() {
      if (!portal.captureStaffSession() || portal.currentStaffRole?.() !== 'owner' || !portal.hasPermission?.('health.private.view') || !portal.hasPermission?.('crm.view')) return;
      if (initTask && guard.current(initTask)) return;
      const task = guard.begin(); initTask = task;
      try {if ((await call('authorize', {}, task))?.authorized) launch.hidden = false;} catch {if (guard.current(task)) reset();}
    }
    function fail(kind) {clear(); launch.hidden = kind !== 'conflict'; const msg = n('p', notices[kind] || notices.unavailable, 'rv42-feedback'); msg.setAttribute('role', 'status');
      panel.querySelector('[data-rv42-notice]')?.remove(); msg.dataset.rv42Notice = ''; (launch.closest('.panel-heading') || launch).after(msg); msg.tabIndex = -1; msg.focus({preventScroll: true}); msg.scrollIntoView({block: 'nearest'});}
    function notice(text, target = surface) {const el = n('p', text, 'rv42-notice'); target.append(el); return el;}
    function date(value) {return value ? new Date(value).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'}) + ' · UTC ' + new Date(value).toISOString().slice(0, 10) : 'Not recorded';}
    function statusText(row) {
      if (row.source_changed) return 'Changed · Re-verify this source';
      if (row.decision === 'not_intended') return 'Not the intended record';
      if (row.decision === 'needs_clarification') return 'Needs clarification';
      if (!row.eligible) return row.decision === 'confirmed' ? 'Identity confirmed · Source ineligible' : 'Ineligible / historical · Identity pending';
      if (row.decision === 'pending' && row.same_name_contacts > 1) return 'Ambiguous · Exact identity verification pending';
      return {confirmed: 'Confirmed · Operator authorization still required', not_intended: 'Not the intended record', needs_clarification: 'Needs clarification', pending: 'Pending founder verification'}[row.decision] || 'Pending';
    }
    async function loadStatus(task) {
      const rows = await call('status', {}, task); if (!rows || !dialog) return;
      statusHost.replaceChildren(n('h3', 'Protected verification status'));
      if (!rows.length) notice('No verification requests yet. Search for an exact full name or email to begin.', statusHost);
      for (const row of rows) {
        const card = n('article', null, 'rv42-status-card'); card.append(n('strong', row.name), n('span', row.second_identifier), n('p', statusText(row)));
        if (row.same_name_contacts > 1) card.append(n('p', 'Similar names exist. Contact records remain separate.'));
        if (row.revoke_by) card.append(n('p', `Proposed manual revocation: ${date(row.revoke_by)} · Owner ${row.revocation_owner}. ${new Date(row.revoke_by) <= new Date() ? 'Plan expired; renew verification.' : 'Operator appointment required before enrollment.'}`));
        if (row.reviewer) card.append(n('small', `Recorded by ${row.reviewer} · Revision ${row.revision}`));
        card.append(n('small', 'No enrollment, draft, score or delivery enabled.')); statusHost.append(card);
      }
    }
    function schedule() {win.clearTimeout(timer); if (dialog) timer = win.setTimeout(recheck, 15000);}
    async function recheck() {
      if (!dialog) return;
      if (pending) {schedule(); return;}
      const task = guard.begin();
      try {const ok = await call(selected ? 'check' : 'authorize', selected ? {request: selected.request} : {}, task); if (ok) {await loadStatus(task); schedule();}}
      catch (e) {if (guard.current(task)) fail(e.kind);}
    }
    async function open() {
      clear(); focusBack = doc.activeElement; panel.querySelector('[data-rv42-notice]')?.remove();
      const task = guard.begin(); if (!task) return;
      dialog = n('div', null, 'rv42-dialog'); dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('aria-label', 'Founder Pilot Verification'); dialog.tabIndex = -1;
      surface = n('main', null, 'rv42-surface'); dialog.append(surface); doc.body.append(dialog); doc.body.classList.add('rv42-private-open');
      surface.append(btn('Close verification', clear, 'rv42-close'), n('p', 'PRIVATE FOUNDER WORKSPACE', 'rv42-eyebrow'), n('h2', 'Verify the person. Confirm the source.'),
        n('p', 'Resolve the exact assessment before a separate, read-only pilot is authorized.', 'rv42-intro'));
      notice('Identity verification only · Cohort enrollment held · No answers loaded');
      const search = n('form', null, 'rv42-search'), label = n('label', 'Exact full name or email'), input = n('input'); input.type = 'search'; input.required = true; input.minLength = 5; input.maxLength = 160; input.autocomplete = 'off'; label.append(input);
      const dateLabel = n('label', 'Assessment completion date (optional, UTC)'), completionDate = n('input'); completionDate.type = 'date'; dateLabel.append(completionDate);
      // Reset the native editor too: WebKit can retain an invalid segmented date after value=''.
      const dateGroup = n('div', null, 'rv42-date-group'), clearDate = btn('Clear', () => {completionDate.type = 'text'; completionDate.value = ''; completionDate.type = 'date'; input.focus();}, 'rv42-clear-date'); clearDate.setAttribute('aria-label', 'Clear date filter'); dateGroup.append(dateLabel, clearDate);
      const submit = n('button', 'Find existing records', 'rv42-button'); submit.type = 'submit'; search.append(label, dateGroup, submit);
      feedback = n('p', '', 'rv42-feedback'); feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
      results = n('section', null, 'rv42-results'); results.setAttribute('aria-label', 'Assessment candidates'); statusHost = n('section', null, 'rv42-status');
      surface.append(search, feedback, results, statusHost); dialog.focus();
      search.onsubmit = async e => {
        e.preventDefault(); if (pending || !search.reportValidity()) return;
        setPending(true); selected = null; surface.querySelector('.rv42-attestation')?.remove(); submit.disabled = true; results.replaceChildren(); feedback.textContent = 'Checking existing records securely…'; const current = guard.begin();
        try {
          const rows = await call('search', {query: input.value.trim(), completion_date: completionDate.value || null}, current); if (!rows || !dialog) return;
          feedback.textContent = rows.length ? 'Compare every candidate. Nothing is selected automatically.' : 'No exact match. Check the full name or exact email in the authorized contact view.';
          rows.forEach((row, i) => renderCandidate(row, i)); setPending(true); await loadStatus(current);
        } catch (e) {if (guard.current(current)) {if (e.kind === 'invalid') feedback.textContent = notices.invalid; else fail(e.kind);}}
        finally {if (guard.current(current) && dialog) {setPending(false); submit.disabled = false; schedule();}}
      };
      try {await loadStatus(task); schedule();} catch (e) {if (guard.current(task)) fail(e.kind);}
    }
    function renderCandidate(row, i) {
      const card = n('article', null, 'rv42-card'); card.append(n('span', `Candidate ${i + 1} · Separate contact record`, 'rv42-eyebrow'), n('h3', row.name), n('p', row.second_identifier, 'rv42-identifier'),
        n('p', `Assessment completed: ${date(row.completed_at)}`), n('p', kinds[row.kind] || 'Source requires clarification', row.eligible ? 'rv42-badge' : 'rv42-badge is-held'));
      if (row.workflow_completed_at && row.workflow_completed_at !== row.completed_at) card.append(n('p', `Linked workflow completed: ${date(row.workflow_completed_at)}`));
      if (row.same_name_contacts > 1) notice(`${row.same_name_contacts} contacts share this full name. They are not automatically the same person.`, card);
      if (row.staff_contact_warning) notice('A similarly named staff contact is a different record from this assessment contact. Verify independently; no identity equivalence is assumed.', card);
      const actions = n('div', null, 'rv42-actions'); actions.append(btn('Check full identifier in Contact', () => bridge(row, 'contact')));
      if (row.kind === 'historical_only') actions.append(btn('Open existing historical review', () => bridge(row, 'historical')));
      actions.append(btn('Verify Pilot Assessment', () => select(row, card))); card.append(actions); results.append(card);
    }
    async function bridge(row, mode) {
      if (pending) return; const task = guard.begin(); setPending(true);
      try {const data = await call('contact', {request: row.request}, task); if (!data || !dialog) return; clear(); (mode === 'historical' ? onHistorical : onContact)(data.contact_id);}
      catch (e) {if (guard.current(task)) fail(e.kind);} finally {if (dialog) {setPending(false); schedule();}}
    }
    async function select(row, card) {
      if (pending) return; const task = guard.begin(); setPending(true);
      try {
        if (!await call('check', {request: row.request}, task) || !dialog) return;
        selected = row; surface.querySelector('.rv42-attestation')?.remove(); const form = n('form', null, 'rv42-attestation');
        form.append(n('h3', 'Confirm this exact assessment'), n('p', 'Check the full name, an independent second identifier and the assessment completion date before confirming.'), n('p', `${row.name} · ${row.second_identifier} · ${date(row.completed_at)}`));
        if (row.identity_confirmable === false) notice('Full identity, an independent email/phone and completion date are required. Choose Needs clarification until the existing record can be verified.', form);
        notice(row.eligible ? 'Eligible source candidate. A confirmation still does not enroll this person.' : 'This record is not eligible for detailed B4 review. Confirming identity cannot change source eligibility.', form);
        const decisionLabel = n('label', 'Your decision'), decision = n('select'); decision.setAttribute('aria-label', 'Your decision'); decision.required = true;
        [['', 'Choose a decision'], ['confirmed', 'Confirm this exact assessment'], ['not_intended', 'Not the intended record'], ['needs_clarification', 'Needs clarification']].forEach(([v, t]) => {const o = n('option', t); o.value = v; decision.append(o);});
        if (!row.has_report || !row.completed_at || row.identity_confirmable === false) decision.querySelector('[value="confirmed"]').disabled = true;
        decisionLabel.append(decision); const reasonLabel = n('label', 'Non-identifying justification'), reason = n('select'); reason.setAttribute('aria-label', 'Non-identifying justification'); reason.required = true; reasonLabel.append(reason); form.append(decisionLabel, reasonLabel);
        function selectField(labelText, values) {const label = n('label', labelText), el = n('select'); el.setAttribute('aria-label', labelText); for (const [v, t] of values) {const opt = n('option', t); opt.value = v; el.append(opt);} label.append(el); return [label, el];}
        const plan = n('fieldset', null, 'rv42-plan'); plan.append(n('legend', 'Proposed manual revocation plan'));
        const [ownerLabel, owner] = selectField('Accountable revocation owner', [['justyn', 'Justyn'], ['elle', 'Elle']]); const [backupLabel, backup] = selectField('Backup owner', [['elle', 'Elle'], ['justyn', 'Justyn']]);
        const startLabel = n('label', 'Proposed start (your local time)'), start = n('input'); start.type = 'datetime-local'; startLabel.append(start);
        const endLabel = n('label', 'Revoke by (your local time, within 14 days)'), end = n('input'); end.type = 'datetime-local'; endLabel.append(end); plan.append(ownerLabel, backupLabel, startLabel, endLabel);
        notice('The private status panel tracks this proposed deadline. No automatic expiry or reminder is installed. A privileged operator appointment and separate enrollment approval are still required.', plan); form.append(plan);
        const ack = n('fieldset', null, 'rv42-ack'); ack.append(n('legend', 'Read-only founder SOP acknowledgment')); const inputs = {};
        for (const [key, text] of Object.entries(acknowledgments)) {const label = n('label', null, 'rv42-check'), checkbox = n('input'); checkbox.type = 'checkbox'; checkbox.required = true; inputs[key] = checkbox; label.append(checkbox, n('span', text)); ack.append(label);}
        form.append(ack, n('small', `SOP ${SOP}`)); const save = n('button', 'Record verification & SOP acknowledgment', 'rv42-button'); save.type = 'submit'; form.append(save);
        function choices() {
          reason.replaceChildren(); const values = decision.value === 'confirmed' ? ['identity_date_match'] : decision.value === 'not_intended' ? ['different_person', 'different_assessment'] : ['identifier_unclear', 'historical_only'];
          values.forEach(v => {const opt = n('option', reasons[v]); opt.value = v; reason.append(opt);});
          plan.hidden = decision.value !== 'confirmed'; for (const el of [owner, backup, start, end]) el.required = !plan.hidden;
          if (plan.hidden) {start.value = ''; end.value = '';}
        }
        decision.onchange = choices; choices();
        let requestKey = null, lastBody;
        form.onsubmit = async e => {
          e.preventDefault(); if (pending || !form.reportValidity()) return;
          if (decision.value === 'confirmed' && (owner.value === backup.value || new Date(end.value) <= new Date(start.value) || new Date(end.value) - new Date(start.value) > 14 * 86400000)) {feedback.textContent = 'Choose different owner/backup and a deadline within 14 days.'; return;}
          const body = {request: row.request, expected_revision: row.revision, decision: decision.value, reason_code: reason.value, sop_version: SOP,
            acknowledgments: Object.fromEntries(Object.entries(inputs).map(([key, el]) => [key, el.checked])), revocation_owner: plan.hidden ? null : owner.value, backup_owner: plan.hidden ? null : backup.value,
            starts_at: plan.hidden ? null : new Date(start.value).toISOString(), revoke_by: plan.hidden ? null : new Date(end.value).toISOString()};
          if (lastBody !== JSON.stringify(body)) {requestKey = win.crypto.randomUUID(); lastBody = JSON.stringify(body);} body.request_key = requestKey;
          const current = guard.begin(); setPending(true); save.disabled = true; feedback.textContent = 'Recording private append-only verification…';
          try {const saved = await call('attest', body, current); if (!saved || !dialog) return; selected = null; form.remove(); feedback.textContent = 'Verification and SOP recorded. Nobody was enrolled. Operator authorization remains required.'; feedback.tabIndex = -1; feedback.focus({preventScroll: true}); feedback.scrollIntoView({block: 'nearest'}); await loadStatus(current);}
          catch (e) {if (guard.current(current)) {if (e.kind === 'invalid') feedback.textContent = notices.invalid; else fail(e.kind);}}
          finally {if (dialog && guard.current(current)) {setPending(false); save.disabled = false; schedule();}}
        };
        surface.insertBefore(form, statusHost); form.tabIndex = -1; form.focus({preventScroll: true}); form.scrollIntoView({block: 'start'});
      } catch (e) {if (guard.current(task)) fail(e.kind);} finally {if (dialog && guard.current(task)) {setPending(false); schedule();}}
    }
    function keydown(e) {
      if (!dialog) return; if (e.key === 'Escape') {e.preventDefault(); clear(); return;}
      if (e.key !== 'Tab') return;
      const nodes = [...dialog.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (e.shiftKey && (doc.activeElement === first || doc.activeElement === dialog)) {e.preventDefault(); last?.focus();} else if (!e.shiftKey && doc.activeElement === last) {e.preventDefault(); first?.focus();}
    }
    doc.addEventListener('ra:staff-access-reset', reset); doc.addEventListener('ra:permissions-loaded', initialize); doc.addEventListener('keydown', keydown);
    win.addEventListener('pagehide', reset); win.addEventListener('pageshow', initialize); win.addEventListener('focus', recheck);
    const visible = () => {if (!doc.hidden) recheck();}; doc.addEventListener('visibilitychange', visible); initialize();
    return {destroy() {reset(); launch.remove(); doc.removeEventListener('ra:staff-access-reset', reset); doc.removeEventListener('ra:permissions-loaded', initialize); doc.removeEventListener('keydown', keydown); win.removeEventListener('pagehide', reset); win.removeEventListener('pageshow', initialize); win.removeEventListener('focus', recheck); doc.removeEventListener('visibilitychange', visible);}};
  }
  root.RVA_FOUNDER_VERIFICATION = {createApp};
  if (typeof module === 'object') module.exports = {createApp};
  if (!root.document || root.RVA_ENV?.environment !== 'production' || root.RVA_ENV?.projectRef !== 'voalfpxiyznnqfcqcymd' || root.location.origin !== 'https://revitalizedacademy.com') return;
  const portal = root.RA_PORTAL, panel = root.document.getElementById('vitality-assessments-panel'); if (!portal?.authClient || !panel) return;
  createApp({portal, panel, api: async (action, payload, transport) => {
    const {data, error} = await portal.authClient.auth.getSession(); if (!transport.current() || transport.signal.aborted || error || !data?.session?.access_token) return {unavailable: true};
    const response = await root.fetch('/.netlify/functions/roadmap-verification', {method: 'POST', headers: {Authorization: 'Bearer ' + data.session.access_token, 'Content-Type': 'application/json'}, body: JSON.stringify({action, payload}), cache: 'no-store', credentials: 'same-origin', signal: transport.signal});
    if (!response.ok) return {unavailable: true}; return response.json();
  }, onContact: id => portal.openContact(id), onHistorical: id => root.document.dispatchEvent(new CustomEvent('ra:open-vitality-review', {detail: {contactId: id}}))});
})(typeof window === 'object' ? window : globalThis);
