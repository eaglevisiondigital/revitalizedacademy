(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.HealthHopeLive = api; api.mount(root.document); }
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const zone = 'America/New_York';
  const firstSessionDate = '2026-10-29';
  const easternDate = new Intl.DateTimeFormat('en-CA', {timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'});
  function onOrAfterFirstDate(startsAt) {
    const parts = Object.fromEntries(easternDate.formatToParts(new Date(startsAt)).map(part => [part.type, part.value]));
    return parts.year + '-' + parts.month + '-' + parts.day >= firstSessionDate;
  }
  const valid = row => row && typeof row.id === 'string' && Number.isFinite(Date.parse(row.starts_at)) && Number.isFinite(Date.parse(row.closes_at));
  function available(rows, now = Date.now()) {
    return (Array.isArray(rows) ? rows : []).filter(row => valid(row) && row.status === 'published' && onOrAfterFirstDate(row.starts_at) && Date.parse(row.starts_at) > now && Date.parse(row.closes_at) > now).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  }
  function label(row) {
    return new Intl.DateTimeFormat('en-US', {timeZone: zone, weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'}).format(new Date(row.starts_at));
  }
  function countdown(row, now = Date.now()) {
    const total = Math.max(0, Math.floor((Date.parse(row.starts_at) - now) / 1000));
    return {days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60};
  }
  function mount(doc) {
    mountPromo(doc);
    const form = doc.getElementById('hhl-registration-form');
    if (!form) return;
    const select = form.elements.session_id, submit = form.querySelector('[type=submit]'), status = doc.getElementById('hhl-form-status');
    const availability = doc.getElementById('hhl-availability'), clock = doc.querySelector('[data-hhl-countdown]');
    // Website publication is independent of participant collection. An enabled
    // client mode is a separate release gate; server/database gates still apply.
    if (doc.body.dataset.hhlRegistration !== 'enabled') {
      for (const field of form.elements) field.disabled = true;
      availability.textContent = 'Registration is currently unavailable. Please check back for confirmed session details.';
      doc.querySelector('[data-hhl-next]').textContent = 'Session details are being confirmed.';
      doc.querySelector('[data-hhl-schedule-note]').textContent = 'Registration is currently unavailable.';
      clock.hidden = true;
      return;
    }
    let sessions = [], sending = false, requestKey = null, payloadKey = null, requestGeneration = 0, disposed = false, checking = false;
    const setStatus = text => {status.textContent = text;};
    function render() {
      const open = available(sessions), selected = select.value;
      select.replaceChildren();
      const placeholder = doc.createElement('option'); placeholder.value = ''; placeholder.textContent = open.length ? 'Choose a Thursday' : 'No sessions currently available'; select.append(placeholder);
      for (const session of open) {
        const option = doc.createElement('option'); option.value = session.id;
        const local = new Intl.DateTimeFormat(undefined, {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'}).format(new Date(session.starts_at));
        option.textContent = label(session) + ' · Your time: ' + local; select.append(option);
      }
      if (open.some(row => row.id === selected)) select.value = selected;
      select.disabled = !open.length || sending; submit.disabled = !open.length || sending;
      availability.textContent = open.length ? 'Choose the session you’d like to attend.' : 'The next session is being confirmed. Please check back soon.';
      const next = open[0]; clock.hidden = !next;
      if (next) for (const [key, value] of Object.entries(countdown(next))) doc.querySelector('[data-hhl-' + key + ']').textContent = String(value).padStart(2, '0');
      doc.querySelector('[data-hhl-next]').textContent = next ? label(next) : 'The next session is being confirmed.';
      doc.querySelector('[data-hhl-schedule-note]').textContent = next ? '30 minutes · Free · Live on Zoom' + (next.public_note ? ' · ' + String(next.public_note) : '') : 'Thursdays at 6:30 PM Eastern · America/New_York';
    }
    async function refresh() {
      if (checking || disposed) return;
      checking = true; const generation = ++requestGeneration;
      try {
        const response = await fetch('/api/health-hope-live/sessions', {cache: 'no-store', signal: AbortSignal.timeout(10000)});
        if (!response.ok) throw Error();
        const data = await response.json();
        if (disposed || generation !== requestGeneration) return;
        sessions = Array.isArray(data.sessions) ? data.sessions : []; render();
      } catch {
        if (disposed || generation !== requestGeneration) return;
        sessions = []; render(); availability.textContent = 'Session availability is temporarily unavailable. Please try again shortly.';
      } finally { checking = false; }
    }
    const timer = setInterval(() => {
      const next = available(sessions)[0];
      if (!next) { if (!clock.hidden) {render(); refresh();} return; }
      if (doc.querySelector('[data-hhl-next]').textContent !== label(next)) {render(); refresh();}
      for (const [key, value] of Object.entries(countdown(next))) doc.querySelector('[data-hhl-' + key + ']').textContent = String(value).padStart(2, '0');
      clock.hidden = false;
    }, 1000);
    const poll = setInterval(refresh, 30000);
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (sending || !form.reportValidity()) return;
      const selected = available(sessions).find(row => row.id === select.value);
      if (!selected) { setStatus('This session is no longer available. Please choose another.'); await refresh(); return; }
      const payload = {session_id: selected.id, first_name: form.elements.first_name.value.trim(), last_name: form.elements.last_name.value.trim(), email: form.elements.email.value.trim(), event_notifications: form.elements.event_notifications.checked, marketing_requested: form.elements.marketing_requested.checked, company_website: form.elements.company_website.value, source: 'health_hope_live_website'};
      const identity = JSON.stringify(payload);
      if (identity !== payloadKey) { requestKey = crypto.randomUUID(); payloadKey = identity; }
      sending = true; submit.disabled = true; select.disabled = true; setStatus('Sending your registration…');
      try {
        const response = await fetch('/api/health-hope-live/register', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...payload, request_id: requestKey}), signal: AbortSignal.timeout(15000)});
        const data = await response.json();
        if (!response.ok || data.received !== true) throw Error(response.status === 409 ? 'This session has changed or closed. Please choose an available session.' : 'We couldn’t confirm receipt. Please try again.');
        if (disposed) return;
        form.hidden = true; doc.getElementById('hhl-confirmed-session').textContent = label(selected);
        const confirmation = doc.getElementById('hhl-confirmation'); confirmation.hidden = false; confirmation.focus();
        form.reset(); requestKey = null; payloadKey = null; setStatus('');
      } catch (error) { if (!disposed) {setStatus(error.message === 'Failed to fetch' || error.name === 'TimeoutError' ? 'We couldn’t confirm receipt. Please retry using the same details.' : error.message); await refresh();} }
      finally { sending = false; if (!disposed) render(); }
    });
    doc.getElementById('hhl-register-another').addEventListener('click', () => {doc.getElementById('hhl-confirmation').hidden = true; form.hidden = false; select.focus(); refresh();});
    window.addEventListener('pagehide', () => {disposed = true; requestGeneration++; clearInterval(timer); clearInterval(poll);});
    refresh();
  }
  function mountPromo(doc) {
    const promo = doc.querySelector('[data-hhl-promo]');
    if (!promo || promo.dataset.hhlPromo !== 'enabled') return;
    const date = promo.querySelector('[data-hhl-promo-date]'), clock = promo.querySelector('[data-hhl-promo-countdown]');
    if (!date || !clock) return;
    let sessions = [], disposed = false, checking = false;
    function render() {
      const next = available(sessions)[0], text = next ? label(next) : 'Session details are being confirmed.';
      if (date.textContent !== text) date.textContent = text;
      date.hidden = false; clock.hidden = !next;
      if (next) for (const [key, value] of Object.entries(countdown(next))) {
        const digit = promo.querySelector('[data-hhl-promo-' + key + ']');
        if (digit) digit.textContent = String(value).padStart(2, '0');
      }
    }
    async function refresh() {
      if (checking || disposed) return;
      checking = true;
      try {
        const response = await fetch('/api/health-hope-live/sessions', {cache: 'no-store', signal: AbortSignal.timeout(10000)});
        if (!response.ok) throw Error();
        const data = await response.json();
        if (!disposed) {sessions = Array.isArray(data.sessions) ? data.sessions : []; render();}
      } catch {if (!disposed) {sessions = []; render();}}
      finally {checking = false;}
    }
    const timer = setInterval(render, 1000), poll = setInterval(refresh, 30000);
    window.addEventListener('pagehide', () => {disposed = true; clearInterval(timer); clearInterval(poll);});
    refresh();
  }
  return {zone, firstSessionDate, available, label, countdown, mount, mountPromo};
});
