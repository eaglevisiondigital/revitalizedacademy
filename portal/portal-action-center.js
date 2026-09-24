(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const el = (id) => document.getElementById(id);

  let contact = null;
  let summary = null;
  let step = null;
  let templates = [];
  let openActions = [];
  let journeyLink = "";

  function setStatus(message, type = "") {
    const target = el("action-center-status");
    target.textContent = message || "";
    target.className = "action-center-status" + (type ? " " + type : "");
  }

  function toDatetimeLocal(value) {
    const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
      "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function fromDatetimeLocal(value) {
    return value ? new Date(value).toISOString() : null;
  }

  function cleanPhone(value) {
    return String(value || "").replace(/[^+\d]/g, "");
  }

  function closeModal() {
    el("journey-action-modal").classList.add("hidden");
    el("journey-action-modal").setAttribute("aria-hidden", "true");
  }

  function staffName(userId) {
    const person = portal.staffDirectory().find((row) => row.user_id === userId);
    return person?.display_name || "Unassigned";
  }

  function populateStaff() {
    const select = el("action-center-assignee");
    select.replaceChildren();

    const unassigned = document.createElement("option");
    unassigned.value = "";
    unassigned.textContent = "Unassigned";
    select.append(unassigned);

    portal.staffDirectory().forEach((staff) => {
      const option = document.createElement("option");
      option.value = staff.user_id;
      option.textContent = staff.display_name + " · " + portal.titleCase(staff.role);
      if (staff.user_id === portal.currentUserId()) option.selected = true;
      select.append(option);
    });
  }

  function availableTypes() {
    const types = new Set(templates.map((template) => template.action_type));
    ["email","sms","call","task"].forEach((type) => types.add(type));
    if (step?.step_type === "coach_action") types.add("review");
    return [...types];
  }

  function populateTypes() {
    const select = el("action-center-type");
    const current = select.value;
    select.replaceChildren();

    const labels = {
      email: "Email",
      sms: "Text",
      call: "Call",
      task: "Task",
      review: "Review"
    };

    availableTypes().forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = labels[type] || portal.titleCase(type);
      select.append(option);
    });

    const preferred = templates[0]?.action_type || (step?.step_type === "coach_action" ? "review" : "email");
    select.value = availableTypes().includes(current) ? current : preferred;
  }

  function populateTemplates() {
    const select = el("action-center-template");
    const type = el("action-center-type").value;
    select.replaceChildren();

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Custom / no template";
    select.append(blank);

    templates
      .filter((template) => template.action_type === type)
      .forEach((template) => {
        const option = document.createElement("option");
        option.value = template.id;
        option.textContent = template.name;
        select.append(option);
      });

    const matching = templates.filter((template) => template.action_type === type);
    if (matching.length) select.value = matching[0].id;
  }

  async function ensureJourneyLink() {
    if (journeyLink || !summary?.journey_id || !contact?.id) return journeyLink;

    const { data, error } = await client.functions.invoke("journey-link", {
      body: {
        action: "create_link",
        contact_id: contact.id,
        journey_id: summary.journey_id
      }
    });

    if (error || !data?.url) {
      throw new Error(error?.message || data?.error || "Could not create the secure journey link.");
    }

    journeyLink = data.url;
    el("action-center-link").value = journeyLink;
    el("action-center-link-box").classList.remove("hidden");
    return journeyLink;
  }

  function replaceTokens(value) {
    return String(value || "")
      .replaceAll("\\n", "\n")
      .replaceAll("{{first_name}}", contact?.first_name || "there")
      .replaceAll("{{next_step}}", step?.name || "your next ReVitalized step")
      .replaceAll("{{journey_link}}", journeyLink || "[secure journey link]");
  }

  async function applySelectedTemplate() {
    const template = templates.find((row) => row.id === el("action-center-template").value);
    const subject = template?.subject || "";
    const body = template?.body || "";
    const instructions = template?.instructions || "";

    if ((subject + body + instructions).includes("{{journey_link}}")) {
      setStatus("Preparing secure journey link...");
      try {
        await ensureJourneyLink();
      } catch (error) {
        setStatus(error.message, "error");
        return;
      }
    }

    el("action-center-subject").value = replaceTokens(subject);
    el("action-center-body").value = replaceTokens(body);
    el("action-center-instructions").value = replaceTokens(instructions);

    const type = el("action-center-type").value;
    el("action-center-subject-wrap").classList.toggle("hidden", type !== "email");
    el("action-center-body-wrap").classList.toggle("hidden", !["email","sms"].includes(type));
    el("action-center-instructions-wrap").classList.toggle("hidden", !["call","task","review"].includes(type));

    const doNow = el("action-center-do-now");
    doNow.textContent =
      type === "email" ? "Open Email Now" :
      type === "sms" ? "Open Text Now" :
      type === "call" ? "Call Now" :
      type === "review" ? "Assign to Me" :
      "Assign to Me";

    doNow.disabled =
      (type === "email" && !contact?.email) ||
      ((type === "sms" || type === "call") && !contact?.phone);
  }

  function renderOpenActions() {
    const list = el("action-center-open-list");
    list.replaceChildren();

    const count = openActions.length;
    const badge = el("journey-action-count");
    badge.textContent = String(count);
    badge.classList.toggle("show", count > 0);

    if (!count) {
      const empty = document.createElement("div");
      empty.className = "drawer-empty";
      empty.textContent = "No assigned actions for this step yet.";
      list.append(empty);
      return;
    }

    openActions.forEach((action) => {
      const item = document.createElement("div");
      item.className = "action-center-open-item";

      const copy = document.createElement("div");
      const heading = document.createElement("strong");
      heading.textContent = portal.titleCase(action.action_type) + " · " + staffName(action.assigned_to);
      const meta = document.createElement("span");
      meta.textContent = [
        action.due_at ? "Due " + portal.formatDate(action.due_at, true) : "No due date",
        portal.titleCase(action.status)
      ].join(" · ");
      copy.append(heading, meta);

      const complete = document.createElement("button");
      complete.type = "button";
      complete.textContent = "Complete";
      complete.addEventListener("click", () => completeAction(action.id));

      item.append(copy, complete);
      list.append(item);
    });
  }

  async function loadActionData() {
    if (!contact?.id) return false;

    const { data: journeySummary, error: summaryError } = await client
      .from("admin_contact_journey_summary")
      .select("*")
      .eq("contact_id", contact.id)
      .maybeSingle();

    if (summaryError || !journeySummary) {
      setStatus(summaryError?.message || "No active journey for this contact.", "error");
      return false;
    }

    summary = journeySummary;

    const [stepResult, templateResult, actionResult] = await Promise.all([
      client
        .from("contact_journey_steps")
        .select("*")
        .eq("journey_id", summary.journey_id)
        .eq("step_key", summary.current_step_key)
        .maybeSingle(),
      client
        .from("journey_action_templates")
        .select("*")
        .eq("step_key", summary.current_step_key)
        .eq("active", true)
        .order("priority"),
      client
        .from("journey_step_actions")
        .select("*")
        .eq("journey_id", summary.journey_id)
        .in("status", ["draft","assigned","in_progress"])
        .order("created_at", { ascending: false })
    ]);

    if (stepResult.error || templateResult.error || actionResult.error || !stepResult.data) {
      setStatus((stepResult.error || templateResult.error || actionResult.error)?.message || "Current journey step could not be loaded.", "error");
      return false;
    }

    step = stepResult.data;
    templates = templateResult.data || [];
    openActions = (actionResult.data || []).filter((action) => action.journey_step_id === step.id);

    el("action-center-step-name").textContent = step.name;
    el("action-center-due").value = toDatetimeLocal(step.due_at);
    populateStaff();
    populateTypes();
    populateTemplates();
    renderOpenActions();
    await applySelectedTemplate();
    return true;
  }

  async function openActionCenter() {
    if (!contact?.id) return;
    journeyLink = "";
    el("action-center-link").value = "";
    el("action-center-link-box").classList.add("hidden");
    setStatus("Loading next-step options...");
    el("journey-action-modal").classList.remove("hidden");
    el("journey-action-modal").setAttribute("aria-hidden", "false");

    const loaded = await loadActionData();
    if (loaded) setStatus("");
  }

  async function saveAction(status, forceSelf = false) {
    if (!contact?.id || !summary?.journey_id || !step?.id) return null;

    const actionType = el("action-center-type").value;
    const templateId = el("action-center-template").value || null;
    const assignedTo = forceSelf
      ? portal.currentUserId()
      : (el("action-center-assignee").value || null);

    const payload = {
      contact_id: contact.id,
      journey_id: summary.journey_id,
      journey_step_id: step.id,
      action_type: actionType,
      status,
      assigned_to: assignedTo,
      due_at: forceSelf ? new Date().toISOString() : fromDatetimeLocal(el("action-center-due").value),
      template_id: templateId,
      subject: el("action-center-subject").value.trim() || null,
      body: el("action-center-body").value.trim() || null,
      instructions: el("action-center-instructions").value.trim() || null,
      created_by: portal.currentUserId(),
      metadata: journeyLink ? { journey_link: journeyLink } : {}
    };

    const { data, error } = await client
      .from("journey_step_actions")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    if (assignedTo) {
      await Promise.all([
        client.from("contact_journey_steps").update({ assigned_to: assignedTo, updated_at: new Date().toISOString() }).eq("id", step.id),
        client.from("contact_journeys").update({ assigned_to: assignedTo, updated_at: new Date().toISOString() }).eq("id", summary.journey_id)
      ]);
    }

    await portal.logActivity(
      contact.id,
      "journey_action_created",
      "Journey action " + (status === "in_progress" ? "started" : "assigned"),
      portal.titleCase(actionType) + " · " + step.name,
      {
        journey_id: summary.journey_id,
        journey_step_id: step.id,
        journey_action_id: data.id,
        assigned_to: assignedTo,
        action_type: actionType
      }
    );

    return data;
  }

  async function assignAction() {
    setStatus("Assigning action...");
    try {
      await saveAction("assigned", false);
      setStatus("Action assigned and added to the task queue.", "success");
      await loadActionData();
      await portal.loadDashboard();
    } catch (error) {
      setStatus(error.message || "Could not assign this action.", "error");
    }
  }

  async function doNow() {
    const actionType = el("action-center-type").value;
    setStatus("Preparing action...");

    try {
      const action = await saveAction("in_progress", true);

      if (actionType === "email") {
        if (!contact?.email) throw new Error("This contact does not have an email address.");
        const subject = el("action-center-subject").value.trim();
        const body = el("action-center-body").value.trim();
        setStatus("Opening your email app. The action remains in your task queue until completed.", "success");
        window.location.href =
          "mailto:" + encodeURIComponent(contact.email) +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body);
      } else if (actionType === "sms") {
        setStatus("Opening the ReVitalized text composer.", "success");
        document.dispatchEvent(new CustomEvent("ra:open-text-composer", {
          detail: {
            body: el("action-center-body").value.trim(),
            step_key: step.step_key,
            journey_id: summary.journey_id,
            journey_action_id: action.id
          }
        }));
        closeModal();
      } else if (actionType === "call") {
        if (!contact?.phone) throw new Error("This contact does not have a phone number.");
        setStatus("Opening the phone action. The task remains open until you mark it complete.", "success");
        window.location.href = "tel:" + cleanPhone(contact.phone);
      } else {
        setStatus("Assigned to you and added to your task queue.", "success");
      }

      await loadActionData();
      await portal.loadDashboard();
    } catch (error) {
      setStatus(error.message || "Could not start this action.", "error");
    }
  }

  async function completeAction(actionId) {
    setStatus("Completing action...");

    const now = new Date().toISOString();
    const { error } = await client
      .from("journey_step_actions")
      .update({
        status: "completed",
        completed_by: portal.currentUserId(),
        completed_at: now,
        updated_at: now
      })
      .eq("id", actionId);

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    await client
      .from("follow_up_tasks")
      .update({ status: "completed", completed_at: now })
      .eq("journey_action_id", actionId)
      .eq("status", "open");

    setStatus("Action completed.", "success");
    await loadActionData();
    await portal.loadDashboard();
  }

  document.addEventListener("ra:contact-opened", (event) => {
    contact = event.detail.contact;
    summary = null;
    step = null;
    templates = [];
    openActions = [];
    journeyLink = "";

    client
      .from("admin_contact_journey_summary")
      .select("journey_id,current_step_key")
      .eq("contact_id", event.detail.contactId)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data?.journey_id || !data?.current_step_key) {
          el("journey-action-count").classList.remove("show");
          return;
        }

        const { data: currentStep } = await client
          .from("contact_journey_steps")
          .select("id")
          .eq("journey_id", data.journey_id)
          .eq("step_key", data.current_step_key)
          .maybeSingle();

        if (!currentStep?.id) return;

        const { count } = await client
          .from("journey_step_actions")
          .select("*", { count: "exact", head: true })
          .eq("journey_step_id", currentStep.id)
          .in("status", ["draft","assigned","in_progress"]);

        const badge = el("journey-action-count");
        badge.textContent = String(count || 0);
        badge.classList.toggle("show", Number(count || 0) > 0);
      });
  });

  document.addEventListener("ra:contact-closed", () => {
    contact = null;
    closeModal();
  });

  document.addEventListener("ra:open-action-center", openActionCenter);

  el("journey-action-center").addEventListener("click", openActionCenter);
  document.querySelectorAll("[data-action-center-close]").forEach((node) => node.addEventListener("click", closeModal));

  el("action-center-type").addEventListener("change", async () => {
    populateTemplates();
    await applySelectedTemplate();
  });

  el("action-center-template").addEventListener("change", applySelectedTemplate);
  el("action-center-assign").addEventListener("click", assignAction);
  el("action-center-do-now").addEventListener("click", doNow);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el("journey-action-modal").classList.contains("hidden")) {
      closeModal();
    }
  });
})();