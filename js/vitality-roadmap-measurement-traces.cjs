'use strict';
// Pure explanations around the unchanged B2/B2.1 functions. No source fetch or writes.
const base=require('./vitality-roadmap-b2-engine.js'),registry=require('../config/roadmap-b4/source-map.json');
const VERSION='source-component-traces-v1';
const known=o=>o&&['known_context','known_zero'].includes(o.status);
const durationReferences={
 'Less than 2 weeks':[0], '2 weeks to under 2 months':[20], '2–3 months':[40],
 'More than 3 months to 1 year':[40,60], 'More than one year':[80,90,100]
};
function symptomTraces(observed){
 const result=[];
 for(const [driver,d]of Object.entries(observed.drivers)){
  const byId=new Map(d.observations.map(o=>[o.id,o]));
  for(const s of registry.symptoms){
   const screen=byId.get(s.screenId);
   if(!known(screen)||!screen.submitted.includes(s.label)||screen.submitted.includes('None of these'))continue;
   const one=id=>{const o=byId.get(id);return known(o)&&o.submitted.length===1?o.submitted[0]:null;};
   const frequency=one(s.frequency),disruption=one(s.disruption),duration=one(s.duration);
   result.push({driver,symptomId:s.id,label:s.label,screen:s.screenId,
    evidence:[s.screenId,...[s.frequency,s.disruption,s.duration].filter(id=>byId.has(id))],
    reported:{frequency,disruption,duration},
    frequency:{value:null,reason:'An ordinal frequency is not exact unique days in the last 30 days.'},
    intensity:{value:null,reason:'The disruption question is not an independent intensity measurement.'},
    dailyImpact:{value:null,reason:'Independent daily impact cannot be manufactured from disruption or reused as intensity.'},
    duration:{value:null,referenceCandidates:durationReferences[duration]||[],reason:'Compatible documented B2 duration factors only; no midpoint or exact persistence days inferred. Historical capture semantics remain unverified.'},
    burden:{value:null,formula:'I × (0.65 + 0.20F/100 + 0.10D/100 + 0.05A/100)',reason:'Requires distinct supported intensity, unique days, duration and impact, plus primary ownership.'},
    status:'reported_followups_not_complete_normalized_finding',ruleVersion:VERSION});
  }
 }
 return result;
}
function referenceComponents(observed,rules){
 const result=[];
 for(const[key,d]of Object.entries(observed.drivers))for(const field of rules[key].habits){
  const o=d.observations.find(o=>o.id===field);
  if(!known(o)||o.submitted.length!==1||!Object.hasOwn(base.consistency,o.submitted[0]))continue;
  result.push({driver:key,field,reported:o.submitted[0],referenceValue:base.consistency[o.submitted[0]],formula:'Pinned B2 ordinal consistency lookup',status:'reference_only_not_verified_participant_measurement',sourceMeaningVerified:false,reason:'A matching label is not proof of historical meaning, opportunities, factual proficiency or a complete Driver input.'});
 }
 return result;
}
function traceNormalizedSymptom(input){
 // Calculator utility only. Callers must separately establish real-source provenance.
 const result=base.symptom(input);
 return{mode:'explicit_normalized_candidate_math_not_source_authorization',input:JSON.parse(JSON.stringify(input)),...result,sourceApproved:false,driverScore:null};
}
module.exports={VERSION,symptomTraces,referenceComponents,traceNormalizedSymptom,durationReferences};
