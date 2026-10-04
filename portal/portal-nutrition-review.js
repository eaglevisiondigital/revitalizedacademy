(()=>{
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal?.authClient)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let contactId=null;
  let open=false;
  let requestSequence=0;
  const localDateIso=(d=new Date())=>{
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const day=String(d.getDate()).padStart(2,"0");
    return y+"-"+m+"-"+day;
  };
  let date=localDateIso();
  let data={items:[],totals:{}};

  const title=(v)=>String(v||"").replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
  const fmt=(v,d=1)=>Number(v||0).toLocaleString(undefined,{maximumFractionDigits:d});

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
      b.textContent=value===undefined||value===null?"—":fmt(value,digits)+" "+unit;
      card.append(s,b);root.append(card);
    });
  }

  function renderItems(){
    const root=el("client-nutrition-review-items");
    if(!root)return;
    root.replaceChildren();
    const rows=data?.items||[];
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
          row.quantity?fmt(row.quantity,2)+" serving"+(Number(row.quantity)===1?"":"s"):null,
          row.nutrients?.energy_kcal!==undefined?fmt(row.nutrients.energy_kcal,0)+" kcal":null,
          row.nutrients?.protein_g!==undefined?fmt(row.nutrients.protein_g,1)+"g protein":null,
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

  async function load(){
    if(!contactId||!open)return;
    status("Loading client nutrition...");
    const {data:result,error}=await client.rpc("admin_get_client_nutrition_day",{
      p_contact_id:contactId,
      p_log_date:date
    });
    if(error){
      data={items:[],totals:{}};
      render();
      status(error.message,"error");
      return;
    }
    data=result||{items:[],totals:{}};
    render();
    status("Nutrition review ready.","success");
  }

  async function toggle(){
    open=!open;
    el("client-nutrition-review-panel")?.classList.toggle("hidden",!open);
    if(el("client-nutrition-review-toggle"))el("client-nutrition-review-toggle").textContent=open?"Hide Nutrition Review":"Review Nutrition";
    if(open)await load();
  }

  function shift(days){
    const d=new Date(date+"T12:00:00");
    d.setDate(d.getDate()+days);
    date=d.toISOString().slice(0,10);
    load();
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    contactId=event.detail.contactId;
    date=new Date().toISOString().slice(0,10);
    data={items:[],totals:{}};
    open=false;
    el("client-nutrition-review-panel")?.classList.add("hidden");
    if(el("client-nutrition-review-toggle"))el("client-nutrition-review-toggle").textContent="Review Nutrition";
  });

  document.addEventListener("ra:contact-closed",()=>{
    contactId=null;open=false;data={items:[],totals:{}};
    el("client-nutrition-review-panel")?.classList.add("hidden");
  });

  el("client-nutrition-review-toggle")?.addEventListener("click",toggle);
  el("client-nutrition-prev")?.addEventListener("click",()=>shift(-1));
  el("client-nutrition-next")?.addEventListener("click",()=>shift(1));
  el("client-nutrition-today")?.addEventListener("click",()=>{date=new Date().toISOString().slice(0,10);load();});
  el("client-nutrition-date")?.addEventListener("change",(event)=>{if(event.target.value){date=event.target.value;load();}});
})();