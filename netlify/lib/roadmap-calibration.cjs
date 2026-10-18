'use strict';
// Additive actions on the existing ninth Function; no new endpoint, provider or service key.
const adapter=require('../../js/vitality-roadmap-b6-adapter.cjs'),coverage=require('../../js/vitality-roadmap-b4-coverage.js');
const canonical=o=>JSON.stringify(o,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const actions=['authorize','list','attest','read','check','compute','hypothetical','feedback_save','feedback_history'];
async function handle(b,rpc){
 const action=b.action.slice(3),payload=b.payload||{};if(!actions.includes(action))throw Error('Invalid action');
 const context=async(kind,p={})=>{const c=await rpc(kind,b.report||null,p);if(['read','check','compute','hypothetical'].includes(kind)&&canonical(c.pins)!==canonical(adapter.pins))throw Error('Stale pins');return c;};
 if(action==='authorize'){if(b.report!=null||Object.keys(payload).length)throw Error('Invalid authorize');const c=await context('authorize');if(canonical(c.pins)!==canonical(adapter.pins))throw Error('Stale pins');return{...c,drivers:coverage.drivers,stages:adapter.stages,feasibility:{supportedDrivers:0,withheldDrivers:12,overall:null,notice:'Current questionnaire supports context and isolated proposed components, not complete numeric Driver scores.'}};}
 if(['compute','hypothetical'].includes(action)){
 const allowed=['manual','source_fingerprint','grant_sequence',...(action==='hypothetical'?['assumption']:[])];if(!payload||Array.isArray(payload)||Object.keys(payload).some(k=>!allowed.includes(k))||allowed.some(k=>!Object.hasOwn(payload,k)))throw Object.assign(Error('Invalid inputs'),{invalid:true});
 let manual;try{manual=adapter.validateManual(payload.manual);}catch{throw Object.assign(Error('Invalid manual review'),{invalid:true});}
 const c=await context(action);if(c.source_fingerprint!==payload.source_fingerprint||c.grant_sequence!==payload.grant_sequence)throw Object.assign(Error('Stale source'),{conflict:true});
 let result;try{result=action==='compute'?adapter.calculate(c,manual):adapter.hypothetical(c,manual,payload.assumption);}catch{throw Object.assign(Error('Unsupported source or assumption'),{invalid:true});}
 const fresh=await context('check');if(fresh.grant_sequence!==c.grant_sequence||fresh.purpose_sequence!==c.purpose_sequence||fresh.can_feedback!==c.can_feedback)throw Object.assign(Error('Changed authorization'),{conflict:true});
 return result;
 }
 if(action==='feedback_save'){if(new TextEncoder().encode(JSON.stringify(payload)).length>20000)throw Object.assign(Error('Feedback too large'),{invalid:true});try{adapter.validateManual(payload.manual);}catch{throw Object.assign(Error('Invalid manual review'),{invalid:true});}}
 const r=await context(action,payload);if(action==='read')r.observed=adapter.observe(r);return r;
}
module.exports={handle,actions};
