(() => {
  const ENDPOINT = 'https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/public-intake';
  const API_KEY = 'sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd';

  const send = (payload) => {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  };

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
      send({
        type: 'enrollment_start',
        source: 'website_enrollment',
        first_name: parts.shift() || '',
        last_name: parts.join(' '),
        email: fd.get('email'),
        phone: fd.get('phone'),
        website: fd.get('bot-field') || ''
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
        referral_source: 'website_webinar',
        website: fd.get('company-site') || ''
      });
    }
  }, true);
})();