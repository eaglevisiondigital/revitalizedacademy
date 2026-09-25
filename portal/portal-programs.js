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
  const contentSummary=document.getElementById("program-content-summary");
  const contentList=document.getElementById("program-content-list");
  const contentTabs=[...document.querySelectorAll("[data-program-content]")];
  const contentSources={
    courses:{table:"learning_courses",label:"Courses",select:"id,title,description,status,estimated_minutes,version",order:"title"},
    challenges:{table:"wellness_challenges",label:"Challenges",select:"id,title,description,status,scope,starts_on,ends_on",order:"title"},
    "meal-plans":{table:"meal_plan_templates",label:"Meal Plans",select:"id,title,description,status,days_count",order:"title"},
    recipes:{table:"recipes",label:"Recipes",select:"id,title,status,meal_type,prep_minutes,cook_minutes",order:"title"},
    fitness:{table:"fitness_programs",label:"Fitness Programs",select:"id,title,description,status,difficulty,environment,weeks",order:"title"},
    workouts:{table:"workout_templates",label:"Workouts",select:"id,title,description,status,category,difficulty,duration_minutes",order:"title"}
  };
  let contentCache={};
  let activeContent="courses";

  const contentDetail=(key,row)=>{
    if(key==="courses")return [row.version?"Version "+row.version:null,row.estimated_minutes?row.estimated_minutes+" min":null].filter(Boolean).join(" · ")||"Course content";
    if(key==="challenges")return [row.scope?portal.titleCase(row.scope):null,row.starts_on&&row.ends_on?row.starts_on+" to "+row.ends_on:null].filter(Boolean).join(" · ")||"Wellness challenge";
    if(key==="meal-plans")return row.days_count?row.days_count+" day plan":"Meal plan template";
    if(key==="recipes")return [row.meal_type?portal.titleCase(row.meal_type):null,row.prep_minutes?row.prep_minutes+" min prep":null,row.cook_minutes?row.cook_minutes+" min cook":null].filter(Boolean).join(" · ")||"Recipe";
    if(key==="fitness")return [row.difficulty?portal.titleCase(row.difficulty):null,row.environment?portal.titleCase(row.environment):null,row.weeks?row.weeks+" weeks":null].filter(Boolean).join(" · ")||"Fitness program";
    if(key==="workouts")return [row.category?portal.titleCase(row.category):null,row.difficulty?portal.titleCase(row.difficulty):null,row.duration_minutes?row.duration_minutes+" min":null].filter(Boolean).join(" · ")||"Workout";
    return "";
  };

  function renderContent(){
    if(!contentList)return;
    const rows=contentCache[activeContent]||[];
    contentTabs.forEach(b=>b.classList.toggle("active",b.dataset.programContent===activeContent));
    contentList.replaceChildren();
    if(!rows.length){
      const empty=document.createElement("div");
      empty.className="program-content-empty";
      empty.textContent="No "+contentSources[activeContent].label.toLowerCase()+" have been created yet. The backend structure is ready for this content when ReVitalized is ready to publish it.";
      contentList.append(empty);
      return;
    }
    rows.forEach(row=>{
      const item=document.createElement("article");item.className="program-content-row";
      const copy=document.createElement("div");copy.className="program-content-copy";
      const name=document.createElement("strong");name.textContent=row.title||"Untitled";
      const desc=document.createElement("span");desc.textContent=row.description||contentDetail(activeContent,row);
      copy.append(name,desc);
      const detail=document.createElement("span");detail.textContent=contentDetail(activeContent,row);
      const status=document.createElement("span");status.className="program-content-status "+String(row.status||"draft").toLowerCase();status.textContent=portal.titleCase(row.status||"draft");
      const kind=document.createElement("span");kind.textContent=contentSources[activeContent].label;
      item.append(copy,detail,status,kind);
      contentList.append(item);
    });
  }

  async function loadContent(){
    if(!contentSummary||!contentList)return;
    const entries=Object.entries(contentSources);
    const results=await Promise.all(entries.map(async([key,source])=>{
      const {data,error}=await client.from(source.table).select(source.select).order(source.order,{ascending:true});
      return {key,data:data||[],error};
    }));
    contentCache={};
    contentSummary.replaceChildren();
    results.forEach(({key,data,error})=>{
      contentCache[key]=error?[]:data;
      const stat=document.createElement("div");stat.className="program-content-stat";
      const l=document.createElement("span");l.textContent=contentSources[key].label;
      const v=document.createElement("strong");v.textContent=error?"—":String(data.length);
      stat.append(l,v);contentSummary.append(stat);
    });
    renderContent();
  }

  contentTabs.forEach(button=>button.addEventListener("click",()=>{
    activeContent=button.dataset.programContent;
    renderContent();
  }));

  load();
  loadContent();
})();