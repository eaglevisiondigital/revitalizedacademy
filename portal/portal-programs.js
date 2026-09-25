(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  const root=document.getElementById("program-catalog-list");
  const summary=document.getElementById("program-catalog-summary");
  if(!portal||!root||!summary)return;
  const client=portal.authClient;

  const describe=(row)=>{
    const code=row.program_code;
    if(code==="holistic-foundations")return "6-month membership for individuals or families who want education, community, tools and self-paced support.";
    if(code==="vitality-accelerator-cohort")return "Focused 40-day group coaching experience for individuals or couples.";
    if(code==="vitality-accelerator")return "Focused 40-day private plus group coaching experience for individuals or couples.";
    if(code==="total-wellness-6")return "High-touch six-month private coaching with an evolving Longevity Lifestyle plan.";
    if(code==="total-wellness-12")return "Highest-touch twelve-month private coaching with Justyn & Elle and an evolving 12-driver plan.";
    return row.program_type ? portal.titleCase(row.program_type)+" program" : "ReVitalized program";
  };

  const price=(row)=>{
    const p=row.pricing||{};
    if(Number.isFinite(p.weekly_cents)||Number.isFinite(p.monthly_cents)){
      const parts=[];
      if(Number.isFinite(p.weekly_cents))parts.push("$"+(p.weekly_cents/100).toLocaleString("en-US",{maximumFractionDigits:2})+"/week");
      if(Number.isFinite(p.monthly_cents))parts.push("$"+(p.monthly_cents/100).toLocaleString("en-US",{maximumFractionDigits:2})+"/month");
      return [parts.join(" or "),"recurring"];
    }
    if(Number.isFinite(p.one_time_cents))return ["$"+(p.one_time_cents/100).toLocaleString("en-US",{maximumFractionDigits:0}),"one time"];
    return ["Personalized investment","discussed with coach"];
  };

  const length=(row)=>{
    if(row.metadata&&row.metadata.duration_days)return row.metadata.duration_days+" days";
    if(row.default_commitment_months)return row.default_commitment_months+" months";
    return "Flexible";
  };

  function card(row){
    const article=document.createElement("article");
    article.className="program-catalog-card"+(row.program_code==="total-wellness-12"?" featured":"");
    const [amount,note]=price(row);
    const top=document.createElement("div");top.className="program-catalog-card-top";
    const copy=document.createElement("div");copy.className="program-catalog-card-copy";
    const type=document.createElement("small");type.textContent=portal.titleCase(row.program_type||"program");
    const name=document.createElement("strong");name.textContent=row.name;
    const desc=document.createElement("p");desc.textContent=describe(row);
    copy.append(type,name,desc);
    const status=document.createElement("span");status.className="program-catalog-status";status.textContent=row.active?"Active":"Inactive";
    top.append(copy,status);

    const pricing=document.createElement("div");pricing.className="program-catalog-price";
    const a=document.createElement("strong");a.textContent=amount;
    const n=document.createElement("span");n.textContent=note;
    pricing.append(a,n);

    const meta=document.createElement("div");meta.className="program-catalog-meta";
    [length(row), row.program_type==="membership"?"Membership":row.program_type==="cohort"?"Group coaching":"Coaching"].forEach(v=>{
      const chip=document.createElement("span");chip.className="program-catalog-chip";chip.textContent=v;meta.append(chip);
    });
    if(row.metadata&&row.metadata.family_profiles){
      const chip=document.createElement("span");chip.className="program-catalog-chip";chip.textContent="Up to "+row.metadata.family_profiles+" profiles";meta.append(chip);
    }
    if(row.program_code==="vitality-accelerator"||row.program_code==="vitality-accelerator-cohort"){
      const chip=document.createElement("span");chip.className="program-catalog-chip";chip.textContent="Up to 2 people";meta.append(chip);
    }

    const footer=document.createElement("div");footer.className="program-catalog-footer";
    const code=document.createElement("span");code.className="program-catalog-code";code.textContent=row.program_code;
    footer.append(code);
    article.append(top,pricing,meta,footer);
    return article;
  }

  async function load(){
    const {data,error}=await client.from("program_catalog").select("program_code,name,program_type,default_commitment_months,pricing,active,metadata").order("created_at",{ascending:true});
    if(error){root.innerHTML='<div class="empty-state">Program catalog could not be loaded. '+error.message+'</div>';return;}
    const rows=(data||[]).filter(r=>r.active);
    const memberships=rows.filter(r=>r.program_type==="membership").length;
    const coaching=rows.filter(r=>r.program_type==="coaching").length;
    const cohorts=rows.filter(r=>r.program_type==="cohort").length;
    summary.replaceChildren();
    [["Active programs",rows.length],["Memberships",memberships],["Private coaching",coaching],["Cohorts",cohorts]].forEach(([label,value])=>{
      const stat=document.createElement("div");stat.className="program-catalog-stat";
      const l=document.createElement("span");l.textContent=label;
      const v=document.createElement("strong");v.textContent=String(value);
      stat.append(l,v);summary.append(stat);
    });
    root.replaceChildren();
    if(!rows.length){root.innerHTML='<div class="empty-state">No active programs are currently configured.</div>';return;}
    rows.forEach(r=>root.append(card(r)));
  }
  load();
})();