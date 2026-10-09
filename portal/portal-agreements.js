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
  let agreementEpoch=0;
  let modalEpoch=0;
  let prefillEpoch=0;
  let assignmentBusy=false;
  const current=(epoch,contactId,user)=>epoch===agreementEpoch&&contactId===activeContact?.id&&user===portal.currentUserId();

  function moneyInput(cents,currency){
    if(cents===null||cents===undefined)return "";
    return (Number(cents)/100).toFixed(2);
  }

  function todayLocal(){
    const d=new Date();
    const pad=(n)=>String(n).padStart(2,"0");
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  }

  function displayDateFromInput(value){
    if(!value)return "";
    const [y,m,d]=value.split("-");
    const date=new Date(Number(y),Number(m)-1,Number(d));
    return date.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
  }

  function currencyText(amount,currency){
    if(amount===""||amount===null||amount===undefined)return "";
    const value=Number(amount);
    if(!Number.isFinite(value))return "";
    return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(value);
  }

  async function prefillClientContract(){
    const templateId=el("client-agreement-template-select").value;
    const template=templates.find(t=>t.id===templateId);
    const isContract=template?.document_type==="client_contract";
    el("client-contract-fields").classList.toggle("hidden",!isContract);
    const usesProgramName=(template?.merge_schema?.required||[]).includes("program_name");
    el("contract-program-name").closest("label").classList.toggle("hidden",!usesProgramName);
    el("contract-program-level").closest("label").classList.toggle("hidden",usesProgramName);
    if(!isContract||!activeContact)return;
    const run=agreementEpoch,id=activeContact.id,user=portal.currentUserId(),modal=modalEpoch,prefill=++prefillEpoch;
    el("contract-effective-date").value=todayLocal();
    el("contract-client-name").value=portal.personName(activeContact);
    el("contract-program-name").value="";
    for(const field of ["secondary-client-name","program-level","monthly-fee","term-duration","good-faith-deposit","adjusted-monthly-payment","special-conditions","appendix-a"])el("contract-"+field).value="";
    const enrollment=await client.rpc("production_client_enrollment_state",{p_contact_id:id});
    if(!current(run,id,user)||modal!==modalEpoch||prefill!==prefillEpoch||templateId!==el("client-agreement-template-select").value)return;
    if(enrollment.error){portal.showStatus(el("client-agreement-assign-status"),"Could not load the current enrollment. Try again.","error");return;}
    const intent=enrollment.data;
    if(intent?.enrollment_created){
      subscriptionsCurrencyCache=intent.currency;
      el("contract-program-name").value=intent.program_name;
      if(intent.billing_choice==="monthly"){
        el("contract-monthly-fee").value=moneyInput(intent.amount_cents,intent.currency);
        el("contract-adjusted-monthly-payment").value=moneyInput(intent.amount_cents,intent.currency);
      }else{
        portal.showStatus(el("client-agreement-assign-status"),"Pay-in-full enrollment saved. Use approved pay-in-full agreement terms; do not enter the total as a monthly fee.");
      }
      el("contract-term-duration").value=intent.billing_choice==="one_time"?"12 months":"6-month minimum term";
      el("contract-appendix-a").value="Program: "+intent.program_name+"\nBilling: "+intent.billing_choice+"\nSelected amount: "+currencyText(moneyInput(intent.amount_cents,intent.currency),intent.currency);
    }
  }

  function contractMergeValues(){
    const secondary=el("contract-secondary-client-name").value.trim();
    const currency=(subscriptionsCurrencyCache||"USD");
    return {
      effective_date:displayDateFromInput(el("contract-effective-date").value),
      client_name:el("contract-client-name").value.trim(),
      secondary_client_name:secondary,
      secondary_client_clause:secondary?" and "+secondary:"",
      program_level:el("contract-program-level").value,
      program_name:el("contract-program-name").value,
      monthly_fee:currencyText(el("contract-monthly-fee").value,currency),
      term_duration:el("contract-term-duration").value.trim(),
      good_faith_deposit:currencyText(el("contract-good-faith-deposit").value,currency),
      adjusted_monthly_payment:currencyText(el("contract-adjusted-monthly-payment").value,currency),
      special_conditions:el("contract-special-conditions").value.trim()||"None.",
      appendix_a_plan_structure:el("contract-appendix-a").value.trim(),
      company_approver_name:portal.staffDirectory().find(s=>s.user_id===portal.currentUserId())?.display_name||"Authorized ReVitalized Representative",
      company_approval_date:new Date().toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"})
    };
  }

  let subscriptionsCurrencyCache="USD";


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
    modalEpoch++;prefillEpoch++;
    el("client-agreement-assign-form").reset();
    el("client-contract-fields").classList.add("hidden");
    subscriptionsCurrencyCache="USD";
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
        requirements.length?requirements.map(r=>{
          const program=programs.find(p=>p.program_code===r.program_code)?.name||r.program_code;
          return [program,r.billing_choice?portal.titleCase(r.billing_choice):null,r.currency].filter(Boolean).join(" · ");
        }).join(", "):"No program requirement"
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
    const user=portal.currentUserId(),run=agreementEpoch;
    if(!(portal.hasPermission?.("finance.view")??false))return;

    const [templatesResult,requirementsResult,programsResult,agreementsResult]=await Promise.all([
      client.from("agreement_templates").select("*").eq("audience","client").order("created_at",{ascending:false}),
      client.from("program_agreement_requirements").select("*"),
      client.from("program_catalog").select("program_code,name,active").eq("active",true).order("name"),
      client.from("admin_client_agreements").select("id,status").limit(5000)
    ]);

    if(user!==portal.currentUserId()||run!==agreementEpoch)return;
    const failed=[templatesResult,requirementsResult,programsResult,agreementsResult].find(r=>r.error);
    if(failed?.error){
      el("agreement-library-list").textContent="Agreement library could not be loaded. Try again.";
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
    const programCode=el("agreement-template-program").value;
    if(programCode==="holistic-foundations"){
      portal.showStatus(el("agreement-template-status"),"Holistic Foundations agreement publication is held pending legal approval. Use the controlled legal-release migration after approval.","error");
      return;
    }
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
    const run=agreementEpoch,user=portal.currentUserId();
    if(!(portal.hasPermission?.("finance.view")??false)){
      el("client-agreements-section").classList.add("hidden");
      return;
    }

    const {data,error}=await client.from("admin_client_agreements")
      .select("*").eq("contact_id",contactId).order("created_at",{ascending:false});
    if(!current(run,contactId,user))return;
    if(error){
      portal.showStatus(el("client-agreements-status"),error.message,"error");
      return;
    }

    if(run!==agreementEpoch||activeContact?.id!==contactId||portal.currentUserId()!==user)return;
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

  async function openClientAssign(){
    const run=agreementEpoch,id=activeContact?.id,user=portal.currentUserId(),modal=++modalEpoch;
    if(!activeContact||!(portal.hasPermission?.("finance.manage")??false))return;
    const select=el("client-agreement-template-select");
    select.replaceChildren();
    const enrollment=await client.rpc("production_client_enrollment_state",{p_contact_id:activeContact.id});
    if(!current(run,id,user)||modal!==modalEpoch)return;
    const mapped=programRequirements.filter(r=>
      r.program_code===enrollment.data?.program_code&&
      (r.billing_choice==null||r.billing_choice===enrollment.data?.billing_choice)&&
      (r.currency==null||r.currency===enrollment.data?.currency)&&
      r.active&&r.required
    ).map(r=>r.agreement_template_id);
    const available=templates.filter(t=>t.status==="published"&&mapped.includes(t.id));
    const blank=document.createElement("option");blank.value="";blank.textContent=available.length?"Select published agreement":enrollment.data?.agreement_publication_status==="held"?"Agreement publication pending legal review":"No billing-specific published agreement available";select.append(blank);
    available.forEach((row)=>{
      const o=document.createElement("option");o.value=row.id;o.textContent=row.name+" · v"+row.version;select.append(o);
    });
    el("client-agreement-send-now").checked=true;
    el("client-contract-fields").classList.add("hidden");

    subscriptionsCurrencyCache=enrollment.data?.currency||"USD";
    if(enrollment.error){portal.showStatus(el("client-agreements-status"),"Enrollment could not be loaded.","error");return;}
    el("client-agreement-assign-modal").classList.remove("hidden");
    el("client-agreement-assign-modal").setAttribute("aria-hidden","false");
  }

  async function assignAgreement(event){
    event.preventDefault();
    if(assignmentBusy||!activeContact)return;
    const run=agreementEpoch,id=activeContact.id,user=portal.currentUserId(),modal=modalEpoch;
    const templateId=el("client-agreement-template-select").value,sendNow=el("client-agreement-send-now").checked;
    if(!templateId){portal.showStatus(el("client-agreement-assign-status"),"Choose an agreement.","error");return;}
    const template=templates.find(t=>t.id===templateId);
    assignmentBusy=true;
    const submit=el("client-agreement-assign-form").querySelector('[type="submit"]');if(submit)submit.disabled=true;
    try{
      portal.showStatus(el("client-agreement-assign-status"),"Preparing agreement...");
      const args={p_contact_id:id,p_agreement_template_id:templateId,p_send:sendNow};
      if(template?.document_type==="client_contract")args.p_merge_values=contractMergeValues();
      const result=await client.rpc(template?.document_type==="client_contract"?"prepare_client_contract":"issue_client_agreement",args);
      if(!current(run,id,user)||modal!==modalEpoch)return;
      if(result.error)throw result.error;
      if(sendNow&&result.data){
        const delivery=await client.functions.invoke("client-lifecycle-delivery",{body:{client_agreement_id:result.data}});
        if(!current(run,id,user)||modal!==modalEpoch)return;
        if(delivery.error||!delivery.data?.ok)throw Error("Agreement prepared; email delivery failed. Review delivery status before retrying.");
      }
      document.dispatchEvent(new CustomEvent("ra:lifecycle-agreement-updated"));
      portal.showStatus(el("client-agreement-assign-status"),"Agreement prepared. Email status is shown in Program & Next Steps.","success");
      await Promise.all([loadClientAgreements(id),portal.loadDashboard()]);
      window.setTimeout(()=>{if(current(run,id,user)&&modal===modalEpoch)closeClientModal();},500);
    }catch(error){if(current(run,id,user)&&modal===modalEpoch)portal.showStatus(el("client-agreement-assign-status"),error.message,"error");}
    finally{assignmentBusy=false;if(submit)submit.disabled=false;}
  }

  async function sendAgreement(row){
    if(!activeContact||row.contact_id&&row.contact_id!==activeContact.id)return;
    const run=agreementEpoch,id=activeContact.id,user=portal.currentUserId();
    const template=templates.find(t=>t.id===row.agreement_template_id);
    const result=template?.document_type==="client_contract"
      ?await client.rpc("prepare_client_contract",{
          p_contact_id:id,
          p_agreement_template_id:row.agreement_template_id,
          p_merge_values:row.merge_values||{},
          p_send:true
        })
      :await client.rpc("issue_client_agreement",{
          p_contact_id:id,
          p_agreement_template_id:row.agreement_template_id,
          p_send:true
        });
    if(!current(run,id,user))return;
    const {error}=result;
    if(error){window.alert(error.message);return;}
    const delivery=await client.functions.invoke("client-lifecycle-delivery",{body:{client_agreement_id:result.data}});
    if(!current(run,id,user))return;
    if(delivery.error||!delivery.data?.ok){window.alert("Agreement queued; delivery was not accepted. Review the enrollment email status.");}
    document.dispatchEvent(new CustomEvent("ra:lifecycle-agreement-updated"));
    await loadClientAgreements(id);
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
    agreementEpoch++;activeContact=event.detail.contact;closeClientModal();
    loadClientAgreements(event.detail.contactId);
  });
  document.addEventListener("ra:contact-closed",()=>{
    agreementEpoch++;activeContact=null;clientAgreements=[];el("client-agreements-list").replaceChildren();
    el("client-agreements-section").classList.add("hidden");
    closeClientModal();
  });

  document.addEventListener("ra:staff-access-reset",()=>{agreementEpoch++;activeContact=null;clientAgreements=[];el("client-agreements-list").replaceChildren();closeClientModal();});
  document.addEventListener("ra:lifecycle-enrollment-saved",()=>{if(activeContact)loadClientAgreements(activeContact.id);});
  el("agreement-new-template").addEventListener("click",openTemplateModal);
  el("agreement-template-form").addEventListener("submit",createTemplate);
  el("client-agreement-assign").addEventListener("click",openClientAssign);
  el("client-agreement-template-select").addEventListener("change",prefillClientContract);
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
