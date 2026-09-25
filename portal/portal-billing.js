(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let subscriptions=[];
  let plans=[];
  let programs=[];

  function stat(label,value,warn=false){
    const card=document.createElement("div");
    card.className="billing-operations-stat"+(warn?" warn":"");
    const span=document.createElement("span");span.textContent=label;
    const strong=document.createElement("strong");strong.textContent=String(value);
    card.append(span,strong);return card;
  }

  function money(cents,currency){
    if(cents===null||cents===undefined)return "Not set";
    return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(Number(cents)/100);
  }

  function closeModal(){
    el("billing-plan-modal").classList.add("hidden");
    el("billing-plan-modal").setAttribute("aria-hidden","true");
    portal.showStatus(el("billing-plan-status"),"");
  }

  function renderMetrics(){
    const active=subscriptions.filter(r=>r.status==="active").length;
    const pastDue=subscriptions.filter(r=>r.status==="past_due").length;
    const paused=subscriptions.filter(r=>r.status==="paused").length;
    const upcoming=subscriptions.filter(r=>r.next_charge_at&&new Date(r.next_charge_at)<=new Date(Date.now()+7*86400000)&&new Date(r.next_charge_at)>=new Date()).length;
    const failed=subscriptions.reduce((sum,r)=>sum+Number(r.failed_payment_count||0),0);
    el("billing-operations-metrics").replaceChildren(
      stat("Active",active),
      stat("Past Due",pastDue,pastDue>0),
      stat("Paused",paused),
      stat("Charges · 7d",upcoming),
      stat("Failed Payments",failed,failed>0)
    );
  }

  function render(){
    renderMetrics();
    const list=el("billing-operations-list");
    list.replaceChildren();

    if(!subscriptions.length){
      list.innerHTML='<div class="empty-state">No recurring membership subscriptions have been created yet.</div>';
      return;
    }

    subscriptions.forEach((row)=>{
      const item=document.createElement("article");
      item.className="billing-subscription-item"+(row.status==="past_due"?" past-due":"");

      const person=document.createElement("div");person.className="billing-subscription-person";
      const name=document.createElement("strong");name.textContent=row.client_name||row.email||"Client";
      const email=document.createElement("span");email.textContent=row.email||row.program_name||"";
      person.append(name,email);

      const plan=document.createElement("div");plan.className="billing-subscription-plan";
      const p1=document.createElement("strong");p1.textContent=row.billing_plan_name||row.program_name||"Membership";
      const p2=document.createElement("span");
      p2.textContent=row.billing_interval
        ?money(row.amount_cents,row.currency)+" · "+portal.titleCase(row.billing_interval)
        :"Billing plan not assigned";
      plan.append(p1,p2);

      const state=document.createElement("div");
      state.className="billing-subscription-state"+(row.status==="past_due"?" warn":"");
      state.textContent=portal.titleCase(row.status);

      const charge=document.createElement("div");charge.className="billing-subscription-plan";
      const c1=document.createElement("strong");c1.textContent=row.next_charge_at?portal.formatDate(row.next_charge_at,true):"No next charge";
      const c2=document.createElement("span");c2.textContent=row.failed_payment_count?row.failed_payment_count+" failed payment"+(row.failed_payment_count===1?"":"s"):"";
      charge.append(c1,c2);

      const actions=document.createElement("div");actions.className="billing-subscription-actions";
      const open=document.createElement("button");open.type="button";open.textContent="Open Client";
      open.addEventListener("click",()=>portal.openContact(row.contact_id));
      actions.append(open);

      item.append(person,plan,state,charge,actions);
      list.append(item);
    });
  }

  async function load(){
    if(!(portal.hasPermission?.("finance.view")??false)){
      el("billing-operations-panel").classList.add("hidden");
      return;
    }

    el("billing-operations-panel").classList.remove("hidden");
    el("billing-new-plan").disabled=!(portal.hasPermission?.("finance.manage")??false);

    const [subsResult,plansResult,programsResult]=await Promise.all([
      client.from("admin_billing_overview").select("*").order("next_charge_at",{ascending:true,nullsFirst:false}),
      client.from("billing_plans").select("*").order("name"),
      client.from("program_catalog").select("program_code,name,active").eq("active",true).order("name")
    ]);

    const failed=[subsResult,plansResult,programsResult].find(r=>r.error);
    if(failed?.error){
      el("billing-operations-list").innerHTML='<div class="empty-state">Billing operations could not be loaded. '+failed.error.message+'</div>';
      return;
    }

    subscriptions=subsResult.data||[];
    plans=plansResult.data||[];
    programs=programsResult.data||[];
    render();
  }

  function openPlanModal(){
    if(!(portal.hasPermission?.("finance.manage")??false))return;
    el("billing-plan-form").reset();
    el("billing-plan-interval-count").value="1";
    el("billing-plan-grace").value="3";

    const select=el("billing-plan-program");
    select.innerHTML='<option value="">Any / not tied to one program</option>';
    programs.forEach((row)=>{
      const o=document.createElement("option");o.value=row.program_code;o.textContent=row.name;select.append(o);
    });

    el("billing-plan-modal").classList.remove("hidden");
    el("billing-plan-modal").setAttribute("aria-hidden","false");
  }

  async function createPlan(event){
    event.preventDefault();
    const amount=Math.round(Number(el("billing-plan-amount").value||0)*100);
    if(!Number.isFinite(amount)||amount<0){portal.showStatus(el("billing-plan-status"),"Enter a valid amount.","error");return;}

    portal.showStatus(el("billing-plan-status"),"Creating billing plan...");
    const {error}=await client.from("billing_plans").insert({
      plan_key:el("billing-plan-key").value.trim(),
      program_code:el("billing-plan-program").value||null,
      name:el("billing-plan-name").value.trim(),
      description:el("billing-plan-description").value.trim()||null,
      billing_interval:el("billing-plan-interval").value,
      interval_count:Number(el("billing-plan-interval-count").value||1),
      amount_cents:amount,
      currency:el("billing-plan-currency").value,
      commitment_months:el("billing-plan-commitment").value?Number(el("billing-plan-commitment").value):null,
      grace_days:Number(el("billing-plan-grace").value||3),
      created_by:portal.currentUserId()
    });

    if(error){portal.showStatus(el("billing-plan-status"),error.message,"error");return;}
    portal.showStatus(el("billing-plan-status"),"Billing plan created.","success");
    await load();
    window.setTimeout(closeModal,500);
  }

  el("billing-new-plan").addEventListener("click",openPlanModal);
  el("billing-plan-form").addEventListener("submit",createPlan);
  document.querySelectorAll("[data-billing-plan-close]").forEach((n)=>n.addEventListener("click",closeModal));
  document.addEventListener("ra:permissions-loaded",load);
  document.addEventListener("ra:dashboard-loaded",load);
  window.setTimeout(load,1200);
})();