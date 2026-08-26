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
    kicker:'ATHLETIC QUADRANT',
    title:'Move dynamically without pain',
    description:'The Athletic quadrant helps you build a body that can move, recover, and perform with greater confidence. It focuses on the habits that help you stay active, capable, and resilient.',
    items:['Functional Training','Holistic Recovery','Thriving Diet'],
    caption:'Focus areas include Functional Training, Holistic Recovery, and a Thriving Diet.',
    spinTarget:0,
    focus:'assets/images/matrix-focus-athletic.png',
    alt:'Athletic quadrant detail from the ReVitalized Longevity Matrix'
  },
  refined:{
    theme:'refined',
    kicker:'REFINED QUADRANT',
    title:'Be impressed with your reflection',
    description:'The Refined quadrant is centered on confidence, balance, and restoration. It highlights the systems that support body composition, hormone balance, and a stronger sense of well-being.',
    items:['Gut Renovation','Hormone Balancing','Neural Repatterning'],
    caption:'Focus areas include Gut Renovation, Hormone Balancing, and Neural Repatterning.',
    spinTarget:270,
    focus:'assets/images/matrix-focus-refined.png',
    alt:'Refined quadrant detail from the ReVitalized Longevity Matrix'
  },
  organized:{
    theme:'organized',
    kicker:'ORGANIZED QUADRANT',
    title:'Living healthy is easy and fun',
    description:'The Organized quadrant helps turn healthy living into something practical and sustainable. It brings more clarity, momentum, and structure to the habits that support long-term progress.',
    items:['Wise Budgeting','Mentality Realignment','Momentum Regimens'],
    caption:'Focus areas include Wise Budgeting, Mentality Realignment, and Momentum Regimens.',
    spinTarget:180,
    focus:'assets/images/matrix-focus-organized.png',
    alt:'Organized quadrant detail from the ReVitalized Longevity Matrix'
  },
  energized:{
    theme:'energized',
    kicker:'ENERGIZED QUADRANT',
    title:'Feel good everyday',
    description:'The Energized quadrant focuses on restoring energy, helping the body clear what is not serving it, and building the daily foundations that help you feel better and function better.',
    items:['Quantum Habits','Systemic Detoxification','Cellular Hydration'],
    caption:'Focus areas include Quantum Habits, Systemic Detoxification, and Cellular Hydration.',
    spinTarget:90,
    focus:'assets/images/matrix-focus-energized.png',
    alt:'Energized quadrant detail from the ReVitalized Longevity Matrix'
  }
};

const matrixNodes=document.querySelectorAll('.matrix-node[data-matrix-target]');
if(matrixNodes.length){
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
    detailCard.className=`matrix-detail-card theme-${data.theme}`;
    figure.className=`matrix-detail-figure theme-${data.theme}`;
    kicker.textContent=data.kicker;
    title.textContent=data.title;
    description.textContent=data.description;
    list.innerHTML=data.items.map((item,index)=>`<li data-index="0${index+1}">${item}</li>`).join('');
    caption.textContent=data.caption;
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

  const applyMatrixState=(key,node,{animate=true}={})=>{
    const data=matrixData[key];
    if(!data) return;
    matrixNodes.forEach((btn)=>{btn.classList.remove('active');btn.setAttribute('aria-selected','false');});
    if(node){node.classList.add('active');node.setAttribute('aria-selected','true');}
    setCopy(data);

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
    if(delta<30) delta+=360;
    currentSpin+=delta;

    viewport.classList.add('is-spinning');
    focusLayer.classList.remove('is-visible');
    spinLayer.classList.add('is-visible');
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>spinWheel.style.setProperty('--spin',`${currentSpin}deg`));
    });
    settleTimer=window.setTimeout(()=>settleOnFocus(data),960);
  };

  matrixNodes.forEach((node)=>node.addEventListener('click',()=>applyMatrixState(node.dataset.matrixTarget,node)));
  const initial=[...matrixNodes].find((node)=>node.classList.contains('active')) || matrixNodes[0];
  if(initial) applyMatrixState(initial.dataset.matrixTarget,initial,{animate:false});
}
