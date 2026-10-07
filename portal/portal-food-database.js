(()=>{
 'use strict';
 const portal=window.RA_PORTAL;if(!portal?.authClient)return;
 const client=portal.authClient;let modal,epoch=0,busy=false,filter='all',onSelect=null,methodology=null,returnFocus=null;
 const author=()=>portal.hasPermission?.('learning.manage')===true;
 const admin=()=>author()&&['owner','admin'].includes(portal.currentStaffRole?.());
 function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
 function button(text,action){const n=el('button',text);n.type='button';n.addEventListener('click',action);return n;}
 function source(food){return food.provider==='usda_fdc'?(food.source_data_type==='Branded'?'Branded Database Food':'USDA Database Food'):'ReVitalized Custom Food';}
 function status(message){const n=modal?.querySelector('[data-food-status]');if(n)n.textContent=message;}
 async function api(body){
   const {data,error}=await client.auth.getSession();if(error||!data?.session?.access_token)throw Error('Please sign in again.');
   const response=await fetch('/.netlify/functions/food-database',{method:'POST',headers:{Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Food database unavailable');return result;
 }
 function close(){epoch++;busy=false;modal?.remove();modal=null;onSelect=null;methodology=null;returnFocus?.focus();returnFocus=null;}
 async function operation(action){if(busy||!author())return;busy=true;const token=epoch;try{await action(token);}catch(e){if(token===epoch)status(e.message);}finally{if(token===epoch)busy=false;}}
 async function open(options={}){
   if(!author())return;close();returnFocus=document.activeElement;onSelect=options.onSelect||null;methodology=options.methodologyId||null;
   modal=el('div');modal.className='food-database-modal';
   const backdrop=el('div');backdrop.className='food-database-backdrop';backdrop.addEventListener('click',close);
   const dialog=el('section');dialog.className='food-database-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','food-database-heading');
   const heading=el('h2','Search Food Database');heading.id='food-database-heading';
   dialog.append(button('Close',close),heading,el('p','USDA FoodData Central · Match the ingredient and preparation. Nutrients are per 100 g. Missing values stay unknown.'));
   const form=el('form');form.className='food-database-search';
   const query=el('input');query.type='search';query.required=true;query.minLength=2;query.maxLength=120;query.placeholder='apple, almond butter…';query.setAttribute('aria-label','Food name');
   const mode=el('select');mode.setAttribute('aria-label','Database food type');for(const [v,t]of [['generic','Generic / whole foods'],['branded','Branded products'],['all','All USDA types']]){const o=el('option',t);o.value=v;mode.append(o);}
   const search=el('button','Search');search.type='submit';form.append(query,mode,search);
   const method=el('select');method.required=true;method.setAttribute('aria-label','Import into existing nutrition methodology');method.append(el('option','Choose nutrition methodology'));method.firstChild.value='';method.hidden=Boolean(methodology);
   const results=el('div');results.className='food-database-results';
   const message=el('p');message.setAttribute('data-food-status','');message.setAttribute('aria-live','polite');dialog.append(form,method,results,message);modal.append(backdrop,dialog);document.body.append(modal);
   modal.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('button,input,select')].filter(n=>!n.disabled&&!n.hidden);if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus();}}});
   form.addEventListener('submit',e=>{e.preventDefault();operation(async token=>{
     status('Searching USDA…');const result=await api({action:'search',query:query.value,mode:mode.value});if(token!==epoch)return;results.replaceChildren();
     const local=await client.from('food_catalog').select('id,fdc_id,revitalized_approved').eq('provider','usda_fdc');if(token!==epoch)return;if(local.error)throw local.error;
     for(const food of result.foods){
       const row=el('article');row.className='food-database-result';row.append(el('strong',food.name),el('p',[food.type,food.brand,food.serving,food.publication].filter(Boolean).join(' · ')));
       if(local.data?.find(f=>f.fdc_id===food.fdcId)?.revitalized_approved)row.append(el('span','★ ReVitalized Approved'));
       row.append(button('View portions & select',()=>operation(async token=>{
         status('Loading source portions…');const result=await api({action:'details',ids:[food.fdcId]});if(token!==epoch)return;const detail=result.foods[0];row.querySelector('[data-food-detail]')?.remove();
         const preview=el('div');preview.setAttribute('data-food-detail','');preview.append(el('p','100 g nutrient basis · '+Object.keys(detail.nutrition).length+' available nutrients'));
         preview.append(el('p',detail.source_portions.map(p=>p.amount+' '+p.description+' = '+p.gram_weight+' g').join(' · ')||'No common portion weights supplied. Use grams or ounces.'));
         preview.append(button('Use this food',()=>operation(async token=>{
           const methodId=methodology||method.value;if(!methodId){status('Choose a nutrition methodology first.');return;}
           status('Importing food…');const selected=await api({action:'import',fdcId:food.fdcId,methodologyId:methodId});if(token!==epoch)return;const callback=onSelect;close();await window.RA_PROGRAM_CONTENT?.reload();await callback?.(selected.food);
         })));row.append(preview);status('Use a matching source portion or explicit gram weight in your recipe.');
       })));results.append(row);
     }
     status(result.foods.length?'Select a matching food. Generic results precede branded products.':'No matches. Try another term or create a custom food.');
   });});
   const token=epoch;query.focus();
   if(!methodology){const r=await client.from('nutrition_methodologies').select('id,name').order('name');if(token!==epoch)return;if(r.error){status(r.error.message);return;}for(const m of r.data||[]){const o=el('option',m.name);o.value=m.id;method.append(o);}}
 }
 function confirmSourceRefresh(row){
   if(!admin()||busy)return;
   const origin=document.activeElement;close();returnFocus=origin;
   modal=el('div');modal.className='food-database-modal';
   const backdrop=el('div');backdrop.className='food-database-backdrop';backdrop.addEventListener('click',close);
   const dialog=el('section');dialog.className='food-database-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','food-refresh-heading');
   const heading=el('h2','Refresh USDA Source Data');heading.id='food-refresh-heading';
   const cancel=button('Cancel',close);
   const confirm=button('Confirm Source Refresh',()=>operation(async token=>{
     if(!admin())throw Error('Owner/Admin required to refresh');
     confirm.disabled=true;status('Refreshing USDA source data…');
     try{
       await api({action:'refresh',fdcId:row.fdc_id,methodologyId:row.methodology_id});
       if(token!==epoch)return;
       close();await window.RA_PROGRAM_CONTENT?.reload();
       portal.showStatus(document.getElementById('food-library-status'),'USDA source refreshed. Existing recipe snapshots are unchanged.','success');
     }finally{confirm.disabled=false;}
   }));
   const message=el('p');message.setAttribute('data-food-status','');message.setAttribute('aria-live','polite');
   dialog.append(heading,el('p',row.name),el('p','Refresh this food from USDA? Recipe snapshots remain unchanged until explicitly recalculated.'),cancel,confirm,message);
   modal.append(backdrop,dialog);document.body.append(modal);
   modal.addEventListener('keydown',e=>{
     if(e.key==='Escape')close();
     if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('button')].filter(n=>!n.disabled);if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus();}}
   });cancel.focus();
 }
 function matches(food){return filter==='all'||filter==='approved'&&food.revitalized_approved||filter==='usda'&&food.provider==='usda_fdc'&&food.source_data_type!=='Branded'||filter==='branded'&&food.source_data_type==='Branded'||filter==='custom'&&!food.provider;}
 function tools(active){
   let root=document.getElementById('food-database-tools');if(!root){root=el('div');root.id='food-database-tools';root.className='food-database-tools';document.getElementById('program-content-list')?.before(root);}
   root.hidden=active!=='foods';root.replaceChildren();if(active!=='foods')return;
   const selector=el('select');selector.setAttribute('aria-label','Filter foods');for(const [v,t]of [['all','All Foods'],['approved','★ ReVitalized Approved'],['usda','USDA'],['branded','Branded'],['custom','Custom']]){const o=el('option',t);o.value=v;selector.append(o);}selector.value=filter;selector.addEventListener('change',()=>{filter=selector.value;window.RA_PROGRAM_CONTENT?.render();});root.append(selector);
   if(author())root.append(button('Search Food Database',()=>open()));
   const message=el('p');message.id='food-library-status';message.setAttribute('aria-live','polite');root.append(message);
 }
 function decorate(row,copy,actions){
   copy.append(el('small',source(row)+(row.revitalized_approved?' · ★ ReVitalized Approved':'')));
   if(!admin())return;
   const report=e=>portal.showStatus(document.getElementById('food-library-status'),e.message,'error');
   actions.append(button(row.revitalized_approved?'Unmark Approved':'★ Mark ReVitalized Approved',async()=>{try{const r=await client.rpc('set_food_revitalized_approved',{p_food:row.id,p_approved:!row.revitalized_approved});if(r.error)throw r.error;await window.RA_PROGRAM_CONTENT?.reload();}catch(e){report(e);}}));
   if(row.provider==='usda_fdc')actions.append(button('Refresh from Source',()=>confirmSourceRefresh(row)));
 }
 document.addEventListener('ra:staff-access-reset',()=>{close();filter='all';document.getElementById('food-database-tools')?.remove();});
 window.RA_FOOD_DATABASE={open,close,source,matches,tools,decorate};window.RA_PROGRAM_CONTENT?.render();
})();
