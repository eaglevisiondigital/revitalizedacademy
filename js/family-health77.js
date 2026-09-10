// Build 77: isolated hero image fallback, loaded on families.html only.
(() => {
  const section = document.getElementById('family-health');
  if (!section) return;
  const art = section.querySelector('.fh77-approved-art');
  const desktop = window.matchMedia('(min-width: 1024px)');
  function verifyArtwork() {
    const missing = desktop.matches && art.complete && art.naturalWidth < 16;
    section.classList.toggle('is-art-unavailable', missing);
    if (missing) {
      const portrait = section.querySelector('.fh77-family-portrait');
      if (!portrait.dataset.fallbackLoaded) {
        portrait.dataset.fallbackLoaded = 'true';
        portrait.src = 'assets/images/family-health77/approved-family-mobile.webp';
      }
    }
  }
  art.addEventListener('load', verifyArtwork);
  art.addEventListener('error', verifyArtwork);
  if (desktop.addEventListener) desktop.addEventListener('change', verifyArtwork);
  else desktop.addListener(verifyArtwork);
  verifyArtwork();
})();

// Keep the sitewide header complete on Family Health.
(() => {
  const nav = document.querySelector('.site-header .main-nav');
  if (!nav) return;
  const hasFaq = Array.from(nav.querySelectorAll('a')).some((link) => link.textContent.trim() === 'FAQ');
  if (hasFaq) return;
  const faq = document.createElement('a');
  faq.href = 'index.html#faq';
  faq.textContent = 'FAQ';
  nav.appendChild(faq);
})();
