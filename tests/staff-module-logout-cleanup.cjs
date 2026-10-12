const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

const root=process.env.RVA_BETA_ASSET_ROOT||'.';

test('delayed Work Desk load cannot touch a removed private shell after sign-out',async t=>{
  const dom=new JSDOM(fs.readFileSync(root+'/portal/index.html','utf8'),{runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w=dom.window;
  let resolveRows;
  const client={
    from:()=>({
      select(){return this;},
      order(){return this;},
      limit(){return new Promise(resolve=>{resolveRows=resolve;});}
    })
  };
  w.RA_PORTAL={
    authClient:client,
    currentUserId:()=> 'owner-a',
    formatDate:value=>value,
    titleCase:value=>value,
    openContact(){},
    logActivity:async()=>{},
    loadDashboard:async()=>{}
  };
  const errors=[];
  w.addEventListener('error',event=>errors.push(event.error||event.message));
  w.eval(fs.readFileSync(root+'/portal/portal-work-desk.js','utf8'));
  w.document.dispatchEvent(new w.Event('ra:dashboard-loaded'));
  assert.equal(typeof resolveRows,'function');
  w.document.getElementById('portal-view').remove();
  w.document.dispatchEvent(new w.Event('ra:staff-access-reset'));
  resolveRows({data:[{task_id:'private-task',title:'PRIVATE WORK'}],error:null});
  await new Promise(setImmediate);
  assert.deepEqual(errors,[]);
  assert(!w.document.body.textContent.includes('PRIVATE WORK'));
});
