'use strict';
// All requests intercepted. Fictional persisted R2; zero hosted API/Function traffic.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),P=require('../js/vitality-roadmap-processing.cjs'),{context}=require('./fixtures/roadmap-b6.cjs');
const pw=require('/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output=process.env.RVA_REVIEW_EVIDENCE;if(!output)throw Error('Local evidence directory required');fs.mkdirSync(output,{recursive:true});
const origin='https://revitalizedacademy.com',report='00000000-0000-4000-8000-000000000001',document=P.buildDraft(context());
const result={document,revision:2,version_id:'fictional-saved-revision-two',reviews:[],expires_at:new Date(Date.now()+1800000).toISOString(),review_only:true};
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/vitality-roadmap-workspace.css"><link rel="stylesheet" href="/portal/portal-roadmap-processing.css"><link rel="stylesheet" href="/portal/portal-roadmap-calibration.css"><link rel="stylesheet" href="/portal/portal-roadmap-scoring-lab.css"><style>*{box-sizing:border-box}body{margin:16px;font-family:Arial,sans-serif}button{min-height:44px;padding:8px}main{max-width:1200px;margin:auto}</style></head><body><section id="vitality-assessments-panel"><header class="panel-heading"><h1>FICTIONAL founder workspace</h1></header></section><script>
window.active=true;window.epoch=0;window.user='fictional-justyn';window.role='owner';window.RVA_ENV={environment:'production',projectRef:'voalfpxiyznnqfcqcymd'};
window.RA_PORTAL={captureStaffSession:()=>active?{userId:user,epoch}:null,currentStaffRole:()=>active?role:null,hasPermission:()=>active,createAuthenticatedTaskGuard(){let counter=0;return{begin:()=>({counter:++counter,epoch,user}),current:t=>active&&t.counter===counter&&t.epoch===epoch&&t.user===user,cancel:()=>counter++}},authClient:{auth:{getSession:async()=>({data:{session:active?{user:{id:user}}:null}})},rpc:async(name,args)=>{const r=await fetch('/__saved_fixture',{method:'POST',body:JSON.stringify({name,args})});return r.json();}}};
</script><script src="/js/vitality-roadmap-view.js"></script><script src="/portal/portal-roadmap-processing.js"></script><script src="/portal/portal-roadmap-saved-review.js"></script></body></html>`;
(async()=>{const cases=[];for(const engine of ['chromium','webkit']){const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});try{for(const width of [1440,768,390]){
 const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width===390,serviceWorkers:'block'}),calls=[],errors=[],external=[],network=[];let mode='ok',release,feedback=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')network.push(e.text());});
 await page.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(u.origin!==origin){external.push(u.origin);return route.abort();}
 if(u.pathname==='/review-fixture')return route.fulfill({contentType:'text/html',body:html});
 if(u.pathname==='/__saved_fixture'){
 const b=req.postDataJSON();assert.equal(b.name,'roadmap_saved_review');assert(['list','read','review'].includes(b.args.p_action));calls.push(b.args.p_action);
 if(mode==='delay')await new Promise(r=>release=r);
 if(mode==='network')return route.abort('failed');
 if(mode==='denied')return route.fulfill({json:{error:{code:'42501'}}});
 if(b.args.p_action==='list')return route.fulfill({json:{data:[{report_id:report,label:'FICTIONAL saved Revision 2',revision:2,review_only:true,expires_at:result.expires_at}]}}).catch(()=>{});
 if(b.args.p_action==='review'){assert.equal(b.args.p_report,report);assert.equal(b.args.p_payload.version_id,result.version_id);assert(b.args.p_payload.proposal.citations.length);feedback++;return route.fulfill({json:{data:{revision:feedback,rules_adopted:false}}});}
 assert.equal(b.args.p_report,report);assert.deepEqual(b.args.p_payload,{});return route.fulfill({json:{data:mode==='expired'?{...result,expires_at:'2026-10-22T13:45:00Z'}:result}}).catch(()=>{});
 }
 const files=['css/vitality-roadmap-workspace.css','portal/portal-roadmap-processing.css','portal/portal-roadmap-calibration.css','portal/portal-roadmap-scoring-lab.css','js/vitality-roadmap-view.js','portal/portal-roadmap-processing.js','portal/portal-roadmap-saved-review.js'];if(files.includes(u.pathname.slice(1)))return route.fulfill({path:path.resolve(u.pathname.slice(1))});
 if(u.pathname==='/favicon.ico')return route.fulfill({status:204,body:''});throw Error('Unexpected request; no Function/provider traffic allowed');
 });
 const open=async()=>{const b=page.getByRole('button',{name:'Saved Roadmap review',exact:true});await b.focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Read FICTIONAL saved Revision 2',exact:true}).waitFor();};
 const select=async()=>{const b=page.getByRole('button',{name:'Read FICTIONAL saved Revision 2',exact:true});if(width===390)await b.tap();else{await b.focus();await page.keyboard.press('Enter');}};
 try{
 await page.goto(origin+'/review-fixture');await open();await select();await page.getByRole('heading',{name:'Revision 2',exact:true}).waitFor();assert.equal(await page.locator('.roadmap-driver').count(),12);
 for(const name of ['Return for regeneration','Generate authorized founder draft','Approve this internal review only','Record draft-processing purpose'])assert.equal(await page.getByRole('button',{name,exact:true}).count(),0);
 for(const tab of ['My Overview','My 12 Drivers','My Action Plan'])await page.getByRole('button',{name:tab,exact:true}).click();
 assert((await page.locator('body').textContent()).includes('30'));assert.equal(await page.evaluate(()=>{const d=document.querySelector('[role=dialog]');return document.documentElement.scrollWidth>innerWidth||d.scrollWidth>d.clientWidth;}),false);
 await page.getByRole('button',{name:'My Overview',exact:true}).click();await page.screenshot({path:path.join(output,engine+'-'+width+'.png'),fullPage:true});
 await page.getByRole('button',{name:'My 12 Drivers',exact:true}).click();const card=page.locator('[data-founder-review=cellular_hydration]');await card.locator(':scope > summary').click();await card.getByLabel('Reason for review',{exact:true}).fill('FICTIONAL source-cited discussion proposal');
 await card.getByRole('button',{name:'Save cited founder proposal',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('[data-founder-review]').length===12);assert.equal(feedback,1);
 // Repeated opening/refresh reads the same version; never creates processing or original-answer calls.
 await select();await page.getByRole('heading',{name:'Revision 2',exact:true}).waitFor();
 await page.getByRole('button',{name:'Close saved review',exact:true}).click();await open();await select();await page.getByRole('heading',{name:'Revision 2',exact:true}).waitFor();
 await page.addStyleTag({content:'html{font-size:200%}'});assert.equal(await page.evaluate(()=>{const d=document.querySelector('[role=dialog]');return document.documentElement.scrollWidth>innerWidth||d.scrollWidth>d.clientWidth;}),false);
 // Dialog keyboard trap and Escape close keep the action accessible.
 await page.getByRole('button',{name:'Close saved review',exact:true}).focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('[role=dialog]').evaluate(e=>e.contains(document.activeElement)),true);await page.keyboard.press('Escape');assert.equal(await page.locator('[role=dialog]').count(),0);
 await page.reload();await open();mode='expired';await select();await page.waitForTimeout(20);assert.equal(await page.locator('.roadmap-driver,form').count(),0);mode='ok';await page.getByRole('button',{name:'Close saved review',exact:true}).click();
 mode='denied';await page.getByRole('button',{name:'Saved Roadmap review',exact:true}).click();await page.getByText('Saved review unavailable.',{exact:false}).waitFor();assert.equal(await page.locator('.roadmap-driver').count(),0);await page.keyboard.press('Escape');
 mode='network';await page.getByRole('button',{name:'Saved Roadmap review',exact:true}).click();await page.getByText('Saved review unavailable.',{exact:false}).waitFor();const count=calls.length;await page.waitForTimeout(40);assert.equal(calls.length,count);await page.keyboard.press('Escape');
 mode='delay';await page.getByRole('button',{name:'Saved Roadmap review',exact:true}).click();for(let i=0;i<100&&!release;i++)await page.waitForTimeout(5);assert(release);await page.evaluate(()=>{user='fictional-elle';epoch++;document.dispatchEvent(new Event('ra:staff-access-reset'));});release();await page.waitForTimeout(30);assert.equal(await page.locator('[role=dialog],form,.roadmap-driver').count(),0);
 await page.evaluate(()=>{role='coach';document.dispatchEvent(new Event('ra:permissions-loaded'));});assert(await page.getByRole('button',{name:'Saved Roadmap review',exact:true}).isHidden());await page.evaluate(()=>{active=false;epoch++;document.dispatchEvent(new Event('ra:staff-access-reset'));});assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert(network.every(s=>s.includes('Failed to load resource')||s.includes('Load failed')));
 cases.push({engine,width,pass:true,drivers:12,revision:2,readAndCitedFeedbackOnly:true,keyboardAndTouch:true,zoom200Percent:true,sessionSwitchAndLogoutCleared:true,expiredDenied:true,networkFailureNoRetry:true,workerCalls:0,externalRequests:0,unexpectedConsoleErrors:errors.length});
 }finally{await page.close();}
 }}finally{await browser.close();}}
 fs.writeFileSync(path.join(output,'BROWSER_RESULTS.json'),JSON.stringify({syntheticOnly:true,cases},null,2)+'\n');console.log(JSON.stringify({pass:true,browserCases:cases.length,workerCalls:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
