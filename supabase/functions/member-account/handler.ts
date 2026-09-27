import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import { callerClient } from "../_shared/authorization.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function cors(origin: string | null) {
  const safe = origin && allowedOrigins.has(origin) ? origin : edgeEnvironment().appOrigin;
  return {
    "Access-Control-Allow-Origin": safe,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(origin: string | null, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export async function handleRequest(req:Request){
  const configError=configurationError();if(configError)return configError;
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{error:"Sign in at /member/onboarding/ to open your enrollment."},405);
  if(origin&&!allowedOrigins.has(origin))return json(origin,{error:"Origin not allowed"},403);
  const url=Deno.env.get("SUPABASE_URL");
  const keys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
  const key=keys.default||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)return json(origin,{error:"Service configuration unavailable"},500);
  const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.auth.getUser(bearer);
  if(error||!data.user)return json(origin,{error:"Authentication required"},401);
  try{
    const body=await req.json();
    const caller=callerClient(url,key,bearer);
    const {error:claimError}=await caller.rpc("claim_onboarding_enrollment",{p_token:String(body.token||"")});
    if(claimError)return json(origin,{error:claimError.message},403);
    return json(origin,{ok:true,login_url:"/member/onboarding/"});
  }catch{return json(origin,{error:"Unable to open enrollment"},400);}
}
