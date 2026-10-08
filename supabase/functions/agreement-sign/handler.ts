import {configurationError,edgeEnvironment} from '../_shared/environment.ts';
export type Dependencies={verified:(bearer:string)=>Promise<boolean>;rpc:(bearer:string,name:string,args:Record<string,unknown>)=>Promise<void>};
export function createHandler(deps:Dependencies){return async(req:Request)=>{
 const bad=configurationError();if(bad)return bad;const env=edgeEnvironment(),origin=req.headers.get('origin'),headers={'Access-Control-Allow-Origin':env.appOrigin,'Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(env.environment!=='production'||env.appOrigin!=='https://revitalizedacademy.com')return json({error:'Production lifecycle configuration required'},503);
 if(origin!==env.appOrigin)return json({error:'Origin not allowed'},403);if(req.method==='OPTIONS')return json({});if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const bearer=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!bearer||!(await deps.verified(bearer)))return json({error:'Verified authentication required'},401);
 try{const raw=await req.text();if(raw.length>8192)return json({error:'Request too large'},413);const body=JSON.parse(raw),id=String(body.client_agreement_id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return json({error:'Valid agreement required'},400);
  if(body.action==='sign'){
   const signatures=body.signatures||[{signer_role:'primary_client',signer_name:body.signer_name}];
   if(body.accepted_terms!==true||!Array.isArray(signatures)||signatures.length!==1||typeof body.expected_content_hash!=='string'||!body.expected_content_hash)return json({error:'One adult, accepted terms and the current agreement hash are required'},400);
   await deps.rpc(bearer,'sign_client_agreement_atomic',{p_client_agreement_id:id,p_signatures:signatures,p_expected_content_hash:body.expected_content_hash,p_user_agent:(req.headers.get('user-agent')||'').slice(0,1000)});
  }else if(['view','decline'].includes(body.action))await deps.rpc(bearer,'client_agreement_action',{p_client_agreement_id:id,p_action:body.action});else return json({error:'Invalid agreement action'},400);
  return json({ok:true});
 }catch{return json({error:'Agreement unavailable or changed. Reload before signing.'},409);}
};}
