(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  let activeContact=null;
  let documents=[];

  function setStatus(id,message,type=""){
    const target=el(id);if(!target)return;
    target.textContent=message||"";
    target.className="form-status"+(type?" "+type:"");
  }

  function safeFilename(name){
    return String(name||"file").replace(/[^A-Za-z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"file";
  }

  function canManageCategory(category){
    const p=portal.permissions?.()||{};
    if(category==="general")return Boolean(p["crm.manage"]);
    if(category==="coaching")return Boolean(p["coaching.manage"]);
    if(category==="health"||category==="progress")return Boolean(p["health.progress.manage"]);
    if(category==="financial"||category==="agreement")return Boolean(p["finance.manage"]);
    return false;
  }

  async function signedUrl(path){
    const {data,error}=await client.storage.from("client-documents").createSignedUrl(path,900);
    if(error||!data?.signedUrl)return null;
    return data.signedUrl;
  }

  function closeModal(){
    el("client-document-modal").classList.add("hidden");
    el("client-document-modal").setAttribute("aria-hidden","true");
    setStatus("client-document-form-status","");
  }

  function populateAllowedCategories(){
    const select=el("client-document-category");
    const current=select.value;
    [...select.options].forEach((o)=>o.disabled=!canManageCategory(o.value));
    const first=[...select.options].find((o)=>!o.disabled);
    if(!canManageCategory(current)&&first)select.value=first.value;
  }

  function openModal(){
    if(!activeContact)return;
    populateAllowedCategories();
    el("client-document-form").reset();
    populateAllowedCategories();
    el("client-document-visible").checked=true;
    el("client-document-modal").classList.remove("hidden");
    el("client-document-modal").setAttribute("aria-hidden","false");
  }

  function render(){
    const section=el("client-documents-section");
    if(!activeContact){
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    el("client-documents-chip").textContent=documents.length+" File"+(documents.length===1?"":"s");
    const list=el("client-documents-list");
    list.replaceChildren();

    if(!documents.length){
      list.innerHTML='<div class="drawer-empty">No authorized documents are visible for this client.</div>';
    }else{
      documents.forEach((row)=>{
        const item=document.createElement("div");
        item.className="client-document-item";

        const copy=document.createElement("div");
        copy.className="client-document-copy";
        const heading=document.createElement("strong");heading.textContent=row.title;
        const meta=document.createElement("span");meta.textContent=[row.original_filename,row.uploaded_by_name||"Member upload",portal.formatDate(row.created_at,true)].filter(Boolean).join(" · ");
        copy.append(heading,meta);

        const category=document.createElement("div");
        category.className="client-document-state";
        category.textContent=portal.titleCase(row.category);

        const visible=document.createElement("div");
        visible.className="client-document-state";
        visible.textContent=row.member_visible?"Member Visible":"Staff Only";

        const actions=document.createElement("div");
        actions.className="client-document-actions-row";
        const open=document.createElement("button");
        open.type="button";open.textContent="Open";
        open.addEventListener("click",async()=>{
          const url=await signedUrl(row.storage_path);
          if(url)window.open(url,"_blank","noopener");
        });
        actions.append(open);

        if(canManageCategory(row.category)){
          const archive=document.createElement("button");
          archive.type="button";archive.textContent="Archive";
          archive.addEventListener("click",()=>archiveDocument(row));
          actions.append(archive);
        }

        item.append(copy,category,visible,actions);
        list.append(item);
      });
    }

    const anyManage=["general","coaching","health","progress","financial","agreement"].some(canManageCategory);
    el("client-document-upload-button").disabled=!anyManage;
  }

  async function load(contactId){
    const {data,error}=await client.from("admin_client_documents")
      .select("*").eq("contact_id",contactId).order("created_at",{ascending:false});
    if(error){
      setStatus("client-documents-status",error.message,"error");
      documents=[];render();return;
    }
    documents=data||[];
    setStatus("client-documents-status","");
    render();
  }

  async function archiveDocument(row){
    if(!window.confirm("Archive this document? The file will no longer appear in the active vault."))return;
    const {error}=await client.from("client_documents").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",row.id);
    if(error){window.alert(error.message);return;}
    await load(activeContact.id);
  }

  async function uploadDocument(event){
    event.preventDefault();
    if(!activeContact)return;
    const file=el("client-document-file").files?.[0];
    if(!file)return;
    if(file.size>26214400){setStatus("client-document-form-status","File must be 25 MB or smaller.","error");return;}

    const category=el("client-document-category").value;
    if(!canManageCategory(category)){setStatus("client-document-form-status","You do not have permission to upload this document category.","error");return;}

    const id=crypto.randomUUID();
    const path=activeContact.id+"/"+id+"/"+safeFilename(file.name);

    setStatus("client-document-form-status","Preparing secure upload...");
    const {error:rowError}=await client.from("client_documents").insert({
      id,
      contact_id:activeContact.id,
      category,
      title:el("client-document-title").value.trim(),
      description:el("client-document-description").value.trim()||null,
      storage_path:path,
      original_filename:file.name,
      content_type:file.type||null,
      size_bytes:file.size,
      member_visible:el("client-document-visible").checked,
      uploaded_by_user_id:portal.currentUserId()
    });
    if(rowError){setStatus("client-document-form-status",rowError.message,"error");return;}

    const {error:uploadError}=await client.storage.from("client-documents").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
    if(uploadError){
      await client.from("client_documents").update({status:"archived"}).eq("id",id);
      setStatus("client-document-form-status",uploadError.message,"error");return;
    }

    await portal.logActivity(activeContact.id,"document_uploaded","Client document uploaded",el("client-document-title").value.trim(),{document_id:id,category});
    setStatus("client-document-form-status","Document uploaded securely.","success");
    await load(activeContact.id);
    window.setTimeout(closeModal,500);
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    activeContact=event.detail.contact;
    load(event.detail.contactId);
  });
  document.addEventListener("ra:contact-closed",()=>{
    activeContact=null;documents=[];el("client-documents-section").classList.add("hidden");closeModal();
  });
  document.addEventListener("ra:permissions-loaded",()=>{if(activeContact)render();});

  el("client-document-upload-button").addEventListener("click",openModal);
  el("client-document-form").addEventListener("submit",uploadDocument);
  document.querySelectorAll("[data-client-document-close]").forEach((n)=>n.addEventListener("click",closeModal));
})();