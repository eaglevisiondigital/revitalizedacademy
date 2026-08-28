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
    focusIcon.innerHTML = iconSvg[data.focusIcon] || '';
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
