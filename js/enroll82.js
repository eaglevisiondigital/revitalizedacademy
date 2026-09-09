// BUILD 82 — package selection + enrollment handoff. No assessment logic is touched.
(() => {
  const programSelect = document.getElementById('program');
  const selectedName = document.getElementById('selected-program-name');
  const selectedDetails = document.getElementById('selected-program-details');
  const enrollment = document.getElementById('enrollment');
  const firstName = document.getElementById('first');
  if (!programSelect || !selectedName || !selectedDetails || !enrollment) return;

  const programs = {
    'holistic-foundations': {name:'Holistic Foundations', details:'$25/week • Family membership • Up to 5 profiles'},
    'vitality-accelerator-cohort': {name:'Vitality Accelerator Cohort', details:'$1,000 • 40-day cohort • Group coaching'},
    'vitality-accelerator': {name:'Vitality Accelerator', details:'$2,000 • 40 days • Private + group coaching'},
    'total-wellness-6': {name:'Total Wellness Intensive — 6-Month', details:'$7,500 • 6 months • Personalized intensive coaching'},
    'total-wellness-12': {name:'Total Wellness Intensive — 12-Month', details:'$30,000 • 12 months • Private coaching with Justyn & Elle'}
  };

  const cards = [...document.querySelectorAll('[data-program-card]')];
  const buttons = [...document.querySelectorAll('[data-select-program]')];

  function paintSelection(key, {scroll=false, focus=false} = {}) {
    const program = programs[key];
    programSelect.value = program ? key : '';
    cards.forEach(card => card.classList.toggle('is-selected', card.dataset.programCard === key));

    if (program) {
      selectedName.textContent = program.name;
      selectedDetails.textContent = program.details;
      const selectedBox = document.getElementById('selected-program-card');
      if (selectedBox) {
        selectedBox.classList.remove('enroll82-card-flash');
        void selectedBox.offsetWidth;
        selectedBox.classList.add('enroll82-card-flash');
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('program', key);
        history.replaceState({}, '', url);
      } catch (_) {}
    } else {
      selectedName.textContent = 'Choose a package above';
      selectedDetails.textContent = 'Your selection will appear here.';
    }

    if (scroll) enrollment.scrollIntoView({behavior:'smooth', block:'start'});
    if (focus && firstName) window.setTimeout(() => firstName.focus({preventScroll:true}), 650);
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => paintSelection(button.dataset.selectProgram, {scroll:true, focus:true}));
  });

  programSelect.addEventListener('change', () => paintSelection(programSelect.value));

  const initial = new URLSearchParams(window.location.search).get('program');
  if (initial && programs[initial]) paintSelection(initial);
})();
