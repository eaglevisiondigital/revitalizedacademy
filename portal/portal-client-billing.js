(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let activeContact=null;
  let membership=null;
  let subscription=null;
  let plans=[];

  function setStatus(id,message,type=""){
    const target=el(id);if(!target)return;
    target.textContent=message||"";
    target.className="form-status"+(type?" "+type:"");
  }

  function money(cents,currency){
    if(cents===null||cents===undefined)return "Not set";
    return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(Number(cents)/100);
  }

  function localDateTime(value){
    if(!value)return "";
    const d=new Date(value);
    const pad=n=>String(n).padStart(2,"0");
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
  }

  function closeModal(){
    el("client-billing-modal").classList.add("hidden");
    el("client-billing-modal").setAttribute("aria-hidden","true");
    setStatus("client-billing-form-status","");
  }

  function render(){
    const section=el("client-billing-section");
    if(!activeContact||!membership||!(portal.hasPermission?.("finance.view")??false)){
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    el("client-billing-chip").textContent=subscription?portal.titleCase(subscription.status):"Not Set";

    const summary=el("client-billing-summary");
    summary.replaceChildren();

    const plan=plans.find(p=>p.id===subscription?.billing_plan_id)||null;
    const billingText=plan
      ?money(plan.amount_cents,plan.currency)+" / "+portal.titleCase(plan.billing_interval)
      :"No billing plan";

    [
      ["Plan",plan?.name||"Not assigned"],
      ["Billing",billingText],
      ["Next Charge",subscription?.next_charge_at?portal.formatDate(subscription.next_charge_at,true):"Not scheduled"],
      ["Commitment End",subscription?.commitment_ends_at?portal.formatDate(subscription.commitment_ends_at,true):(membership.commitment_ends_at?portal.formatDate(membership.commitment_ends_at,true):"Not set")]
    ].forEach(([label,value])=>{
      const item=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const b=document.createElement("strong");b.textContent=value;
      item.append(s,b);summary.append(item);
    });

    el("client-billing-manage").disabled=!(portal.hasPermission?.("finance.manage")??false);
  }

  async function load(contactId){
    if(!(portal.hasPermission?.("finance.view")??false)){
      el("client-billing-section").classList.add("hidden");
      return;
    }

    const [accessResult,plansResult]=await Promise.all([
      client.from("client_access").select("membership_id").eq("contact_id",contactId).maybeSingle(),
      client.from("billing_plans").select("*").eq("active",true).order("name")
    ]);

    if(accessResult.error||plansResult.error){
      setStatus("client-billing-status",(accessResult.error||plansResult.error).message,"error");
      return;
    }

    plans=plansResult.data||[];
    membership=null;
    subscription=null;

    if(!accessResult.data?.membership_id){
      render();
      return;
    }

    const [membershipResult,subscriptionResult]=await Promise.all([
      client.from("client_memberships").select("*").eq("id",accessResult.data.membership_id).maybeSingle(),
      client.from("membership_subscriptions").select("*").eq("membership_id",accessResult.data.membership_id).maybeSingle()
    ]);

    if(membershipResult.error||subscriptionResult.error){
      setStatus("client-billing-status",(membershipResult.error||subscriptionResult.error).message,"error");
      return;
    }

    membership=membershipResult.data||null;
    subscription=subscriptionResult.data||null;
    setStatus("client-billing-status","");
    render();
  }

  function openModal(){
    if(!membership||!(portal.hasPermission?.("finance.manage")??false))return;

    const select=el("client-billing-plan");
    select.replaceChildren();
    const blank=document.createElement("option");blank.value="";blank.textContent="Select approved billing plan";select.append(blank);
    plans.forEach((plan)=>{
      const option=document.createElement("option");
      option.value=plan.id;
      option.textContent=plan.name+" · "+money(plan.amount_cents,plan.currency)+" / "+portal.titleCase(plan.billing_interval);
      select.append(option);
    });

    select.value=subscription?.billing_plan_id||"";
    el("client-billing-provider").value=subscription?.provider||"";
    el("client-billing-subscription-status").value=subscription?.status||"pending";
    el("client-billing-customer-id").value=subscription?.provider_customer_id||"";
    el("client-billing-subscription-id").value=subscription?.provider_subscription_id||"";
    el("client-billing-start").value=localDateTime(subscription?.started_at||membership.starts_at);
    el("client-billing-next-charge").value=localDateTime(subscription?.next_charge_at);
    setStatus("client-billing-form-status","");

    el("client-billing-modal").classList.remove("hidden");
    el("client-billing-modal").setAttribute("aria-hidden","false");
  }

  async function save(event){
    event.preventDefault();
    if(!membership)return;
    const planId=el("client-billing-plan").value;
    if(!planId){setStatus("client-billing-form-status","Choose an approved billing plan.","error");return;}

    setStatus("client-billing-form-status","Saving subscription...");
    const {data,error}=await client.rpc("create_membership_subscription",{
      p_membership_id:membership.id,
      p_billing_plan_id:planId,
      p_provider:el("client-billing-provider").value||null,
      p_provider_customer_id:el("client-billing-customer-id").value.trim()||null,
      p_provider_subscription_id:el("client-billing-subscription-id").value.trim()||null,
      p_status:el("client-billing-subscription-status").value,
      p_started_at:el("client-billing-start").value?new Date(el("client-billing-start").value).toISOString():null,
      p_next_charge_at:el("client-billing-next-charge").value?new Date(el("client-billing-next-charge").value).toISOString():null
    });

    if(error){setStatus("client-billing-form-status",error.message,"error");return;}
    setStatus("client-billing-form-status","Subscription saved.","success");
    await load(activeContact.id);
    await portal.loadDashboard();
    window.setTimeout(closeModal,500);
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    activeContact=event.detail.contact;
    load(event.detail.contactId);
  });
  document.addEventListener("ra:contact-closed",()=>{
    activeContact=null;membership=null;subscription=null;plans=[];
    el("client-billing-section").classList.add("hidden");
    closeModal();
  });
  document.addEventListener("ra:permissions-loaded",()=>{if(activeContact)load(activeContact.id);});

  el("client-billing-manage").addEventListener("click",openModal);
  el("client-billing-form").addEventListener("submit",save);
  document.querySelectorAll("[data-client-billing-close]").forEach((n)=>n.addEventListener("click",closeModal));
})();