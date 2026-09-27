import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import { callerClient } from "../_shared/authorization.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const MAX_FILE_BYTES=15*1024*1024;
const MIME_EXT:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
const ANGLES=["front","side","back","other"] as const;

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
function validDate(value:string){
  return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+"T00:00:00Z"));
}
async function signatureMatches(file:File){
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(file.type==="image/jpeg")return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(file.type==="image/png")return bytes.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v,i)=>bytes[i]===v);
  if(file.type==="image/webp")return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
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
  const {data:access,error:accessError}=await admin
    .from("client_access")
    .select("contact_id,membership_id")
    .eq("user_id",user.id)
    .eq("status","active")
    .limit(1)
    .maybeSingle();
  if(accessError)return json(origin,{error:"Unable to resolve member access."},500);
  if(!access?.contact_id)return json(origin,{error:"Active member access is required."},403);

  let form:FormData;
  try{form=await req.formData();}catch{return json(origin,{error:"Multipart form data required."},400);}

  const requestId=String(form.get("request_id")||"").trim();
  const label=String(form.get("label")||"").trim();
  const capturedOn=String(form.get("captured_on")||"").trim();
  const notes=String(form.get("notes")||"").trim();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))return json(origin,{error:"Valid upload request ID required."},400);
  if(label.length>120)return json(origin,{error:"Photo set label must be 120 characters or fewer."},400);
  if(notes.length>2000)return json(origin,{error:"Photo set notes must be 2000 characters or fewer."},400);
  if(!validDate(capturedOn))return json(origin,{error:"A valid captured date is required."},400);
  if(capturedOn>new Date().toISOString().slice(0,10))return json(origin,{error:"Progress photo date cannot be in the future."},400);

  const files:{angle:string,file:File}[]=[];
  for(const angle of ANGLES){
    const value=form.get(angle);
    if(!(value instanceof File)||value.size===0)continue;
    if(!MIME_EXT[value.type])return json(origin,{error:"Progress photos must be JPEG, PNG or WebP."},400);
    if(value.size>MAX_FILE_BYTES)return json(origin,{error:"Each progress photo must be 15 MB or smaller."},400);
    if(!(await signatureMatches(value)))return json(origin,{error:"Image content does not match its declared file type."},400);
    files.push({angle,file:value});
  }
  if(!files.length)return json(origin,{error:"At least one progress photo is required."},400);

  const requestedAngles=files.map((entry)=>entry.angle).sort();
  const {data:existingSet,error:existingSetError}=await admin
    .from("progress_photo_sets")
    .select("id,contact_id")
    .eq("id",requestId)
    .maybeSingle();
  if(existingSetError)return json(origin,{error:"Unable to verify upload request."},500);
  if(existingSet){
    if(existingSet.contact_id!==access.contact_id)return json(origin,{error:"Upload request ID is already in use."},409);
    const {data:existingPhotos,error:existingPhotosError}=await admin
      .from("progress_photos")
      .select("angle")
      .eq("set_id",requestId)
      .eq("contact_id",access.contact_id);
    if(existingPhotosError)return json(origin,{error:"Unable to verify existing photo set."},500);
    const existingAngles=(existingPhotos||[]).map((row)=>row.angle).sort();
    if(existingAngles.length===requestedAngles.length&&existingAngles.every((value,index)=>value===requestedAngles[index])){
      return json(origin,{ok:true,set_id:requestId,photo_count:existingAngles.length,replayed:true},200);
    }
    return json(origin,{error:"This upload request is still incomplete. Retry shortly with the same files."},409);
  }

  let setId:string|null=null;
  const uploadedPaths:string[]=[];
  async function cleanup(){
    if(uploadedPaths.length){
      const {error}=await admin.storage.from("progress-photos").remove(uploadedPaths);
      if(error)console.error("Progress photo cleanup storage failure",error);
    }
    if(setId){
      const {error}=await admin.from("progress_photo_sets").delete().eq("id",setId);
      if(error)console.error("Progress photo cleanup database failure",error);
    }
  }

  try{
    const {data:set,error:setError}=await admin.from("progress_photo_sets").insert({
      id:requestId,
      contact_id:access.contact_id,
      membership_id:access.membership_id||null,
      label:label||null,
      captured_on:capturedOn,
      notes:notes||null,
      created_by:user.id
    }).select("id").single();
    if(setError||!set)throw setError||new Error("Photo set was not created.");
    setId=set.id;

    for(const entry of files){
      const ext=MIME_EXT[entry.file.type];
      const path=`${access.contact_id}/${setId}/${entry.angle}-${crypto.randomUUID()}.${ext}`;
      const {error:uploadError}=await admin.storage.from("progress-photos").upload(path,entry.file,{
        contentType:entry.file.type,cacheControl:"3600",upsert:false
      });
      if(uploadError)throw uploadError;
      uploadedPaths.push(path);

      const {error:photoError}=await admin.from("progress_photos").insert({
        set_id:setId,
        contact_id:access.contact_id,
        membership_id:access.membership_id||null,
        angle:entry.angle,
        storage_path:path,
        mime_type:entry.file.type,
        file_size_bytes:entry.file.size,
        created_by:user.id
      });
      if(photoError)throw photoError;
    }

    await admin.from("contact_activity").insert({
      contact_id:access.contact_id,
      activity_type:"progress_photo_set_added",
      title:"Progress photo set added",
      actor_user_id:user.id,
      metadata:{set_id:setId,photo_count:files.length,captured_on:capturedOn}
    });

    return json(origin,{ok:true,set_id:setId,photo_count:files.length},201);
  }catch(error){
    console.error(error);
    await cleanup();
    return json(origin,{error:"Progress photos could not be saved. No partial photo set was kept."},500);
  }
}
