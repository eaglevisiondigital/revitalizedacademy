// Exact production-dist bytes, intercepted application transport, synthetic data only.
// Optional public assets allow only the three previously published thumbnails and Google Fonts.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium,webkit}=require(process.env.RVA_PLAYWRIGHT_PATH||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('production-dist'),base='https://hhl.fixture',out=path.resolve(process.env.RVA_HHL_REVIEW_DIR||'docs/health-hope-live-review'),publicAssets=process.env.RVA_HHL_PUBLIC_ASSETS==='1';fs.mkdirSync(out,{recursive:true});
const storyIds=['UDwJV-gW7iI','6so5sXskgXA','9gDp42pU5S8'];
const approvedAsset=url=>url.protocol==='https:'&&(storyIds.some(id=>url.href===`https://img.youtube.com/vi/${id}/hqdefault.jpg`)||(url.host==='fonts.googleapis.com'&&url.pathname==='/css2')||(url.host==='fonts.gstatic.com'&&/^\/s\/(dmsans|playfairdisplay)\/.+\.woff2$/.test(url.pathname)));
const rows=[{id:'11111111-1111-4111-8111-111111111111',starts_at:'2026-10-22T22:30:00Z',closes_at:'2026-10-22T22:30:00Z',status:'published'},{id:'22222222-2222-4222-8222-222222222222',starts_at:'2026-10-29T22:30:00Z',closes_at:'2026-10-29T22:30:00Z',status:'published'},{id:'33333333-3333-4333-8333-333333333333',starts_at:'2026-10-21T22:30:00Z',closes_at:'2026-10-21T22:30:00Z',status:'cancelled'}];
const mime=file=>file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'text/html';
(async()=>{let checks=0;const report=[];
for(const[name,engine]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.RVA_CHROMIUM_EXECUTABLE?{executablePath:process.env.RVA_CHROMIUM_EXECUTABLE}:{})});
 try{
 for(const width of [1440,768,390]){
  const context=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/Chicago'}),page=await context.newPage();page.setDefaultTimeout(8000);
  await page.clock.install({time:new Date('2026-10-20T15:00:00Z')});
  let current=rows,posted=[],failNext=false,delayedHistory=null;const errors=[],external=[],assetRequests=[];page.on('pageerror',error=>errors.push(error.message));
  const person={contact_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',name:'Fictional Visitor',email:'fictional@example.invalid',registered:2,attended:1};
  const overview={can_manage:true,settings:{registration_enabled:false,zoom_enabled:false,notifications_enabled:false},sessions:[{...rows[0],regular_date:'2026-10-22',revision:1,registered:1,attended:0,join_mode:'manual',zoom_ready:false}],people:[person],review_count:0};
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!==base){external.push(url.host);if(publicAssets&&route.request().method()==='GET'&&approvedAsset(url)){assetRequests.push(url.href);return route.continue();}if(url.host==='cdn.jsdelivr.net')return route.fulfill({contentType:'application/javascript',body:`window.fixtureSession={access_token:'fictional-local-jwt',user:{id:'fictional-owner'}};window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:window.fixtureSession}}),onAuthStateChange:fn=>{window.fixtureAuthChange=fn}}})};`});return route.fulfill({status:200,body:'',contentType:'text/css'});}
   if(url.pathname==='/api/health-hope-live/sessions')return route.fulfill({json:{sessions:current}});
   if(url.pathname==='/api/health-hope-live/register'){posted.push(route.request().postDataJSON());if(failNext){failNext=false;return route.fulfill({status:503,json:{error:'temporary'}});}return route.fulfill({status:202,json:{received:true}});}
   if(url.pathname==='/api/health-hope-live/staff'){
    const body=route.request().postDataJSON();
    if(body.action==='overview')return route.fulfill({json:overview});
    if(body.action==='history'){delayedHistory=route;return;}
    return route.fulfill({json:{saved:true}});
   }
   if(url.pathname==='/runtime-config.js')return route.fulfill({body:'window.RVA_PUBLIC_CONFIG={supabaseUrl:"https://fixture.invalid",supabaseKey:"fictional-public-key"};',contentType:'application/javascript'});
   const file=url.pathname==='/health-hope-live'? 'health-hope-live.html':url.pathname==='/'?'index.html':url.pathname.slice(1),full=path.join(root,file);
   if(!full.startsWith(root+path.sep)||!fs.existsSync(full)||!fs.statSync(full).isFile())return route.fulfill({status:404,body:'Not found'});
   let bytes=fs.readFileSync(full);
   // Render the homepage event promotion with its built CSS; unrelated homepage
   // application scripts are outside this event component's visual check.
   if(file==='index.html')bytes=Buffer.from(bytes.toString().replace(/<script\b[\s\S]*?<\/script>/gi,''));
   return route.fulfill({body:bytes,contentType:mime(full)});
  });
  await page.goto(base+'/health-hope-live');await page.waitForFunction(()=>!document.querySelector('#hhl-session').disabled);
  assert.equal(await page.locator('#hhl-session option').count(),3);checks++;
  assert.match(await page.locator('[data-hhl-next]').textContent(),/Thursday.*6:30 PM/);checks++;
  assert.equal(await page.locator('[data-hhl-countdown]').count(),1);assert.equal(await page.locator('.hhl-hero [data-hhl-countdown]').count(),1);checks+=2;
  assert.equal(await page.locator('.hhl-tagline').textContent(),'Real Stories. Real Hope.A Healthier You.');assert.equal(await page.locator('.hhl-hero .hhl-event-cta').getAttribute('href'),'#register');assert.equal(await page.locator('.hhl-stories-invitation .hhl-event-cta').getAttribute('href'),'#register');checks+=3;
  for(const[id,index]of storyIds.map((id,index)=>[id,index])){const card=page.locator('.hhl-stories>a').nth(index);assert.equal(await card.getAttribute('href'),`https://www.youtube.com/watch?v=${id}`);assert.equal(await card.locator('img').getAttribute('src'),`https://img.youtube.com/vi/${id}/hqdefault.jpg`);checks+=2;}
  const firstSeconds=await page.locator('[data-hhl-seconds]').textContent();await page.clock.runFor(1000);assert.notEqual(await page.locator('[data-hhl-seconds]').textContent(),firstSeconds);checks++;
  assert(await page.locator('[name=event_notifications]').getAttribute('required')!==null);assert.equal(await page.locator('[name=marketing_requested]').getAttribute('required'),null);assert.equal(await page.locator('[name=marketing_requested]').isChecked(),false);checks+=3;
  if(publicAssets){for(const img of await page.locator('.hhl-stories img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.hhl-stories img')].every(image=>image.complete&&image.naturalWidth>0));await page.evaluate(()=>document.fonts.ready);assert(await page.evaluate(()=>document.fonts.check('16px "DM Sans"')&&document.fonts.check('16px "Playfair Display"')));checks++;await page.evaluate(()=>scrollTo(0,0));}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks++;
  if(name==='chromium'&&[1440,390].includes(width)){const size=width===1440?'desktop':'mobile';await page.screenshot({path:path.join(out,`${size}.png`),fullPage:true});await page.locator('.hhl-hero').screenshot({path:path.join(out,`${size}-hero.png`)});await page.locator('.hhl-stories').screenshot({path:path.join(out,`${size}-stories.png`)});await page.locator('.hhl-form-card').screenshot({path:path.join(out,`${size}-registration.png`)});}
  await page.locator('#hhl-session').selectOption(rows[0].id);await page.locator('#hhl-first').fill('Fictional');await page.locator('#hhl-last').fill('Visitor');await page.locator('#hhl-email').fill('fictional@example.invalid');await page.locator('[name=event_notifications]').check();
  failNext=true;await page.locator('#hhl-registration-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#hhl-form-status').textContent.includes('couldn’t'));assert.equal(posted.length,1);checks++;
  await page.locator('#hhl-registration-form [type=submit]').click();await page.locator('#hhl-confirmation').waitFor({state:'visible'});assert.equal(posted.length,2);assert.equal(posted[0].request_id,posted[1].request_id);assert.equal(posted[1].marketing_requested,false);checks+=3;
  assert.equal(await page.locator('#hhl-email').inputValue(),'');assert.deepEqual(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]});checks+=2;
  await page.locator('#hhl-register-another').click();await page.locator('#hhl-session').selectOption(rows[1].id);await page.locator('#hhl-first').fill('Fictional');await page.locator('#hhl-last').fill('Visitor');await page.locator('#hhl-email').fill('fictional@example.invalid');await page.locator('[name=event_notifications]').check();await page.locator('#hhl-registration-form [type=submit]').click();await page.locator('#hhl-confirmation').waitFor({state:'visible'});assert.equal(posted.length,3);assert.equal(posted[2].session_id,rows[1].id);assert.notEqual(posted[2].request_id,posted[1].request_id);checks+=3;
  current=[];await page.locator('#hhl-register-another').click();await page.waitForFunction(()=>document.querySelector('#hhl-session').disabled);assert(await page.locator('[data-hhl-countdown]').isHidden());assert(await page.locator('#hhl-registration-form [type=submit]').isDisabled());checks+=2;
  await page.goto(base+'/');const homeCta=page.locator('.hhl-promo .hhl-event-cta');await homeCta.scrollIntoViewIfNeeded();if(publicAssets)await page.evaluate(()=>document.fonts.ready);assert.match(await homeCta.textContent(),/SAVE MY SEAT FOR THURSDAY/);assert.equal(await homeCta.getAttribute('href'),'/health-hope-live');assert(await homeCta.evaluate(button=>{const rect=button.getBoundingClientRect();return rect.left>=0&&rect.right<=innerWidth+1;}));checks+=3;
  if(name==='chromium'&&[1440,390].includes(width))await page.locator('.hhl-promo').screenshot({path:path.join(out,width===1440?'desktop-home-promotion.png':'mobile-home-promotion.png')});
  await page.goto(base+'/portal/health-hope-live.html');await page.locator('#hhl-staff-people').getByText(person.name).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks++;
  await page.getByRole('button',{name:'Edit session',exact:true}).click();assert.equal(await page.locator('#hhl-session-form [name=id]').inputValue(),rows[0].id);checks++;
  await page.getByRole('button',{name:'View session history',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#hhl-history-panel').hidden===false);
  await page.evaluate(()=>{window.fixtureSession=null;window.fixtureAuthChange('SIGNED_OUT',null);});
  if(delayedHistory){await delayedHistory.fulfill({json:[{registration_id:'fictional-registration',starts_at:rows[0].starts_at,registered_at:'2026-10-20T12:00:00Z',status:'confirmed',attended_at:null}]}).catch(()=>{});}
  await page.waitForFunction(()=>document.querySelector('#hhl-staff-workspace').hidden);
  assert.equal(await page.locator('#hhl-staff-people').textContent(),'');assert.equal(await page.locator('#hhl-staff-history').textContent(),'');assert.equal(await page.locator('#hhl-private-join').textContent(),'');checks+=3;
  assert.deepEqual(errors,[]);checks++;report.push({engine:name,width,errors:errors.length,actualExternalRequests:assetRequests.length,publicAssetHosts:[...new Set(assetRequests.map(url=>new URL(url).host))],interceptedExternalHosts:[...new Set(external)]});await context.close();
 }
 }finally{await browser.close();}
}
console.log(JSON.stringify({checks,runs:report,hostedWrites:0,providerCalls:0}));
})().catch(error=>{console.error(error);process.exitCode=1;});
