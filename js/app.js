const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

// Inline YouTube playback.
document.querySelectorAll('.video-embed[data-youtube-id]').forEach((wrap) => {
  const button = wrap.querySelector('.video-poster');
  if (!button) return;
  button.addEventListener('click', () => {
    const id = wrap.dataset.youtubeId;
    const title = wrap.dataset.title || 'ReVitalized Academy video';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    wrap.innerHTML = '';
    wrap.appendChild(iframe);
  });
});

const iconSvg = {
  athletic: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="35.5" cy="12" r="4.5"/><path d="M29 25l7-4 8 7m-12-2-4 9-10 6m14-15-1 13-9 8m10-9 11 4m-11-4 2 11m-14-12H17"/></svg>',
  energized: '<svg viewBox="0 0 64 64"><path d="M36 5 17 34h15l-5 25 21-32H34z"/></svg>',
  organized: '<svg viewBox="0 0 64 64"><rect x="16" y="14" width="36" height="42" rx="3"/><path d="M25 14v-5h18v5M23 27l4 4 7-8M23 40l4 4 7-8M38 27h8M38 40h8"/></svg>',
  refined: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 16c-4 5-6 10-6 15 0 5 2 9 6 12 4-3 6-7 6-12 0-5-2-10-6-15Z"/><path d="M24 25c-6 2-10 7-11 13 5 4 11 5 17 4-1-6-3-11-6-17Z"/><path d="M40 25c6 2 10 7 11 13-5 4-11 5-17 4 1-6 3-11 6-17Z"/><path d="M21 46c4 2 7 3 11 3s7-1 11-3"/></svg>',
  diet: '<svg viewBox="0 0 64 64"><path d="M13 32h38l-4 19H17z"/><path d="M22 32c0-10 7-17 17-17 6 0 11 2 15 7M37 14c0-6 4-10 10-12"/></svg>',
  training: '<svg viewBox="0 0 64 64"><path d="M7 24v16M15 18v28M49 18v28M57 24v16M15 32h34"/></svg>',
  recovery: '<svg viewBox="0 0 64 64"><path d="M32 54c13-9 23-20 23-34-10 0-18 4-23 13-6-9-14-13-24-13 0 14 10 25 24 34Z"/><path d="M32 12v31"/></svg>',
  habits: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="23"/><path d="m21 32 7 7 16-18"/></svg>',
  detox: '<svg viewBox="0 0 64 64"><path d="M13 53c23 0 36-14 38-41-25 3-39 16-38 41Z"/><path d="M16 49c9-11 18-21 30-30"/></svg>',
  hydration: '<svg viewBox="0 0 64 64"><path d="M32 5S15 26 15 39a17 17 0 0 0 34 0C49 26 32 5 32 5Z"/></svg>',
  budgeting: '<svg viewBox="0 0 64 64"><path d="M12 20h40v30H12z"/><path d="M12 28h30c8 0 10 12 2 12H30"/><circle cx="45" cy="34" r="2"/></svg>',
  mindset: '<svg viewBox="0 0 64 64"><path d="M32 9c-12 0-21 9-21 21 0 8 4 14 10 18v7h22v-7c6-4 10-10 10-18 0-12-9-21-21-21Z"/><path d="M26 28c2-4 10-4 12 0M24 38c5 5 11 5 16 0"/></svg>',
  momentum: '<svg viewBox="0 0 64 64"><rect x="10" y="16" width="44" height="38" rx="3"/><path d="M19 9v14M45 9v14M10 27h44M20 36h6M31 36h6M42 36h4M20 45h6M31 45h6M42 45h4"/></svg>',
  gi: '<svg viewBox="0 0 64 64"><path d="M31 7c-6 7-6 14-2 19 3 4 2 9-2 13-5 5-2 15 7 16 12 1 21-8 20-21-1-9-6-15-13-16-4 0-7-3-6-7"/></svg>',
  hormone: '<svg viewBox="0 0 64 64"><path d="M32 12v42M18 17h28M12 25l-8 14h16L12 25ZM52 25l-8 14h16L52 25Z"/><path d="M9 46h46"/></svg>',
  neural: '<svg viewBox="0 0 64 64"><path d="M27 9c-9-5-17 3-14 12-8 2-9 13-3 18-4 9 5 17 13 13 4 7 14 5 14-3V16c0-5-5-9-10-7ZM37 16v33c0 8 10 10 14 3 8 4 17-4 13-13 6-5 5-16-3-18 3-9-5-17-14-12-5-2-10 2-10 7Z"/><path d="M19 25c8-2 12 2 12 7M17 41c6-4 12-2 14 3M45 25c-8-2-12 2-12 7M47 41c-6-4-12-2-14 3"/></svg>'
};

const matrixData = {
  energized: {
    theme: 'energized',
    name: 'Energized',
    tagline: 'Feel good everyday',
    focusIcon: 'energized',
    summary: 'Build the everyday habits that support energy, detoxification, hydration, and a body that feels better from the inside out.',
    sections: [
      {
        title: 'Habits',
        icon: 'habits',
        points: [
          'Bioelectrical charge grounding routine',
          'Quantum-safe home hygiene',
          'Stabilize the circadian rhythm'
        ]
      },
      {
        title: 'Detoxification',
        icon: 'detox',
        points: [
          'Bind & eliminate toxins out of the body',
          'Target & pull toxins out of tissue',
          'Open detox pathways'
        ]
      },
      {
        title: 'Cellular Hydration',
        icon: 'hydration',
        points: [
          'Daily hydration equation',
          'Rehydrate to daily baseline',
          'Purify drinking water'
        ]
      }
    ]
  },
  organized: {
    theme: 'organized',
    name: 'Organized',
    tagline: 'Living healthy is easy and fun',
    focusIcon: 'organized',
    summary: 'Create simple systems for money, mindset, and momentum so healthy living becomes practical, repeatable, and sustainable.',
    sections: [
      {
        title: 'Wise Budgeting',
        icon: 'budgeting',
        points: [
          'Build up a healthy emergency savings',
          'Create a healthy budget',
          'Cut unnecessary spending'
        ]
      },
      {
        title: 'Mentality Realignment',
        icon: 'mindset',
        points: [
          'Learn to be a grateful whitebelt',
          'Enhance your vocabulary',
          'Control your environment'
        ]
      },
      {
        title: 'Momentum Regimens',
        icon: 'momentum',
        points: [
          'Goal-focused monthly targets & standards',
          'Simple weekly routines',
          'Simple daily habits'
        ]
      }
    ]
  },
  athletic: {
    theme: 'athletic',
    name: 'Athletic',
    tagline: 'Move dynamically without pain',
    focusIcon: 'athletic',
    summary: 'Support a body that moves well, recovers well, and keeps the physical capacity to perform for the long haul.',
    sections: [
      {
        title: 'The Living Diet',
        icon: 'diet',
        points: [
          'Enhance digestion',
          'Balance blood sugar',
          'Reduce inflammation'
        ]
      },
      {
        title: 'Functional Training',
        icon: 'training',
        points: [
          'Maintain full-body athletic performance',
          'Train to functional baseline',
          'Movement rehabilitation'
        ]
      },
      {
        title: 'Holistic Recovery',
        icon: 'recovery',
        points: [
          'Challenge & support your stress response',
          'Refresh extension',
          'Laboratory measures'
        ]
      }
    ]
  },
  refined: {
    theme: 'refined',
    name: 'Refined',
    tagline: 'Be impressed with your reflection',
    focusIcon: 'refined',
    summary: 'Support the systems that influence digestion, hormone balance, body composition, brain health, and how you feel in your own skin.',
    sections: [
      {
        title: 'G.I. Renovation',
        icon: 'gi',
        points: [
          'Stimulate healthy bile everyday',
          'Consistently positive bowel transit rate',
          'Repopulate gut microbiome'
        ]
      },
      {
        title: 'Hormone Balancing',
        icon: 'hormone',
        points: [
          'Calm the hormone storm',
          'Practice body recomposition',
          'Recalibrate endocrine system to homeostasis'
        ]
      },
      {
        title: 'Neural Repatterning',
        icon: 'neural',
        points: [
          'De-stress the brain',
          'Balance neurochemistry',
          'Strengthen neural circuits'
        ]
      }
    ]
  }
};

const matrixNodes = document.querySelectorAll('[data-matrix-target]');
if (matrixNodes.length) {
  const modal = document.getElementById('matrix-modal');
  const card = document.getElementById('matrix-focus-modal');
  const focusIcon = document.getElementById('matrix-focus-icon');
  const focusTitle = document.getElementById('matrix-focus-title');
  const focusTagline = document.getElementById('matrix-focus-tagline');
  const focusSummary = document.getElementById('matrix-focus-summary');
  const accordionHost = document.getElementById('matrix-focus-accordions');

  const buildAccordion = (section) => `
    <details class="matrix-focus-accordion">
      <summary>
        <span class="matrix-focus-row-icon">${iconSvg[section.icon] || ''}</span>
        <span class="matrix-focus-row-title">${section.title}</span>
        <span class="matrix-focus-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div class="matrix-focus-panel">
        <ul>
          ${section.points.map((point) => `<li>${point}</li>`).join('')}
        </ul>
      </div>
    </details>
  `;

  const setModal = (key) => {
    const data = matrixData[key];
    if (!data) return;
    card.className = `matrix-focus-modal theme-${data.theme}`;
    const approvedFocusImages = {
      athletic: 'assets/images/icon-athletic-approved.png',
      energized: 'assets/images/icon-energized-approved.png',
      refined: 'assets/images/icon-refined-approved.png',
      organized: 'assets/images/icon-organized-approved.png'
    };
    if (approvedFocusImages[data.focusIcon]) {
      focusIcon.innerHTML = `<img class="matrix-focus-icon-image approved-focus-icon" src="${approvedFocusImages[data.focusIcon]}" alt="">`;
      focusIcon.classList.add('uses-approved-focus-icon');
      focusIcon.classList.remove('uses-approved-image');
    } else {
      focusIcon.innerHTML = iconSvg[data.focusIcon] || '';
      focusIcon.classList.remove('uses-approved-focus-icon', 'uses-approved-image');
    }
    focusTitle.textContent = data.name;
    focusTagline.textContent = data.tagline;
    focusSummary.textContent = data.summary;
    accordionHost.innerHTML = data.sections.map(buildAccordion).join('');
  };

  const openModal = (key) => {
    setModal(key);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('matrix-modal-open');
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('matrix-modal-open');
  };

  matrixNodes.forEach((node) => {
    const activate = () => openModal(node.dataset.matrixTarget);
    node.addEventListener('click', activate);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });

  modal.querySelectorAll('[data-matrix-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}


// Keep the FAQ section clean: opening one answer closes the previously open answer.
const faqItems = document.querySelectorAll('#faq .faq-grid details');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

// Build 72 — premium coaching experience. Appended to the current-main app.js only.
// Intentionally isolated from the Build 71 Vitality Assessment and disclaimer system.
(() => {
  const oldDifference = document.querySelector('#coaching.difference-section');
  const oldArchitecture = oldDifference ? oldDifference.nextElementSibling : null;

  if (oldDifference && oldArchitecture && oldArchitecture.classList.contains('coaching-premium')) {
    const section = document.createElement('section');
    section.className = 'coaching72';
    section.id = 'coaching';
    section.setAttribute('aria-labelledby', 'coaching72-title');

    section.innerHTML = `
      <div class="coaching72-difference">
        <div class="coaching72-botanical coaching72-botanical-left" aria-hidden="true"></div>
        <div class="coaching72-scenic" aria-hidden="true"></div>
        <div class="coaching72-difference-inner">
          <div class="coaching72-title-block">
            <span class="coaching72-overline">A HEALTHIER TOMORROW STARTS WITH A DIFFERENT APPROACH</span>
            <h2 id="coaching72-title">Why<br>ReVitalized<br>Is Different</h2>
            <span class="coaching72-gold-rule"></span>
            <p>The challenge is not finding more information. It is knowing what matters, what fits, and what to do next.</p>
            <em>Clarity changes everything.</em>
          </div>

          <article class="coaching72-compare coaching72-compare-muted">
            <h3><span class="coaching72-circle coaching72-circle-muted">i</span> Most Health Advice</h3>
            <ul>
              <li>One-size-fits-all plans</li>
              <li>Focus on isolated symptoms</li>
              <li>Short-term thinking</li>
              <li>Conflicting &amp; confusing information</li>
              <li>Leaves you guessing what to do next</li>
            </ul>
            <p class="coaching72-card-footer">More information. Less clarity.</p>
          </article>

          <div class="coaching72-vs" aria-hidden="true">VS.</div>

          <article class="coaching72-compare coaching72-compare-premium">
            <div class="coaching72-premium-head">
              <span class="coaching72-medallion">☆</span>
              <div><h3>ReVitalized Coaching</h3><small>REAL GUIDANCE. A BRIGHTER TOMORROW.</small></div>
            </div>
            <ul>
              <li>Personalized roadmap</li>
              <li>Whole-picture perspective</li>
              <li>Long-term lifestyle transformation</li>
              <li>Clear priorities and practical application</li>
              <li>Education, support &amp; accountability</li>
            </ul>
            <p class="coaching72-card-footer">Real guidance. A healthier, longer you.</p>
          </article>

          <div class="coaching72-side-note" aria-hidden="true">
            <span>BETTER</span><span>INFORMATION</span><span>BRIGHTER</span><span>TOMORROWS</span><b></b>
          </div>
        </div>
      </div>

      <div class="coaching72-architecture">
        <div class="coaching72-architecture-inner">
          <div class="coaching72-section-label"><span></span><b>PERSONAL APPLICATION</b><span></span></div>
          <h2>What the ReVitalized Coaching Experience Is Built Around</h2>
          <p class="coaching72-intro">Knowing more is not the same as knowing where to begin. Coaching helps evaluate the bigger picture, prioritize what matters and turn it into practical action.</p>

          <div class="coaching72-steps">
            <article><span class="coaching72-step-icon">◎</span><h3>Personalized<br>Starting Point</h3><p>Understand where you are today and what matters most.</p><i></i></article>
            <article><span class="coaching72-step-icon">✥</span><h3>Your Longevity<br>Roadmap</h3><p>Build a clearer path around your goals and lifestyle.</p><i></i></article>
            <article><span class="coaching72-step-icon">♧</span><h3>Direct Coaching<br>&amp; Support</h3><p>Get guidance instead of trying to figure it all out alone.</p><i></i></article>
            <article><span class="coaching72-step-icon">↗</span><h3>Actionable<br>Strategy</h3><p>Turn what you learn into practical steps you can use.</p><i></i></article>
            <article><span class="coaching72-step-icon">✓</span><h3>Accountability<br>&amp; Progress</h3><p>Stay focused, adjust as needed and keep moving forward.</p><i></i></article>
            <article><span class="coaching72-step-icon">☆</span><h3>A Growing<br>Ecosystem</h3><p>Start with proven coaching now and gain more resources as ReVitalized grows.</p><i></i></article>
          </div>

          <div class="coaching72-value-band">
            <div class="coaching72-value-mark">♢</div>
            <div class="coaching72-value-title"><small>MORE THAN COACHING</small><strong>A Healthier, Longer You Is Within Reach</strong></div>
            <div class="coaching72-value-copy"><strong>Personalized guidance. Practical application. A brighter tomorrow.</strong><span>Take the first step toward the life you want.</span></div>
            <a href="enroll.html" class="coaching72-cta journey-secondary-cta">Start Your Journey <span>→</span></a>
          </div>
        </div>
      </div>
    `;

    oldDifference.replaceWith(section);
    oldArchitecture.remove();

    const style = document.createElement('style');
    style.id = 'coaching72-styles';
    style.textContent = `
      .coaching72{--c72-green:#073f34;--c72-green2:#0d5d4a;--c72-gold:#d7a424;--c72-cream:#fcf5ee;--c72-ink:#18382f;background:var(--c72-cream);border-top:1px solid rgba(177,136,69,.2);overflow:hidden}
      .coaching72 *{box-sizing:border-box}
      .coaching72-difference{position:relative;background:linear-gradient(90deg,#fffaf3 0%,#f9f1e5 62%,#edf2e6 100%);overflow:hidden}
      .coaching72-difference:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 68% 50%,rgba(216,166,42,.09),transparent 26%),radial-gradient(circle at 28% 8%,rgba(255,255,255,.8),transparent 34%);pointer-events:none}
      .coaching72-difference-inner{position:relative;z-index:2;max-width:1480px;margin:auto;padding:48px 38px 42px;display:grid;grid-template-columns:1.08fr 1.23fr 76px 1.42fr .28fr;gap:24px;align-items:center}
      .coaching72-title-block{padding:4px 8px 0 10px}
      .coaching72-overline{display:block;max-width:310px;font-size:10px;line-height:1.35;letter-spacing:.28em;font-weight:800;color:#4d665e;margin-bottom:18px}
      .coaching72-title-block h2{font-family:Georgia,"Times New Roman",serif;color:var(--c72-green);font-size:clamp(48px,4.25vw,72px);line-height:.91;letter-spacing:-.035em;margin:0}
      .coaching72-gold-rule{display:block;width:78px;height:2px;background:linear-gradient(90deg,var(--c72-gold),rgba(215,164,36,.08));margin:20px 0}
      .coaching72-title-block p{font-size:17px;line-height:1.5;color:#304b42;max-width:360px;margin:0 0 18px}
      .coaching72-title-block em{font-family:Georgia,"Times New Roman",serif;font-size:23px;color:#a97412}
      .coaching72-compare{position:relative;background:rgba(255,255,255,.86);border-radius:22px;min-height:315px;padding:26px 30px 20px;box-shadow:0 20px 40px rgba(39,42,36,.10);border:1px solid rgba(122,112,91,.16);overflow:hidden}
      .coaching72-compare h3{font-family:Georgia,"Times New Roman",serif;font-size:25px;color:#172e28;display:flex;gap:13px;align-items:center;margin:0 0 20px}
      .coaching72-circle{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex:none;font-family:Arial,sans-serif;font-weight:900;border:1px solid #c6c6c2;background:#fafafa}
      .coaching72-circle-muted{color:#5c6260}
      .coaching72-compare ul{list-style:none;padding:0;margin:0}
      .coaching72-compare li{position:relative;padding-left:38px;margin:12px 0;font-size:16px;color:#304940}
      .coaching72-compare-muted li:before{content:"×";position:absolute;left:0;top:-1px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#929897;color:#fff;font-weight:900;line-height:1}
      .coaching72-card-footer{position:absolute;left:0;right:0;bottom:0;margin:0!important;padding:16px 20px;text-align:center;background:linear-gradient(180deg,rgba(238,238,234,.4),#e9e7e0);font-family:Georgia,"Times New Roman",serif;font-style:italic;color:#6e746f!important;font-size:17px!important}
      .coaching72-vs{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:#fff;border:2px solid var(--c72-gold);box-shadow:0 0 0 8px rgba(255,255,255,.72),0 10px 24px rgba(72,59,28,.12);color:var(--c72-green);font-weight:900;font-size:20px;justify-self:center}
      .coaching72-compare-premium{border:2px solid #b98717;padding:0 28px 20px;box-shadow:0 22px 44px rgba(45,55,42,.12),0 0 0 4px rgba(216,166,42,.08)}
      .coaching72-premium-head{margin:0 -28px 14px;padding:17px 24px;display:flex;gap:14px;align-items:center;background:linear-gradient(100deg,#074a3b,#0b5c49);color:#fff}
      .coaching72-premium-head h3{font-family:Georgia,"Times New Roman",serif;color:#fff;margin:0;font-size:26px;display:block}
      .coaching72-premium-head small{font-size:9px;letter-spacing:.18em;font-weight:800;color:#f3d37f}
      .coaching72-medallion{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#e4b53e,#a66d0c);border:2px solid #f6d474;color:#fff;font-size:22px;box-shadow:0 6px 14px rgba(0,0,0,.18)}
      .coaching72-compare-premium li{padding-left:38px}
      .coaching72-compare-premium li:before{content:"✓";position:absolute;left:0;top:-1px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#d7a424,#b47d16);color:#fff;font-weight:900;font-size:14px}
      .coaching72-compare-premium .coaching72-card-footer{background:linear-gradient(180deg,rgba(224,239,226,.75),#e4eee5);color:#16503f!important}
      .coaching72-side-note{align-self:start;margin-top:20px;display:flex;flex-direction:column;gap:7px;font-size:9px;letter-spacing:.28em;font-weight:800;color:#526c62}
      .coaching72-side-note b{display:block;width:40px;height:2px;background:var(--c72-gold);margin-top:6px}
      .coaching72-botanical{position:absolute;left:-54px;top:20px;width:200px;height:320px;opacity:.58;transform:rotate(-9deg);z-index:1;background:radial-gradient(ellipse at 50% 10%,#365d37 0 13%,transparent 14%),radial-gradient(ellipse at 72% 27%,#406f40 0 13%,transparent 14%),radial-gradient(ellipse at 40% 44%,#507a48 0 14%,transparent 15%),radial-gradient(ellipse at 70% 61%,#345c37 0 12%,transparent 13%),linear-gradient(82deg,transparent 48%,rgba(89,99,49,.6) 49% 51%,transparent 52%)}
      .coaching72-scenic{position:absolute;right:0;bottom:0;width:19%;height:100%;opacity:.42;background:linear-gradient(180deg,transparent 18%,rgba(63,96,69,.08) 19%),linear-gradient(145deg,transparent 48%,#9fa789 49% 54%,transparent 55%),linear-gradient(155deg,transparent 57%,#6f856d 58% 65%,transparent 66%),linear-gradient(170deg,transparent 67%,#314d3e 68% 100%);clip-path:polygon(20% 0,100% 0,100% 100%,0 100%,22% 72%,0 56%,25% 35%)}

      .coaching72-architecture{position:relative;background:radial-gradient(circle at 50% 10%,rgba(216,166,42,.05),transparent 30%),linear-gradient(180deg,#fffaf4,#fbf5ed);border-top:1px solid rgba(216,166,42,.14)}
      .coaching72-architecture:before,.coaching72-architecture:after{content:"";position:absolute;left:-5%;right:-5%;height:120px;border-top:1px solid rgba(216,166,42,.19);border-radius:50%;pointer-events:none}
      .coaching72-architecture:before{top:70px;transform:rotate(-2deg)}
      .coaching72-architecture:after{top:110px;transform:rotate(2deg)}
      .coaching72-architecture-inner{position:relative;z-index:2;max-width:1530px;margin:auto;padding:26px 44px 28px}
      .coaching72-section-label{display:flex;align-items:center;justify-content:center;gap:16px;margin:0 auto 12px}
      .coaching72-section-label span{width:46px;height:1px;background:var(--c72-gold)}
      .coaching72-section-label b{padding:7px 14px;border-radius:999px;background:#f0eee6;color:#165440;font-size:11px;letter-spacing:.18em}
      .coaching72-architecture h2{font-family:Georgia,"Times New Roman",serif;color:var(--c72-green);font-size:clamp(35px,3vw,52px);line-height:1;margin:0 auto 10px;text-align:center;max-width:1040px}
      .coaching72-intro{max-width:880px;margin:0 auto 26px;text-align:center;color:#53645e;font-size:15px}
      .coaching72-steps{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
      .coaching72-steps article{position:relative;min-height:230px;padding:16px 14px 20px;text-align:center;background:linear-gradient(180deg,#fffdf9,#fbf6ee);border:1px solid rgba(177,136,69,.22);border-radius:18px;box-shadow:0 11px 24px rgba(36,45,38,.055);display:flex;flex-direction:column;align-items:center}
      .coaching72-step-icon{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#fff,#fbf2e4);border:1px solid rgba(216,166,42,.34);color:#b17b13;font-size:28px;margin-bottom:13px;box-shadow:0 7px 16px rgba(216,166,42,.08)}
      .coaching72-steps h3{font-family:Georgia,"Times New Roman",serif;color:var(--c72-green);font-size:21px;line-height:1.05;margin:0 0 10px}
      .coaching72-steps p{font-size:13px;line-height:1.45;color:#53615c;margin:0}
      .coaching72-steps i{margin-top:auto;width:34px;height:2px;background:var(--c72-gold)}
      .coaching72-value-band{margin-top:18px;padding:17px 22px;border-radius:18px;background:linear-gradient(100deg,#064a3b,#075746 55%,#064536);border:1px solid #c79522;box-shadow:0 14px 28px rgba(6,72,56,.18);display:grid;grid-template-columns:54px 1.25fr 1.25fr auto;gap:18px;align-items:center;color:#fff}
      .coaching72-value-mark{font-size:35px;color:#e4bc57;text-align:center}
      .coaching72-value-title{display:flex;flex-direction:column;gap:3px}
      .coaching72-value-title small{font-size:10px;letter-spacing:.22em;color:#e6c66e;font-weight:900}
      .coaching72-value-title strong{font-family:Georgia,"Times New Roman",serif;font-size:23px;line-height:1.1}
      .coaching72-value-copy{border-left:1px solid rgba(230,198,110,.45);padding-left:24px;display:flex;flex-direction:column;font-size:12px;color:rgba(255,255,255,.88)}
      .coaching72-cta{min-width:220px;min-height:52px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:20px;background:linear-gradient(180deg,#f1cd65,#d8a62a);color:#173e31;font-weight:900;box-shadow:0 10px 22px rgba(0,0,0,.15);border:1px solid rgba(255,226,132,.8)}
      .coaching72-cta:hover{transform:translateY(-1px)}

      @media(max-width:1180px){
        .coaching72-difference-inner{grid-template-columns:1fr 1fr 62px 1fr;padding:42px 26px}.coaching72-side-note{display:none}.coaching72-title-block{grid-column:1/-1;text-align:center}.coaching72-title-block p,.coaching72-overline{margin-left:auto;margin-right:auto}.coaching72-gold-rule{margin-left:auto;margin-right:auto}.coaching72-title-block h2 br{display:none}.coaching72-steps{grid-template-columns:repeat(3,1fr)}.coaching72-value-band{grid-template-columns:54px 1fr 1fr}.coaching72-cta{grid-column:1/-1;justify-self:end}
      }
      @media(max-width:820px){
        .coaching72-difference-inner{grid-template-columns:1fr;gap:18px;padding:38px 18px}.coaching72-title-block{grid-column:auto}.coaching72-vs{width:58px;height:58px}.coaching72-compare{min-height:0;padding-bottom:68px}.coaching72-compare-premium{padding-top:0}.coaching72-botanical,.coaching72-scenic{opacity:.25}.coaching72-architecture-inner{padding:34px 18px 24px}.coaching72-steps{grid-template-columns:repeat(2,1fr)}.coaching72-value-band{grid-template-columns:1fr;text-align:center}.coaching72-value-copy{border-left:0;border-top:1px solid rgba(230,198,110,.35);padding:12px 0 0}.coaching72-cta{justify-self:stretch}.coaching72-value-mark{display:none}
      }
      @media(max-width:540px){
        .coaching72-title-block h2{font-size:47px}.coaching72-title-block p{font-size:16px}.coaching72-steps{grid-template-columns:1fr}.coaching72-architecture h2{font-size:34px}.coaching72-steps article{min-height:205px}.coaching72-compare h3{font-size:23px}.coaching72-compare li{font-size:14px}.coaching72-premium-head h3{font-size:23px}.coaching72-value-title strong{font-size:21px}
      }
    `;
    document.head.appendChild(style);
  }

  // Build 72 approved wording tweak on the Founders page only.
  document.querySelectorAll('.fun-fact-row strong').forEach((label) => {
    if (label.textContent.trim() === 'Favorite way to move') label.textContent = 'Favorite way to be active';
  });
})();
