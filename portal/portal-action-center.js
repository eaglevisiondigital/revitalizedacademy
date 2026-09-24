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
  let appointment = null;
  let activation = null;
  let programTag = "";

  const PROGRAMS = {
    "holistic-foundations": { name: "Holistic Foundations", commitment: 6, weekly: 25, monthly: 89 },
    "vitality-accelerator-cohort": { name: "Vitality Accelerator Cohort", commitment: null, one_time: 1000 },
    "vitality-accelerator": { name: "Vitality Accelerator", commitment: null, one_time: 2000 },
    "total-wellness-6": { name: "6-Month Intensive", commitment: 6 },
    "total-wellness-12": { name: "12-Month Intensive", commitment: 12 }
  };

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

  function populateStaffSelect(select, selectedValue = "") {
    if (!select) return;
    select.replaceChildren();

    const unassigned = document.createElement("option");
    unassigned.value = "";
    unassigned.textContent = "Unassigned";
    select.append(unassigned);

    portal.staffDirectory().forEach((staff) => {
      const option = document.createElement("option");
      option.value = staff.user_id;
      option.textContent = staff.display_name + " · " + portal.titleCase(staff.role);
      option.selected = staff.user_id === selectedValue;
      select.append(option);
    });
  }

  function populateStaff() {
    populateStaffSelect(el("action-center-assignee"), portal.currentUserId() || "");
    populateStaffSelect(el("appointment-assignee"), appointment?.assigned_to || summary?.assigned_to || "");
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


  function setOperationalStatus(targetId, message, type = "") {
    const target = el(targetId);
    if (!target) return;
    target.textContent = message || "";
    target.className = "action-center-status" + (type ? " " + type : "");
  }

  function appointmentTypeForStep() {
    if (!step?.step_key) return null;
    if (step.step_key.startsWith("application_interview")) return "application_interview";
    if (step.step_key.startsWith("consultation")) return "consultation";
    return appointment?.appointment_type || null;
  }

  function programFromTag() {
    if (summary?.journey_key === "direct_membership") return "holistic-foundations";
    return String(programTag || "").replace(/^program:/, "");
  }

  function applyActivationDefaults(force = false) {
    const code = el("activation-program").value;
    const billing = el("activation-billing").value;
    const config = PROGRAMS[code] || {};

    if (force || !el("activation-commitment").value) {
      el("activation-commitment").value = config.commitment || "";
    }

    if (force || !el("activation-amount").value) {
      if (billing === "weekly" && config.weekly) el("activation-amount").value = config.weekly.toFixed(2);
      else if (billing === "monthly" && config.monthly) el("activation-amount").value = config.monthly.toFixed(2);
      else if (billing === "one_time" && config.one_time) el("activation-amount").value = config.one_time.toFixed(2);
      else if (force) el("activation-amount").value = "";
    }
  }

  function renderOperational() {
    const wrap = el("action-center-operational");
    const appointmentPanel = el("action-center-appointment");
    const activationPanel = el("action-center-activation");

    wrap.classList.add("hidden");
    appointmentPanel.classList.add("hidden");
    activationPanel.classList.add("hidden");

    const appointmentSteps = new Set([
      "application_interview_schedule","application_interview",
      "consultation_schedule","consultation"
    ]);

    if (appointmentSteps.has(step?.step_key)) {
      wrap.classList.remove("hidden");
      appointmentPanel.classList.remove("hidden");

      const type = appointmentTypeForStep();
      el("appointment-ops-title").textContent =
        type === "consultation" ? "ReVitalized consultation" : "Application interview";
      el("appointment-ops-state").textContent = portal.titleCase(appointment?.status || "requested");
      el("appointment-status").value = appointment?.status || (step.step_key.endsWith("_schedule") ? "requested" : "scheduled");
      el("appointment-start").value = appointment?.scheduled_start ? toDatetimeLocal(appointment.scheduled_start) : "";
      el("appointment-end").value = appointment?.scheduled_end ? toDatetimeLocal(appointment.scheduled_end) : "";
      el("appointment-time-zone").value = appointment?.time_zone || "";
      el("appointment-format").value = appointment?.format || "";
      el("appointment-location").value = appointment?.location_url || "";
      populateStaffSelect(el("appointment-assignee"), appointment?.assigned_to || summary?.assigned_to || "");

      const requested = Array.isArray(appointment?.requested_availability)
        ? appointment.requested_availability.filter(Boolean).join(" · ")
        : "";
      const notes = appointment?.client_notes || "";
      el("appointment-request-copy").textContent = [requested ? "Requested availability: " + requested : "", notes ? "Client note: " + notes : ""].filter(Boolean).join(" | ");
      setOperationalStatus("appointment-status-message", "");
    }

    if (["payment_agreement","backend_activation"].includes(step?.step_key)) {
      wrap.classList.remove("hidden");
      activationPanel.classList.remove("hidden");

      const inferredProgram = activation?.program_code || programFromTag();
      el("activation-program").value = inferredProgram || "";
      el("activation-billing").value = activation?.billing_choice || "";
      el("activation-commitment").value = activation?.commitment_months || "";
      el("activation-amount").value = activation?.amount_cents != null ? (Number(activation.amount_cents) / 100).toFixed(2) : "";
      el("activation-payment-status").value = activation?.payment_status || "pending";
      el("activation-agreement-status").value = activation?.agreement_status || "not_sent";
      el("activation-access-status").value = activation?.access_status || "pending";
      el("activation-currency").value = activation?.currency || "USD";
      el("activation-payment-url").value = activation?.payment_url || "";
      el("activation-agreement-url").value = activation?.agreement_url || "";
      el("activation-ops-state").textContent =
        step.step_key === "backend_activation"
          ? "Access " + portal.titleCase(activation?.access_status || "pending")
          : "Payment " + portal.titleCase(activation?.payment_status || "pending");

      if (!activation) {
        if (inferredProgram === "holistic-foundations") {
          el("activation-billing").value = "monthly";
          el("activation-commitment").value = "6";
          el("activation-amount").value = "89.00";
        } else if (inferredProgram === "vitality-accelerator-cohort") {
          el("activation-billing").value = "one_time";
          el("activation-amount").value = "1000.00";
        } else if (inferredProgram === "vitality-accelerator") {
          el("activation-billing").value = "one_time";
          el("activation-amount").value = "2000.00";
        }
      }

      setOperationalStatus("activation-status-message", "");
    }
  }

  async function refreshOperationalJourney() {
    if (!contact?.id) return;
    await portal.openContact(contact.id);
    await portal.loadDashboard();
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    await loadActionData();
  }

  async function saveAppointment() {
    if (!contact?.id || !summary?.journey_id || !step?.id) return;

    const type = appointmentTypeForStep();
    if (!type) return;

    const statusValue = el("appointment-status").value;
    const start = fromDatetimeLocal(el("appointment-start").value);
    const end = fromDatetimeLocal(el("appointment-end").value);
    const assignedTo = el("appointment-assignee").value || null;

    if (["scheduled","completed"].includes(statusValue) && !start) {
      setOperationalStatus("appointment-status-message", "Choose the appointment date and time before confirming it.", "error");
      return;
    }

    const payload = {
      contact_id: contact.id,
      journey_id: summary.journey_id,
      journey_step_id: appointment?.journey_step_id || step.id,
      appointment_type: type,
      status: statusValue,
      provider: appointment?.provider || "manual",
      provider_event_id: appointment?.provider_event_id || null,
      scheduled_start: start,
      scheduled_end: end,
      time_zone: el("appointment-time-zone").value.trim() || null,
      format: el("appointment-format").value || null,
      location_url: el("appointment-location").value.trim() || null,
      requested_availability: appointment?.requested_availability || [],
      client_notes: appointment?.client_notes || null,
      assigned_to: assignedTo,
      created_by: appointment?.created_by || portal.currentUserId(),
      updated_at: new Date().toISOString()
    };

    setOperationalStatus("appointment-status-message", "Saving appointment...");

    let result;
    if (appointment?.id) {
      result = await client.from("journey_appointments").update(payload).eq("id", appointment.id).select("*").single();
    } else {
      result = await client.from("journey_appointments").insert(payload).select("*").single();
    }

    if (result.error) {
      setOperationalStatus("appointment-status-message", result.error.message, "error");
      return;
    }

    appointment = result.data;

    if (assignedTo) {
      await Promise.all([
        client.from("contact_journeys").update({ assigned_to: assignedTo, updated_at: new Date().toISOString() }).eq("id", summary.journey_id),
        client.from("contacts").update({ assigned_to: assignedTo, updated_at: new Date().toISOString() }).eq("id", contact.id)
      ]);
    }

    await portal.logActivity(
      contact.id,
      "appointment_updated",
      statusValue === "scheduled" ? "Appointment confirmed" : "Appointment updated",
      type === "consultation" ? "ReVitalized consultation" : "Application interview",
      { appointment_id: appointment.id, status: statusValue, assigned_to: assignedTo, scheduled_start: start }
    );

    setOperationalStatus("appointment-status-message", "Appointment saved.", "success");
    await refreshOperationalJourney();
  }

  async function saveActivation() {
    if (!contact?.id || !summary?.journey_id || !step?.id) return;

    const programCode = el("activation-program").value;
    if (!programCode) {
      setOperationalStatus("activation-status-message", "Choose the program before saving enrollment.", "error");
      return;
    }

    const config = PROGRAMS[programCode] || {};
    const amount = Number(el("activation-amount").value || 0);
    const agreementStatus = el("activation-agreement-status").value;
    const paymentStatus = el("activation-payment-status").value;
    const accessStatus = el("activation-access-status").value;
    const now = new Date().toISOString();

    const payload = {
      contact_id: contact.id,
      journey_id: summary.journey_id,
      program_code: programCode,
      program_name: config.name || portal.titleCase(programCode),
      billing_choice: el("activation-billing").value || null,
      commitment_months: el("activation-commitment").value ? Number(el("activation-commitment").value) : null,
      amount_cents: Number.isFinite(amount) ? Math.round(amount * 100) : null,
      currency: el("activation-currency").value || "USD",
      payment_provider: activation?.payment_provider || (el("activation-payment-url").value.trim() ? "external_link" : null),
      payment_url: el("activation-payment-url").value.trim() || null,
      payment_status: paymentStatus,
      agreement_status: agreementStatus,
      agreement_url: el("activation-agreement-url").value.trim() || null,
      agreement_signed_at: agreementStatus === "signed" ? (activation?.agreement_signed_at || now) : null,
      access_status: accessStatus,
      updated_at: now
    };

    setOperationalStatus("activation-status-message", "Saving enrollment activation...");

    let result;
    if (activation?.id) {
      result = await client.from("journey_enrollment_activations").update(payload).eq("id", activation.id).select("*").single();
    } else {
      result = await client.from("journey_enrollment_activations").insert({
        ...payload,
        journey_step_id: step.id,
        created_by: portal.currentUserId()
      }).select("*").single();
    }

    if (result.error) {
      setOperationalStatus("activation-status-message", result.error.message, "error");
      return;
    }

    activation = result.data;

    await portal.logActivity(
      contact.id,
      "enrollment_activation_updated",
      "Enrollment activation updated",
      (config.name || programCode) + " · Payment " + portal.titleCase(paymentStatus) + " · Agreement " + portal.titleCase(agreementStatus),
      {
        activation_id: activation.id,
        program_code: programCode,
        payment_status: paymentStatus,
        agreement_status: agreementStatus,
        access_status: accessStatus
      }
    );

    setOperationalStatus("activation-status-message", "Enrollment activation saved.", "success");
    await refreshOperationalJourney();
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

    const [stepResult, templateResult, actionResult, appointmentResult, activationResult, programTagResult] = await Promise.all([
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
        .order("created_at", { ascending: false }),
      client
        .from("journey_appointments")
        .select("*")
        .eq("journey_id", summary.journey_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("journey_enrollment_activations")
        .select("*")
        .eq("journey_id", summary.journey_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("contact_tags")
        .select("tag")
        .eq("contact_id", contact.id)
        .like("tag", "program:%")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    const loadError = stepResult.error || templateResult.error || actionResult.error || appointmentResult.error || activationResult.error || programTagResult.error;
    if (loadError || !stepResult.data) {
      setStatus(loadError?.message || "Current journey step could not be loaded.", "error");
      return false;
    }

    step = stepResult.data;
    templates = templateResult.data || [];
    openActions = (actionResult.data || []).filter((action) => action.journey_step_id === step.id);
    appointment = appointmentResult.data || null;
    activation = activationResult.data || null;
    programTag = programTagResult.data?.tag || "";

    el("action-center-step-name").textContent = step.name;
    el("action-center-due").value = toDatetimeLocal(step.due_at);
    populateStaff();
    populateTypes();
    populateTemplates();
    renderOpenActions();
    renderOperational();
    await applySelectedTemplate();
    return true;
  }

  async function openActionCenter() {
    if (!contact?.id) return;
    journeyLink = "";
    appointment = null;
    activation = null;
    programTag = "";
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
    appointment = null;
    activation = null;
    programTag = "";

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
  el("appointment-save").addEventListener("click", saveAppointment);
  el("activation-save").addEventListener("click", saveActivation);
  el("activation-program").addEventListener("change", () => applyActivationDefaults(true));
  el("activation-billing").addEventListener("change", () => applyActivationDefaults(true));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el("journey-action-modal").classList.contains("hidden")) {
      closeModal();
    }
  });
})();