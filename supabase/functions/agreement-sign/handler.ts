import { callerClient } from "../_shared/authorization.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const allowedOrigins=new Set([
  "https://revitalizedacademy.com",
  "https://www.revitalizedacademy.com",
  "http://localhost:3000",
  "http://localhost:5173"
]);

function cors(origin:string|null){
  const safe=origin&&allowedOrigins.has(origin)?origin:"https://revitalizedacademy.com";
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
    const agreementId=String(body.client_agreement_id||"");

    const {data:agreement,error:agreementError}=await admin.from("client_agreements")
      .select("*,agreement_templates:agreement_template_id(name,version,content_hash,status)")
      .eq("id",agreementId).maybeSingle();
    if(agreementError)throw agreementError;
    if(!agreement)return json(origin,{error:"Agreement not found."},404);

    const {data:access,error:accessError}=await admin.from("client_access")
      .select("contact_id,status").eq("user_id",user.id).eq("contact_id",agreement.contact_id).maybeSingle();
    if(accessError)throw accessError;
    if(!access||access.status!=="active")return json(origin,{error:"You do not have access to this agreement."},403);

    if(action==="view"){
      if(agreement.status==="not_sent"||agreement.status==="sent"){
        const now=new Date().toISOString();
        const {data:updated,error}=await admin.from("client_agreements").update({
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
      const signatures=Array.isArray(body.signatures)?body.signatures:[{signer_role:"primary_client",signer_name:body.signer_name}];
      if(signatures.length<Number(agreement.required_client_signatures||1))return json(origin,{error:"All required client signatures are required."},400);
      const {error}=await caller.rpc("sign_client_agreement_atomic",{
        p_client_agreement_id:agreement.id,p_signatures:signatures,
        p_expected_content_hash:body.expected_content_hash||null,p_user_agent:clean(req.headers.get("user-agent"),1000)||null
      });
      if(error)return json(origin,{error:error.message},409);
      const {data:updated,error:readError}=await caller.from("client_agreements").select("*").eq("id",agreement.id).single();
      if(readError)throw readError;
      return json(origin,{ok:true,agreement:updated,complete:updated.status==="signed"});
    }

    if(action==="decline"){
      if(["signed","waived"].includes(agreement.status))return json(origin,{error:"Completed agreements cannot be declined."},409);
      const now=new Date().toISOString();
      const {data:updated,error}=await admin.from("client_agreements").update({
        status:"declined",
        declined_at:now,
        updated_at:now
      }).eq("id",agreement.id).select("*").single();
      if(error)throw error;

      await admin.from("contact_activity").insert({
        contact_id:agreement.contact_id,
        activity_type:"agreement_declined",
        title:"Membership agreement declined",
        detail:agreement.agreement_key+" · v"+agreement.template_version,
        actor_user_id:user.id,
        metadata:{client_agreement_id:agreement.id}
      });

      return json(origin,{ok:true,agreement:updated});
    }

    return json(origin,{error:"Invalid agreement action."},400);
  }catch(error){
    console.error(error);
    return json(origin,{error:error instanceof Error?error.message:"Agreement operation failed."},500);
  }
}
