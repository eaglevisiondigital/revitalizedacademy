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

  const send = (payload) => {
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
      })
      .catch(() => {});
  };

  loadWebinarCounter();

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

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
})();