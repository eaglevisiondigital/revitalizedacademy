// Offline fictional consent transport. No real session, participant, hosted request or write.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const pw=require(process.env.RVA_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.RVA_PURPOSE_EVIDENCE;
const baseline=process.env.RVA_PURPOSE_BASELINE==='1';
const script=baseline?fs.readFileSync(path.resolve(root,'../deployment-evidence/2026-10-19-b6-acknowledgment-diagnosis/local/baseline-calibration.js')):fs.readFileSync(root+'/portal/portal-roadmap-calibration.js');
const origin='https://revitalizedacademy.com';
async function scenario(browser,width,height){
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage();
 const state={events:new Map(),attests:0,requests:[],mode:'ok',wait:null,release:null,entered:false},errors=[],external=[];let checks=0;
 const rows=()=>Array.from({length:3},(_,i)=>({report_id:'00000000-0000-4000-8000-00000000000'+(i+1),identity:{name:'Fictional consent example '+(i+1),second_identifier:'Fictional test identifier only',completed_at:'2026-01-01'},ready:false,operator_grant:false,purpose_acknowledged:state.events.has(i+1)}));
 page.on('pageerror',error=>errors.push({type:'pageerror',message:error.message}));
 page.on('console',entry=>{if(['warning','error'].includes(entry.type()))errors.push({type:entry.type(),message:entry.text()});});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin!==origin){external.push(url.origin);return route.abort();}
  if(url.pathname==='/.netlify/functions/roadmap-scoring-lab'){
   const body=req.postDataJSON();state.requests.push(body.action);
   if(body.action==='b6_authorize')return route.fulfill({json:{authorized:true,pins:{sop:'FICTIONAL-SOP'},drivers:[],stages:[]}});
   if(body.action==='b6_list')return route.fulfill({json:rows()});
   assert.equal(body.action,'b6_attest');state.attests++;
   assert.equal(Object.keys(body.payload.acknowledgments).length,7);assert(Object.values(body.payload.acknowledgments).every(x=>x===true));
   if(state.mode==='denied')return route.fulfill({status:403,json:{unavailable:true}});
   if(state.mode==='invalid')return route.fulfill({json:{unavailable:true,invalid:true}});
   if(state.mode==='network')return route.abort('failed');
   state.events.set(Number(body.report.at(-1)),true);
   if(state.mode==='lost-response')return route.abort('failed');
   if(state.mode==='delay'){state.entered=true;await new Promise(resolve=>state.release=resolve);}
   return route.fulfill({json:{acknowledged:true,can_open:false}}).catch(()=>{});
  }
  if(url.pathname==='/portal/portal-roadmap-calibration.js')return route.fulfill({contentType:'application/javascript',body:script});
  if(url.pathname==='/portal/portal-roadmap-calibration-bootstrap.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(root+'/portal/portal-roadmap-calibration-bootstrap.js')});
  if(url.pathname.endsWith('.css'))return route.fulfill({contentType:'text/css',body:fs.readFileSync(root+url.pathname)});
  assert.equal(url.pathname,'/portal/');
  return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/portal/portal-roadmap-scoring-lab.css"><link rel="stylesheet" href="/portal/portal-roadmap-calibration.css"></head><body><section id="vitality-assessments-panel"><div class="panel-heading"></div></section><script>
  window.active=true;window.sessionAvailable=true;window.actor='fictional-founder';window.epoch=0;window.role='owner';window.RVA_ENV={environment:'production',projectRef:'voalfpxiyznnqfcqcymd'};
  window.RA_PORTAL={captureStaffSession:()=>active?{actor,epoch}:null,currentStaffRole:()=>role,hasPermission:()=>true,createAuthenticatedTaskGuard(){let seq=0;return{begin:()=>active?{seq:++seq,actor,epoch}:null,current:t=>!!t&&active&&t.seq===seq&&t.actor===actor&&t.epoch===epoch,cancel:()=>seq++}},authClient:{auth:{getSession:async()=>({data:{session:active&&sessionAvailable?{access_token:'fictional.test.token'}:null}})}}};
  </script><script src="/portal/portal-roadmap-calibration.js"></script><script src="/portal/portal-roadmap-calibration-bootstrap.js"></script></body></html>`});
 });
 const open=async(index=0)=>{await page.getByRole('button',{name:'Assessment Calibration',exact:true}).click();await page.getByRole('button',{name:'Review experimental purpose / SOP',exact:true}).nth(index).click();if(!baseline)await page.getByText('Not yet recorded for this source and current session.',{exact:false}).waitFor();};
 const checkAll=async()=>{for(const box of await page.locator('[type=checkbox]').all())await box.check();};
 const close=()=>page.getByRole('button',{name:'Close Assessment Calibration',exact:true}).click();
 try{
  await page.goto(origin+'/portal/');await open();
  if(baseline){await checkAll();for(let i=0;i<7;i++){await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.rv6-dialog [role=status]').textContent.includes('Purpose acknowledged.'));}
   assert.equal(state.attests,7);const rect=await page.locator('.rv6-dialog [role=status]').boundingBox();assert(rect.y<0||rect.y>height);return{baseline:true,duplicateWrites:state.attests,feedbackOutsideViewport:true};}
  assert.equal(await page.locator('[type=checkbox]').count(),7);checks++;
  await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();await page.getByText('Acknowledge every experimental-purpose restriction.',{exact:true}).waitFor();assert.equal(state.attests,0);checks++;
  for(let i=0;i<6;i++)await page.locator('[type=checkbox]').nth(i).check();await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();assert.equal(state.attests,0);checks++;
  await checkAll();state.mode='delay';await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();
  while(!state.entered)await page.waitForTimeout(5);
  assert(await page.getByRole('button',{name:'Saving acknowledgment…',exact:true}).isDisabled());assert.equal(await page.locator('[type=checkbox]:disabled').count(),7);assert(await page.getByText('Saving your source-specific acknowledgment.',{exact:false}).isVisible());checks+=3;
  await page.getByRole('button',{name:'Saving acknowledgment…',exact:true}).evaluate(button=>{for(let i=0;i<8;i++)button.dispatchEvent(new MouseEvent('click',{bubbles:true}));});assert.equal(state.attests,1);checks++;
  state.release();state.mode='ok';await page.getByRole('button',{name:'B6 purpose recorded',exact:true}).waitFor();assert(await page.getByRole('button',{name:'B6 purpose recorded',exact:true}).isDisabled());
  const msg=page.locator('[data-b6-purpose-status]'),box=await msg.boundingBox();assert(box.y>=0&&box.y<height);assert((await msg.innerText()).includes('Separate operator activation'));assert.equal(await page.locator('.rv6-source').count(),0);checks+=4;
  if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'consent-'+width+'.png')});}
  await close();await page.getByRole('button',{name:'Assessment Calibration',exact:true}).click();await page.getByRole('button',{name:'Review experimental purpose / SOP',exact:true}).first().click();await page.getByRole('button',{name:'B6 purpose recorded',exact:true}).waitFor();assert.equal(state.attests,1);assert.equal(await page.locator('[type=checkbox]:checked').count(),0);checks+=2;
  await close();await open(1);await checkAll();state.mode='lost-response';await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();await page.getByText('Acknowledgment not confirmed.',{exact:false}).waitFor();assert(await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).isDisabled());const count=state.attests;await close();state.mode='ok';await page.getByRole('button',{name:'Assessment Calibration',exact:true}).click();await page.getByRole('button',{name:'Review experimental purpose / SOP',exact:true}).nth(1).click();await page.getByRole('button',{name:'B6 purpose recorded',exact:true}).waitFor();assert.equal(state.attests,count);checks+=2;
  await close();await open(2);await checkAll();state.mode='invalid';await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();await page.getByText('Acknowledgment not confirmed.',{exact:false}).waitFor();assert(!state.events.has(3));assert.equal(await page.locator('.rv6-source').count(),0);checks+=2;
  await close();await open(2);await checkAll();const noSessionBefore=state.attests;await page.evaluate(()=>sessionAvailable=false);await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();await page.getByText('Your session expired or access was denied.',{exact:false}).waitFor();assert.equal(await page.locator('.rv6-dialog').count(),0);assert.equal(state.attests,noSessionBefore);assert(!(await page.locator('body').innerText()).includes('Fictional consent example'));checks+=3;
  await page.evaluate(()=>{sessionAvailable=true;document.dispatchEvent(new Event('ra:permissions-loaded'));});await open(2);await checkAll();state.mode='denied';await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();await page.getByText('Your session expired or access was denied.',{exact:false}).waitFor();assert.equal(await page.locator('.rv6-dialog').count(),0);assert(!(await page.locator('body').innerText()).includes('Fictional consent example'));checks+=2;
  state.mode='ok';await page.evaluate(()=>document.dispatchEvent(new Event('ra:permissions-loaded')));await open(2);await checkAll();state.mode='delay';state.entered=false;await page.getByRole('button',{name:'Acknowledge B6 purpose',exact:true}).click();while(!state.entered)await page.waitForTimeout(5);
  await page.evaluate(()=>{active=false;epoch++;document.dispatchEvent(new Event('ra:staff-access-reset'));});state.release();await page.waitForTimeout(40);assert.equal(await page.locator('.rv6-dialog').count(),0);assert(!(await page.locator('body').innerText()).includes('Fictional consent example'));checks+=2;
  const before=state.requests.length;await page.evaluate(()=>{document.dispatchEvent(new Event('ra:permissions-loaded'));window.dispatchEvent(new Event('focus'));});await page.waitForTimeout(40);assert.equal(state.requests.length,before);checks++;
  await page.evaluate(()=>{active=true;epoch++;role='coach';document.dispatchEvent(new Event('ra:permissions-loaded'));});await page.waitForTimeout(40);assert.equal(await page.getByRole('button',{name:'Assessment Calibration',exact:true}).isVisible(),false);assert.equal(state.requests.length,before);checks+=2;
  assert.equal(external.length,0);assert.equal(errors.filter(e=>e.type==='pageerror').length,0);assert(errors.every(e=>e.type==='error'&&(/Failed to load resource/.test(e.message))));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks+=4;
  return{width,height,checks,passed:true,unexpectedConsoleErrors:0,intentionalTransportDiagnostics:errors.length,externalRequests:0,noHealthRead:true,noHostedWrites:true};
 }finally{await context.close();}
}
(async()=>{const results=[];for(const engine of ['chromium','webkit']){const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});try{for(const [width,height]of [[1440,1000],[768,1024],[390,844]])results.push({engine,...await scenario(browser,width,height)});}finally{await browser.close();}}const result={baseline,results,total:results.reduce((n,r)=>n+(r.checks||0),0)};if(out)fs.writeFileSync(path.join(out,baseline?'baseline-browser.json':'browser-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));})().catch(error=>{console.error(error);process.exitCode=1;});
