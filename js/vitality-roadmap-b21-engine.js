/* B2.1 fictional calibration only. B1 remains the server release authority. */
(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./vitality-roadmap-b2-engine.js') : root.RVA_ROADMAP_B2);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RVA_ROADMAP_B21 = api;
})(typeof window === 'object' ? window : globalThis, base => {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  const freeze = x => { Object.values(x).forEach(v => { if (v && typeof v === 'object') freeze(v); }); return Object.freeze(x); };
  const stages = ['Peace', 'Impaired', 'Dysregulated', 'Chronic', 'Chaos'];
  const bands = [95, 80, 60, 40, 0].map((minimum, i) => ({label: stages[i], minimum}));
  const weights = {cellular_hydration:1.4, neural_repatterning:1.4, systemic_detoxification:1.4, gastrointestinal_renovation:1.4,
    hormone_balancing:1.3, the_living_diet:1.3, holistic_recovery:1.3, mentality_realignment:1.3,
    electrobiology_rhythms:1.2, functional_training:1.2, momentum_regimens:1.1, wise_budgeting:1};
  const questions = [
    'Peace threshold: retain 95 or use 90? What minimum habits/proficiency and daily-impact requirements apply per Driver?',
    'What makes a current symptom qualifying: minimum intensity, days/frequency and impact? How should historical/resolved findings be verified?',
    'Does Chronic count distinct reported conditions, reported diagnoses only, or symptoms? How are multiple symptoms of one condition deduplicated?',
    'Does Chaos require negative impact from each chronic condition, any one, or an overall impact measure? Is the multiple-chronic-symptoms statement Driver-local?',
    'Does a persistent but infrequent symptom over 90 days cap its Driver at Chronic? Which Drivers and severity/impact thresholds?',
    'When ceilings overlap, confirm the most restrictive applies; define escalation/safety review separately from coaching classifications.',
    'For fictional A/B/C, what numerical spread counts as close, and which expected ranges/ordering should be independently approved?',
    'Approve the remaining factual habit rubrics, primary symptom ownership, source conversions, alpha/breadth/ranking rules and curated symptom–habit links before a real-source pilot.'
  ];
  const defaultConfig = freeze({
    version:'b2.1-founder-20261015-v1', revision:0, derivedFrom:'b2-candidate-1',
    source:{pr:27, commit:'c5b3c27bf951b7ca4dbabd92ed50126b571dce39', document:'VITALITY-ROADMAP-JUSTYN-SCORING-RESPONSE-20261015.md', consentDirection:'B2.1 instruction supersedes prior optional-checkbox suggestion; no new consent control'},
    math:{...clone(base.defaultConfig), budgetMaxDeduction:0}, driverWeights:weights,
    overallBands:bands, driverBands:Object.fromEntries(base.drivers.map(([k]) => [k, clone(bands)])),
    definitions:{minimumIntensity:'Mild', minimumDays:1, negativeImpact:'Slightly', chronicKind:'reported_condition',
      persistentDays:90, multipleCount:2, chaosImpact:'each_condition'},
    rules:{peace:true, cognitive:true, gastrointestinal:true, chronic:true, chaos:true, legacyBreadthCaps:true},
    driverRules:Object.fromEntries(base.drivers.map(([k]) => [k,{peaceSymptomFree:k!=='wise_budgeting', peaceNoImpact:k!=='wise_budgeting', peaceLifestyleMinimum:null, persistentCeiling:null}]))
  });
  function finite(x, lo, hi) { return typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi; }
  function validateBands(x) {
    if (!Array.isArray(x) || x.length !== 5 || x.some((b,i) => b.label !== stages[i] || !finite(b.minimum,0,100) || (i && b.minimum >= x[i-1].minimum)) || x[4].minimum !== 0) throw Error('Provide five strictly descending numerical bands ending in Chaos 0.');
  }
  function config(input = defaultConfig) {
    const c = clone(input);
    if (c.version !== defaultConfig.version || c.derivedFrom !== defaultConfig.derivedFrom || !Number.isInteger(c.revision) || c.revision < 0 || c.revision > 100000) throw Error('Unknown candidate version/revision.');
    c.math = base.config(c.math);
    if (c.math.budgetMaxDeduction !== 0) throw Error('B2.1 prohibits a health deduction for Wise Budgeting.');
    validateBands(c.overallBands);
    for (const [k] of base.drivers) {
      if (!finite(c.driverWeights?.[k],0.1,5) || (k==='wise_budgeting' && c.driverWeights[k] !== 1)) throw Error('Invalid explicit Driver weights.');
      validateBands(c.driverBands?.[k]);
      const r = c.driverRules?.[k];
      if (!r || typeof r.peaceSymptomFree !== 'boolean' || typeof r.peaceNoImpact !== 'boolean' || !(r.peaceLifestyleMinimum===null || finite(r.peaceLifestyleMinimum,0,100)) || !(r.persistentCeiling===null || stages.includes(r.persistentCeiling))) throw Error('Invalid Driver-specific candidate requirements.');
      if (k==='wise_budgeting' && (r.peaceSymptomFree || r.peaceNoImpact || r.peaceLifestyleMinimum!==null || r.persistentCeiling!==null)) throw Error('Budget indicator must not use health symptom/impact restrictions.');
    }
    const d=c.definitions;
    if (!d || !Object.hasOwn(base.intensities,d.minimumIntensity) || !Object.hasOwn(base.impacts,d.negativeImpact) || d.negativeImpact==='Not at all' || !Number.isInteger(d.minimumDays) || !finite(d.minimumDays,1,30) || !finite(d.persistentDays,1,36500) || !Number.isInteger(d.persistentDays) || !Number.isInteger(d.multipleCount) || !finite(d.multipleCount,2,20) || !['reported_condition','reported_diagnosis','symptoms_or_conditions'].includes(d.chronicKind) || !['each_condition','any_condition'].includes(d.chaosImpact)) throw Error('Invalid provisional qualifying definitions.');
    for (const key of Object.keys(defaultConfig.rules)) if (typeof c.rules?.[key] !== 'boolean') throw Error('Invalid provisional rule toggle.');
    // Source provenance is immutable. Edits are candidate comparisons, not new approvals.
    if (base.stable(c.source)!==base.stable(defaultConfig.source)) throw Error('Candidate source provenance cannot be changed.');
    return c;
  }
  const band = (score, boundaries) => score===null ? null : boundaries.find(b => score>=b.minimum)?.label || null;
  const restrict = (a,b) => a===null ? null : stages.indexOf(a)>stages.indexOf(b) ? a : b;
  function evidence(input, c) {
    const current=[], unknown=[], contradictions=[];
    const unique=new Map((Array.isArray(input.findings)?input.findings:[]).filter(f=>f&&typeof f==='object').map(f=>[f.id,f]));
    for (const f of unique.values()) {
      if (!f || typeof f!=='object') continue; // base calculator rejects malformed findings.
      if (f.days===0) { if (f.resolved===false) { /* zero can be intermittent historical, not a diagnosis */ } continue; }
      if (f.resolved===true) { contradictions.push(f.id+': resolved with nonzero current days'); continue; }
      if (!Number.isInteger(f.days) || !Object.hasOwn(base.intensities,f.intensity)) {unknown.push(f.id+': current frequency/intensity unknown'); continue;}
      if (f.days<c.definitions.minimumDays || base.intensities[f.intensity]<base.intensities[c.definitions.minimumIntensity]) continue;
      if (f.resolved!==false || !['cognitive','gastrointestinal','other'].includes(f.domain) || !['symptom','reported_condition','reported_diagnosis'].includes(f.kind)) {unknown.push(f.id+': resolution/domain/kind unknown'); continue;}
      current.push(f);
    }
    return {current, unknown:[...new Set(unknown)], contradictions};
  }
  function persistent(records, c) {
    const byId=new Map(), unknown=[];
    for (const r of records) {
      const applicable=c.definitions.chronicKind==='symptoms_or_conditions' || r.kind==='reported_diagnosis' || (c.definitions.chronicKind==='reported_condition' && r.kind==='reported_condition');
      if (!applicable) continue;
      if (!Number.isInteger(r.durationDays) || !finite(r.durationDays,0,36500)) {unknown.push(r.id+': exact duration days unknown'); continue;}
      if (r.durationDays<=c.definitions.persistentDays) continue;
      const id=r.kind==='symptom'?r.id:r.conditionId;
      if (typeof id!=='string' || !id.trim()) {unknown.push(r.id+': distinct condition identity unknown'); continue;}
      const entry=byId.get(id)||{id,records:[]};entry.records.push(r);byId.set(id,entry);
    }
    return {groups:[...byId.values()], unknown};
  }
  function spectrum(score, reds, input, c, ev) {
    const startingBand=band(score,c.overallBands), restrictions=[], unknown=[], chronic=persistent(ev.current,c);
    if (c.rules.legacyBreadthCaps && reds>=3) restrictions.push({rule:'legacy_red_breadth', ceiling:reds>=6?'Chronic':'Dysregulated', why:`${reds} Red health Drivers; legacy B2 proposal, budget excluded.`});
    if (c.rules.peace && startingBand==='Peace') {
      if (ev.current.length || (Object.hasOwn(base.impacts,input.dailyHealthImpact) && base.impacts[input.dailyHealthImpact]>=base.impacts[c.definitions.negativeImpact])) restrictions.push({rule:'peace_eligibility',ceiling:'Impaired',why:'Qualifying current finding or negative overall daily-health impact blocks Peace.'});
      else if (!Object.hasOwn(base.impacts,input.dailyHealthImpact)) unknown.push('Peace: overall daily-health impact unknown');
    }
    if (c.rules.cognitive && ev.current.some(r=>r.domain==='cognitive')) restrictions.push({rule:'cognitive',ceiling:'Impaired',why:'Qualifying fictional cognitive finding; not a diagnosis.'});
    if (c.rules.gastrointestinal && ev.current.some(r=>r.domain==='gastrointestinal')) restrictions.push({rule:'gastrointestinal',ceiling:'Dysregulated',why:'Qualifying fictional gastrointestinal finding; not a diagnosis.'});
    if (c.rules.chronic || c.rules.chaos) unknown.push(...chronic.unknown);
    const multiple=chronic.groups.length>=c.definitions.multipleCount;
    if (c.rules.chronic && multiple) restrictions.push({rule:'persistent_multiple',ceiling:'Chronic',why:`${chronic.groups.length} distinct qualifying reported groups >${c.definitions.persistentDays} days under ${c.definitions.chronicKind}. No condition is inferred.`});
    if (c.rules.chaos && multiple) {
      const impact=chronic.groups.map(g=>({id:g.id,known:g.records.every(r=>Object.hasOwn(base.impacts,r.impact)),negative:g.records.some(r=>Object.hasOwn(base.impacts,r.impact)&&base.impacts[r.impact]>=base.impacts[c.definitions.negativeImpact])}));
      const qualify=c.definitions.chaosImpact==='each_condition'?impact.filter(g=>g.negative).length>=c.definitions.multipleCount:impact.some(g=>g.negative);
      if (qualify) restrictions.push({rule:'multiple_persistent_impact',ceiling:'Chaos',why:`Multiple persistent groups with ${c.definitions.chaosImpact==='each_condition'?'each qualifying group':'at least one qualifying group'} reporting negative daily effects; provisional coaching classification only.`});
      else if (impact.some(g=>!g.known)) unknown.push('Chaos: daily impact of qualifying groups unknown');
    }
    if (['peace','cognitive','gastrointestinal','chronic','chaos'].some(k=>c.rules[k])) unknown.push(...ev.unknown);
    let candidateBand=startingBand;
    for (const r of restrictions) candidateBand=restrict(candidateBand,r.ceiling);
    return {startingBand,candidateBand:unknown.length?null:candidateBand,supportedCeiling:restrictions.reduce((a,r)=>a===null?r.ceiling:restrict(a,r.ceiling),null),restrictions,unknown:[...new Set(unknown)],qualificationCount:ev.current.length,persistentGroupCount:chronic.groups.length,approvedStage:null,status:unknown.length?'needs_information':'provisional_not_approved'};
  }
  function driverSpectrum(k,d,input,c,ev) {
    if (d.score===null) return {candidateStage:null,startingBand:null,unknown:['Driver evidence incomplete'],restrictions:[]};
    const start=band(d.score,c.driverBands[k]), r=c.driverRules[k], restrictions=[], unknown=[];
    if (k==='wise_budgeting') return {candidateStage:start,startingBand:start,unknown:[],restrictions:[],scope:'separate budget indicator; never a health classification'};
    const findings=ev.current.filter(f=>f.owner===k);
    if (start==='Peace') {
      if (r.peaceSymptomFree && findings.length) restrictions.push({ceiling:'Impaired',why:'Current qualifying finding blocks proposed Driver Peace.'});
      if (r.peaceSymptomFree) unknown.push(...ev.unknown.filter(x=>input.findings.some(f=>f.owner===k&&x.startsWith(f.id+':'))));
      const impact=input.drivers?.[k]?.dailyHealthImpact;
      if (r.peaceNoImpact && !Object.hasOwn(base.impacts,impact)) unknown.push('Driver daily-health impact unknown');
      else if (r.peaceNoImpact && base.impacts[impact]>=base.impacts[c.definitions.negativeImpact]) restrictions.push({ceiling:'Impaired',why:'Negative Driver daily-health impact blocks proposed Peace.'});
      if (r.peaceLifestyleMinimum!==null && d.L.score<r.peaceLifestyleMinimum) restrictions.push({ceiling:'Impaired',why:'Lifestyle below explicitly proposed Peace minimum.'});
    }
    if (r.persistentCeiling) {
      for (const f of findings) {
        if (!Number.isInteger(f.durationDays)||!finite(f.durationDays,0,36500)) unknown.push(f.id+': exact duration unknown');
        else if (f.durationDays>c.definitions.persistentDays) restrictions.push({ceiling:r.persistentCeiling,why:'Explicit Driver-local persistent finding proposal; frequency need not be daily.'});
      }
    }
    return {candidateStage:unknown.length?null:restrictions.reduce((v,x)=>restrict(v,x.ceiling),start),startingBand:start,unknown,restrictions,approvedStage:null};
  }
  function calculate(input, settings) {
    const c=config(settings), out=base.calculate(input,c.math);
    out.configVersion=c.version;out.configSnapshot=c;out.configCanonical=base.stable(c);out.definitionQuestions=questions;
    out.mode='b21_fictional_calibration';out.approvedStage=null;
    out.budget=out.budget?{...out.budget,deduction:0,appliedToHealth:false,weight:1}:null;
    if(!input||!Array.isArray(input.findings)||out.issues.length)return out;
    const ev=evidence(input||{},c);
    if (ev.contradictions.length) {out.issues.push(...ev.contradictions);out.overall=null;for(const d of Object.values(out.drivers)){d.score=null;d.displayScore=null;d.color=null;d.candidateStage=null;d.coverage='conflicting_evidence';}out.rankings={strengths:[],priorities:[],opportunities:[]};return out;}
    for (const [k,d] of Object.entries(out.drivers)) {
      d.weight=c.driverWeights[k];d.spectrum=driverSpectrum(k,d,input,c,ev);d.candidateStage=d.spectrum.candidateStage;
      d.stageMapping='versioned_candidate_numerical_bands_plus_explicit_requirements';
    }
    if (out.overall) {
      const all=base.health.map(k=>out.drivers[k]), W=all.reduce((s,d)=>s+d.weight,0),highest=Math.max(...all.map(d=>d.weight));
      const meanP=all.reduce((s,d)=>s+d.weight*d.P,0)/W,meanL=all.reduce((s,d)=>s+d.weight*d.L.score,0)/W,G=Math.max(...all.map(d=>d.weight/highest*(100-d.L.score)));
      const clamp=x=>Math.min(100,Math.max(0,x));
      const H=clamp(100-(c.math.concernPeak*Math.max(...all.map(d=>d.P))+(1-c.math.concernPeak)*meanP)),J=clamp(c.math.lifestyleMean*meanL+(1-c.math.lifestyleMean)*(100-G));
      const raw=H===0||J===0?0:Math.pow(H,c.math.healthExponent)*Math.pow(J,1-c.math.healthExponent),score=base.roundHalfUp(raw),redCount=all.filter(d=>d.color==='Red').length;
      out.overall={raw,H,J,meanP,meanL,G,totalWeight:W,stagingScore:score,displayScore:score,redCount,...spectrum(score,redCount,input,c,ev),coverage:'candidate_health_math; budget_excluded'};
    }
    return out;
  }
  return Object.freeze({defaultConfig, config, calculate, weights:defaultConfig.driverWeights, stages, questions, band, restrict, evidence, persistent, legacyConfig:freeze(clone(base.defaultConfig))});
});
