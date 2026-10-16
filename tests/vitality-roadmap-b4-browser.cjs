// Exact production-built assets → same-origin handler → real LOCAL PG17 RPCs. Fictional only.
const fs=require('node:fs'),assert=require('node:assert/strict'),{Client}=require('pg'),{randomUUID}=require('node:crypto');
const pw=require(process.env.RVA_PLAYWRIGHT_PATH||'playwright');
const {seed}=require('./fixtures/roadmap-b4.cjs'),{createHandler}=require('../netlify/lib/roadmap-founder.cjs');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||'')||process.env.PGHOST!=='127.0.0.1')throw Error('Disposable localhost fixture required');
const db=new Client(),context={site:{id:'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06'},deploy:{context:'production'}};
(async()=>{await db.connect();let checks=0;const results=[];
try{for(const engine of ['chromium','webkit']){const browser=await pw[engine].launch(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{});
try{for(const [width,height]of [[1440,1000],[768,1024],[390,844]]){
 await db.query('begin');const f=await seed(db);let identity='justyn',delayRead=false,releaseRead=null,requests=0,authorized=true;
 const handler=createHandler({fetch:async(url,init)=>{assert.equal(url,'https://voalfpxiyznnqfcqcymd.supabase.co/rest/v1/rpc/roadmap_b4');const p=JSON.parse(init.body),user=init.headers.Authorization.includes('elle')?f.elle:f.justyn;try{const data=await f.actor(user,p.p_action,p.p_report,p.p_payload);return Response.json(data);}catch(e){return Response.json({code:e.code},{status:403});}}});
 const page=await browser.newPage({viewport:{width,height}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('LOCAL PAGE ERROR',e.message);});page.on('console',m=>{if(['warning','error'].includes(m.type()))errors.push(m.text());});
 await page.route('https://revitalizedacademy.com/**',async route=>{
  const r=route.request(),url=new URL(r.url());
  if(url.pathname==='/.netlify/functions/roadmap-founder'){
   requests++;const body=JSON.parse(r.postData());if(delayRead&&body.action==='read'){delayRead=false;await new Promise(resolve=>releaseRead=resolve);}
   const req=new Request(r.url(),{method:r.method(),headers:await r.allHeaders(),body:r.postData()});
   const response=await handler(req,context);if(response.status!==200)console.error('LOCAL API STATUS',body.action,response.status,req.headers.get('origin'));return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  }
  if(url.pathname==='/portal/'){
   return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fictional B4 local fixture</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/vitality-roadmap-workspace.css"></head><body><section id="vitality-assessments-panel"></section><script>
window.active=${authorized};window.identity='${identity}';window.authEpoch=0;window.RVA_ENV={environment:'production',projectRef:'voalfpxiyznnqfcqcymd'};
window.RA_PORTAL={captureStaffSession:()=>window.active?{user:window.identity,epoch:window.authEpoch}:null,currentStaffRole:()=> 'owner',hasPermission:()=>true,createAuthenticatedTaskGuard(){let task=0;return{begin(){return window.active?{task:++task,user:window.identity,epoch:window.authEpoch}:null},current(t){const ok=!!t&&window.active&&t.task===task&&t.user===window.identity&&t.epoch===window.authEpoch;return ok},cancel(){task++}}},authClient:{auth:{getSession:async()=>({data:{session:window.active?{access_token:'fictional.'+window.identity+'.token'}:null}})}}};
</script>${['/js/vitality-roadmap-view.js','/js/vitality-roadmap-b4-source-map.js','/js/vitality-roadmap-b4-coverage.js','/portal/portal-roadmap-founder.js'].map(f=>'<script defer src="'+f+'"></script>').join('')}</body></html>`});
  }
  const path='production-dist'+url.pathname;if(fs.existsSync(path))return route.fulfill({path});return route.fulfill({status:200,body:''});
 });
 async function open(){await page.getByRole('button',{name:'Founder Roadmap review · Unscored',exact:true}).click();await page.getByRole('button',{name:'Review approved source',exact:true}).click();await page.getByRole('heading',{name:'Founder Roadmap review',exact:true}).waitFor();}
 try{
  await page.goto('https://revitalizedacademy.com/portal/');await page.getByRole('button',{name:'Founder Roadmap review · Unscored'}).waitFor();
  await page.getByRole('button',{name:'Founder Roadmap review · Unscored'}).click();await page.getByText(/No submissions are approved/).waitFor();checks++;
  await f.enroll();await open();assert.equal(await page.locator('.roadmap-preview .roadmap-driver').count(),12);assert.ok(await page.getByLabel('Provisional overview',{exact:true}).isDisabled());assert.equal(await page.locator('.roadmap-print').count(),0);checks+=3;await page.screenshot({path:'/private/tmp/rva-b4-'+engine+'-'+width+'.png'});
  assert.equal(await page.locator('.roadmap-private-source img').count(),0);assert.ok((await page.locator('.roadmap-private-source').innerText()).includes('FICTIONAL_RAW_SOURCE_ONLY'));checks++;
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('.roadmap-private-source').evaluate(n=>getComputedStyle(n).display),'none');assert.equal(await page.locator('.roadmap-editor').evaluate(n=>getComputedStyle(n).display),'none');await page.emulateMedia({media:'screen'});checks+=2;
  await page.getByRole('button',{name:'Close founder review'}).click();await f.enroll(true,true);await open();
  await page.getByLabel('Provisional overview',{exact:true}).fill('First fictional immutable proposal');await page.getByLabel('Reason for this version',{exact:true}).fill('Fictional version one');await page.getByRole('button',{name:'Save private draft version',exact:true}).click();await page.getByText('Private · Version 1 · draft',{exact:true}).waitFor();checks++;
  await page.getByText('Propose source corrections · Original answers preserved',{exact:true}).click();await page.getByRole('button',{name:'Add correction proposal',exact:true}).click();await page.getByLabel('Original question key',{exact:true}).fill('water_intake');await page.getByLabel('Proposed correction (unverified)',{exact:true}).fill('Please verify the unit');await page.getByLabel('Correction reason',{exact:true}).fill('Fictional clarification');await page.getByLabel('Provisional overview',{exact:true}).fill('Second fictional immutable proposal');await page.getByLabel('Reason for this version',{exact:true}).fill('Fictional correction');await page.getByRole('button',{name:'Save private draft version',exact:true}).click();await page.getByText('Private · Version 2 · draft',{exact:true}).waitFor();assert.equal((await f.actor(f.elle,'version',f.report,{version:2})).corrections.length,1);checks++;
  await page.getByText('Append-only version and audit history',{exact:true}).click();await page.getByRole('button',{name:'Preview saved version 1',exact:true}).click();await page.locator('.roadmap-preview').getByText('First fictional immutable proposal',{exact:true}).waitFor();checks++;
  await page.getByLabel('Reason for this version',{exact:true}).fill('Fictional regeneration');await page.getByRole('button',{name:'Regenerate unscored draft',exact:true}).click();await page.getByText('Private · Version 3 · draft',{exact:true}).waitFor();assert.equal(await page.getByLabel('Provisional overview',{exact:true}).inputValue(),'');checks++;
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('.roadmap-dialog').evaluate(n=>n.scrollWidth<=n.clientWidth));checks+=2;
  await page.locator('.roadmap-dialog').evaluate(d=>{const nodes=[...d.querySelectorAll('button,input,textarea,select,summary,[tabindex="0"]')].filter(x=>{if(x.disabled||!x.getClientRects().length)return false;for(let p=x.parentElement;p&&p!==d;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&x!==p.querySelector(':scope>summary'))return false;return true;});nodes.at(-1).focus();});await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Close founder review');await page.keyboard.press('Escape');assert.equal(await page.locator('.roadmap-dialog').count(),0);checks+=2;
  // Same account survives reload; module requests a fresh server authorization.
  await page.reload();await open();await page.getByText('Private · Version 3 · draft',{exact:true}).waitFor();checks++;
  // Cohort revocation removes private answers on the next foreground authorization check.
  await f.enroll(false);await page.evaluate(()=>dispatchEvent(new Event('focus')));await page.getByText(/Private review cleared/).waitFor();assert.equal(await page.locator('.roadmap-dialog').count(),0);assert.doesNotMatch(await page.locator('body').innerText(),/FICTIONAL_RAW_SOURCE_ONLY|Fictional B4/);checks++;
  await f.enroll(true,true);await open();
  // Logout aborts late source responses, clears state and prevents background requests.
  await page.getByRole('button',{name:'Close founder review'}).click();delayRead=true;const pending=open().catch(()=>{});await page.waitForFunction(()=>document.querySelector('.roadmap-dialog')?.textContent.includes('Loading approved'));
  for(let i=0;i<1000&&!releaseRead;i++)await new Promise(r=>setTimeout(r,5));assert.ok(releaseRead,'Delayed read reached local adapter');await page.evaluate(()=>{window.active=false;window.authEpoch++;document.dispatchEvent(new Event('ra:staff-access-reset'));});releaseRead();await page.waitForTimeout(50);assert.equal(await page.locator('.roadmap-dialog').count(),0);assert.doesNotMatch(await page.locator('body').innerText(),/FICTIONAL_RAW_SOURCE_ONLY/);const before=requests;await page.evaluate(()=>dispatchEvent(new Event('focus')));await page.waitForTimeout(40);assert.equal(requests,before);checks+=3;
  // Account transition reinitializes only the new verified founder.
  identity='elle';await page.evaluate(()=>{window.identity='elle';window.active=true;window.authEpoch++;document.dispatchEvent(new Event('ra:permissions-loaded'));});await page.getByRole('button',{name:'Founder Roadmap review · Unscored'}).waitFor();await open();await page.getByText('Private · Version 3 · draft',{exact:true}).waitFor();checks++;
  // A revoked Auth session is denied and cannot restore source on refresh.
  await f.q('delete from auth.sessions where user_id=$1',[f.elle]);await page.evaluate(()=>dispatchEvent(new Event('focus')));await page.getByText(/Private review cleared/).waitFor();authorized=true;await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'&&r.url().includes('roadmap-founder')&&r.request().postDataJSON()?.action==='authorize'),page.reload()]);await f.drain();assert.equal(await page.getByRole('button',{name:'Founder Roadmap review · Unscored'}).isVisible(),false);checks++;
  assert.deepEqual(errors,[]);assert.equal(await f.v("select count(*) from private.roadmap_b4_versions where overall_score is not null or spectrum_stage is not null"),'0');checks+=2;
  results.push({engine,width,height,versions:3,readOnlyAndDrafts:true,sourceUnchanged:true,revocation:true,staleResponse:true,accountTransition:true,overflow:false,consoleWarningsErrors:0});
 }finally{await page.close();await f.drain();await db.query('rollback');}
}}finally{await browser.close();}}
console.log(JSON.stringify({checks,runs:results.length,results}));
}finally{await db.end();}})().catch(e=>{console.error(e);process.exitCode=1;});
