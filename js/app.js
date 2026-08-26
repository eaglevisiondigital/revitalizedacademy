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
