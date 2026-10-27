'use strict';
// Candidate only. No AI, I/O, hidden numerical defaults or participant-specific rules.
const crypto=require('node:crypto'),adapter=require('./vitality-roadmap-b6-adapter.cjs'),engine=require('./vitality-roadmap-b21-engine.js'),base=require('./vitality-roadmap-b2-engine.js'),coverage=require('./vitality-roadmap-b4-coverage.js'),registry=require('../config/roadmap-b4/source-map.json');
const narrative=require('./vitality-roadmap-narrative.cjs');
const VERSION='roadmap-internal-processing-v1';
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function buildDraft(context,{personalized=true,founderDirection=false}={}){
 const observed=adapter.observe(context),input=adapterProjection(observed),calculated=engine.calculate(input);
 if(calculated.overall!==null||Object.values(calculated.drivers).some(d=>d.score!==null))throw Error('Unreviewed numerical conversion');
 const drivers=Object.fromEntries(coverage.drivers.map(([key,name])=>{
  const d=observed.drivers[key],evidence=d.observations.map(o=>({field:o.id,question:o.label,questionProvenance:o.wording,answers:o.submitted,status:o.status,reason:o.reason}));
  const valid=evidence.filter(e=>['known_context','known_zero'].includes(e.status));
  const symptoms=valid.filter(e=>e.field.endsWith('_symptoms')&&!e.answers.includes('None of these'));
  const practices=valid.filter(e=>!e.field.endsWith('_symptoms')&&/consisten/.test(e.field));
  const quotations=e=>e.answers.map(v=>JSON.stringify(v)).join(', ');
  return[key,{name,weight:d.weight,healthAggregation:d.health,evidence,
   score:null,stage:null,formula:'Candidate Driver = (100 − P)^α × L^(1 − α); P = max(symptom burden, independent functional concern). L requires defined habits, opportunities and factual proficiency. Missing inputs withhold the result.',calculations:calculated.drivers[key]||null,
   interpretation:valid.length?`You supplied ${valid.length} usable context response(s) for ${name}. These are self-reported observations for founder discussion; they do not establish a numerical score, proficiency or diagnosis.`:`No usable evidence is established for ${name}. Missing responses do not mean zero burden or healthy function.`,
   strengths:practices.filter(e=>e.answers.some(v=>['Often','Almost always'].includes(v))).map(e=>({text:`You report ${quotations(e)} for the practice shown in the referenced question. Confirm its opportunities and factual proficiency before interpreting benefit.`,evidence:[e.field]})),
   concerns:symptoms.map(e=>({text:`You selected ${quotations(e)} on this symptom screen. Clarify present relevance, unique days, impact and duration; no diagnosis is inferred.`,evidence:[e.field]})),
   questions:[...d.missing, ...(valid.length?['Confirm the historical wording and selected response meaning against an archived questionnaire revision.']:['Ask for this Driver’s missing questionnaire context.'])],
   coaching:valid.map(e=>({text:`Discuss what ${quotations(e)} means in daily life for this question; ask which practical change the person would like to explore. This is a discussion prompt, not a treatment recommendation.`,evidence:[e.field]})),
   assumptions:[],status:'withheld_missing_measurements_or_approved_mapping'}];
 }));
 const actions=Object.entries(drivers).filter(([,d])=>d.evidence.length).map(([key,d])=>({summary:`Clarify ${d.name}`,reason:d.coaching[0]?.text||'Resolve conflicting or unsupported answers before interpretation.',driver:key,evidence:d.evidence.map(e=>e.field)}));
 const draft={version:VERSION,sourceFingerprint:context.source_fingerprint,pins:adapter.pins,sourceRevision:observed.sourceRevision,questionWording:observed.questionWording,
  calculation:{engine:engine.defaultConfig.version,input,output:calculated,completeNumericDrivers:0,totalDrivers:12,overall:null,spectrum:null,policyApproved:false,knownCalibrationDiscrepancy:'Founder A/B/C discrepancy remains unresolved; no tuning or policy approval inferred.',budgetHealthDeduction:0},
  coverage:{fields:coverageMatrix(context),registeredFields:registry.fieldCount,observedFields:Object.values(drivers).reduce((n,d)=>n+d.evidence.length,0),unmapped:observed.unmapped,shared:observed.shared},drivers,
  roadmap:{summary:'Private individualized evidence review. All 12 Drivers are covered; complete numerical scores and Spectrum stage remain withheld. Original answers, current reference wording, arithmetic and founder interpretation are distinct.',strengths:Object.values(drivers).flatMap(d=>d.strengths.map(e=>({summary:d.name,reason:e.text}))),priorities:[],opportunities:actions.map(a=>({summary:a.summary,reason:a.reason})),actions:actions.map(a=>({summary:a.summary,reason:a.reason})),drivers:Object.fromEntries(Object.entries(drivers).map(([k,d])=>[k,{summary:d.interpretation,reason:d.questions.join(' '),evidence:d.evidence.map(e=>e.field)}]))},
  review:{state:'unreviewed',feedback:[],clientVisible:false,export:'held',delivery:'held',email:'held'}};
 if(personalized){
  // Only the trusted server entrypoint opts in; browser input cannot choose a ruleset.
  const baseline=narrative.build(observed),n=founderDirection?require('./vitality-roadmap-founder-direction.cjs').compose(observed,baseline):baseline;draft.narrative={version:n.version,ruleHash:n.ruleHash,policyIds:n.policyIds,contentBasis:n.contentBasis,provisional:true};
  if(founderDirection)draft.narrative.founderDirection=n.founderDirection;
  draft.componentTraces={symptoms:n.symptomTraces,references:n.referenceComponents,completeSourceNumericalComponents:0};
  draft.roadmap={...draft.roadmap,...n.roadmap,narrativeVersion:n.version};
  const shared=new Map(n.sharedEvidence.map(e=>[e.id,e]));
  for(const[key,d]of Object.entries(draft.drivers)){
   d.interpretation=n.drivers[key].interpretation.text;d.findings=[...n.drivers[key].strengths,...n.drivers[key].concerns,...n.drivers[key].observations];d.coaching=[n.drivers[key].action];d.narrativeVersion=n.version;
   // Shared citations remain same-source, unscored evidence inside the existing per-Driver allowlist.
   for(const id of n.drivers[key].evidenceRefs){const e=shared.get(id);if(e&&!d.evidence.some(x=>x.field===id))d.evidence.push({field:id,question:e.label,questionProvenance:e.wording,answers:[],status:'shared_context_not_scored',reason:'Source-scoped citation reference. The exact original value is preserved in Shared submitted evidence; it is not duplicated or scored here.',scope:'shared_context_not_scored'});}
  }
 }
 if(founderDirection)require('./vitality-roadmap-v2-gate.cjs').attest(draft,context);
 return draft;
}
function adapterProjection(analysis){return{pathway:'Adult',assessmentFor:'Myself',provenance:'explicit_candidate_inputs',findings:[],drivers:Object.fromEntries(coverage.drivers.filter(([k])=>k!=='wise_budgeting').map(([k])=>[k,{symptomScreen:'unknown',habits:[],function:null}])),budget:{planning:null,preparedness:null}};}
// An explicit label scale is implemented in the engine but is NOT a source mapping.
// No normalization registry entry is approved for historical saved answers today.
function coverageMatrix(context){
 const byField=new Map(context?Object.entries(coverage.coverage(context.source,registry)).flatMap(([driver,d])=>d.observations.map(o=>[o.id,{driver,status:o.status,reason:o.reason}])):[]);
 return Object.entries(registry.fields).map(([field,m])=>({field,section:m.section,referenceQuestion:m.label,...(byField.get(field)||{status:context?(adapter.submitted(context.source.answers[field]).length?'shared_context':'missing'):'context_only'}),numericConversion:'held',numericReason:'Archived capture semantics and complete approved measurement rubric required.'}));
}
function validateReview(review,draft){
 const allowed=['driver','decision','interpretation','rationale','citations','suggestedAdjustment','missingInputRequest'];
 if(!review||typeof review!=='object'||Array.isArray(review)||Object.keys(review).some(k=>!allowed.includes(k))||!draft.drivers[review.driver]||!['accurate','inaccurate','needs_adjustment','request_inputs'].includes(review.decision)||typeof review.rationale!=='string'||review.rationale.trim().length<3||review.rationale.length>2000||!Array.isArray(review.citations)||review.citations.length>20||review.citations.some(id=>!draft.drivers[review.driver].evidence.some(e=>e.field===id)))throw Error('Invalid cited founder review');
 for(const k of ['interpretation','suggestedAdjustment','missingInputRequest'])if(review[k]!==undefined&&(typeof review[k]!=='string'||review[k].length>2000))throw Error('Invalid review text');
 return JSON.parse(JSON.stringify(review));
}
function applyReviews(original,reviews){
 const d=JSON.parse(JSON.stringify(original));
 for(const r of reviews){validateReview(r,d);if(r.interpretation){d.roadmap.drivers[r.driver].summary=r.interpretation;d.roadmap.drivers[r.driver].reason='Attributed founder interpretation; original evidence and arithmetic remain unchanged.';if(d.roadmap.drivers[r.driver].sections)d.roadmap.drivers[r.driver].founderProposal={interpretation:r.interpretation,rationale:r.rationale,citations:r.citations};}}
 d.review.feedback=JSON.parse(JSON.stringify(reviews));d.review.state=reviews.length?'founder_proposals_not_global_rules':'unreviewed';return d;
}
module.exports={VERSION,buildDraft,coverageMatrix,validateReview,applyReviews,digest};
