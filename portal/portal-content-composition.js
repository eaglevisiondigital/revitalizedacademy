(()=>{
  'use strict';
  const portal=window.RA_PORTAL;if(!portal?.authClient)return;
  const db=portal.authClient;
  const configs={
    'meal-plans':{title:'Build Meal Plan',table:'meal_plan_template_items',parent:'meal_plan_templates',fk:'template_id',catalog:'recipes',child:'recipe_id',fields:[['day_number','Day','number',1],['meal_slot','Meal','select','breakfast,lunch,dinner,snack,other'],['sort_order','Order','number',0]]},
    workouts:{title:'Build Workout',table:'workout_template_exercises',parent:'workout_templates',fk:'workout_id',catalog:'exercise_catalog',child:'exercise_id',fields:[['sets','Sets','number',1],['reps','Repetitions','text'],['duration_seconds','Duration (seconds)','number',0],['rest_seconds','Rest (seconds)','number',0],['sort_order','Order','number',0]]},
    fitness:{title:'Schedule Workouts',table:'fitness_program_workouts',parent:'fitness_programs',fk:'program_id',catalog:'workout_templates',child:'workout_id',fields:[['week_number','Week','number',1],['day_number','Day of week (1–7)','number',1]]}
  };
  let dialog=null, context=null, epoch=0, busy=false, editing=null, rows=[], choices=[];
  const allowed=()=>portal.hasPermission?.('learning.manage')===true;
  const valid=(token)=>token===epoch&&context&&allowed();
  const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  function close(){epoch++;context=null;editing=null;rows=[];choices=[];busy=false;dialog?.remove();dialog=null;}
  function status(message){const node=dialog?.querySelector('[role="status"]');if(node)node.textContent=message;}
  function field(name,label,type='text',value='',min){
    const wrapper=el('label'),caption=el('span',label),input=el(type==='select'?'select':type==='textarea'?'textarea':'input');
    input.name=name;
    if(type==='select')String(value).split(',').forEach(v=>{const o=el('option',v);o.value=v;input.append(o);});
    else {if(type!=='textarea')input.type=type;input.value=value??'';if(type==='number'){input.step='1';input.min=String(min??0);}}
    if(type==='text'||type==='textarea')input.maxLength=2000;
    wrapper.append(caption,input);return wrapper;
  }
  function render(){
    if(!context||!dialog)return;
    const {cfg,parent}=context;const list=dialog.querySelector('.beta-composition-list');list.replaceChildren();
    if(!rows.length)list.append(el('p','No items yet. Add published content below.'));
    rows.forEach(row=>{
      const article=el('article'),copy=el('div');
      const child=choices.find(c=>c.id===row[cfg.child]);copy.append(el('strong',child?.title||child?.name||'Content unavailable'));
      copy.append(el('p',cfg.fields.map(([key,label])=>row[key]===null||row[key]===undefined?'':label+': '+row[key]).filter(Boolean).join(' · ')));
      if(row.notes)copy.append(el('p',row.notes));
      const actions=el('div');
      for(const [label,fn]of [['Edit',()=>fill(row)],['Remove',()=>remove(row)]]){const button=el('button',label);button.type='button';button.addEventListener('click',fn);actions.append(button);}
      article.append(copy,actions);list.append(article);
    });
    const form=dialog.querySelector('form');form.replaceChildren();
    const selectField=field(cfg.child,'Published content','select','');const select=selectField.querySelector('select');select.required=true;select.replaceChildren(new Option('Choose content',''));
    choices.forEach(choice=>select.append(new Option(choice.title||choice.name,choice.id)));form.append(selectField);
    cfg.fields.forEach(([key,label,type,options])=>{
      const wrapper=field(key,label,type,type==='select'?options:type==='number'?key==='sort_order'?rows.length+1:options:'',typeof options==='number'?options:undefined);
      const input=wrapper.querySelector('input,select');if(['day_number','week_number'].includes(key))input.required=true;
      if(key==='day_number')input.max=String(cfg.table==='meal_plan_template_items'?parent.days_count:7);
      if(key==='week_number'&&parent.weeks)input.max=String(parent.weeks);
      form.append(wrapper);
    });
    form.append(field('notes','Notes','textarea'));
    const submit=el('button','Add Item');submit.type='submit';submit.className='primary-button';form.append(submit);
    const cancel=el('button','Cancel Edit');cancel.type='button';cancel.addEventListener('click',()=>{editing=null;render();});form.append(cancel);
    editing=null;
  }
  function fill(row){if(busy)return;editing=row;const form=dialog.querySelector('form');for(const [key,value]of Object.entries(row)){const input=form.elements.namedItem(key);if(input)input.value=value??'';}form.querySelector('[type="submit"]').textContent='Save Item';form.querySelector('select').focus();}
  async function load(token){
    const {cfg,parent}=context;
    const [items,catalog]=await Promise.all([db.from(cfg.table).select('*').eq(cfg.fk,parent.id).order(cfg.fields[0][0]),db.from(cfg.catalog).select('*').eq('methodology_id',parent.methodology_id).eq('status','published').order(cfg.catalog==='exercise_catalog'?'name':'title')]);
    if(!valid(token))return;
    if(items.error||catalog.error)throw items.error||catalog.error;
    rows=items.data||[];choices=catalog.data||[];render();
  }
  async function save(event){
    event.preventDefault();if(busy||!allowed()||!context)return;
    const token=epoch,{cfg,parent}=context,form=event.currentTarget,payload={[cfg.fk]:parent.id};
    for(const [key]of [[cfg.child],...cfg.fields,['notes']]){const input=form.elements.namedItem(key);payload[key]=input.type==='number'?(input.value===''?null:Number(input.value)):input.value.trim()||null;}
    if(!choices.some(c=>c.id===payload[cfg.child]))return status('Choose published content.');
    busy=true;status('Saving…');
    try{
      const query=editing?db.from(cfg.table).update(payload).eq('id',editing.id).eq(cfg.fk,parent.id):db.from(cfg.table).insert(payload);
      const {data,error}=await query.select('id');
      if(!valid(token))return;if(error)throw error;if(!data?.length)throw Error('Access changed. Reopen this builder.');
      await load(token);if(valid(token))status('Saved.');
    }catch(error){if(valid(token))status(error.message);}finally{if(token===epoch)busy=false;}
  }
  async function remove(row){
    if(busy||!context||!allowed())return;
    const token=epoch,{cfg,parent}=context;busy=true;
    try{const {error}=await db.from(cfg.table).delete().eq('id',row.id).eq(cfg.fk,parent.id);if(!valid(token))return;if(error)throw error;await load(token);if(valid(token))status('Item removed.');}
    catch(error){if(valid(token))status(error.message);}finally{if(token===epoch)busy=false;}
  }
  async function open(key,row){
    close();if(!configs[key]||!allowed())return;const token=epoch,cfg=configs[key];
    dialog=el('dialog');dialog.className='beta-composition';dialog.setAttribute('aria-label',cfg.title);
    const heading=el('h2',cfg.title),closeButton=el('button','Close');closeButton.type='button';closeButton.addEventListener('click',close);
    const list=el('div');list.className='beta-composition-list';const form=el('form');form.addEventListener('submit',save);const notice=el('p','Loading…');notice.setAttribute('role','status');
    dialog.append(closeButton,heading,el('p',row.title||row.name),list,form,notice);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('click',event=>{if(event.target===dialog)close();});document.body.append(dialog);dialog.showModal();
    try{const {data,error}=await db.from(cfg.parent).select('*').eq('id',row.id).single();if(token!==epoch||!allowed())return;if(error)throw error;context={cfg,parent:data};await load(token);if(valid(token))status('Changes are saved to this reusable content. Assignments use the existing client plan workflow.');}
    catch(error){if(token===epoch)status(error.message);}
  }
  document.addEventListener('ra:staff-access-reset',close);
  window.RA_CONTENT_COMPOSITION={open,close};
})();
