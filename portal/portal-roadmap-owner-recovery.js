/* LOCAL candidate: same original Owner, one append-only binding; never generates. */
(function(root){'use strict';
function createApp({portal,panel,api}){
 const doc=panel.ownerDocument,win=doc.defaultView,host=doc.createElement('section');host.hidden=true;host.className='rv5-card';host.setAttribute('aria-label','Existing Alex Revision 2 Owner supervision recovery');
 const title=doc.createElement('h3');title.textContent='Recover existing Alex Revision 2 supervision';
 const note=doc.createElement('p');note.textContent='Original issuing Owner only. This recovers the existing authority; it does not create another grant or generate a report. Keep this exact Owner browser session signed in during authorized use; another login cannot replace it.';
 const label=doc.createElement('label'),box=doc.createElement('input');box.type='checkbox';label.append(box,doc.createTextNode(' Recover the existing Alex-only authority once, with the same scope and expiration.'));
 const button=doc.createElement('button');button.type='button';button.textContent='Recover existing supervision once';button.disabled=true;
 const status=doc.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');host.append(title,note,label,button,status);panel.append(host);
 let owner=null,attempted=false,busy=false,stopped=false,available=false;
 const eligible=()=>!stopped&&portal.currentStaffRole?.()==='owner'&&typeof portal.captureStaffSession?.()?.userId==='string';
 const current=id=>eligible()&&portal.captureStaffSession().userId===id;
 const call=api||(async(name,payload)=>{const r=await portal.authClient.rpc(name,payload);if(r.error)throw Error('Protected recovery unavailable');return r.data;});
 function clear(){available=false;host.hidden=true;box.checked=false;button.disabled=true;status.textContent='';owner=null;}
 async function initialize(){
  if(!eligible()){clear();return;}const id=portal.captureStaffSession().userId;
  try{const u=await portal.authClient.auth.getUser();if(u.error||u.data?.user?.id!==id||!current(id)){clear();return;}const s=await call('roadmap_voice_r2_owner_recovery_status',{});if(!current(id)){clear();return;}if(s?.eligible_owner!==true){clear();return;}owner=id;host.hidden=false;
   if(busy)return;
   available=s.recovered!==true&&s.unused===true&&s.fresh_auth===true&&s.window_active===true;button.disabled=attempted||!available||!box.checked;
   if(s.recovered===true){box.disabled=true;status.textContent=s.session_bound===true?'Recovery is recorded for this Owner session. Independent readback is required before any separately authorized generation.':'Recovery is already recorded. Do not retry or substitute a different session.';}
   else status.textContent=attempted?'Recovery result requires independent verification. Do not retry.':'Fresh original-Owner authentication within five minutes is required. No report processing will occur.';
  }catch{if(current(id)&&!busy){button.disabled=true;status.textContent='Recovery status unavailable. No recovery was requested by this check.';}}
 }
 box.addEventListener('change',()=>{button.disabled=!box.checked||attempted||busy||!available||!owner||!current(owner);});
 button.addEventListener('click',async()=>{
  if(attempted||busy||!available||!box.checked||!owner||!current(owner))return;attempted=true;busy=true;button.disabled=true;box.disabled=true;const id=owner;
  status.textContent='Saving the one recovery binding. No generation requested.';
  try{const r=await call('roadmap_voice_r2_owner_recover',{p_request:win.crypto.randomUUID(),p_confirmation:'RECOVER EXISTING ALEX R2 SUPERVISION ONLY'});if(!current(id)){clear();return;}
   status.textContent=r?.recovered===true&&r.new_authority===false&&r.processing===false?'Recovery recorded. Keep this Owner session signed in. Independent readback is required; do not generate yet.':'Recovery result uncertain. Do not retry; obtain independent readback.';
  }catch{if(current(id))status.textContent='Recovery not confirmed. Do not retry; obtain independent readback.';}finally{busy=false;}
 });
 const reset=()=>clear();const renewal=(event)=>{if(event==='SIGNED_OUT'){clear();return;}if(owner&&!current(owner)){clear();return;}if(!busy)void initialize();};
 const subscription=portal.authClient.auth.onAuthStateChange?.(renewal)?.data?.subscription;
 doc.addEventListener('ra:staff-access-reset',reset);doc.addEventListener('ra:permissions-loaded',initialize);win.addEventListener('pagehide',reset);void initialize();
 return{initialize,stop(){stopped=true;clear();subscription?.unsubscribe();doc.removeEventListener('ra:staff-access-reset',reset);doc.removeEventListener('ra:permissions-loaded',initialize);win.removeEventListener('pagehide',reset);host.remove();}};
}
root.RVA_ROADMAP_OWNER_RECOVERY=Object.freeze({createApp});
if(typeof module==='object'&&module.exports)module.exports={createApp};
const env=root.RVA_ENV,portal=root.RA_PORTAL,panel=root.document?.getElementById('vitality-assessments-panel');
if(env?.environment==='production'&&env.projectRef==='voalfpxiyznnqfcqcymd'&&root.location.origin==='https://revitalizedacademy.com'&&portal?.authClient&&panel)createApp({portal,panel});
})(typeof window==='object'?window:globalThis);
