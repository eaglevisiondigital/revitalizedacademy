(() => {
  "use strict";
  const portal=window.RA_PORTAL, el=id=>document.getElementById(id);
  if(!portal||!el("client-enrollment-section"))return;
  const client=portal.authClient;
  let contact=null,state=null,programs=[],generation=0,busy=false;
  const permitted=()=>window.RVA_PUBLIC_CONFIG?.environment==="staging"&&["owner","admin"].includes(portal.currentStaffRole?.())&&portal.hasPermission("finance.manage");
  const status=(copy)=>{el("client-enrollment-status").textContent=copy;};
  const title=value=>portal.titleCase(value||"Not started");
  function clear(){generation++;contact=null;state=null;programs=[];busy=false;el("client-enrollment-section").classList.add("hidden");el("client-enrollment-form").classList.add("hidden");el("client-enrollment-summary").replaceChildren();status("");el("client-enrollment-program").replaceChildren();el("client-enrollment-amount").value="";el("client-enrollment-billing").value="";el("client-enrollment-currency").value="USD";}
  function render(){
    const accessActive=state.member_access==="active"&&state.membership_status==="active"&&state.ready_for_access&&state.account_claimed;
    const rows=[
      ["Recipient",state.recipient_approved?"Approved beta recipient":"Not approved in beta recipient registry"],
      ["Enrollment",state.enrollment_created?"Created":"Not created"],
      ["Selected program",state.program_name||"No program selected"],
      ["Invitation",!state.invitation?"Not sent":state.invitation.provider_accepted?"Provider accepted; inbox delivery not verified":title(state.invitation.status)],
      ["Agreement",title(state.agreement_status)],
      ["Payment",title(state.payment_status)],
      ["Member access",accessActive?"Active":state.member_access==="active"?"Blocked by enrollment/account gates":title(state.member_access||"blocked")]
    ];
    const target=el("client-enrollment-summary");target.replaceChildren();
    rows.forEach(([label,value])=>{const row=document.createElement("div"),s=document.createElement("span"),b=document.createElement("strong");row.className="journey-summary-card";s.textContent=label;b.textContent=value;row.append(s,b);target.append(row);});
    el("client-enrollment-start").disabled=false;
    el("client-enrollment-start").textContent=state.enrollment_created?"Review / Choose Program":"Start Enrollment / Choose Program";
    el("client-enrollment-access").disabled=!state.enrollment_created||busy;
    el("client-enrollment-invite").disabled=!state.enrollment_created||!state.recipient_approved||["signed","waived"].includes(state.agreement_status)||busy;
    el("client-enrollment-next").textContent=!state.enrollment_created?"Next: choose a program and save enrollment. Approval alone does not send an invitation.":!state.recipient_approved?"Next: approve this exact email in Team & Permissions before sending.":!state.agreement_count?"Next: Send Invitation, select the published client contract, review its terms, then send.":!["signed","waived"].includes(state.agreement_status)?"Next: the client verifies their email, reopens the original invitation, and signs the agreement. Use Agreements below to review or resend.":!["paid","waived"].includes(state.payment_status)?"Next: record the authorized synthetic beta payment through Enrollment Activation. No real charge.":!accessActive?"Next: review the access gates and account claim in Enrollment Activation.":"Member access is active. The client can sign in at beta.revitalizedacademy.com/member/.";
  }
  async function load(c){
    clear();if(!permitted())return;contact=c;
    const sequence=generation,id=c.id,actor=portal.currentUserId();
    el("client-enrollment-section").classList.remove("hidden");status("Loading enrollment status...");
    try{
      const [result,catalog]=await Promise.all([client.rpc("beta_client_enrollment_state",{p_contact_id:id}),client.from("program_catalog").select("program_code,name,default_commitment_months").eq("active",true).order("name")]);
      if(sequence!==generation||contact?.id!==id||actor!==portal.currentUserId()||!permitted())return;
      if(result.error||catalog.error)throw result.error||catalog.error;
      state=result.data;programs=catalog.data||[];render();status("");
    }catch(error){if(sequence===generation){state=null;el("client-enrollment-start").disabled=true;el("client-enrollment-invite").disabled=true;status("Enrollment status could not be loaded. Please reopen this client record.");}}
  }
  el("client-enrollment-start").addEventListener("click",()=>{
    if(!state||!permitted())return;
    const select=el("client-enrollment-program");select.replaceChildren();
    const blank=document.createElement("option");blank.value="";blank.textContent="Select program";select.append(blank);
    programs.forEach(p=>{const option=document.createElement("option");option.value=p.program_code;option.textContent=p.name;select.append(option);});
    select.value=state.program_code||"";el("client-enrollment-billing").value=state.billing_choice||"";
    el("client-enrollment-amount").value=state.amount_cents==null?"":(state.amount_cents/100).toFixed(2);el("client-enrollment-currency").value=state.currency||"USD";
    el("client-enrollment-form").classList.remove("hidden");select.focus();
  });
  el("client-enrollment-form").addEventListener("submit",async event=>{
    event.preventDefault();if(!state||!permitted()||busy)return;
    const sequence=generation,id=contact.id,actor=portal.currentUserId(),amount=Number(el("client-enrollment-amount").value);
    if(!Number.isFinite(amount)||amount<0||!el("client-enrollment-program").value){status("Choose a program and valid amount before saving.");return;}
    busy=true;el("client-enrollment-save").disabled=true;status("Saving enrollment. No invitation is sent by this action...");
    try{
      const result=await client.rpc("save_beta_client_enrollment",{p_contact_id:id,p_program_code:el("client-enrollment-program").value,p_billing_choice:el("client-enrollment-billing").value,p_amount_cents:Math.round(amount*100),p_currency:el("client-enrollment-currency").value});
      if(sequence!==generation||actor!==portal.currentUserId()||!permitted())return;
      if(result.error)throw result.error;
      state=result.data;busy=false;render();el("client-enrollment-form").classList.add("hidden");status("Enrollment saved. No invitation sent yet. Next: Send Invitation.");
      document.dispatchEvent(new CustomEvent("ra:enrollment-configured",{detail:{contactId:id}}));
    }catch(error){if(sequence===generation)status(error.message||"Enrollment could not be saved.");}
    finally{if(sequence===generation){busy=false;el("client-enrollment-save").disabled=false;}}
  });
  el("client-enrollment-invite").addEventListener("click",()=>{if(state?.recipient_approved&&state.enrollment_created&&permitted())document.dispatchEvent(new CustomEvent("ra:open-client-invitation",{detail:{contactId:contact.id}}));});
  el("client-enrollment-access").addEventListener("click",()=>{if(state?.enrollment_created&&permitted())document.dispatchEvent(new CustomEvent("ra:open-action-center",{detail:{enrollment:true}}));});
  el("client-enrollment-refresh").addEventListener("click",()=>{if(contact)void load(contact);});
  document.addEventListener("ra:contact-opened",e=>{el("client-enrollment-start").disabled=false;void load(e.detail.contact);});
  document.addEventListener("ra:contact-closed",clear);
  document.addEventListener("ra:staff-access-reset",clear);
  document.addEventListener("ra:permissions-loaded",()=>{if(!permitted())clear();});
  client.auth.onAuthStateChange(event=>{if(["SIGNED_OUT","SIGNED_IN","TOKEN_REFRESHED"].includes(event))clear();});
})();
