(()=>{
  'use strict';
  const client=window.RA_MEMBER_CLIENT;if(!client)return;
  let generation=0,context=null,dialog=null;
  const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  function close(){generation++;dialog?.remove();dialog=null;}
  function reset(){close();context=null;}
  function accept(event){reset();const c=event.detail?.healthContext;if(c?.contactId&&c?.userId)context={contactId:c.contactId,userId:c.userId};}
  function line(root,label,value){if(value===null||value===undefined||value==='')return;root.append(node('p',label+String(value)));}
  async function open(kind,id){
    if(!context||!['meal','workout'].includes(kind)||!id)return;
    close();const token=generation,owner=context;
    dialog=node('dialog');dialog.className='rm-assigned-detail';dialog.setAttribute('aria-label',kind==='meal'?'Assigned meal':'Assigned workout');
    const dismiss=node('button','Close');dismiss.type='button';dismiss.addEventListener('click',close);
    const content=node('section');content.setAttribute('aria-live','polite');content.append(node('p','Loading your assignment…'));
    dialog.append(dismiss,content);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{if(e.target===dialog)close();});document.body.append(dialog);dialog.showModal();
    try{
      const {data,error}=await client.rpc('get_my_assigned_'+kind,{p_assignment_id:id});
      if(token!==generation||context!==owner)return;
      if(error)throw error;if(!data)throw Error('This assignment is unavailable.');
      content.replaceChildren(node('h2',data.title||'Your assignment'));
      line(content,'Scheduled: ',data.scheduled_date);line(content,'',data.description);line(content,'',data.instructions);line(content,'Coach note: ',data.notes);
      if(kind==='meal'){
        line(content,'Recipe servings: ',data.servings);
        content.append(node('h3','Ingredients'));
        const ingredients=data.ingredients||[];
        if(!ingredients.length)content.append(node('p','Ingredient details have not been provided.'));
        const list=node('ul');ingredients.forEach(item=>{const li=node('li',[item.quantity??'',item.unit||'',item.ingredient||'Ingredient'].filter(v=>v!=='').join(' '));line(li,'',item.notes);list.append(li);});content.append(list);
      }else{
        line(content,'Duration (minutes): ',data.duration_minutes);
        const exercises=data.exercises||[];if(!exercises.length)content.append(node('p','Exercise details have not been provided.'));
        exercises.forEach((exercise,index)=>{const item=node('article');item.append(node('h3',(index+1)+'. '+exercise.name));line(item,'',exercise.instructions);line(item,'Sets: ',exercise.sets);line(item,'Repetitions: ',exercise.reps);line(item,'Duration (seconds): ',exercise.duration_seconds);line(item,'Rest (seconds): ',exercise.rest_seconds);line(item,'',exercise.notes);content.append(item);});
      }
    }catch(error){if(token===generation&&context===owner)content.replaceChildren(node('p',error.message||'Assignment could not be loaded.'));}
  }
  document.addEventListener('ra:member-access-reset',reset);
  document.addEventListener('ra:member-dashboard-loaded',accept);
  document.addEventListener('ra:member-health-context',accept);
  document.addEventListener('ra:member-assignment-open',e=>void open(e.detail?.kind,e.detail?.id));
})();
