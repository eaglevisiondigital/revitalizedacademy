(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let reviewRows=[];
  let knowledgeRows=[];
  let activeReview=null;
  let activeSource=null;

  function title(value){return portal.titleCase(value||"");}

  function setStatus(id,message,type=""){
    const target=el(id);
    if(!target)return;
    target.textContent=message||"";
    target.className="form-status"+(type?" "+type:"");
  }

  function personName(row){
    return [row.first_name,row.last_name].filter(Boolean).join(" ").trim()||row.email||"Member";
  }

  function closeReview(){
    activeReview=null;
    el("companion-review-modal").classList.add("hidden");
    el("companion-review-modal").setAttribute("aria-hidden","true");
    el("companion-response").value="";
    setStatus("companion-review-status","");
  }

  function closeKnowledge(){
    activeSource=null;
    el("companion-knowledge-modal").classList.add("hidden");
    el("companion-knowledge-modal").setAttribute("aria-hidden","true");
    setStatus("companion-knowledge-status","");
  }

  function statCard(label,value){
    const card=document.createElement("div");
    card.className="companion-stat";
    const span=document.createElement("span");
    span.textContent=label;
    const strong=document.createElement("strong");
    strong.textContent=String(value);
    card.append(span,strong);
    return card;
  }

  function renderSummary(){
    const mine=reviewRows.filter((row)=>row.assigned_to===portal.currentUserId());
    const unassigned=reviewRows.filter((row)=>!row.assigned_to);
    const urgent=reviewRows.filter((row)=>row.handling_mode==="block_and_escalate");
    const target=el("companion-summary");
    target.replaceChildren(
      statCard("Open reviews",reviewRows.length),
      statCard("Assigned to me",mine.length),
      statCard("Unassigned",unassigned.length),
      statCard("High sensitivity",urgent.length)
    );
  }

  function renderReviews(){
    renderSummary();
    const list=el("companion-review-list");
    list.replaceChildren();

    if(!reviewRows.length){
      const empty=document.createElement("div");
      empty.className="empty-state";
      empty.textContent="No Coach Companion reviews are waiting right now.";
      list.append(empty);
      return;
    }

    reviewRows.forEach((row)=>{
      const item=document.createElement("article");
      item.className="companion-review-item"+(row.handling_mode==="block_and_escalate"?" high":"");

      const person=document.createElement("div");
      person.className="companion-review-person";
      const name=document.createElement("strong");
      name.textContent=personName(row);
      const email=document.createElement("span");
      email.textContent=row.email||row.question_type_label||"";
      person.append(name,email);

      const question=document.createElement("div");
      question.className="companion-review-question";
      const q=document.createElement("strong");
      q.textContent=row.question;
      const meta=document.createElement("span");
      meta.textContent=[
        row.question_type_label||title(row.question_type),
        row.review_reason||row.escalation_reason||"Human review required"
      ].filter(Boolean).join(" · ");
      question.append(q,meta);

      const state=document.createElement("div");
      state.className="companion-review-state";
      const mode=document.createElement("span");
      mode.className="companion-chip"+(row.handling_mode==="block_and_escalate"?" warn":"");
      mode.textContent=title(row.handling_mode);
      const assigned=document.createElement("span");
      assigned.className="companion-chip";
      assigned.textContent=row.assigned_name||"Unassigned";
      state.append(mode,assigned);

      const actions=document.createElement("div");
      actions.className="companion-review-actions";
      const open=document.createElement("button");
      open.type="button";
      open.className="primary";
      open.textContent="Review";
      open.addEventListener("click",()=>openReview(row));
      actions.append(open);

      item.append(person,question,state,actions);
      list.append(item);
    });
  }

  async function loadReviews(){
    const {data,error}=await client.from("admin_companion_review_queue")
      .select("*")
      .order("created_at",{ascending:true});

    if(error){
      el("companion-review-list").innerHTML='<div class="empty-state">Coach Companion reviews could not be loaded. '+error.message+'</div>';
      return;
    }

    reviewRows=data||[];
    renderReviews();
  }

  async function loadReviewSources(requestId){
    const {data,error}=await client.from("coach_companion_request_sources")
      .select("rank,similarity,used_in_answer,coach_companion_knowledge_chunks:chunk_id(id,heading,content,coach_companion_knowledge_sources:source_id(id,title,source_type))")
      .eq("request_id",requestId)
      .order("rank");
    if(error)throw error;
    return data||[];
  }

  function renderReviewSources(rows){
    const list=el("companion-source-list");
    list.replaceChildren();

    if(!rows.length){
      const empty=document.createElement("div");
      empty.className="empty-state";
      empty.textContent="No approved knowledge source was attached to this review.";
      list.append(empty);
      return;
    }

    rows.forEach((row)=>{
      const chunk=row.coach_companion_knowledge_chunks||{};
      const source=chunk.coach_companion_knowledge_sources||{};
      const item=document.createElement("div");
      item.className="companion-source-item";
      const heading=document.createElement("strong");
      heading.textContent=source.title||"Approved ReVitalized Source";
      const meta=document.createElement("span");
      const similarity=Math.round(Number(row.similarity||0)*100);
      meta.textContent=[
        title(source.source_type||"source"),
        "Match "+similarity+"%",
        "Rank "+row.rank
      ].join(" · ");
      item.append(heading,meta);
      if(chunk.heading){
        const h=document.createElement("span");
        h.textContent=chunk.heading;
        item.append(h);
      }
      const p=document.createElement("p");
      p.textContent=chunk.content||"";
      item.append(p);
      list.append(item);
    });
  }

  async function openReview(row){
    activeReview=row;
    el("companion-review-title").textContent="Review "+personName(row)+"’s question";
    el("companion-question-type").textContent=row.question_type_label||title(row.question_type);
    el("companion-question-text").textContent=row.question;
    el("companion-review-reason").textContent=row.review_reason||row.escalation_reason||"Human review required.";
    el("companion-confidence").textContent=row.retrieval_confidence!==null&&row.retrieval_confidence!==undefined
      ? Math.round(Number(row.retrieval_confidence)*100)+"% retrieval"
      : "No retrieval";
    el("companion-response").value=row.draft_answer||"";
    el("companion-resolution-type").value="coach_answered";
    el("companion-send-member").checked=true;
    setStatus("companion-review-status","Loading approved sources...");

    el("companion-review-modal").classList.remove("hidden");
    el("companion-review-modal").setAttribute("aria-hidden","false");

    try{
      const sources=await loadReviewSources(row.request_id);
      renderReviewSources(sources);
      setStatus("companion-review-status","");
    }catch(error){
      renderReviewSources([]);
      setStatus("companion-review-status",error.message||"Sources could not be loaded.","error");
    }
  }

  async function claimReview(){
    if(!activeReview)return;
    setStatus("companion-review-status","Claiming review...");
    const {data,error}=await client.functions.invoke("coach-companion-review",{
      body:{action:"claim",review_id:activeReview.review_id}
    });
    if(error||!data?.ok){
      setStatus("companion-review-status",error?.message||data?.error||"Review could not be claimed.","error");
      return;
    }
    setStatus("companion-review-status","Review assigned to you.","success");
    await loadReviews();
    activeReview=reviewRows.find((row)=>row.review_id===activeReview.review_id)||activeReview;
  }

  async function resolveReview(event){
    event.preventDefault();
    if(!activeReview)return;

    const response=el("companion-response").value.trim();
    if(!response){
      setStatus("companion-review-status","Enter the coach response before resolving.","error");
      return;
    }

    setStatus("companion-review-status","Resolving review...");
    const {data,error}=await client.functions.invoke("coach-companion-review",{
      body:{
        action:"resolve",
        review_id:activeReview.review_id,
        response,
        resolution_type:el("companion-resolution-type").value,
        send_to_member:el("companion-send-member").checked
      }
    });

    if(error||!data?.ok){
      setStatus("companion-review-status",error?.message||data?.error||"Review could not be resolved.","error");
      return;
    }

    setStatus(
      "companion-review-status",
      data.sent_to_member?"Review resolved and response sent to the member.":"Review resolved.",
      "success"
    );
    await Promise.all([loadReviews(),portal.loadDashboard()]);
    window.setTimeout(closeReview,650);
  }

  async function loadKnowledge(){
    const {data,error}=await client.from("coach_companion_knowledge_sources")
      .select("id,source_key,title,source_type,version,status,approved_at,updated_at,content_text")
      .order("updated_at",{ascending:false});
    if(error)throw error;
    knowledgeRows=data||[];
    renderKnowledge();
  }

  function renderKnowledge(){
    const list=el("companion-knowledge-list");
    list.replaceChildren();

    if(!knowledgeRows.length){
      const empty=document.createElement("div");
      empty.className="empty-state";
      empty.textContent="No ReVitalized Coach Companion knowledge sources have been added yet.";
      list.append(empty);
      return;
    }

    knowledgeRows.forEach((row)=>{
      const item=document.createElement("div");
      item.className="companion-knowledge-item";
      const heading=document.createElement("strong");
      heading.textContent=row.title;
      const meta=document.createElement("span");
      meta.textContent=[
        title(row.source_type),
        "v"+row.version,
        title(row.status),
        row.approved_at?"Approved "+portal.formatDate(row.approved_at,true):""
      ].filter(Boolean).join(" · ");
      item.append(heading,meta);

      const preview=document.createElement("p");
      preview.textContent=(row.content_text||"").slice(0,260)+(String(row.content_text||"").length>260?"…":"");
      item.append(preview);

      const actions=document.createElement("div");
      actions.className="companion-knowledge-actions";
      const edit=document.createElement("button");
      edit.type="button";
      edit.textContent="Edit";
      edit.addEventListener("click",()=>editSource(row));
      const embed=document.createElement("button");
      embed.type="button";
      embed.className="primary";
      embed.textContent=row.status==="approved"?"Re-Embed":"Approve & Embed";
      embed.addEventListener("click",()=>approveExisting(row));
      actions.append(edit,embed);
      item.append(actions);
      list.append(item);
    });
  }

  function resetKnowledgeForm(){
    activeSource=null;
    el("companion-source-key").value="";
    el("companion-source-title").value="";
    el("companion-source-type").value="course";
    el("companion-source-version").value="1.0";
    el("companion-source-content").value="";
    setStatus("companion-knowledge-status","");
  }

  function editSource(row){
    activeSource=row;
    el("companion-source-key").value=row.source_key||"";
    el("companion-source-title").value=row.title||"";
    el("companion-source-type").value=row.source_type||"other";
    el("companion-source-version").value=row.version||"1.0";
    el("companion-source-content").value=row.content_text||"";
    el("companion-source-content").focus();
  }

  async function saveSource(statusValue){
    const sourceKey=el("companion-source-key").value.trim();
    const titleValue=el("companion-source-title").value.trim();
    const content=el("companion-source-content").value.trim();
    if(!sourceKey||!titleValue||!content){
      setStatus("companion-knowledge-status","Source key, title and approved content are required.","error");
      return null;
    }

    setStatus("companion-knowledge-status",statusValue==="draft"?"Saving draft...":"Saving source...");
    const {data,error}=await client.functions.invoke("coach-companion-knowledge",{
      body:{
        action:"upsert_source",
        source_key:sourceKey,
        title:titleValue,
        source_type:el("companion-source-type").value,
        version:el("companion-source-version").value.trim()||"1.0",
        content_text:content,
        status:statusValue
      }
    });

    if(error||!data?.ok){
      setStatus("companion-knowledge-status",error?.message||data?.error||"Knowledge source could not be saved.","error");
      return null;
    }

    activeSource=data.source;
    return data.source;
  }

  async function approveAndEmbed(){
    const source=await saveSource("draft");
    if(!source)return;

    setStatus("companion-knowledge-status","Approving and creating semantic embeddings...");
    const {data,error}=await client.functions.invoke("coach-companion-knowledge",{
      body:{action:"approve_and_embed",source_id:source.id}
    });

    if(error||!data?.ok){
      setStatus("companion-knowledge-status",error?.message||data?.error||"Knowledge source could not be embedded.","error");
      return;
    }

    setStatus("companion-knowledge-status","Approved and embedded "+data.chunks+" knowledge chunk"+(data.chunks===1?"":"s")+".","success");
    await loadKnowledge();
  }

  async function approveExisting(row){
    setStatus("companion-knowledge-status","Embedding "+row.title+"...");
    const {data,error}=await client.functions.invoke("coach-companion-knowledge",{
      body:{
        action:row.status==="approved"?"embed_source":"approve_and_embed",
        source_id:row.id
      }
    });
    if(error||!data?.ok){
      setStatus("companion-knowledge-status",error?.message||data?.error||"Knowledge source could not be embedded.","error");
      return;
    }
    setStatus("companion-knowledge-status","Knowledge source ready for Coach Companion retrieval.","success");
    await loadKnowledge();
  }

  async function openKnowledge(){
    resetKnowledgeForm();
    el("companion-knowledge-modal").classList.remove("hidden");
    el("companion-knowledge-modal").setAttribute("aria-hidden","false");
    try{await loadKnowledge();}catch(error){
      setStatus("companion-knowledge-status",error.message||"Knowledge sources could not be loaded.","error");
    }
  }

  el("companion-manage-knowledge").addEventListener("click",openKnowledge);
  el("companion-review-form").addEventListener("submit",resolveReview);
  el("companion-claim-review").addEventListener("click",claimReview);
  el("companion-save-draft").addEventListener("click",async()=>{
    const source=await saveSource("draft");
    if(source){
      setStatus("companion-knowledge-status","Draft saved.","success");
      await loadKnowledge();
    }
  });
  el("companion-approve-embed").addEventListener("click",approveAndEmbed);

  document.querySelectorAll("[data-companion-review-close]").forEach((node)=>node.addEventListener("click",closeReview));
  document.querySelectorAll("[data-companion-knowledge-close]").forEach((node)=>node.addEventListener("click",closeKnowledge));

  document.addEventListener("ra:dashboard-loaded",loadReviews);
  window.setTimeout(loadReviews,850);

  document.addEventListener("keydown",(event)=>{
    if(event.key!=="Escape")return;
    if(!el("companion-review-modal").classList.contains("hidden"))closeReview();
    if(!el("companion-knowledge-modal").classList.contains("hidden"))closeKnowledge();
  });
})();