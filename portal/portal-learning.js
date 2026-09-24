(() => {
  "use strict";

  const portal = window.RA_PORTAL;
  if (!portal) return;

  const client = portal.authClient;
  const el = (id) => document.getElementById(id);

  let contact = null;
  let access = null;
  let membership = null;
  let summary = null;
  let enrollments = [];
  let assignments = [];
  let courses = [];
  let resources = [];

  function setStatus(id,message,type=""){
    const target=el(id);
    if(!target)return;
    target.textContent=message||"";
    target.className="form-status"+(type?" "+type:"");
  }

  function closeModal(){
    el("learning-modal").classList.add("hidden");
    el("learning-modal").setAttribute("aria-hidden","true");
  }

  function empty(message){
    const div=document.createElement("div");
    div.className="learning-empty";
    div.textContent=message;
    return div;
  }

  async function loadLearning(contactId,contactRecord=contact){
    contact=contactRecord||contact;
    if(!contactId)return;

    const [accessResult,summaryResult]=await Promise.all([
      client.from("client_access").select("*").eq("contact_id",contactId).maybeSingle(),
      client.from("admin_client_learning_summary").select("*").eq("contact_id",contactId).maybeSingle()
    ]);

    if(accessResult.error)throw accessResult.error;
    if(summaryResult.error)throw summaryResult.error;

    access=accessResult.data||null;
    summary=summaryResult.data||null;
    membership=null;enrollments=[];assignments=[];courses=[];resources=[];

    if(!access?.membership_id){
      renderSummary();
      return;
    }

    const [membershipResult,enrollmentResult,assignmentResult,courseResult,resourceResult]=await Promise.all([
      client.from("client_memberships").select("*").eq("id",access.membership_id).maybeSingle(),
      client.from("admin_client_learning_detail").select("*").eq("contact_id",contactId).order("course_title"),
      client.from("client_resource_assignments").select("*,resource_library:resource_id(title,description,resource_type,category,status)").eq("contact_id",contactId).order("assigned_at",{ascending:false}),
      client.from("learning_courses").select("id,title,description,status,estimated_minutes").eq("status","published").order("title"),
      client.from("resource_library").select("id,title,description,resource_type,category,status").eq("status","published").order("title")
    ]);

    const failed=[membershipResult,enrollmentResult,assignmentResult,courseResult,resourceResult].find((r)=>r.error);
    if(failed?.error)throw failed.error;

    membership=membershipResult.data||null;
    enrollments=enrollmentResult.data||[];
    assignments=assignmentResult.data||[];
    courses=courseResult.data||[];
    resources=resourceResult.data||[];

    renderSummary();
  }

  function renderSummary(){
    const section=el("client-learning-section");
    if(!access||!membership){
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    const active=Number(summary?.active_courses||0);
    const completed=Number(summary?.completed_courses||0);
    const avg=summary?.average_course_progress===null||summary?.average_course_progress===undefined?0:Number(summary.average_course_progress);
    const assigned=Number(summary?.assigned_resources||0);

    el("client-learning-chip").textContent=active+" Active";
    el("client-active-courses").textContent=String(active);
    el("client-completed-courses").textContent=String(completed);
    el("client-course-progress").textContent=Math.round(avg)+"%";
    el("client-assigned-resources").textContent=String(assigned);
    setStatus("client-learning-status","");
  }

  function populateSelects(){
    const courseSelect=el("learning-course-select");
    courseSelect.replaceChildren();
    const existingCourseIds=new Set(enrollments.filter((e)=>e.enrollment_status!=="cancelled").map((e)=>e.course_id));
    const availableCourses=courses.filter((course)=>!existingCourseIds.has(course.id));

    const blank=document.createElement("option");
    blank.value="";
    blank.textContent=availableCourses.length?"Select published course":"No additional published courses available";
    courseSelect.append(blank);
    availableCourses.forEach((course)=>{
      const option=document.createElement("option");
      option.value=course.id;
      option.textContent=course.title;
      courseSelect.append(option);
    });
    courseSelect.disabled=!availableCourses.length;

    const resourceSelect=el("learning-resource-select");
    resourceSelect.replaceChildren();
    const existingResourceIds=new Set(assignments.filter((a)=>a.status!=="cancelled").map((a)=>a.resource_id));
    const availableResources=resources.filter((resource)=>!existingResourceIds.has(resource.id));

    const resourceBlank=document.createElement("option");
    resourceBlank.value="";
    resourceBlank.textContent=availableResources.length?"Select published resource":"No additional published resources available";
    resourceSelect.append(resourceBlank);
    availableResources.forEach((resource)=>{
      const option=document.createElement("option");
      option.value=resource.id;
      option.textContent=resource.title+" · "+portal.titleCase(resource.resource_type);
      resourceSelect.append(option);
    });
    resourceSelect.disabled=!availableResources.length;
  }

  function renderCourses(){
    const list=el("learning-course-list");
    list.replaceChildren();

    if(!enrollments.length){
      list.append(empty("No courses assigned yet."));
      return;
    }

    enrollments.forEach((row)=>{
      const item=document.createElement("div");
      item.className="learning-item";
      const top=document.createElement("div");
      top.className="learning-item-top";
      const heading=document.createElement("strong");
      heading.textContent=row.course_title;
      const state=document.createElement("span");
      state.textContent=Math.round(Number(row.progress_percent||0))+"%";
      top.append(heading,state);
      item.append(top);

      const progress=document.createElement("div");
      progress.className="learning-mini-progress";
      const bar=document.createElement("i");
      bar.style.width=Math.max(0,Math.min(100,Number(row.progress_percent||0)))+"%";
      progress.append(bar);
      item.append(progress);

      const meta=document.createElement("small");
      meta.textContent=[
        portal.titleCase(row.enrollment_status),
        row.required_lessons!==null?row.completed_lessons+" of "+row.required_lessons+" lessons complete":"",
        portal.titleCase(row.source)
      ].filter(Boolean).join(" · ");
      item.append(meta);
      list.append(item);
    });
  }

  function renderResources(){
    const list=el("learning-resource-list");
    list.replaceChildren();

    if(!assignments.length){
      list.append(empty("No individually assigned resources yet. Program-included resources are still available automatically in the member library."));
      return;
    }

    assignments.forEach((row)=>{
      const item=document.createElement("div");
      item.className="learning-item";
      const top=document.createElement("div");
      top.className="learning-item-top";
      const heading=document.createElement("strong");
      heading.textContent=row.resource_library?.title||"Resource";
      const state=document.createElement("span");
      state.textContent=portal.titleCase(row.status);
      top.append(heading,state);
      item.append(top);

      if(row.note){
        const p=document.createElement("p");
        p.textContent=row.note;
        item.append(p);
      }

      const meta=document.createElement("small");
      meta.textContent=[
        portal.titleCase(row.resource_library?.resource_type||"resource"),
        row.resource_library?.category||""
      ].filter(Boolean).join(" · ");
      item.append(meta);
      list.append(item);
    });
  }

  function renderModal(){
    populateSelects();
    renderCourses();
    renderResources();
    setStatus("learning-course-status","");
    setStatus("learning-resource-status","");
  }

  function openModal(){
    if(!membership)return;
    renderModal();
    el("learning-modal").classList.remove("hidden");
    el("learning-modal").setAttribute("aria-hidden","false");
  }

  async function refreshAll(){
    await loadLearning(contact.id,contact);
    renderModal();
    await portal.loadDashboard();
  }

  async function assignCourse(event){
    event.preventDefault();
    const courseId=el("learning-course-select").value;
    if(!courseId){
      setStatus("learning-course-status","Choose a published course.","error");
      return;
    }

    setStatus("learning-course-status","Assigning course...");
    const {error}=await client.from("client_course_enrollments").insert({
      contact_id:contact.id,
      membership_id:membership.id,
      course_id:courseId,
      source:"coach",
      status:"active",
      assigned_by:portal.currentUserId()
    });

    if(error){
      setStatus("learning-course-status",error.message,"error");
      return;
    }

    await portal.logActivity(contact.id,"course_assigned","Course assigned",courses.find((c)=>c.id===courseId)?.title||null,{course_id:courseId});
    setStatus("learning-course-status","Course assigned to Member Dashboard.","success");
    await refreshAll();
  }

  async function assignResource(event){
    event.preventDefault();
    const resourceId=el("learning-resource-select").value;
    if(!resourceId){
      setStatus("learning-resource-status","Choose a published resource.","error");
      return;
    }

    setStatus("learning-resource-status","Assigning resource...");
    const {error}=await client.from("client_resource_assignments").insert({
      contact_id:contact.id,
      membership_id:membership.id,
      resource_id:resourceId,
      assigned_by:portal.currentUserId(),
      note:el("learning-resource-note").value.trim()||null,
      status:"assigned"
    });

    if(error){
      setStatus("learning-resource-status",error.message,"error");
      return;
    }

    el("learning-resource-note").value="";
    await portal.logActivity(contact.id,"resource_assigned","Resource assigned",resources.find((r)=>r.id===resourceId)?.title||null,{resource_id:resourceId});
    setStatus("learning-resource-status","Resource assigned to Member Dashboard.","success");
    await refreshAll();
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    loadLearning(event.detail.contactId,event.detail.contact).catch((error)=>{
      console.error("Learning workspace load failed",error);
      setStatus("client-learning-status",error.message||"Learning data could not be loaded.","error");
    });
  });

  document.addEventListener("ra:contact-closed",()=>{
    contact=null;access=null;membership=null;summary=null;enrollments=[];assignments=[];courses=[];resources=[];
    el("client-learning-section").classList.add("hidden");
    closeModal();
  });

  el("client-manage-learning").addEventListener("click",openModal);
  el("learning-course-form").addEventListener("submit",assignCourse);
  el("learning-resource-form").addEventListener("submit",assignResource);
  document.querySelectorAll("[data-learning-close]").forEach((node)=>node.addEventListener("click",closeModal));
  document.addEventListener("keydown",(event)=>{
    if(event.key==="Escape"&&!el("learning-modal").classList.contains("hidden"))closeModal();
  });
})();