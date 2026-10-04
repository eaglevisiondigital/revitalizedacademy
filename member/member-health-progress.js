(() => {
  "use strict";
  const client = window.RA_MEMBER_CLIENT;
  const el = id => document.getElementById(id);
  if (!client || !el("rm-health-progress-overview")) return;
  // Own the existing premium overview; the legacy renderer remains the fallback
  // when this additive module is absent. Private state stays inside this closure.
  window.RA_MEMBER_HEALTH_PROGRESS_ACTIVE = true;
  const numeric = v => typeof v === "number" && Number.isFinite(v) ? v : null;
  const fmt = v => numeric(v) === null ? "Not recorded" : v.toLocaleString(undefined, {maximumFractionDigits:2});
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  function dateValue(v) {
    if (typeof v !== "string" || !v) return null;
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(v);
    const d = new Date(dateOnly ? v+"T12:00:00" : v);
    return Number.isFinite(d.getTime()) && (!dateOnly || dayKey(d) === v) ? d : null;
  }
  const dateLabel = v => {const d=dateValue(v);return d ? d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}) : "Date unavailable";};
  const timeLabel = v => {const d=dateValue(v);return d ? d.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}) : "Time not scheduled";};
  const node = (tag,text,cls) => {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const empty = text => node("p",text,"rm220-empty");
  const regions = ["rm-health-goal-summary","rm-health-habit-summary","rm-health-nutrition-summary","rm-health-coaching-summary","rm-health-source-summary"];
  let context=null, generation=0, metricRequest=0, nutritionRequest=0, period=7, nutritionDate=dayKey(), started=false;
  let flagPromise=Promise.resolve({});
  const current = c => context === c && c?.generation === generation;
  const own = (rows,c) => (Array.isArray(rows)?rows:[]).filter(row=>row.contact_id===c.contactId);
  function reset() {
    generation++; metricRequest++; nutritionRequest++; context=null; started=false;
    nutritionDate=dayKey(); el("rm-health-nutrition-date").value=nutritionDate;
    for(const id of [...regions,"rm-health-progress-metrics","rm-health-feature-chart","rm-health-feature-value","rm-health-feature-meta","rm-health-feature-period","rm-health-overview-status"])el(id)?.replaceChildren();
    el("rm-health-feature-label").textContent="Your measurements";
    el("rm-health-nutrition-link").hidden=true;
    el("rm-health-nutrition-date").disabled=true;
    el("rm-health-progress-overview").removeAttribute("aria-busy");
  }
  async function read(request) {
    const owner=context;
    const result=await request();
    if(result?.error){
      if(current(owner)&&["401","PGRST301","PGRST303"].includes(String(result.error.status||result.error.code))){
        reset();document.dispatchEvent(new CustomEvent("ra:member-access-lost"));
      }
      throw Error("Section unavailable");
    }
    return result?.data;
  }
  async function section(c,id,request,render) {
    if(!current(c))return;
    const root=el(id);root.replaceChildren(empty("Loading your information…"));
    try {const result=await request();if(current(c))render(root,result);}
    catch {if(current(c))root.replaceChildren(empty("This section is temporarily unavailable. You can still use the rest of Health & Progress."));}
  }
  const aliases={body_fat_percent:["body_fat_percent","body_fat","body_fat_percentage"],steps:["steps","step_count"],resting_heart_rate:["resting_heart_rate","resting_hr","heart_rate_resting"],sleep_duration:["sleep_duration","sleep","sleep_hours"],active_minutes:["active_minutes","exercise_minutes"],active_energy:["active_energy","active_calories"],water_intake:["water_intake","water","hydration"],energy_level:["energy_level","energy"],mood_score:["mood_score","mood"],heart_rate_variability:["heart_rate_variability","hrv"],oxygen_saturation:["oxygen_saturation","spo2"],vo2_max:["vo2_max","cardio_fitness"],blood_glucose:["blood_glucose","glucose"],waist_circumference:["waist_circumference","waist"],protein_intake:["protein_intake","protein"],fiber_intake:["fiber_intake","fiber"],stress_level:["stress_level","stress"],digestion_score:["digestion_score","digestion"],cravings_level:["cravings_level","cravings"],pain_level:["pain_level","pain"]};
  function permitted(row,def,c) {
    return row.origin === "wearable" ? c.biometricsEnabled && def.source_preference!=="manual" : def.source_preference!=="connected";
  }
  function measured(rows,unit) {
    return rows.filter(r=>numeric(r.value_numeric)!==null && dateValue(r.recorded_at) && (!unit||r.unit===unit)).sort((a,b)=>dateValue(a.recorded_at)-dateValue(b.recorded_at));
  }
  function chart(rows,label,large=false) {
    const wrap=node("div",undefined,large?"rm220-chart rm220-chart-large":"rm220-chart");
    if(rows.length<2){wrap.append(empty(rows.length===1?"One measured reading. A trend needs at least two.":"A trend will appear after more measured data."));return wrap;}
    const width=600,height=large?160:60,values=rows.map(r=>r.value_numeric),times=rows.map(r=>dateValue(r.recorded_at).getTime());
    const min=Math.min(...values),max=Math.max(...values),span=times.at(-1)-times[0];
    const coords=rows.map((r,i)=>[span?8+(times[i]-times[0])/span*(width-16):width/2,max===min?height/2:8+(max-r.value_numeric)/(max-min)*(height-16)]);
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox",`0 0 ${width} ${height}`);svg.setAttribute("role","img");svg.setAttribute("aria-label",`${label}: ${rows.length} measured readings, ${dateLabel(rows[0].recorded_at)} to ${dateLabel(rows.at(-1).recorded_at)}`);
    const line=document.createElementNS(svg.namespaceURI,"polyline");line.setAttribute("points",coords.map(p=>p.join(",")).join(" "));line.setAttribute("fill","none");line.setAttribute("vector-effect","non-scaling-stroke");svg.append(line);
    for(const [x,y] of coords){const dot=document.createElementNS(svg.namespaceURI,"circle");dot.setAttribute("cx",x);dot.setAttribute("cy",y);dot.setAttribute("r","2.5");svg.append(dot);}wrap.append(svg);
    const difference=values.at(-1)-values[0];wrap.append(node("small",`${difference>0?"+":""}${fmt(difference)} ${rows[0].unit||""} across ${rows.length} readings`));
    if(large){const dates=node("div",undefined,"rm220-chart-dates");dates.append(node("span",dateLabel(rows[0].recorded_at)),node("span",dateLabel(rows.at(-1).recorded_at)));wrap.append(dates,node("small","Measured points only. Missing days are not filled with zero."));}
    return wrap;
  }
  async function loadMetrics(c) {
    const request=++metricRequest,days=period;
    el("rm-health-progress-metrics").replaceChildren();el("rm-health-feature-chart").replaceChildren();el("rm-health-feature-value").textContent="Loading measurements…";el("rm-health-feature-meta").textContent="";
    el("rm-health-overview-status").textContent="Loading your configured measurements…";
    el("rm-health-feature-period").textContent=`Last ${days} days`;
    try {
      const config=await read(()=>client.rpc("get_my_health_metric_configuration"));
      if(!current(c)||request!==metricRequest)return;
      if(!Array.isArray(config))throw Error("Configuration unavailable");
      const defs=config.filter(r=>r.tracking_mode==="available"||r.tracking_mode==="highlighted").sort((a,b)=>(a.display_order??100)-(b.display_order??100));
      if(!defs.length){el("rm-health-feature-label").textContent="Your measurements";el("rm-health-feature-value").textContent="No metrics selected";el("rm-health-feature-chart").append(empty("Your team has not enabled measurements for this account yet."));el("rm-health-overview-status").textContent="";return;}
      const [latestResult,manualResult,flags]=await Promise.all([
        read(()=>client.from("my_health_metric_latest").select("contact_id,metric_key,unit,value_numeric,value_boolean,recorded_at,origin,source_key").eq("contact_id",c.contactId)).then(data=>({data}),()=>({error:true})),
        read(()=>client.from("my_recent_progress").select("contact_id,metric_key,unit,value_numeric,value_boolean,recorded_at,source").eq("contact_id",c.contactId)).then(data=>({data}),()=>({error:true})),flagPromise
      ]);
      if(!current(c)||request!==metricRequest)return;
      const latest=own(latestResult.data,c),manual=own(manualResult.data,c).map(r=>({...r,origin:"manual"}));
      const cutoff=Date.now()-days*86400000,now=Date.now();
      const rows=await Promise.all(defs.map(async def=>{
        const keys=aliases[def.metric_key]||[def.metric_key];
        const candidates=[...latest,...manual].filter(r=>keys.includes(r.metric_key)&&permitted(r,def,c)&&dateValue(r.recorded_at)?.getTime()<=now);
        let valueRow=measured(candidates).at(-1)||null;
        let history=manual.filter(r=>keys.includes(r.metric_key)&&permitted(r,def,c)),unavailable=manualResult.error;
        if(c.biometricsEnabled&&flags.feature_member_health_trends_vnext===true&&def.source_preference!=="manual"){
          try {const values=await Promise.all(keys.map(key=>read(()=>client.rpc("get_my_health_metric_trend",{p_contact_id:c.contactId,p_metric_key:key,p_days:days}))));history=values.flat().filter(r=>r&&permitted(r,def,c));unavailable=false;}
          catch {unavailable=true;}
        }
        // The latest view may contain a newer reading from a source that this
        // metric does not permit. An allowed trend still supplies its real latest value.
        valueRow=measured([...candidates,...history].filter(r=>permitted(r,def,c)&&dateValue(r.recorded_at)?.getTime()<=now)).at(-1)||null;
        const unit=valueRow?.unit||def.unit;
        const series=measured(history.filter(r=>{const d=dateValue(r.recorded_at)?.getTime();return d>=cutoff&&d<=now;}),unit);
        return {def,valueRow,series,unavailable,latestUnavailable:latestResult.error&&manualResult.error};
      }));
      if(!current(c)||request!==metricRequest)return;
      const feature=rows.find(r=>r.def.metric_key==="weight")||rows.find(r=>r.def.tracking_mode==="highlighted")||rows[0];
      const display=row=>row.valueRow?`${fmt(row.valueRow.value_numeric)} ${row.valueRow.unit||row.def.unit||""}`:row.latestUnavailable?"Temporarily unavailable":"Awaiting data";
      const source=row=>row.valueRow?`${row.valueRow.origin==="wearable"?"Connected device":"Progress log"} · ${timeLabel(row.valueRow.recorded_at)}`:"No recorded value yet.";
      el("rm-health-feature-label").textContent=feature.def.label+" Trend";el("rm-health-feature-value").textContent=display(feature);el("rm-health-feature-meta").textContent=source(feature);
      el("rm-health-feature-chart").replaceChildren(chart(feature.series,feature.def.label,true));
      if(feature.unavailable)el("rm-health-feature-chart").append(empty("Some recent readings are unavailable. Showing accessible measured entries only."));
      el("rm-health-progress-metrics").replaceChildren(...rows.filter(r=>r!==feature).map(row=>{
        const card=node("article",undefined,"rm214-metric-card rm220-metric");card.append(node("span",row.def.label),node("strong",display(row)),node("small",source(row)),chart(row.series,row.def.label));if(row.unavailable)card.append(node("small","Recent history is partially unavailable."));return card;
      }));
      el("rm-health-overview-status").textContent=`${defs.length} configured measurements · Last ${days} days. `+(c.biometricsEnabled&&flags.feature_member_health_trends_vnext===true?"Available device and progress readings.":"Trends show recent manually logged readings where available.");
    } catch {if(current(c)&&request===metricRequest){el("rm-health-feature-value").textContent="Measurements unavailable";el("rm-health-feature-chart").replaceChildren(empty("Your measurement settings could not be loaded. Other sections remain available."));el("rm-health-overview-status").textContent="Use Refresh overview to try again.";}}
  }
  async function loadGoals(c) {
    const goalNodes=new Map();
    await section(c,"rm-health-goal-summary",()=>read(()=>client.from("my_goals").select("id,contact_id,title,target_value,target_unit,target_date,status").eq("contact_id",c.contactId)),(root,data)=>{
      const rows=own(data,c).filter(r=>r.status==="active");root.replaceChildren();if(!rows.length){root.append(empty("No active goals yet. Define a goal when you are ready."));return;}
      root.append(node("p",`${rows.length} active goal${rows.length===1?"":"s"}`));
      for(const row of rows.slice(0,3)){const item=node("div",undefined,"rm220-list-row");item.append(node("strong",row.title),node("span",numeric(row.target_value)!==null?`Target ${fmt(row.target_value)} ${row.target_unit||""}`:"Target not set"),node("small",row.target_date?`Due ${dateLabel(row.target_date)}`:"No due date"));goalNodes.set(row.id,item);root.append(item);}
    });
    const flags=await flagPromise;if(!current(c)||flags.feature_member_progress_vnext!==true)return;
    try {const rows=await read(()=>client.from("my_goal_progress").select("goal_id,contact_id,current_value,target_unit,completion_percent,current_recorded_at").eq("contact_id",c.contactId));if(!current(c))return;
      for(const [id,item] of goalNodes){const row=own(rows,c).find(r=>r.goal_id===id);if(!row)continue;item.append(node("small",numeric(row.current_value)!==null?`Current ${fmt(row.current_value)} ${row.target_unit||""} · ${dateLabel(row.current_recorded_at)}`:"Progress awaits a recorded measurement"));if(numeric(row.completion_percent)!==null)item.append(node("small",`${fmt(row.completion_percent)}% of goal`));}
    } catch {/* Basic goals remain usable when the optional progress contract fails. */}
  }
  function loadHabits(c) {return section(c,"rm-health-habit-summary",()=>read(()=>client.from("my_habits").select("contact_id,title,status,frequency,target_per_period,unit,last_7_day_value,today_value").eq("contact_id",c.contactId)),(root,data)=>{
    const rows=own(data,c).filter(r=>r.status==="active");root.replaceChildren();if(!rows.length){root.append(empty("No active habits yet. Start with a rhythm that works for you."));return;}root.append(node("p",`${rows.length} active habit${rows.length===1?"":"s"}`));
    for(const row of rows.slice(0,3)){const item=node("div",undefined,"rm220-list-row");item.append(node("strong",row.title),node("span",`Last 7 reporting days: ${fmt(row.last_7_day_value)} ${row.unit||""}`),node("small",`Current reporting day: ${fmt(row.today_value)} ${row.unit||""}`));if(numeric(row.target_per_period)!==null)item.append(node("small",`Target: ${fmt(row.target_per_period)} ${row.unit||""} · ${row.frequency||"per period"}`));root.append(item);}
  });}
  const nutrients=[["energy_kcal","Calories","kcal"],["protein_g","Protein","g"],["carbohydrate_g","Carbohydrates","g"],["fat_g","Fat","g"],["fiber_g","Fiber","g"],["water_g","Water","g"]];
  async function loadNutrition(c) {
    const request=++nutritionRequest,date=nutritionDate,root=el("rm-health-nutrition-summary");root.replaceChildren();
    el("rm-health-nutrition-date").disabled=!c.nutritionEnabled;el("rm-health-nutrition-link").hidden=!c.nutritionEnabled;
    if(!c.nutritionEnabled){root.append(empty("Nutrition is not included in your current access. Your other Health & Progress sections are ready to use."));return;}
    root.append(empty("Loading your nutrition snapshot…"));
    try {const [day,trends]=await Promise.all([read(()=>client.rpc("get_my_nutrition_day",{p_log_date:date})),read(()=>client.rpc("get_my_nutrition_trends",{p_days:7,p_end_date:date}))]);
      if(!current(c)||request!==nutritionRequest)return;if(!day||!Array.isArray(day.targets)||!Array.isArray(trends))throw Error("Incomplete nutrition");
      const grid=node("div",undefined,"rm220-nutrition-grid");
      for(const [key,label,unit] of nutrients){const total=numeric(day.totals?.[key]),target=day.targets.find(t=>t.nutrient_key===key),card=node("div",undefined,"rm220-nutrient");card.append(node("span",label),node("strong",total===null?"Not logged":`${fmt(total)} ${unit}`));
        const configured=[["Min",target?.minimum],["Target",target?.target],["Max",target?.maximum]].filter(([,v])=>numeric(v)!==null);
        card.append(node("small",configured.length?configured.map(([name,v])=>`${name} ${fmt(v)} ${target.unit||unit}`).join(" · "):"No target configured"));
        if(total!==null&&numeric(target?.target)!==null){const diff=total-target.target;card.append(node("small",`${diff>0?"+":""}${fmt(diff)} ${unit} from target`));}grid.append(card);
      }
      const averages=nutrients.slice(0,2).map(([key,label,unit])=>{const values=trends.map(r=>numeric(r.totals?.[key])).filter(v=>v!==null);return values.length?`${label}: ${fmt(values.reduce((a,b)=>a+b,0)/values.length)} ${unit} (${values.length} measured days)`:null;}).filter(Boolean);
      root.replaceChildren(node("p",dateLabel(date)),grid,node("p",`${trends.length} logged days in the 7-day window ending ${dateLabel(date)}.`),node("small",averages.length?"Logged-day averages · "+averages.join(" · "):"Averages appear when numeric nutrition values are logged."));
    } catch {if(current(c)&&request===nutritionRequest)root.replaceChildren(empty("Nutrition is temporarily unavailable. Your other progress is still accessible."));}
  }
  function loadCoaching(c) {return section(c,"rm-health-coaching-summary",()=>read(()=>client.from("my_coaching_hub").select("contact_id,program_name,assigned_coach_name,next_appointment,current_assignments,recent_sessions").eq("contact_id",c.contactId).maybeSingle()),(root,row)=>{
    root.replaceChildren();if(!row||row.contact_id!==c.contactId){root.append(empty("Your coaching context will appear when sessions or action items are available."));return;}
    if(row.program_name)root.append(node("strong",row.program_name));if(row.assigned_coach_name)root.append(node("p",`With ${row.assigned_coach_name}`));
    const next=row.next_appointment;root.append(node("p",next?.scheduled_start?`Next session · ${timeLabel(next.scheduled_start)}`:"No upcoming coaching appointment is scheduled."));
    const recent=(Array.isArray(row.recent_sessions)?row.recent_sessions:[]).filter(r=>r.status==="completed"&&dateValue(r.completed_at||r.scheduled_start)).sort((a,b)=>dateValue(b.completed_at||b.scheduled_start)-dateValue(a.completed_at||a.scheduled_start))[0];if(recent)root.append(node("small",`Last completed session · ${dateLabel(recent.completed_at||recent.scheduled_start)}`));
    const assignments=(Array.isArray(row.current_assignments)?row.current_assignments:[]).filter(r=>["assigned","in_progress"].includes(r.status));root.append(node("p",assignments.length?`${assignments.length} current action items`:"No current coaching action items."));for(const item of assignments.slice(0,3)){const line=node("div",undefined,"rm220-list-row");line.append(node("strong",item.title),node("small",item.due_at?`Due ${dateLabel(item.due_at)}`:"No due date"));root.append(line);}
  });}
  function loadSources(c) {
    if(!c.biometricsEnabled){el("rm-health-source-summary").replaceChildren(empty("Connected health data is not included in your current access. You can still use available progress tools."));return;}
    return section(c,"rm-health-source-summary",()=>read(()=>client.from("my_health_connection_center").select("provider_name,connection_mode,status,last_successful_sync_at").order("provider_name")),(root,data)=>{
      const rows=(Array.isArray(data)?data:[]).filter(r=>r.status!=="not_connected");root.replaceChildren();if(!rows.length){root.append(empty("No health source connected yet. Visit Health Connections to review available options and privacy preferences."));return;}
      for(const row of rows){const item=node("div",undefined,"rm220-list-row");item.append(node("strong",row.provider_name||"Health source"),node("span",row.status==="connected"?"Connection registered":row.status==="disconnected"?"Disconnected":"Connection needs attention"),node("small",row.last_successful_sync_at?`Last successful sync · ${timeLabel(row.last_successful_sync_at)}`:"No successful sync recorded yet."));if(row.connection_mode==="mobile_bridge")item.append(node("small","Native app connection required; registration alone does not confirm syncing."));root.append(item);}
    });
  }
  async function load() {
    const c=context;if(!c)return;started=true;
    for(const id of [...regions,"rm-health-progress-metrics","rm-health-feature-chart","rm-health-feature-value","rm-health-feature-meta"])el(id)?.replaceChildren();
    try{
      const allowed=await read(()=>client.rpc("member_paid_access_allowed"));
      if(!current(c))return;
      if(allowed!==true){reset();document.dispatchEvent(new CustomEvent("ra:member-access-lost"));return;}
    }catch{if(current(c)){reset();document.dispatchEvent(new CustomEvent("ra:member-access-lost"));}return;}
    void loadMetrics(c);void loadGoals(c);void loadHabits(c);void loadNutrition(c);void loadCoaching(c);void loadSources(c);
  }
  document.addEventListener("ra:member-access-reset",reset);
  function acceptContext(event){
    reset();const h=event.detail?.healthContext;if(!h?.contactId||!h?.userId)return;
    context={...h,generation};
    flagPromise=read(()=>client.from("app_runtime_config").select("config_key,config_value").in("config_key",["feature_member_progress_vnext","feature_member_health_trends_vnext"]).eq("active",true)).then(rows=>Object.fromEntries((rows||[]).map(r=>[r.config_key,r.config_value])),()=>({}));
    if(el("rm-member-content")?.dataset.activeScreen==="health")void load();
  }
  document.addEventListener("ra:member-dashboard-loaded",acceptContext);
  document.addEventListener("ra:member-health-context",acceptContext);
  document.addEventListener("ra:member-screen-changed",event=>{if(event.detail?.screen==="health"&&!started)load();});
  el("rm-health-refresh").addEventListener("click",()=>{if(context){const previous=context;generation++;context={...previous,generation};load();}});
  document.querySelectorAll("[data-health-days]").forEach(button=>button.addEventListener("click",()=>{period=Number(button.dataset.healthDays);document.querySelectorAll("[data-health-days]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));if(context)void loadMetrics(context);}));
  el("rm-health-nutrition-date").addEventListener("change",event=>{const value=event.target.value;if(/^\d{4}-\d{2}-\d{2}$/.test(value)&&dateValue(value)){nutritionDate=value;if(context)void loadNutrition(context);}else event.target.value=nutritionDate;});
  client.auth.onAuthStateChange((_event,session)=>{if(!session||context&&session.user?.id!==context.userId)reset();});
  reset();
  document.dispatchEvent(new CustomEvent("ra:member-health-ready"));
})();
