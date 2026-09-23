(() => {
  const URL='https://voalfpxiyznnqfcqcymd.supabase.co';
  const KEY='sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd';
  const sb=window.supabase.createClient(URL,KEY);
  const authView=document.getElementById('admin-auth');
  const app=document.getElementById('admin-app');
  const tbody=document.getElementById('admin-people-body');
  const empty=document.getElementById('admin-empty');
  const search=document.getElementById('admin-search');
  const filter=document.getElementById('admin-filter');
  const drawer=document.getElementById('person-drawer');
  const backdrop=document.getElementById('person-backdrop');
  let people=[], currentPerson=null, staff=null, currentUser=null;

  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const pretty=(v)=>String(v||'not started').replaceAll('_',' ');
  const valueText=(v)=>{
    if(v===null||v===undefined||v==='') return 'Not provided';
    if(typeof v==='object') return Array.isArray(v)?v.join(', '):JSON.stringify(v);
    return String(v);
  };
  const date=(v)=>v?new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';

  async function sessionCheck(){
    const {data:{session}}=await sb.auth.getSession();
    if(!session){ showAuth(); return; }
    currentUser=session.user;
    const {data,error}=await sb.from('staff_access').select('*').eq('user_id',session.user.id).maybeSingle();
    if(error||!data){
      await sb.auth.signOut();
      document.getElementById('admin-auth-status').textContent='This account is not yet approved for team access.';
      showAuth(); return;
    }
    staff=data;
    showApp();
    await loadAll();
  }

  function showAuth(){authView.hidden=false;app.hidden=true}
  function showApp(){
    authView.hidden=true;app.hidden=false;
    document.getElementById('admin-display-name').textContent=staff.display_name||currentUser.email;
    document.getElementById('admin-role-label').textContent=pretty(staff.role);
    const h=new Date().getHours();
    document.getElementById('dashboard-title').textContent=(h<12?'Good morning.':h<17?'Good afternoon.':'Good evening.');
  }

  document.getElementById('admin-login-form').addEventListener('submit',async e=>{
    e.preventDefault(); const status=document.getElementById('admin-auth-status'); status.textContent='Signing in...';
    const {error}=await sb.auth.signInWithPassword({email:document.getElementById('admin-email').value,password:document.getElementById('admin-password').value});
    if(error){status.textContent=error.message;return} status.textContent=''; await sessionCheck();
  });
  document.getElementById('admin-signout').addEventListener('click',async()=>{await sb.auth.signOut();location.reload()});
  document.getElementById('admin-refresh').addEventListener('click',loadAll);

  async function loadAll(){
    const [{data:metrics,error:mErr},{data:list,error:pErr},{data:queue,error:qErr},{data:tasks,error:tErr}]=await Promise.all([
      sb.from('admin_dashboard_metrics').select('*').maybeSingle(),
      sb.from('admin_contact_overview').select('*').order('updated_at',{ascending:false}).limit(500),
      sb.from('admin_followup_queue').select('*').limit(8),
      sb.from('admin_due_tasks').select('*').limit(8)
    ]);
    if(mErr||pErr||qErr||tErr){console.error(mErr||pErr||qErr||tErr);return}
    people=list||[];
    if(metrics){
      document.querySelectorAll('[data-metric]').forEach(el=>el.textContent=metrics[el.dataset.metric]??0);
      document.querySelectorAll('[data-summary]').forEach(el=>el.textContent=metrics[el.dataset.summary]??0);
      const confirmed=Number(metrics.webinar_confirmed||0),capacity=50;
      document.getElementById('admin-webinar-open').textContent=Math.max(0,capacity-confirmed);
      document.getElementById('admin-seat-bar').style.width=Math.min(100,(confirmed/capacity)*100)+'%';
    }
    renderAttention(queue||[],tasks||[]);
    render();
  }

  function renderAttention(queue,tasks){
    const host=document.getElementById('admin-attention-list');
    const merged=[];
    tasks.forEach(t=>merged.push({type:'task',id:t.contact_id,title:t.title,name:[t.first_name,t.last_name].filter(Boolean).join(' ')||t.email||'Contact',detail:t.due_at?'Due '+date(t.due_at):pretty(t.priority)+' priority'}));
    queue.forEach(q=>merged.push({type:'person',id:q.id,title:pretty(q.follow_up_status),name:[q.first_name,q.last_name].filter(Boolean).join(' ')||q.email||'Contact',detail:q.next_follow_up_at?'Follow up '+date(q.next_follow_up_at):pretty(q.consultation_status)}));
    const unique=[];const seen=new Set();
    merged.forEach(x=>{const k=x.type+':'+x.id+':'+x.title;if(!seen.has(k)){seen.add(k);unique.push(x)}});
    host.innerHTML=unique.slice(0,6).length?unique.slice(0,6).map(x=>`<button class="ra-attention-item" data-attention-id="${x.id}"><span><b>${esc(x.name)}</b><small>${esc(x.title)} • ${esc(x.detail)}</small></span><em>Open →</em></button>`).join(''):'<div class="ra-attention-clear"><strong>All clear.</strong><span>No follow-ups need immediate attention.</span></div>';
    host.querySelectorAll('[data-attention-id]').forEach(b=>b.addEventListener('click',()=>openPerson(b.dataset.attentionId)));
  }

  function matchesFilter(p,f){
    if(f==='all')return true;
    if(f==='assessment')return !!p.vitality_status;
    if(f==='webinar')return !!p.webinar_status;
    if(f==='enrollment')return !!p.enrollment_status;
    if(f==='client')return p.lifecycle_stage==='client';
    if(f==='refuel')return !!p.refuel_status && p.refuel_status!=='unsubscribed';
    return true;
  }

  function render(){
    const q=search.value.trim().toLowerCase(), f=filter.value;
    const rows=people.filter(p=>matchesFilter(p,f)&&(!q||[p.first_name,p.last_name,p.email,p.phone].join(' ').toLowerCase().includes(q)));
    tbody.innerHTML=rows.map(p=>{
      const name=((p.first_name||'')+' '+(p.last_name||'')).trim()||'Unnamed contact';
      return `<tr>
        <td class="ra-person-cell"><strong>${esc(name)}</strong><span>${esc(p.email||p.phone||'No contact information')}</span></td>
        <td><span class="ra-status ${p.lifecycle_stage==='client'?'green':''}">${esc(pretty(p.lifecycle_stage))}</span></td>
        <td class="ra-progress-cell">${p.vitality_status?'<span class="ra-status">'+esc(pretty(p.vitality_status))+'</span><div class="ra-progress-mini"><i style="width:'+Number(p.vitality_completion||0)+'%"></i></div>':'—'}</td>
        <td>${p.webinar_status?'<span class="ra-status gold">'+esc(pretty(p.webinar_status))+'</span>':'—'}</td>
        <td>${p.refuel_status?'<span class="ra-status refuel">'+esc(pretty(p.refuel_status))+'</span>':'—'}</td>
        <td class="ra-progress-cell">${p.enrollment_status?'<span class="ra-status">'+esc(pretty(p.enrollment_status))+'</span><div class="ra-progress-mini"><i style="width:'+Number(p.enrollment_completion||0)+'%"></i></div>':'—'}</td>
        <td>${date(p.updated_at)}</td>
        <td><button class="ra-view-person" data-id="${p.id}">Open</button></td>
      </tr>`;
    }).join('');
    empty.hidden=rows.length>0;
    tbody.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>openPerson(b.dataset.id)));
  }

  search.addEventListener('input',render); filter.addEventListener('change',render);
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter.value=b.dataset.filter;render()}));

  async function openPerson(id){
    currentPerson=people.find(p=>p.id===id); if(!currentPerson)return;
    const name=((currentPerson.first_name||'')+' '+(currentPerson.last_name||'')).trim()||'Unnamed contact';
    document.getElementById('person-name').textContent=name;
    document.getElementById('person-contact').textContent=[currentPerson.email,currentPerson.phone,[currentPerson.city,currentPerson.state].filter(Boolean).join(', ')].filter(Boolean).join(' • ');
    document.getElementById('person-stage').innerHTML='<span class="ra-status '+(currentPerson.lifecycle_stage==='client'?'green':'')+'">'+esc(pretty(currentPerson.lifecycle_stage))+'</span>';
    document.getElementById('person-vitality-status').textContent=pretty(currentPerson.vitality_status||'Not started');
    document.getElementById('person-vitality-percent').textContent=(currentPerson.vitality_completion||0)+'%';
    document.getElementById('person-vitality-bar').style.width=(currentPerson.vitality_completion||0)+'%';
    document.getElementById('person-webinar-status').textContent=pretty(currentPerson.webinar_status||'Not registered');
    document.getElementById('person-webinar-detail').textContent=currentPerson.webinar_registered_at?'Registered '+date(currentPerson.webinar_registered_at):'';
    document.getElementById('person-enrollment-status').textContent=pretty(currentPerson.enrollment_status||'Not started');
    document.getElementById('person-enrollment-percent').textContent=(currentPerson.enrollment_completion||0)+'%';
    document.getElementById('person-enrollment-bar').style.width=(currentPerson.enrollment_completion||0)+'%';
    document.getElementById('person-refuel-status').textContent=pretty(currentPerson.refuel_status||'Not interested yet');
    document.getElementById('person-refuel-detail').textContent=currentPerson.refuel_joined_at?'Joined '+date(currentPerson.refuel_joined_at):'';
    document.getElementById('person-email-link').href=currentPerson.email?'mailto:'+encodeURIComponent(currentPerson.email):'#';
    document.getElementById('person-email-link').classList.toggle('is-disabled',!currentPerson.email);
    document.getElementById('person-phone-link').href=currentPerson.phone?'tel:'+currentPerson.phone.replace(/[^+0-9]/g,''):'#';
    document.getElementById('person-phone-link').classList.toggle('is-disabled',!currentPerson.phone);
    backdrop.hidden=false;drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');
    await loadPersonData(id);
  }

  async function loadPersonData(contactId){
    const [{data:facts},{data:workflows},{data:notes},{data:tags},{data:activity},{data:tasks}]=await Promise.all([
      sb.from('canonical_facts').select('*').eq('contact_id',contactId).order('updated_at',{ascending:false}),
      sb.from('workflow_records').select('id,workflow_type').eq('contact_id',contactId).neq('status','abandoned'),
      sb.from('contact_notes').select('*').eq('contact_id',contactId).order('created_at',{ascending:false}),
      sb.from('contact_tags').select('*').eq('contact_id',contactId).order('created_at',{ascending:true}),
      sb.from('contact_activity').select('*').eq('contact_id',contactId).order('created_at',{ascending:false}).limit(40),
      sb.from('follow_up_tasks').select('*').eq('contact_id',contactId).order('created_at',{ascending:false})
    ]);
    document.getElementById('person-facts').innerHTML=(facts||[]).length?(facts||[]).map(f=>`<div class="ra-fact"><b>${esc(pretty(f.field_key))}</b><span>${esc(valueText(f.value))}</span></div>`).join(''):'<div class="ra-fact"><span>No shared facts saved yet.</span></div>';
    const ids=(workflows||[]).map(w=>w.id);
    let answers=[];
    if(ids.length){const r=await sb.from('workflow_answers').select('*').in('workflow_id',ids).order('updated_at',{ascending:false}).limit(30);answers=r.data||[]}
    document.getElementById('person-answers').innerHTML=answers.length?answers.map(a=>`<div class="ra-answer"><b>${esc(pretty(a.question_key))}</b><span>${esc(valueText(a.answer))}</span></div>`).join(''):'<div class="ra-answer"><span>No saved answers yet.</span></div>';
    renderNotes(notes||[]);
    renderTags(tags||[]);
    renderActivity(activity||[]);
    renderTasks(tasks||[]);
    hydrateRelationshipControls();
  }

  function renderNotes(notes){
    document.getElementById('person-notes').innerHTML=notes.length?notes.map(n=>`<div class="ra-note"><b>Team note</b><span>${esc(n.note)}</span><small>${date(n.created_at)}</small></div>`).join(''):'<div class="ra-note"><span>No team notes yet.</span></div>';
  }

  function hydrateRelationshipControls(){
    if(!currentPerson)return;
    document.getElementById('person-followup-status').value=currentPerson.follow_up_status||'new';
    document.getElementById('person-consult-status').value=currentPerson.consultation_status||'not_scheduled';
    const input=document.getElementById('person-followup-date');
    input.value=currentPerson.next_follow_up_at?new Date(new Date(currentPerson.next_follow_up_at).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):'';
  }

  function renderTags(tags){
    document.getElementById('person-tags').innerHTML=tags.length?tags.map(t=>`<button type="button" class="ra-tag" data-tag-id="${t.id}">${esc(t.tag)} <span>×</span></button>`).join(''):'<span class="ra-tag-empty">No tags yet</span>';
    document.querySelectorAll('[data-tag-id]').forEach(btn=>btn.addEventListener('click',async()=>{
      await sb.from('contact_tags').delete().eq('id',btn.dataset.tagId);
      if(currentPerson) await loadPersonData(currentPerson.id);
    }));
  }

  function renderActivity(items){
    document.getElementById('person-activity').innerHTML=items.length?items.map(a=>`<div class="ra-activity"><i></i><div><b>${esc(a.title)}</b><span>${esc(a.detail||pretty(a.activity_type))}</span><small>${date(a.created_at)}</small></div></div>`).join(''):'<div class="ra-answer"><span>Activity will appear here as this person moves through ReVitalized.</span></div>';
  }

  function renderTasks(tasks){
    document.getElementById('person-tasks').innerHTML=tasks.length?tasks.map(t=>`<label class="ra-task ${t.status==='completed'?'is-complete':''}"><input type="checkbox" data-task-id="${t.id}" ${t.status==='completed'?'checked':''}><span><b>${esc(t.title)}</b><small>${t.due_at?'Due '+date(t.due_at):'No due date'} • ${esc(pretty(t.priority))}</small></span></label>`).join(''):'<div class="ra-answer"><span>No follow-up tasks yet.</span></div>';
    document.querySelectorAll('[data-task-id]').forEach(box=>box.addEventListener('change',async()=>{
      await sb.from('follow_up_tasks').update({status:box.checked?'completed':'open',completed_at:box.checked?new Date().toISOString():null}).eq('id',box.dataset.taskId);
      if(currentPerson) await loadPersonData(currentPerson.id);
    }));
  }

  document.getElementById('person-save-status').addEventListener('click',async()=>{
    if(!currentPerson)return;
    const follow=document.getElementById('person-followup-status').value;
    const consult=document.getElementById('person-consult-status').value;
    const raw=document.getElementById('person-followup-date').value;
    const next=raw?new Date(raw).toISOString():null;
    const {error}=await sb.from('contacts').update({follow_up_status:follow,consultation_status:consult,next_follow_up_at:next}).eq('id',currentPerson.id);
    if(!error){
      currentPerson.follow_up_status=follow;currentPerson.consultation_status=consult;currentPerson.next_follow_up_at=next;
      await sb.from('contact_activity').insert({contact_id:currentPerson.id,activity_type:'relationship_update',title:'Follow-up status updated',detail:'Follow-up: '+pretty(follow)+' • Consultation: '+pretty(consult),actor_user_id:currentUser.id});
      await loadAll();await loadPersonData(currentPerson.id);
    }
  });

  document.getElementById('person-tag-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!currentPerson)return;
    const input=document.getElementById('person-tag-input'),tag=input.value.trim();if(!tag)return;
    const {error}=await sb.from('contact_tags').upsert({contact_id:currentPerson.id,tag},{onConflict:'contact_id,tag'});
    if(!error){input.value='';await loadPersonData(currentPerson.id)}
  });

  document.getElementById('person-task-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!currentPerson||!currentUser)return;
    const title=document.getElementById('person-task-title').value.trim();if(!title)return;
    const raw=document.getElementById('person-task-due').value;
    const {error}=await sb.from('follow_up_tasks').insert({contact_id:currentPerson.id,assigned_to:currentUser.id,created_by:currentUser.id,title,due_at:raw?new Date(raw).toISOString():null,priority:document.getElementById('person-task-priority').value});
    if(!error){document.getElementById('person-task-title').value='';document.getElementById('person-task-due').value='';await loadPersonData(currentPerson.id)}
  });

  document.getElementById('person-note-form').addEventListener('submit',async e=>{
    e.preventDefault(); if(!currentPerson||!currentUser)return;
    const input=document.getElementById('person-note'), note=input.value.trim(); if(!note)return;
    const {error}=await sb.from('contact_notes').insert({contact_id:currentPerson.id,author_user_id:currentUser.id,note});
    if(!error){input.value='';await loadPersonData(currentPerson.id)}
  });

  function closeDrawer(){drawer.classList.remove('is-open');drawer.setAttribute('aria-hidden','true');backdrop.hidden=true;currentPerson=null}
  document.getElementById('person-close').addEventListener('click',closeDrawer);backdrop.addEventListener('click',closeDrawer);
  window.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
  sessionCheck();
})();