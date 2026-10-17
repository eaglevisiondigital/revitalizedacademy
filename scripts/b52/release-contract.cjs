'use strict';
// Pure review contracts. No credentials, fetch, deployment or Git mutation here.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const BASE = '6ad2acb16d6d38c15ce3e489';
const SITE = 'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06';
const MAIN = '79debed92925b920f9052d9c522a796bbf929223';
const B5 = 'e02f35267de3159d7b3b2a5e989ccb8edb7e9f7d';
const REPAIR = 'cf590b576388e61100cc1b88222723fb016a0381';
const PATHS = ['index.html', 'portal-work-desk.js', 'portal-member-messaging.js',
  'portal-companion.js', 'portal-programs.js', 'portal-people-directory.js',
  'portal-staff-access.js', 'portal-family-requests.js'].map(p => '/portal/' + p).sort();
const digest = (bytes, algorithm = 'sha256') => crypto.createHash(algorithm).update(bytes).digest('hex');
const canonical = value => JSON.stringify(value, (_key, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const changedPaths = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(p => a[p] !== b[p]).sort();

function assertBuildManifest(artifacts, files) {
  assert.deepEqual(Object.keys(artifacts).sort(), Object.keys(files).sort(), 'Unexpected/missing build paths');
  for (const [p, v] of Object.entries(artifacts)) {
    if (p !== '/netlify.toml') assert.equal(v.sha1, files[p], 'Unapproved public delta: ' + p);
  }
}

function assertBaseline(snapshot, body) {
  assert.equal(snapshot.site_id, SITE);
  assert.equal(snapshot.production_deploy, BASE, 'Production advanced: reconcile again');
  assert.equal(snapshot.beta_deploy, '6acc33161511aa93c289bbcc');
  assert.equal(snapshot.functions.length, 9);
  assert.deepEqual(snapshot.live_files, body.files, 'Live file drift');
  assert.deepEqual(Object.fromEntries(snapshot.functions.map(f => [f.n, f.d])), body.functions);
  assert.deepEqual(snapshot.function_schedules, body.function_schedules);
  assert.deepEqual(body.function_schedules, [{name: 'payment-worker', cron: '* * * * *'}]);
  for (const f of snapshot.functions) {
    assert.equal(f.r, 'nodejs22.x');
    assert.equal(f.im, 'stream');
    const cfg = body.functions_config[f.n];
    assert(cfg);
    assert.equal(cfg.priority, f.p);
    assert.deepEqual(cfg.build_data ?? null, f.bd ?? null);
    assert.deepEqual(cfg.routes.map(r => r.pattern), (f.ro || []).map(r => r.p));
    assert.deepEqual(cfg.excluded_routes, f.er || []);
  }
  assert.equal(Object.keys(body.files).length, 434);
}

function makeRelease(snapshot, baselineBody, candidateFiles, rollbackFiles) {
  assertBaseline(snapshot, baselineBody);
  assert.deepEqual(Object.keys(candidateFiles).sort(), PATHS);
  assert.deepEqual(Object.keys(rollbackFiles).sort(), PATHS);
  const body = structuredClone(baselineBody);
  const uploads = PATHS.map(p => {
    const bytes = candidateFiles[p], old = rollbackFiles[p];
    assert.equal(digest(old, 'sha1'), baselineBody.files[p], 'Rollback bytes mismatch: ' + p);
    body.files[p] = digest(bytes, 'sha1');
    assert.notEqual(body.files[p], baselineBody.files[p], 'Expected static change: ' + p);
    return {path: p, sha1: body.files[p], sha256: digest(bytes),
      rollback_sha1: digest(old, 'sha1'), rollback_sha256: digest(old)};
  });
  assert.deepEqual(changedPaths(baselineBody.files, body.files), PATHS);
  assert.deepEqual(body.functions, baselineBody.functions);
  assert.deepEqual(body.functions_config, baselineBody.functions_config);
  assert.deepEqual(body.function_schedules, baselineBody.function_schedules);
  return {NOT_EXECUTED: true, app_source_sha: REPAIR, baseline_source_sha: B5,
    site_id: SITE, expected_current_deploy: BASE, static_changes: uploads,
    unchanged_paths: 426, functions_reused_by_digest: 9, function_uploads_permitted: 0,
    body, rollback_body: structuredClone(baselineBody),
    body_sha256: digest(canonical(body)), rollback_body_sha256: digest(canonical(baselineBody))};
}

function assertUploadRequest(review, request) {
  assert.deepEqual(request.required_functions || [], [], 'STOP: never upload/rebundle a Function');
  assert.deepEqual(request.required_edge_functions || [], []);
  assert(!request.required_server, 'STOP: unexpected server artifact');
  const permitted = new Set(review.static_changes.map(f => f.sha1));
  assert((request.required || []).every(h => permitted.has(h)), 'STOP: unexpected public asset');
}

function assertFreshLive(snapshot, review) {
  assertBaseline(snapshot, review.rollback_body);
  assert.deepEqual(snapshot.functions, review.preserved_functions, 'Function ID/runtime/config drift');
  assert.equal(review.body_sha256, digest(canonical(review.body)), 'Manifest changed');
  assert.equal(review.rollback_body_sha256, digest(canonical(review.rollback_body)), 'Rollback changed');
  assert.equal(snapshot.build_settings.stop_builds, true, 'Builds must remain stopped during static release');
  assert.deepEqual(snapshot.inflight, []);
}

function assertNoPublishReady(state) {
  assert.equal(state.site_id, SITE);
  assert.equal(state.main_sha, MAIN, 'Main advanced: stop');
  assert.equal(state.target_sha, B5);
  assert.equal(state.fast_forward, true);
  assert.equal(state.published_deploy, BASE);
  assert.equal(state.locked, true, 'Publish lock must be read back');
  assert.equal(state.stop_builds, true, 'Stopped builds must be read back');
  assert.equal(state.repo_branch, 'main');
  assert.deepEqual(state.inflight, [], 'Wait/abort on queued or running deploys');
  assert.equal(state.manifest_matches, true);
  assert.equal(state.functions_match, true);
  assert.equal(state.schedule_matches, true);
  assert.equal(state.github_publish_workflows_absent, true);
  assert.equal(state.beta_main_excluded, true);
  assert.equal(state.beta_prs_disabled, true);
  return {operation: 'fast-forward-existing-main', from: MAIN, to: B5, force: false,
    leave_builds_stopped: true, leave_publishing_locked: true};
}

function readOnlyTransport(fetcher, token) {
  return async (method, route) => {
    assert.equal(method, 'GET', 'B5.2 inspection is GET-only');
    assert(/^\/(sites|deploys)\/[a-z0-9-]+(?:\/files(?:\/netlify\.toml)?|\/deploys\?page=[1-9]\d*&per_page=100)?$/.test(route), 'Unsupported inspection route');
    const r = await fetcher('https://api.netlify.com/api/v1' + route, {
      method: 'GET', headers: {Authorization: 'Bearer ' + token}, signal: AbortSignal.timeout(30000)});
    assert(r.ok, 'Metadata GET failed: ' + r.status);
    return r.json();
  };
}
module.exports = {BASE, SITE, MAIN, B5, REPAIR, PATHS, digest, canonical, changedPaths,
  assertBaseline, assertBuildManifest, makeRelease, assertUploadRequest, assertFreshLive, assertNoPublishReady, readOnlyTransport};
