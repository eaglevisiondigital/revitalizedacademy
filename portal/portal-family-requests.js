(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  const panel=document.getElementById("family-requests-panel");
  const summary=document.getElementById("family-requests-summary");
  const list=document.getElementById("family-requests-list");
  const filter=document.getElementById("family-requests-filter");
  const refresh=document.getElementById("family-requests-refresh");
  if(!portal||!panel||!summary||!list)return;

  const client=portal.authClient;
  let rows=[];

  const titleCase=(v)=>portal.titleCase?portal.titleCase(v):String(v||"").replaceAll("_"," ");
  const fmt=(v)=>portal.formatDate?portal.formatDate(v,true):(v?new Date(v).toLocaleString():"Not set");

  function renderSummary(){
    const counts={
      submitted:rows.filter(r=>r.status==="submitted").length,
      review:rows.filter(r=>r.status==="in_review").length,
      approved:rows.filter(r=>r.status==="approved").length,
      completed:rows.filter(r=>r.status==="completed").length
    };
    summary.replaceChildren();
    [["New",counts.submitted],["In review",counts.review],["Approved",counts.approved],["Completed",counts.completed]].forEach(([label,value])=>{
      const card=document.createElement("div");card.className="family-request-stat";
      const l=document.createElement("span");l.textContent=label;
      const v=document.createElement("strong");v.textContent=String(value);
      card.append(l,v);summary.append(card);
    });
  }

  function badge(status){
    const el=document.createElement("span");
    el.className="family-request-badge"+(status==="submitted"||status==="in_review"?" warn":status==="completed"?" done":status==="declined"?" declined":"");
    el.textContent=titleCase(status);
    return el;
  }

  async function updateStatus(row,status){
    const note=status==="declined"?window.prompt("Optional note for the member:",""):null;
    const {data,error}=await client.rpc("review_family_change_request",{
      p_request_id:row.request_id,
      p_status:status,
      p_staff_notes:note||null
    });
    if(error){window.alert(error.message);return;}
    await load();
  }

  function render(){
    renderSummary();
    const selected=filter?.value||"open";
    const filtered=rows.filter(row=>{
      if(selected==="all")return true;
      if(selected==="open")return ["submitted","in_review","approved"].includes(row.status);
      return row.status===selected;
    });
    list.replaceChildren();
    if(!filtered.length){
      const empty=document.createElement("div");empty.className="family-request-empty";
      empty.textContent=selected==="open"?"No open Family Hub requests.":"No Family Hub requests match this filter.";
      list.append(empty);return;
    }

    filtered.forEach(row=>{
      const card=document.createElement("article");card.className="family-request-card";
      const person=document.createElement("div");person.className="family-request-person";
      const name=document.createElement("strong");name.textContent=row.member_name||row.member_email||"Member";
      const email=document.createElement("span");email.textContent=row.member_email||"";
      const badges=document.createElement("div");badges.className="family-request-badges";
      badges.append(badge(row.status));
      const type=document.createElement("span");type.className="family-request-badge";type.textContent=titleCase(row.request_type);
      badges.append(type);
      person.append(name,email,badges);

      const detail=document.createElement("div");detail.className="family-request-detail";
      const requested=document.createElement("strong");
      requested.textContent=[row.first_name,row.last_name].filter(Boolean).join(" ")||"Existing household member";
      const meta=document.createElement("span");
      meta.textContent=[
        row.relationship_type?titleCase(row.relationship_type):null,
        row.sex?titleCase(row.sex):null,
        row.date_of_birth?"DOB "+row.date_of_birth:null
      ].filter(Boolean).join(" · ")||"Household change";
      const created=document.createElement("span");created.textContent="Requested "+fmt(row.created_at);
      detail.append(requested,meta,created);
      if(row.notes){
        const note=document.createElement("span");note.textContent=row.notes;detail.append(note);
      }
      if(row.staff_notes){
        const staff=document.createElement("span");staff.textContent="Staff note: "+row.staff_notes;detail.append(staff);
      }

      const actions=document.createElement("div");actions.className="family-request-actions";
      if(row.status==="submitted"){
        const review=document.createElement("button");review.type="button";review.textContent="Start Review";
        review.addEventListener("click",()=>updateStatus(row,"in_review"));actions.append(review);
      }
      if(["submitted","in_review"].includes(row.status)){
        const approve=document.createElement("button");approve.type="button";approve.className="primary";approve.textContent="Approve";
        approve.addEventListener("click",()=>updateStatus(row,"approved"));actions.append(approve);
        const decline=document.createElement("button");decline.type="button";decline.className="warn";decline.textContent="Decline";
        decline.addEventListener("click",()=>updateStatus(row,"declined"));actions.append(decline);
      }
      if(row.status==="approved"){
        const complete=document.createElement("button");complete.type="button";complete.className="primary";complete.textContent="Mark Completed";
        complete.addEventListener("click",()=>updateStatus(row,"completed"));actions.append(complete);
      }

      card.append(person,detail,actions);
      list.append(card);
    });
  }

  async function load(){
    list.innerHTML='<div class="family-request-empty">Loading Family Hub requests...</div>';
    const {data,error}=await client.from("admin_family_requests").select("*");
    if(error){
      list.innerHTML='<div class="family-request-empty">Family Hub requests could not be loaded.</div>';
      summary.replaceChildren();
      return;
    }
    rows=data||[];
    render();
  }

  filter?.addEventListener("change",render);
  refresh?.addEventListener("click",load);
  document.addEventListener("ra:dashboard-loaded",load);
  load();
})();