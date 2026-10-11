// Exact-built, isolated auth-restore acceptance in Chromium and WebKit.
// Network, credentials and hosted data are not used.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const playwright=require(process.env.RVA_PLAYWRIGHT_MODULE||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root=path.resolve(__dirname,'../..');
const built=process.env.RVA_SESSION_ASSET_ROOT?path.resolve(process.env.RVA_SESSION_ASSET_ROOT):path.join(root,'dist');
const read=file=>fs.readFileSync(path.join(built,file),'utf8');
const stripScripts=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const script=value=>value.replace(/<\/script/gi,'<\\/script');

function mock(surface){return `(()=>{
  const params=new URLSearchParams(location.search),seed=params.get('seed'),delayed=params.get('delayed')==='1';
  const key='rva-isolated-auth-fixture';if(seed)localStorage.setItem(key,seed);
  if(seed||delayed)history.replaceState({},'',location.pathname+location.hash);
  let listener=null,reads=0;const user=()=>localStorage.getItem(key);const session=()=>user()?{access_token:'token-'+user(),user:{id:user(),user_metadata:{}}}:null;
  const result=(data,error=null)=>({data,error});
  const chain=data=>{const q={};for(const name of ['select','eq','in','order','limit','neq','maybeSingle','single','insert','update','delete','upsert'])q[name]=()=>q;q.then=(a,b)=>Promise.resolve(result(data)).then(a,b);return q;};
  const rpc=async(name)=>{
    if(name==='get_my_staff_access')return result({status:'active',display_name:'Fixture '+user(),role:user()?.includes('coach')?'coach':'owner',contact_scope:user()?.includes('coach')?'assigned':'all'});
    if(name==='member_paid_access_allowed')return result(true);
    if(name==='my_member_dashboard')return result({contact_id:'contact-'+user(),user_id:user(),first_name:'Fixture',last_name:user(),program_name:'Holistic Foundations',access_status:'active',membership_status:'active'});
    if(name==='my_app_bootstrap_v2')return result({access:{nutrition_enabled:true,fitness_enabled:true,biometrics_enabled:true},progress_snapshot:{}});
    if(name==='my_member_entitlements'||name==='get_my_health_metric_configuration')return result([]);
    if(name==='app_runtime_config')return result([]);
    return result([]);
  };
  const auth={
    async getSession(){reads++;return result({session:delayed&&reads===1?null:session()});},
    async getUser(){return result({user:session()?.user||null});},
    onAuthStateChange(fn){listener=fn;if(delayed)setTimeout(()=>fn('INITIAL_SESSION',session()),600);return {data:{subscription:{unsubscribe(){listener=null;}}}};},
    async signOut(){localStorage.removeItem(key);listener?.('SIGNED_OUT',null);return {error:null};},
    stopAutoRefresh(){},async signInWithPassword(){return result({session:session()});}
  };
  const client={auth,rpc,functions:{invoke:async()=>result({})},storage:{from:()=>({createSignedUrl:async()=>result({signedUrl:''})})},from(name){
    if(name==='staff_directory')return chain([{user_id:user(),display_name:'Fixture '+user(),role:user()?.includes('coach')?'coach':'owner',contact_scope:user()?.includes('coach')?'assigned':'all'}]);
    if(name==='admin_dashboard_metrics')return chain({});
    if(name==='my_app_bootstrap_v2')return chain({access:{nutrition_enabled:true,fitness_enabled:true,biometrics_enabled:true},progress_snapshot:{}});
    if(name==='my_member_dashboard')return chain({contact_id:'contact-'+user(),user_id:user(),first_name:'Fixture',last_name:user(),program_name:'Holistic Foundations',access_status:'active',membership_status:'active'});
    if(name==='my_member_entitlements')return chain([]);
    return chain([]);
  }};
  window.RVA_ENV={supabaseUrl:'https://bvooallokgfktssadsrv.supabase.co',supabaseKey:'public-fixture',staffRedirect:location.origin+'/portal/'};
  window.supabase={createClient(_url,_key,options){window.__AUTH_OPTIONS__=options.auth;return client;}};
  window.__AUTH_FIXTURE__={emit:(event,next)=>{if(next===null)localStorage.removeItem(key);else if(next)localStorage.setItem(key,next);listener?.(event,session());},reads:()=>reads};
})();`}

function documentFor(surface){
  const html=stripScripts(read(surface==='member'?'member/index.html':'portal/index.html'));
  const source=read(surface==='member'?'member/member110.js':'portal/portal.js');
  return html.replace('</body>',`<script>${script(mock(surface))}</script><script>${script(source)}</script></body>`);
}

async function route(context,origin,surface){
  const body=documentFor(surface);
  await context.route(origin+'/**',async request=>{
    const url=new URL(request.request().url());
    if(request.request().resourceType()==='document')return request.fulfill({status:200,contentType:'text/html',body});
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/,''),file=path.resolve(built,relative);
    if(!file.startsWith(built+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return request.fulfill({status:404,body:''});
    const ext=path.extname(file).toLowerCase();
    const types={'.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
    return request.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:fs.readFileSync(file)});
  });
}

async function visible(page,selector){
  try{await page.locator(selector).waitFor({state:'visible',timeout:5000});}
  catch(error){console.error('Visible body for '+selector+':\n'+await page.locator('body').innerText());throw error;}
}
async function noOverflow(page){return page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth);}
function launch(type,name){return type.launch({headless:true,...(name==='chromium'?{executablePath:process.env.RVA_CHROMIUM_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});}

async function staffMatrix(browserType,name,origin){
  const context=await launch(browserType,name).then(browser=>({browser,context:null}));
  context.context=await context.browser.newContext({viewport:{width:name==='webkit'?390:1440,height:name==='webkit'?844:1000}});
  let checks=0;
  try{
    await route(context.context,origin,'staff');
    const page=await context.context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/portal/?seed=owner-a');await visible(page,'#portal-view');checks++;
    assert.equal(await page.locator('#staff-role').innerText(),'Owner');checks++;
    await page.reload();await visible(page,'#portal-view');checks++;
    await page.goto(origin+'/portal/?hard=1');await visible(page,'#portal-view');checks++;
    const second=await context.context.newPage();await second.goto(origin+'/portal/');await visible(second,'#portal-view');checks++;
    const delayed=await context.context.newPage();await delayed.goto(origin+'/portal/?delayed=1');await visible(delayed,'#session-restore-card');assert(await delayed.locator('#login-card').isHidden());checks++;
    await visible(delayed,'#portal-view');checks++;
    assert.equal(await noOverflow(page),true);assert.equal(await noOverflow(delayed),true);checks++;
    await page.bringToFront();
    await page.locator('#logout-button').click();await visible(page,'#login-card');checks++;
    await page.reload();await visible(page,'#login-card');assert(await page.locator('#portal-view').isHidden());checks++;
    assert.deepEqual(errors,[]);checks++;
    await second.close();await delayed.close();await page.close();
    return checks;
  }finally{await context.browser.close();}
}

async function memberMatrix(browserType,name){
  const browser=await launch(browserType,name);
  const context=await browser.newContext({viewport:{width:name==='webkit'?390:1440,height:name==='webkit'?844:1000}});
  let checks=0;
  try{
    const origin='https://beta.revitalizedacademy.com';await route(context,origin,'member');
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/member/?seed=member-a');await visible(page,'#rm-dashboard');checks++;
    assert.match(await page.locator('#rm-member-name').innerText(),/member-a/);checks++;
    await page.reload();await visible(page,'#rm-dashboard');checks++;
    await page.goto(origin+'/member/?hard=1');await visible(page,'#rm-dashboard');checks++;
    const second=await context.newPage();await second.goto(origin+'/member/');await visible(second,'#rm-dashboard');checks++;
    const delayed=await context.newPage();await delayed.goto(origin+'/member/?delayed=1');await visible(delayed,'#rm-session-restoring');assert(await delayed.locator('#rm-auth').isHidden());checks++;
    await visible(delayed,'#rm-dashboard');checks++;
    assert.equal(await noOverflow(page),true);assert.equal(await noOverflow(delayed),true);checks++;
    await page.bringToFront();
    await page.locator('#rm-signout').click();await visible(page,'#rm-auth');checks++;
    await page.reload();await visible(page,'#rm-auth');assert(await page.locator('#rm-dashboard').isHidden());checks++;
    assert.deepEqual(errors,[]);checks++;
    await second.close();await delayed.close();await page.close();
    return checks;
  }finally{await browser.close();}
}

(async()=>{
  assert.match(read('portal/index.html'),/portal\.js\?v=192/);
  assert.match(read('member/index.html'),/member110\.js\?v=216/);
  let total=2;
  const requested=process.env.RVA_BROWSER||'';
  const browsers=[['chromium',playwright.chromium],['webkit',playwright.webkit]].filter(([name])=>!requested||name===requested);
  for(const [name,type] of browsers){
    total+=await staffMatrix(type,name,'https://beta.revitalizedacademy.com');
    total+=await memberMatrix(type,name);
    console.log(name+' beta staff/member session restore: passed');
  }
  console.log('Exact-built beta session checks: '+total+' passed');
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
