/* ReVitalized Academy: archival member proof library.
 * Approved original media remains unaltered; the JS only renders the files as provided.
 * Homepage uses 12 compact entries; Stories page shows all 24.
 */
(() => {
  'use strict';
  const roots = [...document.querySelectorAll('[data-rva-proof-mini]')];
  if (!roots.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'rva-proof-mini-dialog';
  dialog.setAttribute('aria-label', 'Enlarged ReVitalized Academy member story');
  const frame = document.createElement('div');
  frame.className = 'rva-proof-mini-dialog-inner';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'rva-proof-mini-close';
  close.textContent = 'Close ×';
  close.setAttribute('aria-label', 'Close enlarged member story');
  const enlarged = document.createElement('img');
  enlarged.alt = '';
  enlarged.className = 'rva-proof-mini-enlarged';
  const caption = document.createElement('p');
  caption.className = 'rva-proof-mini-dialog-caption';
  frame.append(close, enlarged, caption);
  dialog.append(frame);
  document.body.append(dialog);
  let lastFocus = null;

  const closeDialog = () => { if (dialog.open) dialog.close(); };
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });
  dialog.addEventListener('close', () => { enlarged.removeAttribute('src'); lastFocus?.focus?.(); lastFocus = null; });
  function eligible(item) {
    return !!item &&
      typeof item === 'object' &&
      typeof item.name === 'string' && !!item.name.trim() && item.name.length <= 120 &&
      typeof item.image === 'string' &&
      /^assets\/images\/social-proof\/[a-zA-Z0-9_.-]+\.(?:jpe?g|png|webp|svg)$/i.test(item.image);
  }
  function render(root, all) {
    const grid = root.querySelector('[data-rva-proof-mini-grid]');
    if (!grid) return;
    const full = root.dataset.rvaProofMode === 'all';
    const entries = full ? all : all.filter(item => item.homepage).slice(0, 24);
    if (!entries.length) return;
    let good = 0;
    for (const item of entries) {
      const card = document.createElement('button');
      card.className = 'rva-proof-mini-card';
      card.type = 'button';
      card.setAttribute('aria-label', 'Enlarge ' + item.name + ' original testimonial graphic');
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.alt || item.name + ', original ReVitalized Academy client testimonial graphic';
      image.loading = 'lazy';
      image.decoding = 'async';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const hint = document.createElement('span');
      hint.textContent = 'View larger +';
      card.append(image, name, hint);
      image.addEventListener('error', () => {
        card.remove();
        good -= 1;
        if (good <= 0) root.hidden = true;
      });
      card.addEventListener('click', () => {
        lastFocus = document.activeElement;
        enlarged.src = item.image;
        enlarged.alt = image.alt;
        caption.textContent = item.name + ' · Original client-provided testimonial graphic. Individual results vary.';
        dialog.showModal();
        close.focus();
      });
      grid.append(card);
      good += 1;
    }
    root.hidden = !good;
    if (!full && good > 6) {
      const cards = [...grid.children];
      const perPage = 6;
      const pageCount = Math.ceil(cards.length / perPage);
      let active = 0;
      let timer = null;
      const controls = document.createElement('div');
      controls.className = 'rva-proof-carousel-controls';
      controls.innerHTML = '<button type="button" class="rva-proof-carousel-arrow" data-prev aria-label="Previous testimonial group">←</button><span class="rva-proof-carousel-status" role="status" aria-live="polite"></span><button type="button" class="rva-proof-carousel-arrow" data-next aria-label="Next testimonial group">→</button>';
      const status = controls.querySelector('.rva-proof-carousel-status');
      const show = page => {
        active = (page + pageCount) % pageCount;
        cards.forEach((card, index) => { card.hidden = Math.floor(index / perPage) !== active; });
        status.textContent = 'Stories ' + (active * perPage + 1) + '–' + Math.min((active + 1) * perPage, cards.length) + ' of ' + cards.length;
      };
      const stop = () => { if (timer) clearInterval(timer); timer = null; };
      const start = () => {
        stop();
        if (document.hidden || dialog.open || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        timer = setInterval(() => show(active + 1), 10000);
      };
      controls.querySelector('[data-prev]').addEventListener('click', () => { stop(); show(active - 1); });
      controls.querySelector('[data-next]').addEventListener('click', () => { stop(); show(active + 1); });
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
      root.addEventListener('focusin', stop);
      root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) start(); });
      root.addEventListener('touchstart', stop, {passive:true});
      document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
      dialog.addEventListener('close', start);
      grid.insertAdjacentElement('afterend', controls);
      show(0);
      start();
    }
  }
  fetch('assets/data/social-proof-mini.json', {cache:'no-cache'})
    .then(response => { if (!response.ok) throw Error('Proof gallery unavailable'); return response.json(); })
    .then(raw => {
      if (!Array.isArray(raw)) return;
      const all = raw.filter(eligible);
      for (const root of roots) render(root, all);
    })
    .catch(() => { for (const root of roots) root.hidden = true; });
})();
