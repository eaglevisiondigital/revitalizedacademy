import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const MAX_BYTES=10*1024*1024;
const ALLOWED_MIME=new Set([
  "application/pdf","image/jpeg","image/png","image/webp",
  "audio/mpeg","audio/mp4","audio/x-m4a","audio/wav"
]);

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
function validUuid(value:string){
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function safeName(value:string){
  return value.replace(/[^A-Za-z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,160)||"attachment";
}
async function signatureMatches(file:File){
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const starts=(sig:number[])=>sig.every((v,i)=>bytes[i]===v);
  if(file.type==="application/pdf")return bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==="%PDF-";
  if(file.type==="image/jpeg")return bytes.length>=3&&starts([0xff,0xd8,0xff]);
  if(file.type==="image/png")return bytes.length>=8&&starts([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if(file.type==="image/webp")return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
  if(file.type==="audio/wav")return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WAVE";
  if(file.type==="audio/mp4"||file.type==="audio/x-m4a")return bytes.length>=12&&String.fromCharCode(...bytes.slice(4,8))==="ftyp";
  if(file.type==="audio/mpeg"){
    const id3=bytes.length>=3&&String.fromCharCode(...bytes.slice(0,3))==="ID3";
    const frame=bytes.length>=2&&bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0;
    return id3||frame;
  }
  return false;
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

  let form:FormData;
  try{form=await req.formData();}catch{return json(origin,{error:"Multipart form data required."},400);}
  const requestId=String(form.get("request_id")||"").trim();
  const conversationId=String(form.get("conversation_id")||"").trim();
  const messageId=String(form.get("message_id")||"").trim();
  const entry=form.get("file");

  if(!validUuid(requestId)||!validUuid(conversationId)||!validUuid(messageId))return json(origin,{error:"Valid attachment, conversation and message IDs are required."},400);
  if(!(entry instanceof File)||entry.size===0)return json(origin,{error:"Choose an attachment."},400);
  if(entry.size>MAX_BYTES)return json(origin,{error:"Attachment must be 10 MB or smaller."},400);
  if(!ALLOWED_MIME.has(entry.type))return json(origin,{error:"Unsupported attachment type."},400);
  if(!(await signatureMatches(entry)))return json(origin,{error:"Attachment content does not match its declared file type."},400);

  const {data:message,error:messageError}=await admin.from("member_messages")
    .select("id,conversation_id,sender_user_id")
    .eq("id",messageId)
    .eq("conversation_id",conversationId)
    .maybeSingle();
  if(messageError)return json(origin,{error:"Unable to verify message."},500);
  if(!message||message.sender_user_id!==user.id)return json(origin,{error:"You can attach files only to your own message."},403);

  const {data:participant,error:participantError}=await admin.from("member_conversation_participants")
    .select("id")
    .eq("conversation_id",conversationId)
    .eq("user_id",user.id)
    .is("left_at",null)
    .maybeSingle();
  if(participantError)return json(origin,{error:"Unable to verify conversation access."},500);
  if(!participant)return json(origin,{error:"Conversation access required."},403);

  const {data:existing,error:existingError}=await admin.from("member_message_attachments")
    .select("id,message_id,storage_path")
    .eq("id",requestId)
    .maybeSingle();
  if(existingError)return json(origin,{error:"Unable to verify attachment request."},500);
  if(existing){
    if(existing.message_id!==messageId)return json(origin,{error:"Attachment request ID is already in use."},409);
    return json(origin,{ok:true,attachment_id:existing.id,replayed:true});
  }

  const path=`${conversationId}/${messageId}/${requestId}-${safeName(entry.name)}`;
  let uploaded=false;
  try{
    const {error:uploadError}=await admin.storage.from("member-message-attachments").upload(path,entry,{
      contentType:entry.type,cacheControl:"3600",upsert:false
    });
    if(uploadError)throw uploadError;
    uploaded=true;

    const {error:rowError}=await admin.from("member_message_attachments").insert({
      id:requestId,
      message_id:messageId,
      storage_path:path,
      original_filename:entry.name,
      content_type:entry.type,
      size_bytes:entry.size
    });
    if(rowError)throw rowError;

    return json(origin,{ok:true,attachment_id:requestId},201);
  }catch(error){
    console.error(error);
    if(uploaded){
      const {error:removeError}=await admin.storage.from("member-message-attachments").remove([path]);
      if(removeError)console.error("Attachment cleanup failure",removeError);
    }
    return json(origin,{error:"Attachment could not be saved. No partial file was kept."},500);
  }
}
