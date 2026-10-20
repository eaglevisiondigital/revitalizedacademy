'use strict';
// Anonymous, read-only actual-served acceptance. Never submit participant data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),R=require('../scripts/health-hope-live-release.cjs');
const{chromium,webkit}=require(process.env.RVA_PLAYWRIGHT_PATH||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const journal=JSON.parse(fs.readFileSync(path.join(R.OUT,'operation-journal.json'),'utf8')),stage=process.argv[2]||'unpublished',origin=stage==='canonical'?R.ORIGIN:journal.origin;
assert(['unpublished','canonical'].includes(stage));
const contrast=colors=>{const lum=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);return(lum(colors.background)+.05)/(lum(colors.foreground)+.05);};
async function contextFor(browser,width){const context=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/Chicago'}),blocked=[],eventRequests=[];await context.route('**/*',route=>{const request=route.request();if(/\/api\/health-hope-live\//.test(request.url())){eventRequests.push(request.url());return route.abort();}if(!['GET','HEAD'].includes(request.method())){blocked.push({method:request.method(),host:new URL(request.url()).host});return route.abort();}return route.continue();});return{context,blocked,eventRequests};}
async function home(page){const errors=[];const listener=error=>errors.push(error.message);page.on('pageerror',listener);await page.goto(origin+'/',{waitUntil:'load'});await page.locator('.hhl-promo').scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);const popup=page.locator('.vitality-popup-backdrop');await page.locator('.vitality-popup-backdrop.show').waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await popup.isVisible()){await page.keyboard.press('Escape');await popup.waitFor({state:'hidden'});await page.locator('.hhl-promo').scrollIntoViewIfNeeded();}page.off('pageerror',listener);return errors;}
(async()=>{let checks=0;const runs=[],baselines={};
 for(const[name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.RVA_CHROMIUM_EXECUTABLE?{executablePath:process.env.RVA_CHROMIUM_EXECUTABLE}:{})});
  try{
   if(stage==='unpublished'){const{context}=await contextFor(browser,1440),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(R.ORIGIN+'/',{waitUntil:'load'});baselines[name]=errors;await context.close();}else baselines[name]=JSON.parse(fs.readFileSync(path.join(R.OUT,'unpublished-browser.json'),'utf8')).baselineHomepageErrors[name];
   for(const width of [1440,768,390]){
    const{context,blocked,eventRequests}=await contextFor(browser,width),page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(45000);
    const homeErrors=await home(page);assert(homeErrors.every(error=>baselines[name].includes(error)),'New homepage application error');checks++;
    assert.equal(await page.locator('#hhl-home-title').textContent(),'Health & Hope Live');assert.match(await page.locator('.hhl-promo').textContent(),/Real Stories\. Real Hope\. A Healthier You\./);assert.doesNotMatch(await page.locator('body').innerText(),/Founders?\s+Webinar|only 50 seats/i);checks+=3;
    const homeCta=page.locator('.hhl-promo .hhl-event-cta');assert.equal(await homeCta.getAttribute('href'),'/health-hope-live#register');const colors=await homeCta.evaluate(button=>{const style=getComputedStyle(button);return{foreground:style.color,background:style.backgroundColor};});assert.equal(colors.background,'rgb(216, 166, 42)');assert(contrast(colors)>=4.5);checks+=3;
    assert(await homeCta.evaluate(button=>{const rect=button.getBoundingClientRect();return button.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2));}));checks++;
    if(name==='chromium'&&[1440,390].includes(width))await page.locator('.hhl-promo').screenshot({path:path.join(R.OUT,`${stage}-${width}-home.png`)});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(origin+'/health-hope-live',{waitUntil:'load'});await page.waitForFunction(()=>document.querySelector('#hhl-availability').textContent.includes('currently unavailable'));
    assert.equal(await page.locator('body').getAttribute('data-hhl-registration'),'held');assert(await page.locator('#hhl-registration-form').evaluate(form=>[...form.elements].every(field=>field.disabled)));assert(await page.locator('[data-hhl-countdown]').isHidden());assert.equal(await page.locator('[data-hhl-next]').textContent(),'Session details are being confirmed.');assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),R.ORIGIN+'/health-hope-live');checks+=5;
    const heroCta=page.locator('.hhl-hero .hhl-event-cta'),heroColors=await heroCta.evaluate(button=>{const style=getComputedStyle(button);return{foreground:style.color,background:style.backgroundColor};});assert.equal(heroColors.background,'rgb(216, 166, 42)');assert(contrast(heroColors)>=4.5);checks+=2;
    await heroCta.click();assert.equal(new URL(page.url()).hash,'#register');assert(await page.locator('#hhl-availability').isVisible());checks+=2;
    for(const img of await page.locator('.hhl-stories img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.hhl-stories img')].every(img=>img.complete&&img.naturalWidth>0));await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo(0,0));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(eventRequests,[]);checks+=3;
    if(name==='chromium'&&[1440,390].includes(width))await page.screenshot({path:path.join(R.OUT,`${stage}-${width}-landing.png`),fullPage:true});
    runs.push({engine:name,width,homepageErrors:homeErrors,landingErrors:errors,overflow:false,registrationRequests:0,blockedNonReadRequests:blocked});await context.close();
   }
  }finally{await browser.close();}
 }
 const result={at:new Date().toISOString(),stage,origin,deploy:journal.id,passed:true,checks,runs,baselineHomepageErrors:baselines,participantSubmissions:0,providerCalls:0,hostedWrites:0};fs.writeFileSync(path.join(R.OUT,stage+'-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({stage,passed:true,checks,runs:runs.length,participantSubmissions:0}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
