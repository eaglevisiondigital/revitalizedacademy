(() => {
  "use strict";

  const qs=(s)=>document.querySelector(s);
  const byId=(id)=>document.getElementById(id);

  function titleCase(value){
    return String(value||"").replaceAll("_"," ").replace(/\b\w/g,(m)=>m.toUpperCase());
  }

  function setHidden(node,hidden){
    if(!node)return;
    node.classList.toggle("hidden",Boolean(hidden));
  }

  async function loadAccountDetails(){
    const client=window.RA_PORTAL?.authClient;
    if(!client) throw new Error("Account service is still loading.");

    const [{data:userData,error:userError},{data:accessData,error:accessError},{data:profileData,error:profileError}]=await Promise.all([
      client.auth.getUser(),
      client.rpc("get_my_staff_access"),
      client.from("staff_access").select("display_name,phone,role,status").maybeSingle()
    ]);
    if(userError) throw userError;
    if(accessError) throw accessError;
    if(profileError) throw profileError;
    const user=userData?.user;
    if(!user) throw new Error("Your signed-in account could not be loaded.");

    const access=Array.isArray(accessData)?accessData[0]:accessData;
    return {user,access,profile:profileData||null};
  }

  async function openAccount(){
    const modal=byId("account-modal");
    const overview=byId("account-overview");
    const passwordPanel=byId("account-password-panel");
    if(!modal)return;

    try{
      const {user,access,profile}=await loadAccountDetails();
      byId("account-name-input").value=profile?.display_name||access?.display_name||"";
      byId("account-email-input").value=user.email||"";
      byId("account-phone-input").value=profile?.phone||"";
      byId("account-role").textContent=titleCase(profile?.role||access?.role||"staff");
      const profileStatus=byId("account-profile-status");
      if(profileStatus){profileStatus.textContent="";profileStatus.className="form-status";}
    }catch(error){
      byId("account-name-input").value=byId("staff-name")?.textContent||"";
      byId("account-email-input").value="";
      byId("account-phone-input").value="";
      byId("account-role").textContent=titleCase(byId("staff-role")?.textContent||"staff");
      const status=byId("account-password-status");
      if(status){
        status.textContent=error?.message||"Account details could not be refreshed.";
        status.className="form-status error";
      }
    }

    setHidden(overview,false);
    setHidden(passwordPanel,true);
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden","false");
  }

  function closeAccount(){
    const modal=byId("account-modal");
    if(!modal)return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden","true");
    setHidden(byId("account-overview"),false);
    setHidden(byId("account-password-panel"),true);
    const p1=byId("account-new-password");
    const p2=byId("account-confirm-password");
    if(p1)p1.value="";
    if(p2)p2.value="";
  }

  async function saveProfile(event){
    event.preventDefault();
    const client=window.RA_PORTAL?.authClient;
    const status=byId("account-profile-status");
    if(!client||!status)return;

    const name=byId("account-name-input").value.trim();
    const email=byId("account-email-input").value.trim().toLowerCase();
    const phone=byId("account-phone-input").value.trim();

    if(!name||!email){
      status.textContent="Name and email are required.";
      status.className="form-status error";
      return;
    }

    status.textContent="Saving profile...";
    status.className="form-status";

    try{
      const {data:{user},error:userError}=await client.auth.getUser();
      if(userError)throw userError;

      const {error:profileError}=await client.rpc("update_my_staff_profile",{
        p_display_name:name,
        p_phone:phone||null
      });
      if(profileError)throw profileError;

      let emailChanged=false;
      if(user?.email && user.email.toLowerCase()!==email){
        const {error:emailError}=await client.auth.updateUser({email});
        if(emailError)throw emailError;
        emailChanged=true;
      }

      if(byId("staff-name"))byId("staff-name").textContent=name;
      status.textContent=emailChanged
        ?"Profile saved. Check your email to confirm the address change."
        :"Profile saved.";
      status.className="form-status success";
    }catch(error){
      status.textContent=error?.message||"Profile could not be saved.";
      status.className="form-status error";
    }
  }

  function bind(){
    const header=byId("account-button");
    if(header){
      header.onclick=(event)=>{
        event.preventDefault();
        event.stopPropagation();
        openAccount();
      };
    }

    const side=qs(".ra-sidebar-footer .ra-nav-item");
    if(side){
      side.onclick=(event)=>{
        event.preventDefault();
        event.stopPropagation();
        document.body.classList.remove("ra-mobile-nav-open");
        openAccount();
      };
    }

    byId("account-profile-form")?.addEventListener("submit",saveProfile);
    byId("account-close")?.addEventListener("click",closeAccount);
    byId("account-done")?.addEventListener("click",closeAccount);
    document.querySelectorAll("[data-account-close]").forEach((node)=>{
      node.addEventListener("click",closeAccount);
    });

    window.RA_ACCOUNT={open:openAccount,close:closeAccount};
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>setTimeout(bind,0),{once:true});
  }else{
    setTimeout(bind,0);
  }
})();