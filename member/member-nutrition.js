(() => {
  "use strict";
  const client = window.RA_MEMBER_CLIENT;
  const el = (id) => document.getElementById(`rm-nutrition-${id}`);
  if (!client || !el("diary-card")) return;

  const core = [
    ["energy_kcal", "Calories / Energy", "kcal"], ["protein_g", "Protein", "g"],
    ["carbohydrate_g", "Carbohydrates", "g"], ["fat_g", "Fat", "g"],
    ["fiber_g", "Fiber", "g"], ["water_g", "Water", "g"]
  ];
  const meals = [["breakfast", "Breakfast"], ["lunch", "Lunch"], ["dinner", "Dinner"],
    ["snack", "Snacks"], ["supplement", "Supplements"], ["water", "Water / Hydration"], ["other", "Other"]];
  const number = (v) => typeof v === "number" && Number.isFinite(v) ? v : null;
  const format = (v) => number(v) === null ? "Not logged" : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && dateKey(new Date(`${v}T12:00:00`)) === v;
  const node = (tag, text, className) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (className) n.className = className;
    return n;
  };
  const empty = (text) => node("div", text, "rm218-empty");
  let enabled = false, ready = false, writing = false, epoch = 0, request = 0;
  let selectedDate = dateKey(), sources = new Map();
  el("date").value = selectedDate;

  function status(message = "", error = false) {
    el("diary-status").textContent = message;
    el("diary-status").className = `rm112-status${error ? " error" : ""}`;
  }
  function lockControls() {
    el("log-form").querySelectorAll("input,select,button").forEach((n) => { n.disabled = !enabled || !ready || writing || sources.size === 0; });
    ["prev", "next", "today", "date"].forEach((id) => { el(id).disabled = writing || !enabled; });
    el("diary-list").querySelectorAll("button").forEach((n) => { n.disabled = writing || !ready; });
  }
  function clear() {
    ready = false;
    sources = new Map();
    ["summary", "diary-list", "targets", "trends", "full-profile", "source"].forEach((id) => el(id).replaceChildren());
    el("source-state").textContent = "";
    el("retry").hidden = true;
    lockControls();
  }
  function reset() {
    epoch++;
    request++;
    enabled = false;
    writing = false;
    selectedDate = dateKey();
    el("date").value = selectedDate;
    el("log-form").reset();
    clear();
    status();
    el("diary-card").setAttribute("aria-busy", "false");
  }
  function targetDetail(t) {
    return [["Minimum", t.minimum], ["Target", t.target], ["Maximum", t.maximum]]
      .filter(([, v]) => number(v) !== null).map(([label, v]) => `${label}: ${format(v)} ${t.unit}`).join(" · ");
  }
  function progress(container, consumed, target) {
    if (number(consumed) === null || number(target) === null || target <= 0) return;
    const percentage = consumed / target * 100;
    if (!Number.isFinite(percentage)) return;
    container.append(node("small", `${format(percentage)}% of target`));
    const bar = node("div", undefined, "rm218-target-bar");
    bar.setAttribute("aria-hidden", "true");
    const fill = node("i");
    fill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    bar.append(fill);
    container.append(bar);
  }
  function renderDay(day) {
    const totals = day.totals || {}, targets = Array.isArray(day.targets) ? day.targets : [];
    const catalog = new Map(targets.map((t) => [t.nutrient_key, t]));
    el("summary").replaceChildren(...core.map(([key, label, unit]) => {
      const t = catalog.get(key), value = number(totals[key]);
      const card = node("div", undefined, "rm218-summary-card");
      card.append(node("span", label), node("strong", value === null ? "Not logged" : `${format(value)} ${t?.unit || unit}`));
      card.append(node("small", t && targetDetail(t) ? targetDetail(t) : "No target configured"));
      progress(card, value, t?.target);
      return card;
    }));
    const items = Array.isArray(day.items) ? day.items : [];
    el("diary-list").replaceChildren(...meals.map(([slot, label]) => {
      const group = node("section", undefined, "rm218-meal-group");
      group.append(node("h3", label));
      const matching = items.filter((item) => (item.meal_slot || "other") === slot);
      if (!matching.length) group.append(empty("No items logged."));
      for (const item of matching) {
        const row = node("article", undefined, "rm218-diary-item"), description = node("div");
        description.append(node("strong", item.label || "Nutrition item"));
        description.append(node("span", `${format(item.quantity)} × ${format(item.serving_quantity)} ${item.serving_unit || "serving"}`));
        const known = core.filter(([key]) => number(item.nutrients?.[key]) !== null);
        description.append(node("small", known.length ? known.map(([key, name, unit]) => `${name}: ${format(item.nutrients[key])} ${unit}`).join(" · ") : "Nutrient values unavailable."));
        if (item.note) description.append(node("small", item.note));
        const remove = node("button", "Remove");
        remove.type = "button";
        remove.setAttribute("aria-label", `Remove ${item.label || "nutrition item"}`);
        remove.addEventListener("click", () => removeItem(item.id));
        row.append(description, remove);
        group.append(row);
      }
      return group;
    }));
    const configured = targets.filter((t) => [t.minimum, t.target, t.maximum].some((v) => number(v) !== null));
    el("targets").replaceChildren(...(configured.length ? configured.map((t) => {
      const row = node("div", undefined, "rm218-target-row"), info = node("div");
      info.append(node("strong", t.name), node("span", targetDetail(t)), node("span", `${t.source === "coach" ? "Coach override" : t.source === "program" ? "Program default" : "Configured target"}`));
      progress(info, totals[t.nutrient_key], t.target);
      const value = number(totals[t.nutrient_key]);
      row.append(info, node("b", value === null ? "Not logged" : `${format(value)} ${t.unit} logged`));
      return row;
    }) : [empty("Your program or coach has not configured daily nutrient targets yet.")]));
    const numeric = Object.entries(totals).filter(([, v]) => number(v) !== null);
    el("full-profile").replaceChildren(...(numeric.length ? numeric.map(([key, value]) => {
      const t = catalog.get(key), row = node("div", undefined, "rm218-target-row");
      row.append(node("strong", t?.name || key), node("b", `${format(value)}${t?.unit ? ` ${t.unit}` : ""}`));
      return row;
    }) : [empty("No nutrient values have been logged for this day.")]));
  }
  function renderSources(data) {
    sources = new Map();
    const placeholder = node("option", "Choose a food or recipe");
    placeholder.value = "";
    el("source").replaceChildren(placeholder);
    for (const [type, rows, label] of [["food", data.foods, "Foods & Ingredients"], ["recipe", data.recipes, "Recipes"]]) {
      if (!Array.isArray(rows) || !rows.length) continue;
      const group = node("optgroup"); group.label = label;
      for (const row of rows) {
        const key = `${type}:${row.id}`;
        sources.set(key, { type, id: row.id, row });
        const option = node("option", `${row.brand ? `${row.brand} · ` : ""}${row.name || row.title}`);
        option.value = key; group.append(option);
      }
      el("source").append(group);
    }
    sourceHint();
  }
  function sourceHint() {
    const source = sources.get(el("source").value);
    el("source-state").textContent = !sources.size
      ? "No published foods or recipes are available yet. Your team will add approved options here."
      : !source ? "Choose an approved food or recipe. Each quantity is a multiple of its serving below."
        : source.type === "recipe" ? "Quantity 1 = one recipe serving."
          : `Quantity 1 = ${format(number(source.row.serving_size) ?? 1)} ${source.row.serving_unit || "serving"}${number(source.row.grams_per_serving) !== null ? ` (${format(source.row.grams_per_serving)} g)` : ""}.`;
  }
  function renderTrends(rows) {
    const keys = [core[0], core[1], core[4], core[5]];
    const byDate = new Map((Array.isArray(rows) ? rows : []).map((row) => [row.date, row.totals || {}]));
    const cards = [];
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - offset);
      const key = dateKey(d), values = byDate.get(key), card = node("article", undefined, "rm218-trend-day");
      card.append(node("strong", d.toLocaleDateString(undefined, { month: "short", day: "numeric" })));
      if (!values) card.append(node("span", "No entries"));
      else for (const [nutrient, label, unit] of keys) card.append(node("span", `${label}: ${number(values[nutrient]) === null ? "Not logged" : `${format(values[nutrient])} ${unit}`}`));
      cards.push(card);
    }
    el("trends").replaceChildren(...cards);
  }
  async function rpc(name, params) {
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }
  async function refresh() {
    if (!enabled) return;
    const token = ++request, generation = epoch, date = selectedDate;
    clear();
    status("Loading nutrition diary…");
    el("diary-card").setAttribute("aria-busy", "true");
    try {
      const [day, sourceData, trends] = await Promise.all([
        rpc("get_my_nutrition_day", { p_log_date: date }), rpc("get_my_nutrition_sources"), rpc("get_my_nutrition_trends", { p_days: 7, p_end_date: dateKey() })
      ]);
      if (token !== request || generation !== epoch || !enabled) return;
      if (!day || !sourceData) throw new Error("Nutrition data is unavailable. Please try again.");
      renderDay(day); renderSources(sourceData); renderTrends(trends);
      ready = true; status();
    } catch (error) {
      if (token !== request || generation !== epoch || !enabled) return;
      clear(); status(error.message || "Nutrition could not be loaded. Please try again.", true);
      el("retry").hidden = false;
    } finally {
      if (token === request && generation === epoch) {
        el("diary-card").setAttribute("aria-busy", "false"); lockControls();
      }
    }
  }
  async function mutate(name, params) {
    if (!enabled || !ready || writing) return;
    writing = true; lockControls(); status("Saving diary…");
    const generation = epoch;
    try {
      const result = await rpc(name, params);
      if (generation !== epoch || !enabled) return;
      if (result === false || result == null) throw new Error("That diary item is unavailable. Refresh and try again.");
      el("note").value = ""; el("quantity").value = "1";
      await refresh();
    } catch (error) {
      if (generation === epoch && enabled) status(error.message || "The diary could not be saved. Please refresh before retrying.", true);
    } finally {
      if (generation === epoch) { writing = false; lockControls(); }
    }
  }
  function removeItem(id) { return mutate("delete_my_nutrition_item", { p_item_id: id }); }
  function navigate(date) {
    if (writing || !validDate(date)) { el("date").value = selectedDate; return; }
    selectedDate = date; el("date").value = date; void refresh();
  }
  function shift(days) {
    const d = new Date(`${selectedDate}T12:00:00`); d.setDate(d.getDate() + days); navigate(dateKey(d));
  }
  el("prev").addEventListener("click", () => shift(-1));
  el("next").addEventListener("click", () => shift(1));
  el("today").addEventListener("click", () => navigate(dateKey()));
  el("date").addEventListener("change", () => navigate(el("date").value));
  el("source").addEventListener("change", sourceHint);
  el("retry").addEventListener("click", () => void refresh());
  el("log-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!enabled || !ready || writing) return;
    const source = sources.get(el("source").value), quantity = Number(el("quantity").value);
    if (!source || !Number.isFinite(quantity) || quantity <= 0) { status("Choose a food or recipe and enter a quantity greater than zero.", true); return; }
    void mutate("log_my_nutrition_item", { p_log_date: selectedDate, p_meal_slot: el("slot").value,
      p_source_type: source.type, p_source_id: source.id, p_quantity: quantity, p_note: el("note").value.trim() || null });
  });
  document.addEventListener("ra:member-access-reset", reset);
  function applyAccess(allowed) {
    reset(); enabled = allowed === true;
    el("diary-card").classList.toggle("hidden", !enabled);
    lockControls();
    if (enabled && document.getElementById("rm-member-content")?.dataset.activeScreen === "nutrition") void refresh();
  }
  document.addEventListener("ra:member-dashboard-loaded", (event) => applyAccess(event.detail?.nutritionEnabled));
  document.addEventListener("ra:member-screen-changed", (event) => {
    if (event.detail?.screen === "nutrition" && enabled && !ready && el("diary-card").getAttribute("aria-busy") !== "true") void refresh();
  });
  // The dashboard may finish before this deferred script has loaded.
  applyAccess(window.RA_MEMBER_NUTRITION_ENABLED);
})();
