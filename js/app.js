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
    rotation:'0deg',
    x:0,
    y:145
  },
  refined:{
    theme:'refined',
    kicker:'REFINED QUADRANT',
    title:'Be impressed with your reflection',
    description:'The Refined quadrant is centered on confidence, balance, and restoration. It highlights the systems that support body composition, hormone balance, and a stronger sense of well-being.',
    items:['Gut Renovation','Hormone Balancing','Neural Repatterning'],
    caption:'Focus areas include Gut Renovation, Hormone Balancing, and Neural Repatterning.',
    rotation:'-90deg',
    x:0,
    y:218
  },
  organized:{
    theme:'organized',
    kicker:'ORGANIZED QUADRANT',
    title:'Living healthy is easy and fun',
    description:'The Organized quadrant helps turn healthy living into something practical and sustainable. It brings more clarity, momentum, and structure to the habits that support long-term progress.',
    items:['Wise Budgeting','Mentality Realignment','Momentum Regimens'],
    caption:'Focus areas include Wise Budgeting, Mentality Realignment, and Momentum Regimens.',
    rotation:'0deg',
    x:0,
    y:-145
  },
  energized:{
    theme:'energized',
    kicker:'ENERGIZED QUADRANT',
    title:'Feel good everyday',
    description:'The Energized quadrant focuses on restoring energy, helping the body clear what is not serving it, and building the daily foundations that help you feel better and function better.',
    items:['Quantum Habits','Systemic Detoxification','Cellular Hydration'],
    caption:'Focus areas include Quantum Habits, Systemic Detoxification, and Cellular Hydration.',
    rotation:'90deg',
    x:0,
    y:218
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
  const rotationImage=document.getElementById('matrix-rotation-image');

  const applyMatrixState=(key,node)=>{
    const data=matrixData[key];
    if(!data) return;
    matrixNodes.forEach((btn)=>{btn.classList.remove('active');btn.setAttribute('aria-selected','false');});
    if(node){
      node.classList.add('active');
      node.setAttribute('aria-selected','true');
    }
    detailCard.classList.add('is-changing');
    window.setTimeout(()=>{
      detailCard.className=`matrix-detail-card theme-${data.theme}`;
      figure.className=`matrix-detail-figure theme-${data.theme}`;
      kicker.textContent=data.kicker;
      title.textContent=data.title;
      description.textContent=data.description;
      list.innerHTML=data.items.map((item,index)=>`<li data-index="0${index+1}">${item}</li>`).join('');
      caption.textContent=data.caption;
      rotationImage.style.setProperty('--mx',`${data.x}px`);
      rotationImage.style.setProperty('--my',`${data.y}px`);
      rotationImage.style.setProperty('--rot',data.rotation);
    },120);
  };

  matrixNodes.forEach((node)=>{
    node.addEventListener('click',()=>applyMatrixState(node.dataset.matrixTarget,node));
  });

  const initial=[...matrixNodes].find((node)=>node.classList.contains('active')) || matrixNodes[0];
  if(initial){
    applyMatrixState(initial.dataset.matrixTarget,initial);
  }
}
