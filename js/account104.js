(() => {
  const sb=window.supabase.createClient('https://voalfpxiyznnqfcqcymd.supabase.co','sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd');
  const auth=document.getElementById('account-auth'),dash=document.getElementById('account-dashboard'),status=document.getElementById('account-status');
  let mode='login';

  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{
    mode=btn.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('is-active',b===btn));
    document.getElementById('account-signup-fields').hidden=mode!=='signup';
    document.getElementById('account-submit').innerHTML=mode==='signup'?'Create My Account <span>→</span>':'Sign In <span>→</span>';
    status.textContent='';
  }));

  document.getElementById('account-form').addEventListener('submit',async e=>{
    e.preventDefault();status.textContent=mode==='signup'?'Creating your account...':'Signing in...';
    const email=document.getElementById('account-email').value,password=document.getElementById('account-password').value;
    let result;
    if(mode==='signup'){
      result=await sb.auth.signUp({email,password,options:{data:{first_name:document.getElementById('account-first').value,last_name:document.getElementById('account-last').value}}});
      if(!result.error&&!result.data.session){status.textContent='Check your email to confirm your account, then return here to sign in.';return}
    }else result=await sb.auth.signInWithPassword({email,password});
    if(result.error){status.textContent=result.error.message;return}
    status.textContent='';await loadJourney();
  });

  async function loadJourney(){
    const {data:{session}}=await sb.auth.getSession();
    if(!session){auth.hidden=false;dash.hidden=true;return}
    const {data,error}=await sb.from('my_journey_status').select('*').maybeSingle();
    if(error||!data){status.textContent='Your ReVitalized profile is being connected. Please try again shortly.';return}
    auth.hidden=true;dash.hidden=false;
    document.getElementById('account-name').textContent=data.first_name||'there';
    const v=data.vitality_status||'not started',e=data.enrollment_status||'not started',w=data.webinar_status||'not registered';
    document.getElementById('account-vitality-status').textContent=v.replaceAll('_',' ');
    document.getElementById('account-vitality-bar').style.width=(data.vitality_completion||0)+'%';
    document.getElementById('account-vitality-copy').textContent=v==='completed'?'Your assessment has been completed and is connected to your profile.':'Your progress can stay connected to your ReVitalized profile.';
    document.getElementById('account-vitality-link').textContent=v==='completed'?'View Assessment Page →':'Continue Assessment →';
    document.getElementById('account-webinar-status').textContent=w.replaceAll('_',' ');
    document.getElementById('account-webinar-copy').textContent=w==='not registered'?'Join the priority list for the private Founders webinar.':'Your webinar registration is connected to this account.';
    document.getElementById('account-enrollment-status').textContent=e.replaceAll('_',' ');
    document.getElementById('account-enrollment-bar').style.width=(data.enrollment_completion||0)+'%';
    document.getElementById('account-enrollment-link').textContent=e==='not started'?'Start Enrollment →':'Continue Enrollment →';
  }
  document.getElementById('account-signout').addEventListener('click',async()=>{await sb.auth.signOut();location.reload()});
  loadJourney();
})();