'use strict';
const crypto=require('node:crypto'),manifest=require('../config/roadmap-narrative/v1.json'),registry=require('../config/roadmap-b4/source-map.json'),base=require('./vitality-roadmap-b2-engine.js'),T=require('./vitality-roadmap-measurement-traces.cjs');
const ruleHash=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
const quote=x=>'“'+(String(x).length>2000?String(x).slice(0,2000)+'…':String(x))+'”',known=o=>o&&['known_context','known_zero'].includes(o.status);
const specific={
 functional_training:[['training_program',['Structured progressive program','Structured individualized program'],['No program','Exercise randomly']]],
 gastrointestinal_renovation:[['plant_food_diversity',['Diverse','Very diverse'],['Very limited','Limited']]],
 hormone_balancing:[['hormone_exposure_markers',[],['Heating food in plastic','Heavy fragrance use','Occupational chemical exposure','Frequent pesticide exposure','High reliance on highly processed packaged food']]],
 neural_repatterning:[['stress_return_to_baseline',['Quickly','Very quickly'],['Very slowly','Slowly']]],
 momentum_regimens:[['weekly_rhythm',['Yes'],['No']],['routine_restart',['Same/next day','Within a few days'],['Several weeks',"I often don't restart"]]],
 mentality_realignment:[['self_talk',['Mostly constructive','Highly constructive'],['Very destructive','Mostly destructive']]],
 wise_budgeting:[['wellness_budget',['Yes'],['No']],['unexpected_health_expense',['Well prepared','Very well prepared'],['Completely unprepared','Slightly prepared']],['money_blocks_health',[],['Often','Very often']]]
};
function sharedEvidence(observed){
 const allowed=new Set(['primary_goals','primary_goals_other','ninety_day_goal','health_interference','most_concerning_symptoms','overall_quality_of_life',...Object.keys(registry.fields).filter(k=>k.startsWith('qol_'))]);
 return observed.shared.filter(e=>allowed.has(e.id)).filter(e=>{const m=registry.fields[e.id];return e.submitted.length&&(!m.options.length||e.submitted.every(x=>m.options.includes(x)))&&!e.submitted.some(x=>["I don't know",'Unknown','Not sure','Prefer not to say'].includes(x));});
}
function build(observed){
 const shared=sharedEvidence(observed),byShared=new Map(shared.map(e=>[e.id,e]));
 const goals=byShared.get('primary_goals'),goal=byShared.get('ninety_day_goal'),impact=byShared.get('health_interference'),concern=byShared.get('most_concerning_symptoms');
 const sharedRefs=[goals,goal,impact,concern].filter(Boolean).map(e=>e.id),symptoms=T.symptomTraces(observed),drivers={};
 const item=(key,kind,text,evidence,rule)=>({id:key+':'+rule+':'+evidence.join('|'),kind,text,evidence:[...new Set(evidence)],ruleId:rule,ruleVersion:manifest.version,contentRef:manifest.rules[key].contentRef,provisional:kind==='interpretation'||kind==='discussion',confidence:kind.startsWith('reported')?'self_report_context':'founder_review_required'});
 for(const[key,d]of Object.entries(observed.drivers)){
  const rule=manifest.rules[key],valid=d.observations.filter(known),byId=new Map(valid.map(o=>[o.id,o]));
  const strengths=[],concerns=[],observations=[];
  const addPractice=(o,positive,negative)=>{if(!known(o)||o.submitted.length!==1)return;const v=o.submitted[0],ref=[o.id];
   if(positive.includes(v))strengths.push(item(key,'reported_strength',`${o.label} — you reported ${quote(v)}. This is a reported support to preserve while exploring the stated goal.`,ref,'reported-support'));
   else if(negative.includes(v))concerns.push(item(key,'reported_friction',`${o.label} — you reported ${quote(v)}. This identifies a practical routine or access obstacle to work through.`,ref,'reported-friction'));
  };
  for(const id of rule.habits)addPractice(byId.get(id),['Often','Almost always'],['Never','Rarely','Sometimes']);
  for(const[id,positive,negative]of specific[key]||[]){const o=byId.get(id);if(o?.submitted.length>1&&key==='hormone_balancing'){if(o.submitted.some(x=>negative.includes(x)))concerns.push(item(key,'reported_context',`${o.label} — you reported ${o.submitted.map(quote).join(', ')}. Discuss context and feasible choices without inferring hormone dysfunction.`,[id],'reported-exposure'));}else addPractice(o,positive,negative);}
  const current=symptoms.filter(s=>s.driver===key);
  for(const s of current.slice(0,3)){
   const details=[s.reported.frequency&&`frequency ${quote(s.reported.frequency)}`,s.reported.disruption&&`disruption ${quote(s.reported.disruption)}`,s.reported.duration&&`duration ${quote(s.reported.duration)}`].filter(Boolean).join('; ');
   concerns.push(item(key,'reported_concern',`You reported ${quote(s.label)}${details?' with '+details:''}. Discuss which daily activity this affects before choosing a coaching priority.`,s.evidence,'symptom-specific-context'));
  }
  if(current.length>3)observations.push(item(key,'reported_context',`Additional reported findings remain in the cited evidence. They have not been combined into a burden score.`,current.slice(3).flatMap(s=>s.evidence),'additional-context'));
  const goalMatch=!!goals?.submitted.some(g=>rule.goals.includes(g));
  const used=[...strengths,...concerns,...observations].flatMap(x=>x.evidence),fallback=valid.find(o=>!registry.fields[o.id]?.dynamic&&!o.id.endsWith('_symptoms'))||valid[0];
  const main=concerns[0]||strengths[0]||(fallback?item(key,'reported_context',`${fallback.label} — you reported ${fallback.submitted.map(quote).join(', ')}. Use this context when deciding what would be meaningful and feasible to change.`,[fallback.id],'reported-baseline'):null);
  const refs=[...new Set([...(main?.evidence||[]),...sharedRefs])];
  let interpretation;
  if(main){const pattern=concerns.length&&strengths.length?'You report both a supporting practice and an area of friction. Preserve the useful routine while investigating the concern; the strength does not cancel the concern.':concerns.length?'The reported friction gives this Driver a concrete discussion focus; it does not establish a cause or numerical severity.':strengths.length?'The reported routine is a potential support to build on. A favorable habit alone does not establish a symptom-free or healthy Driver.':'The available context can guide a discussion, while the strength and difficulty of this Driver remain uncertain.';
   interpretation=item(key,'interpretation',`${rule.interpretation} ${main.text} ${pattern}${goalMatch?' This also connects to a goal you explicitly selected.':''} ${rule.firstStep}`,refs,'driver-synthesis');
  }else interpretation=item(key,'interpretation',`There is not enough usable context to describe your ${d.name} pattern. ${rule.discussion} Keep conclusions open until the relevant missing context is clarified.`,sharedRefs,'driver-evidence-gap');
  const focus=concerns[0]||strengths[0]||main;
  const action=item(key,'discussion',`${rule.firstStep}${focus?' Start with the cited response: '+focus.text:''} Agree on the smallest feasible step and its success measure with your founder reviewer; no target or benefit has been assumed.`,refs,'coaching-opportunity');
  const highImpact=current.some(s=>['Significant','Severe'].includes(s.reported.disruption));
  drivers[key]={strengths,concerns,observations,interpretation,action,goalMatch,highImpact,evidenceRefs:[...new Set([...used,...refs])],weight:d.weight,healthAggregation:key!=='wise_budgeting'};
 }
 const candidates=Object.entries(drivers).filter(([key,d])=>d.concerns.length||d.strengths.length||d.observations.length||observed.drivers[key].observations.some(known));
 candidates.sort((a,b)=>Number(b[1].highImpact)-Number(a[1].highImpact)||Number(b[1].goalMatch)-Number(a[1].goalMatch)||Number(b[1].concerns.length>0)-Number(a[1].concerns.length>0));
 const priorities=candidates.slice(0,3).map(([key,d])=>({driver:key,summary:observed.drivers[key].name,reason:(d.highImpact?'Reported high disruption warrants discussion before favorable habits or averages. No numerical severity or clinical ranking is inferred.':d.goalMatch?'Connects to a goal explicitly selected in the questionnaire.':'A reported practice or resource gap is a provisional discussion option. Relative severity and ease remain unmeasured.')+' '+(d.concerns[0]?.text||d.strengths[0]?.text||''),evidence:d.evidenceRefs,ruleId:'J20-C03/J20-C07',provisional:true,ease:'unknown_until_discussed'}));
 const relationships=[];
 for(const[a,b,topic]of [['electrobiology_rhythms','holistic_recovery','daily rhythm and recovery'],['the_living_diet','gastrointestinal_renovation','eating practices and digestive experience'],['neural_repatterning','mentality_realignment','attention, stress and supportive self-talk'],['momentum_regimens','functional_training','follow-through and training structure']]){
  const da=drivers[a],db=drivers[b],ea=da.concerns[0]||da.strengths[0],eb=db.concerns[0]||db.strengths[0];
  if(ea&&eb)relationships.push({summary:`Explore ${topic} together`,reason:`In ${observed.drivers[a].name}: ${ea.text} In ${observed.drivers[b].name}: ${eb.text} These co-reports may be useful to discuss together; they do not establish that one causes the other, and no symptom burden is counted twice.`,evidence:[...new Set([...ea.evidence,...eb.evidence])],drivers:[a,b],provisional:true,ruleId:'J20-C04'});
 }
 const selected=priorities.map(p=>p.driver),plan=selected.map(key=>({driver:key,topic:observed.drivers[key].name,action:drivers[key].action.text,evidence:drivers[key].action.evidence}));
 const phases=[['Days 1–30','Agree and begin','Choose one feasible first practice from the cited discussion options; agree on a success measure and keep existing helpful routines.'],['Days 31–60','Review and adjust','Review the agreed observations, barriers and daily-life relevance; adjust the same practice with the founder rather than adding untested interventions.'],['Days 61–90','Reassess the stated goal','Compare the agreed observations with the stated 90-day goal; decide together what to continue, change or clarify. No improvement is predicted.']].map(([window,title,instruction])=>({window,title,instruction,goal:goal?goal.submitted.join(' · ').slice(0,2000):null,focus:plan.map(p=>({...p,action:window==='Days 1–30'?p.action:window==='Days 31–60'?`For ${p.topic}, review the practice agreed in the first phase against its cited baseline. Discuss what fit daily life, what was difficult and whether the person wants to adjust it; do not infer improvement from completing a checklist.`:`For ${p.topic}, revisit the cited baseline and the stated 90-day goal with the founder. Review the person's observations and agree what to retain or revise; an unchanged or unclear result remains useful feedback.`})),provisional:true,evidence:[...new Set([...sharedRefs,...plan.flatMap(p=>p.evidence)])]}));
 const summary=[goal?`Your stated 90-day goal is ${quote(goal.submitted.join(' · '))}.`:goals?`You selected ${goals.submitted.map(quote).join(', ')} as goals.`:'Your founder review will use the evidence available in each Driver.',impact?`You described daily-life limitation as ${quote(impact.submitted.join(' · '))}; this is reported context, not an assigned Health Spectrum stage.`:'',concern?`The concern you most want reviewed is ${quote(concern.submitted.join(' · '))}.`:'',`The discussion focuses below connect your reported practices and difficulties to that context. Favorable habits do not cancel reported impairment. Each interpretation and action is provisional for founder correction.`].filter(Boolean).join(' ');
 const safetyFields=[...observed.shared,...Object.values(observed.drivers).flatMap(d=>d.observations)];
 const safety=safetyFields.filter(e=>['urgent_safety_flag','self_harm_safety_flag'].includes(e.id)&&e.submitted.length===1&&e.submitted[0]==='Yes').map(e=>e.id);
 if(safety.length){priorities.length=0;plan.length=0;phases.length=0;}
 return{version:manifest.version,ruleHash,policyIds:manifest.policyIds,contentBasis:manifest.contentBasis,sharedEvidence:shared,drivers,symptomTraces:symptoms,referenceComponents:T.referenceComponents(observed,manifest.rules),roadmap:{safetyNotice:safety.length?'A reported safety concern needs separate founder review through the existing assessment safety workflow. Routine coaching planning is held.':null,safetyEvidence:safety,summary,summaryEvidence:sharedRefs,strengths:Object.entries(drivers).flatMap(([key,d])=>d.strengths.slice(0,1).map(s=>({summary:observed.drivers[key].name,reason:s.text,evidence:s.evidence}))),priorities,opportunities:selected.map(key=>({summary:observed.drivers[key].name,reason:drivers[key].action.text,evidence:drivers[key].action.evidence})),actions:plan.map(p=>({summary:p.topic,reason:p.action,evidence:p.evidence})),relationships,phases,drivers:Object.fromEntries(Object.entries(drivers).map(([key,d])=>[key,{summary:d.interpretation.text,reason:'',evidence:d.interpretation.evidence,findings:[...d.strengths,...d.concerns,...d.observations],discussion:d.action.text}]))}};
}
module.exports={build,manifest,ruleHash,sharedEvidence};
