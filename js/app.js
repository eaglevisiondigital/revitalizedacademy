const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));}

// Inline YouTube playback: keep visitors on the ReVitalized page and lazy-load players only when clicked.
document.querySelectorAll('.video-embed[data-youtube-id]').forEach((wrap)=>{
  const button=wrap.querySelector('.video-poster');
  if(!button) return;
  button.addEventListener('click',()=>{
    const id=wrap.dataset.youtubeId;
    const title=wrap.dataset.title || 'ReVitalized Academy video';
    const iframe=document.createElement('iframe');
    iframe.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title=title;
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen=true;
    wrap.innerHTML='';
    wrap.appendChild(iframe);
  });
});

const matrixData={
  athletic:{
    theme:'athletic',
    kicker:'ATHLETIC FOCUS',
    title:'Move dynamically without pain',
    description:'The Athletic focus helps you build a body that can move, recover, and perform with greater confidence. It highlights the daily inputs that keep you active, resilient, and capable for the long haul.',
    items:['Functional Training','Holistic Recovery','Thriving Diet'],
    caption:'Key focus areas include Functional Training, Holistic Recovery, and a Thriving Diet.',
    spinTarget:0,
    focus:'assets/images/matrix-focus-athletic.png',
    alt:'Athletic focus detail from the ReVitalized Longevity Matrix'
  },
  refined:{
    theme:'refined',
    kicker:'REFINED FOCUS',
    title:'Be impressed with your reflection',
    description:'The Refined focus is centered on confidence, balance, and restoration. It emphasizes the systems that support body composition, hormone balance, gut restoration, and a stronger sense of well-being.',
    items:['Gut Renovation','Hormone Balancing','Neural Repatterning'],
    caption:'Key focus areas include Gut Renovation, Hormone Balancing, and Neural Repatterning.',
    spinTarget:270,
    focus:'assets/images/matrix-focus-refined.png',
    alt:'Refined focus detail from the ReVitalized Longevity Matrix'
  },
  organized:{
    theme:'organized',
    kicker:'ORGANIZED FOCUS',
    title:'Living healthy is easy and fun',
    description:'The Organized focus helps turn healthy living into something practical and sustainable. It adds clarity, momentum, and structure to the habits that make long-term progress easier to maintain.',
    items:['Wise Budgeting','Mentality Realignment','Momentum Regimens'],
    caption:'Key focus areas include Wise Budgeting, Mentality Realignment, and Momentum Regimens.',
    spinTarget:180,
    focus:'assets/images/matrix-focus-organized.png',
    alt:'Organized focus detail from the ReVitalized Longevity Matrix'
  },
  energized:{
    theme:'energized',
    kicker:'ENERGIZED FOCUS',
    title:'Feel good everyday',
    description:'The Energized focus is about restoring energy, helping the body clear what is not serving it, and building the foundational rhythms that help you feel better and function better each day.',
    items:['Quantum Habits','Systemic Detoxification','Cellular Hydration'],
    caption:'Key focus areas include Quantum Habits, Systemic Detoxification, and Cellular Hydration.',
    spinTarget:90,
    focus:'assets/images/matrix-focus-energized.png',
    alt:'Energized focus detail from the ReVitalized Longevity Matrix'
  }
};

const matrixNodes=document.querySelectorAll('.matrix-node[data-matrix-target]');
if(matrixNodes.length){
  const modal=document.getElementById('matrix-modal');
  const detailCard=document.getElementById('matrix-detail-card');
  const kicker=document.getElementById('matrix-detail-kicker');
  const title=document.getElementById('matrix-detail-title');
  const description=document.getElementById('matrix-detail-description');
  const list=document.getElementById('matrix-detail-list');
  const caption=document.getElementById('matrix-detail-caption');
  const figure=document.getElementById('matrix-detail-figure');
  const viewport=document.querySelector('.matrix-spin-viewport');
  const spinLayer=document.getElementById('matrix-spin-layer');
  const focusLayer=document.getElementById('matrix-focus-layer');
  const spinWheel=document.getElementById('matrix-spin-wheel');
  const focusImage=document.getElementById('matrix-focus-image');
  let currentSpin=0;
  let settleTimer=null;

  const setCopy=(data)=>{
    detailCard.className=`matrix-detail-card matrix-detail-modal theme-${data.theme}`;
    figure.className=`matrix-detail-figure theme-${data.theme}`;
    kicker.textContent=data.kicker;
    title.textContent=data.title;
    description.textContent=data.description;
    list.innerHTML=data.items.map((item,index)=>`<li><span class="matrix-detail-index">0${index+1}</span><span class="matrix-detail-item-text">${item}</span></li>`).join('');
    caption.textContent=data.caption;
  };

  const openModal=()=>{
    if(!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('matrix-modal-open');
  };

  const closeModal=()=>{
    if(!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('matrix-modal-open');
  };

  const settleOnFocus=(data)=>{
    focusImage.src=data.focus;
    focusImage.alt=data.alt;
    focusLayer.classList.add('is-visible');
    window.setTimeout(()=>{
      spinLayer.classList.remove('is-visible');
      viewport.classList.remove('is-spinning');
    },160);
  };

  const applyMatrixState=(key,node,{animate=true,open=false}={})=>{
    const data=matrixData[key];
    if(!data) return;
    matrixNodes.forEach((btn)=>{btn.classList.remove('active');btn.setAttribute('aria-selected','false');});
    if(node){node.classList.add('active');node.setAttribute('aria-selected','true');}
    setCopy(data);
    if(open) openModal();

    if(settleTimer){window.clearTimeout(settleTimer);settleTimer=null;}
    if(!animate){
      currentSpin=data.spinTarget;
      spinWheel.style.setProperty('--spin',`${currentSpin}deg`);
      focusImage.src=data.focus;
      focusImage.alt=data.alt;
      focusLayer.classList.add('is-visible');
      spinLayer.classList.remove('is-visible');
      return;
    }

    const currentMod=((currentSpin%360)+360)%360;
    let delta=(data.spinTarget-currentMod+360)%360;
    if(delta<45) delta+=360;
    currentSpin+=delta;

    viewport.classList.add('is-spinning');
    focusLayer.classList.remove('is-visible');
    spinLayer.classList.add('is-visible');
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>spinWheel.style.setProperty('--spin',`${currentSpin}deg`));
    });
    settleTimer=window.setTimeout(()=>settleOnFocus(data),980);
  };

  matrixNodes.forEach((node)=>node.addEventListener('click',()=>applyMatrixState(node.dataset.matrixTarget,node,{open:true})));
  if(modal){
    modal.querySelectorAll('[data-matrix-close]').forEach((el)=>el.addEventListener('click',closeModal));
    modal.addEventListener('click',(event)=>{
      if(event.target===modal) closeModal();
    });
    document.addEventListener('keydown',(event)=>{
      if(event.key==='Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }
  const initial=[...matrixNodes].find((node)=>node.classList.contains('active')) || matrixNodes[0];
  if(initial) applyMatrixState(initial.dataset.matrixTarget,initial,{animate:false,open:false});
}
