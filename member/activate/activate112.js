// Existing journey activation URLs now lead to verified, restricted onboarding.
(() => {
  "use strict";
  const token=(new URLSearchParams(window.location.search).get("token")||"").trim();
  window.history.replaceState(null,"",window.location.pathname);
  window.location.replace("/member/onboarding/"+(/^[a-f0-9]{64}$/i.test(token)?"#enroll="+encodeURIComponent(token.toLowerCase()):""));
})();
