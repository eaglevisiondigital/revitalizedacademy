(() => {
  'use strict';
  const params=new URLSearchParams(window.location.hash.slice(1));
  const invitation=params.get('invite'),enrollment=params.get('enroll');
  // Invitation credentials never enter query strings, persistent storage or telemetry.
  if(invitation||enrollment)window.history.replaceState(null,'',window.location.pathname);
  const client=window.supabase.createClient(window.RVA_ENV.supabaseUrl,window.RVA_ENV.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const el=id=>document.getElementById(id);
  const status=(message,error=false)=>{el('status').textContent=message;el('status').className=error?'error':'';};
  const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
  async function action(button,fn){button.disabled=true;try{await fn();}catch(error){status(error.message||'Unable to complete this action.',true);}finally{button.disabled=false;}}
  function button(label,fn){const b=node('button',label);b.type='button';b.addEventListener('click',()=>action(b,fn));return b;}
  function showSignupConfirmation(email){
    el('login').hidden=true;
    el('auth-intro').hidden=true;
    el('signup-help').hidden=true;
    el('signup-confirmation-email').textContent=email;
    const confirmation=el('signup-confirmation');
    confirmation.hidden=false;
    status('Check your email to finish creating your account.');
    confirmation.focus({preventScroll:true});
    confirmation.scrollIntoView?.({behavior:'smooth',block:'center'});
  }
  function showAuthForm(){
    el('signup-confirmation').hidden=true;
    el('signup-confirmation-email').textContent='';
    el('auth-intro').hidden=false;
    el('login').hidden=false;
    el('signup-help').hidden=false;
    status('Sign in or create your own account to continue.');
    el('email').focus();
  }
  function renderAgreement(a){
    const card=node('article'),title=node('h3',a.name+' · version '+a.template_version);
    card.append(title,node('p',`${a.accepted_signatures} of ${a.required_client_signatures} adult signatures recorded · ${a.status}`));
    const details=node('details'),summary=node('summary','Review Full Agreement'),copy=node('div',a.content_text);
    details.className='agreement-review';summary.className='agreement-review-toggle';summary.setAttribute('role','button');
    copy.className='agreement-copy';copy.tabIndex=0;
    details.addEventListener('toggle',()=>{summary.textContent=details.open?'Hide Full Agreement':'Review Full Agreement';});
    details.append(summary,copy);card.append(details);
    if(a.signer_role&&!a.already_signed&&!['signed','waived','declined'].includes(a.status)){
      const guide=node('div');guide.className='agreement-signing-guide';
      guide.append(node('strong','Complete these steps to sign'),node('span','1. Review the full agreement above.'),node('span','2. Enter your full legal name.'),node('span','3. Check the acceptance box.'),node('span','4. Sign the agreement.'));card.append(guide);
      const form=node('form'),nameLabel=node('label','Your full legal name'),name=node('input');name.type='text';name.autocomplete='name';name.required=true;name.minLength=2;name.maxLength=240;nameLabel.append(name);
      const acceptLabel=node('label'),accept=node('input');accept.type='checkbox';accept.required=true;acceptLabel.append(accept,document.createTextNode('I am an adult, have read this agreement, accept its terms, and am signing for myself.'));
      const submit=node('button','Sign as '+(a.signer_role==='secondary_client'?'the second adult':'the primary adult'));submit.type='submit';form.append(nameLabel,acceptLabel,submit);
      form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;action(submit,async()=>{
        await rpc('sign_client_agreement_atomic',{p_client_agreement_id:a.client_agreement_id,p_signatures:[{signer_role:a.signer_role,signer_name:name.value.trim()}],p_expected_content_hash:a.content_hash,p_user_agent:navigator.userAgent});
        status('Your signature has been recorded.');await load();
      });});card.append(form);
    }
    if(a.signer_role==='primary_client'&&a.required_client_signatures===2&&!['signed','waived','declined'].includes(a.status)){
      const controls=node('div');controls.className='invite-controls';controls.append(node('p','The second adult must receive an invitation and sign using their own verified account.'));
      const form=node('form'),label=node('label','Second adult’s email'),email=node('input');email.type='email';email.required=true;email.autocomplete='off';label.append(email);const send=node('button','Send secure invitation');send.type='submit';form.append(label,send);
      form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;action(send,async()=>{await rpc('invite_secondary_signer',{p_client_agreement_id:a.client_agreement_id,p_email:email.value.trim()});status('Invitation queued for delivery.');await load();});});controls.append(form);
      for(const i of a.invitations||[]){const row=node('p',i.revoked?'Invitation revoked':i.redeemed?'Invitation accepted':'Invitation expires '+new Date(i.expires_at).toLocaleString());if(!i.revoked)row.append(' ',button('Revoke invitation',async()=>{await rpc('revoke_secondary_signer_invitation',{p_invitation_id:i.id});status('Invitation revoked.');await load();}));controls.append(row);}card.append(controls);
    }
    return card;
  }
  function supportStatus(message,error=false){
    const target=el('support-status');
    if(!target)return;
    target.textContent=message||'';
    target.className=error?'error':'';
  }

  function renderSupportMessages(messages=[]){
    const thread=el('support-thread');
    thread.replaceChildren();
    if(!messages.length){
      thread.append(node('p','No support messages yet. Send us a message whenever you need help.'));
      return;
    }
    for(const message of messages){
      const item=node('article');
      item.className=message.mine?'support-message mine':'support-message';
      item.append(node('p',message.body||''));
      const meta=node('small',(message.mine?'You':'ReVitalized Support')+' · '+new Date(message.created_at).toLocaleString());
      item.append(meta);
      thread.append(item);
    }
    thread.scrollTop=thread.scrollHeight;
  }

  async function loadSupport(){
    const section=el('support-center');
    try{
      const {data,error}=await client.functions.invoke('member-support',{body:{action:'context'}});
      if(error||!data?.ok){
        section.hidden=true;
        return;
      }
      section.hidden=false;
      renderSupportMessages(data.messages||[]);
    }catch{
      section.hidden=true;
    }
  }

  async function sendSupportMessage(event){
    event.preventDefault();
    const message=el('support-message').value.trim();
    if(!message)return;
    const button=el('support-form').querySelector('button');
    button.disabled=true;
    supportStatus('Sending securely...');
    try{
      const {data,error}=await client.functions.invoke('member-support',{
        body:{action:'send',message,request_id:crypto.randomUUID()}
      });
      if(error||!data?.ok)throw error||new Error(data?.error||'Support message could not be sent.');
      el('support-message').value='';
      renderSupportMessages(data.messages||[]);
      supportStatus('Message sent to ReVitalized Support.');
    }catch(error){
      supportStatus(error.message||'Support message could not be sent.',true);
    }finally{
      button.disabled=false;
    }
  }

  function privacyStatus(message,error=false){
    const target=el('restricted-privacy-status');
    if(!target)return;
    target.textContent=message||'';
    target.className=error?'error':'';
  }

  function updateRestrictedPrivacyProviderScope(){
    const field=el('restricted-privacy-provider-field');
    field.hidden=el('restricted-privacy-type').value!=='health_data_delete';
  }

  async function downloadRestrictedPrivacyExport(storagePath){
    if(!storagePath)return;
    const {data,error}=await client.storage.from('privacy-exports').createSignedUrl(storagePath,300);
    if(error||!data?.signedUrl){
      privacyStatus(error?.message||'Your export download could not be prepared.',true);
      return;
    }
    window.open(data.signedUrl,'_blank','noopener,noreferrer');
  }

  function renderRestrictedPrivacy(center,exports=[]){
    const section=el('restricted-privacy-center');
    if(!center){
      section.hidden=true;
      return;
    }
    section.hidden=false;

    const summary=el('restricted-privacy-summary');
    summary.replaceChildren();
    [
      ['Stored Health Records',Number(center.stored_health_observation_count||0)],
      ['Latest Health Record',center.latest_health_observation_at?new Date(center.latest_health_observation_at).toLocaleString():'None']
    ].forEach(([label,value])=>{
      const item=node('div');
      item.append(node('span',label),node('strong',String(value)));
      summary.append(item);
    });

    const providerSelect=el('restricted-privacy-provider');
    providerSelect.replaceChildren();
    const all=node('option','All connected providers');all.value='';providerSelect.append(all);

    const connections=el('restricted-privacy-connections');
    connections.replaceChildren();
    const providers=Array.isArray(center.health_connections)?center.health_connections:[];
    if(!providers.length){
      connections.append(node('p','No connected health providers are associated with this account.'));
    }else{
      for(const row of providers){
        const item=node('article');
        item.append(node('strong',row.provider_name||row.provider_key),node('p',[row.status,row.last_successful_sync_at?'Last sync '+new Date(row.last_successful_sync_at).toLocaleString():null].filter(Boolean).join(' · ')));
        connections.append(item);
        const option=node('option',row.provider_name||row.provider_key);option.value=row.provider_key;providerSelect.append(option);
      }
    }

    const exportList=el('restricted-privacy-exports');
    exportList.replaceChildren();
    const exportRows=Array.isArray(exports)?exports:[];
    if(!exportRows.length){
      exportList.append(node('p','No data export packages are available yet.'));
    }else{
      for(const row of exportRows.slice(0,8)){
        const item=node('article');
        item.append(node('strong','Data Export'),node('p',[
          row.status,
          row.ready_at?'Ready '+new Date(row.ready_at).toLocaleString():row.created_at?'Requested '+new Date(row.created_at).toLocaleString():null,
          row.expires_at?'Expires '+new Date(row.expires_at).toLocaleString():null
        ].filter(Boolean).join(' · ')));
        if(row.status==='ready'&&row.available_storage_path){
          item.append(button('Download Export',()=>downloadRestrictedPrivacyExport(row.available_storage_path)));
        }
        exportList.append(item);
      }
    }

    const requests=el('restricted-privacy-requests');
    requests.replaceChildren();
    const requestRows=Array.isArray(center.privacy_requests)?center.privacy_requests:[];
    if(!requestRows.length){
      requests.append(node('p','No privacy or data requests have been submitted.'));
    }else{
      for(const row of requestRows.slice(0,12)){
        const item=node('article');
        item.append(node('strong',String(row.request_type||'privacy request').replaceAll('_',' ')),node('p',[
          row.status,
          row.requested_at?'Requested '+new Date(row.requested_at).toLocaleString():null,
          row.completed_at?'Completed '+new Date(row.completed_at).toLocaleString():null
        ].filter(Boolean).join(' · ')));
        requests.append(item);
      }
    }
    updateRestrictedPrivacyProviderScope();
  }

  async function loadRestrictedPrivacy(){
    try{
      const [centerResult,exportsResult]=await Promise.all([
        client.from('my_privacy_center').select('*').maybeSingle(),
        client.from('my_privacy_exports').select('export_id,status,file_size_bytes,expires_at,created_at,ready_at,available_storage_path').limit(8)
      ]);
      if(centerResult.error||!centerResult.data){
        renderRestrictedPrivacy(null,[]);
        return;
      }
      renderRestrictedPrivacy(centerResult.data,exportsResult.error?[]:(exportsResult.data||[]));
    }catch{
      renderRestrictedPrivacy(null,[]);
    }
  }

  async function submitRestrictedPrivacyRequest(event){
    event.preventDefault();
    const type=el('restricted-privacy-type').value;
    const provider=el('restricted-privacy-provider').value;
    const note=el('restricted-privacy-note').value.trim();

    if(type==='account_delete'&&!window.confirm('Submit an account deletion request for staff review? This does not delete your account immediately.'))return;
    if(type==='health_data_delete'&&!window.confirm('Submit a health-data removal request for staff review? This is separate from provider disconnect.'))return;

    const button=el('restricted-privacy-form').querySelector('button');
    button.disabled=true;
    privacyStatus('Submitting request...');
    try{
      const requestId=await rpc('submit_my_privacy_request',{
        p_request_type:type,
        p_scope:type==='health_data_delete'&&provider?{provider_key:provider}:{},
        p_member_note:note||null
      });
      if(!requestId)throw new Error('Privacy request could not be created.');
      el('restricted-privacy-note').value='';
      privacyStatus('Privacy request submitted.');
      await loadRestrictedPrivacy();
    }catch(error){
      privacyStatus(error.message||'Privacy request could not be submitted.',true);
    }finally{
      button.disabled=false;
    }
  }

  async function load(){
    const {data:{session}}=await client.auth.getSession();el('auth').hidden=!!session;el('account').hidden=!session;
    if(!session){status('Sign in or create your own account to continue.');return;}
    if(invitation&&!load.invitationClaimed){await rpc('redeem_secondary_signer_invitation',{p_token:invitation});load.invitationClaimed=true;}
    if(enrollment&&!load.enrollmentClaimed){await rpc('claim_onboarding_enrollment',{p_token:enrollment});load.enrollmentClaimed=true;}
    const c=await rpc('my_onboarding_context');el('account-email').textContent=c.email||session.user.email;el('member-link').hidden=!c.full_access;
    const descriptions={invitation_required:['Open your enrollment invitation','Reopen the private enrollment link from ReVitalized to confirm access to your enrollment. Contact support if you need a new link.'],onboarding:['Complete your enrollment','Your account is ready for payments and agreements. Full member access starts when both requirements are satisfied.'],payment_suspended:['Payment resolution needed','Paid member features are paused. You can review billing and agreements and contact support.'],active:['Your membership','Review your agreements and payment status below.'],signer_only:['Your agreement invitation','You can review and sign the agreement you were invited to. This does not grant membership or household access.'],inactive:['Account access inactive','Contact ReVitalized Academy for help with your access.'],suspended:['Account access restricted','Contact ReVitalized Academy for help with your access.']};
    const description=descriptions[c.access_state]||descriptions.onboarding;el('state-title').textContent=description[0];el('state-description').textContent=description[1];
    el('enrollments').replaceChildren(...c.enrollments.map(a=>{const card=node('article');const amount=new Intl.NumberFormat(undefined,{style:'currency',currency:a.currency}).format((a.amount_cents||0)/100);card.append(node('h3',a.program_name||'Enrollment'),node('p',amount+' · '+(a.billing_choice||'Your agreed plan')),node('p',a.commitment_months?a.commitment_months+'-month commitment':''),node('p',a.payment_satisfied?'Payment requirement satisfied':'Payment required'));
      if(a.payment_url){try{const safeUrl=window.RVA_PAYMENT_URL(a.payment_url);const url=safeUrl?new URL(safeUrl):null;if(url){const link=node('a','Open secure payment page');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}}catch{/* Invalid payment links stay unavailable. */}}return card;}));
    el('agreements').replaceChildren(...c.agreements.map(renderAgreement));if(!c.agreements.length)el('agreements').append(node('p','No issued agreements are available for this account. If you received an invitation, reopen its link after verifying your email.'));
    el('notices').replaceChildren(...c.notifications.map(n=>{const item=node('article');item.append(node('h3',n.title),node('p',n.body||''));return item;}));
    await Promise.all([loadSupport(),loadRestrictedPrivacy()]);
    status('Your account status is up to date.');
  }
  el('login').addEventListener('submit',event=>{event.preventDefault();action(el('login').querySelector('button'),async()=>{const {error}=await client.auth.signInWithPassword({email:el('email').value.trim(),password:el('password').value});if(error)throw error;await load();});});
  el('signup').addEventListener('click',()=>action(el('signup'),async()=>{if(!el('login').reportValidity())return;const email=el('email').value.trim();const {data,error}=await client.auth.signUp({email,password:el('password').value,options:{emailRedirectTo:window.RVA_ENV.signupRedirect}});if(error)throw error;if(data.session)await load();else showSignupConfirmation(email);}));
  el('signup-back').addEventListener('click',showAuthForm);
  el('signout').addEventListener('click',()=>action(el('signout'),async()=>{const {error}=await client.auth.signOut();if(error)throw error;load.invitationClaimed=false;load.enrollmentClaimed=false;el('agreements').replaceChildren();el('enrollments').replaceChildren();el('notices').replaceChildren();el('support-thread').replaceChildren();el('support-center').hidden=true;el('restricted-privacy-center').hidden=true;await load();}));
  el('support-form').addEventListener('submit',sendSupportMessage);
  el('restricted-privacy-type').addEventListener('change',updateRestrictedPrivacyProviderScope);
  el('restricted-privacy-form').addEventListener('submit',submitRestrictedPrivacyRequest);
  el('refresh').addEventListener('click',()=>action(el('refresh'),load));
  load().catch(error=>status(error.message||'Unable to load your account.',true));
})();
