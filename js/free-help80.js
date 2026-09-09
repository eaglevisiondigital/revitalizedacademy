/* Build 80: Free Help enhancements only. No assessment data, cookies or storage. */
(() => {
  'use strict';
  const page = document.getElementById('free-help80');
  if (!page) return;

  page.querySelectorAll('[data-video-thumbnail]').forEach((image) => {
    const fallback = () => { image.hidden = true; };
    image.addEventListener('error', fallback);
    image.addEventListener('load', () => {
      if (image.naturalWidth < 200) fallback();
    });
    if (image.complete && image.naturalWidth < 200) fallback();
  });

  const controls = page.querySelector('[data-filter-controls]');
  const resources = Array.from(page.querySelectorAll('[data-resource]'));
  const groups = Array.from(page.querySelectorAll('[data-resource-group]'));
  const topicButtons = Array.from(page.querySelectorAll('[data-topic]'));
  const search = page.querySelector('[data-resource-search]');
  const status = page.querySelector('[data-filter-status]');
  const empty = page.querySelector('[data-no-results]');
  let topic = 'All Resources';
  const normal = text => String(text || '').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '');
  const indexed = resources.map(el => ({
    el, topics: (el.dataset.topics || '').split('|'),
    text: normal(el.textContent + ' ' + el.dataset.topics)
  }));

  // Shared app.js binds original video buttons; only restored buttons need a new listener.
  const posterCache = new Map();
  const bindReplacement = (wrap, button) => {
    button.addEventListener('click', () => {
      const id = wrap.dataset.youtubeId || '';
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = wrap.dataset.title || 'ReVitalized Academy video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      wrap.replaceChildren(iframe);
    });
  };
  page.querySelectorAll('.fh80-video-wrap').forEach(wrap => {
    const button = wrap.querySelector('.video-poster');
    if (!button) return;
    const snapshot = button.cloneNode(true);
    snapshot.querySelectorAll('[data-video-thumbnail]').forEach(img => { img.hidden = true; });
    posterCache.set(wrap, snapshot);
  });

  const updateResources = () => {
    const query = normal(search.value.trim());
    const terms = query.split(/\s+/).filter(Boolean);
    let visible = 0;
    indexed.forEach(({ el, topics, text }) => {
      const show = (topic === 'All Resources' || topics.includes(topic)) && terms.every(term => text.includes(term));
      el.hidden = !show;
      if (show) visible++;
      // A filtered-out player is removed, so audio does not continue out of sight.
      if (!show) el.querySelectorAll('iframe').forEach(frame => {
        const wrap = frame.closest('.fh80-video-wrap');
        if (wrap && posterCache.has(wrap)) {
          const replacement = posterCache.get(wrap).cloneNode(true);
          wrap.replaceChildren(replacement);
          bindReplacement(wrap, replacement);
        }
      });
    });
    groups.forEach(group => { group.hidden = !Array.from(group.querySelectorAll('[data-resource]')).some(el => !el.hidden); });
    topicButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === topic)));
    empty.hidden = visible !== 0;
    status.textContent = visible === resources.length && !query && topic === 'All Resources'
      ? `Showing all ${resources.length} resources`
      : `${visible} resource${visible === 1 ? '' : 's'}${topic !== 'All Resources' ? ` · ${topic}` : ''}${query ? ` matching “${search.value.trim()}”` : ''}`;
  };

  if (controls && resources.length && search && status && empty) {
    controls.hidden = false;
    topicButtons.forEach(button => button.addEventListener('click', () => { topic = button.dataset.topic; updateResources(); }));
    search.addEventListener('input', updateResources);
    page.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
      topic = 'All Resources'; search.value = ''; updateResources(); search.focus();
    });
    page.querySelectorAll('a[href="#watch"],a[href="#podcast"],a[href="#read"]').forEach(link => {
      link.addEventListener('click', () => { topic = 'All Resources'; search.value = ''; updateResources(); });
    });
    updateResources();
  }

  // Original public Netlify form name/fields retained; no success until the server accepts the post.
  const form = page.querySelector('[data-newsletter-form]');
  if (form && 'fetch' in window && 'FormData' in window) {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-newsletter-status]');
    const initialLabel = button.innerHTML;
    let busy = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || !form.reportValidity()) return;
      const firstName = form.elements.namedItem('first_name');
      if (!firstName.value.trim()) {
        firstName.setCustomValidity('Please enter your first name.');
        firstName.reportValidity(); return;
      }
      busy = true; button.disabled = true; button.textContent = 'Joining the list…';
      form.setAttribute('aria-busy', 'true'); status.hidden = true;
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = controller ? setTimeout(() => controller.abort(), 15000) : null;
      try {
        const payload = new URLSearchParams();
        for (const [name, value] of new FormData(form).entries()) payload.append(name, String(value));
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString(),
          ...(controller ? { signal: controller.signal } : {})
        });
        if (!response.ok) throw new Error(`Subscription returned HTTP ${response.status}`);
        form.reset(); status.dataset.error = 'false';
        status.textContent = 'You’re on the list. Thank you for joining the ReVitalized Report.';
      } catch (_) {
        status.dataset.error = 'true';
        status.textContent = 'We couldn’t submit your signup. Your details are still here—please try again, or contact contact@revitalizedacademy.com.';
      } finally {
        if (timeout) clearTimeout(timeout);
        busy = false; button.disabled = false; button.innerHTML = initialLabel;
        form.removeAttribute('aria-busy'); status.hidden = false;
      }
    });
    form.elements.namedItem('first_name').addEventListener('input', event => event.target.setCustomValidity(''));
  }

  // Only measure the sticky header, without changing it or other website sections.
  const header = document.querySelector('.site-header');
  const setOffset = () => page.style.setProperty('--f80-anchor', `${Math.ceil(header?.getBoundingClientRect().height || 90) + 18}px`);
  setOffset();
  if (header && 'ResizeObserver' in window) new ResizeObserver(setOffset).observe(header);
  else window.addEventListener('resize', setOffset, { passive: true });
})();
