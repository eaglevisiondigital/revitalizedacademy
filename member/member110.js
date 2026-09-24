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

  async function loadDashboard() {
    const [
      dashboardResult,
      entitlementsResult,
      householdResult,
      journeyResult,
      appointmentResult
    ] = await Promise.all([
      client.from("my_member_dashboard").select("*").maybeSingle(),
      client.from("my_member_entitlements").select("*").order("label"),
      client.from("my_household").select("*").order("is_primary", { ascending: false }),
      client.from("my_member_journey").select("*").maybeSingle(),
      client.from("my_member_upcoming_appointment").select("*").maybeSingle()
    ]);

    const failed = [dashboardResult,entitlementsResult,householdResult,journeyResult,appointmentResult].find((r) => r.error);
    if (failed?.error) throw failed.error;

    const member = dashboardResult.data;
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

  client.auth.onAuthStateChange((_event, session) => {
    if (!session) showOnly("rm-auth");
  });

  resolveSession();
})();