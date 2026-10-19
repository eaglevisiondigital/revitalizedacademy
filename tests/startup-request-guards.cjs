const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),{JSDOM,VirtualConsole}=require('jsdom');
const modules=['programs','people-directory','work-desk','member-messaging','companion','staff-access','family-requests'];
const path=require('node:path'),root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('portal/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const wait=()=>new Promise(r=>setTimeout(r,50));
function fixture(t,name,{active=true,delayed=false,allowed=true}={}){
 const messages=[],vc=new VirtualConsole();for(const level of ['warn','error','jsdomError'])vc.on(level,(...a)=>messages.push(a.map(String).join(' ')));
 const dom=new JSDOM(html,{url:'https://revitalizedacademy.com/portal/',runScripts:'outside-only',virtualConsole:vc}),w=dom.window;
 let epoch=0,user='fictional-owner';const calls=[],pending=[],session=()=>active?{epoch,userId:user}:null,current=s=>!!s&&active&&s.epoch===epoch&&s.userId===user;
 const query=table=>{calls.push(table);const q=new Proxy({},{get(_t,k){if(k==='then')return(resolve,reject)=>{const answer={data:table==='my_staff_permissions_view'?[{permission_key:'staff.view',allowed}]:table==='people_saved_views'?[{id:'fictional-view',name:'Fictional saved view',configuration:{}}]:[],error:null,count:0};return(delayed?new Promise(done=>pending.push(answer=>done(answer||{data:null,error:new Error('late fictional denial')}))):Promise.resolve(answer)).then(resolve,reject);};return()=>q;}});return q;};
 w.setTimeout=fn=>setTimeout(fn,5);w.clearTimeout=clearTimeout;w.RA_PORTAL={authClient:{from:query},captureStaffSession:session,isStaffSessionCurrent:current,currentUserId:()=>active?user:null,currentStaffRole:()=> 'owner',staffDirectory:()=>[],hasPermission:()=>allowed,permissions:()=>({}),titleCase:v=>v,showStatus(){},formatDate:v=>v,personName:()=> 'FICTIONAL',makeBadge:()=>w.document.createElement('span')};
 w.RA_PORTAL.createAuthenticatedTaskGuard=require('./helpers/staff-task-fixture.cjs')(w,session,current);
 if(active)w.document.getElementById('portal-view').classList.remove('hidden');
 w.eval(read('portal/portal-'+name+'.js'));t.after(()=>dom.window.close());
 return{w,calls,messages,advanceEpoch(){epoch++;w.document.dispatchEvent(new w.Event('ra:dashboard-loaded'));},activate(next='fictional-next'){active=true;user=next;epoch++;w.document.getElementById('portal-view')?.classList.remove('hidden');w.document.dispatchEvent(new w.Event('ra:dashboard-loaded'));w.document.dispatchEvent(new w.Event('ra:permissions-loaded'));},finish(answer){for(const done of pending.splice(0))done(answer);},reset(){active=false;epoch++;w.document.dispatchEvent(new w.Event('ra:staff-access-reset'));}};
}
for(const name of modules){
 test(name+': signed-out startup and forged lifecycle events make no query',async t=>{const h=fixture(t,name,{active:false});for(const event of ['ra:dashboard-loaded','ra:permissions-loaded','ra:contact-closed'])h.w.document.dispatchEvent(new h.w.Event(event));await wait();assert.deepEqual(h.calls,[]);assert.deepEqual(h.messages,[]);});
 test(name+': valid session initializes normally',async t=>{const h=fixture(t,name);await wait();assert(h.calls.length>0);assert.deepEqual(h.messages,[]);});
 test(name+': stale async completion cannot touch removed private DOM or start a follow-up',async t=>{const h=fixture(t,name,{delayed:true});await wait();assert(h.calls.length>0);h.reset();h.w.document.body.replaceChildren(h.w.document.createTextNode('SIGNED OUT'));const before=h.calls.length;h.finish();for(const event of ['ra:dashboard-loaded','ra:permissions-loaded','ra:contact-closed'])h.w.document.dispatchEvent(new h.w.Event(event));await wait();assert.equal(h.calls.length,before);assert.equal(h.w.document.body.textContent,'SIGNED OUT');assert.deepEqual(h.messages,[]);});
}


test('directory dashboard refresh preserves the selected saved view',async t=>{const h=fixture(t,'people-directory');await wait();const select=h.w.document.getElementById('people-saved-view');select.value='fictional-view';h.w.document.dispatchEvent(new h.w.Event('ra:dashboard-loaded'));await wait();assert.equal(select.value,'fictional-view');assert.deepEqual(h.messages,[]);});

for(const name of modules){
 test(name+': restored authenticated session initializes after an initially anonymous document',async t=>{const h=fixture(t,name,{active:false});await wait();assert.equal(h.calls.length,0);h.activate();await wait();assert(h.calls.length>0);assert.deepEqual(h.messages,[]);});
 test(name+': account transition cancels earlier responses, permits a fresh account, and clears on reset',async t=>{const h=fixture(t,name,{delayed:true});await wait();h.reset();h.activate('fictional-account-b');const before=h.calls.length;h.finish();await wait();assert(h.calls.length>=before);assert.deepEqual(h.messages,[]);h.reset();const stopped=h.calls.length;h.finish();for(const event of ['ra:dashboard-loaded','ra:permissions-loaded','ra:contact-closed'])h.w.document.dispatchEvent(new h.w.Event(event));await wait();assert.equal(h.calls.length,stopped);assert.deepEqual(h.messages,[]);});
 test(name+': denied feature permission never starts its protected feature query',async t=>{const h=fixture(t,name,{allowed:false});for(const event of ['ra:dashboard-loaded','ra:permissions-loaded'])h.w.document.dispatchEvent(new h.w.Event(event));await wait();if(name==='staff-access')assert(h.calls.every(x=>x==='my_staff_permissions_view'));else if(name==='programs')assert(!h.calls.includes('admin_staff_access_directory'));else assert.deepEqual(h.calls,[]);assert.deepEqual(h.messages,[]);});
}
test('only seven loader scripts and their cache references change in the production runtime',()=>{
 const {execFileSync}=require('node:child_process'),git='/Library/Developer/CommandLineTools/usr/bin/git',base=require('./fixtures/protected-loader-baseline.json').source;
 const changed=execFileSync(git,['diff',base,'--name-only','--','portal','netlify','js','config','supabase','member'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);assert.deepEqual(changed.sort(),['portal/index.html',...modules.map(n=>'portal/portal-'+n+'.js')].sort());
 const original=execFileSync(git,['show',base+':portal/index.html'],{cwd:root,encoding:'utf8'});let expected=original;for(const n of modules)expected=expected.replace(new RegExp('(portal-'+n+'\\.js\\?v=)([0-9]+)'),(_,a,b)=>a+(Number(b)+1));assert.equal(read('portal/index.html'),expected);
 for(const n of modules){const file='portal/portal-'+n+'.js',a=execFileSync(git,['show',base+':'+file],{cwd:root}),b=execFileSync(git,['show','c618dd30cd4979e3f7916fcc7cbc9d4612ae4cf9:'+file],{cwd:root});assert(a.equals(b),'Loader baseline differs from Roadmap source: '+n);}
});

test('work queue restarts after same-user session epoch refresh with an earlier request still pending',async t=>{
 const h=fixture(t,'work-desk',{delayed:true});await wait();assert.equal(h.calls.filter(x=>x==='admin_work_queue').length,1);h.advanceEpoch();await wait();assert.equal(h.calls.filter(x=>x==='admin_work_queue').length,2);h.finish({data:[],error:null});await wait();assert(!h.w.document.getElementById('work-desk-list').textContent.includes('could not be loaded'));assert.deepEqual(h.messages,[]);
});
