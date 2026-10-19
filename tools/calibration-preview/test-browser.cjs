'use strict';
// Native browser rehearsal against loopback static FICTIONAL assets only.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const pw=require(process.env.RVA_PLAYWRIGHT_MODULE||'playwright');
const url='http://127.0.0.1:48958/',results=[];
(async()=>{for(const engine of ['chromium','webkit']){
const browser=await pw[engine].launch(engine==='chromium'?(process.env.RVA_CHROME_EXECUTABLE?{executablePath:process.env.RVA_CHROME_EXECUTABLE}:{}):{});
try{for(const[width,height]of[[1440,1000],[768,1024],[390,844]]){
const page=await browser.newPage({viewport:{width,height}}),errors=[],requests=[];let checks=0;
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});page.on('request',r=>requests.push(r.url()));
try{
await page.goto(url);await page.getByRole('button',{name:'Founder Scoring Lab',exact:true}).click();await page.getByText('Comparison calculated.',{exact:false}).waitFor();await page.getByRole('heading',{name:'Structured founder review · fictional case only'}).waitFor();
assert.equal(await page.getByLabel('Fictional calibration case',{exact:true}).locator('option').count(),50);checks++;
for(const[letter,id,score]of[['A','abc_a','70.66'],['B','abc_b','35.48'],['C','abc_c','70.00']]){
await page.getByRole('button',{name:'Person '+letter,exact:false}).click();await page.getByText('Health score: '+score+' → '+score,{exact:false}).waitFor();assert.equal(await page.getByLabel('Fictional calibration case',{exact:true}).inputValue(),id);assert.equal(await page.locator('[data-rv53-results] [data-rv53-driver]').count(),12);assert.equal(await page.locator('[data-rv53-input-driver]').count(),24);checks+=3;
}
const before=await page.locator('[data-rv53-results]').innerText();
await page.getByLabel('Review Driver',{exact:true}).selectOption('functional_training');await page.getByLabel('Founder assessment',{exact:true}).selectOption('disagree');await page.getByLabel('Suggested adjustment (proposal only)',{exact:true}).fill('Fictional expected range proposal; keep pinned algorithm unchanged.');await page.getByLabel('Founder rationale (fictional evidence only)',{exact:true}).fill('Fictional case C has declared exact measurements; compare candidate trace before policy adoption.');await page.getByRole('button',{name:'Capture session review',exact:true}).click();
await page.getByText('Review captured in session memory only.',{exact:false}).waitFor();assert.equal(await page.locator('[data-review-list] article').count(),1);assert.equal(await page.locator('[data-rv53-results]').innerText(),before);checks+=2;
await page.getByRole('button',{name:'Person A',exact:false}).click();await page.getByText('Health score: 70.66 → 70.66',{exact:false}).waitFor();assert.equal(await page.locator('[data-review-list] article').count(),0);checks++;
assert.equal(await page.getByRole('button',{name:'Print / export held in this rehearsal'}).isDisabled(),true);await page.emulateMedia({media:'print'});assert.equal(await page.locator('body').isVisible(),false);await page.emulateMedia({media:'screen'});checks+=2;
assert.equal(await page.locator('.rv5-dialog').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);assert.equal(await page.locator('body').evaluate(e=>e.scrollWidth>document.documentElement.clientWidth+1),false);checks+=2;
assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);checks++;
if(engine==='chromium'||width===390){fs.mkdirSync(path.join(__dirname,'generated/screens'),{recursive:true});await page.locator('[data-rv53-results]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'generated/screens',engine+'-'+width+'.png')});if(width===1440){await page.locator('[data-fictional-feedback]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'generated/screens',engine+'-feedback.png')});}}
await page.getByRole('button',{name:'Close Scoring Lab',exact:true}).click();assert.equal(await page.locator('.rv5-dialog').count(),0);await page.getByRole('button',{name:'Founder Scoring Lab',exact:true}).click();await page.getByText('Comparison calculated.',{exact:false}).waitFor();assert.equal(await page.locator('[data-review-list] article').count(),0);checks+=2;
await page.getByRole('button',{name:'Close Scoring Lab',exact:true}).click();await page.getByRole('button',{name:'Simulate logout / clear workspace'}).click();assert.equal(await page.getByRole('button',{name:'Founder Scoring Lab',exact:true}).isVisible(),false);await page.getByRole('button',{name:'Simulate new fictional session'}).click();await page.getByRole('button',{name:'Founder Scoring Lab',exact:true}).waitFor();checks+=2;
await page.reload();assert.equal(await page.locator('.rv5-dialog').count(),0);checks++;
assert.deepEqual(errors,[]);assert(requests.every(r=>new URL(r).origin===new URL(url).origin&&['/','/demo.js','/lab.css'].includes(new URL(r).pathname)));checks+=2;
results.push({engine,width,checks,console_errors:0,external_requests:0,real_sources:0,feedback_memory_only:true,algorithm_unchanged:true,print_blocked:true,overflow:false});
}finally{await page.close();}}}finally{await browser.close();}}
const result={runs:results.length,checks:results.reduce((s,r)=>s+r.checks,0),results};fs.writeFileSync(path.join(__dirname,'generated/browser-validation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.message);process.exitCode=1});
