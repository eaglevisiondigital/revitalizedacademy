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

async function sendResend(job:any){
  const apiKey=Deno.env.get("RESEND_API_KEY");
  const from=Deno.env.get("REVITALIZED_EMAIL_FROM")||"ReVitalized Academy <noreply@auth.revitalizedacademy.com>";
  if(!apiKey)return {ok:false,blocked:true,reason:"resend_not_configured"};
  if(!job.recipient)return {ok:false,blocked:true,reason:"missing_email_address"};

  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{
      "Authorization":"Bearer "+apiKey,
      "Content-Type":"application/json",
      "Idempotency-Key":"revitalized-notification-"+job.id
    },
    body:JSON.stringify({
      from,
      to:[job.recipient],
      subject:job.subject||"ReVitalized Academy",
      text:job.body
    })
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)return {ok:false,reason:data?.message||"resend_send_failed",details:data};
  return {ok:true,provider_message_id:data?.id||null,details:data};
}

async function sendTwilio(job:any){
  const accountSid=Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken=Deno.env.get("TWILIO_AUTH_TOKEN");
  const messagingServiceSid=Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
  const fromNumber=Deno.env.get("TWILIO_FROM_NUMBER");

  if(!accountSid||!authToken||(!messagingServiceSid&&!fromNumber)){
    return {ok:false,blocked:true,reason:"twilio_not_configured"};
  }
  if(!job.recipient)return {ok:false,blocked:true,reason:"missing_phone_number"};

  const body=new URLSearchParams();
  body.set("To",job.recipient);
  body.set("Body",job.body.slice(0,1600));
  if(messagingServiceSid)body.set("MessagingServiceSid",messagingServiceSid);
  else body.set("From",fromNumber!);

  const response=await fetch(
    "https://api.twilio.com/2010-04-01/Accounts/"+encodeURIComponent(accountSid)+"/Messages.json",
    {
      method:"POST",
      headers:{
        "Authorization":"Basic "+btoa(accountSid+":"+authToken),
        "Content-Type":"application/x-www-form-urlencoded"
      },
      body
    }
  );
  const data=await response.json().catch(()=>({}));
  if(!response.ok)return {ok:false,reason:data?.message||"twilio_send_failed",details:data};
  return {ok:true,provider_message_id:data?.sid||null,details:data};
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
  if(userError||!userData.user)return json(origin,{error:"Staff authentication required"},401);

  const {data:staff,error:staffError}=await admin.from("staff_access")
    .select("role,display_name").eq("user_id",userData.user.id).maybeSingle();
  if(staffError||!staff)return json(origin,{error:"Staff access required"},403);
  if(!["owner","admin"].includes(staff.role))return json(origin,{error:"Owner/Admin access required."},403);

  try{
    const body=await req.json();
    const action=String(body.action||"");

    if(action==="provider_status"){
      return json(origin,{
        ok:true,
        email:{
          provider:"resend",
          configured:Boolean(Deno.env.get("RESEND_API_KEY"))
        },
        sms:{
          provider:"twilio",
          configured:Boolean(
            Deno.env.get("TWILIO_ACCOUNT_SID")&&
            Deno.env.get("TWILIO_AUTH_TOKEN")&&
            (Deno.env.get("TWILIO_MESSAGING_SERVICE_SID")||Deno.env.get("TWILIO_FROM_NUMBER"))
          )
        }
      });
    }

    if(action!=="process")return json(origin,{error:"Invalid delivery action."},400);

    const limit=Math.min(100,Math.max(1,Number(body.limit||25)));
    const {data:jobs,error:jobsError}=await admin.from("notification_delivery_jobs")
      .select("*")
      .eq("status","queued")
      .lte("scheduled_for",new Date().toISOString())
      .order("scheduled_for")
      .limit(limit);
    if(jobsError)throw jobsError;

    const results:any[]=[];

    for(const job of jobs||[]){
      const now=new Date().toISOString();
      await admin.from("notification_delivery_jobs").update({
        status:"processing",
        attempt_count:Number(job.attempt_count||0)+1,
        last_attempt_at:now,
        updated_at:now
      }).eq("id",job.id);

      let result:any;
      try{
        result=job.channel==="email"?await sendResend(job):await sendTwilio(job);
      }catch(error){
        result={ok:false,reason:error instanceof Error?error.message:"provider_exception"};
      }

      if(result.ok){
        await admin.from("notification_delivery_jobs").update({
          status:"sent",
          provider_message_id:result.provider_message_id||null,
          sent_at:new Date().toISOString(),
          error_message:null,
          block_reason:null,
          updated_at:new Date().toISOString()
        }).eq("id",job.id);
      }else if(result.blocked){
        await admin.from("notification_delivery_jobs").update({
          status:"blocked",
          block_reason:result.reason||"provider_not_configured",
          error_message:null,
          updated_at:new Date().toISOString()
        }).eq("id",job.id);
      }else{
        await admin.from("notification_delivery_jobs").update({
          status:"failed",
          error_message:String(result.reason||"delivery_failed").slice(0,2000),
          updated_at:new Date().toISOString()
        }).eq("id",job.id);
      }

      results.push({
        job_id:job.id,
        channel:job.channel,
        ok:Boolean(result.ok),
        blocked:Boolean(result.blocked),
        reason:result.reason||null,
        provider_message_id:result.provider_message_id||null
      });
    }

    return json(origin,{
      ok:true,
      processed:results.length,
      sent:results.filter((r)=>r.ok).length,
      blocked:results.filter((r)=>r.blocked).length,
      failed:results.filter((r)=>!r.ok&&!r.blocked).length,
      results
    });
  }catch(error){
    console.error(error);
    return json(origin,{error:error instanceof Error?error.message:"Notification delivery failed."},500);
  }
});