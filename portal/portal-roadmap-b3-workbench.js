/* B3 synthetic rehearsal only. No production bridge or private write transport. */
(() => {
  'use strict';
  if(window.RVA_ENV?.environment!=='staging')return;
  const portal=window.RA_PORTAL,adapter=window.RVA_ROADMAP_B3,fixtures=window.RVA_ROADMAP_B3_FIXTURES,
    registry=window.RVA_ROADMAP_B2_SOURCE_MAP,view=window.RVA_ROADMAP_VIEW,base=window.RVA_ROADMAP_B2;
  const panel=document.getElementById('vitality-assessments-panel');
  if(!panel||!portal?.createAuthenticatedTaskGuard||!adapter||!fixtures||!registry||!view||!base)return;
  const n=view.node,clone=x=>JSON.parse(JSON.stringify(x)),guard=portal.createAuthenticatedTaskGuard();
  let dialog=null,repository=fixtures.rehearsal(),caseId=fixtures.cases[0].id,context=null,draft=null;
  const button=(text,fn)=>{const x=n('button',text);x.type='button';x.onclick=fn;return x;};
  function close(){guard.cancel();dialog?.remove();dialog=null;launch.focus();}
  function reset(){close();repository.clear();context=null;draft=null;caseId=fixtures.cases[0].id;}
  document.addEventListener('ra:staff-access-reset',reset);
  async function open(){const token=guard.begin();if(!token)return;try{const response=await portal.authClient.rpc('list_vitality_roadmap_preparation',{});if(!guard.current(token))return;if(response.error)throw Error('Verified private-health/contact authorization is required.');load();}catch{if(guard.current(token)){reset();const p=n('p','Verified private-health/contact authorization is required.');p.setAttribute('role','status');panel.append(p);}}}
  const launch=button('B3 pilot readiness · Synthetic rehearsal',open);launch.id='roadmap-b3-launch';panel.prepend(launch);
  function generated(){const doc=adapter.emptyDocument(),mapped=adapter.adapt(context.fixture.source,registry);doc.summary='Fictional provisional coverage review. All scores and classifications are withheld; real pilot execution is held.';
    for(const [key,d]of Object.entries(mapped.drivers)){const refs=d.observations.filter(o=>o.values.length&&Object.hasOwn(context.fixture.source.answers,o.questionId)).map(o=>o.questionId).slice(0,30);if(refs.length)doc.drivers[key]={summary:`${d.coverage.known} known source-context items; no Driver score or stage.`,reason:'Source context does not establish complete approved measurements.',evidence:refs};}return doc;}
  function load(){context=repository.load(caseId);draft=context.version?clone(context.document):generated();render();}
  function field(parent,label,value){const wrap=n('label',label),input=n('textarea');input.value=value||'';input.maxLength=4000;wrap.append(input);parent.append(wrap);return input;}
  function render(){
    dialog?.remove();dialog=n('div',undefined,'roadmap-dialog roadmap-print-root roadmap-b3-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','B3 synthetic pilot readiness');dialog.tabIndex=-1;
    const closeButton=button('Close B3 rehearsal',close);closeButton.className='roadmap-close';dialog.append(closeButton);const root=n('main',undefined,'roadmap-workspace roadmap-b3-workspace');dialog.append(root);document.body.append(dialog);dialog.focus();
    root.append(n('h1','B3 secure adult pilot readiness'),n('p','Synthetic rehearsal · Candidate / Not Approved · Real participant scoring, approval, release and email held','roadmap-notice'),n('p','This preview rehearses fictional revisions in document memory. It is not durable B1 storage or authenticated founder signoff. PostgreSQL tests separately validate B1 persistence. Do not paste participant information into this rehearsal.'));
    const pickLabel=n('label','Completed fictional assessment'),pick=n('select');pick.id='roadmap-b3-case';pickLabel.htmlFor=pick.id;for(const c of fixtures.cases){const o=n('option',c.label);o.value=c.id;pick.append(o);}pick.value=caseId;pick.onchange=()=>{caseId=pick.value;load();};root.append(pickLabel,pick,n('p',`Adapter ${adapter.version} · Registry ${adapter.registryFingerprint} · Fictional revision ${context.version}`));
    const mapped=adapter.adapt(context.fixture.source,registry),grid=n('div',undefined,'roadmap-b3-grid'),answers=n('section'),coverage=n('section');grid.append(answers,coverage);root.append(grid);
    answers.append(n('h2','Original fictional questionnaire answers'),n('p',`${mapped.questionnaireVersion} · ${mapped.sourceRevisionStatus} · Adult/self source boundary`));
    const dl=n('dl');for(const [id,rows]of Object.entries(context.fixture.source.answers||{})){const vals=adapter.values(rows);if(vals.length)dl.append(n('dt',registry.fields[id]?.label||id),n('dd',vals.join(', ')),n('dd','Source question: '+id));}answers.append(dl);
    coverage.append(n('h2','Provisional Roadmap · Source readiness'),n('p','Overall not calculated. No actual-source score or stage is generated.'));
    for(const issue of mapped.issues)coverage.append(n('p',issue,'roadmap-notice'));
    for(const [key,d]of Object.entries(mapped.drivers)){const card=n('details',undefined,'roadmap-driver');card.dataset.b3Driver=key;card.append(n('summary',`${d.name} · Unscored · ${d.coverage.known} known context items · ${d.coverage.conflicting} conflicting · ${d.coverage.unknown} unknown`));if(d.budgetSeparate)card.append(n('p','Wise Budgeting remains separate; hardship does not reduce health score or stage.'));for(const gap of d.missing)card.append(n('p',gap));for(const o of d.observations.filter(o=>o.status!=='missing'))card.append(n('p',`${o.questionId}: ${o.status}${o.component===null?'':'; proposed component '+o.component}. ${o.reason}`));coverage.append(card);}
    const form=n('form',undefined,'roadmap-editor');form.onsubmit=e=>e.preventDefault();root.append(n('h2','Fictional reviewer corrections'),form);
    const overview=field(form,'Proposed overview',draft.summary),notes=field(form,'Scoring / strengths / priorities / opportunities correction (proposal only)',draft.reviewer_notes),driverLabel=n('label','Driver for source-backed correction'),driver=n('select');driver.id='roadmap-b3-driver';driverLabel.htmlFor=driver.id;for(const [key,name]of base.drivers){const o=n('option',name);o.value=key;driver.append(o);}form.append(driverLabel,driver);
    const observation=field(form,'Proposed Driver observation',''),rationale=field(form,'Evidence rationale',''),evidence=field(form,'Source question keys (comma-separated)',''),reason=field(form,'Reason for fictional revision','');reason.maxLength=1000;
    const status=n('p');status.setAttribute('role','status');form.append(status);
    function read(){const doc=clone(draft);doc.summary=overview.value.trim();doc.reviewer_notes=notes.value.trim();if(observation.value.trim())doc.drivers[driver.value]={summary:observation.value.trim(),reason:rationale.value.trim(),evidence:evidence.value.split(',').map(x=>x.trim()).filter(Boolean)};return doc;}
    const toolbar=n('div',undefined,'roadmap-toolbar');form.append(toolbar);
    toolbar.append(button('Rehearse version append · Session only',()=>{try{const next=read();repository.save(caseId,context.version,reason.value,next);load();}catch(e){status.textContent=e.message;}}),button('Regenerate unscored fictional proposal',()=>{try{repository.save(caseId,context.version,reason.value,generated());load();}catch(e){status.textContent=e.message;}}));
    const preview=n('section',undefined,'roadmap-preview');preview.hidden=true;root.append(preview);
    toolbar.append(button('Interactive / printable fictional preview',()=>{view.render(preview,read(),{preview:true,version:context.version});preview.hidden=false;}));
    const hold=button('Real pilot / final approval / delivery held',()=>{});hold.disabled=true;toolbar.append(hold);
    const history=n('section');root.append(history);history.append(n('h2','Fictional revision trace · Not a durable audit'));
    for(const saved of context.history){history.append(n('p',`Fictional version ${saved.version}: ${saved.reason} · ${saved.adapterVersion} · unscored · release held`),button('Preview fictional version '+saved.version,()=>{view.render(preview,saved.document,{preview:true,version:saved.version});preview.hidden=false;}));}
    if(context.history.length>=2){const a=context.history.at(-2),b=context.history.at(-1),diff=n('details');diff.append(n('summary',`Compare fictional versions ${a.version} → ${b.version}`));for(const key of Object.keys(b.document))if(base.stable(a.document[key])!==base.stable(b.document[key]))diff.append(n('p',`${key}: changed in proposed version ${b.version}`));history.append(diff);}
    const boundary=n('details');boundary.append(n('summary','Production data boundary and remaining pilot gates'),n('p','No production connection or data transfer exists here. A future production same-origin founder-only deployment must be explicitly approved, preserve PR #29, validate active verified founder sessions/private-health/contact scope, pin source and adapter versions, and retain B1 immutable draft/audit controls. Rubrics, A/B/C expectations and pilot data-use authorization remain required. No staging browser bridge or service key is permitted.'));root.append(boundary);
  }
  document.addEventListener('keydown',e=>{if(!dialog)return;if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const fields=[...dialog.querySelectorAll('button,input,textarea,select,a[href]')].filter(x=>!x.disabled&&x.getClientRects().length);if(e.shiftKey&&document.activeElement===fields[0]){e.preventDefault();fields.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===fields.at(-1)){e.preventDefault();fields[0]?.focus();}}});
})();
