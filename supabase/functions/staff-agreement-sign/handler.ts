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
  const user=userData.user;
  const caller=callerClient(supabaseUrl,secretKey,bearer);

  try{
    const body=await req.json();
    const action=String(body.action||"");
    const agreementId=String(body.staff_agreement_id||"");

    const {data:agreement,error:agreementError}=await admin.from("staff_agreements")
      .select("*,agreement_templates:agreement_template_id(name,version,status)")
      .eq("id",agreementId)
      .eq("staff_user_id",user.id)
      .maybeSingle();
    if(agreementError)throw agreementError;
    if(!agreement)return json(origin,{error:"Staff agreement not found."},404);

    if(action==="view"){
      if(agreement.status==="sent"){
        const now=new Date().toISOString();
        const {data:updated,error}=await admin.from("staff_agreements").update({
          status:"viewed",
          viewed_at:agreement.viewed_at||now,
          updated_at:now
        }).eq("id",agreement.id).select("*").single();
        if(error)throw error;
        return json(origin,{ok:true,agreement:updated});
      }
      return json(origin,{ok:true,agreement});
    }

    if(action==="sign"){
      if(body.accepted_terms!==true)return json(origin,{error:"You must accept the agreement terms before signing."},400);
      const {data:acceptance,error}=await caller.rpc("sign_my_staff_agreement",{
        p_staff_agreement_id:agreement.id,p_signer_name:clean(body.signer_name,240),p_signature_type:"typed",
        p_expected_content_hash:body.expected_content_hash||null,p_user_agent:clean(req.headers.get("user-agent"),1000)||null
      });
      if(error)return json(origin,{error:error.message},409);
      const {data:updated,error:readError}=await caller.from("staff_agreements").select("*").eq("id",agreement.id).single();
      if(readError)throw readError;
      return json(origin,{ok:true,agreement:updated,acceptance});
    }

    if(action==="decline"){
      if(["signed","waived"].includes(agreement.status))return json(origin,{error:"Completed agreements cannot be declined."},409);
      const now=new Date().toISOString();
      const {data:updated,error}=await admin.from("staff_agreements").update({
        status:"declined",
        updated_at:now
      }).eq("id",agreement.id).select("*").single();
      if(error)throw error;
      return json(origin,{ok:true,agreement:updated});
    }

    return json(origin,{error:"Invalid staff agreement action."},400);
  }catch(error){
    console.error(error);
    return json(origin,{error:error instanceof Error?error.message:"Staff agreement operation failed."},500);
  }
}
