const {test}=require('node:test'),assert=require('node:assert/strict'),{createHandler,SITE,PROD,BETA,ORIGIN}=require('../netlify/lib/content-sync-service.cjs');
function harness({site=SITE,origin=ORIGIN,roleAllowed=true,rejectBeta=false,failAudit=false}={}){
 const calls=[],actor='11111111-1111-4111-8111-111111111111',job='22222222-2222-4222-8222-222222222222',batch={actor_id:actor,job_id:job,source_project:PROD,target_project:BETA,nodes:[{type:'food_catalog',source_id:actor}]};
 const handler=createHandler({env:n=>({SITE_ID:site,RVA_FOOD_DATABASE_SUPABASE_URL:`https://${site===SITE?PROD:BETA}.supabase.co`,RVA_FOOD_DATABASE_SUPABASE_ANON_KEY:'public-test',RVA_FOOD_DATABASE_SUPABASE_SERVICE_ROLE_KEY:'protected-prod-test',RVA_CONTENT_SYNC_BETA_SERVICE_ROLE_KEY:'protected-beta-test'}[n]),fetch:async(url,options)=>{
  const body=options.body?JSON.parse(options.body):null;calls.push({url,options,body});if(url.endsWith('/auth/v1/user'))return Response.json({id:actor});
  if(url.includes(PROD)){if(!roleAllowed)return Response.json({code:'42501'},{status:403});if(body.p_action==='export'||body.p_action==='resume')return Response.json(batch);if(body.p_action==='complete'&&failAudit)return Response.json({code:'xx'},{status:500});return Response.json({authorized:true});}
  if(rejectBeta)return Response.json({code:'42501'},{status:403});return Response.json([{type:'food_catalog',source_id:actor,target_id:job,version:'version'}]);
 }});
 const request=(body,method='POST',headers={})=>handler(new Request(ORIGIN+'/.netlify/functions/reusable-content-sync',{method,headers:{origin,Authorization:'Bearer verified-actor',...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})}));return{calls,request,actor,job};
}
const records=[{type:'food_catalog',id:'33333333-3333-4333-8333-333333333333'}];
test('one-way site/origin/method/auth gates reject before source or beta calls',async()=>{
 for(const [h,method,headers,status]of [[harness({site:'beta'}),'POST',{},403],[harness({origin:'https://beta.revitalizedacademy.com'}),'POST',{},403],[harness(),'GET',{},405],[harness(),'POST',{Authorization:''},401]]){assert.equal((await h.request({records},method,headers)).status,status);assert.equal(h.calls.length,0);}
});
test('verified actor and Owner/Admin permission authorize fixed dependency export/receive/audit only',async()=>{
 const h=harness(),response=await h.request({records}),result=await response.json();assert.equal(response.status,200);assert.equal(result.status,'complete');assert.equal(result.records,1);
 assert(h.calls.filter(c=>c.url.includes(PROD)&&c.body).every(c=>c.body.p_actor===h.actor));assert.equal(h.calls.filter(c=>c.url.includes(BETA)).length,1);assert.equal(h.calls.at(-1).body.p_action,'complete');assert(!JSON.stringify(result).includes('protected-'));assert.deepEqual(h.calls.find(c=>c.body?.p_action==='export').body.p_records,records);
});
test('unauthorized roles denied before export or beta write',async()=>{const h=harness({roleAllowed:false});assert.equal((await h.request({records})).status,403);assert.equal(h.calls.length,2);assert(!h.calls.some(c=>c.url.includes(BETA)));});
test('unsupported private tables, forged actor, arbitrary destination and large selection rejected',async()=>{
 for(const body of [{records:[{type:'contacts',id:records[0].id}]},{records,actor:'forged'},{records,target:'production'},{records:Array(21).fill(records[0])},{records:[{...records[0],email:'private@example.invalid'}]}]){const h=harness();assert.equal((await h.request(body)).status,400);assert(!h.calls.some(c=>c.body?.p_action==='export'||c.url.includes(BETA)));}
});
test('definite atomic beta rejection records failure without private provider details',async()=>{const h=harness({rejectBeta:true}),r=await h.request({records});assert.equal(r.status,403);assert.equal(h.calls.at(-1).body.p_action,'failed');assert(!JSON.stringify(await r.json()).includes('protected-'));});
test('audit uncertainty does not misreport committed beta sync and retries the exact immutable job',async()=>{
 const h=harness({failAudit:true}),response=await h.request({records});assert.equal(response.status,202);assert.equal((await response.json()).status,'audit_pending');assert(!h.calls.some(c=>c.body?.p_action==='failed'));
 const retry=harness();assert.equal((await retry.request({jobId:retry.job})).status,200);assert(retry.calls.some(c=>c.body?.p_action==='resume'));assert(!retry.calls.some(c=>c.body?.p_action==='export'));
});
test('browser module single/selected sync, acknowledged status, reset invalidation and beta label',async()=>{
 const {JSDOM}=require('jsdom'),fs=require('node:fs');const dom=new JSDOM('<div id="program-content-list"></div>',{url:ORIGIN,runScripts:'outside-only'}),w=dom.window;let requests=[],role='owner',resolve;
 w.RVA_PUBLIC_CONFIG={environment:'production',projectRef:PROD};w.RA_PORTAL={currentStaffRole:()=>role,hasPermission:()=>true,authClient:{auth:{getSession:async()=>({data:{session:{access_token:'local-only'}}})}}};w.RA_PROGRAM_CONTENT={render:()=>{}};
 w.fetch=async(url,o)=>{requests.push(JSON.parse(o.body));return{ok:true,json:async()=>({status:'complete',records:3,message:'Synced to Beta.'})};};w.eval(fs.readFileSync('portal/portal-content-sync.js','utf8'));const api=w.RA_CONTENT_SYNC;api.tools();const copy=w.document.createElement('div'),actions=w.document.createElement('div');w.document.body.append(copy,actions);api.decorate('foods',{id:records[0].id,name:'QA Food'},copy,actions);
 actions.querySelector('input').click();assert(w.document.getElementById('content-sync-selected').textContent.includes('(1)'));w.document.getElementById('content-sync-selected').click();[...w.document.querySelectorAll('.food-database-dialog button')].find(b=>b.textContent==='Confirm Sync to Beta').click();await new Promise(r=>setTimeout(r,20));assert.deepEqual(requests[0],{records});assert(w.document.querySelector('.food-database-dialog').textContent.includes('No clients, health data'));assert.equal(w.document.getElementById('content-sync-selected').disabled,true);
 [...w.document.querySelectorAll('.food-database-dialog button')].find(b=>b.textContent==='Close').click();actions.querySelector('button').click();w.fetch=()=>new Promise(r=>{resolve=r});[...w.document.querySelectorAll('.food-database-dialog button')].find(b=>b.textContent==='Confirm Sync to Beta').click();await new Promise(r=>setTimeout(r,10));w.document.dispatchEvent(new w.CustomEvent('ra:staff-access-reset'));resolve({ok:true,json:async()=>({status:'complete',records:1,message:'late'})});await new Promise(r=>setTimeout(r,10));assert.equal(w.document.querySelectorAll('.food-database-modal').length,0);
 role='coach';api.tools();actions.replaceChildren();api.decorate('foods',{id:records[0].id,name:'QA Food'},copy,actions);assert.equal(actions.children.length,0);dom.window.close();
 const b=new JSDOM('<div id="program-content-list"></div>',{url:'https://beta.revitalizedacademy.com',runScripts:'outside-only'}),v=b.window;v.RVA_PUBLIC_CONFIG={environment:'staging',projectRef:BETA};v.RA_PORTAL={currentStaffRole:()=> 'owner',hasPermission:()=>true,authClient:{from:()=>({select:async()=>({data:[{content_type:'food_catalog',target_id:records[0].id,synced_at:'2026-10-07T00:00:00Z'}]})})}};v.RA_PROGRAM_CONTENT={render:()=>{}};v.eval(fs.readFileSync('portal/portal-content-sync.js','utf8'));await new Promise(r=>setTimeout(r,10));const label=v.document.createElement('div'),buttons=v.document.createElement('div');v.RA_CONTENT_SYNC.decorate('foods',{id:records[0].id},label,buttons);assert(label.textContent.includes('Synced from Production'));assert.equal(buttons.children.length,0);b.window.close();
});

test('sync module is included in the public allowlist and deferred portal load',()=>{
 const fs=require('node:fs');const manifest=fs.existsSync('config/production-public-files.json')?'config/production-public-files.json':'config/public-files.json';
 assert(JSON.parse(fs.readFileSync(manifest,'utf8')).includes('portal/portal-content-sync.js'));
 assert.match(fs.readFileSync('portal/index.html','utf8'),/<script defer src="portal-content-sync\.js\?v=100"><\/script>/);
});
