// This bundle is a fictional rehearsal. It has no credentials, production config or network client.
const {createApp}=require('../../portal/portal-roadmap-scoring-lab.js'),contract=require('../../js/vitality-roadmap-b5-contract.js'),cases=require('../../js/vitality-roadmap-b5-cases.cjs'),engine=require('../../js/vitality-roadmap-b21-engine.js'),base=require('../../js/vitality-roadmap-b2-engine.js');
let active=true,epoch=0;
const portal={captureStaffSession:()=>active?{epoch}:null,currentStaffRole:()=> 'owner',hasPermission:()=>true,createAuthenticatedTaskGuard(){let seq=0;return{begin:()=>active?{seq:++seq,epoch}:null,current:t=>!!t&&active&&t.seq===seq&&t.epoch===epoch,cancel:()=>seq++};}};
const api=async(action,report,payload)=>{if(!active)return{unavailable:true};if(action==='authorize')return{authorized:true};if(action==='list')return[];if(action==='catalog')return{cases:cases.map(c=>({id:c.id,title:c.title||c.label||c.id})),pins:contract.pins,parameters:contract.parameterSchema,drivers:base.drivers,weights:engine.weights};if(action==='simulate'){const c=cases.find(c=>c.id===payload.case_id);return contract.simulate(c.input,{patch:payload.patch,overrides:payload.overrides});}return{unavailable:true};};
createApp({portal,panel:document.getElementById('vitality-assessments-panel'),api});
document.getElementById('demo-reset').onclick=()=>{active=false;epoch++;document.dispatchEvent(new Event('ra:staff-access-reset'));};
document.getElementById('demo-signin').onclick=()=>{active=true;epoch++;document.dispatchEvent(new Event('ra:permissions-loaded'));};
