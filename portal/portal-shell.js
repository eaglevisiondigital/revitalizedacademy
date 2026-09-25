
(() => {
  "use strict";

  const portalView = document.getElementById("portal-view");
  const header = document.querySelector(".portal-header");
  const content = document.querySelector(".portal-content");
  if (!portalView || !header || !content) return;

  const icon = (name) => {
    const icons = {
      dashboard:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-6h6v6"/></svg>',
      people:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 14c2.9-.3 4.7 1.4 5 4"/></svg>',
      journey:'<svg viewBox="0 0 24 24"><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h3c5 0 3-10 7-10h0"/></svg>',
      coaching:'<svg viewBox="0 0 24 24"><path d="M5 4h14v12H8l-3 3V4Z"/><path d="M9 9h6M9 12h4"/></svg>',
      calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',
      messages:'<svg viewBox="0 0 24 24"><path d="M4 5h16v12H8l-4 3V5Z"/><path d="M8 9h8M8 13h5"/></svg>',
      programs:'<svg viewBox="0 0 24 24"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z"/><path d="M4 18.5A3.5 3.5 0 0 1 7.5 15H20"/></svg>',
      community:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.4-4.2 2.4-6.5 5.5-6.5s5.1 2.3 5.5 6.5"/><path d="M14.5 14.5c3.7-.3 6 1.5 6.5 5.5"/></svg>',
      billing:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
      team:'<svg viewBox="0 0 24 24"><path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z"/><path d="M9 11h6M12 8v6"/></svg>',
      reports:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
      settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 13.5V10.5l2-1-2-3.4-2.2.6-2.6-1.5L13.5 3h-3l-.7 2.2-2.6 1.5L5 6.1 3 9.5l2 1v3l-2 1 2 3.4 2.2-.6 2.6 1.5.7 2.2h3l.7-2.2 2.6-1.5 2.2.6 2-3.4-2-1Z"/></svg>'
    };
    return icons[name] || icons.dashboard;
  };

  const nav = [
    {key:"dashboard",label:"Dashboard",subs:[]},
    {key:"people",label:"People",subs:[["Directory",".contacts-panel"],["Referrals","#referral-admin-panel"]]},
    {key:"journey",label:"Journey",subs:[["Pipeline",".journey-pipeline-panel"]]},
    {key:"coaching",label:"Coaching",subs:[["Work Desk",".work-desk-panel"],["Coach Companion",".companion-panel"]]},
    {key:"calendar",label:"Calendar",subs:[["Team Calendar","#team-calendar-panel"]]},
    {key:"messages",label:"Messages",subs:[["Coach Inbox",".staff-inbox-panel"]]},
    {key:"programs",label:"Programs",subs:[["Program Catalog","#program-catalog-panel"],["Content Library","#program-content-panel"],["ReFuel",".refuel-admin-panel"]]},
    {key:"community",label:"Community",subs:[["Announcements",".community-admin-panel"]]},
    {key:"billing",label:"Billing & Agreements",subs:[["Billing","#billing-operations-panel"],["Agreements","#agreement-library-panel"]]},
    {key:"team",label:"Team",subs:[["Permissions","#staff-access-panel"],["Workload","#team-workload-panel"]]},
    {key:"reports",label:"Reports",subs:[["Executive Pulse",".executive-pulse-panel"]]}
  ];

  const aside = document.createElement("aside");
  aside.className = "ra-sidebar";
  aside.setAttribute("aria-label","ReVitalized Academy portal navigation");
  aside.innerHTML = '<div class="ra-sidebar-brand"><img src="../assets/images/revitalized-logo-dark-approved-v69.png" alt="ReVitalized Academy"></div><div class="ra-sidebar-scroll"><div class="ra-sidebar-label">Operations</div><nav class="ra-sidebar-nav"></nav></div><div class="ra-sidebar-footer"></div>';
  portalView.prepend(aside);

  const navEl = aside.querySelector(".ra-sidebar-nav");
  nav.forEach((item) => {
    const group = document.createElement("div");
    group.className = "ra-nav-group";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ra-nav-item";
    button.dataset.workspace = item.key;
    button.innerHTML = '<span class="ra-nav-icon">'+icon(item.key)+'</span><span class="ra-nav-text">'+item.label+'</span>'+(item.subs.length?'<span class="ra-nav-caret">›</span>':'');
    group.append(button);
    if (item.subs.length) {
      const sub = document.createElement("div");
      sub.className = "ra-subnav";
      item.subs.forEach(([label,selector])=>{
        const sb=document.createElement("button");
        sb.type="button"; sb.textContent=label; sb.dataset.workspace=item.key; sb.dataset.target=selector;
        sub.append(sb);
      });
      group.append(sub);
    }
    navEl.append(group);
  });

  const footer = aside.querySelector(".ra-sidebar-footer");
  const settings = document.createElement("button");
  settings.className="ra-nav-item"; settings.type="button";
  settings.innerHTML='<span class="ra-nav-icon">'+icon("settings")+'</span><span class="ra-nav-text">Account & Settings</span>';
  settings.addEventListener("click",()=>document.getElementById("account-button")?.click());
  footer.append(settings);

  const headerContext=document.createElement("div");
  headerContext.className="ra-header-context";
  headerContext.innerHTML='<div class="ra-header-icon">'+icon("dashboard")+'</div><div><strong id="ra-header-title">Dashboard</strong><span>ReVitalized Academy Operations</span></div>';
  header.insertBefore(headerContext,header.querySelector(".portal-header-actions"));

  const mobile=document.createElement("button");
  mobile.type="button"; mobile.className="ra-mobile-menu"; mobile.setAttribute("aria-label","Open navigation");
  mobile.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  header.insertBefore(mobile,header.firstChild);
  mobile.addEventListener("click",()=>document.body.classList.toggle("ra-mobile-nav-open"));

  const introTitle=content.querySelector(".portal-intro h1");
  const introEyebrow=content.querySelector(".portal-intro .eyebrow");
  const introText=content.querySelector(".portal-intro>div>p:not(.eyebrow)");
  const headings={
    dashboard:["REVITALIZED ACADEMY PLATFORM • v1.0","Operations Dashboard","Your most important activity, priorities and client movement in one place."],
    people:["PEOPLE & CRM","People","Leads, applicants, clients, referrals and relationships in one organized workspace."],
    journey:["CLIENT JOURNEY","Journey Pipeline","Track every person from first contact through assessment, consultation, enrollment and active membership."],
    coaching:["COACHING OPERATIONS","Coaching","Manage coach work, client follow-up, reviews and the human side of the ReVitalized experience."],
    calendar:["SCHEDULE","Calendar","Consultations, coaching sessions, interviews and team availability."],
    messages:["COMMUNICATIONS","Messages","Private member conversations, follow-up and team communication."],
    programs:["PROGRAMS & LEARNING","Programs","ReFuel, learning, challenges and the programs that support the client journey."],
    community:["COMMUNITY","Community","Announcements, spaces and member engagement across ReVitalized."],
    billing:["FINANCE & AGREEMENTS","Billing & Agreements","Membership billing, payments, agreements and signature workflows."],
    team:["TEAM OPERATIONS","Team","Staff access, permissions, workload, onboarding and coach operations."],
    reports:["EXECUTIVE VIEW","Reports & Analytics","Growth, engagement, conversion and platform health for ReVitalized leadership."]
  };

  const dashboardGrid=content.querySelector(".dashboard-grid");
  const metricsSection=content.querySelector('section[aria-labelledby="metrics-title"]');
  const workspaceMap = {
    dashboard:[metricsSection,dashboardGrid,content.querySelector(".work-desk-panel"),content.querySelector(".journey-pipeline-panel")],
    people:[content.querySelector(".contacts-panel"),document.getElementById("referral-admin-panel")],
    journey:[content.querySelector(".journey-pipeline-panel")],
    coaching:[content.querySelector(".work-desk-panel"),content.querySelector(".companion-panel")],
    calendar:[document.getElementById("team-calendar-panel")],
    messages:[content.querySelector(".staff-inbox-panel")],
    programs:[document.getElementById("program-catalog-panel"),document.getElementById("program-content-panel"),content.querySelector(".refuel-admin-panel")],
    community:[content.querySelector(".community-admin-panel")],
    billing:[document.getElementById("billing-operations-panel"),document.getElementById("agreement-library-panel")],
    team:[document.getElementById("staff-access-panel"),document.getElementById("team-workload-panel")],
    reports:[content.querySelector(".executive-pulse-panel")]
  };

  const known = new Set();
  Object.values(workspaceMap).flat().filter(Boolean).forEach(el=>known.add(el));

  // All remaining top-level feature panels become hidden from Dashboard but stay available to their existing scripts.
  Array.from(content.children).forEach(el=>{
    if (el.classList.contains("portal-intro")) return;
    if (known.has(el)) return;
    if (el.tagName==="SECTION" || el.classList.contains("dashboard-grid")) el.dataset.raSecondary="true";
  });

  const quick=document.createElement("section");
  quick.className="panel ra-dashboard-quick-actions";
  quick.innerHTML='<div class="panel-heading"><div><p class="section-kicker">QUICK ACTIONS</p><h2>Go straight to what you need</h2></div></div><div class="ra-quick-actions-grid"></div>';
  const quickGrid=quick.querySelector(".ra-quick-actions-grid");
  const qa=[
    ["Add Person","people","add",()=>document.getElementById("people-add-button")?.click()],
    ["People Directory","people","people",null],
    ["Journey Pipeline","journey","journey",null],
    ["Team Calendar","calendar","calendar",null],
    ["Messages","messages","messages",null],
    ["Billing & Agreements","billing","billing",null]
  ];
  const qIcons={add:icon("people"),people:icon("people"),journey:icon("journey"),calendar:icon("calendar"),messages:icon("messages"),billing:icon("billing")};
  qa.forEach(([label,workspace,iName,action],idx)=>{
    const b=document.createElement("button"); b.type="button"; b.className="ra-quick-action"+(idx===0?" gold":"");
    b.innerHTML='<span class="ra-quick-action-icon">'+qIcons[iName]+'</span><span>'+label+'</span>';
    b.addEventListener("click",()=>{setWorkspace(workspace); if(action) setTimeout(action,50);});
    quickGrid.append(b);
  });
  if (dashboardGrid) dashboardGrid.insertAdjacentElement("afterend",quick);

  function allWorkspaceElements(){
    const set=new Set();
    Object.values(workspaceMap).flat().filter(Boolean).forEach(x=>set.add(x));
    set.add(quick);
    return [...set];
  }

  function setWorkspace(key,target){
    if(!workspaceMap[key]) key="dashboard";
    document.body.dataset.raWorkspace=key;
    const [eye,title,desc]=headings[key];
    if(introEyebrow) introEyebrow.textContent=eye;
    if(introTitle) introTitle.textContent=title;
    if(introText) introText.textContent=desc;
    const h=document.getElementById("ra-header-title"); if(h)h.textContent=title;

    allWorkspaceElements().forEach(el=>el.classList.add("ra-workspace-hidden"));
    (workspaceMap[key]||[]).filter(Boolean).forEach(el=>el.classList.remove("ra-workspace-hidden"));
    if(key==="dashboard") quick.classList.remove("ra-workspace-hidden");

    document.querySelectorAll(".ra-nav-item[data-workspace]").forEach(btn=>{
      const active=btn.dataset.workspace===key;
      btn.classList.toggle("active",active);
      btn.closest(".ra-nav-group")?.classList.toggle("open",active);
    });
    document.querySelectorAll(".ra-subnav button").forEach(btn=>{
      btn.classList.toggle("ra-sub-active", Boolean(target) && btn.dataset.workspace===key && btn.dataset.target===target);
    });

    if(target){
      const node=document.querySelector(target);
      if(node && !node.classList.contains("hidden")) requestAnimationFrame(()=>node.scrollIntoView({behavior:"smooth",block:"start"}));
    } else {
      window.scrollTo({top:0,behavior:"smooth"});
    }
    document.body.classList.remove("ra-mobile-nav-open");
    try{history.replaceState(null,"","#"+key);}catch(e){}
  }

  navEl.addEventListener("click",(event)=>{
    const btn=event.target.closest("button[data-workspace]");
    if(!btn)return;
    setWorkspace(btn.dataset.workspace,btn.dataset.target||null);
  });

  portalView.classList.add("ra-shell-ready");
  const hash=location.hash.replace("#","");
  setWorkspace(workspaceMap[hash]?hash:"dashboard");

  // Keep hidden-by-permission panels hidden without breaking workspace state.
  document.addEventListener("ra:dashboard-loaded",()=>{
    const key=document.body.dataset.raWorkspace||"dashboard";
    (workspaceMap[key]||[]).filter(Boolean).forEach(el=>el.classList.remove("ra-workspace-hidden"));
  });
})();
