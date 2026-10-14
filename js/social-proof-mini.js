/* ReVitalized Academy: historical emerald social-proof graphics.
   All member photographs and pre-existing source captions stay untouched. */
(() => {
  'use strict';
  const roots = [...document.querySelectorAll('[data-rva-proof-mini]')];
  if (!roots.length) return;
  const path = 'assets/data/social-proof-mini.json';

  const dialog = document.createElement('dialog');
  dialog.className = 'rva-proof-mini-dialog';
  dialog.setAttribute('aria-label', 'Enlarged ReVitalized member testimonial');
  const frame = document.createElement('div');
  frame.className = 'rva-proof-mini-dialog-inner';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'rva-proof-mini-close';
  close.textContent = 'Close ×';
  close.setAttribute('aria-label', 'Close enlarged testimonial');
  const enlarged = document.createElement('img');
  enlarged.alt = '';
  enlarged.className = 'rva-proof-mini-enlarged';
  const caption = document.createElement('p');
  caption.className = 'rva-proof-mini-dialog-caption';
  frame.append(close, enlarged, caption);
  dialog.append(frame);
  document.body.append(dialog);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  let lastFocus = null;
  dialog.addEventListener('close', () => {
    enlarged.removeAttribute('src');
    lastFocus?.focus?.();
  });

  const eligible = item => Boolean(item && typeof item.name === 'string' &&
    item.name.trim() && item.name.length <= 120 &&
    typeof item.image === 'string' &&
    /^assets\/images\/social-proof\/(?:IMG_\d{4}|claudia-emerald-testimonial|rodney-emerald-testimonial)\.svg$/.test(item.image));

  function showCard(item, grid, root, index, limit) {
    const card = document.createElement('button');
    card.className = 'rva-proof-mini-card';
    card.type = 'button';
    card.setAttribute('aria-label', `Enlarge original testimonial graphic for ${item.name}`);
    card.hidden = index >= limit;
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = `Original ReVitalized Academy member testimonial graphic: ${item.name}`;
    image.loading = index < limit ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.width = 1320;
    image.height = 1320;
    const name = document.createElement('strong');
    name.textContent = item.name;
    const hint = document.createElement('span');
    hint.textContent = 'View larger +';
    card.append(image, name, hint);
    image.addEventListener('error', () => {
      card.remove();
      if (!grid.children.length) root.hidden = true;
    });
    card.addEventListener('click', () => {
      lastFocus = document.activeElement;
      enlarged.src = item.image;
      enlarged.alt = image.alt;
      caption.textContent = `${item.name} · Original member-provided testimonial. Individual results vary.`;
      dialog.showModal();
      close.focus();
    });
    grid.append(card);
  }

  fetch(path, {cache:'no-cache'})
    .then(res => {if (!res.ok) throw new Error('Gallery unavailable'); return res.json();})
    .then(data => {
      if (!Array.isArray(data)) return;
      const entries = data.filter(eligible);
      if (!entries.length) return;
      roots.forEach(root => {
        const grid = root.querySelector('[data-rva-proof-mini-grid]');
        if (!grid) return;
        const limit = root.dataset.rvaProofLimit === 'all' ? entries.length : 6;
        entries.forEach((item, index) => showCard(item, grid, root, index, limit));
        if (entries.length > limit) {
          const cards = [...grid.querySelectorAll('.rva-proof-mini-card')];
          const pageCount = Math.ceil(cards.length / limit);
          let activePage = 0;
          let timer = null;
          const controls = document.createElement('nav');
          controls.className = 'rva-proof-carousel-controls';
          controls.setAttribute('aria-label', 'Testimonial gallery navigation');
          const prev = document.createElement('button');
          prev.type = 'button';
          prev.className = 'rva-proof-carousel-arrow';
          prev.textContent = '←';
          prev.setAttribute('aria-label','Previous testimonial group');
          const indicator = document.createElement('span');
          indicator.className = 'rva-proof-carousel-indicator';
          indicator.setAttribute('role','status');
          indicator.setAttribute('aria-live','polite');
          const next = document.createElement('button');
          next.type = 'button';
          next.className = 'rva-proof-carousel-arrow';
          next.textContent = '→';
          next.setAttribute('aria-label','Next testimonial group');
          const showPage = page => {
            activePage = (page + pageCount) % pageCount;
            cards.forEach((card, index) => { card.hidden = Math.floor(index / limit) !== activePage; });
            const first = activePage * limit + 1;
            const last = Math.min(first + limit - 1, cards.length);
            indicator.textContent = 'Showing ' + first + '–' + last + ' of ' + cards.length;
          };
          const stop = () => { if (timer !== null) clearInterval(timer); timer = null; };
          const start = () => {
            stop();
            if (document.hidden || dialog.open || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            timer = setInterval(() => showPage(activePage + 1), 10000);
          };
          prev.addEventListener('click', () => { stop(); showPage(activePage - 1); });
          next.addEventListener('click', () => { stop(); showPage(activePage + 1); });
          root.addEventListener('mouseenter', stop);
          root.addEventListener('mouseleave', start);
          root.addEventListener('focusin', stop);
          root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) start(); });
          root.addEventListener('touchstart', stop, {passive:true});
          document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
          dialog.addEventListener('close', start);
          controls.append(prev,indicator,next);
          grid.insertAdjacentElement('afterend', controls);
          showPage(0);
          start();
        }
        const count = root.querySelector('[data-rva-proof-count]');
        if (count) count.textContent = `${entries.length} original member stories`;
        root.hidden = false;
      });
    })
    .catch(() => {roots.forEach(root => {root.hidden = true;});});
})();