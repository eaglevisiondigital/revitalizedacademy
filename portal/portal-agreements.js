(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let templates=[];
  let programRequirements=[];
  let programs=[];
  let activeContact=null;
  let clientAgreements=[];

  function stat(label,value){
    const card=document.createElement("div");
    card.className="agreement-library-stat";
    const s=document.createElement("span");s.textContent=label;
    const b=document.createElement("strong");b.textContent=String(value);
    card.append(s,b);return card;
  }

  function closeTemplateModal(){
    el("agreement-template-modal").classList.add("hidden");
    el("agreement-template-modal").setAttribute("aria-hidden","true");
    portal.showStatus(el("agreement-template-status"),"");
  }

  function closeClientModal(){
    el("client-agreement-assign-modal").classList.add("hidden");
    el("client-agreement-assign-modal").setAttribute("aria-hidden","true");
    portal.showStatus(el("client-agreement-assign-status"),"");
  }

  function renderLibrary(){
    const panel=el("agreement-library-panel");
    if(!(portal.hasPermission?.("finance.view")??false)){
      panel.classList.add("hidden");
      return;
    }
    panel.classList.remove("hidden");
    el("agreement-new-template").disabled=!(portal.hasPermission?.("finance.manage")??false);

    const published=templates.filter(t=>t.status==="published").length;
    const draft=templates.filter(t=>t.status==="draft").length;
    const signed=clientAgreements.filter(a=>a.status==="signed").length;
    const pending=clientAgreements.filter(a=>["not_sent","sent","viewed"].includes(a.status)).length;
    const declined=clientAgreements.filter(a=>a.status==="declined").length;

    el("agreement-library-metrics").replaceChildren(
      stat("Published",published),
      stat("Drafts",draft),
      stat("Signed",signed),
      stat("Pending",pending),
      stat("Declined",declined)
    );

    const list=el("agreement-library-list");
    list.replaceChildren();

    if(!templates.length){
      list.innerHTML='<div class="empty-state">No agreement templates have been created yet.</div>';
      return;
    }

    templates.forEach((row)=>{
      const item=document.createElement("article");
      item.className="agreement-template-item";

      const copy=document.createElement("div");
      copy.className="agreement-template-copy";
      const name=document.createElement("strong");name.textContent=row.name;
      const meta=document.createElement("span");
      const requirements=programRequirements.filter(r=>r.agreement_template_id===row.id&&r.active);
      meta.textContent=[
        row.agreement_key,
        "v"+row.version,
        requirements.length?requirements.map(r=>programs.find(p=>p.program_code===r.program_code)?.name||r.program_code).join(", "):"No program requirement"
      ].join(" · ");
      copy.append(name,meta);

      const version=document.createElement("div");version.className="agreement-template-state";version.textContent="v"+row.version;
      const status=document.createElement("div");status.className="agreement-template-state";status.textContent=portal.titleCase(row.status);

      const actions=document.createElement("div");actions.className="agreement-template-actions";
      if(row.status==="draft"&&(portal.hasPermission?.("finance.manage")??false)){
        const publish=document.createElement("button");
        publish.type="button";publish.textContent="Publish";
        publish.addEventListener("click",()=>publishDraft(row));
        actions.append(publish);
      }

      item.append(copy,version,status,actions);
      list.append(item);
    });
  }

  async function loadLibrary(){
    if(!(portal.hasPermission?.("finance.view")??false))return;

    const [templatesResult,requirementsResult,programsResult,agreementsResult]=await Promise.all([
      client.from("agreement_templates").select("*").order("created_at",{ascending:false}),
      client.from("program_agreement_requirements").select("*"),
      client.from("program_catalog").select("program_code,name,active").eq("active",true).order("name"),
      client.from("admin_client_agreements").select("id,status").limit(5000)
    ]);

    const failed=[templatesResult,requirementsResult,programsResult,agreementsResult].find(r=>r.error);
    if(failed?.error){
      el("agreement-library-list").innerHTML='<div class="empty-state">Agreement library could not be loaded. '+failed.error.message+'</div>';
      return;
    }

    templates=templatesResult.data||[];
    programRequirements=requirementsResult.data||[];
    programs=programsResult.data||[];
    const aggregateAgreements=agreementsResult.data||[];

    const published=templates.filter(t=>t.status==="published").length;
    const draft=templates.filter(t=>t.status==="draft").length;
    const signed=aggregateAgreements.filter(a=>a.status==="signed").length;
    const pending=aggregateAgreements.filter(a=>["not_sent","sent","viewed"].includes(a.status)).length;
    const declined=aggregateAgreements.filter(a=>a.status==="declined").length;

    el("agreement-library-metrics").replaceChildren(
      stat("Published",published),
      stat("Drafts",draft),
      stat("Signed",signed),
      stat("Pending",pending),
      stat("Declined",declined)
    );

    renderLibrary();
  }

  function openTemplateModal(){
    if(!(portal.hasPermission?.("finance.manage")??false))return;
    el("agreement-template-form").reset();
    el("agreement-template-version").value="1.0";
    el("agreement-template-required").checked=true;

    const select=el("agreement-template-program");
    select.innerHTML='<option value="">Not tied to a program</option>';
    programs.forEach((row)=>{
      const o=document.createElement("option");o.value=row.program_code;o.textContent=row.name;select.append(o);
    });

    el("agreement-template-modal").classList.remove("hidden");
    el("agreement-template-modal").setAttribute("aria-hidden","false");
  }

  async function createTemplate(event){
    event.preventDefault();
    portal.showStatus(el("agreement-template-status"),"Publishing agreement...");

    const {data:template,error}=await client.from("agreement_templates").insert({
      agreement_key:el("agreement-template-key").value.trim(),
      name:el("agreement-template-name").value.trim(),
      version:el("agreement-template-version").value.trim(),
      description:el("agreement-template-description").value.trim()||null,
      content_text:el("agreement-template-content").value,
      content_hash:"pending",
      status:"published",
      requires_signature:true,
      created_by:portal.currentUserId(),
      published_by:portal.currentUserId(),
      published_at:new Date().toISOString()
    }).select("*").single();

    if(error){portal.showStatus(el("agreement-template-status"),error.message,"error");return;}

    const programCode=el("agreement-template-program").value;
    if(programCode){
      const {error:reqError}=await client.from("program_agreement_requirements").insert({
        program_code:programCode,
        agreement_template_id:template.id,
        required:el("agreement-template-required").checked,
        active:true
      });
      if(reqError){portal.showStatus(el("agreement-template-status"),"Agreement published, but program requirement failed: "+reqError.message,"error");return;}
    }

    portal.showStatus(el("agreement-template-status"),"Agreement published and version locked.","success");
    await loadLibrary();
    window.setTimeout(closeTemplateModal,550);
  }

  async function publishDraft(row){
    const {error}=await client.from("agreement_templates").update({
      status:"published",
      published_by:portal.currentUserId(),
      published_at:new Date().toISOString()
    }).eq("id",row.id);
    if(error){window.alert(error.message);return;}
    await loadLibrary();
  }

  async function loadClientAgreements(contactId){
    if(!(portal.hasPermission?.("finance.view")??false)){
      el("client-agreements-section").classList.add("hidden");
      return;
    }

    const {data,error}=await client.from("admin_client_agreements")
      .select("*").eq("contact_id",contactId).order("created_at",{ascending:false});
    if(error){
      portal.showStatus(el("client-agreements-status"),error.message,"error");
      return;
    }

    clientAgreements=data||[];
    renderClientAgreements();
  }

  function renderClientAgreements(){
    const section=el("client-agreements-section");
    if(!activeContact){
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    el("client-agreements-chip").textContent=clientAgreements.length+" Agreement"+(clientAgreements.length===1?"":"s");
    el("client-agreement-assign").disabled=!(portal.hasPermission?.("finance.manage")??false);

    const list=el("client-agreements-list");
    list.replaceChildren();

    if(!clientAgreements.length){
      list.innerHTML='<div class="drawer-empty">No agreements assigned yet.</div>';
      return;
    }

    clientAgreements.forEach((row)=>{
      const item=document.createElement("div");
      item.className="client-agreement-item";

      const copy=document.createElement("div");copy.className="client-agreement-copy";
      const heading=document.createElement("strong");heading.textContent=row.agreement_name;
      const meta=document.createElement("span");meta.textContent=["v"+row.template_version,row.acceptance_signed_at?"Signed "+portal.formatDate(row.acceptance_signed_at,true):""].filter(Boolean).join(" · ");
      copy.append(heading,meta);

      const version=document.createElement("div");version.className="client-agreement-state";version.textContent="v"+row.template_version;
      const state=document.createElement("div");state.className="client-agreement-state";state.textContent=portal.titleCase(row.status);

      const actions=document.createElement("div");actions.className="client-agreement-actions-row";
      if((portal.hasPermission?.("finance.manage")??false)&&!["signed","waived"].includes(row.status)){
        const send=document.createElement("button");
        send.type="button";send.textContent=row.status==="not_sent"?"Send":"Resend";
        send.addEventListener("click",()=>sendAgreement(row));

        const role=portal.currentStaffRole?.()||"";
        if(["owner","admin"].includes(role)){
          const waive=document.createElement("button");
          waive.type="button";waive.className="warn";waive.textContent="Waive";
          waive.addEventListener("click",()=>waiveAgreement(row));
          actions.append(send,waive);
        }else{
          actions.append(send);
        }
      }

      item.append(copy,version,state,actions);
      list.append(item);
    });
  }

  function openClientAssign(){
    if(!activeContact||!(portal.hasPermission?.("finance.manage")??false))return;
    const select=el("client-agreement-template-select");
    select.replaceChildren();
    const available=templates.filter(t=>t.status==="published");
    const blank=document.createElement("option");blank.value="";blank.textContent=available.length?"Select published agreement":"No published agreements available";select.append(blank);
    available.forEach((row)=>{
      const o=document.createElement("option");o.value=row.id;o.textContent=row.name+" · v"+row.version;select.append(o);
    });
    el("client-agreement-send-now").checked=true;
    el("client-agreement-assign-modal").classList.remove("hidden");
    el("client-agreement-assign-modal").setAttribute("aria-hidden","false");
  }

  async function assignAgreement(event){
    event.preventDefault();
    const templateId=el("client-agreement-template-select").value;
    if(!templateId){portal.showStatus(el("client-agreement-assign-status"),"Choose an agreement.","error");return;}
    portal.showStatus(el("client-agreement-assign-status"),"Assigning agreement...");
    const {error}=await client.rpc("issue_client_agreement",{
      p_contact_id:activeContact.id,
      p_agreement_template_id:templateId,
      p_send:el("client-agreement-send-now").checked
    });
    if(error){portal.showStatus(el("client-agreement-assign-status"),error.message,"error");return;}
    portal.showStatus(el("client-agreement-assign-status"),"Agreement assigned.","success");
    await Promise.all([loadClientAgreements(activeContact.id),portal.loadDashboard()]);
    window.setTimeout(closeClientModal,500);
  }

  async function sendAgreement(row){
    const {error}=await client.rpc("issue_client_agreement",{
      p_contact_id:activeContact.id,
      p_agreement_template_id:row.agreement_template_id,
      p_send:true
    });
    if(error){window.alert(error.message);return;}
    await loadClientAgreements(activeContact.id);
  }

  async function waiveAgreement(row){
    const reason=window.prompt("Reason for waiving this agreement requirement:","");
    if(!reason?.trim())return;
    const {error}=await client.rpc("waive_client_agreement",{
      p_client_agreement_id:row.id,
      p_reason:reason.trim()
    });
    if(error){window.alert(error.message);return;}
    await Promise.all([loadClientAgreements(activeContact.id),portal.loadDashboard()]);
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    activeContact=event.detail.contact;
    loadClientAgreements(event.detail.contactId);
  });
  document.addEventListener("ra:contact-closed",()=>{
    activeContact=null;clientAgreements=[];
    el("client-agreements-section").classList.add("hidden");
    closeClientModal();
  });

  el("agreement-new-template").addEventListener("click",openTemplateModal);
  el("agreement-template-form").addEventListener("submit",createTemplate);
  el("client-agreement-assign").addEventListener("click",openClientAssign);
  el("client-agreement-assign-form").addEventListener("submit",assignAgreement);

  document.querySelectorAll("[data-agreement-template-close]").forEach(n=>n.addEventListener("click",closeTemplateModal));
  document.querySelectorAll("[data-client-agreement-close]").forEach(n=>n.addEventListener("click",closeClientModal));

  document.addEventListener("ra:permissions-loaded",()=>{
    loadLibrary();
    if(activeContact)loadClientAgreements(activeContact.id);
  });
  document.addEventListener("ra:dashboard-loaded",loadLibrary);
  window.setTimeout(loadLibrary,1250);
})();