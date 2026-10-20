'use strict';
const config=require('../../config/production.json'),pipeline=require('../../js/vitality-roadmap-processing.cjs'),{workerIdentity,sealWithIdentity}=require('./roadmap-processing-seal.cjs');
const site='ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06',origin='https://revitalizedacademy.com';
// Only this trusted server path accepts source answers, from caller-authorized RPC, never browser payloads.
async function processOne(report,rpc,seal){
 const claim=await rpc('claim',report,{});if(!claim.claimed)return rpc('read',report,{});
 const original=pipeline.buildDraft(claim.context),document=pipeline.applyReviews(original,claim.previous_reviews||[]);
 const token=await seal(claim.job,claim.lease,document);
 await rpc('finish',report,{job:claim.job,lease:claim.lease,seal:token,document});
 return rpc('read',report,{}); // Reauthorizes again, including source fingerprint, session and every grant.
}
function createHandler({fetch:request=fetch,identity=()=>workerIdentity(),renderPdf=null}={}){return async(req,ctx)=>{
 const reply=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store, max-age=0','Netlify-CDN-Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Authorization, Origin'}});
 if(ctx?.site?.id!==site||ctx?.deploy?.context!=='production'||new URL(req.url).origin!==origin||req.headers.get('origin')!==origin||new URL(req.url).search)return reply(403,{unavailable:true});
 if(req.method!=='POST')return reply(405,{unavailable:true});
 const jwt=req.headers.get('authorization');if(!/^Bearer [A-Za-z0-9_.-]+$/.test(jwt||''))return reply(401,{unavailable:true});
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply(415,{unavailable:true});
 try{
 const raw=await req.text();if(raw.length>14000)return reply(413,{unavailable:true});const b=JSON.parse(raw);
 if(!b||Array.isArray(b)||Object.keys(b).some(k=>!['action','report','payload'].includes(k))||!['process','read','attest','review','approve','regenerate','pdf'].includes(b.action)||!/^[-a-f0-9]{36}$/.test(b.report||'')||!b.payload||Array.isArray(b.payload)||typeof b.payload!=='object')return reply(400,{unavailable:true});
 if(['process','read','pdf'].includes(b.action)&&Object.keys(b.payload).length)return reply(400,{unavailable:true});
 const call=async(name,args,key,authorization)=>{
 const r=await request(config.supabaseUrl+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify(args),redirect:'error',signal:AbortSignal.timeout(12000)});
 if(!r.ok){const e=await r.json().catch(()=>({}));throw Object.assign(Error('unavailable'),{code:e.code});}return r.json();};
 const rpc=(action,report,payload)=>call('roadmap_processing',{p_action:action,p_report:report,p_payload:payload},config.supabaseKey,jwt);
 if(b.action==='process'){
 await rpc('read',b.report,{});const key=identity();if(!key)return reply(503,{unavailable:true,configurationPending:true});
 return reply(200,await processOne(b.report,rpc,(job,lease,document)=>sealWithIdentity((name,args)=>call(name,args,config.supabaseKey,jwt),key,job,lease,document)));
 }
 if(b.action==='pdf'){
 // Rendering is disabled in the production entrypoint until a separately reviewed runtime is configured.
 const authorized=await rpc('pdf',b.report,{});if(!renderPdf)return reply(503,{unavailable:true,rendererPending:true});
 const bytes=await renderPdf(authorized.document);const fresh=await rpc('pdf',b.report,{});
 if(fresh.version_id!==authorized.version_id)throw Object.assign(Error('Changed source/version'),{code:'40001'});
 return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline','Cache-Control':'private, no-store','Netlify-CDN-Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
 }
 return reply(200,await rpc(b.action,b.report,b.payload));
 }catch(e){return reply(200,{unavailable:true,conflict:e.code==='40001',invalid:e.code==='22023'});}
};}
module.exports={processOne,createHandler};
