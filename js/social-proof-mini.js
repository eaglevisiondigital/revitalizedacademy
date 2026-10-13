/* ReVitalized Academy: approved original-photo mini social proof. Source images are never altered. */
(() => {
  'use strict';
  const root = document.querySelector('[data-rva-proof-mini]');
  const grid = root?.querySelector('[data-rva-proof-mini-grid]');
  if (!root || !grid) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'rva-proof-mini-dialog';
  dialog.setAttribute('aria-label', 'Enlarged member story photograph');
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
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  let lastFocus = null;
  dialog.addEventListener('close', () => { lastFocus?.focus?.(); });

  function eligible(item) {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120) return false;
    if (typeof item.image !== 'string' || !/^assets\/images\/social-proof\/[a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp)$/i.test(item.image)) return false;
    return true;
  }

  fetch('assets/data/social-proof-mini.json', { cache: 'no-cache' })
    .then((response) => { if (!response.ok) throw new Error('Gallery unavailable'); return response.json(); })
    .then((all) => {
      if (!Array.isArray(all)) return;
      const entries = all.filter(eligible).slice(0, 6);
      if (!entries.length) return;
      entries.forEach((item) => {
        const card = document.createElement('button');
        card.className = 'rva-proof-mini-card';
        card.type = 'button';
        card.setAttribute('aria-label', `Enlarge ${item.name}'s original testimonial image`);
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = item.alt || `${item.name}, ReVitalized Academy member story`;
        image.loading = 'lazy';
        image.decoding = 'async';
        const name = document.createElement('strong');
        name.textContent = item.name;
        const hint = document.createElement('span');
        hint.textContent = 'View larger +';
        card.append(image, name, hint);
        // Hide broken items rather than showing empty/broken proof. Do not alter the image.
        image.addEventListener('error', () => { card.remove(); if (!grid.children.length) root.hidden = true; });
        card.addEventListener('click', () => {
          lastFocus = document.activeElement;
          enlarged.src = item.image;
          enlarged.alt = image.alt;
          caption.textContent = `${item.name} · Original testimonial image. Individual results vary.`;
          dialog.showModal();
          close.focus();
        });
        grid.append(card);
      });
      root.hidden = !grid.children.length;
    })
    .catch(() => { root.hidden = true; });
})();