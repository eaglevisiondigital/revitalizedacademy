(() => {
  "use strict";

  const FUNCTION_URL = "https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/member-account";
  const API_KEY = "sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd";
  const token = (new URLSearchParams(window.location.search).get("token") || "").trim();

  const el = (id) => document.getElementById(id);

  function showOnly(id) {
    ["rma-loading","rma-form-card","rma-success","rma-error"].forEach((key) => el(key).classList.add("hidden"));
    el(id).classList.remove("hidden");
  }

  function status(message, type = "") {
    el("rma-status").textContent = message || "";
    el("rma-status").className = "rma112-status" + (type ? " " + type : "");
  }

  function programName(code) {
    const map = {
      "holistic-foundations": "Holistic Foundations",
      "vitality-accelerator-cohort": "Vitality Accelerator Cohort",
      "vitality-accelerator": "Vitality Accelerator",
      "total-wellness-6": "6-Month Intensive",
      "total-wellness-12": "12-Month Intensive"
    };
    return map[code] || "ReVitalized Academy";
  }

  async function load() {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      el("rma-error-copy").textContent = "This member activation link is incomplete or invalid.";
      showOnly("rma-error");
      return;
    }

    try {
      const response = await fetch(FUNCTION_URL + "?token=" + encodeURIComponent(token), {
        headers: { apikey: API_KEY },
        cache: "no-store",
        referrerPolicy: "no-referrer"
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unable to verify membership.");

      if (data.already_active) {
        showOnly("rma-success");
        return;
      }

      if (!data.eligible) {
        el("rma-error-copy").textContent = "Your ReVitalized membership is not ready for account activation yet. Please return to your Journey or contact the ReVitalized team.";
        showOnly("rma-error");
        return;
      }

      el("rma-first-name").textContent = data.first_name || "there";
      el("rma-program").textContent = programName(data.program_code);
      el("rma-email-hint").textContent = data.email_hint ? "Enrollment email: " + data.email_hint : "";
      showOnly("rma-form-card");
    } catch (error) {
      el("rma-error-copy").textContent = error.message || "Unable to verify membership.";
      showOnly("rma-error");
    }
  }

  el("rma-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = el("rma-email").value.trim();
    const password = el("rma-password").value;
    const confirm = el("rma-confirm").value;

    if (password !== confirm) {
      status("The passwords do not match.", "error");
      return;
    }

    if (password.length < 10) {
      status("Choose a password with at least 10 characters.", "error");
      return;
    }

    status("Activating your member account...");

    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: API_KEY },
        body: JSON.stringify({ token, email, password }),
        cache: "no-store",
        referrerPolicy: "no-referrer"
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to activate account.");

      status("Account activated.", "success");
      showOnly("rma-success");
    } catch (error) {
      status(error.message || "Unable to activate account.", "error");
    }
  });

  load();
})();