import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import { callerClient } from "../_shared/authorization.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function cors(origin:string|null){
  const safe=origin&&allowedOrigins.has(origin)?origin:edgeEnvironment().appOrigin;
  return {
    "Access-Control-Allow-Origin":safe,
    "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
function json(origin:string|null,data:unknown,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}
  });
}
function clean(v:unknown,max=5000){return String(v||"").trim().slice(0,max);}

export async function handleRequest(req:Request){
  const configError=configurationError();if(configError)return configError;
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{error:"Method not allowed"},405);
  if(origin&&!allowedOrigins.has(origin))return json(origin,{error:"Origin not allowed"},403);

  const supabaseUrl=Deno.env.get("SUPABASE_URL");
  const secretKeys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
  const secretKey=secretKeys.default||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!supabaseUrl||!secretKey)return json(origin,{error:"Service configuration unavailable"},500);

  const admin=createClient(supabaseUrl,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const {data:userData,error:userError}=await admin.auth.getUser(bearer);
  if(userError||!userData.user)return json(origin,{error:"Authentication required"},401);
  const caller=callerClient(supabaseUrl,secretKey,bearer);

  try{
    const body=await req.json();
    const action=String(body.action||"");
    const agreementId=String(body.client_agreement_id||"");

    if(action==="sign"){
      if(body.accepted_terms!==true)return json(origin,{error:"You must accept the agreement terms before signing."},400);
      const signatures=Array.isArray(body.signatures)?body.signatures:[{signer_role:"primary_client",signer_name:body.signer_name}];
      if(signatures.length!==1)return json(origin,{error:"Each adult must sign using their own account."},400);
      const {error}=await caller.rpc("sign_client_agreement_atomic",{
        p_client_agreement_id:agreementId,p_signatures:signatures,
        p_expected_content_hash:body.expected_content_hash||null,p_user_agent:clean(req.headers.get("user-agent"),1000)||null
      });
      if(error)return json(origin,{error:error.message},409);
    }else if(action==="view"||action==="decline"){
      const {error}=await caller.rpc("client_agreement_action",{p_client_agreement_id:agreementId,p_action:action});
      if(error)return json(origin,{error:error.message},403);
    }else return json(origin,{error:"Invalid agreement action."},400);
    const {data:context,error:readError}=await caller.rpc("my_onboarding_context");
    if(readError)throw readError;
    const agreement=context?.agreements?.find((a:{client_agreement_id:string})=>a.client_agreement_id===agreementId);
    return json(origin,{ok:true,agreement,complete:agreement?.status==="signed"});
  }catch(error){
    console.error(error);
    return json(origin,{error:error instanceof Error?error.message:"Agreement operation failed."},500);
  }
}
