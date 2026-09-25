(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let view="today";
  let rows=[];
  let conflicts=new Set();

  function title(v){return portal.titleCase(v||"");}
  function stat(label,value){
    const card=document.createElement("div");
    card.className="team-calendar-stat";
    const s=document.createElement("span");s.textContent=label;
    const b=document.createElement("strong");b.textContent=String(value);
    card.append(s,b);return card;
  }

  function dayBounds(){
    const now=new Date();
    const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    let end;
    if(view==="today")end=new Date(start.getTime()+86400000);
    else if(view==="week")end=new Date(start.getTime()+7*86400000);
    else end=new Date(start.getTime()+90*86400000);
    return {start,end};
  }

  function setView(next){
    view=next;
    ["today","week","upcoming"].forEach((v)=>el("calendar-view-"+v).classList.toggle("active",v===view));
    load();
  }

  function render(){
    const list=el("team-calendar-list");
    list.replaceChildren();

    const scheduled=rows.filter(r=>r.status==="scheduled").length;
    const completed=rows.filter(r=>r.status==="completed").length;
    const requested=rows.filter(r=>r.status==="requested").length;
    const noShow=rows.filter(r=>r.status==="no_show").length;
    const coaches=new Set(rows.map(r=>r.staff_user_id).filter(Boolean)).size;

    el("team-calendar-summary").replaceChildren(
      stat("Scheduled",scheduled),
      stat("Requested",requested),
      stat("Completed",completed),
      stat("No Shows",noShow),
      stat("Staff Scheduled",coaches)
    );

    if(!rows.length){
      list.innerHTML='<div class="empty-state">No appointments match this calendar view.</div>';
      return;
    }

    rows.forEach((row)=>{
      const item=document.createElement("article");
      item.className="team-calendar-item"+(conflicts.has(row.item_id)?" conflict":"");

      const time=document.createElement("div");
      time.className="team-calendar-time";
      const timeStrong=document.createElement("strong");
      timeStrong.textContent=row.scheduled_start?portal.formatDate(row.scheduled_start,true):"Time not set";
      const timeMeta=document.createElement("span");
      timeMeta.textContent=row.scheduled_end?"Ends "+portal.formatDate(row.scheduled_end,true):(row.time_zone||"");
      time.append(timeStrong,timeMeta);

      const person=document.createElement("div");
      person.className="team-calendar-person";
      const personStrong=document.createElement("strong");
      personStrong.textContent=row.person_name||row.email||"Client";
      const personMeta=document.createElement("span");
      personMeta.textContent=title(row.appointment_type);
      person.append(personStrong,personMeta);

      const staff=document.createElement("div");
      staff.className="team-calendar-staff";
      const staffStrong=document.createElement("strong");
      staffStrong.textContent=row.staff_name||"Unassigned";
      const staffMeta=document.createElement("span");
      staffMeta.textContent=row.format?title(row.format):"";
      staff.append(staffStrong,staffMeta);

      const state=document.createElement("div");
      state.className="team-calendar-state";
      state.textContent=title(row.status)+(conflicts.has(row.item_id)?" · Conflict":"");

      const actions=document.createElement("div");
      actions.className="team-calendar-actions";

      const open=document.createElement("button");
      open.type="button";open.textContent="Open Contact";
      open.addEventListener("click",()=>portal.openContact(row.contact_id));
      actions.append(open);

      if(row.status==="scheduled"||row.status==="requested"){
        const complete=document.createElement("button");
        complete.type="button";complete.className="primary";complete.textContent="Complete";
        complete.addEventListener("click",()=>updateStatus(row,"completed"));
        const noShow=document.createElement("button");
        noShow.type="button";noShow.className="warn";noShow.textContent="No Show";
        noShow.addEventListener("click",()=>updateStatus(row,"no_show"));
        const cancel=document.createElement("button");
        cancel.type="button";cancel.textContent="Cancel";
        cancel.addEventListener("click",()=>updateStatus(row,"cancelled"));
        actions.append(complete,noShow,cancel);
      }

      item.append(time,person,staff,state,actions);
      list.append(item);
    });
  }

  async function updateStatus(row,statusValue){
    const reason=window.prompt("Optional internal note for this schedule change:","")||null;
    const {error}=await client.rpc("update_team_calendar_item",{
      p_item_type:row.item_type,
      p_item_id:row.item_id,
      p_status:statusValue,
      p_reason:reason
    });
    if(error){window.alert(error.message);return;}
    await Promise.all([load(),portal.loadDashboard()]);
  }

  async function load(){
    if(!(portal.hasPermission?.("crm.view")||portal.hasPermission?.("coaching.view"))){
      el("team-calendar-panel").classList.add("hidden");
      return;
    }

    el("team-calendar-panel").classList.remove("hidden");
    const {start,end}=dayBounds();

    let q=client.from("admin_team_calendar").select("*")
      .gte("scheduled_start",start.toISOString())
      .lt("scheduled_start",end.toISOString())
      .order("scheduled_start");

    const staff=el("calendar-staff-filter").value;
    if(staff)q=q.eq("staff_user_id",staff);
    const type=el("calendar-type-filter").value;
    if(type)q=q.eq("appointment_type",type);
    const status=el("calendar-status-filter").value;
    if(status)q=q.eq("status",status);

    const [scheduleResult,conflictResult]=await Promise.all([
      q,
      client.from("admin_schedule_conflicts").select("*")
    ]);

    if(scheduleResult.error){
      el("team-calendar-list").innerHTML='<div class="empty-state">Team calendar could not be loaded. '+scheduleResult.error.message+'</div>';
      return;
    }

    rows=scheduleResult.data||[];
    conflicts=new Set();
    (conflictResult.data||[]).forEach((r)=>{conflicts.add(r.item_a_id);conflicts.add(r.item_b_id);});
    el("team-calendar-conflict-chip").textContent=conflicts.size+" conflict"+(conflicts.size===1?"":"s");
    el("team-calendar-conflict-chip").classList.toggle("warn",conflicts.size>0);
    render();
  }

  function populateStaff(){
    const select=el("calendar-staff-filter");
    portal.staffDirectory().forEach((row)=>{
      if(!["owner","admin","coach","support"].includes(row.role))return;
      const o=document.createElement("option");
      o.value=row.user_id;o.textContent=row.display_name;
      select.append(o);
    });
  }

  populateStaff();
  el("calendar-view-today").addEventListener("click",()=>setView("today"));
  el("calendar-view-week").addEventListener("click",()=>setView("week"));
  el("calendar-view-upcoming").addEventListener("click",()=>setView("upcoming"));
  ["calendar-staff-filter","calendar-type-filter","calendar-status-filter"].forEach(id=>el(id).addEventListener("change",load));
  el("calendar-refresh").addEventListener("click",load);
  document.addEventListener("ra:permissions-loaded",load);
  document.addEventListener("ra:dashboard-loaded",load);
  window.setTimeout(load,1100);
})();