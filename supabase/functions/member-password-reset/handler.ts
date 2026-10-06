import { allowedOrigins, edgeEnvironment, configurationError, assertSyntheticRecipient } from "../_shared/environment.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function cors(origin:string|null){
  const safe=origin&&allowedOrigins.has(origin)?origin:edgeEnvironment().appOrigin;
  return {"Access-Control-Allow-Origin":safe,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
}
function json(origin:string|null,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}});}
function clean(value:unknown,max=500){return String(value||"").trim().slice(0,max);}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]||char));}

export async function handleRequest(req:Request){
  const configError=configurationError();if(configError)return configError;
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{error:"Method not allowed"},405);
  if(origin&&!allowedOrigins.has(origin))return json(origin,{error:"Origin not allowed"},403);

  const supabaseUrl=Deno.env.get("SUPABASE_URL"),secretKeys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}"),secretKey=secretKeys.default||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!supabaseUrl||!secretKey)return json(origin,{error:"Service configuration unavailable"},500);
  const body=await req.json().catch(()=>({})),email=clean(body.email,320).toLowerCase();
  const generic="If that email belongs to an eligible member account, a password reset email will be sent.";
  if(!email||!/^\S+@\S+\.\S+$/.test(email))return json(origin,{ok:true,message:generic});

  try{
    const admin=createClient(supabaseUrl,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:contacts,error:contactError}=await admin.from("contacts").select("id,email").eq("email",email).limit(2);
    if(contactError)throw contactError;
    if(!contacts||contacts.length!==1)return json(origin,{ok:true,message:generic});
    const {data:accessRows,error:accessError}=await admin.from("client_access").select("user_id,status,contact_id").eq("contact_id",contacts[0].id).in("status",["ready","invited","onboarding","active","payment_suspended"]).not("user_id","is",null).limit(2);
    if(accessError)throw accessError;
    if(!accessRows||accessRows.length!==1||!accessRows[0].user_id)return json(origin,{ok:true,message:generic});
    const {data:userData,error:userError}=await admin.auth.admin.getUserById(accessRows[0].user_id);
    if(userError||userData?.user?.email?.trim().toLowerCase()!==email)return json(origin,{ok:true,message:generic});

    assertSyntheticRecipient(email);
    const {data:linkData,error:linkError}=await admin.auth.admin.generateLink({type:"recovery",email});
    if(linkError)throw linkError;
    const actionLink=linkData?.properties?.action_link;
    if(!actionLink)throw new Error("Password reset token could not be generated.");
    const actionUrl=new URL(actionLink),supabaseOrigin=new URL(supabaseUrl).origin;
    if(actionUrl.origin!==supabaseOrigin||actionUrl.pathname!=="/auth/v1/verify"||actionUrl.searchParams.get("type")!=="recovery"||!actionUrl.searchParams.get("token"))throw new Error("Password reset action link was invalid.");
    const safeLanding=edgeEnvironment().appOrigin+"/member/password-reset.html?token_hash="+encodeURIComponent(actionUrl.searchParams.get("token")||""),safeHtmlLanding=escapeHtml(safeLanding);

    const apiKey=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("REVITALIZED_EMAIL_FROM")||"ReVitalized Academy <noreply@auth.revitalizedacademy.com>";
    if(!apiKey)throw new Error("Email provider is not configured.");
    const send=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({
      from,to:[email],subject:"Reset your ReVitalized Academy member password",
      text:"A password reset was requested for your ReVitalized Academy member account.\n\nUse this secure page to choose a new password:\n"+safeLanding+"\n\nIf you did not request this, you can ignore this email.",
      html:'<div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f3f32;max-width:620px;margin:auto"><h2 style="color:#154734">Reset your ReVitalized Academy password</h2><p>A password reset was requested for your member account.</p><p><a href="'+safeHtmlLanding+'" style="display:inline-block;background:#154734;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Change My Password</a></p><p style="color:#687b70;font-size:13px">This link opens a secure ReVitalized member password page.</p><p style="color:#687b70;font-size:13px">If you did not request this, you can ignore this email.</p></div>'
    })});
    if(!send.ok){const errorBody=await send.text();console.error("member password reset email failed",send.status,errorBody);throw new Error("Password reset email could not be sent.");}
    return json(origin,{ok:true,message:generic});
  }catch(error){console.error(error);return json(origin,{ok:true,message:generic});}
}
