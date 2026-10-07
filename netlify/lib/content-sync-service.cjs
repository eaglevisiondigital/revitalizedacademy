'use strict';
const contract=require('./content-sync-contract.json');
const PROD='voalfpxiyznnqfcqcymd',BETA='bvooallokgfktssadsrv',SITE='ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06',ORIGIN='https://revitalizedacademy.com';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function createHandler({env,fetch:request=fetch}){return async req=>{
 const reply=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 // A beta deploy cannot become a reverse sync route, even if request headers lie.
 if(env('SITE_ID')!==SITE||env('RVA_FOOD_DATABASE_SUPABASE_URL')!==`https://${PROD}.supabase.co`)return reply(403,{error:'Content sync is available only in the production Owner portal'});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 if(req.headers.get('origin')!==ORIGIN||new URL(req.url).hostname!=='revitalizedacademy.com')return reply(403,{error:'Production origin required'});
 const bearer=req.headers.get('authorization');if(!/^Bearer [A-Za-z0-9_.-]+$/.test(bearer||''))return reply(401,{error:'Owner/Admin sign-in required'});
 const source=`https://${PROD}.supabase.co`,target=`https://${BETA}.supabase.co`;
 const publicKey=env('RVA_FOOD_DATABASE_SUPABASE_ANON_KEY'),sourceKey=env('RVA_FOOD_DATABASE_SUPABASE_SERVICE_ROLE_KEY'),targetKey=env('RVA_CONTENT_SYNC_BETA_SERVICE_ROLE_KEY');
 if(!publicKey||!sourceKey||!targetKey)return reply(503,{error:'Protected content sync configuration is incomplete'});
 let actor,job,batch;
 const deadline=AbortSignal.timeout(50000);
 async function rpc(url,key,name,args){
   const response=await request(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args),signal:deadline});
   if(!response.ok){const e=await response.json().catch(()=>({}));throw Object.assign(Error(e.code==='42501'?'Owner/Admin content sync access denied':'Content sync could not finish; no partial beta content was committed'),{status:e.code==='42501'?403:502,confirmedNoCommit:url===target});}return response.json();
 }
 try{
   const auth=await request(source+'/auth/v1/user',{headers:{apikey:publicKey,Authorization:bearer},signal:deadline});if(!auth.ok)return reply(401,{error:'Please sign in again'});
   actor=(await auth.json()).id;if(!uuid.test(actor||''))return reply(401,{error:'Invalid staff session'});
   await rpc(source,sourceKey,'reusable_content_sync_server',{p_actor:actor,p_action:'authorize'});
   const raw=await req.text();if(raw.length>8192)return reply(413,{error:'Select a smaller content group'});
   const body=JSON.parse(raw);if(body.jobId){if(Object.keys(body).length!==1||!uuid.test(body.jobId))return reply(400,{error:'Invalid sync retry'});batch=await rpc(source,sourceKey,'reusable_content_sync_server',{p_actor:actor,p_action:'resume',p_job:body.jobId});}else{if(Object.keys(body).some(k=>k!=='records')||!Array.isArray(body.records)||body.records.length<1||body.records.length>20||body.records.some(r=>!r||Object.keys(r).some(k=>!['id','type'].includes(k))||!contract[r.type]||!uuid.test(r.id||'')))return reply(400,{error:'Select 1–20 supported reusable content records'});
   batch=await rpc(source,sourceKey,'reusable_content_sync_server',{p_actor:actor,p_action:'export',p_records:body.records});}job=batch.job_id;
   if(batch.source_project!==PROD||batch.target_project!==BETA||batch.actor_id!==actor||!uuid.test(job||''))throw Error('Invalid export result');
   const result=await rpc(target,targetKey,'receive_production_content',{p_batch:batch});
   try{await rpc(source,sourceKey,'reusable_content_sync_server',{p_actor:actor,p_action:'complete',p_job:job,p_result:result});}catch{ return reply(202,{status:'audit_pending',jobId:job,records:result.length,message:'Beta content was synced; production audit confirmation needs retry. Do not assume failure or create duplicate content.'}); }
   return reply(200,{status:'complete',jobId:job,records:result.length,message:'Synced to Beta. Production remains authoritative.'});
 }catch(error){
   // A transport failure after a beta commit is uncertain, not a proven failure.
   // Receiving the same immutable job again is idempotent. Retain pending audit
   // for investigation; never overwrite it with an invented failure status.
   if(job&&error.confirmedNoCommit){try{await rpc(source,sourceKey,'reusable_content_sync_server',{p_actor:actor,p_action:'failed',p_job:job});}catch{}}
   return reply(error.status||502,{error:error.status?error.message:'Content sync could not be confirmed; retrying the same selection safely reuses beta mappings',...(job?{jobId:job}:{} )});
 }
};}
module.exports={createHandler,PROD,BETA,SITE,ORIGIN};
