(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const PROJECT_REF = "voalfpxiyznnqfcqcymd";
  const PUBLISHABLE_KEY = "sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd";
  const VIDEO_PAGE_BASE = "https://revitalizedacademy.com/v/?token=";

  let contact = null;
  let smsPreference = null;
  let smsSettings = null;
  let templates = [];
  let messages = [];
  let videos = [];
  let videoViews = [];

  const el = (id) => document.getElementById(id);

  function setStatus(target, message, type = "") {
    if (!target) return;
    target.textContent = message || "";
    target.className = "message-status" + (type ? " " + type : "");
  }

  function firstName() {
    return contact?.first_name || contact?.preferred_name || "there";
  }

  function cleanPhone(value) {
    return String(value || "").replace(/[^+\d]/g, "");
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return value.toFixed(index === 0 ? 0 : 1) + " " + units[index];
  }

  function formatDate(value) {
    return portal.formatDate(value, true);
  }

  function renderTokens(body, videoLink = "") {
    return String(body || "")
      .replaceAll("{{first_name}}", firstName())
      .replaceAll("{{video_link}}", videoLink || "[video link]");
  }

  function videoLink(video) {
    return VIDEO_PAGE_BASE + encodeURIComponent(video.share_token);
  }

  function smsAllowed() {
    return Boolean(contact?.phone && smsPreference?.status === "opted_in");
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function openModal(modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function populateTemplateSelect(select, includeBlank = true) {
    select.replaceChildren();
    if (includeBlank) {
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "Custom message";
      select.append(blank);
    }

    templates.forEach((template) => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name;
      select.append(option);
    });
  }

  function renderConsent() {
    const status = smsPreference?.status || "unknown";
    el("sms-consent-status").value = status;
    el("sms-consent-source").value = smsPreference?.opt_in_source || "";
    el("sms-consent-version").value = smsPreference?.consent_version || "revitalized-sms-v1";
    el("sms-consent-notes").value = smsPreference?.notes || "";

    const provider = el("sms-provider-state");
    const ready = smsSettings?.is_enabled && smsSettings?.setup_status === "ready";
    provider.className = "provider-state " + (ready ? "ready" : "pending");
    provider.textContent = ready
      ? "SMS provider is connected and ready."
      : "Twilio connection is not active yet. You can save message drafts and hand approved texts off to your device's text app now.";

    const contactStatus = el("sms-consent-summary");
    if (contactStatus) {
      contactStatus.textContent = status === "opted_in"
        ? "SMS permission: Opted in"
        : status === "opted_out"
          ? "SMS permission: Opted out"
          : status === "blocked"
            ? "SMS permission: Blocked"
            : "SMS permission: Not recorded";
    }
  }

  function renderMessageHistory() {
    const list = el("contact-messages-list");
    list.replaceChildren();

    const videoMap = new Map(videos.map((video) => [video.id, video]));
    const viewCounts = new Map();
    videoViews.forEach((view) => {
      viewCounts.set(view.video_message_id, (viewCounts.get(view.video_message_id) || 0) + 1);
    });

    const combined = [
      ...messages.map((message) => ({ kind: "message", created_at: message.created_at, row: message })),
      ...videos.map((video) => ({ kind: "video", created_at: video.created_at, row: video }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (!combined.length) {
      const empty = document.createElement("div");
      empty.className = "drawer-empty";
      empty.textContent = "No messages or personal videos yet.";
      list.append(empty);
      return;
    }

    combined.slice(0, 30).forEach((entry) => {
      const item = document.createElement("article");
      item.className = "message-history-item";
      const top = document.createElement("div");
      top.className = "message-history-top";
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      meta.className = "message-history-meta";

      if (entry.kind === "video") {
        const video = entry.row;
        title.textContent = "Personal video · " + video.title;
        meta.textContent = portal.titleCase(video.status) + " · " + formatDate(video.created_at);
        const copy = document.createElement("p");
        copy.textContent = video.personal_message || "Personal video message";
        const actions = document.createElement("div");
        actions.className = "message-history-actions";
        const linkButton = document.createElement("button");
        linkButton.className = "mini-button";
        linkButton.type = "button";
        linkButton.textContent = "Copy link";
        linkButton.addEventListener("click", async () => {
          await navigator.clipboard.writeText(videoLink(video));
          linkButton.textContent = "Copied";
          window.setTimeout(() => { linkButton.textContent = "Copy link"; }, 1200);
        });
        const views = document.createElement("span");
        views.className = "record-item-meta";
        const count = viewCounts.get(video.id) || 0;
        views.textContent = count + (count === 1 ? " view" : " views");
        actions.append(linkButton, views);
        top.append(title, meta);
        item.append(top, copy, actions);
      } else {
        const message = entry.row;
        const linkedVideo = message.video_message_id ? videoMap.get(message.video_message_id) : null;
        title.textContent = portal.titleCase(message.channel) + " · " + portal.titleCase(message.status);
        meta.textContent = formatDate(message.created_at);
        const copy = document.createElement("p");
        copy.textContent = message.body;
        top.append(title, meta);
        item.append(top, copy);
        if (linkedVideo) {
          const actions = document.createElement("div");
          actions.className = "message-history-actions";
          const linkButton = document.createElement("button");
          linkButton.className = "mini-button";
          linkButton.type = "button";
          linkButton.textContent = "Copy video link";
          linkButton.addEventListener("click", () => navigator.clipboard.writeText(videoLink(linkedVideo)));
          actions.append(linkButton);
          item.append(actions);
        }
      }

      list.append(item);
    });
  }

  async function loadMessaging(contactId, contactRecord) {
    contact = contactRecord;

    const [preferenceResult, settingsResult, templatesResult, messagesResult, videosResult] = await Promise.all([
      client.from("contact_sms_preferences").select("*").eq("contact_id", contactId).maybeSingle(),
      client.from("communication_channel_settings").select("*").eq("channel", "sms").maybeSingle(),
      client.from("message_templates").select("*").eq("channel", "sms").eq("active", true).order("name"),
      client.from("contact_messages").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(30),
      client.from("personal_video_messages").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(20)
    ]);

    smsPreference = preferenceResult.data || { contact_id: contactId, status: "unknown" };
    smsSettings = settingsResult.data || { setup_status: "setup_required", is_enabled: false };
    templates = templatesResult.data || [];
    messages = messagesResult.data || [];
    videos = videosResult.data || [];

    const ids = videos.map((video) => video.id);
    if (ids.length) {
      const { data } = await client
        .from("personal_video_views")
        .select("video_message_id,viewed_at")
        .in("video_message_id", ids)
        .order("viewed_at", { ascending: false });
      videoViews = data || [];
    } else {
      videoViews = [];
    }

    renderConsent();
    renderMessageHistory();

    el("contact-text-action").disabled = !contact.phone;
    el("contact-video-action").disabled = false;
  }

  async function refreshCurrentContactMessaging() {
    if (!contact?.id) return;
    await loadMessaging(contact.id, contact);
  }

  function applyTemplate(select, textarea, videoLinkValue = "") {
    const template = templates.find((item) => item.id === select.value);
    if (!template) return;
    textarea.value = renderTokens(template.body, videoLinkValue);
  }

  function consentBanner(target) {
    const status = smsPreference?.status || "unknown";
    target.className = "message-consent-banner " + (status === "opted_in" ? "allowed" : "blocked");
    target.innerHTML = "";
    const left = document.createElement("span");
    left.textContent = contact?.phone || "No phone number";
    const right = document.createElement("strong");
    right.textContent = status === "opted_in"
      ? "SMS opted in"
      : status === "opted_out"
        ? "SMS opted out"
        : status === "blocked"
          ? "SMS blocked"
          : "Consent not recorded";
    target.append(left, right);
  }

  function openTextComposer() {
    if (!contact) return;

    el("text-recipient").textContent = contact.phone
      ? portal.personName(contact) + " · " + contact.phone
      : portal.personName(contact) + " · No phone number";

    consentBanner(el("text-consent-banner"));
    populateTemplateSelect(el("text-template"));
    el("text-message-body").value = "";
    setStatus(el("text-message-status"), "");

    const openText = el("text-open-app");
    openText.disabled = !smsAllowed();
    openText.title = smsAllowed() ? "" : "Record SMS opt-in before texting this contact.";

    openModal(el("text-modal"));
  }

  async function saveTextMessage(status, provider) {
    if (!contact?.id) return null;
    const body = el("text-message-body").value.trim();
    if (!body) {
      setStatus(el("text-message-status"), "Enter a message first.", "error");
      return null;
    }

    const templateId = el("text-template").value || null;
    const payload = {
      contact_id: contact.id,
      channel: "sms",
      direction: "outbound",
      status,
      body,
      recipient_address: contact.phone || null,
      provider,
      template_id: templateId,
      sent_by: portal.currentUserId()
    };

    const { data, error } = await client.from("contact_messages").insert(payload).select("*").single();
    if (error) {
      setStatus(el("text-message-status"), error.message, "error");
      return null;
    }

    await portal.logActivity(
      contact.id,
      status === "draft" ? "sms_draft_saved" : "sms_manual_handoff",
      status === "draft" ? "Text draft saved" : "Text opened in device",
      body.slice(0, 240),
      { message_id: data.id }
    );

    await refreshCurrentContactMessaging();
    return data;
  }

  async function openTextApp(bodyOverride = null, linkedVideo = null) {
    if (!contact?.phone) return;
    if (!smsAllowed()) {
      setStatus(el("text-message-status"), "SMS opt-in must be recorded before texting this contact.", "error");
      return;
    }

    const body = bodyOverride || el("text-message-body").value.trim();
    if (!body) {
      setStatus(el("text-message-status"), "Enter a message first.", "error");
      return;
    }

    const payload = {
      contact_id: contact.id,
      channel: "sms",
      direction: "outbound",
      status: "manual_handoff",
      body,
      recipient_address: contact.phone,
      provider: "device_sms",
      video_message_id: linkedVideo?.id || null,
      sent_by: portal.currentUserId(),
      metadata: { delivery_tracking: false }
    };

    const { data, error } = await client.from("contact_messages").insert(payload).select("id").single();
    if (error) {
      setStatus(el("text-message-status"), error.message, "error");
      return;
    }

    await portal.logActivity(
      contact.id,
      "sms_manual_handoff",
      linkedVideo ? "Personal video text opened" : "Text opened in device",
      body.slice(0, 240),
      { message_id: data.id, video_message_id: linkedVideo?.id || null }
    );

    await refreshCurrentContactMessaging();

    const phone = cleanPhone(contact.phone);
    window.location.href = "sms:" + phone + "?body=" + encodeURIComponent(body);
  }

  function inferContentType(file) {
    if (file.type) return file.type;
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".mov")) return "video/quicktime";
    if (lower.endsWith(".webm")) return "video/webm";
    if (lower.endsWith(".m4v")) return "video/x-m4v";
    return "video/mp4";
  }

  function safeFilename(name) {
    const clean = String(name || "video.mp4")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return clean || "video.mp4";
  }

  function resetVideoModal() {
    el("video-title-input").value = contact ? "A personal message for " + firstName() : "A personal message from ReVitalized Academy";
    el("video-personal-message").value = "We wanted to take a moment to personally connect with you.";
    el("video-file").value = "";
    const template = templates.find((item) => item.name === "Personal video");
    el("video-sms-body").value = template
      ? renderTokens(template.body)
      : "Hi " + firstName() + ", we recorded a quick personal message for you. Watch it here: [video link]";
    el("video-file-summary").textContent = "Choose a video file or record one from your phone.";
    el("video-upload-progress").value = 0;
    el("video-upload-progress-wrap").classList.add("hidden");
    el("video-ready-box").classList.add("hidden");
    setStatus(el("video-upload-status"), "");
    el("video-create-button").disabled = false;
  }

  function openVideoComposer() {
    if (!contact) return;
    el("video-recipient").textContent = portal.personName(contact) + (contact.phone ? " · " + contact.phone : "");
    consentBanner(el("video-consent-banner"));
    resetVideoModal();
    openModal(el("video-modal"));
  }

  async function finishVideoUpload(video, path, body) {
    const { error: updateError } = await client
      .from("personal_video_messages")
      .update({ storage_path: path, status: "ready", updated_at: new Date().toISOString() })
      .eq("id", video.id);

    if (updateError) throw updateError;

    const link = videoLink(video);
    const finalBody = body.includes("[video link]")
      ? body.replace("[video link]", link)
      : body.includes("{{video_link}}")
        ? body.replace("{{video_link}}", link)
        : body + " " + link;

    await client.from("contact_messages").insert({
      contact_id: contact.id,
      channel: "video_link",
      direction: "outbound",
      status: "draft",
      body: finalBody,
      recipient_address: contact.phone || null,
      video_message_id: video.id,
      sent_by: portal.currentUserId()
    });

    await portal.logActivity(
      contact.id,
      "video_ready",
      "Personal video ready",
      video.title,
      { video_message_id: video.id, share_link: link }
    );

    el("video-share-link").value = link;
    el("video-ready-text").textContent = finalBody;
    el("video-open-text").disabled = !smsAllowed();
    el("video-open-text").title = smsAllowed() ? "" : "Record SMS opt-in before texting this contact.";
    el("video-ready-box").classList.remove("hidden");
    el("video-create-button").disabled = false;
    setStatus(el("video-upload-status"), "Video uploaded and personal link created.", "success");
    await refreshCurrentContactMessaging();
  }

  async function uploadPersonalVideo() {
    if (!contact?.id) return;
    const file = el("video-file").files?.[0];
    if (!file) {
      setStatus(el("video-upload-status"), "Choose or record a video first.", "error");
      return;
    }
    if (!window.tus?.Upload) {
      setStatus(el("video-upload-status"), "The resumable video uploader did not load. Refresh and try again.", "error");
      return;
    }

    const title = el("video-title-input").value.trim() || "A personal message from ReVitalized Academy";
    const personalMessage = el("video-personal-message").value.trim();
    const body = el("video-sms-body").value.trim();
    const contentType = inferContentType(file);
    const currentUserId = portal.currentUserId();

    el("video-create-button").disabled = true;
    el("video-upload-progress-wrap").classList.remove("hidden");
    setStatus(el("video-upload-status"), "Preparing secure upload...");

    const { data: video, error: createError } = await client
      .from("personal_video_messages")
      .insert({
        contact_id: contact.id,
        title,
        personal_message: personalMessage || null,
        original_filename: file.name,
        content_type: contentType,
        status: "uploading",
        created_by: currentUserId
      })
      .select("id,share_token,title")
      .single();

    if (createError) {
      el("video-create-button").disabled = false;
      setStatus(el("video-upload-status"), createError.message, "error");
      return;
    }

    const path = contact.id + "/" + video.id + "/" + safeFilename(file.name);
    const { data: sessionData } = await client.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      await client.from("personal_video_messages").update({ status: "failed" }).eq("id", video.id);
      el("video-create-button").disabled = false;
      setStatus(el("video-upload-status"), "Your session expired. Sign in again and retry.", "error");
      return;
    }

    const upload = new window.tus.Upload(file, {
      endpoint: "https://" + PROJECT_REF + ".storage.supabase.co/storage/v1/upload/resumable",
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: "Bearer " + token,
        apikey: PUBLISHABLE_KEY,
        "x-upsert": "false"
      },
      metadata: {
        bucketName: "personal-videos",
        objectName: path,
        contentType,
        cacheControl: "3600"
      },
      chunkSize: 6 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      onError: async (error) => {
        await client.from("personal_video_messages").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", video.id);
        el("video-create-button").disabled = false;
        setStatus(el("video-upload-status"), "Upload failed: " + error.message, "error");
      },
      onProgress: (uploaded, total) => {
        const percent = total ? Math.round((uploaded / total) * 100) : 0;
        el("video-upload-progress").value = percent;
        el("video-upload-progress-label").textContent = percent + "% · " + formatBytes(uploaded) + " of " + formatBytes(total);
        setStatus(el("video-upload-status"), "Uploading securely...");
      },
      onSuccess: async () => {
        try {
          await finishVideoUpload(video, path, body);
        } catch (error) {
          await client.from("personal_video_messages").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", video.id);
          el("video-create-button").disabled = false;
          setStatus(el("video-upload-status"), error.message || "Video processing failed.", "error");
        }
      }
    });

    const previous = await upload.findPreviousUploads();
    if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
    upload.start();
  }

  document.addEventListener("ra:contact-opened", (event) => {
    loadMessaging(event.detail.contactId, event.detail.contact).catch((error) => {
      console.error("Messaging load failed", error);
    });
  });

  document.addEventListener("ra:contact-closed", () => {
    contact = null;
    closeModal(el("text-modal"));
    closeModal(el("video-modal"));
  });

  el("sms-consent-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!contact?.id) return;

    const status = el("sms-consent-status").value;
    const now = new Date().toISOString();
    const payload = {
      contact_id: contact.id,
      status,
      opt_in_source: el("sms-consent-source").value || null,
      consent_version: el("sms-consent-version").value.trim() || null,
      notes: el("sms-consent-notes").value.trim() || null,
      updated_by: portal.currentUserId(),
      updated_at: now,
      opt_in_at: status === "opted_in" ? (smsPreference?.opt_in_at || now) : smsPreference?.opt_in_at || null,
      opt_out_at: status === "opted_out" || status === "blocked"
        ? (smsPreference?.opt_out_at || now)
        : null
    };

    setStatus(el("sms-consent-message"), "Saving...");
    const { error } = await client.from("contact_sms_preferences").upsert(payload, { onConflict: "contact_id" });
    if (error) {
      setStatus(el("sms-consent-message"), error.message, "error");
      return;
    }

    await portal.logActivity(
      contact.id,
      "sms_consent_updated",
      "SMS permission updated",
      "Status: " + portal.titleCase(status),
      { status, source: payload.opt_in_source, consent_version: payload.consent_version }
    );

    setStatus(el("sms-consent-message"), "SMS permission saved.", "success");
    await refreshCurrentContactMessaging();
  });

  el("contact-text-action").addEventListener("click", openTextComposer);
  el("contact-video-action").addEventListener("click", openVideoComposer);

  document.querySelectorAll("[data-text-close]").forEach((node) => node.addEventListener("click", () => closeModal(el("text-modal"))));
  document.querySelectorAll("[data-video-close]").forEach((node) => node.addEventListener("click", () => closeModal(el("video-modal"))));

  el("text-template").addEventListener("change", () => applyTemplate(el("text-template"), el("text-message-body")));

  el("text-save-draft").addEventListener("click", async () => {
    setStatus(el("text-message-status"), "Saving draft...");
    const saved = await saveTextMessage("draft", null);
    if (saved) setStatus(el("text-message-status"), "Draft saved to this contact.", "success");
  });

  el("text-open-app").addEventListener("click", () => openTextApp());

  el("video-file").addEventListener("change", () => {
    const file = el("video-file").files?.[0];
    el("video-file-summary").textContent = file
      ? file.name + (file.size ? " · " + formatBytes(file.size) : "")
      : "Choose a video file or record one from your phone.";
  });

  el("video-create-button").addEventListener("click", uploadPersonalVideo);

  el("video-copy-link").addEventListener("click", async () => {
    await navigator.clipboard.writeText(el("video-share-link").value);
    el("video-copy-link").textContent = "Copied";
    window.setTimeout(() => { el("video-copy-link").textContent = "Copy link"; }, 1200);
  });

  el("video-copy-text").addEventListener("click", async () => {
    await navigator.clipboard.writeText(el("video-ready-text").textContent);
    el("video-copy-text").textContent = "Copied";
    window.setTimeout(() => { el("video-copy-text").textContent = "Copy text"; }, 1200);
  });

  el("video-open-text").addEventListener("click", async () => {
    const readyVideo = videos.find((item) => videoLink(item) === el("video-share-link").value);
    await openTextApp(el("video-ready-text").textContent, readyVideo || null);
  });
})();