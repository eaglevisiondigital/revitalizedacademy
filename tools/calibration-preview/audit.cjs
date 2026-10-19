'use strict';
// Read-only source checks and fictional arithmetic. No database/network client.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const baseline='a0e4692c5954ec21c1de7517ed706cf71b86a15c';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function audit(){
 const files=execFileSync('git',['ls-tree','-r','--name-only',baseline],{cwd:root,encoding:'utf8'}).trim().split('\n');
 const changed=[];
 const existing=new Set(files);
 const delta=execFileSync('git',['diff','--name-only',baseline],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
 for(const file of delta)if(existing.has(file)&&file!=='CURRENT_BUILD_STATE.md')changed.push(file);
 const originalHistory=execFileSync('git',['show',baseline+':CURRENT_BUILD_STATE.md'],{cwd:root,maxBuffer:64*1024*1024});
 assert(fs.readFileSync(path.join(root,'CURRENT_BUILD_STATE.md')).subarray(0,originalHistory.length).equals(originalHistory),'Build history must be append-only');
 for(const file of files)assert(fs.existsSync(path.join(root,file)),'Existing file removed: '+file);
 assert.deepEqual(changed,[],'Existing platform files must remain byte-identical');
 const publicFiles=require('../../config/production-public-files.json');
 assert(!publicFiles.some(f=>f.startsWith('tools/')),'Local tools must not enter public build');
 const functions=files.filter(f=>/^netlify\/functions\/[^/]+\.(mjs|mts)$/.test(f));
 assert.equal(functions.length,9);
 const engine=require('../../js/vitality-roadmap-b21-engine.js'),cases=require('../../js/vitality-roadmap-b5-cases.cjs');
 assert.equal(cases.length,50);
 const results=cases.map(c=>{
  const original=JSON.stringify(c.input),r=engine.calculate(c.input);
  assert.equal(JSON.stringify(c.input),original,'Fixture mutation');
  assert.deepEqual(r,engine.calculate(c.input),'Nondeterministic result');
  assert.equal(r.releaseEligible,false);assert.equal(r.policyApproved,false);
  if(r.budget)assert.equal(r.budget.deduction,0);
  return {id:c.id,raw:r.overall?.raw??null,candidate_stage:r.overall?.candidateBand??null,
   drivers:Object.fromEntries(Object.entries(r.drivers||{}).map(([k,d])=>[k,{score:d.score,weight:d.weight,candidate_stage:d.candidateStage??null}])),
   approved:false,source_linked:false};
 });
 for(const[id,expected]of[['abc_a',70.65971946180456],['abc_b',35.481338923357555],['abc_c',70]])assert(Math.abs(results.find(r=>r.id===id).raw-expected)<1e-9);
 const pins=require('../../config/roadmap-b6/pins.json');
 for(const[file,hash]of Object.entries(pins.artifacts))assert.equal(sha(fs.readFileSync(path.join(root,file))),hash,'B6 source pin drift: '+file);
 return {baseline,existing_files:files.length,unchanged_platform_files:files.filter(f=>f!=='CURRENT_BUILD_STATE.md').length,build_history_append_only:true,
  new_public_assets:0,function_sources_preserved:functions.length,existing_migrations_changed:0,engine:engine.defaultConfig.version,
  original_v014_python_verified:false,original_eight_examples_reproduced:false,model_mixing:false,
  actual_participant_scores_computed:0,fictional_cases:results};
}
if(require.main===module){const out=path.join(__dirname,'generated');fs.mkdirSync(out,{recursive:true});const r=audit();fs.writeFileSync(path.join(out,'preservation-and-calculations.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({...r,fictional_cases:r.fictional_cases.length}));}
module.exports={audit};
