'use strict';
// Fictional transport only. Executed before the actual application scripts.
function installFixture(options) {
  let userId=JSON.parse(sessionStorage.getItem('wave4-fictional-user')||JSON.stringify(options.userId??'synthetic-a'));
  const listeners=[],pending=[],calls=[],modalTimers=[];
  if(options.gateModalTimers){const timeout=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>ms===450?(modalTimers.push(()=>fn(...args)),1):timeout(fn,ms,...args);}
  const user=()=>userId?{id:userId,email:userId+'@example.invalid',email_confirmed_at:'synthetic-confirmed'}:null;
  const session=()=>userId?{user:user(),access_token:'fictional-token'}:null;
  function data(table,single){
    if(table==='my_app_bootstrap_v2')return {access:{},home:{},upcoming_appointment:{appointment_type:'Fictional appointment',scheduled_start:'2027-01-01T15:00:00Z'},member_profile:{first_name:'Synthetic',last_name:userId,email:user().email}};
    if(table==='my_member_dashboard')return options.denied?null:{contact_id:'contact-'+userId,membership_id:'membership-'+userId,first_name:'Synthetic',last_name:userId,email:user().email,access_status:'active',membership_status:'active',program_name:'Fictional Program'};
    if(table==='progress_metric_catalog')return [{metric_key:'fictional_metric',label:'Fictional metric',unit:'units',minimum_value:0,maximum_value:100}];
    if(table==='my_goals')return [{id:'synthetic-goal',title:'Fictional goal',status:'active'}];
    if(table==='my_habits')return [{id:'synthetic-habit',title:'Fictional habit',status:'active',frequency:'daily',target_per_period:1}];
    if(table==='checkin_templates')return {id:'synthetic-template'};
    if(table==='checkin_template_fields')return [{field_key:'fictional_note',label:'Fictional note',field_type:'text',required:false}];
    return single?null:[];
  }
  function query(table){
    let single=false,write=false,payload;
    const q={};
    for(const method of ['select','eq','in','order','limit','neq','gte','lte'])q[method]=()=>q;
    for(const method of ['single','maybeSingle'])q[method]=()=>{single=true;return q;};
    for(const method of ['insert','update','delete','upsert'])q[method]=value=>{write=true;payload=value;calls.push({kind:'write',table,method,payload:structuredClone(payload)});return q;};
    q.then=(resolve,reject)=>{
      calls.push({kind:'query',table,userId});
      const result=(options.failure===table||write&&window.__fixture.writeError)?{data:null,error:window.__fixture.writeError||{code:'42501',message:'Fictional denial'}}:{data:write?null:data(table,single),error:null};
      const captured=structuredClone(result);
      if(write&&window.__fixture.gateWrite||options.gateTable===table&&!sessionStorage.getItem('wave4-released'))return new Promise(r=>pending.push(()=>r(captured))).then(resolve,reject);
      return Promise.resolve(captured).then(resolve,reject);
    };
    return q;
  }
  const auth={
    getSession:async()=>{
      const result={data:{session:session()},error:options.sessionError?{message:'fictional unavailable'}:null};
      if(options.gateSession&&!sessionStorage.getItem('wave4-released'))return new Promise(resolve=>pending.push(()=>resolve(result)));
      return result;
    },
    getUser:async()=>{if(window.__fixture.gateUser)await new Promise(resolve=>pending.push(resolve));return {data:{user:user()},error:null};},
    onAuthStateChange:fn=>{listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}};},
    signInWithPassword:async()=>{userId='synthetic-a';sessionStorage.setItem('wave4-fictional-user',JSON.stringify(userId));listeners.forEach(fn=>fn('SIGNED_IN',session()));return {data:{session:session()},error:null};},
    signOut:async()=>{window.__fixture.emit('SIGNED_OUT',null);return {error:null};}
  };
  window.supabase={createClient:()=>({auth,from:query,rpc:async(name,args)=>{
    calls.push({kind:'rpc',name,args});if(window.__fixture.gateRPC===name)await new Promise(resolve=>pending.push(resolve));if(window.__fixture.rpcError)return {data:null,error:window.__fixture.rpcError};
    if(name==='my_onboarding_context')return {data:{access_state:'onboarding',enrollments:[{program_name:'Fictional Program',amount_cents:100,currency:'CAD'}],agreements:[{client_agreement_id:'synthetic-agreement',name:'Fictional Agreement',content_text:'Fictional terms for route preservation only.',content_hash:'synthetic-hash',template_version:'fixture',status:'sent',signer_role:'primary_client',accepted_signatures:0,required_client_signatures:1}]},error:null};
    return {data:true,error:null};
  },functions:{invoke:async()=>({data:{ok:true},error:null})}})};
  window.__fixture={calls,pending,modalTimers,gateUser:false,gateWrite:false,gateRPC:null,rpcError:null,writeError:null,release(){window.__fixture.gateUser=false;window.__fixture.gateWrite=false;window.__fixture.gateRPC=null;sessionStorage.setItem('wave4-released','yes');pending.splice(0).forEach(fn=>fn());},nullInitial(){listeners.forEach(fn=>fn('INITIAL_SESSION',null));},emit(event,next=userId){userId=next;sessionStorage.setItem('wave4-fictional-user',JSON.stringify(userId));sessionStorage.setItem('wave4-released','yes');listeners.forEach(fn=>fn(event,session()));}};
}
module.exports={installFixture};
