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
function clean(v:unknown,max=500){return String(v||"").trim().slice(0,max);}

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
  const body=await req.json().catch(()=>({}));
  const email=clean(body.email,320).toLowerCase();
  const generic="If that email belongs to a staff account, a password reset email will be sent.";

  if(!email||!/^\S+@\S+\.\S+$/.test(email)){
    return json(origin,{ok:true,message:generic});
  }

  try{
    const {data:staffRows,error:staffError}=await admin
      .from("admin_staff_access_directory")
      .select("user_id,email,status,display_name")
      .ilike("email",email)
      .limit(1);
    if(staffError)throw staffError;

    const staff=staffRows?.[0]||null;
    if(!staff||staff.status!=="active"){
      return json(origin,{ok:true,message:generic});
    }

    const {data:linkData,error:linkError}=await admin.auth.admin.generateLink({
      type:"recovery",
      email
    });
    if(linkError)throw linkError;

    const actionLink=linkData?.properties?.action_link;
    if(!actionLink)throw new Error("Password reset token could not be generated.");

    const actionUrl=new URL(actionLink);
    const tokenHash=actionUrl.searchParams.get("token");
    if(!tokenHash)throw new Error("Password reset token was missing.");

    const safeLanding="https://revitalizedacademy.com/portal/password-reset.html?token_hash="+encodeURIComponent(tokenHash);

    const apiKey=Deno.env.get("RESEND_API_KEY");
    const from=Deno.env.get("REVITALIZED_EMAIL_FROM")||"ReVitalized Academy <noreply@auth.revitalizedacademy.com>";
    if(!apiKey)throw new Error("Email provider is not configured.");

    const send=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+apiKey,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        from,
        to:[email],
        subject:"Reset your ReVitalized Academy staff password",
        text:
          "A password reset was requested for your ReVitalized Academy staff account.\n\n"+
          "Use this secure page to choose a new password:\n"+safeLanding+
          "\n\nIf you did not request this, you can ignore this email.",
        html:
          '<div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f3f32;max-width:620px;margin:auto">'+
          '<h2 style="color:#154734">Reset your ReVitalized Academy password</h2>'+
          '<p>A password reset was requested for your staff account.</p>'+
          '<p><a href="'+safeLanding+'" style="display:inline-block;background:#154734;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Change My Password</a></p>'+
          '<p style="color:#687b70;font-size:13px">This link opens a secure ReVitalized password page. It does not send you back to the login form.</p>'+
          '<p style="color:#687b70;font-size:13px">If you did not request this, you can ignore this email.</p>'+
          '</div>'
      })
    });

    if(!send.ok){
      const errorBody=await send.text();
      console.error("password reset email failed",send.status,errorBody);
      throw new Error("Password reset email could not be sent.");
    }

    return json(origin,{ok:true,message:generic});
  }catch(error){
    console.error(error);
    return json(origin,{ok:true,message:generic});
  }
});