/* Independent saved-version review. No original-answer read or processing endpoint. */
(function(root){'use strict';
function createApp({portal,panel}){
 const doc=panel.ownerDocument,win=doc.defaultView;
 const el=(tag,text)=>{const e=doc.createElement(tag);if(text)e.textContent=text;return e;};
 const launch=el('button','Saved Roadmap review');launch.type='button';launch.className='rv5-launch';launch.hidden=true;
 (panel.querySelector('.panel-heading')||panel).prepend(launch);
 let view=null,controller=null,epoch=0,pending=false,returnFocus=null,opener=null,status=null,resumeButton=null,refreshTimer=null,refreshing=false,reconnecting=null,reconnectQueued=false;
 const guard=portal.createAuthenticatedTaskGuard();let captured=null,task=null;
 const eligible=()=>portal.captureStaffSession()&&portal.currentStaffRole?.()==='owner'&&portal.hasPermission?.('health.private.view')&&portal.hasPermission?.('crm.view')&&portal.hasPermission?.('health.progress.manage');
 const failure=kind=>{const error=Error('Saved review unavailable');error.reviewKind=kind;return error;};
 const sameAccount=()=>captured&&portal.captureStaffSession()?.userId===captured.userId;
 function close(force=false){
  if(!force&&controller?.isDirty()&&!win.confirm('Discard unsaved founder feedback and close this review?'))return false;
  epoch++;guard.cancel();controller?.stop();controller=null;view?.remove();view=null;
  if(refreshTimer!==null)win.clearTimeout(refreshTimer);refreshTimer=null;refreshing=false;reconnecting=null;reconnectQueued=false;resumeButton=status=null;
  if(!doc.querySelector('.rv5-dialog'))doc.body.classList.remove('rv5-open');pending=false;
  if(returnFocus?.isConnected&&eligible())returnFocus.focus();returnFocus=null;return true;
 }
 function reset(){close(true);launch.hidden=true;captured=null;task=null;}
 async function request(action,report=null,payload={}){
  if(!['list','read','review'].includes(action)||!eligible()||!captured||!sameAccount())throw failure('denied');
  if(!guard.current(task))throw failure('temporary');
  const e=epoch;let sessionResult;
  try{sessionResult=await portal.authClient.auth.getSession();}catch{throw failure('temporary');}
  if(e!==epoch||!sameAccount()||sessionResult.data?.session?.user?.id!==captured?.userId)throw failure('denied');
  if(sessionResult.error||!guard.current(task))throw failure('temporary');
  let result;try{result=await portal.authClient.rpc('roadmap_saved_review',{p_action:action,p_report:report,p_payload:payload});}catch{throw failure('temporary');}
  if(e!==epoch||!sameAccount()||!eligible())throw failure('denied');
  if(!guard.current(task))throw failure('temporary');
  if(result.error){const code=result.error.code;throw failure(code==='22023'&&action==='review'?'validation':code==='40001'&&action==='review'?'conflict':['42501','22023','28000'].includes(code)?'denied':'temporary');}
  return result.data;
 }
 function showReconnect(){if(!view)return;if(resumeButton)resumeButton.hidden=false;if(status)status.textContent='Review paused for reconnection. Unsaved feedback is held only in this tab’s memory. No processing or automatic save was requested.';}
 async function reconnect(){
  if(!controller||!view||refreshing)return;if(reconnecting){if(!guard.current(task))reconnectQueued=true;return reconnecting;}
  if(!sameAccount()||!eligible()){reset();return;}
  const e=epoch;task=guard.begin();if(!task){reset();return;}
  resumeButton.disabled=true;status.textContent='Rechecking your current session and exact saved report authorization…';
  reconnecting=(async()=>{const ok=await controller.resume();if(e!==epoch||!view)return;
   if(ok){status.textContent='Saved review reconnected. Your in-progress feedback has been restored; no proposal was automatically submitted.';resumeButton.hidden=true;}
   else{status.textContent='Saved review could not resume. Check the message below; use your normal sign-in if needed. The original review deadline still applies.';resumeButton.hidden=false;}
  })().finally(()=>{if(e===epoch){reconnecting=null;if(resumeButton)resumeButton.disabled=false;if(reconnectQueued){reconnectQueued=false;void reconnect();}}});return reconnecting;
 }
 function initialize(){
  if(view&&controller){if(!sameAccount()||!eligible()){reset();return;}launch.hidden=false;
   if(refreshTimer!==null)win.clearTimeout(refreshTimer);refreshTimer=null;refreshing=false;controller.suspend();void reconnect();return;}
  reset();if(eligible())launch.hidden=false;
 }
 function renewal(event,session){
  if(!view||!captured)return;
  if(event==='SIGNED_OUT'||session?.user?.id&&session.user.id!==captured.userId){reset();return;}
  if(event!=='TOKEN_REFRESHED')return;
  if(!session?.user||!sameAccount()){reset();return;}
  refreshing=true;controller?.suspend();showReconnect();
  if(refreshTimer!==null)win.clearTimeout(refreshTimer);
  // A failed permissions reload may emit no completion event. Leave content hidden
  // and offer one explicit read-only resume, rather than retrying writes or looping.
  refreshTimer=win.setTimeout(()=>{refreshTimer=null;refreshing=false;if(!sameAccount()||!eligible())reset();else showReconnect();},10000);
 }
 async function open(){
  if(pending||!eligible())return;if(view){view.focus();return;}if(opener)return opener;
  close(true);returnFocus=doc.activeElement;captured=portal.captureStaffSession();task=guard.begin();const e=epoch;pending=true;
  view=el('section');view.className='rv5-dialog rv6-dialog';view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('aria-label','Saved Roadmap review');view.tabIndex=-1;view.dataset.privateSource='';doc.body.classList.add('rv5-open');
  const main=el('main'),exit=el('button','Close saved review');exit.type='button';exit.onclick=()=>close();main.append(exit,el('h1','Saved Roadmap review'),el('p','Read and source-cited feedback only. No original answers, generation or processing requested.'));
  status=el('p','Checking the independent saved-review authorization…');status.setAttribute('role','status');main.append(status);
  resumeButton=el('button','Resume saved review');resumeButton.type='button';resumeButton.hidden=true;resumeButton.onclick=()=>void reconnect();main.append(resumeButton);view.append(main);doc.body.append(view);view.focus();
  opener=(async()=>{try{
   const rows=await request('list');if(e!==epoch)return;
   if(!Array.isArray(rows))throw failure('denied');status.textContent=rows.length?'Select the separately authorized saved revision.':'No active saved-review authorization for this account.';
   for(const row of rows){if(row.review_only!==true||row.revision!==2||typeof row.report_id!=='string')throw failure('denied');
    const choose=el('button','Read '+row.label);choose.type='button';main.append(choose);let loading=false;
    choose.onclick=async()=>{if(loading||e!==epoch||controller)return;loading=true;choose.disabled=true;const host=el('section');host.className='roadmap-processing';main.append(host);
     controller=root.RVA_ROADMAP_PROCESSING.mount(host,{report:row.report_id,reviewOnly:true,actorId:captured.userId,onReconnect:showReconnect,request:body=>{if(body.report!==row.report_id)throw failure('denied');return request(body.action,body.report,body.payload);},onError:()=>{if(e===epoch)status.textContent='Saved review unavailable or expired. No retry or processing was started.';}});
     await controller.start();if(e===epoch)loading=false;
    };
   }
  }catch{if(e===epoch){controller?.stop();status.textContent='Saved review unavailable. Check the current session and separate review window. No processing was requested.';}}
  finally{if(e===epoch)pending=false;opener=null;}})();return opener;
 }
 launch.onclick=open;const focus=()=>{if(!eligible())reset();};
 const keys=e=>{if(!view)return;if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Tab'){const items=[...view.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,summary')].filter(x=>x.getClientRects().length);if(!items.length)return;const first=items[0],last=items.at(-1);if(e.shiftKey&&(doc.activeElement===first||doc.activeElement===view)){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}}};
 const authSubscription=portal.authClient.auth.onAuthStateChange?.(renewal)?.data?.subscription;
 doc.addEventListener('ra:staff-access-reset',reset);doc.addEventListener('ra:permissions-loaded',initialize);win.addEventListener('pagehide',reset);win.addEventListener('focus',focus);doc.addEventListener('keydown',keys);initialize();
 return{open,close,reset,initialize,stop(){reset();authSubscription?.unsubscribe();launch.remove();doc.removeEventListener('ra:staff-access-reset',reset);doc.removeEventListener('ra:permissions-loaded',initialize);win.removeEventListener('pagehide',reset);win.removeEventListener('focus',focus);doc.removeEventListener('keydown',keys);}};
}
root.RVA_SAVED_ROADMAP_REVIEW=Object.freeze({createApp});
const env=root.RVA_ENV,portal=root.RA_PORTAL,panel=root.document?.getElementById('vitality-assessments-panel');
if(env?.environment==='production'&&env.projectRef==='voalfpxiyznnqfcqcymd'&&root.location.origin==='https://revitalizedacademy.com'&&portal?.authClient&&panel)createApp({portal,panel});
})(typeof window==='object'?window:globalThis);
