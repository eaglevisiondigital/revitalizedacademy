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
      if(["signed","waived"].includes(agreement.status)){
        return json(origin,{error:"This agreement has already been completed."},409);
      }
      if(agreement.status==="declined"){
        return json(origin,{error:"This agreement was declined and must be reissued by ReVitalized staff."},409);
      }

      const signatures=Array.isArray(body.signatures)
        ?body.signatures
        :[{signer_role:"primary_client",signer_name:body.signer_name}];
      const accepted=Boolean(body.accepted_terms);

      if(!accepted)return json(origin,{error:"You must accept the agreement terms before signing."},400);
      if(!signatures.length)return json(origin,{error:"At least one signature is required."},400);

      const allowedRoles=new Set(["primary_client","secondary_client"]);
      const normalized=signatures
        .map((s:any)=>({
          signer_role:String(s?.signer_role||"primary_client"),
          signer_name:clean(s?.signer_name,240)
        }))
        .filter((s:any)=>allowedRoles.has(s.signer_role)&&s.signer_name);

      const uniqueRoles=new Set(normalized.map((s:any)=>s.signer_role));
      if(normalized.length!==uniqueRoles.size)return json(origin,{error:"Duplicate signer roles are not allowed."},400);

      const required=Number(agreement.required_client_signatures||1);
      if(normalized.length<required){
        return json(origin,{error:required===2?"Both client signatures are required.":"A client signature is required."},400);
      }

      const template=agreement.agreement_templates;
      if(!template||template.status!=="published")return json(origin,{error:"This agreement version is not currently available for signing."},409);

      const expectedHash=agreement.rendered_content_hash||agreement.content_hash;
      if(!expectedHash)return json(origin,{error:"Agreement integrity hash is missing."},409);
      const sourceText=agreement.rendered_content_text||"";
      if(agreement.rendered_content_hash){
        const actualHash=await sha256(sourceText);
        if(actualHash!==agreement.rendered_content_hash){
          return json(origin,{error:"Agreement integrity check failed. Please contact ReVitalized support."},409);
        }
      }else if(template.content_hash!==agreement.content_hash){
        return json(origin,{error:"Agreement template integrity check failed. Please contact ReVitalized support."},409);
      }

      const now=new Date().toISOString();
      const userAgent=clean(req.headers.get("user-agent"),1000)||null;
      const acceptances=[];

      for(const signature of normalized.slice(0,required)){
        const {data:acceptance,error:acceptanceError}=await admin.from("agreement_acceptances").upsert({
          client_agreement_id:agreement.id,
          contact_id:agreement.contact_id,
          signed_by_user_id:user.id,
          signer_role:signature.signer_role,
          signer_name:signature.signer_name,
          signer_email:user.email||null,
          signature_type:"typed",
          accepted_terms:true,
          content_hash:expectedHash,
          signed_at:now,
          user_agent:userAgent,
          metadata:{
            agreement_key:agreement.agreement_key,
            template_version:agreement.template_version,
            rendered:true
          }
        },{onConflict:"client_agreement_id,signer_role"}).select("*").single();
        if(acceptanceError)throw acceptanceError;
        acceptances.push(acceptance);
      }

      const {count,error:countError}=await admin.from("agreement_acceptances")
        .select("*",{count:"exact",head:true})
        .eq("client_agreement_id",agreement.id)
        .in("signer_role",["primary_client","secondary_client"]);
      if(countError)throw countError;

      const complete=Number(count||0)>=required;
      const {data:updated,error:updateError}=await admin.from("client_agreements").update({
        status:complete?"signed":"viewed",
        viewed_at:agreement.viewed_at||now,
        signed_at:complete?now:null,
        updated_at:now
      }).eq("id",agreement.id).select("*").single();
      if(updateError)throw updateError;

      if(complete){
        await admin.from("contact_activity").insert({
          contact_id:agreement.contact_id,
          activity_type:"agreement_signed",
          title:"Membership agreement signed",
          detail:template.name+" · v"+agreement.template_version,
          actor_user_id:user.id,
          metadata:{
            client_agreement_id:agreement.id,
            signature_count:count,
            required_client_signatures:required
          }
        });
      }

      return json(origin,{ok:true,agreement:updated,acceptances,complete});
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
});