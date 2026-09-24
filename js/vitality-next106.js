(() => {
  "use strict";

  const ENDPOINT = "https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/public-intake";
  const API_KEY = "sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd";
  const YOUTUBE_ID = "ti0p-qibQao";
  const play = document.getElementById("vn106-play");
  const card = document.getElementById("vn106-video-card");
  const status = document.getElementById("vn106-video-status");
  let started = false;

  function identity() {
    try {
      const raw = sessionStorage.getItem("ra_vitality_identity_v1");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.email ? parsed : null;
    } catch {
      return null;
    }
  }

  function recordView() {
    const person = identity();
    if (!person) return;

    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY
      },
      body: JSON.stringify({
        type: "vsl_viewed",
        source: "vitality_next_longevity_matrix",
        ...person
      }),
      keepalive: true
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.ok) status.textContent = "Your ReVitalized journey has been updated.";
      })
      .catch(() => {});
  }

  function startVideo() {
    if (started) return;
    started = true;
    recordView();

    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + YOUTUBE_ID + "?autoplay=1&rel=0";
    iframe.title = "The Longevity Matrix";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    card.replaceChildren(iframe);
  }

  play?.addEventListener("click", startVideo);
})();