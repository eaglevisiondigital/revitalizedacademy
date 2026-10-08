import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { createHandler } from './handler.ts';
import { edgeEnvironment } from '../_shared/environment.ts';
const get=(key:string)=>Deno.env.get(key);
function admin(){const keys=JSON.parse(get('SUPABASE_SECRET_KEYS')||'{}');return createClient(get('SUPABASE_URL')!,keys.default||get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});}
const htmlEscape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
Deno.serve(createHandler({
 reserve:async email=>{const {data,error}=await admin().rpc('reserve_production_member_recovery',{p_email:email});if(error)throw Error('Recovery unavailable');return data===true;},
 eligible:async email=>{
  const db=admin(),{data:contacts,error}=await db.from('contacts').select('id').eq('email',email).limit(2);if(error||contacts?.length!==1)return false;
  const result=await db.from('client_access').select('user_id').eq('contact_id',contacts[0].id).in('status',['ready','invited','onboarding','active','payment_suspended']).not('user_id','is',null).limit(2);if(result.error||result.data?.length!==1)return false;
  const user=await db.auth.admin.getUserById(result.data[0].user_id);return !user.error&&!!user.data.user?.email_confirmed_at&&user.data.user.email?.trim().toLowerCase()===email;
 },
 generate:async email=>{const env=edgeEnvironment(),{data,error}=await admin().auth.admin.generateLink({type:'recovery',email});if(error||!data.properties?.hashed_token)throw Error('Recovery unavailable');return env.appOrigin+'/member/password-reset.html?token_hash='+encodeURIComponent(data.properties.hashed_token);},
 mail:async(email,url)=>{
  const key=get('RESEND_API_KEY');if(!key)throw Error('Mail unavailable');
  const res=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from:get('REVITALIZED_EMAIL_FROM')||'ReVitalized Academy <noreply@auth.revitalizedacademy.com>',to:[email],subject:'Reset your ReVitalized Academy member password',text:'Use the secure page to choose your new password:\n'+url+'\nIf you did not request this, ignore this email.',html:'<main style="font-family:Arial,sans-serif;color:#154734"><h1>Reset your ReVitalized Academy password</h1><p>Choose your new password on our secure page.</p><p><a style="display:inline-block;padding:14px;background:#154734;color:#fff" href="'+htmlEscape(url)+'">Change My Password</a></p><p>If you did not request this, you can ignore this email.</p></main>'})});if(!res.ok)throw Error('Mail unavailable');
 }
}));
