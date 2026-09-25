(() => {
  "use strict";

  const portal=window.RA_PORTAL;
  if(!portal)return;

  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);
  let submitting=false;

  function closeModal(){
    el("people-modal").classList.add("hidden");
    el("people-modal").setAttribute("aria-hidden","true");
    portal.showStatus(el("people-form-status"),"");
  }

  async function openModal(){
    populateStaff();
    await populateReferrers();
    syncReferralField();
    el("people-modal").classList.remove("hidden");
    el("people-modal").setAttribute("aria-hidden","false");
    portal.showStatus(el("people-form-status"),"");
    window.setTimeout(()=>el("people-first-name").focus(),30);
  }


  async function populateReferrers(){
    const select=el("people-referrer");
    select.replaceChildren();
    const blank=document.createElement("option");
    blank.value="";
    blank.textContent="Unknown / not in ReVitalized";
    select.append(blank);

    const {data,error}=await client.from("contacts")
      .select("id,first_name,last_name,email")
      .not("email","is",null)
      .order("first_name")
      .limit(500);

    if(error)return;

    (data||[]).forEach((row)=>{
      const option=document.createElement("option");
      option.value=row.id;
      option.textContent=[
        [row.first_name,row.last_name].filter(Boolean).join(" ")||row.email,
        row.email
      ].filter(Boolean).join(" · ");
      select.append(option);
    });
  }

  function syncReferralField(){
    const referral=el("people-source").value==="manual_referral";
    el("people-referrer-field").classList.toggle("hidden",!referral);
    if(!referral)el("people-referrer").value="";
  }

  function populateStaff(){
    const select=el("people-assigned-to");
    select.replaceChildren();
    const blank=document.createElement("option");
    blank.value="";
    blank.textContent="Unassigned";
    select.append(blank);

    portal.staffDirectory().forEach((staff)=>{
      const option=document.createElement("option");
      option.value=staff.user_id;
      option.textContent=staff.display_name+" · "+portal.titleCase(staff.role);
      select.append(option);
    });
  }

  function normalizedPhone(value){
    return String(value||"").replace(/\D/g,"");
  }

  async function findExisting(email,phone){
    if(email){
      const {data,error}=await client.from("contacts")
        .select("id,first_name,last_name,email,phone")
        .ilike("email",email)
        .limit(1)
        .maybeSingle();
      if(error)throw error;
      if(data)return data;
    }

    if(phone){
      const digits=normalizedPhone(phone);
      if(digits){
        const {data,error}=await client.from("contacts")
          .select("id,first_name,last_name,email,phone")
          .not("phone","is",null)
          .limit(500);
        if(error)throw error;
        const match=(data||[]).find((row)=>normalizedPhone(row.phone)===digits);
        if(match)return match;
      }
    }

    return null;
  }

  async function createPerson(event){
    event.preventDefault();
    if(submitting)return;

    const first=el("people-first-name").value.trim();
    const last=el("people-last-name").value.trim();
    const email=el("people-email").value.trim().toLowerCase();
    const phone=el("people-phone").value.trim();

    if(!first||!last){
      portal.showStatus(el("people-form-status"),"First and last name are required.","error");
      return;
    }
    if(!email&&!phone){
      portal.showStatus(el("people-form-status"),"Add an email address or phone number so this person can be identified and contacted.","error");
      return;
    }

    submitting=true;
    portal.showStatus(el("people-form-status"),"Checking for an existing person...");

    try{
      const existing=await findExisting(email,phone);
      if(existing){
        portal.showStatus(
          el("people-form-status"),
          "This person already exists in ReVitalized. Opening the existing record instead of creating a duplicate.",
          "success"
        );
        window.setTimeout(async()=>{
          closeModal();
          await portal.openContact(existing.id);
        },500);
        return;
      }

      const source=el("people-source").value||"manual_staff_entry";
      const followUp=el("people-follow-up").value
        ? new Date(el("people-follow-up").value).toISOString()
        : null;

      portal.showStatus(el("people-form-status"),"Adding person...");

      const {data:contact,error:contactError}=await client.from("contacts").insert({
        first_name:first,
        last_name:last,
        email:email||null,
        phone:phone||null,
        city:el("people-city").value.trim()||null,
        state:el("people-state").value.trim()||null,
        country:el("people-country").value||null,
        lifecycle_stage:el("people-stage").value,
        first_source:source,
        last_source:source,
        follow_up_status:"new",
        consultation_status:"not_scheduled",
        assigned_to:el("people-assigned-to").value||null,
        next_follow_up_at:followUp
      }).select("id").single();

      if(contactError)throw contactError;

      const contactId=contact.id;
      const note=el("people-note").value.trim();
      const tags=el("people-tags").value
        .split(",")
        .map((tag)=>tag.trim().toLowerCase())
        .filter(Boolean)
        .filter((tag,index,array)=>array.indexOf(tag)===index);

      if(note){
        const {error}=await client.from("contact_notes").insert({
          contact_id:contactId,
          note,
          author_user_id:portal.currentUserId()
        });
        if(error)throw error;
      }

      if(tags.length){
        const {error}=await client.from("contact_tags").upsert(
          tags.map((tag)=>({
            contact_id:contactId,
            tag,
            source:"manual",
            rule_key:"manual-entry",
            updated_at:new Date().toISOString()
          })),
          {onConflict:"contact_id,tag"}
        );
        if(error)throw error;
      }

      const referrerContactId=el("people-referrer").value||null;
      if(source==="manual_referral"&&referrerContactId){
        const {data:profile}=await client.from("referral_profiles")
          .select("referral_code").eq("contact_id",referrerContactId).maybeSingle();

        const {error:referralError}=await client.from("referrals").insert({
          referrer_contact_id:referrerContactId,
          referred_contact_id:contactId,
          referral_code:profile?.referral_code||null,
          source_channel:"staff_manual",
          status:"referred",
          notes:note||null
        });
        if(referralError)throw referralError;
      }

      await portal.logActivity(
        contactId,
        "manual_contact_created",
        "Contact added manually",
        "Added from the ReVitalized People workspace.",
        {source,tags,referrer_contact_id:referrerContactId}
      );

      const journeyKey=el("people-journey").value;
      if(journeyKey){
        const {error}=await client.rpc("ensure_contact_journey",{
          p_contact_id:contactId,
          p_journey_key:journeyKey,
          p_metadata:{source:"manual_staff_entry"}
        });
        if(error)throw error;
      }

      portal.showStatus(el("people-form-status"),"Person added to ReVitalized.","success");
      event.currentTarget.reset();
      el("people-stage").value="lead";
      el("people-source").value="manual_referral";
      el("people-country").value="";
      el("people-journey").value="";

      await portal.loadDashboard();

      window.setTimeout(async()=>{
        closeModal();
        await portal.openContact(contactId);
      },450);
    }catch(error){
      portal.showStatus(
        el("people-form-status"),
        error?.message||"This person could not be added.",
        "error"
      );
    }finally{
      submitting=false;
    }
  }

  function filterPeople(){
    const query=el("people-search-input").value.trim().toLowerCase();
    document.querySelectorAll("#contacts-body tr").forEach((row)=>{
      if(row.querySelector(".empty-state"))return;
      const visible=!query||row.textContent.toLowerCase().includes(query);
      row.style.display=visible?"":"none";
    });
  }

  el("people-add-button").addEventListener("click",openModal);
  el("people-source").addEventListener("change",syncReferralField);
  el("people-add-form").addEventListener("submit",createPerson);

  document.querySelectorAll("[data-people-close]").forEach((node)=>node.addEventListener("click",closeModal));

  document.addEventListener("keydown",(event)=>{
    if(event.key==="Escape"&&!el("people-modal").classList.contains("hidden"))closeModal();
  });

  // Full People Directory search and filtering are handled by portal-people-directory.js.
})();