// Isolated fictional browser acceptance for Founder Pilot Verification UI.
// Never uses production auth, client records or Supabase and never navigates away from localhost.
'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const playwright=require(process.env.RVA_PLAYWRIGHT_PATH || 'playwright');
const origin='http://127.0.0.1:48842';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const localTime=ms=>{const d=new Date(ms);return new Date(ms-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
(async()=>{
 const server=spawn(process.execPath,['scripts/preview-roadmap-b42.cjs'],{stdio:['ignore','pipe','pipe']});
 let log='';server.stdout.on('data',v=>log+=v.toString());server.stderr.on('data',v=>log+=v.toString());
 let total=0,run=[];
 try {
  for(let i=0;i<100&&!log.includes('Synthetic-only B4.2 preview');i++){if(server.exitCode!==null)throw Error('Preview server stopped: '+log);await sleep(75);}
  assert.match(log,/Synthetic-only B4\.2 preview/);
  for(const engine of ['chromium','webkit']){
   const browser=await playwright[engine].launch({headless:true});
   try{
    for(const [width,height] of [[1440,1000],[768,1024],[390,844]]){
     const page=await browser.newPage({viewport:{width,height}}),errors=[];
     page.on('pageerror',err=>errors.push(err.message));
     page.on('console',msg=>{if(['error','warning'].includes(msg.type()))errors.push(msg.text());});
     page.on('request',req=>{if(new URL(req.url()).origin!==origin)errors.push('Unexpected external request');});
     try{
      await page.goto(origin+'/');
      const launch=page.getByRole('button',{name:'Founder Pilot Verification'});
      await launch.click();
      const modal=page.getByRole('dialog',{name:'Founder Pilot Verification'});
      await modal.waitFor();
      await page.getByText(/No verification requests yet/).waitFor();
      await page.getByLabel('Exact full name or email').fill('Robin Vale');
      await page.getByRole('button',{name:'Find existing records'}).click();
      await page.getByText('Compare every candidate. Nothing is selected automatically.').waitFor();
      const cards=page.locator('.rv42-card');
      assert.equal(await cards.count(),2);
      assert.equal(await page.getByText('IDENTITY NOT VERIFIED · No founder decision recorded',{exact:true}).count(),2);
      assert.equal(await page.getByText('No assessment report on this contact',{exact:true}).count(),1);
      assert.equal(await page.getByText('Detailed Adult/Myself source',{exact:true}).count(),1);
      assert.equal(await page.locator('.rv42-verification-state.is-confirmed').count(),0);
      assert.equal(await page.locator('.rv42-attestation').count(),0);
      await page.getByRole('button',{name:'View recorded verification status'}).click();
      assert.equal(await page.locator('.rv42-status').evaluate(n=>document.activeElement===n),true);
      const eligible=cards.filter({has:page.getByText('Detailed Adult/Myself source',{exact:true})});
      await eligible.getByRole('button',{name:'Verify Pilot Assessment'}).click();
      await page.getByLabel('Your decision',{exact:true}).selectOption('confirmed');
      const times=await page.evaluate(()=>{
        const local=ms=>{const d=new Date(ms);return new Date(ms-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
        return {start:local(Date.now()+3600000),end:local(Date.now()+86400000)};
      });
      await page.getByLabel('Proposed start (your local time)').fill(times.start);
      await page.getByLabel('Revoke by (your local time, within 14 days)').fill(times.end);
      assert.equal(await page.locator('.rv42-ack input[type=checkbox]').count(),7);
      for(const cb of await page.locator('.rv42-ack input[type=checkbox]').all())await cb.check();
      await page.getByRole('button',{name:'Record verification & SOP acknowledgment'}).click();
      await page.getByText('Verification and SOP recorded. Nobody was enrolled. Operator authorization remains required.').waitFor();
      assert.equal(await eligible.getByText('IDENTITY VERIFIED · Founder confirmation recorded; operator authorization pending').count(),1);
      assert.equal(await page.locator('.rv42-verification-state.is-confirmed').count(),1);
      await page.getByText('Confirmed · Operator authorization still required',{exact:true}).waitFor();
      assert.equal(await page.locator('.rv42-dialog').evaluate(n=>n.scrollWidth<=n.clientWidth),true);
      assert.equal(await page.locator('.rv42-surface').evaluate(n=>n.scrollWidth<=n.clientWidth),true);
      assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
      assert.deepEqual(errors,[]);
      total++;run.push({engine,width,height,passed:true});
     }finally{await page.close();}
    }
   }finally{await browser.close();}
  }
  console.log(JSON.stringify({syntheticBrowserRuns:total,runs:run,noRealData:true,noProductionWrites:true}));
 }finally{server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
