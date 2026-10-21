// Offline browser regression: exact portal/CSS/renderers, fictional sources, intercepted APIs.
// Never invokes a worker, connects to production, records consent or touches queued jobs.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(process.env.RVA_PLAYWRIGHT_PATH||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),baseline=process.env.RVA_ACTIONS_BASELINE==='1';
const scripts=baseline?path.resolve(root,'../founders-approved-hero-restoration'):root;
const out=process.env.RVA_ACTIONS_EVIDENCE;
const coverage=require('../js/vitality-roadmap-b4-coverage.js'),A=require('../js/vitality-roadmap-b6-adapter.cjs'),P=require('../js/vitality-roadmap-processing.cjs');
const {context}=require('./fixtures/roadmap-b6.cjs');
const origin='https://revitalizedacademy.com',report=context().report_id;
function source(){const c=context(),observed=A.observe(c);for(const [key,d]of Object.entries(observed.drivers))d.observations=Array.from({length:18},(_,i)=>({id:key+'_fictional_'+i,label:'Fictional layout-only question '+(i+1),submitted:['Synthetic response for scroll testing only. No participant information.'],status:'known_context',reason:'Synthetic visual fixture, not clinical evidence.'}));return{...c,identity:{second_identifier:'SYNTHETIC ONLY'},observed};}
function html(){let h=fs.readFileSync(root+'/portal/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 h=h.replace('</head>','<style>.panel{display:none!important}#vitality-assessments-panel{display:block!important}#auth-view{display:none!important}body{visibility:visible!important}</style></head>');
 return h.replace('</body>',`<script>
 document.getElementById('portal-view').classList.remove('hidden');window.active=true;window.epoch=0;window.actor='fictional-founder';window.role='owner';
 window.RVA_ENV={environment:'production',projectRef:'voalfpxiyznnqfcqcymd'};
 window.RA_PORTAL={captureStaffSession:()=>active?{userId:actor,epoch}:null,currentStaffRole:()=>role,hasPermission:()=>true,createAuthenticatedTaskGuard(){let seq=0;return{begin:()=>active?{seq:++seq,actor,epoch}:null,current:t=>!!t&&active&&t.seq===seq&&t.actor===actor&&t.epoch===epoch,cancel:()=>seq++}},authClient:{auth:{getSession:async()=>({data:{session:active?{access_token:'fictional.token',user:{id:actor}}:null}})}}};
 </script><script src="/js/vitality-roadmap-view.js"></script><script src="/portal/portal-roadmap-processing.js"></script><script src="/portal/portal-roadmap-processing-bootstrap.js"></script><script src="/portal/portal-roadmap-calibration.js"></script><script src="/portal/portal-roadmap-calibration-bootstrap.js"></script></body>`);
}
async function scenario(browser,engine,size){
 const [width,height,zoom=1]=size,context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',hasTouch:width<801}),page=await context.newPage();
 const errors=[],external=[],calls=[];let mockProcesses=0,workerCalls=0,release=null,slow=false;
 const draft=P.buildDraft(source()),result={version_id:'fictional-version',reviews:[],document:draft,expires_at:new Date(Date.now()+3600000).toISOString()};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(['error','warning'].includes(e.type()))errors.push(e.text());});
 await context.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());
  if(u.origin!==origin){external.push(u.origin);return route.abort();}
  if(u.pathname==='/.netlify/functions/roadmap-scoring-lab'){
   const b=req.postDataJSON();calls.push(b.action);
   if(b.action==='b6_authorize')return route.fulfill({json:{authorized:true,pins:A.pins,drivers:coverage.drivers,stages:A.stages}});
   if(b.action==='b6_list')return route.fulfill({json:[{report_id:report,label:'FICTIONAL layout acceptance source',identity:{name:'Fictional layout example',second_identifier:'SYNTHETIC ONLY',completed_at:'2026-01-01'},ready:true,operator_grant:true,purpose_acknowledged:true}]});
   if(b.action==='b6_read'||b.action==='b6_check')return route.fulfill({json:source()});
   throw Error('Unexpected fictional calibration action: '+b.action);
  }
  if(u.pathname==='/.netlify/functions/roadmap-processing'){
   const b=req.postDataJSON();assert.equal(b.report,report);calls.push(b.action);
   if(b.action==='process'){mockProcesses++;if(slow)await new Promise(r=>release=r);return route.fulfill({json:result}).catch(()=>{});}
   if(b.action==='read')return route.fulfill({json:result});
   if(b.action==='review')return route.fulfill({json:{ok:true}});
   throw Error('Unexpected fictional processing action: '+b.action);
  }
  if(u.pathname==='/portal/')return route.fulfill({contentType:'text/html',body:html()});
  const file=path.join(u.pathname.includes('roadmap-')?scripts:root,u.pathname);
  if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file});
  return route.fulfill({status:200,body:''});
 });
 async function open(){await page.goto(origin+'/portal/');if(zoom!==1)await page.evaluate(z=>document.documentElement.style.zoom=z,zoom);
  await page.getByRole('button',{name:'Assessment Calibration',exact:true}).click();
  await page.getByRole('button',{name:'Open authorized assessment',exact:true}).click();
  await page.getByText('Exact submitted answers loaded.',{exact:false}).waitFor();
 }
 async function hit(button){const box=await button.boundingBox();assert(box&&box.height>=44);return page.evaluate(({x,y})=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent==='Open authorized internal draft workflow');return b===document.elementFromPoint(x,y)||b?.contains(document.elementFromPoint(x,y));},{x:box.x+box.width/2,y:box.y+box.height/2});}
 try{
  await open();const launch=page.getByRole('button',{name:'Open authorized internal draft workflow',exact:true});
  const geometry=await page.evaluate(()=>{const a=document.querySelector('.roadmap-processing'),w=document.querySelector('.rv6-workspace'),s=document.querySelector('.rv6-source');return{actionTop:a.getBoundingClientRect().top,actionBottom:a.getBoundingClientRect().bottom,workspaceTop:w.getBoundingClientRect().top,workspaceHeight:w.getBoundingClientRect().height,sourceHeight:s.getBoundingClientRect().height,sourceScrollHeight:s.scrollHeight,actionInsideGrid:w.contains(a),sourceOverflow:getComputedStyle(s).overflowY,sourcePosition:getComputedStyle(s).position};});
  if(baseline){assert(geometry.actionInsideGrid);assert(geometry.actionTop>height);await page.locator('.rv6-source').evaluate(e=>e.scrollTop=e.scrollHeight);assert.equal(mockProcesses,0);if(out)await page.screenshot({path:path.join(out,`before-${engine}-${width}.png`)});return{engine,width,height,baseline:true,geometry,obstructionReproduced:true,mockProcesses,realWorkerInvocations:workerCalls};}
  assert.equal(geometry.actionInsideGrid,false);assert(geometry.actionBottom<=geometry.workspaceTop);assert(await hit(launch));
  // Scrolling answers and keyboard/focus navigation must not invoke an action.
  await page.locator('.rv6-source').evaluate(e=>e.scrollTop=e.scrollHeight);
  await launch.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(mockProcesses,0);
  await launch.scrollIntoViewIfNeeded();assert(await hit(launch));
  assert.equal(await page.evaluate(()=>document.querySelector('.rv6-dialog').scrollWidth>document.querySelector('.rv6-dialog').clientWidth+1),false);
  await page.locator('.rv6-source').evaluate(e=>e.scrollTop=0);
  if(out)await page.screenshot({path:path.join(out,`after-${engine}-${width}${zoom===1?'':'-zoom2'}.png`)});
  // Keyboard activation, with a delayed fictional response, retains original double-click guard.
  slow=true;await launch.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.roadmap-processing>button').disabled);
  await page.waitForTimeout(30);assert.equal(mockProcesses,1);
  await launch.evaluate(e=>{e.dispatchEvent(new MouseEvent('click',{bubbles:true}));e.dispatchEvent(new MouseEvent('click',{bubbles:true}));});assert.equal(mockProcesses,1);
  for(let i=0;i<60&&!release;i++)await page.waitForTimeout(10);assert(release);release();slow=false;
  await page.getByText('CONFIDENTIAL · Founder-only draft · Client delivery, email and export held.',{exact:true}).waitFor();
  const sections=page.locator('.roadmap-processing details').filter({has:page.locator('summary').filter({hasText:'· Evidence and founder review'})});assert.equal(await sections.count(),12);
  const first=sections.first();await first.locator('summary').click();
  const save=first.getByRole('button',{name:'Save cited founder proposal',exact:true});await save.scrollIntoViewIfNeeded();
  assert.equal(await save.evaluate(e=>{const r=e.getBoundingClientRect(),p=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===p||e.contains(p);}),true);
  assert.equal(await page.locator('.rv6-source .rv5-question').count(),216);
  if(out&&zoom===1)await page.screenshot({path:path.join(out,`review-${engine}-${width}.png`)});
  // Reopen source removes old controller without preserving another source's UI.
  await page.getByRole('button',{name:'Close Assessment Calibration',exact:true}).click();
  await open();const pointer=page.getByRole('button',{name:'Open authorized internal draft workflow',exact:true});
  await pointer.scrollIntoViewIfNeeded();if(width<801)await pointer.tap();else await pointer.click();
  await page.getByText('CONFIDENTIAL · Founder-only draft · Client delivery, email and export held.',{exact:true}).waitFor();assert.equal(mockProcesses,2);
  await page.evaluate(()=>{active=false;epoch++;document.dispatchEvent(new Event('ra:staff-access-reset'));});assert.equal(await page.locator('.roadmap-processing').count(),0);assert.equal(await page.locator('.rv6-dialog').count(),0);
  const previous=calls.length;await page.evaluate(()=>{role='coach';active=true;epoch++;document.dispatchEvent(new Event('ra:permissions-loaded'));});await page.waitForTimeout(20);assert.equal(calls.length,previous);assert.equal(await page.getByRole('button',{name:'Assessment Calibration',exact:true}).isVisible(),false);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert(!calls.includes('attest'));assert(!calls.includes('b6_attest'));assert.equal(workerCalls,0);
  return{engine,width,height,zoom,pass:true,geometry,mouseOrTouch:true,keyboard:true,doubleClickGuard:true,scrollAndFocusNoInvocation:true,all12DriverSections:true,all216SubmittedAnswerCards:true,logoutClears:true,deniedRole:true,unexpectedErrors:errors.length,externalRequests:external.length,realWorkerInvocations:workerCalls,mockProcessRequests:mockProcesses,consentRequests:0};
 }finally{await context.close();}
}
(async()=>{if(out)fs.mkdirSync(out,{recursive:true});const results=[];for(const engine of ['chromium','webkit']){const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});try{for(const size of(baseline?[[1366,768],[768,1024],[390,844]]:[[1366,768],[1440,900],[1920,1080],[768,1024],[390,844],[320,740],[1440,900,2]]))results.push(await scenario(browser,engine,size));}finally{await browser.close();}}const r={baseline,syntheticOnly:true,results};if(out)fs.writeFileSync(path.join(out,baseline?'BASELINE_RESULTS.json':'BROWSER_RESULTS.json'),JSON.stringify(r,null,2));console.log(JSON.stringify(r));})().catch(e=>{console.error(e);process.exitCode=1;});
