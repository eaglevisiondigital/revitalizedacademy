'use strict';
// Offline only. Inputs are a GET-only inventory and approved release/build evidence.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict');
const c = require('./release-contract.cjs');
function prepare({snapshotFile, priorFile, candidateDir, baselineDir, outputDir}) {
  const snapshot = JSON.parse(fs.readFileSync(snapshotFile));
  const prior = JSON.parse(fs.readFileSync(priorFile));
  const candidate = {}, rollback = {}, artifacts = {};
  for (const p of c.PATHS) {
    candidate[p] = fs.readFileSync(path.join(candidateDir, p.slice(1)));
    rollback[p] = fs.readFileSync(path.join(baselineDir, p.slice(1)));
  }
  const review = c.makeRelease(snapshot, prior.body, candidate, rollback);
  // Every other current public byte must match, except Netlify's blocked historical
  // config artifact. Preserve that opaque digest; never replace it from source.
  function walk(dir, relative = '') {
    for (const entry of fs.readdirSync(path.join(dir, relative), {withFileTypes: true})) {
      const name = path.join(relative, entry.name);
      assert(!entry.isSymbolicLink());
      if (entry.isDirectory()) walk(dir, name);
      else {
        const p = '/' + name.toLowerCase();
        assert(!artifacts[p], 'Case collision');
        const bytes = fs.readFileSync(path.join(dir, name));
        artifacts[p] = {sha1: c.digest(bytes, 'sha1'), sha256: c.digest(bytes)};
      }
    }
  }
  walk(candidateDir);
  c.assertBuildManifest(artifacts, review.body.files);
  review.build_manifest = artifacts;
  review.build_manifest_sha256 = c.digest(c.canonical(artifacts));
  review.stage_body = {...structuredClone(review.body), draft: true};
  review.stage_body_sha256 = c.digest(c.canonical(review.stage_body));
  review.opaque_retained_artifact = {path: '/netlify.toml', sha1: prior.body.files['/netlify.toml'],
    sha256: null, reason: 'Historical config bytes not publicly served (HTTP404); API digest retained verbatim. Rebuilt config is NOT uploaded.'};
  review.preserved_functions = snapshot.functions;
  const root = path.resolve(__dirname, '../..');
  review.source_tree = cp.execFileSync('git', ['rev-parse', c.REPAIR + '^{tree}'], {cwd: root, encoding: 'utf8'}).trim();
  review.baseline_source_tree = cp.execFileSync('git', ['rev-parse', c.B5 + '^{tree}'], {cwd: root, encoding: 'utf8'}).trim();
  review.published_file_sha256 = Object.fromEntries(Object.entries(artifacts).map(([p, v]) =>
    [p, p === '/netlify.toml' ? null : v.sha256]));
  fs.mkdirSync(outputDir, {recursive: true});
  for (const p of c.PATHS) for (const [folder, files] of [['release-files', candidate], ['rollback-files', rollback]]) {
    const target = path.join(outputDir, folder, p.slice(1));
    fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, files[p]);
  }
  fs.writeFileSync(path.join(outputDir, 'static-release.json'), JSON.stringify(review, null, 2) + '\n');
  return review;
}
if (require.main === module) {
  const [snapshotFile, priorFile, candidateDir, baselineDir, outputDir] = process.argv.slice(2);
  assert(outputDir, 'Usage: node prepare-static-review.cjs SNAPSHOT PRIOR_RELEASE CANDIDATE_DIST BASELINE_DIST OUTPUT');
  const root = path.resolve(__dirname, '../..');
  assert.equal(cp.execFileSync('git', ['rev-parse', c.REPAIR], {cwd: root, encoding: 'utf8'}).trim(), c.REPAIR);
  // B5.2 adds tooling/docs only; deployed application must remain exactly PR39.
  assert.equal(cp.execFileSync('git', ['diff', c.REPAIR, '--name-only', '--', 'portal', 'netlify', 'js', 'config', 'supabase', 'netlify.toml', 'package.json', 'package-lock.json', '.github',
    'scripts/build-production-vitality.cjs', 'scripts/prepare-repdb.cjs',
    ':(exclude).github/workflows/b52-release-contract.yml'], {cwd: root, encoding: 'utf8'}).trim(), '');
  const r = prepare({snapshotFile, priorFile, candidateDir, baselineDir, outputDir});
  console.log(JSON.stringify({source: r.app_source_sha, changed: r.static_changes.length, preserved: r.unchanged_paths,
    functions: r.functions_reused_by_digest, body_sha256: r.body_sha256, build_sha256: r.build_manifest_sha256, NOT_EXECUTED: true}));
}
module.exports = {prepare};
