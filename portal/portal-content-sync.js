(()=>{
 'use strict';const portal=window.RA_PORTAL;if(!portal?.authClient)return;
 const client=portal.authClient,types={'nutrition-methodology':'nutrition_methodologies','fitness-methodology':'fitness_methodologies',foods:'food_catalog',recipes:'recipes','meal-plans':'meal_plan_templates',exercises:'exercise_catalog',workouts:'workout_templates',fitness:'fitness_programs'};
 let selected=new Map(),modal=null,epoch=0,busy=false,pendingJob=null,sources=[];
 const production=()=>window.RVA_PUBLIC_CONFIG?.environment==='production'&&location.origin==='https://revitalizedacademy.com';
 const allowed=()=>production()&&portal.hasPermission?.('learning.manage')===true&&['owner','admin'].includes(portal.currentStaffRole?.());
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 function close(){epoch++;modal?.remove();modal=null;busy=false;pendingJob=null;}
 function button(text,fn){const n=el('button',text);n.type='button';n.addEventListener('click',fn);return n;}
 function updateCount(){const n=document.getElementById('content-sync-selected');if(n){n.textContent='Sync Selected to Beta ('+selected.size+')';n.disabled=selected.size===0;}}
 function open(records){
   if(!allowed())return;close();const revision=epoch;
   modal=el('div');modal.className='food-database-modal';const backdrop=el('div');backdrop.className='food-database-backdrop';backdrop.addEventListener('click',close);
   const dialog=el('section');dialog.className='food-database-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','content-sync-heading');
   const heading=el('h2','Sync Reusable Content to Beta');heading.id='content-sync-heading';const message=el('p');message.setAttribute('aria-live','polite');
   const send=button('Confirm Sync to Beta',async()=>{
     if(busy||!allowed())return;busy=true;send.disabled=true;message.textContent='Copying content and required dependencies to Beta…';
     try{
       const session=await client.auth.getSession();if(session.error||!session.data?.session?.access_token)throw Error('Please sign in again.');
       const response=await fetch('/.netlify/functions/reusable-content-sync',{method:'POST',headers:{Authorization:'Bearer '+session.data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(pendingJob?{jobId:pendingJob}:{records:records.map(({type,id})=>({type,id}))})});const result=await response.json();
       if(revision!==epoch)return;if(result.jobId)pendingJob=result.jobId;
       if(!response.ok)throw Error(result.error||'Sync could not be confirmed.');
       if(result.status!=='complete'){message.textContent=result.message;send.textContent='Confirm Pending Sync';return;}
       selected.clear();updateCount();message.textContent=result.message+' '+result.records+' content records copied. No clients, health data, assignments or payments were transferred.';send.hidden=true;pendingJob=null;
     }catch(e){if(revision===epoch){message.textContent=e.message;send.textContent=pendingJob?'Retry Pending Sync':'Retry Sync to Beta';}}
     finally{if(revision===epoch){busy=false;send.disabled=false;}}
   });
   const names=el('ul');for(const row of records)names.append(el('li',row.name||row.type));
   const cancel=button('Close',close);dialog.append(heading,names,el('p','Production → Beta only. Required foods, recipes, exercises and methodology definitions are included. Existing synced beta copies will be updated; production wins over beta edits. Client and private operational data is excluded.'),send,cancel,message);modal.append(backdrop,dialog);document.body.append(modal);send.focus();
   modal.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const buttons=[...dialog.querySelectorAll('button')].filter(n=>!n.disabled&&!n.hidden);if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0]?.focus();}}});
 }
 function tools(){
   let n=document.getElementById('content-sync-tools');if(!n){n=el('div');n.id='content-sync-tools';n.className='food-database-tools';document.getElementById('program-content-list')?.before(n);}n.replaceChildren();n.hidden=!allowed();if(!allowed()){selected.clear();return;}
   const b=button('Sync Selected to Beta',()=>open([...selected.values()]));b.id='content-sync-selected';n.append(b);updateCount();
 }
 function decorate(key,row,copy,actions){
   const type=types[key];if(!type)return;
   if(!production()){
     const origin=sources.find(s=>s.content_type===type&&s.target_id===row.id);if(origin){const label=el('small','Synced from Production · '+new Date(origin.synced_at).toLocaleString());label.className='production-sync-label';copy.append(label);}return;
   }
   if(!allowed())return;const record={type,id:row.id,name:row.title||row.name||type};
   const choose=el('input');choose.type='checkbox';choose.checked=selected.has(type+':'+row.id);choose.setAttribute('aria-label','Select '+record.name+' for Beta sync');choose.addEventListener('change',()=>{if(choose.checked)selected.set(type+':'+row.id,record);else selected.delete(type+':'+row.id);updateCount();});
   actions.append(choose,button('Sync to Beta',()=>open([record])));
 }
 async function loadSources(){const token=++epoch;if(production()){sources=[];return;}const result=await client.from('production_content_sources').select('content_type,target_id,source_id,source_version,source_updated_at,synced_at');if(token!==epoch)return;sources=result.error?[]:result.data||[];window.RA_PROGRAM_CONTENT?.render();}
 document.addEventListener('ra:staff-access-reset',()=>{close();selected.clear();sources=[];document.getElementById('content-sync-tools')?.remove();});
 document.addEventListener('ra:permissions-changed',()=>{if(!allowed()){close();selected.clear();}window.RA_PROGRAM_CONTENT?.render();});
 window.RA_CONTENT_SYNC={tools,decorate,loadSources};loadSources();window.RA_PROGRAM_CONTENT?.render();
})();
