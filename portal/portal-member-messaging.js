(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let inboxMode="mine";
  let inboxRows=[];
  let activeConversationId=null;
  let activeContact=null;
  let contactConversation=null;

  function title(value){return portal.titleCase(value||"");}
  function setStatus(id,message,type=""){
    const t=el(id); if(!t)return;
    t.textContent=message||"";
    t.className="form-status"+(type?" "+type:"");
  }
  function personName(row){
    return [row.first_name,row.last_name].filter(Boolean).join(" ").trim()||row.email||"Member";
  }
  function closeModal(){
    activeConversationId=null;
    el("staff-message-modal").classList.add("hidden");
    el("staff-message-modal").setAttribute("aria-hidden","true");
    el("staff-message-body").value="";
    setStatus("staff-message-status","");
  }

  function filteredInbox(){
    if(inboxMode==="team")return inboxRows;
    return inboxRows.filter((row)=>row.staff_user_id===portal.currentUserId());
  }

  function renderInboxSummary(){
    const rows=filteredInbox();
    const unread=rows.reduce((sum,row)=>sum+Number(row.unread_count||0),0);
    const active=rows.length;
    const waiting=rows.filter((row)=>Number(row.unread_count||0)>0).length;

    const target=el("staff-inbox-summary");
    target.replaceChildren();
    [["Conversations",active],["Unread messages",unread],["Need reply",waiting]].forEach(([label,value])=>{
      const card=document.createElement("div");
      card.className="staff-inbox-stat";
      const s=document.createElement("span"); s.textContent=label;
      const strong=document.createElement("strong"); strong.textContent=String(value);
      card.append(s,strong); target.append(card);
    });
  }

  function renderInbox(){
    renderInboxSummary();
    const list=el("staff-inbox-list");
    list.replaceChildren();
    const rows=filteredInbox();

    if(!rows.length){
      const empty=document.createElement("div");
      empty.className="empty-state";
      empty.textContent=inboxMode==="mine"?"No active member conversations are assigned to you yet.":"No active member conversations yet.";
      list.append(empty);
      return;
    }

    rows.forEach((row)=>{
      const item=document.createElement("article");
      item.className="staff-inbox-item"+(Number(row.unread_count||0)>0?" unread":"");
      item.addEventListener("click",()=>openConversation(row));

      const person=document.createElement("div");
      person.className="staff-inbox-person";
      const name=document.createElement("strong");
      name.textContent=personName(row);
      const meta=document.createElement("span");
      meta.textContent=title(row.conversation_type)+(row.email?" · "+row.email:"");
      person.append(name,meta);

      const copy=document.createElement("div");
      copy.className="staff-inbox-copy";
      const titleEl=document.createElement("strong");
      titleEl.textContent=row.title||"ReVitalized Conversation";
      const preview=document.createElement("span");
      preview.textContent=row.last_message_preview||"No messages yet.";
      copy.append(titleEl,preview);

      const state=document.createElement("div");
      if(Number(row.unread_count||0)>0){
        const badge=document.createElement("span");
        badge.className="staff-inbox-unread";
        badge.textContent=row.unread_count+" unread";
        state.append(badge);
      }else{
        const time=document.createElement("span");
        time.className="staff-inbox-time";
        time.textContent=row.last_message_at?portal.formatDate(row.last_message_at,true):"No messages";
        state.append(time);
      }

      const actions=document.createElement("div");
      actions.className="staff-inbox-actions";
      const open=document.createElement("button");
      open.type="button";
      open.textContent="Open";
      open.addEventListener("click",(event)=>{event.stopPropagation();openConversation(row);});
      actions.append(open);

      item.append(person,copy,state,actions);
      list.append(item);
    });
  }

  async function loadInbox(){
    const {data,error}=await client
      .from("admin_staff_inbox")
      .select("*")
      .order("last_message_at",{ascending:false,nullsFirst:false});
    if(error){
      el("staff-inbox-list").innerHTML='<div class="empty-state">Coach Inbox could not be loaded. '+error.message+'</div>';
      return;
    }
    inboxRows=data||[];
    renderInbox();
  }

  async function markRead(conversationId){
    await client.from("member_conversation_participants")
      .update({last_read_at:new Date().toISOString()})
      .eq("conversation_id",conversationId)
      .eq("user_id",portal.currentUserId());
  }

  async function openConversation(row){
    activeConversationId=row.conversation_id;
    el("staff-message-title").textContent=row.title||"ReVitalized Conversation";
    el("staff-message-meta").textContent=[
      personName(row),
      row.email||"",
      title(row.conversation_type)
    ].filter(Boolean).join(" · ");
    el("staff-message-thread").innerHTML='<div class="empty-state">Loading messages...</div>';
    el("staff-message-modal").classList.remove("hidden");
    el("staff-message-modal").setAttribute("aria-hidden","false");

    const {data,error}=await client.from("member_messages")
      .select("id,sender_user_id,body,message_type,created_at")
      .eq("conversation_id",row.conversation_id)
      .is("deleted_at",null)
      .order("created_at");

    if(error){
      el("staff-message-thread").innerHTML='<div class="empty-state">Messages could not be loaded.</div>';
      return;
    }

    const thread=el("staff-message-thread");
    thread.replaceChildren();
    (data||[]).forEach((message)=>{
      const bubble=document.createElement("div");
      bubble.className="staff-message-bubble"+(message.sender_user_id===portal.currentUserId()?" mine":"");
      const p=document.createElement("p"); p.textContent=message.body;
      const time=document.createElement("small"); time.textContent=portal.formatDate(message.created_at,true);
      bubble.append(p,time); thread.append(bubble);
    });
    thread.scrollTop=thread.scrollHeight;

    await markRead(row.conversation_id);
    await loadInbox();
    if(activeContact?.id===row.contact_id)await loadContactConversation(activeContact.id);
  }

  async function loadContactConversation(contactId){
    const {data,error}=await client.from("admin_contact_conversations")
      .select("*")
      .eq("contact_id",contactId)
      .eq("conversation_type","coach_client")
      .maybeSingle();

    if(error){
      setStatus("client-message-status",error.message,"error");
      return;
    }

    contactConversation=data||null;
    const section=el("client-messaging-section");

    if(!contactConversation){
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");

    const inboxRow=inboxRows.find((row)=>row.conversation_id===contactConversation.conversation_id&&row.staff_user_id===portal.currentUserId())
      || inboxRows.find((row)=>row.conversation_id===contactConversation.conversation_id);

    const unread=Number(inboxRow?.unread_count||0);
    el("client-message-chip").textContent=unread+" Unread";

    const preview=el("client-message-preview");
    preview.replaceChildren();
    const heading=document.createElement("strong");
    heading.textContent=contactConversation.title||"ReVitalized Conversation";
    const p=document.createElement("p");
    p.textContent=contactConversation.last_message_preview||"No messages yet.";
    const small=document.createElement("small");
    small.textContent=contactConversation.last_message_at?portal.formatDate(contactConversation.last_message_at,true):"Conversation ready";
    preview.append(heading,p,small);
    setStatus("client-message-status","");
  }

  async function sendMessage(event){
    event.preventDefault();
    if(!activeConversationId)return;
    const body=el("staff-message-body").value.trim();
    if(!body)return;

    setStatus("staff-message-status","Sending...");
    const {error}=await client.from("member_messages").insert({
      conversation_id:activeConversationId,
      sender_user_id:portal.currentUserId(),
      sender_contact_id:null,
      body,
      message_type:"text"
    });

    if(error){
      setStatus("staff-message-status",error.message,"error");
      return;
    }

    el("staff-message-body").value="";
    setStatus("staff-message-status","Sent.","success");

    const row=inboxRows.find((r)=>r.conversation_id===activeConversationId)||{
      conversation_id:activeConversationId,
      title:el("staff-message-title").textContent,
      first_name:activeContact?.first_name||"",
      last_name:activeContact?.last_name||"",
      email:activeContact?.email||"",
      conversation_type:"coach_client"
    };

    await openConversation(row);
  }

  el("inbox-tab-mine").addEventListener("click",()=>{
    inboxMode="mine";
    el("inbox-tab-mine").classList.add("active");
    el("inbox-tab-team").classList.remove("active");
    renderInbox();
  });

  el("inbox-tab-team").addEventListener("click",()=>{
    inboxMode="team";
    el("inbox-tab-team").classList.add("active");
    el("inbox-tab-mine").classList.remove("active");
    renderInbox();
  });

  el("staff-message-form").addEventListener("submit",sendMessage);
  document.querySelectorAll("[data-staff-message-close]").forEach((node)=>node.addEventListener("click",closeModal));

  el("client-open-conversation").addEventListener("click",()=>{
    if(!contactConversation)return;
    const row=inboxRows.find((r)=>r.conversation_id===contactConversation.conversation_id)||{
      ...contactConversation,
      first_name:activeContact?.first_name||"",
      last_name:activeContact?.last_name||"",
      email:activeContact?.email||""
    };
    openConversation(row);
  });

  document.addEventListener("ra:contact-opened",async(event)=>{
    activeContact=event.detail.contact;
    if(!inboxRows.length)await loadInbox();
    await loadContactConversation(event.detail.contactId);
  });

  document.addEventListener("ra:contact-closed",()=>{
    activeContact=null;
    contactConversation=null;
    el("client-messaging-section").classList.add("hidden");
    closeModal();
  });

  document.addEventListener("ra:dashboard-loaded",loadInbox);
  window.setTimeout(()=>loadInbox(),700);

  document.addEventListener("keydown",(event)=>{
    if(event.key==="Escape"&&!el("staff-message-modal").classList.contains("hidden"))closeModal();
  });
})();