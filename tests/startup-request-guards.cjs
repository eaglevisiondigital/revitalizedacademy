const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),{JSDOM,VirtualConsole}=require('jsdom');
const modules=['programs','people-directory','work-desk','member-messaging','companion','staff-access','family-requests'];
const html=fs.readFileSync('portal/index.html','utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const wait=()=>new Promise(r=>setTimeout(r,50));
function fixture(t,name,{active=true,delayed=false}={}){
 const messages=[],vc=new VirtualConsole();for(const level of ['warn','error','jsdomError'])vc.on(level,(...a)=>messages.push(a.map(String).join(' ')));
 const dom=new JSDOM(html,{url:'https://revitalizedacademy.com/portal/',runScripts:'outside-only',virtualConsole:vc}),w=dom.window;
 let epoch=0;const calls=[],pending=[],session=()=>active?{epoch,userId:'fictional-owner'}:null,current=s=>!!s&&active&&s.epoch===epoch;
 const query=table=>{calls.push(table);const q=new Proxy({},{get(_t,k){if(k==='then')return(resolve,reject)=>{const answer={data:table==='my_staff_permissions_view'?[{permission_key:'staff.view',allowed:true}]:table==='people_saved_views'?[{id:'fictional-view',name:'Fictional saved view',configuration:{}}]:[],error:null,count:0};return(delayed?new Promise(done=>pending.push(()=>done({data:null,error:new Error('late fictional denial')}))):Promise.resolve(answer)).then(resolve,reject);};return()=>q;}});return q;};
 w.setTimeout=fn=>setTimeout(fn,5);w.clearTimeout=clearTimeout;w.RA_PORTAL={authClient:{from:query},captureStaffSession:session,isStaffSessionCurrent:current,currentUserId:()=>active?'fictional-owner':null,currentStaffRole:()=> 'owner',staffDirectory:()=>[],hasPermission:()=>true,permissions:()=>({}),titleCase:v=>v,showStatus(){},formatDate:v=>v,personName:()=> 'FICTIONAL',makeBadge:()=>w.document.createElement('span')};
 if(active)w.document.getElementById('portal-view').classList.remove('hidden');
 w.eval(fs.readFileSync('portal/portal-'+name+'.js','utf8'));t.after(()=>dom.window.close());
 return{w,calls,messages,finish(){for(const done of pending.splice(0))done();},reset(){active=false;epoch++;w.document.dispatchEvent(new w.Event('ra:staff-access-reset'));}};
}
for(const name of modules){
 test(name+': signed-out startup and forged lifecycle events make no query',async t=>{const h=fixture(t,name,{active:false});for(const event of ['ra:dashboard-loaded','ra:permissions-loaded','ra:contact-closed'])h.w.document.dispatchEvent(new h.w.Event(event));await wait();assert.deepEqual(h.calls,[]);assert.deepEqual(h.messages,[]);});
 test(name+': valid session initializes normally',async t=>{const h=fixture(t,name);await wait();assert(h.calls.length>0);assert.deepEqual(h.messages,[]);});
 test(name+': stale async completion cannot touch removed private DOM or start a follow-up',async t=>{const h=fixture(t,name,{delayed:true});await wait();assert(h.calls.length>0);h.reset();h.w.document.body.replaceChildren(h.w.document.createTextNode('SIGNED OUT'));const before=h.calls.length;h.finish();for(const event of ['ra:dashboard-loaded','ra:permissions-loaded','ra:contact-closed'])h.w.document.dispatchEvent(new h.w.Event(event));await wait();assert.equal(h.calls.length,before);assert.equal(h.w.document.body.textContent,'SIGNED OUT');assert.deepEqual(h.messages,[]);});
}
test('only reviewed startup modules and HTML differ from the installed B5 runtime',()=>{const {execFileSync}=require('child_process'),base='e02f35267de3159d7b3b2a5e989ccb8edb7e9f7d';const changed=execFileSync('git',['diff',base,'--name-only','--','portal','netlify','js','config','supabase'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);assert.deepEqual(changed.sort(),['portal/index.html',...modules.map(n=>'portal/portal-'+n+'.js')].sort());});

test('directory dashboard refresh preserves the selected saved view',async t=>{const h=fixture(t,'people-directory');await wait();const select=h.w.document.getElementById('people-saved-view');select.value='fictional-view';h.w.document.dispatchEvent(new h.w.Event('ra:dashboard-loaded'));await wait();assert.equal(select.value,'fictional-view');assert.deepEqual(h.messages,[]);});
