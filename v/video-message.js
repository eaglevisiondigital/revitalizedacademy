(() => {
  "use strict";

  const FUNCTION_URL = "https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/video-message-view";
  const PUBLISHABLE_KEY = "sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd";
  const params = new URLSearchParams(window.location.search);
  const token = (params.get("token") || "").trim();

  const loading = document.getElementById("video-loading");
  const content = document.getElementById("video-content");
  const errorPanel = document.getElementById("video-error");
  const errorText = document.getElementById("video-error-text");

  function showError(message) {
    loading.classList.add("hidden");
    content.classList.add("hidden");
    errorPanel.classList.remove("hidden");
    errorText.textContent = message || "The link may have expired or the message may no longer be active.";
  }

  async function init() {
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      showError("This personal message link is incomplete or invalid.");
      return;
    }

    try {
      const response = await fetch(FUNCTION_URL + "?token=" + encodeURIComponent(token), {
        headers: { apikey: PUBLISHABLE_KEY },
        cache: "no-store",
        referrerPolicy: "no-referrer"
      });

      const data = await response.json();
      if (!response.ok) {
        showError(data.error || "This personal message is not available.");
        return;
      }

      document.getElementById("video-heading").textContent = data.recipient_first_name
        ? "A personal message for " + data.recipient_first_name + "."
        : data.title || "A personal message for you.";
      document.getElementById("video-note").textContent = data.personal_message || "";
      document.getElementById("personal-video").src = data.signed_url;

      loading.classList.add("hidden");
      errorPanel.classList.add("hidden");
      content.classList.remove("hidden");
    } catch {
      showError("We could not open this message right now. Please try again in a moment.");
    }
  }

  init();
})();