(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let pipeline=[];
  let rewards=[];
  let metrics={};

  function setStatus(id,message,type=""){
    const target=el(id);
    if(!target)return;
    target.textContent=message||"";
    target.className="form-status"+(type?" "+type:"");
  }

  function stat(label,value){
    const card=document.createElement("div");
    card.className="referral-admin-stat";
    const span=document.createElement("span");span.textContent=label;
    const strong=document.createElement("strong");strong.textContent=String(value);
    card.append(span,strong);
    return card;
  }

  function closeModal(){
    el("referral-program-modal").classList.add("hidden");
    el("referral-program-modal").setAttribute("aria-hidden","true");
    setStatus("referral-program-status","");
  }

  function renderMetrics(){
    el("referral-admin-metrics").replaceChildren(
      stat("Total referrals",metrics.total_referrals||0),
      stat("Converted",metrics.converted_referrals||0),
      stat("Active ambassadors",metrics.active_ambassadors||0),
      stat("Pending rewards",metrics.pending_rewards||0),
      stat("Issued rewards",metrics.issued_rewards||0)
    );
  }

  function rewardForReferral(referralId){
    return rewards.find((row)=>row.referral_id===referralId)||null;
  }

  function renderPipeline(){
    renderMetrics();
    const list=el("referral-admin-list");
    list.replaceChildren();

    if(!pipeline.length){
      list.innerHTML='<div class="empty-state">No structured referrals have been recorded yet.</div>';
      return;
    }

    pipeline.forEach((row)=>{
      const item=document.createElement("article");
      item.className="referral-admin-item";

      const referred=document.createElement("div");
      referred.className="referral-admin-person";
      const name=document.createElement("strong");
      name.textContent=row.referred_name||row.referred_email||"Referred person";
      const email=document.createElement("span");
      email.textContent=row.referred_email||row.referred_phone||"";
      referred.append(name,email);

      const copy=document.createElement("div");
      copy.className="referral-admin-copy";
      const referrer=document.createElement("strong");
      referrer.textContent="Referred by "+(row.referrer_name||row.referrer_email||"Unknown");
      const meta=document.createElement("span");
      meta.textContent=[
        row.referral_program_name||"",
        row.source_channel?portal.titleCase(row.source_channel):"",
        row.first_touch_at?portal.formatDate(row.first_touch_at,true):""
      ].filter(Boolean).join(" · ");
      copy.append(referrer,meta);

      const state=document.createElement("div");
      state.className="referral-admin-state";
      state.textContent=portal.titleCase(row.status);

      const actions=document.createElement("div");
      actions.className="referral-admin-actions";
      const reward=rewardForReferral(row.referral_id);

      if(reward){
        if(reward.status==="pending"){
          const approve=document.createElement("button");
          approve.type="button";
          approve.textContent="Approve Reward";
          approve.addEventListener("click",()=>updateReward(reward,"approved"));
          actions.append(approve);
        }
        if(reward.status==="approved"){
          const issue=document.createElement("button");
          issue.type="button";
          issue.className="primary";
          issue.textContent="Mark Issued";
          issue.addEventListener("click",()=>updateReward(reward,"issued"));
          actions.append(issue);
        }
      }

      item.append(referred,copy,state,actions);
      list.append(item);
    });
  }

  async function load(){
    if(!(portal.hasPermission?.("referrals.manage")??false)){
      el("referral-admin-panel").classList.add("hidden");
      return;
    }

    el("referral-admin-panel").classList.remove("hidden");

    const [pipelineResult,rewardResult,metricsResult]=await Promise.all([
      client.from("admin_referral_pipeline").select("*").order("first_touch_at",{ascending:false}),
      client.from("admin_referral_rewards").select("*").order("created_at",{ascending:false}),
      client.from("admin_referral_metrics").select("*").maybeSingle()
    ]);

    const failed=[pipelineResult,rewardResult,metricsResult].find((r)=>r.error);
    if(failed?.error){
      el("referral-admin-list").innerHTML='<div class="empty-state">Referral data could not be loaded. '+failed.error.message+'</div>';
      return;
    }

    pipeline=pipelineResult.data||[];
    rewards=rewardResult.data||[];
    metrics=metricsResult.data||{};
    renderPipeline();
  }

  function openProgram(){
    el("referral-program-form").reset();
    el("referral-program-reward-type").value="none";
    el("referral-program-currency").value="USD";
    el("referral-program-modal").classList.remove("hidden");
    el("referral-program-modal").setAttribute("aria-hidden","false");
    setStatus("referral-program-status","");
  }

  async function publishProgram(event){
    event.preventDefault();
    const key=el("referral-program-key").value.trim();
    const name=el("referral-program-name").value.trim();
    if(!key||!name){
      setStatus("referral-program-status","Program key and name are required.","error");
      return;
    }

    const rewardType=el("referral-program-reward-type").value;
    const rewardValue=el("referral-program-reward-value").value
      ?Number(el("referral-program-reward-value").value)
      :null;

    setStatus("referral-program-status","Publishing referral program...");

    const {error}=await client.from("referral_programs").insert({
      program_key:key,
      name,
      description:el("referral-program-description").value.trim()||null,
      status:"published",
      reward_type:rewardType,
      reward_value:Number.isFinite(rewardValue)?rewardValue:null,
      currency:rewardType==="none"?null:el("referral-program-currency").value,
      created_by:portal.currentUserId(),
      published_at:new Date().toISOString()
    });

    if(error){
      setStatus("referral-program-status",error.message,"error");
      return;
    }

    setStatus("referral-program-status","Referral program published.","success");
    await load();
    window.setTimeout(closeModal,500);
  }

  async function updateReward(row,statusValue){
    const note=window.prompt(
      statusValue==="approved"
        ?"Optional note for approving this referral reward:"
        :"Optional note for issuing this referral reward:",
      ""
    );

    const {error}=await client.rpc("update_referral_reward_status",{
      p_reward_id:row.reward_id,
      p_status:statusValue,
      p_notes:note||null
    });

    if(error){
      window.alert(error.message);
      return;
    }

    await load();
  }

  el("referral-admin-new-program").addEventListener("click",openProgram);
  el("referral-program-form").addEventListener("submit",publishProgram);
  document.querySelectorAll("[data-referral-program-close]").forEach((node)=>node.addEventListener("click",closeModal));

  document.addEventListener("ra:permissions-loaded",load);
  document.addEventListener("ra:dashboard-loaded",load);
  window.setTimeout(load,1150);

  document.addEventListener("keydown",(event)=>{
    if(event.key==="Escape"&&!el("referral-program-modal").classList.contains("hidden"))closeModal();
  });
})();