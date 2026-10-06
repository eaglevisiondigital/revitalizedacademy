const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const repoRoot=path.resolve(__dirname,'..');
const assetRoot=process.env.RVA_MEMBER_ASSET_ROOT?path.resolve(process.env.RVA_MEMBER_ASSET_ROOT):repoRoot;
const html=fs.readFileSync(path.join(assetRoot,'member/index.html'),'utf8');
const source=fs.readFileSync(path.join(assetRoot,'member/member110.js'),'utf8');
const reset=fs.readFileSync(path.join(assetRoot,'member/password-reset.html'),'utf8');
const edge=fs.readFileSync(path.join(repoRoot,'supabase/functions/member-password-reset/handler.ts'),'utf8');
const manifest=require(path.join(repoRoot,'config/public-files.json'));

test('member login exposes branded non-enumerating password recovery',()=>{
  assert.match(html,/id="rm-member-recovery-open"[^>]*>Forgot your password\?/);
  assert.match(html,/id="rm-member-recovery-form"[^>]*hidden/);
  assert.match(html,/Email My Reset Link/);
  assert.match(html,/id="rm-member-recovery-confirmation"[^>]*hidden/);
  assert.match(html,/Check Your Email/);
  assert.match(source,/functions\.invoke\("member-password-reset",\{body:\{email\}\}\)/);
  assert.match(source,/If that email belongs to an eligible member account/);
  assert.doesNotMatch(source,/auth\.resetPasswordForEmail/);
});

test('member recovery toggles cleanly and sends only the entered email',async(t)=>{
  const documentHtml=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  const dom=new JSDOM(documentHtml,{runScripts:'outside-only',url:'https://synthetic.invalid/member/'});t.after(()=>dom.window.close());
  const calls=[];
  const auth={getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithPassword:async()=>({data:{},error:null}),signOut:async()=>({})};
  const client={auth,functions:{invoke:async(name,options)=>{calls.push({name,options});return{data:{message:'If that email belongs to an eligible member account, a password reset email will be sent.'},error:null};}},rpc:async()=>({data:[],error:null}),from:()=>({select(){return this;},eq(){return this;},order(){return this;},limit(){return Promise.resolve({data:[],error:null});},maybeSingle(){return Promise.resolve({data:null,error:null});}})};
  dom.window.RVA_ENV={supabaseUrl:'https://synthetic.invalid',supabaseKey:'synthetic'};dom.window.supabase={createClient:()=>client};dom.window.eval(source);
  await new Promise(resolve=>setTimeout(resolve,250));
  dom.window.document.getElementById('rm-email').value='MEMBER@EXAMPLE.INVALID';
  dom.window.document.getElementById('rm-member-recovery-open').click();
  assert(dom.window.document.getElementById('rm-login-form').classList.contains('hidden'));
  assert.equal(dom.window.document.getElementById('rm-member-recovery-email').value,'MEMBER@EXAMPLE.INVALID');
  dom.window.document.getElementById('rm-member-recovery-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(JSON.stringify(calls),JSON.stringify([{name:'member-password-reset',options:{body:{email:'member@example.invalid'}}}]));
  assert.match(dom.window.document.getElementById('rm-member-recovery-status').textContent,/eligible member account/);
  assert(dom.window.document.getElementById('rm-member-recovery-form').classList.contains('hidden'));
  assert(!dom.window.document.getElementById('rm-member-recovery-confirmation').classList.contains('hidden'));
});

test('member reset page exchanges and scrubs the one-time recovery credential',()=>{
  assert(manifest.includes('member/password-reset.html'));
  assert.match(reset,/name="referrer" content="no-referrer"/);
  assert.match(reset,/persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:"rva-member-password-recovery"/);
  assert.match(reset,/history\.replaceState\(\{\},document\.title,location\.pathname\);\s*const \{data,error\}=await client\.auth\.verifyOtp/);
  assert.match(reset,/verifyOtp\(\{token_hash:tokenHash,type:"recovery"\}\)/);
  assert.doesNotMatch(reset,/auth\.getSession\(\)/);
  assert.match(reset,/auth\.updateUser\(\{password\}\)/);
  assert.match(reset,/location\.replace\("\/member\/"\)/);
  assert.doesNotMatch(reset,/staff_invite|complete_my_staff_invitation/);
});

test('member reset Edge function is member-scoped and non-enumerating',()=>{
  assert.match(edge,/from\("contacts"\).*select\("id,email"\).*eq\("email",email\)/s);
  assert.match(edge,/from\("client_access"\).*\.in\("status",\["ready","invited","onboarding","active","payment_suspended"\]\)/s);
  assert.match(edge,/auth\.admin\.getUserById\(accessRows\[0\]\.user_id\)/);
  assert.match(edge,/userData\?\.user\?\.email\?\.trim\(\)\.toLowerCase\(\)!==email/);
  assert.match(edge,/assertSyntheticRecipient\(email\)/);
  assert.match(edge,/actionUrl\.origin!==supabaseOrigin/);
  assert.match(edge,/actionUrl\.pathname!=="\/auth\/v1\/verify"/);
  assert.match(edge,/appOrigin\+"\/member\/password-reset\.html\?token_hash="/);
  assert.doesNotMatch(edge,/return json\([^\n]*token_hash/);
});
