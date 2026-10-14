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
    const entries = full ? all : all.filter(item => item.homepage).slice(0, 12);
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
