(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const list = document.getElementById("journey-pipeline-list");
  const summary = document.getElementById("journey-pipeline-summary");

  function name(row) {
    return [row.first_name,row.last_name].filter(Boolean).join(" ").trim() || row.email || "Unnamed contact";
  }

  function dueText(value) {
    return value ? portal.formatDate(value, true) : "No due date";
  }

  function chip(label, value, className = "") {
    const span = document.createElement("span");
    span.className = "pipeline-summary-chip" + (className ? " " + className : "");
    const strong = document.createElement("strong");
    strong.textContent = String(value);
    const text = document.createElement("span");
    text.textContent = label;
    span.append(strong, text);
    return span;
  }

  function render(rows) {
    list.replaceChildren();
    summary.replaceChildren();

    const hot = rows.filter((row) => row.temperature === "hot").length;
    const warm = rows.filter((row) => row.temperature === "warm").length;
    const stalled = rows.filter((row) => row.stalled).length;

    summary.append(
      chip("Active", rows.length, rows.length ? "active" : ""),
      chip("Hot", hot, hot ? "hot" : ""),
      chip("Warm", warm, warm ? "warm" : ""),
      chip("Stalled", stalled, stalled ? "stalled" : "")
    );

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No active sales or onboarding journeys yet.";
      list.append(empty);
      return;
    }

    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "pipeline-row";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", "Open " + name(row));

      const person = document.createElement("div");
      person.className = "pipeline-person";
      const personName = document.createElement("strong");
      personName.textContent = name(row);
      const personMeta = document.createElement("span");
      personMeta.textContent = row.email || row.phone || "Contact record";
      person.append(personName, personMeta);

      const route = document.createElement("div");
      route.className = "pipeline-route";
      const routeName = document.createElement("strong");
      routeName.textContent = row.journey_name || portal.titleCase(row.journey_key);
      const routeMeta = document.createElement("span");
      routeMeta.textContent = portal.titleCase(row.journey_status);
      route.append(routeName, routeMeta);

      const step = document.createElement("div");
      step.className = "pipeline-step";
      const stepName = document.createElement("strong");
      stepName.textContent = row.current_step_name || "Journey complete";
      const stepMeta = document.createElement("span");
      stepMeta.textContent = row.stalled ? "Needs attention" : "Current next step";
      step.append(stepName, stepMeta);

      const temp = document.createElement("div");
      const tempChip = document.createElement("span");
      tempChip.className = "pipeline-temp " + (row.temperature || "cold");
      tempChip.textContent = portal.titleCase(row.temperature || "cold") + " · " + Number(row.intent_score || 0);
      temp.append(tempChip);

      const progress = document.createElement("div");
      progress.className = "pipeline-progress";
      const progressValue = document.createElement("strong");
      progressValue.textContent = Number(row.progress_percent || 0) + "%";
      const progressLabel = document.createElement("span");
      progressLabel.textContent = "Complete";
      progress.append(progressValue, progressLabel);

      const due = document.createElement("div");
      due.className = "pipeline-due" + (row.stalled ? " stalled" : "");
      due.textContent = row.current_step_due_at
        ? (row.stalled ? "Overdue · " : "Due · ") + dueText(row.current_step_due_at)
        : "No due date";

      item.append(person, route, step, temp, progress, due);

      const open = () => portal.openContact(row.contact_id);
      item.addEventListener("click", open);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });

      list.append(item);
    });
  }

  async function loadPipeline() {
    const { data, error } = await client
      .from("admin_journey_pipeline")
      .select("*")
      .in("journey_status", ["active","paused","nurture"])
      .order("current_step_due_at", { ascending: true, nullsFirst: false })
      .limit(20);

    if (error) {
      list.replaceChildren();
      const failed = document.createElement("div");
      failed.className = "empty-state";
      failed.textContent = "Journey pipeline could not be loaded. " + error.message;
      list.append(failed);
      return;
    }

    render(data || []);
  }

  document.addEventListener("ra:dashboard-loaded", loadPipeline);

  window.setTimeout(() => {
    if (!document.getElementById("portal-view")?.classList.contains("hidden")) loadPipeline();
  }, 500);
})();