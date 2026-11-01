'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const pw=require(process.env.RVA_PLAYWRIGHT_PATH||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {installFixture}=require('./fixture.cjs');
const root=path.resolve(__dirname,'../..'),origin='https://member-fixture.invalid';
const out=path.resolve(root,'docs/orchestration/issue-53/wave2');fs.mkdirSync(out,{recursive:true});
const results=[],failures=[];
const baseline=cp.execFileSync('git',['show','fc6737415da36b4306afa0060a525eca2f1131ca:member/member110.js'],{cwd:root,encoding:'utf8'});
async function fixture(browser,options={}){
  const context=await browser.newContext({viewport:{width:options.width||1440,height:900},isMobile:options.width<600,hasTouch:options.width<600});
  const outside=[],errors=[];await context.addInitScript(installFixture,options);
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.href.startsWith('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/'))return route.fulfill({contentType:'application/javascript',body:'/* Fictional SDK transport installed before actual app scripts. */'});
    if(url.origin!==origin||request.method()!=='GET'){outside.push({origin:url.origin,method:request.method()});return route.abort();}
    let rel=decodeURIComponent(url.pathname).replace(/^\//,'');
    if(rel==='member/'||rel==='member')rel='member/index.html';
    if(rel==='member/onboarding/')rel='member/onboarding/index.html';
    if(rel==='member/dashboard'||rel==='member/dashboard/')rel='member/dashboard.html';
    if(rel==='runtime-config.js')return route.fulfill({contentType:'application/javascript',body:'window.RVA_PUBLIC_CONFIG='+JSON.stringify({environment:'local',supabaseUrl:'https://synthetic.invalid',supabaseKey:'sb_publishable_fixture',appOrigin:origin,paymentMode:'synthetic'})+';'});
    if(rel.includes('..')||!['member/','assets/','js/environment.js'].some(prefix=>rel.startsWith(prefix)))return route.abort();
    const file=path.join(root,rel);if(!fs.existsSync(file))return route.fulfill({status:404,body:'Fixture file missing'});
    const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
    return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:options.baseline&&rel==='member/member110.js'?baseline:fs.readFileSync(file)});
  });
  const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+(options.route||'/member/dashboard.html'));
  return {context,page,errors,outside};
}
async function run(browser,engine,name,options,check){
  let f;try{f=await fixture(browser,options);await check(f);assert.deepEqual(f.outside,[]);assert.deepEqual(f.errors,[]);results.push({engine,name,status:'PASS',fictionalTransport:true,...options});}
  catch(error){failures.push({engine,name,status:'FAIL',message:error.message,errors:f?.errors||[]});}
  finally{await f?.context.close();}
}
(async()=>{
  for(const engine of ['chromium','webkit']){
    const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.RVA_CHROMIUM_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
    try{
      await run(browser,engine,'baseline pending logout defect reproduced',{baseline:true,gateTable:'my_app_bootstrap_v2'},async({page})=>{
        await page.waitForFunction(()=>__fixture.pending.length>0);await page.evaluate(()=>{__fixture.emit('SIGNED_OUT',null);__fixture.release();});
        await page.locator('#rm-dashboard').waitFor({state:'visible'});assert((await page.locator('#rm-member-name').innerText()).includes('synthetic-a'));
      });
      for(const width of [320,390,768,1440])await run(browser,engine,'normal dashboard route and layout '+width,{width},async({page})=>{
        await page.locator('#rm-dashboard').waitFor({state:'visible'});assert((await page.locator('#rm-member-name').innerText()).includes('synthetic-a'));
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
        assert.equal(await page.locator('.rm112-logo img').getAttribute('src'),'../assets/images/revitalized-logo-dark-approved-v69.png');
        await page.screenshot({path:path.join(out,engine+'-'+width+'-dashboard.png')});
      });
      for(const gateTable of ['my_app_bootstrap_v2','checkin_template_fields','client_checkins'])await run(browser,engine,'logout rejects late '+gateTable,{gateTable,checkin:gateTable!=='my_app_bootstrap_v2'},async({page})=>{
        await page.waitForFunction(()=>__fixture.pending.length>0);
        const immediate=await page.evaluate(()=>{__fixture.emit('SIGNED_OUT',null);__fixture.release();return {text:document.body.textContent,inputs:document.querySelectorAll('input').length};});
        assert(!immediate.text.includes('synthetic-a'));assert.equal(immediate.inputs,0);
        await page.locator('#rm-auth').waitFor({state:'visible'});assert.equal(await page.locator('#rm-member-name').innerText(),'');
        assert.equal(await page.locator('#rm-dashboard').isVisible(),false);
      });
      await run(browser,engine,'pending initial session cannot restore after logout',{gateSession:true},async({page})=>{
        await page.waitForFunction(()=>__fixture.pending.length>0);await page.evaluate(()=>{__fixture.emit('SIGNED_OUT',null);__fixture.release();});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        assert.equal(await page.locator('#rm-auth').isVisible(),true);assert.equal(await page.locator('#rm-dashboard').isVisible(),false);
        assert.equal(await page.evaluate(()=>__fixture.calls.filter(c=>c.kind==='query').length),0);
      });
      await run(browser,engine,'pending source and appointment load rejects account switch',{gateTable:'my_app_bootstrap_v2'},async({page})=>{
        await page.waitForFunction(()=>__fixture.pending.length>0);const text=await page.evaluate(()=>{__fixture.emit('SIGNED_IN','synthetic-b');__fixture.release();return document.body.textContent;});assert(!text.includes('synthetic-a'));
        await page.waitForFunction(()=>document.querySelector('#rm-member-name')?.textContent.includes('synthetic-b'));
        assert(!(await page.locator('body').innerText()).includes('synthetic-a'));
      });
      await run(browser,engine,'established account switch gets fresh B document',{},async({page})=>{
        await page.locator('#rm-dashboard').waitFor({state:'visible'});await page.evaluate(()=>__fixture.emit('SIGNED_IN','synthetic-b'));
        await page.waitForFunction(()=>document.querySelector('#rm-member-name')?.textContent.includes('synthetic-b'));
        assert(!(await page.locator('body').innerText()).includes('synthetic-a'));
      });
      await run(browser,engine,'same account token refresh retains workspace and form',{},async({page})=>{
        await page.locator('#rm-dashboard').waitFor({state:'visible'});await page.locator('#rm-profile-first').fill('Unsaved fictional first name');
        await page.evaluate(()=>{window.__sameDocumentMarker=true;__fixture.emit('TOKEN_REFRESHED');});
        assert.equal(await page.evaluate(()=>window.__sameDocumentMarker),true);assert.equal(await page.locator('#rm-profile-first').inputValue(),'Unsaved fictional first name');
      });
      await run(browser,engine,'ambiguous null INITIAL_SESSION does not reload established document',{},async({page})=>{
        await page.locator('#rm-dashboard').waitFor({state:'visible'});await page.evaluate(()=>{window.__sameDocumentMarker=true;__fixture.nullInitial();});
        assert.equal(await page.evaluate(()=>window.__sameDocumentMarker),true);assert.equal(await page.locator('#rm-dashboard').isVisible(),true);
      });
      for(const options of [{denied:true},{failure:'my_member_entitlements'},{sessionError:true}])await run(browser,engine,'unavailable or unpaid membership denies '+JSON.stringify(options),options,async({page})=>{
        await page.locator('#rm-denied').waitFor({state:'visible'});assert.equal(await page.locator('#rm-dashboard').isVisible(),false);
        assert.equal(await page.locator('#rm-denied a').getAttribute('href'),'/member/');
      });
      await run(browser,engine,'explicit signout clears private view',{},async({page})=>{
        await page.locator('#rm-dashboard').waitFor({state:'visible'});await page.locator('#rm-signout').click();
        await page.locator('#rm-auth').waitFor({state:'visible'});assert(!(await page.locator('body').innerText()).includes('synthetic-a'));
      });
      await run(browser,engine,'member root signing and dashboard roundtrip',{route:'/member/',width:390},async({page})=>{
        await page.locator('#account-panel').waitFor({state:'visible'});assert((await page.locator('#agreements').innerText()).includes('Fictional Agreement'));
        await page.locator('#agreements summary').click();await page.getByLabel('Your full legal name').fill('Fictional Adult');await page.getByLabel('I am an adult, have reviewed this agreement, accept its terms, and am signing for myself.').check();
        await page.getByRole('button',{name:'Sign Agreement',exact:true}).click();
        await page.waitForFunction(()=>__fixture.calls.some(c=>c.name==='sign_client_agreement_atomic'));
        const signature=await page.evaluate(()=>__fixture.calls.find(c=>c.name==='sign_client_agreement_atomic'));
        assert.equal(signature.args.p_expected_content_hash,'synthetic-hash');assert.equal(signature.args.p_signatures[0].signer_role,'primary_client');
        await page.getByRole('link',{name:'Open Member Dashboard'}).click();await page.locator('#rm-dashboard').waitFor({state:'visible'});
        await page.goto(origin+'/member/');await page.locator('#account-panel').waitFor({state:'visible'});
        assert((await page.locator('#agreements').innerText()).includes('Fictional Agreement'));
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      });
    }finally{await browser.close();}
  }
  const report={scope:'LOCAL_FICTIONAL_BROWSER_ONLY',results,failures,counts:{pass:results.length,fail:failures.length,blocked:0},productionCalls:0,realClientData:false};
  fs.writeFileSync(path.join(out,'BROWSER_RESULTS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
