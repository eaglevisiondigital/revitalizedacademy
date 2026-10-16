/* B2.1 extends the B1/B2 private workspace. No scoring/report mutation API. */
(() => {
  'use strict';
  if (window.RVA_ENV?.environment!=='staging') return;
  const portal=window.RA_PORTAL, engine=window.RVA_ROADMAP_B21, examples=window.RVA_ROADMAP_B21_SCENARIOS,
    base=window.RVA_ROADMAP_B2, registry=window.RVA_ROADMAP_B2_SOURCE_MAP, view=window.RVA_ROADMAP_VIEW;
  const panel=document.getElementById('vitality-assessments-panel');
  if(!panel||!portal?.createAuthenticatedTaskGuard||!engine||!examples||!base||!view||!registry)return;
  const n=view.node, clone=x=>JSON.parse(JSON.stringify(x)), guard=portal.createAuthenticatedTaskGuard();
  const allCases=[...examples.cases,...examples.legacyCases];
  let dialog=null, focusBefore=null, rows=[], control=0, state;
  const fresh=()=>({config:clone(engine.defaultConfig),caseId:examples.cases[0].id,profile:'b21',tab:'case',reviews:{},history:[]});
  state=fresh();
  function button(label,fn){const b=n('button',label);b.type='button';b.onclick=fn;return b;}
  function select(parent,label,options,value){const wrap=n('div'),caption=n('label',label),input=n('select');input.id='b21-control-'+(++control);caption.htmlFor=input.id;for(const [v,t]of options){const o=n('option',t);o.value=v;input.append(o);}input.value=value??'';wrap.append(caption,input);parent.append(wrap);return input;}
  function field(parent,label,value,type='text'){const wrap=n('label',label),input=n(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value??'';if(type==='textarea')input.maxLength=2000;wrap.append(input);parent.append(wrap);return input;}
  function toggle(parent,label,value){const x=field(parent,label,'','checkbox');x.checked=value;return x;}
  function status(parent,text){const p=n('p',text);p.setAttribute('role','status');parent.append(p);return p;}
  const fmt=x=>x===null||x===undefined?'Not calculated':typeof x==='number'?Number(x.toFixed(5)).toString():String(x);
  function close(){guard.cancel();dialog?.remove();dialog=null;focusBefore?.focus();}
  function reset(){close();rows=[];state=fresh();document.querySelectorAll('[data-b21-denial]').forEach(x=>x.remove());}
  document.addEventListener('ra:staff-access-reset',reset);
  async function rpc(name,args,token){const r=await portal.authClient.rpc(name,args);if(!guard.current(token))return null;if(r.error)throw Error('Verified private-health permission and contact scope are required.');return r.data;}
  async function open(){const token=guard.begin();if(!token)return;focusBefore=launch;try{const list=await rpc('list_vitality_roadmap_preparation',{},token);if(!list)return;rows=list;render();}catch(e){if(guard.current(token)){reset();const p=status(panel,e.message);p.dataset.b21Denial='true';}}}
  const launch=button('B2.1 founder calibration · Candidate / Not Approved',open);launch.id='roadmap-b21-launch';panel.prepend(launch);
  function current(){return allCases.find(c=>c.id===state.caseId);}
  function calculate(test){return state.profile==='legacy'?base.calculate(test.input):engine.calculate(test.input,state.config);}
  function render(){
    dialog?.remove();dialog=n('div',undefined,'roadmap-dialog roadmap-b21-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','B2.1 fictional founder calibration');dialog.tabIndex=-1;
    const closeButton=button('Close B2.1 calibration',close);closeButton.className='roadmap-close';dialog.append(closeButton);
    const main=n('main',undefined,'roadmap-workspace roadmap-b21-workspace');dialog.append(main);document.body.append(dialog);dialog.focus();
    main.append(n('h1','B2.1 founder calibration'),n('p','Candidate / Not Approved · Fictional cases only · Approval, release and email delivery held','roadmap-notice'),n('p','This coaching comparison is not a diagnosis, medical prediction or approved client report. Actual completed questionnaires remain coverage-only.'));
    const nav=n('nav',undefined,'roadmap-tabs');nav.setAttribute('aria-label','B2.1 sections');
    for(const [key,label]of [['case','Fictional answers & Roadmap'],['rules','Candidate rules & definitions'],['review','Corrections & review packet'],['source','Actual source · Unscored']]){const b=button(label,()=>{state.tab=key;render();});b.setAttribute('aria-pressed',String(state.tab===key));nav.append(b);}main.append(nav);
    const section=n('section');section.dataset.b21Section=state.tab;main.append(section);
    if(state.tab==='case')renderCase(section);
    if(state.tab==='rules')renderRules(section);
    if(state.tab==='review')renderReview(section);
    if(state.tab==='source')renderSource(section);
  }
  function choose(parent){
    const profile=select(parent,'Scoring comparison version',[['b21','B2.1 · October 15 founder direction'],['legacy','B2 · Original reference (superseded weights/budget penalty)']],state.profile);
    profile.onchange=()=>{state.profile=profile.value;render();};
    const caseSelect=select(parent,'Fictional assessment',allCases.map(c=>[c.id,(c.id.startsWith('b21_')||c.id.startsWith('abc_')?'B2.1 · ':'B2 archive · ')+c.label]),state.caseId);
    caseSelect.onchange=()=>{state.caseId=caseSelect.value;render();};
  }
  function renderCase(host){
    choose(host);const test=current(),result=calculate(test);host.append(n('p',`Configuration ${result.configVersion} · comparison revision ${state.config.revision}`));
    const grid=n('div',undefined,'roadmap-b21-grid'),answers=n('section'),roadmap=n('section');grid.append(answers,roadmap);host.append(grid);
    answers.append(n('h2','Original fictional answers'),n('p',test.questionnaireNotice||'Archived B2 synthetic inputs; no real participant answers.'));
    const dl=n('dl',undefined,'roadmap-b21-answers');for(const [q,a]of examples.answers(test))dl.append(n('dt',q),n('dd',a));answers.append(dl);
    roadmap.append(n('h2','Provisional Roadmap · Not Approved'));
    const overall=result.overall;
    const facts=n('dl');for(const [label,value]of [['Direct health arithmetic',overall?.raw],['Displayed health',overall?.displayScore],['Numerical starting band',overall?.startingBand],['Provisional Health Spectrum',overall?.candidateBand],['Separate Wise Budgeting',result.budget?.index]])facts.append(n('dt',label),n('dd',fmt(value)));roadmap.append(facts);
    roadmap.append(n('p',state.profile==='b21'?'Wise Budgeting has zero health deduction and never contributes to health ceilings.':'Archived B2 includes the superseded budget deduction. It is preserved for comparison only.'));
    if(!overall)status(roadmap,'Overall withheld: incomplete, conflicting or unsupported evidence.');
    for(const r of overall?.restrictions||[])roadmap.append(n('p',`${r.rule} → at best ${r.ceiling}. ${r.why}`));
    for(const u of overall?.unknown||[])roadmap.append(n('p','Needs information: '+u));
    for(const i of result.issues||[])roadmap.append(n('p','Input issue: '+i));
    const expected=n('aside',undefined,'roadmap-notice');expected.append(n('h3','Independent founder expectation'),n('p',test.independentExpectation||test.explanation),n('p','Declared arithmetic / restriction contract: '+JSON.stringify(test.expected)));roadmap.append(expected);
    if(test.id.startsWith('abc_')){const comparison=n('details');comparison.append(n('summary','A/B/C calibration gap · No automatic tuning'));const scores=Object.fromEntries(examples.cases.filter(x=>x.id.startsWith('abc_')).map(x=>[x.id,calculate(x).overall?.raw]));comparison.append(n('p',`Declared examples: A ${fmt(scores.abc_a)}, B ${fmt(scores.abc_b)}, C ${fmt(scores.abc_c)}. Founder direction asks for A slightly higher and all three close. The current formula does not cluster these inputs; no approved maximum spread/ranges exist. This is a calibration discrepancy for review.`));roadmap.append(comparison);}
    const drivers=n('section');drivers.append(n('h2','All twelve Driver calculations'));host.append(drivers);
    for(const [k,label]of base.drivers){const d=result.drivers[k],card=n('details',undefined,'roadmap-driver');card.dataset.b21Driver=k;card.append(n('summary',`${label}: ${fmt(d?.displayScore??d?.score)} · ${d?.candidateStage||'Stage not calculated'} · Candidate`));
      if(d){const facts=n('dl');for(const [key,value]of [['Weight',d.weight],['Lifestyle (L)',d.L?.score],['Symptom burden (B)',d.B?.score],['Independent function (F)',d.F],['Worst concern (P)',d.P],['Driver exponent',d.alpha],['Unrounded result',d.score],['Color (independent of stage)',d.color],['Candidate Spectrum',d.candidateStage]])facts.append(n('dt',key),n('dd',fmt(value)));card.append(facts,n('p',d.formula||''),n('p','Evidence references: '+(d.evidenceRefs||[]).join(', ')));for(const issue of [...(d.issues||[]),...(d.spectrum?.unknown||[])])card.append(n('p','Needs information: '+issue));for(const r of d.spectrum?.restrictions||[])card.append(n('p',`${r.ceiling} ceiling: ${r.why}`));}else card.append(n('p','Driver evidence unavailable.'));drivers.append(card);}
    for(const key of ['strengths','priorities','opportunities']){const details=n('details');details.append(n('summary',`Candidate ${key} · Evidence and WHY`));for(const r of result.rankings[key])details.append(n('p',`${r.order}. ${r.driver}: ${r.why}`),n('p','Evidence: '+r.evidenceRefs.join(', ')));details.append(n('p','These are numeric comparison rankings, not approved causal symptom–habit links or client advice.'));host.append(details);}
    const trace=n('details');trace.append(n('summary','Full fictional calculation trace'),n('pre',JSON.stringify(result,null,2),'roadmap-b2-json'));host.append(trace);
  }
  function renderRules(host){
    host.append(n('h2','Versioned candidate rules'),n('p','All thresholds below are disclosed engineering interpretations for fictional comparison, not approved qualifying definitions. Revisions are session-only; B2 and the founder source stay immutable.'));
    const form=n('form',undefined,'roadmap-editor'), reads=[];host.append(form);
    const addNumber=(parent,label,value,set,nullable=false)=>{const x=field(parent,label,value,'number');x.step='any';reads.push(c=>{const value=x.value.trim()===''?(nullable?null:NaN):Number(x.value);set(c,value);});return x;};
    for(const [key,label]of [['concernPeak','Worst-concern weight'],['lifestyleMean','Mean-lifestyle weight'],['healthExponent','Overall concern exponent'],['symptomBreadth','Secondary symptom breadth factor']])addNumber(form,label,state.config.math[key],(c,v)=>c.math[key]=v);
    for(const [k,label]of base.drivers){const group=n('details',undefined,'roadmap-driver');group.append(n('summary',label+' · Weight, bands and requirements'));form.append(group);
      if(k==='wise_budgeting')group.append(n('p','Weight 1.0, separate indicator only. No health impact or deduction.'));
      else{addNumber(group,'Weight · '+label,state.config.driverWeights[k],(c,v)=>c.driverWeights[k]=v);addNumber(group,'Alpha · '+label,state.config.math.driverAlpha[k],(c,v)=>c.math.driverAlpha[k]=v,true);}
      for(let i=0;i<5;i++)addNumber(group,engine.stages[i]+' minimum · '+label,state.config.driverBands[k][i].minimum,(c,v)=>c.driverBands[k][i].minimum=v);
      if(k!=='wise_budgeting'){
        for(const [key,title]of [['peaceSymptomFree','No qualifying symptoms for Peace'],['peaceNoImpact','No negative daily impact for Peace']]){const x=toggle(group,title+' · '+label,state.config.driverRules[k][key]);reads.push(c=>c.driverRules[k][key]=x.checked);}
        addNumber(group,'Optional Peace lifestyle minimum · '+label,state.config.driverRules[k].peaceLifestyleMinimum,(c,v)=>c.driverRules[k].peaceLifestyleMinimum=v,true);
        const ceiling=select(group,'Persistent finding ceiling · '+label,[['','Not proposed'],...engine.stages.map(x=>[x,x])],state.config.driverRules[k].persistentCeiling);reads.push(c=>c.driverRules[k].persistentCeiling=ceiling.value||null);
      }
    }
    const overall=n('fieldset');overall.append(n('legend','Overall numerical bands (95 vs 90 remains unresolved)'));form.append(overall);for(let i=0;i<5;i++)addNumber(overall,'Overall '+engine.stages[i]+' minimum',state.config.overallBands[i].minimum,(c,v)=>c.overallBands[i].minimum=v);
    const defs=n('fieldset');defs.append(n('legend','Unapproved qualification definitions'));form.append(defs);
    const int=select(defs,'Minimum current intensity',Object.keys(base.intensities).map(x=>[x,x]),state.config.definitions.minimumIntensity);reads.push(c=>c.definitions.minimumIntensity=int.value);
    addNumber(defs,'Minimum current days in 30',state.config.definitions.minimumDays,(c,v)=>c.definitions.minimumDays=v);
    const impact=select(defs,'Negative daily-effect threshold',Object.keys(base.impacts).filter(x=>x!=='Not at all').map(x=>[x,x]),state.config.definitions.negativeImpact);reads.push(c=>c.definitions.negativeImpact=impact.value);
    const kind=select(defs,'Persistent groups count as',[['reported_condition','Distinct reported conditions (not inferred diagnoses)'],['reported_diagnosis','Reported diagnoses only'],['symptoms_or_conditions','Symptoms or reported conditions (comparison)']],state.config.definitions.chronicKind);reads.push(c=>c.definitions.chronicKind=kind.value);
    addNumber(defs,'Persistence strictly longer than days',state.config.definitions.persistentDays,(c,v)=>c.definitions.persistentDays=v);
    addNumber(defs,'Minimum distinct persistent groups',state.config.definitions.multipleCount,(c,v)=>c.definitions.multipleCount=v);
    const chaos=select(defs,'Chaos daily-effect interpretation',[['each_condition','At least two groups each negatively affected'],['any_condition','At least one of multiple groups affected']],state.config.definitions.chaosImpact);reads.push(c=>c.definitions.chaosImpact=chaos.value);
    for(const [key,label]of [['peace','Peace symptom/impact eligibility'],['cognitive','Cognitive Impaired ceiling'],['gastrointestinal','GI Dysregulated ceiling'],['chronic','Multiple persistent-group Chronic ceiling'],['chaos','Multiple persistent groups + impact Chaos'],['legacyBreadthCaps','Preserve legacy Red-Driver breadth caps (proposal)']]){const x=toggle(defs,label,state.config.rules[key]);reads.push(c=>c.rules[key]=x.checked);}
    const reason=field(form,'Reason for comparison change','','textarea'),feedback=status(form,'No saved policy changes.');
    form.append(button('Apply B2.1 comparison revision',()=>{try{if(!reason.value.trim())throw Error('Explain this comparison change.');const next=clone(state.config);for(const read of reads)read(next);next.revision++;engine.config(next);state.history.push({revision:next.revision,reason:reason.value.trim(),type:'candidate_only_not_audit_signoff'});state.config=next;state.tab='case';state.profile='b21';render();}catch(e){feedback.textContent=e.message;}}));
    const pending=n('section');pending.append(n('h3','Exact founder decisions still needed'));for(const q of engine.questions)pending.append(n('p',q));host.append(pending);
    form.onsubmit=e=>e.preventDefault();
  }
  function renderReview(host){
    host.append(n('h2','Fictional case corrections'),n('p','Use fictional cases only. Do not paste real participant information here. This packet is a proposal, not authenticated signoff, an immutable audit record or a published knowledge-base update. No external AI service is used.'));
    const test=current(),r=state.reviews[test.id]||{decision:'pending',reason:'',expectedScore:'',expectedStage:'',interpretation:'',rankings:'',knowledgeBase:'',evidenceRefs:''};state.reviews[test.id]=r;
    host.append(n('h3',test.label));const decision=select(host,'Founder comparison decision',[['pending','Not reviewed'],['agree','Agree for candidate testing'],['disagree','Disagree'],['needs_information','Need more information']],r.decision);decision.onchange=()=>r.decision=decision.value;
    for(const [key,label,type]of [['reason','Reason / independent judgment','textarea'],['expectedScore','Independent expected health score (optional)','number'],['interpretation','Incorrect interpretation / proposed correction','textarea'],['rankings','Strengths, priorities or opportunities correction','textarea'],['knowledgeBase','Proposed reusable knowledge-base update','textarea'],['evidenceRefs','Fictional evidence references (comma-separated)','text']]){const x=field(host,label,r[key],type);x.oninput=()=>r[key]=x.value;}
    const expectedStage=select(host,'Independently expected Spectrum (optional)',[['','No expected stage supplied'],...engine.stages.map(x=>[x,x])],r.expectedStage);expectedStage.onchange=()=>r.expectedStage=expectedStage.value;
    const feedback=status(host,'No case decisions are automatically saved or approved.');
    host.append(button('Download B2.1 fictional review packet',()=>{try{
      const reviews=[];for(const [id,entry]of Object.entries(state.reviews)){
        if(entry.decision==='pending'&&!Object.entries(entry).some(([k,v])=>k!=='decision'&&String(v).trim()))continue;
        if(!entry.reason.trim())throw Error('Every entered correction or decision needs an independent reason.');
        if(entry.expectedScore.trim()!==''&&(!Number.isFinite(Number(entry.expectedScore))||Number(entry.expectedScore)<0||Number(entry.expectedScore)>100))throw Error('Expected score must be 0–100 or blank.');
        const test=allCases.find(c=>c.id===id),allowed=new Set([id,...base.health,...(test.input.findings||[]).map(f=>f.id),...Object.values(test.input.drivers||{}).flatMap(d=>(d.habits||[]).map(h=>h.id))]);
        const refs=entry.evidenceRefs.split(',').map(x=>x.trim()).filter(Boolean);if(refs.some(x=>!allowed.has(x)))throw Error('References must name this fictional case, a Driver, habit or finding.');
        if((entry.interpretation.trim()||entry.rankings.trim()||entry.knowledgeBase.trim())&&!refs.length)throw Error('Corrections and knowledge-base proposals require fictional evidence references.');
        reviews.push({caseId:id,...clone(entry),evidenceRefs:refs});
      }
      const payload={type:'b21_fictional_review',schemaVersion:1,policyApproved:false,releaseEligible:false,authenticatedSignoff:false,config:clone(state.config),configCanonical:base.stable(state.config),comparisonHistory:clone(state.history),reviews,knowledgeBaseCandidates:reviews.filter(r=>r.knowledgeBase.trim()).map(r=>({caseId:r.caseId,version:'proposal-1',status:'separate_approval_required',text:r.knowledgeBase,evidenceRefs:r.evidenceRefs,reason:r.reason,changesScoring:false}))};
      const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=n('a');a.href=url;a.download='roadmap-b21-fictional-review.json';a.click();URL.revokeObjectURL(url);feedback.textContent='Fictional candidate packet downloaded. No actual source answers included. No rules or reports changed.';
    }catch(e){feedback.textContent=e.message;}}));
  }
  function renderSource(host){
    host.append(n('h2','Actual source review · No participant scoring'),n('p','The B2 source-coverage boundary is preserved. Selecting a real source never invokes the B2.1 calculator or copies answers to the fictional review packet.'));
    const pick=select(host,'Authorized source for coverage only',[['','Select a source'],...rows.map(r=>[r.report_id,r.participant_name||'Completed source'])],'');const output=n('section');host.append(output);
    pick.onchange=async()=>{output.replaceChildren();if(!pick.value)return;const token=guard.begin();if(!token)return;try{const c=await rpc('get_vitality_roadmap_preparation',{p_report_id:pick.value},token);if(!c||!output.isConnected)return;const mapped=base.sourceMapping({...c.source,questionnaire_version:c.questionnaire_version},registry);output.append(n('p','Overall: not calculated. All real-source scores and stages withheld.','roadmap-notice'));for(const [k,label]of base.drivers){const card=n('details',undefined,'roadmap-driver');card.append(n('summary',label+' · Needs information'),n('p',mapped.drivers[k].missing.join('; ')));for(const obs of mapped.drivers[k].observations)card.append(n('p',`${obs.label}: ${obs.values.join(', ')} · ${obs.reason}`));output.append(card);}}catch(e){if(guard.current(token)&&output.isConnected)status(output,e.message);}};
  }
  document.addEventListener('keydown',e=>{if(!dialog)return;if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const fields=[...dialog.querySelectorAll('button,input,textarea,select,a[href]')].filter(x=>!x.disabled&&x.getClientRects().length),first=fields[0],last=fields.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
})();
