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

    const [{data:userData,error:userError},{data:accessData,error:accessError}]=await Promise.all([
      client.auth.getUser(),
      client.rpc("get_my_staff_access")
    ]);
    if(userError) throw userError;
    if(accessError) throw accessError;
    const user=userData?.user;
    if(!user) throw new Error("Your signed-in account could not be loaded.");

    const access=Array.isArray(accessData)?accessData[0]:accessData;
    return {user,access};
  }

  async function openAccount(){
    const modal=byId("account-modal");
    const overview=byId("account-overview");
    const passwordPanel=byId("account-password-panel");
    if(!modal)return;

    try{
      const {user,access}=await loadAccountDetails();
      byId("account-name").textContent=access?.display_name||"Staff Member";
      byId("account-email").textContent=user.email||"Not Available";
      byId("account-role").textContent=titleCase(access?.role||"staff");
    }catch(error){
      byId("account-name").textContent=byId("staff-name")?.textContent||"Staff Member";
      byId("account-email").textContent="Signed-In Staff Account";
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