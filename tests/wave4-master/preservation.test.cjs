'use strict';
// Source/package checks only. These do not inspect private records or certify production.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const base = '5926b915f60b1be6d009c94362b91356a303cb33';
const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'});
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const changed = git('diff', '--name-only', base, '--').trim().split('\n').filter(Boolean);
const runtimeAllowed = new Set(['member/member110.js', 'portal/portal-coaching.js']);
const addedAllowed = /^(docs\/|tests\/wave4-|proposals\/issue-61\/wave4\/|tools\/affiliate-share-preview\/adapter\.cjs$|tools\/coach-companion-catalog\/async-fixture-adapter\.cjs$|CURRENT_BUILD_STATE\.md$)/;

test('tracked changes remain inside explicitly owned Wave 4 paths', () => {
  assert.deepEqual(changed.filter(file => !runtimeAllowed.has(file) && !addedAllowed.test(file)), []);
});
test('canonical migrations, Functions, assets, payment and release configuration are untouched', () => {
  const protectedPath = /^(supabase\/|netlify\/|functions\/|assets\/|css\/|styles\/|payments\/)|(^|\/)(netlify\.toml|_headers|_redirects|package(?:-lock)?\.json)$/;
  assert.deepEqual(changed.filter(file => protectedPath.test(file)), []);
});
test('the approved methodology and voice source remain byte-identical', () => {
  for (const file of ['js/vitality-roadmap-founder-direction.cjs', 'js/vitality-roadmap-founder-voice.cjs']) {
    assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), git('show', base + ':' + file));
  }
});
test('all original requirements and source details remain unchanged', () => {
  for (const file of ['docs/orchestration/requirements.json', 'docs/orchestration/requirements-source-details.json']) {
    assert.deepEqual(json(file), JSON.parse(git('show', base + ':' + file)));
  }
  const requirements = json('docs/orchestration/requirements.json').requirements;
  assert.equal(requirements.length, 101);
  assert.equal(new Set(requirements.map(row => row.workstream)).size, 10);
  assert.equal(json('docs/orchestration/requirements-source-details.json').details.length, 10);
});
test('the 57-package source matrix is preserved, without claiming full acceptance', () => {
  const file = 'docs/orchestration/issue-56/ACCEPTANCE_MATRIX.json';
  assert.deepEqual(json(file), JSON.parse(git('show', base + ':' + file)));
});
test('Alex is paused and production mutation remains unauthorized', () => {
  const state = json('docs/orchestration/wave4-state.json');
  assert.match(state.alexWorkflow, /PAUSED_BY_OWNER/);
  assert.equal(state.productionWritesAuthorized, false);
  assert.match(state.pr59, /DRAFT.*NO-GO/);
});
test('only the two reviewed existing runtime files can change', () => {
  const existing = new Set(git('ls-tree', '-r', '--name-only', base).trim().split('\n'));
  const code = changed.filter(file => existing.has(file) && /\.(?:cjs|js|mjs|html|css|sql)$/.test(file));
  assert.deepEqual(code.filter(file => !runtimeAllowed.has(file)), []);
});
