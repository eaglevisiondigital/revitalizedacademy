(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let activeContactId=null;
  let metricRows=[];
  let healthReviewRows=[];
  let metricsOpen=false;
  let healthReviewOpen=false;

  function title(value){
    return String(value||"").replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
  }

  function setMetricStatus(message,type=""){
    portal.showStatus(el("client-health-metrics-status"),message,type);
  }

  async function loadSummary(contactId){
    const {data,error}=await client
      .from("admin_client_health_integration_summary")
      .select("*")
      .eq("contact_id",contactId)
      .maybeSingle();

    if(error){
      console.error("Health integration summary failed",error);
      return;
    }

    const section=el("client-health-integrations-section");
    if(!data){
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    const connected=Number(data.connected_providers||0);
    const attention=Number(data.connections_needing_attention||0);
    el("client-health-integrations-chip").textContent=connected+" Connected";
    el("client-connected-providers").textContent=String(connected);
    el("client-health-attention").textContent=String(attention);
    el("client-health-last-sync").textContent=data.last_successful_sync_at
      ? portal.formatDate(data.last_successful_sync_at,true)
      : "None";
    el("client-health-observations").textContent=String(data.observations_24h||0);
  }

  function reviewValue(row){
    if(row.latest_value!==null&&row.latest_value!==undefined){
      return String(row.latest_value)+(row.latest_unit?" "+row.latest_unit:"");
    }
    if(row.latest_boolean===true)return "Yes";
    if(row.latest_boolean===false)return "No";
    return "No data yet";
  }

  function reviewChange(row){
    if(row.absolute_change===null||row.absolute_change===undefined)return "No 30-day comparison";
    const n=Number(row.absolute_change);
    const prefix=n>0?"+":"";
    return "30-day change "+prefix+String(row.absolute_change)+(row.latest_unit?" "+row.latest_unit:"");
  }

  function renderHealthReview(){
    const summary=el("client-health-review-summary");
    const list=el("client-health-review-list");
    summary.replaceChildren();
    list.replaceChildren();

    const visible=healthReviewRows.length;
    const withData=healthReviewRows.filter((row)=>row.latest_value!==null&&row.latest_value!==undefined||row.latest_boolean!==null&&row.latest_boolean!==undefined).length;
    const highlighted=healthReviewRows.filter((row)=>row.tracking_mode==="highlighted").length;
    const readings=healthReviewRows.reduce((sum,row)=>sum+Number(row.reading_count||0),0);

    [
      ["Visible Metrics",visible],
      ["With Data",withData],
      ["Highlighted",highlighted],
      ["30-Day Readings",readings]
    ].forEach(([label,value])=>{
      const card=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const b=document.createElement("strong");b.textContent=String(value);
      card.append(s,b);summary.append(card);
    });

    if(!healthReviewRows.length){
      list.innerHTML='<div class="drawer-empty">No Health & Progress metrics are visible for this client.</div>';
      return;
    }

    healthReviewRows.forEach((row)=>{
      const card=document.createElement("article");
      card.className="client-health-review-card"+(row.tracking_mode==="highlighted"?" highlighted":"");

      const top=document.createElement("div");
      top.className="client-health-review-card-top";
      const copy=document.createElement("div");
      const label=document.createElement("strong");label.textContent=row.label;
      const meta=document.createElement("span");
      meta.textContent=[title(row.category),row.tracking_mode==="highlighted"?"Highlighted":"Available"].join(" · ");
      copy.append(label,meta);
      const value=document.createElement("b");value.textContent=reviewValue(row);
      top.append(copy,value);

      const detail=document.createElement("div");
      detail.className="client-health-review-detail";
      const change=document.createElement("span");change.textContent=reviewChange(row);
      const source=document.createElement("span");
      source.textContent=row.latest_at
        ?[title(row.latest_source||"recorded"),portal.formatDate(row.latest_at,true)].join(" · ")
        :"Awaiting first measurement";
      const count=document.createElement("span");
      count.textContent=Number(row.reading_count||0)+" reading"+(Number(row.reading_count||0)===1?"":"s")+" in 30 days";
      detail.append(change,source,count);

      const actions=document.createElement("div");
      actions.className="client-health-review-actions";
      const trend=document.createElement("button");
      trend.type="button";trend.className="secondary-button compact-action";
      trend.textContent="View 30-Day History";
      trend.disabled=Number(row.reading_count||0)<1;
      trend.addEventListener("click",()=>openHealthTrend(row,trend));
      actions.append(trend);

      const history=document.createElement("div");
      history.className="client-health-review-history hidden";
      history.dataset.historyMetric=row.metric_key;

      card.append(top,detail,actions,history);
      list.append(card);
    });
  }

  async function loadHealthReview(){
    if(!activeContactId)return;
    portal.showStatus(el("client-health-review-status"),"Loading client Health & Progress...");
    const {data,error}=await client.rpc("admin_get_client_health_progress_review",{
      p_contact_id:activeContactId,
      p_days:30
    });
    if(error){
      healthReviewRows=[];
      renderHealthReview();
      portal.showStatus(el("client-health-review-status"),error.message,"error");
      return;
    }
    healthReviewRows=data||[];
    renderHealthReview();
    portal.showStatus(el("client-health-review-status"),"30-day descriptive review ready.","success");
  }

  async function openHealthTrend(row,button){
    if(!activeContactId)return;
    const history=document.querySelector('[data-history-metric="'+row.metric_key+'"]');
    if(!history)return;

    if(!history.classList.contains("hidden")){
      history.classList.add("hidden");
      button.textContent="View 30-Day History";
      return;
    }

    const old=button.textContent;button.disabled=true;button.textContent="Loading...";
    const {data,error}=await client.rpc("admin_get_client_health_metric_trend",{
      p_contact_id:activeContactId,
      p_metric_key:row.metric_key,
      p_days:30
    });
    button.disabled=false;button.textContent=old;

    if(error){
      portal.showStatus(el("client-health-review-status"),error.message,"error");
      return;
    }

    history.replaceChildren();
    const rows=data||[];
    if(!rows.length){
      history.innerHTML='<div class="drawer-empty">No readings in the last 30 days.</div>';
    }else{
      rows.forEach((point)=>{
        const item=document.createElement("div");
        item.className="client-health-history-row";
        const when=document.createElement("span");when.textContent=portal.formatDate(point.measured_at,true);
        const value=document.createElement("strong");
        value.textContent=point.value_numeric!==null&&point.value_numeric!==undefined
          ?String(point.value_numeric)+(point.unit?" "+point.unit:"")
          :(point.value_boolean===true?"Yes":point.value_boolean===false?"No":"—");
        const source=document.createElement("small");source.textContent=title(point.source||"recorded");
        item.append(when,value,source);history.append(item);
      });
    }
    history.classList.remove("hidden");
    button.textContent="Hide 30-Day History";
  }

  async function toggleHealthReview(){
    healthReviewOpen=!healthReviewOpen;
    el("client-health-review-panel").classList.toggle("hidden",!healthReviewOpen);
    el("client-health-review-toggle").textContent=healthReviewOpen?"Hide Progress Review":"Review Progress";
    if(healthReviewOpen)await loadHealthReview();
  }

  function metricGroup(row){
    if(row.program_tracking_mode!=="hidden")return "standard";
    if(row.category==="clinical_optional")return "clinical";
    return "additional";
  }

  function renderMetricSummary(){
    const target=el("client-health-metrics-summary");
    target.replaceChildren();
    const visible=metricRows.filter((row)=>row.tracking_mode!=="hidden");
    const highlighted=metricRows.filter((row)=>row.tracking_mode==="highlighted");
    const manual=visible.filter((row)=>row.allow_manual);
    const overrides=metricRows.filter((row)=>row.client_override);
    [
      ["Visible",visible.length],
      ["Highlighted",highlighted.length],
      ["Manual Entry",manual.length],
      ["Client Overrides",overrides.length]
    ].forEach(([label,value])=>{
      const item=document.createElement("div");
      const span=document.createElement("span");span.textContent=label;
      const strong=document.createElement("strong");strong.textContent=String(value);
      item.append(span,strong);target.append(item);
    });
  }

  function metricRowElement(row){
    const item=document.createElement("article");
    item.className="client-health-metric-row";
    item.dataset.metricKey=row.metric_key;

    const identity=document.createElement("div");
    identity.className="client-health-metric-identity";
    const name=document.createElement("strong");name.textContent=row.label;
    const meta=document.createElement("span");
    meta.textContent=[
      title(row.category),
      row.unit||null,
      row.client_override?"Client override":"Program default"
    ].filter(Boolean).join(" · ");
    const use=document.createElement("small");
    use.textContent=row.coaching_use||"Descriptive health/progress tracking.";
    identity.append(name,meta,use);

    const controls=document.createElement("div");
    controls.className="client-health-metric-controls";

    const modeLabel=document.createElement("label");
    const modeTitle=document.createElement("span");modeTitle.textContent="Visibility";
    const mode=document.createElement("select");
    mode.dataset.healthField="tracking_mode";
    [
      ["hidden","Hidden"],
      ["available","Available"],
      ["highlighted","Highlighted"]
    ].forEach(([value,label])=>{
      const option=document.createElement("option");
      option.value=value;option.textContent=label;mode.append(option);
    });
    mode.value=row.tracking_mode||"hidden";
    modeLabel.append(modeTitle,mode);

    const sourceLabel=document.createElement("label");
    const sourceTitle=document.createElement("span");sourceTitle.textContent="Preferred Source";
    const source=document.createElement("select");
    source.dataset.healthField="source_preference";
    [
      ["connected","Connected Device"],
      ["manual","Manual Entry"],
      ["connected_or_manual","Connected or Manual"]
    ].forEach(([value,label])=>{
      const option=document.createElement("option");
      option.value=value;option.textContent=label;source.append(option);
    });
    source.value=row.source_preference||"connected_or_manual";
    sourceLabel.append(sourceTitle,source);

    const orderLabel=document.createElement("label");
    const orderTitle=document.createElement("span");orderTitle.textContent="Order";
    const order=document.createElement("input");
    order.type="number";order.min="0";order.max="999";order.step="1";
    order.dataset.healthField="display_order";
    order.value=String(row.display_order??row.program_display_order??100);
    orderLabel.append(orderTitle,order);

    const manualLabel=document.createElement("label");
    manualLabel.className="client-health-manual-toggle";
    const manual=document.createElement("input");
    manual.type="checkbox";manual.dataset.healthField="allow_manual";
    manual.checked=Boolean(row.allow_manual);
    const manualCopy=document.createElement("span");manualCopy.textContent="Allow manual entry";
    manualLabel.append(manual,manualCopy);

    controls.append(modeLabel,sourceLabel,orderLabel,manualLabel);

    const actions=document.createElement("div");
    actions.className="client-health-metric-actions";
    const save=document.createElement("button");
    save.type="button";save.className="primary-button compact-action";
    save.textContent="Save";
    const reset=document.createElement("button");
    reset.type="button";reset.className="secondary-button compact-action";
    reset.textContent="Use Program Default";
    reset.disabled=!row.client_override;
    actions.append(save,reset);

    const locked=!row.can_edit;
    controls.querySelectorAll("select,input").forEach((node)=>node.disabled=locked);
    save.disabled=locked;
    reset.disabled=locked||!row.client_override;

    save.addEventListener("click",()=>saveMetricOverride(item,row.metric_key,save));
    reset.addEventListener("click",()=>clearMetricOverride(row.metric_key,reset));

    item.append(identity,controls,actions);
    return item;
  }

  function renderMetrics(){
    renderMetricSummary();
    const target=el("client-health-metrics-list");
    target.replaceChildren();

    const groups=[
      ["standard","Standard for this program"],
      ["additional","Additional metrics"],
      ["clinical","Optional clinical readings"]
    ];

    groups.forEach(([key,label])=>{
      const rows=metricRows.filter((row)=>metricGroup(row)===key);
      if(!rows.length)return;
      const section=document.createElement("section");
      section.className="client-health-metric-group";
      const heading=document.createElement("div");
      heading.className="client-health-metric-group-head";
      const strong=document.createElement("strong");strong.textContent=label;
      const count=document.createElement("span");count.textContent=rows.length+" metric"+(rows.length===1?"":"s");
      heading.append(strong,count);
      section.append(heading);
      rows.forEach((row)=>section.append(metricRowElement(row)));
      target.append(section);
    });

    if(!metricRows.length){
      target.innerHTML='<div class="drawer-empty">No Health & Progress metrics are available.</div>';
    }
  }

  async function loadMetricConfiguration(){
    if(!activeContactId)return;
    setMetricStatus("Loading health metric configuration...");
    const {data,error}=await client.rpc("admin_get_client_health_metric_configuration",{
      p_contact_id:activeContactId
    });
    if(error){
      metricRows=[];
      renderMetrics();
      setMetricStatus(error.message,"error");
      return;
    }
    metricRows=data||[];
    renderMetrics();
    const editable=metricRows.some((row)=>row.can_edit);
    setMetricStatus(
      editable
        ?"Client-specific changes override this program's defaults until reset."
        :"You can review this client's metric configuration, but your role cannot change plan overrides."
    );
  }

  async function saveMetricOverride(item,metricKey,button){
    if(!activeContactId)return;
    const field=(name)=>item.querySelector('[data-health-field="'+name+'"]');
    const orderRaw=field("display_order").value;
    const payload={
      p_contact_id:activeContactId,
      p_metric_key:metricKey,
      p_tracking_mode:field("tracking_mode").value,
      p_allow_manual:field("allow_manual").checked,
      p_source_preference:field("source_preference").value,
      p_display_order:orderRaw===""?null:Number(orderRaw),
      p_notes:null
    };
    const old=button.textContent;button.disabled=true;button.textContent="Saving...";
    setMetricStatus("Saving client health metric override...");
    const {error}=await client.rpc("set_client_health_metric_override",payload);
    button.textContent=old;button.disabled=false;
    if(error){
      setMetricStatus(error.message,"error");
      return;
    }
    await portal.logActivity(
      activeContactId,
      "health_metric_override_updated",
      "Health metric tracking updated",
      metricKey+" · "+payload.p_tracking_mode,
      {
        metric_key:metricKey,
        tracking_mode:payload.p_tracking_mode,
        allow_manual:payload.p_allow_manual,
        source_preference:payload.p_source_preference,
        display_order:payload.p_display_order
      }
    );
    setMetricStatus("Health metric setting saved.","success");
    await loadMetricConfiguration();
  }

  async function clearMetricOverride(metricKey,button){
    if(!activeContactId)return;
    const old=button.textContent;button.disabled=true;button.textContent="Resetting...";
    setMetricStatus("Restoring program default...");
    const {error}=await client.rpc("clear_client_health_metric_override",{
      p_contact_id:activeContactId,
      p_metric_key:metricKey
    });
    button.textContent=old;
    if(error){
      button.disabled=false;
      setMetricStatus(error.message,"error");
      return;
    }
    await portal.logActivity(
      activeContactId,
      "health_metric_override_cleared",
      "Health metric restored to program default",
      metricKey,
      {metric_key:metricKey}
    );
    setMetricStatus("Program default restored.","success");
    await loadMetricConfiguration();
  }

  async function toggleMetrics(){
    metricsOpen=!metricsOpen;
    const panel=el("client-health-metrics-panel");
    panel.classList.toggle("hidden",!metricsOpen);
    el("client-health-metrics-toggle").textContent=metricsOpen?"Hide Health Metrics":"Manage Health Metrics";
    if(metricsOpen)await loadMetricConfiguration();
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    activeContactId=event.detail.contactId;
    metricsOpen=false;
    healthReviewOpen=false;
    el("client-health-metrics-panel").classList.add("hidden");
    el("client-health-review-panel").classList.add("hidden");
    el("client-health-metrics-toggle").textContent="Manage Health Metrics";
    el("client-health-review-toggle").textContent="Review Progress";
    loadSummary(activeContactId);
  });

  document.addEventListener("ra:contact-closed",()=>{
    activeContactId=null;
    metricRows=[];
    healthReviewRows=[];
    metricsOpen=false;
    healthReviewOpen=false;
    el("client-health-integrations-section").classList.add("hidden");
    el("client-health-metrics-panel").classList.add("hidden");
    el("client-health-review-panel").classList.add("hidden");
    el("client-health-metrics-list").replaceChildren();
    el("client-health-review-list").replaceChildren();
    setMetricStatus("");
    portal.showStatus(el("client-health-review-status"),"");
  });

  el("client-health-metrics-toggle").addEventListener("click",toggleMetrics);
  el("client-health-review-toggle").addEventListener("click",toggleHealthReview);
})();