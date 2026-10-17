// Local archives only. Never deploy, invoke Functions, or read environment secrets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const [oldModule, newModule, output, snapshotFile] = process.argv.slice(2);
assert(snapshotFile, 'Usage: node reproduce-functions.mjs OLD_ZISI_MAIN NEW_ZISI_MAIN OUTPUT LIVE_INVENTORY');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const root = process.cwd(), live = JSON.parse(fs.readFileSync(snapshotFile));
const results = {};
for (const [label, module] of [['zisi14', oldModule], ['zisi16', newModule]]) {
  const {zipFunctions} = await import(path.resolve(module));
  const toolPackage = JSON.parse(fs.readFileSync(path.resolve(path.dirname(module), '../package.json')));
  const dir = path.resolve(output, label);
  const bundles = await zipFunctions('netlify/functions', dir, {basePath: root, repositoryRoot: root,
    config: {'*': {nodeBundler: 'esbuild', nodeVersion: '22', nodeModuleFormat: 'esm'},
      'exercise-library': {includedFiles: ['netlify/private-repdb/exercises.json', 'netlify/private-repdb/LICENSE-DATA.md']}}});
  assert.equal(bundles.length, 9);
  results[label] = {tool_version: toolPackage.version,
    tool_package_sha256: hash(fs.readFileSync(path.resolve(path.dirname(module), '../package.json'))),
    functions: bundles.map(f => ({name: f.name, sha256: hash(fs.readFileSync(f.path)),
      bootstrap: f.buildData?.bootstrapVersion ?? f.bootstrapVersion ?? null,
      runtime: f.runtimeVersion, runtime_api: f.runtimeAPIVersion, bundler: f.bundler,
      exact_live_match: hash(fs.readFileSync(f.path)) === live.functions.find(x => x.n === f.name).d}))};
}
fs.mkdirSync(path.join(output, 'exact-live-archives'), {recursive: true});
for (const f of live.functions) {
  const label = ['zisi14','zisi16'].find(k => results[k].functions.some(x => x.name === f.n && x.exact_live_match));
  assert(label, 'No exact archive for ' + f.n + '; do not substitute/redeploy');
  const bytes = fs.readFileSync(path.join(output, label, f.n + '.zip'));
  assert.equal(hash(bytes), f.d);
  fs.writeFileSync(path.join(output, 'exact-live-archives', f.n + '.zip'), bytes);
}
const report = {host: {node: process.version, zlib: process.versions.zlib,
  executable_sha256: hash(fs.readFileSync(process.execPath))},
  target: 'nodejs22.x', config: 'esbuild requested; APIv2 selects nft; esm; pinned RepDB included files',
  results, exact_live_archives: 9, no_publish: true};
fs.writeFileSync(path.join(output, 'reproduction.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({host: report.host, exact_live_archives: 9, matches:
  Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.functions.filter(f => f.exact_live_match).length]))}));
