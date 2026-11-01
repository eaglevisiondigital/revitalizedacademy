'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const pw=require('/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createPreviewServer}=require('../../tools/affiliate-share-preview/server.cjs');
for(const engine of ['chromium','webkit'])test('QA '+engine+' pending scenario plus channel selection cannot strand controls',async()=>{
 const s=createPreviewServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+s.address().port;
 const b=await pw[engine].launch({headless:true,executablePath:engine==='chromium'?'/Users/davesmacbookpro/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell':'/Users/davesmacbookpro/Library/Caches/ms-playwright/webkit-2336/pw_run.sh'});
 try{const page=await b.newPage();await page.goto(base);await page.waitForFunction(()=>!document.getElementById('prepare').disabled);let release,arrived;const seen=new Promise(r=>arrived=r);await page.route('**/api/scenario',async route=>{const response=await route.fetch();arrived();await new Promise(r=>release=r);await route.fulfill({response});});await page.selectOption('#state','revoked');await seen;await page.selectOption('#channel','sms');release();await page.waitForLoadState('networkidle');a.equal(await page.locator('#prepare').isDisabled(),false,'Channel changes must not cancel the scenario completion that re-enables controls');await page.click('#prepare');await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Held:'));a.equal(await page.locator('#qr').getAttribute('src'),null);}finally{await b.close();s.closeAllConnections();await new Promise(r=>s.close(r));}
});
