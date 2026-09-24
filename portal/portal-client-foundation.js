(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const el = (id) => document.getElementById(id);

  let contact = null;
  let access = null;
  let membership = null;
  let household = null;
  let members = [];
  let entitlements = [];
  let program = null;
  let currentJourneyId = null;

  function title(value) {
    return portal.titleCase(value || "");
  }

  function money(cents, currency) {
    if (cents === null || cents === undefined) return "Not recorded";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2
    }).format(Number(cents) / 100);
  }

  function setStatus(id, message, type = "") {
    const target = el(id);
    target.textContent = message || "";
    target.className = "form-status" + (type ? " " + type : "");
  }

  function closeHousehold() {
    el("household-modal").classList.add("hidden");
    el("household-modal").setAttribute("aria-hidden", "true");
  }

  function staffName(userId) {
    if (!userId) return "Unassigned";
    const row = portal.staffDirectory().find((staff) => staff.user_id === userId);
    return row?.display_name || "Assigned coach";
  }

  function familyLimit() {
    const row = entitlements.find((item) => item.entitlement_key === "family_profiles" && item.status === "active");
    return row?.limit_value ? Number(row.limit_value) : null;
  }

  function renderPanel() {
    const section = el("client-foundation-section");

    if (!access || !membership) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");

    el("client-access-chip").textContent = title(access.status);
    el("client-program-name").textContent = program?.name || membership.program_code || "ReVitalized Academy";
    el("client-membership-status").textContent =
      title(membership.status) +
      (membership.commitment_ends_at ? " · through " + portal.formatDate(membership.commitment_ends_at) : "");
    el("client-access-status").textContent =
      title(access.status) + (access.user_id ? " · Login linked" : " · Login not created");
    el("client-household-summary").textContent = household
      ? title(household.household_type) + " · " + title(household.status)
      : "Not prepared";
    el("client-billing-summary").textContent =
      (membership.billing_choice ? title(membership.billing_choice) + " · " : "") +
      money(membership.amount_cents, membership.currency);
    el("client-assigned-coach").textContent = staffName(membership.assigned_coach_id);

    const activation = el("client-copy-activation");
    activation.classList.toggle("hidden", !(access.status === "ready" && !access.user_id));
    el("client-manage-household").disabled = !household;

    const preview = el("client-entitlements-preview");
    preview.replaceChildren();

    entitlements.slice(0, 7).forEach((row) => {
      const chip = document.createElement("span");
      chip.className = "client-entitlement-chip";
      chip.textContent = row.label;
      preview.append(chip);
    });

    if (entitlements.length > 7) {
      const more = document.createElement("span");
      more.className = "client-entitlement-chip";
      more.textContent = "+" + (entitlements.length - 7) + " more";
      preview.append(more);
    }

    el("client-entitlement-count").textContent =
      entitlements.length + (entitlements.length === 1 ? " included feature" : " included features");

    setStatus("client-foundation-status", "");
  }

  async function loadFoundation(contactId, contactRecord = contact) {
    contact = contactRecord || contact;
    if (!contactId) return;

    const accessResult = await client
      .from("client_access")
      .select("*")
      .eq("contact_id", contactId)
      .maybeSingle();

    if (accessResult.error) {
      setStatus("client-foundation-status", accessResult.error.message, "error");
      return;
    }

    access = accessResult.data || null;
    membership = null;
    household = null;
    members = [];
    entitlements = [];
    program = null;
    currentJourneyId = null;

    if (!access) {
      renderPanel();
      return;
    }

    const queries = [];

    queries.push(
      access.membership_id
        ? client.from("client_memberships").select("*").eq("id", access.membership_id).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    );

    queries.push(
      access.household_id
        ? client.from("households").select("*").eq("id", access.household_id).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    );

    queries.push(
      access.membership_id
        ? client.from("membership_entitlements").select("*").eq("membership_id", access.membership_id).eq("status", "active").order("label")
        : Promise.resolve({ data: [], error: null })
    );

    queries.push(
      access.household_id
        ? client.from("household_members").select("*,contacts:contact_id(first_name,last_name,email,phone)").eq("household_id", access.household_id).eq("status", "active").order("is_primary", { ascending: false })
        : Promise.resolve({ data: [], error: null })
    );

    queries.push(
      client.from("contact_journeys").select("id,status").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(1).maybeSingle()
    );

    const [membershipResult, householdResult, entitlementResult, memberResult, journeyResult] = await Promise.all(queries);

    const failed = [membershipResult, householdResult, entitlementResult, memberResult, journeyResult].find((result) => result.error);
    if (failed?.error) {
      setStatus("client-foundation-status", failed.error.message, "error");
      return;
    }

    membership = membershipResult.data || null;
    household = householdResult.data || null;
    entitlements = entitlementResult.data || [];
    members = memberResult.data || [];
    currentJourneyId = journeyResult.data?.id || null;

    if (membership?.program_code) {
      const { data, error } = await client
        .from("program_catalog")
        .select("*")
        .eq("program_code", membership.program_code)
        .maybeSingle();

      if (!error) program = data || null;
    }

    renderPanel();
  }

  async function copyActivationLink() {
    if (!contact?.id || !currentJourneyId) {
      setStatus("client-foundation-status", "No ReVitalized journey is available for this client.", "error");
      return;
    }

    setStatus("client-foundation-status", "Creating secure activation link...");

    const { data, error } = await client.functions.invoke("journey-link", {
      body: {
        action: "create_link",
        contact_id: contact.id,
        journey_id: currentJourneyId
      }
    });

    if (error || !data?.url) {
      setStatus("client-foundation-status", error?.message || data?.error || "Could not create activation link.", "error");
      return;
    }

    const source = new URL(data.url);
    const token = source.searchParams.get("token");
    if (!token) {
      setStatus("client-foundation-status", "Activation token could not be created.", "error");
      return;
    }

    const activationUrl = "https://revitalizedacademy.com/member/activate/?token=" + encodeURIComponent(token);
    await navigator.clipboard.writeText(activationUrl);

    const button = el("client-copy-activation");
    button.textContent = "Activation Link Copied";
    setStatus("client-foundation-status", "Secure member activation link copied.", "success");
    window.setTimeout(() => { button.textContent = "Copy Member Activation Link"; }, 1600);
  }

  function renderMemberList() {
    const list = el("household-member-list");
    list.replaceChildren();

    members.forEach((row) => {
      const item = document.createElement("div");
      item.className = "household-member";

      const left = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = [row.contacts?.first_name, row.contacts?.last_name].filter(Boolean).join(" ") || "Household member";
      left.append(name);

      if (row.is_primary) {
        const primary = document.createElement("span");
        primary.className = "household-primary";
        primary.textContent = "PRIMARY";
        left.append(primary);
      }

      const meta = document.createElement("span");
      meta.textContent = title(row.relationship_type) + " · " + title(row.sex);
      item.append(left, meta);
      list.append(item);
    });
  }

  function relationOptions() {
    const select = el("household-relationship");
    select.replaceChildren();

    if (!household || household.household_type === "individual") {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Change household type first";
      select.append(option);
      select.disabled = true;
      return;
    }

    select.disabled = false;

    const existing = new Set(members.map((row) => row.relationship_type));
    const options = [];

    if (household.household_type === "couple") {
      if (!existing.has("husband")) options.push(["husband","Husband"]);
      if (!existing.has("wife")) options.push(["wife","Wife"]);
    } else {
      if (!existing.has("husband")) options.push(["husband","Husband"]);
      if (!existing.has("wife")) options.push(["wife","Wife"]);
      options.push(["child","Child"],["dependent","Dependent"]);
    }

    if (!options.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No relationship slots available";
      select.append(option);
      select.disabled = true;
      return;
    }

    options.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    });

    syncSexToRelationship();
  }

  function syncSexToRelationship() {
    const relation = el("household-relationship").value;
    const sex = el("household-sex");

    if (relation === "husband") {
      sex.value = "male";
      sex.disabled = true;
    } else if (relation === "wife") {
      sex.value = "female";
      sex.disabled = true;
    } else {
      sex.disabled = false;
    }
  }

  function renderHouseholdModal() {
    if (!household) return;

    el("household-type-select").value = household.household_type;
    el("household-status-label").textContent = title(household.status);

    const limit = familyLimit();
    el("household-profile-limit").textContent =
      members.length + (limit ? " of " + limit : " profiles");

    el("household-activate").disabled = household.status === "active";
    el("household-add-button").disabled =
      household.household_type === "individual" ||
      (limit !== null && members.length >= limit);

    el("household-add-note").textContent =
      household.household_type === "individual"
        ? "Change to Husband + Wife or Family before adding members."
        : limit
          ? (limit - members.length) + " included profile slot" + ((limit - members.length) === 1 ? "" : "s") + " remaining."
          : "Add the appropriate husband, wife, child or dependent.";

    renderMemberList();
    relationOptions();
    setStatus("household-status-message", "");
    setStatus("household-add-status", "");
  }

  function openHousehold() {
    if (!household) return;
    renderHouseholdModal();
    el("household-modal").classList.remove("hidden");
    el("household-modal").setAttribute("aria-hidden", "false");
  }

  async function saveHouseholdType() {
    if (!household) return;

    const nextType = el("household-type-select").value;
    setStatus("household-status-message", "Saving household structure...");

    const { error } = await client.rpc("set_household_type", {
      p_household_id: household.id,
      p_household_type: nextType
    });

    if (error) {
      setStatus("household-status-message", error.message, "error");
      return;
    }

    setStatus("household-status-message",
      nextType === "individual"
        ? "Individual household saved and active."
        : "Household type saved as a draft. Add the required members, then activate it.",
      "success"
    );

    await loadFoundation(contact.id);
    renderHouseholdModal();
  }

  async function activateHousehold() {
    if (!household) return;
    setStatus("household-status-message", "Validating household...");

    const { error } = await client.rpc("activate_household", {
      p_household_id: household.id
    });

    if (error) {
      setStatus("household-status-message", error.message, "error");
      return;
    }

    setStatus("household-status-message", "Household activated.", "success");
    await loadFoundation(contact.id);
    renderHouseholdModal();
  }

  async function addHouseholdMember(event) {
    event.preventDefault();
    if (!household) return;

    const relation = el("household-relationship").value;
    const sex = el("household-sex").value;

    if (!relation || !sex) {
      setStatus("household-add-status", "Choose the relationship and sex.", "error");
      return;
    }

    setStatus("household-add-status", "Adding household member...");

    const { error } = await client.rpc("add_household_member", {
      p_household_id: household.id,
      p_first_name: el("household-first-name").value.trim(),
      p_last_name: el("household-last-name").value.trim(),
      p_email: el("household-email").value.trim() || null,
      p_phone: el("household-phone").value.trim() || null,
      p_relationship_type: relation,
      p_sex: sex,
      p_date_of_birth: el("household-dob").value || null
    });

    if (error) {
      setStatus("household-add-status", error.message, "error");
      return;
    }

    el("household-add-form").reset();
    setStatus("household-add-status", "Household member added.", "success");
    await loadFoundation(contact.id);
    renderHouseholdModal();
  }

  document.addEventListener("ra:contact-opened", (event) => {
    loadFoundation(event.detail.contactId, event.detail.contact).catch((error) => {
      console.error("Client foundation load failed", error);
    });
  });

  document.addEventListener("ra:contact-closed", () => {
    contact = null;
    access = null;
    membership = null;
    household = null;
    members = [];
    entitlements = [];
    program = null;
    currentJourneyId = null;
    el("client-foundation-section").classList.add("hidden");
    closeHousehold();
  });

  el("client-copy-activation").addEventListener("click", copyActivationLink);
  el("client-manage-household").addEventListener("click", openHousehold);
  el("household-save-type").addEventListener("click", saveHouseholdType);
  el("household-activate").addEventListener("click", activateHousehold);
  el("household-add-form").addEventListener("submit", addHouseholdMember);
  el("household-relationship").addEventListener("change", syncSexToRelationship);
  document.querySelectorAll("[data-household-close]").forEach((node) => node.addEventListener("click", closeHousehold));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el("household-modal").classList.contains("hidden")) closeHousehold();
  });
})();