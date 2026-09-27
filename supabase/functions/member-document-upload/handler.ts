import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import { callerClient } from "../_shared/authorization.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const MAX_BYTES=25*1024*1024;
const ALLOWED_CATEGORIES=new Set(["general","progress"]);
const ALLOWED_MIME=new Set([
  "application/pdf","image/jpeg","image/png","image/webp","text/plain",
  "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
function safeName(value:string){
  return value.replace(/[^A-Za-z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,180)||"document";
}
async function signatureMatches(file:File){
  const bytes=new Uint8Array(await file.slice(0,512).arrayBuffer());
  const starts=(sig:number[])=>sig.every((v,i)=>bytes[i]===v);
  if(file.type==="application/pdf")return bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==="%PDF-";
  if(file.type==="image/jpeg")return bytes.length>=3&&starts([0xff,0xd8,0xff]);
  if(file.type==="image/png")return bytes.length>=8&&starts([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if(file.type==="image/webp")return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
  if(file.type==="application/msword"||file.type==="application/vnd.ms-excel")return bytes.length>=8&&starts([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]);
  if(file.type==="application/vnd.openxmlformats-officedocument.wordprocessingml.document"||file.type==="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")return bytes.length>=4&&starts([0x50,0x4b,0x03,0x04]);
  if(file.type==="text/plain")return !bytes.includes(0);
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

  const caller=callerClient(url,key,bearer);
  const {data:paid,error:paidError}=await caller.rpc("member_paid_access_allowed");
  if(paidError||paid!==true)return json(origin,{error:"Full member access is required."},403);

  const user=userData.user;
  const {data:access,error:accessError}=await admin.from("client_access")
    .select("contact_id,membership_id").eq("user_id",user.id).eq("status","active").limit(1).maybeSingle();
  if(accessError)return json(origin,{error:"Unable to resolve member access."},500);
  if(!access?.contact_id)return json(origin,{error:"Active member access is required."},403);

  let form:FormData;
  try{form=await req.formData();}catch{return json(origin,{error:"Multipart form data required."},400);}

  const requestId=String(form.get("request_id")||"").trim();
  const title=String(form.get("title")||"").trim();
  const category=String(form.get("category")||"").trim();
  const description=String(form.get("description")||"").trim();
  const entry=form.get("file");

  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))return json(origin,{error:"Valid upload request ID required."},400);
  if(!title||title.length>240)return json(origin,{error:"Document title is required and must be 240 characters or fewer."},400);
  if(description.length>3000)return json(origin,{error:"Document description must be 3000 characters or fewer."},400);
  if(!ALLOWED_CATEGORIES.has(category))return json(origin,{error:"Member uploads are limited to General or Progress documents."},400);
  if(!(entry instanceof File)||entry.size===0)return json(origin,{error:"Choose a document to upload."},400);
  if(entry.size>MAX_BYTES)return json(origin,{error:"Document must be 25 MB or smaller."},400);
  if(!ALLOWED_MIME.has(entry.type))return json(origin,{error:"Unsupported document type."},400);
  if(!(await signatureMatches(entry)))return json(origin,{error:"File content does not match its declared document type."},400);

  const filename=safeName(entry.name);
  const path=`${access.contact_id}/${requestId}/${filename}`;

  const {data:existing,error:existingError}=await admin.from("client_documents")
    .select("id,contact_id,storage_path,status").eq("id",requestId).maybeSingle();
  if(existingError)return json(origin,{error:"Unable to verify upload request."},500);
  if(existing){
    if(existing.contact_id!==access.contact_id)return json(origin,{error:"Upload request ID is already in use."},409);
    const parts=String(existing.storage_path).split("/");
    const objectName=parts.pop()||"";
    const folder=parts.join("/");
    const {data:objects,error:listError}=await admin.storage.from("client-documents").list(folder,{search:objectName,limit:10});
    if(listError)return json(origin,{error:"Unable to verify existing document."},500);
    if((objects||[]).some((object)=>object.name===objectName)&&existing.status==="active"){
      return json(origin,{ok:true,document_id:existing.id,replayed:true},200);
    }
    return json(origin,{error:"This upload request is incomplete. Retry shortly with the same file."},409);
  }

  let rowCreated=false;
  let objectUploaded=false;
  try{
    const {error:rowError}=await admin.from("client_documents").insert({
      id:requestId,
      contact_id:access.contact_id,
      membership_id:access.membership_id||null,
      category,
      title,
      description:description||null,
      storage_path:path,
      original_filename:entry.name,
      content_type:entry.type,
      size_bytes:entry.size,
      member_visible:true,
      status:"active",
      uploaded_by_user_id:user.id,
      uploaded_by_contact_id:access.contact_id
    });
    if(rowError)throw rowError;
    rowCreated=true;

    const {error:uploadError}=await admin.storage.from("client-documents").upload(path,entry,{
      contentType:entry.type,cacheControl:"3600",upsert:false
    });
    if(uploadError)throw uploadError;
    objectUploaded=true;

    await admin.from("contact_activity").insert({
      contact_id:access.contact_id,
      activity_type:"member_document_uploaded",
      title:"Member document uploaded",
      actor_user_id:user.id,
      metadata:{document_id:requestId,category}
    });

    return json(origin,{ok:true,document_id:requestId},201);
  }catch(error){
    console.error(error);
    if(objectUploaded){
      const {error:removeError}=await admin.storage.from("client-documents").remove([path]);
      if(removeError)console.error("Document cleanup storage failure",removeError);
    }
    if(rowCreated){
      const {error:deleteError}=await admin.from("client_documents").delete().eq("id",requestId);
      if(deleteError)console.error("Document cleanup database failure",deleteError);
    }
    return json(origin,{error:"Document could not be saved. No partial upload was kept."},500);
  }
}
