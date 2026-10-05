const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const {installMock,tick}=require('./helpers/member-health-fixture.cjs');
const root=path.resolve(__dirname,'..');
const assetRoot=process.env.RVA_MEMBER_ASSET_ROOT?path.resolve(process.env.RVA_MEMBER_ASSET_ROOT):root;
const html=fs.readFileSync(path.join(assetRoot,'member/index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const source=fs.readFileSync(path.join(assetRoot,'member/member110.js'),'utf8');

function session(user){return user?{access_token:'synthetic-token-'+user,user:{id:user}}:null;}
function hub(user='member-a'){
  const clients=new Set();
  return {
    user,signOutCalls:0,clients,
    attach(entry){clients.add(entry);},
    emit(event,next=this.user){
      this.user=next;
      for(const entry of clients){entry.mock.state.user=next;entry.listener?.(event,session(next));}
    },
    async signOut(){this.signOutCalls++;this.emit('SIGNED_OUT',null);return {error:null};}
  };
}

function harness(t,shared,options={}){
  const vc=new VirtualConsole();
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://fixture.invalid/member/',virtualConsole:vc});
  const w=dom.window,d=w.document;
  w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};
  const mock=installMock(w,{user:shared.user});
  let listener=null,getSessionCalls=0;
  const entry={mock,get listener(){return listener;}};shared.attach(entry);
  mock.client.auth.getSession=async()=>{
    getSessionCalls++;
    if(options.sessionError)return {data:{session:null},error:new Error('Synthetic expired session')};
    if(options.initialNull&&getSessionCalls===1)return {data:{session:null},error:null};
    return {data:{session:session(shared.user)},error:null};
  };
  mock.client.auth.getUser=async()=>({data:{user:shared.user?{id:shared.user}:null},error:null});
  mock.client.auth.onAuthStateChange=fn=>{listener=fn;return {data:{subscription:{unsubscribe(){}}}};};
  mock.client.auth.signInWithPassword=async()=>{
    shared.emit('SIGNED_IN',shared.user||'member-a');
    return {data:{session:session(shared.user)},error:null};
  };
  mock.client.auth.signOut=()=>shared.signOut();
  if(options.dashboardOverride)mock.state.overrides.my_member_dashboard=options.dashboardOverride;
  w.eval(source);
  t.after(()=>{shared.clients.delete(entry);w.close();});
  return {dom,w,d,mock,emit:(event,user)=>{mock.state.user=user;listener?.(event,session(user));},getSessionCalls:()=>getSessionCalls};
}

test('persisted INITIAL_SESSION restores the member after an early empty session read',async t=>{
  const shared=hub(),h=harness(t,shared,{initialNull:true});
  await tick();
  assert(!h.d.getElementById('rm-auth').classList.contains('hidden'));
  h.emit('INITIAL_SESSION','member-a');
  await tick();
  assert(!h.d.getElementById('rm-dashboard').classList.contains('hidden'));
  assert.equal(h.d.getElementById('rm-member-name').textContent,'Synthetic Member');
});

test('two member tabs restore the same valid session and one-tab refresh does not sign out either',async t=>{
  const shared=hub(),tabA=harness(t,shared),tabB=harness(t,shared,{initialNull:true});
  await tick();tabB.emit('INITIAL_SESSION','member-a');await tick();
  for(const tab of [tabA,tabB])assert(!tab.d.getElementById('rm-dashboard').classList.contains('hidden'));
  tabB.emit('INITIAL_SESSION','member-a');await tick();
  for(const tab of [tabA,tabB])assert.equal(tab.d.getElementById('rm-member-name').textContent,'Synthetic Member');
  assert.equal(shared.signOutCalls,0);
});

test('explicit logout clears the shared session and private DOM in every tab',async t=>{
  const shared=hub(),tabA=harness(t,shared),tabB=harness(t,shared);await tick();
  tabA.d.getElementById('rm-member-name').textContent='PRIVATE A';
  tabB.d.getElementById('rm-member-name').textContent='PRIVATE A';
  tabA.d.getElementById('rm-signout').click();await tick();
  assert.equal(shared.signOutCalls,1);
  for(const tab of [tabA,tabB]){
    assert(!tab.d.getElementById('rm-auth').classList.contains('hidden'));
    assert(!tab.d.body.textContent.includes('PRIVATE A'));
  }
});

test('a delayed dashboard response cannot repopulate signed-out private UI',async t=>{
  let finish;
  const shared=hub(),h=harness(t,shared,{dashboardOverride:()=>new Promise(resolve=>{finish=resolve;})});
  await tick();shared.emit('SIGNED_OUT',null);
  finish({data:{contact_id:'contact-a',user_id:'member-a',first_name:'PRIVATE',last_name:'A',program_name:'Holistic Foundations',access_status:'active',membership_status:'active'},error:null});
  await tick();
  assert(!h.d.getElementById('rm-auth').classList.contains('hidden'));
  assert(!h.d.body.textContent.includes('PRIVATE A'));
});

test('expired or invalid session fails closed at sign-in',async t=>{
  const shared=hub(),h=harness(t,shared,{sessionError:true});
  await new Promise(resolve=>setTimeout(resolve,400));
  assert(!h.d.getElementById('rm-auth').classList.contains('hidden'));
  assert.match(h.d.getElementById('rm-login-status').textContent,/sign in again/i);
  assert(h.d.getElementById('rm-dashboard').classList.contains('hidden'));
});

test('account transition cancels prior responses and loads only the new member',async t=>{
  let finishA;
  const shared=hub('member-a');
  const h=harness(t,shared,{dashboardOverride:call=>call.user==='member-a'
    ?new Promise(resolve=>{finishA=resolve;})
    :{data:{contact_id:'contact-b',user_id:'member-b',first_name:'PRIVATE',last_name:'B',program_name:'Holistic Foundations',access_status:'active',membership_status:'active'},error:null}});
  await tick();shared.emit('SIGNED_IN','member-b');await tick();
  finishA({data:{contact_id:'contact-a',user_id:'member-a',first_name:'PRIVATE',last_name:'A',program_name:'Holistic Foundations',access_status:'active',membership_status:'active'},error:null});
  await tick();
  assert.equal(h.d.getElementById('rm-member-name').textContent,'PRIVATE B');
  assert(!h.d.body.textContent.includes('PRIVATE A'));
});
