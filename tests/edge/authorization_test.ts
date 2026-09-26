import { handleRequest as request } from "../../supabase/functions/coach-companion-request/handler.ts";
import { handleRequest as knowledge } from "../../supabase/functions/coach-companion-knowledge/handler.ts";
import { handleRequest as review } from "../../supabase/functions/coach-companion-review/handler.ts";
import { handleRequest as override } from "../../supabase/functions/journey-override/handler.ts";
import { handleRequest as clientSign } from "../../supabase/functions/agreement-sign/handler.ts";
import { handleRequest as staffSign } from "../../supabase/functions/staff-agreement-sign/handler.ts";
const uid="10000000-0000-4000-8000-000000000001";
const own="20000000-0000-4000-8000-000000000001";
const cross="20000000-0000-4000-8000-000000000002";
function assert(ok:unknown,message="Assertion failed"):asserts ok {if(!ok)throw Error(message);}
type Call={path:string;method:string;body:Record<string,unknown>|null;auth:string|null};
async function run(handler:(r:Request)=>Promise<Response>,body:unknown,options:{staff?:boolean;allowed?:boolean;auth?:boolean;signError?:boolean}={}) {
 const originalFetch=globalThis.fetch,originalEnv=Deno.env.get;
 const calls:Call[]=[];
 Deno.env.get=(key:string)=>({SUPABASE_URL:"https://synthetic.invalid",SUPABASE_SERVICE_ROLE_KEY:"synthetic-service-key"}[key]);
 globalThis.fetch=async(input:Request|string|URL,init?:RequestInit)=>{
  const req=new Request(input,init);const url=new URL(req.url);
  const text=await req.text();const data=text?JSON.parse(text):null;
  calls.push({path:url.pathname,method:req.method,body:data,auth:req.headers.get('authorization')});
  let result:unknown=null;let status=200;
  if(url.pathname==='/auth/v1/user') {result=options.auth===false?{message:'invalid token'}:{id:uid,email:'synthetic@example.invalid'};if(options.auth===false)status=401;}
  else if(url.pathname.endsWith('/rpc/staff_action_allowed')){assert(req.headers.get('authorization')==='Bearer synthetic-caller-token','Permission RPC lost caller identity');result=options.allowed!==false&&(!data.p_contact_id||data.p_contact_id===own);}
  else if(url.pathname.includes('/rpc/sign_')){result=options.signError?{message:'Agreement content changed',code:'P0001'}:'acceptance';if(options.signError)status=400;}
  else if(url.pathname.endsWith('/staff_access'))result=options.staff===false?null:{role:'admin',display_name:'Synthetic',status:'active',onboarding_status:'complete'};
  else if(url.pathname.endsWith('/coach_companion_question_types'))result={question_type:'other',handling_mode:'coach_review',label:'Synthetic'};
  else if(url.pathname.endsWith('/client_access'))result={contact_id:own,status:'active',membership_id:null};
  else if(url.pathname.endsWith('/coach_companion_requests'))result={id:'request',...data};
  else if(url.pathname.endsWith('/coach_companion_reviews'))result={id:'review',...data};
  else if(url.pathname.endsWith('/follow_up_tasks'))result=[];
  else if(url.pathname.endsWith('/journey_enrollment_activations'))result={id:own,contact_id:cross};
  else if(url.pathname.endsWith('/client_agreements'))result={id:own,contact_id:own,status:'sent',required_client_signatures:1,agreement_templates:{status:'published'}};
  else if(url.pathname.endsWith('/staff_agreements'))result={id:own,staff_user_id:uid,status:'sent'};
  return new Response(JSON.stringify(result),{status,headers:{'content-type':'application/json'}});
 };
 try {const response=await handler(new Request('https://synthetic.invalid/function',{method:'POST',headers:{authorization:'Bearer synthetic-caller-token','content-type':'application/json'},body:JSON.stringify(body)}));return {response,calls};}
 finally{globalThis.fetch=originalFetch;Deno.env.get=originalEnv;}
}
for(const [name,options,contact] of [['missing permission',{allowed:false},own],['cross contact',{allowed:true},cross]] as const)Deno.test('staff companion denies '+name+' before any privileged write',async()=>{
 const {response,calls}=await run(request,{question:'Synthetic question',contact_id:contact},options);assert(response.status===403);assert(!calls.some(c=>c.method==='POST'&&!c.path.includes('/rpc/')));
});
Deno.test('authorized staff companion request succeeds and uses own scoped contact',async()=>{const {response,calls}=await run(request,{question:'Synthetic question',contact_id:own});assert(response.status===200);assert(calls.some(c=>c.path.endsWith('/coach_companion_requests')&&c.body?.contact_id===own));});
Deno.test('member self-service remains own-contact only despite supplied contact ID',async()=>{const {response,calls}=await run(request,{question:'Synthetic question',contact_id:cross},{staff:false});assert(response.status===200);assert(calls.some(c=>c.path.endsWith('/coach_companion_requests')&&c.body?.contact_id===own));assert(!calls.some(c=>c.path.endsWith('/rpc/staff_action_allowed')));});
for(const [name,handler] of [['knowledge',knowledge],['review',review]] as const)Deno.test(name+' requires central active-staff permission before data access',async()=>{const {response,calls}=await run(handler,{action:'resolve'},{allowed:false});assert(response.status===403);assert(!calls.some(c=>/coach_companion_(reviews|requests|knowledge_sources)/.test(c.path)));});
Deno.test('financial access override rejects cross-contact before update or audit',async()=>{const {response,calls}=await run(override,{action:'access_override',activation_id:own,access_status:'active',reason:'Synthetic'});assert(response.status===403);assert(!calls.some(c=>c.method==='PATCH'||c.path.endsWith('/manual_override_audit')));});
for(const [name,handler,idKey] of [['client',clientSign,'client_agreement_id'],['staff',staffSign,'staff_agreement_id']] as const)Deno.test(name+' signing forwards displayed hash and caller JWT to atomic SQL; stale rejection cannot write',async()=>{
 const {response,calls}=await run(handler,{action:'sign',[idKey]:own,signer_name:'Synthetic Signer',accepted_terms:true,expected_content_hash:'displayed-hash'},{signError:true});assert(response.status===409);const rpc=calls.find(c=>c.path.includes('/rpc/sign_'));assert(rpc?.body?.p_expected_content_hash==='displayed-hash');assert(rpc.auth==='Bearer synthetic-caller-token');assert(!calls.some(c=>c.method==='PATCH'||c.path.endsWith('/agreement_acceptances')||c.path.endsWith('/staff_agreement_acceptances')));
});
Deno.test('invalid authentication stops before data lookup',async()=>{const {response,calls}=await run(request,{question:'Synthetic'},{auth:false});assert(response.status===401);assert(calls.length===1);});
