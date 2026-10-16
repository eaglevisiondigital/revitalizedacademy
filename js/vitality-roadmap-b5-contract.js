/* Independent measurement contract. Candidate mathematics is not adopted scoring policy. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./vitality-roadmap-b4-coverage.js'):root.RVA_ROADMAP_B4,typeof module==='object'&&module.exports?require('./vitality-roadmap-b21-engine.js'):root.RVA_ROADMAP_B21,typeof module==='object'&&module.exports?require('./vitality-roadmap-b2-engine.js'):root.RVA_ROADMAP_B2);if(typeof module==='object'&&module.exports)module.exports=api;else root.RVA_ROADMAP_B5=api;})(typeof window==='object'?window:globalThis,(coverage,engine,base)=>{
 'use strict';
 const version='b5-measurements-20261016-v1',rubric='b5-rubric-unapproved-v1';
 const pins=Object.freeze({contract:version,adapter:coverage.version,registry:coverage.fingerprint,rubric,config:engine.defaultConfig.version});
 const required=['Approved Driver-specific habit definitions, foundational/supporting roles and applicable opportunities','Demonstrated factual proficiency, not self-confidence','Exact unique current symptom days; independent intensity and daily impact','Exact persistence days, resolution and distinct finding/condition ownership','Independent Driver function evidence','Accepted Driver exponents, Spectrum prerequisites and source revision provenance'];
 const parameterSchema={concernPeak:{value:.75,min:0,max:1,step:.01},lifestyleMean:{value:.8,min:0,max:1,step:.01},healthExponent:{value:.55,min:0,max:1,step:.01},symptomBreadth:{value:.65,min:0,max:1,step:.01},peaceMinimum:{value:95,choices:[90,95]},minimumDays:{value:1,min:1,max:30,step:1},persistentDays:{value:90,min:1,max:36500,step:1},chaosImpact:{value:'each_condition',choices:['each_condition','any_condition']},chronicKind:{value:'reported_condition',choices:['reported_condition','reported_diagnosis','symptoms_or_conditions']}};
 const clone=x=>JSON.parse(JSON.stringify(x));
 function crosswalk(registry){return Object.fromEntries(coverage.drivers.map(([key,name])=>[key,{name,weight:engine.weights[key],health:key!=='wise_budgeting',fields:Object.entries(registry.fields).filter(([,m])=>m.section===name||(key==='gastrointestinal_renovation'&&m.section==='G.I. Renovation')).map(([id,m])=>({id,label:m.label,role:id.endsWith('_symptoms')?'current_screen_context':m.dynamic?'ordinal_finding_context':/consistency$/.test(id)?'candidate_ordinal_consistency':/proficiency|confidence|nutrition_|movement_/.test(id)?'self_report_not_factual_proficiency':'context_requires_rubric',conditions:m.conditions,scoring:'withheld'})),required:key==='wise_budgeting'?['Approved factual planning and preparedness rubrics; income is never a health score']:required.slice()}]));}
 function analyze(source,registry,sourcePin){
  const held=source?.historical_record||source?.questionnaire_version!=='secure-snapshot-v1'||source?.pathway!=='Adult'||source?.assessment_for!=='Myself'||source?.status!=='completed';
  const stale=sourcePin?.registry!==pins.registry||sourcePin?.adapter!==pins.adapter;
  const map=crosswalk(registry), evidence=!held&&!stale?coverage.coverage(source,registry):null;
  for(const [key,d]of Object.entries(map)){
   d.observations=evidence?.[key]?.observations||[];
   d.components=d.observations.filter(o=>o.status.startsWith('known')).map(o=>({questionId:o.id,mode:'observed_supported_component',values:o.values,meaning:o.values.length===1&&o.values[0]==='0'?'explicit_zero':o.id.endsWith('_symptoms')&&o.values.length===1&&o.values[0]==='None of these'?'explicit_empty_screen':'reported_context',score:null}));
   d.score=null;d.stage=null;d.mode='withheld_insufficient_evidence';d.reason=held?'Historical, unfinished, unmatched or non-Adult/Myself source':stale?'Stale/revised reference contract':d.observations.some(o=>o.status==='conflicting')?'Conflicting answers and unresolved measurement/rubric requirements':'Current context is not a complete scored measurement set';
  }
  return{pins,drivers:map,overall:null,stage:null,sourceRevision:'version_label_only_not_exact_revision',sourceStatus:held?'historical_or_ineligible':stale?'stale_reference':'detailed_context_only',policyApproved:false,releaseEligible:false,missingMeasurements:required.slice(),budgetHealthDeduction:0};
 }
 function proposeConfig(patch={}){
  if(!patch||Array.isArray(patch)||Object.keys(patch).some(k=>!Object.hasOwn(parameterSchema,k)))throw Error('Only explicit candidate math proposals are accepted');
  const c=clone(engine.defaultConfig);c.revision=Object.keys(patch).length?1:0;
  for(const [k,v]of Object.entries(patch)){const s=parameterSchema[k];if(s.choices?!s.choices.includes(v):typeof v!=='number'||!Number.isFinite(v)||v<s.min||v>s.max||(s.step===1&&!Number.isInteger(v)))throw Error('Invalid explicit rule proposal');if(k==='peaceMinimum'){c.overallBands[0].minimum=v;for(const bands of Object.values(c.driverBands))bands[0].minimum=v;}else if(['minimumDays','persistentDays','chaosImpact','chronicKind'].includes(k))c.definitions[k]=v;else c.math[k]=v;}
  return engine.config(c);
 }
 function simulate(example,{patch={},overrides={}}={}){
  if(!example||!['synthetic','explicit_candidate_inputs'].includes(example.provenance))throw Error('Detached fictional inputs required');
  if(!overrides||Array.isArray(overrides)||Object.keys(overrides).some(k=>!base.drivers.some(([d])=>d===k)))throw Error('Unknown Driver');
  const before=engine.calculate(clone(example)),input=clone(example),assumptions=[];
  for(const [key,change]of Object.entries(overrides)){
   if(!change||Array.isArray(change)||Object.keys(change).some(k=>!['consistency','proficiency','function'].includes(k)))throw Error('Unsupported hypothetical input');
   if(key==='wise_budgeting')throw Error('Budget uses the separate fictional planning/preparedness case');
   const d=input.drivers[key];if(!d)throw Error('Driver absent');
   for(const [k,v]of Object.entries(change)){
    if(k==='function'){if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100)throw Error('Function must be 0–100');d.function=v;d.functionRef='hypothetical_'+key;}
    else {if(!Object.hasOwn(k==='consistency'?base.consistency:base.proficiency,v))throw Error('Unknown hypothetical scale');for(const h of d.habits||[]){if(k==='consistency'){delete h.completed;delete h.opportunities;}h[k]=v;}}
    assumptions.push({driver:key,measurement:k,value:v,provenance:'entered_hypothetical_not_source'});
   }
  }
  const settings=proposeConfig(patch),after=engine.calculate(input,settings);
  return{mode:'conditional_what_if',syntheticOnly:true,sourceLinked:false,pins,before,after,assumptions,patch:clone(patch),policyApproved:false,releaseEligible:false,approvedStage:null,budgetHealthDeduction:0,calibrationBlockers:['A/B/C candidate results ≈70.66 / 35.48 / 70.00 do not satisfy founder direction','Symptom-free B numeric Chaos may misrepresent current burden; no classification is approved','Independent expected ranges and numerical spread are awaiting founder judgment']};
 }
 return Object.freeze({version,pins,parameterSchema,required,crosswalk,analyze,proposeConfig,simulate});
});
