(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const tasks=portal.createAuthenticatedTaskGuard();
  const el=(id)=>document.getElementById(id);
  let rows=[];
  let active=null;
  let reloadTimer=null;
  let startupTimer=null;
  let ndaRequired=false;

  function setStatus(message,type=""){
    const target=el("staff-onboarding-status");
    if(target)portal.showStatus(target,message,type);
  }

  function hide(){
    const modal=el("staff-onboarding-modal");
    if(!modal)return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden","true");
  }

  function showList(){
    if(!portal.captureStaffSession())return;
    active=null;
    const documentPanel=el("staff-onboarding-document");
    const list=el("staff-onboarding-list");
    if(!documentPanel||!list)return;
    documentPanel.classList.add("hidden");
    list.classList.remove("hidden");
    list.replaceChildren();

    const pending=rows.filter(r=>r.required&&!["signed","waived"].includes(r.status));
    if(!pending.length){
      hide();
      document.dispatchEvent(new Event("ra:permissions-refresh"));
      return;
    }

    pending.forEach((row)=>{
      const item=document.createElement("div");
      item.className="staff-onboarding-item";
      const heading=document.createElement("strong");
      heading.textContent=row.name;
      const meta=document.createElement("span");
      meta.textContent="Version "+row.template_version+" · "+portal.titleCase(row.status);
      const button=document.createElement("button");
      button.type="button";
      button.textContent="Review & Sign";
      button.addEventListener("click",()=>openAgreement(row));
      item.append(heading,meta,button);
      list.append(item);
    });
  }

  async function openAgreement(row){
    const task=tasks.begin();
    if(!task)return;
    const list=el("staff-onboarding-list");
    const documentPanel=el("staff-onboarding-document");
    if(!list||!documentPanel)return;
    active=row;
    list.classList.add("hidden");
    documentPanel.classList.remove("hidden");
    el("staff-onboarding-document-title").textContent=row.name;
    el("staff-onboarding-document-meta").textContent="Version "+row.template_version+" · Required for coach onboarding";
    el("staff-onboarding-document-content").textContent=row.content_text||"";
    el("staff-onboarding-signer-name").value=row.signer_name||"";
    el("staff-onboarding-accept").checked=false;
    setStatus("");

    const {error}=await client.functions.invoke("staff-agreement-sign",{
      body:{action:"view",staff_agreement_id:row.staff_agreement_id}
    });
    if(tasks.current(task)&&error)console.error("Staff agreement view update failed",error);
  }

  async function load(){
    const task=tasks.begin();
    if(!task)return;
    const {data,error}=await client.from("my_staff_agreements").select("*");
    if(!tasks.current(task))return;
    if(error){
      console.error("Staff onboarding agreements failed",error);
      if(ndaRequired){
        const modal=el("staff-onboarding-modal");
        const list=el("staff-onboarding-list");
        const documentPanel=el("staff-onboarding-document");
        if(modal&&list&&documentPanel){
          documentPanel.classList.add("hidden");
          list.classList.remove("hidden");
          list.replaceChildren();
          const warning=document.createElement("p");
          warning.setAttribute("role","alert");
          warning.textContent="Your required NDA could not load. Please retry, or contact a ReVitalized Academy owner for assistance.";
          const retry=document.createElement("button");
          retry.type="button";
          retry.className="secondary-button";
          retry.textContent="Retry NDA";
          retry.addEventListener("click",initialize);
          list.append(warning,retry);
          modal.classList.remove("hidden");
          modal.setAttribute("aria-hidden","false");
        }
      }
      return;
    }
    rows=data||[];
    const pending=rows.filter(r=>r.required&&!["signed","waived"].includes(r.status));
    if(!pending.length){hide();return;}
    el("staff-onboarding-modal").classList.remove("hidden");
    el("staff-onboarding-modal").setAttribute("aria-hidden","false");
    showList();
  }

  async function sign(event){
    event.preventDefault();
    if(!active)return;
    const task=tasks.begin();
    if(!task)return;

    setStatus("Signing agreement...");
    const {data,error}=await client.functions.invoke("staff-agreement-sign",{
      body:{
        action:"sign",
        staff_agreement_id:active.staff_agreement_id,
        signer_name:el("staff-onboarding-signer-name").value.trim(),
        accepted_terms:el("staff-onboarding-accept").checked
      }
    });

    if(!tasks.current(task))return;

    if(error||!data?.ok){
      setStatus(error?.message||data?.error||"Agreement could not be signed.","error");
      return;
    }

    setStatus("Agreement signed. Activating your staff access...","success");
    reloadTimer=window.setTimeout(()=>{
      if(tasks.current(task))window.location.reload();
    },700);
  }

  function teardown(){
    tasks.cancel();
    rows=[];
    active=null;
    ndaRequired=false;
    if(reloadTimer!==null)window.clearTimeout(reloadTimer);
    reloadTimer=null;
    if(startupTimer!==null)window.clearTimeout(startupTimer);
    startupTimer=null;
    hide();
  }

  function initialize(event){
    if(event?.type==="ra:staff-session-ready"){
      ndaRequired=event.detail?.ndaRequired===true;
    }
    if(startupTimer!==null)window.clearTimeout(startupTimer);
    startupTimer=null;
    load();
  }

  el("staff-onboarding-back").addEventListener("click",showList);
  el("staff-onboarding-sign-form").addEventListener("submit",sign);

  document.addEventListener("ra:staff-access-reset",teardown);
  // Fire when the verified staff session opens, even if data dashboard RPCs
  // are blocked until the NDA is signed. The dashboard refresh is secondary.
  document.addEventListener("ra:staff-session-ready",initialize);
  document.addEventListener("ra:dashboard-loaded",initialize);
  startupTimer=window.setTimeout(initialize,450);
})();
