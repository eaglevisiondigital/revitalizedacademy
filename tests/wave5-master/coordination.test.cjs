'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const gate=require('../../tools/rva-coordination-gate.cjs');
const root=path.resolve(__dirname,'../..'),pinned=gate.baseline(root);
const observation=JSON.parse(fs.readFileSync(path.join(root,'../deployment-evidence/2026-11-01-wave5/NATIVE_OBSERVATION.json')));
const sample=()=>gate.readInputs(root);
const verify=(input,observe=gate.observeWorktree)=>gate.verify(input,pinned,observe,observation);
test('O01 complete local procedure: exact registers, source gaps, dispatch and real worktrees',()=>{
 const r=verify(sample());assert.equal(r.status,'PASS_LOCAL_COORDINATION');assert.equal(r.productionAcceptance,false);assert.equal(r.originalSourceCompleteness,'NOT_ESTABLISHED');
});
for(const [name,file,mutate]of [
 ['renamed requirement ID',gate.FILES[0],j=>j.requirements[0].id='RENAMED'],
 ['rewritten approved wording',gate.FILES[0],j=>j.requirements[0].requirement='Replacement'],
 ['discarded missing-source warning',gate.FILES[0],j=>j.sourceGaps=[]],
 ['discarded source-detail group',gate.FILES[1],j=>j.details.pop()],
 ['invented complete package',gate.FILES[2],j=>j.cases[0].result='PASS']
])test('O01 denies '+name,()=>{const i=sample(),j=JSON.parse(i.files[file]);mutate(j);i.files[file]=Buffer.from(JSON.stringify(j));assert.throws(()=>verify(i));});
test('O01 denies substituted controlling127 trace',()=>{const i=sample();i.files[gate.FILES[3]]=Buffer.from('invented127complete');assert.throws(()=>verify(i));});
test('O01 denies issue creation presented as actual delegation',()=>{const i=sample();i.state.tasks[0].dispatch.kind='github-issue-created';assert.throws(()=>verify(i));});
test('O01 denies arbitrary unknown agent receipt',()=>{const i=sample();i.state.tasks[0].agent='/root/pretend';i.state.tasks[0].dispatch.taskName='/root/pretend';assert.throws(()=>verify(i));});
test('O01 denies consistently forged state and self-declared native observation',()=>{const i=sample();i.state.tasks[0].agent='/root/pretend';i.state.tasks[0].dispatch.taskName='/root/pretend';i.state.nativeObservation.tasks[0]='/root/pretend';assert.throws(()=>verify(i));});
test('O01 requires separate trusted observation input',()=>{assert.throws(()=>gate.verify(sample(),pinned,gate.observeWorktree));});
test('O01 denies real worktree branch mismatch',()=>{const i=sample();i.state.tasks[0].branch='codex/fake';assert.throws(()=>verify(i));});
test('O01 denies source not descending from approved base',()=>{assert.throws(()=>verify(sample(),()=>({branch:'codex/rva-wave5-security-20261101',descendsFromBase:false})));});
test('O01 denies exact or nested lane ownership conflicts',()=>{for(const file of ['member/member110.js','tests/wave5-operations/private.cjs']){const i=sample();i.state.tasks[0].ownedPaths.push(file);assert.throws(()=>verify(i));}});
test('O01 denies ownership path escape',()=>{const i=sample();i.state.tasks[0].ownedPaths.push('../private');assert.throws(()=>verify(i));});
test('O01 denies silent production, financial or Alex scope expansion',()=>{for(const field of ['productionWritesAuthorized','financialActivation','alex']){const i=sample();i.state[field]=field==='alex'?'ACTIVE':true;assert.throws(()=>verify(i));}});
test('O01 retains incomplete source status and draft release hold',()=>{const i=sample();i.state.sourceCompleteness='ALL_VERIFIED';assert.throws(()=>verify(i));const j=sample();j.state.pr59='READY';assert.throws(()=>verify(j));});
