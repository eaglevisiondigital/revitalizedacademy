const {test}=require('node:test'),assert=require('node:assert/strict');
const B6=require('../js/vitality-roadmap-b6-private-comparison.cjs');
const B5=require('../js/vitality-roadmap-b5-contract.js');
const registry=require('../config/roadmap-b4/source-map.json');
function synthetic(){return {status:'completed',pathway:'Adult',assessment_for:'Myself',questionnaire_version:'secure-snapshot-v1',answers:{assessment_for:[{type:'radio',checked:true,value:'Myself'}],water_intake_consistency:[{value:'Never'}]}};}
const inspect=s=>B6.projectAuthorizedSource(s,registry,{registryFingerprint:B5.pins.registry,accessVerifiedByServer:true});
test('synthetic questionnaire projection retains source and withholds unsupported scoring',()=>{
 const s=synthetic(),before=JSON.stringify(s),p=inspect(s);
 assert.equal(JSON.stringify(s),before);
 assert.equal(Object.keys(p.drivers).length,12);
 assert.equal(p.systemScore,null);assert.equal(p.systemStage,null);assert.equal(p.budgetHealthDeduction,0);
 assert.deepEqual(p.drivers.cellular_hydration.questions.find(q=>q.questionId==='water_intake_consistency').selectedAnswers,['Never']);
});
test('manual review cannot create fake numerical agreement',()=>{
 const r=B6.compareWithFounder(inspect(synthetic()),{expectedScore:65,expectedStage:'Impaired',reason:'Testing the fictional rubric'});
 assert.equal(r.system.score,null);assert.equal(r.numericalDelta,null);assert.equal(r.saved,false);
});
test('provenance and eligibility are held',()=>{
 assert.equal(inspect(synthetic()).sourceRevisionVerified,false);
 assert.equal(inspect({...synthetic(),pathway:'Child'}).sourceEligibility,'ineligible_or_historical');
 assert.throws(()=>B6.projectAuthorizedSource(synthetic(),registry,{registryFingerprint:'wrong',accessVerifiedByServer:true}));
});