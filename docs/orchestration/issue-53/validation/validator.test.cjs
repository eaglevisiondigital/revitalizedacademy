'use strict';
// Fictional bytes only; temporary roots are removed after every test.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {validate,hash} = require('./validator.cjs');
const template = require('./approved-design-contract.json');
const clone = value => JSON.parse(JSON.stringify(value));
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'rva-issue53-fictional-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const roots = {repositoryRoot:path.join(temp,'repository'),artifactRoot:path.join(temp,'approved-artifacts')};
  const contract = clone(template);
  function put(root,relative,bytes) {const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);return file;}
  for (const [i,asset] of contract.assets.entries()) {const b=Buffer.from('FICTIONAL public asset '+i);asset.sha256=hash(b);put(roots.repositoryRoot,asset.path,b);}
  for (const profile of contract.profiles) {const b=Buffer.from('/* FICTIONAL source declarations */\n'+profile.declarations.join(';\n'));profile.sha256=hash(b);put(roots.repositoryRoot,profile.path,b);}
  for (const file of contract.founders.files) {
    const raw=Buffer.from('FICTIONAL historical raw '+file.path),approved=Buffer.from('FICTIONAL approved artifact '+file.path);
    file.inheritedRawSha256=hash(raw);file.approvedSha256=hash(approved);
    put(roots.repositoryRoot,file.path,raw);put(roots.artifactRoot,file.path,approved);
  }
  return {roots,contract,put,run:()=>validate(contract,roots)};
}
test('valid fictional public hashes and distinct surface profiles pass only local observation',t=>{
  const f=fixture(t),r=f.run();assert.equal(r.status,'PASS_LOCAL_OBSERVATION');assert.equal(r.inputs.length,13);
  for (const key of ['productionEligible','computedStylesVerified','pixelsVerified','liveVerified']) assert.equal(r[key],false);
});
test('mutated public asset is denied',t=>{
  const f=fixture(t);f.put(f.roots.repositoryRoot,f.contract.assets[0].path,'FICTIONAL mutated');
  const r=f.run();assert.equal(r.status,'DENIED');assert(r.findings.some(x=>x.code==='hash_mismatch'));
});
test('wrong profile source is rejected before reading references',t=>{
  const f=fixture(t);f.contract.profiles[0].path='portal/portal.css';const r=f.run();assert.equal(r.status,'DENIED');assert.equal(r.inputs.length,0);
});
test('using historical raw root as approved overlay is denied',t=>{
  const f=fixture(t);f.roots.artifactRoot=f.roots.repositoryRoot;const r=f.run();assert.equal(r.status,'DENIED');assert(r.findings.some(x=>x.reference==='approved-artifact:founders.html'&&x.code==='hash_mismatch'));
});
test('missing approved artifact is BLOCKED with no raw fallback',t=>{
  const f=fixture(t);fs.unlinkSync(path.join(f.roots.artifactRoot,'founders.html'));
  const r=f.run();assert.equal(r.status,'BLOCKED');assert(r.findings.some(x=>x.reference==='approved-artifact:founders.html'&&x.code==='missing_reference'));
  assert(!r.inputs.some(x=>x.reference==='approved-artifact:founders.html'));assert(fs.existsSync(path.join(f.roots.repositoryRoot,'founders.html')));
});
test('missing approved root is explicitly BLOCKED',t=>{
  const f=fixture(t);delete f.roots.artifactRoot;assert.equal(f.run().status,'BLOCKED');
});
test('artifact origin cannot silently become inherited raw',t=>{
  const f=fixture(t);f.contract.founders.files[0].origin='inherited-raw';const r=f.run();assert.equal(r.status,'DENIED');assert(r.findings.some(x=>x.code==='wrong_artifact_origin'));
});
for (const scope of [{maxWidthPx:601,unchangedAboveStartsPx:602},{maxWidthPx:600,unchangedAboveStartsPx:600}]) {
  test('600/601 boundary metadata rejects '+JSON.stringify(scope),t=>{
    const f=fixture(t);f.contract.profiles.find(p=>p.id==='mobile-homepage').scope=scope;const r=f.run();assert.equal(r.status,'DENIED');assert(r.findings.some(x=>x.code==='mobile_600_601_boundary_changed'));
  });
}
test('600/601 metadata does not claim computed cascade or pixel acceptance',t=>{
  const f=fixture(t),r=f.run();assert.equal(r.status,'PASS_LOCAL_OBSERVATION');assert.equal(r.computedStylesVerified,false);assert.equal(r.pixelsVerified,false);
});
test('implicit global normalization is forbidden and source profiles remain distinct',t=>{
  const f=fixture(t);assert.notDeepEqual(f.contract.profiles[0].declarations,f.contract.profiles[1].declarations);
  f.contract.globalTokenNormalization='normalize-to-portal';const r=f.run();assert.equal(r.status,'DENIED');assert(r.findings.some(x=>x.code==='global_token_normalization_forbidden'));
});
test('changed declaration source is denied even if caller updates the file hash',t=>{
  const f=fixture(t),p=f.contract.profiles[0],bytes=Buffer.from('FICTIONAL normalized-to-portal');
  f.put(f.roots.repositoryRoot,p.path,bytes);p.sha256=hash(bytes);const r=f.run();assert.equal(r.status,'DENIED');assert(r.findings.some(x=>x.code==='observed_declaration_missing'));
});
test('unexpected or traversal references are denied without reading them',t=>{
  const f=fixture(t);f.contract.assets[0].path='../../private';const r=f.run();assert.equal(r.status,'DENIED');assert.equal(r.inputs.length,0);
});
test('symlink references are denied without reading target bytes',t=>{
  const f=fixture(t),p=f.contract.assets[0].path,file=path.join(f.roots.repositoryRoot,p);fs.unlinkSync(file);
  fs.symlinkSync(path.join(f.roots.repositoryRoot,f.contract.assets[1].path),file);const r=f.run();assert.equal(r.status,'DENIED');assert(r.findings.some(x=>x.code==='symlink_reference'));assert(!r.inputs.some(x=>x.reference==='asset:'+p));
});
test('missing ordinary asset cannot be reported as successful',t=>{
  const f=fixture(t);fs.unlinkSync(path.join(f.roots.repositoryRoot,f.contract.assets[0].path));assert.equal(f.run().status,'BLOCKED');
});
test('validator leaves every fictional input byte unchanged',t=>{
  const f=fixture(t);const before=f.run().inputs.map(x=>({...x})),after=f.run().inputs;assert.deepEqual(after,before);
});
