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
  let timer=null;
  let quickView="all";

  function dateText(value){
    return value?portal.formatDate(value,true):"—";
  }

  function render(rows){
    const body=el("contacts-body");
    body.replaceChildren();

    if(!rows.length){
      const tr=document.createElement("tr");
      const td=document.createElement("td");
      td.colSpan=9;
      td.className="empty-state";
      td.textContent="No people match this view.";
      tr.append(td); body.append(tr);
      return;
    }

    rows.forEach((row)=>{
      const tr=document.createElement("tr");

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

      tr.append(name,stage,assess,enroll,assigned,enrolled,activity,follow,created);
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

  el("people-view-recent").addEventListener("click",()=>setMode("recent"));
  el("people-view-all").addEventListener("click",()=>setMode("all"));
  el("people-prev").addEventListener("click",()=>{if(page>0){page--;load();}});
  el("people-next").addEventListener("click",()=>{if((page+1)*pageSize<total){page++;load();}});
  el("people-search-input").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>{page=0;load();},220);});

  ["people-sort","people-stage-filter","people-assigned-filter","people-source-filter","people-assessment-filter","people-enrollment-filter"]
    .forEach(id=>el(id).addEventListener("change",()=>{page=0;load();}));

  el("people-clear-filters").addEventListener("click",()=>{
    el("people-search-input").value="";
    el("people-sort").value="recent";
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