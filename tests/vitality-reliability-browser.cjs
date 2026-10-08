// Exact public build, isolated HTTP fixture. No hosted requests or real mail.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit,devices}=require(process.env.RVA_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../production-dist'),origin='https://revitalizedacademy.com';
(async()=>{let checks=0;const check=(v,label)=>{assert(v,label);checks++;};const browser=await webkit.launch();
try{for(const size of [{width:1440,height:1000},{width:768,height:1024},{width:390,height:844}]){
 const phone=size.width===390?devices['iPhone 13']:{};const {defaultBrowserType,...device}=phone;
 const context=await browser.newContext({...device,viewport:size});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
 const state={starts:0,recoveries:0,redeems:0,reads:0,netlify:0,delay:40,scriptDelay:0,mail:'a'.repeat(64),used:false,identity:null,snapshot:{version:1,section:6,section_label:'Functional Training',percent:40,pathway:'Adult',fields:{additional_context:[{type:'textarea',value:'Synthetic saved answer'}],primary_goals:[{type:'checkbox',value:'Energy',checked:true}]}}};
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.endsWith('/vitality-resume')){
   const b=req.postDataJSON();await new Promise(r=>setTimeout(r,state.delay));let data={ok:true,retry_after:60,message:'If an unfinished assessment is available, we’ll email a secure link.'},status=200;
   if(b.action==='start'){state.starts++;state.identity=b;}
   if(b.action==='recover'){state.recoveries++;state.mail='c'.repeat(64);state.used=false;}
   if(['redeem','read'].includes(b.action)){
    b.action==='redeem'?state.redeems++:state.reads++;
    if(b.action==='redeem'&&(b.token!==state.mail||state.used)){status=401;data={error:'This link is unavailable, already used, or replaced. Use the most recent email, or request a new secure link.'};}
    else {if(b.action==='redeem')state.used=true;data={status:'draft',draft_id:'synthetic',identity:state.identity,snapshot:state.snapshot,revision:5,...(b.action==='redeem'?{token:'b'.repeat(64)}:{})};}
   }
   if(b.action==='save')data={status:'draft',draft_id:'synthetic',revision:6};
   return route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  }
  if(url.origin!==origin)return route.abort();
  if(req.method()==='POST'){state.netlify++;return route.fulfill({status:200,body:'Synthetic'});}
  if(url.pathname==='/blank')return route.fulfill({status:200,contentType:'text/html',body:'<html><body>Mail-return fixture</body></html>'});
  const relative=url.pathname.replace(/^\//,''),file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Missing fixture'});
  if(relative==='js/vitality-resume.js'&&state.scriptDelay)await new Promise(r=>setTimeout(r,state.scriptDelay));
  const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';return route.fulfill({status:200,contentType:type,body:fs.readFileSync(file)});
 });
 await page.goto(origin+'/consult.html');await page.waitForFunction(()=>!!window.RVA_RESUME);
 if(size.width===390)await page.evaluate(()=>Object.defineProperty(crypto,'randomUUID',{value:undefined}));
 await page.locator('[data-start-new]').click();for(const [name,value]of Object.entries({first_name:'Synthetic',last_name:'Participant',email:'test@example.invalid',phone:'0000000000',referral_source:'Google Search'})){const c=page.locator('[data-vitality-lead-form] [name="'+name+'"]');if(name==='referral_source')await c.selectOption(value);else await c.fill(value);}
 await page.evaluate(()=>{const f=document.querySelector('[data-vitality-lead-form]');for(let i=0;i<5;i++)f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));});
 await page.locator('[data-start-confirmation]').waitFor({state:'visible'});check(state.starts===1&&state.netlify===0,'five taps: one secure start; no browser staff submissions');
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'confirmation has no overflow');await page.screenshot({path:path.resolve('/private/tmp/rva-vitality-confirmation-'+size.width+'.png'),fullPage:false});
 check(await page.locator('[data-vitality-lead-form]').isHidden(),'contact form replaced');check((await page.locator('[data-start-email-copy]').innerText()).includes('t•••@example.invalid'),'masked recipient');check(await page.locator('[data-start-resend]').isDisabled(),'resend cooldown');
 // Advance only the isolated browser clock, preserving the maintained 60-second gate.
 await page.evaluate(()=>{const real=Date.now;Date.now=()=>real()+61000;});await page.waitForFunction(()=>!document.querySelector('[data-start-resend]').disabled);
 await page.locator('[data-start-resend]').click();await page.waitForFunction(()=>document.querySelector('[data-start-resend]').disabled);await page.waitForTimeout(100);check(state.recoveries===1,'one explicit controlled resend');
 await page.goto(origin+'/consult.html#resume='+'a'.repeat(64));await page.waitForFunction(()=>document.querySelector('[data-resume-status]').textContent.includes('most recent email'));check(await page.locator('[data-assessment-step]').isHidden(),'superseded link safe denial');check(state.recoveries===1,'denial does not silently request another email');
 await page.goto(origin+'/consult.html#resume='+state.mail);await page.waitForFunction(()=>window.RVA_RESUME?.canEdit());check(await page.locator('[data-assessment-step]').isVisible(),'latest link directly resumes');check(await page.locator('[data-assessment-entry]').isHidden(),'landing choice hidden after direct resume');check(state.recoveries===1,'no second-email round trip');
 check(await page.locator('[name="additional_context"]').inputValue()==='Synthetic saved answer','actual typed answer restored');check(!(new URL(page.url())).hash,'URL credential stripped');check(await page.evaluate(()=>sessionStorage.getItem('rva_vitality_pending_link_v1')===null),'pending credential removed after exchange');
 await page.reload();await page.waitForFunction(()=>window.RVA_RESUME?.canEdit());check(state.reads===1,'refresh restores verified session');check(await page.locator('[name="additional_context"]').inputValue()==='Synthetic saved answer','refresh retains saved answer');
 await page.goto(origin+'/blank');await page.goBack();await page.waitForFunction(()=>window.RVA_RESUME?.canEdit());check(await page.locator('[data-assessment-step]').isVisible(),'browser back restores assessment');await page.goForward();await page.goBack();await page.waitForFunction(()=>window.RVA_RESUME?.canEdit());check(await page.locator('[name="additional_context"]').inputValue()==='Synthetic saved answer','back/forward retains data');
 const mailTab=await context.newPage();await mailTab.goto(origin+'/blank');await page.bringToFront();check(await page.locator('[data-assessment-step]').isVisible(),'return from other tab retains direct session');await mailTab.close();
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow');check(errors.length===0,'no runtime/console errors: '+errors.join(';'));
 // Reload between early credential stripping and delayed module load.
 state.mail='d'.repeat(64);state.used=false;state.scriptDelay=2500;
 await page.goto(origin+'/consult.html#resume='+state.mail,{waitUntil:'commit'});await page.waitForFunction(()=>sessionStorage.getItem('rva_vitality_pending_link_v1')!==null);state.scriptDelay=0;const prior=state.redeems;await page.reload();await page.waitForFunction(()=>window.RVA_RESUME?.canEdit());check(state.redeems===prior+1,'reload during script loading exchanges preserved credential once');check(await page.locator('[name="additional_context"]').inputValue()==='Synthetic saved answer','interrupted startup restores existing answers');
 await page.screenshot({path:path.resolve('/private/tmp/rva-vitality-webkit-'+size.width+'.png'),fullPage:false});const readsBeforeMalformed=state.reads;await page.goto(origin+'/consult.html#resume=invalid');await page.waitForFunction(()=>document.querySelector('[data-resume-status]').textContent.includes('unavailable'));check(await page.locator('[data-assessment-step]').isHidden(),'malformed link never exposes previous participant form');check(state.reads===readsBeforeMalformed,'malformed link does not silently use a prior session');await context.close();console.log('WebKit '+size.width+'×'+size.height+': passed');
}console.log('Exact-built WebKit checks: '+checks+' passed');}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
