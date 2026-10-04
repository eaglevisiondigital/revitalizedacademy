const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'../..');
const tick=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));await new Promise(r=>setTimeout(r,5));};
// The same mock backend is usable with unmodified built browser scripts. No hosted data.
function installMock(w,options={}){
  const calls=[],listeners=[],state={user:'member-a',contact:'contact-a',paid:true,overrides:{},...options};
  const daysAgo=n=>new Date(Date.now()-n*86400000).toISOString();
  const def=(key,label,unit,order)=>({metric_key:key,label,unit,tracking_mode:'available',allow_manual:true,source_preference:'connected_or_manual',display_order:order});
  const config=[def('weight','Weight','lb',0),def('steps','Steps','steps',1),def('resting_heart_rate','Resting Heart Rate','bpm',2),def('sleep_duration','Sleep Duration','hours',3),def('active_minutes','Active Minutes','min',4),def('active_energy','Active Energy','kcal',5),def('water_intake','Water / Hydration','oz',6),def('energy_level','Energy','1-10',7),def('mood_score','Mood','1-10',8),def('body_fat_percent','Body Fat','%',9)];
  const reading=(n,value=180)=>({contact_id:state.contact,metric_key:'weight',unit:'lb',value_numeric:value,recorded_at:daysAgo(n),origin:'manual',source:'member'});
  function defaults(name,args,single){
    if(name==='member_paid_access_allowed')return state.paid;
    if(name==='get_my_health_metric_configuration')return config;
    if(name==='my_member_dashboard')return {contact_id:state.contact,user_id:state.user,first_name:'Synthetic',last_name:'Member',program_name:'Holistic Foundations',access_status:'active',membership_status:'active'};
    if(name==='my_app_bootstrap_v2')return {access:{nutrition_enabled:true,fitness_enabled:true,biometrics_enabled:true},progress_snapshot:{active_goals:1,active_habits:1}};
    if(name==='my_member_entitlements')return [];
    if(name==='app_runtime_config')return single?{config_value:false}:[];
    if(name==='my_health_metric_latest')return [reading(0,178)];
    if(name==='my_recent_progress')return [reading(0,178),reading(4,180),reading(20,183)];
    if(name==='get_my_health_metric_trend')return args.p_metric_key==='weight'?[reading(4,180),reading(0,178)]:[];
    if(name==='my_goals')return [{id:'goal-private',contact_id:state.contact,title:'Build a steady movement routine',status:'active',target_value:180,target_unit:'lb',target_date:'2026-12-01'}];
    if(name==='my_goal_progress')return [{goal_id:'goal-private',contact_id:state.contact,current_value:178,target_unit:'lb',completion_percent:60,current_recorded_at:daysAgo(0)}];
    if(name==='my_habits')return [{contact_id:state.contact,title:'Take a walk after lunch',status:'active',frequency:'daily',target_per_period:1,unit:'walk',last_7_day_value:4,today_value:0}];
    if(name==='get_my_nutrition_day')return {date:args.p_log_date,totals:{energy_kcal:450,protein_g:20,fat_g:0},targets:[{nutrient_key:'protein_g',target:80,minimum:60,maximum:120,unit:'g',source:'coach'}],items:[]};
    if(name==='get_my_nutrition_trends')return [{date:daysAgo(1).slice(0,10),totals:{energy_kcal:400,protein_g:30}},{date:daysAgo(0).slice(0,10),totals:{energy_kcal:450,protein_g:20}}];
    if(name==='get_my_nutrition_sources')return {foods:[],recipes:[]};
    if(name==='my_coaching_hub')return {contact_id:state.contact,program_name:'Holistic Foundations',assigned_coach_name:'Synthetic Coach',next_appointment:{scheduled_start:daysAgo(-2)},recent_sessions:[{status:'completed',completed_at:daysAgo(6)}],current_assignments:[{title:'Review this week’s routines',status:'assigned',due_at:daysAgo(-3)}]};
    if(name==='my_health_connection_center')return [{provider_name:'Apple Health',connection_mode:'mobile_bridge',status:'connected',last_successful_sync_at:null}];
    return single?null:[];
  }
  async function run(name,args,single,filters,columns){
    const call={name,args,single,filters,columns,user:state.user};calls.push(call);
    if(Object.hasOwn(state.overrides,name)){const v=state.overrides[name];return typeof v==='function'?v(call):v;}
    return {data:defaults(name,args,single),error:null};
  }
  const client={rpc:(name,args={})=>run(name,args),from(name){
    let single=false,columns='*';const filters=[];
    const query={select(c){columns=c;return query;},eq(...a){filters.push(a);return query;},in(...a){filters.push(a);return query;},order(){return query;},limit(){return query;},neq(){return query;},maybeSingle(){single=true;return query;},single(){single=true;return query;},then(a,b){return run(name,{},single,filters,columns).then(a,b);}};
    return query;
  },auth:{getSession:async()=>({data:{session:state.user?{user:{id:state.user}}:null}}),getUser:async()=>({data:{user:{id:state.user}}}),onAuthStateChange(fn){listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}};},signOut:async()=>{emit('SIGNED_OUT',null);return {};}}};
  function emit(event,user){state.user=user;listeners.forEach(fn=>fn(event,user?{user:{id:user}}:null));}
  w.RVA_ENV={supabaseUrl:'https://fixture.invalid',supabaseKey:'synthetic-public-fixture'};w.supabase={createClient:()=>client};w.RA_MEMBER_CLIENT=client;
  return {state,calls,client,emit,config,reading};
}
function fixture(options={}){
  const errors=[],vc=new VirtualConsole();for(const event of ['jsdomError','error','warn'])vc.on(event,e=>errors.push(String(e?.message||e)));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'member/index.html'),'utf8'),{runScripts:'outside-only',url:'https://fixture.invalid/member/',virtualConsole:vc});
  const w=dom.window,d=w.document;w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=()=>{};
  const mock=installMock(w,options);
  if(options.core)w.eval(fs.readFileSync(path.join(root,'member/member110.js'),'utf8'));
  if(!options.skipHealth)w.eval(fs.readFileSync(path.join(root,'member/member-health-progress.js'),'utf8'));
  const el=id=>d.getElementById(id),event=(name,detail)=>d.dispatchEvent(new w.CustomEvent(name,{detail}));
  async function open(h={}){if(options.core){await tick();el('rm-member-content').querySelector('[data-member-screen="health"]')?.click();d.querySelector('.rm210-sidebar-nav [data-member-screen="health"]').click();}
    else {el('rm-member-content').dataset.activeScreen='health';event('ra:member-dashboard-loaded',{healthContext:{userId:mock.state.user,contactId:mock.state.contact,biometricsEnabled:true,nutritionEnabled:true,...h}});}await tick();}
  return {dom,w,d,el,event,open,errors,...mock,close:()=>w.close()};
}
module.exports={fixture,tick,installMock};
