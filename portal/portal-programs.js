(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  const root=document.getElementById("program-catalog-list");
  const summary=document.getElementById("program-catalog-summary");
  if(!portal||!root||!summary)return;
  const client=portal.authClient;
  const canManagePrograms=()=>portal.hasPermission?.("learning.manage") ?? ["owner","admin","coach"].includes(String(portal.currentStaffRole?.()||"").toLowerCase());

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
      return [parts.join(" or "),"Recurring"];
    }
    if(Number.isFinite(p.one_time_cents))return ["$"+(p.one_time_cents/100).toLocaleString("en-US",{maximumFractionDigits:0}),"One Time"];
    return ["Personalized Investment","Discussed With Coach"];
  };

  const length=(row)=>{
    if(row.metadata&&row.metadata.duration_days)return row.metadata.duration_days+" Days";
    if(row.default_commitment_months)return row.default_commitment_months+" Months";
    return "Flexible";
  };

  function card(row){
    const article=document.createElement("article");
    article.className="program-catalog-card"+(row.program_code==="total-wellness-12"?" featured":"");
    const [amount,note]=price(row);
    const top=document.createElement("div");top.className="program-catalog-card-top";
    const copy=document.createElement("div");copy.className="program-catalog-card-copy";
    const name=document.createElement("strong");name.textContent=row.name;
    const desc=document.createElement("p");desc.textContent=describe(row);
    copy.append(name,desc);
    const status=document.createElement("span");status.className="program-catalog-status";status.textContent=row.active?"Active":"Inactive";
    top.append(copy,status);

    const pricing=document.createElement("div");pricing.className="program-catalog-price";
    const a=document.createElement("strong");a.textContent=amount;
    const n=document.createElement("span");n.textContent=note;
    pricing.append(a,n);

    const meta=document.createElement("div");meta.className="program-catalog-meta";
    [length(row), row.program_type==="membership"?"Membership":row.program_type==="cohort"?"Group Coaching":"Coaching"].forEach(v=>{
      const chip=document.createElement("span");chip.className="program-catalog-chip";chip.textContent=v;meta.append(chip);
    });
    if(row.metadata&&row.metadata.family_profiles){
      const chip=document.createElement("span");chip.className="program-catalog-chip";chip.textContent="Up To "+row.metadata.family_profiles+" Profiles";meta.append(chip);
    }
    if(row.program_code==="vitality-accelerator"||row.program_code==="vitality-accelerator-cohort"){
      const chip=document.createElement("span");chip.className="program-catalog-chip";chip.textContent="Up To 2 People";meta.append(chip);
    }

    article.append(top,pricing,meta);
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
  const accessRoot=document.getElementById("program-access-list");
  let programRows=[];
  let entitlementRows=[];
  let courseRows=[];
  let courseAccessRows=[];
  let resourceRows=[];
  let resourceAccessRows=[];
  let challengeRows=[];
  let challengeAccessRows=[];

  async function toggleProgramCourse(programCode,courseId,current){
    const canManage=canManagePrograms();
    if(!canManage)return;
    const existing=courseAccessRows.find(r=>r.program_code===programCode&&r.course_id===courseId);
    if(existing){
      const {error}=await client.from("program_course_access").update({active:!current}).eq("id",existing.id);
      if(error){window.alert(error.message);return;}
    }else{
      const {error}=await client.from("program_course_access").insert({program_code:programCode,course_id:courseId,access_level:"included",active:true});
      if(error){window.alert(error.message);return;}
    }
    await loadProgramAccess();
  }

  async function toggleProgramResource(programCode,resourceId,current){
    const canManage=canManagePrograms();
    if(!canManage)return;
    const existing=resourceAccessRows.find(r=>r.program_code===programCode&&r.resource_id===resourceId);
    if(existing){
      const {error}=await client.from("program_resource_access").update({active:!current}).eq("id",existing.id);
      if(error){window.alert(error.message);return;}
    }else{
      const {error}=await client.from("program_resource_access").insert({program_code:programCode,resource_id:resourceId,active:true});
      if(error){window.alert(error.message);return;}
    }
    await loadProgramAccess();
  }

  async function toggleProgramChallenge(programCode,challengeId,current){
    const canManage=canManagePrograms();
    if(!canManage)return;
    const existing=challengeAccessRows.find(r=>r.program_code===programCode&&r.challenge_id===challengeId);
    if(existing){
      const {error}=await client.from("program_challenge_access").update({active:!current}).eq("id",existing.id);
      if(error){window.alert(error.message);return;}
    }else{
      const {error}=await client.from("program_challenge_access").insert({program_code:programCode,challenge_id:challengeId,active:true});
      if(error){window.alert(error.message);return;}
    }
    await loadProgramAccess();
  }


  let benefitProgram=null;
  let benefitModal=null;

  function ensureBenefitModal(){
    if(benefitModal)return benefitModal;
    benefitModal=document.createElement("div");
    benefitModal.className="program-benefit-modal hidden";
    benefitModal.setAttribute("aria-hidden","true");
    benefitModal.innerHTML=
      '<div class="program-benefit-backdrop" data-benefit-close></div>'+
      '<section class="program-benefit-dialog" role="dialog" aria-modal="true" aria-labelledby="program-benefit-title">'+
        '<button class="program-benefit-close" type="button" aria-label="Close">×</button>'+
        '<p class="eyebrow">PROGRAM BENEFITS</p>'+
        '<h2 id="program-benefit-title">Manage Benefits</h2>'+
        '<p class="program-benefit-intro">Benefits control what members receive. Changes are applied to existing memberships automatically.</p>'+
        '<div id="program-benefit-existing" class="program-benefit-existing"></div>'+
        '<section class="program-benefit-add">'+
          '<div class="program-benefit-add-copy"><strong>Add Benefit</strong><span>Create a new entitlement for this program.</span></div>'+
          '<div class="program-benefit-form-grid">'+
            '<label><span>Benefit Key</span><input id="program-benefit-new-key" type="text" maxlength="80" placeholder="example_benefit"></label>'+
            '<label><span>Display Label</span><input id="program-benefit-new-label" type="text" maxlength="120" placeholder="Example Benefit"></label>'+
            '<label><span>Limit</span><input id="program-benefit-new-limit" type="number" min="0" step="1" placeholder="Optional"></label>'+
            '<label><span>Reset</span><select id="program-benefit-new-cadence"><option value="none">None</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label>'+
          '</div>'+
          '<div class="program-benefit-actions"><button id="program-benefit-add-button" class="primary" type="button">Add Benefit</button></div>'+
          '<p id="program-benefit-status" class="form-status" aria-live="polite"></p>'+
        '</section>'+
      '</section>';
    document.body.append(benefitModal);
    benefitModal.querySelector("[data-benefit-close]")?.addEventListener("click",closeBenefitModal);
    benefitModal.querySelector(".program-benefit-close")?.addEventListener("click",closeBenefitModal);
    benefitModal.querySelector("#program-benefit-add-button")?.addEventListener("click",addBenefit);
    return benefitModal;
  }

  function closeBenefitModal(){
    if(!benefitModal)return;
    benefitModal.classList.add("hidden");
    benefitModal.setAttribute("aria-hidden","true");
    benefitProgram=null;
  }

  function normalizeKey(value){
    return String(value||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,80);
  }

  function renderBenefitModal(){
    ensureBenefitModal();
    const existing=benefitModal.querySelector("#program-benefit-existing");
    const title=benefitModal.querySelector("#program-benefit-title");
    if(!benefitProgram||!existing||!title)return;
    title.textContent=benefitProgram.name+" Benefits";
    existing.replaceChildren();

    const rows=entitlementRows.filter(r=>r.program_code===benefitProgram.program_code);
    if(!rows.length){
      const empty=document.createElement("div");
      empty.className="program-benefit-empty";
      empty.textContent="No benefits have been configured for this program yet.";
      existing.append(empty);
      return;
    }

    rows.forEach(row=>{
      const item=document.createElement("article");item.className="program-benefit-row"+(row.active?"":" inactive");
      const key=document.createElement("div");key.className="program-benefit-key";
      const keyLabel=document.createElement("span");keyLabel.textContent="Benefit Key";
      const keyValue=document.createElement("strong");keyValue.textContent=row.entitlement_key;
      key.append(keyLabel,keyValue);

      const labelWrap=document.createElement("label");
      const labelCaption=document.createElement("span");labelCaption.textContent="Display Label";
      const labelInput=document.createElement("input");labelInput.type="text";labelInput.value=row.label||"";labelInput.maxLength=120;
      labelWrap.append(labelCaption,labelInput);

      const limitWrap=document.createElement("label");
      const limitCaption=document.createElement("span");limitCaption.textContent="Limit";
      const limitInput=document.createElement("input");limitInput.type="number";limitInput.min="0";limitInput.step="1";limitInput.value=row.limit_value??"";
      limitWrap.append(limitCaption,limitInput);

      const cadenceWrap=document.createElement("label");
      const cadenceCaption=document.createElement("span");cadenceCaption.textContent="Reset";
      const cadence=document.createElement("select");
      ["none","weekly","monthly","annual"].forEach(v=>{
        const o=document.createElement("option");o.value=v;o.textContent=portal.titleCase(v);o.selected=(row.reset_cadence||"none")===v;cadence.append(o);
      });
      cadenceWrap.append(cadenceCaption,cadence);

      const controls=document.createElement("div");controls.className="program-benefit-row-actions";
      const activeLabel=document.createElement("label");activeLabel.className="program-benefit-active";
      const active=document.createElement("input");active.type="checkbox";active.checked=Boolean(row.active);
      const activeText=document.createElement("span");activeText.textContent="Active";
      activeLabel.append(active,activeText);
      const save=document.createElement("button");save.type="button";save.className="primary";save.textContent="Save";
      save.addEventListener("click",async()=>{
        const nextLabel=labelInput.value.trim();
        if(!nextLabel){window.alert("Add a display label before saving.");return;}
        save.disabled=true;save.textContent="Saving";
        const rawLimit=limitInput.value.trim();
        const payload={
          label:nextLabel,
          limit_value:rawLimit===""?null:Number(rawLimit),
          reset_cadence:cadence.value,
          active:active.checked
        };
        const {error}=await client.from("program_entitlement_templates").update(payload).eq("id",row.id);
        save.disabled=false;save.textContent="Save";
        if(error){window.alert(error.message);return;}
        await loadProgramAccess();
        renderBenefitModal();
      });
      controls.append(activeLabel,save);

      item.append(key,labelWrap,limitWrap,cadenceWrap,controls);
      existing.append(item);
    });
  }

  function openBenefitModal(program){
    if(!canManagePrograms())return;
    benefitProgram=program;
    ensureBenefitModal();
    renderBenefitModal();
    benefitModal.classList.remove("hidden");
    benefitModal.setAttribute("aria-hidden","false");
  }

  async function addBenefit(){
    if(!benefitProgram||!canManagePrograms())return;
    const keyInput=benefitModal.querySelector("#program-benefit-new-key");
    const labelInput=benefitModal.querySelector("#program-benefit-new-label");
    const limitInput=benefitModal.querySelector("#program-benefit-new-limit");
    const cadence=benefitModal.querySelector("#program-benefit-new-cadence");
    const status=benefitModal.querySelector("#program-benefit-status");
    const label=labelInput.value.trim();
    const key=normalizeKey(keyInput.value||label);
    if(!key||!label){
      portal.showStatus(status,"Add a benefit key and display label.","error");
      return;
    }
    const exists=entitlementRows.some(r=>r.program_code===benefitProgram.program_code&&r.entitlement_key===key);
    if(exists){
      portal.showStatus(status,"That benefit key already exists for this program.","error");
      return;
    }
    portal.showStatus(status,"Adding benefit...");
    const rawLimit=limitInput.value.trim();
    const {error}=await client.from("program_entitlement_templates").insert({
      program_code:benefitProgram.program_code,
      entitlement_key:key,
      label,
      limit_value:rawLimit===""?null:Number(rawLimit),
      reset_cadence:cadence.value||"none",
      active:true,
      metadata:{}
    });
    if(error){portal.showStatus(status,error.message,"error");return;}
    keyInput.value="";labelInput.value="";limitInput.value="";cadence.value="none";
    portal.showStatus(status,"Benefit added.","success");
    await loadProgramAccess();
    renderBenefitModal();
  }

  function renderProgramAccess(){
    if(!accessRoot)return;
    accessRoot.replaceChildren();
    const canManage=canManagePrograms();
    programRows.filter(r=>r.active).forEach(program=>{
      const entitlements=entitlementRows.filter(r=>r.program_code===program.program_code&&r.active);
      const included=courseAccessRows.filter(r=>r.program_code===program.program_code&&r.active);
      const includedResources=resourceAccessRows.filter(r=>r.program_code===program.program_code&&r.active);
      const includedChallenges=challengeAccessRows.filter(r=>r.program_code===program.program_code&&r.active);
      const card=document.createElement("article");card.className="program-access-card";
      const head=document.createElement("div");head.className="program-access-card-head";
      const copy=document.createElement("div");
      const name=document.createElement("strong");name.textContent=program.name;
      const sub=document.createElement("span");sub.textContent=portal.titleCase(program.metadata?.support_model||program.program_type||"program");
      copy.append(name,sub);
      const count=document.createElement("span");count.className="program-access-count";count.textContent=included.length+" Course"+(included.length===1?"":"s")+" · "+includedResources.length+" Resource"+(includedResources.length===1?"":"s")+" · "+includedChallenges.length+" Challenge"+(includedChallenges.length===1?"":"s");
      head.append(copy,count);

      const sections=document.createElement("div");sections.className="program-access-sections";
      const benefitBlock=document.createElement("div");benefitBlock.className="program-access-block";
      const benefitHead=document.createElement("div");benefitHead.className="program-access-block-head";
      const bh=document.createElement("h3");bh.textContent="Included Benefits";
      benefitHead.append(bh);
      if(canManage){
        const manage=document.createElement("button");manage.type="button";manage.className="program-benefit-manage";manage.textContent="Manage Benefits";
        manage.addEventListener("click",()=>openBenefitModal(program));
        benefitHead.append(manage);
      }
      const benefitList=document.createElement("div");benefitList.className="program-access-chip-list";
      if(entitlements.length){
        entitlements.slice(0,6).forEach(row=>{
          const chip=document.createElement("span");chip.className="program-access-chip";
          chip.textContent=portal.titleCase(row.label)+(row.limit_value?" · "+row.limit_value:"");
          benefitList.append(chip);
        });
        if(entitlements.length>6){
          const more=document.createElement("span");
          more.className="program-access-chip more";
          more.textContent="+"+(entitlements.length-6)+" More Included";
          benefitList.append(more);
        }
      }else{
        const empty=document.createElement("span");empty.className="program-access-empty";empty.textContent="No entitlements configured.";benefitList.append(empty);
      }
      benefitBlock.append(benefitHead,benefitList);

      const courseBlock=document.createElement("div");courseBlock.className="program-access-block";
      const ch=document.createElement("h3");ch.textContent="Course access";
      const courses=document.createElement("div");courses.className="program-access-course-list";
      const published=courseRows.filter(r=>r.status==="published");
      if(!published.length){
        const empty=document.createElement("span");empty.className="program-access-empty";empty.textContent="No courses assigned yet. Publish a course, then add it here.";courses.append(empty);
      }else{
        published.forEach(course=>{
          const row=document.createElement("div");row.className="program-access-course-row";
          const cc=document.createElement("div");cc.className="program-access-course-copy";
          const title=document.createElement("strong");title.textContent=course.title;
          const meta=document.createElement("span");meta.textContent=course.version?"Version "+course.version:"Published course";
          cc.append(title,meta);
          const access=courseAccessRows.find(r=>r.program_code===program.program_code&&r.course_id===course.id);
          const active=Boolean(access?.active);
          const btn=document.createElement("button");btn.type="button";btn.classList.toggle("active",active);btn.textContent=active?"Included":"Add";
          btn.disabled=!canManage;
          btn.addEventListener("click",()=>toggleProgramCourse(program.program_code,course.id,active));
          row.append(cc,btn);courses.append(row);
        });
      }
      courseBlock.append(ch,courses);

      const resourceBlock=document.createElement("div");resourceBlock.className="program-access-block program-access-resources";
      const rh=document.createElement("h3");rh.textContent="Resource access";
      const resources=document.createElement("div");resources.className="program-access-course-list";
      const publishedResources=resourceRows.filter(r=>r.status==="published");
      if(!publishedResources.length){
        const empty=document.createElement("span");empty.className="program-access-empty";empty.textContent="No resources assigned yet. Publish a resource, then add it here.";resources.append(empty);
      }else{
        publishedResources.forEach(resource=>{
          const row=document.createElement("div");row.className="program-access-course-row";
          const rc=document.createElement("div");rc.className="program-access-course-copy";
          const title=document.createElement("strong");title.textContent=resource.title;
          const meta=document.createElement("span");meta.textContent=[portal.titleCase(resource.resource_type||"resource"),resource.category].filter(Boolean).join(" · ");
          rc.append(title,meta);
          const access=resourceAccessRows.find(r=>r.program_code===program.program_code&&r.resource_id===resource.id);
          const active=Boolean(access?.active);
          const btn=document.createElement("button");btn.type="button";btn.classList.toggle("active",active);btn.textContent=active?"Included":"Add";
          btn.disabled=!canManage;
          btn.addEventListener("click",()=>toggleProgramResource(program.program_code,resource.id,active));
          row.append(rc,btn);resources.append(row);
        });
      }
      resourceBlock.append(rh,resources);

      const challengeBlock=document.createElement("div");challengeBlock.className="program-access-block program-access-challenges";
      const wh=document.createElement("h3");wh.textContent="Challenge access";
      const challenges=document.createElement("div");challenges.className="program-access-course-list";
      const publishedChallenges=challengeRows.filter(r=>r.status==="published");
      if(!publishedChallenges.length){
        const empty=document.createElement("span");empty.className="program-access-empty";empty.textContent="No challenges assigned yet. Publish a challenge, then add it here.";challenges.append(empty);
      }else{
        publishedChallenges.forEach(challenge=>{
          const row=document.createElement("div");row.className="program-access-course-row";
          const cc=document.createElement("div");cc.className="program-access-course-copy";
          const title=document.createElement("strong");title.textContent=challenge.title;
          const meta=document.createElement("span");
          meta.textContent=[
            challenge.scope?portal.titleCase(challenge.scope):null,
            challenge.starts_on&&challenge.ends_on?challenge.starts_on+" to "+challenge.ends_on:null
          ].filter(Boolean).join(" · ")||"Published challenge";
          cc.append(title,meta);
          const access=challengeAccessRows.find(r=>r.program_code===program.program_code&&r.challenge_id===challenge.id);
          const active=Boolean(access?.active);
          const btn=document.createElement("button");btn.type="button";btn.classList.toggle("active",active);btn.textContent=active?"Included":"Add";
          btn.disabled=!canManage;
          btn.addEventListener("click",()=>toggleProgramChallenge(program.program_code,challenge.id,active));
          row.append(cc,btn);challenges.append(row);
        });
      }
      challengeBlock.append(wh,challenges);

      sections.append(benefitBlock,courseBlock,resourceBlock,challengeBlock);
      card.append(head,sections);
      accessRoot.append(card);
    });
  }

  async function loadProgramAccess(){
    if(!accessRoot)return;
    const [programs,entitlements,courses,access,resources,resourceAccess,challenges,challengeAccess]=await Promise.all([
      client.from("program_catalog").select("program_code,name,program_type,active,metadata").order("name"),
      client.from("program_entitlement_templates").select("id,program_code,entitlement_key,label,limit_value,reset_cadence,active,metadata").order("label"),
      client.from("learning_courses").select("id,title,version,status").order("title"),
      client.from("program_course_access").select("id,program_code,course_id,access_level,active"),
      client.from("resource_library").select("id,title,resource_type,category,status").order("title"),
      client.from("program_resource_access").select("id,program_code,resource_id,active"),
      client.from("wellness_challenges").select("id,title,scope,starts_on,ends_on,status").order("title"),
      client.from("program_challenge_access").select("id,program_code,challenge_id,active")
    ]);
    if(programs.error||entitlements.error||courses.error||access.error||resources.error||resourceAccess.error||challenges.error||challengeAccess.error){
      accessRoot.innerHTML='<div class="empty-state">Program access rules could not be loaded.</div>';
      return;
    }
    programRows=programs.data||[];
    entitlementRows=entitlements.data||[];
    courseRows=courses.data||[];
    courseAccessRows=access.data||[];
    resourceRows=resources.data||[];
    resourceAccessRows=resourceAccess.data||[];
    challengeRows=challenges.data||[];
    challengeAccessRows=challengeAccess.data||[];
    renderProgramAccess();
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
    workouts:{table:"workout_templates",label:"Workouts",select:"id,title,description,status,category,difficulty,environment,duration_minutes",order:"title"},
    resources:{table:"resource_library",label:"Resources",select:"id,title,description,status,resource_type,resource_url,category",order:"title"}
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
    if(key==="resources")return [row.resource_type?portal.titleCase(row.resource_type):null,row.category||null].filter(Boolean).join(" · ")||"Resource";
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
    }else if(type==="workouts"){
      dynamicFields.innerHTML='<label class="wide"><span>Fitness methodology</span><select id="content-methodology" required>'+methodologyOptions(fitnessMethodologies)+'</select></label><label><span>Category</span><input id="content-category" type="text" maxlength="80" placeholder="Strength, Mobility, HIIT..."></label><label><span>Difficulty</span><select id="content-difficulty"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label><span>Environment</span><select id="content-environment"><option value="either">Home or Gym</option><option value="home">Home</option><option value="gym">Gym</option></select></label><label><span>Duration minutes</span><input id="content-duration" type="number" min="1" step="1"></label>';
    }else{
      dynamicFields.innerHTML='<label><span>Resource type</span><select id="content-resource-type"><option value="pdf">PDF</option><option value="video">Video</option><option value="audio">Audio</option><option value="worksheet">Worksheet</option><option value="link">Link</option><option value="guide">Guide</option><option value="other">Other</option></select></label><label><span>Category</span><input id="content-resource-category" type="text" maxlength="80" placeholder="Getting Started, Nutrition, Coaching..."></label><label class="wide"><span>Resource URL</span><input id="content-resource-url" type="url" maxlength="1000" placeholder="https://..." required></label>';
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
      empty.textContent="No "+contentSources[activeContent].label.toLowerCase()+" yet. Use New Content to create the first draft.";
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
    }else if(key==="workouts"){
      payload.methodology_id=document.getElementById("content-methodology")?.value||null;
      payload.category=document.getElementById("content-category")?.value.trim()||null;
      payload.difficulty=document.getElementById("content-difficulty")?.value||"beginner";
      payload.environment=document.getElementById("content-environment")?.value||"either";
      const duration=document.getElementById("content-duration")?.value;
      payload.duration_minutes=duration?Number(duration):null;
    }else{
      payload.resource_key=slugify(title);
      payload.resource_type=document.getElementById("content-resource-type")?.value||"other";
      payload.category=document.getElementById("content-resource-category")?.value.trim()||null;
      payload.resource_url=document.getElementById("content-resource-url")?.value.trim()||"";
      payload.tags=[];
      if(!payload.resource_url){
        portal.showStatus(formStatus,"Add the resource URL before saving.","error");return;
      }
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
    const canManage=canManagePrograms();
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
  loadProgramAccess();
  loadContent();
})();