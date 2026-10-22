/* Independent saved-version review. No original-answer read or processing endpoint. */
(function(root){'use strict';
function createApp({portal,panel}){
 const doc=panel.ownerDocument,win=doc.defaultView;
 const el=(tag,text)=>{const e=doc.createElement(tag);if(text)e.textContent=text;return e;};
 const launch=el('button','Saved Roadmap review');launch.type='button';launch.className='rv5-launch';launch.hidden=true;
 (panel.querySelector('.panel-heading')||panel).prepend(launch);
 let view=null,controller=null,epoch=0,pending=false,returnFocus=null,opener=null;
 const guard=portal.createAuthenticatedTaskGuard();let captured=null,task=null;
 const eligible=()=>portal.captureStaffSession()&&portal.currentStaffRole?.()==='owner'&&portal.hasPermission?.('health.private.view')&&portal.hasPermission?.('crm.view');
 function close(){epoch++;guard.cancel();controller?.stop();controller=null;view?.remove();view=null;if(!doc.querySelector('.rv5-dialog'))doc.body.classList.remove('rv5-open');pending=false;if(returnFocus?.isConnected&&eligible())returnFocus.focus();returnFocus=null;}
 function reset(){close();launch.hidden=true;captured=null;task=null;}
 async function request(action,report=null,payload={}){
 if(!['list','read','review'].includes(action)||!eligible()||!captured||!guard.current(task))throw Error('Saved review unavailable');
 const e=epoch,{data,error}=await portal.authClient.auth.getSession();
 if(error||e!==epoch||!guard.current(task)||data?.session?.user?.id!==captured.userId)throw Error('Session unavailable');
 const result=await portal.authClient.rpc('roadmap_saved_review',{p_action:action,p_report:report,p_payload:payload});
 if(result.error||e!==epoch||!guard.current(task)||portal.captureStaffSession()?.userId!==captured.userId||!eligible())throw Error('Saved review unavailable');
 return result.data;
 }
 function initialize(){reset();if(eligible())launch.hidden=false;}
 async function open(){
 if(pending||!eligible())return;if(opener)return opener;
 close();returnFocus=doc.activeElement;captured=portal.captureStaffSession();task=guard.begin();const e=epoch;pending=true;
 view=el('section');view.className='rv5-dialog rv6-dialog';view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('aria-label','Saved Roadmap review');view.tabIndex=-1;view.dataset.privateSource='';doc.body.classList.add('rv5-open');
 const main=el('main'),exit=el('button','Close saved review');exit.type='button';exit.onclick=close;main.append(exit,el('h1','Saved Roadmap review'),el('p','Read and source-cited feedback only. No original answers, generation or processing requested.'));
 const status=el('p','Checking the independent saved-review authorization…');status.setAttribute('role','status');main.append(status);view.append(main);doc.body.append(view);view.focus();
 opener=(async()=>{try{
 const rows=await request('list');if(e!==epoch)return;
 if(!Array.isArray(rows))throw Error('Unavailable');status.textContent=rows.length?'Select the separately authorized saved revision.':'No active saved-review authorization for this account.';
 for(const row of rows){if(row.review_only!==true||row.revision!==2||typeof row.report_id!=='string')throw Error('Unavailable');
 const choose=el('button','Read '+row.label);choose.type='button';main.append(choose);let loading=false;
 choose.onclick=async()=>{if(loading||e!==epoch)return;loading=true;choose.disabled=true;controller?.stop();const host=el('section');host.className='roadmap-processing';main.append(host);
 controller=root.RVA_ROADMAP_PROCESSING.mount(host,{report:row.report_id,reviewOnly:true,request:body=>{if(body.report!==row.report_id)throw Error('Wrong source');return request(body.action,body.report,body.payload);},onError:()=>{status.textContent='Saved review unavailable or expired. No retry or processing was started.';}});
 await controller.start();if(e===epoch){loading=false;choose.disabled=false;}
 };
 }
 }catch{if(e===epoch){controller?.stop();status.textContent='Saved review unavailable. Check the current session and separate review window. No processing was requested.';}}
 finally{if(e===epoch)pending=false;opener=null;}})();return opener;
 }
 launch.onclick=open;const focus=()=>{if(!eligible())reset();};
 const keys=e=>{if(!view)return;if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Tab'){const items=[...view.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,summary')].filter(x=>x.getClientRects().length);if(!items.length)return;const first=items[0],last=items.at(-1);if(e.shiftKey&&(doc.activeElement===first||doc.activeElement===view)){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}}};
 doc.addEventListener('ra:staff-access-reset',reset);doc.addEventListener('ra:permissions-loaded',initialize);win.addEventListener('pagehide',reset);win.addEventListener('focus',focus);doc.addEventListener('keydown',keys);initialize();
 return{open,close,reset,initialize,stop(){reset();launch.remove();doc.removeEventListener('ra:staff-access-reset',reset);doc.removeEventListener('ra:permissions-loaded',initialize);win.removeEventListener('pagehide',reset);win.removeEventListener('focus',focus);doc.removeEventListener('keydown',keys);}};
}
root.RVA_SAVED_ROADMAP_REVIEW=Object.freeze({createApp});
const env=root.RVA_ENV,portal=root.RA_PORTAL,panel=root.document?.getElementById('vitality-assessments-panel');
if(env?.environment==='production'&&env.projectRef==='voalfpxiyznnqfcqcymd'&&root.location.origin==='https://revitalizedacademy.com'&&portal?.authClient&&panel)createApp({portal,panel});
})(typeof window==='object'?window:globalThis);
