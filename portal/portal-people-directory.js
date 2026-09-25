(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let mode="recent";
  let page=0;
  const pageSize=100;
  let total=0;
  let currentRows=[];
  const selectedIds=new Set();
  let timer=null;
  let quickView="all";

  function dateText(value){
    return value?portal.formatDate(value,true):"—";
  }

  function render(rows){
    const body=el("contacts-body");
    body.replaceChildren();

    currentRows=rows||[];
    if(!rows.length){
      const tr=document.createElement("tr");
      const td=document.createElement("td");
      td.colSpan=10;
      td.className="empty-state";
      td.textContent="No people match this view.";
      tr.append(td); body.append(tr);
      return;
    }

    rows.forEach((row)=>{
      const tr=document.createElement("tr");

      const selectTd=document.createElement("td");
      selectTd.className="people-select-col";
      const checkbox=document.createElement("input");
      checkbox.type="checkbox";
      checkbox.className="people-row-select";
      checkbox.checked=selectedIds.has(row.id);
      checkbox.addEventListener("click",(event)=>event.stopPropagation());
      checkbox.addEventListener("change",()=>{
        if(checkbox.checked)selectedIds.add(row.id); else selectedIds.delete(row.id);
        updateBulkBar();
      });
      selectTd.append(checkbox);

      const name=document.createElement("td");
      const wrap=document.createElement("div");
      wrap.className="people-directory-name";
      const strong=document.createElement("strong");
      strong.textContent=portal.personName(row);
      const small=document.createElement("span");
      small.textContent=[row.email,row.phone].filter(Boolean).join(" · ");
      wrap.append(strong,small); name.append(wrap);

      const stage=document.createElement("td"); stage.append(portal.makeBadge?portal.makeBadge(row.lifecycle_stage):document.createTextNode(portal.titleCase(row.lifecycle_stage||"")));
      const assess=document.createElement("td"); assess.textContent=portal.titleCase(row.vitality_status||"not_started");
      const enroll=document.createElement("td"); enroll.textContent=portal.titleCase(row.enrollment_status||"not_started");
      const assigned=document.createElement("td"); assigned.textContent=row.assigned_name||"Unassigned";
      const enrolled=document.createElement("td"); enrolled.textContent=dateText(row.enrolled_at);
      const activity=document.createElement("td"); activity.textContent=dateText(row.last_activity_at);
      const follow=document.createElement("td"); follow.textContent=row.next_follow_up_at?dateText(row.next_follow_up_at):portal.titleCase(row.follow_up_status||"");
      const created=document.createElement("td"); created.textContent=dateText(row.created_at);

      tr.append(selectTd,name,stage,assess,enroll,assigned,enrolled,activity,follow,created);
      tr.addEventListener("click",()=>portal.openContact(row.id));
      body.append(tr);
    });
  }

  function applySort(q){
    const sort=el("people-sort").value;
    const map={
      recent:["created_at",false],
      oldest:["created_at",true],
      first_az:["first_name",true],
      first_za:["first_name",false],
      last_az:["last_name",true],
      last_za:["last_name",false],
      enrolled_recent:["enrolled_at",false],
      activity_recent:["last_activity_at",false],
      followup_soon:["next_follow_up_at",true]
    };
    const [col,asc]=map[sort]||map.recent;
    return q.order(col,{ascending:asc,nullsFirst:false});
  }

  async function load(){
    const search=el("people-search-input").value.trim();
    let q=client.from("admin_people_directory").select("*",{count:"exact"});

    if(search){
      const safe=search.replace(/[,%]/g," ").trim();
      q=q.or("first_name.ilike.%"+safe+"%,last_name.ilike.%"+safe+"%,email.ilike.%"+safe+"%,phone.ilike.%"+safe+"%");
    }

    const type=el("people-type-filter").value;
    if(type)q=q.eq("record_kind",type);

    const stage=el("people-stage-filter").value;
    if(stage)q=q.eq("lifecycle_stage",stage);

    if(quickView==="new_leads")q=q.in("lifecycle_stage",["lead","assessment_lead","webinar_lead"]).eq("follow_up_status","new");
    if(quickView==="unassigned")q=q.is("assigned_to",null);
    if(quickView==="needs_followup")q=q.eq("follow_up_status","needs_follow_up");
    if(quickView==="applicants")q=q.eq("lifecycle_stage","applicant");
    if(quickView==="clients")q=q.eq("lifecycle_stage","client");

    const assigned=el("people-assigned-filter").value;
    if(assigned==="unassigned")q=q.is("assigned_to",null);
    else if(assigned)q=q.eq("assigned_to",assigned);

    const source=el("people-source-filter").value;
    if(source)q=q.eq("first_source",source);

    const assessment=el("people-assessment-filter").value;
    if(assessment==="not_started")q=q.is("vitality_status",null);
    else if(assessment)q=q.eq("vitality_status",assessment);

    const enrollment=el("people-enrollment-filter").value;
    if(enrollment==="not_started")q=q.is("enrollment_status",null);
    else if(enrollment)q=q.eq("enrollment_status",enrollment);

    q=applySort(q);

    if(mode==="recent"){
      q=q.range(0,24);
    }else{
      q=q.range(page*pageSize,page*pageSize+pageSize-1);
    }

    const {data,error,count}=await q;
    if(error){
      el("people-result-count").textContent="People could not be loaded.";
      return;
    }
    total=count||0;
    render(data||[]);
    updateBulkBar();
    el("people-result-count").textContent=(mode==="recent"?"Showing recent people · ":"All people · ")+total+" total";
    el("people-page-label").textContent=mode==="recent"?"Recent 25":"Page "+(page+1);
    el("people-prev").disabled=mode==="recent"||page===0;
    el("people-next").disabled=mode==="recent"||(page+1)*pageSize>=total;
  }

  async function populateFilters(){
    const staff=portal.staffDirectory();
    const assigned=el("people-assigned-filter");
    staff.forEach((row)=>{
      const o=document.createElement("option");
      o.value=row.user_id;o.textContent=row.display_name;
      assigned.append(o);
    });

    const {data}=await client.from("admin_people_directory").select("first_source").not("first_source","is",null).limit(1000);
    const source=el("people-source-filter");
    [...new Set((data||[]).map(r=>r.first_source).filter(Boolean))].sort().forEach((v)=>{
      const o=document.createElement("option");o.value=v;o.textContent=portal.titleCase(v);source.append(o);
    });
  }


  function updateBulkBar(){
    el("people-selected-count").textContent=selectedIds.size+" selected";
    el("people-bulk-bar").classList.toggle("hidden",selectedIds.size===0);
    el("people-select-page").checked=currentRows.length>0&&currentRows.every((row)=>selectedIds.has(row.id));
  }

  function populateBulkValue(){
    const action=el("people-bulk-action").value;
    const select=el("people-bulk-value");
    select.replaceChildren();
    const add=(value,label)=>{const o=document.createElement("option");o.value=value;o.textContent=label;select.append(o);};

    if(action==="assign_staff"){
      add("","Unassigned");
      portal.staffDirectory().forEach((s)=>add(s.user_id,s.display_name));
    }else if(action==="set_stage"){
      [["lead","Lead"],["assessment_lead","Assessment Lead"],["webinar_lead","Webinar Lead"],["applicant","Applicant"],["client","Client"],["inactive","Inactive"]].forEach(([v,l])=>add(v,l));
    }else if(action==="set_followup_status"){
      [["new","New"],["needs_follow_up","Needs Follow-Up"],["contacted","Contacted"],["consultation_scheduled","Consultation Scheduled"],["consultation_completed","Consultation Completed"],["nurture","Nurture"],["not_ready","Not Ready"],["closed","Closed"]].forEach(([v,l])=>add(v,l));
    }else if(action==="add_tag"){
      const o=document.createElement("option");o.value="__custom__";o.textContent="Enter tag when applying";select.append(o);
    }else{
      add("","Select action first");
    }
  }

  async function applyBulk(){
    if(!selectedIds.size)return;
    const action=el("people-bulk-action").value;
    if(!action)return;

    let value=el("people-bulk-value").value;
    if(action==="add_tag"){
      value=window.prompt("Tag to add to "+selectedIds.size+" selected people:","")||"";
      if(!value.trim())return;
    }

    const reason=window.prompt("Optional internal reason/note for this bulk change:","")||null;
    const {data,error}=await client.rpc("bulk_update_people",{
      p_contact_ids:[...selectedIds],
      p_action:action,
      p_value:value,
      p_reason:reason
    });
    if(error){window.alert(error.message);return;}

    selectedIds.clear();
    updateBulkBar();
    await Promise.all([load(),portal.loadDashboard()]);
  }

  async function exportCsv(){
    let q=client.from("admin_people_directory").select("*");
    const search=el("people-search-input").value.trim();
    if(search){
      const safe=search.replace(/[,%]/g," ").trim();
      q=q.or("first_name.ilike.%"+safe+"%,last_name.ilike.%"+safe+"%,email.ilike.%"+safe+"%,phone.ilike.%"+safe+"%");
    }
    const stage=el("people-stage-filter").value;if(stage)q=q.eq("lifecycle_stage",stage);
    const assigned=el("people-assigned-filter").value;if(assigned==="unassigned")q=q.is("assigned_to",null);else if(assigned)q=q.eq("assigned_to",assigned);
    const source=el("people-source-filter").value;if(source)q=q.eq("first_source",source);
    q=applySort(q).limit(5000);

    const {data,error}=await q;
    if(error){window.alert(error.message);return;}

    const headers=["First Name","Last Name","Email","Phone","Stage","Assessment","Enrollment","Assigned","Source","Created","Enrolled","Last Activity","Follow-Up"];
    const rows=(data||[]).map((r)=>[
      r.first_name||"",r.last_name||"",r.email||"",r.phone||"",r.lifecycle_stage||"",
      r.vitality_status||"not_started",r.enrollment_status||"not_started",r.assigned_name||"",
      r.first_source||"",r.created_at||"",r.enrolled_at||"",r.last_activity_at||"",r.next_follow_up_at||""
    ]);
    const esc=(v)=>'"'+String(v).replace(/"/g,'""')+'"';
    const csv=[headers,...rows].map((row)=>row.map(esc).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="revitalized-people-"+new Date().toISOString().slice(0,10)+".csv";
    a.click();URL.revokeObjectURL(url);
  }

  function setMode(next){
    mode=next;page=0;
    el("people-view-recent").classList.toggle("active",mode==="recent");
    el("people-view-all").classList.toggle("active",mode==="all");
    load();
  }

  document.querySelectorAll("[data-people-quick]").forEach((button)=>{
    button.addEventListener("click",()=>{
      quickView=button.dataset.peopleQuick||"all";
      document.querySelectorAll("[data-people-quick]").forEach((b)=>b.classList.toggle("active",b===button));
      page=0;load();
    });
  });

  el("people-bulk-action").addEventListener("change",populateBulkValue);
  el("people-apply-bulk").addEventListener("click",applyBulk);
  el("people-clear-selection").addEventListener("click",()=>{selectedIds.clear();updateBulkBar();document.querySelectorAll(".people-row-select").forEach((c)=>c.checked=false);});
  el("people-select-page").addEventListener("change",(event)=>{
    currentRows.forEach((row)=>event.target.checked?selectedIds.add(row.id):selectedIds.delete(row.id));
    document.querySelectorAll(".people-row-select").forEach((c)=>c.checked=event.target.checked);
    updateBulkBar();
  });
  el("people-export").addEventListener("click",exportCsv);
  populateBulkValue();

  el("people-view-recent").addEventListener("click",()=>setMode("recent"));
  el("people-view-all").addEventListener("click",()=>setMode("all"));
  el("people-prev").addEventListener("click",()=>{if(page>0){page--;load();}});
  el("people-next").addEventListener("click",()=>{if((page+1)*pageSize<total){page++;load();}});
  el("people-search-input").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>{page=0;load();},220);});

  ["people-sort","people-type-filter","people-stage-filter","people-assigned-filter","people-source-filter","people-assessment-filter","people-enrollment-filter"]
    .forEach(id=>el(id).addEventListener("change",()=>{page=0;load();}));

  el("people-clear-filters").addEventListener("click",()=>{
    el("people-search-input").value="";
    el("people-sort").value="recent";
    el("people-type-filter").value="";
    el("people-stage-filter").value="";
    el("people-assigned-filter").value="";
    el("people-source-filter").value="";
    el("people-assessment-filter").value="";
    el("people-enrollment-filter").value="";
    quickView="all";
    document.querySelectorAll("[data-people-quick]").forEach((b)=>b.classList.toggle("active",b.dataset.peopleQuick==="all"));
    page=0;load();
  });

  document.addEventListener("ra:dashboard-loaded",load);

  populateFilters().then(load);
})();