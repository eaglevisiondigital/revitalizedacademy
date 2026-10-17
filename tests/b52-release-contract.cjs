'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process');
const c = require('../scripts/b52/release-contract.cjs');
const evidence = path.resolve(__dirname, '../docs/evidence/b52');
const snapshot = JSON.parse(fs.readFileSync(path.join(evidence, 'live-inventory.json')));
const review = JSON.parse(fs.readFileSync(path.join(evidence, 'static-release.json')));
const ready = () => ({site_id: c.SITE, main_sha: c.MAIN, target_sha: c.B5, fast_forward: true,
  published_deploy: c.BASE, locked: true, stop_builds: true, repo_branch: 'main', inflight: [],
  manifest_matches: true, functions_match: true, schedule_matches: true, github_publish_workflows_absent: true,
  beta_main_excluded: true, beta_prs_disabled: true});

test('exact baseline inventory and complete nine-Function contract', () => {
  c.assertBaseline(snapshot, review.rollback_body);
  assert.equal(snapshot.functions.length, 9);
  assert.deepEqual(review.preserved_functions, snapshot.functions);
});
test('complete manifest changes only the eight approved paths', () => {
  assert.deepEqual(c.changedPaths(review.body.files, review.rollback_body.files), c.PATHS);
  assert.equal(Object.keys(review.body.files).length, 434);
  assert.equal(review.unchanged_paths, 426);
  assert.equal(c.digest(c.canonical(review.body)), review.body_sha256);
  assert.equal(c.digest(c.canonical(review.rollback_body)), review.rollback_body_sha256);
  assert.equal(c.digest(c.canonical(review.build_manifest)), review.build_manifest_sha256);
  assert.deepEqual(review.stage_body, {...structuredClone(review.body), draft: true});
  assert.equal(c.digest(c.canonical(review.stage_body)), review.stage_body_sha256);
});
test('static release blocks until builds are stopped, then rechecks every Function pin', () => {
  assert.throws(() => c.assertFreshLive(snapshot, review));
  const paused = structuredClone(snapshot); paused.build_settings.stop_builds = true;
  c.assertFreshLive(paused, review);
  paused.functions[0].id = 'unexpected-function-version';
  assert.throws(() => c.assertFreshLive(paused, review));
});
test('static rollback restores only the eight old assets and same nine Functions', () => {
  const rolledBack = structuredClone(review.body);
  for (const f of review.static_changes) rolledBack.files[f.path] = f.rollback_sha1;
  assert.deepEqual(rolledBack, review.rollback_body);
  for (const key of ['functions','functions_config','function_schedules']) assert.deepEqual(review.body[key], review.rollback_body[key]);
});
test('historical config digest retained; unavailable SHA256 is explicit', () => {
  assert.equal(review.body.files['/netlify.toml'], 'f0026c2bb5b6c9aa0db2af18048d6ce98a13c3dc');
  assert.equal(review.opaque_retained_artifact.sha256, null);
  assert(!c.PATHS.includes('/netlify.toml'));
});
test('unexpected duplicate build files or a changed preserved byte block preparation', () => {
  c.assertBuildManifest(review.build_manifest, review.body.files);
  assert.throws(() => c.assertBuildManifest({...review.build_manifest, '/unexpected 2.html': {sha1:'extra'}}, review.body.files));
  assert.throws(() => c.assertBuildManifest({...review.build_manifest, '/portal/portal.js': {sha1:'changed'}}, review.body.files));
});
test('Netlify may request only the reviewed static assets', () => {
  c.assertUploadRequest(review, {required: review.static_changes.map(x => x.sha1), required_functions: []});
  c.assertUploadRequest(review, {required: []});
});
for (const [name, request] of Object.entries({function: {required_functions: [snapshot.functions[0].d]},
  edge: {required_edge_functions: ['fictional-edge']}, server: {required_server: 'fictional-server'},
  extra_static: {required: ['unexpected']}})) test('unexpected upload denied: ' + name, () => {
    assert.throws(() => c.assertUploadRequest(review, request));
  });
test('no-publish plan requires read-back dual controls and leaves both held', () => {
  const plan = c.assertNoPublishReady(ready());
  assert.equal(plan.force, false); assert(plan.leave_builds_stopped && plan.leave_publishing_locked);
});
for (const [key, value] of Object.entries({site_id: 'beta', main_sha: 'advanced', target_sha: c.REPAIR,
  fast_forward: false, published_deploy: 'advanced', locked: false, stop_builds: false,
  repo_branch: 'beta', inflight: [{state:'building'}], manifest_matches: false,
  functions_match: false, schedule_matches: false, github_publish_workflows_absent: false,
  beta_main_excluded: false, beta_prs_disabled: false})) {
  test('main-sync aborts on ' + key, () => assert.throws(() => c.assertNoPublishReady({...ready(), [key]: value})));
}
for (const method of ['POST','PUT','PATCH','DELETE']) test('inspection refuses ' + method + ' before transport', async () => {
  let called = false;
  const get = c.readOnlyTransport(async () => {called = true;}, 'fictional');
  await assert.rejects(get(method, '/sites/' + c.SITE)); assert.equal(called, false);
});
test('inspection rejects secrets, logs, source records and non-API URLs', async () => {
  const get = c.readOnlyTransport(() => assert.fail('must not send'), 'fictional');
  for (const p of ['/accounts/x/env', '/sites/x/functions', '/builds/x/log', '/contacts', 'https://evil.example', '/sites/x/../env'])
    await assert.rejects(get('GET', p));
});
test('read-only inspection sends GET and never includes a body', async () => {
  const get = c.readOnlyTransport(async (url, options) => {
    assert.equal(url, 'https://api.netlify.com/api/v1/sites/' + c.SITE);
    assert.equal(options.method, 'GET'); assert.equal(options.body, undefined);
    return {ok: true, json: async () => ({fictional: true})};
  }, 'fictional');
  assert.deepEqual(await get('GET', '/sites/' + c.SITE), {fictional: true});
});
test('queue inspection paginates and detects an old unfinished deployment', async () => {
  const {inspect} = require('../scripts/b52/inspect-netlify.cjs');
  const r = await inspect(async (method, p) => {
    assert.equal(method, 'GET');
    if (p.includes('/deploys?page=')) {
      const page = Number(p.match(/page=(\d+)/)[1]);
      return page < 3 ? Array.from({length:100}, (_, i) => ({id:page+'-'+i,state:'ready'}))
        : [{id:'old-fictional-building', state:'building', context:'production'}];
    }
    if (p.includes('/files')) return Object.entries(snapshot.live_files).map(([path, sha]) => ({path, sha}));
    if (p.startsWith('/deploys/')) return {available_functions:snapshot.functions, function_schedules:snapshot.function_schedules};
    return {published_deploy:{id:c.BASE}, build_settings:{}};
  });
  assert.equal(r.deploys_inspected, 201);
  assert.deepEqual(r.inflight, [{id:'old-fictional-building',state:'building',context:'production'}]);
});
test('fixture Git remote fast-forwards main to exact B5 without merge/rebase/source changes', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rva-b52-git-'));
  t.after(() => fs.rmSync(temp, {recursive: true, force: true}));
  const run = (args, cwd) => cp.execFileSync('git', args, {cwd, encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
  const root = path.resolve(__dirname, '..'), remote = path.join(temp, 'fictional.git');
  run(['clone','--bare','--shared',root,remote], temp);
  run(['update-ref','refs/heads/main',c.MAIN], remote);
  assert.equal(run(['merge-base','--is-ancestor',c.MAIN,c.B5], root), '');
  run(['push', remote, c.B5 + ':refs/heads/main'], root);
  assert.equal(run(['rev-parse','refs/heads/main'], remote), c.B5);
  assert.equal(run(['rev-parse','refs/heads/main^{tree}'], remote), run(['rev-parse',c.B5+'^{tree}'], root));
  assert.equal(run(['rev-parse','refs/remotes/origin/main'], root), c.MAIN);
});
test('runtime, Functions, SQL, CI and dependency sources are still exactly PR39', () => {
  assert.equal(cp.execFileSync('git', ['diff', c.REPAIR, '--name-only','--',
    'portal','netlify','js','config','supabase','.github','netlify.toml','package.json','package-lock.json',
    'scripts/build-production-vitality.cjs','scripts/prepare-repdb.cjs',
    ':(exclude).github/workflows/b52-release-contract.yml'], {encoding:'utf8'}).trim(), '');
});
test('new CI is offline/read-only and cannot deploy, migrate or change settings', () => {
  const ci = fs.readFileSync('.github/workflows/b52-release-contract.yml', 'utf8');
  assert(ci.includes('contents: read'));
  assert(ci.includes("['22.23.3', '24.20.0']"));
  assert(ci.includes('run: node --test tests/b52-release-contract.cjs'));
  assert(!/secrets\.|netlify deploy|supabase|git push|permissions:\s*write/i.test(ci));
});
test('exact matching archives account for every one of the nine live digests', () => {
  const r = JSON.parse(fs.readFileSync(path.join(evidence, 'reproduction.json')));
  assert.equal(r.host.node, 'v24.20.0'); assert.equal(r.host.zlib, '1.2.12');
  assert.equal(r.exact_live_archives, 9);
  for (const f of snapshot.functions) assert(Object.values(r.results).some(v => v.functions.some(x => x.name === f.n && x.sha256 === f.d)));
  assert.equal(r.results.zisi14.functions.filter(f => f.exact_live_match).length, 7);
  assert.equal(r.results.zisi16.functions.filter(f => f.exact_live_match).length, 2);
});
