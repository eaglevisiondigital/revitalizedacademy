'use strict';
// Local public-file identity checker. No network, writes, CSS execution or runtime integration.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const ASSETS = [
  'assets/images/justyn-elle-professional-approved-102.png',
  'assets/images/revitalized-logo-dark-approved-v69.png',
  'assets/images/revitalized-logo-light-approved.png',
  'assets/images/revitalized-shield-approved-v69.png',
  'assets/images/revitalized-shield.png'
];
const PROFILES = {
  'public-legacy':'css/styles.css', portal:'portal/portal.css',
  member:'member/member110.css', 'mobile-homepage':'css/homepage-mobile-hero.css'
};
const FOUNDERS = ['founders.html','css/founders103.css'];
const OBSERVED = 'OBSERVED_SOURCE_DECLARATIONS_ONLY';
const APPROVED_ROOT = '../deployment-evidence/2026-10-21-founders-release-preflight/static';

function validate(contract, {repositoryRoot, artifactRoot} = {}) {
  const findings = [], inputs = [];
  const add = (severity, code, reference) => findings.push({severity,code,reference});
  const denied = (condition, code, reference = 'contract') => {
    if (!condition) add('DENIED',code,reference);
  };
  const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const exactSet = (rows, expected, key) => Array.isArray(rows) && rows.length === expected.length &&
    new Set(rows.map(r=>r?.[key])).size === rows.length && expected.every(x=>rows.some(r=>r?.[key]===x));
  if (!contract || typeof contract !== 'object') {
    add('DENIED','invalid_contract','contract');
    return result();
  }
  denied(contract.version === 'rva-issue53-local-design-contract-v1', 'unsupported_contract');
  denied(contract.status === 'LOCAL_VALIDATION_ONLY' && contract.productionEligible === false && contract.claim === OBSERVED, 'scope_or_certification_changed');
  denied(contract.globalTokenNormalization === 'forbidden', 'global_token_normalization_forbidden');
  denied(exactSet(contract.assets, ASSETS, 'path'), 'asset_allowlist_changed');
  denied(exactSet(contract.profiles, Object.keys(PROFILES), 'id') && contract.profiles.every(p=>PROFILES[p.id]===p.path), 'profile_source_changed');
  denied(contract.founders?.approvedRootReference === APPROVED_ROOT && contract.founders?.missingReferencePolicy === 'BLOCKED_NO_RAW_FALLBACK', 'approved_reference_policy_changed');
  denied(exactSet(contract.founders?.files, FOUNDERS, 'path'), 'founders_allowlist_changed');
  const mobile = contract.profiles?.find?.(p=>p?.id==='mobile-homepage');
  denied(mobile?.scope?.maxWidthPx === 600 && mobile?.scope?.unchangedAboveStartsPx === 601, 'mobile_600_601_boundary_changed');
  denied(contract.founders?.responsiveMetadata?.stackMaxWidthPx === 1100 && contract.founders?.responsiveMetadata?.desktopStartsPx === 1101, 'founders_boundary_changed');
  if (findings.length) return result(); // Invalid references are never read.

  // Every descendant must be an ordinary file/directory. Reject symlinks rather
  // than allowing an otherwise allowlisted public path to reach private content.
  function read(root, relative, kind, expected) {
    if (!hex(expected)) { add('DENIED','invalid_expected_hash',kind+':'+relative); return null; }
    if (typeof root !== 'string') { add('BLOCKED','missing_reference_root',kind); return null; }
    const reference = kind+':'+relative;
    let bytes;
    try {
      if (fs.lstatSync(root).isSymbolicLink()) { add('DENIED','symlink_reference',reference); return null; }
      let current = root;
      for (const part of relative.split('/')) {
        current = path.join(current,part);
        if (fs.lstatSync(current).isSymbolicLink()) { add('DENIED','symlink_reference',reference); return null; }
      }
      if (!fs.statSync(current).isFile()) { add('DENIED','not_regular_file',reference); return null; }
      bytes = fs.readFileSync(current);
    } catch (error) {
      add('BLOCKED',error.code === 'ENOENT' ? 'missing_reference' : 'unreadable_reference',reference);
      return null;
    }
    const sha256 = hash(bytes);
    inputs.push({reference,sha256,expectedSha256:expected,match:sha256===expected});
    if (sha256!==expected) add('DENIED','hash_mismatch',reference);
    return bytes;
  }
  for (const asset of contract.assets) read(repositoryRoot,asset.path,'asset',asset.sha256);
  for (const profile of contract.profiles) {
    denied(profile.claim === OBSERVED, 'profile_certification_changed',profile.id);
    denied(Array.isArray(profile.declarations) && profile.declarations.length>0 && profile.declarations.every(x=>typeof x==='string'&&x.length>0), 'invalid_declarations',profile.id);
    const bytes = read(repositoryRoot,profile.path,'profile',profile.sha256);
    if (bytes && Array.isArray(profile.declarations)) {
      for (const declaration of profile.declarations) {
        if (typeof declaration!=='string'||!bytes.toString('utf8').includes(declaration)) add('DENIED','observed_declaration_missing',profile.id);
      }
    }
  }
  for (const file of contract.founders.files) {
    denied(file.origin === 'approved-release-static','wrong_artifact_origin',file.path);
    denied(file.approvedSha256 !== file.inheritedRawSha256,'raw_equals_approved',file.path);
    if (file.origin !== 'approved-release-static') continue;
    read(repositoryRoot,file.path,'inherited-raw',file.inheritedRawSha256);
    read(artifactRoot,file.path,'approved-artifact',file.approvedSha256);
  }
  return result();

  function result() {
    return {
      status: findings.some(f=>f.severity==='BLOCKED') ? 'BLOCKED' : findings.length ? 'DENIED' : 'PASS_LOCAL_OBSERVATION',
      productionEligible:false, computedStylesVerified:false, pixelsVerified:false, liveVerified:false,
      contractSha256:contract ? hash(JSON.stringify(contract)) : null,
      findings, inputs
    };
  }
}
module.exports = {validate,hash};
if (require.main === module) {
  const repositoryRoot = path.resolve(__dirname,'../../../..');
  try {
    const contract = JSON.parse(fs.readFileSync(path.join(__dirname,'approved-design-contract.json'),'utf8'));
    const output = validate(contract,{repositoryRoot,artifactRoot:path.resolve(repositoryRoot,APPROVED_ROOT)});
    process.stdout.write(JSON.stringify(output,null,2)+'\n');
    process.exitCode = output.status === 'PASS_LOCAL_OBSERVATION' ? 0 : 1;
  } catch {
    process.stdout.write(JSON.stringify({status:'BLOCKED',productionEligible:false,findings:[{severity:'BLOCKED',code:'contract_unreadable_or_invalid_json',reference:'approved-design-contract.json'}]})+'\n');
    process.exitCode = 1;
  }
}
