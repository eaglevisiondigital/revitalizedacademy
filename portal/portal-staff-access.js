(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let staffRows=[];
  let inviteRows=[];
  let matrixRows=[];
  let activeStaff=null;
  let myPermissions={};

  function setStatus(id,message,type=""){
    const target=el(id);
    if(!target)return;
    target.textContent=message||"";
    target.className="form-status"+(type?" "+type:"");
  }

  function title(value){
    const labels={admin:"Administrator",financial:"Financial",support:"Support",coach:"Coach",owner:"Owner"};
    return labels[value]||portal.titleCase(value||"");
  }

  function closeInvite(){
    el("staff-invite-modal").classList.add("hidden");
    el("staff-invite-modal").setAttribute("aria-hidden","true");
    setStatus("staff-invite-status","");
  }

  function closePermissions(){
    activeStaff=null;
    el("staff-permissions-modal").classList.add("hidden");
    el("staff-permissions-modal").setAttribute("aria-hidden","true");
    setStatus("staff-account-status","");
    setStatus("staff-permission-status","");
  }

  async function invoke(body){
    const {data,error}=await client.functions.invoke("staff-management",{body});
    if(error)throw new Error(error.message||"Staff management request failed.");
    if(!data?.ok)throw new Error(data?.error||"Staff management request failed.");
    return data;
  }

  async function loadMyPermissions(){
    const {data,error}=await client.rpc("my_staff_permissions");
    if(error){
      myPermissions={};
      return;
    }
    myPermissions=Object.fromEntries((data||[]).map((row)=>[row.permission_key,Boolean(row.allowed)]));
  }

  function statCard(label,value){
    const card=document.createElement("div");
    card.className="staff-access-stat";
    const span=document.createElement("span");span.textContent=label;
    const strong=document.createElement("strong");strong.textContent=String(value);
    card.append(span,strong);
    return card;
  }

  function renderSummary(){
    const active=staffRows.filter((row)=>row.status==="active").length;
    const coaches=staffRows.filter((row)=>row.status==="active"&&row.role==="coach").length;
    const admins=staffRows.filter((row)=>row.status==="active"&&["owner","admin"].includes(row.role)).length;
    const financial=staffRows.filter((row)=>row.status==="active"&&row.role==="financial").length;
    const pending=inviteRows.filter((row)=>["pending","invited"].includes(row.status)).length;

    el("staff-access-summary").replaceChildren(
      statCard("Active staff",active),
      statCard("Owners/Admins",admins),
      statCard("Coaches",coaches),
      statCard("Financial",financial),
      statCard("Pending invites",pending)
    );
  }

  function permissionHighlights(row){
    const perms=row.effective_permissions||{};
    const labels=[];
    if(perms["finance.manage"])labels.push("Financial");
    if(perms["coaching.manage"])labels.push("Coaching");
    if(perms["health.private.view"])labels.push("Private Health");
    if(perms["analytics.view"])labels.push("Analytics");
    if(perms["staff.manage"])labels.push("Staff Admin");
    if(perms["companion.manage"])labels.push("Coach Companion");
    return labels.slice(0,4);
  }

  function renderStaff(){
    renderSummary();
    const list=el("staff-access-list");
    list.replaceChildren();

    const allItems=[
      ...staffRows.map((row)=>({kind:"staff",row})),
      ...inviteRows
        .filter((row)=>["pending","invited"].includes(row.status)&&!staffRows.some((s)=>s.user_id===row.auth_user_id))
        .map((row)=>({kind:"invite",row}))
    ];

    if(!allItems.length){
      list.innerHTML='<div class="empty-state">No staff accounts have been added yet.</div>';
      return;
    }

    allItems.forEach(({kind,row})=>{
      const item=document.createElement("article");
      item.className="staff-access-item"+(kind==="staff"&&row.status!=="active"?" inactive":"");

      const person=document.createElement("div");
      person.className="staff-access-person";
      const name=document.createElement("strong");
      name.textContent=row.display_name||[row.first_name,row.last_name].filter(Boolean).join(" ")||row.email||"Staff member";
      const email=document.createElement("span");
      email.textContent=row.email||"Invitation pending";
      person.append(name,email);

      const role=document.createElement("span");
      role.className="staff-role-pill "+String(row.role||"").toLowerCase();
      role.textContent=title(row.role);

      const state=document.createElement("span");
      state.className="staff-status-pill "+String(row.status||"").toLowerCase();
      state.textContent=kind==="invite"?"Invitation "+portal.titleCase(row.status):portal.titleCase(row.status);

      const perms=document.createElement("div");
      perms.className="staff-access-perms";
      if(kind==="staff"){
        const highlights=permissionHighlights(row);
        if(!highlights.length){
          const chip=document.createElement("span");
          chip.className="staff-access-perm-chip";
          chip.textContent="Limited access";
          perms.append(chip);
        }else{
          highlights.forEach((label)=>{
            const chip=document.createElement("span");
            chip.className="staff-access-perm-chip";
            chip.textContent=label;
            perms.append(chip);
          });
        }
      }else{
        const chip=document.createElement("span");
        chip.className="staff-access-perm-chip";
        chip.textContent="Awaiting acceptance";
        perms.append(chip);
      }

      const actions=document.createElement("div");
      actions.className="staff-access-actions";
      if(kind==="staff"){
        const manage=document.createElement("button");
        manage.type="button";
        manage.textContent="Manage";
        manage.addEventListener("click",()=>openPermissions(row));
        actions.append(manage);
      }

      item.append(person,role,state,perms,actions);
      list.append(item);
    });
  }

  async function load(){
    await loadMyPermissions();

    const panel=el("staff-access-panel");
    if(!myPermissions["staff.view"]){
      panel.classList.add("hidden");
      return;
    }
    panel.classList.remove("hidden");
    el("staff-invite-button").disabled=!myPermissions["staff.manage"];

    const [staffResult,inviteResult]=await Promise.all([
      client.from("admin_staff_access_directory").select("*").order("display_name"),
      client.from("staff_invitations").select("*").order("created_at",{ascending:false}).limit(50)
    ]);

    if(staffResult.error){
      el("staff-access-list").innerHTML='<div class="empty-state">Staff directory could not be loaded. '+staffResult.error.message+'</div>';
      return;
    }

    staffRows=staffResult.data||[];
    inviteRows=inviteResult.error?[]:(inviteResult.data||[]);
    renderStaff();
  }

  function openInvite(){
    if(!myPermissions["staff.manage"])return;
    el("staff-invite-form").reset();
    el("staff-invite-role").value="coach";
    el("staff-invite-modal").classList.remove("hidden");
    el("staff-invite-modal").setAttribute("aria-hidden","false");
    window.setTimeout(()=>el("staff-invite-name").focus(),30);
  }

  async function inviteStaff(event){
    event.preventDefault();
    const name=el("staff-invite-name").value.trim();
    const email=el("staff-invite-email").value.trim().toLowerCase();
    const role=el("staff-invite-role").value;
    const reason=el("staff-invite-reason").value.trim();

    if(!name||!email){
      setStatus("staff-invite-status","Name and email are required.","error");
      return;
    }

    setStatus("staff-invite-status","Creating staff account and sending invitation...");

    try{
      await invoke({
        action:"invite",
        display_name:name,
        email,
        role,
        reason
      });
      setStatus("staff-invite-status","Staff invitation sent. Their account is already assigned the selected access role.","success");
      await load();
      window.setTimeout(closeInvite,650);
    }catch(error){
      setStatus("staff-invite-status",error.message,"error");
    }
  }

  async function loadMatrix(userId){
    const [matrixResult,auditResult]=await Promise.all([
      client.from("admin_staff_permission_matrix").select("*").eq("user_id",userId).order("sort_order"),
      client.from("staff_access_audit").select("*").eq("staff_user_id",userId).order("created_at",{ascending:false}).limit(20)
    ]);
    if(matrixResult.error)throw matrixResult.error;
    matrixRows=matrixResult.data||[];
    renderPermissionMatrix();

    const audit=el("staff-audit-list");
    audit.replaceChildren();
    if(auditResult.error||!(auditResult.data||[]).length){
      audit.innerHTML='<div class="empty-state">No access changes recorded yet.</div>';
    }else{
      (auditResult.data||[]).forEach((row)=>{
        const item=document.createElement("div");
        item.className="staff-audit-item";
        const heading=document.createElement("strong");
        heading.textContent=portal.titleCase(row.action);
        const meta=document.createElement("span");
        meta.textContent=portal.formatDate(row.created_at,true);
        item.append(heading,meta);
        if(row.reason){
          const p=document.createElement("p");
          p.textContent="Reason: "+row.reason;
          item.append(p);
        }
        audit.append(item);
      });
    }
  }

  async function openPermissions(row){
    activeStaff=row;
    el("staff-permissions-title").textContent=row.display_name||"Team member permissions";
    el("staff-permissions-meta").textContent=[
      row.email||"",
      title(row.role),
      portal.titleCase(row.status)
    ].filter(Boolean).join(" · ");
    el("staff-edit-role").value=row.role;
    el("staff-edit-status").value=row.status;
    el("staff-edit-reason").value="";
    el("staff-permission-list").innerHTML='<div class="empty-state">Loading permissions...</div>';
    el("staff-audit-list").innerHTML='<div class="empty-state">Loading audit trail...</div>';
    el("staff-permissions-modal").classList.remove("hidden");
    el("staff-permissions-modal").setAttribute("aria-hidden","false");
    setStatus("staff-account-status","");
    setStatus("staff-permission-status","");

    try{
      await loadMatrix(row.user_id);
    }catch(error){
      setStatus("staff-permission-status",error.message,"error");
    }
  }

  function renderPermissionMatrix(){
    const target=el("staff-permission-list");
    target.replaceChildren();

    const groups=new Map();
    matrixRows.forEach((row)=>{
      if(!groups.has(row.category))groups.set(row.category,[]);
      groups.get(row.category).push(row);
    });

    groups.forEach((rows,category)=>{
      const group=document.createElement("section");
      group.className="staff-permission-category";
      const heading=document.createElement("h3");
      heading.textContent=category;
      group.append(heading);

      rows.forEach((row)=>{
        const line=document.createElement("div");
        line.className="staff-permission-row";

        const copy=document.createElement("div");
        copy.className="staff-permission-copy";
        const label=document.createElement("strong");
        label.textContent=row.label+(row.sensitive?" · Sensitive":"");
        const description=document.createElement("span");
        description.textContent=row.description||"";
        copy.append(label,description);

        const defaultValue=document.createElement("div");
        defaultValue.className="staff-permission-default";
        defaultValue.textContent="Role default: "+(row.role_default_allowed?"Allowed":"Denied");

        const control=document.createElement("div");
        control.className="staff-permission-control";
        const select=document.createElement("select");
        select.innerHTML=
          '<option value="inherit">Inherited</option>'+
          '<option value="allow">Allow</option>'+
          '<option value="deny">Deny</option>';
        select.value=row.override_allowed===null||row.override_allowed===undefined
          ?"inherit"
          :(row.override_allowed?"allow":"deny");
        select.disabled=!myPermissions["staff.manage"];
        select.addEventListener("change",()=>savePermission(row,select.value));
        control.append(select);

        line.append(copy,defaultValue,control);
        group.append(line);
      });

      target.append(group);
    });
  }

  async function savePermission(row,value){
    if(!activeStaff)return;
    const reason=el("staff-edit-reason").value.trim()||"Permission updated from Staff & Access manager.";
    setStatus("staff-permission-status","Saving permission...");

    try{
      if(value==="inherit"){
        await invoke({
          action:"clear_permission_override",
          user_id:activeStaff.user_id,
          permission_key:row.permission_key,
          reason
        });
      }else{
        await invoke({
          action:"set_permission",
          user_id:activeStaff.user_id,
          permission_key:row.permission_key,
          allowed:value==="allow",
          reason
        });
      }

      setStatus("staff-permission-status","Permission saved.","success");
      await Promise.all([loadMatrix(activeStaff.user_id),load()]);
    }catch(error){
      setStatus("staff-permission-status",error.message,"error");
      await loadMatrix(activeStaff.user_id);
    }
  }

  async function saveRole(){
    if(!activeStaff)return;
    const role=el("staff-edit-role").value;
    const reason=el("staff-edit-reason").value.trim();
    if(!reason){
      setStatus("staff-account-status","Enter a reason before changing a staff role.","error");
      return;
    }
    setStatus("staff-account-status","Saving role...");
    try{
      const data=await invoke({
        action:"update_role",
        user_id:activeStaff.user_id,
        role,
        reason
      });
      activeStaff={...activeStaff,...data.staff};
      setStatus("staff-account-status","Role updated.","success");
      await Promise.all([load(),loadMatrix(activeStaff.user_id)]);
    }catch(error){
      setStatus("staff-account-status",error.message,"error");
    }
  }

  async function saveStatus(){
    if(!activeStaff)return;
    const statusValue=el("staff-edit-status").value;
    const reason=el("staff-edit-reason").value.trim();
    if(!reason){
      setStatus("staff-account-status","Enter a reason before changing staff status.","error");
      return;
    }
    setStatus("staff-account-status","Saving status...");
    try{
      const data=await invoke({
        action:"set_status",
        user_id:activeStaff.user_id,
        status:statusValue,
        reason
      });
      activeStaff={...activeStaff,...data.staff};
      setStatus("staff-account-status","Staff status updated.","success");
      await load();
    }catch(error){
      setStatus("staff-account-status",error.message,"error");
    }
  }

  el("staff-invite-button").addEventListener("click",openInvite);
  el("staff-invite-form").addEventListener("submit",inviteStaff);
  el("staff-save-role").addEventListener("click",saveRole);
  el("staff-save-status").addEventListener("click",saveStatus);

  document.querySelectorAll("[data-staff-invite-close]").forEach((node)=>node.addEventListener("click",closeInvite));
  document.querySelectorAll("[data-staff-permissions-close]").forEach((node)=>node.addEventListener("click",closePermissions));

  document.addEventListener("ra:dashboard-loaded",load);
  window.setTimeout(load,500);

  document.addEventListener("keydown",(event)=>{
    if(event.key!=="Escape")return;
    if(!el("staff-invite-modal").classList.contains("hidden"))closeInvite();
    if(!el("staff-permissions-modal").classList.contains("hidden"))closePermissions();
  });
})();