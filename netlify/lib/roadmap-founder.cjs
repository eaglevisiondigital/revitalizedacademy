'use strict';
// No service role, external processing, source logging, caching or arbitrary RPC proxy.
const config=require('../../config/production.json');
const site='ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06',origin='https://revitalizedacademy.com';
const actions=new Set(['authorize','list','read','check','version','save']);
function createHandler({fetch:request=fetch}={}){
 return async(req,context)=>{
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store, max-age=0','Netlify-CDN-Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Authorization, Origin'}});
  if(context?.site?.id!==site||context?.deploy?.context!=='production'||new URL(req.url).origin!==origin||req.headers.get('origin')!==origin)return reply(403,{error:'Founder workspace unavailable'});
  if(req.method!=='POST')return reply(405,{error:'POST required'});
  const bearer=req.headers.get('authorization');
  if(!/^Bearer [A-Za-z0-9_.-]+$/.test(bearer||''))return reply(401,{error:'Fresh founder sign-in required'});
  if(!req.headers.get('content-type')?.startsWith('application/json'))return reply(415,{error:'JSON required'});
  try{
   const raw=await req.text();if(raw.length>140000)return reply(413,{error:'Draft is too large'});
   const body=JSON.parse(raw);
   if(!body||Array.isArray(body)||typeof body!=='object'||!actions.has(body.action)||Object.keys(body).some(k=>!['action','report','payload'].includes(k)))return reply(400,{error:'Invalid founder request'});
   const result=await request(config.supabaseUrl+'/rest/v1/rpc/roadmap_b4',{method:'POST',headers:{apikey:config.supabaseKey,Authorization:bearer,'Content-Type':'application/json'},body:JSON.stringify({p_action:body.action,p_report:body.report||null,p_payload:body.payload||{}}),signal:AbortSignal.timeout(12000),redirect:'error'});
   if(!result.ok){const e=await result.json().catch(()=>({}));return reply(200,{unavailable:true,conflict:e.code==='40001',error:e.code==='40001'?'Source or draft changed. Close and reload; source changes require renewed cohort approval.':'Founder review unavailable for this account, session, cohort or review state.'});}
   return reply(200,await result.json());
  }catch{return reply(503,{error:'Founder review unavailable. Close and retry with a valid session.'});}
 };
}
module.exports={createHandler};
