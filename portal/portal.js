(() => {
  "use strict";

  const SUPABASE_URL = "https://voalfpxiyznnqfcqcymd.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd";
  const PORTAL_URL = "https://revitalizedacademy.com/portal/";

  const initialHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const initialQuery = new URLSearchParams(window.location.search);
  let initialFlowType = initialHash.get("type") || initialQuery.get("type") || "";
  const authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const el = (id) => document.getElementById(id);
  const authView = el("auth-view");
  const portalView = el("portal-view");
  const loginForm = el("login-form");
  const passwordCard = el("password-card");
  const pendingCard = el("pending-card");
  const loginStatus = el("login-status");
  const passwordStatus = el("password-status");
  const portalStatus = el("portal-status");
  const accountModal = el("account-modal");
  const accountOverview = el("account-overview");
  const accountPasswordPanel = el("account-password-panel");
  const accountPasswordStatus = el("account-password-status");

  const contactDrawer = el("contact-drawer");
  const contactContent = el("contact-content");
  const contactLoading = el("contact-loading");
  let activeContactId = null;
  let currentUserId = null;
  let staffDirectory = [];


  const metricDefinitions = [
    ["clients", "Active clients"],
    ["assessment_leads", "Assessment leads"],
    ["applicants", "Applicants"],
    ["needs_attention", "Needs attention", true],
    ["consultations_scheduled", "Consultations"],
    ["followups_due_24h", "Due in 24 hours", true],
    ["total_contacts", "Total contacts"],
    ["webinar_leads", "Webinar leads"],
    ["completed_assessments", "Assessments complete"],
    ["completed_enrollments", "Enrollments complete"],
    ["webinar_registrations", "Webinar registrations"],
    ["refuel_interest", "ReFuel interest"]
  ];

  function showStatus(target, message, type = "") {
    target.textContent = message || "";
    target.className = "form-status" + (type ? " " + type : "");
  }

  function cleanLabel(value) {
    return String(value || "Not started").replaceAll("_", " ");
  }

  function titleCase(value) {
    return cleanLabel(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(value, includeTime = false) {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: includeTime ? undefined : "numeric",
      hour: includeTime ? "numeric" : undefined,
      minute: includeTime ? "2-digit" : undefined
    }).format(date);
  }

  function personName(row) {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    return name || row.email || "Unnamed contact";
  }

  function makeBadge(value) {
    const span = document.createElement("span");
    const normalized = String(value || "not_started").toLowerCase();
    span.className = "status-badge " + normalized.replaceAll(" ", "_");
    span.textContent = titleCase(normalized);
    return span;
  }


  function staffName(userId) {
    if (!userId) return "Unassigned";
    const match = staffDirectory.find((staff) => staff.user_id === userId);
    return match?.display_name || "Assigned staff";
  }

  function toDatetimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (part) => String(part).padStart(2, "0");
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function fromDatetimeLocal(value) {
    return value ? new Date(value).toISOString() : null;
  }

  function displayJson(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  function populateStaffSelect(select, selectedValue = "") {
    select.replaceChildren();
    const unassigned = document.createElement("option");
    unassigned.value = "";
    unassigned.textContent = "Unassigned";
    select.append(unassigned);

    staffDirectory.forEach((staff) => {
      const option = document.createElement("option");
      option.value = staff.user_id;
      option.textContent = staff.display_name + " · " + titleCase(staff.role);
      option.selected = staff.user_id === selectedValue;
      select.append(option);
    });
  }

  async function loadStaffDirectory() {
    const { data, error } = await authClient
      .from("staff_directory")
      .select("user_id,display_name,role")
      .order("display_name");
    if (error) {
      staffDirectory = [];
      return;
    }
    staffDirectory = data || [];
  }

  async function logActivity(contactId, activityType, title, detail = null, metadata = {}) {
    if (!currentUserId || !contactId) return;
    await authClient.from("contact_activity").insert({
      contact_id: contactId,
      activity_type: activityType,
      title,
      detail,
      actor_user_id: currentUserId,
      metadata
    });
  }

  function makeJourneyCard(label, status, detail) {
    const card = document.createElement("div");
    card.className = "journey-card";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const statusEl = document.createElement("strong");
    statusEl.textContent = titleCase(status || "not_started");
    const detailEl = document.createElement("small");
    detailEl.textContent = detail || "No additional activity yet";
    card.append(labelEl, statusEl, detailEl);
    return card;
  }

  function renderNotes(rows) {
    const list = el("contact-notes-list");
    list.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "drawer-empty";
      empty.textContent = "No internal notes yet.";
      list.append(empty);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "record-item";
      const top = document.createElement("div");
      top.className = "record-item-top";
      const author = document.createElement("strong");
      author.textContent = staffName(row.author_user_id);
      const date = document.createElement("span");
      date.className = "record-item-meta";
      date.textContent = formatDate(row.created_at, true);
      const note = document.createElement("p");
      note.textContent = row.note;
      top.append(author, date);
      item.append(top, note);
      list.append(item);
    });
  }

  function renderContactTasks(rows) {
    const list = el("contact-tasks-list");
    list.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "drawer-empty";
      empty.textContent = "No tasks for this contact.";
      list.append(empty);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "record-item task-item" + (row.status === "completed" ? " completed" : "");
      const top = document.createElement("div");
      top.className = "record-item-top";
      const title = document.createElement("strong");
      title.textContent = row.title;
      const meta = document.createElement("span");
      meta.className = "record-item-meta";
      meta.textContent = titleCase(row.priority) + (row.due_at ? " · " + formatDate(row.due_at, true) : "");
      top.append(title, meta);

      const assignment = document.createElement("p");
      assignment.textContent = "Assigned to: " + staffName(row.assigned_to);

      item.append(top, assignment);

      if (row.status === "open") {
        const actions = document.createElement("div");
        actions.className = "task-actions";
        const complete = document.createElement("button");
        complete.className = "mini-button";
        complete.type = "button";
        complete.textContent = "Mark complete";
        complete.addEventListener("click", () => completeContactTask(row.id, row.title));
        actions.append(complete);
        item.append(actions);
      }

      list.append(item);
    });
  }

  function renderTags(rows) {
    const list = el("contact-tags-list");
    list.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement("span");
      empty.className = "drawer-empty";
      empty.textContent = "No tags yet.";
      list.append(empty);
      return;
    }

    rows.forEach((row) => {
      const automatic = row.source === "automatic" || row.source === "system";
      const chip = document.createElement("span");
      chip.className = "tag-chip" + (automatic ? " auto" : "");

      const label = document.createElement("span");
      label.textContent = row.tag;
      chip.append(label);

      if (automatic) {
        const mark = document.createElement("small");
        mark.className = "tag-auto-mark";
        mark.textContent = "AUTO";
        chip.append(mark);
      } else {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.setAttribute("aria-label", "Remove " + row.tag);
        remove.textContent = "×";
        remove.addEventListener("click", () => removeContactTag(row.id, row.tag));
        chip.append(remove);
      }

      list.append(chip);
    });
  }

  function renderActivity(rows) {
    const list = el("contact-activity-list");
    list.replaceChildren();

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "drawer-empty";
      empty.textContent = "No recorded activity yet.";
      list.append(empty);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "activity-item";
      const dot = document.createElement("span");
      dot.className = "activity-dot";
      const copy = document.createElement("div");
      copy.className = "activity-copy";
      const title = document.createElement("strong");
      title.textContent = row.title || titleCase(row.activity_type);
      const detail = document.createElement("p");
      detail.textContent = row.detail || "";
      const time = document.createElement("time");
      time.textContent = formatDate(row.created_at, true);
      copy.append(title);
      if (row.detail) copy.append(detail);
      copy.append(time);
      item.append(dot, copy);
      list.append(item);
    });
  }

  async function openContact(contactId) {
    if (!contactId) return;
    activeContactId = contactId;
    contactDrawer.classList.remove("hidden");
    contactDrawer.setAttribute("aria-hidden", "false");
    contactContent.classList.add("hidden");
    contactLoading.classList.remove("hidden");
    contactLoading.textContent = "Loading contact record...";

    if (!staffDirectory.length) await loadStaffDirectory();

    const [
      contactResult,
      workflowsResult,
      webinarResult,
      refuelResult,
      notesResult,
      tasksResult,
      tagsResult,
      activityResult
    ] = await Promise.all([
      authClient.from("contacts").select("*").eq("id", contactId).single(),
      authClient.from("workflow_records").select("id,workflow_type,status,current_step,completion_percent,last_activity_at,completed_at").eq("contact_id", contactId).order("created_at", { ascending: false }),
      authClient.from("webinar_registrations").select("status,payment_status,registered_at,attended_at,primary_goal").eq("contact_id", contactId).order("registered_at", { ascending: false }).limit(1),
      authClient.from("refuel_interest").select("status,created_at").eq("contact_id", contactId).maybeSingle(),
      authClient.from("contact_notes").select("id,note,created_at,author_user_id").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(30),
      authClient.from("follow_up_tasks").select("id,title,due_at,status,priority,assigned_to,created_by,created_at,completed_at").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(30),
      authClient.from("contact_tags").select("id,tag,source,rule_key,created_at").eq("contact_id", contactId).order("tag"),
      authClient.from("contact_activity").select("id,activity_type,title,detail,actor_user_id,metadata,created_at").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(40)
    ]);

    const failed = [contactResult, workflowsResult, webinarResult, refuelResult, notesResult, tasksResult, tagsResult, activityResult].find((result) => result.error);
    if (failed?.error) {
      contactLoading.textContent = "This contact record could not be loaded. " + failed.error.message;
      return;
    }

    const contact = contactResult.data;
    const workflows = workflowsResult.data || [];
    const vitality = workflows.find((row) => row.workflow_type === "vitality_assessment");
    const enrollment = workflows.find((row) => row.workflow_type === "enrollment");
    const webinar = (webinarResult.data || [])[0];
    const refuel = refuelResult.data;

    el("contact-title").textContent = personName(contact);
    const badges = el("contact-badges");
    badges.replaceChildren();
    badges.append(makeBadge(contact.lifecycle_stage), makeBadge(contact.follow_up_status));

    el("contact-email").textContent = contact.email || "Not provided";
    el("contact-phone").textContent = contact.phone || "Not provided";
    el("contact-location").textContent = [contact.city, contact.state, contact.country].filter(Boolean).join(", ") || "Not provided";
    el("contact-source").textContent = contact.last_source || contact.first_source || "Not recorded";
    el("contact-created").textContent = formatDate(contact.created_at, true);
    el("contact-assigned-name").textContent = staffName(contact.assigned_to);

    const emailAction = el("contact-email-action");
    if (contact.email) {
      emailAction.href = "mailto:" + encodeURIComponent(contact.email) + "?subject=" + encodeURIComponent("ReVitalized Academy follow-up");
      emailAction.classList.remove("disabled");
    } else {
      emailAction.href = "#";
      emailAction.classList.add("disabled");
    }

    const callAction = el("contact-call-action");
    if (contact.phone) {
      callAction.href = "tel:" + String(contact.phone).replace(/[^+\d]/g, "");
      callAction.classList.remove("disabled");
    } else {
      callAction.href = "#";
      callAction.classList.add("disabled");
    }

    const journeyGrid = el("contact-journey-grid");
    journeyGrid.replaceChildren(
      makeJourneyCard("Vitality assessment", vitality?.status, vitality ? (vitality.completion_percent || 0) + "% complete" + (vitality.current_step ? " · " + vitality.current_step : "") : "Not started"),
      makeJourneyCard("Enrollment", enrollment?.status, enrollment ? (enrollment.completion_percent || 0) + "% complete" + (enrollment.current_step ? " · " + enrollment.current_step : "") : "Not started"),
      makeJourneyCard("Webinar", webinar?.status, webinar ? "Payment: " + titleCase(webinar.payment_status) : "No registration"),
      makeJourneyCard("ReFuel", refuel?.status, refuel ? "Joined " + formatDate(refuel.created_at) : "No interest record")
    );

    el("contact-lifecycle").value = contact.lifecycle_stage || "lead";
    el("contact-followup-status").value = contact.follow_up_status || "new";
    el("contact-consultation-status").value = contact.consultation_status || "not_scheduled";
    populateStaffSelect(el("contact-assigned-to"), contact.assigned_to || "");
    el("contact-next-followup").value = toDatetimeLocal(contact.next_follow_up_at);
    populateStaffSelect(el("contact-task-assigned"), currentUserId || "");

    renderNotes(notesResult.data || []);
    renderContactTasks(tasksResult.data || []);
    renderTags(tagsResult.data || []);
    renderActivity(activityResult.data || []);

    showStatus(el("contact-status-message"), "");
    showStatus(el("contact-note-message"), "");
    showStatus(el("contact-task-message"), "");
    showStatus(el("contact-tag-message"), "");
    contactLoading.classList.add("hidden");
    contactContent.classList.remove("hidden");
    document.dispatchEvent(new CustomEvent("ra:contact-opened", {
      detail: { contactId, contact }
    }));
  }

  function closeContact() {
    activeContactId = null;
    contactDrawer.classList.add("hidden");
    contactDrawer.setAttribute("aria-hidden", "true");
    contactContent.classList.add("hidden");
    contactLoading.classList.remove("hidden");
    document.dispatchEvent(new CustomEvent("ra:contact-closed"));
  }

  async function completeContactTask(taskId, taskTitle) {
    const { error } = await authClient.from("follow_up_tasks").update({
      status: "completed",
      completed_at: new Date().toISOString()
    }).eq("id", taskId);

    if (error) {
      showStatus(el("contact-task-message"), error.message, "error");
      return;
    }

    await logActivity(activeContactId, "task_completed", "Task completed", taskTitle);
    await Promise.all([openContact(activeContactId), loadDashboard()]);
  }

  async function removeContactTag(tagId, tagName) {
    const { error } = await authClient.from("contact_tags").delete().eq("id", tagId);
    if (error) {
      showStatus(el("contact-tag-message"), error.message, "error");
      return;
    }

    await logActivity(activeContactId, "tag_removed", "Tag removed", tagName);
    await openContact(activeContactId);
  }

  function wireContactOpen(element, contactId) {
    element.classList.add("contact-clickable");
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Open contact record");
    element.addEventListener("click", () => openContact(contactId));
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openContact(contactId);
      }
    });
  }


  function togglePasswordVisibility(button){
    const input=el(button.dataset.passwordToggle);
    if(!input)return;
    const showing=input.type==="text";
    input.type=showing?"password":"text";
    button.setAttribute("aria-pressed",String(!showing));
    button.setAttribute("aria-label",showing?"Show password":"Hide password");
    button.classList.toggle("is-visible", !showing);
  }

  document.querySelectorAll("[data-password-toggle]").forEach((button)=>{
    button.addEventListener("click",()=>togglePasswordVisibility(button));
  });

  function showPasswordSetup() {
    authView.classList.remove("hidden");
    portalView.classList.add("hidden");
    loginForm.classList.add("hidden");
    pendingCard.classList.add("hidden");
    passwordCard.classList.remove("hidden");
    el("new-password").focus();
  }

  function showLogin() {
    authView.classList.remove("hidden");
    portalView.classList.add("hidden");
    loginForm.classList.remove("hidden");
    passwordCard.classList.add("hidden");
    pendingCard.classList.add("hidden");
  }

  function showPending() {
    authView.classList.remove("hidden");
    portalView.classList.add("hidden");
    loginForm.classList.add("hidden");
    passwordCard.classList.add("hidden");
    pendingCard.classList.remove("hidden");
  }

  function showPortal(staff) {
    authView.classList.add("hidden");
    portalView.classList.remove("hidden");
    el("staff-name").textContent = staff.display_name || "";
    el("staff-role").textContent = titleCase(staff.role);
  }

  async function resolveStaff(session) {
    if (!session?.user) {
      showLogin();
      return;
    }

    if (initialFlowType === "invite" || initialFlowType === "recovery") {
      showPasswordSetup();
      return;
    }

    const { data: staffRows, error } = await authClient.rpc("get_my_staff_access");
    const staff = Array.isArray(staffRows) ? (staffRows[0] || null) : staffRows;

    if (error) {
      showLogin();
      showStatus(loginStatus, "Your login worked, but staff access could not be checked. Please try again.", "error");
      return;
    }

    if (!staff) {
      showPending();
      return;
    }

    if (staff.status !== "active") {
      showLogin();
      showStatus(
        loginStatus,
        staff.status === "suspended"
          ? "Your ReVitalized staff access is currently suspended. Please contact an owner or administrator."
          : "Your ReVitalized staff access is inactive. Please contact an owner or administrator.",
        "error"
      );
      await authClient.auth.signOut();
      return;
    }

    currentUserId = session.user.id;
    await loadStaffDirectory();
    showPortal(staff);
    await loadDashboard();
  }

  async function loadDashboard() {
    showStatus(portalStatus, "Loading current data...");

    const [metricsResult, followupResult, tasksResult, contactsResult] = await Promise.all([
      authClient.from("admin_dashboard_metrics").select("*").single(),
      authClient.from("admin_followup_queue").select("*").limit(12),
      authClient.from("admin_due_tasks").select("*").limit(12),
      authClient.from("admin_contact_overview").select("*").order("created_at", { ascending: false }).limit(100)
    ]);

    const firstError = [metricsResult, followupResult, tasksResult, contactsResult].find((result) => result.error);
    if (firstError?.error) {
      showStatus(portalStatus, "Some dashboard data could not be loaded. " + firstError.error.message, "error");
      return;
    }

    const followups = followupResult.data || [];
    const tasks = tasksResult.data || [];
    const contacts = contactsResult.data || [];
    const metrics = {
      ...(metricsResult.data || {}),
      needs_attention: followups.length
    };

    renderMetrics(metrics);
    renderFollowups(followups);
    renderTasks(tasks);
    renderContacts(contacts);
    showStatus(portalStatus, "Live data refreshed " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ".", "success");
    document.dispatchEvent(new CustomEvent("ra:dashboard-loaded"));
  }

  function renderMetrics(data) {
    const grid = el("metrics-grid");
    grid.replaceChildren();

    metricDefinitions.forEach(([key, label, priority]) => {
      const card = document.createElement("article");
      const numericValue = Number(data[key] || 0);
      card.className = "metric-card" + (priority && numericValue > 0 ? " priority" : "");
      const value = document.createElement("strong");
      value.textContent = numericValue.toLocaleString();
      const name = document.createElement("span");
      name.textContent = label;
      card.append(value, name);
      grid.append(card);
    });
  }

  function renderFollowups(rows) {
    const list = el("followup-list");
    list.replaceChildren();
    el("followup-count").textContent = rows.length;

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No contacts currently need follow-up.";
      list.append(empty);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "list-item";

      const main = document.createElement("div");
      main.className = "list-main";
      const name = document.createElement("strong");
      name.textContent = personName(row);
      const details = document.createElement("span");
      details.textContent = [row.email, row.phone].filter(Boolean).join(" · ") || "Contact details pending";
      main.append(name, details);

      const meta = document.createElement("div");
      meta.className = "list-meta";
      const status = document.createElement("strong");
      status.textContent = titleCase(row.follow_up_status);
      const due = document.createElement("span");
      due.textContent = row.next_follow_up_at ? formatDate(row.next_follow_up_at, true) : "No date set";
      meta.append(status, due);

      item.append(main, meta);
      wireContactOpen(item, row.id);
      list.append(item);
    });
  }

  function renderTasks(rows) {
    const list = el("task-list");
    list.replaceChildren();
    el("task-count").textContent = rows.length;

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No open tasks right now.";
      list.append(empty);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "list-item priority-" + String(row.priority || "normal").toLowerCase();

      const main = document.createElement("div");
      main.className = "list-main";
      const title = document.createElement("strong");
      title.textContent = row.title || "Follow-up task";
      const contact = document.createElement("span");
      contact.textContent = personName(row);
      main.append(title, contact);

      const meta = document.createElement("div");
      meta.className = "list-meta";
      const priority = document.createElement("strong");
      priority.textContent = titleCase(row.priority);
      const due = document.createElement("span");
      due.textContent = row.due_at ? formatDate(row.due_at, true) : "No due date";
      meta.append(priority, due);

      item.append(main, meta);
      wireContactOpen(item, row.contact_id);
      list.append(item);
    });
  }

  function renderContacts(rows) {
    const body = el("contacts-body");
    body.replaceChildren();

    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "empty-state";
      td.textContent = "No contacts have been captured yet.";
      tr.append(td);
      body.append(tr);
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const name = document.createElement("td");
      name.textContent = personName(row);

      const stage = document.createElement("td");
      stage.append(makeBadge(row.lifecycle_stage));

      const vitality = document.createElement("td");
      vitality.append(makeBadge(row.vitality_status));

      const enrollment = document.createElement("td");
      enrollment.append(makeBadge(row.enrollment_status));

      const webinar = document.createElement("td");
      webinar.append(makeBadge(row.webinar_status));

      const followup = document.createElement("td");
      followup.append(makeBadge(row.follow_up_status));

      const created = document.createElement("td");
      created.textContent = formatDate(row.created_at);

      tr.append(name, stage, vitality, enrollment, webinar, followup, created);
      wireContactOpen(tr, row.id);
      body.append(tr);
    });
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = el("login-email").value.trim();
    const password = el("login-password").value;
    showStatus(loginStatus, "Signing in...");

    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) {
      const message = error.code === "invalid_credentials"
        ? "Email or password is incorrect. Check your password or use Forgot your password? to reset it."
        : error.message;
      showStatus(loginStatus, message, "error");
      return;
    }

    showStatus(loginStatus, "");
    await resolveStaff(data.session);
  });

  el("forgot-password").addEventListener("click", async () => {
    const email = el("login-email").value.trim();
    if (!email) {
      showStatus(loginStatus, "Enter your email address first.", "error");
      el("login-email").focus();
      return;
    }

    showStatus(loginStatus, "Sending reset email...");
    const { error } = await authClient.auth.resetPasswordForEmail(email, { redirectTo: PORTAL_URL });
    if (error) {
      showStatus(loginStatus, error.message, "error");
      return;
    }
    showStatus(loginStatus, "Check your inbox for the password reset email.", "success");
  });

  el("password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = el("new-password").value;
    const confirm = el("confirm-password").value;

    if (password !== confirm) {
      showStatus(passwordStatus, "The passwords do not match.", "error");
      return;
    }

    showStatus(passwordStatus, "Saving your password...");
    const { data, error } = await authClient.auth.updateUser({ password });
    if (error) {
      showStatus(passwordStatus, error.message, "error");
      return;
    }

    initialFlowType = "";
    window.history.replaceState({}, document.title, window.location.pathname);
    showStatus(passwordStatus, "Password saved. Opening your dashboard...", "success");
    await resolveStaff(data.user ? { user: data.user } : (await authClient.auth.getSession()).data.session);
  });

  async function openAccount() {
    const [{ data: userData, error: userError }, { data: staff, error: staffError }] = await Promise.all([
      authClient.auth.getUser(),
      authClient.from("staff_access").select("role, display_name, status").maybeSingle()
    ]);

    if (userError || staffError || !userData?.user) {
      showStatus(portalStatus, "Account details could not be loaded. Please refresh and try again.", "error");
      return;
    }

    el("account-name").textContent = staff?.display_name || "Staff member";
    el("account-email").textContent = userData.user.email || "Not available";
    el("account-role").textContent = titleCase(staff?.role || "staff");
    accountOverview.classList.remove("hidden");
    accountPasswordPanel.classList.add("hidden");
    showStatus(accountPasswordStatus, "");
    accountModal.classList.remove("hidden");
    accountModal.setAttribute("aria-hidden", "false");
  }

  function closeAccount() {
    accountModal.classList.add("hidden");
    accountModal.setAttribute("aria-hidden", "true");
    accountOverview.classList.remove("hidden");
    accountPasswordPanel.classList.add("hidden");
    el("account-new-password").value = "";
    el("account-confirm-password").value = "";
    showStatus(accountPasswordStatus, "");
  }

  function showAccountPassword() {
    accountOverview.classList.add("hidden");
    accountPasswordPanel.classList.remove("hidden");
    showStatus(accountPasswordStatus, "");
    el("account-new-password").focus();
  }

  async function signOut() {
    await authClient.auth.signOut();
    showLogin();
    showStatus(loginStatus, "Signed out.", "success");
  }


  window.RA_PORTAL = {
    authClient,
    currentUserId: () => currentUserId,
    openContact,
    loadDashboard,
    logActivity,
    showStatus,
    titleCase,
    formatDate,
    personName,
    makeBadge,
    renderContacts,
    staffDirectory: () => [...staffDirectory],
    currentStaffRole: () => staffDirectory.find((row) => row.user_id === currentUserId)?.role || null
  };

  el("contact-close").addEventListener("click", closeContact);
  document.querySelectorAll("[data-contact-close]").forEach((node) => node.addEventListener("click", closeContact));

  el("contact-email-action").addEventListener("click", () => {
    if (activeContactId && !el("contact-email-action").classList.contains("disabled")) {
      logActivity(activeContactId, "email_started", "Email started", "Opened email composer from the ReVitalized portal.");
    }
  });

  el("contact-call-action").addEventListener("click", () => {
    if (activeContactId && !el("contact-call-action").classList.contains("disabled")) {
      logActivity(activeContactId, "call_started", "Call started", "Opened phone action from the ReVitalized portal.");
    }
  });

  el("contact-status-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeContactId) return;

    showStatus(el("contact-status-message"), "Saving...");
    const updates = {
      lifecycle_stage: el("contact-lifecycle").value,
      follow_up_status: el("contact-followup-status").value,
      consultation_status: el("contact-consultation-status").value,
      assigned_to: el("contact-assigned-to").value || null,
      next_follow_up_at: fromDatetimeLocal(el("contact-next-followup").value)
    };

    const { error } = await authClient.from("contacts").update(updates).eq("id", activeContactId);
    if (error) {
      showStatus(el("contact-status-message"), error.message, "error");
      return;
    }

    await logActivity(activeContactId, "contact_updated", "Contact status updated", "Lifecycle, follow-up, consultation, assignment or follow-up date changed.", updates);
    showStatus(el("contact-status-message"), "Saved.", "success");
    await Promise.all([openContact(activeContactId), loadDashboard()]);
  });

  el("contact-note-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeContactId || !currentUserId) return;
    const note = el("contact-note-input").value.trim();
    if (!note) return;

    showStatus(el("contact-note-message"), "Adding note...");
    const { error } = await authClient.from("contact_notes").insert({
      contact_id: activeContactId,
      author_user_id: currentUserId,
      note
    });

    if (error) {
      showStatus(el("contact-note-message"), error.message, "error");
      return;
    }

    el("contact-note-input").value = "";
    await logActivity(activeContactId, "note_added", "Internal note added", note.slice(0, 240));
    showStatus(el("contact-note-message"), "Note added.", "success");
    await openContact(activeContactId);
  });

  el("contact-task-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeContactId || !currentUserId) return;
    const title = el("contact-task-title").value.trim();
    if (!title) return;

    showStatus(el("contact-task-message"), "Creating task...");
    const payload = {
      contact_id: activeContactId,
      assigned_to: el("contact-task-assigned").value || null,
      title,
      due_at: fromDatetimeLocal(el("contact-task-due").value),
      status: "open",
      priority: el("contact-task-priority").value,
      created_by: currentUserId
    };

    const { error } = await authClient.from("follow_up_tasks").insert(payload);
    if (error) {
      showStatus(el("contact-task-message"), error.message, "error");
      return;
    }

    el("contact-task-title").value = "";
    el("contact-task-due").value = "";
    el("contact-task-priority").value = "normal";
    await logActivity(activeContactId, "task_created", "Task created", title, { priority: payload.priority, due_at: payload.due_at });
    showStatus(el("contact-task-message"), "Task created.", "success");
    await Promise.all([openContact(activeContactId), loadDashboard()]);
  });

  el("contact-tag-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeContactId) return;
    const tag = el("contact-tag-input").value.trim();
    if (!tag) return;

    const { data: existing } = await authClient.from("contact_tags").select("id").eq("contact_id", activeContactId).ilike("tag", tag).limit(1);
    if (existing?.length) {
      showStatus(el("contact-tag-message"), "That tag is already on this contact.", "error");
      return;
    }

    const { error } = await authClient.from("contact_tags").insert({ contact_id: activeContactId, tag });
    if (error) {
      showStatus(el("contact-tag-message"), error.message, "error");
      return;
    }

    el("contact-tag-input").value = "";
    await logActivity(activeContactId, "tag_added", "Tag added", tag);
    await openContact(activeContactId);
  });

  el("logout-button").addEventListener("click", signOut);
  el("pending-logout").addEventListener("click", signOut);
  el("refresh-button").addEventListener("click", loadDashboard);
  el("account-button").addEventListener("click", openAccount);
  el("account-close").addEventListener("click", closeAccount);
  el("account-done").addEventListener("click", closeAccount);
  document.querySelectorAll("[data-account-close]").forEach((node) => node.addEventListener("click", closeAccount));
  el("account-change-password").addEventListener("click", showAccountPassword);
  el("account-password-cancel").addEventListener("click", () => {
    accountPasswordPanel.classList.add("hidden");
    accountOverview.classList.remove("hidden");
    showStatus(accountPasswordStatus, "");
  });

  el("account-password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = el("account-new-password").value;
    const confirm = el("account-confirm-password").value;

    if (password !== confirm) {
      showStatus(accountPasswordStatus, "The passwords do not match.", "error");
      return;
    }

    showStatus(accountPasswordStatus, "Saving your new password...");
    const { error } = await authClient.auth.updateUser({ password });

    if (error) {
      showStatus(accountPasswordStatus, error.message, "error");
      return;
    }

    el("account-new-password").value = "";
    el("account-confirm-password").value = "";
    showStatus(accountPasswordStatus, "Password updated successfully.", "success");
    window.setTimeout(() => {
      accountPasswordPanel.classList.add("hidden");
      accountOverview.classList.remove("hidden");
      showStatus(accountPasswordStatus, "");
    }, 900);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.querySelector(".message-modal:not(.hidden)")) return;
    if (!contactDrawer.classList.contains("hidden")) closeContact();
    else if (!accountModal.classList.contains("hidden")) closeAccount();
  });
  el("pending-password").addEventListener("click", showPasswordSetup);

  authClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      showLogin();
    } else if (event === "PASSWORD_RECOVERY") {
      showPasswordSetup();
    } else if (event === "SIGNED_IN" && portalView.classList.contains("hidden") && passwordCard.classList.contains("hidden")) {
      window.setTimeout(() => resolveStaff(session), 0);
    }
  });

  (async function init() {
    const { data, error } = await authClient.auth.getSession();
    if (error) {
      showLogin();
      showStatus(loginStatus, "Unable to restore your session. Please sign in.", "error");
      return;
    }
    await resolveStaff(data.session);
  })();
})();
