'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const pw=require('/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createPreviewServer}=require('../../tools/affiliate-share-preview/server.cjs');
const {createProviders}=require('../../tools/wave5-fixture-providers.cjs');
for(const engine of ['chromium','webkit'])test(engine+' late ready cannot revive source review after genuine denied read',async()=>{
const providers=createProviders(),server=createPreviewServer({providers});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await pw[engine].launch({headless:true,executablePath:engine==='chromium'?'/Users/davesmacbookpro/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell':'/Users/davesmacbookpro/Library/Caches/ms-playwright/webkit-2336/pw_run.sh'});
let release;try{const page=await browser.newPage();await page.goto(base);await page.waitForFunction(()=>!document.getElementById('source-review').disabled);let arrive;const arrived=new Promise(r=>arrive=r);let n=0;
await page.route('**/api/source-review',async route=>{if(++n===1){const response=await route.fetch();arrive();await new Promise(r=>release=r);await route.fulfill({response});}else await route.continue();});
await page.click('#source-review');await arrived;providers.transition('revoked');await page.click('#source-review');await page.waitForFunction(()=>document.getElementById('source-review-result').textContent.startsWith('Held:'));release();release=null;await page.waitForLoadState('networkidle');assert.doesNotMatch(await page.textContent('#source-review-result'),/Fictional source review — read only/);
}finally{release?.();await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
