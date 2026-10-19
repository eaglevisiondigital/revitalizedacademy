'use strict';
// Public questionnaire metadata only. Never reads an actual saved submission.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const registry=require('../../config/roadmap-b4/source-map.json'),contract=require('../../js/vitality-roadmap-b5-contract.js');
function matrix(){
 const synthetic={status:'completed',pathway:'Adult',assessment_for:'Myself',questionnaire_version:'secure-snapshot-v1',answers:{}};
 const result=contract.analyze(synthetic,registry,{registry:contract.pins.registry,adapter:contract.pins.adapter});
 const fields=new Map();for(const[k,d]of Object.entries(result.drivers))for(const f of d.fields)fields.set(f.id,{driver:k,role:f.role,missing:d.required});
 const rows=Object.entries(registry.fields).map(([id,m])=>{
  const f=fields.get(id),role=f?.role||'shared_identity_or_context';
  const target=role==='candidate_ordinal_consistency'?'habit consistency component only':role==='current_screen_context'?'current finding screen only':role==='ordinal_finding_context'?'finding frequency / intensity / duration / impact':role==='self_report_not_factual_proficiency'?'coaching context; never factual proficiency':f?'Driver context requiring factual rubric':'identity, routing or shared narrative context';
  const blockers=role==='candidate_ordinal_consistency'?['Historical wording/revision unverified','Habit definition, appropriate opportunities, role and factual proficiency not established']:role==='current_screen_context'?['Screen semantics/revision and reviewed primary ownership required','None of these cannot establish all independent Driver inputs']:role==='ordinal_finding_context'?['Do not fabricate exact days or interval midpoints','Disruption is not independent intensity plus life impact','Canonical primary finding/condition ownership and current status required']:role==='self_report_not_factual_proficiency'?['Confidence is not demonstrated factual proficiency']:f?['Driver-specific rubric and measured-input contract incomplete']:['Not a numerical Driver input'];
  return {field_id:id,question:m.label,section:m.section,type:m.kind,required:m.required,options:m.options,conditions:m.conditions,dynamic:m.dynamic,driver:f?.driver??null,role,engine_target:target,numeric_conversion:'withheld',source_answer_included:false,blockers,driver_requirements:f?.missing||[]};
 });
 assert.equal(rows.length,743);assert.equal(new Set(rows.map(r=>r.field_id)).size,743);assert(rows.every(r=>r.numeric_conversion==='withheld'&&!r.source_answer_included));
 return {questionnaire_format:registry.questionnaireVersion,reference_fingerprint:contract.pins.registry,archived_original_wording_verified:false,actual_submissions_read:0,complete_numeric_drivers:0,rows};
}
if(require.main===module){const out=path.join(__dirname,'generated');fs.mkdirSync(out,{recursive:true});const result=matrix();fs.writeFileSync(path.join(out,'field-coverage.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({field_count:result.rows.length,driver_fields:result.rows.filter(r=>r.driver).length,shared_fields:result.rows.filter(r=>!r.driver).length,complete_numeric_drivers:0,participant_data:false}));}
module.exports={matrix};
