import { edgeEnvironment, assertSyntheticRecipient } from './environment.ts';

/** Exact static allowlist OR audited existing-client Owner approval. Never used by production. */
export async function assertApprovedBetaNotification(job:{recipient?:string;body?:string;channel?:string},admin:{rpc:Function}){
 const env=edgeEnvironment();
 if(env.environment==='production')return;
 // Validate channel and every URL independently before any dynamic recipient exception.
 if(job.channel&&job.channel!=='email')throw Error('SMS is disabled in staging');
 for(const match of (job.body||'').matchAll(/https?:\/\/[^\s<>"']+/g))if(new URL(match[0]).origin!==env.appOrigin)throw Error('Notification URL leaves staging origin');
 try{assertSyntheticRecipient(job.recipient||'');return;}catch{
  if(env.environment!=='staging'||env.supabaseUrl!=='https://bvooallokgfktssadsrv.supabase.co'||env.appOrigin!=='https://beta.revitalizedacademy.com')throw Error('Recipient is not an approved synthetic staging inbox');
  const {data,error}=await admin.rpc('beta_test_recipient_approved',{p_email:(job.recipient||'').trim().toLowerCase()});
  if(error||data!==true)throw Error('Recipient is not an approved synthetic staging inbox');
 }
}
