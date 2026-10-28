'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const P=require('../js/vitality-roadmap-processing.cjs'),V=require('../js/vitality-roadmap-founder-voice.cjs');
const G=require('../js/vitality-roadmap-v2-gate.cjs'),F=require('../js/vitality-roadmap-founder-direction.cjs');
const {processOne,createHandler}=require('../netlify/lib/roadmap-processing.cjs');
const {cases,set}=require('./fixtures/founder-voice.cjs'),golden=require('./fixtures/founder-voice-default-hashes.json');
const {fictional}=require('./fixtures/roadmap-narrative.cjs');
const options={founderDirection:true,founderVoice:V.VERSION},voice=c=>P.buildDraft(c,options),base=c=>P.buildDraft(c,{founderDirection:true});
for(const {id,context}of cases())test('fictional case: '+id+' — voice and preservation contracts',()=>{
  const source=JSON.stringify(context),old=base(context),oldHash=P.digest(old),d=voice(context);
  assert.equal(oldHash,golden.digests[id]);assert.equal(P.digest(old),oldHash);assert.equal(JSON.stringify(context),source);
  assert(V.verifyDocument(d));assert(G.verifyDocument(d,context));assert.deepEqual(d.narrative.presentation,V.metadata());
  for(const k of ['sourceFingerprint','pins','sourceRevision','questionWording','calculation','coverage','componentTraces','review'])assert.deepEqual(d[k],old[k],k);
  assert.deepEqual(d.roadmap.founderComparison,old.roadmap.founderComparison);
  assert.deepEqual(d.narrative.founderDirection,old.narrative.founderDirection);
  assert.deepEqual(d.narrative.generationGate,old.narrative.generationGate);
  for(const [key,x]of Object.entries(d.roadmap.drivers)){
    const b=old.roadmap.drivers[key];assert.deepEqual(x.founderDirections,b.founderDirections);assert.deepEqual(x.findings,b.findings);assert.deepEqual(x.evidence,b.evidence);
    assert.deepEqual(x.sections.recommendedNextSteps,b.sections.recommendedNextSteps);
    assert.deepEqual({...d.drivers[key],interpretation:null},{...old.drivers[key],interpretation:null});
    assert(!x.sections.whyThisMatters.includes('Founder coaching direction to evaluate'));
    assert(!x.sections.whyThisMatters.includes('Your stated 90-day goal:'));
  }
  assert.deepEqual(d.roadmap.priorities.map(x=>x.driver),old.roadmap.priorities.map(x=>x.driver));
  assert.deepEqual(d.roadmap.phases.map(x=>[x.window,x.evidence,x.methodologySource,x.focus.map(f=>[f.directionId,f.evidence])]),old.roadmap.phases.map(x=>[x.window,x.evidence,x.methodologySource,x.focus.map(f=>[f.directionId,f.evidence])]));
});
test('all12 have distinct relevant framing, concrete original steps and human transitions',()=>{
 const d=voice(fictional());assert.equal(Object.keys(d.roadmap.drivers).length,12);
 assert.equal(new Set(Object.values(d.roadmap.drivers).map(d=>d.sections.whyThisMatters)).size,12);
 assert(d.roadmap.summary.includes('Let’s use that goal'));assert.equal((Object.values(d.roadmap.drivers).map(d=>d.sections.whyThisMatters).join('\n').match(/SYNTHETIC: enjoy/g)||[]).length,0);
 assert.deepEqual(d.roadmap.phases.map(p=>p.title),['Choose a starting point','Review how it fits your week','Return to your goal']);
 for(const p of d.roadmap.phases)for(const focus of p.focus){const direction=d.roadmap.drivers[focus.driver].founderDirections.find(a=>a.id===focus.directionId);assert(focus.action.includes(direction.text));}
 assert.equal(V.metadata().newMethodologyDirections,0);assert.equal(F.manifest.rules.flatMap(r=>r.actions).length,45);assert.equal(F.ruleHash,G.HASH);
});
test('own symptom details remain independent; no severity, impact, days or diagnosis invented',()=>{
 const d=voice(cases().find(c=>c.id==='separate-symptom-details').context),text=d.roadmap.drivers.cellular_hydration.sections.whatYourAnswersSuggest;
 assert(text.includes('“Dry lips”, without a frequency response'));assert(text.includes('“Muscle cramping” at a frequency of “Often”'));
 assert(text.includes('“Barely noticeable”'));assert(text.includes('“2–3 months”'));
 for(const trace of d.componentTraces.symptoms){assert.equal(trace.intensity.value,null);assert.equal(trace.dailyImpact.value,null);assert.equal(trace.burden.value,null);}
});
test('conflicting selections are explicit, never resolved by a confident personal conclusion',()=>{
 const d=voice(cases().find(c=>c.id==='conflicting-selections').context),s=d.roadmap.drivers.cellular_hydration.sections;
 assert(s.whatYourAnswersSuggest.includes('Your selections need clarification'));
 assert(s.whatYourAnswersSuggest.includes('won’t treat either as a settled answer'));
 assert(!s.whatYourAnswersSuggest.includes('You reported “Muscle cramping” at a frequency'));
});
test('missing evidence offers no invented strengths, goals, directions or outcomes',()=>{
 const d=voice(cases().find(c=>c.id==='missing-evidence').context);assert.equal(d.roadmap.priorities.length,0);
 for(const x of Object.values(d.roadmap.drivers)){assert(x.sections.whatYourAnswersSuggest.includes('enough usable information'));assert.equal(x.sections.recommendedNextSteps.length,0);assert.equal(x.founderDirections.length,0);}
 assert(d.roadmap.phases.every(p=>p.focus.length===0));assert(!JSON.stringify(d.roadmap).includes('SYNTHETIC: enjoy'));
});
test('high disruption is prioritized and safety holds contain no routine next steps or plan',()=>{
 const high=voice(cases().find(c=>c.id==='high-disruption').context);assert(high.roadmap.drivers.cellular_hydration.sections.whatYourAnswersSuggest.includes('disruption that deserves attention'));
 const held=voice(cases().find(c=>c.id==='existing-safety-hold').context);assert.equal(held.roadmap.phases.length,0);assert.equal(held.roadmap.relationships.length,0);assert.equal(held.roadmap.actions.length,0);
 for(const x of Object.values(held.roadmap.drivers)){assert.equal(x.sections.recommendedNextSteps.length,0);assert.equal(x.founderDirections.length,0);assert(x.sections.whyThisMatters.includes('safety review takes priority'));}
});
test('four connections retain both cited sources and are explicitly noncausal',()=>{
 const c=cases().find(c=>c.id==='cross-driver-context').context,d=voice(c),old=base(c);assert.equal(d.roadmap.relationships.length,4);
 d.roadmap.relationships.forEach((r,i)=>{assert.deepEqual(r.evidence,old.roadmap.relationships[i].evidence);assert(r.provisional);assert(r.reason.includes('don’t tell us that one caused the other'));assert.equal(r.drivers.length,2);});
});
test('conditional recommendations and medication holds are unchanged, with zero corpus imports',()=>{
 const d=voice(cases().find(c=>c.id==='conditional-and-untrusted-text').context),actions=Object.values(d.roadmap.drivers).flatMap(d=>d.founderDirections);
 assert(!actions.some(a=>/estrogen supporting|increased sweating|lower dosages/.test(a.text)));
 assert.equal(d.narrative.founderDirection.deferredDirections.filter(a=>a.status==='owner_decision_required').length,3);
 const implementation=fs.readFileSync('js/vitality-roadmap-founder-voice.cjs','utf8');assert(!/readFile|fetch\(|SOURCE_MANIFEST|source_originals|CANDIDATE_REGISTER/.test(implementation));
});
test('source isolation and per-Driver counterfactuals change actual personal prose',()=>{
 const fields={cellular_hydration:'water_intake_consistency',systemic_detoxification:'walking_regularity',electrobiology_rhythms:'sleep_wake_consistency',the_living_diet:'eating_eat_slowly_enough_to_chew_thoroughly',functional_training:'training_program',holistic_recovery:'recovery_behavior_regular_sleep_schedule',gastrointestinal_renovation:'fermented_foods',hormone_balancing:'hormone_pathway',neural_repatterning:'challenging_learning',momentum_regimens:'daily_habit_consistency',mentality_realignment:'self_talk',wise_budgeting:'wellness_budget'};
 const registry=require('../config/roadmap-b4/source-map.json');
 for(const[key,id]of Object.entries(fields)){const a=fictional(),b=fictional();set(a,id,registry.fields[id].options[0]);set(b,id,registry.fields[id].options.at(-1));assert.notEqual(voice(a).roadmap.drivers[key].summary,voice(b).roadmap.drivers[key].summary,key);}
 const a=fictional(),b=fictional();a.source_fingerprint='a'.repeat(64);b.source_fingerprint='b'.repeat(64);set(a,'ninety_day_goal','FICTIONAL SOURCE ONE');set(b,'ninety_day_goal','FICTIONAL SOURCE TWO');
 assert(!JSON.stringify(voice(b)).includes('SOURCE ONE'));assert(!JSON.stringify(voice(a)).includes('SOURCE TWO'));assert.throws(()=>G.verifyDocument(voice(a),b));
});
test('trusted worker opts in before sealing; read never claims, revoices or loads private signing identity',async()=>{
 const c=fictional(),calls=[];let saved;
 await processOne('fictional',async action=>{calls.push(action);return action==='claim'?{claimed:true,context:c,previous_reviews:[]}:{};},async(j,l,d)=>{calls.push('seal');saved=d;return 'fictional';},options);
 assert.deepEqual(calls,['claim','seal','finish','read']);assert(V.verifyDocument(saved));assert(G.verifyDocument(saved,c));
 const noClaim=[];await processOne('fictional',async action=>{noClaim.push(action);return{claimed:false};},()=>{throw Error('No sealing');},options);assert.deepEqual(noClaim,['claim','read']);
 const requests=[],handler=createHandler({...options,identity:()=>{throw Error('Read cannot access signer');},fetch:async(url,init)=>{requests.push(JSON.parse(init.body).p_action);return Response.json({document:{unchanged:true}});}});
 const req=body=>new Request('https://revitalizedacademy.com/.netlify/functions/roadmap-processing',{method:'POST',headers:{origin:'https://revitalizedacademy.com',authorization:'Bearer fictional.token','content-type':'application/json'},body:JSON.stringify(body)});
 const ctx={site:{id:'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06'},deploy:{context:'production'}},body={action:'read',report:'00000000-0000-4000-8000-000000000001',payload:{}};
 assert.deepEqual(await(await handler(req(body),ctx)).json(),{document:{unchanged:true}});assert.deepEqual(requests,['read']);
 assert.equal((await handler(req({...body,founderVoice:V.VERSION}),ctx)).status,400);assert.equal((await handler(req({...body,payload:{founderVoice:V.VERSION}}),ctx)).status,400);
 assert.deepEqual(requests,['read']);
});
test('invalid opt-in fails before claim and defaults remain unchanged',async()=>{
 assert.throws(()=>voice({...fictional(),registry_fingerprint:'wrong'}));
 assert.throws(()=>P.buildDraft(fictional(),{founderVoice:V.VERSION}));assert.throws(()=>P.buildDraft(fictional(),{...options,personalized:false}));
 assert.throws(()=>createHandler({...options,founderVoice:'unknown'}));let claims=0;await assert.rejects(()=>processOne('fictional',()=>{claims++;},{},{...options,founderVoice:'unknown'}));assert.equal(claims,0);
 assert.equal(base(fictional()).narrative.presentation,undefined);
});
test('voice presentation is pure, deterministic, idempotent and rejects an unknown presentation identity',()=>{
 assert.deepEqual(require('../tools/founder-methodology/pin-voice.cjs').verify(),V.metadata());
 const A=require('../js/vitality-roadmap-b6-adapter.cjs'),N=require('../js/vitality-roadmap-narrative.cjs'),c=fictional(),observed=A.observe(c),original=F.compose(observed,N.build(observed)),hash=P.digest(original);
 const once=V.present(original,observed),twice=V.present(once,observed);assert.deepEqual(twice,once);assert.equal(P.digest(original),hash);
 const wrong=structuredClone(once);wrong.presentation.hash='0'.repeat(64);assert.throws(()=>V.present(wrong,observed));
 const doc=voice(c);doc.narrative.presentation.version='unknown';assert.throws(()=>V.verifyDocument(doc));
});
test('renderer preserves premium layout, three tabs, citation corrections and collapsed diagnostics',async()=>{
 const d=voice(cases().find(c=>c.id==='conditional-and-untrusted-text').context),before=P.digest(d),dom=new JSDOM('<main/>',{runScripts:'outside-only',url:'https://revitalizedacademy.com/portal/'});let control;
 try{
  dom.window.eval(fs.readFileSync('js/vitality-roadmap-view.js','utf8'));dom.window.eval(fs.readFileSync('portal/portal-roadmap-processing.js','utf8'));
  const host=dom.window.document.querySelector('main');control=dom.window.RVA_ROADMAP_PROCESSING.mount(host,{report:'fictional',actorId:'fictional-founder',reviewOnly:true,onReconnect:()=>{},request:async()=>({document:d,revision:2,version_id:'fictional-r2',reviews:[],review_only:true,expires_at:new Date(Date.now()+600000).toISOString()})});await control.start();
  assert.equal(host.querySelectorAll('.roadmap-driver').length,12);assert.equal(host.querySelectorAll('.roadmap-phase').length,3);assert.equal(host.querySelectorAll('[data-founder-review]').length,12);assert.equal(host.querySelectorAll('input:checked').length,0);
  assert.equal(host.querySelector('[data-founder-diagnostics]').open,false);assert.equal(host.querySelectorAll('[data-comparison-driver]').length,12);assert.equal(host.querySelectorAll('img,[onerror]').length,0);
  assert(host.textContent.includes('<img src=x onerror=alert(1)>'));assert.equal(P.digest(d),before);
 }finally{control?.stop();dom.window.close();}
 const proposal={driver:'cellular_hydration',decision:'needs_adjustment',rationale:'FICTIONAL source-grounded correction',interpretation:'FICTIONAL exact founder correction',citations:['water_intake_consistency']};
 const revised=P.applyReviews(d,[proposal]);assert.equal(P.digest(d),before);assert.equal(revised.roadmap.drivers.cellular_hydration.founderProposal.interpretation,proposal.interpretation);assert(G.verifyDocument(revised,cases().find(c=>c.id==='conditional-and-untrusted-text').context));assert(V.verifyDocument(revised));
 assert.throws(()=>P.validateReview({...proposal,citations:['another_client_field']},d));
});
