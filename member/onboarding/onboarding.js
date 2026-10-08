/* Verified email + the existing secure enrollment claim; no new draft/token architecture. */
(() => {
  'use strict';
  const el=id=>document.getElementById(id),node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const params=new URLSearchParams(location.hash.slice(1));let enrollment=params.get('enroll'),invitation=params.get('invite');
  if(enrollment||invitation)history.replaceState(null,'',location.pathname);
  if(!window.RVA_ENV){el('status').textContent='Account configuration unavailable. Please contact support.';return;}
  const client=window.supabase.createClient(window.RVA_ENV.supabaseUrl,window.RVA_ENV.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  let epoch=0,identity=null,busy=false,loadRun=0;
  function status(text,error=false){el('status').textContent=text;el('status').className=error?'error':'';}
  function panel(id){for(const key of ['auth-panel','signup-confirmation','recovery-panel','recovery-confirmation','account-panel'])el(key).hidden=key!==id;}
  function clearPrivate(){epoch++;loadRun++;el('agreements').replaceChildren();el('enrollments').replaceChildren();el('account-email').textContent='';el('password').value='';panel('auth-panel');}
  async function rpc(name,args){const r=await client.rpc(name,args);if(r.error)throw r.error;return r.data;}
  async function action(button,work){if(busy)return;const run=epoch;busy=true;button.disabled=true;try{await work();}catch(error){if(run===epoch)status(error.message||'Unable to complete this action.',true);}finally{button.disabled=false;busy=false;}}
  function renderAgreement(a){
    const card=node('article');card.append(node('h3',a.name+' · '+a.template_version),node('p',a.status==='signed'?'Agreement Signed':a.accepted_signatures+' of '+a.required_client_signatures+' adult signatures recorded'));
    const details=node('details'),summary=node('summary','Review Full Agreement'),copy=node('div',a.content_text);copy.className='agreement-copy';copy.tabIndex=0;details.append(summary,copy);card.append(details);
    if(a.signer_role&&!a.already_signed&&!['signed','waived','declined'].includes(a.status)){
      const form=node('form'),label=node('label','Your full legal name'),name=node('input');name.required=true;name.minLength=2;name.maxLength=240;name.autocomplete='name';label.append(name);
      const acceptance=node('label'),check=node('input');check.type='checkbox';check.required=true;acceptance.className='acceptance';acceptance.append(check,document.createTextNode('I am an adult, have reviewed this agreement, accept its terms, and am signing for myself.'));
      const submit=node('button','Sign Agreement');submit.type='submit';form.append(label,acceptance,submit);
      form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const run=epoch,user=identity;action(submit,async()=>{await rpc('sign_client_agreement_atomic',{p_client_agreement_id:a.client_agreement_id,p_signatures:[{signer_role:a.signer_role,signer_name:name.value.trim()}],p_expected_content_hash:a.content_hash,p_user_agent:navigator.userAgent});if(run!==epoch||identity!==user)return;status('Your signature was recorded. Payment Required / Awaiting Payment.');await load();});});card.append(form);
    }
    return card;
  }
  async function load(){
    const serial=++loadRun,run=epoch;
    const {data,error}=await client.auth.getUser();if(serial!==loadRun||run!==epoch)return;
    if(error||!data.user){identity=null;clearPrivate();status('Sign in or create your own account to continue.');return;}
    const user=data.user;if(identity&&identity!==user.id)clearPrivate();identity=user.id;const currentEpoch=epoch;
    el('account-email').textContent=user.email||'';
    try{
      if((enrollment||invitation)&&!user.email_confirmed_at){panel('auth-panel');status('Verify your email, then reopen the original invitation.');return;}
      if(enrollment){await rpc('claim_onboarding_enrollment',{p_token:enrollment});enrollment=null;}
      if(invitation){await rpc('redeem_secondary_signer_invitation',{p_token:invitation});invitation=null;}
      const context=await rpc('my_onboarding_context');if(currentEpoch!==epoch||serial!==loadRun||identity!==user.id)return;
      el('enrollments').replaceChildren();el('agreements').replaceChildren();panel('account-panel');
      if(['inactive','suspended'].includes(context.access_state)){el('enrollments').append(node('h2','Your membership is '+context.access_state),node('p','Contact ReVitalized Academy to review your account status.'));status('Account signed in. Member access is '+context.access_state+'.');return;}
      if(!context.enrollments?.length&&!context.agreements?.length){el('enrollments').append(node('h2','Open your enrollment invitation'),node('p','Reopen the original private invitation after verifying your email. If you need a new invitation, contact ReVitalized Academy.'));}
      for(const a of context.enrollments||[]){const card=node('article');card.append(node('h2',a.program_name),node('p',new Intl.NumberFormat(undefined,{style:'currency',currency:a.currency}).format(a.amount_cents/100)+(a.billing_choice==='monthly'?' / month':' pay in full')),node('h3','Payment Required'),node('p','Awaiting Payment. Your agreement and account are preserved. Full member access will be available after the secure payment workflow is released and your payment is confirmed.'));el('enrollments').append(card);}
      for(const a of context.agreements||[])el('agreements').append(renderAgreement(a));
      if(!context.agreements?.length)el('agreements').append(node('p','No issued agreements are available. Reopen your original invitation or contact ReVitalized Academy.'));
      status('Account status loaded. Full paid member access remains held pending payment.');
    }catch(error){if(currentEpoch!==epoch||serial!==loadRun)return;clearPrivate();status(error.message||'Unable to load your enrollment. Reopen the original invitation.',true);}
  }
  el('login-form').addEventListener('submit',event=>{event.preventDefault();if(!event.target.reportValidity())return;action(el('sign-in'),async()=>{status('Signing in…');const r=await client.auth.signInWithPassword({email:el('email').value.trim().toLowerCase(),password:el('password').value});if(r.error)throw r.error;await load();});});
  el('create-account').addEventListener('click',()=>{if(!el('login-form').reportValidity())return;if(el('password').value.length<10){status('Choose a password with at least 10 characters.',true);return;}action(el('create-account'),async()=>{const email=el('email').value.trim().toLowerCase(),run=epoch;const r=await client.auth.signUp({email,password:el('password').value,options:{emailRedirectTo:window.RVA_ENV.appOrigin+'/member/onboarding/'}});if(r.error)throw r.error;if(run!==epoch)return;el('password').value='';if(r.data.session){await load();return;}el('signup-email').textContent=email;panel('signup-confirmation');status('Check your email to confirm your account.');el('signup-confirmation').focus();});});
  for(const id of ['back-to-sign-in','recovery-back','recovery-confirmation-back'])el(id).addEventListener('click',()=>{panel('auth-panel');status('Sign in with the email on your invitation.');});
  el('open-recovery').addEventListener('click',()=>{panel('recovery-panel');el('recovery-email').value=el('email').value;el('recovery-email').focus();});
  el('recovery-form').addEventListener('submit',event=>{event.preventDefault();if(!event.target.reportValidity())return;action(event.target.querySelector('button'),async()=>{const r=await client.functions.invoke('member-password-reset',{body:{email:el('recovery-email').value.trim().toLowerCase()}});if(r.error)throw Error('Unable to request a reset email. Please try again.');panel('recovery-confirmation');status('Reset request received. Check your email.');el('recovery-confirmation').focus();});});
  el('refresh').addEventListener('click',()=>action(el('refresh'),load));
  el('sign-out').addEventListener('click',async()=>{enrollment=null;invitation=null;identity=null;clearPrivate();try{const r=await client.auth.signOut();status(r.error?'Sign-out could not be completed. Please close this tab and retry.':'Signed out.',!!r.error);}catch{status('Sign-out could not be completed. Please close this tab and retry.',true);}});
  client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){identity=null;enrollment=null;invitation=null;clearPrivate();status('Signed out.');}else if(session?.user?.id&&identity&&identity!==session.user.id){identity=null;clearPrivate();setTimeout(load,0);}});
  load();
})();
