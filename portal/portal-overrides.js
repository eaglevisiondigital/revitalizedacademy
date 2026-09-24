(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const el = (id) => document.getElementById(id);

  let selectedStep = null;
  let capabilities = {};
  let staffRole = "";
  let activation = null;
  let paymentRecords = [];
  let auditRows = [];
  let programs = [];

  function title(value) {
    const special = {
      waiting_client: "Waiting on Client",
      waiting_revit: "Waiting on ReVitalized",
      interac_etransfer: "Interac e-Transfer",
      ach_bank_transfer: "ACH / Bank Transfer",
      wire_transfer: "Wire Transfer",
      external_card: "External Card",
      integrated_processor: "Integrated Processor",
      complimentary_waived: "Complimentary / Waived",
      not_sent: "Not Sent"
    };
    return special[value] || portal.titleCase(value || "");
  }

  function status(id, message, type = "") {
    const target = el(id);
    if (!target) return;
    target.textContent = message || "";
    target.className = "form-status" + (type ? " " + type : "");
  }

  function nowLocal() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function toIso(value) {
    return value ? new Date(value).toISOString() : null;
  }

  function getJourney() {
    return window.RA_JOURNEY?.getJourney?.() || null;
  }

  function getContact() {
    return window.RA_JOURNEY?.getContact?.() || null;
  }

  function getSteps() {
    return window.RA_JOURNEY?.getSteps?.() || [];
  }

  function closeModal() {
    el("override-modal").classList.add("hidden");
    el("override-modal").setAttribute("aria-hidden", "true");
    selectedStep = null;
  }

  async function invokeOverride(body) {
    const { data, error } = await client.functions.invoke("journey-override", { body });
    if (error) throw new Error(error.message || "Override request failed.");
    if (!data?.ok) throw new Error(data?.error || "Override request failed.");
    return data;
  }

  async function loadCapabilities() {
    const data = await invokeOverride({ action: "get_capabilities" });
    capabilities = data.permissions || {};
    staffRole = data.role || "";
  }

  async function loadFinancialData() {
    const journey = getJourney();
    if (!journey?.journey_id) return;

    const [activationResult, paymentResult, programResult] = await Promise.all([
      client
        .from("journey_enrollment_activations")
        .select("*")
        .eq("journey_id", journey.journey_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("payment_records")
        .select("*")
        .eq("journey_id", journey.journey_id)
        .order("received_at", { ascending: false }),
      client
        .from("program_catalog")
        .select("program_code,name,active")
        .eq("active", true)
        .order("name")
    ]);

    if (activationResult.error) throw activationResult.error;
    if (paymentResult.error) throw paymentResult.error;
    if (programResult.error) throw programResult.error;

    activation = activationResult.data || null;
    paymentRecords = paymentResult.data || [];
    programs = programResult.data || [];
  }

  async function loadAudit() {
    const journey = getJourney();
    if (!journey?.journey_id || !selectedStep?.id) {
      auditRows = [];
    programs = [];
      return;
    }

    const { data, error } = await client
      .from("admin_manual_override_history")
      .select("*")
      .eq("journey_id", journey.journey_id)
      .or("journey_step_id.eq." + selectedStep.id + ",journey_step_id.is.null")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) throw error;
    auditRows = data || [];
  }

  function renderCapabilities() {
    const financial = Boolean(capabilities["finance.record_payment"]);
    const reverse = Boolean(capabilities["finance.reverse_payment"]);
    const agreement = Boolean(capabilities["agreement.override"]);
    const access = Boolean(capabilities["membership.access_override"]);
    const plan = Boolean(capabilities["plan.override"]);
    const waive = Boolean(capabilities["journey.step.waive"]);

    const statusSelect = el("override-status");
    [...statusSelect.options].forEach((option) => {
      if (option.value === "waived") option.disabled = !waive;
    });

    el("override-record-payment").disabled = !financial;
    el("override-payment-form").querySelectorAll("input,select").forEach((node) => {
      node.disabled = !financial;
    });

    el("override-save-agreement").disabled = !agreement;
    el("override-agreement-status").disabled = !agreement;
    el("override-agreement-method").disabled = !agreement;

    el("override-save-access").disabled = !access;
    el("override-access-status").disabled = !access;
    el("override-access-method").disabled = !access;

    el("override-financial-role").textContent =
      financial ? title(staffRole) + " authorized" : title(staffRole) + " view only";

    el("override-program-select").disabled = !plan;
    el("override-save-program").disabled = !plan;

    return { financial, reverse, agreement, access, plan, waive };
  }


  function renderPlanPanel() {
    const show = ["plan_selection","payment_agreement"].includes(selectedStep?.step_key);
    const panel = el("override-plan-panel");
    panel.classList.toggle("hidden", !show);
    if (!show) return;

    const select = el("override-program-select");
    select.replaceChildren();

    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Select ReVitalized program";
    select.append(blank);

    programs.forEach((row) => {
      const option = document.createElement("option");
      option.value = row.program_code;
      option.textContent = row.name;
      select.append(option);
    });

    select.value = activation?.program_code || "";
    status("override-program-message", "");
  }

  function renderFinancial() {
    const paymentStep = selectedStep?.step_key === "payment_agreement";
    const accessStep = selectedStep?.step_key === "backend_activation";

    el("override-financial-panel").classList.toggle("hidden", !paymentStep);
    el("override-access-panel").classList.toggle("hidden", !accessStep);

    if (paymentStep) {
      el("override-current-payment").textContent = title(activation?.payment_status || "pending");
      el("override-current-agreement").textContent = title(activation?.agreement_status || "not_sent");
      el("override-current-access").textContent = title(activation?.access_status || "pending");

      el("override-payment-amount").value =
        activation?.amount_cents !== null && activation?.amount_cents !== undefined
          ? (Number(activation.amount_cents) / 100).toFixed(2)
          : "";
      el("override-payment-currency").value = activation?.currency || "USD";
      el("override-payment-reference").value = activation?.payment_reference || "";
      el("override-payment-date").value = nowLocal();
      el("override-agreement-status").value = activation?.agreement_status || "not_sent";

      // Generic step writes are intentionally disabled for payment.
      el("override-save-step").disabled = true;
      status("override-step-status", "Use the audited Payment & Agreement controls below for this step.");
    } else {
      el("override-save-step").disabled = !capabilities["journey.step.status"];
      status("override-step-status", "");
    }

    if (accessStep) {
      el("override-access-status").value = activation?.access_status || "pending";
    }

    renderPlanPanel();
  }

  function renderPaymentHistory() {
    const list = el("override-payment-history");
    list.replaceChildren();

    if (!paymentRecords.length) {
      const empty = document.createElement("div");
      empty.className = "override-history-item";
      empty.innerHTML = "<strong>No manual payment records yet.</strong><span>Integrated gateway records will also appear here as that provider is connected.</span>";
      list.append(empty);
      return;
    }

    paymentRecords.forEach((row) => {
      const item = document.createElement("div");
      item.className = "override-history-item" + (row.status === "reversed" ? " reversal" : "");

      const amount = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: row.currency || "USD"
      }).format(Number(row.amount_cents || 0) / 100);

      const heading = document.createElement("strong");
      heading.textContent =
        title(row.transaction_type) + " · " +
        (row.transaction_type === "waiver" ? "Waived" : amount);

      const meta = document.createElement("span");
      meta.textContent = [
        title(row.payment_method),
        row.reference_number ? "Ref " + row.reference_number : "",
        portal.formatDate(row.received_at, true),
        title(row.status)
      ].filter(Boolean).join(" · ");

      item.append(heading, meta);

      if (row.notes) {
        const p = document.createElement("p");
        p.textContent = row.notes;
        item.append(p);
      }

      if (row.status === "recorded" && capabilities["finance.reverse_payment"]) {
        const actions = document.createElement("div");
        actions.className = "override-history-actions";
        const reverse = document.createElement("button");
        reverse.type = "button";
        reverse.textContent = "Reverse / Correct";
        reverse.addEventListener("click", () => reversePayment(row));
        actions.append(reverse);
        item.append(actions);
      }

      list.append(item);
    });
  }

  function renderAudit() {
    const list = el("override-audit-history");
    list.replaceChildren();

    if (!auditRows.length) {
      const empty = document.createElement("div");
      empty.className = "override-history-item";
      empty.innerHTML = "<strong>No manual overrides recorded for this step.</strong><span>Automated activity remains in the main contact timeline.</span>";
      list.append(empty);
      return;
    }

    auditRows.forEach((row) => {
      const item = document.createElement("div");
      item.className = "override-history-item";

      const heading = document.createElement("strong");
      heading.textContent = title(row.action);

      const meta = document.createElement("span");
      meta.textContent = [
        row.actor_name,
        title(row.actor_role),
        row.completion_method ? title(row.completion_method) : "",
        portal.formatDate(row.created_at, true)
      ].filter(Boolean).join(" · ");

      const p = document.createElement("p");
      p.textContent = "Reason: " + row.reason + (row.notes ? "\nNotes: " + row.notes : "");

      item.append(heading, meta, p);
      list.append(item);
    });
  }

  function renderClientFormButton() {
    const button = el("override-open-client-form");
    const supported = ["vitality_assessment","onboarding_health_questionnaire"].includes(selectedStep?.step_key);
    button.classList.toggle("hidden", !supported);

    if (selectedStep?.step_key === "vitality_assessment") {
      button.textContent = "Open Vitality Assessment With Client";
    } else if (selectedStep?.step_key === "onboarding_health_questionnaire") {
      button.textContent = "Open Health Questionnaire With Client";
    }
  }

  async function openOverride(stepId, presetStatus = "") {
    const step = getSteps().find((row) => row.id === stepId);
    if (!step) return;

    selectedStep = step;
    activation = null;
    paymentRecords = [];
    auditRows = [];

    el("override-modal").classList.remove("hidden");
    el("override-modal").setAttribute("aria-hidden", "false");

    el("override-step-name").textContent = step.name;
    el("override-step-meta").textContent =
      title(step.step_type) + " · Current status: " + title(step.status) +
      (step.required ? " · Required" : " · Optional");

    el("override-status").value = presetStatus || step.status;
    el("override-method").value =
      presetStatus === "completed" && ["form","assessment","onboarding"].includes(step.step_type)
        ? "completed_with_client"
        : "manual_staff";
    el("override-reason").value = "";
    el("override-notes").value = "";
    el("override-payment-provider").value = "";
    el("override-payment-method").value = "external_card";
    el("override-agreement-method").value = "manual_owner_admin";
    el("override-access-method").value = "manual_owner_admin";

    status("override-step-status", "Loading permissions and audit history...");
    status("override-payment-status", "");
    status("override-agreement-message", "");
    status("override-access-message", "");

    try {
      await Promise.all([
        loadCapabilities(),
        loadFinancialData(),
        loadAudit()
      ]);
      renderCapabilities();
      renderFinancial();
      renderPaymentHistory();
      renderAudit();
      renderClientFormButton();
      if (selectedStep.step_key !== "payment_agreement") status("override-step-status", "");
    } catch (error) {
      status("override-step-status", error.message || "Override controls could not be loaded.", "error");
    }
  }

  async function refreshAfterOverride() {
    const contact = getContact();
    if (!contact?.id) return;
    await window.RA_JOURNEY?.refresh?.();
    await portal.loadDashboard();
    // refresh local state if the modal remains open
    const stepStillExists = selectedStep?.id && getSteps().some((row) => row.id === selectedStep.id);
    if (stepStillExists) {
      selectedStep = getSteps().find((row) => row.id === selectedStep.id) || selectedStep;
      await Promise.all([loadFinancialData(), loadAudit()]);
      renderFinancial();
      renderPaymentHistory();
      renderAudit();
    }
  }

  async function saveStepOverride() {
    if (!selectedStep) return;
    const reason = el("override-reason").value.trim();
    if (!reason) {
      status("override-step-status", "Enter the reason for this manual change.", "error");
      el("override-reason").focus();
      return;
    }

    const targetStatus = el("override-status").value;
    const method = el("override-method").value;
    const notes = el("override-notes").value.trim();

    status("override-step-status", "Saving audited override...");

    try {
      await invokeOverride({
        action: "step_override",
        step_id: selectedStep.id,
        target_status: targetStatus,
        completion_method: method,
        reason,
        notes
      });

      status("override-step-status", "Manual status saved and audit trail updated.", "success");
      await refreshAfterOverride();

      if (["completed","skipped","waived"].includes(targetStatus)) {
        window.setTimeout(closeModal, 550);
      }
    } catch (error) {
      status("override-step-status", error.message, "error");
    }
  }


  async function saveProgramOverride() {
    const journey = getJourney();
    if (!journey?.journey_id) return;

    const programCode = el("override-program-select").value;
    const reason = el("override-reason").value.trim();

    if (!programCode) {
      status("override-program-message", "Choose the ReVitalized program.", "error");
      return;
    }

    if (!reason) {
      status("override-program-message", "Enter the override reason above first.", "error");
      return;
    }

    status("override-program-message", "Saving program override...");

    try {
      const data = await invokeOverride({
        action: "plan_override",
        journey_id: journey.journey_id,
        program_code: programCode,
        reason,
        notes: el("override-notes").value.trim()
      });

      activation = data.activation;
      status("override-program-message", "Program updated and entitlements realigned where applicable.", "success");
      await refreshAfterOverride();
    } catch (error) {
      status("override-program-message", error.message, "error");
    }
  }

  async function recordPayment(event) {
    event.preventDefault();
    const journey = getJourney();
    if (!journey?.journey_id) return;

    const reason = el("override-reason").value.trim();
    if (!reason) {
      status("override-payment-status", "Enter the override reason above before recording payment.", "error");
      el("override-reason").focus();
      return;
    }

    const method = el("override-payment-method").value;
    const amount = method === "complimentary_waived"
      ? 0
      : Number(el("override-payment-amount").value || 0);

    if (method !== "complimentary_waived" && (!Number.isFinite(amount) || amount <= 0)) {
      status("override-payment-status", "Enter the payment amount received.", "error");
      return;
    }

    status("override-payment-status", method === "complimentary_waived" ? "Recording waiver..." : "Recording external payment...");

    try {
      await invokeOverride({
        action: "record_payment",
        journey_id: journey.journey_id,
        amount_cents: Math.round(amount * 100),
        currency: el("override-payment-currency").value,
        payment_method: method,
        received_at: toIso(el("override-payment-date").value),
        reference_number: el("override-payment-reference").value.trim(),
        provider: el("override-payment-provider").value.trim(),
        reason,
        notes: el("override-notes").value.trim()
      });

      status(
        "override-payment-status",
        method === "complimentary_waived"
          ? "Payment requirement waived and audit record created."
          : "Payment recorded and audit record created.",
        "success"
      );
      await refreshAfterOverride();
    } catch (error) {
      status("override-payment-status", error.message, "error");
    }
  }

  async function reversePayment(row) {
    const reason = window.prompt(
      "Why are you reversing or correcting this payment record? This will remain in the audit trail."
    );
    if (!reason?.trim()) return;

    try {
      await invokeOverride({
        action: "reverse_payment",
        payment_id: row.id,
        reason: reason.trim(),
        notes: "Reversed from the ReVitalized staff portal."
      });
      status("override-payment-status", "Payment record reversed. Original history was preserved.", "success");
      await refreshAfterOverride();
    } catch (error) {
      status("override-payment-status", error.message, "error");
    }
  }

  async function saveAgreement() {
    if (!activation?.id) {
      status("override-agreement-message", "Record or prepare the enrollment activation before changing agreement status.", "error");
      return;
    }

    const reason = el("override-reason").value.trim();
    if (!reason) {
      status("override-agreement-message", "Enter the override reason above first.", "error");
      return;
    }

    status("override-agreement-message", "Saving agreement status...");

    try {
      const data = await invokeOverride({
        action: "agreement_override",
        activation_id: activation.id,
        agreement_status: el("override-agreement-status").value,
        completion_method: el("override-agreement-method").value,
        reason,
        notes: el("override-notes").value.trim()
      });
      activation = data.activation;
      status("override-agreement-message", "Agreement status saved and audited.", "success");
      await refreshAfterOverride();
    } catch (error) {
      status("override-agreement-message", error.message, "error");
    }
  }

  async function saveAccess() {
    if (!activation?.id) {
      status("override-access-message", "An enrollment activation record is required first.", "error");
      return;
    }

    const reason = el("override-reason").value.trim();
    if (!reason) {
      status("override-access-message", "Enter the override reason above first.", "error");
      return;
    }

    status("override-access-message", "Saving access status...");

    try {
      const data = await invokeOverride({
        action: "access_override",
        activation_id: activation.id,
        access_status: el("override-access-status").value,
        completion_method: el("override-access-method").value,
        reason,
        notes: el("override-notes").value.trim()
      });
      activation = data.activation;
      status("override-access-message", "Member access status saved and audited.", "success");
      await refreshAfterOverride();
    } catch (error) {
      status("override-access-message", error.message, "error");
    }
  }

  async function openClientForm() {
    const contact = getContact();
    const journey = getJourney();
    if (!contact?.id || !journey?.journey_id || !selectedStep) return;

    if (selectedStep.step_key === "vitality_assessment") {
      window.open("../consult.html", "_blank", "noopener");
      return;
    }

    if (selectedStep.step_key === "onboarding_health_questionnaire") {
      status("override-step-status", "Creating secure client questionnaire link...");
      try {
        const { data, error } = await client.functions.invoke("journey-link", {
          body: {
            action: "create_link",
            contact_id: contact.id,
            journey_id: journey.journey_id
          }
        });
        if (error || !data?.url) throw new Error(error?.message || data?.error || "Unable to create secure journey link.");
        const source = new URL(data.url);
        const token = source.searchParams.get("token");
        if (!token) throw new Error("Secure journey token was not returned.");
        window.open("../health-profile.html?journey_token=" + encodeURIComponent(token), "_blank", "noopener");
        status("override-step-status", "Secure questionnaire opened. Complete it with the client, then refresh the record.", "success");
      } catch (error) {
        status("override-step-status", error.message, "error");
      }
    }
  }

  document.addEventListener("ra:open-override", (event) => {
    openOverride(event.detail?.step_id, event.detail?.target_status || "").catch((error) => {
      console.error("Override modal failed", error);
    });
  });

  document.querySelectorAll("[data-override-close]").forEach((node) => node.addEventListener("click", closeModal));
  el("override-save-step").addEventListener("click", saveStepOverride);
  el("override-payment-form").addEventListener("submit", recordPayment);
  el("override-save-program").addEventListener("click", saveProgramOverride);
  el("override-save-agreement").addEventListener("click", saveAgreement);
  el("override-save-access").addEventListener("click", saveAccess);
  el("override-open-client-form").addEventListener("click", openClientForm);

  el("override-payment-method").addEventListener("change", () => {
    const waived = el("override-payment-method").value === "complimentary_waived";
    el("override-payment-amount").disabled = waived || !capabilities["finance.record_payment"];
    if (waived) el("override-payment-amount").value = "0.00";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el("override-modal").classList.contains("hidden")) closeModal();
  });
})();