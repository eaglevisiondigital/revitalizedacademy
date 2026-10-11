/* Production pre-payment lifecycle. Catalog values are server authoritative. */
(() => {
  'use strict';
  const portal=window.RA_PORTAL;if(!portal)return;
  const client=portal.authClient,el=id=>document.getElementById(id);
  const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const allowed=key=>['owner','admin'].includes(portal.currentStaffRole?.())&&portal.hasPermission?.(key)===true;
  let epoch=0,contact=null,state=null,options=null,creationRequest=null,creationPayload=null;
  const status=(id,message)=>{const target=el(id);if(target)target.textContent=message||'';};
  async function rpc(name,args){const r=await client.rpc(name,args);if(r.error)throw r.error;return r.data;}
  function close(){
    epoch++;
    const modal=el('lifecycle-create-modal'),form=el('lifecycle-create-form');
    if(modal)modal.hidden=true;
    if(form)form.reset();
    if(el('lifecycle-referral'))conditional();
    creationRequest=null;creationPayload=null;status('lifecycle-create-status','');
  }
  function reset(){
    close();contact=null;state=null;options=null;
    const section=el('client-lifecycle-section'),summary=el('lifecycle-state'),form=el('lifecycle-enrollment-form'),plan=el('lifecycle-plan');
    if(section)section.hidden=true;
    if(summary)summary.replaceChildren();
    if(form)form.hidden=true;
    if(plan)plan.replaceChildren(new Option('Choose an approved plan',''));
  }
  function valid(run,id,user){return run===epoch&&contact?.id===id&&portal.currentUserId()===user&&allowed('finance.manage');}
  const money=(amount,currency)=>new Intl.NumberFormat(undefined,{style:'currency',currency}).format(Number(amount)/100);
  function planText(plan){
    const price=money(plan.amount_cents,plan.currency)+(plan.billing_cadence==='monthly'?'/month':'/year');
    if(plan.plan_code==='holistic_foundations_monthly_flex')return `${price} · flexible monthly`;
    if(plan.plan_code==='holistic_foundations_3_month')return `${price} · 3-month minimum (${money(plan.minimum_contract_amount_cents,plan.currency)} minimum)`;
    return `${price} · one annual payment · 12-month coverage`;
  }
  function selectedPlan(){return options?.plans?.find(plan=>plan.plan_code===el('lifecycle-plan').value)||null;}
  function renderPlanDetail(){
    const plan=selectedPlan(),box=el('lifecycle-plan-detail'),override=el('lifecycle-annual-override');box.replaceChildren();override.hidden=true;
    if(!plan)return;
    box.append(node('strong',planText(plan)),node('p',plan.description||''));
    const eligibility=plan.eligibility||{};
    if(plan.plan_code==='holistic_foundations_annual_established'){
      box.append(node('p',eligibility.eligible?`Annual Discount Eligible (${eligibility.qualifying_months||0} qualifying months).`:`Annual plan unavailable: ${eligibility.reason||'six qualifying months required'}.`));
      override.hidden=!!eligibility.eligible;
    }
    if(plan.checkout_state==='configuration_pending')box.append(node('p','Payment configuration pending for this market. Enrollment intent may be saved; checkout is unavailable.'));
    else box.append(node('p','Agreement publication and payment processing are held. Saving does not issue an agreement, charge a card, or grant access.'));
  }
  function renderOptions(){
    const select=el('lifecycle-plan'),current=state?.plan_code||select.value;select.replaceChildren(new Option('Choose an approved plan',''));
    for(const plan of options?.plans||[]){const option=new Option(planText(plan),plan.plan_code);if(plan.plan_code==='holistic_foundations_annual_established'&&!plan.eligibility?.eligible)option.disabled=true;select.add(option);}
    if([...select.options].some(o=>o.value===current&&!o.disabled))select.value=current;renderPlanDetail();
  }
  function render(){
    if(!state||!contact)return;
    el('client-lifecycle-section').hidden=false;
    const agreementState=state.agreement_publication_status==='held'?'Publication held — legal review pending':state.agreement_status||'Not prepared';
    let billing='Not selected';if(state.amount_cents!=null)billing=money(state.amount_cents,state.currency)+(state.billing_cadence==='annual'?'/year · one payment':state.commitment_months===3?'/month · 3-month minimum':'/month · flexible');
    const values={Recipient:state.email||'Email required',Account:state.account_claimed?'Verified account linked':'Setup not complete',Enrollment:state.enrollment_created?'Saved':'Not started',Program:state.program_name||'Not selected',Plan:state.plan_code||'Not selected',Market:state.market_code?`${state.market_code} / ${state.currency}`:'Set client country',Billing:billing,Agreement:agreementState,Invitation:state.invitation?(state.invitation.provider_accepted?'Provider accepted (receipt not verified)':state.invitation.status):'Not sent',Payment:'Payment processing held',Membership:state.membership_status||'Not prepared',Access:'Paid member access held'};
    const list=el('lifecycle-state');list.replaceChildren();for(const [key,value]of Object.entries(values)){const d=node('div');d.append(node('dt',key),node('dd',value));list.append(d);}
    status('lifecycle-next',!state.enrollment_created?'Next: choose an approved Holistic Foundations plan.':state.agreement_publication_status==='held'?'Agreement issuance, payment and paid access remain unavailable while the legal release gate is held.':!state.agreement_mapping_ready?'Next: an approved plan-specific agreement mapping is required.':'Review the approved agreement workflow.');
    el('lifecycle-prepare-agreement').disabled=!state.enrollment_created||!state.agreement_mapping_ready;
    renderOptions();
  }
  async function load(){
    const run=++epoch,id=contact?.id,user=portal.currentUserId();if(!id||!allowed('finance.manage')){reset();return;}
    try{const [enrollment,plans]=await Promise.all([rpc('production_client_enrollment_state',{p_contact_id:id}),rpc('production_client_plan_options',{p_contact_id:id})]);if(!valid(run,id,user))return;state=enrollment;options=plans;render();}
    catch(error){if(valid(run,id,user)){el('client-lifecycle-section').hidden=false;status('lifecycle-status',error.message);}}
  }
  el('people-add-client').addEventListener('click',()=>{if(!allowed('crm.manage'))return;close();el('lifecycle-create-modal').hidden=false;el('lifecycle-first-name').focus();});
  el('lifecycle-create-close').addEventListener('click',close);
  el('lifecycle-create-modal').addEventListener('click',event=>{if(event.target===el('lifecycle-create-modal'))close();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  function conditional(){const source=el('lifecycle-referral').value;for(const [id,value]of [['sales-rep','Sales Rep'],['other-source','Other']]){const input=el('lifecycle-'+id);input.closest('label').hidden=source!==value;input.required=source===value;if(source!==value)input.value='';}}
  el('lifecycle-referral').addEventListener('change',conditional);
  el('lifecycle-create-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!allowed('crm.manage')||!event.target.reportValidity())return;
    const payload={first_name:el('lifecycle-first-name').value.trim(),last_name:el('lifecycle-last-name').value.trim(),email:el('lifecycle-email').value.trim().toLowerCase(),phone:el('lifecycle-phone').value.trim(),country:el('lifecycle-country').value,source:'manual_staff_entry',referral_source:el('lifecycle-referral').value,sales_rep_name:el('lifecycle-referral').value==='Sales Rep'?el('lifecycle-sales-rep').value.trim():null,referral_source_other:el('lifecycle-referral').value==='Other'?el('lifecycle-other-source').value.trim():null};
    const fingerprint=JSON.stringify(payload);if(fingerprint!==creationPayload){creationRequest=crypto.randomUUID();creationPayload=fingerprint;}
    const run=epoch,user=portal.currentUserId(),button=el('lifecycle-create-save');button.disabled=true;status('lifecycle-create-status','Saving client…');
    try{const id=await rpc('create_production_client',{p_request_id:creationRequest,p_payload:payload});if(run!==epoch||user!==portal.currentUserId())return;close();await portal.openContact(id);await portal.loadDashboard();}catch(error){if(run===epoch&&user===portal.currentUserId())status('lifecycle-create-status',error.message);}finally{button.disabled=false;}
  });
  el('lifecycle-choose-program').addEventListener('click',()=>{el('lifecycle-enrollment-form').hidden=false;el('lifecycle-plan').focus();});
  el('lifecycle-plan').addEventListener('change',renderPlanDetail);
  el('lifecycle-override-save').addEventListener('click',async()=>{
    if(!contact||!allowed('finance.manage'))return;const reason=el('lifecycle-override-reason').value.trim();if(reason.length<12){status('lifecycle-status','Enter a specific reason of at least 12 characters.');return;}
    const button=el('lifecycle-override-save');button.disabled=true;
    try{await rpc('set_program_plan_eligibility_override',{p_contact_id:contact.id,p_plan_code:'holistic_foundations_annual_established',p_enabled:true,p_reason:reason,p_expires_at:null});status('lifecycle-status','Annual eligibility override recorded in the audit trail.');await load();}catch(error){status('lifecycle-status',error.message);}finally{button.disabled=false;}
  });
  el('lifecycle-enrollment-form').addEventListener('submit',async event=>{
    event.preventDefault();if(!contact||!allowed('finance.manage')||!event.target.reportValidity())return;
    const plan=selectedPlan();if(!plan||plan.eligibility?.eligible===false){status('lifecycle-status','Choose an eligible approved plan.');return;}
    const run=epoch,id=contact.id,user=portal.currentUserId(),button=el('lifecycle-save-enrollment');button.disabled=true;
    try{const data=await rpc('save_production_client_plan_intent',{p_contact_id:id,p_plan_code:plan.plan_code});if(!valid(run,id,user))return;state=data;render();el('lifecycle-enrollment-form').hidden=true;status('lifecycle-status','Plan intent saved from the server catalog. No agreement was issued, no payment was charged and no paid access was granted.');document.dispatchEvent(new CustomEvent('ra:lifecycle-enrollment-saved',{detail:{contactId:id}}));}catch(error){if(valid(run,id,user))status('lifecycle-status',error.message);}finally{button.disabled=false;}
  });
  el('lifecycle-prepare-agreement').addEventListener('click',()=>{if(state?.agreement_mapping_ready)el('client-agreement-assign').click();});
  document.addEventListener('ra:contact-opened',event=>{reset();contact=event.detail.contact;load();});
  document.addEventListener('ra:contact-closed',reset);document.addEventListener('ra:staff-access-reset',reset);
  document.addEventListener('ra:lifecycle-agreement-updated',()=>{if(contact)load();});
  document.addEventListener('ra:permissions-loaded',()=>{el('people-add-client').hidden=!allowed('crm.manage');if(contact)load();});
  client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(portal.currentUserId()&&session?.user?.id!==portal.currentUserId()))reset();});
})();
