'use strict';
// GET-only metadata inspection. No environment, log, participant, or Function calls.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict');
const c = require('./release-contract.cjs');
async function inspect(get) {
  const [site, live, files, beta] = await Promise.all([
    get('GET', '/sites/' + c.SITE), get('GET', '/deploys/' + c.BASE),
    get('GET', '/sites/' + c.SITE + '/files'),
    get('GET', '/sites/071b252e-a922-4846-a784-8dca1edad377')]);
  const deploys = [];
  for (let page = 1; ; page++) {
    assert(page <= 100, 'Queue inventory exceeded bound; stop for manual review');
    const batch = await get('GET', '/sites/' + c.SITE + '/deploys?page=' + page + '&per_page=100');
    assert(Array.isArray(batch)); deploys.push(...batch);
    if (batch.length < 100) break;
  }
  assert.equal(site.published_deploy.id, c.BASE);
  const b = site.build_settings;
  return {checked_at: new Date().toISOString(), site_id: c.SITE, production_deploy: c.BASE,
    beta_deploy: beta.published_deploy.id, functions: live.available_functions,
    function_schedules: live.function_schedules || [],
    live_files: Object.fromEntries(files.map(f => ['/' + f.path.replace(/^\//, ''), f.sha])),
    build_settings: Object.fromEntries(['provider', 'repo_path', 'repo_branch', 'allowed_branches',
      'stop_builds', 'skip_automatic_builds', 'skip_prs', 'cmd', 'dir', 'functions_dir'].map(k => [k, b[k] ?? null])),
    beta_build_settings: Object.fromEntries(['provider', 'repo_path', 'repo_branch', 'allowed_branches',
      'stop_builds', 'skip_prs'].map(k => [k, beta.build_settings[k] ?? null])),
    published_locked: site.published_deploy.locked ?? false, deploys_inspected: deploys.length,
    inflight: deploys.filter(d => !['ready','error','rejected','canceled','cancelled','skipped'].includes(d.state))
      .map(d => ({id: d.id, state: d.state, context: d.context})), no_hosted_writes: true};
}
if (require.main === module) {
  (async () => {
    assert(process.argv[2], 'Output file required');
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Library/Preferences/netlify/config.json')));
    const result = await inspect(c.readOnlyTransport(fetch, cfg.users[cfg.userId].auth.token));
    fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({deploy: result.production_deploy, functions: result.functions.length,
      files: Object.keys(result.live_files).length, stop_builds: result.build_settings.stop_builds, no_hosted_writes: true}));
  })().catch(() => { console.error('Read-only inspection failed; stop and review. No request bodies or credentials logged.'); process.exitCode = 1; });
}
module.exports = {inspect};
