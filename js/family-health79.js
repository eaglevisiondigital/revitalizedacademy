/* BUILD 79: Manual family story controls, isolated to the new story strip.
   No automated rotation. No external media is requested before a Watch click.
   Native hrefs remain usable when JavaScript or dialog support is unavailable. */
(() => {
  'use strict';
  const root = document.querySelector('[data-fh79-story]');
  if (!root || root.dataset.fh79Ready) return;
  root.dataset.fh79Ready = 'true';
  const slides = Array.from(root.querySelectorAll('[data-fh79-slide]'));
  const controls = root.querySelector('[data-fh79-controls]');
  const dots = Array.from(root.querySelectorAll('[data-fh79-dot]'));
  const status = root.querySelector('[data-fh79-status]');
  let current = 0;
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (status) status.textContent = `Story ${current + 1} of ${slides.length}: ${slides[current].querySelector('h3').textContent}`;
  }
  if (slides.length > 1 && controls) {
    controls.hidden = false;
    root.querySelector('[data-fh79-prev]').addEventListener('click', () => show(current - 1));
    root.querySelector('[data-fh79-next]').addEventListener('click', () => show(current + 1));
    dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.fh79Dot))));
  }
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return;
  dialog.className = 'fh79-video-dialog';
  dialog.setAttribute('aria-labelledby', 'fh79-video-title');
  dialog.innerHTML = '<div class="fh79-dialog-bar"><h2 id="fh79-video-title">Family story</h2><button type="button" aria-label="Close family story video">×</button></div><div class="fh79-video-slot"></div><p class="fh79-dialog-note">Individual experiences vary. <a href="disclaimer.html">Read the Health &amp; Results Disclaimer.</a></p>';
  document.body.appendChild(dialog);
  const title = dialog.querySelector('h2');
  const slot = dialog.querySelector('.fh79-video-slot');
  let returnFocus = null;
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    slot.replaceChildren();
    const active = document.activeElement;
    if (returnFocus && returnFocus.isConnected && (active === document.body || active === returnFocus || dialog.contains(active))) {
      returnFocus.focus({ preventScroll: true });
    }
  });
  root.querySelectorAll('[data-fh79-video]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const id = link.dataset.fh79Video;
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
      event.preventDefault();
      returnFocus = link;
      title.textContent = `${link.dataset.fh79Title} — Their ReVitalized story`;
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = `${link.dataset.fh79Title} testimonial video`;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      slot.replaceChildren(frame);
      dialog.showModal();
    });
  });
})();
