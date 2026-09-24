(() => {
  "use strict";

  const JOURNEY_FUNCTION = "https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/journey-link";
  const PROFILE_FUNCTION = "https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/health-profile-intake";
  const API_KEY = "sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd";
  const token = (new URLSearchParams(window.location.search).get("journey_token") || "").trim();

  function loadEngine() {
    const script = document.createElement("script");
    script.src = "js/health-profile91-engine.js?v=107";
    script.defer = true;
    document.body.appendChild(script);
  }

  async function getJson(url) {
    const response = await fetch(url, {
      headers: { apikey: API_KEY },
      cache: "no-store",
      referrerPolicy: "no-referrer"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load onboarding.");
    return data;
  }

  async function postJson(payload) {
    const response = await fetch(PROFILE_FUNCTION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY
      },
      body: JSON.stringify({ token, ...payload }),
      cache: "no-store",
      referrerPolicy: "no-referrer"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save onboarding.");
    return data;
  }

  if (!token) {
    window.RA_HEALTH_PROFILE_JOURNEY = null;
    loadEngine();
    return;
  }

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    sessionStorage.removeItem("ra_enrollment_context_v2");
    window.RA_HEALTH_PROFILE_JOURNEY = {
      loadError: "This onboarding link is incomplete or invalid."
    };
    loadEngine();
    return;
  }

  Promise.all([
    getJson(JOURNEY_FUNCTION + "?token=" + encodeURIComponent(token)),
    getJson(PROFILE_FUNCTION + "?token=" + encodeURIComponent(token))
  ]).then(([journey, profile]) => {
    const context = journey.client_context || profile.context || null;

    if (context) {
      context.enrollment_session_id = context.enrollment_session_id || "";
      sessionStorage.setItem("ra_enrollment_context_v2", JSON.stringify(context));
    }

    const saved = profile.saved_answers || {};
    const workflow = profile.workflow || {};
    const currentStep = String(workflow.current_step || "");
    const sectionMatch = currentStep.match(/^section_(\d+)$/i);
    const startIndex = sectionMatch ? Math.max(0, Number(sectionMatch[1]) - 1) : 0;

    window.RA_HEALTH_PROFILE_JOURNEY = {
      token,
      journeyUrl: "/journey/?token=" + encodeURIComponent(token),
      savedAnswers: saved,
      startIndex,
      completed: Boolean(profile.completed),
      canEdit: profile.can_edit !== false,
      async saveProgress({ answers, sectionIndex, completionPercent }) {
        return postJson({
          mode: "save",
          answers,
          current_step: "section_" + String(sectionIndex + 1),
          completion_percent: completionPercent
        });
      },
      async complete({ answers }) {
        return postJson({
          mode: "complete",
          answers,
          current_step: "complete",
          completion_percent: 100
        });
      }
    };

    loadEngine();
  }).catch((error) => {
    sessionStorage.removeItem("ra_enrollment_context_v2");
    window.RA_HEALTH_PROFILE_JOURNEY = { loadError: error.message };
    loadEngine();
  });
})();