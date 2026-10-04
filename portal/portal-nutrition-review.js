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
  const localDateIso=(d=new Date())=>{
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const day=String(d.getDate()).padStart(2,"0");
    return y+"-"+m+"-"+day;
  };
  let date=localDateIso();
  let data={items:[],totals:{}};

  const title=(v)=>String(v||"").replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
  const fmt=(v,d=1)=>Number(v).toLocaleString(undefined,{maximumFractionDigits:d});
  const hasValue=(v)=>typeof v==="number"&&Number.isFinite(v);
  const canReview=()=>Boolean(contactId&&!permissionsRefreshing&&portal.hasPermission?.("health.private.view"));

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

  function render(){
    if(el("client-nutrition-date"))el("client-nutrition-date").value=date;
    renderSummary();
    renderItems();
  }

  function clearReview(){
    data={items:[],totals:{}};
    el("client-nutrition-review-summary")?.replaceChildren();
    el("client-nutrition-review-items")?.replaceChildren();
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

  async function load(){
    if(!canReview()||!open)return;
    const sequence=++requestSequence;
    const requestedContact=contactId;
    const requestedDate=date;
    const current=()=>sequence===requestSequence&&requestedContact===contactId&&requestedDate===date&&open&&canReview();
    clearReview();
    el("client-nutrition-review-panel")?.setAttribute("aria-busy","true");
    status("Loading client nutrition...");
    try{
      const {data:result,error}=await client.rpc("admin_get_client_nutrition_day",{
        p_contact_id:requestedContact,
        p_log_date:requestedDate
      });
      if(!current())return;
      if(error)throw error;
      data=result||{items:[],totals:{}};
      render();
      status("Nutrition review ready.","success");
    }catch(error){
      if(!current())return;
      clearReview();
      status(error.message||"Nutrition review could not be loaded. Please try again.","error");
    }finally{
      if(current())el("client-nutrition-review-panel")?.setAttribute("aria-busy","false");
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
  updateVisibility();
})();
