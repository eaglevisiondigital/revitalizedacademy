(() => {
  const hero = document.querySelector('.founders-page-build69 .founders-hero-exact');
  const media = hero?.querySelector('.founders-hero-exact-media');
  const img = media?.querySelector('img');
  if (!hero || !media || !img || !window.__f105) return;

  img.src = 'data:image/webp;base64,' + window.__f105;
  img.removeAttribute('srcset');
  img.alt = 'About Our Founders — Justyn and Elle Oliver';
  hero.classList.add('founders105-exact-artwork');

  img.addEventListener('load', () => {
    window.__f105 = '';
  }, { once: true });
})();
