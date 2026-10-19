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
async function sha256(value:string){
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

Deno.serve(async(req:Request)=>{
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
      if(["signed","waived"].includes(agreement.status)){
        return json(origin,{error:"This staff agreement has already been completed."},409);
      }
      if(agreement.status==="declined"){
        return json(origin,{error:"This agreement was declined. Contact an Owner or Administrator."},409);
      }

      const signerName=clean(body.signer_name,240);
      if(!signerName)return json(origin,{error:"Type your legal name to sign."},400);
      if(!Boolean(body.accepted_terms))return json(origin,{error:"You must accept the agreement terms before signing."},400);
      if(!agreement.rendered_content_hash)return json(origin,{error:"Agreement integrity hash is missing."},409);
      const actualHash=await sha256(agreement.rendered_content_text||"");
      if(actualHash!==agreement.rendered_content_hash){
        return json(origin,{error:"Agreement integrity check failed. Please contact a ReVitalized owner or administrator."},409);
      }

      const now=new Date().toISOString();
      const {data:acceptance,error:acceptanceError}=await admin.from("staff_agreement_acceptances").upsert({
        staff_agreement_id:agreement.id,
        staff_user_id:user.id,
        signer_name:signerName,
        signer_email:user.email||null,
        signature_type:"typed",
        accepted_terms:true,
        content_hash:agreement.rendered_content_hash,
        signed_at:now,
        user_agent:clean(req.headers.get("user-agent"),1000)||null,
        metadata:{agreement_key:agreement.agreement_key,template_version:agreement.template_version}
      },{onConflict:"staff_agreement_id"}).select("*").single();
      if(acceptanceError)throw acceptanceError;

      const {data:updated,error:updateError}=await admin.from("staff_agreements").update({
        status:"signed",
        viewed_at:agreement.viewed_at||now,
        signed_at:now,
        updated_at:now
      }).eq("id",agreement.id).select("*").single();
      if(updateError)throw updateError;

      const {error:statusError}=await admin.from("staff_access").update({
        onboarding_status:"complete",
        updated_at:now
      }).eq("user_id",user.id);
      if(statusError)throw statusError;

      await admin.from("staff_access_audit").insert({
        staff_user_id:user.id,
        action:"staff_agreement_signed",
        actor_user_id:user.id,
        previous_value:{onboarding_status:"pending"},
        new_value:{onboarding_status:"complete",staff_agreement_id:agreement.id},
        reason:agreement.agreement_templates?.name||"Required staff agreement signed"
      });

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
});