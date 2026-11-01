'use strict';
// Independent LOCAL structural package; trusted tool observation is a separate input.
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),base='38f086792addaa9b131cecaf261ef21f89f5ffc7';
const files=['docs/orchestration/requirements.json','docs/orchestration/requirements-source-details.json','docs/orchestration/issue-56/ACCEPTANCE_MATRIX.json','docs/orchestration/issue-55/127_SECTION_TRACE.csv'];
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
function inputs(){return {state:JSON.parse(fs.readFileSync(path.join(root,'../academy-wave7-integration/docs/orchestration/wave7-state.json'))),files:Object.fromEntries(files.map(p=>[p,fs.readFileSync(path.join(root,p),'utf8')]))};}
const observation=JSON.parse(fs.readFileSync(path.join(root,'../deployment-evidence/2026-11-01-wave7/NATIVE_OBSERVATION.json')));
function verify(input,trusted){
 for(const f of files)a.equal(digest(input.files[f]),digest(cp.execFileSync('git',['show',base+':'+f],{cwd:root})),f+' source drift');
 const r=JSON.parse(input.files[files[0]]).requirements;a.equal(r.length,101);a.equal(new Set(r.map(x=>x.id)).size,101);a.equal(new Set(r.map(x=>x.workstream)).size,10);a.equal(JSON.parse(input.files[files[1]]).details.length,10);a.equal(JSON.parse(input.files[files[2]]).cases.length,57);
 const s=input.state;a.equal(s.base,base);a.equal(s.wave,7);a.equal(s.productionWritesAuthorized,false);a.equal(s.financialActivation,false);a.equal(s.sourcePushed,false);a.match(s.alex,/^PAUSED/);a.match(s.pr59,/DRAFT.*NO_GO/);a.match(s.sourceCompleteness,/PARTIAL.*127.*gap/);
 a.equal(trusted?.source,'native-tool-observation');a.equal(s.tasks.length,4);a.deepEqual(s.tasks.map(t=>t.agent).sort(),trusted.tasks.slice().sort());const owned=[];
 for(const t of s.tasks){a.equal(t.baseSha,base);a.equal(t.dispatch.kind,'native-spawn-result');a.equal(t.dispatch.taskName,t.agent);a.equal(cp.execFileSync('git',['branch','--show-current'],{cwd:t.worktree,encoding:'utf8'}).trim(),t.branch);a.equal(cp.spawnSync('git',['merge-base','--is-ancestor',base,'HEAD'],{cwd:t.worktree}).status,0);a.ok(t.ownedPaths.length);for(const p of t.ownedPaths){a.ok(!path.isAbsolute(p)&&!p.split('/').includes('..')&&!p.startsWith('.git'));for(const o of owned)a.ok(!(p===o||p.endsWith('/')&&o.startsWith(p)||o.endsWith('/')&&p.startsWith(o)),'overlapping ownership');owned.push(p);}}
 return {status:'PASS_LOCAL_STRUCTURAL_ONLY',requirements:101,details:10,packages:57,productionAcceptance:false};
}
test('O01 entire local structural definition: exact source gaps, actual dispatch/worktrees, ownership and no production scope',()=>a.equal(verify(inputs(),observation).status,'PASS_LOCAL_STRUCTURAL_ONLY'));
for(const [label,mutate]of[
 ['count-preserving requirement rewrite',x=>{const r=JSON.parse(x.files[files[0]]);r.requirements[0].title='invented';x.files[files[0]]=JSON.stringify(r);}],
 ['renamed stable ID',x=>{const r=JSON.parse(x.files[files[0]]);r.requirements[0].id+='-different';x.files[files[0]]=JSON.stringify(r);}],
 ['discarded source detail',x=>{x.files[files[1]]='{"details":[]}';}],
 ['invented original 127 source',x=>{x.files[files[3]]+='invented approved section\n';}],
 ['consistent applicant task/dispatch forgery',x=>{x.state.tasks[0].agent='/root/imaginary';x.state.tasks[0].dispatch.taskName='/root/imaginary';}],
 ['issue creation pretending to dispatch',x=>{x.state.tasks[0].dispatch.kind='github-issue-created';}],
 ['ownership overlap',x=>{x.state.tasks[1].ownedPaths.push(x.state.tasks[0].ownedPaths[0]);}],
 ['ownership escape',x=>{x.state.tasks[0].ownedPaths.push('../private');}],
 ['wrong actual worktree branch',x=>{x.state.tasks[0].branch+='-false';}],
 ['production permission',x=>{x.state.productionWritesAuthorized=true;}],
 ['financial activation',x=>{x.state.financialActivation=true;}],
 ['Alex resumed',x=>{x.state.alex='ACTIVE';}],
 ['business completeness implied',x=>{x.state.sourceCompleteness='COMPLETE';}]
])test('O01 rejects '+label,()=>{const x=inputs();mutate(x);a.throws(()=>verify(x,observation));});
test('O01 rejects missing separate trusted observation',()=>a.throws(()=>verify(inputs(),null)));
module.exports={verify,inputs,observation};
