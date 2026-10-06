import { handleRequest } from '../../supabase/functions/staff-management/handler.ts';
function assert(value:unknown,message='Assertion failed'):asserts value{if(!value)throw Error(message);}
const actor='10000000-0000-4000-8000-000000000001',target='10000000-0000-4000-8000-000000000002';
async function run(options:{existingStaff?:boolean;permission?:boolean;active?:boolean;bound?:boolean;role?:string;newUser?:boolean}={}){
 const env=Deno.env.get,fetch=globalThis.fetch;const calls:Array<{path:string;method:string;body:any;search:string}>=[];
 Deno.env.get=k=>({RVA_ENVIRONMENT:'local',RVA_APP_ORIGIN:'https://synthetic.invalid',RVA_PAYMENT_MODE:'synthetic',RVA_SYNTHETIC_EMAIL_ALLOWLIST:'beta@example.invalid',SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-key'}[k]);
 globalThis.fetch=async(input,init)=>{
  const request=new Request(input,init),url=new URL(request.url),text=await request.text(),body=text?JSON.parse(text):null;calls.push({path:url.pathname,method:request.method,body,search:url.search});
  let data:any=null;
  if(url.pathname==='/auth/v1/user')data={id:actor,email:'operator@example.invalid'};
  else if(url.pathname.endsWith('/rpc/staff_action_allowed')){assert(request.headers.get('authorization')==='Bearer caller');data=options.permission!==false;}
  else if(url.pathname==='/auth/v1/admin/users')data={users:options.newUser?[]:[{id:target,email:'beta@example.invalid'}]};
  else if(url.pathname==='/auth/v1/invite')data={id:target,email:'beta@example.invalid'};
  else if(url.pathname.endsWith('/staff_access'))data=request.method==='GET'?(url.search.includes(actor)?{user_id:actor,role:options.role||'admin',status:options.active===false?'inactive':'active'}:options.existingStaff?{user_id:target,role:'owner',status:'active'}:null):null;
  else if(url.pathname.endsWith('/profiles'))data=request.method==='GET'?(url.search.includes('user_id=eq.')?{contact_id:'bound-contact'}:[]):null;
  else if(url.pathname.endsWith('/contacts'))data={id:'bound-contact',email:'beta@example.invalid',lifecycle_stage:'client',follow_up_status:'active'};
  else if(url.pathname.endsWith('/staff_invitations'))data={id:'invite'};
  return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
 };
 try{const response=await handleRequest(new Request('https://synthetic.invalid/function',{method:'POST',headers:{authorization:'Bearer caller','content-type':'application/json'},body:JSON.stringify({action:'invite',email:'beta@example.invalid',display_name:'Synthetic Beta',role:'coach',contact_scope:'assigned'})}));return{response,calls};}
 finally{Deno.env.get=env;globalThis.fetch=fetch;}
}
Deno.test('beta duplicate staff invite cannot demote an existing owner or mutate contacts',async()=>{const {response,calls}=await run({existingStaff:true});assert(response.status===409);assert(!calls.some(c=>['PATCH','DELETE'].includes(c.method)||c.path.endsWith('/staff_access')&&c.method==='POST'||c.path.endsWith('/contacts')));});
for(const option of [{permission:false},{active:false}])Deno.test('beta staff invitation denies missing authority '+JSON.stringify(option),async()=>{const {response,calls}=await run(option);assert(response.status===403);assert(!calls.some(c=>c.path.includes('/admin/users')||c.path==='/auth/v1/invite'||c.method==='PATCH'));});
Deno.test('beta existing account invitation preserves profile binding and client lifecycle',async()=>{const {response,calls}=await run();assert(response.status===200,await response.text());assert(!calls.some(c=>['PATCH','POST'].includes(c.method)&&(/\/(profiles|contacts)$/.test(c.path))));const staff=calls.find(c=>c.path.endsWith('/staff_access')&&c.method==='POST');assert(staff?.body.role==='coach'&&staff?.body.contact_scope==='assigned');assert(!calls.some(c=>c.path==='/auth/v1/invite'));});
Deno.test('beta new staff invitation uses the normal Auth invitation and narrow staff insertion',async()=>{const {response,calls}=await run({newUser:true});assert(response.status===200,await response.text());assert(calls.filter(c=>c.path==='/auth/v1/invite').length===1);assert(calls.filter(c=>c.path.endsWith('/staff_access')&&c.method==='POST').length===1);assert(!calls.some(c=>c.method==='PATCH'));});

async function runReconcile(options:{role?:string;onboarding?:string;collision?:boolean;email?:string}={}){
 const env=Deno.env.get,fetch=globalThis.fetch;const calls:Array<{path:string;method:string;body:any;search:string}>=[];
 const nextEmail=options.email||'beta@example.invalid',oldEmail='old-beta@example.invalid';
 Deno.env.get=k=>({RVA_ENVIRONMENT:'local',RVA_APP_ORIGIN:'https://synthetic.invalid',RVA_PAYMENT_MODE:'synthetic',RVA_SYNTHETIC_EMAIL_ALLOWLIST:'beta@example.invalid',SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-key'}[k]);
 globalThis.fetch=async(input,init)=>{
  const request=new Request(input,init),url=new URL(request.url),text=await request.text(),body=text?JSON.parse(text):null;calls.push({path:url.pathname,method:request.method,body,search:url.search});
  let data:any=null;
  if(url.pathname==='/auth/v1/user')data={id:actor,email:'operator@example.invalid'};
  else if(url.pathname.endsWith('/rpc/staff_action_allowed'))data=true;
  else if(url.pathname.endsWith('/staff_access')){
   data=url.search.includes(actor)
    ?{user_id:actor,role:options.role||'owner',status:'active'}
    :{user_id:target,role:'coach',display_name:'Synthetic Beta',status:'active',onboarding_status:options.onboarding||'pending',contact_scope:'assigned'};
  }
  else if(url.pathname===`/auth/v1/admin/users/${target}`){
   data=request.method==='GET'?{id:target,email:oldEmail,email_confirmed_at:null,user_metadata:{staff_invite:true}}:{id:target,email:nextEmail};
  }
  else if(url.pathname==='/auth/v1/admin/users')data={users:options.collision?[{id:'other',email:nextEmail}]:[{id:target,email:oldEmail}]};
  else if(url.pathname.endsWith('/profiles'))data={contact_id:'bound-contact'};
  else if(url.pathname.endsWith('/contacts'))data=request.method==='GET'?[]:{id:'bound-contact',email:nextEmail};
  else if(url.pathname.endsWith('/staff_invitations'))data=[];
  else if(url.pathname.endsWith('/staff_access_audit'))data=[];
  else if(url.pathname==='/auth/v1/resend')data={};
  return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
 };
 try{
  const response=await handleRequest(new Request('https://synthetic.invalid/function',{method:'POST',headers:{authorization:'Bearer caller','content-type':'application/json'},body:JSON.stringify({action:'reconcile_pending_email',user_id:target,email:nextEmail,reason:'Replace rejected staging plus-address.'})}));
  return{response,calls};
 }finally{Deno.env.get=env;globalThis.fetch=fetch;}
}

Deno.test('pending staff email reconciliation preserves identity and reissues one setup message',async()=>{
 const {response,calls}=await runReconcile();assert(response.status===200,await response.text());
 const authUpdates=calls.filter(c=>c.path===`/auth/v1/admin/users/${target}`&&['PUT','PATCH'].includes(c.method));
 assert(authUpdates.length===1&&authUpdates[0].body.email==='beta@example.invalid');
 assert(calls.some(c=>c.path.endsWith('/contacts')&&['PUT','PATCH'].includes(c.method)));
 assert(calls.some(c=>c.path.endsWith('/staff_invitations')&&['PUT','PATCH'].includes(c.method)));
 assert(calls.filter(c=>c.path==='/auth/v1/resend').length===1);
 assert(!calls.some(c=>c.path==='/auth/v1/invite'||c.method==='DELETE'));
});
Deno.test('pending staff email reconciliation is owner-only',async()=>{
 const {response,calls}=await runReconcile({role:'admin'});assert(response.status===403);
 assert(!calls.some(c=>c.path.startsWith('/auth/v1/admin/users')));
});
Deno.test('pending staff email reconciliation refuses completed onboarding and collisions',async()=>{
 for(const options of [{onboarding:'complete'},{collision:true}]){
  const {response,calls}=await runReconcile(options);assert(response.status===409);
  assert(!calls.some(c=>c.path===`/auth/v1/admin/users/${target}`&&['PUT','PATCH'].includes(c.method)));
  assert(!calls.some(c=>c.path==='/auth/v1/resend'));
 }
});
