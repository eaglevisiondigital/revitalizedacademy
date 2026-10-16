'use strict';
// Same-origin caller JWT only. No service credential, logger, AI or external scoring endpoint.
const config=require('../../config/production.json'),contract=require('../../js/vitality-roadmap-b5-contract.js'),registry=require('../../config/roadmap-b4/source-map.json');
// Scenario modules use the existing UMD global contract. Load them in a closed context.
const base=require('../../js/vitality-roadmap-b2-engine.js'),engine=require('../../js/vitality-roadmap-b21-engine.js');
const cases=require('../../js/vitality-roadmap-b5-cases.cjs');
function createHandler({fetch:request=fetch}={}){return async(req,context)=>{
 const reply=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store, max-age=0','Netlify-CDN-Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Authorization, Origin'}});
 if(context?.site?.id!=='ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06'||context?.deploy?.context!=='production'||new URL(req.url).origin!=='https://revitalizedacademy.com'||req.headers.get('origin')!=='https://revitalizedacademy.com'||new URL(req.url).search)return reply(403,{unavailable:true});
 if(req.method!=='POST')return reply(405,{unavailable:true});
 const jwt=req.headers.get('authorization');if(!/^Bearer [A-Za-z0-9_.-]+$/.test(jwt||''))return reply(401,{unavailable:true});
 if(!req.headers.get('content-type')?.startsWith('application/json'))return reply(415,{unavailable:true});
 try{
 const raw=await req.text();if(raw.length>24000)return reply(413,{unavailable:true});const b=JSON.parse(raw);
 if(!b||Array.isArray(b)||Object.keys(b).some(k=>!['action','report','payload'].includes(k))||!['authorize','catalog','simulate','list','read','check','history','save'].includes(b.action))return reply(400,{unavailable:true});
 const rpc=async(action,report=null,payload={})=>{const r=await request(config.supabaseUrl+'/rest/v1/rpc/roadmap_b5',{method:'POST',headers:{apikey:config.supabaseKey,Authorization:jwt,'Content-Type':'application/json'},body:JSON.stringify({p_action:action,p_report:report,p_payload:payload}),redirect:'error',signal:AbortSignal.timeout(12000)});if(!r.ok){const e=await r.json().catch(()=>({}));throw Object.assign(Error('unavailable'),{conflict:e.code==='40001',invalid:e.code==='22023'});}return r.json();};
 if(['catalog','simulate'].includes(b.action)){
 if(b.report!=null) return reply(400,{unavailable:true});
 await rpc('authorize');
 if(b.action==='catalog')return reply(200,{cases:cases.map(c=>({id:c.id,title:c.title||c.label||c.id})),pins:contract.pins,parameters:contract.parameterSchema,drivers:base.drivers,weights:engine.weights});
 const p=b.payload;if(!p||Array.isArray(p)||Object.keys(p).some(k=>!['case_id','patch','overrides'].includes(k)))return reply(400,{unavailable:true});
 const c=cases.find(c=>c.id===p.case_id);if(!c)return reply(400,{unavailable:true});
 let result;try{result=contract.simulate(c.input,{patch:p.patch||{},overrides:p.overrides||{}});}catch{return reply(400,{unavailable:true,invalid:true});}
 // Revalidate after synchronous calculation before returning any authenticated result.
 await rpc('authorize');return reply(200,result);
 }
 const result=await rpc(b.action,b.report||null,b.payload||{});
 if(b.action==='read')result.analysis=contract.analyze(result.source,registry,{registry:result.registry_fingerprint,adapter:result.adapter_version});
 return reply(200,result);
 }catch(e){return reply(200,{unavailable:true,conflict:e.conflict===true,invalid:e.invalid===true});}
};}
module.exports={createHandler};
