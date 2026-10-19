/* Additive source-scoped candidate launcher. Never searches for or chooses a participant. */
(function(){'use strict';let current=null;const close=()=>{current?.stop();current=null;};
 document.addEventListener('ra:staff-access-reset',close);document.addEventListener('ra:roadmap-source-closed',close);
 document.addEventListener('ra:roadmap-source-opened',event=>{
 close();const {report,host}=event.detail||{},portal=window.RA_PORTAL;
 if(!report||!host||!portal?.captureStaffSession()||portal.currentStaffRole?.()!=='owner')return;
 const section=document.createElement('section');section.className='roadmap-processing';
 const launch=document.createElement('button');launch.type='button';launch.textContent='Open authorized internal draft workflow';section.append(launch);(host.parentElement||host).append(section);
 const guard=portal.createAuthenticatedTaskGuard(),sessionTask=guard.begin();
 async function request(body,{signal}={}){
 if(!guard.current(sessionTask))throw Error('Signed out');
 const {data}=await portal.authClient.auth.getSession();if(!guard.current(sessionTask)||!data.session)throw Error('Session changed');
 const r=await fetch('/.netlify/functions/roadmap-processing',{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal,cache:'no-store',redirect:'error'});
 if(!guard.current(sessionTask)||!r.ok)throw Error('Unavailable');return r.json();
 }
 launch.addEventListener('click',async()=>{
 launch.disabled=true;const purpose=document.createElement('label'),box=document.createElement('input');box.type='checkbox';purpose.append(box,document.createTextNode(' I acknowledge separately authorized private internal draft storage and review. This is additional to the read-only pilot; operator approval is still required. No client delivery or exports.'));
 const attest=document.createElement('button');attest.type='button';attest.textContent='Record draft-processing purpose';attest.addEventListener('click',async()=>{if(!box.checked||attest.disabled)return;attest.disabled=true;try{await request({action:'attest',report,payload:{active:true,acknowledgment:'private_internal_draft_storage_review_separate_from_read_only_pilot_v1'}});attest.textContent='Purpose recorded; separate operator authorization required';}catch{attest.textContent='Purpose not recorded; check your authenticated authorization';attest.disabled=false;}});
 section.append(purpose,attest);const reportHost=document.createElement('section');section.append(reportHost);
 const controller=window.RVA_ROADMAP_PROCESSING.mount(reportHost,{report,request});current={stop(){guard.cancel();controller.stop();section.remove();}};await controller.start();
 });
 });
})();
