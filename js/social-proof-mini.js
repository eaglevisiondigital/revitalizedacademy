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
          const more = document.createElement('button');
          more.className = 'rva-proof-mini-more';
          more.type = 'button';
          more.textContent = `View All ${entries.length} Member Stories ↓`;
          more.setAttribute('aria-expanded','false');
          more.addEventListener('click', () => {
            const expanded = more.getAttribute('aria-expanded') === 'true';
            grid.querySelectorAll('.rva-proof-mini-card').forEach((card, index) => {
              card.hidden = expanded && index >= limit;
            });
            more.setAttribute('aria-expanded', String(!expanded));
            more.textContent = expanded ? `View All ${entries.length} Member Stories ↓` : 'Show Fewer Stories ↑';
          });
          grid.insertAdjacentElement('afterend', more);
        }
        const count = root.querySelector('[data-rva-proof-count]');
        if (count) count.textContent = `${entries.length} original member stories`;
        root.hidden = false;
      });
    })
    .catch(() => {roots.forEach(root => {root.hidden = true;});});
})();