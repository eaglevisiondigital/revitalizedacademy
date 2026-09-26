(() => {
  "use strict";

  const SUPABASE_URL = "https://voalfpxiyznnqfcqcymd.supabase.co";
  const PUBLISHABLE_KEY = "sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd";
  const client = window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const el = (id) => document.getElementById(id);

  function showStatus(target, message, type = "") {
    target.textContent = message || "";
    target.className = "rm112-status" + (type ? " " + type : "");
  }

  function title(value) {
    return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function formatDate(value, withTime = false) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" });
  }

  function showOnly(view) {
    ["rm-auth","rm-dashboard","rm-denied"].forEach((id) => el(id).classList.add("hidden"));
    el(view).classList.remove("hidden");
  }

  function renderEntitlements(rows) {
    const list = el("rm-entitlements");
    list.replaceChildren();

    if (!rows.length) {
      list.innerHTML = '<div class="rm112-empty">Program access is still being prepared.</div>';
      return;
    }

    rows.forEach((row) => {
      const card = document.createElement("div");
      card.className = "rm112-entitlement";
      const mark = document.createElement("b");
      mark.textContent = "✓";
      const copy = document.createElement("div");
      const label = document.createElement("strong");
      label.textContent = row.label;
      const detail = document.createElement("span");
      detail.textContent = row.limit_value ? "Included limit: " + row.limit_value : "Included";
      copy.append(label, detail);
      card.append(mark, copy);
      list.append(card);
    });
  }

  function renderHousehold(rows, householdType, familyEnabled = false) {
    latestHouseholdRows = rows || [];
    familyHubEnabled = Boolean(familyEnabled);
    const list = el("rm-household");
    list.replaceChildren();
    el("rm-household-type").textContent = title(householdType || "individual");
    el("rm-family-add").classList.toggle("hidden",!familyHubEnabled);

    if (!rows.length) {
      list.innerHTML = '<div class="rm112-empty">Your household profile is being prepared.</div>';
      return;
    }

    rows.forEach((row) => {
      const person = document.createElement("div");
      person.className = "rm112-person";
      const copy = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = [row.first_name,row.last_name].filter(Boolean).join(" ") || "Household Member";
      const relation = document.createElement("span");
      relation.textContent = title(row.relationship_type) + (row.sex ? " · " + title(row.sex) : "");
      copy.append(name, relation);
      person.append(copy);

      if(familyHubEnabled && !row.is_primary){
        const edit=document.createElement("button");
        edit.type="button";
        edit.className="rm170-person-action";
        edit.textContent="Request Change";
        edit.addEventListener("click",()=>openFamilyRequest(row));
        person.append(edit);
      }

      list.append(person);
    });
  }

  function actionEmpty(target,message){
    target.innerHTML='<div class="rm170-list-empty">'+message+'</div>';
  }

  function renderDailyActions(row){
    const summary=el("rm-today-summary");
    const habits=Array.isArray(row?.habits)?row.habits:[];
    const meals=Array.isArray(row?.meals)?row.meals:[];
    const workouts=Array.isArray(row?.workouts)?row.workouts:[];
    const challenges=Array.isArray(row?.challenges)?row.challenges:[];
    const completedHabits=Number(row?.habits_completed_today||0);
    const habitCount=Number(row?.habit_count||0);

    summary.replaceChildren();
    [
      ["Habits",habitCount?completedHabits+" / "+habitCount:"0"],
      ["Meals",Number(row?.meal_count||0)],
      ["Workouts",Number(row?.workout_count||0)],
      ["Challenges",challenges.length]
    ].forEach(([label,value])=>{
      const card=document.createElement("div");card.className="rm170-summary-stat";
      const s=document.createElement("span");s.textContent=label;
      const b=document.createElement("strong");b.textContent=String(value);
      card.append(s,b);summary.append(card);
    });

    const possible=Math.max(habitCount,0)+meals.length+workouts.length;
    const complete=completedHabits+
      meals.filter(m=>m.status==="completed").length+
      workouts.filter(w=>w.status==="completed").length;
    el("rm-today-progress").textContent=possible?Math.round((complete/possible)*100)+"% Complete":"Ready";
    el("rm-today-habit-count").textContent=habitCount+" Today";
    el("rm-today-meal-count").textContent=meals.length+" Today";
    el("rm-today-workout-count").textContent=workouts.length+" Today";

    const habitList=el("rm-today-habits");habitList.replaceChildren();
    if(!habits.length)actionEmpty(habitList,"No habits are due today.");
    habits.forEach(h=>{
      const item=document.createElement("div");item.className="rm170-action"+(h.completed_today?" done":"");
      const copy=document.createElement("div");copy.className="rm170-action-copy";
      const name=document.createElement("strong");name.textContent=h.title||"Habit";
      const meta=document.createElement("span");
      meta.textContent=h.completed_today?"Completed today":[h.target?String(h.target):null,h.unit||null].filter(Boolean).join(" ")||title(h.frequency||"daily");
      copy.append(name,meta);
      const btn=document.createElement("button");btn.type="button";btn.className=h.completed_today?"":"primary";btn.disabled=Boolean(h.completed_today);btn.textContent=h.completed_today?"Done":"Check In";
      btn.addEventListener("click",()=>completeHabit(h));
      item.append(copy,btn);habitList.append(item);
    });

    const mealList=el("rm-today-meals");mealList.replaceChildren();
    if(!meals.length)actionEmpty(mealList,"No meals are scheduled today.");
    meals.forEach(m=>{
      const done=m.status==="completed";
      const item=document.createElement("div");item.className="rm170-action"+(done?" done":"");
      const copy=document.createElement("div");copy.className="rm170-action-copy";
      const name=document.createElement("strong");name.textContent=m.title||title(m.meal_slot||"Meal");
      const meta=document.createElement("span");meta.textContent=[title(m.meal_slot||""),m.prep_minutes?"Prep "+m.prep_minutes+" Min":null].filter(Boolean).join(" · ");
      copy.append(name,meta);
      const btn=document.createElement("button");btn.type="button";btn.className=done?"":"primary";btn.disabled=done;btn.textContent=done?"Done":"Complete";
      btn.addEventListener("click",()=>completeMeal(m));
      item.append(copy,btn);mealList.append(item);
    });

    const workoutList=el("rm-today-workouts");workoutList.replaceChildren();
    if(!workouts.length)actionEmpty(workoutList,"No workout is scheduled today.");
    workouts.forEach(w=>{
      const done=w.status==="completed";
      const item=document.createElement("div");item.className="rm170-action"+(done?" done":"");
      const copy=document.createElement("div");copy.className="rm170-action-copy";
      const name=document.createElement("strong");name.textContent=w.title||"Workout";
      const meta=document.createElement("span");meta.textContent=[w.duration_minutes?w.duration_minutes+" Min":null,w.category?title(w.category):null,w.difficulty?title(w.difficulty):null].filter(Boolean).join(" · ");
      copy.append(name,meta);
      const btn=document.createElement("button");btn.type="button";btn.className=done?"":"primary";btn.disabled=done;btn.textContent=done?"Done":"Complete";
      btn.addEventListener("click",()=>completeWorkout(w));
      item.append(copy,btn);workoutList.append(item);
    });

    const focus=el("rm-today-focus");focus.replaceChildren();
    if(challenges.length){
      const ch=challenges[0];
      const card=document.createElement("div");card.className="rm170-focus";
      const s=document.createElement("span");s.textContent="Current Challenge";
      const b=document.createElement("strong");b.textContent=(ch.title||"ReVitalized Challenge")+" · "+Number(ch.completion_percent||0)+"%";
      card.append(s,b);focus.append(card);
    }
    if(row?.continue_course){
      const course=row.continue_course;
      const card=document.createElement("div");card.className="rm170-focus";
      const s=document.createElement("span");s.textContent="Continue Learning";
      const b=document.createElement("strong");b.textContent=course.title||"Continue Your Course";
      card.append(s,b);focus.append(card);
    }
  }

  async function completeHabit(habit){
    showStatus(el("rm-today-status"),"Saving habit check-in...");
    const {error}=await client.rpc("check_in_my_habit",{
      p_habit_id:habit.habit_id,
      p_value:Number(habit.target||1),
      p_note:null,
      p_checkin_date:new Date().toISOString().slice(0,10)
    });
    if(error){showStatus(el("rm-today-status"),error.message,"error");return;}
    showStatus(el("rm-today-status"),"Habit completed.","success");
    await loadDashboard();
  }

  async function completeMeal(meal){
    showStatus(el("rm-today-status"),"Updating meal...");
    const {error}=await client.rpc("update_my_meal_item",{
      p_item_id:meal.meal_item_id,
      p_status:"completed",
      p_adherence_percent:100
    });
    if(error){showStatus(el("rm-today-status"),error.message,"error");return;}
    showStatus(el("rm-today-status"),"Meal completed.","success");
    await loadDashboard();
  }

  async function completeWorkout(workout){
    showStatus(el("rm-today-status"),"Updating workout...");
    const {error}=await client.rpc("update_my_workout_status",{
      p_assignment_id:workout.workout_assignment_id,
      p_status:"completed",
      p_note:null
    });
    if(error){showStatus(el("rm-today-status"),error.message,"error");return;}
    showStatus(el("rm-today-status"),"Workout completed.","success");
    await loadDashboard();
  }

  function renderWeeklySummary(row){
    const target=el("rm-weekly-summary");target.replaceChildren();
    if(!row){target.innerHTML='<div class="rm112-empty">Your weekly momentum will appear as you begin logging activity.</div>';return;}
    [
      ["Habit Check-Ins",row.habit_checkins||0],
      ["Active Habit Days",row.active_habit_days||0],
      ["Workouts Completed",row.workouts_completed||0],
      ["Meals Completed",row.meals_completed||0],
      ["Meal Adherence",row.meal_adherence===null||row.meal_adherence===undefined?"—":Math.round(Number(row.meal_adherence))+"%"],
      ["Progress Entries",row.progress_entries||0],
      ["Goals Completed",row.goals_completed||0],
      ["Challenge Points",row.challenge_points_earned||0]
    ].forEach(([label,value])=>{
      const item=document.createElement("div");item.className="rm170-week-stat";
      const s=document.createElement("span");s.textContent=label;
      const b=document.createElement("strong");b.textContent=String(value);
      item.append(s,b);target.append(item);
    });
  }

  function renderActivityTimeline(rows){
    const target=el("rm-activity-timeline");target.replaceChildren();
    if(!rows.length){target.innerHTML='<div class="rm112-empty">Your recent progress and achievements will appear here.</div>';return;}
    rows.slice(0,12).forEach(row=>{
      const item=document.createElement("div");item.className="rm170-activity";
      const icon=document.createElement("div");icon.className="rm170-activity-icon";
      const type=String(row.activity_type||"activity");
      icon.textContent=type.includes("goal")?"✓":type.includes("course")?"▶":type.includes("challenge")?"★":type.includes("progress")?"↗":"•";
      const copy=document.createElement("div");
      const h=document.createElement("strong");h.textContent=row.title||title(type);
      const meta=document.createElement("span");meta.textContent=[row.detail,formatDate(row.occurred_at,true)].filter(Boolean).join(" · ");
      copy.append(h,meta);item.append(icon,copy);target.append(item);
    });
  }

  function renderFamilyRequests(rows){
    const target=el("rm-family-requests");target.replaceChildren();
    if(!familyHubEnabled){
      target.innerHTML='<div class="rm112-empty">Family Hub profile management is not included with this membership.</div>';
      return;
    }
    if(!rows.length){
      target.innerHTML='<div class="rm170-list-empty">No Family Hub changes are waiting for review.</div>';
      return;
    }
    rows.slice(0,8).forEach(row=>{
      const item=document.createElement("div");item.className="rm170-family-request";
      const copy=document.createElement("div");
      const h=document.createElement("strong");
      h.textContent=title(row.request_type)+" · "+([row.first_name,row.last_name].filter(Boolean).join(" ")||"Household Member");
      const meta=document.createElement("span");meta.textContent=title(row.status)+" · "+formatDate(row.created_at,true);
      copy.append(h,meta);item.append(copy);
      if(["submitted","in_review"].includes(row.status)){
        const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Cancel Request";
        cancel.addEventListener("click",()=>cancelFamilyRequest(row.request_id));
        item.append(cancel);
      }
      target.append(item);
    });
  }

  function openFamilyRequest(row=null){
    if(!familyHubEnabled)return;
    currentFamilyTarget=row||null;
    el("rm-family-form").reset();
    el("rm-family-request-type").value=row?"update_member":"add_member";
    el("rm-family-target-id").value=row?.household_member_id||"";
    el("rm-family-title").textContent=row?"Request Family Member Change":"Add Family Member";
    el("rm-family-first").value=row?.first_name||"";
    el("rm-family-last").value=row?.last_name||"";
    el("rm-family-relationship").value=row?.relationship_type||"child";
    el("rm-family-sex").value=row?.sex||"male";
    el("rm-family-dob").value=row?.date_of_birth||"";
    el("rm-family-email").value=row?.email||"";
    el("rm-family-remove").classList.toggle("hidden",!row);
    showStatus(el("rm-family-status"),"");
    el("rm-family-modal").classList.remove("hidden");
    el("rm-family-modal").setAttribute("aria-hidden","false");
  }

  function closeFamilyRequest(){
    currentFamilyTarget=null;
    el("rm-family-modal").classList.add("hidden");
    el("rm-family-modal").setAttribute("aria-hidden","true");
    showStatus(el("rm-family-status"),"");
  }

  async function submitFamilyRequest(event){
    event.preventDefault();
    const status=el("rm-family-status");
    showStatus(status,"Submitting request...");
    const {error}=await client.rpc("request_my_family_change",{
      p_request_type:el("rm-family-request-type").value,
      p_target_household_member_id:el("rm-family-target-id").value||null,
      p_first_name:el("rm-family-first").value.trim()||null,
      p_last_name:el("rm-family-last").value.trim()||null,
      p_relationship_type:el("rm-family-relationship").value||null,
      p_sex:el("rm-family-sex").value||null,
      p_date_of_birth:el("rm-family-dob").value||null,
      p_email:el("rm-family-email").value.trim()||null,
      p_notes:el("rm-family-notes").value.trim()||null
    });
    if(error){showStatus(status,error.message,"error");return;}
    showStatus(status,"Family Hub request submitted.","success");
    await loadDashboard();
    window.setTimeout(closeFamilyRequest,500);
  }

  async function requestFamilyRemoval(){
    if(!currentFamilyTarget)return;
    if(!window.confirm("Request removal of this family member from your ReVitalized household?"))return;
    const status=el("rm-family-status");
    showStatus(status,"Submitting removal request...");
    const {error}=await client.rpc("request_my_family_change",{
      p_request_type:"remove_member",
      p_target_household_member_id:currentFamilyTarget.household_member_id,
      p_first_name:null,p_last_name:null,p_relationship_type:null,p_sex:null,p_date_of_birth:null,p_email:null,
      p_notes:el("rm-family-notes").value.trim()||null
    });
    if(error){showStatus(status,error.message,"error");return;}
    showStatus(status,"Removal request submitted.","success");
    await loadDashboard();
    window.setTimeout(closeFamilyRequest,500);
  }

  async function cancelFamilyRequest(requestId){
    if(!window.confirm("Cancel this pending Family Hub request?"))return;
    const {error}=await client.rpc("cancel_my_family_change_request",{p_request_id:requestId});
    if(error){window.alert(error.message);return;}
    await loadDashboard();
  }

  function renderCoachingHub(summary,hub){
    const assigned=Number(summary?.assigned_count||0);
    const progress=Number(summary?.in_progress_count||0);
    el("rm-hub-coach").textContent=hub?.assigned_coach_name||"Being Assigned";
    el("rm-hub-open-assignments").textContent=String(assigned+progress);
    el("rm-hub-due-soon").textContent=String(Number(summary?.due_next_7_days||0));
    el("rm-hub-overdue").textContent=String(Number(summary?.overdue_count||0));
    el("rm-coaching-hub-unread").textContent=String(Number(hub?.unread_messages||0))+" Unread";
  }

  function renderCoachingRequests(rows){
    const list=el("rm-coaching-requests");list.replaceChildren();
    const open=rows.filter(r=>["requested","scheduled"].includes(r.status));
    el("rm-coaching-request-count").textContent=open.length+" Open";
    if(!rows.length){
      list.innerHTML='<div class="rm112-empty">No coaching session requests yet.</div>';
      return;
    }
    rows.slice(0,6).forEach(row=>{
      const item=document.createElement("div");item.className="rm172-request-item";
      const copy=document.createElement("div");
      const h=document.createElement("strong");
      h.textContent=row.status==="scheduled"&&row.scheduled_start
        ?"Coaching Session · "+formatDate(row.scheduled_start,true)
        :"Coaching Session Request";
      const availability=Array.isArray(row.requested_availability)?row.requested_availability:[];
      const meta=document.createElement("span");
      meta.textContent=row.status==="scheduled"
        ?[row.assigned_coach_name?"With "+row.assigned_coach_name:null,row.format?title(row.format):null].filter(Boolean).join(" · ")
        :availability.map(a=>[a.date,title(a.window)].filter(Boolean).join(" ")).join(" · ")||"Availability submitted";
      copy.append(h,meta);
      if(row.client_notes){
        const note=document.createElement("span");note.textContent=row.client_notes;copy.append(note);
      }
      const actions=document.createElement("div");actions.className="rm172-request-item-actions";
      const status=document.createElement("span");status.className="rm172-request-status";status.textContent=title(row.status);actions.append(status);
      if(["requested","scheduled"].includes(row.status)){
        const cancel=document.createElement("button");cancel.type="button";cancel.textContent="Cancel";
        cancel.addEventListener("click",()=>cancelCoachingRequest(row.appointment_id));
        actions.append(cancel);
      }
      item.append(copy,actions);list.append(item);
    });
  }

  async function submitCoachingRequest(event){
    event.preventDefault();
    const status=el("rm-coaching-request-status");
    const date1=el("rm-coaching-request-date-1").value;
    const date2=el("rm-coaching-request-date-2").value;
    const windows=[];
    if(date1)windows.push({date:date1,window:el("rm-coaching-request-window-1").value});
    if(date2)windows.push({date:date2,window:el("rm-coaching-request-window-2").value||"flexible"});
    if(!windows.length){showStatus(status,"Choose at least one preferred date.","error");return;}
    showStatus(status,"Sending your request...");
    const {error}=await client.rpc("request_my_coaching_session",{
      p_requested_availability:windows,
      p_client_notes:el("rm-coaching-request-notes").value.trim()||null
    });
    if(error){showStatus(status,error.message,"error");return;}
    event.currentTarget.reset();
    showStatus(status,"Coaching request submitted.","success");
    await loadDashboard();
  }

  async function cancelCoachingRequest(id){
    if(!window.confirm("Cancel this coaching session request?"))return;
    const {error}=await client.rpc("cancel_my_coaching_session",{p_appointment_id:id});
    if(error){window.alert(error.message);return;}
    await loadDashboard();
  }

  function renderAppointment(row) {
    const target = el("rm-appointment");
    target.replaceChildren();

    if (!row) {
      target.className = "rm112-empty";
      target.textContent = "No upcoming appointment is currently scheduled.";
      return;
    }

    target.className = "rm112-appointment";
    const titleEl = document.createElement("strong");
    titleEl.textContent = title(row.appointment_type);
    const when = document.createElement("span");
    when.textContent = row.scheduled_start
      ? formatDate(row.scheduled_start, true) + (row.time_zone ? " · " + row.time_zone : "")
      : "Time being confirmed";
    const coach = document.createElement("span");
    coach.textContent = row.assigned_coach_name ? "With " + row.assigned_coach_name : "ReVitalized coaching team";
    target.append(titleEl, when, coach);

    if (row.location_url) {
      const link = document.createElement("a");
      link.href = row.location_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open appointment link →";
      target.append(link);
    }
  }

  let currentMember = null;
  let activeSessionPrep = null;
  let latestHouseholdRows = [];
  let familyHubEnabled = false;
  let currentFamilyTarget = null;

  function renderCoachingEntitlements(rows){
    const target=el("rm-coaching-entitlements");
    target.replaceChildren();
    if(!rows.length){
      target.innerHTML='<div class="rm112-empty">Your coaching access will appear here when your program entitlements are activated.</div>';
      return;
    }
    rows.forEach((row)=>{
      const item=document.createElement("div");item.className="rm140-entitlement";
      const heading=document.createElement("strong");heading.textContent=row.label;
      const meta=document.createElement("small");
      meta.textContent=row.limit_value===null
        ?"Access included · no numeric session limit has been configured."
        :(row.reset_cadence&&row.reset_cadence!=="none"?"Resets "+title(row.reset_cadence):"Program allowance");
      item.append(heading,meta);

      const stats=document.createElement("div");stats.className="rm140-entitlement-stats";
      const values=[
        ["Included",row.limit_value===null?"Included":row.limit_value],
        ["Used",row.used_value||0],
        ["Reserved",row.reserved_sessions||0],
        ["Remaining",row.remaining_value===null?"—":row.remaining_value]
      ];
      values.forEach(([label,value])=>{
        const d=document.createElement("div");
        const s=document.createElement("span");s.textContent=label;
        const b=document.createElement("b");b.textContent=String(value);
        d.append(s,b);stats.append(d);
      });
      item.append(stats);target.append(item);
    });
  }


  let activeAgreement=null;

  function renderAgreements(rows){
    const list=el("rm-agreements");
    list.replaceChildren();
    const actionNeeded=rows.filter((row)=>!["signed","waived"].includes(row.status)).length;
    el("rm-agreement-action-count").textContent=actionNeeded+" action needed";

    if(!rows.length){
      list.innerHTML='<div class="rm112-empty">No membership agreements have been assigned yet.</div>';
      return;
    }

    rows.forEach((row)=>{
      const item=document.createElement("div");
      item.className="rm139-agreement-item";
      const top=document.createElement("div");
      top.className="rm139-agreement-top";
      const heading=document.createElement("strong");heading.textContent=row.name;
      const chip=document.createElement("span");chip.className="rm112-chip";chip.textContent=title(row.status);
      top.append(heading,chip);item.append(top);
      if(row.description){const p=document.createElement("p");p.textContent=row.description;item.append(p);}
      const meta=document.createElement("small");
      meta.textContent=["Version "+row.template_version,row.signed_at?"Signed "+formatDate(row.signed_at,true):""].filter(Boolean).join(" · ");
      item.append(meta);
      const open=document.createElement("button");open.type="button";open.textContent=["signed","waived"].includes(row.status)?"View Agreement":"Review & Sign";
      open.addEventListener("click",()=>openAgreement(row));item.append(open);
      list.append(item);
    });
  }

  function closeAgreement(){
    activeAgreement=null;
    el("rm-agreement-modal").classList.add("hidden");
    el("rm-agreement-modal").setAttribute("aria-hidden","true");
    showStatus(el("rm-agreement-sign-status"),"");
  }

  async function openAgreement(row){
    activeAgreement=row;
    el("rm-agreement-title").textContent=row.name;
    el("rm-agreement-meta").textContent="Version "+row.template_version+" · "+title(row.status);
    el("rm-agreement-content").textContent=row.content_text||"";
    el("rm-agreement-signer-name").value=row.merge_values?.client_name||"";
    el("rm-agreement-secondary-signer-name").value=row.merge_values?.secondary_client_name||"";
    const needsSecondary=Number(row.required_client_signatures||1)===2;
    el("rm-agreement-secondary-signer-field").classList.toggle("hidden",!needsSecondary);
    el("rm-agreement-secondary-signer-name").required=needsSecondary;
    el("rm-agreement-accept").checked=false;
    showStatus(el("rm-agreement-sign-status"),"");

    const completed=["signed","waived"].includes(row.status);
    el("rm-agreement-sign-form").classList.toggle("hidden",completed);
    el("rm-agreement-completed").classList.toggle("hidden",!completed);
    el("rm-agreement-completed").textContent=completed
      ?(row.status==="signed"
        ?"Signed "+(Number(row.required_client_signatures||1)===2?"by both clients":"by "+(row.primary_signer_name||"member"))+" on "+formatDate(row.acceptance_signed_at||row.signed_at,true)+"."
        :"This agreement requirement was waived by ReVitalized.")
      :"";

    el("rm-agreement-modal").classList.remove("hidden");
    el("rm-agreement-modal").setAttribute("aria-hidden","false");

    if(!completed){
      await client.functions.invoke("agreement-sign",{body:{action:"view",client_agreement_id:row.client_agreement_id}});
    }
  }

  async function signAgreement(event){
    event.preventDefault();
    if(!activeAgreement)return;
    showStatus(el("rm-agreement-sign-status"),"Signing agreement...");
    const signatures=[{
      signer_role:"primary_client",
      signer_name:el("rm-agreement-signer-name").value.trim()
    }];
    if(Number(activeAgreement.required_client_signatures||1)===2){
      signatures.push({
        signer_role:"secondary_client",
        signer_name:el("rm-agreement-secondary-signer-name").value.trim()
      });
    }

    const {data,error}=await client.functions.invoke("agreement-sign",{
      body:{
        action:"sign",
        client_agreement_id:activeAgreement.client_agreement_id,
        signatures,
        accepted_terms:el("rm-agreement-accept").checked
      }
    });
    if(error||!data?.ok){showStatus(el("rm-agreement-sign-status"),error?.message||data?.error||"Agreement could not be signed.","error");return;}
    showStatus(el("rm-agreement-sign-status"),"Agreement signed successfully.","success");
    await loadDashboard();
    window.setTimeout(closeAgreement,650);
  }

  async function declineAgreement(){
    if(!activeAgreement)return;
    if(!window.confirm("Decline this agreement? ReVitalized staff will need to review the next step with you."))return;
    const {data,error}=await client.functions.invoke("agreement-sign",{body:{action:"decline",client_agreement_id:activeAgreement.client_agreement_id}});
    if(error||!data?.ok){showStatus(el("rm-agreement-sign-status"),error?.message||data?.error||"Agreement could not be declined.","error");return;}
    showStatus(el("rm-agreement-sign-status"),"Agreement declined. The ReVitalized team can review this with you.","success");
    await loadDashboard();
    window.setTimeout(closeAgreement,650);
  }


  function moneyFromCents(cents,currency){
    if(cents===null||cents===undefined)return "—";
    return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(Number(cents)/100);
  }

  function renderBilling(row,invoices=[],payments=[]){
    const card=el("rm-billing-card");
    if(!row){card.classList.add("hidden");return;}
    card.classList.remove("hidden");
    el("rm-billing-status-chip").textContent=title(row.status);
    const target=el("rm-billing-summary");
    target.replaceChildren();

    const money=moneyFromCents(row.amount_cents,row.currency);
    const interval=row.billing_interval
      ?money+" / "+(Number(row.interval_count||1)>1?row.interval_count+" ":"")+title(row.billing_interval)
      :money;

    [
      ["Plan",row.billing_plan_name||"Membership"],
      ["Billing",interval],
      ["Next Charge",row.next_charge_at?formatDate(row.next_charge_at,true):"Not scheduled"],
      ["Commitment End",row.commitment_ends_at?formatDate(row.commitment_ends_at,true):"Not set"],
      ["Last Payment",row.last_payment_at?formatDate(row.last_payment_at,true):"No payment recorded"],
      ["Failed Payments",String(Number(row.failed_payment_count||0))]
    ].forEach(([label,value])=>{
      const item=document.createElement("div");
      const span=document.createElement("span");span.textContent=label;
      const strong=document.createElement("strong");strong.textContent=value;
      item.append(span,strong);target.append(item);
    });

    const alert=el("rm-billing-alert");
    const failed=Number(row.failed_payment_count||0);
    if(failed>0||row.status==="past_due"){
      alert.classList.remove("hidden");
      alert.textContent="Your membership has a billing item that needs attention. Review the invoice below or contact the ReVitalized team for help.";
    }else if(row.cancel_at_period_end){
      alert.classList.remove("hidden");
      alert.textContent="This membership is currently set to end at the close of the present billing period.";
    }else{
      alert.classList.add("hidden");
      alert.textContent="";
    }

    renderInvoices(invoices);
    renderPaymentHistory(payments);
  }

  function renderInvoices(rows){
    const target=el("rm-invoices");target.replaceChildren();
    el("rm-invoice-count").textContent=String(rows.length);
    if(!rows.length){
      target.innerHTML='<div class="rm112-empty">No invoices are available yet.</div>';
      return;
    }
    rows.forEach(row=>{
      const item=document.createElement("div");item.className="rm186-record";
      const copy=document.createElement("div");
      const heading=document.createElement("strong");
      heading.textContent=(row.invoice_number?"Invoice "+row.invoice_number:"Membership Invoice")+" · "+moneyFromCents(row.amount_due_cents,row.currency);
      const meta=document.createElement("span");
      meta.textContent=[title(row.status),row.due_at?"Due "+formatDate(row.due_at,true):null,row.paid_at?"Paid "+formatDate(row.paid_at,true):null].filter(Boolean).join(" · ");
      copy.append(heading,meta);
      const action=document.createElement("div");
      if(row.hosted_invoice_url){
        const link=document.createElement("a");link.href=row.hosted_invoice_url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=row.status==="paid"?"View Invoice":"Open Invoice";action.append(link);
      }
      item.append(copy,action);target.append(item);
    });
  }

  function renderPaymentHistory(rows){
    const target=el("rm-payment-history");target.replaceChildren();
    el("rm-payment-count").textContent=String(rows.length);
    if(!rows.length){
      target.innerHTML='<div class="rm112-empty">No payment activity is available yet.</div>';
      return;
    }
    rows.forEach(row=>{
      const item=document.createElement("div");item.className="rm186-record";
      const copy=document.createElement("div");
      const heading=document.createElement("strong");
      heading.textContent=title(row.event_type||"payment")+" · "+moneyFromCents(row.amount_cents,row.currency);
      const meta=document.createElement("span");
      meta.textContent=[title(row.status),row.provider?title(row.provider):null,row.occurred_at?formatDate(row.occurred_at,true):null].filter(Boolean).join(" · ");
      copy.append(heading,meta);item.append(copy);target.append(item);
    });
  }

  function safeDocumentFilename(name){
    return String(name||"file").replace(/[^A-Za-z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"file";
  }

  async function signedDocumentUrl(path){
    const {data,error}=await client.storage.from("client-documents").createSignedUrl(path,900);
    if(error||!data?.signedUrl)return null;
    return data.signedUrl;
  }

  function renderDocuments(rows){
    const list=el("rm-documents");
    list.replaceChildren();
    if(!rows.length){
      list.innerHTML='<div class="rm112-empty">No member-visible documents yet.</div>';
      return;
    }
    rows.forEach((row)=>{
      const item=document.createElement("div");
      item.className="rm136-document";
      const top=document.createElement("div");top.className="rm136-document-top";
      const heading=document.createElement("strong");heading.textContent=row.title;
      const kind=document.createElement("span");kind.className="rm112-chip";kind.textContent=title(row.category);
      top.append(heading,kind);item.append(top);
      if(row.description){const p=document.createElement("p");p.textContent=row.description;item.append(p);}
      const meta=document.createElement("small");meta.textContent=[row.original_filename,formatDate(row.created_at,true)].filter(Boolean).join(" · ");item.append(meta);
      const actions=document.createElement("div");actions.className="rm136-document-actions";
      const open=document.createElement("button");open.type="button";open.textContent="Open Document";
      open.addEventListener("click",async()=>{
        const url=await signedDocumentUrl(row.storage_path);
        if(url)window.open(url,"_blank","noopener");
      });
      actions.append(open);item.append(actions);list.append(item);
    });
  }

  function closeDocumentUpload(){
    el("rm-document-upload-modal").classList.add("hidden");
    el("rm-document-upload-modal").setAttribute("aria-hidden","true");
  }

  function openDocumentUpload(){
    el("rm-document-upload-form").reset();
    el("rm-document-upload-modal").classList.remove("hidden");
    el("rm-document-upload-modal").setAttribute("aria-hidden","false");
    showStatus(el("rm-document-upload-status"),"");
  }

  async function uploadMemberDocument(event){
    event.preventDefault();
    if(!currentMember)return;
    const file=el("rm-document-file").files?.[0];
    if(!file)return;
    if(file.size>26214400){showStatus(el("rm-document-upload-status"),"File must be 25 MB or smaller.","error");return;}

    const {data:{user}}=await client.auth.getUser();
    const id=crypto.randomUUID();
    const path=currentMember.contact_id+"/"+id+"/"+safeDocumentFilename(file.name);
    const category=el("rm-document-category").value;

    showStatus(el("rm-document-upload-status"),"Preparing secure upload...");
    const {error:rowError}=await client.from("client_documents").insert({
      id,
      contact_id:currentMember.contact_id,
      membership_id:currentMember.membership_id||null,
      category,
      title:el("rm-document-title").value.trim(),
      description:el("rm-document-description").value.trim()||null,
      storage_path:path,
      original_filename:file.name,
      content_type:file.type||null,
      size_bytes:file.size,
      member_visible:true,
      uploaded_by_user_id:user.id,
      uploaded_by_contact_id:currentMember.contact_id
    });
    if(rowError){showStatus(el("rm-document-upload-status"),rowError.message,"error");return;}

    const {error:uploadError}=await client.storage.from("client-documents").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
    if(uploadError){
      await client.from("client_documents").update({status:"archived"}).eq("id",id);
      showStatus(el("rm-document-upload-status"),uploadError.message,"error");return;
    }

    showStatus(el("rm-document-upload-status"),"Document uploaded securely.","success");
    await loadDashboard();
    window.setTimeout(closeDocumentUpload,500);
  }


  let currentReferralCode=null;
  let currentReferralShareUrl=null;
  let currentReferralShareMessage=null;

  function moneyValue(value,currency){
    if(value===null||value===undefined||value==="")return "—";
    try{
      return new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"USD"}).format(Number(value));
    }catch{
      return String(value)+" "+(currency||"");
    }
  }

  function renderReferralSummary(row,activity=[]){
    const card=el("rm-referral-card");
    if(!row||!row.referral_code){
      card.classList.add("hidden");
      currentReferralCode=null;
      currentReferralShareUrl=null;
      currentReferralShareMessage=null;
      return;
    }

    card.classList.remove("hidden");
    currentReferralCode=row.referral_code;
    currentReferralShareUrl=row.share_url||("https://revitalizedacademy.com/enroll?ref="+encodeURIComponent(row.referral_code));
    currentReferralShareMessage=row.share_message||("I wanted to share ReVitalized Academy with you: "+currentReferralShareUrl);

    el("rm-referral-code").textContent=row.referral_code;
    el("rm-referral-message").textContent=currentReferralShareMessage;
    el("rm-referral-total").textContent=String(row.total_referrals||0);
    el("rm-referral-engaged").textContent=String(row.engaged_count||0);
    el("rm-referral-applicants").textContent=String(row.applicant_count||0);
    el("rm-referral-converted").textContent=String(row.converted_referrals||0);
    el("rm-referral-pending").textContent=String(row.pending_rewards||0);
    el("rm-referral-issued").textContent=String(row.issued_rewards||0);
    el("rm-referral-pending-value").textContent=moneyValue(row.pending_reward_value,row.reward_currency);
    el("rm-referral-issued-value").textContent=moneyValue(row.issued_reward_value,row.reward_currency);
    el("rm-referral-conversions").textContent=String(row.converted_referrals||0)+" Converted";

    const list=el("rm-referral-activity");list.replaceChildren();
    if(!activity.length){
      list.innerHTML='<div class="rm112-empty">Your referral activity will appear here as people engage with ReVitalized.</div>';
      return;
    }
    activity.slice(0,12).forEach(item=>{
      const rowEl=document.createElement("div");rowEl.className="rm172-referral-item";
      const who=document.createElement("strong");
      who.textContent=[item.referred_first_name,item.referred_last_initial].filter(Boolean).join(" ")||"Referral";
      const state=document.createElement("span");
      state.textContent=title(item.status)+" · "+formatDate(item.first_touch_at,true);
      const reward=document.createElement("span");
      reward.textContent=item.reward_status
        ?title(item.reward_status)+(item.reward_value!==null&&item.reward_value!==undefined?" · "+moneyValue(item.reward_value,item.currency):"")
        :"No Reward Yet";
      rowEl.append(who,state,reward);list.append(rowEl);
    });
  }

  async function copyReferralLink(){
    if(!currentReferralShareUrl)return;
    try{
      await navigator.clipboard.writeText(currentReferralShareUrl);
      const button=el("rm-referral-copy");
      const old=button.textContent;
      button.textContent="Copied ✓";
      window.setTimeout(()=>button.textContent=old,1300);
    }catch{
      window.prompt("Copy your ReVitalized referral link:",currentReferralShareUrl);
    }
  }

  async function copyReferralMessage(){
    if(!currentReferralShareMessage)return;
    try{
      await navigator.clipboard.writeText(currentReferralShareMessage);
      const button=el("rm-referral-copy-message");
      const old=button.textContent;
      button.textContent="Copied ✓";
      window.setTimeout(()=>button.textContent=old,1300);
    }catch{
      window.prompt("Copy your share message:",currentReferralShareMessage);
    }
  }


  function renderRefuel(row){
    const card=el("rm-refuel-card");
    if(!row){card.classList.add("hidden");return;}
    card.classList.remove("hidden");
    el("rm-refuel-status").textContent=title(row.enrollment_status);
    const content=el("rm-refuel-content");
    content.replaceChildren();
    const strong=document.createElement("strong");
    strong.textContent=row.offer_name||"ReFuel";
    content.append(strong);
    if(row.description){
      const p=document.createElement("p");p.textContent=row.description;content.append(p);
    }
    const meta=document.createElement("small");
    const price=row.price_cents!==null&&row.price_cents!==undefined
      ? new Intl.NumberFormat(undefined,{style:"currency",currency:row.currency||"USD"}).format(Number(row.price_cents)/100)
      : "";
    meta.textContent=[
      title(row.payment_status),
      price,
      row.starts_at?"Starts "+formatDate(row.starts_at,true):"",
      row.ends_at?"Ends "+formatDate(row.ends_at,true):""
    ].filter(Boolean).join(" · ");
    content.append(meta);
  }


  let communitySpaces=[];
  let communityFeed=[];
  let activeCommunityPost=null;

  function renderCommunity(spaces,feed){
    communitySpaces=spaces;
    communityFeed=feed;

    const chips=el("rm-community-spaces");
    chips.replaceChildren();
    spaces.forEach((space)=>{
      const chip=document.createElement("span");
      chip.className="rm126-space-chip";
      chip.textContent=space.name;
      chips.append(chip);
    });

    el("rm-community-new-post").disabled=!spaces.some((space)=>space.membership_status==="active");

    const list=el("rm-community-feed");
    list.replaceChildren();
    if(!feed.length){
      list.innerHTML='<div class="rm112-empty">Your ReVitalized community feed is ready. Approved announcements, encouragement, wins and family/community posts will appear here.</div>';
      return;
    }

    feed.forEach((row)=>{
      const card=document.createElement("div");
      card.className="rm126-post"+(row.pinned?" pinned":"");

      const top=document.createElement("div");
      top.className="rm126-post-top";
      const author=document.createElement("strong");
      author.textContent=row.author_name;
      const space=document.createElement("span");
      space.textContent=(row.pinned?"PINNED · ":"")+row.space_name;
      top.append(author,space);
      card.append(top);

      if(row.title){
        const h=document.createElement("h3");
        h.textContent=row.title;
        card.append(h);
      }

      const p=document.createElement("p");
      p.textContent=row.body;
      card.append(p);

      const meta=document.createElement("small");
      meta.textContent=[
        title(row.post_type),
        formatDate(row.created_at,true),
        row.reaction_count+" reaction"+(Number(row.reaction_count)===1?"":"s"),
        row.comment_count+" comment"+(Number(row.comment_count)===1?"":"s")
      ].join(" · ");
      card.append(meta);

      const actions=document.createElement("div");
      actions.className="rm126-post-actions";
      const like=document.createElement("button");
      like.type="button";like.textContent="Encourage";
      like.addEventListener("click",()=>reactToPost(row.post_id));
      const discuss=document.createElement("button");
      discuss.type="button";discuss.textContent="View Discussion";
      discuss.addEventListener("click",()=>openCommunityThread(row));
      actions.append(like,discuss);
      card.append(actions);
      list.append(card);
    });
  }

  function closeCommunityPost(){
    el("rm-community-post-modal").classList.add("hidden");
    el("rm-community-post-modal").setAttribute("aria-hidden","true");
  }

  function openCommunityPost(){
    const select=el("rm-community-space-select");
    select.replaceChildren();
    communitySpaces.filter((s)=>s.membership_status==="active").forEach((space)=>{
      const option=document.createElement("option");
      option.value=space.space_id;
      option.textContent=space.name+" · "+title(space.space_type);
      select.append(option);
    });
    el("rm-community-post-modal").classList.remove("hidden");
    el("rm-community-post-modal").setAttribute("aria-hidden","false");
    showStatus(el("rm-community-post-status"),"");
  }

  async function publishCommunityPost(event){
    event.preventDefault();
    if(!currentMember)return;
    const body=el("rm-community-post-body").value.trim();
    if(!body)return;
    const {data:{user}}=await client.auth.getUser();
    const status=el("rm-community-post-status");
    showStatus(status,"Publishing...");

    const {error}=await client.from("community_posts").insert({
      space_id:el("rm-community-space-select").value,
      author_user_id:user.id,
      author_contact_id:currentMember.contact_id,
      post_type:el("rm-community-post-type").value,
      title:el("rm-community-post-heading").value.trim()||null,
      body,
      status:"published"
    });

    if(error){showStatus(status,error.message,"error");return;}
    event.currentTarget.reset();
    showStatus(status,"Post published.","success");
    await loadDashboard();
    window.setTimeout(closeCommunityPost,450);
  }

  async function reactToPost(postId){
    const {data:{user}}=await client.auth.getUser();
    const {error}=await client.from("community_reactions").upsert({
      post_id:postId,user_id:user.id,reaction:"encourage"
    },{onConflict:"post_id,user_id,reaction"});
    if(error){window.alert("Could not add reaction: "+error.message);return;}
    await loadDashboard();
  }

  function closeCommunityThread(){
    activeCommunityPost=null;
    el("rm-community-thread-modal").classList.add("hidden");
    el("rm-community-thread-modal").setAttribute("aria-hidden","true");
    el("rm-community-comment-body").value="";
  }

  async function openCommunityThread(row){
    activeCommunityPost=row;
    el("rm-community-thread-title").textContent=row.title||row.space_name;
    const post=el("rm-community-thread-post");
    post.replaceChildren();
    const card=document.createElement("div");
    card.className="rm126-post";
    const author=document.createElement("strong");author.textContent=row.author_name;
    const p=document.createElement("p");p.textContent=row.body;
    const small=document.createElement("small");small.textContent=formatDate(row.created_at,true)+" · "+row.space_name;
    card.append(author,p,small);post.append(card);

    el("rm-community-comments").innerHTML='<div class="rm112-empty">Loading comments...</div>';
    el("rm-community-thread-modal").classList.remove("hidden");
    el("rm-community-thread-modal").setAttribute("aria-hidden","false");

    const {data,error}=await client.from("community_comments")
      .select("id,author_user_id,author_contact_id,body,created_at")
      .eq("post_id",row.post_id).eq("status","published").order("created_at");
    if(error){el("rm-community-comments").innerHTML='<div class="rm112-empty">Comments could not be loaded.</div>';return;}

    const contacts=[...new Set((data||[]).map((c)=>c.author_contact_id).filter(Boolean))];
    const authorMap=new Map();
    if(contacts.length){
      const {data:people}=await client.from("contacts").select("id,first_name,last_name").in("id",contacts);
      for(const person of people||[])authorMap.set(person.id,[person.first_name,person.last_name].filter(Boolean).join(" "));
    }

    const list=el("rm-community-comments");
    list.replaceChildren();
    if(!(data||[]).length){list.innerHTML='<div class="rm112-empty">No comments yet.</div>';return;}

    for(const comment of data||[]){
      const item=document.createElement("div");
      item.className="rm126-comment";
      const strong=document.createElement("strong");
      strong.textContent=authorMap.get(comment.author_contact_id)||"ReVitalized Team";
      const p2=document.createElement("p");p2.textContent=comment.body;
      const time=document.createElement("small");time.textContent=formatDate(comment.created_at,true);
      item.append(strong,p2,time);list.append(item);
    }
  }

  async function addCommunityComment(event){
    event.preventDefault();
    if(!activeCommunityPost||!currentMember)return;
    const body=el("rm-community-comment-body").value.trim();
    if(!body)return;
    const {data:{user}}=await client.auth.getUser();
    const status=el("rm-community-comment-status");
    showStatus(status,"Posting...");
    const {error}=await client.from("community_comments").insert({
      post_id:activeCommunityPost.post_id,
      author_user_id:user.id,
      author_contact_id:currentMember.contact_id,
      body,status:"published"
    });
    if(error){showStatus(status,error.message,"error");return;}
    el("rm-community-comment-body").value="";
    showStatus(status,"Comment added.","success");
    const row=activeCommunityPost;
    await loadDashboard();
    await openCommunityThread(row);
  }


  let activeConversationId = null;



  function renderChallenges(rows){
    const list=el("rm-challenges");
    list.replaceChildren();
    const points=rows.reduce((sum,row)=>sum+Number(row.points_earned||0),0);
    el("rm-challenge-points").textContent=points+" points";

    if(!rows.length){
      list.innerHTML='<div class="rm112-empty">No ReVitalized challenge is active for you or your household right now.</div>';
      return;
    }

    rows.forEach((row)=>{
      const card=document.createElement("div");
      card.className="rm124-challenge";
      const top=document.createElement("div");
      top.className="rm124-challenge-top";
      const heading=document.createElement("strong");
      heading.textContent=row.title;
      const chip=document.createElement("span");
      chip.className="rm112-chip";
      chip.textContent=Number(row.completion_percent||0)+"%";
      top.append(heading,chip);
      card.append(top);

      if(row.description){
        const p=document.createElement("p");
        p.textContent=row.description;
        card.append(p);
      }

      const progress=document.createElement("div");
      progress.className="rm124-challenge-progress";
      const bar=document.createElement("i");
      bar.style.width=Math.max(0,Math.min(100,Number(row.completion_percent||0)))+"%";
      progress.append(bar);
      card.append(progress);

      const meta=document.createElement("small");
      meta.textContent=[
        title(row.scope),
        row.target_value!==null?String(row.current_value||0)+" / "+row.target_value+(row.unit?" "+row.unit:""):"",
        row.points_earned+" points",
        "Ends "+formatDate(row.ends_on)
      ].filter(Boolean).join(" · ");
      card.append(meta);
      list.append(card);
    });
  }

  function renderHealthConnections(rows){
    const list=el("rm-health-connections");
    list.replaceChildren();
    const connected=rows.filter((row)=>row.status==="connected").length;
    el("rm-health-connection-count").textContent=connected+" connected";

    if(!rows.length){
      list.innerHTML='<div class="rm112-empty">No health or wearable source is connected yet. This section is ready for provider setup when ReVitalized enables integrations.</div>';
      return;
    }

    rows.forEach((row)=>{
      const item=document.createElement("div");
      item.className="rm123-health-connection";
      const copy=document.createElement("div");
      const heading=document.createElement("strong");
      heading.textContent=row.provider_name;
      const meta=document.createElement("span");
      meta.textContent=[
        title(row.status),
        row.last_successful_sync_at?"Last synced "+formatDate(row.last_successful_sync_at,true):""
      ].filter(Boolean).join(" · ");
      copy.append(heading,meta);
      const state=document.createElement("span");
      state.className="rm112-chip";
      state.textContent=title(row.status);
      item.append(copy,state);
      list.append(item);
    });
  }

  function renderNotificationPreferences(row){
    const values=row||{};
    el("pref-in-app-messages").checked=values.in_app_messages!==false;
    el("pref-email-messages").checked=Boolean(values.email_messages);
    el("pref-sms-messages").checked=Boolean(values.sms_messages);
    el("pref-email-coaching").checked=values.email_coaching_reminders!==false;
    el("pref-sms-coaching").checked=Boolean(values.sms_coaching_reminders);
    el("pref-email-program").checked=values.email_program_updates!==false;
    el("pref-sms-program").checked=Boolean(values.sms_program_updates);
    el("pref-email-billing").checked=values.email_billing_alerts!==false;
    el("pref-sms-billing").checked=Boolean(values.sms_billing_alerts);
  }

  async function saveNotificationPreferences(event){
    event.preventDefault();
    const {data:{user}}=await client.auth.getUser();
    if(!user)return;
    const status=el("rm-notification-status");
    showStatus(status,"Saving...");
    const payload={
      user_id:user.id,
      in_app_messages:el("pref-in-app-messages").checked,
      email_messages:el("pref-email-messages").checked,
      sms_messages:el("pref-sms-messages").checked,
      email_coaching_reminders:el("pref-email-coaching").checked,
      sms_coaching_reminders:el("pref-sms-coaching").checked,
      email_program_updates:el("pref-email-program").checked,
      sms_program_updates:el("pref-sms-program").checked,
      email_billing_alerts:el("pref-email-billing").checked,
      sms_billing_alerts:el("pref-sms-billing").checked,
      updated_at:new Date().toISOString()
    };
    const {error}=await client.from("notification_preferences").upsert(payload,{onConflict:"user_id"});
    if(error){showStatus(status,error.message,"error");return;}
    showStatus(status,"Notification preferences saved.","success");
  }

  function safeFilename(name){
    return String(name||"attachment").replace(/[^A-Za-z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"attachment";
  }

  async function uploadMessageAttachment(conversationId,messageId,file){
    if(!file)return null;
    if(file.size>10485760)throw new Error("Attachment must be 10 MB or smaller.");
    const path=conversationId+"/"+messageId+"/"+safeFilename(file.name);
    const {error:uploadError}=await client.storage.from("member-message-attachments").upload(path,file,{
      contentType:file.type||"application/octet-stream",
      upsert:false,
      cacheControl:"3600"
    });
    if(uploadError)throw uploadError;

    const {data,error}=await client.from("member_message_attachments").insert({
      message_id:messageId,
      storage_path:path,
      original_filename:file.name,
      content_type:file.type||null,
      size_bytes:file.size
    }).select("*").single();
    if(error)throw error;
    return data;
  }

  async function signedAttachmentUrl(path){
    const {data,error}=await client.storage.from("member-message-attachments").createSignedUrl(path,900);
    if(error||!data?.signedUrl)return null;
    return data.signedUrl;
  }


  function renderConversations(rows) {
    const list=el("rm-conversations");
    list.replaceChildren();
    const unread=rows.reduce((sum,row)=>sum+Number(row.unread_count||0),0);
    el("rm-message-unread").textContent=unread+" unread";

    if(!rows.length){
      list.innerHTML='<div class="rm112-empty">Your private coaching conversation will appear here when your member account and primary coach are connected.</div>';
      return;
    }

    rows.forEach((row)=>{
      const item=document.createElement("div");
      item.className="rm120-conversation";
      const top=document.createElement("div");
      top.className="rm120-row";
      const heading=document.createElement("strong");
      heading.textContent=row.title||"ReVitalized Conversation";
      top.append(heading);
      if(Number(row.unread_count||0)>0){
        const badge=document.createElement("span");
        badge.className="rm120-unread";
        badge.textContent=String(row.unread_count);
        top.append(badge);
      }
      item.append(top);
      if(row.last_message_preview){
        const p=document.createElement("p");
        p.textContent=row.last_message_preview;
        item.append(p);
      }
      const meta=document.createElement("small");
      meta.textContent=row.last_message_at?formatDate(row.last_message_at,true):"Start a conversation";
      item.append(meta);
      item.addEventListener("click",()=>openConversation(row));
      list.append(item);
    });
  }

  function renderNotifications(rows){
    const list=el("rm-notifications");
    list.replaceChildren();
    const visible=rows.filter((row)=>row.status!=="dismissed");

    if(!visible.length){
      list.innerHTML='<div class="rm112-empty">No new notifications right now.</div>';
      return;
    }

    visible.slice(0,12).forEach((row)=>{
      const item=document.createElement("div");
      item.className="rm120-notification";
      const top=document.createElement("div");
      top.className="rm120-row";
      const heading=document.createElement("strong");
      heading.textContent=row.title;
      const state=document.createElement("span");
      state.className="rm112-chip";
      state.textContent=title(row.status);
      top.append(heading,state);
      item.append(top);
      if(row.body){
        const p=document.createElement("p");
        p.textContent=row.body;
        item.append(p);
      }
      const meta=document.createElement("small");
      meta.textContent=formatDate(row.created_at,true);
      item.append(meta);

      const actions=document.createElement("div");
      actions.className="rm186-notification-actions";
      if(row.status==="unread"){
        const read=document.createElement("button");read.type="button";read.textContent="Mark Read";
        read.addEventListener("click",async(event)=>{
          event.stopPropagation();
          await client.rpc("update_my_notification",{p_notification_id:row.id,p_action:"read"});
          await loadDashboard();
        });
        actions.append(read);
      }
      const dismiss=document.createElement("button");dismiss.type="button";dismiss.className="dismiss";dismiss.textContent="Dismiss";
      dismiss.addEventListener("click",async(event)=>{
        event.stopPropagation();
        await client.rpc("update_my_notification",{p_notification_id:row.id,p_action:"dismissed"});
        await loadDashboard();
      });
      actions.append(dismiss);
      item.append(actions);
    });
  }

  async function markAllNotificationsRead(){
    const button=el("rm-notifications-mark-all");
    const old=button.textContent;
    button.disabled=true;button.textContent="Updating...";
    const {error}=await client.rpc("mark_all_my_notifications_read");
    button.disabled=false;button.textContent=old;
    if(error){window.alert(error.message);return;}
    await loadDashboard();
  }

  async function openConversation(row){
    activeConversationId=row.conversation_id;
    el("rm-message-title").textContent=row.title||"ReVitalized Conversation";
    el("rm-message-thread").innerHTML='<div class="rm112-empty">Loading messages...</div>';
    el("rm-message-modal").classList.remove("hidden");
    el("rm-message-modal").setAttribute("aria-hidden","false");

    const {data:{user}}=await client.auth.getUser();
    const {data,error}=await client.from("member_messages")
      .select("id,sender_user_id,body,message_type,created_at")
      .eq("conversation_id",row.conversation_id)
      .is("deleted_at",null)
      .order("created_at");

    if(error){
      el("rm-message-thread").innerHTML='<div class="rm112-empty">Messages could not be loaded.</div>';
      return;
    }

    const thread=el("rm-message-thread");
    thread.replaceChildren();

    const messageIds=(data||[]).map((m)=>m.id);
    const attachmentMap=new Map();
    if(messageIds.length){
      const {data:attachments}=await client.from("my_message_attachments").select("*").in("message_id",messageIds);
      for(const attachment of attachments||[]){
        if(!attachmentMap.has(attachment.message_id))attachmentMap.set(attachment.message_id,[]);
        attachmentMap.get(attachment.message_id).push(attachment);
      }
    }

    for(const message of (data||[])){
      const bubble=document.createElement("div");
      bubble.className="rm120-bubble"+(message.sender_user_id===user?.id?" mine":"");
      const p=document.createElement("p");
      p.textContent=message.body;
      const time=document.createElement("small");
      time.textContent=formatDate(message.created_at,true);
      bubble.append(p,time);

      const attachments=attachmentMap.get(message.id)||[];
      if(attachments.length){
        const files=document.createElement("div");
        files.className="rm120-attachments";
        for(const attachment of attachments){
          const href=await signedAttachmentUrl(attachment.storage_path);
          if(!href)continue;
          const link=document.createElement("a");
          link.className="rm120-attachment";
          link.href=href;
          link.target="_blank";
          link.rel="noopener noreferrer";
          link.textContent=attachment.original_filename||"Attachment";
          files.append(link);
        }
        bubble.append(files);
      }

      thread.append(bubble);
    }
    thread.scrollTop=thread.scrollHeight;

    await client.from("member_conversation_participants")
      .update({last_read_at:new Date().toISOString()})
      .eq("conversation_id",row.conversation_id)
      .eq("user_id",user?.id);
  }

  function closeConversation(){
    activeConversationId=null;
    el("rm-message-modal").classList.add("hidden");
    el("rm-message-modal").setAttribute("aria-hidden","true");
    el("rm-message-body").value="";
  }


  let currentCourses = [];
  let currentCourseLessons = [];

  function renderCourses(rows) {
    currentCourses = rows;
    const list = el("rm-courses");
    list.replaceChildren();
    el("rm-course-count").textContent = rows.length + (rows.length === 1 ? " course" : " courses");

    if (!rows.length) {
      list.innerHTML = '<div class="rm112-empty">Your ReVitalized courses will appear here when they are published and included with your program or assigned by your coach.</div>';
      return;
    }

    rows.forEach((row) => {
      const card = document.createElement("div");
      card.className = "rm119-course-card";

      const top = document.createElement("div");
      top.className = "rm119-course-top";
      const heading = document.createElement("strong");
      heading.textContent = row.title;
      const progress = document.createElement("span");
      progress.className = "rm112-chip";
      progress.textContent = Number(row.progress_percent || 0) + "%";
      top.append(heading, progress);
      card.append(top);

      if (row.description) {
        const p = document.createElement("p");
        p.textContent = row.description;
        card.append(p);
      }

      const mini = document.createElement("div");
      mini.className = "rm119-mini-progress";
      const bar = document.createElement("i");
      bar.style.width = Math.max(0,Math.min(100,Number(row.progress_percent || 0))) + "%";
      mini.append(bar);
      card.append(mini);

      const meta = document.createElement("small");
      meta.textContent = [
        title(row.status),
        row.estimated_minutes ? row.estimated_minutes + " estimated minutes" : ""
      ].filter(Boolean).join(" · ");
      card.append(meta);

      const actions = document.createElement("div");
      actions.className = "rm119-course-actions";
      const open = document.createElement("button");
      open.type = "button";
      open.className = "primary";
      open.textContent = row.progress_percent > 0 ? "Continue Course" : "Start Course";
      open.addEventListener("click", () => openCourse(row));
      actions.append(open);
      card.append(actions);
      list.append(card);
    });
  }

  function renderResources(rows) {
    const list = el("rm-resources");
    list.replaceChildren();

    if (!rows.length) {
      list.innerHTML = '<div class="rm112-empty">Approved guides, worksheets and resources included with your program will appear here.</div>';
      return;
    }

    rows.forEach((row) => {
      const card = document.createElement("div");
      card.className = "rm119-resource-card";

      const top = document.createElement("div");
      top.className = "rm119-resource-top";
      const heading = document.createElement("strong");
      heading.textContent = row.title;
      const kind = document.createElement("span");
      kind.className = "rm112-chip";
      kind.textContent = title(row.resource_type);
      top.append(heading, kind);
      card.append(top);

      if (row.description) {
        const p = document.createElement("p");
        p.textContent = row.description;
        card.append(p);
      }

      const meta = document.createElement("small");
      meta.textContent = [row.category || "", row.assignment_note || ""].filter(Boolean).join(" · ");
      card.append(meta);

      const actions = document.createElement("div");
      actions.className = "rm119-resource-actions";
      const link = document.createElement("a");
      link.href = row.resource_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open Resource";
      actions.append(link);
      card.append(actions);
      list.append(card);
    });
  }

  function closeCourse() {
    el("rm-course-modal").classList.add("hidden");
    el("rm-course-modal").setAttribute("aria-hidden", "true");
  }

  async function openCourse(course) {
    el("rm-course-title").textContent = course.title;
    el("rm-course-description").textContent = course.description || "";
    el("rm-course-progress").querySelector("i").style.width = Math.max(0,Math.min(100,Number(course.progress_percent || 0))) + "%";
    el("rm-course-lessons").innerHTML = '<div class="rm112-empty">Loading lessons...</div>';
    el("rm-course-modal").classList.remove("hidden");
    el("rm-course-modal").setAttribute("aria-hidden", "false");

    const { data, error } = await client
      .from("my_course_lessons")
      .select("*")
      .eq("course_id", course.course_id)
      .order("module_order")
      .order("lesson_order");

    if (error) {
      el("rm-course-lessons").innerHTML = '<div class="rm112-empty">Course lessons could not be loaded.</div>';
      return;
    }

    currentCourseLessons = data || [];
    renderCourseLessons(course, currentCourseLessons);
  }

  function renderCourseLessons(course, rows) {
    const list = el("rm-course-lessons");
    list.replaceChildren();
    let moduleId = null;

    rows.forEach((row) => {
      if (row.module_id !== moduleId) {
        moduleId = row.module_id;
        const module = document.createElement("div");
        module.className = "rm119-module-title";
        module.textContent = row.module_title;
        list.append(module);
      }

      const lesson = document.createElement("div");
      lesson.className = "rm119-lesson";
      const top = document.createElement("div");
      top.className = "rm119-lesson-top";
      const heading = document.createElement("strong");
      heading.textContent = row.lesson_title;
      const state = document.createElement("span");
      state.textContent = title(row.progress_status);
      top.append(heading, state);
      lesson.append(top);

      if (row.lesson_description) {
        const p = document.createElement("p");
        p.textContent = row.lesson_description;
        lesson.append(p);
      }

      const actions = document.createElement("div");
      actions.className = "rm119-lesson-actions";

      if (row.media_url) {
        const media = document.createElement("a");
        media.href = row.media_url;
        media.target = "_blank";
        media.rel = "noopener noreferrer";
        media.textContent = row.progress_status === "in_progress" ? "Resume Lesson" : "Open Lesson";
        media.addEventListener("click", () => markLessonStarted(row));
        actions.append(media);
      }

      if (row.progress_status !== "completed") {
        const complete = document.createElement("button");
        complete.type = "button";
        complete.className = "primary";
        complete.textContent = "Mark Complete";
        complete.addEventListener("click", () => completeLesson(course, row));
        actions.append(complete);
      }

      lesson.append(actions);
      list.append(lesson);
    });
  }

  async function markLessonStarted(row) {
    const { data: { user } } = await client.auth.getUser();
    await client.from("lesson_progress").upsert({
      enrollment_id: row.enrollment_id,
      contact_id: currentMember.contact_id,
      lesson_id: row.lesson_id,
      status: row.progress_status === "completed" ? "completed" : "in_progress",
      progress_seconds: Number(row.progress_seconds || 0),
      completion_percent: Number(row.completion_percent || 0),
      first_started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      created_by: user?.id || null
    }, { onConflict: "enrollment_id,lesson_id" });
  }

  async function completeLesson(course, row) {
    const { data: { user } } = await client.auth.getUser();
    const { error } = await client.from("lesson_progress").upsert({
      enrollment_id: row.enrollment_id,
      contact_id: currentMember.contact_id,
      lesson_id: row.lesson_id,
      status: "completed",
      progress_seconds: row.duration_seconds || Number(row.progress_seconds || 0),
      completion_percent: 100,
      first_started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_by: user?.id || null
    }, { onConflict: "enrollment_id,lesson_id" });

    if (error) {
      window.alert("Could not complete lesson: " + error.message);
      return;
    }

    await loadDashboard();
    const refreshed = currentCourses.find((c) => c.course_id === course.course_id) || course;
    await openCourse(refreshed);
  }

  let metricCatalog = [];
  let checkinTemplate = null;
  let checkinFields = [];


  function renderCoach(row) {
    const target = el("rm-coach");
    target.replaceChildren();
    if (!row) {
      target.className = "rm112-empty";
      target.textContent = "Your primary coach assignment is being prepared.";
      return;
    }
    target.className = "rm114-coach-card";
    const name = document.createElement("strong");
    name.textContent = row.coach_name || "ReVitalized Coach";
    const meta = document.createElement("span");
    meta.textContent = "Primary coaching connection";
    target.append(name, meta);
  }

  function renderGoals(rows) {
    const list = el("rm-goals");
    const history = el("rm-goal-history");
    list.replaceChildren();
    history.replaceChildren();

    const active = rows.filter((row) => row.status === "active");
    const historical = rows.filter((row) => ["paused","completed"].includes(row.status));

    el("rm-goal-active-count").textContent=active.length+" Active";
    el("rm-goal-history-count").textContent=String(historical.length);

    if (!active.length) {
      list.innerHTML = '<div class="rm112-empty">No active goals yet. Add one when you are ready to define your next target.</div>';
    }

    active.forEach((row) => {
      const item = document.createElement("div");
      item.className = "rm114-item";
      const top = document.createElement("div");
      top.className = "rm114-item-top";
      const titleEl = document.createElement("strong");
      titleEl.textContent = row.title;
      const due = document.createElement("small");
      due.textContent = row.target_date ? "Target " + formatDate(row.target_date) : "Active Goal";
      top.append(titleEl, due);
      item.append(top);

      if (row.description) {
        const p = document.createElement("p");
        p.textContent = row.description;
        item.append(p);
      }

      if(row.target_value!==null&&row.target_value!==undefined){
        const target=document.createElement("span");
        target.className="rm190-goal-target";
        target.textContent="Target: "+row.target_value+(row.target_unit?" "+row.target_unit:"");
        item.append(target);
      }

      const actions=document.createElement("div");
      actions.className="rm190-item-actions";
      const complete=document.createElement("button");
      complete.type="button";
      complete.className="primary";
      complete.textContent="Complete Goal";
      complete.addEventListener("click",()=>updateGoalStatus(row,"completed"));
      const pause=document.createElement("button");
      pause.type="button";
      pause.className="muted";
      pause.textContent="Pause";
      pause.addEventListener("click",()=>updateGoalStatus(row,"paused"));
      actions.append(complete,pause);
      item.append(actions);
      list.append(item);
    });

    if(!historical.length){
      history.innerHTML='<div class="rm112-empty">No paused or completed goals yet.</div>';
      return;
    }

    historical
      .sort((a,b)=>new Date(b.updated_at||b.completed_at||0)-new Date(a.updated_at||a.completed_at||0))
      .forEach((row)=>{
        const item=document.createElement("div");
        item.className="rm191-history-item";
        const copy=document.createElement("div");
        const h=document.createElement("strong");
        h.textContent=row.title;
        const meta=document.createElement("span");
        meta.textContent=row.status==="completed"
          ?"Completed"+(row.completed_at?" · "+formatDate(row.completed_at,true):"")
          :"Paused";
        copy.append(h,meta);

        const actions=document.createElement("div");
        actions.className="rm191-history-actions";
        if(row.status==="paused"){
          const resume=document.createElement("button");
          resume.type="button";
          resume.textContent="Resume";
          resume.addEventListener("click",()=>updateGoalStatus(row,"active"));
          const cancel=document.createElement("button");
          cancel.type="button";
          cancel.className="cancel";
          cancel.textContent="Cancel Goal";
          cancel.addEventListener("click",()=>updateGoalStatus(row,"cancelled"));
          actions.append(resume,cancel);
        }else{
          const reopen=document.createElement("button");
          reopen.type="button";
          reopen.textContent="Reopen";
          reopen.addEventListener("click",()=>updateGoalStatus(row,"active"));
          actions.append(reopen);
        }
        item.append(copy,actions);
        history.append(item);
      });
  }

  function renderHabits(rows) {
    const list = el("rm-habits");
    const history = el("rm-habit-history");
    list.replaceChildren();
    history.replaceChildren();

    const active = rows.filter((row) => row.status === "active");
    const historical = rows.filter((row) => ["paused","completed"].includes(row.status));

    el("rm-habit-active-count").textContent=active.length+" Active";
    el("rm-habit-history-count").textContent=String(historical.length);

    if (!active.length) {
      list.innerHTML = '<div class="rm112-empty">No active habits yet. Add a rhythm when you are ready to start tracking it.</div>';
    }

    active.forEach((row) => {
      const item = document.createElement("div");
      item.className = "rm114-item";
      const top = document.createElement("div");
      top.className = "rm114-item-top";
      const titleEl = document.createElement("strong");
      titleEl.textContent = row.title;
      const meta = document.createElement("small");
      meta.textContent = title(row.frequency) + " · Target " + row.target_per_period + (row.unit ? " " + row.unit : "");
      top.append(titleEl, meta);
      item.append(top);

      const progress = document.createElement("div");
      progress.className = "rm114-habit-progress";
      const bar = document.createElement("i");
      const denominator = row.frequency === "daily"
        ? Math.max(1, Number(row.target_per_period || 1) * 7)
        : Math.max(1, Number(row.target_per_period || 1));
      bar.style.width = Math.min(100, Math.round((Number(row.last_7_day_value || 0) / denominator) * 100)) + "%";
      progress.append(bar);
      item.append(progress);

      const actions = document.createElement("div");
      actions.className = "rm114-item-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "primary";
      const doneToday = Number(row.today_value || 0) > 0;
      button.textContent = doneToday ? "Logged Today ✓" : "Mark Today";
      button.disabled = doneToday;
      button.addEventListener("click", () => markHabit(row));
      actions.append(button);

      const pause=document.createElement("button");
      pause.type="button";
      pause.className="muted";
      pause.textContent="Pause";
      pause.addEventListener("click",()=>updateHabitStatus(row,"paused"));
      actions.append(pause);

      item.append(actions);
      list.append(item);
    });

    if(!historical.length){
      history.innerHTML='<div class="rm112-empty">No paused or completed habits yet.</div>';
      return;
    }

    historical
      .sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0))
      .forEach((row)=>{
        const item=document.createElement("div");
        item.className="rm191-history-item";
        const copy=document.createElement("div");
        const h=document.createElement("strong");
        h.textContent=row.title;
        const meta=document.createElement("span");
        meta.textContent=title(row.status)+" · "+title(row.frequency)+" · Target "+row.target_per_period+(row.unit?" "+row.unit:"");
        copy.append(h,meta);

        const actions=document.createElement("div");
        actions.className="rm191-history-actions";
        if(row.status==="paused"){
          const resume=document.createElement("button");
          resume.type="button";
          resume.textContent="Resume";
          resume.addEventListener("click",()=>updateHabitStatus(row,"active"));
          const complete=document.createElement("button");
          complete.type="button";
          complete.textContent="Complete";
          complete.addEventListener("click",()=>updateHabitStatus(row,"completed"));
          const cancel=document.createElement("button");
          cancel.type="button";
          cancel.className="cancel";
          cancel.textContent="Cancel";
          cancel.addEventListener("click",()=>updateHabitStatus(row,"cancelled"));
          actions.append(resume,complete,cancel);
        }else{
          const resume=document.createElement("button");
          resume.type="button";
          resume.textContent="Resume";
          resume.addEventListener("click",()=>updateHabitStatus(row,"active"));
          actions.append(resume);
        }

        item.append(copy,actions);
        history.append(item);
      });
  }

  function renderAssignments(rows) {
    const list = el("rm-assignments");
    list.replaceChildren();
    const open = rows.filter((row) => ["assigned","in_progress"].includes(row.status));
    el("rm-assignment-count").textContent = open.length + " open";

    if (!open.length) {
      list.innerHTML = '<div class="rm112-empty">No open coach assignments right now.</div>';
      return;
    }

    open.forEach((row) => {
      const item = document.createElement("div");
      item.className = "rm114-item";
      const top = document.createElement("div");
      top.className = "rm114-item-top";
      const titleEl = document.createElement("strong");
      titleEl.textContent = row.title;
      const due = document.createElement("small");
      due.textContent = row.due_at ? "Due " + formatDate(row.due_at, true) : title(row.assignment_type);
      top.append(titleEl, due);
      item.append(top);

      if (row.instructions) {
        const p = document.createElement("p");
        p.textContent = row.instructions;
        item.append(p);
      }

      const actions = document.createElement("div");
      actions.className = "rm114-item-actions";
      const state=document.createElement("span");
      state.className="rm183-assignment-status";
      state.textContent=title(row.status);
      actions.append(state);

      if(row.status==="assigned"){
        const start=document.createElement("button");
        start.type="button";
        start.textContent="Start Assignment";
        start.addEventListener("click",()=>updateAssignmentStatus(row,"in_progress"));
        actions.append(start);
      }

      const complete = document.createElement("button");
      complete.type = "button";
      complete.className = "primary";
      complete.textContent = "Mark Complete";
      complete.addEventListener("click", () => updateAssignmentStatus(row,"completed"));
      actions.append(complete);
      item.append(actions);
      list.append(item);
    });
  }

  function renderMetricOptions() {
    const select = el("rm-progress-metric");
    select.replaceChildren();
    metricCatalog.forEach((metric) => {
      const option = document.createElement("option");
      option.value = metric.metric_key;
      option.textContent = metric.label;
      select.append(option);
    });
    updateProgressUnit();
  }

  function updateProgressUnit() {
    const metric = metricCatalog.find((row) => row.metric_key === el("rm-progress-metric").value);
    el("rm-progress-unit").textContent = metric?.unit ? "Unit: " + metric.unit : "";
    const input = el("rm-progress-value");
    input.min = metric?.minimum_value ?? "";
    input.max = metric?.maximum_value ?? "";
  }

  function renderRecentProgress(rows) {
    const list = el("rm-recent-progress");
    list.replaceChildren();
    if (!rows.length) return;

    rows.slice(0,6).forEach((row) => {
      const item = document.createElement("div");
      item.className = "rm114-progress-row";
      const label = document.createElement("strong");
      label.textContent = row.label;
      const value = document.createElement("span");
      const raw = row.value_boolean !== null && row.value_boolean !== undefined
        ? (row.value_boolean ? "Yes" : "No")
        : row.value_numeric;
      value.textContent = raw + (row.unit ? " " + row.unit : "") + " · " + formatDate(row.recorded_at, true);
      item.append(label, value);
      list.append(item);
    });
  }

  async function renderCheckinForm() {
    const container = el("rm-checkin-fields");
    container.replaceChildren();

    if (!checkinTemplate || !checkinFields.length || !currentMember) {
      container.innerHTML = '<div class="rm112-empty">Your weekly check-in is being prepared.</div>';
      el("rm-checkin-submit").disabled = true;
      return;
    }

    const period = weekPeriod();
    const { data: existing, error } = await client
      .from("client_checkins")
      .select("id,status,submitted_at")
      .eq("contact_id", currentMember.contact_id)
      .eq("template_id", checkinTemplate.id)
      .eq("period_start", period.start)
      .maybeSingle();

    if (error) throw error;

    if (existing && existing.status !== "draft") {
      el("rm-checkin-state").textContent = "Submitted";
      el("rm-checkin-submit").disabled = true;
      container.innerHTML = '<div class="rm112-empty">Your check-in for this week has been submitted. Your coach can review it from their Work Desk.</div>';
      return;
    }

    el("rm-checkin-state").textContent = "Ready";
    el("rm-checkin-submit").disabled = false;

    checkinFields.forEach((field) => {
      const wrapper = document.createElement("label");
      const label = document.createElement("span");
      label.textContent = field.label + (field.required ? " *" : "");
      wrapper.append(label);

      if (field.field_type === "rating") {
        const rating = document.createElement("div");
        rating.className = "rm114-rating";
        const min = Number(field.minimum_value || 1);
        const max = Number(field.maximum_value || 10);
        for (let n=min;n<=max;n++) {
          const option = document.createElement("label");
          const input = document.createElement("input");
          input.type = "radio";
          input.name = "checkin_" + field.field_key;
          input.value = String(n);
          input.required = field.required;
          const span = document.createElement("span");
          span.textContent = String(n);
          option.append(input, span);
          rating.append(option);
        }
        wrapper.append(rating);
      } else if (field.field_type === "textarea") {
        const input = document.createElement("textarea");
        input.name = "checkin_" + field.field_key;
        input.rows = 3;
        input.required = field.required;
        wrapper.append(input);
      } else {
        const input = document.createElement("input");
        input.name = "checkin_" + field.field_key;
        input.type = field.field_type === "number" || field.field_type === "percent" ? "number" : "text";
        if (field.minimum_value !== null) input.min = field.minimum_value;
        if (field.maximum_value !== null) input.max = field.maximum_value;
        input.step = "0.1";
        input.required = field.required;
        wrapper.append(input);
      }

      if (field.help_text) {
        const help = document.createElement("small");
        help.textContent = field.help_text;
        wrapper.append(help);
      }

      container.append(wrapper);
    });
  }

  function weekPeriod() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const iso = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth()+1).padStart(2,"0");
      const d = String(date.getDate()).padStart(2,"0");
      return y + "-" + m + "-" + d;
    };
    return { start: iso(start), end: iso(end) };
  }

  async function markHabit(row) {
    const {error}=await client.rpc("check_in_my_habit",{
      p_habit_id:row.id,
      p_value:1,
      p_note:null,
      p_checkin_date:new Date().toISOString().slice(0,10)
    });
    if(error){
      window.alert("Could not log this habit: "+error.message);
      return;
    }
    await loadDashboard();
  }

  async function updateGoalStatus(row,status){
    const {error}=await client.rpc("update_my_goal_status",{p_goal_id:row.id,p_status:status});
    if(error){window.alert(error.message);return;}
    await loadDashboard();
  }

  async function updateHabitStatus(row,status){
    const {error}=await client.rpc("update_my_habit_status",{p_habit_id:row.id,p_status:status});
    if(error){window.alert(error.message);return;}
    await loadDashboard();
  }

  function openGoalModal(){
    el("rm-goal-form").reset();
    el("rm-goal-priority").value="2";
    showStatus(el("rm-goal-form-status"),"");
    el("rm-goal-modal").classList.remove("hidden");
    el("rm-goal-modal").setAttribute("aria-hidden","false");
    el("rm-goal-title").focus();
  }
  function closeGoalModal(){
    el("rm-goal-modal").classList.add("hidden");
    el("rm-goal-modal").setAttribute("aria-hidden","true");
  }
  async function createGoal(event){
    event.preventDefault();
    const status=el("rm-goal-form-status");
    showStatus(status,"Creating goal...");
    const value=el("rm-goal-target-value").value;
    const {error}=await client.rpc("create_my_goal",{
      p_title:el("rm-goal-title").value.trim(),
      p_description:el("rm-goal-description").value.trim()||null,
      p_target_value:value===""?null:Number(value),
      p_target_unit:el("rm-goal-target-unit").value.trim()||null,
      p_target_date:el("rm-goal-target-date").value||null,
      p_priority:Number(el("rm-goal-priority").value||2)
    });
    if(error){showStatus(status,error.message,"error");return;}
    showStatus(status,"Goal created.","success");
    await loadDashboard();
    window.setTimeout(closeGoalModal,450);
  }

  function openHabitModal(){
    el("rm-habit-form").reset();
    el("rm-habit-target").value="1";
    el("rm-habit-frequency").value="daily";
    el("rm-habit-category").value="general";
    el("rm-habit-start-date").value=new Date().toISOString().slice(0,10);
    showStatus(el("rm-habit-form-status"),"");
    el("rm-habit-modal").classList.remove("hidden");
    el("rm-habit-modal").setAttribute("aria-hidden","false");
    el("rm-habit-title").focus();
  }
  function closeHabitModal(){
    el("rm-habit-modal").classList.add("hidden");
    el("rm-habit-modal").setAttribute("aria-hidden","true");
  }
  async function createHabit(event){
    event.preventDefault();
    const status=el("rm-habit-form-status");
    showStatus(status,"Creating habit...");
    const {error}=await client.rpc("create_my_habit",{
      p_title:el("rm-habit-title").value.trim(),
      p_category:el("rm-habit-category").value,
      p_frequency:el("rm-habit-frequency").value,
      p_target_per_period:Number(el("rm-habit-target").value||1),
      p_unit:el("rm-habit-unit").value.trim()||null,
      p_starts_on:el("rm-habit-start-date").value||new Date().toISOString().slice(0,10)
    });
    if(error){showStatus(status,error.message,"error");return;}
    showStatus(status,"Habit created.","success");
    await loadDashboard();
    window.setTimeout(closeHabitModal,450);
  }

  async function updateAssignmentStatus(row,status){
    const {error}=await client.rpc("update_my_assignment",{
      p_assignment_id:row.id,
      p_status:status,
      p_member_note:null
    });
    if(error){
      window.alert(error.message||"Could not update this assignment.");
      return;
    }
    await loadDashboard();
  }


  function renderMealPlan(plan, meals, groceryRows) {
    const chip = el("rm-meal-plan-chip");
    const summary = el("rm-meal-plan-summary");
    const list = el("rm-upcoming-meals");
    const grocery = el("rm-grocery-list");
    list.replaceChildren();
    grocery.replaceChildren();

    if (!plan) {
      chip.textContent = "Not assigned";
      summary.className = "rm112-empty";
      summary.textContent = "Your ReVitalized nutrition plan will appear here once assigned.";
      return;
    }

    chip.textContent = title(plan.status);
    summary.className = "rm116-plan-summary";
    summary.replaceChildren();
    const heading=document.createElement("strong");
    heading.textContent=plan.title;
    const meta=document.createElement("span");
    meta.textContent=[plan.phase_name||"",plan.starts_on?"Started "+formatDate(plan.starts_on):""].filter(Boolean).join(" · ");
    summary.append(heading,meta);

    meals.forEach((row)=>{
      const item=document.createElement("div");
      item.className="rm116-meal-row";
      const top=document.createElement("div");
      top.className="rm116-row-top";
      const name=document.createElement("strong");
      name.textContent=row.title||"Planned meal";
      const slot=document.createElement("span");
      slot.textContent=title(row.meal_slot);
      top.append(name,slot);
      item.append(top);
      const when=document.createElement("small");
      when.textContent=formatDate(row.scheduled_date)+" · "+title(row.status);
      item.append(when);

      if(row.status==="planned"){
        const actions=document.createElement("div");
        actions.className="rm116-row-actions";
        const done=document.createElement("button");
        done.type="button";done.className="primary";done.textContent="Mark Complete";
        done.addEventListener("click",()=>completeMeal(row));
        actions.append(done);
        item.append(actions);
      }
      list.append(item);
    });

    if(groceryRows.length){
      const h=document.createElement("h3");
      h.textContent="Grocery List";
      grocery.append(h);
      groceryRows.forEach((row)=>{
        const line=document.createElement("label");
        line.className="rm116-grocery-item";
        const box=document.createElement("input");
        box.type="checkbox";box.checked=Boolean(row.checked);
        box.addEventListener("change",()=>toggleGrocery(row.item_id,box.checked));
        const text=document.createElement("span");
        const qty=row.quantity?String(row.quantity)+(row.unit?" "+row.unit:"")+" ":"";
        text.textContent=qty+row.item;
        line.append(box,text);
        grocery.append(line);
      });
    }
  }

  function renderFitnessPlan(plan, workouts) {
    const chip=el("rm-fitness-plan-chip");
    const summary=el("rm-fitness-plan-summary");
    const list=el("rm-upcoming-workouts");
    list.replaceChildren();

    if(!plan){
      chip.textContent="Not assigned";
      summary.className="rm112-empty";
      summary.textContent="Your ReVitalized fitness plan will appear here once assigned.";
      return;
    }

    chip.textContent=title(plan.status);
    summary.className="rm116-plan-summary";
    summary.replaceChildren();
    const heading=document.createElement("strong");
    heading.textContent=plan.title;
    const meta=document.createElement("span");
    meta.textContent=[title(plan.difficulty),title(plan.environment),plan.weeks?plan.weeks+" weeks":""].filter(Boolean).join(" · ");
    summary.append(heading,meta);

    workouts.forEach((row)=>{
      const item=document.createElement("div");
      item.className="rm116-workout-row";
      const top=document.createElement("div");
      top.className="rm116-row-top";
      const name=document.createElement("strong");
      name.textContent=row.title;
      const state=document.createElement("span");
      state.textContent=title(row.status);
      top.append(name,state);
      item.append(top);
      const metaEl=document.createElement("small");
      metaEl.textContent=[formatDate(row.scheduled_date),row.duration_minutes?row.duration_minutes+" min":"",title(row.environment)].filter(Boolean).join(" · ");
      item.append(metaEl);

      if(row.status==="assigned"){
        const actions=document.createElement("div");
        actions.className="rm116-row-actions";
        const done=document.createElement("button");
        done.type="button";done.className="primary";done.textContent="Complete Workout";
        done.addEventListener("click",()=>completeWorkout(row));
        actions.append(done);
        item.append(actions);
      }
      list.append(item);
    });
  }

  async function completeMeal(row){
    const {error}=await client.from("client_meal_plan_items").update({
      status:"completed",adherence_percent:100,completed_at:new Date().toISOString()
    }).eq("id",row.meal_item_id);
    if(error){window.alert("Could not complete meal: "+error.message);return;}
    await loadDashboard();
  }

  async function toggleGrocery(itemId,checked){
    const {error}=await client.from("grocery_list_items").update({checked}).eq("id",itemId);
    if(error) window.alert("Could not update grocery item: "+error.message);
  }

  async function completeWorkout(row){
    if(!currentMember)return;
    const duration=window.prompt("How many minutes did you spend on this workout?",row.duration_minutes||"");
    if(duration===null)return;
    const minutes=Number(duration);
    if(!Number.isFinite(minutes)||minutes<=0){window.alert("Enter a valid number of minutes.");return;}

    const effort=window.prompt("Optional: effort from 1-10?","");
    const effortValue=effort?Number(effort):null;
    const {data:{user}}=await client.auth.getUser();
    const {error}=await client.from("workout_completions").insert({
      assignment_id:row.workout_assignment_id,
      contact_id:currentMember.contact_id,
      completed_at:new Date().toISOString(),
      duration_minutes:Math.round(minutes),
      effort_rating:Number.isFinite(effortValue)?Math.max(1,Math.min(10,Math.round(effortValue))):null,
      source:"member",
      created_by:user?.id||null
    });
    if(error){window.alert("Could not complete workout: "+error.message);return;}
    await loadDashboard();
  }


  function renderAskReVitalized(questionTypes,requests,enabled){
    const card=el("rm-ask-revitalized-card");
    if(!card)return;
    card.classList.toggle("hidden",!enabled);
    if(!enabled)return;

    const select=el("rm-ask-type");
    const current=select.value;
    select.replaceChildren();
    (questionTypes||[]).forEach((row)=>{
      const option=document.createElement("option");
      option.value=row.question_type;
      option.textContent=row.label;
      option.dataset.mode=row.handling_mode||"";
      select.append(option);
    });
    if(current&&[...select.options].some(o=>o.value===current))select.value=current;

    const history=el("rm-ask-history");
    history.replaceChildren();
    const rows=requests||[];
    const open=rows.filter(r=>!["answered","resolved","cancelled"].includes(r.status)).length;
    el("rm-ask-summary").textContent=rows.length
      ? open+" Open · "+rows.filter(r=>["answered","resolved"].includes(r.status)).length+" Answered"
      : "No Questions Yet";
    el("rm-ask-status-chip").textContent=open?open+" Open":"Ready";

    if(!rows.length){
      const empty=document.createElement("div");
      empty.className="rm112-empty";
      empty.textContent="Your recent Ask ReVitalized questions will appear here.";
      history.append(empty);
      return;
    }

    rows.slice(0,8).forEach((row)=>{
      const item=document.createElement("article");
      item.className="rm169-ask-item";

      const top=document.createElement("div");
      top.className="rm169-ask-item-top";
      const label=document.createElement("strong");
      label.textContent=row.question_type_label||title(row.question_type);
      const state=document.createElement("span");
      state.className="rm112-chip";
      const statusLabel={
        queued:"Processing",
        retrieving:"Processing",
        draft_ready:"Reviewing",
        coach_review:"Coach Review",
        escalated:"Coach Review",
        answered:"Answered",
        resolved:"Resolved",
        cancelled:"Cancelled"
      }[row.status]||title(row.status);
      state.textContent=statusLabel;
      top.append(label,state);

      const question=document.createElement("p");
      question.textContent=row.question;

      item.append(top,question);

      if(row.final_answer){
        const answer=document.createElement("div");
        answer.className="rm169-ask-answer";
        const answerLabel=document.createElement("strong");
        answerLabel.textContent="ReVitalized Response";
        const answerText=document.createElement("p");
        answerText.textContent=row.final_answer;
        answer.append(answerLabel,answerText);
        item.append(answer);
      }else{
        const note=document.createElement("small");
        note.textContent=row.status==="coach_review"||row.status==="escalated"
          ?"Your coaching team is reviewing this question."
          :"Your question is being processed.";
        item.append(note);
      }

      const meta=document.createElement("small");
      meta.textContent=[
        row.assigned_coach_name?"Coach: "+row.assigned_coach_name:null,
        row.created_at?formatDate(row.created_at,true):null
      ].filter(Boolean).join(" · ");
      item.append(meta);
      history.append(item);
    });
  }

  async function submitAskReVitalized(event){
    event.preventDefault();
    const status=el("rm-ask-form-status");
    const type=el("rm-ask-type").value;
    const question=el("rm-ask-question").value.trim();
    if(!type||question.length<2){
      showStatus(status,"Choose a category and enter your question.","error");
      return;
    }

    showStatus(status,"Sending your question...");
    const {error}=await client.rpc("submit_my_companion_question",{
      p_question_type:type,
      p_question:question
    });
    if(error){
      showStatus(status,error.message||"Your question could not be submitted.","error");
      return;
    }

    el("rm-ask-question").value="";
    showStatus(status,"Question submitted.","success");
    await loadDashboard();
  }

  async function saveMemberProfile(event){
    event.preventDefault();
    const status=el("rm-member-profile-status");
    const first=el("rm-profile-first").value.trim();
    const last=el("rm-profile-last").value.trim();
    const email=el("rm-profile-email").value.trim().toLowerCase();
    const phone=el("rm-profile-phone").value.trim();
    const city=el("rm-profile-city").value.trim();
    const state=el("rm-profile-state").value.trim();
    const country=el("rm-profile-country").value.trim();
    if(!first||!email){showStatus(status,"First name and email are required.","error");return;}

    showStatus(status,"Saving your profile...");
    const {error:profileError}=await client.rpc("update_my_member_profile",{
      p_first_name:first,p_last_name:last||null,p_phone:phone||null,
      p_city:city||null,p_state:state||null,p_country:country||null
    });
    if(profileError){showStatus(status,profileError.message,"error");return;}

    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError){showStatus(status,userError.message,"error");return;}

    let emailChanged=false;
    if(user?.email&&user.email.toLowerCase()!==email){
      const {error:emailError}=await client.auth.updateUser({email});
      if(emailError){showStatus(status,emailError.message,"error");return;}
      emailChanged=true;
    }

    if(!emailChanged) await client.rpc("sync_my_member_email");
    el("rm-member-name").textContent=[first,last].filter(Boolean).join(" ");
    el("rm-first-name").textContent=first;
    showStatus(status,emailChanged
      ?"Profile saved. Check your email to confirm the new sign-in address."
      :"Profile saved.","success");
    await loadDashboard();
  }

  async function saveMemberPassword(event){
    event.preventDefault();
    const status=el("rm-member-password-status");
    const password=el("rm-member-new-password").value;
    const confirm=el("rm-member-confirm-password").value;
    if(password.length<10){showStatus(status,"Use at least 10 characters.","error");return;}
    if(password!==confirm){showStatus(status,"The passwords do not match.","error");return;}
    showStatus(status,"Saving your new password...");
    const {error}=await client.auth.updateUser({password});
    if(error){showStatus(status,error.message,"error");return;}
    el("rm-member-new-password").value="";
    el("rm-member-confirm-password").value="";
    showStatus(status,"Password updated successfully.","success");
    window.setTimeout(()=>{
      el("rm-member-password-form").classList.add("hidden");
      el("rm-member-profile-form").classList.remove("hidden");
    },700);
  }

  function renderAttentionCenter(context){
    const list=el("rm-attention-list");list.replaceChildren();
    const items=[];
    const agreements=(context.agreements||[]).filter(r=>!["signed","waived"].includes(r.status));
    const unread=(context.conversations||[]).reduce((sum,r)=>sum+Number(r.unread_count||0),0);
    const overdue=Number(context.assignmentSummary?.overdue_count||0);
    const family=(context.familyRequests||[]).filter(r=>["submitted","in_review"].includes(r.status)).length;
    const billing=context.billing||null;
    const unreadNotifications=(context.notifications||[]).filter(r=>r.status==="unread").length;

    if(agreements.length)items.push({title:"Agreement Action Needed",detail:agreements.length+" agreement"+(agreements.length===1?"":"s")+" waiting for your review or signature.",target:".rm139-agreements-card",urgent:true});
    if(billing&&(billing.status==="past_due"||Number(billing.failed_payment_count||0)>0))items.push({title:"Billing Needs Attention",detail:"There is a billing item that needs to be reviewed.",target:"#rm-billing-card",urgent:true});
    if(overdue)items.push({title:"Overdue Coach Assignment",detail:overdue+" assignment"+(overdue===1?" is":"s are")+" overdue.",target:"#rm-assignments",urgent:true});
    if(unread)items.push({title:"Unread Coaching Messages",detail:unread+" unread message"+(unread===1?"":"s")+" from your ReVitalized conversations.",target:".rm120-message-grid"});
    if(family)items.push({title:"Family Hub Request",detail:family+" household request"+(family===1?" is":"s are")+" currently being reviewed.",target:"#rm-family-hub-card"});
    if(unreadNotifications)items.push({title:"New Notifications",detail:unreadNotifications+" notification"+(unreadNotifications===1?"":"s")+" need your attention.",target:".rm120-message-grid"});

    el("rm-attention-count").textContent=items.length+" Item"+(items.length===1?"":"s");
    if(!items.length){
      list.innerHTML='<div class="rm187-attention-clear">You are caught up. No urgent member actions are waiting right now.</div>';
      return;
    }
    items.slice(0,6).forEach(entry=>{
      const button=document.createElement("button");button.type="button";button.className="rm187-attention-item"+(entry.urgent?" urgent":"");
      button.dataset.memberJump=entry.target;
      const dot=document.createElement("span");dot.className="dot";
      const copy=document.createElement("div");
      const h=document.createElement("strong");h.textContent=entry.title;
      const p=document.createElement("span");p.textContent=entry.detail;
      copy.append(h,p);
      const open=document.createElement("b");open.textContent="Open →";
      button.append(dot,copy,open);list.append(button);
    });
  }

  function renderProgramHub(access){
    const target=el("rm-program-hub");target.replaceChildren();
    const features=[
      ["Coaching",Boolean(access?.private_coaching_enabled||access?.group_coaching_enabled),".rm183-coaching-hub-card","Sessions, assignments and direct coaching support"],
      ["Community",Boolean(access?.community_enabled),".rm126-community-card","Member spaces, encouragement and shared wins"],
      ["Courses",Boolean(access?.courses_enabled),".rm185-learning-progress-card","Courses, lessons and learning progress"],
      ["Nutrition",Boolean(access?.nutrition_enabled),".rm116-wellness-grid","Meal plans, meals and grocery support"],
      ["Fitness",Boolean(access?.fitness_enabled),".rm116-wellness-grid","Workout plans and fitness assignments"],
      ["Challenges",Boolean(access?.challenges_enabled),".rm124-challenges-card","Accountability challenges and points"],
      ["Ask ReVitalized",Boolean(access?.ask_revitalized_enabled),"#rm-ask-revitalized-card","Program guidance and coaching escalation"],
      ["Family Hub",Boolean(access?.family_hub_enabled),"#rm-family-hub-card","Household profiles and family requests"],
      ["ReFuel",Boolean(access?.refuel_enabled),"#rm-refuel-card","Your ReFuel program access"],
      ["Ambassador Center",Boolean(access?.ambassador_center_enabled),"#rm-referral-card","Referrals, impact and rewards"],
      ["Biometrics",Boolean(access?.biometrics_enabled),".rm123-health-card","Connected health and wearable progress"]
    ].filter(item=>item[1]);

    el("rm-program-hub-count").textContent=features.length+" Feature"+(features.length===1?"":"s");
    if(!features.length){
      target.innerHTML='<div class="rm112-empty">Your active program features will appear here as access is activated.</div>';
      return;
    }
    features.forEach(([name,_enabled,selector,detail])=>{
      const card=document.createElement("button");card.type="button";card.className="rm187-program-feature";card.dataset.memberJump=selector;
      const tag=document.createElement("span");tag.textContent="Included";
      const h=document.createElement("strong");h.textContent=name;
      const p=document.createElement("small");p.textContent=detail;
      card.append(tag,h,p);target.append(card);
    });
  }

  function renderMembershipOverview(row){
    const target=el("rm-membership-overview");target.replaceChildren();
    if(!row){
      target.innerHTML='<div class="rm112-empty">Membership details are still being prepared.</div>';
      return;
    }
    el("rm-membership-overview-status").textContent=title(row.membership_status||row.access_status||"active");
    const amount=row.amount_cents!==null&&row.amount_cents!==undefined
      ?moneyFromCents(row.amount_cents,row.currency)
      :"Personalized";
    const items=[
      ["Program",row.program_name||"ReVitalized"],
      ["Program Type",title(row.program_type||"membership")],
      ["Billing",row.billing_choice?title(row.billing_choice):amount],
      ["Active Benefits",row.active_entitlements||0],
      ["Learning",String(Number(row.course_count||0))+" Courses · "+String(Number(row.resource_count||0))+" Resources"]
    ];
    items.forEach(([label,value])=>{
      const card=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const v=document.createElement("strong");v.textContent=String(value);
      card.append(s,v);target.append(card);
    });
  }

  function renderJourneyMilestones(row){
    const target=el("rm-journey-milestones");target.replaceChildren();
    if(!row){
      target.innerHTML='<div class="rm112-empty">Your journey milestones will appear as your ReVitalized path progresses.</div>';
      return;
    }
    el("rm-journey-stage-chip").textContent=title(row.lifecycle_stage||"active");
    const milestones=[
      ["Vitality Assessment",row.vitality_status,row.vitality_completion],
      ["Enrollment",row.enrollment_status,row.enrollment_completion],
      ["Webinar",row.webinar_status,row.webinar_status==="attended"?100:(row.webinar_status?50:0)],
      ["Membership",row.lifecycle_stage==="active_client"||row.lifecycle_stage==="member"?"complete":row.lifecycle_stage,row.lifecycle_stage==="active_client"||row.lifecycle_stage==="member"?100:50]
    ];
    milestones.forEach(([label,state,progress])=>{
      const pct=Math.max(0,Math.min(100,Number(progress||0)));
      const card=document.createElement("div");
      card.className="rm188-milestone "+(pct>=100?"complete":pct>0?"in-progress":"");
      const h=document.createElement("strong");h.textContent=label;
      const s=document.createElement("span");s.textContent=state?title(state):"Not Started";
      const b=document.createElement("b");b.textContent=pct+"%";
      card.append(h,s,b);target.append(card);
    });
  }

  function renderFamilyHubSummary(row){
    const target=el("rm-family-summary");target.replaceChildren();
    if(!row){return;}
    const items=[
      ["Active Members",row.active_members||0],
      ["Additional Members",row.additional_members||0],
      ["Children / Minors",row.minors||0],
      ["Family Goals",row.active_family_goals||0]
    ];
    items.forEach(([label,value])=>{
      const card=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const v=document.createElement("strong");v.textContent=String(value);
      card.append(s,v);target.append(card);
    });
  }

  function renderCompanionSummary(row){
    const target=el("rm-ask-activity-summary");target.replaceChildren();
    if(!row){
      target.innerHTML='<div class="rm112-empty">Ask ReVitalized activity will appear here after your first question.</div>';
      return;
    }
    const items=[
      ["Questions",row.total_questions||0],
      ["Processing",row.processing_count||0],
      ["Coach Review",row.coach_review_count||0],
      ["Answered",row.answered_count||0]
    ];
    items.forEach(([label,value])=>{
      const card=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const v=document.createElement("strong");v.textContent=String(value);
      card.append(s,v);target.append(card);
    });
  }

  function renderAppHome(row){
    const metrics=el("rm-app-home-metrics");
    const focus=el("rm-app-home-focus");
    metrics.replaceChildren();focus.replaceChildren();
    const items=[
      ["Active Goals",row?.active_goals||0],
      ["Active Habits",row?.active_habits||0],
      ["Challenges",row?.active_challenges||0],
      ["Active Courses",row?.active_courses||0],
      ["Course Progress",(row?.average_course_progress||0)+"%"]
    ];
    items.forEach(([label,value])=>{
      const card=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const v=document.createElement("strong");v.textContent=String(value);
      card.append(s,v);metrics.append(card);
    });
    el("rm-home-notification-chip").textContent=String(Number(row?.unread_notifications||0))+" Notifications";

    const focusItems=[
      ["Continue Course",row?.continue_course_title,".rm185-learning-progress-card"],
      ["Next Workout",row?.next_workout_title,".rm116-wellness-grid"],
      ["Next Meal",row?.next_meal_title,".rm116-wellness-grid"]
    ];
    focusItems.forEach(([label,value,target])=>{
      if(!value)return;
      const button=document.createElement("button");button.type="button";
      button.dataset.memberJump=target;
      const s=document.createElement("span");s.textContent=label;
      const v=document.createElement("strong");v.textContent=value;
      button.append(s,v);focus.append(button);
    });
    if(!focus.children.length){
      focus.innerHTML='<div class="rm112-empty">Your next course, meal and workout priorities will appear here as they are assigned.</div>';
    }
  }

  function renderProgressSnapshot(row){
    const target=el("rm-progress-snapshot");target.replaceChildren();
    const items=[
      ["Active Goals",row?.active_goals||0],
      ["Goals Completed",row?.completed_goals||0],
      ["Habit Check-Ins · 7 Days",row?.habit_checkins_last_7_days||0],
      ["Active Challenges",row?.active_challenges||0],
      ["Challenge Points",row?.challenge_points||0],
      ["Workouts · 30 Days",row?.workouts_completed_30d||0],
      ["Meals · 30 Days",row?.meals_completed_30d||0],
      ["Meal Adherence",row?.meal_adherence_30d!==null&&row?.meal_adherence_30d!==undefined?Math.round(Number(row.meal_adherence_30d))+"%":"—"]
    ];
    items.forEach(([label,value])=>{
      const card=document.createElement("div");
      const s=document.createElement("span");s.textContent=label;
      const v=document.createElement("strong");v.textContent=String(value);
      card.append(s,v);target.append(card);
    });
    el("rm-progress-last-updated").textContent=row?.last_progress_at
      ?"Updated "+formatDate(row.last_progress_at,true)
      :"Progress Ready";
  }

  function openSessionPrep(row){
    activeSessionPrep=row;
    el("rm-session-prep-title").textContent="Prepare for Session "+(row.session_number||"");
    el("rm-session-prep-meta").textContent=[
      row.coach_name?"With "+row.coach_name:null,
      row.scheduled_start?formatDate(row.scheduled_start,true):null,
      row.format?title(row.format):null
    ].filter(Boolean).join(" · ");
    el("rm-session-agenda").value=row.client_agenda||"";
    showStatus(el("rm-session-prep-status"),"");
    el("rm-session-prep-modal").classList.remove("hidden");
    el("rm-session-prep-modal").setAttribute("aria-hidden","false");
    el("rm-session-agenda").focus();
  }

  function closeSessionPrep(){
    activeSessionPrep=null;
    el("rm-session-prep-modal").classList.add("hidden");
    el("rm-session-prep-modal").setAttribute("aria-hidden","true");
    showStatus(el("rm-session-prep-status"),"");
  }

  async function saveSessionPrep(event){
    event.preventDefault();
    if(!activeSessionPrep)return;
    const status=el("rm-session-prep-status");
    showStatus(status,"Saving your session agenda...");
    const {data,error}=await client.rpc("update_my_session_agenda",{
      p_session_id:activeSessionPrep.session_id,
      p_client_agenda:el("rm-session-agenda").value.trim()||null
    });
    if(error||data!==true){
      showStatus(status,error?.message||"Your session agenda could not be saved.","error");
      return;
    }
    showStatus(status,"Session agenda saved for your coach.","success");
    await loadDashboard();
    window.setTimeout(closeSessionPrep,500);
  }

  function renderSessionHistory(rows){
    const target=el("rm-session-history");target.replaceChildren();
    el("rm-session-history-count").textContent=rows.length+" Sessions";
    if(!rows.length){
      target.innerHTML='<div class="rm112-empty">Your coaching session history will appear here.</div>';
      return;
    }
    rows.forEach(row=>{
      const item=document.createElement("div");item.className="rm185-session-row";
      const main=document.createElement("div");
      const titleEl=document.createElement("strong");
      titleEl.textContent="Session "+(row.session_number||"")+" · "+(row.coach_name||"ReVitalized Coach");
      const meta=document.createElement("span");
      meta.textContent=[row.scheduled_start?formatDate(row.scheduled_start,true):null,row.format?title(row.format):null].filter(Boolean).join(" · ");
      main.append(titleEl,meta);
      const state=document.createElement("span");state.textContent=title(row.status||"scheduled");
      const action=document.createElement("div");action.className="rm187-session-row-actions";
      if(["scheduled","confirmed","requested"].includes(row.status)){
        const prep=document.createElement("button");prep.type="button";prep.textContent=row.client_agenda?"Edit Agenda":"Prepare";
        prep.addEventListener("click",()=>openSessionPrep(row));action.append(prep);
      }
      if(row.location_url&&["scheduled","confirmed"].includes(row.status)){
        const link=document.createElement("a");link.href=row.location_url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Join Session";action.append(link);
      }
      item.append(main,state,action);target.append(item);
    });
  }

  function renderCourseProgress(rows){
    const target=el("rm-learning-progress");target.replaceChildren();
    const active=rows.filter(r=>r.status!=="completed");
    el("rm-learning-progress-chip").textContent=active.length+" Active";
    if(!rows.length){
      target.innerHTML='<div class="rm112-empty">Your course progress will appear here when learning is assigned.</div>';
      return;
    }
    rows.forEach(row=>{
      const item=document.createElement("div");item.className="rm185-learning-row";
      const main=document.createElement("div");
      const titleEl=document.createElement("strong");titleEl.textContent=row.course_title||"ReVitalized Course";
      const meta=document.createElement("span");
      meta.textContent=String(row.completed_lessons||0)+" of "+String(row.required_lessons||0)+" required lessons completed";
      main.append(titleEl,meta);
      const progress=document.createElement("div");progress.className="rm185-learning-meta";
      const label=document.createElement("span");label.textContent=String(row.progress_percent||0)+"%";
      const bar=document.createElement("div");bar.className="rm185-learning-progressbar";
      const fill=document.createElement("i");fill.style.width=Math.max(0,Math.min(100,Number(row.progress_percent||0)))+"%";bar.append(fill);
      progress.append(label,bar);
      const state=document.createElement("span");state.textContent=title(row.status||"active");
      item.append(main,progress,state);target.append(item);
    });
  }

  function applyMemberAccess(access){
    const rules=[
      ['[data-member-jump=".rm116-wellness-grid"]',Boolean(access?.nutrition_enabled||access?.fitness_enabled)],
      ['[data-member-jump=".rm119-learning-grid"]',Boolean(access?.courses_enabled)],
      ['[data-member-jump=".rm126-community-card"]',Boolean(access?.community_enabled)],
      ['[data-member-jump="#rm-ask-revitalized-card"]',Boolean(access?.ask_revitalized_enabled)],
      ['[data-member-jump="#rm-family-hub-card"]',Boolean(access?.family_hub_enabled)],
      ['[data-member-jump="#rm-refuel-card"]',Boolean(access?.refuel_enabled)],
      ['[data-member-jump="#rm-referral-card"]',Boolean(access?.ambassador_center_enabled)]
    ];
    rules.forEach(([selector,allowed])=>{
      document.querySelectorAll(selector).forEach(node=>node.classList.toggle("rm185-feature-hidden",!allowed));
    });
  }

  async function loadDashboard() {
    const [
      bootstrapResult,
      dashboardResult,
      entitlementsResult,
      householdResult,
      journeyResult,
      goalsResult,
      habitsResult,
      assignmentsResult,
      progressResult,
      metricsResult,
      templateResult,
      mealPlanResult,
      mealsResult,
      fitnessPlanResult,
      workoutsResult,
      groceryResult,
      coursesResult,
      resourcesResult,
      healthConnectionsResult,
      challengesResult,
      communitySpacesResult,
      communityFeedResult,
      refuelResult,
      documentsResult,
      coachingEntitlementsResult,
      companionTypesResult,
      companionRequestsResult
    ] = await Promise.all([
      client.from("my_app_bootstrap_v2").select("*").single(),
      client.from("my_member_dashboard").select("*").maybeSingle(),
      client.from("my_member_entitlements").select("*").order("label"),
      client.from("my_household").select("*").order("is_primary",{ascending:false}),
      client.from("my_member_journey").select("*").maybeSingle(),
      client.from("my_goals").select("*"),
      client.from("my_habits").select("*"),
      client.from("my_client_assignments").select("*"),
      client.from("my_recent_progress").select("*").limit(8),
      client.from("progress_metric_catalog").select("*").eq("active",true).eq("member_trackable",true).order("display_order"),
      client.from("checkin_templates").select("*").eq("template_key","weekly-revitalized-checkin").eq("active",true).maybeSingle(),
      client.from("my_active_meal_plan").select("*").maybeSingle(),
      client.from("my_upcoming_meals").select("*"),
      client.from("my_active_fitness_plan").select("*").maybeSingle(),
      client.from("my_upcoming_workouts").select("*"),
      client.from("my_grocery_list").select("*"),
      client.from("my_courses").select("*"),
      client.from("my_resources").select("*"),
      client.from("my_health_connections").select("*").order("provider_name"),
      client.from("my_challenges").select("*"),
      client.from("my_community_spaces").select("*"),
      client.from("my_community_feed").select("*"),
      client.from("my_refuel_access").select("*").limit(1).maybeSingle(),
      client.from("my_documents").select("*"),
      client.from("my_coaching_entitlements").select("*"),
      client.from("my_companion_question_types").select("*").order("sort_order"),
      client.from("my_companion_requests").select("*").limit(20)
    ]);

    const failed=[
      bootstrapResult,dashboardResult,entitlementsResult,householdResult,journeyResult,goalsResult,habitsResult,
      assignmentsResult,progressResult,metricsResult,templateResult,mealPlanResult,mealsResult,fitnessPlanResult,
      workoutsResult,groceryResult,coursesResult,resourcesResult,healthConnectionsResult,challengesResult,
      communitySpacesResult,communityFeedResult,refuelResult,documentsResult,coachingEntitlementsResult,
      companionTypesResult,companionRequestsResult
    ].find((r)=>r.error);
    if(failed?.error) throw failed.error;

    const boot=bootstrapResult.data||{};
    const packed=(data)=>({data:data??null,error:null});
    const packedList=(data)=>({data:Array.isArray(data)?data:[],error:null});

    const appointmentResult=packed(boot.upcoming_appointment);
    const coachResult=packed(boot.coach);
    const conversationsResult=packedList(boot.message_threads);
    const notificationsResult=packedList(boot.recent_notifications);
    const notificationPrefsResult=packed(boot.notification_preferences);
    const ambassadorResult=packed(boot.ambassador);
    const referralActivityResult=packedList(boot.referral_activity);
    const coachingRequestsResult=packedList(boot.coaching_requests);
    const assignmentSummaryResult=packed(boot.assignment_summary);
    const coachingHubResult=packed(boot.coaching_hub);
    const billingResult=packed(boot.billing);
    const agreementsResult=packedList(boot.agreements);
    const dailyActionsResult=packed(boot.daily_actions);
    const weeklySummaryResult=packed(boot.weekly_summary);
    const activityTimelineResult=packedList(boot.activity_timeline);
    const familyRequestsResult=packedList(boot.family_requests);
    const memberProfileResult=packed(boot.member_profile);
    const appHomeResult=packed(boot.home);
    const appAccessResult=packed(boot.access);
    const progressSnapshotResult=packed(boot.progress_snapshot);
    const coachingSessionsResult=packedList(boot.coaching_sessions);
    const courseProgressResult=packedList(boot.course_progress);
    const invoicesResult=packedList(boot.invoices);
    const paymentHistoryResult=packedList(boot.payment_history);
    const journeyStatusResult=packed(boot.journey_status);
    const familyHubSummaryResult=packed(boot.family_hub);
    const companionSummaryResult=packed(boot.companion_summary);
    const membershipOverviewResult=packed(boot.membership_overview);

    const member = dashboardResult.data;
    currentMember = member || null;
    if (!member || member.access_status !== "active") {
      showOnly("rm-denied");
      return;
    }

    el("rm-member-name").textContent = [member.first_name,member.last_name].filter(Boolean).join(" ");
    el("rm-first-name").textContent = member.first_name || "there";
    el("rm-program-name").textContent = member.program_name || "ReVitalized Academy";
    el("rm-membership-status").textContent =
      title(member.membership_status || "active") +
      (member.commitment_ends_at ? " · Initial commitment through " + formatDate(member.commitment_ends_at) : "");
    el("rm-program-copy").textContent =
      "Your " + (member.program_name || "ReVitalized") + " membership, household access and next steps are connected here.";

    const profile=memberProfileResult.data||member;
    el("rm-profile-first").value=profile?.first_name||"";
    el("rm-profile-last").value=profile?.last_name||"";
    el("rm-profile-email").value=profile?.email||member.email||"";
    el("rm-profile-phone").value=profile?.phone||"";
    el("rm-profile-city").value=profile?.city||"";
    el("rm-profile-state").value=profile?.state||"";
    el("rm-profile-country").value=profile?.country||"";
    el("rm-account-email-state").textContent="Current Email";
    renderAppHome(appHomeResult.data||null);
    applyMemberAccess(appAccessResult.data||null);
    renderProgressSnapshot(progressSnapshotResult.data||null);
    renderSessionHistory(coachingSessionsResult.data||[]);
    renderCourseProgress(courseProgressResult.data||[]);
    renderCoachingRequests(coachingRequestsResult.data||[]);
    renderCoachingHub(assignmentSummaryResult.data||null,coachingHubResult.data||null);
    renderCoachingEntitlements(coachingEntitlementsResult.data||[]);
    renderAgreements(agreementsResult.data||[]);
    renderBilling(billingResult.data||null,invoicesResult.data||[],paymentHistoryResult.data||[]);
    renderDocuments(documentsResult.data||[]);
    renderReferralSummary(ambassadorResult.data||null,referralActivityResult.data||[]);
    renderRefuel(refuelResult.data||null);
    renderCommunity(communitySpacesResult.data||[],communityFeedResult.data||[]);
    renderChallenges(challengesResult.data||[]);
    renderHealthConnections(healthConnectionsResult.data||[]);
    renderNotificationPreferences(notificationPrefsResult.data||null);
    renderConversations(conversationsResult.data||[]);
    renderNotifications(notificationsResult.data||[]);
    renderCourses(coursesResult.data||[]);
    renderResources(resourcesResult.data||[]);
    renderMealPlan(mealPlanResult.data||null,mealsResult.data||[],groceryResult.data||[]);
    renderFitnessPlan(fitnessPlanResult.data||null,workoutsResult.data||[]);
    renderMembershipOverview(membershipOverviewResult.data||null);
    renderJourneyMilestones(journeyStatusResult.data||null);
    renderFamilyHubSummary(familyHubSummaryResult.data||null);
    renderCompanionSummary(companionSummaryResult.data||null);
    renderProgramHub(appAccessResult.data||null);
    renderAttentionCenter({
      agreements:agreementsResult.data||[],
      conversations:conversationsResult.data||[],
      assignmentSummary:assignmentSummaryResult.data||null,
      familyRequests:familyRequestsResult.data||[],
      billing:billingResult.data||null,
      notifications:notificationsResult.data||[]
    });

    const journey = journeyResult.data;
    if (journey) {
      el("rm-progress-chip").textContent = Number(journey.progress_percent || 0) + "%";
      el("rm-progress-bar").style.width = Math.max(0,Math.min(100,Number(journey.progress_percent || 0))) + "%";
      el("rm-next-step").textContent = journey.current_step_name || "Journey complete";
      el("rm-next-due").textContent = journey.current_step_due_at
        ? "Due " + formatDate(journey.current_step_due_at, true)
        : title(journey.journey_status);
      el("rm-continue-journey").disabled = false;
    } else {
      el("rm-progress-chip").textContent = "Complete";
      el("rm-progress-bar").style.width = "100%";
      el("rm-next-step").textContent = "Your current onboarding journey is complete.";
      el("rm-next-due").textContent = "";
      el("rm-continue-journey").disabled = true;
    }

    renderAppointment(appointmentResult.data);
    const activeEntitlements=entitlementsResult.data||[];
    const hasFamilyHub=activeEntitlements.some((row)=>row.entitlement_key==="family_profiles"&&row.status==="active");
    renderEntitlements(activeEntitlements);
    renderHousehold(householdResult.data || [], member.household_type,hasFamilyHub);
    renderFamilyRequests(familyRequestsResult.data||[]);
    renderDailyActions(dailyActionsResult.data||null);
    renderWeeklySummary(weeklySummaryResult.data||null);
    renderActivityTimeline(activityTimelineResult.data||[]);
    renderCoach(coachResult.data);
    renderGoals(goalsResult.data || []);
    renderHabits(habitsResult.data || []);
    renderAssignments(assignmentsResult.data || []);
    const askEnabled=(entitlementsResult.data||[]).some((row)=>row.entitlement_key==="ai_advisor"&&row.status==="active");
    renderAskReVitalized(companionTypesResult.data||[],companionRequestsResult.data||[],askEnabled);
    metricCatalog = metricsResult.data || [];
    renderMetricOptions();
    renderRecentProgress(progressResult.data || []);

    checkinTemplate = templateResult.data || null;
    checkinFields = [];
    if (checkinTemplate?.id) {
      const { data: fields, error: fieldError } = await client
        .from("checkin_template_fields")
        .select("*")
        .eq("template_id", checkinTemplate.id)
        .order("display_order");
      if (fieldError) throw fieldError;
      checkinFields = fields || [];
    }
    await renderCheckinForm();

    showOnly("rm-dashboard");
  }

  async function resolveSession() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      showOnly("rm-auth");
      return;
    }

    try {
      await loadDashboard();
    } catch (error) {
      showOnly("rm-denied");
      console.error(error);
    }
  }

  el("rm-login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = el("rm-login-status");
    showStatus(status, "Signing in...");

    const { error } = await client.auth.signInWithPassword({
      email: el("rm-email").value.trim(),
      password: el("rm-password").value
    });

    if (error) {
      showStatus(status, "We could not sign you in with that email and password.", "error");
      return;
    }

    showStatus(status, "Signed in.", "success");
    await resolveSession();
  });

  async function signOut() {
    await client.auth.signOut();
    showOnly("rm-auth");
    el("rm-password").value = "";
  }



  el("rm-community-new-post").addEventListener("click",openCommunityPost);
  el("rm-community-post-form").addEventListener("submit",publishCommunityPost);
  el("rm-community-comment-form").addEventListener("submit",addCommunityComment);
  document.querySelectorAll("[data-community-post-close]").forEach((node)=>node.addEventListener("click",closeCommunityPost));
  document.querySelectorAll("[data-community-thread-close]").forEach((node)=>node.addEventListener("click",closeCommunityThread));

  el("rm-ask-form").addEventListener("submit",submitAskReVitalized);

  el("rm-notification-form").addEventListener("submit",saveNotificationPreferences);
  el("rm-notifications-mark-all").addEventListener("click",markAllNotificationsRead);

  el("rm-message-form").addEventListener("submit",async(event)=>{
    event.preventDefault();
    if(!activeConversationId||!currentMember)return;
    const body=el("rm-message-body").value.trim();
    if(!body)return;

    const status=el("rm-message-status");
    showStatus(status,"Sending...");
    const {data:{user}}=await client.auth.getUser();
    const {data:message,error}=await client.from("member_messages").insert({
      conversation_id:activeConversationId,
      sender_user_id:user.id,
      sender_contact_id:currentMember.contact_id,
      body,
      message_type:"text"
    }).select("id").single();

    if(error){
      showStatus(status,error.message,"error");
      return;
    }

    const file=el("rm-message-file").files?.[0]||null;
    if(file){
      try{
        showStatus(status,"Uploading attachment...");
        await uploadMessageAttachment(activeConversationId,message.id,file);
      }catch(uploadError){
        showStatus(status,"Message sent, but attachment failed: "+uploadError.message,"error");
        return;
      }
    }

    el("rm-message-body").value="";
    el("rm-message-file").value="";
    showStatus(status,"Sent.","success");
    const conversation={conversation_id:activeConversationId,title:el("rm-message-title").textContent};
    await openConversation(conversation);
    await loadDashboard();
  });

  document.querySelectorAll("[data-message-close]").forEach((node)=>node.addEventListener("click",closeConversation));

  document.querySelectorAll("[data-course-close]").forEach((node) => node.addEventListener("click", closeCourse));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el("rm-course-modal").classList.contains("hidden")) closeCourse();
    if (event.key === "Escape" && !el("rm-message-modal").classList.contains("hidden")) closeConversation();
  });

  el("rm-agreement-sign-form").addEventListener("submit",signAgreement);
  el("rm-agreement-decline").addEventListener("click",declineAgreement);
  document.querySelectorAll("[data-agreement-close]").forEach((n)=>n.addEventListener("click",closeAgreement));

  el("rm-document-upload-button").addEventListener("click",openDocumentUpload);
  el("rm-document-upload-form").addEventListener("submit",uploadMemberDocument);
  document.querySelectorAll("[data-document-upload-close]").forEach((n)=>n.addEventListener("click",closeDocumentUpload));

  el("rm-referral-copy").addEventListener("click",copyReferralLink);
  el("rm-referral-copy-message").addEventListener("click",copyReferralMessage);
  el("rm-coaching-request-form").addEventListener("submit",submitCoachingRequest);

  el("rm-family-add").addEventListener("click",()=>openFamilyRequest());
  el("rm-family-form").addEventListener("submit",submitFamilyRequest);
  el("rm-family-remove").addEventListener("click",requestFamilyRemoval);
  document.querySelectorAll("[data-family-close]").forEach((node)=>node.addEventListener("click",closeFamilyRequest));
  el("rm-session-prep-form").addEventListener("submit",saveSessionPrep);
  document.querySelectorAll("[data-session-prep-close]").forEach((node)=>node.addEventListener("click",closeSessionPrep));

  function jumpToMemberSection(selector){
    const target=document.querySelector(selector);
    if(!target||target.classList.contains("hidden"))return;
    target.scrollIntoView({behavior:"smooth",block:"start"});
    document.querySelectorAll(".rm183-member-nav [data-member-jump]").forEach((button)=>{
      button.classList.toggle("active",button.dataset.memberJump===selector);
    });
  }

  document.addEventListener("click",(event)=>{
    const button=event.target.closest("[data-member-jump]");
    if(!button)return;
    event.preventDefault();
    jumpToMemberSection(button.dataset.memberJump);
  });

  el("rm-add-goal").addEventListener("click",openGoalModal);
  el("rm-goal-form").addEventListener("submit",createGoal);
  document.querySelectorAll("[data-goal-close]").forEach((node)=>node.addEventListener("click",closeGoalModal));

  el("rm-add-habit").addEventListener("click",openHabitModal);
  el("rm-habit-form").addEventListener("submit",createHabit);
  document.querySelectorAll("[data-habit-close]").forEach((node)=>node.addEventListener("click",closeHabitModal));

  el("rm-member-profile-form").addEventListener("submit",saveMemberProfile);
  el("rm-member-change-password").addEventListener("click",()=>{
    el("rm-member-profile-form").classList.add("hidden");
    el("rm-member-password-form").classList.remove("hidden");
    el("rm-member-new-password").focus();
  });
  el("rm-member-password-cancel").addEventListener("click",()=>{
    el("rm-member-password-form").classList.add("hidden");
    el("rm-member-profile-form").classList.remove("hidden");
    showStatus(el("rm-member-password-status"),"");
  });
  el("rm-member-password-form").addEventListener("submit",saveMemberPassword);

  el("rm-signout").addEventListener("click", signOut);
  el("rm-denied-signout").addEventListener("click", signOut);

  el("rm-continue-journey").addEventListener("click", async () => {
    const status = el("rm-journey-status");
    showStatus(status, "Opening your current journey...");

    const { data, error } = await client.functions.invoke("journey-link", {
      body: { action: "create_self_link" }
    });

    if (error || !data?.url) {
      showStatus(status, error?.message || data?.error || "Your journey could not be opened.", "error");
      return;
    }

    window.location.href = data.url;
  });


  el("rm-progress-metric").addEventListener("change", updateProgressUnit);

  el("rm-progress-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentMember) return;

    const status = el("rm-progress-status");
    showStatus(status, "Saving progress...");

    const metric = metricCatalog.find((row) => row.metric_key === el("rm-progress-metric").value);
    const value = Number(el("rm-progress-value").value);

    if (!metric || !Number.isFinite(value)) {
      showStatus(status, "Enter a valid progress value.", "error");
      return;
    }

    if (metric.minimum_value !== null && value < Number(metric.minimum_value)) {
      showStatus(status, "That value is below the expected range for this metric.", "error");
      return;
    }

    if (metric.maximum_value !== null && value > Number(metric.maximum_value)) {
      showStatus(status, "That value is above the expected range for this metric.", "error");
      return;
    }

    const { data: { user } } = await client.auth.getUser();
    const { error } = await client.from("progress_entries").insert({
      contact_id: currentMember.contact_id,
      membership_id: currentMember.membership_id,
      metric_key: metric.metric_key,
      value_numeric: value,
      recorded_at: new Date().toISOString(),
      source: "member",
      created_by: user?.id || null,
      note: el("rm-progress-note").value.trim() || null
    });

    if (error) {
      showStatus(status, error.message, "error");
      return;
    }

    el("rm-progress-value").value = "";
    el("rm-progress-note").value = "";
    showStatus(status, "Progress saved.", "success");
    await loadDashboard();
  });

  el("rm-checkin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentMember || !checkinTemplate) return;

    const status = el("rm-checkin-status");
    showStatus(status, "Submitting your check-in...");

    const responses = {};
    for (const field of checkinFields) {
      const name = "checkin_" + field.field_key;
      const inputs = [...event.currentTarget.querySelectorAll('[name="' + CSS.escape(name) + '"]')];
      if (!inputs.length) continue;

      let value = "";
      if (inputs[0].type === "radio") {
        value = inputs.find((input) => input.checked)?.value || "";
      } else {
        value = inputs[0].value.trim();
      }

      if (field.required && !value) {
        showStatus(status, "Please complete all required check-in questions.", "error");
        return;
      }

      responses[field.field_key] =
        ["rating","number","percent"].includes(field.field_type) && value !== ""
          ? Number(value)
          : value;
    }

    const period = weekPeriod();
    const { data: { user } } = await client.auth.getUser();

    const { error } = await client.from("client_checkins").insert({
      contact_id: currentMember.contact_id,
      membership_id: currentMember.membership_id,
      template_id: checkinTemplate.id,
      period_start: period.start,
      period_end: period.end,
      status: "submitted",
      responses,
      submitted_at: new Date().toISOString(),
      created_by: user?.id || null
    });

    if (error) {
      showStatus(status, error.code === "23505" ? "This week’s check-in has already been submitted." : error.message, "error");
      return;
    }

    showStatus(status, "Check-in submitted to your coaching team.", "success");
    await loadDashboard();
  });

  client.auth.onAuthStateChange((_event, session) => {
    if (!session) showOnly("rm-auth");
  });

  resolveSession();
})();