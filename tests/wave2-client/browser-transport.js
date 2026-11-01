// Fake transport only. The shipped onboarding module implements all UI policy and actions.
(() => {
  const scenario=window.__WAVE2_CASE;
  window.__WAVE2_CALLS=[];
  let user=scenario==='signed-out'?null:{id:'fictional-client-a',email:'client-a@example.invalid',email_confirmed_at:scenario==='unverified'?null:'2026-11-01T00:00:00Z'};
  let handler;
  const context={access_state:scenario==='suspended'?'suspended':'onboarding',enrollments:[{program_name:'Fictional Program',currency:'CAD',amount_cents:10000,billing_choice:'monthly'}],agreements:[]};
  const record=(name,args)=>window.__WAVE2_CALLS.push({name,args});
  window.supabase={createClient:()=>({
    auth:{
      getUser:async()=>({data:{user},error:null}),
      onAuthStateChange:fn=>{handler=fn;return {data:{subscription:{unsubscribe(){}}}};},
      signOut:async()=>{record('signOut');user=null;handler?.('SIGNED_OUT',null);return {error:null};},
      signInWithPassword:async()=>({error:null}),
      signUp:async()=>({data:{session:null},error:null})
    },
    rpc:async(name,args)=>{
      record(name,args);
      if(scenario==='wrong-claim'&&name==='claim_onboarding_enrollment')return {error:{message:'Invitation unavailable for this verified account'}};
      return {data:name==='my_onboarding_context'?context:true,error:null};
    },
    functions:{invoke:async(name,args)=>{record(name,args);return {data:{},error:null};}}
  })};
})();
