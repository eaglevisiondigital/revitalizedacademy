// Isolated fictional metadata, not bundled into the public application.
(()=>{
 const rows=[{request:'demo-source',name:'Robin Vale',second_identifier:'r•••@example.invalid',completed_at:'2026-10-10T14:00:00Z',identity_confirmable:true,kind:'eligible_detailed',eligible:true,has_report:true,same_name_contacts:2,staff_contact_warning:true,revision:0},
 {request:'demo-staff',name:'Robin Vale',second_identifier:'s•••@example.invalid',completed_at:null,identity_confirmable:false,kind:'no_report',eligible:false,has_report:false,same_name_contacts:2,staff_contact_warning:false,revision:0},
 {request:'demo-history',name:'Cedar Quill',second_identifier:'c•••@example.invalid',completed_at:'2026-09-20T15:00:00Z',identity_confirmable:true,kind:'historical_only',eligible:false,has_report:true,same_name_contacts:1,staff_contact_warning:false,revision:0}];
 const saved=new Map();let active=true,epoch=0;
 const portal={captureStaffSession:()=>active?{user:'fictional-founder',epoch}:null,currentStaffRole:()=> 'owner',hasPermission:()=>true,
 createAuthenticatedTaskGuard(){let count=0;return{begin:()=>active?{count:++count,epoch}:null,current:t=>!!t&&active&&t.count===count&&t.epoch===epoch,cancel:()=>count++}}};
 RVA_FOUNDER_VERIFICATION.createApp({portal,panel:document.querySelector('#vitality-assessments-panel'),api:async(action,payload)=>{
 if(action==='authorize'||action==='check')return{authorized:true};
 if(action==='status')return[...saved.values()];
 if(action==='search')return rows.filter(r=>r.name.toLowerCase()===payload.query.toLowerCase() && (!payload.completion_date || r.completed_at?.slice(0,10)===payload.completion_date)).map(r=>({...r,revision:saved.get(r.request)?.revision||0}));
 if(action==='attest'){const row=rows.find(r=>r.request===payload.request);saved.set(row.request,{...row,decision:payload.decision,revision:payload.expected_revision+1,revoke_by:payload.revoke_by,revocation_owner:payload.revocation_owner==='justyn'?'Justyn':'Elle'});return{revision:payload.expected_revision+1,enrollment:'held'};}
 if(action==='contact')return{contact_id:'fictional-contact'};
 return{unavailable:true};},onContact:()=>{document.querySelector('#demo-contact').textContent='Fictional authorized Contact view: robin@example.invalid. No real contact opened.';},onHistorical:()=>{document.querySelector('#demo-contact').textContent='Fictional historical-review destination. No real assessment or answers loaded.';}});
})();
