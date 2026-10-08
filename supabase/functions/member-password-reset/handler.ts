import { configurationError,edgeEnvironment } from '../_shared/environment.ts';
export type Dependencies={reserve:(email:string)=>Promise<boolean>;eligible:(email:string)=>Promise<boolean>;generate:(email:string)=>Promise<string>;mail:(email:string,url:string)=>Promise<void>};
const message='If that email belongs to an eligible member account, a password reset email will be sent.';
export function createHandler(deps:Dependencies){return async(req:Request)=>{
 const bad=configurationError();if(bad)return bad;
 const env=edgeEnvironment(),origin=req.headers.get('origin');
 const headers={'Access-Control-Allow-Origin':env.appOrigin,'Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(env.environment!=='production'||env.appOrigin!=='https://revitalizedacademy.com')return json({error:'Production lifecycle configuration required'},503);
 if(origin!==env.appOrigin)return json({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return json({});if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const raw=await req.text();if(raw.length>1024)return json({error:'Request too large'},413);
  const body=JSON.parse(raw),email=String(body.email||'').trim().toLowerCase();
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return json({ok:true,message});
  // Persistent reservation precedes identity lookup: all addresses get the same response.
  if(await deps.reserve(email)&&await deps.eligible(email)){
   const url=await deps.generate(email),u=new URL(url);
   if(u.origin!==env.appOrigin||u.pathname!=='/member/password-reset.html'||!u.searchParams.get('token_hash'))throw Error('Invalid recovery URL');
   await deps.mail(email,url);
  }
 }catch{/* Do not log/serialize provider responses, credentials, emails or tokens. */}
 return json({ok:true,message});
};}
