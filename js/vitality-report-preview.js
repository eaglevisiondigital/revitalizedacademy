/* ReVitalized Academy | sample Vitality Roadmap report preview
   Marketing-only UI: no assessment inputs, credentials, storage, or network calls. */
(() => {
  'use strict';
  const imagePath = 'assets/images/vitality-roadmap-results-sample-v2.svg';
  const buttonText = 'Click Here to Preview a Sample Vitality Roadmap';
  const page = location.pathname.split('/').pop() || 'index.html';
  if (!['index.html', 'consult.html', 'free-help.html'].includes(page)) return;
  if (document.getElementById('rva-report-preview-dialog')) return;

  const buildButton = (variant = '') => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `rva-report-preview-trigger ${variant}`.trim();
    button.setAttribute('data-rva-report-preview-open', '');
    const symbol = document.createElement('span');
    symbol.className = 'rva-report-preview-trigger-icon';
    symbol.textContent = '▣';
    symbol.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = buttonText;
    button.append(symbol, label);
    return button;
  };

  // Place click-to-open links directly alongside existing approved Vitality Roadmap CTAs.
  if (page === 'index.html') {
    const heroActions = document.querySelector('.hero54-actions');
    if (heroActions) heroActions.insertAdjacentElement('afterend', buildButton('rva-report-preview-trigger--hero'));
    const focusCta = document.querySelector('.matrix-cta-card.accent .vitality-primary-cta');
    if (focusCta) focusCta.insertAdjacentElement('afterend', buildButton('rva-report-preview-trigger--card'));
    const journeyCta = document.querySelector('.journey-actions .vitality-primary-cta');
    if (journeyCta) journeyCta.insertAdjacentElement('afterend', buildButton('rva-report-preview-trigger--banner'));
  } else if (page === 'consult.html') {
    const heading = document.querySelector('.vitality-card-head');
    if (heading) heading.insertAdjacentElement('afterend', buildButton('rva-report-preview-trigger--assessment'));
  } else {
    const freeHelpActions = document.querySelector('.fh80-hero-actions');
    if (freeHelpActions) freeHelpActions.insertAdjacentElement('afterend', buildButton('rva-report-preview-trigger--free-help'));
    const nextAction = document.querySelector('.fh80-next-action .vitality-primary-cta');
    if (nextAction) nextAction.insertAdjacentElement('afterend', buildButton('rva-report-preview-trigger--free-help-next'));
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
        <h2 id="rva-report-preview-title">See What You’ll Receive</h2>
        <p id="rva-report-preview-description">Preview a Sample Vitality Roadmap Results report. The questionnaire is Step 1 of your Vitality Roadmap.</p>
      </div>
      <figure class="rva-report-preview-figure">
        <img src="${imagePath}" alt="Six-page illustrative ReVitalized Academy Vitality Roadmap report sample, showing the family cover, summary, wellness snapshot, areas of concern, lifestyle insights and action steps" width="1448" height="1086" loading="lazy" decoding="async">
      </figure>
      <p class="rva-report-preview-disclaimer">Illustrative sample only. Scores, recommendations and page content are examples, not a real participant’s results. Your actual results, review and recommendations may differ; this preview is not an automatically issued PDF.</p>
      <div class="rva-report-preview-footer">
        <a class="rva-report-preview-zoom" href="${imagePath}" target="_blank" rel="noopener noreferrer">View the full-size sample <span aria-hidden="true">↗</span></a>
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
  document.querySelectorAll('[data-rva-report-preview-open]').forEach(button => {
    button.addEventListener('click', () => show(button));
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