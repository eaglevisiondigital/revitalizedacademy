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
  const contentNew=document.getElementById("program-content-new");
  const contentModal=document.getElementById("program-content-modal");
  const contentForm=document.getElementById("program-content-form");
  const contentType=document.getElementById("program-content-type");
  const contentTitle=document.getElementById("program-content-title-input");
  const contentDescription=document.getElementById("program-content-description");
  const dynamicFields=document.getElementById("program-content-dynamic-fields");
  const formStatus=document.getElementById("program-content-form-status");
  const contentSources={
    courses:{table:"learning_courses",label:"Courses",select:"id,title,description,status,estimated_minutes,version",order:"title"},
    challenges:{table:"wellness_challenges",label:"Challenges",select:"id,title,description,status,scope,starts_on,ends_on",order:"title"},
    "meal-plans":{table:"meal_plan_templates",label:"Meal Plans",select:"id,title,description,status,days_count",order:"title"},
    recipes:{table:"recipes",label:"Recipes",select:"id,title,status,meal_type,prep_minutes,cook_minutes",order:"title"},
    fitness:{table:"fitness_programs",label:"Fitness Programs",select:"id,title,description,status,difficulty,environment,weeks",order:"title"},
    workouts:{table:"workout_templates",label:"Workouts",select:"id,title,description,status,category,difficulty,environment,duration_minutes",order:"title"}
  };
  let contentCache={};
  let activeContent="courses";
  let nutritionMethodologies=[];
  let fitnessMethodologies=[];

  const slugify=(value)=>String(value||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100);

  const contentDetail=(key,row)=>{
    if(key==="courses")return [row.version?"Version "+row.version:null,row.estimated_minutes?row.estimated_minutes+" min":null].filter(Boolean).join(" · ")||"Course content";
    if(key==="challenges")return [row.scope?portal.titleCase(row.scope):null,row.starts_on&&row.ends_on?row.starts_on+" to "+row.ends_on:null].filter(Boolean).join(" · ")||"Wellness challenge";
    if(key==="meal-plans")return row.days_count?row.days_count+" day plan":"Meal plan template";
    if(key==="recipes")return [row.meal_type?portal.titleCase(row.meal_type):null,row.prep_minutes?row.prep_minutes+" min prep":null,row.cook_minutes?row.cook_minutes+" min cook":null].filter(Boolean).join(" · ")||"Recipe";
    if(key==="fitness")return [row.difficulty?portal.titleCase(row.difficulty):null,row.environment?portal.titleCase(row.environment):null,row.weeks?row.weeks+" weeks":null].filter(Boolean).join(" · ")||"Fitness program";
    if(key==="workouts")return [row.category?portal.titleCase(row.category):null,row.difficulty?portal.titleCase(row.difficulty):null,row.environment?portal.titleCase(row.environment):null,row.duration_minutes?row.duration_minutes+" min":null].filter(Boolean).join(" · ")||"Workout";
    return "";
  };

  function methodologyOptions(rows){
    if(!rows.length)return '<option value="">No methodology configured</option>';
    return rows.map(row=>'<option value="'+row.id+'">'+String(row.name||"Methodology").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")+'</option>').join("");
  }

  function renderDynamicFields(){
    if(!dynamicFields||!contentType)return;
    const type=contentType.value;
    if(type==="courses"){
      dynamicFields.innerHTML='<label><span>Estimated minutes</span><input id="content-estimated-minutes" type="number" min="0" step="1"></label><label><span>Version</span><input id="content-version" type="text" value="1.0" maxlength="30"></label>';
    }else if(type==="challenges"){
      dynamicFields.innerHTML='<label><span>Scope</span><select id="content-scope"><option value="individual">Individual</option><option value="household">Household</option><option value="both">Individual + Household</option></select></label><label><span>Goal type</span><select id="content-goal-type"><option value="custom">Custom</option><option value="metric">Metric</option></select></label><label><span>Starts on</span><input id="content-starts-on" type="date" required></label><label><span>Ends on</span><input id="content-ends-on" type="date" required></label><label><span>Target metric key</span><input id="content-target-key" type="text" maxlength="80" placeholder="steps, water_oz, workouts..."></label><label><span>Target value</span><input id="content-target-value" type="number" min="0" step="0.01"></label><label><span>Unit</span><input id="content-unit" type="text" maxlength="40"></label><label><span>Points available</span><input id="content-points" type="number" min="0" step="1" value="100"></label>';
    }else if(type==="meal-plans"){
      dynamicFields.innerHTML='<label class="wide"><span>Nutrition methodology</span><select id="content-methodology" required>'+methodologyOptions(nutritionMethodologies)+'</select></label><label><span>Days in plan</span><input id="content-days" type="number" min="1" max="90" step="1" value="7"></label>';
    }else if(type==="recipes"){
      dynamicFields.innerHTML='<label class="wide"><span>Nutrition methodology</span><select id="content-methodology" required>'+methodologyOptions(nutritionMethodologies)+'</select></label><label><span>Meal type</span><select id="content-meal-type"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option><option value="beverage">Beverage</option><option value="other">Other</option></select></label><label><span>Servings</span><input id="content-servings" type="number" min="0.1" step="0.1"></label><label><span>Prep minutes</span><input id="content-prep" type="number" min="0" step="1"></label><label><span>Cook minutes</span><input id="content-cook" type="number" min="0" step="1"></label><label class="wide"><span>Instructions</span><textarea id="content-instructions" rows="5"></textarea></label>';
    }else if(type==="fitness"){
      dynamicFields.innerHTML='<label class="wide"><span>Fitness methodology</span><select id="content-methodology" required>'+methodologyOptions(fitnessMethodologies)+'</select></label><label><span>Difficulty</span><select id="content-difficulty"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label><span>Environment</span><select id="content-environment"><option value="either">Home or Gym</option><option value="home">Home</option><option value="gym">Gym</option></select></label><label><span>Weeks</span><input id="content-weeks" type="number" min="1" step="1"></label>';
    }else{
      dynamicFields.innerHTML='<label class="wide"><span>Fitness methodology</span><select id="content-methodology" required>'+methodologyOptions(fitnessMethodologies)+'</select></label><label><span>Category</span><input id="content-category" type="text" maxlength="80" placeholder="Strength, Mobility, HIIT..."></label><label><span>Difficulty</span><select id="content-difficulty"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label><span>Environment</span><select id="content-environment"><option value="either">Home or Gym</option><option value="home">Home</option><option value="gym">Gym</option></select></label><label><span>Duration minutes</span><input id="content-duration" type="number" min="1" step="1"></label>';
    }
  }

  function openContentModal(){
    if(!contentModal)return;
    if(contentType)contentType.value=activeContent;
    if(contentTitle)contentTitle.value="";
    if(contentDescription)contentDescription.value="";
    renderDynamicFields();
    if(formStatus)portal.showStatus(formStatus,"");
    contentModal.classList.remove("hidden");
    contentModal.setAttribute("aria-hidden","false");
    contentTitle?.focus();
  }

  function closeContentModal(){
    if(!contentModal)return;
    contentModal.classList.add("hidden");
    contentModal.setAttribute("aria-hidden","true");
    contentForm?.reset();
    if(contentType)contentType.value=activeContent;
    renderDynamicFields();
    if(formStatus)portal.showStatus(formStatus,"");
  }

  async function updateContentStatus(key,row,nextStatus){
    const source=contentSources[key];
    const payload={status:nextStatus,updated_at:new Date().toISOString()};
    if(nextStatus==="published")payload.published_at=new Date().toISOString();
    const {error}=await client.from(source.table).update(payload).eq("id",row.id);
    if(error){window.alert(error.message);return;}
    await loadContent();
  }

  function renderContent(){
    if(!contentList)return;
    const rows=contentCache[activeContent]||[];
    contentTabs.forEach(b=>b.classList.toggle("active",b.dataset.programContent===activeContent));
    contentList.replaceChildren();
    if(!rows.length){
      const empty=document.createElement("div");
      empty.className="program-content-empty";
      empty.textContent="No "+contentSources[activeContent].label.toLowerCase()+" have been created yet. Use New Content to create the first draft for this area.";
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
      const actions=document.createElement("div");actions.className="program-content-row-actions";
      const statusValue=String(row.status||"draft").toLowerCase();
      if(statusValue!=="published"&&statusValue!=="active"){
        const publish=document.createElement("button");publish.type="button";publish.className="publish";publish.textContent="Publish";
        publish.addEventListener("click",()=>updateContentStatus(activeContent,row,"published"));
        actions.append(publish);
      }else{
        const archive=document.createElement("button");archive.type="button";archive.className="archive";archive.textContent="Archive";
        archive.addEventListener("click",()=>updateContentStatus(activeContent,row,"archived"));
        actions.append(archive);
      }
      item.append(copy,detail,status,actions);
      contentList.append(item);
    });
  }

  async function loadContent(){
    if(!contentSummary||!contentList)return;
    const entries=Object.entries(contentSources);
    const [contentResults,nutritionResult,fitnessResult]=await Promise.all([
      Promise.all(entries.map(async([key,source])=>{
        const {data,error}=await client.from(source.table).select(source.select).order(source.order,{ascending:true});
        return {key,data:data||[],error};
      })),
      client.from("nutrition_methodologies").select("id,name,status").order("name"),
      client.from("fitness_methodologies").select("id,name,status").order("name")
    ]);
    nutritionMethodologies=nutritionResult.error?[]:(nutritionResult.data||[]);
    fitnessMethodologies=fitnessResult.error?[]:(fitnessResult.data||[]);
    contentCache={};
    contentSummary.replaceChildren();
    contentResults.forEach(({key,data,error})=>{
      contentCache[key]=error?[]:data;
      const stat=document.createElement("div");stat.className="program-content-stat";
      const l=document.createElement("span");l.textContent=contentSources[key].label;
      const v=document.createElement("strong");v.textContent=error?"—":String(data.length);
      stat.append(l,v);contentSummary.append(stat);
    });
    renderContent();
    renderDynamicFields();
    syncContentManagementAccess();
  }

  async function createContent(event){
    event.preventDefault();
    if(!contentType||!contentTitle)return;
    const key=contentType.value;
    const source=contentSources[key];
    const title=contentTitle.value.trim();
    if(!title)return;
    const common={title,description:contentDescription?.value.trim()||null,status:"draft",created_by:portal.currentUserId()};
    let payload={...common};

    if(key==="courses"){
      payload.course_key=slugify(title);
      payload.version=document.getElementById("content-version")?.value.trim()||"1.0";
      const minutes=document.getElementById("content-estimated-minutes")?.value;
      payload.estimated_minutes=minutes?Number(minutes):null;
    }else if(key==="challenges"){
      payload.challenge_key=slugify(title);
      payload.scope=document.getElementById("content-scope")?.value||"individual";
      payload.goal_type=document.getElementById("content-goal-type")?.value||"custom";
      payload.starts_on=document.getElementById("content-starts-on")?.value||null;
      payload.ends_on=document.getElementById("content-ends-on")?.value||null;
      payload.target_key=document.getElementById("content-target-key")?.value.trim()||null;
      const target=document.getElementById("content-target-value")?.value;
      payload.target_value=target?Number(target):null;
      payload.unit=document.getElementById("content-unit")?.value.trim()||null;
      payload.points_available=Number(document.getElementById("content-points")?.value||100);
      payload.aggregation="sum";
      if(!payload.starts_on||!payload.ends_on){
        portal.showStatus(formStatus,"Choose a start and end date.","error");return;
      }
      if(payload.goal_type==="metric"&&!payload.target_key){
        portal.showStatus(formStatus,"Metric challenges need a target metric key.","error");return;
      }
    }else if(key==="meal-plans"){
      payload.methodology_id=document.getElementById("content-methodology")?.value||null;
      payload.days_count=Number(document.getElementById("content-days")?.value||7);
    }else if(key==="recipes"){
      payload.methodology_id=document.getElementById("content-methodology")?.value||null;
      payload.meal_type=document.getElementById("content-meal-type")?.value||"other";
      const servings=document.getElementById("content-servings")?.value;
      const prep=document.getElementById("content-prep")?.value;
      const cook=document.getElementById("content-cook")?.value;
      payload.servings=servings?Number(servings):null;
      payload.prep_minutes=prep?Number(prep):null;
      payload.cook_minutes=cook?Number(cook):null;
      payload.instructions=document.getElementById("content-instructions")?.value.trim()||null;
    }else if(key==="fitness"){
      payload.methodology_id=document.getElementById("content-methodology")?.value||null;
      payload.difficulty=document.getElementById("content-difficulty")?.value||"beginner";
      payload.environment=document.getElementById("content-environment")?.value||"either";
      const weeks=document.getElementById("content-weeks")?.value;
      payload.weeks=weeks?Number(weeks):null;
    }else{
      payload.methodology_id=document.getElementById("content-methodology")?.value||null;
      payload.category=document.getElementById("content-category")?.value.trim()||null;
      payload.difficulty=document.getElementById("content-difficulty")?.value||"beginner";
      payload.environment=document.getElementById("content-environment")?.value||"either";
      const duration=document.getElementById("content-duration")?.value;
      payload.duration_minutes=duration?Number(duration):null;
    }

    if(["meal-plans","recipes","fitness","workouts"].includes(key)&&!payload.methodology_id){
      portal.showStatus(formStatus,"A ReVitalized methodology must be configured before creating this content type.","error");return;
    }

    portal.showStatus(formStatus,"Saving draft...");
    const {error}=await client.from(source.table).insert(payload);
    if(error){portal.showStatus(formStatus,error.message,"error");return;}
    activeContent=key;
    closeContentModal();
    await loadContent();
  }

  function syncContentManagementAccess(){
    const role=portal.currentStaffRole?.();
    const canManage=["owner","admin","coach"].includes(String(role||"").toLowerCase());
    if(contentNew)contentNew.classList.toggle("hidden",!canManage);
    document.querySelectorAll(".program-content-row-actions").forEach(node=>node.classList.toggle("hidden",!canManage));
  }

  contentTabs.forEach(button=>button.addEventListener("click",()=>{
    activeContent=button.dataset.programContent;
    renderContent();
  }));
  contentNew?.addEventListener("click",openContentModal);
  contentType?.addEventListener("change",renderDynamicFields);
  contentForm?.addEventListener("submit",createContent);
  document.getElementById("program-content-close")?.addEventListener("click",closeContentModal);
  document.getElementById("program-content-cancel")?.addEventListener("click",closeContentModal);
  document.querySelectorAll("[data-program-content-close]").forEach(node=>node.addEventListener("click",closeContentModal));
  document.addEventListener("ra:dashboard-loaded",syncContentManagementAccess);

  load();
  loadContent();
})();