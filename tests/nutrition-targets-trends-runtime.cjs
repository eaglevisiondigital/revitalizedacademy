// Normal-flow reproductions from the held candidate validation, plus mutation races.
// RVA_REVIEW_ASSET_ROOT allows the same checks against the exact deployment output.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {JSDOM}=require('jsdom');
const repo=path.resolve(__dirname,'..'),root=process.env.RVA_REVIEW_ASSET_ROOT||repo;
const html=fs.readFileSync(root+'/portal/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const script=fs.readFileSync(root+'/portal/portal-nutrition-review.js','utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const privateIds=['review-summary','review-items','targets','target-access','trends-summary','trends'];
const target=(i=0)=>({nutrient_key:'fixture_'+i,name:'PRIVATE TARGET '+i,unit:'g',source:'coach',minimum:null,target:i,maximum:null,default_visible:false});
function payload(name,tag='CURRENT',args={}){
 if(name.endsWith('_day'))return {totals:{energy_kcal:0},items:[{meal_slot:'breakfast',label:tag+' PRIVATE FOOD',nutrients:{protein_g:0}}]};
 if(name.endsWith('_targets'))return [{...target(),name:tag+' PRIVATE TARGET'}];
 return {days:args.p_days,logged_days:1,averages:{energy_kcal:0},series:[{date:args.p_end_date,totals:{energy_kcal:0,protein_g:0}}]};
}
function harness(t){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost/portal/'}),w=dom.window,d=w.document,calls=[];
 const rights=new Set(['health.private.view','plan.override']);
 const el=id=>d.getElementById('client-nutrition-'+id);
 const event=(name,detail)=>d.dispatchEvent(new w.CustomEvent('ra:'+name,{detail}));
 w.RA_PORTAL={hasPermission:k=>rights.has(k),formatDate(){throw Error('Timestamp formatter must not receive SQL dates');},showStatus(n,m){n.textContent=m;},authClient:{rpc(name,args){return new Promise((resolve,reject)=>calls.push({name,args,resolve,reject}));},from(){throw Error('Direct table access forbidden');}}};
 w.eval(script);t.after(()=>w.close());
 const h={w,d,el,event,calls,rights,
 open(id='a'){event('contact-opened',{contactId:id});el('review-toggle').click();},
 toggle(){el('review-toggle').click();},
 date(value){el('date').value=value;el('date').dispatchEvent(new w.Event('change'));},
 range(days){d.querySelector('[data-nutrition-days="'+days+'"]').click();},
 finish(start=0,tag='CURRENT',overrides={}){for(const c of calls.slice(start,start+3))c.resolve({data:c.name in overrides?overrides[c.name]:payload(c.name,tag,c.args)});},
 blank(){for(const id of privateIds)assert.equal(el(id).textContent,'',id+' must be cleared');},
 text(){return privateIds.map(id=>el(id).textContent).join('|');},
 button(clear=false){return el('targets').querySelectorAll('button')[clear?1:0];}
 };return h;
}
async function ready(t){const h=harness(t);h.open();h.finish();await tick();return h;}
function transition(h,kind){
 if(kind==='client')h.open('b');
 if(kind==='client-cycle'){h.open('b');h.open('a');}
 if(kind==='date')h.date('2026-10-03');
 if(kind==='date-cycle'){const original=h.el('date').value;h.date('2026-09-01');h.date(original);}
 if(kind==='range')h.range(30);
 if(kind==='range-cycle'){h.range(30);h.range(7);}
 if(kind==='close')h.toggle();
 if(kind==='close-reopen'){h.toggle();h.toggle();}
 if(kind==='contact-close')h.event('contact-closed');
 if(kind==='permission-refresh')h.event('permissions-refresh');
 if(kind==='permission-cycle'){h.event('permissions-refresh');h.event('permissions-loaded');h.toggle();}
 if(kind==='authorization-loss'){h.rights.clear();h.event('permissions-loaded');}
}
test('normal open loads day, effective targets and selected trend together without premature empty claims',async t=>{
 const h=harness(t);h.open();assert.deepEqual(h.calls.map(c=>c.name),['admin_get_client_nutrition_day','admin_get_client_nutrition_targets','admin_get_client_nutrition_trends']);
 assert.equal(h.calls[2].args.p_days,7);assert.equal(h.calls[2].args.p_end_date,h.el('date').value);h.blank();
 for(let i=0;i<2;i++){const c=h.calls[i];c.resolve({data:payload(c.name,'CURRENT',c.args)});await tick();h.blank();}
 h.calls[2].resolve({data:payload(h.calls[2].name,'CURRENT',h.calls[2].args)});await tick();assert.match(h.text(),/CURRENT PRIVATE TARGET/);assert.equal(h.el('review-panel').getAttribute('aria-busy'),'false');
});
test('successful empty responses alone establish neutral empty states',async t=>{const h=harness(t);h.open();h.finish(0,'',{'admin_get_client_nutrition_day':{items:[],totals:{}},'admin_get_client_nutrition_targets':[],'admin_get_client_nutrition_trends':{logged_days:0,series:[],averages:{}}});await tick();assert.match(h.el('targets').textContent,/No nutrition targets/);assert.match(h.el('trends').textContent,/No logged nutrition/);assert.match(h.el('trends-summary').textContent,/Logged Days0/);assert.equal(h.el('review-summary').querySelector('strong').textContent,'—');});
test('30-day selection persists through close/reopen and date changes refresh its end date',async t=>{const h=await ready(t);h.range(30);assert.equal(h.calls.at(-1).args.p_days,30);h.finish(3);await tick();h.toggle();h.toggle();assert.equal(h.calls.at(-1).args.p_days,30);h.finish(6);await tick();h.date('2026-10-03');h.blank();assert.equal(h.calls.at(-1).args.p_end_date,'2026-10-03');assert.equal(h.calls.at(-1).args.p_days,30);h.finish(9);await tick();assert.match(h.el('trends').textContent,/Oct 3, 2026/);});
for(const kind of ['client','client-cycle','date','date-cycle','range','range-cycle','close','close-reopen','contact-close','permission-refresh','permission-cycle','authorization-loss']){
 test('immediate complete private clearing on '+kind,async t=>{const h=await ready(t);transition(h,kind);h.blank();assert.doesNotMatch(h.el('review-status').textContent,/ready|saved|restored/);});
 test('late read success cannot render across '+kind,async t=>{const h=harness(t);h.open();transition(h,kind);const newer=h.calls.length>3;if(newer){h.finish(h.calls.length-3,'NEW');await tick();}h.finish(0,'STALE');await tick();assert.doesNotMatch(h.text(),/STALE/);if(newer)assert.match(h.text(),/NEW/);else h.blank();});
}
for(const index of [0,1,2])for(const failure of ['denial','transport','incomplete']){
 test(['day','targets','trends'][index]+' '+failure+' fails closed and never claims an empty successful review',async t=>{const h=await ready(t);h.date('2026-10-03');const c=h.calls[3+index];if(failure==='transport')c.reject(Error('NETWORK'));else c.resolve(failure==='denial'?{error:{message:'DENIED'}}:{data:null});h.finish(3);await tick();h.blank();assert.match(h.el('review-status').textContent,/DENIED|NETWORK|incomplete/);assert.equal(h.el('review-panel').getAttribute('aria-busy'),'false');});
 test('stale '+['day','targets','trends'][index]+' '+failure+' cannot clear newer success',async t=>{const h=harness(t);h.open();h.date('2026-10-03');h.finish(3,'NEW');await tick();const c=h.calls[index];if(failure==='transport')c.reject(Error('OLD NETWORK'));else c.resolve(failure==='denial'?{error:{message:'OLD DENIED'}}:{data:null});h.finish(0,'OLD');await tick();assert.match(h.text(),/NEW/);assert.doesNotMatch(h.el('review-status').textContent,/OLD/);});
}
test('rendered Client A cannot survive a denied Client B',async t=>{const h=await ready(t);h.open('b');h.blank();h.calls[4].resolve({error:{message:'B DENIED'}});h.finish(3,'B');await tick();h.blank();assert.match(h.el('review-status').textContent,/B DENIED/);});
test('synchronous transport throws are handled and all already-started rejections are observed',async t=>{const h=harness(t);let calls=0;h.w.RA_PORTAL.authClient.rpc=()=>{if(++calls===2)throw Error('SYNC TRANSPORT');return Promise.reject(Error('ASYNC TRANSPORT'));};h.open();await tick();h.blank();assert.match(h.el('review-status').textContent,/TRANSPORT/);assert.equal(calls,3);});
test('read-only reviewers can inspect every one of 101 configured targets; unconfigured hidden catalog rows stay hidden',async t=>{const h=harness(t);h.rights.delete('plan.override');h.open();h.finish(0,'CURRENT',{'admin_get_client_nutrition_targets':[...Array.from({length:101},(_,i)=>target(i)),{nutrient_key:'hidden',name:'UNCONFIGURED',default_visible:false}]});await tick();assert.equal(h.el('targets').children.length,101);assert.match(h.el('targets').textContent,/PRIVATE TARGET 100/);assert.doesNotMatch(h.el('targets').textContent,/UNCONFIGURED/);assert.ok([...h.el('targets').querySelectorAll('input,button')].every(n=>n.disabled));assert.equal(h.el('target-access').textContent,'Read Only');});
test('configured null override remains reviewable and clearable, without fabricating zero',async t=>{const h=harness(t);h.open();h.finish(0,'CURRENT',{'admin_get_client_nutrition_targets':[{...target(),minimum:null,target:null,maximum:null}]});await tick();assert.equal(h.el('targets').children.length,1);assert.ok([...h.el('targets').querySelectorAll('input')].every(n=>n.value===''));assert.equal(h.button(true).disabled,false);});
test('finite zero is retained while null, strings and malformed numeric values remain unknown',async t=>{const h=harness(t);h.open();h.finish(0,'CURRENT',{'admin_get_client_nutrition_targets':[{...target(),minimum:0,target:null,maximum:'12'}],'admin_get_client_nutrition_trends':{logged_days:0,averages:{energy_kcal:0,protein_g:null,fiber_g:'12'},series:[{date:'2026-10-03',totals:{energy_kcal:0,protein_g:null,fiber_g:'12'}},{date:'2026-10-02',totals:{energy_kcal:NaN,protein_g:Infinity,fiber_g:false}}]}});await tick();assert.deepEqual([...h.el('targets').querySelectorAll('input')].map(n=>n.value),['0','','']);assert.match(h.el('trends-summary').textContent,/Calories0 kcalProtein—Fiber—/);assert.match(h.el('trends').textContent,/0 kcal/);assert.doesNotMatch(h.el('trends').textContent,/0g protein|12g fiber|NaN|Infinity/);assert.match(h.el('trends').textContent,/No numeric totals/);});
for(const clear of [false,true]){
 const label=clear?'clear':'save';
 test(label+' uses captured contact, gates editing and reloads all three reads on success',async t=>{const h=await ready(t);if(!clear){const inputs=h.el('targets').querySelectorAll('input');inputs[0].value='0';inputs[1].value='';inputs[2].value='25.5';}h.button(clear).click();const c=h.calls[3];assert.equal(c.name,clear?'admin_clear_client_nutrient_target':'admin_set_client_nutrient_target');assert.equal(c.args.p_contact_id,'a');if(!clear)assert.deepEqual(JSON.parse(JSON.stringify(c.args)),{p_contact_id:'a',p_nutrient_key:'fixture_0',p_minimum:0,p_target:null,p_maximum:25.5});assert.ok([...h.el('targets').querySelectorAll('input,button')].every(n=>n.disabled));h.button(clear).click();assert.equal(h.calls.length,4);c.resolve({data:true});await tick();assert.equal(h.calls.length,7);h.blank();h.finish(4,'RELOADED');await tick();assert.match(h.text(),/RELOADED/);assert.match(h.el('review-status').textContent,clear?/restored/:/saved/);});
 for(const failure of ['error','throw'])test(label+' '+failure+' clears private UI, is handled and can recover on normal reopen',async t=>{const h=await ready(t);h.button(clear).click();if(failure==='throw')h.calls[3].reject(Error('MUTATION NETWORK'));else h.calls[3].resolve({error:{message:'MUTATION DENIED'}});await tick();h.blank();assert.match(h.el('review-status').textContent,/MUTATION/);h.toggle();h.toggle();h.finish(4,'RECOVERED');await tick();assert.match(h.text(),/RECOVERED/);});
 for(const kind of ['client','client-cycle','date-cycle','range-cycle','close','permission-cycle','authorization-loss'])for(const result of ['success','error','throw']){
  test('late '+label+' '+result+' cannot reload or alter '+kind,async t=>{const h=await ready(t);h.button(clear).click();const old=h.calls[3];transition(h,kind);const count=h.calls.length,newer=count>4;if(newer){h.finish(count-3,'NEW');await tick();}const before=h.text(),status=h.el('review-status').textContent;if(result==='success')old.resolve({data:true});else if(result==='error')old.resolve({error:{message:'OLD MUTATION'}});else old.reject(Error('OLD NETWORK'));await tick();assert.equal(h.calls.length,count,'stale completion must not reload');assert.equal(h.text(),before);assert.equal(h.el('review-status').textContent,status);});
 }
 test(label+' permission is rechecked before dispatch and after completion',async t=>{const h=await ready(t);const button=h.button(clear);h.rights.delete('plan.override');button.click();assert.equal(h.calls.length,3);h.blank();h.rights.add('plan.override');h.toggle();h.toggle();h.finish(3);await tick();h.button(clear).click();h.rights.delete('plan.override');h.calls[6].resolve({data:true});await tick();assert.equal(h.calls.length,7);h.blank();});
}
test('negative target input is rejected before any mutation',async t=>{const h=await ready(t);h.el('targets').querySelector('input').value='-1';h.button().click();assert.equal(h.calls.length,3);assert.match(h.el('review-status').textContent,/non-negative/);});
test('date-only trend labels retain exact SQL day in Chicago, DST and positive-offset zones',()=>{
 for(const tz of ['America/Chicago','Pacific/Kiritimati']){
 const child=spawnSync(process.execPath,['-e',`
 const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
 const w=new JSDOM(fs.readFileSync(process.env.REVIEW_ROOT+'/portal/index.html','utf8'),{runScripts:'outside-only'}).window;
 w.RA_PORTAL={hasPermission:k=>k==='health.private.view',formatDate(){throw Error('Timestamp formatter forbidden');},showStatus(n,m){n.textContent=m;},authClient:{rpc:async n=>({data:n.endsWith('_day')?{items:[],totals:{}}:n.endsWith('_targets')?[]:{series:['2026-10-03','2026-11-01','2026-03-08','2026-02-31'].map(date=>({date,totals:{energy_kcal:0}})),averages:{},logged_days:3}})}};
 w.eval(fs.readFileSync(process.env.REVIEW_ROOT+'/portal/portal-nutrition-review.js','utf8'));w.document.dispatchEvent(new w.CustomEvent('ra:contact-opened',{detail:{contactId:'fixture'}}));w.document.getElementById('client-nutrition-review-toggle').click();
 setImmediate(()=>{assert.deepEqual([...w.document.querySelectorAll('.client-nutrition-trend-row > span')].map(n=>n.textContent),['Oct 3, 2026','Nov 1, 2026','Mar 8, 2026','Date unavailable']);w.close();});
 `],{cwd:repo,env:{...process.env,TZ:tz,REVIEW_ROOT:root},encoding:'utf8'});assert.equal(child.status,0,child.stderr||tz);
 }
});
