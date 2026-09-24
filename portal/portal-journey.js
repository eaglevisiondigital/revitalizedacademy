(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const el = (id) => document.getElementById(id);

  let contact = null;
  let journey = null;
  let steps = [];
  let jobs = [];

  function title(value) {
    const labels = {
      waiting_client: "Waiting on Client",
      waiting_revit: "Waiting on ReVitalized",
      waived: "Waived"
    };
    return labels[value] || portal.titleCase(value || "");
  }

  function dateTime(value) {
    return value ? portal.formatDate(value, true) : "Not scheduled";
  }

  function temperatureClass(value) {
    const normalized = String(value || "cold").toLowerCase();
    return ["hot","warm","cold"].includes(normalized) ? normalized : "cold";
  }

  function setJourneyStatus(message, type = "") {
    const target = el("journey-action-status");
    target.textContent = message || "";
    target.className = "form-status" + (type ? " " + type : "");
  }

  function currentStep() {
    return steps.find((step) => step.step_key === journey?.current_step_key) || null;
  }

  window.RA_JOURNEY = {
    getContact: () => contact,
    getJourney: () => journey,
    getSteps: () => [...steps],
    getCurrentStep: () => currentStep(),
    refresh: () => refreshEverything()
  };

  function renderNoJourney() {
    journey = null;
    steps = [];
    jobs = [];

    el("journey-temperature").className = "journey-temp-chip";
    el("journey-temperature").textContent = "No journey";
    el("journey-route").textContent = "Not assigned";
    el("journey-intent").textContent = "No score yet";
    el("journey-current-step").textContent = "No active journey";
    el("journey-state-label").textContent = "Not active";
    el("journey-progress-copy").textContent = "0 of 0 steps";
    el("journey-progress-percent").textContent = "0%";
    el("journey-progress-bar").style.width = "0%";
    el("journey-next-box").className = "journey-next-box";
    el("journey-next-title").textContent = "No next step assigned";
    el("journey-next-meta").textContent = "A journey will appear automatically when this person starts an assessment or Start Your Journey.";
    el("journey-steps-list").replaceChildren();

    ["journey-action-center","journey-complete-step","journey-skip-step","journey-pause","journey-nurture"].forEach((id) => {
      el(id).disabled = true;
    });

    el("journey-automation-note").textContent = "No active journey automation.";
    setJourneyStatus("");
  }

  function renderSteps() {
    const list = el("journey-steps-list");
    list.replaceChildren();

    steps.forEach((step) => {
      const row = document.createElement("div");
      const isCurrent = step.step_key === journey.current_step_key;
      row.className = "journey-step " + step.status + (isCurrent ? " current" : "");

      const index = document.createElement("span");
      index.className = "journey-step-index";
      index.textContent = ["completed","waived"].includes(step.status) ? "✓" : String(step.step_order).padStart(2, "0");

      const copy = document.createElement("div");
      copy.className = "journey-step-copy";
      const name = document.createElement("strong");
      name.textContent = step.name;
      const meta = document.createElement("span");
      const parts = [];
      if (!step.required) parts.push("Optional");
      if (step.due_at && !["completed","skipped","waived"].includes(step.status)) parts.push("Due " + dateTime(step.due_at));
      if (step.completed_at) parts.push("Completed " + dateTime(step.completed_at));
      meta.textContent = parts.join(" · ") || title(step.step_type);
      copy.append(name, meta);

      const status = document.createElement("button");
      status.type = "button";
      status.className = "journey-step-status journey-step-manage";
      status.textContent = isCurrent && step.status === "in_progress" ? "Current" : title(step.status);
      status.title = "Manage this journey step";
      status.addEventListener("click", (event) => {
        event.stopPropagation();
        document.dispatchEvent(new CustomEvent("ra:open-override", {
          detail: { step_id: step.id }
        }));
      });

      row.append(index, copy, status);
      list.append(row);
    });
  }

  function renderJourney() {
    if (!journey) {
      renderNoJourney();
      return;
    }

    const temp = temperatureClass(journey.temperature);
    el("journey-temperature").className = "journey-temp-chip " + temp;
    el("journey-temperature").textContent = title(temp) + " lead";
    el("journey-route").textContent = journey.journey_name || title(journey.journey_key);
    el("journey-intent").textContent = (journey.intent_score || 0) + " / 100";
    el("journey-current-step").textContent = journey.current_step_name || "Journey complete";
    el("journey-state-label").textContent = title(journey.journey_status);
    el("journey-progress-copy").textContent =
      (journey.completed_steps || 0) + " of " + (journey.total_steps || 0) + " steps";
    el("journey-progress-percent").textContent = (journey.progress_percent || 0) + "%";
    el("journey-progress-bar").style.width = Math.max(0, Math.min(100, Number(journey.progress_percent || 0))) + "%";

    const nextBox = el("journey-next-box");
    const step = currentStep();
    const stalled = Boolean(
      step &&
      step.due_at &&
      new Date(step.due_at).getTime() < Date.now() &&
      ["pending","in_progress","waiting_client","waiting_revit","blocked"].includes(step.status)
    );

    nextBox.className = "journey-next-box" + (stalled ? " stalled" : "");
    el("journey-next-title").textContent = step
      ? (stalled ? "Needs attention: " : "Next: ") + step.name
      : "Journey complete";
    el("journey-next-meta").textContent = step
      ? [
          step.due_at ? (stalled ? "Was due " : "Due ") + dateTime(step.due_at) : "No due date",
          "Status: " + title(step.status)
        ].join(" · ")
      : "All tracked steps are complete.";

    renderSteps();

    const active = journey.journey_status === "active";
    const pausable = ["active","paused","nurture"].includes(journey.journey_status);
    el("journey-complete-step").disabled = !step || !active;
    el("journey-skip-step").disabled = !step || !active;
    el("journey-action-center").disabled = !step;
    el("journey-pause").disabled = !pausable;
    el("journey-pause").textContent = journey.journey_status === "paused" ? "Resume Journey" : "Pause Journey";
    el("journey-nurture").disabled = !pausable;
    el("journey-nurture").textContent = journey.journey_status === "nurture" ? "Resume Active Journey" : "Long-Term Nurture";

    const queued = jobs.filter((job) => job.status === "queued").length;
    const blocked = jobs.filter((job) => job.status === "blocked").length;
    const notes = [];
    if (queued) notes.push(queued + " scheduled automation" + (queued === 1 ? "" : "s"));
    if (blocked) notes.push(blocked + " provider-dependent automation" + (blocked === 1 ? "" : "s"));
    el("journey-automation-note").textContent = notes.length
      ? notes.join(" · ")
      : "No pending automations for this journey.";

    setJourneyStatus("");
  }

  async function loadJourney(contactId, contactRecord) {
    contact = contactRecord;

    const { data: summary, error: summaryError } = await client
      .from("admin_contact_journey_summary")
      .select("*")
      .eq("contact_id", contactId)
      .maybeSingle();

    if (summaryError) {
      renderNoJourney();
      setJourneyStatus("Journey data could not be loaded. " + summaryError.message, "error");
      return;
    }

    if (!summary) {
      renderNoJourney();
      return;
    }

    journey = summary;

    const [stepsResult, jobsResult] = await Promise.all([
      client
        .from("contact_journey_steps")
        .select("id,journey_id,step_key,step_order,name,step_type,required,status,assigned_to,due_at,started_at,completed_at,completion_source")
        .eq("journey_id", summary.journey_id)
        .order("step_order"),
      client
        .from("journey_automation_jobs")
        .select("id,action_type,status,scheduled_for,payload,result")
        .eq("journey_id", summary.journey_id)
        .in("status", ["queued","blocked"])
        .order("scheduled_for")
    ]);

    if (stepsResult.error || jobsResult.error) {
      renderNoJourney();
      setJourneyStatus(
        "Journey details could not be loaded. " + (stepsResult.error || jobsResult.error).message,
        "error"
      );
      return;
    }

    steps = stepsResult.data || [];
    jobs = jobsResult.data || [];
    renderJourney();
  }

  async function refreshEverything() {
    if (!contact?.id) return;
    await portal.openContact(contact.id);
    await portal.loadDashboard();
  }

  async function updateCurrentStep(status) {
    const step = currentStep();
    if (!step || !journey) return;

    const verb = status === "skipped" ? "skip" : "complete";
    if (status === "skipped" && !window.confirm("Skip this journey step and continue to the next one?")) return;

    setJourneyStatus((verb === "skip" ? "Skipping" : "Completing") + " step...");

    const payload = {
      status,
      completion_source: "staff_portal",
      updated_at: new Date().toISOString()
    };
    if (status === "completed") payload.completed_at = new Date().toISOString();

    const { error } = await client
      .from("contact_journey_steps")
      .update(payload)
      .eq("id", step.id);

    if (error) {
      setJourneyStatus(error.message, "error");
      return;
    }

    await portal.logActivity(
      contact.id,
      status === "completed" ? "journey_step_completed" : "journey_step_skipped",
      status === "completed" ? "Journey step completed" : "Journey step skipped",
      step.name,
      { journey_id: journey.journey_id, step_key: step.step_key }
    );

    const hasLaterStep = steps.some((candidate) =>
      candidate.step_order > step.step_order && !["completed","skipped","waived"].includes(candidate.status)
    );
    setJourneyStatus("Journey advanced.", "success");
    await refreshEverything();
    if (status === "completed" && hasLaterStep) {
      window.setTimeout(() => {
        document.dispatchEvent(new CustomEvent("ra:open-action-center"));
      }, 450);
    }
  }

  async function setJourneyState(status) {
    if (!journey) return;
    setJourneyStatus("Updating journey...");

    const { error } = await client
      .from("contact_journeys")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", journey.journey_id);

    if (error) {
      setJourneyStatus(error.message, "error");
      return;
    }

    await portal.logActivity(
      contact.id,
      "journey_status_updated",
      "Journey status updated",
      title(status),
      { journey_id: journey.journey_id, status }
    );

    await refreshEverything();
  }

  document.addEventListener("ra:contact-opened", (event) => {
    loadJourney(event.detail.contactId, event.detail.contact).catch((error) => {
      renderNoJourney();
      setJourneyStatus("Journey data could not be loaded. " + error.message, "error");
    });
  });

  document.addEventListener("ra:contact-closed", () => {
    contact = null;
    journey = null;
    steps = [];
    jobs = [];
  });

  el("journey-complete-step").addEventListener("click", () => {
    const step = currentStep();
    if (!step) return;
    document.dispatchEvent(new CustomEvent("ra:open-override", {
      detail: { step_id: step.id, target_status: "completed" }
    }));
  });

  el("journey-skip-step").addEventListener("click", () => {
    const step = currentStep();
    if (!step) return;
    document.dispatchEvent(new CustomEvent("ra:open-override", {
      detail: { step_id: step.id, target_status: "skipped" }
    }));
  });

  el("journey-pause").addEventListener("click", () => {
    if (!journey) return;
    setJourneyState(journey.journey_status === "paused" ? "active" : "paused");
  });

  el("journey-nurture").addEventListener("click", () => {
    if (!journey) return;

    if (journey.journey_status === "nurture") {
      setJourneyState("active");
      return;
    }

    const confirmed = window.confirm(
      "Move this person to Long-Term Nurture?\n\n" +
      "Their ReVitalized history, assessment, tags and current journey are preserved. " +
      "Immediate sales/onboarding follow-up is paused so the team can use a gentler long-term follow-up approach. " +
      "You can resume the active journey later without starting over."
    );

    if (confirmed) setJourneyState("nurture");
  });
})();