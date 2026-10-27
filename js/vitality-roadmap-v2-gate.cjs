'use strict';
// No network, private exemplars, credentials, numerical conversion or mutable policy.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const manifest=require('../config/roadmap-narrative/founder-direction-v2.json');
const driverKeys=require('./vitality-roadmap-b4-coverage.js').drivers.map(([key])=>key);
const ENGINE='roadmap-founder-methodology-v2-20261027';
const VERSION='founder-direction-narrative-20261027-v2-local';
const HASH='996554e27739dd90effda72adcec60493d640f086b15c07c0ca2c29fe08e440b';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function verifyRuleset(rules=manifest){
 assert.equal(hash(JSON.stringify(rules)),HASH,'Reviewed V2 ruleset required');
 assert.equal(rules.version,VERSION);assert.equal(rules.rules.length,12);
 assert.deepEqual(rules.rules.map(r=>r.driver).sort(),[...driverKeys].sort());
 const actions=rules.rules.flatMap(r=>r.actions);assert.equal(actions.length,45);assert.equal(new Set(actions.map(a=>a.id)).size,45);
 for(const r of rules.rules)for(const a of r.actions){assert.equal(hash(a.text),a.source.textSha256);assert.equal(a.source.sourceDocumentSha256,rules.founderSource.documentSha256);assert.equal(a.source.sourceDriver,r.driver);assert(a.source.page>=1&&a.source.page<=9);}
 return Object.freeze({engine:ENGINE,narrativeVersion:VERSION,rulesetHash:HASH,loadedDirections:45,coveredDrivers:12});
}
function deepFreeze(x){if(x&&typeof x==='object'){for(const v of Object.values(x))deepFreeze(v);Object.freeze(x);}return x;}
verifyRuleset();deepFreeze(manifest);
function comparison(document){
 const rows=manifest.rules.map(rule=>{
  const d=document.roadmap.drivers[rule.driver],source=document.drivers[rule.driver],selected=new Map(d.founderDirections.map(a=>[a.id,a]));
  return{driver:rule.driver,name:source.name,location:'My 12 Drivers → '+source.name,sections:['What Your Answers Suggest','Why This Matters','Recommended Next Steps'],
   rules:rule.actions.map(a=>({directionId:a.id,founderDirection:a.text,source:a.source,status:selected.has(a.id)?'applied_to_cited_context':a.status==='owner_decision_required'?'owner_decision_required':'not_applied_context_not_established',evidence:selected.get(a.id)?.evidence||[],missingContext:a.when.op==='uncollected_context'?a.when.name:null})),
   evidence:source.evidence.filter(e=>d.evidence.includes(e.field)).map(e=>({field:e.field,question:e.question,responses:[...e.answers],scope:e.scope||'same_pinned_submission'})),
   gaps:[...source.questions],numericalScore:'withheld',spectrum:'withheld'};
 });
 return{founderOnly:true,sourceFingerprint:document.sourceFingerprint,engine:ENGINE,rulesetHash:HASH,loadedDirections:45,rows};
}
function attest(document,context){
 document.narrative.generationGate=verifyRuleset();
 document.roadmap.founderComparison=comparison(document);
 verifyDocument(document,context);return document;
}
function verifyDocument(document,context){
 assert.deepEqual(document.narrative.generationGate,verifyRuleset());
 assert.equal(document.sourceFingerprint,context.source_fingerprint,'Wrong generation source');
 assert.equal(document.narrative.version,VERSION);assert.equal(document.narrative.ruleHash,HASH);assert.equal(document.roadmap.narrativeVersion,VERSION);
 assert.equal(document.review.clientVisible,false);assert.equal(document.review.export,'held');assert.equal(document.review.delivery,'held');assert.equal(document.review.email,'held');
 assert.equal(document.calculation.overall,null);assert.equal(document.calculation.spectrum,null);assert.equal(document.calculation.policyApproved,false);
 assert.deepEqual(Object.keys(document.roadmap.drivers).sort(),[...driverKeys].sort());
 for(const rule of manifest.rules){
  const d=document.roadmap.drivers[rule.driver],source=document.drivers[rule.driver];assert.equal(source.score,null);assert.equal(source.stage,null);
  assert.equal(source.narrativeVersion,VERSION);assert.equal(typeof d.sections.whatYourAnswersSuggest,'string');assert.equal(typeof d.sections.whyThisMatters,'string');assert(Array.isArray(d.sections.recommendedNextSteps));
  const permitted=new Set(source.evidence.map(e=>e.field));
  for(const a of d.founderDirections){const original=rule.actions.find(x=>x.id===a.id);assert(original);assert.notEqual(original.status,'owner_decision_required');assert.equal(a.text,original.text);assert.equal(a.ruleVersion,VERSION);assert.deepEqual(a.source,original.source);assert(a.evidence.length&&a.evidence.every(id=>permitted.has(id)));}
 }
 assert.equal(document.drivers.wise_budgeting.healthAggregation,false);
 assert.deepEqual(document.roadmap.founderComparison,comparison(document),'Comparison/source/rule lineage changed');
 if(!document.roadmap.safetyNotice)assert.deepEqual(document.roadmap.phases.map(p=>p.window),['Days 1–30','Days 31–60','Days 61–90']);
 else assert.equal(document.roadmap.phases.length,0);
 return true;
}
module.exports={ENGINE,VERSION,HASH,verifyRuleset,verifyDocument,attest,comparison};
