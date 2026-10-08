import {configurationError,edgeEnvironment} from '../_shared/environment.ts';
export type Dependencies={verified:(bearer:string)=>Promise<boolean>;claim:(bearer:string,token:string)=>Promise<void>};
export function createHandler(deps:Dependencies){return async(req:Request)=>{
 const bad=configurationError();if(bad)return bad;const env=edgeEnvironment(),origin=req.headers.get('origin'),headers={'Access-Control-Allow-Origin':env.appOrigin,'Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(env.environment!=='production'||env.appOrigin!=='https://revitalizedacademy.com')return json({error:'Production lifecycle configuration required'},503);
 if(origin!==env.appOrigin)return json({error:'Origin not allowed'},403);if(req.method==='OPTIONS')return json({});if(req.method!=='POST')return json({error:'Sign in through the Enrollment & Signature Center.'},405);
 const bearer=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!bearer||!(await deps.verified(bearer)))return json({error:'Verified sign-in required'},401);
 try{const raw=await req.text();if(raw.length>1024)return json({error:'Request too large'},413);const body=JSON.parse(raw);if(!/^[a-f0-9]{64}$/.test(body.token||''))return json({error:'Enrollment invitation unavailable'},403);await deps.claim(bearer,body.token);return json({ok:true,login_url:'/member/onboarding/'});}catch{return json({error:'Enrollment invitation unavailable for this verified account'},403);}
};}
