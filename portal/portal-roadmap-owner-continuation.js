/* Owner's own normal authenticated browser session. No passwords/tokens or processing. */
(function(root){'use strict';
function createApp({portal,panel,api}){
 const doc=panel.ownerDocument,win=doc.defaultView,host=doc.createElement('section');host.hidden=true;host.className='rv5-card';host.setAttribute('aria-label','Alex continuation and independent founder review');panel.append(host);
 const el=(tag,text)=>{const e=doc.createElement(tag);if(text)e.textContent=text;return e;};
 host.append(el('h3','Alex Revision 2 continuation and saved founder review'),el('p','Original issuing Owner only. These actions issue bounded permissions and never generate a report. Keep this Owner session signed in through the separately authorized generation; saved review is independent afterward.'));
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');host.append(status);
 const call=api|| (async(name,args)=>{const r=await portal.authClient.rpc(name,args);if(r.error)throw Error('Protected permission operation unavailable');return r.data;});
 let actor=null,stopped=false,busy=false,info=null;const attempted={generation:false,review:false},controls=[];
 const eligible=()=>!stopped&&portal.currentStaffRole?.()==='owner'&&portal.captureStaffSession?.()?.userId;
 const same=()=>actor&&eligible()&&portal.captureStaffSession().userId===actor;
 for(const kind of ['generation','review']){
  const section=el('section'),box=el('input');box.type='checkbox';const label=el('label');label.append(box,doc.createTextNode(kind==='generation'?' The exact successor and separate future one-generation scope are approved; I confirm the new Alex-only SOP and existing restricted-key private custody.':' The exact R1/R2 saved hashes were independently verified and this four-grant Justyn/Elle read/cited-feedback bundle is separately approved.'));
  const button=el('button',kind==='generation'?'Issue prospective Alex continuation once':'Issue exact saved-review bundle once');button.type='button';button.disabled=true;section.append(label,button);host.append(section);controls.push({kind,box,button});
  box.onchange=()=>refresh();
  button.onclick=async()=>{if(!same()||busy||attempted[kind]||button.disabled||!box.checked)return;attempted[kind]=true;busy=true;refresh();const id=actor;status.textContent='Recording the bounded permission once. No report processing requested.';
   try{const r=kind==='generation'?await call('roadmap_alex_continuation_issue',{p_request:win.crypto.randomUUID(),p_sop:'ONE_ALEX_R2_CONTINUATION_SAME_PURPOSE',p_custody:'EXISTING_RESTRICTED_KEY_PRIVATE_CUSTODY'}):await call('roadmap_alex_review_issue',{p_request:win.crypto.randomUUID(),p_binding:info.review_binding});if(!same()||actor!==id){clear();return;}
    status.textContent=r?.issued===true&&r.processing===false?'Permission recorded. Independent readback required. Do not generate, retry or assume review access yet.':'Result uncertain. Do not retry; obtain independent readback.';
   }catch{if(same())status.textContent='Permission not confirmed. Do not retry; obtain independent readback.';}finally{busy=false;refresh();}
  };
 }
 function clear(){actor=null;info=null;host.hidden=true;for(const c of controls){c.box.checked=false;c.button.disabled=true;}status.textContent='';}
 function refresh(){for(const c of controls){const available=info?.fresh_auth===true&&(c.kind==='generation'?info.generation_available===true&&info.founder_fresh===true:info.saved_revisions===2&&!info.review_issued);c.button.disabled=!same()||busy||attempted[c.kind]||!available||!c.box.checked;c.box.disabled=busy||attempted[c.kind]||!same();}}
 async function initialize(){if(!eligible()){clear();return;}const id=portal.captureStaffSession().userId;try{const u=await portal.authClient.auth.getUser();if(u.error||u.data?.user?.id!==id||!eligible()||portal.captureStaffSession().userId!==id){clear();return;}const r=await call('roadmap_alex_continuation_status',{});if(!eligible()||portal.captureStaffSession().userId!==id||r?.eligible_owner!==true){clear();return;}actor=id;info=r;host.hidden=false;if(!busy&&!Object.values(attempted).some(Boolean))status.textContent='Permission issuance requires fresh original-Owner authentication and independent release clearance. No processing is performed here.';refresh();}catch{if(!busy)clear();}}
 const auth=portal.authClient.auth.onAuthStateChange?.((event,session)=>{if(event==='SIGNED_OUT'||actor&&session?.user?.id&&session.user.id!==actor){clear();return;}if(!busy)void initialize();})?.data?.subscription;
 doc.addEventListener('ra:staff-access-reset',clear);doc.addEventListener('ra:permissions-loaded',initialize);win.addEventListener('pagehide',clear);void initialize();
 return{initialize,stop(){stopped=true;clear();auth?.unsubscribe();doc.removeEventListener('ra:staff-access-reset',clear);doc.removeEventListener('ra:permissions-loaded',initialize);win.removeEventListener('pagehide',clear);host.remove();}};
}
root.RVA_ROADMAP_OWNER_CONTINUATION=Object.freeze({createApp});if(typeof module==='object'&&module.exports)module.exports={createApp};
const env=root.RVA_ENV,portal=root.RA_PORTAL,panel=root.document?.getElementById('vitality-assessments-panel');if(env?.environment==='production'&&env.projectRef==='voalfpxiyznnqfcqcymd'&&root.location.origin==='https://revitalizedacademy.com'&&portal?.authClient&&panel)createApp({portal,panel});
})(typeof window==='object'?window:globalThis);
