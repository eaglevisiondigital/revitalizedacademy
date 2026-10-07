"use strict";
const {normalize,search,slug,pin}=require('./repdb.cjs');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function createHandler({env,rows,fetch:request=fetch}){return async(req,context={})=>{
 const respond=(code,data)=>Response.json(data,{status:code,headers:{'Cache-Control':'no-store'}});
 if(req.method!=='POST')return respond(405,{error:'POST required'});
 try{
  const url=env('RVA_FOOD_DATABASE_SUPABASE_URL'),anon=env('RVA_FOOD_DATABASE_SUPABASE_ANON_KEY'),service=env('RVA_FOOD_DATABASE_SUPABASE_SERVICE_ROLE_KEY');
  const sites={'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06':['https://voalfpxiyznnqfcqcymd.supabase.co','https://revitalizedacademy.com'],'071b252e-a922-4846-a784-8dca1edad377':['https://bvooallokgfktssadsrv.supabase.co','https://beta.revitalizedacademy.com']};
  const site=sites[context.site?.id];if(!site||site[0]!==url||!anon||!service)return respond(503,{error:'Exercise library environment is not configured'});
  if(req.headers.get('origin')!==site[1]||new URL(req.url).origin!==site[1])return respond(403,{error:'Exercise library origin denied'});
  const bearer=req.headers.get('authorization');if(!/^Bearer [A-Za-z0-9_.-]+$/.test(bearer||''))return respond(401,{error:'Staff sign-in required'});
  const auth=await request(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:bearer},signal:AbortSignal.timeout(10000)});
  if(!auth.ok)return respond(401,{error:'Staff sign-in required'});const actor=(await auth.json()).id;if(!uuid.test(actor||''))return respond(401,{error:'Invalid staff identity'});
  async function rpc(action,value=null,method=null){const r=await request(url+'/rest/v1/rpc/exercise_library_server',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify({p_actor:actor,p_action:action,p_value:value,p_methodology:method}),signal:AbortSignal.timeout(15000)});if(!r.ok){const e=await r.json().catch(()=>({}));throw Object.assign(Error(e.code==='42501'?'Owner/Admin exercise access required':'Exercise library operation failed'),{status:e.code==='42501'?403:400});}return r.json();}
  await rpc('authorize'); // authoritative active role+permission before any licensed data is returned
  const raw=await req.text();if(raw.length>2048)return respond(413,{error:'Request too large'});const body=JSON.parse(raw);
  if(Object.keys(body).some(k=>!['action','query','id','methodologyId'].includes(k)))throw Error('Invalid request field');
  if(body.action==='search')return respond(200,{exercises:search(rows,body.query),version:pin.commit,attribution:'Exercise data by RepDB (repdb.co)'});
  if(!['import','refresh'].includes(body.action))throw Error('Invalid exercise action');slug(body.id);const row=rows.find(r=>r.id===body.id);if(!row)throw Error('Source exercise unavailable');
  if(body.action==='import'&&!uuid.test(body.methodologyId||''))throw Error('Choose a fitness methodology');
  return respond(200,{exercise:await rpc(body.action,normalize(row),body.methodologyId||null)});
 }catch(e){return respond(e.status||400,{error:e.status?e.message:'Invalid exercise library request'});}
};}
module.exports={createHandler};
