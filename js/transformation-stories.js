(() => {
  const featuredRoot = document.getElementById('transformation-featured-story');
  const companionRoot = document.getElementById('transformation-companion-story');
  const modal = document.getElementById('story-detail-modal');
  const modalContent = document.getElementById('story-detail-content');
  if (!featuredRoot || !companionRoot || !modal || !modalContent) return;
  let stories = [];
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const tags = story => story.outcomeTags.map(tag => `<span>${esc(tag)}</span>`).join('');
  const picture = story => `<picture><source srcset="${esc(story.imageWebp)}" type="image/webp"><img src="${esc(story.image)}" alt="${esc(story.name)} — ReVitalized Academy member story" loading="lazy" style="--story-pos-desktop:${esc(story.imagePositionDesktop)};--story-pos-mobile:${esc(story.imagePositionMobile)}"></picture>`;
  const featuredCard = story => `<article class="featured-editorial-card"><div class="featured-editorial-photo">${picture(story)}<div class="featured-editorial-nameplate"><span>MEMBER STORY</span><strong>${esc(story.name)}</strong></div></div><div class="featured-editorial-content"><span class="featured-editorial-label"><i></i> FEATURED TRANSFORMATION</span><h3>${esc(story.shortHeadline)}</h3><p>${esc(story.summary)}</p><div class="featured-editorial-tags">${tags(story)}</div><div class="featured-editorial-footer"><div><span>HER REPORTED EXPERIENCE</span><strong>${esc(story.reportedExperience)}</strong></div><button type="button" class="featured-editorial-button" data-story-open="${esc(story.id)}">READ ${esc(story.name).toUpperCase()}’S STORY →</button></div></div></article>`;
  const companionCard = story => `<article class="companion-editorial-card"><div class="companion-editorial-photo">${picture(story)}</div><div class="companion-editorial-copy"><span>MEMBER STORY · ${esc(story.longevityMatrixCategory.join(' + '))}</span><h3>${esc(story.shortHeadline)}</h3><div class="companion-editorial-tags">${tags(story)}</div><div class="companion-editorial-actions"><button type="button" data-story-open="${esc(story.id)}">Read Story →</button>${story.videoUrl ? `<a href="${esc(story.videoUrl)}" target="_blank" rel="noopener">Watch Story ↗</a>` : ''}</div></div></article>`;
  function openStory(id){const story=stories.find(x=>x.id===id);if(!story)return;const matrix=story.longevityMatrixCategory.map(x=>`<span>${esc(x)}</span>`).join('');modalContent.innerHTML=`<div class="story-detail-media">${picture(story)}</div><div class="story-detail-copy"><span class="story-detail-eyebrow">MEMBER STORY</span><h2 id="story-detail-title">${esc(story.name)}</h2><h3>${esc(story.shortHeadline)}</h3>${story.startingSituation?`<div class="story-detail-block"><span>Starting situation</span><p>${esc(story.startingSituation)}</p></div>`:''}<div class="story-detail-block"><span>Reported outcomes</span><p>${esc(story.reportedExperience)}</p></div>${story.timeframe?`<div class="story-detail-block"><span>Documented timeframe</span><p>${esc(story.timeframe)}</p></div>`:''}<div class="story-detail-block"><span>Related Longevity Matrix areas</span><div class="story-detail-matrix">${matrix}</div></div><p class="story-detail-full">${esc(story.fullStory)}</p><p class="story-detail-disclosure">${esc(story.disclosure)}</p><div class="story-detail-actions">${story.videoUrl?`<a class="btn btn-secondary" href="${esc(story.videoUrl)}" target="_blank" rel="noopener">Watch Video Story</a>`:''}<a class="btn btn-primary" href="consult.html">Start Your Free Vitality Assessment</a></div></div>`;modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('story-modal-open');modal.querySelector('.story-detail-close').focus();}
  function closeStory(){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('story-modal-open');}
  fetch('assets/data/transformation-stories.json').then(r=>r.json()).then(data=>{stories=data;featuredRoot.innerHTML=featuredCard(stories.find(s=>s.featured)||stories[0]);companionRoot.innerHTML=companionCard(stories.find(s=>!s.featured)||stories[1]);}).catch(()=>featuredRoot.innerHTML='<p class="transformation-load-error">Transformation story preview could not be loaded.</p>');
  document.addEventListener('click',e=>{const opener=e.target.closest('[data-story-open]');if(opener)openStory(opener.dataset.storyOpen);if(e.target.closest('[data-story-close]'))closeStory();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))closeStory();});
})();

/* Build 89 — place program-choice CTA directly after Coaching and before Family Health.
   Kept here to avoid modifying assessment-protected sections in index.html. */
(() => {
  const coaching = document.querySelector('#coaching.ra-coaching76');
  const family = document.querySelector('#families.family-home-section');
  if (!coaching || !family || document.querySelector('.home-programs-banner89')) return;

  if (!document.querySelector('link[data-home-programs-banner89]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'css/home-programs-banner89.css?v=89';
    css.dataset.homeProgramsBanner89 = 'true';
    document.head.appendChild(css);
  }

  const section = document.createElement('section');
  section.className = 'home-programs-banner89';
  section.setAttribute('aria-labelledby','home-programs-banner89-title');
  section.innerHTML = `
    <div class="home-programs-banner89-inner">
      <div>
        <span class="home-programs-banner89-kicker">Choose your level of support</span>
        <h2 id="home-programs-banner89-title">Compare our programs and coaching options.</h2>
        <p>From flexible family access to focused 40-day coaching and high-touch private support, see the options side by side and choose the starting point that fits you best.</p>
      </div>
      <div class="home-programs-banner89-actions">
        <a class="home-programs-banner89-primary" href="plans.html">Compare Programs <span aria-hidden="true">→</span></a>
        <a class="home-programs-banner89-secondary" href="enroll.html?plan=not-sure">Help Me Choose</a>
      </div>
    </div>`;

  family.parentNode.insertBefore(section, family);
})();
