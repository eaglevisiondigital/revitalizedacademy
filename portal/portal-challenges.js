(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let contact=null;
  let access=null;
  let summary=null;
  let challenges=[];
  let enrollments=[];
  let metrics=[];

  function title(value){return portal.titleCase(value||"");}
  function setStatus(id,message,type=""){
    const t=el(id); if(!t)return;
    t.textContent=message||"";
    t.className="form-status"+(type?" "+type:"");
  }
  function empty(message){
    const div=document.createElement("div");
    div.className="challenges-empty";
    div.textContent=message;
    return div;
  }
  function closeModal(){
    el("challenges-modal").classList.add("hidden");
    el("challenges-modal").setAttribute("aria-hidden","true");
    setStatus("challenge-create-status","");
  }

  async function loadChallenges(contactId,contactRecord=contact){
    contact=contactRecord||contact;
    if(!contactId)return;

    const [accessResult,summaryResult,challengeResult,metricResult]=await Promise.all([
      client.from("client_access").select("*").eq("contact_id",contactId).maybeSingle(),
      client.from("admin_client_challenge_summary").select("*").eq("contact_id",contactId).maybeSingle(),
      client.from("wellness_challenges").select("*").in("status",["published","active"]).order("starts_on"),
      client.from("progress_metric_catalog").select("metric_key,label,unit,active").eq("active",true).order("display_order")
    ]);

    // Supabase cannot use subqueries in PostgREST filters. Re-run enrollment query explicitly if needed.
    if(accessResult.error)throw accessResult.error;
    access=accessResult.data||null;
    if(summaryResult.error)throw summaryResult.error;
    summary=summaryResult.data||null;
    if(challengeResult.error)throw challengeResult.error;
    challenges=challengeResult.data||[];
    if(metricResult.error)throw metricResult.error;
    metrics=metricResult.data||[];

    let enrollmentQuery=client.from("challenge_enrollments")
      .select("*,wellness_challenges:challenge_id(*)")
      .eq("contact_id",contactId);

    if(access?.household_id){
      enrollmentQuery=client.from("challenge_enrollments")
        .select("*,wellness_challenges:challenge_id(*)")
        .or("contact_id.eq."+contactId+",household_id.eq."+access.household_id);
    }

    const {data:enrollmentData,error:enrollmentError}=await enrollmentQuery.order("enrolled_at",{ascending:false});
    if(enrollmentError)throw enrollmentError;
    enrollments=enrollmentData||[];

    renderSummary();
  }

  function renderSummary(){
    const section=el("client-challenges-section");
    if(!access){
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");
    const active=Number(summary?.active_challenges||0);
    const completed=Number(summary?.completed_challenges||0);
    const points=Number(summary?.challenge_points||0);
    el("client-challenges-chip").textContent=active+" Active";
    el("client-active-challenges").textContent=String(active);
    el("client-completed-challenges").textContent=String(completed);
    el("client-challenge-points").textContent=String(points);
  }

  function renderMetricOptions(){
    const select=el("challenge-metric");
    select.replaceChildren();
    metrics.forEach((metric)=>{
      const option=document.createElement("option");
      option.value=metric.metric_key;
      option.textContent=metric.label+(metric.unit?" · "+metric.unit:"");
      select.append(option);
    });
  }

  function enrollmentFor(challenge){
    return enrollments.find((row)=>row.challenge_id===challenge.id&&row.status!=="withdrawn")||null;
  }

  function renderAvailable(){
    const list=el("challenges-available-list");
    list.replaceChildren();

    if(!challenges.length){
      list.append(empty("No published challenges are available yet."));
      return;
    }

    challenges.forEach((challenge)=>{
      const existing=enrollmentFor(challenge);
      const item=document.createElement("div");
      item.className="challenges-item";
      const top=document.createElement("div");
      top.className="challenges-item-top";
      const heading=document.createElement("strong");
      heading.textContent=challenge.title;
      const state=document.createElement("span");
      state.textContent=existing?title(existing.status):title(challenge.scope);
      top.append(heading,state);
      item.append(top);

      if(challenge.description){
        const p=document.createElement("p");
        p.textContent=challenge.description;
        item.append(p);
      }

      const meta=document.createElement("small");
      meta.textContent=[
        title(challenge.aggregation),
        challenge.target_value!==null?String(challenge.target_value)+(challenge.unit?" "+challenge.unit:""):"",
        challenge.points_available+" points",
        portal.formatDate(challenge.starts_on)+" – "+portal.formatDate(challenge.ends_on)
      ].filter(Boolean).join(" · ");
      item.append(meta);

      if(!existing){
        const actions=document.createElement("div");
        actions.className="challenges-actions-row";

        if(["individual","both"].includes(challenge.scope)){
          const individual=document.createElement("button");
          individual.type="button";
          individual.className="primary";
          individual.textContent="Enroll Individual";
          individual.addEventListener("click",()=>enroll(challenge.id,"individual"));
          actions.append(individual);
        }

        if(["household","both"].includes(challenge.scope)&&access?.household_id){
          const household=document.createElement("button");
          household.type="button";
          household.textContent="Enroll Household";
          household.addEventListener("click",()=>enroll(challenge.id,"household"));
          actions.append(household);
        }

        item.append(actions);
      }

      list.append(item);
    });
  }

  function renderCurrent(){
    const list=el("challenges-current-list");
    list.replaceChildren();
    const current=enrollments.filter((row)=>row.status!=="withdrawn");

    if(!current.length){
      list.append(empty("This client is not enrolled in a challenge yet."));
      return;
    }

    current.forEach((row)=>{
      const challenge=row.wellness_challenges||{};
      const item=document.createElement("div");
      item.className="challenges-item";

      const top=document.createElement("div");
      top.className="challenges-item-top";
      const heading=document.createElement("strong");
      heading.textContent=challenge.title||"Challenge";
      const state=document.createElement("span");
      state.textContent=row.completion_percent+"%";
      top.append(heading,state);
      item.append(top);

      const progress=document.createElement("div");
      progress.className="challenges-progress";
      const bar=document.createElement("i");
      bar.style.width=Math.max(0,Math.min(100,Number(row.completion_percent||0)))+"%";
      progress.append(bar);
      item.append(progress);

      const meta=document.createElement("small");
      meta.textContent=[
        title(row.scope),
        row.current_value+(challenge.unit?" "+challenge.unit:""),
        row.points_earned+" points",
        title(row.status)
      ].join(" · ");
      item.append(meta);
      list.append(item);
    });
  }

  function renderModal(){
    renderMetricOptions();
    renderAvailable();
    renderCurrent();

    const today=new Date();
    const pad=(n)=>String(n).padStart(2,"0");
    const iso=(date)=>date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate());
    if(!el("challenge-start").value)el("challenge-start").value=iso(today);
    if(!el("challenge-end").value){
      const end=new Date(today); end.setDate(end.getDate()+30);
      el("challenge-end").value=iso(end);
    }
  }

  function openModal(){
    if(!access)return;
    renderModal();
    el("challenges-modal").classList.remove("hidden");
    el("challenges-modal").setAttribute("aria-hidden","false");
  }

  async function refreshAll(){
    await loadChallenges(contact.id,contact);
    renderModal();
    await portal.loadDashboard();
  }

  async function enroll(challengeId,scope){
    const {data,error}=await client.rpc("enroll_client_in_challenge",{
      p_challenge_id:challengeId,
      p_contact_id:contact.id,
      p_scope:scope
    });
    if(error){
      window.alert("Challenge enrollment failed: "+error.message);
      return;
    }
    await refreshAll();
  }

  async function createChallenge(event){
    event.preventDefault();

    const key=el("challenge-key").value.trim();
    const titleValue=el("challenge-title-input").value.trim();
    const target=Number(el("challenge-target").value);
    if(!key||!titleValue||!Number.isFinite(target)||target<=0){
      setStatus("challenge-create-status","Challenge key, title and valid target are required.","error");
      return;
    }

    setStatus("challenge-create-status","Publishing challenge...");

    const {error}=await client.from("wellness_challenges").insert({
      challenge_key:key,
      title:titleValue,
      description:el("challenge-description").value.trim()||null,
      scope:el("challenge-scope").value,
      goal_type:"metric",
      target_key:el("challenge-metric").value,
      aggregation:el("challenge-aggregation").value,
      target_value:target,
      unit:el("challenge-unit").value.trim()||null,
      starts_on:el("challenge-start").value,
      ends_on:el("challenge-end").value,
      status:"published",
      points_available:Number(el("challenge-points-input").value||100),
      created_by:portal.currentUserId(),
      published_at:new Date().toISOString()
    });

    if(error){
      setStatus("challenge-create-status",error.message,"error");
      return;
    }

    event.currentTarget.reset();
    el("challenge-points-input").value="100";
    setStatus("challenge-create-status","Challenge published.","success");
    await refreshAll();
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    loadChallenges(event.detail.contactId,event.detail.contact).catch((error)=>{
      console.error("Challenges failed",error);
    });
  });

  document.addEventListener("ra:contact-closed",()=>{
    contact=null;access=null;summary=null;challenges=[];enrollments=[];metrics=[];
    el("client-challenges-section").classList.add("hidden");
    closeModal();
  });

  el("client-manage-challenges").addEventListener("click",openModal);
  el("challenge-create-form").addEventListener("submit",createChallenge);
  document.querySelectorAll("[data-challenges-close]").forEach((node)=>node.addEventListener("click",closeModal));
  document.addEventListener("keydown",(event)=>{
    if(event.key==="Escape"&&!el("challenges-modal").classList.contains("hidden"))closeModal();
  });
})();