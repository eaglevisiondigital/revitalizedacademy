// Transport-only fiction: the production JS owns all rendering, session guards and actions.
const {JSDOM,VirtualConsole}=require('./dependencies.cjs').jsdom();const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,25));
const identity=(id,confirmed=true)=>({id,email:id+'@example.invalid',email_confirmed_at:confirmed?'2026-11-01T00:00:00Z':null});
const pendingContext=(name='Fictional Plan')=>({access_state:'onboarding',enrollments:[{program_name:name,currency:'CAD',amount_cents:10000,billing_choice:'monthly'}],agreements:[]});
async function fixture(options={}){
 const errors=[],calls=[],handlers=[];let user=options.user===undefined?identity('client-a'):options.user;
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(read('member/onboarding/index.html'),{url:'https://academy-fixture.invalid/member/onboarding/'+(options.hash||''),runScripts:'outside-only',virtualConsole:vc});const w=dom.window;
 w.fetch=()=>{throw Error('External request forbidden in fictional harness');};
 const client={rpc:async(name,args)=>{calls.push({name,args,user:user?.id});if(options.rpc)return options.rpc(name,args,user);if(name==='my_onboarding_context')return {data:options.context||pendingContext(),error:null};return {data:true,error:null};},functions:{invoke:async(name,args)=>{calls.push({name,args,user:user?.id});return {data:{},error:null};}},auth:{getUser:async()=>({data:{user},error:null}),onAuthStateChange:fn=>{handlers.push(fn);return {data:{subscription:{unsubscribe(){}}}};},signInWithPassword:async args=>{calls.push({name:'signInWithPassword',args});return {data:{user},error:null};},signUp:async args=>{calls.push({name:'signUp',args});return {data:{session:null},error:null};},signOut:async()=>{calls.push({name:'signOut'});user=null;for(const h of handlers)h('SIGNED_OUT',null);return {error:null};}}};
 w.RVA_ENV={supabaseUrl:'https://auth-fixture.invalid',supabaseKey:'fictional-public',appOrigin:'https://academy-fixture.invalid'};w.supabase={createClient:()=>client};w.eval(read('member/onboarding/onboarding.js'));await tick();
 return {w,calls,errors,client,tick,setUser(next){user=next;for(const h of handlers)h(next?'SIGNED_IN':'SIGNED_OUT',next?{user:next}:null);},close(){dom.window.close();}};
}
module.exports={fixture,tick,identity,pendingContext};
