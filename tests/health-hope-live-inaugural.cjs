'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),event=require('../js/health-hope-live.js'),now=Date.parse('2026-10-20T12:00:00Z');
const row=(id,starts_at,status='published')=>({id,starts_at,closes_at:starts_at,status});
const early=row('early','2026-10-22T22:30:00Z'),first=row('first','2026-10-29T22:30:00Z'),next=row('next','2026-11-05T23:30:00Z');
test('inaugural date excludes October 22 and uses the Eastern calendar boundary',()=>{
 assert.equal(event.firstSessionDate,'2026-10-29');assert.equal(event.zone,'America/New_York');
 assert.deepEqual(event.available([early,first,row('eastern-28th','2026-10-29T00:30:00Z')],now).map(x=>x.id),['first']);
});
test('inaugural availability skips canceled/draft dates and never invents a session',()=>{
 assert.deepEqual(event.available([early,{...first,status:'cancelled'},{...first,status:'draft'},next],now).map(x=>x.id),['next']);
 assert.deepEqual(event.available([],now),[]);assert.deepEqual(event.available([early],now),[]);
});
test('inaugural Thursdays stay at 6:30 Eastern across the November clock change',()=>{
 assert.match(event.label(first),/October 29.*6:30 PM EDT/);assert.match(event.label(next),/November 5.*6:30 PM EST/);
 assert.deepEqual(event.countdown(next,Date.parse(first.starts_at)),{days:7,hours:1,minutes:0,seconds:0});
});
test('inaugural website and acceptance artifacts stay held and target October 29',()=>{
 assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/data-hhl-promo="held"/);
 assert.match(fs.readFileSync(path.join(root,'health-hope-live.html'),'utf8'),/data-hhl-registration="held"/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'docs/health-hope-live-launch-preparation-2026-10-20/acceptance-case.template.json'))).expected_thursday,'2026-10-29');
});
test('inaugural homepage countdown is gated, live, responsive and cancellation-aware',{skip:process.env.RVA_HHL_INAUGURAL_BROWSER!=='1'},async()=>{
 const {chromium}=require(process.env.RVA_HHL_PLAYWRIGHT_PATH||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const source=fs.readFileSync(path.join(root,'index.html'),'utf8'),promo=source.match(/<section class="hhl-promo[\s\S]*?<\/section>/)[0];
 let rows=[early,first,next],calls=0;
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');if(url.pathname==='/api/health-hope-live/sessions'){calls++;res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({sessions:rows,timezone:event.zone}));}if(['/js/health-hope-live.js','/css/health-hope-live.css','/css/styles.css'].includes(url.pathname)){res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(path.join(root,url.pathname)));}res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/styles.css"><link rel="stylesheet" href="/css/health-hope-live.css"><body>'+promo.replace('data-hhl-promo="held"','data-hhl-promo="'+(url.searchParams.get('mode')==='enabled'?'enabled':'held')+'"')+'<script src="/js/health-hope-live.js"></script>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;try{
  browser=await chromium.launch({headless:true,...(process.env.RVA_CHROMIUM_EXECUTABLE?{executablePath:process.env.RVA_CHROMIUM_EXECUTABLE}:{})});
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:900},timezoneId:'America/Vancouver'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{Date.now=()=>Date.parse('2026-10-20T12:00:00Z');});
   calls=0;rows=[early,first,next];const origin='http://127.0.0.1:'+server.address().port;
   await page.goto(origin);assert.equal(calls,0);assert.equal(await page.locator('[data-hhl-promo-date]').isVisible(),false);assert.equal(await page.locator('[data-hhl-promo-countdown]').isVisible(),false);
   await page.goto(origin+'/?mode=enabled');await page.waitForFunction(()=>document.querySelector('[data-hhl-promo-date]').textContent.includes('October 29'));
   assert.match(await page.locator('[data-hhl-promo-date]').innerText(),/6:30 PM EDT/);assert.equal(await page.locator('[data-hhl-promo-countdown]').isVisible(),true);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.evaluate(()=>{Date.now=()=>Date.parse('2026-10-20T12:00:02Z');});await page.waitForFunction(()=>document.querySelector('[data-hhl-promo-seconds]').textContent==='58');
   rows=[early,{...first,status:'cancelled'},next];await page.reload();await page.waitForFunction(()=>document.querySelector('[data-hhl-promo-date]').textContent.includes('November 5'));assert.match(await page.locator('[data-hhl-promo-date]').innerText(),/6:30 PM EST/);
   rows=[];await page.reload();await page.waitForFunction(()=>document.querySelector('[data-hhl-promo-date]').textContent.includes('being confirmed'));assert.equal(await page.locator('[data-hhl-promo-countdown]').isVisible(),false);
   assert.deepEqual(errors,[]);await context.close();
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
});
