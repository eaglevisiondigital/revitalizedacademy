'use strict';
// All requests intercepted. Fictional persisted document; never connects to a hosted API.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),P=require('../js/vitality-roadmap-processing.cjs'),{context}=require('./fixtures/roadmap-b6.cjs');
const pw=require(process.env.RVA_PLAYWRIGHT_PATH||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output=process.env.RVA_READONLY_EVIDENCE;if(!output)throw Error('Local evidence directory required');fs.mkdirSync(output,{recursive:true});
const origin='https://revitalizedacademy.com',source='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',document=P.buildDraft(context(),{personalized:false});document.roadmap.summary='FICTIONAL saved founder draft for read-only navigation verification.';
const result={document,revision:1,version_id:'fictional-version-one',reviews:[],expires_at:new Date(Date.now()+1800000).toISOString()};
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/vitality-roadmap-workspace.css"><link rel="stylesheet" href="/portal/portal-roadmap-processing.css"><style>*{box-sizing:border-box}body{margin:16px}main{max-width:1200px;margin:auto}.rv6-workspace{display:grid;grid-template-columns:1fr 1fr;gap:20px}.rv6-source{max-height:300px;overflow:auto}@media(max-width:800px){.rv6-workspace{grid-template-columns:1fr}}</style></head><body><main><div class="rv6-workspace"><section id="source" class="rv6-source">FICTIONAL original answers panel; no participant data.</section><section>Independent founder review · before candidate output</section></div></main><script>window.active=true;window.epoch=0;window.user='fictional-founder';window.role='owner';window.RA_PORTAL={captureStaffSession:()=>active?{userId:user,epoch}:null,currentStaffRole:()=>active?role:null,createAuthenticatedTaskGuard(){let cancelled=false;return{begin:()=>({epoch,user}),current:t=>!cancelled&&active&&t.epoch===epoch&&t.user===user,cancel:()=>cancelled=true}},authClient:{auth:{getSession:async()=>({data:{session:active?{user:{id:user},access_token:'FICTIONAL_ONLY'}:null}})}}};window.openSource=(report='${source}')=>document.dispatchEvent(new CustomEvent('ra:roadmap-source-opened',{detail:{report,host:document.querySelector('#source')}}));</script><script src="/js/vitality-roadmap-view.js"></script><script src="/portal/portal-roadmap-processing.js"></script><script src="/portal/portal-roadmap-processing-bootstrap.js"></script></body></html>`;
(async()=>{const results=[];for(const engine of ['chromium','webkit']){const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});try{for(const width of [1440,768,390]){
 const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width===390,serviceWorkers:'block'}),calls=[],errors=[],network=[],outside=[];let mode='ok',release;
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')network.push(e.text());});
 await page.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.origin!==origin){outside.push(url.origin);return route.abort();}
  if(url.pathname==='/readonly-test')return route.fulfill({contentType:'text/html',body:html});
  if(url.pathname==='/.netlify/functions/roadmap-processing'){const b=req.postDataJSON();calls.push(b.action);assert.equal(b.action,'read','opening must never invoke worker processing');assert.deepEqual(b.payload,{});
   if(mode==='delay')await new Promise(resolve=>{release=resolve;});
   if(mode==='network')return route.abort('failed');
   return route.fulfill({contentType:'application/json',body:JSON.stringify(mode==='denied'||b.report!==source?{unavailable:true}:result)}).catch(()=>{});
  }
  if(url.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});
  if(['/css/vitality-roadmap-workspace.css','/portal/portal-roadmap-processing.css','/js/vitality-roadmap-view.js','/portal/portal-roadmap-processing.js','/portal/portal-roadmap-processing-bootstrap.js'].includes(url.pathname))return route.fulfill({path:path.resolve(url.pathname.slice(1))});
  throw Error('Unexpected local fixture resource');
 });
 const select=async(report=source)=>{await page.evaluate(r=>openSource(r),report);const launcher=page.getByRole('button',{name:'Open authorized internal draft workflow',exact:true});await launcher.focus();if(width===390)await launcher.tap();else await page.keyboard.press('Enter');};
 try{
  await page.goto(origin+'/readonly-test');await select();await page.getByRole('heading',{name:'Revision 1',exact:true}).waitFor();assert.equal(await page.locator('.roadmap-driver').count(),12);
  assert.equal(await page.evaluate(()=>{const p=document.querySelector('.roadmap-processing'),g=document.querySelector('.rv6-workspace');return p.nextElementSibling===g&&!g.contains(p);}),true);
  for(const tab of ['My Overview','My 12 Drivers','My Action Plan']){await page.getByRole('button',{name:tab,exact:true}).click();}
  await page.getByRole('button',{name:'My Overview',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(output,engine+'-'+width+'.png'),fullPage:true});
  await select();await page.getByRole('heading',{name:'Revision 1',exact:true}).waitFor();await page.reload();await select();await page.getByRole('heading',{name:'Revision 1',exact:true}).waitFor();assert.equal(calls.length,3);
  await select(other);await page.getByText('Saved draft unavailable.',{exact:false}).waitFor();assert.equal(await page.locator('.roadmap-driver').count(),0);
  mode='denied';await select();await page.getByText('Saved draft unavailable.',{exact:false}).waitFor();assert.equal(await page.locator('form').count(),0);
  mode='network';await select();await page.getByText('Saved draft unavailable.',{exact:false}).waitFor();const afterFailure=calls.length;await page.waitForTimeout(40);assert.equal(calls.length,afterFailure);
  mode='delay';await select();await page.waitForFunction(()=>document.body.textContent.includes('Loading saved founder draft'));for(let n=0;n<100&&!release;n++)await page.waitForTimeout(5);assert(release);
  await page.evaluate(()=>{user='fictional-other-founder';epoch++;document.dispatchEvent(new Event('ra:staff-access-reset'));});release();await page.waitForTimeout(30);assert.equal(await page.locator('.roadmap-processing').count(),0);
  await page.evaluate(()=>{role='coach';openSource();});assert.equal(await page.locator('.roadmap-processing').count(),0);
  await page.evaluate(()=>{active=false;epoch++;document.dispatchEvent(new Event('ra:staff-access-reset'));});assert.equal(await page.locator('form').count(),0);assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);assert(network.every(s=>s.includes('Failed to load resource')||s.includes('Load failed')),'Only deliberate network failure diagnostics allowed');
  results.push({engine,width,pass:true,drivers:12,revisionLabel:1,openingRequests:calls.length,nonReadActions:0,keyboardOrTouch:true,refresh:true,repeatedOpen:true,wrongSourceDenied:true,authorizationDenied:true,accountSwitchClears:true,logoutClears:true,networkFailureNoRetry:true,unexpectedErrors:errors.length,expectedNetworkDiagnostics:network.length,externalRequests:outside.length});
 }finally{await page.close();}
 }}finally{await browser.close();}}fs.writeFileSync(path.join(output,'BROWSER_RESULTS.json'),JSON.stringify({syntheticOnly:true,results},null,2)+'\n');console.log(JSON.stringify({browserCases:results.length,pass:results.every(x=>x.pass),nonReadActions:0}));})().catch(e=>{console.error(e);process.exitCode=1;});
