(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const el = (id) => document.getElementById(id);

  let contact = null;
  let access = null;
  let membership = null;
  let summary = null;
  let activeMealPlan = null;
  let activeFitnessPlan = null;
  let mealTemplates = [];
  let fitnessPrograms = [];
  let mealItems = [];
  let workoutItems = [];
  let groceryRows = [];
  let nutritionMethodology = null;
  let fitnessMethodology = null;

  function setStatus(id, message, type = "") {
    const target = el(id);
    if (!target) return;
    target.textContent = message || "";
    target.className = "form-status" + (type ? " " + type : "");
  }

  function title(value) {
    return portal.titleCase(value || "");
  }

  function closeModal() {
    el("wellness-modal").classList.add("hidden");
    el("wellness-modal").setAttribute("aria-hidden", "true");
  }

  function todayIso() {
    return new Date().toISOString().slice(0,10);
  }

  function empty(message) {
    const div = document.createElement("div");
    div.className = "wellness-empty";
    div.textContent = message;
    return div;
  }

  async function loadWellness(contactId, contactRecord = contact) {
    contact = contactRecord || contact;
    if (!contactId) return;

    const [accessResult, summaryResult, nutritionMethodResult, fitnessMethodResult] = await Promise.all([
      client.from("client_access").select("*").eq("contact_id", contactId).maybeSingle(),
      client.from("admin_client_wellness_summary").select("*").eq("contact_id", contactId).maybeSingle(),
      client.from("nutrition_methodologies").select("*").eq("methodology_key","revitalized-nutrition").maybeSingle(),
      client.from("fitness_methodologies").select("*").eq("methodology_key","revitalized-fitness").maybeSingle()
    ]);

    const failed = [accessResult,summaryResult,nutritionMethodResult,fitnessMethodResult].find((r)=>r.error);
    if (failed?.error) throw failed.error;

    access = accessResult.data || null;
    summary = summaryResult.data || null;
    nutritionMethodology = nutritionMethodResult.data || null;
    fitnessMethodology = fitnessMethodResult.data || null;
    membership = null;
    activeMealPlan = null;
    activeFitnessPlan = null;
    mealTemplates = [];
    fitnessPrograms = [];
    mealItems = [];
    workoutItems = [];
    groceryRows = [];

    if (!access?.membership_id) {
      renderSummary();
      return;
    }

    const [
      membershipResult,
      mealPlanResult,
      fitnessPlanResult,
      mealTemplateResult,
      fitnessProgramResult
    ] = await Promise.all([
      client.from("client_memberships").select("*").eq("id", access.membership_id).maybeSingle(),
      client.from("client_meal_plans").select("*").eq("contact_id", contactId).eq("status","active").order("starts_on",{ascending:false}).limit(1).maybeSingle(),
      client.from("client_fitness_plans").select("*").eq("contact_id", contactId).eq("status","active").order("starts_on",{ascending:false}).limit(1).maybeSingle(),
      client.from("meal_plan_templates").select("id,title,days_count,status,phase_id").eq("status","published").order("title"),
      client.from("fitness_programs").select("id,title,difficulty,environment,weeks,status").eq("status","published").order("title")
    ]);

    const failed2=[membershipResult,mealPlanResult,fitnessPlanResult,mealTemplateResult,fitnessProgramResult].find((r)=>r.error);
    if(failed2?.error) throw failed2.error;

    membership = membershipResult.data || null;
    activeMealPlan = mealPlanResult.data || null;
    activeFitnessPlan = fitnessPlanResult.data || null;
    mealTemplates = mealTemplateResult.data || [];
    fitnessPrograms = fitnessProgramResult.data || [];

    const q=[];
    q.push(activeMealPlan
      ? client.from("client_meal_plan_items").select("*,recipes:recipe_id(title)").eq("meal_plan_id",activeMealPlan.id).order("scheduled_date").order("sort_order")
      : Promise.resolve({data:[],error:null})
    );
    q.push(activeMealPlan
      ? client.from("client_grocery_lists").select("id,title,status").eq("meal_plan_id",activeMealPlan.id).eq("status","active").order("created_at",{ascending:false}).limit(1).maybeSingle()
      : Promise.resolve({data:null,error:null})
    );
    q.push(activeFitnessPlan
      ? client.from("client_workout_assignments").select("*,workout_templates:workout_id(title,duration_minutes,environment)").eq("fitness_plan_id",activeFitnessPlan.id).order("scheduled_date")
      : Promise.resolve({data:[],error:null})
    );

    const [mealItemResult,groceryListResult,workoutResult]=await Promise.all(q);
    const failed3=[mealItemResult,groceryListResult,workoutResult].find((r)=>r.error);
    if(failed3?.error) throw failed3.error;

    mealItems=mealItemResult.data||[];
    workoutItems=workoutResult.data||[];

    if(groceryListResult.data?.id){
      const {data,error}=await client.from("grocery_list_items").select("*").eq("grocery_list_id",groceryListResult.data.id).order("checked").order("sort_order");
      if(error) throw error;
      groceryRows=data||[];
    }

    renderSummary();
  }

  function renderSummary() {
    const section = el("client-wellness-section");
    if (!access || !membership) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");

    const hasAny = Boolean(activeMealPlan || activeFitnessPlan);
    el("client-wellness-chip").textContent = hasAny ? "Active" : "Not Assigned";
    el("client-meal-plan-name").textContent = activeMealPlan?.title || "Not assigned";
    el("client-fitness-plan-name").textContent = activeFitnessPlan?.title || "Not assigned";
    el("client-upcoming-meals").textContent = String(summary?.upcoming_meals ?? mealItems.filter((r)=>r.status==="planned").length);
    el("client-upcoming-workouts").textContent = String(summary?.upcoming_workouts ?? workoutItems.filter((r)=>r.status==="assigned").length);
    el("client-nutrition-adherence").textContent =
      summary?.nutrition_adherence_7d !== null && summary?.nutrition_adherence_7d !== undefined
        ? Math.round(Number(summary.nutrition_adherence_7d)) + "%"
        : "No data";
    el("client-grocery-status").textContent = groceryRows.length ? groceryRows.length + " items" : "Not generated";
    setStatus("client-wellness-status","");
  }

  function populateTemplateSelects() {
    const mealSelect=el("wellness-meal-template");
    mealSelect.replaceChildren();
    const mealBlank=document.createElement("option");
    mealBlank.value="";
    mealBlank.textContent=mealTemplates.length ? "Select a published meal plan" : "No published meal plans available";
    mealSelect.append(mealBlank);
    mealTemplates.forEach((row)=>{
      const opt=document.createElement("option");
      opt.value=row.id;
      opt.textContent=row.title+" · "+row.days_count+" day"+(row.days_count===1?"":"s");
      mealSelect.append(opt);
    });
    mealSelect.disabled=!mealTemplates.length;

    const fitnessSelect=el("wellness-fitness-program");
    fitnessSelect.replaceChildren();
    const fitBlank=document.createElement("option");
    fitBlank.value="";
    fitBlank.textContent=fitnessPrograms.length ? "Select a published fitness program" : "No published fitness programs available";
    fitnessSelect.append(fitBlank);
    fitnessPrograms.forEach((row)=>{
      const opt=document.createElement("option");
      opt.value=row.id;
      opt.textContent=[row.title,title(row.difficulty),title(row.environment)].filter(Boolean).join(" · ");
      fitnessSelect.append(opt);
    });
    fitnessSelect.disabled=!fitnessPrograms.length;
  }

  function renderMethodologyStates(){
    const n=el("wellness-nutrition-methodology-state");
    n.textContent=title(nutritionMethodology?.status||"draft");
    n.className="wellness-state"+(nutritionMethodology?.status==="published"?" published":"");

    const f=el("wellness-fitness-methodology-state");
    f.textContent=title(fitnessMethodology?.status||"draft");
    f.className="wellness-state"+(fitnessMethodology?.status==="published"?" published":"");
  }

  function renderCurrentPlans(){
    const meal=el("wellness-active-meal");
    meal.replaceChildren();
    if(activeMealPlan){
      const strong=document.createElement("strong");
      strong.textContent=activeMealPlan.title;
      const meta=document.createElement("span");
      meta.textContent="Started "+portal.formatDate(activeMealPlan.starts_on)+(activeMealPlan.ends_on?" · through "+portal.formatDate(activeMealPlan.ends_on):"");
      meal.append(strong,meta);
    }

    const fitness=el("wellness-active-fitness");
    fitness.replaceChildren();
    if(activeFitnessPlan){
      const strong=document.createElement("strong");
      strong.textContent=activeFitnessPlan.title;
      const meta=document.createElement("span");
      meta.textContent="Started "+portal.formatDate(activeFitnessPlan.starts_on);
      fitness.append(strong,meta);
    }
  }

  function renderLists(){
    const meals=el("wellness-meal-items");
    meals.replaceChildren();
    const upcomingMeals=mealItems.filter((row)=>row.scheduled_date>=todayIso()).slice(0,14);
    if(!upcomingMeals.length) meals.append(empty("No upcoming meal-plan items."));
    upcomingMeals.forEach((row)=>{
      const item=document.createElement("div");
      item.className="wellness-item";
      const top=document.createElement("div");
      top.className="wellness-item-top";
      const name=document.createElement("strong");
      name.textContent=row.recipes?.title||row.custom_title||"Planned meal";
      const slot=document.createElement("span");
      slot.textContent=title(row.meal_slot);
      top.append(name,slot);
      const meta=document.createElement("small");
      meta.textContent=portal.formatDate(row.scheduled_date)+" · "+title(row.status);
      item.append(top,meta);
      meals.append(item);
    });

    const workouts=el("wellness-workout-items");
    workouts.replaceChildren();
    const upcomingWorkouts=workoutItems.filter((row)=>row.scheduled_date>=todayIso()).slice(0,14);
    if(!upcomingWorkouts.length) workouts.append(empty("No upcoming workout assignments."));
    upcomingWorkouts.forEach((row)=>{
      const item=document.createElement("div");
      item.className="wellness-item";
      const top=document.createElement("div");
      top.className="wellness-item-top";
      const name=document.createElement("strong");
      name.textContent=row.workout_templates?.title||"Workout";
      const state=document.createElement("span");
      state.textContent=title(row.status);
      top.append(name,state);
      const meta=document.createElement("small");
      meta.textContent=[
        portal.formatDate(row.scheduled_date),
        row.workout_templates?.duration_minutes?row.workout_templates.duration_minutes+" min":"",
        title(row.workout_templates?.environment||"")
      ].filter(Boolean).join(" · ");
      item.append(top,meta);
      workouts.append(item);
    });
  }

  function renderModal(){
    renderMethodologyStates();
    populateTemplateSelects();
    renderCurrentPlans();
    renderLists();

    const today=todayIso();
    if(!el("wellness-meal-start").value) el("wellness-meal-start").value=today;
    if(!el("wellness-fitness-start").value) el("wellness-fitness-start").value=today;
    el("wellness-grocery-generate").disabled=!activeMealPlan;
    setStatus("wellness-meal-status","");
    setStatus("wellness-fitness-status","");
  }

  function openModal(){
    if(!membership)return;
    renderModal();
    el("wellness-modal").classList.remove("hidden");
    el("wellness-modal").setAttribute("aria-hidden","false");
  }

  async function refreshAll(){
    await loadWellness(contact.id,contact);
    renderModal();
    await portal.loadDashboard();
  }

  async function assignMealPlan(event){
    event.preventDefault();
    const templateId=el("wellness-meal-template").value;
    if(!templateId){
      setStatus("wellness-meal-status","Choose a published meal-plan template.","error");
      return;
    }

    setStatus("wellness-meal-status","Assigning meal plan...");
    const {data,error}=await client.rpc("assign_meal_plan_template",{
      p_contact_id:contact.id,
      p_template_id:templateId,
      p_starts_on:el("wellness-meal-start").value||todayIso(),
      p_title:el("wellness-meal-title").value.trim()||null,
      p_notes:el("wellness-meal-notes").value.trim()||null
    });
    if(error){
      setStatus("wellness-meal-status",error.message,"error");
      return;
    }

    setStatus("wellness-meal-status","Meal plan assigned.","success");
    await portal.logActivity(contact.id,"meal_plan_assigned","Meal plan assigned",null,{meal_plan_id:data});
    await refreshAll();
  }

  async function generateGrocery(){
    if(!activeMealPlan)return;
    setStatus("wellness-meal-status","Generating grocery list...");
    const {data,error}=await client.rpc("generate_grocery_list_for_meal_plan",{
      p_meal_plan_id:activeMealPlan.id,
      p_title:null
    });
    if(error){
      setStatus("wellness-meal-status",error.message,"error");
      return;
    }
    setStatus("wellness-meal-status","Grocery list generated.","success");
    await portal.logActivity(contact.id,"grocery_list_generated","Grocery list generated",activeMealPlan.title,{grocery_list_id:data});
    await refreshAll();
  }

  async function assignFitness(event){
    event.preventDefault();
    const programId=el("wellness-fitness-program").value;
    if(!programId){
      setStatus("wellness-fitness-status","Choose a published fitness program.","error");
      return;
    }

    setStatus("wellness-fitness-status","Assigning fitness program...");
    const {data,error}=await client.rpc("assign_fitness_program",{
      p_contact_id:contact.id,
      p_program_id:programId,
      p_starts_on:el("wellness-fitness-start").value||todayIso(),
      p_title:el("wellness-fitness-title").value.trim()||null,
      p_notes:el("wellness-fitness-notes").value.trim()||null
    });
    if(error){
      setStatus("wellness-fitness-status",error.message,"error");
      return;
    }

    setStatus("wellness-fitness-status","Fitness program assigned.","success");
    await portal.logActivity(contact.id,"fitness_program_assigned","Fitness program assigned",null,{fitness_plan_id:data});
    await refreshAll();
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    loadWellness(event.detail.contactId,event.detail.contact).catch((error)=>{
      console.error("Wellness workspace load failed",error);
      setStatus("client-wellness-status",error.message||"Wellness data could not be loaded.","error");
    });
  });

  document.addEventListener("ra:contact-closed",()=>{
    contact=null;access=null;membership=null;summary=null;activeMealPlan=null;activeFitnessPlan=null;
    mealTemplates=[];fitnessPrograms=[];mealItems=[];workoutItems=[];groceryRows=[];
    el("client-wellness-section").classList.add("hidden");
    closeModal();
  });

  el("client-manage-wellness").addEventListener("click",openModal);
  el("wellness-meal-form").addEventListener("submit",assignMealPlan);
  el("wellness-grocery-generate").addEventListener("click",generateGrocery);
  el("wellness-fitness-form").addEventListener("submit",assignFitness);
  document.querySelectorAll("[data-wellness-close]").forEach((node)=>node.addEventListener("click",closeModal));
  document.addEventListener("keydown",(event)=>{
    if(event.key==="Escape"&&!el("wellness-modal").classList.contains("hidden")) closeModal();
  });
})();