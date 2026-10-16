/* Production-only, on-session founder source review; no scoring, export or delivery. */
(()=>{'use strict';
 const env=window.RVA_ENV,portal=window.RA_PORTAL,view=window.RVA_ROADMAP_VIEW,adapter=window.RVA_ROADMAP_B4,registry=window.RVA_ROADMAP_B4_SOURCE_MAP;
 if(env?.environment!=='production'||env.projectRef!=='voalfpxiyznnqfcqcymd'||location.origin!=='https://revitalizedacademy.com'||!portal?.authClient||!view||!adapter||!registry)return;
 const panel=document.getElementById('vitality-assessments-panel');if(!panel)return;
 const {node:n,drivers}=view,guard=portal.createAuthenticatedTaskGuard();
 let epoch=0,dialog=null,context=null,returnFocus=null,timer=null,checking=false,busy=false,initTask=null;
 const controllers=new Set();
 const button=(label,action)=>{const b=n('button',label);b.type='button';b.onclick=action;return b;};
 const launch=button('Founder Roadmap review · Unscored',loadQueue);launch.hidden=true;launch.dataset.roadmapFounder='launch';panel.prepend(launch);
 function close(){epoch++;guard.cancel();for(const c of controllers)c.abort();controllers.clear();clearTimeout(timer);timer=null;checking=false;busy=false;context=null;dialog?.remove();dialog=null;document.body.classList.remove('roadmap-private-open');if(portal.captureStaffSession())returnFocus?.focus();returnFocus=null;}
 function reset(){close();launch.hidden=true;panel.querySelector('[data-founder-queue]')?.remove();}
 document.addEventListener('ra:staff-access-reset',reset);
 window.addEventListener('pagehide',reset);
 window.addEventListener('pageshow',()=>{if(!dialog)initialize();});
 async function api(action,report=null,payload={},task){
  if(!guard.current(task))return null;
  const {data,error}=await portal.authClient.auth.getSession();
  if(!guard.current(task))return null;
  if(error||!data?.session?.access_token)throw Error('Fresh founder sign-in required.');
  const controller=new AbortController();controllers.add(controller);
  try{
   const r=await fetch('/.netlify/functions/roadmap-founder',{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action,report,payload}),signal:controller.signal,cache:'no-store',credentials:'same-origin'});
   if(!guard.current(task))return null;
   const result=await r.json();if(!guard.current(task))return null;
   if(!r.ok||result.unavailable)throw Error(result.conflict?'Source or draft changed. Close and reload; source changes require renewed cohort approval.':'Founder review unavailable for this account, session or approved cohort.');
   return result;
  }finally{controllers.delete(controller);}
 }
 function notice(host,text){const p=n('p',text,'roadmap-notice');p.setAttribute('role','status');host.append(p);}
 // The secure assessment list can contain dozens of cards. Keep all founder
 // feedback adjacent to its launch control, not after the entire list.
 function showFounderQueue(host){
  host.tabIndex=-1;
  launch.after(host);
  host.focus({preventScroll:true});
  host.scrollIntoView({block:'nearest'});
 }
 function failClosed(message){close();panel.querySelector('[data-founder-queue]')?.remove();const host=n('section');host.dataset.founderQueue='';notice(host,message);showFounderQueue(host);}
 async function initialize(){
  if(!portal.captureStaffSession()||portal.currentStaffRole?.()!=='owner'||!portal.hasPermission?.('health.private.view')||!portal.hasPermission?.('crm.view'))return;
  if(initTask&&guard.current(initTask))return;const task=guard.begin();initTask=task;try{const r=await api('authorize',null,{},task);if(r)launch.hidden=false;}catch{if(guard.current(task))launch.hidden=true;}
 }
 document.addEventListener('ra:permissions-loaded',initialize);initialize();
 async function loadQueue(){
  const task=guard.begin();if(!task)return;
  try{const rows=await api('list',null,{},task);if(!rows)return;panel.querySelector('[data-founder-queue]')?.remove();
   const list=n('section',undefined,'roadmap-workspace roadmap-queue');list.dataset.founderQueue='';list.append(n('h3','Explicit founder review cohort'));
   if(!rows.length)notice(list,'No submissions are approved for founder review. The cohort starts empty. A separate data-use and cohort authorization is required.');
   for(const row of rows){const card=n('article');card.append(n('strong',row.label),n('p',row.allow_drafts?'Private draft writes explicitly authorized':'Read-only source and coverage review'),button('Review approved source',()=>open(row.report_id)));list.append(card);}showFounderQueue(list);
  }catch{if(guard.current(task))failClosed('Founder review unavailable. No private source has been loaded.');}
 }
 async function open(report){
  close();returnFocus=document.activeElement;const task=guard.begin();if(!task)return;const request=epoch;
  dialog=n('div',undefined,'roadmap-dialog roadmap-print-root');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Private founder Roadmap review');dialog.tabIndex=-1;document.body.append(dialog);document.body.classList.add('roadmap-private-open');
  dialog.append(button('Close founder review',close),n('p','Loading approved source…'));dialog.focus();
  try{const c=await api('read',report,{},task);if(!c||request!==epoch)return;if(c.registry_fingerprint!==adapter.fingerprint||c.adapter_version!==adapter.version||c.provenance_state!=='version_label_only')throw Error('Pinned coverage contract mismatch. Review held.');context=c;render();scheduleCheck();}
  catch(e){if(guard.current(task)&&request===epoch)failClosed(e.message);}
 }
 function scheduleCheck(){clearTimeout(timer);if(context)timer=setTimeout(check,15000);}
 async function check(){
  if(!context||checking||busy){scheduleCheck();return;}
  if(!portal.captureStaffSession()){reset();return;}checking=true;const c=context,task=guard.begin();
  try{const r=await api('check',c.report_id,{},task);if(r&&(r.cohort_sequence!==c.cohort_sequence||r.can_edit!==c.can_edit))failClosed('Cohort approval changed. Reload the approved review.');}
  catch{if(guard.current(task))failClosed('Founder access, source or cohort changed. Private review cleared.');}
  finally{checking=false;scheduleCheck();}
 }
 window.addEventListener('focus',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
 function field(parent,label,value,multiline=true){const wrap=n('label',label),input=n(multiline?'textarea':'input');input.value=value||'';input.maxLength=multiline?6000:1000;wrap.append(input);parent.append(wrap);return input;}
 function render(){
  const c=context;if(!c||!dialog)return;dialog.replaceChildren(button('Close founder review',close));dialog.firstChild.className='roadmap-close';
  const root=n('main',undefined,'roadmap-workspace');dialog.append(root);root.append(n('h1','Founder Roadmap review'),n('p',`Private · Version ${c.version} · ${c.state.replaceAll('_',' ')}`));
  notice(root,'Unscored provisional Roadmap. Scores and stages are withheld. Approval, release and email delivery remain held. No participant answer is changed by this workspace.');
  notice(root,'Provenance: secure-snapshot-v1 label only. Pinned current reference labels do not establish the original questionnaire code revision. Missing measurements remain unknown.');
  const columns=n('div',undefined,'roadmap-source-columns'),source=n('section',undefined,'roadmap-private-source');source.append(n('h2','Read-only submitted answers'),n('p',c.source.participant_name),n('p',`Completed ${new Date(c.source.completed_at).toLocaleString()}`),n('p',`Source fingerprint ${c.source_fingerprint}`,'roadmap-footnote'));
  const dl=n('dl');for(const [id,rows]of Object.entries(c.source.answers||{})){const values=adapter.selected(rows);if(values.length)dl.append(n('dt',`${registry.fields[id]?.label||'Unmapped source question'} (${id})`),n('dd',values.join(', ')));}source.append(dl);
  if(c.source.coach_summary){const details=n('details');details.append(n('summary','Original stored summary and review flags'),n('pre',c.source.coach_summary,'roadmap-source'),n('p',c.source.coach_review_flags));source.append(details);}
  const proposal=n('section'),preview=n('section',undefined,'roadmap-preview');proposal.append(n('h2','Unscored provisional Roadmap'),preview);view.render(preview,c.document,{preview:true,privateSession:true,version:c.version});columns.append(source,proposal);root.append(columns);
  const coverage=n('section');coverage.append(n('h2','Version-pinned source coverage · All 12 Drivers'));
  for(const [key,d]of Object.entries(adapter.coverage(c.source,registry))){const box=n('details');box.append(n('summary',`${d.name} · Unscored · ${d.observations.filter(o=>o.status==='conflicting').length} conflicts`),n('p',d.missingMeasurements));if(d.budgetSeparate)box.append(n('p','Budget context is separate and never deducts from a health score.'));for(const o of d.observations){const row=n('p',`${o.label} (${o.id}) · ${o.status.replaceAll('_',' ')} · ${o.reason}`);box.append(row);}coverage.append(box);}root.append(coverage);
  if(c.draft_source_changed)notice(root,'The existing draft belongs to an older source pin. Regenerate before editing; previous versions remain immutable.');
  const form=n('form',undefined,'roadmap-editor');form.append(n('h2','Private clarification and correction proposals'));
  const summary=field(form,'Provisional overview',c.document.summary),reads=[];
  const driverEditor=n('details');driverEditor.append(n('summary','Draft all 12 Drivers · Evidence required'));
  function observation(parent,value){const s=field(parent,'Draft observation',value.summary),reason=field(parent,'Evidence rationale',value.reason),refs=field(parent,'Source question keys (comma-separated)',(value.evidence||[]).join(', '),false);s.maxLength=4000;reason.maxLength=2000;refs.maxLength=3000;return()=>({summary:s.value.trim(),reason:reason.value.trim(),evidence:refs.value.split(',').map(x=>x.trim()).filter(Boolean)});}
  for(const [key,label]of drivers){const group=n('fieldset');group.append(n('legend',label));reads.push([key,observation(group,c.document.drivers[key])]);driverEditor.append(group);}form.append(driverEditor);
  const lists={};for(const [key,title]of [['strengths','Strengths'],['priorities','Priorities'],['opportunities','Opportunities'],['actions','Starting actions']]){
   const group=n('details');group.append(n('summary',title));const entries=[];
   function add(item){if(entries.length>=(key==='actions'?12:3))return;const row=n('fieldset'),read=observation(row,item);entries.push([row,read]);row.append(button('Remove proposal',()=>{entries.splice(entries.findIndex(x=>x[0]===row),1);row.remove();}));group.append(row);}
   for(const item of c.document[key])add(item);group.append(button('Add '+title.toLowerCase(),()=>add({})));lists[key]=()=>entries.map(x=>x[1]());form.append(group);
  }
  const notes=field(form,'Private reviewer notes',c.document.reviewer_notes),clarification=field(form,'Clarification needed (not sent)',c.document.clarification);
  const corrections=n('details');corrections.append(n('summary','Propose source corrections · Original answers preserved'));const correctionReads=[];
  function addCorrection(item){if(correctionReads.length>=30)return;const group=n('fieldset'),key=field(group,'Original question key',item.question_id,false),text=field(group,'Proposed correction (unverified)',item.proposed_text),reason=field(group,'Correction reason',item.reason);key.maxLength=200;text.maxLength=2000;reason.maxLength=1000;const read=()=>({question_id:key.value.trim(),proposed_text:text.value.trim(),reason:reason.value.trim()});correctionReads.push([group,read]);group.append(button('Remove correction',()=>{correctionReads.splice(correctionReads.findIndex(x=>x[0]===group),1);group.remove();}));corrections.append(group);}
  for(const item of c.corrections)addCorrection(item);corrections.append(button('Add correction proposal',()=>addCorrection({})));form.append(corrections);
  const stateLabel=n('label','Review state'),state=n('select');for(const [v,t]of [['draft','Draft'],['needs_clarification','Needs clarification'],['under_review','Under review']]){const opt=n('option',t);opt.value=v;state.append(opt);}state.value=c.state;stateLabel.append(state);form.append(stateLabel);
  const reason=field(form,'Reason for this version','',false);reason.required=true;reason.minLength=3;
  const doc=()=>({summary:summary.value.trim(),drivers:Object.fromEntries(reads.map(([k,read])=>[k,read()])),strengths:lists.strengths(),priorities:lists.priorities(),opportunities:lists.opportunities(),actions:lists.actions(),reviewer_notes:notes.value.trim(),clarification:clarification.value.trim()});
  const toolbar=n('div',undefined,'roadmap-toolbar'),save=n('button','Save private draft version');save.type='submit';const regen=button('Regenerate unscored draft',()=>persist('regenerate'));toolbar.append(save,regen);form.append(toolbar);const feedback=n('p');feedback.setAttribute('role','status');form.append(feedback);
  let requestId,lastPayload;
  async function persist(action){
   if(!c.can_edit||busy||!form.reportValidity())return;clearTimeout(timer);busy=true;
   const payload={expected_version:c.version,action,state:state.value,reason:reason.value.trim(),document:action==='regenerate'?null:doc(),corrections:action==='regenerate'?[]:correctionReads.map(x=>x[1]())};
   const identity=JSON.stringify(payload);if(identity!==lastPayload){requestId=crypto.randomUUID();lastPayload=identity;}payload.request_id=requestId;
   save.disabled=true;regen.disabled=true;feedback.textContent='Saving an append-only private version…';const task=guard.begin();
   try{const r=await api('save',c.report_id,payload,task);if(r)await open(c.report_id);}
   catch(e){if(guard.current(task))failClosed(e.message);}finally{busy=false;if(dialog){save.disabled=false;regen.disabled=false;}scheduleCheck();}
  }
  form.onsubmit=e=>{e.preventDefault();persist('save');};root.append(form);
  const previewButton=button('Preview current unscored draft',()=>view.render(preview,doc(),{preview:true,privateSession:true,version:c.version}));root.append(previewButton);
  if(!c.can_edit){for(const el of form.querySelectorAll('input,textarea,select,button'))el.disabled=true;notice(root,'Read-only cohort approval. Persisting draft/correction proposals requires separate explicit authorization.');}
  const history=n('details');history.append(n('summary','Append-only version and audit history'));
  for(const v of c.history){history.append(n('p',`Version ${v.version} · ${v.state} · ${v.reason} · ${new Date(v.created_at).toLocaleString()}`),button('Preview saved version '+v.version,async()=>{const task=guard.begin();try{const saved=await api('version',c.report_id,{version:v.version},task);if(saved){view.render(preview,saved.document,{preview:true,privateSession:true,version:saved.version});notice(history,saved.source_matches_current?'Saved version matches this source pin.':'Saved version uses an earlier immutable source fingerprint.');}}catch(e){if(guard.current(task))failClosed(e.message);}}));}root.append(history);
 }
 document.addEventListener('keydown',e=>{if(!dialog)return;if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('button,input,textarea,select,summary,[tabindex="0"]')].filter(x=>{if(x.disabled||!x.getClientRects().length)return false;for(let p=x.parentElement;p&&p!==dialog;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&x!==p.querySelector(':scope>summary'))return false;return true;}),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
})();
