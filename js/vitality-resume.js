/* Sensitive answers stay in memory and in the private server draft, never browser storage. */
(() => {
 'use strict';
 const ui=window.RVA_VITALITY;if(!ui||!window.RVA_ENV)return;
 const pendingKey='rva_vitality_pending_link_v1',key='rva_vitality_session_v1', endpoint=window.RVA_ENV.edgeBaseUrl+'/vitality-resume';
 const status=document.querySelector('[data-resume-status]'),notice=document.querySelector('[data-resume-notice]');
 let initialStart=null,initialEmail='',cooldownUntil=0,cooldownTimer=null,recoveryPending=false;
 let token='',id=null,revision=0,dirty=false,ready=false,restoring=false,timer=null,inflight=null,editVersion=0,locked=false;
 const message=(text,error=false)=>{status.textContent=text;status.classList.toggle('is-error',error);document.querySelector('[data-resume-retry]').hidden=!error||!ready||locked;};
 const store=()=>{try{if(token)sessionStorage.setItem(key,token);else sessionStorage.removeItem(key);}catch{}};
 async function request(action,body={}){
  const payload=JSON.stringify({action,...body});
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:window.RVA_ENV.supabaseKey},body:payload,cache:'no-store',referrerPolicy:'no-referrer',keepalive:action==='save'&&payload.length<60000});
  const data=await response.json();if(!response.ok)throw Error(data.error||'We couldn’t save your latest changes. Please try again.');return data;
 }
 function capture(){
  const fields=Object.create(null);
  ui.form.querySelectorAll('input,select,textarea').forEach(c=>{
   if(!c.name||c.type==='hidden'||c.disabled||c.name==='bot-field'||c.hasAttribute('data-assessment-summary'))return;
   let value=c.value;
   if(['number','range'].includes(c.type)&&value!==''&&Number.isFinite(Number(value)))value=Number(value);
   if(c.type==='select-multiple')value=Array.from(c.selectedOptions,o=>o.value);
   const row={type:c.type,value};if(['checkbox','radio'].includes(c.type))row.checked=c.checked;
   (fields[c.name]||(fields[c.name]=[])).push(row);
  });
  return {version:1,fields,section:ui.section(),section_label:document.querySelector('[data-section-label]').textContent,pathway:ui.form.elements.assessment_pathway.value,percent:Math.min(99,Number(document.querySelector('[data-progress-percent]').textContent.replace('%','')))};
 }
 function lockedState(data){
  locked=true;ready=false;dirty=false;clearTimeout(timer);
  ui.form.querySelectorAll('input,select,textarea,button').forEach(c=>c.disabled=true);
  if(data.status==='completed'){ui.complete();message('Assessment complete. Your submitted answers are locked.');}
  else message('Your assessment submission is being checked. Your answers are preserved. Please contact ReVitalized Academy before submitting again.',true);
 }
 async function flush(){
  clearTimeout(timer);if(!ready||locked)return false;
  if(inflight){await inflight;return dirty?flush():true;}
  if(!dirty)return true;
  const version=editVersion,snapshot=capture();message('Saving…');
  inflight=(async()=>{
   try{
    const data=await request('save',{token,draft_id:id,revision,snapshot});
    if(data.status!=='draft'){lockedState(data);return false;}
    revision=data.revision;dirty=version!==editVersion;
    message(dirty?'Saving…':'Saved');return true;
   }catch(error){message(error.message,true);return false;}
   finally{inflight=null;}
  })();
  const result=await inflight;if(result&&dirty)return flush();return result;
 }
 function changed(){if(restoring||!ready||locked)return;dirty=true;editVersion++;message('Saving…');clearTimeout(timer);timer=setTimeout(flush,650);}
 function apply(data){
  if(data.status!=='draft'){lockedState(data);return;}
  id=data.draft_id;revision=data.revision;restoring=true;
  try{ui.restore(data.identity,data.snapshot);ready=true;locked=false;dirty=false;notice.hidden=true;message('Saved');}
  finally{restoring=false;}
 }
 function pending(value){try{if(value)sessionStorage.setItem(pendingKey,value);else sessionStorage.removeItem(pendingKey);}catch{}}
 async function open(raw,exchange){
  message('Opening your saved assessment…');
  // Hide entry while the credential is being exchanged, not after a second email.
  const entry=document.querySelector('[data-assessment-entry]');if(entry)entry.hidden=true;
  try{
   const data=await request(exchange?'redeem':'read',{token:raw});
   if(data.token){token=data.token;store();}else if(!exchange)token=raw;
   pending('');apply(data);
  }catch(error){
   token='';store();ready=false;pending('');
   if(entry)entry.hidden=false;
   message(error.message,true);notice.hidden=false;notice.textContent='Use the most recent email. If it was already opened, return to that assessment tab or request a new secure link.';
  }
 }
 const requestId=()=>{if(typeof crypto.randomUUID==='function')return crypto.randomUUID();const h=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);};
 const mask=email=>{const [name,domain]=email.trim().split('@');return (name?name[0]:'')+'•••@'+(domain||'');};
 function showEmailStep(email){
  initialEmail=email;
  const form=document.querySelector('[data-vitality-lead-form]'),panel=document.querySelector('[data-start-confirmation]');
  form.hidden=true;panel.hidden=false;document.querySelector('[data-assessment-entry]').hidden=true;
  document.querySelector('[data-start-email-copy]').textContent='If an unfinished assessment is available, a private link will be sent to '+mask(email)+'. Open that link to continue your Vitality Assessment.';
  panel.focus({preventScroll:true});panel.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function cooldown(seconds=60){
  cooldownUntil=Date.now()+seconds*1000;clearInterval(cooldownTimer);
  const update=()=>{
   const remaining=Math.max(0,Math.ceil((cooldownUntil-Date.now())/1000)),b=document.querySelector('[data-start-resend]');
   b.disabled=remaining>0||recoveryPending;
   document.querySelector('[data-start-resend-status]').textContent=remaining?'You can request another link in '+remaining+' seconds.':'If it hasn’t arrived, you can request another secure link.';
   const recovery=document.querySelector('[data-resume-request] button');recovery.disabled=remaining>0||recoveryPending;
   if(!remaining)clearInterval(cooldownTimer);
  };update();cooldownTimer=setInterval(update,1000);
 }
 async function recover(email){
  if(recoveryPending||Date.now()<cooldownUntil)return false;
  recoveryPending=true;
  try{await request('recover',{email,request_id:requestId()});cooldown();return true;}
  finally{recoveryPending=false;}
 }
 const api=window.RVA_RESUME={
  start:(identity)=>{
   if(initialStart)return initialStart;
   message('Saving your assessment…');
   const startRequestId=requestId();
   initialStart=(async()=>{
    try{await request('start',{...identity,request_id:startRequestId,intake_version:2});showEmailStep(identity.email);notice.hidden=true;message('Check your email to continue securely.');cooldown();}
    catch(error){initialStart=null;throw error;}
   })();return initialStart;
  },
  changed,flush,
  finalize:async(form)=>{
   dirty=true;editVersion++;
   if(!await flush())throw Error('Please save your latest changes before submitting.');
   const data=await request('finalize',{token,draft_id:id,revision,form});
   if(data.status!=='completed'){lockedState(data);throw Error('Your submission is being checked. Please do not submit it again.');}
   lockedState(data);return data;
  }
 };
 ui.form.addEventListener('input',changed);ui.form.addEventListener('change',changed);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void flush();});
 document.querySelector('[data-resume-retry]').addEventListener('click',()=>void flush());
 document.querySelector('[data-start-resend]').addEventListener('click',async()=>{
  try{if(await recover(initialEmail)){message('Link request received. Use the most recent email.');}}
  catch(error){message(error.message,true);}
 });
 document.querySelector('[data-continue-later]').addEventListener('click',async()=>{
  if(!await flush())return;
  try{if(await recover(ui.form.elements.email.value))message('Link request received. Use the most recent email when returning.');}
  catch(error){message(error.message,true);}
 });
 document.querySelector('[data-resume-request]').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity()||recoveryPending||Date.now()<cooldownUntil)return;
  const button=form.querySelector('button');button.disabled=true;
  const confirmation=form.querySelector('[data-recovery-confirmation]');confirmation.hidden=true;
  try{await recover(form.elements.resume_email.value);confirmation.hidden=false;confirmation.textContent='If there’s an unfinished assessment connected to that email, we’ll send you a secure link to continue. It may take a minute. Use the most recent email; please do not start again.';notice.hidden=true;message('Link request received.');}
  catch(error){message(error.message,true);button.disabled=false;}
 });
 // Safari may reuse this document for a new Mail link (same path, new fragment).
 // Reload rather than merging a second participant into the current form state.
 window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#resume='))location.reload();});
 let resume=window.RVA_RESUME_LINK||'';delete window.RVA_RESUME_LINK;
 if(!resume){try{resume=sessionStorage.getItem(pendingKey)||'';}catch{}}
 if(window.RVA_RESUME_INVALID_LINK){delete window.RVA_RESUME_INVALID_LINK;pending('');message('This link is unavailable. Use the most recent email or request a new secure link.',true);}
 else if(resume)void open(resume,true);
 else {try{token=sessionStorage.getItem(key)||'';}catch{}if(token)void open(token,false);}
 // Expose only non-secret state to the existing assessment adapter, not credentials.
 api.canEdit=()=>ready&&!locked;
})();
