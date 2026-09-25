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
  let goals = [];
  let habits = [];
  let assignments = [];
  let checkins = [];
  let progress = [];
  let metricCatalog = [];
  let checkinFieldMap = new Map();
  let sessions = [];
  let notes = [];
  let coachCapacity = [];

  function setStatus(id, message, type = "") {
    const target = el(id);
    if (!target) return;
    target.textContent = message || "";
    target.className = "form-status" + (type ? " " + type : "");
  }

  function title(value) {
    return portal.titleCase(value || "");
  }

  function staffRows() {
    return portal.staffDirectory().filter((row) => ["owner","admin","coach"].includes(row.role));
  }

  function staffName(userId) {
    if (!userId) return "Unassigned";
    return portal.staffDirectory().find((row) => row.user_id === userId)?.display_name || "Assigned coach";
  }

  function toDatetimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return date.getFullYear() + "-" + pad(date.getMonth()+1) + "-" + pad(date.getDate()) +
      "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function fromDatetimeLocal(value) {
    return value ? new Date(value).toISOString() : null;
  }

  function closeModal() {
    el("coaching-modal").classList.add("hidden");
    el("coaching-modal").setAttribute("aria-hidden", "true");
  }

  function openModal(scrollToSessions = false) {
    if (!contact || !membership) return;
    renderManager();
    el("coaching-modal").classList.remove("hidden");
    el("coaching-modal").setAttribute("aria-hidden", "false");
    if (scrollToSessions) {
      window.setTimeout(() => {
        el("coaching-sessions-block").scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  function populateCoachSelect(select, selected = "") {
    select.replaceChildren();

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Unassigned";
    select.append(blank);

    staffRows().forEach((row) => {
      if (!["owner","admin","coach"].includes(row.role)) return;
      const cap = coachCapacity.find((c) => c.user_id === row.user_id);
      const option = document.createElement("option");
      option.value = row.user_id;
      const capacityText = cap
        ? [
            cap.accepts_new_clients ? "accepting clients" : "not accepting",
            cap.max_active_clients === null || cap.max_active_clients === undefined
              ? cap.active_clients + " active"
              : cap.active_clients + "/" + cap.max_active_clients + " clients",
            cap.max_sessions_per_week === null || cap.max_sessions_per_week === undefined
              ? cap.scheduled_sessions_this_week + " sessions this week"
              : cap.scheduled_sessions_this_week + "/" + cap.max_sessions_per_week + " sessions this week"
          ].join(" · ")
        : "capacity not configured";
      option.textContent = row.display_name + " · " + capacityText;
      option.selected = row.user_id === selected;
      if (cap && !cap.accepts_new_clients && row.user_id !== selected) option.disabled = true;
      select.append(option);
    });
  }

  function renderSummary() {
    const section = el("client-coaching-section");

    if (!access || !membership) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    el("client-coaching-chip").textContent = title(membership.status || access.status || "active");
    el("client-coach-name").textContent = summary?.coach_name || staffName(membership.assigned_coach_id);
    el("client-goal-count").textContent = String(goals.filter((row) => row.status === "active").length);
    el("client-habit-count").textContent = String(habits.filter((row) => row.status === "active").length);
    el("client-assignment-count").textContent = String(assignments.filter((row) => ["assigned","in_progress"].includes(row.status)).length);
    el("client-last-checkin").textContent = summary?.last_checkin_at
      ? portal.formatDate(summary.last_checkin_at, true)
      : "None yet";
    el("client-last-progress").textContent = summary?.last_progress_at
      ? portal.formatDate(summary.last_progress_at, true)
      : "None yet";
    setStatus("client-coaching-status", "");
  }

  async function loadCoaching(contactId, contactRecord = contact) {
    contact = contactRecord || contact;
    if (!contactId) return;

    const accessResult = await client
      .from("client_access")
      .select("*")
      .eq("contact_id", contactId)
      .maybeSingle();

    if (accessResult.error) throw accessResult.error;
    access = accessResult.data || null;
    membership = null;
    summary = null;
    goals = [];
    habits = [];
    assignments = [];
    checkins = [];
    progress = [];
    metricCatalog = [];
    checkinFieldMap = new Map();
    sessions = [];
    notes = [];

    if (!access?.membership_id) {
      renderSummary();
      return;
    }

    const [
      membershipResult,
      summaryResult,
      goalsResult,
      habitsResult,
      assignmentsResult,
      checkinsResult,
      progressResult,
      metricResult,
      fieldResult,
      sessionsResult,
      notesResult,
      capacityResult
    ] = await Promise.all([
      client.from("client_memberships").select("*").eq("id", access.membership_id).maybeSingle(),
      client.from("admin_client_coaching_summary").select("*").eq("contact_id", contactId).maybeSingle(),
      client.from("client_goals").select("*").eq("contact_id", contactId).order("priority").order("created_at", { ascending: false }),
      client.from("client_habits").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }),
      client.from("client_assignments").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }),
      client.from("client_checkins").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(8),
      client.from("progress_entries").select("*").eq("contact_id", contactId).order("recorded_at", { ascending: false }).limit(20),
      client.from("progress_metric_catalog").select("*").eq("active", true).order("display_order"),
      client.from("checkin_template_fields").select("field_key,label,display_order").order("display_order"),
      client.from("coaching_sessions").select("*").eq("contact_id", contactId).order("scheduled_start", { ascending: false }).limit(15),
      client.from("coaching_session_notes").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(20)
    ]);

    const failed = [
      membershipResult,summaryResult,goalsResult,habitsResult,assignmentsResult,
      checkinsResult,progressResult,metricResult,fieldResult,sessionsResult,notesResult
    ].find((result) => result.error);

    if (failed?.error) throw failed.error;

    membership = membershipResult.data || null;
    summary = summaryResult.data || null;
    goals = goalsResult.data || [];
    habits = habitsResult.data || [];
    assignments = assignmentsResult.data || [];
    checkins = checkinsResult.data || [];
    progress = progressResult.data || [];
    metricCatalog = metricResult.data || [];
    (fieldResult.data || []).forEach((row) => checkinFieldMap.set(row.field_key, row.label));
    sessions = sessionsResult.data || [];
    notes = notesResult.data || [];
    coachCapacity = capacityResult.data || [];

    renderSummary();
  }

  function empty(message) {
    const div = document.createElement("div");
    div.className = "coaching-empty";
    div.textContent = message;
    return div;
  }

  function renderGoals() {
    const list = el("coaching-goal-list");
    list.replaceChildren();
    const active = goals.filter((row) => row.status === "active");

    if (!active.length) {
      list.append(empty("No active goals yet."));
      return;
    }

    active.forEach((row) => {
      const item = document.createElement("div");
      item.className = "coaching-item";
      const top = document.createElement("div");
      top.className = "coaching-item-top";
      const heading = document.createElement("strong");
      heading.textContent = row.title;
      const badge = document.createElement("span");
      badge.className = "coaching-badge";
      badge.textContent = "Priority " + row.priority;
      top.append(heading, badge);
      item.append(top);

      if (row.description) {
        const p = document.createElement("p");
        p.textContent = row.description;
        item.append(p);
      }

      const meta = document.createElement("small");
      meta.textContent = row.target_date ? "Target " + portal.formatDate(row.target_date) : "No target date";
      item.append(meta);

      const actions = document.createElement("div");
      actions.className = "coaching-item-actions";
      const complete = document.createElement("button");
      complete.type = "button";
      complete.className = "primary";
      complete.textContent = "Complete";
      complete.addEventListener("click", () => updateGoal(row.id, "completed"));
      const pause = document.createElement("button");
      pause.type = "button";
      pause.textContent = "Pause";
      pause.addEventListener("click", () => updateGoal(row.id, "paused"));
      actions.append(complete, pause);
      item.append(actions);
      list.append(item);
    });
  }

  function renderHabits() {
    const list = el("coaching-habit-list");
    list.replaceChildren();
    const active = habits.filter((row) => row.status === "active");

    if (!active.length) {
      list.append(empty("No active habits yet."));
      return;
    }

    active.forEach((row) => {
      const item = document.createElement("div");
      item.className = "coaching-item";
      const top = document.createElement("div");
      top.className = "coaching-item-top";
      const heading = document.createElement("strong");
      heading.textContent = row.title;
      const badge = document.createElement("span");
      badge.className = "coaching-badge";
      badge.textContent = title(row.frequency);
      top.append(heading, badge);
      item.append(top);

      const meta = document.createElement("small");
      meta.textContent = [
        row.category || "",
        "Target " + row.target_per_period + (row.unit ? " " + row.unit : "")
      ].filter(Boolean).join(" · ");
      item.append(meta);

      const actions = document.createElement("div");
      actions.className = "coaching-item-actions";
      const pause = document.createElement("button");
      pause.type = "button";
      pause.textContent = "Pause";
      pause.addEventListener("click", () => updateHabit(row.id, "paused"));
      const complete = document.createElement("button");
      complete.type = "button";
      complete.className = "primary";
      complete.textContent = "Complete";
      complete.addEventListener("click", () => updateHabit(row.id, "completed"));
      actions.append(pause, complete);
      item.append(actions);
      list.append(item);
    });
  }

  function renderAssignments() {
    const list = el("coaching-assignment-list");
    list.replaceChildren();

    if (!assignments.length) {
      list.append(empty("No client assignments yet."));
      return;
    }

    assignments.slice(0,8).forEach((row) => {
      const item = document.createElement("div");
      item.className = "coaching-item";
      const top = document.createElement("div");
      top.className = "coaching-item-top";
      const heading = document.createElement("strong");
      heading.textContent = row.title;
      const badge = document.createElement("span");
      badge.className = "coaching-badge" + (row.status === "completed" ? " completed" : "");
      badge.textContent = title(row.status);
      top.append(heading, badge);
      item.append(top);

      if (row.instructions) {
        const p = document.createElement("p");
        p.textContent = row.instructions;
        item.append(p);
      }

      const meta = document.createElement("small");
      meta.textContent = [
        title(row.assignment_type),
        row.due_at ? "Due " + portal.formatDate(row.due_at, true) : ""
      ].filter(Boolean).join(" · ");
      item.append(meta);

      if (row.member_note) {
        const response = document.createElement("div");
        response.className = "coaching-response";
        response.textContent = "Member note: " + row.member_note;
        item.append(response);
      }

      if (row.status !== "completed" && row.status !== "cancelled") {
        const actions = document.createElement("div");
        actions.className = "coaching-item-actions";
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => updateAssignment(row.id, "cancelled"));
        actions.append(cancel);
        item.append(actions);
      }

      list.append(item);
    });
  }

  function responseLabel(key) {
    return checkinFieldMap.get(key) || title(key);
  }

  function renderCheckins() {
    const list = el("coaching-checkin-list");
    list.replaceChildren();

    if (!checkins.length) {
      list.append(empty("No weekly check-ins submitted yet."));
      return;
    }

    checkins.slice(0,5).forEach((row) => {
      const item = document.createElement("div");
      item.className = "coaching-item";
      const top = document.createElement("div");
      top.className = "coaching-item-top";
      const heading = document.createElement("strong");
      heading.textContent = row.period_start
        ? "Week of " + portal.formatDate(row.period_start)
        : "Weekly check-in";
      const badge = document.createElement("span");
      badge.className = "coaching-badge" + (row.status === "reviewed" ? " completed" : " review");
      badge.textContent = title(row.status);
      top.append(heading, badge);
      item.append(top);

      Object.entries(row.responses || {}).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) return;
        const p = document.createElement("p");
        p.textContent = responseLabel(key) + ": " + String(value);
        item.append(p);
      });

      if (row.coach_response) {
        const response = document.createElement("div");
        response.className = "coaching-response";
        response.textContent = "Coach response: " + row.coach_response;
        item.append(response);
      }

      if (row.status === "submitted") {
        const actions = document.createElement("div");
        actions.className = "coaching-item-actions";
        const review = document.createElement("button");
        review.type = "button";
        review.className = "primary";
        review.textContent = "Review";
        review.addEventListener("click", () => beginCheckinReview(row));
        actions.append(review);
        item.append(actions);
      }

      list.append(item);
    });
  }

  function renderProgress() {
    const list = el("coaching-progress-list");
    list.replaceChildren();

    if (!progress.length) {
      list.append(empty("No progress metrics recorded yet."));
      return;
    }

    const metricMap = new Map(metricCatalog.map((row) => [row.metric_key, row]));

    progress.slice(0,12).forEach((row) => {
      const metric = metricMap.get(row.metric_key);
      const item = document.createElement("div");
      item.className = "coaching-item";
      const grid = document.createElement("div");
      grid.className = "coaching-metric-grid";
      const label = document.createElement("strong");
      label.textContent = metric?.label || title(row.metric_key);
      const value = document.createElement("span");
      const raw = row.value_boolean !== null && row.value_boolean !== undefined
        ? (row.value_boolean ? "Yes" : "No")
        : row.value_numeric;
      value.textContent = String(raw) + (metric?.unit ? " " + metric.unit : "");
      const date = document.createElement("small");
      date.textContent = portal.formatDate(row.recorded_at, true) + " · " + title(row.source);
      grid.append(label, value, date);
      item.append(grid);
      list.append(item);
    });
  }

  function renderSessions() {
    const list = el("coaching-session-list");
    list.replaceChildren();
    const sessionSelect = el("coaching-note-session");
    sessionSelect.replaceChildren();

    if (!sessions.length) {
      list.append(empty("No coaching sessions scheduled yet."));
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "Schedule a coaching session first";
      sessionSelect.append(blank);
      return;
    }

    sessions.forEach((row) => {
      const option = document.createElement("option");
      option.value = row.id;
      option.textContent = (row.scheduled_start ? portal.formatDate(row.scheduled_start, true) : "Unscheduled") + " · " + title(row.status);
      sessionSelect.append(option);
    });

    sessions.slice(0,8).forEach((row) => {
      const item = document.createElement("div");
      item.className = "coaching-item";
      const top = document.createElement("div");
      top.className = "coaching-item-top";
      const heading = document.createElement("strong");
      heading.textContent = row.scheduled_start
        ? portal.formatDate(row.scheduled_start, true)
        : "Coaching session";
      const badge = document.createElement("span");
      badge.className = "coaching-badge" + (row.status === "completed" ? " completed" : "");
      badge.textContent = title(row.status);
      top.append(heading, badge);
      item.append(top);

      const meta = document.createElement("small");
      meta.textContent = [
        staffName(row.coach_user_id),
        row.format || "",
        row.session_number ? "Session " + row.session_number : ""
      ].filter(Boolean).join(" · ");
      item.append(meta);

      if (row.client_agenda) {
        const p = document.createElement("p");
        p.textContent = row.client_agenda;
        item.append(p);
      }

      const actions = document.createElement("div");
      actions.className = "coaching-item-actions";

      if (row.status === "scheduled") {
        const complete = document.createElement("button");
        complete.type = "button";
        complete.className = "primary";
        complete.textContent = "Complete";
        complete.addEventListener("click", () => updateSession(row.id, "completed"));
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => updateSession(row.id, "cancelled"));
        const noShow = document.createElement("button");
        noShow.type = "button";
        noShow.textContent = "No Show";
        noShow.addEventListener("click", () => updateSession(row.id, "no_show"));
        actions.append(complete, cancel, noShow);
      }

      const note = document.createElement("button");
      note.type = "button";
      note.textContent = "Add Note";
      note.addEventListener("click", () => {
        el("coaching-note-session").value = row.id;
        el("coaching-note-text").focus();
        el("coaching-note-form").scrollIntoView({ behavior: "smooth", block: "center" });
      });
      actions.append(note);
      item.append(actions);
      list.append(item);
    });
  }

  function renderNotes() {
    const list = el("coaching-note-list");
    list.replaceChildren();

    if (!notes.length) {
      list.append(empty("No private coaching notes yet."));
      return;
    }

    const sessionMap = new Map(sessions.map((row) => [row.id, row]));
    notes.slice(0,10).forEach((row) => {
      const item = document.createElement("div");
      item.className = "coaching-item";
      const top = document.createElement("div");
      top.className = "coaching-item-top";
      const heading = document.createElement("strong");
      heading.textContent = title(row.note_type);
      const date = document.createElement("small");
      date.textContent = portal.formatDate(row.created_at, true);
      top.append(heading, date);
      item.append(top);

      const session = sessionMap.get(row.session_id);
      if (session?.scheduled_start) {
        const meta = document.createElement("small");
        meta.textContent = "Session " + portal.formatDate(session.scheduled_start, true);
        item.append(meta);
      }

      const p = document.createElement("p");
      p.textContent = row.note;
      item.append(p);
      list.append(item);
    });
  }

  function renderManager() {
    if (!membership) return;

    populateCoachSelect(el("coaching-primary-coach"), membership.assigned_coach_id || "");
    populateCoachSelect(el("coaching-session-coach"), membership.assigned_coach_id || portal.currentUserId() || "");
    renderGoals();
    renderHabits();
    renderAssignments();
    renderCheckins();
    renderProgress();
    renderSessions();
    renderNotes();
    el("coaching-checkin-review-form").classList.add("hidden");
  }

  async function refreshAll() {
    if (!contact?.id) return;
    await loadCoaching(contact.id, contact);
    renderManager();
    await portal.loadDashboard();
  }

  async function saveCoach() {
    if (!membership) return;
    const coachId = el("coaching-primary-coach").value || null;
    setStatus("coaching-coach-status", "Saving coach...");

    const { error } = await client
      .from("client_memberships")
      .update({ assigned_coach_id: coachId, updated_at: new Date().toISOString() })
      .eq("id", membership.id);

    if (error) {
      setStatus("coaching-coach-status", error.message, "error");
      return;
    }

    await portal.logActivity(
      contact.id,
      "primary_coach_assigned",
      "Primary coach updated",
      coachId ? staffName(coachId) : "Unassigned",
      { membership_id: membership.id, coach_user_id: coachId }
    );

    setStatus("coaching-coach-status", "Primary coach saved.", "success");
    await refreshAll();
  }

  async function addGoal(event) {
    event.preventDefault();
    if (!membership || !access) return;

    const titleValue = el("coaching-goal-title").value.trim();
    if (!titleValue) return;

    setStatus("coaching-goal-status", "Adding goal...");
    const { error } = await client.from("client_goals").insert({
      contact_id: contact.id,
      household_id: access.household_id || null,
      membership_id: membership.id,
      scope: "individual",
      title: titleValue,
      description: el("coaching-goal-description").value.trim() || null,
      target_date: el("coaching-goal-date").value || null,
      priority: Number(el("coaching-goal-priority").value || 3),
      status: "active",
      created_by_user_id: portal.currentUserId(),
      created_by_type: "staff"
    });

    if (error) {
      setStatus("coaching-goal-status", error.message, "error");
      return;
    }

    event.currentTarget.reset();
    el("coaching-goal-priority").value = "3";
    setStatus("coaching-goal-status", "Goal added.", "success");
    await refreshAll();
  }

  async function updateGoal(id, statusValue) {
    const payload = {
      status: statusValue,
      updated_at: new Date().toISOString()
    };
    if (statusValue === "completed") payload.completed_at = new Date().toISOString();

    const { error } = await client.from("client_goals").update(payload).eq("id", id);
    if (error) {
      window.alert(error.message);
      return;
    }
    await refreshAll();
  }

  async function addHabit(event) {
    event.preventDefault();
    if (!membership) return;

    const titleValue = el("coaching-habit-title").value.trim();
    if (!titleValue) return;

    setStatus("coaching-habit-status", "Adding habit...");
    const { error } = await client.from("client_habits").insert({
      contact_id: contact.id,
      membership_id: membership.id,
      title: titleValue,
      category: el("coaching-habit-category").value.trim() || null,
      frequency: el("coaching-habit-frequency").value,
      target_per_period: Number(el("coaching-habit-target").value || 1),
      unit: el("coaching-habit-unit").value.trim() || null,
      status: "active",
      created_by: portal.currentUserId()
    });

    if (error) {
      setStatus("coaching-habit-status", error.message, "error");
      return;
    }

    event.currentTarget.reset();
    el("coaching-habit-frequency").value = "daily";
    el("coaching-habit-target").value = "1";
    setStatus("coaching-habit-status", "Habit added.", "success");
    await refreshAll();
  }

  async function updateHabit(id, statusValue) {
    const { error } = await client
      .from("client_habits")
      .update({ status: statusValue, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      window.alert(error.message);
      return;
    }
    await refreshAll();
  }

  async function addAssignment(event) {
    event.preventDefault();
    if (!membership) return;

    const titleValue = el("coaching-assignment-title").value.trim();
    if (!titleValue) return;

    setStatus("coaching-assignment-status", "Assigning...");
    const { error } = await client.from("client_assignments").insert({
      contact_id: contact.id,
      membership_id: membership.id,
      assigned_by: portal.currentUserId(),
      title: titleValue,
      instructions: el("coaching-assignment-instructions").value.trim() || null,
      assignment_type: el("coaching-assignment-type").value,
      due_at: fromDatetimeLocal(el("coaching-assignment-due").value),
      status: "assigned"
    });

    if (error) {
      setStatus("coaching-assignment-status", error.message, "error");
      return;
    }

    event.currentTarget.reset();
    el("coaching-assignment-type").value = "action";
    setStatus("coaching-assignment-status", "Assignment added to the Member Dashboard.", "success");
    await refreshAll();
  }

  async function updateAssignment(id, statusValue) {
    const { error } = await client
      .from("client_assignments")
      .update({ status: statusValue, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      window.alert(error.message);
      return;
    }
    await refreshAll();
  }

  function beginCheckinReview(row) {
    el("coaching-review-checkin-id").value = row.id;
    el("coaching-checkin-response").value = row.coach_response || "";
    el("coaching-checkin-review-form").classList.remove("hidden");
    el("coaching-checkin-response").focus();
  }

  async function reviewCheckin(event) {
    event.preventDefault();
    const id = el("coaching-review-checkin-id").value;
    if (!id) return;

    setStatus("coaching-checkin-status", "Saving review...");
    const now = new Date().toISOString();
    const { error } = await client.from("client_checkins").update({
      status: "reviewed",
      reviewed_at: now,
      reviewed_by: portal.currentUserId(),
      coach_response: el("coaching-checkin-response").value.trim() || null,
      updated_at: now
    }).eq("id", id);

    if (error) {
      setStatus("coaching-checkin-status", error.message, "error");
      return;
    }

    await client.from("follow_up_tasks")
      .update({ status: "completed", completed_at: now })
      .eq("contact_id", contact.id)
      .eq("title", "Review client weekly check-in")
      .eq("status", "open");

    await portal.logActivity(
      contact.id,
      "weekly_checkin_reviewed",
      "Weekly check-in reviewed",
      null,
      { checkin_id: id, reviewed_by: portal.currentUserId() }
    );

    setStatus("coaching-checkin-status", "Check-in reviewed.", "success");
    await refreshAll();
  }

  async function scheduleSession(event) {
    event.preventDefault();
    if (!membership) return;

    const coachId = el("coaching-session-coach").value || membership.assigned_coach_id;
    const start = fromDatetimeLocal(el("coaching-session-start").value);
    if (!coachId || !start) {
      setStatus("coaching-session-status", "Choose a coach and session start time.", "error");
      return;
    }

    const nextNumber = sessions.length
      ? Math.max(...sessions.map((row) => Number(row.session_number || 0))) + 1
      : 1;

    setStatus("coaching-session-status", "Scheduling session...");
    const { error } = await client.from("coaching_sessions").insert({
      contact_id: contact.id,
      membership_id: membership.id,
      coach_user_id: coachId,
      session_number: nextNumber,
      status: "scheduled",
      scheduled_start: start,
      scheduled_end: fromDatetimeLocal(el("coaching-session-end").value),
      format: el("coaching-session-format").value || null,
      location_url: el("coaching-session-link").value.trim() || null,
      client_agenda: el("coaching-session-agenda").value.trim() || null,
      created_by: portal.currentUserId()
    });

    if (error) {
      setStatus("coaching-session-status", error.message, "error");
      return;
    }

    event.currentTarget.reset();
    populateCoachSelect(el("coaching-session-coach"), membership.assigned_coach_id || portal.currentUserId() || "");
    el("coaching-session-format").value = "Zoom / video";
    setStatus("coaching-session-status", "Coaching session scheduled and prep added to the coach Work Desk.", "success");
    await refreshAll();
  }

  async function updateSession(id, statusValue) {
    const payload = {
      status: statusValue,
      updated_at: new Date().toISOString()
    };
    if (statusValue === "completed") payload.completed_at = new Date().toISOString();

    const { error } = await client.from("coaching_sessions").update(payload).eq("id", id);
    if (error) {
      window.alert(error.message);
      return;
    }
    await refreshAll();
  }

  async function saveNote(event) {
    event.preventDefault();
    const sessionId = el("coaching-note-session").value;
    const noteText = el("coaching-note-text").value.trim();

    if (!sessionId || !noteText) {
      setStatus("coaching-note-status", "Choose a session and enter a note.", "error");
      return;
    }

    setStatus("coaching-note-status", "Saving private note...");
    const { error } = await client.from("coaching_session_notes").insert({
      session_id: sessionId,
      contact_id: contact.id,
      author_user_id: portal.currentUserId(),
      note_type: el("coaching-note-type").value,
      note: noteText,
      private: true
    });

    if (error) {
      setStatus("coaching-note-status", error.message, "error");
      return;
    }

    el("coaching-note-text").value = "";
    setStatus("coaching-note-status", "Private coaching note saved.", "success");
    await refreshAll();
  }

  document.addEventListener("ra:contact-opened", (event) => {
    loadCoaching(event.detail.contactId, event.detail.contact).catch((error) => {
      console.error("Coaching workspace load failed", error);
      setStatus("client-coaching-status", error.message || "Coaching data could not be loaded.", "error");
    });
  });

  document.addEventListener("ra:contact-closed", () => {
    contact = null;
    access = null;
    membership = null;
    summary = null;
    goals = [];
    habits = [];
    assignments = [];
    checkins = [];
    progress = [];
    sessions = [];
    notes = [];
    el("client-coaching-section").classList.add("hidden");
    closeModal();
  });

  el("client-manage-coaching").addEventListener("click", () => openModal(false));
  el("client-schedule-session").addEventListener("click", () => openModal(true));
  document.querySelectorAll("[data-coaching-close]").forEach((node) => node.addEventListener("click", closeModal));

  el("coaching-save-coach").addEventListener("click", saveCoach);
  el("coaching-goal-form").addEventListener("submit", addGoal);
  el("coaching-habit-form").addEventListener("submit", addHabit);
  el("coaching-assignment-form").addEventListener("submit", addAssignment);
  el("coaching-checkin-review-form").addEventListener("submit", reviewCheckin);
  el("coaching-review-cancel").addEventListener("click", () => el("coaching-checkin-review-form").classList.add("hidden"));
  el("coaching-session-form").addEventListener("submit", scheduleSession);
  el("coaching-note-form").addEventListener("submit", saveNote);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el("coaching-modal").classList.contains("hidden")) closeModal();
  });
})();