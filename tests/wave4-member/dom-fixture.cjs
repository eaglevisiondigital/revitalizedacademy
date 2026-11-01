'use strict';
const {JSDOM,VirtualConsole}=require('../wave2-client/dependencies.cjs').jsdom();
const fs=require('node:fs'),cp=require('node:child_process');
const tick=()=>new Promise(r=>setTimeout(r,15));
async function memberFixture(options={}){
 const errors=[],calls=[],listeners=[],handlers=new Map(),pending=[],clicks=new WeakMap(),modalTimers=[];
 let actor='synthetic-a',gateUser=false;
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('navigation'))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync('member/dashboard.html','utf8'),{url:'https://member.synthetic.invalid/member/dashboard.html',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;const timeout=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>options.gateModalTimers&&ms===450?(modalTimers.push(()=>fn(...args)),1):timeout(fn,ms,...args);w.CSS={escape:s=>s};w.alert=message=>calls.push({kind:'alert',message});
 w.fetch=()=>{throw Error('external_transport_forbidden');};
 const original=w.EventTarget.prototype.addEventListener;
 w.EventTarget.prototype.addEventListener=function(type,fn,...rest){if(this.id)handlers.set(this.id+':'+type,fn);if(type==='click')clicks.set(this,fn);return original.call(this,type,fn,...rest);};
 const user=()=>actor?{id:actor,email:actor+'@synthetic.invalid',email_confirmed_at:'2026-11-01T00:00:00Z'}:null;
 const data=(table,single)=>{
  if(table==='my_app_bootstrap_v2')return {access:{},home:{},member_profile:{first_name:'Synthetic',last_name:actor}};
  if(table==='my_member_dashboard')return {contact_id:'contact-'+actor,membership_id:'membership-'+actor,first_name:'Synthetic',last_name:actor,access_status:'active',membership_status:'active'};
  if(table==='checkin_templates')return {id:'synthetic-template'};
  if(table==='checkin_template_fields')return [{field_key:'fictional_note',label:'Fictional note',field_type:'text',required:true}];
  if(table==='my_goals')return [{id:'synthetic-goal',title:'Fictional goal',status:'active'}];
  if(table==='progress_metric_catalog')return [{metric_key:'fictional_metric',label:'Fictional metric',unit:'units',minimum_value:0,maximum_value:100}];
  if(table==='my_habits')return [{id:'synthetic-habit',title:'Fictional practice',status:'active',frequency:'daily',target_per_period:1}];
  return single?null:[];
 };
 function query(table){let single=false,payload,method;const q={};
  for(const n of ['select','eq','neq','in','order','limit','gte','lte'])q[n]=()=>q;
  for(const n of ['single','maybeSingle'])q[n]=()=>{single=true;return q;};
  for(const n of ['insert','update','upsert','delete'])q[n]=x=>{payload=x;method=n;return q;};
  q.then=(yes,no)=>{
   if(method)calls.push({kind:'write',table,method,payload:structuredClone(payload),actor});
   if(!method)calls.push({kind:'query',table,actor});
   const result={data:method?null:data(table,single),error:method&&options.writeError?options.writeError:null};
   return (method&&options.writeGate?new Promise(resolve=>pending.push(()=>resolve(result))):Promise.resolve(result)).then(yes,no);
  };return q;
 }
 const client={from:query,rpc:async(name,args)=>{
  calls.push({kind:'rpc',name,args:structuredClone(args),actor});
  if(options.rpcGate===name)await new Promise(resolve=>pending.push(resolve));
  return {data:true,error:options.rpcError||null};
 },auth:{getSession:async()=>({data:{session:{user:user()}},error:null}),getUser:async()=>{
  if(gateUser)await new Promise(resolve=>pending.push(resolve));
  return {data:{user:Object.hasOwn(options,'authUserId')?(options.authUserId?{id:options.authUserId}:null):user()},error:options.authError||null};
 },onAuthStateChange:fn=>{listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}};},signOut:async()=>({error:null})}};
 w.supabase={createClient:()=>client};w.eval(options.baseline?cp.execFileSync('git',['show','5926b915f60b1be6d009c94362b91356a303cb33:member/member110.js'],{encoding:'utf8'}):fs.readFileSync('member/member110.js','utf8'));
 for(let i=0;i<100;i++){await tick();if(w.document.getElementById('rm-checkin-fields')?.textContent.includes('Fictional note'))break;}
 if(!w.document.querySelector('[name="checkin_fictional_note"]'))throw Error('member_fixture_not_ready:'+errors.join('|'));
 return {w,calls,errors,pending,modalTimers,tick,close(){w.close();},gateGetUser(){gateUser=true;},async click(selector,text){const target=[...w.document.querySelectorAll(selector)].find(n=>n.textContent===text);if(!target)throw Error('action_missing');return clicks.get(target).call(target,{preventDefault(){},currentTarget:target});},refresh(){for(const fn of listeners)fn('TOKEN_REFRESHED',{user:user()});},switchActor(next){actor=next;for(const fn of listeners)fn(next?'SIGNED_IN':'SIGNED_OUT',next?{user:user()}:null);},release(){gateUser=false;pending.splice(0).forEach(fn=>fn());},async submit(id){const target=w.document.getElementById(id),fn=handlers.get(id+':submit');if(!fn)throw Error('handler_missing');return fn.call(target,{preventDefault(){},currentTarget:target});},async button(id){const target=w.document.getElementById(id);return handlers.get(id+':click').call(target,{preventDefault(){},currentTarget:target});}};
}
module.exports={memberFixture};
