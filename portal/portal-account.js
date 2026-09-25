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

    // Resolve the signed-in user independently so a profile/RPC issue can never blank the email field.
    const sessionResult=await client.auth.getSession();
    const sessionUser=sessionResult?.data?.session?.user||null;

    let authUser=sessionUser;
    try{
      const userResult=await client.auth.getUser();
      if(userResult?.data?.user)authUser=userResult.data.user;
    }catch(_error){
      // The active session still provides the current authenticated email.
    }

    if(!authUser)throw new Error("Your signed-in account could not be loaded.");

    const [accessResult,profileResult]=await Promise.allSettled([
      client.rpc("get_my_staff_access"),
      client.from("staff_access").select("display_name,phone,role,status").eq("user_id",authUser.id).maybeSingle()
    ]);

    const accessData=accessResult.status==="fulfilled"&&!accessResult.value.error
      ? accessResult.value.data
      : null;
    const profileData=profileResult.status==="fulfilled"&&!profileResult.value.error
      ? profileResult.value.data
      : null;
    const access=Array.isArray(accessData)?accessData[0]:accessData;

    return {user:authUser,access,profile:profileData||null};
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
      const sessionResult=await client.auth.getSession();
      let user=sessionResult?.data?.session?.user||null;
      try{
        const userResult=await client.auth.getUser();
        if(userResult?.data?.user)user=userResult.data.user;
      }catch(_error){}
      if(!user)throw new Error("Your signed-in account could not be loaded.");

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

      // Keep the settings window open after saving so confirmation messages remain visible.
      // Always repopulate the field with the currently authenticated email.
      const sessionAfter=await client.auth.getSession();
      const currentEmail=sessionAfter?.data?.session?.user?.email||user.email||email;
      byId("account-email-input").value=currentEmail;

      status.textContent=emailChanged
        ?"Profile saved. Check your email to confirm the address change. Your current sign-in email will remain here until confirmation is complete."
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

    const changePassword=byId("account-change-password");
    if(changePassword){
      changePassword.onclick=(event)=>{
        event.preventDefault();
        setHidden(byId("account-overview"),true);
        setHidden(byId("account-password-panel"),false);
        const status=byId("account-password-status");
        if(status){status.textContent="";status.className="form-status";}
        byId("account-new-password")?.focus();
      };
    }

    const passwordCancel=byId("account-password-cancel");
    if(passwordCancel){
      passwordCancel.onclick=(event)=>{
        event.preventDefault();
        setHidden(byId("account-password-panel"),true);
        setHidden(byId("account-overview"),false);
      };
    }

    const passwordForm=byId("account-password-form");
    if(passwordForm){
      passwordForm.addEventListener("submit",async(event)=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        const client=window.RA_PORTAL?.authClient;
        const status=byId("account-password-status");
        const password=byId("account-new-password")?.value||"";
        const confirm=byId("account-confirm-password")?.value||"";
        if(!client||!status)return;
        if(password.length<10){
          status.textContent="Use at least 10 characters for your password.";
          status.className="form-status error";
          return;
        }
        if(password!==confirm){
          status.textContent="The passwords do not match.";
          status.className="form-status error";
          return;
        }
        status.textContent="Saving your new password...";
        status.className="form-status";
        const {error}=await client.auth.updateUser({password});
        if(error){
          status.textContent=error.message;
          status.className="form-status error";
          return;
        }
        byId("account-new-password").value="";
        byId("account-confirm-password").value="";
        status.textContent="Password updated successfully.";
        status.className="form-status success";
        window.setTimeout(()=>{
          closeAccount();
        },700);
      },true);
    }

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