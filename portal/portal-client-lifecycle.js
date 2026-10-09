/* Production pre-payment lifecycle. No synthetic activation or browser payment writes. */
(() => {
  'use strict';
  const portal=window.RA_PORTAL;if(!portal)return;
  const client=portal.authClient, el=id=>document.getElementById(id);
  const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const allowed=key=>['owner','admin'].includes(portal.currentStaffRole?.())&&portal.hasPermission?.(key)===true;
  let epoch=0,contact=null,state=null,creationRequest=null,creationPayload=null;
  const status=(id,message)=>{el(id).textContent=message||'';};
  async function rpc(name,args){const r=await client.rpc(name,args);if(r.error)throw r.error;return r.data;}
  function close(){epoch++;el('lifecycle-create-modal').hidden=true;el('lifecycle-create-form').reset();conditional();creationRequest=null;creationPayload=null;status('lifecycle-create-status','');}
  function reset(){close();contact=null;state=null;el('client-lifecycle-section').hidden=true;el('lifecycle-state').replaceChildren();el('lifecycle-enrollment-form').hidden=true;}
  function valid(run,id,user){return run===epoch&&contact?.id===id&&portal.currentUserId()===user&&allowed('finance.manage');}
  function render(){
    if(!state||!contact)return;
    el('client-lifecycle-section').hidden=false;
    const agreementState=state.agreement_publication_status==='held'?'Publication held — legal review pending':state.agreement_status||'Not prepared';
    const values={Recipient:state.email||'Email required',Account:state.account_claimed?'Verified account linked':'Setup not complete',Enrollment:state.enrollment_created?'Saved':'Not started',Program:state.program_name||'Not selected',Billing:state.amount_cents==null?'Not selected':new Intl.NumberFormat(undefined,{style:'currency',currency:state.currency}).format(state.amount_cents/100)+(state.billing_choice==='monthly'?'/month · 6-month minimum':' pay in full · 12 months'),Agreement:agreementState,Invitation:state.invitation?(state.invitation.provider_accepted?'Provider accepted (receipt not verified)':state.invitation.status):'Not sent',Payment:'Payment Required — Awaiting Payment',Membership:state.membership_status||'Not prepared',Access:'Full paid member access held until Payments v1'};
    const list=el('lifecycle-state');list.replaceChildren();for(const [key,value]of Object.entries(values)){const d=node('div');d.append(node('dt',key),node('dd',value));list.append(d);}
    status('lifecycle-next',!state.enrollment_created?'Next: choose Holistic Foundations and save billing intent.':state.agreement_publication_status==='held'?'Agreement issuance is unavailable while legal publication review is pending. The saved enrollment remains intact.':!state.agreement_mapping_ready?'Next: an approved billing-specific production agreement mapping is required before sending.':!state.agreement_count?'Next: prepare and send the agreement.':state.agreement_status!=='signed'?'Next: client verifies their email, reopens the original invitation and signs the agreement.':'Agreement Signed. Payment Required / Awaiting Payment. Payment checkout is not released.');
    el('lifecycle-prepare-agreement').disabled=!state.enrollment_created||!state.agreement_mapping_ready;
    el('lifecycle-billing').value=state.billing_choice==='one_time'?'one_time':'monthly';el('lifecycle-currency').value='CAD';
  }
  async function load(){const run=++epoch,id=contact?.id,user=portal.currentUserId();if(!id||!allowed('finance.manage')){reset();return;}try{const data=await rpc('production_client_enrollment_state',{p_contact_id:id});if(!valid(run,id,user))return;state=data;render();}catch(error){if(valid(run,id,user))status('lifecycle-status',error.message);}}
  el('people-add-client').addEventListener('click',()=>{if(!allowed('crm.manage'))return;close();el('lifecycle-create-modal').hidden=false;el('lifecycle-first-name').focus();});
  el('lifecycle-create-close').addEventListener('click',close);
  el('lifecycle-create-modal').addEventListener('click',event=>{if(event.target===el('lifecycle-create-modal'))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  function conditional(){const source=el('lifecycle-referral').value;for(const [id,value]of [['sales-rep','Sales Rep'],['other-source','Other']]){const input=el('lifecycle-'+id);input.closest('label').hidden=source!==value;input.required=source===value;if(source!==value)input.value='';}}
  el('lifecycle-referral').addEventListener('change',conditional);
  el('lifecycle-create-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!allowed('crm.manage')||!event.target.reportValidity())return;
    const payload={first_name:el('lifecycle-first-name').value.trim(),last_name:el('lifecycle-last-name').value.trim(),email:el('lifecycle-email').value.trim().toLowerCase(),phone:el('lifecycle-phone').value.trim(),source:'manual_staff_entry',referral_source:el('lifecycle-referral').value,sales_rep_name:el('lifecycle-referral').value==='Sales Rep'?el('lifecycle-sales-rep').value.trim():null,referral_source_other:el('lifecycle-referral').value==='Other'?el('lifecycle-other-source').value.trim():null};
    const fingerprint=JSON.stringify(payload);if(fingerprint!==creationPayload){creationRequest=crypto.randomUUID();creationPayload=fingerprint;}
    const run=epoch,user=portal.currentUserId(),button=el('lifecycle-create-save');button.disabled=true;status('lifecycle-create-status','Saving client…');
    try{const id=await rpc('create_production_client',{p_request_id:creationRequest,p_payload:payload});if(run!==epoch||user!==portal.currentUserId())return;close();await portal.openContact(id);await portal.loadDashboard();}catch(error){if(run===epoch&&user===portal.currentUserId())status('lifecycle-create-status',error.message);}finally{button.disabled=false;}
  });
  el('lifecycle-choose-program').addEventListener('click',()=>{el('lifecycle-enrollment-form').hidden=false;el('lifecycle-billing').focus();});
  el('lifecycle-enrollment-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!contact||!allowed('finance.manage')||!event.target.reportValidity())return;
    const run=epoch,id=contact.id,user=portal.currentUserId(),button=el('lifecycle-save-enrollment');button.disabled=true;
    try{const data=await rpc('save_production_client_enrollment',{p_contact_id:id,p_program_code:'holistic-foundations',p_billing_choice:el('lifecycle-billing').value,p_amount_cents:el('lifecycle-billing').value==='monthly'?8900:96000,p_currency:el('lifecycle-currency').value});if(!valid(run,id,user))return;state=data;render();el('lifecycle-enrollment-form').hidden=true;status('lifecycle-status','Enrollment saved. No payment was charged and no invitation was sent.');document.dispatchEvent(new CustomEvent('ra:lifecycle-enrollment-saved',{detail:{contactId:id}}));}catch(error){if(valid(run,id,user))status('lifecycle-status',error.message);}finally{button.disabled=false;}
  });
  el('lifecycle-prepare-agreement').addEventListener('click',()=>{if(state?.agreement_mapping_ready)el('client-agreement-assign').click();});
  document.addEventListener('ra:contact-opened',event=>{reset();contact=event.detail.contact;load();});
  document.addEventListener('ra:contact-closed',reset);document.addEventListener('ra:staff-access-reset',reset);
  document.addEventListener('ra:lifecycle-agreement-updated',()=>{if(contact)load();});
  document.addEventListener('ra:permissions-loaded',()=>{el('people-add-client').hidden=!allowed('crm.manage');if(contact)load();});
  client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(portal.currentUserId()&&session?.user?.id!==portal.currentUserId()))reset();});
})();
