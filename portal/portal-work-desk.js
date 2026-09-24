(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const el = (id) => document.getElementById(id);

  let mode = "mine";
  let rows = [];
  let loading = false;

  function currentUserId() {
    return portal.currentUserId();
  }

  function personName(row) {
    return [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email || "Unnamed contact";
  }

  function dueLabel(row) {
    if (!row.due_at) return "No due date";
    const prefix = row.overdue ? "Overdue · " : row.due_bucket === "today" ? "Today · " : "";
    return prefix + portal.formatDate(row.due_at, true);
  }

  function workRows() {
    let filtered = [...rows];

    if (mode === "mine") {
      filtered = filtered.filter((row) => row.assigned_to === currentUserId());
    }

    const category = el("work-category-filter").value;
    const due = el("work-due-filter").value;

    if (category) filtered = filtered.filter((row) => row.work_category === category);
    if (due) filtered = filtered.filter((row) => row.due_bucket === due);

    return filtered;
  }

  function statCard(label, value, className = "") {
    const card = document.createElement("div");
    card.className = "work-stat" + (className ? " " + className : "");
    const name = document.createElement("span");
    name.textContent = label;
    const count = document.createElement("strong");
    count.textContent = String(value);
    card.append(name, count);
    return card;
  }

  function renderStats() {
    const source = mode === "mine"
      ? rows.filter((row) => row.assigned_to === currentUserId())
      : rows;

    const stats = el("work-desk-stats");
    stats.replaceChildren(
      statCard("Open", source.length),
      statCard("Overdue", source.filter((row) => row.overdue).length, "overdue"),
      statCard("Due today", source.filter((row) => row.due_bucket === "today").length, "today"),
      statCard("Reports", source.filter((row) => row.work_category === "Report Review").length),
      statCard("Scheduling", source.filter((row) => row.work_category === "Scheduling").length)
    );
  }

  function render() {
    renderStats();

    const list = el("work-desk-list");
    list.replaceChildren();

    const filtered = workRows();

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = mode === "mine"
        ? "Nothing is currently assigned to you in this view."
        : "No open work matches these filters.";
      list.append(empty);
      return;
    }

    filtered.forEach((row) => {
      const item = document.createElement("article");
      item.className = "work-item" + (row.overdue ? " overdue" : "");

      const person = document.createElement("div");
      person.className = "work-person";
      const personStrong = document.createElement("strong");
      personStrong.textContent = personName(row);
      const personMeta = document.createElement("span");
      personMeta.textContent = row.email || row.phone || portal.titleCase(row.lifecycle_stage);
      person.append(personStrong, personMeta);

      if (!row.assigned_to) {
        const unassigned = document.createElement("em");
        unassigned.className = "work-unassigned";
        unassigned.textContent = "UNASSIGNED";
        person.append(unassigned);
      }

      const task = document.createElement("div");
      task.className = "work-task";
      const taskStrong = document.createElement("strong");
      taskStrong.textContent = row.title;
      const taskMeta = document.createElement("span");
      taskMeta.textContent = row.journey_step_name || row.journey_name || "General follow-up";
      task.append(taskStrong, taskMeta);

      const meta = document.createElement("div");
      meta.className = "work-meta";
      const category = document.createElement("span");
      category.className = "work-category";
      category.textContent = row.work_category || "Follow-Up";
      const assignee = document.createElement("span");
      assignee.textContent = row.assigned_name ? "Assigned to " + row.assigned_name : "No owner yet";
      meta.append(category, assignee);

      const due = document.createElement("div");
      due.className = "work-due" + (row.overdue ? " overdue" : "");
      const dueStrong = document.createElement("strong");
      dueStrong.textContent = dueLabel(row);
      const dueMeta = document.createElement("span");
      dueMeta.textContent = portal.titleCase(row.priority || "normal") + " priority";
      due.append(dueStrong, dueMeta);

      const actions = document.createElement("div");
      actions.className = "work-actions";

      if (!row.assigned_to || row.assigned_to !== currentUserId()) {
        const take = document.createElement("button");
        take.type = "button";
        take.className = "gold";
        take.textContent = "Take It";
        take.addEventListener("click", () => takeWork(row));
        actions.append(take);
      }

      const open = document.createElement("button");
      open.type = "button";
      open.textContent = "Open Contact";
      open.addEventListener("click", () => portal.openContact(row.contact_id));

      const complete = document.createElement("button");
      complete.type = "button";
      complete.className = "primary";
      complete.textContent = "Complete";
      complete.addEventListener("click", () => completeWork(row));

      actions.append(open, complete);
      item.append(person, task, meta, due, actions);
      list.append(item);
    });
  }

  async function load() {
    if (loading) return;
    loading = true;

    const list = el("work-desk-list");
    if (!rows.length) {
      list.innerHTML = '<div class="empty-state">Loading work queue...</div>';
    }

    const { data, error } = await client
      .from("admin_work_queue")
      .select("*")
      .order("overdue", { ascending: false })
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(100);

    loading = false;

    if (error) {
      list.innerHTML = "";
      const failed = document.createElement("div");
      failed.className = "empty-state";
      failed.textContent = "The work queue could not be loaded. " + error.message;
      list.append(failed);
      return;
    }

    rows = data || [];
    render();
  }

  async function syncOwnership(row, userId) {
    const updates = [
      client.from("follow_up_tasks").update({ assigned_to: userId }).eq("id", row.task_id)
    ];

    if (row.journey_step_id) {
      updates.push(
        client.from("contact_journey_steps")
          .update({ assigned_to: userId, updated_at: new Date().toISOString() })
          .eq("id", row.journey_step_id)
      );
    }

    if (row.journey_id) {
      updates.push(
        client.from("contact_journeys")
          .update({ assigned_to: userId, updated_at: new Date().toISOString() })
          .eq("id", row.journey_id)
      );
    }

    updates.push(
      client.from("contacts")
        .update({ assigned_to: userId, updated_at: new Date().toISOString() })
        .eq("id", row.contact_id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
  }

  async function takeWork(row) {
    const userId = currentUserId();
    if (!userId) return;

    try {
      await syncOwnership(row, userId);
      await portal.logActivity(
        row.contact_id,
        "work_assigned",
        "Work assigned",
        row.title,
        { task_id: row.task_id, assigned_to: userId, journey_id: row.journey_id || null }
      );
      mode = "mine";
      updateTabs();
      await Promise.all([load(), portal.loadDashboard()]);
    } catch (error) {
      window.alert("Could not assign this work: " + (error.message || error));
    }
  }

  async function completeWork(row) {
    const now = new Date().toISOString();
    const { error } = await client
      .from("follow_up_tasks")
      .update({ status: "completed", completed_at: now })
      .eq("id", row.task_id);

    if (error) {
      window.alert("Could not complete this task: " + error.message);
      return;
    }

    await portal.logActivity(
      row.contact_id,
      "task_completed",
      "Task completed",
      row.title,
      { task_id: row.task_id, journey_id: row.journey_id || null }
    );

    await Promise.all([load(), portal.loadDashboard()]);
  }

  function updateTabs() {
    const mine = el("work-tab-mine");
    const team = el("work-tab-team");
    const mineActive = mode === "mine";

    mine.classList.toggle("active", mineActive);
    team.classList.toggle("active", !mineActive);
    mine.setAttribute("aria-selected", String(mineActive));
    team.setAttribute("aria-selected", String(!mineActive));
    render();
  }

  el("work-tab-mine").addEventListener("click", () => {
    mode = "mine";
    updateTabs();
  });

  el("work-tab-team").addEventListener("click", () => {
    mode = "team";
    updateTabs();
  });

  el("work-category-filter").addEventListener("change", render);
  el("work-due-filter").addEventListener("change", render);
  el("work-refresh").addEventListener("click", load);

  document.addEventListener("ra:dashboard-loaded", load);
  document.addEventListener("ra:contact-opened", () => {});
  document.addEventListener("ra:contact-closed", load);

  window.setTimeout(() => {
    if (!document.getElementById("portal-view")?.classList.contains("hidden")) load();
  }, 650);
})();