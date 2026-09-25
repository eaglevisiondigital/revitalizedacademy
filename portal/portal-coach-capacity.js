(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let activeContact=null;
  let capacityStaff=null;
  let capacity=null;
  let availability=[];
  let entitlementRows=[];
  let usageReviews=[];

  function setStatus(id,message,type=""){
    const target=el(id);if(!target)return;
    target.textContent=message||"";
    target.className="form-status"+(type?" "+type:"");
  }

  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function closeCapacity(){
    capacityStaff=null;capacity=null;availability=[];
    el("staff-capacity-modal").classList.add("hidden");
    el("staff-capacity-modal").setAttribute("aria-hidden","true");
    setStatus("staff-capacity-status","");
  }

  async function loadCapacity(userId){
    const [settingsResult,availabilityResult]=await Promise.all([
      client.from("staff_capacity_settings").select("*").eq("user_id",userId).maybeSingle(),
      client.from("staff_availability_rules").select("*").eq("user_id",userId).eq("active",true).order("day_of_week").order("start_time")
    ]);
    if(settingsResult.error)throw settingsResult.error;
    if(availabilityResult.error)throw availabilityResult.error;
    capacity=settingsResult.data||null;
    availability=availabilityResult.data||[];
    renderCapacity();
  }

  function renderCapacity(){
    if(!capacityStaff)return;
    el("staff-capacity-title").textContent=(capacityStaff.display_name||"Coach")+" · Capacity";
    el("staff-capacity-meta").textContent="Configure workload limits and recurring availability. Limits can be left blank until Justyn and Elle decide the right capacity.";

    el("capacity-max-clients").value=capacity?.max_active_clients??"";
    el("capacity-max-day").value=capacity?.max_sessions_per_day??"";
    el("capacity-max-week").value=capacity?.max_sessions_per_week??"";
    el("capacity-buffer").value=capacity?.session_buffer_minutes??15;
    el("capacity-session-minutes").value=capacity?.default_session_minutes??60;
    el("capacity-timezone").value=capacity?.time_zone||"";
    el("capacity-accepting").checked=capacity?.accepts_new_clients!==false;
    el("capacity-notes").value=capacity?.notes||"";
    el("availability-timezone").value=capacity?.time_zone||availability[0]?.time_zone||"";

    const list=el("staff-availability-list");
    list.replaceChildren();
    if(!availability.length){
      list.innerHTML='<div class="empty-state">No recurring availability windows configured yet.</div>';
      return;
    }

    availability.forEach((row)=>{
      const item=document.createElement("div");item.className="staff-availability-row";
      const day=document.createElement("strong");day.textContent=days[row.day_of_week]||"Day";
      const time=document.createElement("span");time.textContent=row.start_time.slice(0,5)+" – "+row.end_time.slice(0,5)+" · "+row.time_zone;
      const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";
      remove.disabled=!(portal.hasPermission?.("staff.manage")??false)&&row.user_id!==portal.currentUserId();
      remove.addEventListener("click",()=>removeAvailability(row));
      item.append(day,time,remove);list.append(item);
    });
  }

  async function openCapacity(event){
    capacityStaff=event.detail?.staff;
    if(!capacityStaff)return;
    el("staff-capacity-modal").classList.remove("hidden");
    el("staff-capacity-modal").setAttribute("aria-hidden","false");
    setStatus("staff-capacity-status","Loading...");
    try{
      await loadCapacity(capacityStaff.user_id);
      setStatus("staff-capacity-status","");
    }catch(error){
      setStatus("staff-capacity-status",error.message,"error");
    }
  }

  async function saveCapacity(event){
    event.preventDefault();
    if(!capacityStaff)return;
    const canManage=(portal.hasPermission?.("staff.manage")??false)||capacityStaff.user_id===portal.currentUserId();
    if(!canManage){setStatus("staff-capacity-status","You do not have permission to change this staff member’s capacity.","error");return;}

    const num=(id)=>el(id).value===""?null:Number(el(id).value);
    setStatus("staff-capacity-status","Saving capacity...");
    const {error}=await client.from("staff_capacity_settings").upsert({
      user_id:capacityStaff.user_id,
      max_active_clients:num("capacity-max-clients"),
      max_sessions_per_day:num("capacity-max-day"),
      max_sessions_per_week:num("capacity-max-week"),
      session_buffer_minutes:Number(el("capacity-buffer").value||15),
      default_session_minutes:Number(el("capacity-session-minutes").value||60),
      accepts_new_clients:el("capacity-accepting").checked,
      time_zone:el("capacity-timezone").value.trim()||null,
      notes:el("capacity-notes").value.trim()||null,
      updated_by:portal.currentUserId(),
      updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
    if(error){setStatus("staff-capacity-status",error.message,"error");return;}
    setStatus("staff-capacity-status","Capacity saved.","success");
    await loadCapacity(capacityStaff.user_id);
    document.dispatchEvent(new CustomEvent("ra:dashboard-loaded"));
  }

  async function addAvailability(event){
    event.preventDefault();
    if(!capacityStaff)return;
    const canManage=(portal.hasPermission?.("staff.manage")??false)||capacityStaff.user_id===portal.currentUserId();
    if(!canManage)return;

    const tz=el("availability-timezone").value.trim()||el("capacity-timezone").value.trim();
    if(!tz){window.alert("Enter the time zone for this availability window.");return;}

    const {error}=await client.from("staff_availability_rules").insert({
      user_id:capacityStaff.user_id,
      day_of_week:Number(el("availability-day").value),
      start_time:el("availability-start").value,
      end_time:el("availability-end").value,
      time_zone:tz,
      active:true,
      created_by:portal.currentUserId()
    });
    if(error){window.alert(error.message);return;}
    event.currentTarget.reset();
    el("availability-timezone").value=capacity?.time_zone||tz;
    await loadCapacity(capacityStaff.user_id);
  }

  async function removeAvailability(row){
    if(!window.confirm("Remove this recurring availability window?"))return;
    const {error}=await client.from("staff_availability_rules").delete().eq("id",row.id);
    if(error){window.alert(error.message);return;}
    await loadCapacity(capacityStaff.user_id);
  }

  async function loadClientEntitlements(contactId){
    if(!(portal.hasPermission?.("coaching.view")??false)){
      el("client-coaching-access-section").classList.add("hidden");
      return;
    }

    const [entResult,reviewResult]=await Promise.all([
      client.from("admin_client_coaching_entitlements").select("*").eq("contact_id",contactId),
      client.from("coaching_entitlement_usage").select("*,coaching_sessions:coaching_session_id(scheduled_start,coach_user_id,status)")
        .eq("contact_id",contactId).eq("status","review").order("created_at",{ascending:false})
    ]);

    if(entResult.error||reviewResult.error){
      setStatus("client-coaching-access-status",(entResult.error||reviewResult.error).message,"error");
      return;
    }

    entitlementRows=entResult.data||[];
    usageReviews=reviewResult.data||[];
    renderClientEntitlements();
  }

  function renderClientEntitlements(){
    const section=el("client-coaching-access-section");
    if(!activeContact){
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");
    el("client-coaching-access-chip").textContent=entitlementRows.length+" Entitlement"+(entitlementRows.length===1?"":"s");

    const list=el("client-coaching-entitlement-list");
    list.replaceChildren();

    if(!entitlementRows.length){
      list.innerHTML='<div class="drawer-empty">No coaching entitlements are active for this membership yet.</div>';
      return;
    }

    entitlementRows.forEach((row)=>{
      const item=document.createElement("div");item.className="client-coaching-entitlement-item";
      const top=document.createElement("div");top.className="client-coaching-entitlement-top";
      const heading=document.createElement("strong");heading.textContent=row.label;
      const state=document.createElement("small");state.textContent=row.limit_value===null?"Unlimited / not numerically configured":row.limit_value+" included";
      top.append(heading,state);item.append(top);

      const stats=document.createElement("div");stats.className="client-coaching-entitlement-stats";
      [
        ["Included",row.limit_value===null?"—":row.limit_value],
        ["Used",row.used_value||0],
        ["Reserved",row.reserved_sessions||0],
        ["Remaining",row.remaining_value===null?"—":row.remaining_value],
        ["Review",row.review_sessions||0]
      ].forEach(([label,value])=>{
        const d=document.createElement("div");const s=document.createElement("span");s.textContent=label;const b=document.createElement("b");b.textContent=String(value);d.append(s,b);stats.append(d);
      });
      item.append(stats);

      usageReviews.filter(u=>u.entitlement_key===row.entitlement_key).forEach((review)=>{
        const r=document.createElement("div");r.className="client-entitlement-review";
        const text=document.createElement("span");
        text.textContent="No-show on "+(review.coaching_sessions?.scheduled_start?portal.formatDate(review.coaching_sessions.scheduled_start,true):"coaching session")+" · decide whether this session counts.";
        const actions=document.createElement("div");actions.className="client-entitlement-review-actions";
        const count=document.createElement("button");count.type="button";count.textContent="Count Session";count.addEventListener("click",()=>resolveReview(review,"consumed"));
        const release=document.createElement("button");release.type="button";release.textContent="Release Session";release.addEventListener("click",()=>resolveReview(review,"released"));
        actions.append(count,release);r.append(text,actions);item.append(r);
      });

      list.append(item);
    });
  }

  async function resolveReview(row,resolution){
    const reason=window.prompt(resolution==="consumed"?"Reason this no-show should count against the session allowance:":"Reason this no-show should not count against the session allowance:","");
    if(!reason?.trim())return;
    const {error}=await client.rpc("resolve_coaching_entitlement_review",{
      p_usage_id:row.id,p_resolution:resolution,p_reason:reason.trim()
    });
    if(error){window.alert(error.message);return;}
    await loadClientEntitlements(activeContact.id);
  }

  document.addEventListener("ra:open-capacity",openCapacity);
  el("staff-capacity-form").addEventListener("submit",saveCapacity);
  el("staff-availability-form").addEventListener("submit",addAvailability);
  document.querySelectorAll("[data-staff-capacity-close]").forEach(n=>n.addEventListener("click",closeCapacity));

  document.addEventListener("ra:contact-opened",(event)=>{
    activeContact=event.detail.contact;
    loadClientEntitlements(event.detail.contactId);
  });
  document.addEventListener("ra:contact-closed",()=>{
    activeContact=null;entitlementRows=[];usageReviews=[];
    el("client-coaching-access-section").classList.add("hidden");
  });
})();