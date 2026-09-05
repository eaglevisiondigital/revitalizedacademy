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


// Build 73 — complete coaching-section replacement.
// This removes both previous coaching blocks from the DOM and rebuilds them as one cohesive,
// responsive layered section. It intentionally does not touch the Build 71 Vitality Assessment
// or any disclaimer/legal elements.
(() => {
  const oldDifference = document.querySelector('#coaching.difference-section, #coaching.coaching72, #coaching.coaching73');
  let oldArchitecture = null;

  if (oldDifference) {
    const next = oldDifference.nextElementSibling;
    if (next && (next.classList.contains('coaching-premium') || next.classList.contains('founders-section'))) {
      oldArchitecture = next;
    }
  }

  if (oldDifference) {
    const section = document.createElement('section');
    section.className = 'coaching73';
    section.id = 'coaching';
    section.setAttribute('aria-labelledby', 'coaching73-title');

    section.innerHTML = `
      <div class="coaching73-layer coaching73-leaf-left" aria-hidden="true"></div>
      <div class="coaching73-layer coaching73-leaf-right" aria-hidden="true"></div>
      <div class="coaching73-layer coaching73-rings" aria-hidden="true"></div>

      <div class="coaching73-shell">
        <div class="coaching73-top">
          <div class="coaching73-title-block">
            <span class="coaching73-overline">A HEALTHIER TOMORROW<br>STARTS WITH A DIFFERENT APPROACH</span>
            <h2 id="coaching73-title">Why<br>ReVitalized<br>Is Different</h2>
            <span class="coaching73-rule"></span>
            <p>The challenge is not finding more information. It is knowing what matters, what fits, and what to do next.</p>
            <em>Clarity changes everything.</em>
          </div>

          <article class="coaching73-compare coaching73-muted">
            <div class="coaching73-compare-title">
              <span class="coaching73-info">i</span>
              <h3>Most Health Advice</h3>
            </div>
            <ul>
              <li>One-size-fits-all plans</li>
              <li>Focus on isolated symptoms</li>
              <li>Short-term thinking</li>
              <li>Conflicting &amp; confusing information</li>
              <li>Leaves you guessing what to do next</li>
            </ul>
            <div class="coaching73-card-footer">More information. Less clarity.</div>
          </article>

          <div class="coaching73-vs" aria-hidden="true">VS.</div>

          <article class="coaching73-compare coaching73-premium">
            <div class="coaching73-premium-head">
              <span class="coaching73-medallion">☆</span>
              <div>
                <h3>ReVitalized Coaching</h3>
                <small>REAL GUIDANCE. A BRIGHTER TOMORROW.</small>
              </div>
            </div>
            <ul>
              <li>Personalized roadmap</li>
              <li>Whole-picture perspective</li>
              <li>Long-term lifestyle transformation</li>
              <li>Clear priorities and practical application</li>
              <li>Education, support &amp; accountability</li>
            </ul>
            <div class="coaching73-card-footer">Real guidance. A healthier, longer you.</div>
          </article>

          <div class="coaching73-scenic" aria-hidden="true">
            <div class="coaching73-scenic-label">
              <span>BETTER</span><span>INFORMATION</span><span>BRIGHTER</span><span>TOMORROWS</span><b></b>
            </div>
            <div class="coaching73-mountain m1"></div>
            <div class="coaching73-mountain m2"></div>
            <div class="coaching73-mountain m3"></div>
          </div>
        </div>

        <div class="coaching73-middle">
          <div class="coaching73-label"><span></span><b>PERSONAL APPLICATION</b><span></span></div>
          <h2>What the ReVitalized Coaching Experience Is Built Around</h2>
          <p>Knowing more is not the same as knowing where to begin. Coaching helps evaluate the bigger picture, prioritize what matters and turn it into practical action.</p>

          <div class="coaching73-steps">
            <article>
              <span class="coaching73-step-icon">♙</span>
              <h3>Personalized<br>Starting Point</h3>
              <p>Understand where you are today and what matters most.</p>
              <i></i>
            </article>
            <article>
              <span class="coaching73-step-icon">✥</span>
              <h3>Your Longevity<br>Roadmap</h3>
              <p>Build a clearer path around your goals and lifestyle.</p>
              <i></i>
            </article>
            <article>
              <span class="coaching73-step-icon">♧</span>
              <h3>Direct Coaching<br>&amp; Support</h3>
              <p>Get guidance instead of trying to figure it all out alone.</p>
              <i></i>
            </article>
            <article>
              <span class="coaching73-step-icon">↗</span>
              <h3>Actionable<br>Strategy</h3>
              <p>Turn what you learn into practical steps you can use.</p>
              <i></i>
            </article>
            <article>
              <span class="coaching73-step-icon">✓</span>
              <h3>Accountability<br>&amp; Progress</h3>
              <p>Stay focused, adjust as needed and keep moving forward.</p>
              <i></i>
            </article>
            <article>
              <span class="coaching73-step-icon">☆</span>
              <h3>A Growing<br>Ecosystem</h3>
              <p>Start with proven coaching now and gain more resources as ReVitalized grows.</p>
              <i></i>
            </article>
          </div>
        </div>

        <div class="coaching73-value-band">
          <div class="coaching73-leaf-mark" aria-hidden="true">❧</div>
          <div class="coaching73-value-title">
            <small>MORE THAN COACHING</small>
            <strong>A Healthier, Longer You Is Within Reach</strong>
          </div>
          <div class="coaching73-value-copy">
            <strong>Personalized guidance. Practical application. A brighter tomorrow.</strong>
            <span>Take the first step toward the life you want.</span>
          </div>
          <a class="coaching73-cta journey-secondary-cta" href="enroll.html">Start Your Journey <span>→</span></a>
        </div>
      </div>
    `;

    oldDifference.replaceWith(section);
    if (oldArchitecture) oldArchitecture.remove();

    const existing = document.getElementById('coaching73-styles');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'coaching73-styles';
    style.textContent = `
      .coaching73{
        --c73-green:#063f34;
        --c73-green2:#0d5a48;
        --c73-gold:#d8a62a;
        --c73-gold2:#b67c12;
        --c73-cream:#fcf5ee;
        --c73-cream2:#fffaf4;
        --c73-ink:#17392f;
        position:relative;
        overflow:hidden;
        background:
          radial-gradient(circle at 72% 10%,rgba(216,166,42,.07),transparent 26%),
          linear-gradient(180deg,#fffaf4 0%,#fcf5ee 100%);
        border-top:1px solid rgba(216,166,42,.18);
        border-bottom:1px solid rgba(216,166,42,.18);
        isolation:isolate;
      }
      .coaching73 *{box-sizing:border-box}
      .coaching73-shell{position:relative;z-index:3;max-width:1540px;margin:0 auto;padding:34px 34px 40px}
      .coaching73-layer{position:absolute;z-index:1;pointer-events:none}
      .coaching73-rings{
        inset:0;
        background:
          radial-gradient(ellipse 95% 43% at 50% 54%,transparent 66%,rgba(216,166,42,.17) 66.2%,transparent 66.6%),
          radial-gradient(ellipse 110% 52% at 50% 61%,transparent 69%,rgba(216,166,42,.10) 69.2%,transparent 69.6%);
        opacity:.95;
      }
      .coaching73-leaf-left,.coaching73-leaf-right{
        width:180px;height:610px;top:28px;opacity:.55;filter:saturate(.82);
        background:
          radial-gradient(ellipse at 38% 7%,#325c3c 0 10%,transparent 11%),
          radial-gradient(ellipse at 70% 17%,#3f7048 0 11%,transparent 12%),
          radial-gradient(ellipse at 33% 29%,#547b51 0 12%,transparent 13%),
          radial-gradient(ellipse at 72% 42%,#386746 0 11%,transparent 12%),
          radial-gradient(ellipse at 38% 55%,#527853 0 12%,transparent 13%),
          radial-gradient(ellipse at 72% 68%,#365f42 0 10%,transparent 11%),
          radial-gradient(ellipse at 40% 82%,#4b704c 0 10%,transparent 11%),
          linear-gradient(85deg,transparent 48%,rgba(88,100,53,.5) 49% 51%,transparent 52%);
      }
      .coaching73-leaf-left{left:-72px;transform:rotate(-8deg)}
      .coaching73-leaf-right{right:-68px;top:430px;transform:scaleX(-1) rotate(-4deg)}

      .coaching73-top{
        position:relative;
        display:grid;
        grid-template-columns:1.08fr 1.16fr 74px 1.42fr .34fr;
        gap:24px;
        align-items:center;
        min-height:420px;
        border-radius:38px 38px 0 0;
      }
      .coaching73-title-block{padding:12px 8px 0 38px;position:relative;z-index:3}
      .coaching73-overline{
        display:block;
        font-size:10px;
        line-height:1.45;
        letter-spacing:.29em;
        font-weight:900;
        color:#4f6a60;
        margin-bottom:16px;
      }
      .coaching73-title-block h2{
        font-family:Georgia,"Times New Roman",serif;
        color:var(--c73-green);
        font-size:clamp(56px,4.5vw,78px);
        line-height:.83;
        letter-spacing:-.035em;
        margin:0;
      }
      .coaching73-rule{display:block;width:76px;height:2px;background:linear-gradient(90deg,var(--c73-gold),rgba(216,166,42,.12));margin:22px 0 20px}
      .coaching73-title-block p{max-width:360px;margin:0;font-size:17px;line-height:1.48;color:#29473d}
      .coaching73-title-block em{display:block;margin-top:18px;font-family:Georgia,"Times New Roman",serif;font-size:24px;color:#ad7613}

      .coaching73-compare{
        position:relative;
        min-height:326px;
        border-radius:22px;
        overflow:hidden;
        background:rgba(255,255,255,.90);
        border:1px solid rgba(112,108,95,.18);
        box-shadow:0 20px 42px rgba(44,42,34,.10);
        padding:24px 28px 66px;
      }
      .coaching73-compare-title{display:flex;align-items:center;gap:13px;margin-bottom:18px}
      .coaching73-compare-title h3,.coaching73-premium-head h3{
        margin:0;
        font-family:Georgia,"Times New Roman",serif;
        font-size:26px;
        line-height:1.04;
        color:#18352d;
      }
      .coaching73-info{
        width:35px;height:35px;border-radius:50%;display:grid;place-items:center;
        border:1px solid #c7cbc6;background:#fbfbf9;color:#59645f;font-weight:900;
      }
      .coaching73-compare ul{list-style:none;padding:0;margin:0}
      .coaching73-compare li{position:relative;padding-left:38px;margin:11px 0;font-size:15.5px;color:#304b42}
      .coaching73-muted li:before{
        content:"×";position:absolute;left:0;top:-1px;width:24px;height:24px;border-radius:50%;
        display:grid;place-items:center;background:#919795;color:white;font-weight:900;
      }
      .coaching73-card-footer{
        position:absolute;left:0;right:0;bottom:0;padding:16px 18px;text-align:center;
        font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:17px;
        background:linear-gradient(180deg,rgba(239,238,232,.72),#e9e6df);color:#67716c;
      }
      .coaching73-vs{
        width:68px;height:68px;border-radius:50%;display:grid;place-items:center;justify-self:center;
        background:#fff;border:2px solid var(--c73-gold);
        box-shadow:0 0 0 8px rgba(255,255,255,.78),0 12px 28px rgba(88,67,27,.12);
        color:var(--c73-green);font-size:20px;font-weight:900;z-index:5;
      }
      .coaching73-premium{
        padding:0 28px 66px;
        border:2px solid #b88417;
        box-shadow:0 22px 46px rgba(38,54,45,.12),0 0 0 4px rgba(216,166,42,.06);
      }
      .coaching73-premium-head{
        margin:0 -28px 16px;padding:17px 23px;display:flex;align-items:center;gap:14px;
        background:linear-gradient(100deg,#064a3b,#0b604b);
      }
      .coaching73-premium-head h3{color:#fff}
      .coaching73-premium-head small{display:block;margin-top:3px;font-size:9px;letter-spacing:.18em;font-weight:900;color:#f2d27a}
      .coaching73-medallion{
        width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none;
        color:#fff;font-size:22px;background:linear-gradient(180deg,#e4b943,#a56d0c);
        border:2px solid #f6d578;box-shadow:0 7px 15px rgba(0,0,0,.18);
      }
      .coaching73-premium li:before{
        content:"✓";position:absolute;left:0;top:-1px;width:24px;height:24px;border-radius:50%;
        display:grid;place-items:center;background:linear-gradient(180deg,#d9aa32,#b27a14);
        color:#fff;font-size:14px;font-weight:900;
      }
      .coaching73-premium .coaching73-card-footer{
        color:#164d3e;
        background:linear-gradient(180deg,rgba(225,238,226,.82),#e5eee6);
      }

      .coaching73-scenic{
        position:relative;height:326px;align-self:center;overflow:hidden;border-radius:0 28px 28px 0;
      }
      .coaching73-scenic:before{
        content:"";position:absolute;inset:0;
        background:
          radial-gradient(circle at 70% 18%,rgba(255,240,185,.85),transparent 11%),
          linear-gradient(180deg,#edf1e5 0%,#e7eadf 48%,#cfd8c9 100%);
      }
      .coaching73-scenic-label{
        position:absolute;z-index:4;top:28px;left:10px;display:flex;flex-direction:column;gap:8px;
        font-size:9px;letter-spacing:.29em;font-weight:900;color:#4e6a60;
      }
      .coaching73-scenic-label b{display:block;width:38px;height:2px;background:var(--c73-gold);margin-top:7px}
      .coaching73-mountain{position:absolute;bottom:0;right:-10%;transform-origin:bottom right}
      .coaching73-mountain.m1{width:120%;height:58%;background:#a7b2a0;clip-path:polygon(0 100%,18% 68%,30% 76%,47% 38%,62% 72%,76% 42%,100% 100%)}
      .coaching73-mountain.m2{width:112%;height:48%;background:#768b78;clip-path:polygon(0 100%,20% 75%,36% 43%,53% 72%,68% 46%,80% 64%,100% 100%)}
      .coaching73-mountain.m3{width:105%;height:36%;background:#345846;clip-path:polygon(0 100%,12% 72%,28% 52%,44% 80%,61% 45%,74% 67%,88% 44%,100% 100%)}

      .coaching73-middle{
        position:relative;
        padding:24px 0 0;
        text-align:center;
      }
      .coaching73-label{display:flex;justify-content:center;align-items:center;gap:16px;margin:0 0 12px}
      .coaching73-label span{width:48px;height:1px;background:var(--c73-gold)}
      .coaching73-label b{
        padding:7px 14px;border-radius:999px;background:#efeee6;color:#14503e;
        font-size:11px;letter-spacing:.18em;
      }
      .coaching73-middle>h2{
        max-width:1100px;margin:0 auto 10px;
        font-family:Georgia,"Times New Roman",serif;color:var(--c73-green);
        font-size:clamp(38px,3.15vw,54px);line-height:.98;letter-spacing:-.02em;
      }
      .coaching73-middle>p{
        max-width:880px;margin:0 auto 26px;color:#54665f;font-size:15px;line-height:1.5;
      }
      .coaching73-steps{
        display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:13px;
      }
      .coaching73-steps article{
        min-height:236px;padding:17px 14px 19px;display:flex;flex-direction:column;align-items:center;
        border-radius:17px;background:linear-gradient(180deg,#fffdf9,#fcf7ef);
        border:1px solid rgba(177,136,69,.23);box-shadow:0 11px 24px rgba(36,45,38,.045);
      }
      .coaching73-step-icon{
        width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin-bottom:14px;
        background:linear-gradient(180deg,#fff,#fbf3e6);border:1px solid rgba(216,166,42,.34);
        color:#b57d12;font-size:29px;box-shadow:0 7px 16px rgba(216,166,42,.07);
      }
      .coaching73-steps h3{
        margin:0 0 10px;font-family:Georgia,"Times New Roman",serif;
        color:var(--c73-green);font-size:20px;line-height:1.05;
      }
      .coaching73-steps p{margin:0;color:#55645e;font-size:13px;line-height:1.42}
      .coaching73-steps i{width:34px;height:2px;background:var(--c73-gold);margin-top:auto}

      .coaching73-value-band{
        margin-top:18px;
        min-height:94px;
        padding:15px 22px;
        display:grid;
        grid-template-columns:58px 1.2fr 1.15fr auto;
        gap:18px;
        align-items:center;
        color:#fff;
        border-radius:17px;
        border:1px solid #c79320;
        background:
          linear-gradient(90deg,rgba(9,75,60,.96),rgba(5,73,57,.98)),
          radial-gradient(circle at 20% 50%,rgba(255,255,255,.05),transparent 25%);
        box-shadow:0 14px 28px rgba(6,72,56,.18);
      }
      .coaching73-leaf-mark{font-size:38px;color:#e3bc56;text-align:center}
      .coaching73-value-title{display:flex;flex-direction:column;gap:4px}
      .coaching73-value-title small{font-size:10px;letter-spacing:.22em;color:#e8cb75;font-weight:900}
      .coaching73-value-title strong{
        font-family:Georgia,"Times New Roman",serif;font-size:22px;line-height:1.08;
      }
      .coaching73-value-copy{
        padding-left:24px;border-left:1px solid rgba(230,198,110,.42);
        display:flex;flex-direction:column;color:rgba(255,255,255,.90);font-size:12px;
      }
      .coaching73-cta{
        min-width:225px;min-height:54px;padding:0 24px;border-radius:11px;
        display:flex;align-items:center;justify-content:center;gap:20px;
        background:linear-gradient(180deg,#f0cf6c,#d8a62a);
        border:1px solid rgba(255,228,139,.86);
        color:#153b2f;font-weight:900;
        box-shadow:0 10px 22px rgba(0,0,0,.15);
      }
      .coaching73-cta:hover{transform:translateY(-1px)}

      @media(max-width:1200px){
        .coaching73-shell{padding:30px 24px 34px}
        .coaching73-top{grid-template-columns:1fr 1fr 64px 1fr;gap:18px}
        .coaching73-title-block{grid-column:1/-1;text-align:center;padding:0 18px 12px}
        .coaching73-title-block h2 br{display:none}
        .coaching73-title-block p,.coaching73-overline{margin-left:auto;margin-right:auto}
        .coaching73-rule{margin-left:auto;margin-right:auto}
        .coaching73-scenic{display:none}
        .coaching73-steps{grid-template-columns:repeat(3,1fr)}
        .coaching73-value-band{grid-template-columns:58px 1fr 1fr}
        .coaching73-cta{grid-column:1/-1;justify-self:end}
      }

      @media(max-width:820px){
        .coaching73-shell{padding:24px 16px 28px}
        .coaching73-top{grid-template-columns:1fr;gap:18px;min-height:0}
        .coaching73-title-block{grid-column:auto;text-align:center;padding:8px 12px}
        .coaching73-title-block h2{font-size:clamp(48px,13vw,66px);line-height:.9}
        .coaching73-overline{font-size:9px}
        .coaching73-title-block p{font-size:16px}
        .coaching73-vs{width:58px;height:58px}
        .coaching73-compare{min-height:0;padding-bottom:66px}
        .coaching73-premium{padding-top:0}
        .coaching73-middle{padding-top:30px}
        .coaching73-middle>h2{font-size:clamp(34px,8.8vw,46px)}
        .coaching73-steps{grid-template-columns:repeat(2,1fr)}
        .coaching73-value-band{grid-template-columns:1fr;text-align:center;padding:20px}
        .coaching73-value-copy{border-left:0;border-top:1px solid rgba(230,198,110,.35);padding:12px 0 0}
        .coaching73-cta{grid-column:auto;justify-self:stretch}
        .coaching73-leaf-mark{display:none}
        .coaching73-leaf-left,.coaching73-leaf-right{opacity:.25}
      }

      @media(max-width:540px){
        .coaching73-shell{padding:20px 12px 24px}
        .coaching73-title-block h2{font-size:48px}
        .coaching73-title-block em{font-size:21px}
        .coaching73-compare{padding-left:22px;padding-right:22px}
        .coaching73-compare-title h3,.coaching73-premium-head h3{font-size:23px}
        .coaching73-compare li{font-size:14px}
        .coaching73-steps{grid-template-columns:1fr}
        .coaching73-steps article{min-height:205px}
        .coaching73-middle>p{font-size:14px}
        .coaching73-value-title strong{font-size:20px}
      }
    `;
    document.head.appendChild(style);
  }

  // Approved wording tweak on the Founders page.
  document.querySelectorAll('.fun-fact-row strong').forEach((label) => {
    if (label.textContent.trim() === 'Favorite way to move') {
      label.textContent = 'Favorite way to be active';
    }
  });
})();
