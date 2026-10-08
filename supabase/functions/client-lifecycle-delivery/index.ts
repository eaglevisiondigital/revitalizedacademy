import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { createHandler } from './handler.ts';
function admin(){const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');return createClient(Deno.env.get('SUPABASE_URL')!,keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});}
const htmlEscape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
Deno.serve(createHandler({
 user:async token=>{if(!token)return null;const {data,error}=await admin().auth.getUser(token);return error?null:data.user?.id||null;},
 claim:async(actor,id)=>{const {data,error}=await admin().rpc('claim_production_agreement_delivery',{p_actor:actor,p_agreement_id:id});if(error)throw Error('Delivery not permitted');return data;},
 finish:async(actor,id,message)=>{const {error}=await admin().rpc('finish_production_agreement_delivery',{p_actor:actor,p_job_id:id,p_message_id:message});if(error)throw Error('Delivery state unavailable');},
 send:async job=>{const key=Deno.env.get('RESEND_API_KEY');if(!key)throw Error('Mail unavailable');const link=job.body.match(/https:\/\/[^\s<>"']+/)?.[0];if(!link)throw Error('Invitation unavailable');
  const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'rva-production-agreement-'+job.id},body:JSON.stringify({from:Deno.env.get('REVITALIZED_EMAIL_FROM')||'ReVitalized Academy <noreply@auth.revitalizedacademy.com>',to:[job.recipient],subject:job.subject,text:job.body,html:'<main style="font-family:Arial,sans-serif;color:#154734"><h1>Your agreement is ready</h1><p>Create or sign in to your own account, verify your email, then reopen this invitation to review and sign your agreement.</p><p><a style="display:inline-block;padding:14px;background:#154734;color:white" href="'+htmlEscape(link)+'">Review My Agreement</a></p><p>'+htmlEscape(job.body)+'</p></main>'})});const data=await response.json();if(!response.ok||!data.id)throw Error('Mail unavailable');return String(data.id);
 }
}));
