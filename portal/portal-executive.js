(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);
  let loading=false;

  function metricCard(label,value,className=""){
    const card=document.createElement("div");
    card.className="executive-metric"+(className?" "+className:"");
    const span=document.createElement("span");
    span.textContent=label;
    const strong=document.createElement("strong");
    strong.textContent=String(value);
    card.append(span,strong);
    return card;
  }

  function renderMetrics(row){
    const target=el("executive-pulse-metrics");
    target.replaceChildren(
      metricCard("Active members",row.active_memberships||0),
      metricCard("Paid enrollments",row.paid_enrollments||0),
      metricCard("Stalled journeys",row.stalled_journeys||0,Number(row.stalled_journeys||0)>0?"warn":""),
      metricCard("Check-ins · 7d",row.checkins_7d||0),
      metricCard("Open assignments",row.open_client_assignments||0),
      metricCard("Course progress",Math.round(Number(row.average_course_progress||0))+"%"),
      metricCard("Active challenges",row.active_challenge_enrollments||0),
      metricCard("Health sources",row.connected_health_sources||0),
      metricCard("Companion reviews",row.companion_reviews_open||0,Number(row.companion_reviews_open||0)>0?"warn":""),
      metricCard("Delivery blockers",row.blocked_notification_deliveries||0,Number(row.blocked_notification_deliveries||0)>0?"alert":"")
    );
  }

  function renderFunnel(rows){
    const target=el("executive-funnel");
    target.replaceChildren();
    if(!rows.length){
      target.innerHTML='<div class="empty-state">No funnel data yet.</div>';
      return;
    }

    const max=Math.max(...rows.map((r)=>Number(r.stage_count||0)),1);
    rows.forEach((row)=>{
      const wrap=document.createElement("div");
      wrap.className="executive-funnel-row";
      const label=document.createElement("span");
      label.textContent=row.stage_name;
      const track=document.createElement("div");
      track.className="executive-funnel-track";
      const bar=document.createElement("i");
      bar.style.width=Math.max(3,Math.round((Number(row.stage_count||0)/max)*100))+"%";
      track.append(bar);
      const count=document.createElement("strong");
      count.textContent=String(row.stage_count||0);
      wrap.append(label,track,count);
      target.append(wrap);
    });
  }

  function renderPrograms(rows){
    const target=el("executive-programs");
    target.replaceChildren();

    if(!rows.length){
      target.innerHTML='<div class="empty-state">No program performance data yet.</div>';
      return;
    }

    rows.forEach((row)=>{
      const item=document.createElement("div");
      item.className="executive-program";

      const name=document.createElement("strong");
      name.textContent=row.program_name;

      const active=document.createElement("span");
      active.innerHTML="<b>"+String(row.active_members||0)+"</b>Active";

      const progress=document.createElement("span");
      progress.innerHTML="<b>"+Math.round(Number(row.average_course_progress||0))+"%</b>Course";

      const sessions=document.createElement("span");
      sessions.innerHTML="<b>"+String(row.coaching_sessions_30d||0)+"</b>Sessions 30d";

      const checkins=document.createElement("span");
      checkins.innerHTML="<b>"+String(row.checkins_30d||0)+"</b>Check-ins 30d";

      item.append(name,active,progress,sessions,checkins);
      target.append(item);
    });
  }

  async function load(){
    if(loading)return;
    loading=true;

    const [metricsResult,funnelResult,programResult]=await Promise.all([
      client.from("admin_platform_health_metrics").select("*").maybeSingle(),
      client.from("admin_conversion_funnel").select("*").order("stage_order"),
      client.from("admin_program_performance").select("*").order("program_name")
    ]);

    loading=false;

    const failed=[metricsResult,funnelResult,programResult].find((r)=>r.error);
    if(failed?.error){
      console.error("Executive Pulse failed",failed.error);
      return;
    }

    renderMetrics(metricsResult.data||{});
    renderFunnel(funnelResult.data||[]);
    renderPrograms(programResult.data||[]);
  }

  el("executive-pulse-refresh").addEventListener("click",load);
  document.addEventListener("ra:dashboard-loaded",load);
  window.setTimeout(load,900);
})();