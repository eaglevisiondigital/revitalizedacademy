/* Version-pinned evidence coverage only. No scoring engine or inferred measurements. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RVA_ROADMAP_B4=api;})(typeof window==='object'?window:globalThis,()=>{
 'use strict';
 const version='b4-source-coverage-20261016-v1',fingerprint='2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced';
 const drivers=[['cellular_hydration','Cellular Hydration'],['systemic_detoxification','Systemic Detoxification'],['electrobiology_rhythms','Electrobiology Rhythms'],['the_living_diet','The Living Diet'],['functional_training','Functional Training'],['holistic_recovery','Holistic Recovery'],['gastrointestinal_renovation','Gastrointestinal Renovation'],['hormone_balancing','Hormone Balancing'],['neural_repatterning','Neural Repatterning'],['momentum_regimens','Momentum Regimens'],['mentality_realignment','Mentality Realignment'],['wise_budgeting','Wise Budgeting']];
 const selected=rows=>Array.isArray(rows)?rows.filter(r=>r&&typeof r==='object'&&(!['radio','checkbox'].includes(r.type)||r.checked===true)).map(r=>r.value).filter(v=>v!==null&&v!==undefined&&String(v).trim()!=='').map(String):[];
 function coverage(source,registry){
  if(source?.questionnaire_version!=='secure-snapshot-v1'||registry?.fieldCount!==743||registry?.questionnaireVersion!=='secure-snapshot-v1')throw Error('Unmatched questionnaire registry');
  const bySection=Object.fromEntries(drivers.map(([k,n])=>[n,k]));bySection['G.I. Renovation']='gastrointestinal_renovation';
  const result=Object.fromEntries(drivers.map(([k,name])=>[k,{name,score:null,stage:null,budgetSeparate:k==='wise_budgeting',observations:[],missingMeasurements:'Factual proficiency, opportunities, unique symptom days, intensity/impact, duration, function and scoring rules remain unapproved or unknown.'}]));
  const symptoms=new Map(registry.symptoms.flatMap(s=>[s.frequency,s.disruption,s.duration].map(id=>[id,s])));
  for(const [id,meta] of Object.entries(registry.fields)){
   const owner=bySection[meta.section];if(!owner)continue;
   const rows=source.answers?.[id],values=[...new Set(selected(rows))];let status=rows===undefined?'missing':!Array.isArray(rows)?'conflicting':!values.length?'unknown':'known_context';
   let reason='Original answer context only; measurement/scoring use held.',applicable='yes';
   for(const condition of meta.conditions){const [key,options]=condition.split(':'),context=selected(source.answers?.[key]);if(context.length!==1)applicable='unknown';else if(!options.split('|').includes(context[0])){applicable='no';break;}}
   const symptom=symptoms.get(id);if(symptom&&applicable!=='no'){const screen=selected(source.answers?.[symptom.screenId]);if(!screen.length||(screen.includes('None of these')&&screen.length>1))applicable='unknown';else if(!screen.includes(symptom.label))applicable='no';}
   if(applicable==='no'){status=values.length?'conflicting':'inapplicable';reason='Saved branch excludes this question; missing evidence is not zero.';}
   else if(applicable==='unknown'){status='unknown';reason='Branch applicability is unknown or conflicting.';}
   else if(values.length>1&&(meta.kind!=='checkbox'||values.includes('None of these'))){status='conflicting';reason='Selected answers conflict.';}
   else if(meta.options.length&&values.some(v=>!meta.options.includes(v))){status='unsupported';reason='Answer is outside the pinned reference options.';}
   else if(values.some(v=>["I don't know",'Unknown','Not sure','Prefer not to say'].includes(v))){status='unknown';reason='Explicit unknown; no numeric default.';}
   else if(values.length===1&&values[0]==='0'){status='known_zero';reason='Explicit literal zero; no inferred Driver score.';}
   else if(id.endsWith('_symptoms')&&values.length===1&&values[0]==='None of these'){status='known_context';reason='None selected for this screen only; no inference of complete health or Driver stage.';}
   else if(/frequency|duration|disruption|proficiency|confidence/.test(id))reason='Reported label preserved; no days, duration midpoint, independent impact or factual proficiency inferred.';
   result[owner].observations.push({id,label:meta.label,status,values,reason});
  }
  return result;
 }
 const emptyDocument=()=>({summary:'',strengths:[],priorities:[],opportunities:[],actions:[],reviewer_notes:'',clarification:'',drivers:Object.fromEntries(drivers.map(([k])=>[k,{summary:'',reason:'',evidence:[]}]))});
 return Object.freeze({version,fingerprint,drivers,selected,coverage,emptyDocument});
});
