/* Additive source-scoped launcher. A successful HTTP response is not proof of consent. */
(function(){'use strict';let current=null;
 const close=()=>{current?.stop();current=null;};
 document.addEventListener('ra:staff-access-reset',close);
 document.addEventListener('ra:roadmap-source-closed',close);
 window.addEventListener('pagehide',close);
 document.addEventListener('ra:roadmap-source-opened',event=>{
 close();const {report,host}=event.detail||{},portal=window.RA_PORTAL;
 const staffSession=portal?.captureStaffSession();
 if(!report||!host||typeof staffSession?.userId!=='string'||portal.currentStaffRole?.()!=='owner')return;
 const section=document.createElement('section');section.className='roadmap-processing';
 const launch=document.createElement('button');launch.type='button';launch.textContent='Open authorized internal draft workflow';section.append(launch);
 // Keep actions/review outside the sticky answers + long manual-review grid.
 const sourceWorkspace=host.closest('.rv6-workspace');
 if(sourceWorkspace)sourceWorkspace.before(section);else(host.parentElement||host).append(section);
 section.setAttribute('aria-label','Authorized internal draft workflow');
 section.scrollIntoView?.({block:'start'});
 const guard=portal.createAuthenticatedTaskGuard(),sessionTask=guard.begin(),pending=new Set();let stopped=false,controller=null;
 const valid=()=>!stopped&&guard.current(sessionTask)&&portal.currentStaffRole?.()==='owner';
 const failure=state=>Object.assign(Error('Internal draft request not confirmed'),{state});
 current={stop(){if(stopped)return;stopped=true;guard.cancel();for(const abort of pending)abort.abort();pending.clear();controller?.stop();section.remove();}};
 async function request(body,{signal}={}){
 if(!valid())throw failure('expired');
 if(body.report!==report)throw failure('denied');
 const abort=new AbortController(),cancel=()=>abort.abort();pending.add(abort);signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)abort.abort();
 try{
 const {data}=await portal.authClient.auth.getSession();if(!valid()||!data?.session||data.session.user?.id!==staffSession.userId)throw failure('expired');
 const r=await fetch('/.netlify/functions/roadmap-processing',{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:abort.signal,cache:'no-store',redirect:'error'});
 if(!valid())throw failure('expired');
 if(!r.ok)throw failure(r.status===401?'expired':r.status===403?'denied':r.status===503?'unavailable':'failed');
 const result=await r.json();if(!valid())throw failure('expired');
 if(!result||typeof result!=='object'||Array.isArray(result))throw failure('failed');
 if(result.unavailable===true)throw failure('unavailable');
 return result;
 }finally{pending.delete(abort);signal?.removeEventListener('abort',cancel);}
 }
 launch.addEventListener('click',async()=>{
 if(!valid()||launch.disabled)return;launch.disabled=true;
 const purpose=document.createElement('label'),box=document.createElement('input');box.type='checkbox';purpose.append(box,document.createTextNode(' I acknowledge separately authorized private internal draft storage and review. This is additional to the read-only pilot; operator approval is still required. No client delivery or exports.'));
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.dataset.state='pending';status.textContent='Pending: no storage-purpose recording has been confirmed in this workspace.';
 const attest=document.createElement('button');attest.type='button';attest.textContent='Record draft-processing purpose';attest.disabled=true;
 box.addEventListener('change',()=>{if(valid()&&status.dataset.state!=='recorded'&&status.dataset.state!=='recording')attest.disabled=!box.checked;});
 attest.addEventListener('click',async()=>{
 if(!valid()||!box.checked||attest.disabled)return;
 attest.disabled=true;box.disabled=true;status.dataset.state='recording';status.textContent='Recording: waiting for server confirmation.';attest.setAttribute('aria-busy','true');
 try{
 const result=await request({action:'attest',report,payload:{active:true,acknowledgment:'private_internal_draft_storage_review_separate_from_read_only_pilot_v1'}});
 if(result.acknowledged!==true)throw failure('failed');
 if(!valid())return;
 status.dataset.state='recorded';status.textContent='Recorded: the server confirmed your source-specific storage-purpose acknowledgment. Separate operator authorization is still required.';
 attest.textContent='Purpose recorded; separate operator authorization required';
 }catch(error){
 if(!valid())return;
 const state=error.state||'failed';status.dataset.state=state;
 status.textContent=({unavailable:'Unavailable: the server did not confirm recording. Check B6 activation and source authorization with the operator before retrying.',denied:'Denied: your current account is not authorized to record this source purpose.',expired:'Session expired: sign in normally again before retrying. Recording is not confirmed.',failed:'Failed: recording could not be confirmed. A request may have reached the server; retrying the same source safely checks the idempotent recording contract.'})[state]||'Failed: recording is not confirmed.';
 box.disabled=false;attest.disabled=state==='expired'||!box.checked;
 }finally{if(valid())attest.removeAttribute('aria-busy');}
 });
 section.append(purpose,attest,status);const reportHost=document.createElement('section');section.append(reportHost);
 try{controller=window.RVA_ROADMAP_PROCESSING.mount(reportHost,{report,request});await controller.start();}catch{if(valid())reportHost.replaceChildren(document.createTextNode('Internal draft workflow unavailable. Check its separate operator authorization; your storage-purpose status is shown above.'));}
 });
 });
})();
