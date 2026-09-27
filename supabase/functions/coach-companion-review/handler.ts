import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import { callerClient, assertStaffAction } from "../_shared/authorization.ts";
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
function clean(v:unknown,max=8000){return String(v||"").trim().slice(0,max);}

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
  if(userError||!userData.user)return json(origin,{error:"Staff authentication required"},401);
  const user=userData.user;
  const caller=callerClient(supabaseUrl,secretKey,bearer);

  const {data:staff,error:staffError}=await admin.from("staff_access")
    .select("role,display_name").eq("user_id",user.id).maybeSingle();
  if(staffError||!staff)return json(origin,{error:"Staff access required"},403);
  if(!["owner","admin","coach"].includes(staff.role))return json(origin,{error:"This staff role cannot resolve Coach Companion reviews."},403);

  try{
    await assertStaffAction(caller,"companion.manage");
    const body=await req.json();
    const action=String(body.action||"");
    const reviewId=String(body.review_id||"");

    const {data:review,error:reviewError}=await admin.from("coach_companion_reviews")
      .select("*").eq("id",reviewId).maybeSingle();
    if(reviewError)throw reviewError;
    if(!review)return json(origin,{error:"Coach Companion review not found."},404);
    await assertStaffAction(caller,"companion.manage",review.contact_id);

    const {data:request,error:requestError}=await admin.from("coach_companion_requests")
      .select("*").eq("id",review.request_id).single();
    if(requestError)throw requestError;

    if(staff.role==="coach"&&review.assigned_to&&review.assigned_to!==user.id){
      return json(origin,{error:"This Coach Companion review is assigned to another coach."},403);
    }

    if(action==="claim"){
      const {data:updated,error}=await admin.from("coach_companion_reviews")
        .update({assigned_to:user.id,status:"in_review",updated_at:new Date().toISOString()})
        .eq("id",review.id).select("*").single();
      if(error)throw error;

      await admin.from("coach_companion_requests")
        .update({assigned_coach_id:user.id,status:"coach_review",updated_at:new Date().toISOString()})
        .eq("id",request.id);

      return json(origin,{ok:true,review:updated});
    }

    if(action==="resolve"){
      const response=clean(body.response,8000);
      const resolutionType=String(body.resolution_type||"coach_answered");
      const sendToMember=body.send_to_member!==false;

      if(!response)return json(origin,{error:"Enter the coach response before resolving this review."},400);
      if(!new Set(["coach_answered","approved_draft","redirected","no_response"]).has(resolutionType)){
        return json(origin,{error:"Invalid resolution type."},400);
      }

      const now=new Date().toISOString();

      const {data:updatedReview,error:updateReviewError}=await admin.from("coach_companion_reviews")
        .update({
          assigned_to:review.assigned_to||user.id,
          status:"resolved",
          coach_response:response,
          resolution_type:resolutionType,
          reviewed_by:user.id,
          reviewed_at:now,
          updated_at:now
        }).eq("id",review.id).select("*").single();
      if(updateReviewError)throw updateReviewError;

      const {error:updateRequestError}=await admin.from("coach_companion_requests")
        .update({
          status:"resolved",
          final_answer:response,
          answered_by_type:"coach",
          answered_by_user_id:user.id,
          answered_at:now,
          updated_at:now
        }).eq("id",request.id);
      if(updateRequestError)throw updateRequestError;

      let messageId=null;
      if(sendToMember&&resolutionType!=="no_response"){
        const {data:conversation}=await admin.from("member_conversations")
          .select("id").eq("contact_id",request.contact_id)
          .eq("conversation_type","coach_client").eq("status","active")
          .order("created_at",{ascending:false}).limit(1).maybeSingle();

        if(conversation?.id){
          const {data:message,error:messageError}=await admin.from("member_messages")
            .insert({
              conversation_id:conversation.id,
              sender_user_id:user.id,
              sender_contact_id:null,
              body:response,
              message_type:"text",
              metadata:{
                coach_companion_request_id:request.id,
                coach_companion_review_id:review.id
              }
            }).select("id").single();
          if(messageError)throw messageError;
          messageId=message.id;
        }
      }

      await admin.from("follow_up_tasks")
        .update({status:"completed",completed_at:now})
        .eq("contact_id",request.contact_id)
        .eq("title","Coach Companion review needed")
        .eq("status","open");

      await admin.from("contact_activity").insert({
        contact_id:request.contact_id,
        activity_type:"coach_companion_review_resolved",
        title:"Coach Companion review resolved",
        detail:staff.display_name||"ReVitalized Coach",
        actor_user_id:user.id,
        metadata:{
          request_id:request.id,
          review_id:review.id,
          resolution_type:resolutionType,
          member_message_id:messageId
        }
      });

      return json(origin,{
        ok:true,
        review:updatedReview,
        request_id:request.id,
        message_id:messageId,
        sent_to_member:Boolean(messageId)
      });
    }

    if(action==="dismiss"){
      if(!["owner","admin"].includes(staff.role))return json(origin,{error:"Only Owner/Admin can dismiss a Coach Companion review."},403);
      const reason=clean(body.reason,3000);
      if(!reason)return json(origin,{error:"A dismissal reason is required."},400);
      const now=new Date().toISOString();

      await admin.from("coach_companion_reviews").update({
        status:"dismissed",
        resolution_type:"no_response",
        coach_response:reason,
        reviewed_by:user.id,
        reviewed_at:now,
        updated_at:now
      }).eq("id",review.id);

      await admin.from("coach_companion_requests").update({
        status:"cancelled",
        escalation_reason:(request.escalation_reason||"")+" | Dismissed: "+reason,
        updated_at:now
      }).eq("id",request.id);

      await admin.from("follow_up_tasks").update({
        status:"completed",completed_at:now
      }).eq("contact_id",request.contact_id)
        .eq("title","Coach Companion review needed")
        .eq("status","open");

      return json(origin,{ok:true,dismissed:true});
    }

    return json(origin,{error:"Invalid review action."},400);
  }catch(error){
    console.error(error);
    return json(origin,{error:error instanceof Error?error.message:"Coach Companion review failed."},(error as {status?:number})?.status===403?403:500);
  }
}
