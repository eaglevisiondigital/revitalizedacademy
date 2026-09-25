(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);
  let rows=[];
  let active=null;

  function setStatus(message,type=""){
    portal.showStatus(el("staff-onboarding-status"),message,type);
  }

  function hide(){
    el("staff-onboarding-modal").classList.add("hidden");
    el("staff-onboarding-modal").setAttribute("aria-hidden","true");
  }

  function showList(){
    active=null;
    el("staff-onboarding-document").classList.add("hidden");
    el("staff-onboarding-list").classList.remove("hidden");
    const list=el("staff-onboarding-list");
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
    active=row;
    el("staff-onboarding-list").classList.add("hidden");
    el("staff-onboarding-document").classList.remove("hidden");
    el("staff-onboarding-document-title").textContent=row.name;
    el("staff-onboarding-document-meta").textContent="Version "+row.template_version+" · Required for coach onboarding";
    el("staff-onboarding-document-content").textContent=row.content_text||"";
    el("staff-onboarding-signer-name").value=row.signer_name||"";
    el("staff-onboarding-accept").checked=false;
    setStatus("");

    const {error}=await client.functions.invoke("staff-agreement-sign",{
      body:{action:"view",staff_agreement_id:row.staff_agreement_id}
    });
    if(error)console.error("Staff agreement view update failed",error);
  }

  async function load(){
    const {data,error}=await client.from("my_staff_agreements").select("*");
    if(error){
      console.error("Staff onboarding agreements failed",error);
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

    setStatus("Signing agreement...");
    const {data,error}=await client.functions.invoke("staff-agreement-sign",{
      body:{
        action:"sign",
        staff_agreement_id:active.staff_agreement_id,
        signer_name:el("staff-onboarding-signer-name").value.trim(),
        accepted_terms:el("staff-onboarding-accept").checked
      }
    });

    if(error||!data?.ok){
      setStatus(error?.message||data?.error||"Agreement could not be signed.","error");
      return;
    }

    setStatus("Agreement signed. Activating your staff access...","success");
    window.setTimeout(()=>window.location.reload(),700);
  }

  el("staff-onboarding-back").addEventListener("click",showList);
  el("staff-onboarding-sign-form").addEventListener("submit",sign);

  document.addEventListener("ra:dashboard-loaded",load);
  window.setTimeout(load,450);
})();