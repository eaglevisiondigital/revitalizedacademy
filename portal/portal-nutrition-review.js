(()=>{
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal?.authClient)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let contactId=null;
  let open=false;
  let requestSequence=0;
  let permissionsRefreshing=false;
  let loadedContext=null;
  let pendingMutation=null;
  const localDateIso=(d=new Date())=>{
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const day=String(d.getDate()).padStart(2,"0");
    return y+"-"+m+"-"+day;
  };
  let date=localDateIso();
  let data={items:[],totals:{}};
  let targetRows=[];
  let trendData={days:7,logged_days:0,series:[],averages:{}};
  let trendDays=7;

  const title=(v)=>String(v||"").replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
  const fmt=(v,d=1)=>Number(v).toLocaleString(undefined,{maximumFractionDigits:d});
  const hasValue=(v)=>typeof v==="number"&&Number.isFinite(v);
  const canReview=()=>Boolean(contactId&&!permissionsRefreshing&&portal.hasPermission?.("health.private.view"));

  function currentContext(context,needsOverride=false){
    if(!canReview()){updateVisibility();return false;}
    const current=context&&context.sequence===requestSequence&&context.contact===contactId&&
      context.date===date&&context.days===trendDays&&open;
    if(current&&needsOverride&&!portal.hasPermission?.("plan.override")){
      clearReview();
      return false;
    }
    return Boolean(current);
  }

  function formatDateOnly(value){
    if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return "Date unavailable";
    const local=new Date(value+"T12:00:00");
    if(localDateIso(local)!==value)return "Date unavailable";
    return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(local);
  }

  function status(message,type=""){
    const node=el("client-nutrition-review-status");
    if(node)portal.showStatus(node,message,type);
  }

  function renderSummary(){
    const root=el("client-nutrition-review-summary");
    if(!root)return;
    root.replaceChildren();
    const totals=data?.totals||{};
    const metrics=[
      ["Calories",totals.energy_kcal,"kcal",0],
      ["Protein",totals.protein_g,"g",1],
      ["Carbohydrates",totals.carbohydrate_g,"g",1],
      ["Fat",totals.fat_g,"g",1],
      ["Fiber",totals.fiber_g,"g",1],
      ["Water",totals.water_g,"g",1]
    ];
    metrics.forEach(([label,value,unit,digits])=>{
      const card=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const b=document.createElement("strong");
      b.textContent=hasValue(value)?fmt(value,digits)+" "+unit:"—";
      card.append(s,b);root.append(card);
    });
  }

  function renderItems(){
    const root=el("client-nutrition-review-items");
    if(!root)return;
    root.replaceChildren();
    const rows=Array.isArray(data?.items)?data.items:[];
    if(!rows.length){
      root.innerHTML='<div class="drawer-empty">No nutrition items were logged for this day.</div>';
      return;
    }

    const groups=new Map();
    rows.forEach((row)=>{
      const slot=row.meal_slot||"other";
      if(!groups.has(slot))groups.set(slot,[]);
      groups.get(slot).push(row);
    });

    ["breakfast","lunch","dinner","snack","supplement","water","other"].forEach((slot)=>{
      const items=groups.get(slot)||[];
      if(!items.length)return;

      const section=document.createElement("section");
      section.className="client-nutrition-review-group";
      const heading=document.createElement("h4");
      heading.textContent=title(slot);
      section.append(heading);

      items.forEach((row)=>{
        const item=document.createElement("div");
        item.className="client-nutrition-review-row";
        const copy=document.createElement("div");
        const name=document.createElement("strong");
        name.textContent=(row.brand?row.brand+" · ":"")+(row.label||"Nutrition item");
        const meta=document.createElement("span");
        meta.textContent=[
          hasValue(row.quantity)?fmt(row.quantity,2)+" serving"+(row.quantity===1?"":"s"):null,
          hasValue(row.nutrients?.energy_kcal)?fmt(row.nutrients.energy_kcal,0)+" kcal":null,
          hasValue(row.nutrients?.protein_g)?fmt(row.nutrients.protein_g,1)+"g protein":null,
          row.source?title(row.source):null
        ].filter(Boolean).join(" · ");
        copy.append(name,meta);
        if(row.note){
          const note=document.createElement("small");
          note.textContent=row.note;
          copy.append(note);
        }
        item.append(copy);section.append(item);
      });

      root.append(section);
    });
  }

  function renderTargets(){
    const root=el("client-nutrition-targets");
    if(!root)return;
    root.replaceChildren();
    const context=loadedContext;
    const canEdit=Boolean(currentContext(context)&&portal.hasPermission?.("plan.override"));
    const access=el("client-nutrition-target-access");
    if(access)access.textContent=canEdit?"Coach Override Enabled":"Read Only";

    const rows=(Array.isArray(targetRows)?targetRows:[]).filter((row)=>
      row.default_visible||row.source||hasValue(row.minimum)||hasValue(row.target)||hasValue(row.maximum)
    );
    if(!rows.length){
      root.innerHTML='<div class="drawer-empty">No nutrition targets are configured for this client yet.</div>';
      return;
    }

    rows.forEach((row)=>{
      const item=document.createElement("article");
      item.className="client-nutrition-target-row";
      const copy=document.createElement("div");
      const name=document.createElement("strong");name.textContent=row.name;
      const meta=document.createElement("span");
      meta.textContent=[row.source==="coach"?"Coach Override":row.source==="program"?"Program Default":"No Override",row.unit].filter(Boolean).join(" · ");
      copy.append(name,meta);

      const fields=document.createElement("div");fields.className="client-nutrition-target-fields";
      [["minimum","Min"],["target","Target"],["maximum","Max"]].forEach(([key,label])=>{
        const wrap=document.createElement("label");
        const s=document.createElement("span");s.textContent=label;
        const input=document.createElement("input");
        input.type="number";input.min="0";input.step="0.01";
        input.value=hasValue(row[key])?row[key]:"";
        input.dataset.targetKey=key;
        input.disabled=!canEdit;
        wrap.append(s,input);fields.append(wrap);
      });

      const actions=document.createElement("div");actions.className="client-nutrition-target-actions";
      const save=document.createElement("button");save.type="button";save.className="primary-button compact-action";save.textContent="Save Override";save.disabled=!canEdit;
      save.addEventListener("click",()=>saveTarget(row,item,context));
      const clear=document.createElement("button");clear.type="button";clear.className="secondary-button compact-action";clear.textContent="Use Program Default";clear.disabled=!canEdit||row.source!=="coach";
      clear.addEventListener("click",()=>clearTarget(row,context));
      actions.append(save,clear);
      item.append(copy,fields,actions);root.append(item);
    });
  }

  async function saveTarget(row,item,context){
    if(!currentContext(context,true)||pendingMutation)return;
    const inputs=[...item.querySelectorAll("input")];
    if(inputs.some(input=>!input.checkValidity())){
      status("Enter a non-negative number or leave the target blank.","error");
      return;
    }
    const value=(key)=>{
      const raw=item.querySelector('[data-target-key="'+key+'"]')?.value;
      if(raw===undefined||raw==="")return null;
      const n=Number(raw);return Number.isFinite(n)&&n>=0?n:null;
    };
    const payload={
      p_contact_id:context.contact,
      p_nutrient_key:row.nutrient_key,
      p_minimum:value("minimum"),
      p_target:value("target"),
      p_maximum:value("maximum")
    };
    await mutateTarget(context,()=>client.rpc("admin_set_client_nutrient_target",payload),
      "Saving nutrient target...","Coach target saved.");
  }

  async function clearTarget(row,context){
    if(!currentContext(context,true)||pendingMutation)return;
    await mutateTarget(context,()=>client.rpc("admin_clear_client_nutrient_target",{
      p_contact_id:context.contact,
      p_nutrient_key:row.nutrient_key
    }),"Restoring program default...","Program default restored.");
  }

  async function mutateTarget(context,request,loadingMessage,successMessage){
    if(!currentContext(context,true)||pendingMutation)return;
    pendingMutation=context;
    el("client-nutrition-targets")?.querySelectorAll("input,button").forEach(node=>{node.disabled=true;});
    status(loadingMessage);
    try{
      const {error}=await request();
      if(!currentContext(context,true))return;
      if(error)throw error;
      await load(successMessage);
    }catch(error){
      if(!currentContext(context,true))return;
      clearReview();
      status(error.message||"The nutrient target could not be updated. Please reload the review.","error");
    }finally{
      if(pendingMutation===context)pendingMutation=null;
    }
  }

  function renderTrends(){
    const summary=el("client-nutrition-trends-summary");
    const root=el("client-nutrition-trends");
    if(!summary||!root)return;
    summary.replaceChildren();root.replaceChildren();

    const averages=trendData?.averages||{};
    const cards=[
      ["Logged Days",trendData?.logged_days,""],
      ["Calories",averages.energy_kcal,"kcal"],
      ["Protein",averages.protein_g,"g"],
      ["Fiber",averages.fiber_g,"g"]
    ];
    cards.forEach(([label,value,unit])=>{
      const card=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const b=document.createElement("strong");
      b.textContent=hasValue(value)?fmt(value,label==="Calories"?0:1)+(unit?" "+unit:""):"—";
      card.append(s,b);summary.append(card);
    });

    const series=Array.isArray(trendData?.series)?trendData.series:[];
    if(!series.length){
      root.innerHTML='<div class="drawer-empty">No logged nutrition days in this range.</div>';
      return;
    }
    series.forEach((point)=>{
      const row=document.createElement("div");row.className="client-nutrition-trend-row";
      const when=document.createElement("span");when.textContent=formatDateOnly(point.date);
      const totals=point.totals||{};
      const detail=document.createElement("strong");
      detail.textContent=[
        hasValue(totals.energy_kcal)?fmt(totals.energy_kcal,0)+" kcal":null,
        hasValue(totals.protein_g)?fmt(totals.protein_g,1)+"g protein":null,
        hasValue(totals.fiber_g)?fmt(totals.fiber_g,1)+"g fiber":null
      ].filter(Boolean).join(" · ")||"No numeric totals";
      row.append(when,detail);root.append(row);
    });
  }

  function render(){
    if(el("client-nutrition-date"))el("client-nutrition-date").value=date;
    renderSummary();
    renderItems();
    renderTargets();
    renderTrends();
  }

  function clearReview(){
    loadedContext=null;
    pendingMutation=null;
    data={items:[],totals:{}};
    targetRows=[];
    trendData={days:trendDays,logged_days:0,series:[],averages:{}};
    el("client-nutrition-review-summary")?.replaceChildren();
    el("client-nutrition-review-items")?.replaceChildren();
    el("client-nutrition-targets")?.replaceChildren();
    el("client-nutrition-target-access")?.replaceChildren();
    el("client-nutrition-trends-summary")?.replaceChildren();
    el("client-nutrition-trends")?.replaceChildren();
    el("client-nutrition-review-panel")?.setAttribute("aria-busy","false");
    if(el("client-nutrition-date"))el("client-nutrition-date").value=date;
    status("");
  }

  function closeReview(){
    requestSequence++;
    open=false;
    clearReview();
    el("client-nutrition-review-panel")?.classList.add("hidden");
    const button=el("client-nutrition-review-toggle");
    if(button){button.textContent="Review Nutrition";button.setAttribute("aria-expanded","false");}
  }

  function updateVisibility(){
    const allowed=canReview();
    if(!allowed)closeReview();
    el("client-nutrition-review-section")?.classList.toggle("hidden",!allowed);
    if(el("client-nutrition-review-toggle"))el("client-nutrition-review-toggle").disabled=!allowed;
  }

  async function load(successMessage="Nutrition review ready."){
    if(!canReview()||!open)return;
    const context={sequence:++requestSequence,contact:contactId,date,days:trendDays};
    clearReview();
    el("client-nutrition-review-panel")?.setAttribute("aria-busy","true");
    status("Loading client nutrition...");
    try{
      // One review snapshot: no partial private result is rendered before all
      // three authorized reads succeed for the same client/date/range.
      const read=async(request)=>{
        const {data:result,error}=await request();
        if(error)throw error;
        return result;
      };
      const [dayResult,targetsResult,trendsResult]=await Promise.all([
        read(()=>client.rpc("admin_get_client_nutrition_day",{p_contact_id:context.contact,p_log_date:context.date})),
        read(()=>client.rpc("admin_get_client_nutrition_targets",{p_contact_id:context.contact})),
        read(()=>client.rpc("admin_get_client_nutrition_trends",{p_contact_id:context.contact,p_days:context.days,p_end_date:context.date}))
      ]);
      if(!currentContext(context))return;
      if(!dayResult||!Array.isArray(targetsResult)||!trendsResult||!Array.isArray(trendsResult.series)){
        throw Error("The nutrition review response was incomplete. Please reload the review.");
      }
      data=dayResult;
      targetRows=targetsResult;
      trendData=trendsResult;
      loadedContext=context;
      render();
      status(successMessage,"success");
    }catch(error){
      if(!currentContext(context))return;
      clearReview();
      status(error.message||"Nutrition review could not be loaded. Please try again.","error");
    }finally{
      if(currentContext(context))el("client-nutrition-review-panel")?.setAttribute("aria-busy","false");
    }
  }

  async function toggle(){
    if(!canReview()){updateVisibility();return;}
    if(open){closeReview();return;}
    open=true;
    el("client-nutrition-review-panel")?.classList.remove("hidden");
    const button=el("client-nutrition-review-toggle");
    if(button){button.textContent="Hide Nutrition Review";button.setAttribute("aria-expanded","true");}
    await load();
  }

  function selectDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||localDateIso(new Date(value+"T12:00:00"))!==value){
      if(el("client-nutrition-date"))el("client-nutrition-date").value=date;
      return;
    }
    date=value;
    void load();
  }

  function shift(days){
    const d=new Date(date+"T12:00:00");
    d.setDate(d.getDate()+days);
    selectDate(localDateIso(d));
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    contactId=event.detail?.contactId||null;
    date=localDateIso();
    closeReview();
    updateVisibility();
  });

  document.addEventListener("ra:contact-closed",()=>{
    contactId=null;
    date=localDateIso();
    closeReview();
    updateVisibility();
  });

  document.addEventListener("ra:permissions-refresh",()=>{
    permissionsRefreshing=true;
    updateVisibility();
  });
  document.addEventListener("ra:permissions-loaded",()=>{
    permissionsRefreshing=false;
    updateVisibility();
  });

  el("client-nutrition-review-toggle")?.addEventListener("click",toggle);
  el("client-nutrition-prev")?.addEventListener("click",()=>shift(-1));
  el("client-nutrition-next")?.addEventListener("click",()=>shift(1));
  el("client-nutrition-today")?.addEventListener("click",()=>selectDate(localDateIso()));
  el("client-nutrition-date")?.addEventListener("change",(event)=>selectDate(event.target.value));
  document.querySelectorAll("[data-nutrition-days]").forEach((button)=>button.addEventListener("click",()=>{
    trendDays=Number(button.dataset.nutritionDays)||7;
    document.querySelectorAll("[data-nutrition-days]").forEach((b)=>b.classList.toggle("active",b===button));
    void load();
  }));
  updateVisibility();
})();
