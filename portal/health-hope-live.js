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
    for (const id of ['hhl-staff-sessions','hhl-staff-people','hhl-staff-history','hhl-private-join','hhl-reviews','hhl-privacy-queue','hhl-meeting-setup','hhl-acceptance-case']) el(id).replaceChildren();
    el('hhl-acceptance-panel').hidden=true;
    el('hhl-private-join').hidden = true; el('hhl-history-panel').hidden = true;
    el('hhl-session-form').reset(); el('hhl-settings-form').reset();el('hhl-weekly-form').reset();el('hhl-people-search').reset();
  }
  async function api(action, data = {}, route = 'staff') {
    const captured = epoch, user = currentUser, session = (await client.auth.getSession()).data.session;
    if (!session || session.user.id !== user || !user) {clear(); throw Error('Sign in through the staff portal.');}
    const response = await fetch('/api/health-hope-live/'+route, {method: 'POST', headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + session.access_token}, body: JSON.stringify(route==='staff'?{action,data}:data), cache: 'no-store', signal: AbortSignal.timeout(15000)});
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
  function manualAttendanceForm(row,person) {
    const section=node('details','');section.append(node('summary','Record verified manual attendance'),node('p','Use direct host observation or a verified Zoom report. This is manual attendance. Verify the person and selected session; do not enter health details.'));
    const form=node('form','');form.className='hhl-form-card';form.dataset.hhlAction='manual-attendance';
    const source=node('select','');source.setAttribute('aria-label','Manual attendance evidence');for(const[value,label]of [['host_observed','Host personally observed attendance'],['verified_zoom_report','Reviewed Zoom attendance report']]){const option=node('option',label);option.value=value;source.append(option);}
    const timeLabel=node('label','Observed attendance time (Eastern)'),time=node('input','');time.type='datetime-local';time.required=true;timeLabel.append(time);
    const uuidLabel=node('label','Actual Zoom run UUID, if available (optional)'),instance=node('input','');instance.maxLength=200;uuidLabel.append(instance);
    const verifiedLabel=node('label','I verified this person attended this session '),verified=node('input','');verified.type='checkbox';verified.required=true;verifiedLabel.prepend(verified);
    const reasonLabel=node('label','Brief evidence reference; no health details'),reason=node('input','');reason.required=true;reason.minLength=5;reason.maxLength=500;reasonLabel.append(reason);
    const save=node('button','Save verified manual attendance');save.type='submit';form.append(source,timeLabel,uuidLabel,verifiedLabel,reasonLabel,save);section.append(form);const requestId=crypto.randomUUID(),generation=historyGeneration;
    form.onsubmit=async event=>{event.preventDefault();if(busy||!allowed||!form.reportValidity())return;busy=true;save.disabled=true;const captured=epoch;try{await api('manual-attendance',{request_id:requestId,registration_id:row.registration_id,expected_attended_at:row.attended_at,eastern_observed_at:time.value,instance_uuid:instance.value||null,evidence_source:source.value,identity_verified:verified.checked,reason:reason.value});if(captured===epoch&&generation===historyGeneration&&contact===person.contact_id)await history(person);}catch(error){if(captured===epoch)notice.textContent=error.message;}finally{busy=false;save.disabled=false;}};
    return section;
  }
  function acceptanceForm(scope,sessions) {
    const section=el('hhl-acceptance-case');section.replaceChildren(node('p',`One synthetic case: ${scope.email}. Window ends ${when(scope.expires_at)}. Public registration stays held. This uses the website registration handler; a saved registration is not a delivery receipt.`));
    const selected=sessions.find(row=>row.id===scope.session_id);
    if(!selected||selected.status!=='published'||selected.join_mode!=='manual'||selected.revision!==scope.revision){section.append(node('p','The configured test session is unavailable or changed. Review the session and test pins before submitting.'));return;}
    section.append(node('p','Selected Thursday session: '+when(selected.starts_at)+' · Shared Zoom link'));
    const form=node('form','');form.className='hhl-form-card';form.dataset.hhlAction='acceptance-register';const first=node('input',''),last=node('input','');first.required=last.required=true;first.maxLength=last.maxLength=100;first.value='HHL';last.value='Acceptance Test';first.setAttribute('aria-label','Synthetic first name');last.setAttribute('aria-label','Synthetic last name');
    const consentLabel=node('label','I authorize the confirmation for this controlled test '),consent=node('input','');consent.type='checkbox';consent.required=true;consentLabel.prepend(consent);const save=node('button','Submit synthetic registration');save.type='submit';form.append(first,last,consentLabel,node('p','Optional marketing: off. This test does not subscribe the inbox to marketing.'),save);section.append(form);
    form.onsubmit=async event=>{event.preventDefault();if(busy||!allowed||!form.reportValidity())return;busy=true;save.disabled=true;const captured=epoch;try{await api('register',{request_id:scope.request_id,session_id:scope.session_id,first_name:first.value,last_name:last.value,email:scope.email,event_notifications:consent.checked,marketing_requested:false,source:'health_hope_live_website',company_website:''},'register');if(captured===epoch)notice.textContent='Synthetic request accepted. Verify the saved CRM record, confirmation delivery and joining details before accepting the test.';}catch(error){if(captured===epoch)notice.textContent=error.message;}finally{busy=false;save.disabled=false;}};
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
      if (row.attendance_method === 'manual') card.append(node('p', 'Attendance recorded manually from verified evidence.'));
      if (!management.hidden && row.can_review_no_show) {
        card.append(manualAttendanceForm(row,person));
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
    el('hhl-acceptance-case').replaceChildren();el('hhl-acceptance-panel').hidden=!(data.can_manage&&data.acceptance_case);
    if(data.can_manage&&data.acceptance_case)acceptanceForm(data.acceptance_case,data.sessions);
    el('hhl-meeting-setup').replaceChildren();
    if (data.can_manage && data.meeting_setup) {
      const setup=data.meeting_setup;
      el('hhl-meeting-setup').textContent=`Provided by Justyn: ${setup.topic} (${setup.meeting_id}). Leave the optional override blank to use this meeting for new drafts. Shared-link setup; security and joining still need verification. The website controls each Thursday session. Automatic Zoom registration and attendance remain unverified/held.`;
      const session=el('hhl-session-form');
      if(!session.elements.id.value){
        if(!session.elements.zoom_meeting_id.value)session.elements.zoom_meeting_id.value=setup.meeting_id;
      }
    } else if (!data.can_manage) {el('hhl-weekly-form').reset();el('hhl-session-form').reset();}
    for (const key of ['registration_enabled','zoom_enabled','notifications_enabled']) el('hhl-settings-form').elements[key].checked = data.settings[key] === true;
    el('hhl-review-count').textContent = data.can_manage ? data.review_count + ' items need review.' : '';
    el('hhl-staff-sessions').replaceChildren(); el('hhl-staff-people').replaceChildren();
    // Presentation order only: retain the received objects and all existing actions.
    const rank=status=>status==='published'?0:status==='draft'?1:2;
    const sessions=[...data.sessions].sort((a,b)=>rank(a.status)-rank(b.status)||Date.parse(a.starts_at)-Date.parse(b.starts_at));
    const nextSession=sessions.find(row=>row.status==='published'&&Date.parse(row.starts_at)>Date.now());
    const displayedSessions=nextSession?[nextSession,...sessions.filter(row=>row!==nextSession)]:sessions;
    let previousGroup=null;
    for (const session of displayedSessions) {
      const group=session.status==='published'?'Published Sessions':session.status==='draft'?'Draft Sessions':'Other Sessions';
      if(group!==previousGroup){const title=node('h3',group);title.className='hhl-session-group';el('hhl-staff-sessions').append(title);previousGroup=group;}
      const card=node('article','');card.className='hhl-staff-card hhl-session-card';card.dataset.status=session.status;
      const calendar=node('div','');calendar.className='hhl-session-calendar';calendar.setAttribute('aria-hidden','true');calendar.append(node('span',new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short'}).format(new Date(session.starts_at)).toUpperCase()),node('strong',new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',day:'numeric'}).format(new Date(session.starts_at))));
      const copy=node('div',''),badges=node('div',''),badge=node('span',({published:'Published',draft:'Draft',cancelled:'Canceled'})[session.status]||session.status);copy.className='hhl-session-copy';badges.className='hhl-session-badges';badge.className='hhl-session-badge';badges.append(badge);
      if(session===nextSession){const next=node('span','Next Scheduled');next.className='hhl-session-next';badges.append(next);}
      if(session.join_mode==='zoom'&&!session.zoom_ready){const held=node('span','Joining Held');held.className='hhl-session-badge hhl-session-held';badges.append(held);}
      const joining=node('p',session.join_mode==='zoom'?(session.zoom_ready?'Zoom validated':'Zoom validation pending'):'Staff-managed joining link');joining.className='hhl-session-joining';copy.append(badges,node('h3',when(session.starts_at)),joining);
      const stats=node('dl','');stats.className='hhl-session-stats';for(const[label,value]of [['Registered',session.registered],['Attended',session.attended]]){const metric=node('div','');metric.append(node('dt',label),node('dd',value));stats.append(metric);}
      const actions=node('div','');actions.className='hhl-session-actions';card.append(calendar,copy,stats,actions);
      if (data.can_manage) {
        actions.append(button('Edit session', () => {
          const form=el('hhl-session-form');form.reset();for(const key of ['id','revision','regular_date','status','join_mode','zoom_meeting_id','zoom_occurrence_id','public_note'])form.elements[key].value=session[key]??'';
          form.elements.eastern_start.value=easternInput(session.starts_at);form.elements.eastern_close.value=session.closes_at===session.starts_at?'':easternInput(session.closes_at);form.elements.regular_date.readOnly=true;form.closest('details').open=true;form.scrollIntoView({block:'center'});
        }));
        if (session.join_mode==='zoom') actions.append(button('Validate Zoom occurrence',async()=>{await api('zoom-validate',{session_id:session.id});await load();}));
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
