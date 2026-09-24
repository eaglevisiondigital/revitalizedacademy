(() => {
  "use strict";

  const FUNCTION_URL = "https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/journey-link";
  const API_KEY = "sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd";
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const loading = document.getElementById("cj-loading");
  const content = document.getElementById("cj-content");
  const errorPanel = document.getElementById("cj-error");
  const errorCopy = document.getElementById("cj-error-copy");
  let snapshot = null;

  function showError(message) {
    loading.classList.add("hidden");
    content.classList.add("hidden");
    errorPanel.classList.remove("hidden");
    errorCopy.textContent = message || "The link may have expired. Please contact ReVitalized Academy for a new one.";
  }

  function actionLink(url, label, primary = true) {
    const a = document.createElement("a");
    a.href = url;
    a.className = "cj107-action" + (primary ? " primary" : "");
    a.textContent = label;
    return a;
  }

  function renderSteps(steps, currentKey) {
    const list = document.getElementById("cj-steps");
    list.replaceChildren();

    steps.forEach((step) => {
      const row = document.createElement("div");
      const current = step.status === "in_progress";
      row.className = "cj107-step " + step.status + (current ? " current" : "");

      const number = document.createElement("b");
      number.textContent = step.status === "completed" ? "✓" : String(step.step_order).padStart(2, "0");
      const name = document.createElement("strong");
      name.textContent = step.name;
      const status = document.createElement("span");
      status.textContent = current ? "Current" : step.status.replaceAll("_", " ");

      row.append(number, name, status);
      list.append(row);
    });
  }

  function renderAction(data) {
    const area = document.getElementById("cj-action-area");
    const note = document.getElementById("cj-action-note");
    area.replaceChildren();

    const action = data.action || {};
    note.textContent = action.note || "This is the current next step in your ReVitalized journey.";

    if (action.type === "link" && action.url) {
      area.append(actionLink(action.url, action.label || "Continue"));
      return;
    }

    if (action.type === "schedule_request") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cj107-action primary";
      button.textContent = action.label || "Request Appointment";
      button.addEventListener("click", () => {
        document.getElementById("cj-schedule-section").classList.remove("hidden");
        document.getElementById("cj-schedule-title").textContent = action.label || "Request your preferred times.";
        document.getElementById("cj-schedule-section").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      area.append(button);
      return;
    }

    if (action.type === "scheduled" && data.appointment) {
      const box = document.createElement("div");
      box.className = "cj107-scheduled";
      const when = data.appointment.scheduled_start
        ? new Date(data.appointment.scheduled_start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
        : "Time being confirmed";
      box.textContent = (action.label || "Appointment scheduled") + " · " + when;
      area.append(box);

      if (data.appointment.location_url) {
        area.append(actionLink(data.appointment.location_url, "Open Appointment Link", false));
      }
      return;
    }

    if (action.type === "enrollment") {
      if (action.agreement_url && action.agreement_status !== "signed") {
        area.append(actionLink(action.agreement_url, "Review & Sign Agreement", true));
      }
      if (action.payment_url && action.payment_status !== "paid") {
        area.append(actionLink(action.payment_url, "Complete Payment", true));
      }
      return;
    }

    const waiting = document.createElement("div");
    waiting.className = "cj107-scheduled";
    waiting.textContent = action.label || "ReVitalized is preparing your next step.";
    area.append(waiting);
  }

  function render(data) {
    snapshot = data;
    document.getElementById("cj-name").textContent = data.first_name || "there";
    document.getElementById("cj-journey-name").textContent = data.journey_name || "ReVitalized Journey";
    document.getElementById("cj-percent").textContent = Number(data.progress_percent || 0) + "%";
    document.getElementById("cj-bar").style.width = Math.max(0, Math.min(100, Number(data.progress_percent || 0))) + "%";
    document.getElementById("cj-step-name").textContent = data.current_step_name || "Journey complete";

    renderAction(data);
    renderSteps(data.steps || [], data.current_step_key);

    const memberSection = document.getElementById("cj-member-section");
    const memberAction = document.getElementById("cj-member-action");
    if (data.member_access?.activation_url) {
      memberSection.classList.remove("hidden");
      document.getElementById("cj-member-title").textContent = "Your ReVitalized member account is ready.";
      document.getElementById("cj-member-copy").textContent = "Create your secure login to access your Member Dashboard and continue from one place.";
      memberAction.textContent = "Activate Your Member Account";
      memberAction.href = data.member_access.activation_url;
    } else if (data.member_access?.dashboard_url) {
      memberSection.classList.remove("hidden");
      document.getElementById("cj-member-title").textContent = "Your Member Dashboard is active.";
      document.getElementById("cj-member-copy").textContent = "Your ReVitalized membership, journey and program access are now connected to your member login.";
      memberAction.textContent = "Open Member Dashboard";
      memberAction.href = data.member_access.dashboard_url;
    } else {
      memberSection.classList.add("hidden");
    }

    const reportSection = document.getElementById("cj-report-section");
    if (data.report?.available && data.report.signed_url) {
      reportSection.classList.remove("hidden");
      document.getElementById("cj-report-message").textContent =
        data.report.client_message || "Your ReVitalized team has reviewed and sent your Vitality report.";
      document.getElementById("cj-report-link").href = data.report.signed_url;
    } else {
      reportSection.classList.add("hidden");
    }

    loading.classList.add("hidden");
    errorPanel.classList.add("hidden");
    content.classList.remove("hidden");
  }

  async function load() {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      showError("This journey link is incomplete or invalid.");
      return;
    }

    try {
      const response = await fetch(FUNCTION_URL + "?token=" + encodeURIComponent(token), {
        headers: { apikey: API_KEY },
        cache: "no-store",
        referrerPolicy: "no-referrer"
      });
      const data = await response.json();
      if (!response.ok) {
        showError(data.error);
        return;
      }
      render(data);
    } catch {
      showError("We could not open your journey right now. Please try again in a moment.");
    }
  }

  document.getElementById("cj-schedule-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("cj-schedule-status");
    const timeZone = document.getElementById("cj-time-zone").value;
    const times = document.getElementById("cj-times").value.trim();
    const notes = document.getElementById("cj-notes").value.trim();

    status.textContent = "Sending your request...";
    status.className = "cj107-status";

    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: API_KEY
        },
        body: JSON.stringify({
          action: "request_appointment",
          token,
          time_zone: timeZone,
          preferred_times: times ? [times] : [],
          notes
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send scheduling request.");

      status.textContent = "Your request was sent. The ReVitalized team will confirm the appointment with you.";
      status.className = "cj107-status success";
      event.target.querySelector("button[type=submit]").disabled = true;
    } catch (error) {
      status.textContent = error.message;
      status.className = "cj107-status error";
    }
  });

  load();
})();