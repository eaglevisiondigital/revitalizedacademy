import { configurationError,edgeEnvironment } from '../_shared/environment.ts';
type Job={id:string;recipient:string;subject:string;body:string};
export type Dependencies={user:(bearer:string)=>Promise<string|null>;claim:(actor:string,id:string)=>Promise<Job|null>;send:(job:Job)=>Promise<string>;finish:(actor:string,job:string,id:string|null)=>Promise<void>};
export function createHandler(deps:Dependencies){return async(req:Request)=>{
 const bad=configurationError();if(bad)return bad;const env=edgeEnvironment(),origin=req.headers.get('origin');
 const headers={'Access-Control-Allow-Origin':env.appOrigin,'Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(env.environment!=='production'||env.appOrigin!=='https://revitalizedacademy.com')return json({error:'Production lifecycle configuration required'},503);
 if(origin!==env.appOrigin)return json({error:'Origin not allowed'},403);if(req.method==='OPTIONS')return json({});if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const actor=await deps.user((req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''));if(!actor)return json({error:'Authentication required'},401);
 try{const raw=await req.text();if(raw.length>1024)return json({error:'Request too large'},413);const body=JSON.parse(raw),id=String(body.client_agreement_id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return json({error:'Valid agreement required'},400);
  const job=await deps.claim(actor,id);if(!job)return json({ok:true,queued_or_already_processed:true});
  try{
   // This queue is production-only. Never send a beta URL or arbitrary external action URL.
   const links=Array.from(job.body.matchAll(/https?:\/\/[^\s<>"']+/g),match=>new URL(match[0]));
   if(!links.length||links.some(url=>url.origin!==env.appOrigin||url.pathname!=='/member/onboarding/'))throw Error('Invalid invitation URL');
   const messageId=await deps.send(job);await deps.finish(actor,job.id,messageId);return json({ok:true,provider_accepted:true});
  }catch{await deps.finish(actor,job.id,null);return json({error:'Agreement saved; email delivery was not accepted. Review status and retry.'},502);}
 }catch{return json({error:'Agreement delivery not permitted or unavailable'},403);}
};}
