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
function clean(value:unknown,max=20000){return String(value||"").trim().slice(0,max);}
function chunkText(text:string,maxLen=1400,overlap=180){
  const normalized=text.replace(/\r/g,"").replace(/\n{3,}/g,"\n\n").trim();
  if(!normalized)return [];
  const chunks:string[]=[];
  let start=0;
  while(start<normalized.length){
    let end=Math.min(normalized.length,start+maxLen);
    if(end<normalized.length){
      const para=normalized.lastIndexOf("\n\n",end);
      const sentence=Math.max(
        normalized.lastIndexOf(". ",end),
        normalized.lastIndexOf("? ",end),
        normalized.lastIndexOf("! ",end)
      );
      const preferred=Math.max(para,sentence);
      if(preferred>start+Math.floor(maxLen*.55))end=preferred+1;
    }
    const piece=normalized.slice(start,end).trim();
    if(piece)chunks.push(piece);
    if(end>=normalized.length)break;
    start=Math.max(end-overlap,start+1);
  }
  return chunks.slice(0,200);
}

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
  if(!["owner","admin","coach"].includes(staff.role))return json(origin,{error:"This staff role cannot manage Coach Companion knowledge."},403);

  try{
    await assertStaffAction(caller,"companion.manage");
    const body=await req.json();
    const action=String(body.action||"");

    if(action==="upsert_source"){
      const sourceKey=clean(body.source_key,160);
      const title=clean(body.title,240);
      const sourceType=clean(body.source_type,80);
      const contentText=clean(body.content_text,200000);
      const version=clean(body.version,40)||"1.0";
      const status=String(body.status||"draft");

      if(!sourceKey||!title||!sourceType||!contentText)return json(origin,{error:"Source key, title, source type and content are required."},400);
      if(!new Set(["draft","approved","retired"]).has(status))return json(origin,{error:"Invalid source status."},400);

      const payload:any={
        source_key:sourceKey,title,source_type:sourceType,version,status,
        content_text:contentText,created_by:user.id,updated_at:new Date().toISOString()
      };
      if(status==="approved"){payload.approved_by=user.id;payload.approved_at=new Date().toISOString();}

      const {data:source,error}=await admin.from("coach_companion_knowledge_sources")
        .upsert(payload,{onConflict:"source_key"}).select("*").single();
      if(error)throw error;

      return json(origin,{ok:true,source});
    }

    if(action==="embed_source"||action==="approve_and_embed"){
      const sourceId=String(body.source_id||"");
      let source:any=null;

      if(action==="approve_and_embed"){
        const now=new Date().toISOString();
        const {data,error}=await admin.from("coach_companion_knowledge_sources")
          .update({status:"approved",approved_by:user.id,approved_at:now,updated_at:now})
          .eq("id",sourceId).select("*").single();
        if(error)throw error;
        source=data;
      }else{
        const {data,error}=await admin.from("coach_companion_knowledge_sources")
          .select("*").eq("id",sourceId).maybeSingle();
        if(error)throw error;
        source=data;
      }

      if(!source)return json(origin,{error:"Knowledge source not found."},404);
      if(source.status!=="approved")return json(origin,{error:"Only approved knowledge sources can be embedded."},409);

      const chunks=chunkText(source.content_text||"");
      if(!chunks.length)return json(origin,{error:"Knowledge source has no embeddable content."},400);

      const ai=new Supabase.ai.Session("gte-small");
      const now=new Date().toISOString();
      const rows:any[]=[];

      for(let i=0;i<chunks.length;i++){
        const embedding=await ai.run(chunks[i],{mean_pool:true,normalize:true});
        rows.push({
          source_id:source.id,
          chunk_index:i,
          heading:null,
          content:chunks[i],
          embedding:Array.from(embedding),
          embedding_model:"gte-small",
          embedding_updated_at:now,
          active:true,
          updated_at:now
        });
      }

      const {error:deleteError}=await admin.from("coach_companion_knowledge_chunks")
        .delete().eq("source_id",source.id);
      if(deleteError)throw deleteError;

      const {data:inserted,error:insertError}=await admin.from("coach_companion_knowledge_chunks")
        .insert(rows).select("id,chunk_index");
      if(insertError)throw insertError;

      return json(origin,{ok:true,source_id:source.id,chunks:(inserted||[]).length});
    }

    return json(origin,{error:"Invalid knowledge action."},400);
  }catch(error){
    console.error(error);
    return json(origin,{error:error instanceof Error?error.message:"Knowledge operation failed."},(error as {status?:number})?.status===403?403:500);
  }
}
