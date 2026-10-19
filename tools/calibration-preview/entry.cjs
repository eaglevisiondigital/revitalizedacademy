'use strict';
// OFFLINE FICTIONAL REHEARSAL ONLY. No production auth, source client, storage or network.
require('../../tests/preview/b5-entry.cjs');
const base=require('../../js/vitality-roadmap-b2-engine.js');
const contract=require('../../js/vitality-roadmap-b5-contract.js');
const engine=require('../../js/vitality-roadmap-b21-engine.js');
const weights=JSON.stringify(engine.weights);
let currentCase=null,host=null,notes=[];
function el(tag,text){const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;}
function field(parent,label,tag='textarea'){const l=el('label',label),e=el(tag);e.setAttribute('aria-label',label);l.append(e);parent.append(l);return e;}
function clear(){currentCase=null;host=null;notes=[];}
function sync(){
const main=document.querySelector('.rv5-dialog main'),select=main?.querySelector('select[aria-label="Fictional calibration case"]');
if(!main||!select){clear();return;}
const heading=main.querySelector('h1');if(heading&&heading.textContent!=='Founder Scoring Lab · FICTIONAL ONLY')heading.textContent='Founder Scoring Lab · FICTIONAL ONLY';
const print=main.querySelector('[data-rv5-print]');if(print){print.disabled=true;if(print.textContent!=='Print / export held in this rehearsal')print.textContent='Print / export held in this rehearsal';}
if(!host||!host.isConnected){
 host=el('section');host.className='rv5-card fictional-feedback';host.dataset.fictionalFeedback='';
 host.append(el('p','Model: b2.1-founder-20261015-v1. v0.14 Python reference not verified; no legacy formulas or sample outputs substituted.'),el('h2','Structured founder review · fictional case only'),el('p','Session memory only. No client answers, identifiable data, downloads, server writes or algorithm changes. Notes clear on case change, close, logout or refresh.'));
 const form=el('form');
 const reviewer=field(form,'Reviewer label (not authentication)','select');for(const name of ['Justyn','Elle','Supervised rehearsal'])reviewer.append(Object.assign(el('option',name),{value:name}));
 const driver=field(form,'Review Driver','select');for(const[k,name]of [['overall','Overall candidate'],...base.drivers])driver.append(Object.assign(el('option',name),{value:k}));
 const decision=field(form,'Founder assessment','select');for(const[v,name]of [['','Choose a decision'],['agree','Agree'],['disagree','Disagree'],['needs_evidence','Needs more evidence']])decision.append(Object.assign(el('option',name),{value:v}));decision.required=true;
 const suggested=field(form,'Suggested adjustment (proposal only)');suggested.maxLength=1500;
 const rationale=field(form,'Founder rationale (fictional evidence only)');rationale.required=true;rationale.minLength=3;rationale.maxLength=1500;
 const save=el('button','Capture session review');save.type='submit';form.append(save);
 const status=el('p');status.setAttribute('role','status');const list=el('div');list.dataset.reviewList='';
 const wipe=el('button','Clear session reviews');wipe.type='button';
 function paint(){list.replaceChildren();for(const note of notes){const card=el('article');card.className='rv5-card';card.append(el('h3',note.driverName+' · '+note.decision),el('p','Case '+note.caseId+' · '+note.reviewer),el('p','Suggested adjustment: '+(note.suggested||'None proposed')),el('p','Rationale: '+note.rationale),el('small','Pinned '+note.pins.config+' · proposal only; no policy adopted'));list.append(card);}}
 form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity()||notes.length>=24)return;if(JSON.stringify(engine.weights)!==weights)throw Error('Locked weight integrity failed');
 const caseId=main.querySelector('select[aria-label="Fictional calibration case"]').value;
 notes.push({caseId,reviewer:reviewer.value,driver:driver.value,driverName:driver.selectedOptions[0].textContent,decision:decision.value,suggested:suggested.value.trim(),rationale:rationale.value.trim(),pins:{...contract.pins},adopted:false});
 paint();status.textContent='Review captured in session memory only. Algorithm and weights unchanged.';suggested.value='';rationale.value='';decision.value='';});
 wipe.onclick=()=>{notes=[];paint();status.textContent='Session reviews cleared.';};
 host.append(form,wipe,status,list);main.append(host);
}
if(currentCase!==select.value){currentCase=select.value;notes=[];host.querySelector('[data-review-list]')?.replaceChildren();for(const t of host.querySelectorAll('textarea'))t.value='';const s=host.querySelector('select[aria-label="Founder assessment"]');if(s)s.value='';const status=host.querySelector('[role="status"]');if(status)status.textContent='Case changed: previous reviews cleared.';}
}
new MutationObserver(sync).observe(document.body,{childList:true,subtree:true});
document.addEventListener('ra:staff-access-reset',clear);
window.addEventListener('pagehide',clear);
