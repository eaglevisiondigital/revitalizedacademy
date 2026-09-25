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
  let savedViews=[];
  let importRows=[];
  let importFilename="";

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
    if(!(portal.hasPermission?.("people.export")??false)){
      window.alert("You do not have permission to export the People database.");
      return;
    }
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
    const {error:auditError}=await client.rpc("log_people_export",{
      p_row_count:rows.length,
      p_filters:currentConfiguration()
    });
    if(auditError){window.alert("Export was blocked because the audit record could not be created: "+auditError.message);return;}

    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="revitalized-people-"+new Date().toISOString().slice(0,10)+".csv";
    a.click();URL.revokeObjectURL(url);
  }



  function closeImport(){
    importRows=[];
    importFilename="";
    el("people-import-form").reset();
    el("people-import-preview").classList.add("hidden");
    el("people-import-preview").replaceChildren();
    el("people-import-submit").disabled=true;
    portal.showStatus(el("people-import-status"),"");
    el("people-import-modal").classList.add("hidden");
    el("people-import-modal").setAttribute("aria-hidden","true");
  }

  function openImport(){
    if(!(portal.hasPermission?.("people.import")??false))return;
    closeImport();
    el("people-import-modal").classList.remove("hidden");
    el("people-import-modal").setAttribute("aria-hidden","false");
  }

  function csvParse(text){
    const rows=[];let row=[];let field="";let quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(quoted){
        if(ch==='"'&&text[i+1]==='"'){field+='"';i++;}
        else if(ch==='"')quoted=false;
        else field+=ch;
      }else{
        if(ch==='"')quoted=true;
        else if(ch===","){row.push(field);field="";}
        else if(ch==="\n"){row.push(field.replace(/\r$/,""));rows.push(row);row=[];field="";}
        else field+=ch;
      }
    }
    if(field.length||row.length){row.push(field.replace(/\r$/,""));rows.push(row);}
    return rows;
  }

  function normalizeHeader(value){
    return String(value||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
  }

  function previewImport(file,text){
    const parsed=csvParse(text).filter(row=>row.some(cell=>String(cell).trim()!==""));
    if(parsed.length<2){portal.showStatus(el("people-import-status"),"The CSV needs a header row and at least one data row.","error");return;}

    const headers=parsed[0].map(normalizeHeader);
    const aliases={
      firstname:"first_name",first:"first_name",
      lastname:"last_name",last:"last_name",
      email_address:"email",emailaddress:"email",
      phone_number:"phone",phonenumber:"phone",
      province:"state",state_province:"state",
      stage:"lifecycle_stage",lifecycle:"lifecycle_stage",
      lead_source:"source",interests:"tags"
    };
    const normalized=headers.map(h=>aliases[h]||h);
    const supported=new Set(["first_name","last_name","email","phone","city","state","country","lifecycle_stage","source","tags"]);

    importRows=parsed.slice(1).map(cells=>{
      const item={};
      normalized.forEach((header,index)=>{
        if(!supported.has(header))return;
        const value=String(cells[index]??"").trim();
        if(header==="tags")item.tags=value.split(/[;,]/).map(v=>v.trim()).filter(Boolean);
        else item[header]=value;
      });
      return item;
    }).filter(row=>Object.values(row).some(v=>Array.isArray(v)?v.length:Boolean(v)));

    if(importRows.length>5000){
      portal.showStatus(el("people-import-status"),"This file has more than 5,000 data rows. Split it into smaller imports.","error");
      importRows=[];return;
    }

    importFilename=file.name;
    const preview=el("people-import-preview");
    preview.replaceChildren();
    const table=document.createElement("table");
    const thead=document.createElement("thead");
    const hr=document.createElement("tr");
    ["First","Last","Email","Phone","Stage","Source","Tags"].forEach(label=>{const th=document.createElement("th");th.textContent=label;hr.append(th);});
    thead.append(hr);table.append(thead);
    const tbody=document.createElement("tbody");
    importRows.slice(0,10).forEach(row=>{
      const tr=document.createElement("tr");
      [row.first_name,row.last_name,row.email,row.phone,row.lifecycle_stage||"lead",row.source||"csv_import",(row.tags||[]).join(", ")].forEach(value=>{
        const td=document.createElement("td");td.textContent=value||"";tr.append(td);
      });
      tbody.append(tr);
    });
    table.append(tbody);preview.append(table);
    preview.classList.remove("hidden");
    el("people-import-submit").disabled=!importRows.length;
    portal.showStatus(el("people-import-status"),importRows.length+" row"+(importRows.length===1?"":"s")+" ready to import. Showing the first "+Math.min(10,importRows.length)+" for review.","success");
  }

  async function handleImportFile(event){
    const file=event.target.files?.[0];
    if(!file)return;
    if(file.size>10*1024*1024){portal.showStatus(el("people-import-status"),"CSV file must be 10 MB or smaller.","error");return;}
    const text=await file.text();
    previewImport(file,text);
  }

  async function submitImport(event){
    event.preventDefault();
    if(!importRows.length)return;
    if(!(portal.hasPermission?.("people.import")??false))return;
    if(!window.confirm("Import "+importRows.length+" People rows now? Existing matching email/phone records will be updated rather than duplicated."))return;

    el("people-import-submit").disabled=true;
    portal.showStatus(el("people-import-status"),"Importing People...");

    const {data,error}=await client.rpc("import_people_batch",{
      p_rows:importRows,
      p_filename:importFilename||null
    });
    if(error){
      el("people-import-submit").disabled=false;
      portal.showStatus(el("people-import-status"),error.message,"error");
      return;
    }

    const result=data||{};
    portal.showStatus(el("people-import-status"),
      "Import complete: "+(result.created_rows||0)+" created, "+(result.updated_rows||0)+" updated, "+(result.error_rows||0)+" errors.",
      result.error_rows?"error":"success"
    );
    await Promise.all([load(),portal.loadDashboard()]);
    if(!result.error_rows)window.setTimeout(closeImport,900);
  }

  function downloadImportTemplate(){
    const csv=[
      "first_name,last_name,email,phone,city,state,country,lifecycle_stage,source,tags",
      "Jane,Doe,jane@example.com,+1 555 555 1212,Toronto,Ontario,Canada,lead,referral,\"low energy,coaching interest\""
    ].join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="revitalized-people-import-template.csv";a.click();URL.revokeObjectURL(url);
  }

  function applyDataPermissions(){
    const canExport=portal.hasPermission?.("people.export")??false;
    const canImport=portal.hasPermission?.("people.import")??false;
    el("people-export").classList.toggle("hidden",!canExport);
    el("people-import").classList.toggle("hidden",!canImport);
  }

  function currentConfiguration(){
    return {
      mode,
      quickView,
      search:el("people-search-input").value.trim(),
      sort:el("people-sort").value,
      type:el("people-type-filter").value,
      stage:el("people-stage-filter").value,
      assigned:el("people-assigned-filter").value,
      source:el("people-source-filter").value,
      assessment:el("people-assessment-filter").value,
      enrollment:el("people-enrollment-filter").value
    };
  }

  function applyConfiguration(config){
    mode=config.mode||"all";
    quickView=config.quickView||"all";
    el("people-search-input").value=config.search||"";
    el("people-sort").value=config.sort||"recent";
    el("people-type-filter").value=config.type||"";
    el("people-stage-filter").value=config.stage||"";
    el("people-assigned-filter").value=config.assigned||"";
    el("people-source-filter").value=config.source||"";
    el("people-assessment-filter").value=config.assessment||"";
    el("people-enrollment-filter").value=config.enrollment||"";
    el("people-view-recent").classList.toggle("active",mode==="recent");
    el("people-view-all").classList.toggle("active",mode==="all");
    document.querySelectorAll("[data-people-quick]").forEach((b)=>b.classList.toggle("active",b.dataset.peopleQuick===quickView));
    page=0;load();
  }

  async function loadSavedViews(){
    const {data,error}=await client.from("people_saved_views").select("*").order("name");
    if(error)return;
    savedViews=data||[];
    const select=el("people-saved-view");
    select.innerHTML='<option value="">Choose saved view...</option>';
    savedViews.forEach((row)=>{
      const option=document.createElement("option");
      option.value=row.id;
      option.textContent=row.name+(row.shared?" · Shared":"");
      select.append(option);
    });
    el("people-delete-view").disabled=!select.value;
  }

  async function saveCurrentView(){
    const name=window.prompt("Name this People view:","");
    if(!name?.trim())return;
    const shared=window.confirm("Share this saved view with other authorized staff?");
    const {error}=await client.from("people_saved_views").upsert({
      name:name.trim(),
      owner_user_id:portal.currentUserId(),
      shared,
      configuration:currentConfiguration(),
      updated_at:new Date().toISOString()
    },{onConflict:"owner_user_id,name"});
    if(error){window.alert(error.message);return;}
    await loadSavedViews();
  }

  async function deleteSavedView(){
    const id=el("people-saved-view").value;
    if(!id)return;
    if(!window.confirm("Delete this saved People view?"))return;
    const {error}=await client.from("people_saved_views").delete().eq("id",id);
    if(error){window.alert(error.message);return;}
    await loadSavedViews();
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
  el("people-import").addEventListener("click",openImport);
  el("people-import-file").addEventListener("change",handleImportFile);
  el("people-import-form").addEventListener("submit",submitImport);
  el("people-download-template").addEventListener("click",downloadImportTemplate);
  document.querySelectorAll("[data-people-import-close]").forEach(n=>n.addEventListener("click",closeImport));
  document.addEventListener("ra:permissions-loaded",applyDataPermissions);
  populateBulkValue();

  el("people-save-view").addEventListener("click",saveCurrentView);
  el("people-delete-view").addEventListener("click",deleteSavedView);
  el("people-saved-view").addEventListener("change",(event)=>{
    const row=savedViews.find((v)=>v.id===event.target.value);
    el("people-delete-view").disabled=!row;
    if(row)applyConfiguration(row.configuration||{});
  });

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

  applyDataPermissions();
  populateFilters().then(async()=>{
    await loadSavedViews();
    await load();
  });
})();