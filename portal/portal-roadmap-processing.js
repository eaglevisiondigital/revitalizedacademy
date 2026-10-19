/* Candidate private report controller. Host supplies current authenticated session and approved source ID. */
(function(root){'use strict';
 function mount(host,{report,request,view=root.RVA_ROADMAP_VIEW,onError=()=>{},now=()=>Date.now(),schedule=root.setTimeout,cancel=root.clearTimeout}){
 let epoch=0,terminated=false,timer=null,watch=null,documentState=null,abort=new AbortController();
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const stop=()=>{terminated=true;epoch++;abort.abort();if(timer!==null)cancel(timer);if(watch!==null)cancel(watch);host.replaceChildren();delete host.dataset.version;delete host.dataset.reviewRevision;documentState=null;};
 async function call(action,payload={}){const e=epoch,result=await request({action,report,payload},{signal:abort.signal});if(terminated||e!==epoch)throw Error('Session ended');if(!result||result.unavailable)throw Error('Unavailable');return result;}
 async function check(){if(terminated)return;try{await call('read');if(!terminated)watch=schedule(check,15000);}catch{stop();}}
 function render(result){
 host.replaceChildren();documentState=result;host.dataset.version=result.version_id||'';host.dataset.reviewRevision=String(result.reviews?.length||0);
 if(!result.document){host.append(el('p','Waiting for an authorized completion job. No draft is available.'));return;}
 const d=result.document,expiry=Date.parse(result.expires_at);if(!Number.isFinite(expiry)||expiry<=now()){stop();return;}
 if(timer!==null)cancel(timer);timer=schedule(stop,Math.min(expiry-now(),2147483647));
 if(watch===null)watch=schedule(check,15000);
 host.append(el('p','CONFIDENTIAL · Founder-only draft · Client delivery, email and export held.'));
 const preview=el('section');host.append(preview);view.render(preview,d.roadmap,{preview:true,privateSession:true});
 const provenance=el('details');provenance.append(el('summary','Calculation provenance and coverage'));
 provenance.append(el('p',`Engine ${d.calculation.engine}. ${d.calculation.completeNumericDrivers}/12 complete numeric Drivers. Missing is not zero. Wise Budgeting has no health deduction.`));
 provenance.append(el('p',d.calculation.knownCalibrationDiscrepancy));host.append(provenance);
 const shared=el('details');shared.append(el('summary','Shared and unmapped submitted evidence · not scored'));for(const e of [...d.coverage.shared,...d.coverage.unmapped]){shared.append(el('h4',e.label),el('p',e.submitted.map(String).join(' · ')),el('small',e.id+' · '+e.status));}host.append(shared);
 for(const [key]of view.drivers){const driver=d.drivers[key];
 const block=el('details');block.append(el('summary',driver.name+' · Evidence and founder review'));
 block.append(el('p',driver.interpretation),el('p',driver.formula));
 for(const evidence of driver.evidence){block.append(el('h4',evidence.question));block.append(el('p','Current pinned reference wording; historical wording is not independently established.'));block.append(el('p',evidence.answers.map(v=>v===null?'Explicit null · unknown':String(v)).join(' · ')));block.append(el('small',evidence.field+' · '+evidence.status));}
 for(const group of ['strengths','concerns','coaching'])for(const item of driver[group])block.append(el('p',item.text));
 const missing=el('ul');for(const q of driver.questions)missing.append(el('li',q));block.append(missing);
 const form=el('form'),decision=el('select');decision.setAttribute('aria-label','Founder assessment for '+driver.name);for(const value of ['accurate','inaccurate','needs_adjustment','request_inputs']){const o=el('option',value.replaceAll('_',' '));o.value=value;decision.append(o);}
 const textArea=(label)=>{const wrap=el('label',label),input=el('textarea');input.maxLength=2000;wrap.append(input);form.append(wrap);return input;};form.append(decision);
 const interpretation=textArea('Proposed interpretation'),rationale=textArea('Reason for review'),adjustment=textArea('Proposed scoring adjustment (not adopted)'),question=textArea('Missing information request');
 const save=el('button','Save cited founder proposal');save.type='submit';form.append(save);
 form.addEventListener('submit',async event=>{event.preventDefault();if(terminated)return;save.disabled=true;try{await call('review',{version_id:result.version_id,expected_revision:result.reviews.length,request_key:crypto.randomUUID(),proposal:{driver:key,decision:decision.value,interpretation:interpretation.value,rationale:rationale.value,suggestedAdjustment:adjustment.value,missingInputRequest:question.value,citations:driver.evidence.slice(0,20).map(e=>e.field)}});render(await call('read'));}catch{if(!terminated){onError('Review is unavailable or stale; recheck your session and separate write authorization.');save.disabled=false;}}});block.append(form);host.append(block);
 }
 if(result.reviews.length){host.append(el('h3','Attributed founder proposals'));for(const r of result.reviews)host.append(el('p',`${r.proposal.driver}: ${r.proposal.decision} — ${r.proposal.rationale}`));}
 const regenerate=el('button','Return for regeneration');regenerate.addEventListener('click',async()=>{regenerate.disabled=true;try{await call('regenerate',{version_id:result.version_id,request_key:crypto.randomUUID()});render(await call('process'));}catch{if(!terminated)onError('Regeneration requires current source and write authorization.');}});host.append(regenerate);
 const approvalLabel=el('label','Overall internal approval rationale'),approvalReason=el('textarea');approvalReason.maxLength=2000;approvalLabel.append(approvalReason);host.append(approvalLabel);
 const approve=el('button','Approve this internal review only');approve.addEventListener('click',async()=>{approve.disabled=true;try{await call('approve',{version_id:result.version_id,expected_revision:result.reviews.length,rationale:approvalReason.value});host.append(el('p','Internal review approved. Client visibility, delivery and email remain held.'));}catch{if(!terminated)onError('Approval requires a reviewed current version and separate authorization.');}});host.append(approve);
 }
 const termination=()=>stop(),focus=()=>{if(!terminated){if(watch!==null)cancel(watch);watch=null;check();}};document.addEventListener('ra:staff-access-reset',termination);root.addEventListener('pagehide',termination);root.addEventListener('focus',focus);
 return{start:async()=>{try{render(await call('process'));}catch{if(!terminated){host.replaceChildren(el('p','Internal processing held. Complete the authenticated purpose and operator authorization first.'));onError('Internal processing unavailable.');}}},stop:()=>{stop();document.removeEventListener('ra:staff-access-reset',termination);root.removeEventListener('pagehide',termination);root.removeEventListener('focus',focus);}};
 }
 root.RVA_ROADMAP_PROCESSING=Object.freeze({mount});
})(typeof window==='object'?window:globalThis);
