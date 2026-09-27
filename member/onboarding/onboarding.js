(() => {
  'use strict';
  const params=new URLSearchParams(window.location.hash.slice(1));
  const invitation=params.get('invite'),enrollment=params.get('enroll');
  // Invitation credentials never enter query strings, persistent storage or telemetry.
  if(invitation||enrollment)window.history.replaceState(null,'',window.location.pathname);
  const client=window.supabase.createClient('https://voalfpxiyznnqfcqcymd.supabase.co','sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const el=id=>document.getElementById(id);
  const status=(message,error=false)=>{el('status').textContent=message;el('status').className=error?'error':'';};
  const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
  async function action(button,fn){button.disabled=true;try{await fn();}catch(error){status(error.message||'Unable to complete this action.',true);}finally{button.disabled=false;}}
  function button(label,fn){const b=node('button',label);b.type='button';b.addEventListener('click',()=>action(b,fn));return b;}
  function renderAgreement(a){
    const card=node('article'),title=node('h3',a.name+' · version '+a.template_version);
    card.append(title,node('p',`${a.accepted_signatures} of ${a.required_client_signatures} adult signatures recorded · ${a.status}`));
    const details=node('details'),summary=node('summary','Read the complete agreement'),copy=node('div',a.content_text);
    copy.className='agreement-copy';copy.tabIndex=0;details.append(summary,copy);card.append(details);
    if(a.signer_role&&!a.already_signed&&!['signed','waived','declined'].includes(a.status)){
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
  async function load(){
    const {data:{session}}=await client.auth.getSession();el('auth').hidden=!!session;el('account').hidden=!session;
    if(!session){status('Sign in or create your own account to continue.');return;}
    if(invitation&&!load.invitationClaimed){await rpc('redeem_secondary_signer_invitation',{p_token:invitation});load.invitationClaimed=true;}
    if(enrollment&&!load.enrollmentClaimed){await rpc('claim_onboarding_enrollment',{p_token:enrollment});load.enrollmentClaimed=true;}
    const c=await rpc('my_onboarding_context');el('account-email').textContent=c.email||session.user.email;el('member-link').hidden=!c.full_access;
    const descriptions={invitation_required:['Open your enrollment invitation','Reopen the private enrollment link from ReVitalized to confirm access to your enrollment. Contact support if you need a new link.'],onboarding:['Complete your enrollment','Your account is ready for payments and agreements. Full member access starts when both requirements are satisfied.'],payment_suspended:['Payment resolution needed','Paid member features are paused. You can review billing and agreements and contact support.'],active:['Your membership','Review your agreements and payment status below.'],signer_only:['Your agreement invitation','You can review and sign the agreement you were invited to. This does not grant membership or household access.'],inactive:['Account access inactive','Contact ReVitalized Academy for help with your access.'],suspended:['Account access restricted','Contact ReVitalized Academy for help with your access.']};
    const description=descriptions[c.access_state]||descriptions.onboarding;el('state-title').textContent=description[0];el('state-description').textContent=description[1];
    el('enrollments').replaceChildren(...c.enrollments.map(a=>{const card=node('article');const amount=new Intl.NumberFormat(undefined,{style:'currency',currency:a.currency}).format((a.amount_cents||0)/100);card.append(node('h3',a.program_name||'Enrollment'),node('p',amount+' · '+(a.billing_choice||'Your agreed plan')),node('p',a.commitment_months?a.commitment_months+'-month commitment':''),node('p',a.payment_satisfied?'Payment requirement satisfied':'Payment required'));
      if(a.payment_url){try{const url=new URL(a.payment_url);if(url.protocol==='https:'){const link=node('a','Open secure payment page');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}}catch{/* Invalid payment links stay unavailable. */}}return card;}));
    el('agreements').replaceChildren(...c.agreements.map(renderAgreement));if(!c.agreements.length)el('agreements').append(node('p','No issued agreements are available for this account. If you received an invitation, reopen its link after verifying your email.'));
    el('notices').replaceChildren(...c.notifications.map(n=>{const item=node('article');item.append(node('h3',n.title),node('p',n.body||''));return item;}));
    status('Your account status is up to date.');
  }
  el('login').addEventListener('submit',event=>{event.preventDefault();action(el('login').querySelector('button'),async()=>{const {error}=await client.auth.signInWithPassword({email:el('email').value.trim(),password:el('password').value});if(error)throw error;await load();});});
  el('signup').addEventListener('click',()=>action(el('signup'),async()=>{if(!el('login').reportValidity())return;const {data,error}=await client.auth.signUp({email:el('email').value.trim(),password:el('password').value,options:{emailRedirectTo:window.location.origin+'/member/onboarding/'}});if(error)throw error;if(data.session)await load();else status('Check your email to verify your account, then reopen your original invitation.');}));
  el('signout').addEventListener('click',()=>action(el('signout'),async()=>{const {error}=await client.auth.signOut();if(error)throw error;load.invitationClaimed=false;load.enrollmentClaimed=false;el('agreements').replaceChildren();el('enrollments').replaceChildren();el('notices').replaceChildren();await load();}));
  el('refresh').addEventListener('click',()=>action(el('refresh'),load));
  load().catch(error=>status(error.message||'Unable to load your account.',true));
})();
