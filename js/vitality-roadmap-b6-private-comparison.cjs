'use strict';
// B6 engineering-only private data projection. Never import into a public preview.
// No database read, login bypass, score conversion, logging, storage, or release.
const B5=require('./vitality-roadmap-b5-contract.js');
const VERSION='b6-private-comparison-preflight-v1';
const allowedStages=new Set(['Peace','Impaired','Dysregulated','Chronic','Chaos']);
function projectAuthorizedSource(source,registry,options={}){
 // Must be supplied only by an independently verified private server RPC, never from the browser.
 if(options.accessVerifiedByServer!==true)throw Error('Private source authorization required');
 if(!source||typeof source!=='object'||Array.isArray(source)||!source.answers||typeof source.answers!=='object'||Array.isArray(source.answers))
  throw Error('Invalid submitted answer source');
 if(options.registryFingerprint!==B5.pins.registry||registry?.fieldCount!==743||
    registry?.symptomCount!==190||registry?.questionnaireVersion!=='secure-snapshot-v1')
  throw Error('Authoritative reference registry required');
 // Only the already-authorized server path may supply this proof. Labels alone are not proof.
 const analyzed=B5.analyze(source,registry,{registry:B5.pins.registry,adapter:B5.pins.adapter});
 const sourceEligible=analyzed.sourceStatus==='detailed_context_only';
 const revisionVerified=options.authoritativeRevisionVerified===true;
 const drivers=Object.fromEntries(Object.entries(analyzed.drivers).map(([key,d])=>{
  const observed=new Map(d.observations.map(o=>[o.id,o]));
  return [key,{name:d.name,weight:d.weight,budgetSeparate:!d.health,
   questions:d.fields.map(f=>{
    const o=observed.get(f.id);
    return {questionId:f.id,question:f.label,selectedAnswers:o?.values||[],
      evidenceState:o?.status||'unavailable',meaning:o?.reason||'No saved answer or permitted mapping',
      candidateMeasurement:'withheld_unapproved_rubric'};
   }),systemDriverScore:null,systemDriverStage:null,
   blockers:d.required.slice()}];
 }));
 return {version:VERSION,sourceEligibility:sourceEligible?'eligible_format_only':'ineligible_or_historical',
  sourceRevisionVerified:revisionVerified,sourceProof:'authoritative_operator_source_check_required',
  algorithmVersion:B5.pins.config,adapterVersion:B5.pins.contract,
  systemScore:null,systemStage:null,systemStatus:'withheld_no_supported_source_to_engine_conversion',
  calculationCount:0,missing:analyzed.missingMeasurements.slice(),
  drivers,policyApproved:false,releaseEligible:false,budgetHealthDeduction:0};
}
function compareWithFounder(projection,review){
 if(projection?.version!==VERSION||!review||typeof review!=='object'||Array.isArray(review))
  throw Error('Comparison source invalid');
 const score=review.expectedScore;
 if(score!==undefined&&score!==null&&(!Number.isFinite(score)||score<0||score>100))throw Error('Invalid founder score');
 if(review.expectedStage!=null&&!allowedStages.has(review.expectedStage))throw Error('Unknown proposed Spectrum');
 if(typeof review.reason!=='string'||review.reason.trim().length<3||review.reason.length>3000)
  throw Error('Founder rationale required');
 return {version:VERSION,mode:'independent_founder_review',saved:false,
   founder:{score:score??null,stage:review.expectedStage??null,reason:review.reason},
   system:{score:projection.systemScore,stage:projection.systemStage,status:projection.systemStatus},
   numericalDelta:null,stageAgreement:null,
   whyNoDelta:'Current real-answer score is withheld until a versioned, reviewed mapping and pilot authorization exist'};
}
module.exports=Object.freeze({VERSION,projectAuthorizedSource,compareWithFounder});