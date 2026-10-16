/* Source coverage contract only. This module cannot calculate participant scores. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./vitality-roadmap-b2-engine.js'):root.RVA_ROADMAP_B2);if(typeof module==='object'&&module.exports)module.exports=api;else root.RVA_ROADMAP_B3=api;})(typeof window==='object'?window:globalThis,base=>{
  'use strict';
  const version='b3-source-coverage-20261016-v1';
  const registryFingerprint='2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced';
  const sourceFiles={'consult.html':'aa2cebc36132f32e6f0b7f4032d0dcfc6b91e2ff0ff0bb137b28557667f643f4','js/vitality55.js':'f37245fe91407b8e2b02fbbebf91cf4af32f468ef67e321753f8d91ce0c4af59'};
  const bySection=Object.fromEntries(base.drivers.map(([key,name])=>[name,key]));bySection['G.I. Renovation']='gastrointestinal_renovation';
  const unknownLabels=new Set(["I don't know",'Unknown','Not sure','Prefer not to say']);
  const selected=rows=>Array.isArray(rows)?rows.filter(r=>r&&typeof r==='object'&&(!['checkbox','radio'].includes(r.type)||r.checked===true)):[];
  function values(rows){return selected(rows).filter(r=>r.value!==null&&r.value!==undefined&&String(r.value).trim()!=='').map(r=>String(r.value));}
  function adapt(source,registry){
    if(!registry||registry.questionnaireVersion!=='secure-snapshot-v1'||registry.fieldCount!==743||base.stable(registry.sourceFiles)!==base.stable(sourceFiles))throw Error('Pinned questionnaire registry mismatch');
    const out={adapterVersion:version,registryFingerprint,questionnaireVersion:source?.questionnaire_version||'unknown',sourceRevisionStatus:source?.questionnaireSourceHashes&&base.stable(source.questionnaireSourceHashes)===base.stable(sourceFiles)?'reference_hashes_claimed_match':'version_label_only',provenanceVerified:false,realScoringEnabled:false,policyApproved:false,releaseEligible:false,overall:null,drivers:{},unmappedFieldIds:[],issues:[]};
    for(const [key,name]of base.drivers)out.drivers[key]={name,score:null,stage:null,budgetSeparate:key==='wise_budgeting',observations:[],missing:key==='wise_budgeting'?['Approved factual planning and preparedness rubrics; income and confidence are not scores.']:['Approved habit definitions/roles, opportunities and factual proficiency.','Exact symptom days, separate intensity/impact and duration evidence.','Independent Driver function and approved primary symptom ownership.','Approved Spectrum definitions and source-to-score policy.']};
    const matched=out.questionnaireVersion===registry.questionnaireVersion&&!source?.historical_record;
    const fields=source?.answers&&typeof source.answers==='object'&&!Array.isArray(source.answers)?source.answers:{};
    const savedPerson=values(fields.assessment_for);
    const held=source?.pathway!=='Adult'||source?.assessment_for!=='Myself'||source?.status!=='completed'||savedPerson.length!==1||savedPerson[0]!==source.assessment_for;
    if(held)out.issues.push('Only explicitly completed Adult/Myself sources are eligible; unknown, proxy, child or unfinished sources are held.');
    if(!matched)out.issues.push('Historical or unmatched questionnaire: current reference labels are not proven historical provenance.');
    out.issues.push('Snapshot labels or client-supplied hash claims do not prove the exact questionnaire code revision; authoritative provenance review is required.');
    const symptomDetails=new Map(registry.symptoms.flatMap(s=>[s.frequency,s.disruption,s.duration].map(id=>[id,s])));
    for(const [id,meta]of Object.entries(registry.fields)){
      const owner=bySection[meta.section];if(!owner)continue;
      const rows=fields[id],v=[...new Set(values(rows))],o={questionId:id,label:meta.label,questionnaireVersion:out.questionnaireVersion,conditions:meta.conditions.slice(),status:'missing',values:v,component:null,componentRole:null,temporality:meta.dynamic||id.endsWith('_symptoms')?'current_30_day_screen':'unspecified',reason:'No saved selected answer.',scoringUse:'held'};
      let condition='applicable';
      for(const c of meta.conditions){const [key,options]=c.split(':');const context=values(fields[key]);if(context.length!==1)condition='unknown';else if(!options.split('|').includes(context[0])){condition='inapplicable';break;}}
      const symptom=symptomDetails.get(id);
      if(symptom&&condition!=='inapplicable'){const screen=values(fields[symptom.screenId]);if(!screen.length||(screen.includes('None of these')&&screen.length>1))condition='unknown';else if(!screen.includes(symptom.label))condition='inapplicable';}
      if(held||!matched){o.status='unsupported';o.reason=held?'Adult/self/completion boundary not met.':'Questionnaire revision is unmatched or historical; no component inferred.';}
      else if(condition==='inapplicable'){o.status=v.length?'conflicting':'inapplicable';o.reason=v.length?'Saved hidden-branch answer conflicts with the explicit route.':'Explicit saved branch excludes this question; it is not a zero.';}
      else if(condition==='unknown'){o.status='unknown';o.reason='Branch-driving evidence is missing or conflicting; applicability cannot be inferred.';}
      else if(rows!==undefined&&!Array.isArray(rows)){o.status='conflicting';o.reason='Malformed saved answer collection.';}
      else if(!v.length){if(rows!==undefined){o.status='unknown';o.reason='Saved blank/null or unchecked-only answers do not establish zero.';}}
      else if((meta.kind!=='checkbox'&&v.length>1)||(v.includes('None of these')&&v.length>1)){o.status='conflicting';o.reason='Mutually exclusive selected answers conflict.';}
      else if(meta.options.length&&v.some(x=>!meta.options.includes(x))){o.status='unsupported';o.reason='Saved value is outside the pinned reference options.';}
      else if(v.some(x=>unknownLabels.has(x))){o.status='unknown';o.reason='Participant explicitly reported unknown; no numerical default.';}
      else{
        o.status='known_context';o.reason='Saved source context; no approved scoring rubric.';
        if(id.endsWith('_consistency')&&v.length===1&&Object.hasOwn(base.consistency,v[0])){o.component=base.consistency[v[0]];o.componentRole='proposed_ordinal_consistency';o.status=o.component===0?'known_zero':'known_component';o.reason='Shared ordinal scale component only; opportunities and factual proficiency still missing.';}
        else if(id.endsWith('_symptoms')&&v.length===1&&v[0]==='None of these'){o.component=0;o.componentRole='current_screen_count';o.status='known_zero';o.reason='Explicit None for this current screen, not a complete Driver score or diagnosis.';}
        else if(meta.dynamic&&id.endsWith('_frequency'))o.reason='Ordinal frequency is preserved; exact unique days are unknown.';
        else if(meta.dynamic&&id.endsWith('_duration')){o.temporality='duration_reported_current_finding';o.reason='Duration label preserved without midpoint, diagnosis or assumed resolution; exact >90-day evidence may be unknown.';}
        else if(meta.dynamic&&id.endsWith('_disruption'))o.reason='Disruption does not independently establish both symptom intensity and impact.';
        else if(/proficiency|confidence/.test(id))o.reason='Self-confidence does not establish demonstrated factual proficiency.';
      }
      out.drivers[owner].observations.push(o);
    }
    out.unmappedFieldIds=Object.keys(fields).filter(id=>!Object.hasOwn(registry.fields,id));
    for(const d of Object.values(out.drivers)){d.coverage={total:d.observations.length,known:d.observations.filter(o=>o.status.startsWith('known')).length,missing:d.observations.filter(o=>o.status==='missing').length,unknown:d.observations.filter(o=>o.status==='unknown').length,conflicting:d.observations.filter(o=>o.status==='conflicting').length,inapplicable:d.observations.filter(o=>o.status==='inapplicable').length};}
    return out;
  }
  function scoreActualSource(){throw Error('Real participant scoring is held pending approved rubrics and explicit pilot execution authorization.');}
  const emptyDocument=()=>({summary:'',strengths:[],priorities:[],opportunities:[],actions:[],reviewer_notes:'',clarification:'',drivers:Object.fromEntries(base.drivers.map(([k])=>[k,{summary:'',reason:'',evidence:[]}]))});
  function validateDraft(doc,source){
    const keys=Object.keys(emptyDocument()).sort();if(!doc||base.stable(Object.keys(doc).sort())!==base.stable(keys)||base.stable(Object.keys(doc.drivers||{}).sort())!==base.stable(base.drivers.map(([k])=>k).sort()))throw Error('Use the B1 unscored twelve-Driver draft contract');
    for(const key of ['summary','reviewer_notes','clarification'])if(typeof doc[key]!=='string'||doc[key].length>6000)throw Error('Invalid draft text');
    for(const key of ['strengths','priorities','opportunities','actions'])if(!Array.isArray(doc[key])||doc[key].length>(key==='actions'?12:3))throw Error('Invalid proposal list');
    for(const item of [...Object.values(doc.drivers),...doc.strengths,...doc.priorities,...doc.opportunities,...doc.actions]){
      if(!item||base.stable(Object.keys(item).sort())!==base.stable(['evidence','reason','summary'])||typeof item.summary!=='string'||typeof item.reason!=='string'||item.summary.length>4000||item.reason.length>2000||!Array.isArray(item.evidence)||item.evidence.length>30)throw Error('Invalid source-backed proposal');
      if(item.summary.trim()&&(!item.reason.trim()||!item.evidence.length))throw Error('A proposal requires source evidence and rationale');
      if(item.evidence.some(id=>typeof id!=='string'||!Object.hasOwn(source.answers||{},id)))throw Error('Evidence must reference an available fictional source question');
    }
    return true;
  }
  return Object.freeze({version,registryFingerprint,sourceFiles:Object.freeze(sourceFiles),adapt,scoreActualSource,emptyDocument,validateDraft,selected,values});
});
