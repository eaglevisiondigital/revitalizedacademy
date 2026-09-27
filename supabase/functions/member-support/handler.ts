import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPPORT_STATUSES=new Set(["ready","invited","onboarding","active","payment_suspended"]);

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
  return new Response(JSON.stringify(data),{status,headers:{...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}});
}
async function supportConversationId(contactId:string){
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("revitalized-support:"+contactId)));
  digest[6]=(digest[6]&0x0f)|0x50;
  digest[8]=(digest[8]&0x3f)|0x80;
  const hex=[...digest.slice(0,16)].map(b=>b.toString(16).padStart(2,"0")).join("");
  return hex.slice(0,8)+"-"+hex.slice(8,12)+"-"+hex.slice(12,16)+"-"+hex.slice(16,20)+"-"+hex.slice(20,32);
}

export async function handleRequest(req:Request){
  const configError=configurationError();if(configError)return configError;
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(origin)});
  if(req.method!=="POST")return json(origin,{error:"Method not allowed"},405);
  if(origin&&!allowedOrigins.has(origin))return json(origin,{error:"Origin not allowed"},403);

  const url=Deno.env.get("SUPABASE_URL");
  const keys=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}");
  const key=keys.default||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)return json(origin,{error:"Service configuration unavailable"},500);

  const bearer=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  if(!bearer)return json(origin,{error:"Authentication required"},401);

  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await admin.auth.getUser(bearer);
  if(userError||!userData.user)return json(origin,{error:"Authentication required"},401);
  const user=userData.user;

  const {data:access,error:accessError}=await admin.from("client_access")
    .select("contact_id,household_id,membership_id,status")
    .eq("user_id",user.id)
    .limit(1)
    .maybeSingle();
  if(accessError)return json(origin,{error:"Unable to resolve account access."},500);
  if(!access||!SUPPORT_STATUSES.has(String(access.status))){
    return json(origin,{error:"Support messaging is not available for this account state."},403);
  }

  async function ensureConversation(){
    const {data:existing,error:existingError}=await admin.from("member_conversations")
      .select("id,title,status,last_message_at")
      .eq("contact_id",access.contact_id)
      .eq("conversation_type","support")
      .eq("status","active")
      .order("created_at",{ascending:false})
      .limit(1)
      .maybeSingle();
    if(existingError)throw existingError;

    let conversation=existing;
    if(!conversation){
      const deterministicId=await supportConversationId(access.contact_id);
      const {error:createError}=await admin.from("member_conversations").upsert({
        id:deterministicId,
        conversation_type:"support",
        contact_id:access.contact_id,
        household_id:access.household_id||null,
        membership_id:access.membership_id||null,
        title:"ReVitalized Support",
        status:"active",
        created_by:user.id
      },{onConflict:"id",ignoreDuplicates:true});
      if(createError)throw createError;
      const {data:created,error:readError}=await admin.from("member_conversations")
        .select("id,title,status,last_message_at")
        .eq("id",deterministicId)
        .eq("contact_id",access.contact_id)
        .maybeSingle();
      if(readError||!created)throw readError||new Error("Support conversation could not be created.");
      conversation=created;
    }

    const {error:participantError}=await admin.from("member_conversation_participants").upsert({
      conversation_id:conversation.id,
      user_id:user.id,
      participant_type:"member",
      contact_id:access.contact_id,
      left_at:null
    },{onConflict:"conversation_id,user_id"});
    if(participantError)throw participantError;

    return conversation;
  }

  try{
    const body=await req.json();
    const action=String(body.action||"context");
    const conversation=await ensureConversation();

    if(action==="send"){
      const message=String(body.message||"").trim();
      if(!message||message.length>8000)return json(origin,{error:"Support message must be 1 to 8000 characters."},400);
      const requestId=String(body.request_id||"").trim();
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)){
        return json(origin,{error:"Valid message request ID required."},400);
      }

      const {data:existingMessage,error:existingMessageError}=await admin.from("member_messages")
        .select("id")
        .eq("id",requestId)
        .eq("conversation_id",conversation.id)
        .maybeSingle();
      if(existingMessageError)throw existingMessageError;
      if(existingMessage)return json(origin,{ok:true,conversation_id:conversation.id,message_id:existingMessage.id,replayed:true});

      const {data:createdMessage,error:messageError}=await admin.from("member_messages").insert({
        id:requestId,
        conversation_id:conversation.id,
        sender_user_id:user.id,
        sender_contact_id:access.contact_id,
        body:message,
        message_type:"text"
      }).select("id").single();
      if(messageError||!createdMessage)throw messageError||new Error("Support message could not be saved.");
    }else if(action!=="context"){
      return json(origin,{error:"Invalid action"},400);
    }

    const {data:messages,error:messagesError}=await admin.from("member_messages")
      .select("id,sender_user_id,body,message_type,created_at")
      .eq("conversation_id",conversation.id)
      .is("deleted_at",null)
      .order("created_at")
      .limit(50);
    if(messagesError)throw messagesError;

    await admin.from("member_conversation_participants")
      .update({last_read_at:new Date().toISOString()})
      .eq("conversation_id",conversation.id)
      .eq("user_id",user.id);

    return json(origin,{
      ok:true,
      conversation:{
        id:conversation.id,
        title:conversation.title||"ReVitalized Support",
        access_status:access.status
      },
      messages:(messages||[]).map((message)=>({
        id:message.id,
        mine:message.sender_user_id===user.id,
        body:message.body,
        message_type:message.message_type,
        created_at:message.created_at
      }))
    });
  }catch(error){
    console.error(error);
    return json(origin,{error:"Support messaging is temporarily unavailable."},500);
  }
}
