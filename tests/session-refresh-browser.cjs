// Exact-built, isolated production staff auth-restore acceptance in Chromium and WebKit.
// Network, credentials and hosted data are not used.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const playwright=require(process.env.RVA_PLAYWRIGHT_MODULE||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root=path.resolve(__dirname,'..');
const built=process.env.RVA_SESSION_ASSET_ROOT?path.resolve(process.env.RVA_SESSION_ASSET_ROOT):path.join(root,'production-dist');
const read=file=>fs.readFileSync(path.join(built,file),'utf8');
const moduleFiles=['portal-permissions.js','portal-staff-onboarding.js','portal-refuel.js','portal-community.js','portal-executive.js'];
const stripScripts=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const script=value=>value.replace(/<\/script/gi,'<\\/script');

const mock=`(()=>{
  const params=new URLSearchParams(location.search),seed=params.get('seed'),delayed=params.get('delayed')==='1',lateModules=params.get('lateModules')==='1',holdSignOut=params.get('holdSignOut')==='1',inactive=params.get('inactive')==='1';
  const key='rva-isolated-production-auth-fixture';if(seed)localStorage.setItem(key,seed);
  if(seed||delayed||lateModules||holdSignOut||inactive)history.replaceState({},'',location.pathname+location.hash);
  let listener=null,reads=0;const user=()=>localStorage.getItem(key);const session=()=>user()?{access_token:'token-'+user(),user:{id:user(),user_metadata:{}}}:null;
  const moduleTables=new Set(['my_staff_permissions_view','my_staff_agreements','admin_refuel_pipeline','refuel_offers','admin_refuel_metrics','admin_community_spaces','admin_community_feed','admin_community_metrics','admin_platform_health_metrics','admin_conversion_funnel','admin_program_performance']);
  window.__MODULE_CALLS__={};const late=[];window.__FINISH_MODULES__=()=>{for(const done of late.splice(0))done();};
  const result=(data,error=null)=>({data,error});
  const chain=(name,data)=>{if(moduleTables.has(name))window.__MODULE_CALLS__[name]=(window.__MODULE_CALLS__[name]||0)+1;const q={};for(const method of ['select','eq','in','order','limit','neq','maybeSingle','single','insert','update','delete','upsert'])q[method]=()=>q;q.then=(a,b)=>{if(lateModules&&moduleTables.has(name))return new Promise(resolve=>late.push(()=>resolve(result(null,new Error('late signed-out module response'))))).then(a,b);return Promise.resolve(result(data)).then(a,b);};return q;};
  const auth={async getSession(){reads++;return result({session:delayed&&reads===1?null:session()});},async getUser(){return result({user:session()?.user||null});},onAuthStateChange(fn){listener=fn;if(delayed)setTimeout(()=>fn('INITIAL_SESSION',session()),600);return {data:{subscription:{unsubscribe(){listener=null;}}}};},async signOut(){localStorage.removeItem(key);listener?.('SIGNED_OUT',null);if(holdSignOut)return new Promise(resolve=>{window.__FINISH_SIGNOUT__=()=>resolve({error:null});});return {error:null};},stopAutoRefresh(){},async signInWithPassword(){return result({session:session()});}};
  const client={auth,rpc:async name=>name==='get_my_staff_access'?result({status:inactive?'inactive':'active',display_name:'Fixture '+user(),role:'owner',contact_scope:'all'}):result([]),functions:{invoke:async()=>result({})},from(name){if(name==='staff_directory')return chain(name,[{user_id:user(),display_name:'Fixture '+user(),role:'owner',contact_scope:'all'}]);if(['admin_dashboard_metrics','admin_refuel_metrics','admin_community_metrics','admin_platform_health_metrics'].includes(name))return chain(name,{});return chain(name,[]);}};
  window.RVA_ENV={supabaseUrl:'https://voalfpxiyznnqfcqcymd.supabase.co',supabaseKey:'public-fixture',staffRedirect:location.origin+'/portal/'};
  window.supabase={createClient(_url,_key,options){window.__AUTH_OPTIONS__=options.auth;return client;}};
})();`;

function document(){
  const html=stripScripts(read('portal/index.html'));
  const modules=moduleFiles.map(file=>`<script>${script(read('portal/'+file))}</script>`).join('');
  return html.replace('</body>',`<script>${script(mock)}</script><script>${script(read('portal/portal.js'))}</script>${modules}</body>`);
}
async function route(context,origin){
  const body=document();
  await context.route(origin+'/**',async request=>{
    const url=new URL(request.request().url());
    if(request.request().resourceType()==='document')return request.fulfill({status:200,contentType:'text/html',body});
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/,''),file=path.resolve(built,relative);
    if(!file.startsWith(built+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return request.fulfill({status:404,body:''});
    const ext=path.extname(file).toLowerCase(),types={'.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
    return request.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:fs.readFileSync(file)});
  });
}
async function visible(page,selector){await page.locator(selector).waitFor({state:'visible',timeout:5000});}
async function noOverflow(page){return page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth);}
function launch(type,name){return type.launch({headless:true,...(name==='chromium'?{executablePath:process.env.RVA_CHROMIUM_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});}

async function matrix(type,name){
  const browser=await launch(type,name),context=await browser.newContext({viewport:{width:name==='webkit'?390:1440,height:name==='webkit'?844:1000}}),origin='https://revitalizedacademy.com';
  let checks=0;
  try{
    await route(context,origin);
    const page=await context.newPage(),errors=[];
    const watch=target=>{target.on('pageerror',error=>errors.push(error.message));target.on('console',message=>{if(['warning','error'].includes(message.type()))errors.push(message.type()+': '+message.text());});};
    watch(page);
    await page.goto(origin+'/portal/?seed=owner-a');await visible(page,'#portal-view');checks++;
    assert.equal(await page.locator('#staff-role').innerText(),'Owner');checks++;
    await page.waitForFunction(()=>Object.keys(window.__MODULE_CALLS__||{}).length===11);
    assert.deepEqual((await page.evaluate(()=>Object.keys(window.__MODULE_CALLS__||{}))).sort(),['admin_community_feed','admin_community_metrics','admin_community_spaces','admin_conversion_funnel','admin_platform_health_metrics','admin_program_performance','admin_refuel_metrics','admin_refuel_pipeline','my_staff_agreements','my_staff_permissions_view','refuel_offers']);checks++;
    await page.reload();await visible(page,'#portal-view');checks++;
    await page.goto(origin+'/portal/?hard=1');await visible(page,'#portal-view');checks++;
    const second=await context.newPage();watch(second);await second.goto(origin+'/portal/');await visible(second,'#portal-view');checks++;
    const delayed=await context.newPage();watch(delayed);await delayed.goto(origin+'/portal/?delayed=1');await visible(delayed,'#session-restore-card');assert(await delayed.locator('#login-card').isHidden());checks++;
    await visible(delayed,'#portal-view');checks++;
    assert.equal(await noOverflow(page),true);assert.equal(await noOverflow(delayed),true);checks++;
    await page.bringToFront();
    await page.locator('#logout-button').click();await visible(page,'#login-card');checks++;
    await page.reload();await visible(page,'#login-card');assert(await page.locator('#portal-view').isHidden());await page.waitForTimeout(1200);checks++;
    assert.equal(await page.evaluate(()=>Object.keys(window.__MODULE_CALLS__||{}).length),0);checks++;

    const stale=await context.newPage();watch(stale);await stale.goto(origin+'/portal/?seed=owner-stale&lateModules=1&holdSignOut=1');await visible(stale,'#portal-view');
    await stale.waitForFunction(()=>Object.keys(window.__MODULE_CALLS__||{}).length===11);checks++;
    await stale.locator('#logout-button').click();await stale.getByText('Signing out…').waitFor({state:'visible'});
    await stale.evaluate(()=>window.__FINISH_MODULES__());await stale.waitForTimeout(100);assert.deepEqual(errors,[]);checks++;
    await stale.evaluate(()=>window.__FINISH_SIGNOUT__());await visible(stale,'#login-card');checks++;

    const revoked=await context.newPage();watch(revoked);await revoked.goto(origin+'/portal/?seed=revoked&inactive=1');await visible(revoked,'#login-card');await revoked.getByText(/staff access is inactive/i).waitFor({state:'visible'});await revoked.waitForTimeout(1200);assert.equal(await revoked.evaluate(()=>Object.keys(window.__MODULE_CALLS__||{}).length),0);checks++;

    const next=await context.newPage();watch(next);await next.goto(origin+'/portal/?seed=owner-b');await visible(next,'#portal-view');assert.equal(await next.locator('#staff-name').innerText(),'Fixture owner-b');checks++;
    await next.waitForFunction(()=>Object.keys(window.__MODULE_CALLS__||{}).length===11);checks++;
    assert.deepEqual(errors,[]);checks++;
    await second.close();await delayed.close();await page.close();
    await stale.close();await revoked.close();await next.close();
    return checks;
  }finally{await browser.close();}
}

(async()=>{
  assert.match(read('portal/index.html'),/portal\.js\?v=193/);let total=1;
  const requested=process.env.RVA_BROWSER||'';
  for(const [name,type] of [['chromium',playwright.chromium],['webkit',playwright.webkit]].filter(([name])=>!requested||name===requested)){
    total+=await matrix(type,name);console.log(name+' production staff session restore: passed');
  }
  console.log('Exact-built production session checks: '+total+' passed');
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
