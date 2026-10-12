(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const tasks=portal.createAuthenticatedTaskGuard();
  const el=(id)=>document.getElementById(id);
  let spaces=[];
  let posts=[];
  let startupTimer=null;
  let closeTimer=null;

  function stat(label,value){
    const card=document.createElement("div");
    card.className="community-admin-stat";
    const s=document.createElement("span");s.textContent=label;
    const b=document.createElement("strong");b.textContent=String(value);
    card.append(s,b);return card;
  }
  function closeModal(){
    const modal=el("community-admin-modal");
    if(!modal)return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden","true");
  }
  function renderMetrics(row){
    const target=el("community-admin-metrics");
    if(!target||!portal.captureStaffSession())return;
    target.replaceChildren(
      stat("Active Spaces",row.active_spaces||0),
      stat("Posts · 7d",row.posts_7d||0),
      stat("Comments · 7d",row.comments_7d||0),
      stat("Reactions · 7d",row.reactions_7d||0),
      stat("Memberships",row.active_space_memberships||0)
    );
  }
  function renderFeed(){
    if(!portal.captureStaffSession())return;
    const list=el("community-admin-feed");
    if(!list)return;
    list.replaceChildren();
    if(!posts.length){
      list.innerHTML='<div class="empty-state">No community posts yet.</div>';
      return;
    }
    posts.slice(0,30).forEach((row)=>{
      const item=document.createElement("article");
      item.className="community-admin-item"+(row.status!=="published"?" hidden-post":"");

      const person=document.createElement("div");
      person.className="community-admin-person";
      const name=document.createElement("strong");name.textContent=row.author_name;
      const meta=document.createElement("span");meta.textContent=row.space_name+" · "+portal.titleCase(row.post_type);
      person.append(name,meta);

      const copy=document.createElement("div");
      copy.className="community-admin-copy";
      const heading=document.createElement("strong");heading.textContent=row.title||row.body.slice(0,90);
      const preview=document.createElement("span");preview.textContent=row.body.slice(0,180)+(row.body.length>180?"…":"");
      copy.append(heading,preview);

      const state=document.createElement("div");
      state.className="community-admin-state";
      state.textContent=(row.pinned?"PINNED · ":"")+portal.titleCase(row.status);

      const actions=document.createElement("div");
      actions.className="community-admin-actions";

      const pin=document.createElement("button");
      pin.type="button";pin.textContent=row.pinned?"Unpin":"Pin";
      pin.addEventListener("click",()=>togglePin(row));

      const mod=document.createElement("button");
      mod.type="button";
      mod.className=row.status==="published"?"danger":"";
      mod.textContent=row.status==="published"?"Hide":"Restore";
      mod.addEventListener("click",()=>moderate(row,row.status==="published"?"hide_post":"restore_post"));

      actions.append(pin,mod);
      item.append(person,copy,state,actions);
      list.append(item);
    });
  }
  async function load(){
    const task=tasks.begin();
    if(!task)return;
    const [spacesResult,postsResult,metricsResult]=await Promise.all([
      client.from("admin_community_spaces").select("*").eq("status","active").order("name"),
      client.from("admin_community_feed").select("*").order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(50),
      client.from("admin_community_metrics").select("*").maybeSingle()
    ]);
    if(!tasks.current(task))return;
    const failed=[spacesResult,postsResult,metricsResult].find((r)=>r.error);
    if(failed?.error){console.error("Community manager failed",failed.error);return;}
    spaces=spacesResult.data||[];
    posts=postsResult.data||[];
    renderMetrics(metricsResult.data||{});
    renderFeed();
  }
  function openNew(){
    if(!portal.captureStaffSession())return;
    const select=el("community-admin-space");
    if(!select)return;
    select.replaceChildren();
    spaces.forEach((space)=>{
      const option=document.createElement("option");
      option.value=space.space_id;
      option.textContent=space.name+" · "+portal.titleCase(space.space_type);
      select.append(option);
    });
    el("community-admin-modal").classList.remove("hidden");
    el("community-admin-modal").setAttribute("aria-hidden","false");
    portal.showStatus(el("community-admin-status"),"");
  }
  async function publish(event){
    event.preventDefault();
    const task=tasks.begin();
    if(!task)return;
    const body=el("community-admin-body").value.trim();
    if(!body)return;
    portal.showStatus(el("community-admin-status"),"Publishing...");
    const {error}=await client.from("community_posts").insert({
      space_id:el("community-admin-space").value,
      author_user_id:portal.currentUserId(),
      author_contact_id:null,
      post_type:el("community-admin-type").value,
      title:el("community-admin-post-title").value.trim()||null,
      body,status:"published",
      pinned:el("community-admin-pin").checked
    });
    if(!tasks.current(task))return;
    if(error){portal.showStatus(el("community-admin-status"),error.message,"error");return;}
    event.currentTarget.reset();
    portal.showStatus(el("community-admin-status"),"Announcement published.","success");
    await load();
    if(portal.captureStaffSession())closeTimer=window.setTimeout(()=>{
      closeTimer=null;
      if(portal.captureStaffSession())closeModal();
    },450);
  }
  async function togglePin(row){
    const task=tasks.begin();
    if(!task)return;
    const {error}=await client.rpc("toggle_community_post_pin",{p_post_id:row.post_id,p_pinned:!row.pinned});
    if(!tasks.current(task))return;
    if(error){window.alert(error.message);return;}
    await load();
  }
  async function moderate(row,action){
    if(!portal.captureStaffSession())return;
    const reason=window.prompt(action==="hide_post"?"Why are you hiding this community post?":"Why are you restoring this community post?");
    if(!reason?.trim())return;
    const task=tasks.begin();
    if(!task)return;
    const {error}=await client.rpc("moderate_community_post",{p_post_id:row.post_id,p_action:action,p_reason:reason.trim()});
    if(!tasks.current(task))return;
    if(error){window.alert(error.message);return;}
    await load();
  }

  function teardown(){
    tasks.cancel();
    spaces=[];
    posts=[];
    if(startupTimer!==null)window.clearTimeout(startupTimer);
    startupTimer=null;
    if(closeTimer!==null)window.clearTimeout(closeTimer);
    closeTimer=null;
    closeModal();
  }

  function initialize(){
    if(startupTimer!==null)window.clearTimeout(startupTimer);
    startupTimer=null;
    load();
  }

  el("community-admin-new")?.addEventListener("click",openNew);
  el("community-admin-form")?.addEventListener("submit",publish);
  document.querySelectorAll("[data-community-admin-close]").forEach((n)=>n.addEventListener("click",closeModal));
  document.addEventListener("ra:staff-access-reset",teardown);
  document.addEventListener("ra:dashboard-loaded",initialize);
  startupTimer=window.setTimeout(initialize,950);
})();
