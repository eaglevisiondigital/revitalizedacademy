const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('portal/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const source=read('portal/portal.js');
const wait=(ms=35)=>new Promise(resolve=>setTimeout(resolve,ms));
const makeSession=(user,token='fixture-token')=>user?{access_token:token,user:{id:user,user_metadata:{}}}:null;

function authHub(user='owner-a'){
  const clients=new Set();
  return {
    user,
    token:'fixture-token',
    signOutCalls:0,
    attach(client){clients.add(client);},
    detach(client){clients.delete(client);},
    emit(event,next=this.user,token=this.token){
      this.user=next;
      this.token=token;
      for(const client of clients){
        client.user=next;
        client.listener?.(event,makeSession(next,token));
      }
    },
    async signOut(){
      this.signOutCalls++;
      this.emit('SIGNED_OUT',null);
      return {error:null};
    }
  };
}

function harness(t,hub,options={}){
  const errors=[];
  const console=new VirtualConsole();
  console.on('jsdomError',error=>{if(!/navigation/i.test(error.message))errors.push(error.message);});
  const dom=new JSDOM(html,{url:'https://revitalizedacademy.com/portal/#dashboard',runScripts:'outside-only',virtualConsole:console});
  const w=dom.window;
  let listener=null;
  let getSessionCalls=0;
  let staffAccessCalls=0;
  let clientOptions=null;
  let stopped=false;
  const state={user:hub.user,get listener(){return listener;}};
  hub.attach(state);

  const staff=options.staff||{status:'active',display_name:'Synthetic Owner',role:'owner',contact_scope:'all'};
  const rows={
    staff_directory:[{user_id:hub.user,display_name:staff.display_name,role:staff.role,contact_scope:staff.contact_scope}],
    admin_dashboard_metrics:{},
    admin_followup_queue:[],
    admin_due_tasks:[],
    admin_contact_overview:options.contacts||[]
  };
  const query=table=>{
    const chain={};
    for(const name of ['select','eq','order','limit','single','maybeSingle'])chain[name]=()=>chain;
    chain.then=(resolve,reject)=>Promise.resolve({data:rows[table]??[],error:null}).then(resolve,reject);
    return chain;
  };
  const client={
    from:query,
    rpc:async name=>{
      if(name!=='get_my_staff_access')return {data:null,error:null};
      staffAccessCalls++;
      if(options.staffAccess)return options.staffAccess(staffAccessCalls);
      return {data:staff,error:null};
    },
    auth:{
      getSession:async()=>{
        getSessionCalls++;
        if(options.sessionError)return {data:{session:null},error:new Error('Synthetic expired session')};
        if(options.initialNull&&getSessionCalls===1)return {data:{session:null},error:null};
        return {data:{session:makeSession(state.user,hub.token)},error:null};
      },
      getUser:async()=>({data:{user:state.user?{id:state.user,user_metadata:{}}:null},error:null}),
      onAuthStateChange:callback=>{listener=callback;return {data:{subscription:{unsubscribe(){listener=null;}}}};},
      signInWithPassword:async()=>({data:{session:makeSession(state.user,hub.token)},error:null}),
      signOut:()=>hub.signOut(),
      stopAutoRefresh(){stopped=true;}
    }
  };

  w.RVA_ENV={
    supabaseUrl:'https://voalfpxiyznnqfcqcymd.supabase.co',
    supabaseKey:'public-fixture',
    staffRedirect:'https://revitalizedacademy.com/portal/'
  };
  w.supabase={createClient(_url,_key,config){clientOptions=config;return client;}};
  w.eval(source);
  if(options.autoInitial!==false)w.setTimeout(()=>listener?.('INITIAL_SESSION',makeSession(state.user,hub.token)),0);
  t.after(()=>{hub.detach(state);dom.window.close();});
  return {
    w,dom,errors,
    emit:(event,user=state.user,token=hub.token)=>{state.user=user;listener?.(event,makeSession(user,token));},
    getSessionCalls:()=>getSessionCalls,
    staffAccessCalls:()=>staffAccessCalls,
    clientOptions:()=>clientOptions,
    stopped:()=>stopped
  };
}

test('staff auth client keeps persistent storage and automatic token refresh enabled',async t=>{
  const h=harness(t,authHub());
  await wait();
  assert.equal(h.clientOptions().auth.persistSession,true);
  assert.equal(h.clientOptions().auth.autoRefreshToken,true);
  assert.equal(h.clientOptions().auth.detectSessionInUrl,true);
});

test('temporary empty startup session remains neutral until INITIAL_SESSION restores staff',async t=>{
  const h=harness(t,authHub(),{initialNull:true,autoInitial:false});
  await wait();
  assert(!h.w.document.getElementById('session-restore-card').classList.contains('hidden'));
  assert(h.w.document.getElementById('login-card').classList.contains('hidden'));
  h.emit('INITIAL_SESSION','owner-a');
  await wait();
  assert(!h.w.document.getElementById('portal-view').classList.contains('hidden'));
  assert.equal(h.w.RA_PORTAL.currentUserId(),'owner-a');
  assert.equal(h.staffAccessCalls(),1);
  assert.deepEqual(h.errors,[]);
});

test('normal refresh, hard-refresh bootstrap and a second tab restore one staff identity',async t=>{
  const hub=authHub();
  const first=harness(t,hub);
  const refreshed=harness(t,hub,{initialNull:true});
  const secondTab=harness(t,hub);
  await wait(80);
  for(const h of [first,refreshed,secondTab]){
    assert.equal(h.w.RA_PORTAL.currentUserId(),'owner-a');
    assert(!h.w.document.getElementById('portal-view').classList.contains('hidden'));
  }
  assert.equal(hub.signOutCalls,0);
});

test('duplicate restore events do not issue duplicate staff bootstrap requests',async t=>{
  const h=harness(t,authHub());
  await wait();
  h.emit('INITIAL_SESSION','owner-a');
  h.emit('SIGNED_IN','owner-a');
  await wait();
  assert.equal(h.staffAccessCalls(),1);
});

test('token refresh preserves visible workspace while reauthorizing, then fails closed if revoked',async t=>{
  let resolveRefresh;
  let revoked=false;
  const h=harness(t,authHub(),{staffAccess:call=>{
    if(call===2)return new Promise(resolve=>{resolveRefresh=resolve;});
    return {data:{status:revoked?'inactive':'active',display_name:'Scoped Coach',role:'coach',contact_scope:'assigned'},error:null};
  }});
  await wait();
  const secret=h.w.document.createElement('p');secret.textContent='PRIVATE ASSIGNED CLIENT';h.w.document.body.append(secret);
  h.emit('TOKEN_REFRESHED','owner-a','refreshed-token');
  await wait(10);
  assert(!h.w.document.getElementById('portal-view').classList.contains('hidden'));
  assert(h.w.document.body.textContent.includes('PRIVATE ASSIGNED CLIENT'));
  resolveRefresh({data:{status:'active',display_name:'Scoped Coach',role:'coach',contact_scope:'assigned'},error:null});
  await wait();
  revoked=true;
  h.emit('TOKEN_REFRESHED','owner-a','revoked-token');
  await wait();
  assert.equal(h.w.document.getElementById('portal-view'),null);
  assert.match(h.w.document.body.textContent,/securing your account change/i);
  assert(!h.w.document.body.textContent.includes('PRIVATE ASSIGNED CLIENT'));
});

test('logout clears private state across tabs and remains logged out after a new bootstrap',async t=>{
  const hub=authHub();
  const first=harness(t,hub),second=harness(t,hub);
  await wait();
  first.w.document.body.append(Object.assign(first.w.document.createElement('p'),{textContent:'PRIVATE OWNER'}));
  second.w.document.body.append(Object.assign(second.w.document.createElement('p'),{textContent:'PRIVATE OWNER'}));
  first.w.document.getElementById('logout-button').click();
  await wait();
  assert.equal(hub.signOutCalls,1);
  assert(!first.w.document.body.textContent.includes('PRIVATE OWNER'));
  assert(!second.w.document.body.textContent.includes('PRIVATE OWNER'));
  const afterRefresh=harness(t,hub);
  await wait();
  assert(!afterRefresh.w.document.getElementById('login-card').classList.contains('hidden'));
  assert(afterRefresh.w.document.getElementById('portal-view').classList.contains('hidden'));
});

test('different-account event destroys the prior staff document before resolving the new account',async t=>{
  const h=harness(t,authHub());
  await wait();
  h.w.document.body.append(Object.assign(h.w.document.createElement('p'),{textContent:'PRIVATE OWNER A'}));
  h.emit('SIGNED_IN','owner-b','owner-b-token');
  assert(!h.w.document.body.textContent.includes('PRIVATE OWNER A'));
  assert.equal(h.w.document.getElementById('portal-view'),null);
  assert(h.stopped());
});
