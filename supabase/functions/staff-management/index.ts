import { callerClient } from "../_shared/authorization.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const allowedOrigins=new Set([
  "https://revitalizedacademy.com",
  "https://www.revitalizedacademy.com",
  "http://localhost:3000",
  "http://localhost:5173"
]);
const roles=new Set(["owner","admin","coach","financial","support"]);

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
function clean(v:unknown,max=5000){return String(v||"").trim().slice(0,max);}
function splitName(name:string){
  const parts=name.trim().split(/\s+/).filter(Boolean);
  return {first:parts[0]||name,last:parts.slice(1).join(" ")||null};
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
  if(userError||!userData.user)return json(origin,{error:"Authentication required"},401);

  const actor=userData.user;
  const caller=callerClient(supabaseUrl,secretKey,bearer);
  const {data:actorStaff,error:actorStaffError}=await admin.from("staff_access")
    .select("user_id,role,display_name,status")
    .eq("user_id",actor.id).maybeSingle();
  if(actorStaffError||!actorStaff||actorStaff.status!=="active")return json(origin,{error:"Active staff access required"},403);

  async function hasPermission(permissionKey:string){
    const {data,error}=await caller.rpc("staff_action_allowed",{p_permission_key:permissionKey,p_contact_id:null});
    return !error&&data===true;
  }

  if(!(await hasPermission("staff.manage"))){
    return json(origin,{error:"You do not have permission to manage staff access."},403);
  }

  async function audit(staffUserId:string|null,action:string,previousValue:any,newValue:any,reason:string|null){
    const {error}=await admin.from("staff_access_audit").insert({
      staff_user_id:staffUserId,
      action,
      actor_user_id:actor.id,
      previous_value:previousValue||{},
      new_value:newValue||{},
      reason
    });
    if(error)throw error;
  }

  async function ensureStaffContact(userId:string,email:string,displayName:string){
    const normalizedEmail=email.trim().toLowerCase();
    let {data:contact,error:contactError}=await admin.from("contacts")
      .select("id,first_name,last_name,email,lifecycle_stage,follow_up_status")
      .ilike("email",normalizedEmail).limit(1).maybeSingle();
    if(contactError)throw contactError;

    const names=splitName(displayName);

    if(!contact){
      const {data:created,error}=await admin.from("contacts").insert({
        first_name:names.first,
        last_name:names.last,
        email:normalizedEmail,
        lifecycle_stage:"inactive",
        follow_up_status:"closed",
        consultation_status:"not_scheduled",
        first_source:"staff_invite",
        last_source:"staff_invite"
      }).select("id,first_name,last_name,email,lifecycle_stage,follow_up_status").single();
      if(error)throw error;
      contact=created;
    }else{
      const {data:updated,error}=await admin.from("contacts").update({
        first_name:contact.first_name||names.first,
        last_name:contact.last_name||names.last,
        lifecycle_stage:"inactive",
        follow_up_status:"closed",
        updated_at:new Date().toISOString()
      }).eq("id",contact.id)
        .select("id,first_name,last_name,email,lifecycle_stage,follow_up_status").single();
      if(error)throw error;
      contact=updated;
    }

    const {error:profileError}=await admin.from("profiles").upsert({
      user_id:userId,
      contact_id:contact.id
    },{onConflict:"user_id"});
    if(profileError)throw profileError;

    const {error:tagError}=await admin.from("contact_tags").upsert({
      contact_id:contact.id,
      tag:"staff",
      source:"system",
      rule_key:"staff-access",
      updated_at:new Date().toISOString()
    },{onConflict:"contact_id,tag"});
    if(tagError)throw tagError;

    return contact;
  }

  try{
    const body=await req.json();
    const action=String(body.action||"");
    const reason=clean(body.reason,2000)||null;

    if(action==="invite"){
      const email=clean(body.email,320).toLowerCase();
      const displayName=clean(body.display_name,240);
      const role=String(body.role||"support");
      const contactScope=String(body.contact_scope||(["owner","admin","financial"].includes(role)?"all":"assigned"));
      if(!email||!displayName)return json(origin,{error:"Name and email are required."},400);
      if(!roles.has(role))return json(origin,{error:"Invalid staff role."},400);
      if(!new Set(["all","assigned","none"]).has(contactScope))return json(origin,{error:"Invalid People data scope."},400);
      if(role==="owner"&&actorStaff.role!=="owner")return json(origin,{error:"Only an Owner can invite another Owner."},403);

      const redirectTo="https://revitalizedacademy.com/portal/";

      let existingAuthUser=null;
      let page=1;
      for(let i=0;i<10&&!existingAuthUser;i++){
        const {data:listData,error:listError}=await admin.auth.admin.listUsers({page,perPage:100});
        if(listError)throw listError;
        existingAuthUser=(listData.users||[]).find((candidate)=>
          String(candidate.email||"").toLowerCase()===email
        )||null;
        if((listData.users||[]).length<100)break;
        page+=1;
      }

      let userId=null;
      let invitationSent=false;

      if(existingAuthUser?.id){
        userId=existingAuthUser.id;
      }else{
        const {data:invite,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{
          redirectTo,
          data:{
            full_name:displayName,
            staff_invite:true,
            staff_role:role
          }
        });
        if(inviteError)throw inviteError;
        if(!invite.user?.id)throw new Error("Supabase did not return the invited user.");
        userId=invite.user.id;
        invitationSent=true;
      }
      const contact=await ensureStaffContact(userId,email,displayName);

      const {data:existingStaff}=await admin.from("staff_access")
        .select("role,display_name,status").eq("user_id",userId).maybeSingle();

      const {error:staffError}=await admin.from("staff_access").upsert({
        user_id:userId,
        role,
        display_name:displayName,
        status:"active",
        contact_scope:contactScope,
        updated_at:new Date().toISOString(),
        updated_by:actor.id
      },{onConflict:"user_id"});
      if(staffError)throw staffError;

      const {data:invitation,error:invitationError}=await admin.from("staff_invitations").insert({
        email,
        display_name:displayName,
        role,
        status:invitationSent?"invited":"accepted",
        auth_user_id:userId,
        invited_by:actor.id,
        invited_at:new Date().toISOString(),
        accepted_at:invitationSent?null:new Date().toISOString(),
        expires_at:invitationSent?new Date(Date.now()+7*86400000).toISOString():null,
        metadata:{contact_id:contact.id,existing_auth_user:!invitationSent}
      }).select("*").single();
      if(invitationError)throw invitationError;

      await audit(userId,"staff_invited",existingStaff||{},{
        role,display_name:displayName,status:"active",contact_scope:contactScope,email,contact_id:contact.id
      },reason);

      return json(origin,{
        ok:true,
        user_id:userId,
        contact_id:contact.id,
        invitation,
        invitation_sent:invitationSent,
        existing_auth_user:!invitationSent
      });
    }

    if(action==="update_role"){
      const userId=String(body.user_id||"");
      const role=String(body.role||"");
      if(!roles.has(role))return json(origin,{error:"Invalid staff role."},400);

      const {data:target,error:targetError}=await admin.from("staff_access")
        .select("user_id,role,display_name,status").eq("user_id",userId).maybeSingle();
      if(targetError)throw targetError;
      if(!target)return json(origin,{error:"Staff member not found."},404);

      if((target.role==="owner"||role==="owner")&&actorStaff.role!=="owner"){
        return json(origin,{error:"Only an Owner can change Owner access."},403);
      }
      if(userId===actor.id&&target.role==="owner"&&role!=="owner"){
        return json(origin,{error:"An Owner cannot demote their own account from this screen."},409);
      }

      const {data:updated,error}=await admin.from("staff_access").update({
        role,updated_at:new Date().toISOString(),updated_by:actor.id
      }).eq("user_id",userId).select("*").single();
      if(error)throw error;

      await audit(userId,"staff_role_changed",target,updated,reason);
      return json(origin,{ok:true,staff:updated});
    }

    if(action==="set_status"){
      const userId=String(body.user_id||"");
      const status=String(body.status||"");
      if(!new Set(["active","inactive","suspended"]).has(status))return json(origin,{error:"Invalid staff status."},400);

      const {data:target,error:targetError}=await admin.from("staff_access")
        .select("user_id,role,display_name,status").eq("user_id",userId).maybeSingle();
      if(targetError)throw targetError;
      if(!target)return json(origin,{error:"Staff member not found."},404);

      if(target.role==="owner"&&actorStaff.role!=="owner"){
        return json(origin,{error:"Only an Owner can change another Owner's account status."},403);
      }
      if(userId===actor.id&&status!=="active"){
        return json(origin,{error:"You cannot deactivate or suspend your own account."},409);
      }

      const {data:updated,error}=await admin.from("staff_access").update({
        status,updated_at:new Date().toISOString(),updated_by:actor.id
      }).eq("user_id",userId).select("*").single();
      if(error)throw error;

      await audit(userId,"staff_status_changed",target,updated,reason);
      return json(origin,{ok:true,staff:updated});
    }

    if(action==="set_contact_scope"){
      const userId=String(body.user_id||"");
      const contactScope=String(body.contact_scope||"");
      if(!new Set(["all","assigned","none"]).has(contactScope))return json(origin,{error:"Invalid People data scope."},400);

      const {data:target,error:targetError}=await admin.from("staff_access")
        .select("user_id,role,display_name,status,contact_scope").eq("user_id",userId).maybeSingle();
      if(targetError)throw targetError;
      if(!target)return json(origin,{error:"Staff member not found."},404);

      if(target.role==="owner"&&actorStaff.role!=="owner"){
        return json(origin,{error:"Only an Owner can change another Owner's People data scope."},403);
      }

      const {data:updated,error}=await admin.from("staff_access").update({
        contact_scope:contactScope,
        updated_at:new Date().toISOString(),
        updated_by:actor.id
      }).eq("user_id",userId).select("*").single();
      if(error)throw error;

      await audit(userId,"staff_contact_scope_changed",target,updated,clean(body.reason,2000)||null);
      return json(origin,{ok:true,staff:updated});
    }

    if(action==="set_permission"){
      const userId=String(body.user_id||"");
      const permissionKey=String(body.permission_key||"");
      const allowed=Boolean(body.allowed);

      const {data:target,error:targetError}=await admin.from("staff_access")
        .select("user_id,role,display_name,status").eq("user_id",userId).maybeSingle();
      if(targetError)throw targetError;
      if(!target)return json(origin,{error:"Staff member not found."},404);

      if(target.role==="owner"&&actorStaff.role!=="owner"){
        return json(origin,{error:"Only an Owner can change another Owner's permissions."},403);
      }

      const {data:catalog,error:catalogError}=await admin.from("staff_permission_catalog")
        .select("permission_key,label").eq("permission_key",permissionKey).eq("active",true).maybeSingle();
      if(catalogError)throw catalogError;
      if(!catalog)return json(origin,{error:"Unknown permission."},400);

      const {data:previous}=await admin.from("staff_permission_overrides")
        .select("*").eq("user_id",userId).eq("permission_key",permissionKey).maybeSingle();

      const {data:updated,error}=await admin.from("staff_permission_overrides").upsert({
        user_id:userId,
        permission_key:permissionKey,
        allowed,
        reason,
        updated_by:actor.id,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id,permission_key"}).select("*").single();
      if(error)throw error;

      await audit(userId,"staff_permission_changed",previous||{},updated,reason);
      return json(origin,{ok:true,permission:updated});
    }

    if(action==="clear_permission_override"){
      const userId=String(body.user_id||"");
      const permissionKey=String(body.permission_key||"");

      const {data:target}=await admin.from("staff_access")
        .select("role").eq("user_id",userId).maybeSingle();
      if(!target)return json(origin,{error:"Staff member not found."},404);
      if(target.role==="owner"&&actorStaff.role!=="owner"){
        return json(origin,{error:"Only an Owner can change another Owner's permissions."},403);
      }

      const {data:previous}=await admin.from("staff_permission_overrides")
        .select("*").eq("user_id",userId).eq("permission_key",permissionKey).maybeSingle();

      const {error}=await admin.from("staff_permission_overrides")
        .delete().eq("user_id",userId).eq("permission_key",permissionKey);
      if(error)throw error;

      await audit(userId,"staff_permission_override_cleared",previous||{},{
        permission_key:permissionKey,uses_role_default:true
      },reason);

      return json(origin,{ok:true});
    }

    return json(origin,{error:"Invalid staff management action."},400);
  }catch(error){
    console.error(error);
    return json(origin,{error:error instanceof Error?error.message:"Staff management failed."},500);
  }
});