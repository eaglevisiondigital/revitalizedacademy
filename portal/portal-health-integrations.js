(() => {
  "use strict";
  const portal=window.RA_PORTAL;
  if(!portal)return;
  const client=portal.authClient;
  const el=(id)=>document.getElementById(id);

  async function loadSummary(contactId){
    const {data,error}=await client
      .from("admin_client_health_integration_summary")
      .select("*")
      .eq("contact_id",contactId)
      .maybeSingle();

    if(error){
      console.error("Health integration summary failed",error);
      return;
    }

    const section=el("client-health-integrations-section");
    if(!data){
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    const connected=Number(data.connected_providers||0);
    const attention=Number(data.connections_needing_attention||0);
    el("client-health-integrations-chip").textContent=connected+" Connected";
    el("client-connected-providers").textContent=String(connected);
    el("client-health-attention").textContent=String(attention);
    el("client-health-last-sync").textContent=data.last_successful_sync_at
      ? portal.formatDate(data.last_successful_sync_at,true)
      : "None";
    el("client-health-observations").textContent=String(data.observations_24h||0);
  }

  document.addEventListener("ra:contact-opened",(event)=>{
    loadSummary(event.detail.contactId);
  });
  document.addEventListener("ra:contact-closed",()=>{
    el("client-health-integrations-section").classList.add("hidden");
  });
})();