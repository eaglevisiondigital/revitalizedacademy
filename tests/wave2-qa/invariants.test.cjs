'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const BASE='fc6737415da36b4306afa0060a525eca2f1131ca',sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const unchanged=paths=>assert.equal(cp.execFileSync('git',['diff','--name-only',BASE,'HEAD','--',...paths],{encoding:'utf8'}).trim(),'');
test('original accepted57case matrix remains exact immutable input',()=>{assert.equal(sha('docs/orchestration/issue-56/ACCEPTANCE_MATRIX.json'),'58671aa98737d77175c452267cf74b432132e7506ed25dc53af2ce903e831746');assert.equal(JSON.parse(fs.readFileSync('docs/orchestration/issue-56/ACCEPTANCE_MATRIX.json')).cases.length,57);});
test('all101baseline identities wording workstreams and owners remain retained',()=>{
 const b=JSON.parse(fs.readFileSync('docs/orchestration/requirements-baseline.json')),r=JSON.parse(fs.readFileSync('docs/orchestration/requirements.json'));assert.equal(b.requirements.length,101);assert.equal(r.requirements.length,101);
 for(const x of b.requirements){const y=r.requirements.find(z=>z.id===x.id);for(const k of ['id','requirement','workstream','ownerIssue'])assert.equal(y[k],x[k]);}assert.equal(new Set(r.requirements.map(x=>x.workstream)).size,10);
});
test('ten accepted inventory details retain false policy/runtime and valid parents',()=>{
 const d=JSON.parse(fs.readFileSync('docs/orchestration/requirements-source-details.json')).details,r=JSON.parse(fs.readFileSync('docs/orchestration/requirements.json')).requirements;assert.equal(d.length,10);
 for(const x of d){assert.equal(x.businessPolicyApproved,false);assert.equal(x.runtimeImplementationCleared,false);assert.equal(x.operationalAcceptance,'NOT_CLAIMED');for(const p of x.parentRequirements)assert(r.some(z=>z.id===p));}
});
test('all Netlify and Supabase Function source families stay unchanged from acceptedbase',()=>unchanged(['netlify/functions','supabase/functions']));
test('migrations and existing authorization source families stay unchanged',()=>unchanged(['supabase/migrations','portal/portal.js','portal/portal-permissions.js','portal/portal.css']));
test('approved asset and style source families stay unchanged',()=>unchanged(['assets','css','member/member110.css','founders.html']));
test('build publish allowlist and Netlify routing stay held and unchanged',()=>unchanged(['config/production-public-files.json','netlify.toml','scripts/build-production-vitality.cjs']));
test('controlling127 source trace remains honestly missing and unreplaced',()=>{
 const text=fs.readFileSync('docs/orchestration/issue-55/127_SECTION_TRACE.csv','utf8');assert.equal(crypto.createHash('sha256').update(text).digest('hex'),'10a58e5a8471a6212a0742787fdca87aaa825a9a6377432a387c012c66b02f6c');assert.equal((text.match(/SOURCE_MISSING/g)||[]).length,127);
});
