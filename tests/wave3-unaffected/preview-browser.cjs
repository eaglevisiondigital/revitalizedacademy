'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const pw=require(process.env.RVA_PLAYWRIGHT_PATH||'/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createPreviewServer}=require('../../tools/affiliate-share-preview/server.cjs');
function decode(file){const r=cp.spawnSync('swift',['-module-cache-path',process.env.RVA_SWIFT_CACHE||'/private/tmp/rva-wave3-swift-cache',path.resolve('tests/wave3-unaffected/decode-qr.swift'),file],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
for(const engine of ['chromium','webkit'])for(const width of [1440,768,390])test(engine+' '+width+' actual preview QR decode, manual select, revocation and stale result clearing',async()=>{
 const s=createPreviewServer();await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+s.address().port;
 const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.RVA_CHROMIUM_EXECUTABLE||'/Users/davesmacbookpro/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell'}:{})});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rva-preview-')),outside=[],errors=[];
 try{
 const page=await browser.newPage({viewport:{width,height:950}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){outside.push(r.request().url());return r.abort();}return r.continue();});
 await page.goto(origin);await page.click('#prepare');await page.waitForFunction(()=>document.getElementById('status').textContent==='Fictional preview ready.');
 await page.waitForFunction(()=>document.getElementById('qr').complete&&document.getElementById('qr').naturalWidth>0);
 const url=await page.inputValue('#url');await page.locator('#qr').screenshot({path:path.join(dir,'rendered-qr.png')});assert.deepEqual(decode(path.join(dir,'rendered-qr.png')),[url]);
 await page.click('#select-copy');assert.ok(await page.evaluate(()=>document.getElementById('copy').selectionEnd>0));assert.ok((await page.inputValue('#copy')).includes(url));
 for(const channel of ['sms','dm','social']){await page.selectOption('#channel',channel);assert.equal(await page.inputValue('#copy'),'');assert.equal(await page.locator('#qr').getAttribute('src'),null);await page.click('#prepare');await page.waitForFunction(()=>document.getElementById('status').textContent==='Fictional preview ready.');assert.equal(new URL(await page.inputValue('#url')).searchParams.get('rva_channel'),channel);}
 for(const state of ['revoked','expired','wrong-account']){await page.selectOption('#state',state);assert.equal(await page.inputValue('#copy'),'');assert.equal(await page.locator('#qr').getAttribute('src'),null);await page.click('#prepare');await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Held:'));assert.equal(await page.locator('#preview').isVisible(),false);}
 let release,seen;const arrived=new Promise(resolve=>seen=resolve);
 await page.route('**/api/preview',async r=>{await new Promise(resolve=>{release=resolve;seen();});await r.continue();});
 await page.selectOption('#state','active');await page.click('#prepare');await arrived;await page.selectOption('#state','wrong-account');release();await page.waitForLoadState('networkidle');
 assert.equal(await page.inputValue('#copy'),'');assert.equal(await page.locator('#qr').getAttribute('src'),null);assert.equal(await page.locator('#preview').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>s.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
