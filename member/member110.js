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

  function renderHousehold(rows, householdType) {
    const list = el("rm-household");
    list.replaceChildren();
    el("rm-household-type").textContent = title(householdType || "individual");

    if (!rows.length) {
      list.innerHTML = '<div class="rm112-empty">Your household profile is being prepared.</div>';
      return;
    }

    rows.forEach((row) => {
      const person = document.createElement("div");
      person.className = "rm112-person";
      const name = document.createElement("strong");
      name.textContent = [row.first_name,row.last_name].filter(Boolean).join(" ") || "Household member";
      const relation = document.createElement("span");
      relation.textContent = title(row.relationship_type) + (row.sex ? " · " + title(row.sex) : "");
      person.append(name, relation);
      list.append(person);
    });
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

  let activeConversationId = null;

  function renderNotificationPreferences(row){
    const values=row||{};
    el("pref-in-app-messages").checked=values.in_app_messages!==false;
    el("pref-email-messages").checked=Boolean(values.email_messages);
    el("pref-sms-messages").checked=Boolean(values.sms_messages);
    el("pref-email-coaching").checked=values.email_coaching_reminders!==false;
    el("pref-sms-coaching").checked=Boolean(values.sms_coaching_reminders);
    el("pref-email-program").checked=values.email_program_updates!==false;
    el("pref-sms-program").checked=Boolean(values.sms_program_updates);
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

    visible.slice(0,10).forEach((row)=>{
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
      if(row.status==="unread"){
        item.addEventListener("click",async()=>{
          await client.from("member_notifications").update({status:"read",read_at:new Date().toISOString()}).eq("id",row.id);
          await loadDashboard();
        });
      }
      list.append(item);
    });
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
    list.replaceChildren();
    const active = rows.filter((row) => row.status === "active");
    if (!active.length) {
      list.innerHTML = '<div class="rm112-empty">Your active goals will appear here as you and your coach define them.</div>';
      return;
    }
    active.forEach((row) => {
      const item = document.createElement("div");
      item.className = "rm114-item";
      const top = document.createElement("div");
      top.className = "rm114-item-top";
      const titleEl = document.createElement("strong");
      titleEl.textContent = row.title;
      const due = document.createElement("small");
      due.textContent = row.target_date ? "Target " + formatDate(row.target_date) : "Active goal";
      top.append(titleEl, due);
      item.append(top);
      if (row.description) {
        const p = document.createElement("p");
        p.textContent = row.description;
        item.append(p);
      }
      list.append(item);
    });
  }

  function renderHabits(rows) {
    const list = el("rm-habits");
    list.replaceChildren();
    const active = rows.filter((row) => row.status === "active");
    if (!active.length) {
      list.innerHTML = '<div class="rm112-empty">Your habit plan will appear here as your coaching plan is built.</div>';
      return;
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
      item.append(actions);
      list.append(item);
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
      const complete = document.createElement("button");
      complete.type = "button";
      complete.className = "primary";
      complete.textContent = "Mark Complete";
      complete.addEventListener("click", () => completeAssignment(row));
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
    if (!currentMember) return;
    const { data: { user } } = await client.auth.getUser();
    const { error } = await client.from("habit_checkins").insert({
      habit_id: row.id,
      contact_id: currentMember.contact_id,
      checkin_date: new Date().toISOString().slice(0,10),
      value: 1,
      source: "member",
      created_by: user?.id || null
    });
    if (error) {
      window.alert("Could not log this habit: " + error.message);
      return;
    }
    await loadDashboard();
  }

  async function completeAssignment(row) {
    const { data, error } = await client.functions.invoke("member-coaching", {
      body: { action: "complete_assignment", assignment_id: row.id }
    });
    if (error || !data?.ok) {
      window.alert(error?.message || data?.error || "Could not complete this assignment.");
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

  async function loadDashboard() {
    const [
      dashboardResult,
      entitlementsResult,
      householdResult,
      journeyResult,
      appointmentResult,
      goalsResult,
      habitsResult,
      assignmentsResult,
      coachResult,
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
      conversationsResult,
      notificationsResult,
      notificationPrefsResult
    ] = await Promise.all([
      client.from("my_member_dashboard").select("*").maybeSingle(),
      client.from("my_member_entitlements").select("*").order("label"),
      client.from("my_household").select("*").order("is_primary", { ascending: false }),
      client.from("my_member_journey").select("*").maybeSingle(),
      client.from("my_member_upcoming_appointment").select("*").maybeSingle(),
      client.from("my_goals").select("*"),
      client.from("my_habits").select("*"),
      client.from("my_client_assignments").select("*"),
      client.from("my_coach").select("*").eq("role","primary").maybeSingle(),
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
      client.from("my_conversations").select("*"),
      client.from("my_notifications").select("*").limit(20),
      client.from("notification_preferences").select("*").maybeSingle()
    ]);

    const failed = [dashboardResult,entitlementsResult,householdResult,journeyResult,appointmentResult,goalsResult,habitsResult,assignmentsResult,coachResult,progressResult,metricsResult,templateResult,mealPlanResult,mealsResult,fitnessPlanResult,workoutsResult,groceryResult,coursesResult,resourcesResult,conversationsResult,notificationsResult,notificationPrefsResult].find((r) => r.error);
    if (failed?.error) throw failed.error;

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
    renderEntitlements(entitlementsResult.data || []);
    renderHousehold(householdResult.data || [], member.household_type);
    renderCoach(coachResult.data);
    renderGoals(goalsResult.data || []);
    renderHabits(habitsResult.data || []);
    renderAssignments(assignmentsResult.data || []);
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


  el("rm-notification-form").addEventListener("submit",saveNotificationPreferences);

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