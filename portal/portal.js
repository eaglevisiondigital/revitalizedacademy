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

  const metricDefinitions = [
    ["total_contacts", "Total contacts"],
    ["assessment_leads", "Assessment leads"],
    ["webinar_leads", "Webinar leads"],
    ["applicants", "Applicants"],
    ["clients", "Clients"],
    ["needs_attention", "Needs attention", true],
    ["consultations_scheduled", "Consultations"],
    ["followups_due_24h", "Due in 24 hours", true],
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

    const { data: staff, error } = await authClient
      .from("staff_access")
      .select("role, display_name")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      showLogin();
      showStatus(loginStatus, "Your login worked, but staff access could not be checked. Please try again.", "error");
      return;
    }

    if (!staff) {
      showPending();
      return;
    }

    showPortal(staff);
    await loadDashboard();
  }

  async function loadDashboard() {
    showStatus(portalStatus, "Loading current data...");

    const [metricsResult, followupResult, tasksResult, contactsResult] = await Promise.all([
      authClient.from("admin_dashboard_metrics").select("*").single(),
      authClient.from("admin_followup_queue").select("*").limit(12),
      authClient.from("admin_due_tasks").select("*").limit(12),
      authClient.from("admin_contact_overview").select("*").order("created_at", { ascending: false }).limit(15)
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
      showStatus(loginStatus, error.message, "error");
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

  async function signOut() {
    await authClient.auth.signOut();
    showLogin();
    showStatus(loginStatus, "Signed out.", "success");
  }

  el("logout-button").addEventListener("click", signOut);
  el("pending-logout").addEventListener("click", signOut);
  el("refresh-button").addEventListener("click", loadDashboard);
  el("account-password").addEventListener("click", showPasswordSetup);
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
