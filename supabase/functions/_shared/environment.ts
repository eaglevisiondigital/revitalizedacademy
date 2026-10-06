/** Server-only configuration. Every handler validates before any data/provider request. */
const productionRef='voalfpxiyznnqfcqcymd';
const productionOrigins=['https://revitalizedacademy.com','https://www.revitalizedacademy.com','https://revitalizedacademy.netlify.app'];
export function edgeEnvironment(get=(key:string)=>Deno.env.get(key)){
 const environment=get('RVA_ENVIRONMENT'),supabaseUrl=get('SUPABASE_URL'),appOrigin=get('RVA_APP_ORIGIN');
 if(!environment||!['production','staging','local'].includes(environment)||!supabaseUrl||!appOrigin)throw Error('Missing explicit Edge environment, Supabase URL or application origin');
 const local=environment==='local';
 for(const value of [supabaseUrl,appOrigin]){
  const u=new URL(value);
  if(u.origin!==value||u.username||u.password||(u.protocol!=='https:'&&!(local&&u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))))throw Error('Invalid Edge origin');
 }
 const host=new URL(supabaseUrl).hostname;
 if(!local&&!/^[a-z]{20}\.supabase\.co$/.test(host))throw Error('Hosted Supabase project URL required');
 if(environment!=='production'&&(host.split('.')[0]===productionRef||productionOrigins.includes(appOrigin)))throw Error('Staging/local refuses production bindings');
 if(environment==='production'&&(host!==productionRef+'.supabase.co'||!productionOrigins.includes(appOrigin)))throw Error('Production mapping mismatch');
 if(environment!=='production'&&get('RVA_PAYMENT_MODE')!=='synthetic')throw Error('Staging/local payments must be synthetic');
 const fallbackOrigins=(get('RVA_FALLBACK_ORIGINS')||'').split(',').map(value=>value.trim()).filter(Boolean);
 if(fallbackOrigins.length>3)throw Error('Too many fallback origins');
 if(environment!=='production')for(const value of fallbackOrigins){
  const u=new URL(value);
  if(u.origin!==value||u.username||u.password||u.protocol!=='https:'||productionOrigins.includes(value)||u.hostname.endsWith('.supabase.co'))throw Error('Unsafe fallback origin');
 }
 const deployment=get('DENO_DEPLOYMENT_ID');
 if(deployment&&!deployment.startsWith(host.split('.')[0]+'_'))throw Error('Edge runtime project does not match configured project');
 return {environment,supabaseUrl,appOrigin,allowedOrigins:environment==='production'?productionOrigins:[...new Set([appOrigin,...fallbackOrigins])],
  onboardingUrl:appOrigin+'/member/onboarding/',signerUrl:appOrigin+'/member/onboarding/',recoveryRedirect:appOrigin+'/portal/password-reset.html',staffRedirect:appOrigin+'/portal/'};
}
export const allowedOrigins={has:(origin:string)=>edgeEnvironment().allowedOrigins.includes(origin)};
export function configurationError(){try{edgeEnvironment();return null;}catch{return new Response(JSON.stringify({error:'Environment configuration unavailable; connections disabled'}),{status:503,headers:{'Content-Type':'application/json'}});}}
export function assertSyntheticRecipient(email:string){
 if(edgeEnvironment().environment==='production')return;
 const allowed=(Deno.env.get('RVA_SYNTHETIC_EMAIL_ALLOWLIST')||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!allowed.includes(email.trim().toLowerCase()))throw Error('Recipient is not an approved synthetic staging inbox');
}
export function assertNotification(job:{recipient?:string;body?:string;channel?:string}){
 if(edgeEnvironment().environment==='production')return;
 if(job.channel&&job.channel!=='email')throw Error('SMS is disabled in staging');
 assertSyntheticRecipient(job.recipient||'');
 for(const match of (job.body||'').matchAll(/https?:\/\/[^\s<>"']+/g))if(new URL(match[0]).origin!==edgeEnvironment().appOrigin)throw Error('Notification URL leaves staging origin');
}
