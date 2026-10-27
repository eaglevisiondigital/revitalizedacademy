'use strict';
// Local release guard. Inputs must be independently obtained provider metadata and
// the reviewed artifact proof. This does not request a secret, source or job.
const assert=require('node:assert/strict'),G=require('../../js/vitality-roadmap-v2-gate.cjs');
function verify(observed,reviewed,artifact){
 assert.equal(reviewed.site,'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06');assert(/^[a-f0-9]{40}$/.test(reviewed.source));assert(/^[a-f0-9]{24}$/.test(reviewed.deploy||''));
 assert.equal(observed.site,reviewed.site);assert.equal(observed.canonicalDeploy,reviewed.deploy);assert.equal(observed.source,reviewed.source);assert.equal(observed.context,'production');assert.equal(observed.locked,true);
 assert.equal(observed.functions.length,13);assert.equal(new Set(observed.functions.map(f=>f.name)).size,13);assert.equal(observed.functions.find(f=>f.name==='roadmap-processing')?.sha256,reviewed.workerSha256);
 assert.equal(Object.keys(reviewed.retainedFunctions).length,12);for(const[name,sha256]of Object.entries(reviewed.retainedFunctions)){assert.notEqual(name,'roadmap-processing');assert.equal(observed.functions.find(f=>f.name===name)?.sha256,sha256);}
 assert.equal(artifact.source,reviewed.source);assert.equal(artifact.workerSha256,reviewed.workerSha256);assert.equal(artifact.productionEntryOptIn,true);assert.equal(artifact.compiledV2Gate,true);assert.deepEqual(artifact.identity,G.verifyRuleset());
 return{status:'V2_LIVE_ENGINE_VERIFIED',source:observed.source,deploy:observed.canonicalDeploy,...G.verifyRuleset()};
}
module.exports={verify};
if(require.main===module){try{const fs=require('node:fs'),read=p=>JSON.parse(fs.readFileSync(p));const result=verify(...process.argv.slice(2).map(read));console.log(JSON.stringify(result));}catch{console.log('V2_LIVE_ENGINE_BLOCKED');process.exitCode=1;}}
