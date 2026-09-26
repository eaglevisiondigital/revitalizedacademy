import { callerClient, assertStaffAction } from "../_shared/authorization.ts";
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
function clean(value:unknown,max=8000){return String(value||"").trim().slice(0,max);}

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
    const question=clean(body.question,8000);
    const questionType=String(body.question_type||"other");
    let contactId=String(body.contact_id||"");
    let membershipId:string|null=null;
    let assignedCoachId:string|null=null;

    if(question.length<2)return json(origin,{error:"Enter a question."},400);

    const {data:typeRow,error:typeError}=await admin.from("coach_companion_question_types")
      .select("*").eq("question_type",questionType).eq("active",true).maybeSingle();
    if(typeError)throw typeError;
    if(!typeRow)return json(origin,{error:"Choose a valid Coach Companion question type."},400);

    const {data:staff,error:staffError}=await admin.from("staff_access")
      .select("role").eq("user_id",user.id).maybeSingle();
    if(staffError)throw staffError;

    if(staff){
      if(!contactId)return json(origin,{error:"A client contact is required for staff-assisted Coach Companion requests."},400);
      await assertStaffAction(caller,"companion.manage",contactId);
      const {data:access}=await admin.from("client_access")
        .select("membership_id").eq("contact_id",contactId).maybeSingle();
      membershipId=access?.membership_id||null;
    }else{
      const {data:access,error:accessError}=await admin.from("client_access")
        .select("contact_id,membership_id,status").eq("user_id",user.id).maybeSingle();
      if(accessError)throw accessError;
      if(!access||access.status!=="active")return json(origin,{error:"Active ReVitalized member access is required."},403);
      contactId=access.contact_id;
      membershipId=access.membership_id||null;
    }

    const {data:coachRow}=await admin.from("client_coach_assignments")
      .select("coach_user_id").eq("contact_id",contactId)
      .eq("role","primary").eq("status","active").limit(1).maybeSingle();
    assignedCoachId=coachRow?.coach_user_id||null;

    const now=new Date().toISOString();
    const {data:request,error:requestError}=await admin.from("coach_companion_requests")
      .insert({
        contact_id:contactId,
        membership_id:membershipId,
        requested_by_user_id:user.id,
        question_type:questionType,
        question,
        handling_mode:typeRow.handling_mode,
        status:"queued",
        assigned_coach_id:assignedCoachId,
        metadata:{
          requested_by_staff:Boolean(staff),
          staff_role:staff?.role||null
        }
      }).select("*").single();
    if(requestError)throw requestError;

    async function escalate(reason:string){
      const {data:review,error:reviewError}=await admin.from("coach_companion_reviews")
        .insert({
          request_id:request.id,
          contact_id:contactId,
          assigned_to:assignedCoachId,
          status:"open",
          review_reason:reason
        }).select("*").single();
      if(reviewError)throw reviewError;

      const {error:updateError}=await admin.from("coach_companion_requests")
        .update({
          status:"coach_review",
          escalation_reason:reason,
          updated_at:now
        }).eq("id",request.id);
      if(updateError)throw updateError;

      const {data:existing}=await admin.from("follow_up_tasks")
        .select("id").eq("contact_id",contactId)
        .eq("title","Coach Companion review needed")
        .eq("status","open").limit(1);

      if(!(existing||[]).length){
        await admin.from("follow_up_tasks").insert({
          contact_id:contactId,
          assigned_to:assignedCoachId,
          title:"Coach Companion review needed",
          due_at:new Date(Date.now()+86400000).toISOString(),
          status:"open",
          priority:typeRow.handling_mode==="block_and_escalate"?"high":"normal",
          task_type:"review",
          instructions:"Review the member's Coach Companion question and provide or approve an appropriate response. The AI layer did not send an autonomous answer."
        });
      }

      await admin.from("contact_activity").insert({
        contact_id:contactId,
        activity_type:"coach_companion_escalated",
        title:"Coach Companion question escalated",
        detail:typeRow.label,
        actor_user_id:user.id,
        metadata:{request_id:request.id,review_id:review.id,reason}
      });

      return json(origin,{
        ok:true,
        request_id:request.id,
        status:"coach_review",
        handling_mode:typeRow.handling_mode,
        message:"This question has been routed to the ReVitalized coaching team for review."
      });
    }

    if(typeRow.handling_mode==="block_and_escalate"){
      return await escalate("This question type requires human review and cannot receive an autonomous Coach Companion answer.");
    }
    if(typeRow.handling_mode==="coach_review"){
      return await escalate("This question type is configured for coach review before a response is sent.");
    }

    const {data:policy,error:policyError}=await admin.from("coach_companion_policies")
      .select("*").eq("policy_key","revitalized-default").eq("active",true).maybeSingle();
    if(policyError)throw policyError;
    if(!policy)return await escalate("Coach Companion policy is unavailable.");

    await admin.from("coach_companion_requests")
      .update({status:"retrieving",updated_at:new Date().toISOString()})
      .eq("id",request.id);

    const ai=new Supabase.ai.Session("gte-small");
    const embedding=await ai.run(question,{mean_pool:true,normalize:true});

    const {data:matches,error:matchError}=await admin.rpc("coach_companion_match_chunks",{
      query_embedding:Array.from(embedding),
      match_threshold:Number(policy.minimum_retrieval_confidence||0.78),
      match_count:6
    });
    if(matchError)throw matchError;

    const sources=matches||[];
    if(!sources.length){
      return await escalate("No approved ReVitalized knowledge met the retrieval confidence threshold.");
    }

    const topConfidence=Math.max(...sources.map((row:any)=>Number(row.similarity||0)));

    const {error:sourceInsertError}=await admin.from("coach_companion_request_sources")
      .insert(sources.map((row:any,index:number)=>({
        request_id:request.id,
        chunk_id:row.chunk_id,
        similarity:Number(row.similarity||0),
        rank:index+1,
        used_in_answer:false
      })));
    if(sourceInsertError)throw sourceInsertError;

    if(topConfidence<Number(policy.minimum_retrieval_confidence||0.78)){
      return await escalate("Approved knowledge was found, but retrieval confidence was below the ReVitalized threshold.");
    }

    const {error:readyError}=await admin.from("coach_companion_requests")
      .update({
        status:"draft_ready",
        retrieval_confidence:topConfidence,
        updated_at:new Date().toISOString(),
        metadata:{
          requested_by_staff:Boolean(staff),
          staff_role:staff?.role||null,
          retrieval_count:sources.length,
          generation_provider_connected:false
        }
      }).eq("id",request.id);
    if(readyError)throw readyError;

    await admin.from("contact_activity").insert({
      contact_id:contactId,
      activity_type:"coach_companion_retrieval_ready",
      title:"Coach Companion knowledge retrieved",
      detail:typeRow.label,
      actor_user_id:user.id,
      metadata:{request_id:request.id,retrieval_confidence:topConfidence,source_count:sources.length}
    });

    return json(origin,{
      ok:true,
      request_id:request.id,
      status:"draft_ready",
      handling_mode:typeRow.handling_mode,
      retrieval_confidence:topConfidence,
      generation_ready:true,
      answer_sent:false,
      source_count:sources.length,
      sources:sources.map((row:any)=>({
        source_id:row.source_id,
        source_title:row.source_title,
        source_type:row.source_type,
        similarity:Number(row.similarity||0)
      })),
      message:"Approved ReVitalized knowledge was found. Final answer generation is not yet enabled, so no autonomous response was sent."
    });
  }catch(error){
    console.error(error);
    return json(origin,{error:error instanceof Error?error.message:"Coach Companion request failed."},(error as {status?:number})?.status===403?403:500);
  }
}
