const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const root=process.env.RVA_STAFF_ASSET_ROOT||path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'portal/index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'portal/portal-staff-access.js'),'utf8');
const core=fs.readFileSync(path.join(root,'portal/portal.js'),'utf8');
const reset=fs.readFileSync(path.join(root,'portal/password-reset.html'),'utf8');
const resetFunction=fs.readFileSync(path.join(root,'supabase/functions/staff-password-reset/index.ts'),'utf8');
const staffHandler=fs.existsSync(path.join(root,'supabase/functions/staff-management/handler.ts'))
  ?fs.readFileSync(path.join(root,'supabase/functions/staff-management/handler.ts'),'utf8')
  :'';

test('pending staff email recovery is exposed through the current staff manager',()=>{
  assert.match(html,/id="staff-edit-email"[^>]*type="email"/);
  assert.match(html,/id="staff-reconcile-email"/);
  assert.match(html,/portal-staff-access\.js\?v=183/);
  assert.match(source,/action:"reconcile_pending_email"/);
  assert.match(source,/user_id:activeStaff\.user_id/);
  assert.match(source,/Enter a reason before changing a staff email/);
  assert.match(source,/Email updated and a fresh secure setup message was sent/);
});

test('staff invitation landing provides a guided password-setup recovery path',()=>{
  assert.match(html,/id="staff-setup-card"/);
  assert.match(html,/Finish setting up your staff account/);
  assert.match(html,/Email My Password Setup Link/);
  assert.match(html,/portal\.js\?v=191/);
  assert.match(core,/initialQuery\.get\("setup"\) === "staff"/);
  assert.match(core,/functions\.invoke\("staff-password-reset"/);
  assert.doesNotMatch(core,/auth\.resetPasswordForEmail/);
  if(staffHandler){
    assert.match(staffHandler,/staffRedirect\+"\?setup=staff"/);
    assert.match(staffHandler,/emailRedirectTo:staffSetupRedirect/);
  }
});

test('dedicated reset completion closes staff invitation metadata',()=>{
  assert.match(reset,/staff_invite:false/);
  assert.match(reset,/staff_invite_completed:true/);
  assert.match(reset,/complete_my_staff_invitation/);
});

test('staff reset email uses the verified recovery action before the branded password page',()=>{
  assert.match(resetFunction,/redirectTo:recoveryRedirect/);
  assert.match(resetFunction,/actionUrl\.pathname!=="\/auth\/v1\/verify"/);
  assert.match(resetFunction,/actionUrl\.searchParams\.get\("type"\)!=="recovery"/);
  assert.match(resetFunction,/actionUrl\.searchParams\.set\("redirect_to",recoveryRedirect\)/);
  assert.match(resetFunction,/href="'\+safeActionLink\+'/);
  assert.doesNotMatch(resetFunction,/recoveryRedirect\+"\?token_hash="/);
});

test('normal sign-in does not loop on stale invitation metadata',()=>{
  const resolve=core.match(/async function resolveStaff\(session\)[\s\S]*?\n  async function loadDashboard/)?.[0]||'';
  assert.doesNotMatch(resolve,/invitedUser/);
  assert.match(resolve,/staffSetupRequested/);
  assert.match(html,/We could not match this account to staff access/);
  assert.doesNotMatch(html,/id="pending-password"/);
});

test('setup callback without a browser session shows the guided recovery form and uses the branded reset function',async(t)=>{
  const documentHtml=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  const dom=new JSDOM(documentHtml,{runScripts:'outside-only',url:'https://synthetic.invalid/portal/?setup=staff'});
  t.after(()=>dom.window.close());
  const w=dom.window,calls=[];
  const client={
    auth:{
      getSession:async()=>({data:{session:null},error:null}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
      stopAutoRefresh(){}
    },
    functions:{invoke:async(name,options)=>{calls.push({name,options});return{data:{message:'Check your inbox.'},error:null};}},
    rpc:async()=>({data:[]}),
    from:()=>({select(){return this;},order(){return this;},limit(){return Promise.resolve({data:[]});}})
  };
  w.RVA_ENV={supabaseUrl:'https://synthetic.invalid',supabaseKey:'synthetic',staffRedirect:'https://synthetic.invalid/portal/',recoveryRedirect:'https://synthetic.invalid/portal/password-reset.html'};
  w.supabase={createClient:()=>client};
  w.eval(core);
  await new Promise(resolve=>setTimeout(resolve,400));
  assert(!w.document.getElementById('staff-setup-card').classList.contains('hidden'));
  assert(w.document.getElementById('login-form').classList.contains('hidden'));
  w.document.getElementById('staff-setup-email').value='coach@example.invalid';
  w.document.getElementById('staff-setup-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.length,1);
  assert.equal(calls[0].name,'staff-password-reset');
  assert.equal(calls[0].options.body.email,'coach@example.invalid');
  assert.match(w.document.getElementById('staff-setup-status').textContent,/Check your inbox/);
});

test('the staff email recovery does not create a second invite in the browser',()=>{
  const fn=source.match(/async function reconcilePendingEmail\(\)\{[\s\S]*?\n  \}/)?.[0]||'';
  assert.match(fn,/reconcile_pending_email/);
  assert.doesNotMatch(fn,/action:"invite"/);
  assert.doesNotMatch(fn,/from\("staff_invitations"\)/);
});
