// Real browser/normal original route; managed Auth/RPC transport is an explicit fictional adapter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),out=require('./output-directory.cjs')(root);
fs.mkdirSync(out,{recursive:true});
const bundled=process.env.RVA_WAVE2_PLAYWRIGHT||path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const playwright=require(bundled);if(require(path.join(bundled,'package.json')).version!=='1.62.1')throw Error('Pinned Playwright 1.62.1 required');
const origin='https://academy-fixture.invalid';
const sdk=fs.readFileSync(path.join(__dirname,'browser-transport.js'),'utf8');
new (require('node:vm').Script)(sdk);

(async()=>{const receipt={runnerSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),outputDirectory:out,sourceCommit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),scope:'Actual onboarding HTML/environment/runtime with fake SDK/Auth/RPC transport; no dashboard/hosted/provider certification',productionCalls:0,providerCalls:0,results:[]};
 try{for(const engine of ['chromium','webkit']){const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'?{executablePath:process.env.RVA_WAVE2_CHROMIUM||playwright.chromium.executablePath()}: {})});try{for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){for(const scenario of ['signed-out','unverified','wrong-claim','pending','suspended','logout']){const ctx=await browser.newContext({viewport,serviceWorkers:'block'}),errors=[],blocked=[];try{const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(value=>window.__WAVE2_CASE=value,scenario);await ctx.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname==='cdn.jsdelivr.net')return route.fulfill({contentType:'text/javascript',body:sdk});if(u.origin!==origin){blocked.push(u.origin);return route.abort();}if(u.pathname==='/runtime-config.js')return route.fulfill({contentType:'text/javascript',body:`window.RVA_PUBLIC_CONFIG=${JSON.stringify({environment:'local',supabaseUrl:'https://auth-fixture.invalid',supabaseKey:'sb_publishable_fixture',appOrigin:origin,paymentMode:'synthetic'})};`});let rel=u.pathname.replace(/^\//,'');if(rel==='member/onboarding/')rel+='index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){blocked.push(u.pathname);return route.fulfill({status:404,body:''});}return route.fulfill({path:file});});
 const hash=['unverified','wrong-claim'].includes(scenario)?'#enroll='+'f'.repeat(64):'';await page.goto(origin+'/member/onboarding/'+hash);await page.waitForFunction(()=>document.getElementById('status').textContent.length>0);
 const text=await page.locator('#status').innerText();
 if(scenario==='signed-out'){assert.match(text,/Sign in/);assert.equal(await page.locator('#auth-panel').isVisible(),true);}
 if(scenario==='unverified'){assert.match(text,/Verify your email/);assert.equal(new URL(page.url()).hash,'');assert.equal((await page.evaluate(()=>window.__WAVE2_CALLS)).length,0);}
 if(scenario==='wrong-claim'){assert.match(text,/Invitation unavailable/);assert.equal(await page.locator('#agreements').innerText(),'');assert.deepEqual((await page.evaluate(()=>window.__WAVE2_CALLS)).map(x=>x.name),['claim_onboarding_enrollment']);}
 if(scenario==='pending'){assert.match(await page.locator('#enrollments').innerText(),/Payment Required/);assert.match(text,/paid member access remains held/);}
 if(scenario==='suspended'){assert.match(text,/suspended/);assert.equal(await page.locator('#agreements').innerText(),'');}
 if(scenario==='logout'){await page.locator('#sign-out').click();await page.waitForFunction(()=>document.getElementById('status').textContent==='Signed out.');assert.equal(await page.locator('#account-email').innerText(),'');assert.equal(await page.locator('#enrollments').innerText(),'');assert.equal(await page.locator('#auth-panel').isVisible(),true);}
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const calls=await page.evaluate(()=>window.__WAVE2_CALLS);assert.equal(calls.some(x=>/pay|activate|waiv|grant|generate/i.test(x.name)),false);
 receipt.results.push({engine,viewport,scenario,browserVersion:browser.version(),matrixIds:scenario==='logout'?['N05']:scenario==='pending'||scenario==='suspended'?['N06']:['J05'],result:'PASS_PARTIAL',adapter:'fictional SDK/Auth/RPC',unexpectedBrowserErrors:0,unexpectedRequests:0});
 }catch(error){receipt.failedScenario={engine,viewport,scenario,errors,blocked};throw error;}finally{await ctx.close();}}}}finally{await browser.close();}}receipt.result='PASS_PARTIAL';}
 catch(error){receipt.result='FAIL';receipt.error=error.message;process.exitCode=1;}
 finally{receipt.completedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'browser-receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({result:receipt.result,cases:receipt.results.length,error:receipt.error}));}
})();
