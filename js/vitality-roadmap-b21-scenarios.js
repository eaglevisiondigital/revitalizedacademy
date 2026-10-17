/* Fictional measurement sheets, never copied from participant questionnaires. */
(function(root,factory){
  const api=typeof module==='object'&&module.exports?factory(require('./vitality-roadmap-b2-engine.js'),require('./vitality-roadmap-b2-scenarios.js')):factory(root.RVA_ROADMAP_B2,root.RVA_ROADMAP_B2_SCENARIOS);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RVA_ROADMAP_B21_SCENARIOS=api;
})(typeof window==='object'?window:globalThis,(base,legacy)=>{
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  function input(level='strong') {
    const x=legacy.base(level);x.dailyHealthImpact='Not at all';
    for(const d of Object.values(x.drivers))d.dailyHealthImpact='Not at all';
    return x;
  }
  function addFinding(x,id,owner,extra={}) {
    x.drivers[owner].symptomScreen='reported';
    x.findings.push(legacy.finding(id,owner,{days:1,intensity:'Mild',duration:'months_2_to_6',impact:'Not at all',
      durationDays:91,kind:'symptom',domain:'other',resolved:false,...extra}));
  }
  const cases=[];
  function add(id,label,edit,expected,independentExpectation) {
    const x=input();edit?.(x);
    cases.push({id,label,input:x,expected,independentExpectation,
      expectedStatus:'Independent arithmetic/restriction contract under disclosed provisional definitions; founder interpretation pending',
      questionnaireNotice:'Purpose-built fictional measurement sheet. Some exact inputs are not collected by the current questionnaire; this is not a validated actual-answer adapter.'});
  }
  add('b21_supported','Supported fictional foundations',null,{raw:100,candidateBand:'Peace'},'With no current findings, no negative impact and complete evidence, numerical 100 may provisionally meet Peace.');
  add('b21_budget_hardship','Financial hardship stays separate',x=>x.budget={planning:0,preparedness:0},{raw:100,displayScore:100,candidateBand:'Peace',budget:0},'Same direct health result as supported case. Financial hardship alone cannot lower health score or Spectrum.');
  add('b21_budget_unknown','Unknown finances do not erase health',x=>x.budget={planning:null,preparedness:100},{raw:100,displayScore:100,candidateBand:'Peace',budget:null},'Budget remains unknown; supported health math and stage do not depend on financial answers.');
  add('abc_a','Person A · strong habits, significant ongoing concern',x=>{
    addFinding(x,'fictional_a_concern','functional_training',{days:20,intensity:'Significant',durationDays:120,impact:'Significantly'});
    x.dailyHealthImpact='Significantly';x.drivers.functional_training.dailyHealthImpact='Significantly';
  },{raw:70.65971946180456,candidateBand:'Dysregulated'},'Founder expects A slightly above B and C, with all three close. These words have no approved numerical spread. Show any formula mismatch; do not tune to force agreement.');
  add('abc_b','Person B · poor habits, minimal present symptoms',x=>{
    const weak=input('weak');for(const d of Object.values(weak.drivers))d.function=0;Object.assign(x,weak);
  },{raw:35.48133892335755,candidateBand:'Chaos'},'Expose weak lifestyle foundations without predicting future disease. The numerical Chaos band in a symptom-free example is a calibration concern for founders, not a diagnosis.');
  add('abc_c','Person C · moderate habits, multiple moderate concerns',x=>{
    Object.assign(x,input('mixed'));
    for(const [id,k]of [['c_one','functional_training'],['c_two','holistic_recovery'],['c_three','mentality_realignment']])addFinding(x,id,k,{days:10,intensity:'Moderate',durationDays:75,impact:'Moderately'});
    x.dailyHealthImpact='Moderately';
  },{raw:70,candidateBand:'Dysregulated'},'Founder expects scores close to A/B. Independent declared inputs give H=J=70. Do not call this expected interpretation approved.');
  add('b21_cognitive','Current cognitive ceiling',x=>addFinding(x,'fictional_cognition','neural_repatterning',{domain:'cognitive'}),{candidateBand:'Impaired'},'A qualifying current cognitive finding prevents a better stage than Impaired, even if the arithmetic is high.');
  add('b21_gi','Current gastrointestinal ceiling',x=>addFinding(x,'fictional_gi','gastrointestinal_renovation',{domain:'gastrointestinal'}),{candidateBand:'Dysregulated'},'A qualifying current GI finding prevents a better stage than Dysregulated.');
  add('b21_cognitive_gi','Cognitive + GI simultaneous findings',x=>{
    addFinding(x,'fictional_cognition','neural_repatterning',{domain:'cognitive'});addFinding(x,'fictional_gi','gastrointestinal_renovation',{domain:'gastrointestinal'});
  },{candidateBand:'Dysregulated'},'Apply the most restrictive ceiling, not the first matching rule.');
  add('b21_persistent_rare','Persistent symptom occurring once in 30 days',x=>addFinding(x,'fictional_monthly_symptom','hormone_balancing',{durationDays:180}),{candidateBand:'Impaired',persistentGroups:0},'A symptom is not automatically a condition. Driver-local persistent ceiling remains an explicit optional comparison; duration/frequency are separate facts.');
  add('b21_two_conditions','Two reported conditions older than 90 days',x=>{
    addFinding(x,'condition_one','neural_repatterning',{kind:'reported_condition',conditionId:'fictional_condition_1'});
    addFinding(x,'condition_two','gastrointestinal_renovation',{kind:'reported_condition',conditionId:'fictional_condition_2',durationDays:120});
  },{candidateBand:'Chronic',persistentGroups:2},'Two distinct reported groups >90 days cap the result at Chronic. They are fictional reported conditions, not diagnoses generated by the engine.');
  add('b21_two_conditions_impact','Multiple persistent conditions with daily effects',x=>{
    addFinding(x,'condition_one','neural_repatterning',{kind:'reported_condition',conditionId:'fictional_condition_1',impact:'Slightly'});
    addFinding(x,'condition_two','gastrointestinal_renovation',{kind:'reported_condition',conditionId:'fictional_condition_2',impact:'Moderately'});
  },{candidateBand:'Chaos',persistentGroups:2},'Both distinct groups have negative effects under the provisional each-condition definition.');
  add('b21_one_condition_impact','Two persistent groups, only one affected daily',x=>{
    addFinding(x,'condition_one','neural_repatterning',{kind:'reported_condition',conditionId:'fictional_condition_1',impact:'Slightly'});
    addFinding(x,'condition_two','gastrointestinal_renovation',{kind:'reported_condition',conditionId:'fictional_condition_2'});
  },{candidateBand:'Chronic'},'Default each-condition rule does not call this Chaos. Compare the explicit any-condition proposal and ask founders which meaning is intended.');
  add('b21_same_condition','Two symptoms of the same reported condition',x=>{
    addFinding(x,'manifestation_one','neural_repatterning',{kind:'reported_condition',conditionId:'shared_fictional_condition'});
    addFinding(x,'manifestation_two','gastrointestinal_renovation',{kind:'reported_condition',conditionId:'shared_fictional_condition'});
  },{candidateBand:'Impaired',persistentGroups:1},'Do not count two manifestations of one reported condition as multiple distinct conditions.');
  add('b21_exact_90','Exactly 90 days is not longer than 90',x=>{
    addFinding(x,'condition_one','neural_repatterning',{kind:'reported_condition',conditionId:'fictional_condition_1',durationDays:90});
    addFinding(x,'condition_two','gastrointestinal_renovation',{kind:'reported_condition',conditionId:'fictional_condition_2',durationDays:90});
  },{candidateBand:'Impaired',persistentGroups:0},'Strict >90 boundary; current findings still prevent Peace.');
  add('b21_resolved','Historical/resolved findings',x=>addFinding(x,'past_concern','neural_repatterning',{days:0,resolved:true,kind:'reported_condition',conditionId:'past_condition'}),{raw:100,candidateBand:'Peace'},'Explicit zero current days contributes no current ceiling. Historical source is retained, not treated as a current diagnosis.');
  add('b21_unknown_exact_duration','Insufficient exact duration for condition ceiling',x=>addFinding(x,'condition_unknown','neural_repatterning',{kind:'reported_condition',conditionId:'fictional_condition',durationDays:null}),{candidateBand:null,unknown:true},'A coarse arithmetic band cannot prove whether a condition is >90 days. Classification remains unknown.');
  add('b21_unknown_impact','Unknown overall daily-health impact',x=>x.dailyHealthImpact=null,{candidateBand:null,unknown:true},'Do not assume missing impact means no impact and assign Peace.');
  add('b21_incomplete','Incomplete factual proficiency',x=>x.drivers.the_living_diet.habits[0].proficiency='Unknown',{overall:null},'Unknown is not zero and is not removed from the health denominator.');
  add('b21_conflict','Resolved and current answers conflict',x=>addFinding(x,'conflicting_state','neural_repatterning',{resolved:true}),{overall:null},'Conflict withholds scoring instead of choosing whichever answer produces a preferred result.');
  function answers(test) {
    const x=test.input,rows=[['Pathway / assessed person',`${x.pathway} / ${x.assessmentFor}`],['Overall daily-health effect',x.dailyHealthImpact??'Unknown']];
    for(const [k,label]of base.drivers) {
      if(k==='wise_budgeting'){rows.push([label,`Planning ${x.budget?.planning??'Unknown'}; preparedness ${x.budget?.preparedness??'Unknown'} (separate fictional factual dimensions)`]);continue;}
      const d=x.drivers?.[k];rows.push([label,d?`Habit answers: ${(d.habits||[]).map(h=>`${h.consistency??'Unknown'} / factual ${h.proficiency??'Unknown'} (${h.role})`).join('; ')}. Independent function concern: ${d.function??'Unknown'}. Symptom screen: ${d.symptomScreen}. Daily effect: ${d.dailyHealthImpact??'Unknown'}.`:'Missing']);
    }
    for(const f of x.findings||[])rows.push([f.id,`${f.kind??'Unspecified kind'}; domain ${f.domain??'Unknown'}; ${f.days??'Unknown'} current days; intensity ${f.intensity}; duration ${f.durationDays??'Unknown'} exact days / ${f.duration}; daily impact ${f.impact}; resolved ${f.resolved??'Unknown'}${f.conditionId?'; reported group '+f.conditionId:''}.`]);
    return rows;
  }
  return Object.freeze({input,addFinding,cases,legacyCases:legacy.cases,answers});
});
