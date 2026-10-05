/* Sensitive answers stay in memory and in the private server draft, never browser storage. */
(() => {
 'use strict';
 const ui=window.RVA_VITALITY;if(!ui||!window.RVA_ENV)return;
 const key='rva_vitality_session_v1', endpoint=window.RVA_ENV.edgeBaseUrl+'/vitality-resume';
 const status=document.querySelector('[data-resume-status]'),notice=document.querySelector('[data-resume-notice]');
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
 async function open(raw,exchange){
  message('Opening your saved assessment…');
  try{const data=await request(exchange?'redeem':'read',{token:raw});if(data.token){token=data.token;store();}else if(!exchange)token=raw;apply(data);}
  catch(error){token='';store();ready=false;message(error.message,true);notice.hidden=false;}
 }
 const api=window.RVA_RESUME={
  start:async(identity)=>{
   message('Sending your secure link…');
   const result=await request('start',identity);
   notice.hidden=false;notice.textContent=result.message+' Open the link to verify your email and begin or continue your assessment. No member account is required.';
   message('Check your email to continue securely.');
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
 document.querySelector('[data-continue-later]').addEventListener('click',async()=>{
  if(!await flush())return;
  try{const r=await request('recover',{email:ui.form.elements.email.value});message(r.message);}catch(error){message(error.message,true);}
 });
 document.querySelector('[data-resume-request]').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const button=form.querySelector('button');button.disabled=true;
  try{const result=await request('recover',{email:form.elements.resume_email.value});notice.hidden=false;notice.textContent=result.message;message('Link request received.');}
  catch(error){message(error.message,true);}finally{button.disabled=false;}
 });
 const resume=window.RVA_RESUME_LINK||'';delete window.RVA_RESUME_LINK;
 if(resume)void open(resume,true);
 else {try{token=sessionStorage.getItem(key)||'';}catch{}if(token)void open(token,false);}
 // Expose only non-secret state to the existing assessment adapter, not credentials.
 api.canEdit=()=>ready&&!locked;
})();
