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
    const [{data:metrics,error:mErr},{data:list,error:pErr}]=await Promise.all([
      sb.from('admin_dashboard_metrics').select('*').maybeSingle(),
      sb.from('admin_contact_overview').select('*').order('updated_at',{ascending:false}).limit(500)
    ]);
    if(mErr||pErr){console.error(mErr||pErr);return}
    people=list||[];
    if(metrics){
      document.querySelectorAll('[data-metric]').forEach(el=>el.textContent=metrics[el.dataset.metric]??0);
      document.querySelectorAll('[data-summary]').forEach(el=>el.textContent=metrics[el.dataset.summary]??0);
    }
    render();
  }

  function matchesFilter(p,f){
    if(f==='all')return true;
    if(f==='assessment')return !!p.vitality_status;
    if(f==='webinar')return !!p.webinar_status;
    if(f==='enrollment')return !!p.enrollment_status;
    if(f==='client')return p.lifecycle_stage==='client';
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
    backdrop.hidden=false;drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');
    await loadPersonData(id);
  }

  async function loadPersonData(contactId){
    const [{data:facts},{data:workflows},{data:notes}]=await Promise.all([
      sb.from('canonical_facts').select('*').eq('contact_id',contactId).order('updated_at',{ascending:false}),
      sb.from('workflow_records').select('id,workflow_type').eq('contact_id',contactId).neq('status','abandoned'),
      sb.from('contact_notes').select('*').eq('contact_id',contactId).order('created_at',{ascending:false})
    ]);
    document.getElementById('person-facts').innerHTML=(facts||[]).length?(facts||[]).map(f=>`<div class="ra-fact"><b>${esc(pretty(f.field_key))}</b><span>${esc(valueText(f.value))}</span></div>`).join(''):'<div class="ra-fact"><span>No shared facts saved yet.</span></div>';
    const ids=(workflows||[]).map(w=>w.id);
    let answers=[];
    if(ids.length){const r=await sb.from('workflow_answers').select('*').in('workflow_id',ids).order('updated_at',{ascending:false}).limit(30);answers=r.data||[]}
    document.getElementById('person-answers').innerHTML=answers.length?answers.map(a=>`<div class="ra-answer"><b>${esc(pretty(a.question_key))}</b><span>${esc(valueText(a.answer))}</span></div>`).join(''):'<div class="ra-answer"><span>No saved answers yet.</span></div>';
    renderNotes(notes||[]);
  }

  function renderNotes(notes){
    document.getElementById('person-notes').innerHTML=notes.length?notes.map(n=>`<div class="ra-note"><b>Team note</b><span>${esc(n.note)}</span><small>${date(n.created_at)}</small></div>`).join(''):'<div class="ra-note"><span>No team notes yet.</span></div>';
  }

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