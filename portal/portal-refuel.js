(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const tasks=portal.createAuthenticatedTaskGuard();
  const el=(id)=>document.getElementById(id);
  let pipeline=[];
  let offers=[];
  let metrics={};
  let startupTimer=null;
  let closeTimer=null;

  function stat(label,value){
    const card=document.createElement("div");
    card.className="refuel-admin-stat";
    const s=document.createElement("span");s.textContent=label;
    const b=document.createElement("strong");b.textContent=String(value);
    card.append(s,b);return card;
  }
  function closeModal(){
    const modal=el("refuel-offer-modal");
    if(!modal)return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden","true");
  }
  function renderMetrics(){
    const target=el("refuel-admin-metrics");
    if(!target||!portal.captureStaffSession())return;
    target.replaceChildren(
      stat("Interested",metrics.interested||0),
      stat("Invited",metrics.invited_open||0),
      stat("Active",metrics.active_enrollments||0),
      stat("Paid",metrics.paid_enrollments||0),
      stat("Published Offers",metrics.published_offers||0)
    );
  }
  function offerName(id){
    return offers.find((o)=>o.id===id)?.name||"ReFuel";
  }
  function render(){
    if(!portal.captureStaffSession())return;
    renderMetrics();
    const list=el("refuel-admin-list");
    if(!list)return;
    list.replaceChildren();
    if(!pipeline.length){
      list.innerHTML='<div class="empty-state">No ReFuel interest records yet.</div>';
      return;
    }
    pipeline.forEach((row)=>{
      const item=document.createElement("article");
      item.className="refuel-admin-item";

      const person=document.createElement("div");
      person.className="refuel-admin-person";
      const name=document.createElement("strong");
      name.textContent=[row.first_name,row.last_name].filter(Boolean).join(" ")||row.email;
      const email=document.createElement("span");email.textContent=row.email||"";
      person.append(name,email);

      const state=document.createElement("div");
      state.className="refuel-admin-state";
      const strong=document.createElement("strong");
      strong.textContent=row.offer_name||"No offer assigned";
      const meta=document.createElement("span");
      meta.textContent=[
        "Interest: "+portal.titleCase(row.interest_status||"interested"),
        row.invitation_status?"Invite: "+portal.titleCase(row.invitation_status):"",
        row.enrollment_status?"Enrollment: "+portal.titleCase(row.enrollment_status):""
      ].filter(Boolean).join(" · ");
      state.append(strong,meta);

      const status=document.createElement("div");
      status.className="refuel-admin-state";
      const payment=document.createElement("strong");
      payment.textContent=row.payment_status?portal.titleCase(row.payment_status):"Not enrolled";
      const date=document.createElement("span");
      date.textContent=row.invited_at?portal.formatDate(row.invited_at,true):"";
      status.append(payment,date);

      const actions=document.createElement("div");
      actions.className="refuel-admin-actions";

      if(!row.invitation_id){
        const invite=document.createElement("button");
        invite.type="button";
        invite.textContent="Invite";
        invite.addEventListener("click",()=>inviteContact(row));
        actions.append(invite);
      }

      if(!row.enrollment_id&&row.invitation_id){
        const enroll=document.createElement("button");
        enroll.type="button";
        enroll.className="primary";
        enroll.textContent="Enroll";
        enroll.addEventListener("click",()=>enrollContact(row));
        actions.append(enroll);
      }

      item.append(person,state,status,actions);
      list.append(item);
    });
  }
  async function load(){
    const task=tasks.begin();
    if(!task)return;
    const [pipelineResult,offersResult,metricsResult]=await Promise.all([
      client.from("admin_refuel_pipeline").select("*").order("interest_created_at",{ascending:false}),
      client.from("refuel_offers").select("*").eq("status","published").order("starts_at",{ascending:true,nullsFirst:false}),
      client.from("admin_refuel_metrics").select("*").maybeSingle()
    ]);
    if(!tasks.current(task))return;
    const failed=[pipelineResult,offersResult,metricsResult].find((r)=>r.error);
    if(failed?.error){console.error("ReFuel panel failed",failed.error);return;}
    pipeline=pipelineResult.data||[];
    offers=offersResult.data||[];
    metrics=metricsResult.data||{};
    render();
  }
  function openOffer(){
    if(!portal.captureStaffSession())return;
    const modal=el("refuel-offer-modal");
    if(!modal)return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden","false");
    portal.showStatus(el("refuel-offer-status"),"");
  }
  function iso(value){return value?new Date(value).toISOString():null;}
  async function publishOffer(event){
    event.preventDefault();
    const task=tasks.begin();
    if(!task)return;
    const price=el("refuel-offer-price").value?Math.round(Number(el("refuel-offer-price").value)*100):null;
    portal.showStatus(el("refuel-offer-status"),"Publishing...");
    const {error}=await client.from("refuel_offers").insert({
      offer_key:el("refuel-offer-key").value.trim(),
      name:el("refuel-offer-name").value.trim(),
      description:el("refuel-offer-description").value.trim()||null,
      status:"published",
      price_cents:Number.isFinite(price)?price:null,
      currency:el("refuel-offer-currency").value,
      billing_type:el("refuel-offer-billing").value||null,
      capacity:el("refuel-offer-capacity").value?Number(el("refuel-offer-capacity").value):null,
      starts_at:iso(el("refuel-offer-start").value),
      ends_at:iso(el("refuel-offer-end").value),
      created_by:portal.currentUserId(),
      published_at:new Date().toISOString()
    });
    if(!tasks.current(task))return;
    if(error){portal.showStatus(el("refuel-offer-status"),error.message,"error");return;}
    event.currentTarget.reset();
    portal.showStatus(el("refuel-offer-status"),"ReFuel offer published.","success");
    await load();
    if(portal.captureStaffSession())closeTimer=window.setTimeout(()=>{
      closeTimer=null;
      if(portal.captureStaffSession())closeModal();
    },450);
  }
  async function inviteContact(row){
    if(!portal.captureStaffSession())return;
    if(!offers.length){window.alert("Publish a ReFuel offer first.");return;}
    const choices=offers.map((o,i)=>(i+1)+". "+o.name).join("\n");
    const answer=window.prompt("Choose the ReFuel offer by number:\n"+choices,"1");
    if(!answer)return;
    const offer=offers[Number(answer)-1];
    if(!offer){window.alert("Invalid offer selection.");return;}
    const channel=window.prompt("Invitation channel: email, sms, in_app, or manual","in_app")||"in_app";
    const task=tasks.begin();
    if(!task)return;
    const {error}=await client.rpc("invite_contact_to_refuel",{
      p_contact_id:row.contact_id,p_offer_id:offer.id,p_channel:channel,p_note:null
    });
    if(!tasks.current(task))return;
    if(error){window.alert(error.message);return;}
    await load();
  }
  async function enrollContact(row){
    if(!portal.captureStaffSession())return;
    const offer=offers.find((o)=>o.id===row.offer_id);
    if(!offer){window.alert("The published offer could not be found.");return;}
    if(!["owner","admin"].includes(portal.currentStaffRole?.()||"")){
      window.alert("Owner/Admin access is required to enroll a ReFuel participant.");
      return;
    }
    const payment=window.prompt("Payment status: pending, paid, included, waived, failed, refunded","pending")||"pending";
    let amount=offer.price_cents;
    if(payment==="paid"&&amount===null){
      const entered=window.prompt("Amount received","");
      if(entered===null)return;
      amount=Math.round(Number(entered)*100);
    }
    const task=tasks.begin();
    if(!task)return;
    const {error}=await client.rpc("enroll_contact_in_refuel",{
      p_contact_id:row.contact_id,p_offer_id:offer.id,p_payment_status:payment,
      p_amount_cents:amount,p_currency:offer.currency||"USD",p_notes:null
    });
    if(!tasks.current(task))return;
    if(error){window.alert(error.message);return;}
    await load();
  }

  function teardown(){
    tasks.cancel();
    pipeline=[];
    offers=[];
    metrics={};
    if(startupTimer!==null)window.clearTimeout(startupTimer);
    startupTimer=null;
    if(closeTimer!==null)window.clearTimeout(closeTimer);
    closeTimer=null;
    closeModal();
  }

  function initialize(){
    if(startupTimer!==null)window.clearTimeout(startupTimer);
    startupTimer=null;
    load();
  }

  el("refuel-admin-new-offer")?.addEventListener("click",openOffer);
  el("refuel-offer-form")?.addEventListener("submit",publishOffer);
  document.querySelectorAll("[data-refuel-offer-close]").forEach((n)=>n.addEventListener("click",closeModal));
  document.addEventListener("ra:staff-access-reset",teardown);
  document.addEventListener("ra:dashboard-loaded",initialize);
  startupTimer=window.setTimeout(initialize,1050);
})();
