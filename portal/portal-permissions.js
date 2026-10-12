(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const tasks=portal.createAuthenticatedTaskGuard();

  let permissions={};
  let observing=false;
  let startupTimer=null;

  function has(key){
    return Boolean(permissions[key]);
  }

  portal.hasPermission=has;
  portal.permissions=()=>({...permissions});

  const selectorMap=[
    [".executive-pulse-panel","analytics.view"],
    [".community-admin-panel","community.manage"],
    [".refuel-admin-panel","refuel.manage"],
    ["#referral-admin-panel","referrals.manage"],
    [".companion-panel","companion.manage"],
    [".staff-inbox-panel","messaging.manage"],
    ["#staff-access-panel","staff.view"],
    ["#client-coaching-section","coaching.view"],
    ["#client-wellness-section","health.progress.manage"],
    ["#client-learning-section","learning.manage"],
    ["#client-messaging-section","messaging.manage"],
    ["#client-health-integrations-section","health.private.view"],
    ["#client-challenges-section","health.progress.manage"]
  ];

  function applyVisibility(){
    if(!portal.captureStaffSession())return;
    selectorMap.forEach(([selector,key])=>{
      document.querySelectorAll(selector).forEach((node)=>{
        const allowed=has(key);
        node.classList.toggle("permission-hidden",!allowed);
        if(!allowed)node.setAttribute("aria-hidden","true");
        else node.removeAttribute("aria-hidden");
      });
    });

    const peopleAdd=document.getElementById("people-add-button");
    if(peopleAdd)peopleAdd.disabled=!has("crm.manage");

    const staffInvite=document.getElementById("staff-invite-button");
    if(staffInvite)staffInvite.disabled=!has("staff.manage");

    const journeyControls=[
      "journey-action-center","journey-complete-step","journey-skip-step",
      "journey-pause","journey-nurture"
    ];
    journeyControls.forEach((id)=>{
      const node=document.getElementById(id);
      if(node)node.disabled=!has("crm.manage");
    });

    const financial=document.getElementById("action-center-operational");
    if(financial && !has("finance.view")){
      financial.classList.add("permission-hidden");
      financial.setAttribute("aria-hidden","true");
    }
  }

  async function loadPermissions(){
    const task=tasks.begin();
    if(!task)return;
    const {data,error}=await client.from("my_staff_permissions_view").select("*");
    if(!tasks.current(task))return;
    if(error){
      console.error("Staff permissions failed",error);
      permissions={};
      applyVisibility();
      return;
    }

    permissions=Object.fromEntries((data||[]).map((row)=>[
      row.permission_key,Boolean(row.allowed)
    ]));

    applyVisibility();
    document.dispatchEvent(new CustomEvent("ra:permissions-loaded",{
      detail:{permissions:{...permissions}}
    }));
  }

  const observer=new MutationObserver(()=>applyVisibility());
  function startObserver(){
    if(observing||!portal.captureStaffSession())return;
    observer.observe(document.body,{subtree:true,childList:true});
    observing=true;
  }
  function teardown(){
    tasks.cancel();
    permissions={};
    observer.disconnect();
    observing=false;
    if(startupTimer!==null)window.clearTimeout(startupTimer);
    startupTimer=null;
  }

  function initialize(){
    if(startupTimer!==null)window.clearTimeout(startupTimer);
    startupTimer=null;
    if(!portal.captureStaffSession())return;
    startObserver();
    applyVisibility();
    loadPermissions();
  }

  document.addEventListener("ra:contact-opened",applyVisibility);
  document.addEventListener("ra:permissions-refresh",loadPermissions);
  document.addEventListener("ra:staff-access-reset",teardown);
  document.addEventListener("ra:dashboard-loaded",initialize);
  startupTimer=window.setTimeout(initialize,250);
})();
