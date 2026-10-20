(() => {
  'use strict';
  const el = id => document.getElementById(id), workspace = el('hhl-staff-workspace'), management = el('hhl-staff-management'), notice = el('hhl-staff-status');
  const config = window.RVA_PUBLIC_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseKey || !window.supabase) {notice.textContent = 'Staff configuration is unavailable. Open the staff portal.'; return;}
  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false}});
  let overviewGeneration=0;
  let epoch = 0, currentUser = null, contact = null, historyGeneration = 0, busy = false, allowed = false;
  function clear() {
    epoch++; historyGeneration++;overviewGeneration++; currentUser = null; contact = null; allowed = false; workspace.hidden = true; management.hidden = true;
    for (const id of ['hhl-staff-sessions','hhl-staff-people','hhl-staff-history','hhl-private-join','hhl-reviews','hhl-privacy-queue']) el(id).replaceChildren();
    el('hhl-private-join').hidden = true; el('hhl-history-panel').hidden = true;
    el('hhl-session-form').reset(); el('hhl-settings-form').reset();el('hhl-weekly-form').reset();el('hhl-people-search').reset();
  }
  async function api(action, data = {}) {
    const captured = epoch, user = currentUser, session = (await client.auth.getSession()).data.session;
    if (!session || session.user.id !== user || !user) {clear(); throw Error('Sign in through the staff portal.');}
    const response = await fetch('/api/health-hope-live/staff', {method: 'POST', headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + session.access_token}, body: JSON.stringify({action, data}), cache: 'no-store', signal: AbortSignal.timeout(15000)});
    if (captured !== epoch || user !== currentUser) throw Error('Staff session changed.');
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {clear(); notice.textContent = 'Current staff access does not allow this event action.';}
      throw Error(result.error === 'zoom_held' ? 'Zoom integration remains held for release.' : 'The action is unavailable. Check access, the current session revision and required fields.');
    }
    return result;
  }
  function node(tag, text) {const element = document.createElement(tag); element.textContent = text; return element;}
  function button(label, action) {const element = node('button', label); element.type = 'button'; element.onclick = async () => {element.disabled = true; const captured = epoch; try {await action();} catch (error) {if (captured === epoch) notice.textContent = error.message;} finally {element.disabled = false;}}; return element;}
  const stageLabel = stage => ({registered_guest:'Registered Guest',engaged_guest:'Engaged Guest',prospective_client:'Prospective Client',client:'Client (existing onboarding)',lead:'Lead (existing relationship)',assessment_lead:'Assessment Lead (existing relationship)',webinar_lead:'Webinar Lead (existing relationship)',applicant:'Applicant (existing relationship)',inactive:'Inactive (existing relationship)'})[stage] || 'Existing CRM relationship';
  function reviewForm(label, action, data, after) {
    const form=node('form','');form.className='hhl-review-form';form.dataset.hhlAction=action;const reason=node('input','');reason.required=true;reason.minLength=5;reason.maxLength=500;reason.placeholder='Reason / evidence for this staff action';reason.setAttribute('aria-label',reason.placeholder);const save=node('button',label);save.type='submit';form.append(reason,save);
    form.onsubmit=async event=>{event.preventDefault();if(!form.reportValidity()||busy||!allowed)return;busy=true;save.disabled=true;const captured=epoch;try{await api(action,{...data,reason:reason.value});if(captured===epoch)await after();}catch(error){if(captured===epoch)notice.textContent=error.message;}finally{busy=false;save.disabled=false;}};
    return form;
  }
  const when = value => new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York', dateStyle:'medium', timeStyle:'short'}).format(new Date(value)) + ' Eastern';
  function easternInput(value) {const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;}
  function downloadEventData(data,name) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=node('a','Download event data');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function privacyForm(person) {
    const section=node('details','');section.append(node('summary','Verified event export or deletion'));
    section.append(node('p','Verify the requester through an approved contact channel. This covers event data only; shared CRM, client, health, financial and independently governed consent records remain separate. Do not enter health details.'));
    const form=node('form','');form.className='hhl-review-form';const kind=node('select','');kind.setAttribute('aria-label','Event privacy request type');for(const [value,label]of [['export','Export event data'],['delete','Delete event data']]){const option=node('option',label);option.value=value;kind.append(option);}
    const verifiedLabel=node('label','I verified the requester’s identity and request '),verified=node('input','');verified.type='checkbox';verified.required=true;verifiedLabel.prepend(verified);const save=node('button','Open verified request');save.type='submit';const result=node('div','');form.append(kind,verifiedLabel,save);section.append(form,result);
    form.onsubmit=async event=>{event.preventDefault();if(busy||!allowed||!form.reportValidity())return;busy=true;save.disabled=true;const captured=epoch;
      try{const data=await api('privacy-open',{request_id:crypto.randomUUID(),contact_id:person.contact_id,kind:kind.value,identity_verified:verified.checked,verification:'verified_contact_request'});if(captured!==epoch)return;
        result.replaceChildren(node('p','Verified request expires in 15 minutes. Export files contain event data only; transfer them through an approved secure channel.'));
        if(kind.value==='export'){result.append(button('Download verified event export',async()=>{const data=await api('privacy-export',{case_id:dataCase});if(captured===epoch&&data.registrations)downloadEventData(data,'health-hope-live-event-export.json');}));const dataCase=data.case_id;}
        else{result.append(node('p','Event delivery is now on hold. Complete provider cleanup and wait until '+when(data.safe_after)+' before deletion. Shared contacts are preserved.'));
          const label=node('label','Any required Zoom/email provider cleanup has been completed or verified under its approved retention policy '),box=node('input','');box.type='checkbox';label.prepend(box);result.append(label,button('Complete verified event deletion',async()=>{await api('privacy-delete',{case_id:data.case_id,provider_cleanup_confirmed:box.checked});if(captured===epoch)await load();}));}
      }catch(error){if(captured===epoch)notice.textContent=error.message;}finally{busy=false;save.disabled=false;}
    };return section;
  }
  async function history(person) {
    const captured = epoch, generation = ++historyGeneration; contact = person.contact_id;
    el('hhl-private-join').replaceChildren(); el('hhl-private-join').hidden = true; el('hhl-staff-history').replaceChildren(); el('hhl-history-panel').hidden = false;
    const rows = await api('history', {contact_id: person.contact_id});
    if (captured !== epoch || generation !== historyGeneration || contact !== person.contact_id) return;
    for (const row of rows) {
      const card = node('article', ''); card.className = 'hhl-staff-card'; card.append(node('p', 'Registration reference: ' + row.registration_id),node('h3', when(row.starts_at)), node('p', row.status + ' · ' + (row.attendance_status || 'unreviewed') + ' · Registered: ' + when(row.registered_at) + ' · Attended: ' + (row.attended_at ? when(row.attended_at) : 'Not credited')));
      if (!management.hidden && row.can_review_no_show) {
        const target=row.attendance_status==='no_show'?'unreviewed':'no_show';
        card.append(node('p','Confirm attendance evidence before recording a no-show. Unmatched participants must be resolved first.'),reviewForm(target==='no_show'?'Record reviewed no-show':'Clear no-show for review','attendance-status',{registration_id:row.registration_id,attendance_status:target,expected_status:row.attendance_status},()=>history(person)));
      }
      if (row.status === 'confirmed' && !row.can_review_no_show) card.append(button('Show private joining info', async () => {
        el('hhl-private-join').replaceChildren(); el('hhl-private-join').hidden = true;
        const info = await api('join-info', {registration_id:row.registration_id});
        if (captured !== epoch || generation !== historyGeneration || contact !== person.contact_id) return;
        if (typeof info.join_url !== 'string' || !/^https:\/\/([a-z0-9-]+\.)?zoom\.us\/j\/\d+(?:\?[^\s]*)?$/.test(info.join_url)) throw Error('Joining information is not ready.');
        const target = el('hhl-private-join'); target.replaceChildren(node('p','Share this private link only with the intended registrant.'));
        const link = node('a',info.join_url); link.href = info.join_url; link.rel = 'noreferrer noopener'; link.target='_blank'; target.append(link, button('Copy joining link', () => navigator.clipboard.writeText(info.join_url))); target.hidden=false;
      }));
      card.append(node('p', 'Event notices: ' + (row.event_notifications ? 'on' : 'off') + ' · Optional marketing requested: ' + (row.marketing_requested ? 'yes' : 'no')));
      if (!management.hidden) {const withdrawal=node('form','');withdrawal.className='hhl-review-form';const eventLabel=node('label','Stop event notices '),eventBox=node('input','');eventBox.type='checkbox';eventLabel.prepend(eventBox);const marketingLabel=node('label','Withdraw optional marketing request '),marketingBox=node('input','');marketingBox.type='checkbox';marketingLabel.prepend(marketingBox);const reason=node('input','');reason.required=true;reason.minLength=5;reason.maxLength=500;reason.placeholder='Recipient request / reason';reason.setAttribute('aria-label',reason.placeholder);const save=node('button','Record requested withdrawal');save.type='submit';withdrawal.append(eventLabel,marketingLabel,reason,save);withdrawal.onsubmit=async event=>{event.preventDefault();if(!withdrawal.reportValidity()||busy)return;busy=true;try{await api('withdraw-consent',{registration_id:row.registration_id,withdraw_event:eventBox.checked,withdraw_marketing:marketingBox.checked,reason:reason.value});if(captured===epoch && generation===historyGeneration)await history(person);}catch(error){if(captured===epoch)notice.textContent=error.message;}finally{busy=false;}};card.append(withdrawal);}
      el('hhl-staff-history').append(card);
    }
  }
  async function load() {
    const captured = epoch, requestGeneration=++overviewGeneration; notice.textContent = 'Loading event history…'; historyGeneration++;contact=null;el('hhl-staff-sessions').replaceChildren();el('hhl-staff-people').replaceChildren();el('hhl-staff-history').replaceChildren();el('hhl-private-join').replaceChildren();el('hhl-private-join').hidden=true;el('hhl-history-panel').hidden=true;
    const data = await api('overview',{query:el('hhl-people-query').value.trim()}); if (captured !== epoch || requestGeneration!==overviewGeneration) return;
    allowed = true; workspace.hidden=false; management.hidden=!data.can_manage; notice.textContent='Event history loaded.'; el('hhl-sign-in').hidden=true;
    for (const key of ['registration_enabled','zoom_enabled','notifications_enabled']) el('hhl-settings-form').elements[key].checked = data.settings[key] === true;
    el('hhl-review-count').textContent = data.can_manage ? data.review_count + ' items need review.' : '';
    el('hhl-staff-sessions').replaceChildren(); el('hhl-staff-people').replaceChildren();
    for (const session of data.sessions) {
      const card=node('article',''); card.className='hhl-staff-card'; card.append(node('h3',when(session.starts_at)),node('p',`${session.status} · ${session.registered} registered · ${session.attended} attended · ${session.join_mode === 'zoom' ? (session.zoom_ready ? 'Zoom validated' : 'Zoom validation pending') : 'Staff-managed joining link'}`));
      if (data.can_manage) {
        card.append(button('Edit session', () => {
          const form=el('hhl-session-form');form.reset();for(const key of ['id','revision','regular_date','status','join_mode','zoom_meeting_id','zoom_occurrence_id','public_note'])form.elements[key].value=session[key]??'';
          form.elements.eastern_start.value=easternInput(session.starts_at);form.elements.eastern_close.value=session.closes_at===session.starts_at?'':easternInput(session.closes_at);form.elements.regular_date.readOnly=true;form.closest('details').open=true;form.scrollIntoView({block:'center'});
        }));
        if (session.join_mode==='zoom') card.append(button('Validate Zoom occurrence',async()=>{await api('zoom-validate',{session_id:session.id});await load();}));
      }
      el('hhl-staff-sessions').append(card);
    }
    if(!data.sessions.length)el('hhl-staff-sessions').append(node('p','No event sessions have been configured.'));
    for(const person of data.people){
      const card=node('article','');card.className='hhl-staff-card';card.append(node('h3',person.name),node('p',person.email),node('p','Event classification: Registered Guest'),node('p','CRM relationship: '+(person.active_client?'Active Client (approved onboarding)':stageLabel(person.relationship_stage))),node('p',`${person.registered} sessions registered · ${person.attended} sessions attended`),button('View session history',()=>history(person)));
      if(data.can_manage && person.can_progress && ['registered_guest','engaged_guest'].includes(person.relationship_stage)){
        const next=person.relationship_stage==='registered_guest'?'engaged_guest':'prospective_client';
        card.append(node('p',next==='engaged_guest'?'Record a deliberate staff review of engagement. Attendance alone does not advance the relationship.':'Record an expression of client interest or a deliberate staff qualification decision. Enrollment and access remain separate.'),reviewForm('Mark '+stageLabel(next),'guest-stage',{contact_id:person.contact_id,stage:next,expected_stage:person.relationship_stage},load));
      }
      if(data.can_manage)card.append(privacyForm(person));
      el('hhl-staff-people').append(card);
    }
  }
  async function boot() {
    clear();const captured=epoch;
    try {const session=(await client.auth.getSession()).data.session;if(captured!==epoch)return;if(!session){notice.textContent='Sign in through the staff portal to view event history.';el('hhl-sign-in').hidden=false;return;}currentUser=session.user.id;await load();}
    catch(error){if(captured===epoch)notice.textContent=error.message;}
  }
  function submit(form,action,build){form.addEventListener('submit',async event=>{event.preventDefault();if(busy||!allowed||!form.reportValidity())return;busy=true;const captured=epoch,submit=form.querySelector('[type=submit]');submit.disabled=true;try{await api(action,build(form));if(captured!==epoch)return;form.reset();await load();}catch(error){if(captured===epoch)notice.textContent=error.message;}finally{busy=false;submit.disabled=false;}});}
  submit(el('hhl-weekly-form'),'prepare-weekly',form=>Object.fromEntries(new FormData(form)));
  submit(el('hhl-session-form'),'session-save',form=>Object.fromEntries(Array.from(new FormData(form),([k,v])=>[k,v===''?null:v])));
  submit(el('hhl-settings-form'),'settings',form=>({reason:form.elements.reason.value,registration_enabled:form.elements.registration_enabled.checked,zoom_enabled:form.elements.zoom_enabled.checked,notifications_enabled:form.elements.notifications_enabled.checked}));
  el('hhl-session-form').addEventListener('reset',()=>{el('hhl-session-form').elements.regular_date.readOnly=false;el('hhl-session-form').elements.id.defaultValue='';el('hhl-session-form').elements.revision.defaultValue='';});
  el('hhl-people-search').addEventListener('submit',event=>{event.preventDefault();const captured=epoch;load().catch(error=>{if(captured===epoch)notice.textContent=error.message;});});
  el('hhl-staff-refresh').onclick=()=>{const captured=epoch;load().catch(error=>{if(captured===epoch)notice.textContent=error.message;});};
  el('hhl-history-close').onclick=()=>{historyGeneration++;contact=null;el('hhl-history-panel').hidden=true;el('hhl-staff-history').replaceChildren();el('hhl-private-join').replaceChildren();el('hhl-private-join').hidden=true;};
  el('hhl-privacy-refresh').onclick=async()=>{
    const captured=epoch;el('hhl-privacy-queue').replaceChildren();
    try{const data=await api('privacy-overview');if(captured!==epoch)return;const target=el('hhl-privacy-queue');target.append(node('p','Retention worker: '+(data.retention.enabled?'enabled':'held')+' · Provider policy: '+(data.retention.provider_ready?'verified':'pending')+' · Last heartbeat: '+(data.retention.healthy_at?when(data.retention.healthy_at):'not recorded')));
      if(!data.can_manage_all){target.append(node('p','Provider manifests require existing All People management scope.'));return;}
      for(const row of data.sessions){const card=node('article','');card.className='hhl-staff-card';card.append(node('h3',when(row.starts_at)),node('p','Retention deadline: '+when(row.expires_at)+' · Provider cleanup: '+(row.provider_cleanup_ready?'attested':'pending')),button('Download private provider cleanup manifest',async()=>{const manifest=await api('privacy-provider-manifest',{session_id:row.session_id});if(captured===epoch)downloadEventData(manifest,'health-hope-live-provider-cleanup.json');}));const label=node('label','External provider cleanup or approved provider retention has been verified '),box=node('input','');box.type='checkbox';label.prepend(box);card.append(label,button('Record provider cleanup attestation',async()=>{if(!box.checked)throw Error('Verify provider cleanup before attesting.');await api('privacy-provider-attest',{session_id:row.session_id,provider_cleanup_confirmed:box.checked});if(captured===epoch)el('hhl-privacy-refresh').click();}));target.append(card);}
    }catch(error){if(captured===epoch)notice.textContent=error.message;}
  };
  el('hhl-load-reviews').onclick=async()=>{
    const captured=epoch;el('hhl-reviews').replaceChildren();
    try{const data=await api('review-list',{reason:'Staff requested event review queue'});if(captured!==epoch)return;
      for(const [group,rows]of Object.entries(data)){const title=node('h3',group);el('hhl-reviews').append(title);for(const row of rows){const card=node('article','');card.className='hhl-staff-card';card.append(node('pre',JSON.stringify(row,null,2)));
        if(group==='attendance'){const binding=node('form','');binding.className='hhl-review-form';const session=node('input','');session.required=true;session.placeholder='Reviewed event session ID';session.setAttribute('aria-label',session.placeholder);const reason=node('input','');reason.required=true;reason.minLength=5;reason.maxLength=500;reason.placeholder='Binding evidence';reason.setAttribute('aria-label',reason.placeholder);const save=node('button','Bind reviewed Zoom instance');save.type='submit';binding.append(session,reason,save);binding.onsubmit=async event=>{event.preventDefault();if(!binding.reportValidity()||busy)return;busy=true;try{await api('bind-instance',{session_id:session.value,meeting_id:row.meeting_id,instance_uuid:row.instance_uuid,reason:reason.value});if(captured===epoch)notice.textContent='Reviewed Zoom instance bound. Resolve the participant only after checking the intended registration.';}catch(error){if(captured===epoch)notice.textContent=error.message;}finally{busy=false;}};card.append(binding);}
        if(group==='identities'||group==='attendance'){
          const form=node('form','');form.className='hhl-review-form';const input=node('input','');input.required=true;input.placeholder=group==='identities'?'Verified master contact ID':'Verified registration ID';input.setAttribute('aria-label',input.placeholder);const reason=node('input','');reason.required=true;reason.minLength=5;reason.maxLength=500;reason.placeholder='Reason and evidence';reason.setAttribute('aria-label',reason.placeholder);const save=node('button','Resolve review');save.type='submit';form.append(input,reason,save);form.onsubmit=async event=>{event.preventDefault();if(!form.reportValidity()||busy)return;busy=true;try{await api(group==='identities'?'identity-resolve':'attendance-resolve',{...(group==='identities'?{registration_id:row.id,contact_id:input.value}:{event_key:row.event_key,registration_id:input.value}),reason:reason.value});if(captured===epoch){card.remove();await load();}}catch(error){if(captured===epoch)notice.textContent=error.message;}finally{busy=false;}};card.append(form);
        }
        el('hhl-reviews').append(card);
      }}
    }catch(error){if(captured===epoch)notice.textContent=error.message;}
  };
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='INITIAL_SESSION')return;
    if(event==='TOKEN_REFRESHED'&&session?.user.id===currentUser)return;
    clear();queueMicrotask(boot);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();notice.textContent='Event history cleared while this page is hidden.';}else boot();});
  window.addEventListener('pagehide',clear);boot();
})();
