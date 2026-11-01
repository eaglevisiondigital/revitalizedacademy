'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const pw=require('/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createProviders}=require('../../tools/wave5-fixture-providers.cjs'),{createPreviewServer}=require('../../tools/affiliate-share-preview/server.cjs');
for(const engine of ['chromium','webkit'])test(engine+' delayed coherent bundle cannot revive after actual independent source denial',async()=>{
 const p=createProviders(),server=createPreviewServer({providers:p});await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});const base='http://127.0.0.1:'+server.address().port;
 const browser=await pw[engine].launch({headless:true,executablePath:engine==='chromium'?'/Users/davesmacbookpro/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell':'/Users/davesmacbookpro/Library/Caches/ms-playwright/webkit-2336/pw_run.sh'});let release;
 try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.waitForFunction(()=>!document.getElementById('reviewed-prepare').disabled);let arrive;const arrived=new Promise(r=>arrive=r);
  await page.route('**/api/reviewed-preview',async route=>{const response=await route.fetch();arrive();await new Promise(r=>release=r);await route.fulfill({response});});
  await page.click('#reviewed-prepare');await arrived;p.transition('revoked');await page.click('#source-review');await page.waitForFunction(()=>document.getElementById('source-review-result').textContent.startsWith('Held:'));release();release=null;await page.waitForLoadState('networkidle');
  assert.equal(await page.inputValue('#copy'),'');assert.equal(await page.locator('#qr').getAttribute('src'),null);assert.match(await page.textContent('#source-review-result'),/^Held:/);assert.deepEqual(errors,[]);
 }finally{release?.();await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
