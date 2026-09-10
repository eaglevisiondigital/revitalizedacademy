/* Build 94 Step 2 Health Profile engine — no Free Vitality Assessment question bank. */
(() => {
  'use strict';
  const SECTIONS=window.RVAHealthProfile91Sections||[];
  const form = document.querySelector('[data-health91-form]');
  const stage = document.querySelector('[data-health91-stage]');
  const back = document.querySelector('[data-health91-back]');
  const next = document.querySelector('[data-health91-next]');
  const label = document.querySelector('[data-health91-section-label]');
  const counter = document.querySelector('[data-health91-counter]');
  const bar = document.querySelector('[data-health91-bar]');
  const status = document.querySelector('[data-health91-status]');
  const personPill = document.querySelector('[data-health91-person-pill]');
  const contextNote = document.querySelector('[data-health91-context-note]');
  const recovery = document.querySelector('[data-health91-recovery]');
  const complete = document.querySelector('[data-health91-complete]');
  const jsonField = document.querySelector('[name="health_profile_json"]');
  const versionField = document.querySelector('[name="health_profile_question_set"]');
  if (!form || !stage) return;

  let context = null;
  try { const raw = sessionStorage.getItem('ra_enrollment_context_v2'); if (raw) context = JSON.parse(raw); } catch (_) {}
  if (!context || !context.full_name || !context.email || !context.enrollment_for) {
    form.hidden = true;
    if (recovery) recovery.hidden = false;
    return;
  }

  const esc = (v) => String(v ?? '').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const gender = String(context.gender || '').toLowerCase();
  const visibleFor = (item) => !item.condition || item.condition === gender;
  const renderScale = (item, min, max) => `<div class="health91-scale" role="group" aria-label="${esc(item.label)}">${Array.from({length:max-min+1},(_,i)=>{const n=min+i;return `<label><input type="radio" name="${esc(item.id)}" value="${n}"><span>${n}</span></label>`}).join('')}</div>`;
  const renderItem = (item, ordinal) => {
    if (!visibleFor(item)) return '';
    let control='';
    if (item.type === 'date') control=`<input class="health91-input" type="date" name="${esc(item.id)}">`;
    else if (item.type === 'scale10') control=renderScale(item,1,10);
    else if (String(item.type).startsWith('scale:')) {const [,a,b]=item.type.split(':');control=renderScale(item,Number(a),Number(b));}
    else control=`<textarea class="health91-textarea" name="${esc(item.id)}" rows="4" placeholder="Type your answer here..."></textarea>`;
    return `<div class="health91-question" data-question-id="${esc(item.id)}"><div class="health91-question-number">${ordinal}</div><div class="health91-question-main"><label>${esc(item.label)}</label>${item.help?`<p class="health91-help">${esc(item.help)}</p>`:''}${control}</div></div>`;
  };

  let current=0;
  const answers={};
  const saveCurrent = () => {
    const section=SECTIONS[current];
    section.items.filter(visibleFor).forEach(item=>{
      const els=[...form.querySelectorAll(`[name="${CSS.escape(item.id)}"]`)];
      if(!els.length)return;
      if(els[0].type==='radio'){const chosen=els.find(x=>x.checked);answers[item.id]=chosen?chosen.value:'';}
      else answers[item.id]=els[0].value||'';
    });
  };
  const restoreCurrent = () => {
    const section=SECTIONS[current];
    section.items.filter(visibleFor).forEach(item=>{
      const value=answers[item.id]; if(value==null||value==='')return;
      const els=[...form.querySelectorAll(`[name="${CSS.escape(item.id)}"]`)];
      if(!els.length)return;
      if(els[0].type==='radio'){const chosen=els.find(x=>x.value===String(value)); if(chosen) chosen.checked=true;}
      else els[0].value=value;
    });
  };
  const render = () => {
    const section=SECTIONS[current];
    const items=section.items.filter(visibleFor);
    stage.innerHTML=`<header class="health91-section-head"><span>${esc(section.kicker)}</span><h2>${esc(section.title)}</h2>${section.description?`<p>${esc(section.description)}</p>`:''}</header><div class="health91-questions">${items.map((q,i)=>renderItem(q,i+1)).join('')}</div>`;
    if (label) label.textContent=section.title;
    if (counter) counter.textContent=`${current+1} of ${SECTIONS.length}`;
    if (bar) bar.style.width=`${Math.round(((current+1)/SECTIONS.length)*100)}%`;
    if (back) back.disabled=current===0;
    if (next) next.innerHTML=current===SECTIONS.length-1?'Submit Health Profile <span aria-hidden="true">→</span>':'Save on this page & Continue <span aria-hidden="true">→</span>';
    restoreCurrent();
    if (status) {status.textContent='';status.className='health91-status';}
    window.scrollTo({top:Math.max(0,stage.getBoundingClientRect().top+window.scrollY-160),behavior:'smooth'});
  };

  const collect = () => { saveCurrent(); return {...answers}; };

  const hydrateContext = () => {
    const fields={enrollment_session_id:context.enrollment_session_id||'',enrollment_for:context.enrollment_for||'',full_name:context.full_name||'',email:context.email||'',phone:context.phone||'',age:context.age||'',gender:context.gender||'',program_interest:context.program_interest||'',selected_plan_code:context.selected_plan_code||'',start_timeline:context.start_timeline||'',completed_by_name:context.completed_by_name||''};
    Object.entries(fields).forEach(([name,value])=>{const el=form.elements.namedItem(name);if(el)el.value=value;});
    if(versionField)versionField.value='platform-build-checklist-mk4-step2-v1';
    if(personPill)personPill.textContent=`Health profile for ${context.full_name}`;
    if(contextNote){
      if(context.enrollment_for==='spouse') contextNote.innerHTML=`<strong>Continuing ${esc(context.full_name)}’s profile.</strong> The adult being enrolled should answer these questions personally whenever possible. If they need help navigating the form, you may assist with their permission.`;
      else if(context.enrollment_for==='child') contextNote.innerHTML=`<strong>Continuing ${esc(context.full_name)}’s profile.</strong> A parent or guardian may assist. Answer based on the person being enrolled; where a question does not apply, you may leave it blank.`;
      else contextNote.innerHTML=`<strong>Step 1 is saved.</strong> We already have your basic enrollment information, so you can continue directly into the deeper profile.`;
    }
  };

  back?.addEventListener('click',()=>{if(current>0){saveCurrent();current--;render();}});
  next?.addEventListener('click',async()=>{
    if(current<SECTIONS.length-1){saveCurrent();current++;render();return;}
    if(jsonField)jsonField.value=JSON.stringify({question_set:'platform-build-checklist-mk4-step2-v1',source:'RVA Platform Build Checklist MK4(1)',answers:collect()});
    if(next) next.disabled=true;
    if(status){status.textContent='Submitting your health profile…';status.className='health91-status is-working';}
    try{
      const body=new URLSearchParams(new FormData(form)).toString();
      const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
      if(!response.ok)throw new Error('submit failed');
      try {
        sessionStorage.setItem('ra_health_profile_complete_v1', JSON.stringify({completed:true,enrollment_session_id:context.enrollment_session_id||'',completed_at:new Date().toISOString()}));
      } catch (_) {}
      form.hidden=true;
      if(complete)complete.hidden=false;
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){
      if(next)next.disabled=false;
      if(status){status.textContent='We could not submit that just now. Your answers are still on this page; please try again.';status.className='health91-status is-error';}
    }
  });

  hydrateContext();
  render();
})();
