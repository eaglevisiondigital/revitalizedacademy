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

// Inline YouTube playback: keep visitors on the ReVitalized page and lazy-load players only when clicked.
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

const matrixIcons = {
  diet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h14l-1.2 7H6.2L5 11Z"/><path d="M8 11c0-3 2-5 5-5 1.7 0 3 .5 4 1.6"/><path d="M13 6c0-2 1.1-3.4 3.3-4"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>',
  recovery: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20c4-3 7-6 7-10-3 0-5 1-7 4-2-3-4-4-7-4 0 4 3 7 7 10Z"/><path d="M12 4v10"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c8 0 13-5 14-14-9 1-14 6-14 14Z"/><path d="M6 18c3-4 6-7 10-10"/></svg>',
  drop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3S6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/></svg>',
  stomach: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4v5c0 2-1 3-3 4-2 1-2 5 1 6 4 2 9-1 10-6 .5-3-1-6-4-6-2 0-2-2-2-3"/></svg>',
  scales: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M6 7h12M5 7l-3 6h6L5 7ZM19 7l-3 6h6l-3-6ZM8 20h8"/></svg>',
  brain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5a3 3 0 0 0-5 2 3 3 0 0 0 0 5 3 3 0 0 0 3 5h2M15 5a3 3 0 0 1 5 2 3 3 0 0 1 0 5 3 3 0 0 1-3 5h-2M9 4v16M15 4v16M9 8h3M12 12h3M9 16h3"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M16 10h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></svg>',
  mindset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a7 7 0 0 0-7 7c0 3 1.5 5 3 6v4h8v-4c1.5-1 3-3 3-6a7 7 0 0 0-7-7Z"/><path d="M9 10h6M10 14h4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2"/></svg>'
};

const matrixData = {
  athletic: {
    theme: 'athletic',
    kicker: 'ATHLETIC FOCUS',
    name: 'Athletic',
    tagline: 'Move dynamically without pain',
    description:
      'The Athletic focus helps you build a body that can move, recover, and perform with greater confidence. It highlights the daily inputs that keep you active, resilient, and capable for the long haul.',
    caption: 'Open each section below to see the practical focus points that support this area.',
    focusImage: 'assets/images/matrix-focus-athletic.png',
    focusAlt: 'Athletic focus overview from the ReVitalized Longevity Matrix',
    wheelImage: 'assets/images/matrix-athletic-detail.jpg',
    wheelAlt: 'Athletic detail from the ReVitalized Longevity Matrix',
    sections: [
      {
        title: 'The Living Diet',
        icon: 'diet',
        points: ['Enhance digestive function', 'Apply holistic eating routines', 'High performance nutrition']
      },
      {
        title: 'Functional Training',
        icon: 'dumbbell',
        points: ['Maintain full-body athletic performance', 'Train to functional baseline', 'Movement rehabilitation']
      },
      {
        title: 'Holistic Recovery',
        icon: 'recovery',
        points: ['Increase breathing efficiency', 'Increase metabolic flexibility', 'Adaptability rebound']
      }
    ]
  },
  energized: {
    theme: 'energized',
    kicker: 'ENERGIZED FOCUS',
    name: 'Energized',
    tagline: 'Feel good everyday',
    description:
      'The Energized focus is about restoring energy, helping the body clear what is not serving it, and building the foundational rhythms that help you feel better and function better each day.',
    caption: 'Open each section below to see the practical focus points that support this area.',
    focusImage: 'assets/images/matrix-focus-energized.png',
    focusAlt: 'Energized focus overview from the ReVitalized Longevity Matrix',
    wheelImage: 'assets/images/matrix-energized-detail.jpg',
    wheelAlt: 'Energized detail from the ReVitalized Longevity Matrix',
    sections: [
      {
        title: 'Quantum Habits',
        icon: 'check',
        points: ['Bioelectrical charge grounding routine', 'Quantum-safe home hygiene', 'Stabilize the circadian rhythm']
      },
      {
        title: 'Detoxification',
        icon: 'leaf',
        points: ['Bind and eliminate toxins from the body', 'Target and pull toxins out of tissue', 'Open detox pathways']
      },
      {
        title: 'Cellular Hydration',
        icon: 'drop',
        points: ['Daily hydration equation', 'Rehydrate to daily baseline', 'Purify drinking water']
      }
    ]
  },
  refined: {
    theme: 'refined',
    kicker: 'REFINED FOCUS',
    name: 'Refined',
    tagline: 'Be impressed with your reflection',
    description:
      'The Refined focus is centered on confidence, balance, and restoration. It emphasizes the systems that support body composition, hormone balance, gut restoration, and a stronger sense of well-being.',
    caption: 'Open each section below to see the practical focus points that support this area.',
    focusImage: 'assets/images/matrix-focus-refined.png',
    focusAlt: 'Refined focus overview from the ReVitalized Longevity Matrix',
    wheelImage: 'assets/images/matrix-refined-detail.jpg',
    wheelAlt: 'Refined detail from the ReVitalized Longevity Matrix',
    sections: [
      {
        title: 'G.I. Renovation',
        icon: 'stomach',
        points: ['Stimulate healthy BMs everyday', 'Consistently positive bowel transit rate', 'Repopulate gut microbiome']
      },
      {
        title: 'Hormone Balancing',
        icon: 'scales',
        points: ['Calm the hormone storm', 'Practice body recomposition', 'Recalibrate endocrine system to homeostasis']
      },
      {
        title: 'Neural Repatterning',
        icon: 'brain',
        points: ['De-stress the brain', 'Balance neurochemistry', 'Strengthen neural circuits']
      }
    ]
  },
  organized: {
    theme: 'organized',
    kicker: 'ORGANIZED FOCUS',
    name: 'Organized',
    tagline: 'Living healthy is easy and fun',
    description:
      'The Organized focus helps turn healthy living into something practical and sustainable. It adds clarity, momentum, and structure to the habits that make long-term progress easier to maintain.',
    caption: 'Open each section below to see the practical focus points that support this area.',
    focusImage: 'assets/images/matrix-focus-organized.png',
    focusAlt: 'Organized focus overview from the ReVitalized Longevity Matrix',
    wheelImage: 'assets/images/matrix-organized-detail.jpg',
    wheelAlt: 'Organized detail from the ReVitalized Longevity Matrix',
    sections: [
      {
        title: 'Wise Budgeting',
        icon: 'wallet',
        points: ['Build up a healthy emergency savings', 'Create a healthy budget', 'Cut unnecessary spending']
      },
      {
        title: 'Mentality Realignment',
        icon: 'mindset',
        points: ['Learn to be a grateful whitebelt', 'Enhance your vocabulary', 'Control your environment']
      },
      {
        title: 'Momentum Regimens',
        icon: 'calendar',
        points: ['Goal focused monthly targets & standards', 'Simple weekly routines', 'Simple daily habits']
      }
    ]
  }
};

const matrixNodes = document.querySelectorAll('[data-matrix-target]');
if (matrixNodes.length) {
  const modal = document.getElementById('matrix-modal');
  const detailCard = document.getElementById('matrix-detail-card');
  const kicker = document.getElementById('matrix-detail-kicker');
  const title = document.getElementById('matrix-detail-title');
  const tagline = document.getElementById('matrix-detail-tagline');
  const description = document.getElementById('matrix-detail-description');
  const caption = document.getElementById('matrix-detail-caption');
  const focusImage = document.getElementById('matrix-focus-image');
  const wheelImage = document.getElementById('matrix-wheel-image');
  const accordionList = document.getElementById('matrix-accordion-list');

  const buildAccordions = (sections) =>
    sections
      .map(
        (section, index) => `
          <details class="matrix-accordion-item" ${index === 0 ? 'open' : ''}>
            <summary>
              <span class="matrix-accordion-icon">${matrixIcons[section.icon] || matrixIcons.check}</span>
              <span class="matrix-accordion-title">${section.title}</span>
            </summary>
            <div class="matrix-accordion-panel">
              <ul>
                ${section.points.map((point) => `<li>${point}</li>`).join('')}
              </ul>
            </div>
          </details>
        `
      )
      .join('');

  const setCopy = (data) => {
    detailCard.className = `matrix-detail-card matrix-detail-modal theme-${data.theme}`;
    kicker.textContent = data.kicker;
    title.textContent = data.name;
    tagline.textContent = data.tagline;
    description.textContent = data.description;
    caption.textContent = data.caption;
    focusImage.src = data.focusImage;
    focusImage.alt = data.focusAlt;
    wheelImage.src = data.wheelImage;
    wheelImage.alt = data.wheelAlt;
    accordionList.innerHTML = buildAccordions(data.sections);

    const accordionItems = accordionList.querySelectorAll('.matrix-accordion-item');
    accordionItems.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        accordionItems.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('matrix-modal-open');
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('matrix-modal-open');
  };

  const applyMatrixState = (key, node, { open = false } = {}) => {
    const data = matrixData[key];
    if (!data) return;

    matrixNodes.forEach((btn) => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    if (node) {
      node.classList.add('active');
      node.setAttribute('aria-selected', 'true');
    }

    setCopy(data);
    if (open) openModal();
  };

  matrixNodes.forEach((node) => {
    node.addEventListener('click', () => applyMatrixState(node.dataset.matrixTarget, node, { open: true }));
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        applyMatrixState(node.dataset.matrixTarget, node, { open: true });
      }
    });
  });

  if (modal) {
    modal.querySelectorAll('[data-matrix-close]').forEach((el) => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  const initial = [...matrixNodes].find((node) => node.classList.contains('active')) || matrixNodes[0];
  if (initial) applyMatrixState(initial.dataset.matrixTarget, initial, { open: false });
}
