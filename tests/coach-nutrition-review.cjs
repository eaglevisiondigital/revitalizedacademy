const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const repo=path.resolve(__dirname,'..');
const root=process.env.RVA_REVIEW_ASSET_ROOT||repo;
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(root+'/portal/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const script=fs.readFileSync(root+'/portal/portal-nutrition-review.js','utf8');
const turn=()=>new Promise(resolve=>setImmediate(resolve));
test('review asset and accessible independent private-health section are published',()=>{
 const d=new JSDOM(html).window.document;
 assert.ok(JSON.parse(fs.readFileSync(repo+'/config/public-files.json')).includes('portal/portal-nutrition-review.js'));
 assert.match(fs.readFileSync(root+'/portal/index.html','utf8'),/portal-nutrition-review\.js\?v=101/);
 assert.ok(d.getElementById('client-nutrition-review-section'));
 assert.equal(d.getElementById('client-wellness-section').contains(d.getElementById('client-nutrition-review-panel')),false);
 assert.ok(d.getElementById('client-nutrition-date').getAttribute('aria-label'));
});
test('private reads use only the secure RPC and have no mutation path',()=>{
 assert.doesNotMatch(script,/\.from\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/);
 assert.deepEqual([...script.matchAll(/\.rpc\("([^"]+)"/g)].map(m=>m[1]),['admin_get_client_nutrition_day']);
});
test('long-text styles wrap rather than truncate review content',()=>{
 const css=fs.readFileSync(root+'/portal/portal-wellness.css','utf8');
 assert.match(css,/\.client-nutrition-review-row[^}]*min-width:\s*0/s);
 assert.match(css,/overflow-wrap:\s*anywhere/);
 assert.match(css,/word-break:\s*break-word/);
 assert.doesNotMatch(css,/\.client-nutrition-review-row[^}]*text-overflow:\s*ellipsis/s);
});
function harness(){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://127.0.0.1/portal/'}),w=dom.window,d=w.document,calls=[];
 w.RA_PORTAL={hasPermission:key=>key==='health.private.view',authClient:{rpc(name,args){return new Promise(resolve=>calls.push({name,args,resolve}));},from(){throw Error('Direct table access forbidden');}},showStatus(n,m){n.textContent=m;}};
 w.eval(script);
 const el=id=>d.getElementById('client-nutrition-'+id);
 return {dom,w,d,calls,el,open(id='client-a'){d.dispatchEvent(new w.CustomEvent('ra:contact-opened',{detail:{contactId:id}}));},toggle(){el('review-toggle').click();},change(value){el('date').value=value;el('date').dispatchEvent(new w.Event('change'));},resolve(i,totals={},items=[]){calls[i].resolve({data:{totals,items},error:null});},summary(){return el('review-summary').textContent;}};
}
test('only scoped RPC is used and core summary preserves zero and missing values',async()=>{const h=harness();h.open();h.toggle();assert.equal(h.calls[0].name,'admin_get_client_nutrition_day');assert.equal(h.calls[0].args.p_contact_id,'client-a');h.resolve(0,{energy_kcal:0,protein_g:12,carbohydrate_g:null});await turn();assert.equal(h.el('review-summary').children.length,6);assert.match(h.summary(),/0 kcal/);assert.match(h.summary(),/Carbohydrates—/);h.dom.window.close();});
test('all seven meal groups and text-only metadata render safely',async()=>{const h=harness();h.open();h.toggle();h.resolve(0,{},['breakfast','lunch','dinner','snack','supplement','water','other'].map(meal_slot=>({meal_slot,label:'<img src=x onerror=alert(1)>',brand:'Fixture brand',quantity:1.5,serving_quantity:100,serving_unit:'g',nutrients:{energy_kcal:100,protein_g:3},source:'member',note:'<script>bad()</script>'})));await turn();assert.equal(h.d.querySelectorAll('.client-nutrition-review-group').length,7);assert.equal(h.el('review-items').querySelectorAll('img,script').length,0);assert.match(h.el('review-items').textContent,/Fixture brand/);assert.match(h.el('review-items').textContent,/1.5 servings/);assert.match(h.el('review-items').textContent,/100 kcal/);h.dom.window.close();});
test('empty review has neutral cards and explicit empty message',async()=>{const h=harness();h.open();h.toggle();h.resolve(0);await turn();assert.equal(h.el('review-summary').querySelectorAll('strong').length,6);assert.ok([...h.el('review-summary').querySelectorAll('strong')].every(n=>n.textContent==='—'));assert.match(h.el('review-items').textContent,/No nutrition items/);h.dom.window.close();});
test('sequential previous next picker and Today send selected dates',async()=>{const h=harness();h.open();h.toggle();const today=h.calls[0].args.p_log_date;h.resolve(0);await turn();h.change('2026-09-30');assert.equal(h.calls[1].args.p_log_date,'2026-09-30');h.resolve(1);await turn();h.el('next').click();assert.equal(h.calls[2].args.p_log_date,'2026-10-01');h.resolve(2);await turn();h.el('prev').click();assert.equal(h.calls[3].args.p_log_date,'2026-09-30');h.resolve(3);await turn();h.el('today').click();assert.equal(h.calls[4].args.p_log_date,today);h.resolve(4);await turn();h.dom.window.close();});
test('a denied RPC clears results and displays its error',async()=>{const h=harness();h.open();h.toggle();h.calls[0].resolve({data:null,error:{message:'Not authorized to view client nutrition'}});await turn();assert.match(h.el('review-status').textContent,/Not authorized/);assert.doesNotMatch(h.summary(),/kcal/);h.dom.window.close();});
test('older date response cannot replace the current selected-day review',async()=>{const h=harness();try{h.open();h.toggle();h.change('2026-10-01');h.resolve(1,{energy_kcal:222});await turn();h.resolve(0,{energy_kcal:111});await turn();assert.equal(h.el('date').value,'2026-10-01');assert.match(h.summary(),/222 kcal/,'older response must not replace selected-day totals');}finally{h.dom.window.close();}});
test('old client response cannot overwrite a different denied client review',async()=>{const h=harness();try{h.open('client-a');h.toggle();h.open('client-b');h.toggle();h.calls[1].resolve({data:null,error:{message:'Not authorized to view client nutrition'}});await turn();h.resolve(0,{energy_kcal:111},[{meal_slot:'breakfast',label:'CLIENT A PRIVATE FIXTURE',quantity:1,source:'member'}]);await turn();assert.doesNotMatch(h.el('review-items').textContent,/CLIENT A PRIVATE FIXTURE/,'client A data must not render in client B review');assert.match(h.el('review-status').textContent,/Not authorized/);}finally{h.dom.window.close();}});
test('opening a new client clears previous private review while loading',async()=>{const h=harness();try{h.open('client-a');h.toggle();h.resolve(0,{energy_kcal:111},[{meal_slot:'breakfast',label:'CLIENT A PRIVATE FIXTURE',quantity:1}]);await turn();h.open('client-b');h.toggle();assert.doesNotMatch(h.el('review-items').textContent,/CLIENT A PRIVATE FIXTURE/);}finally{h.dom.window.close();}});
test('null item nutrients are omitted rather than presented as numeric zero',async()=>{const h=harness();try{h.open();h.toggle();h.resolve(0,{},[{meal_slot:'breakfast',label:'Unknown profile',quantity:1,nutrients:{energy_kcal:null,protein_g:null}}]);await turn();assert.doesNotMatch(h.el('review-items').textContent,/0 kcal|0g protein/);}finally{h.dom.window.close();}});
test('Today follows the local calendar date near UTC midnight',async()=>{const dom=new JSDOM(html,{runScripts:'outside-only'});try{const w=dom.window,RealDate=w.Date;w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:['2026-10-04T01:00:00Z']));}getFullYear(){return 2026;}getMonth(){return 9;}getDate(){return 3;}static now(){return new RealDate('2026-10-04T01:00:00Z').valueOf();}};let requested;w.RA_PORTAL={hasPermission:key=>key==='health.private.view',authClient:{rpc(name,args){requested=args;return Promise.resolve({data:{totals:{},items:[]},error:null});}},showStatus(n,m){n.textContent=m;}};w.eval(script);w.document.dispatchEvent(new w.CustomEvent('ra:contact-opened',{detail:{contactId:'fixture'}}));w.document.getElementById('client-nutrition-review-toggle').click();await turn();assert.equal(requested.p_log_date,'2026-10-03','America/Chicago is still October 3 at this instant');}finally{dom.window.close();}});
test('blank, nonnumeric, boolean, array, infinite and numeric-string nutrients stay unknown',async()=>{
 for(const value of ['', ' ', 'no value','123',false,[],{},Infinity,NaN]){
  const h=harness();try{h.open();h.toggle();h.resolve(0,{energy_kcal:value},[{meal_slot:'breakfast',label:'Unknown',nutrients:{energy_kcal:value,protein_g:value}}]);await turn();assert.equal(h.el('review-summary').querySelector('strong').textContent,'—');assert.doesNotMatch(h.el('review-items').textContent,/kcal|protein/);}finally{h.dom.window.close();}
 }
});
test('genuine zero nutrient metadata remains visible',async()=>{const h=harness();try{h.open();h.toggle();h.resolve(0,{},[{meal_slot:'breakfast',label:'Known zero',nutrients:{energy_kcal:0,protein_g:0}}]);await turn();assert.match(h.el('review-items').textContent,/0 kcal.*0g protein/);}finally{h.dom.window.close();}});
test('panel close and contact close invalidate pending responses and clear private DOM',async()=>{
 for(const contactClose of [false,true]){const h=harness();try{h.open();h.toggle();if(contactClose)h.d.dispatchEvent(new h.w.CustomEvent('ra:contact-closed'));else h.toggle();h.resolve(0,{energy_kcal:111},[{meal_slot:'breakfast',label:'PRIVATE OLD'}]);await turn();assert.equal(h.el('review-items').textContent,'');assert.equal(h.el('review-summary').textContent,'');assert.equal(h.el('review-status').textContent,'');assert.ok(h.el('review-panel').classList.contains('hidden'));}finally{h.dom.window.close();}}
});
test('stale errors cannot clear a newer successful review',async()=>{const h=harness();try{h.open();h.toggle();h.change('2026-10-01');h.resolve(1,{energy_kcal:222});await turn();h.calls[0].resolve({data:null,error:{message:'old error'}});await turn();assert.match(h.summary(),/222 kcal/);assert.doesNotMatch(h.el('review-status').textContent,/old error/);}finally{h.dom.window.close();}});
test('private-health access is independent; management-only and override-only cannot request review',async()=>{
 for(const permission of ['health.private.view','health.progress.manage','plan.override']){const h=harness();try{h.w.RA_PORTAL.hasPermission=k=>k===permission;h.open();h.toggle();const allowed=permission==='health.private.view';assert.equal(h.calls.length,allowed?1:0);assert.equal(h.d.getElementById('client-nutrition-review-section').classList.contains('hidden'),!allowed);if(allowed){h.resolve(0);await turn();}}finally{h.dom.window.close();}}
});
test('permission refresh clears private data and late replies cannot restore it',async()=>{const h=harness();try{h.open();h.toggle();h.d.dispatchEvent(new h.w.CustomEvent('ra:permissions-refresh'));h.w.RA_PORTAL.hasPermission=()=>false;h.d.dispatchEvent(new h.w.CustomEvent('ra:permissions-loaded'));h.resolve(0,{energy_kcal:111});await turn();assert.equal(h.summary(),'');assert.ok(h.el('review-panel').classList.contains('hidden'));}finally{h.dom.window.close();}});
test('thrown transport failure clears data and remains a handled error',async()=>{const h=harness();try{h.w.RA_PORTAL.authClient.rpc=async()=>{throw Error('Synthetic network failure');};h.open();h.toggle();await turn();assert.equal(h.summary(),'');assert.match(h.el('review-status').textContent,/Synthetic network failure/);}finally{h.dom.window.close();}});
test('rendered Client A is cleared before denied Client B, with no fabricated empty totals',async()=>{
 const h=harness();try{h.open('client-a');h.toggle();h.resolve(0,{energy_kcal:111},[{meal_slot:'breakfast',label:'PRIVATE CLIENT A'}]);await turn();h.open('client-b');assert.equal(h.summary(),'');assert.equal(h.el('review-items').textContent,'');assert.ok(h.el('review-panel').classList.contains('hidden'));h.toggle();h.calls[1].resolve({data:null,error:{message:'Not authorized'}});await turn();assert.equal(h.summary(),'');assert.equal(h.el('review-items').textContent,'');assert.match(h.el('review-status').textContent,/Not authorized/);}finally{h.dom.window.close();}
});
test('local calendar controls handle both sides of UTC midnight and DST in real timezones',()=>{
 const {spawnSync}=require('node:child_process');
 for(const [tz,instant,today] of [['America/Chicago','2026-10-04T01:00:00Z','2026-10-03'],['Pacific/Kiritimati','2026-10-03T12:30:00Z','2026-10-04'],['America/Chicago','2026-11-01T05:30:00Z','2026-11-01']]){
  const child=spawnSync(process.execPath,['-e',`
   const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
   const w=new JSDOM(fs.readFileSync(process.env.REVIEW_ROOT+'/portal/index.html','utf8'),{runScripts:'outside-only'}).window;
   const OriginalDate=w.Date;w.Date=class extends OriginalDate{constructor(...a){super(...(a.length?a:[process.env.REVIEW_INSTANT]));}};
   const dates=[];w.RA_PORTAL={hasPermission:()=>true,authClient:{rpc:async(n,a)=>{dates.push(a.p_log_date);return{data:{items:[],totals:{}},error:null};}},showStatus(n,m){n.textContent=m;}};
   w.eval(fs.readFileSync(process.env.REVIEW_ROOT+'/portal/portal-nutrition-review.js','utf8'));
   w.document.dispatchEvent(new w.CustomEvent('ra:contact-opened',{detail:{contactId:'fixture'}}));
   for(const id of ['review-toggle','next','prev','today'])w.document.getElementById('client-nutrition-'+id).click();
   const next=new OriginalDate(process.env.REVIEW_TODAY+'T12:00:00');next.setDate(next.getDate()+1);const expectedNext=next.getFullYear()+'-'+String(next.getMonth()+1).padStart(2,'0')+'-'+String(next.getDate()).padStart(2,'0');
   assert.deepEqual(dates,[process.env.REVIEW_TODAY,expectedNext,process.env.REVIEW_TODAY,process.env.REVIEW_TODAY]);setImmediate(()=>w.close());
  `],{cwd:repo,env:{...process.env,TZ:tz,REVIEW_ROOT:root,REVIEW_INSTANT:instant,REVIEW_TODAY:today},encoding:'utf8'});
  assert.equal(child.status,0,child.stderr||tz);
 }
});
