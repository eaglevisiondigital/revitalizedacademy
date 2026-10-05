import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
import {createHandler} from './handler.ts';
import {edgeEnvironment,assertSyntheticRecipient} from '../_shared/environment.ts';
function admin(){const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;if(!key)throw Error('Configuration');return createClient(edgeEnvironment().supabaseUrl,key,{auth:{persistSession:false,autoRefreshToken:false}});}
Deno.serve(createHandler({
 rpc:async(action,hash,next,payload)=>{const {data,error}=await admin().rpc('vitality_resume_command',{p_action:action,p_hash:hash,p_next_hash:next,p_payload:payload});if(error)throw {code:error.code};return data;},
 mail:async(recipient,url)=>{
  assertSyntheticRecipient(recipient);
  const key=Deno.env.get('RESEND_API_KEY');if(!key)throw Error('Configuration');
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({
   from:Deno.env.get('REVITALIZED_EMAIL_FROM')||'ReVitalized Academy <noreply@auth.revitalizedacademy.com>',to:[recipient],subject:'Continue Your Vitality Assessment',
   text:`ReVitalized Academy\n\nContinue your free Vitality Assessment securely:\n${url}\n\nThis private link expires after 30 days. Successful saves extend your session’s 30-day inactivity window. Do not forward this email. If you did not request it, you can ignore it.`,
   html:`<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#17382b"><main style="max-width:560px;margin:auto;padding:24px"><h1>ReVitalized Academy</h1><h2>Continue Your Vitality Assessment</h2><p>Your private link lets you continue your free assessment without creating a member account.</p><p><a href="${url}" style="display:inline-block;background:#17382b;color:white;padding:16px 24px;border-radius:8px">Continue Your Vitality Assessment</a></p><p>This link expires after 30 days. Successful saves extend your session’s 30-day inactivity window.</p><p>Keep this link private. If you did not request it, you can ignore this email.</p></main></body></html>`
  }),signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Delivery unavailable');
 },
 final:async(form)=>{const response=await fetch(edgeEnvironment().appOrigin+'/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form,signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Final delivery unavailable');}
}));
