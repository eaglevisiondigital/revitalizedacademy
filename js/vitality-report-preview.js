/* ReVitalized Academy | sample Vitality Roadmap report preview
   Marketing-only UI: no assessment inputs, credentials, storage, or network calls. */
(() => {
  'use strict';
  const imagePath = 'assets/images/vitality-roadmap-results-sample-v2.svg';
  const buttonText = 'Click here to see what your Vitality Roadmap could look like';
  const page = location.pathname.split('/').pop() || 'index.html';
  if (!['index.html', 'consult.html', 'free-help.html', 'stories.html', 'founders.html', 'plans.html', 'webinar.html'].includes(page)) return;
  if (document.getElementById('rva-report-preview-dialog')) return;

  const buildButton = (variant = '') => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `rva-report-preview-trigger ${variant}`.trim();
    button.setAttribute('data-rva-report-preview-open', '');
    const symbol = document.createElement('span');
    symbol.className = 'rva-report-preview-trigger-icon';
    symbol.textContent = '☺';
    symbol.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = buttonText;
    button.append(symbol, label);
    return button;
  };

  // Place a short, unmistakable preview line directly beneath each free
  // Roadmap CTA group. Keep existing primary CTA rows, destinations, and layout.
  const grouped = [
    '.hero54-actions', '.matrix-focus-actions', '.future-actions',
    '.journey-actions', '.video-cta-row', '.founders-cta-actions',
    '.fh80-hero-actions', '.fh80-next-action', '.vitality-popup-actions',
    '.stories-cta > div', '.faq-answer p', '.ra85-question-note',
    '.matrix-cta-card'
  ].join(',');

  const destinations = [...document.querySelectorAll('a[href]')].filter(a => {
    if (a.closest('header,footer,nav,.rva-report-preview-overlay')) return false;
    let url;
    try { url = new URL(a.getAttribute('href') || '', location.href); }
    catch (_) { return false; }
    if (url.origin !== location.origin || !url.pathname.endsWith('/consult.html')) return false;
    return a.classList.contains('vitality-primary-cta') ||
      /(?:free\s+)?vitality\s+roadmap|free\s+vitality\s+assessment|start\s+(?:my\s+)?free\s+assessment/i.test(a.textContent || '');
  });

  const visited = new Set();
  destinations.forEach(a => {
    const target = a.closest(grouped) || a;
    if (visited.has(target) || target.nextElementSibling?.matches('[data-rva-report-preview-open]')) return;
    visited.add(target);
    const link = buildButton();
    if (target.closest('.vitality-popup')) link.classList.add('rva-report-preview-trigger--popup');
    if (target.closest('.matrix-focus-modal')) link.classList.add('rva-report-preview-trigger--matrix');
    target.insertAdjacentElement('afterend', link);
  });

  // The questionnaire's only matching anchor is in its sticky site header,
  // where an extra line would clutter navigation; place it by the form instead.
  if (page === 'consult.html') {
    const heading = document.querySelector('.vitality-card-head') || document.querySelector('.vitality-card');
    if (heading) {
      const link = buildButton('rva-report-preview-trigger--assessment');
      heading.insertAdjacentElement('afterend', link);
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'rva-report-preview-overlay';
  overlay.id = 'rva-report-preview-dialog';
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <section class="rva-report-preview-modal" role="dialog" aria-modal="true"
      aria-labelledby="rva-report-preview-title" aria-describedby="rva-report-preview-description" tabindex="-1">
      <button type="button" class="rva-report-preview-close" data-rva-report-preview-close aria-label="Close sample Vitality Roadmap preview">×</button>
      <div class="rva-report-preview-heading">
        <p class="rva-report-preview-eyebrow">FREE VITALITY ROADMAP · SAMPLE RESULTS</p>
        <h2 id="rva-report-preview-title">See What Your Roadmap Could Look Like</h2>
        <p id="rva-report-preview-description">Explore this six-page Vitality Roadmap Results example. Your own Roadmap will reflect your completed answers and the team’s review.</p>
      </div>
      <figure class="rva-report-preview-figure">
        <img src="${imagePath}" alt="Six-page illustrative ReVitalized Academy Vitality Roadmap report sample, showing the family cover, summary, wellness snapshot, areas of concern, lifestyle insights and action steps" width="1448" height="1086" loading="lazy" decoding="async">
      </figure>
      <p class="rva-report-preview-disclaimer">Illustrative mockup only. Scores and recommendations are fictional. Your reviewed personal Roadmap may differ.</p>
      <div class="rva-report-preview-footer">
        <a class="rva-report-preview-zoom" href="${imagePath}" target="_blank" rel="noopener noreferrer">Open the full-size sample <span aria-hidden="true">↗</span></a>
        <a class="rva-report-preview-cta" href="consult.html">Start Your Free Vitality Roadmap <span aria-hidden="true">→</span></a>
      </div>
    </section>`;
  document.body.append(overlay);

  let opener = null;
  let priorOverflow = '';
  const dialog = overlay.querySelector('.rva-report-preview-modal');
  const close = overlay.querySelector('[data-rva-report-preview-close]');
  const finalCta = overlay.querySelector('.rva-report-preview-cta');
  if (page === 'consult.html') {
    finalCta.textContent = 'Return to Step 1 of Your Vitality Roadmap →';
    finalCta.setAttribute('href', '#start-assessment');
    finalCta.addEventListener('click', (event) => {
      event.preventDefault();
      hide();
    });
  }

  function show(button) {
    opener = button;
    priorOverflow = document.body.style.overflow;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    close.focus({preventScroll:true});
  }
  function hide() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = priorOverflow;
    if (opener && opener.isConnected) opener.focus({preventScroll:true});
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-rva-report-preview-open]');
    if (!button) return;
    event.preventDefault();
    if (overlay.hidden) show(button);
  });
  close.addEventListener('click', hide);
  overlay.addEventListener('mousedown', event => { if (event.target === overlay) hide(); });
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); hide(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length > 0);
    if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length-1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  });
})();