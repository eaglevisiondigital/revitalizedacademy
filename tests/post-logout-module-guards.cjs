const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('portal/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
const modules=[
  'portal/portal-permissions.js',
  'portal/portal-staff-onboarding.js',
  'portal/portal-refuel.js',
  'portal/portal-community.js',
  'portal/portal-executive.js'
];
const guardedTables=[
  'my_staff_permissions_view','my_staff_agreements',
  'admin_refuel_pipeline','refuel_offers','admin_refuel_metrics',
  'admin_community_spaces','admin_community_feed','admin_community_metrics',
  'admin_platform_health_metrics','admin_conversion_funnel','admin_program_performance'
];
const wait=(ms=60)=>new Promise(resolve=>setTimeout(resolve,ms));
const session=user=>user?{access_token:'fixture-'+user,user:{id:user,user_metadata:{}}}:null;

function harness(t,{user='owner-a',staffStatus='active',delayModules=false}={}){
  const messages=[];
  const virtualConsole=new VirtualConsole();
  for(const level of ['error','warn'])virtualConsole.on(level,(...args)=>messages.push(level+': '+args.map(String).join(' ')));
  virtualConsole.on('jsdomError',error=>{if(!/navigation/i.test(error.message))messages.push('jsdom: '+error.message);});
  const dom=new JSDOM(html,{url:'https://revitalizedacademy.com/portal/#dashboard',runScripts:'outside-only',virtualConsole});
  const w=dom.window;
  const calls=new Map(),deferred=[];
  let activeUser=user,listener=null;
  const data={
    staff_directory:[{user_id:user,display_name:'Fixture Owner',role:'owner',contact_scope:'all'}],
    admin_dashboard_metrics:{},admin_followup_queue:[],admin_due_tasks:[],admin_contact_overview:[],
    admin_refuel_metrics:{},admin_community_metrics:{},admin_platform_health_metrics:{}
  };
  const resultFor=table=>({data:data[table]??[],error:null});
  const query=table=>{
    calls.set(table,(calls.get(table)||0)+1);
    const chain={};
    for(const method of ['select','eq','in','order','limit','neq','maybeSingle','single','insert','update','delete','upsert'])chain[method]=()=>chain;
    chain.then=(resolve,reject)=>{
      if(delayModules&&guardedTables.includes(table)){
        return new Promise(done=>deferred.push(()=>done({data:null,error:new Error('late signed-out response')}))).then(resolve,reject);
      }
      return Promise.resolve(resultFor(table)).then(resolve,reject);
    };
    return chain;
  };
  const client={
    from:query,
    rpc:async name=>name==='get_my_staff_access'
      ?{data:{status:staffStatus,display_name:'Fixture Owner',role:'owner',contact_scope:'all'},error:null}
      :{data:null,error:null},
    functions:{invoke:async()=>({data:{ok:true},error:null})},
    auth:{
      getSession:async()=>({data:{session:session(activeUser)},error:null}),
      getUser:async()=>({data:{user:session(activeUser)?.user||null},error:null}),
      onAuthStateChange:callback=>{listener=callback;return {data:{subscription:{unsubscribe(){listener=null;}}}};},
      signInWithPassword:async()=>({data:{session:session(activeUser)},error:null}),
      signOut:async()=>{activeUser=null;listener?.('SIGNED_OUT',null);return {error:null};},
      stopAutoRefresh(){}
    }
  };
  w.RVA_ENV={supabaseUrl:'https://voalfpxiyznnqfcqcymd.supabase.co',supabaseKey:'public-fixture',staffRedirect:'https://revitalizedacademy.com/portal/'};
  w.supabase={createClient:()=>client};
  w.eval(read('portal/portal.js'));
  for(const file of modules)w.eval(read(file));
  w.setTimeout(()=>listener?.('INITIAL_SESSION',session(activeUser)),0);
  t.after(()=>dom.window.close());
  return {
    w,messages,calls,deferred,
    emit(event,nextUser){activeUser=nextUser;listener?.(event,session(nextUser));},
    resolveDeferred(){for(const resolve of deferred.splice(0))resolve();}
  };
}

test('all five modules initialize only inside a valid authenticated staff epoch',async t=>{
  const h=harness(t);
  await wait(120);
  for(const table of guardedTables)assert.ok((h.calls.get(table)||0)>0,table+' was not queried');
  assert.deepEqual(h.messages,[]);
});

test('signed-out and invalid-session bootstraps leave all five modules inert',async t=>{
  const signedOut=harness(t,{user:null});
  const revoked=harness(t,{staffStatus:'inactive'});
  await wait(1200);
  for(const h of [signedOut,revoked]){
    for(const table of guardedTables)assert.equal(h.calls.get(table)||0,0,table+' queried without valid staff access');
    assert.deepEqual(h.messages,[]);
  }
});

test('logout cancels stale module responses before errors or detached-DOM repaint',async t=>{
  const h=harness(t,{delayModules:true});
  await wait(60);
  assert.ok(h.deferred.length>=guardedTables.length);
  h.w.document.getElementById('logout-button').click();
  await wait(20);
  h.resolveDeferred();
  await wait(80);
  assert.equal(h.w.document.getElementById('portal-view'),null);
  assert.doesNotMatch(h.w.document.body.textContent,/late signed-out response/i);
  assert.deepEqual(h.messages,[]);
});

test('account transition tears down the old module epoch and a fresh account initializes cleanly',async t=>{
  const oldAccount=harness(t,{delayModules:true});
  await wait(60);
  oldAccount.emit('SIGNED_IN','owner-b');
  oldAccount.resolveDeferred();
  await wait(80);
  assert.equal(oldAccount.w.document.getElementById('portal-view'),null);
  assert.deepEqual(oldAccount.messages,[]);

  const newAccount=harness(t,{user:'owner-b'});
  await wait(120);
  assert.equal(newAccount.w.RA_PORTAL.currentUserId(),'owner-b');
  for(const table of guardedTables)assert.ok((newAccount.calls.get(table)||0)>0,table+' did not reinitialize');
  assert.deepEqual(newAccount.messages,[]);
});

test('cache versions publish the guarded core and all five repaired modules',()=>{
  const source=read('portal/index.html');
  for(const expected of [
    /portal\.js\?v=nda-onboarding-20261015/,
    /portal-executive\.js\?v=167/,
    /portal-community\.js\?v=167/,
    /portal-refuel\.js\?v=167/,
    /portal-permissions\.js\?v=133/,
    /portal-staff-onboarding\.js\?v=146/
  ])assert.match(source,expected);
});
