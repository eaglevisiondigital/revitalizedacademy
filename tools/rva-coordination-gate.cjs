'use strict';
// Local coordination integrity only. Trusted native observations must come from
// the coordinator's tool receipts; this does not authenticate people or certify tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const BASE = '024b1c20c802ce6a9470fc46fabdd3bae75ed980';
const FILES = ['docs/orchestration/requirements.json', 'docs/orchestration/requirements-source-details.json', 'docs/orchestration/issue-56/ACCEPTANCE_MATRIX.json', 'docs/orchestration/issue-55/127_SECTION_TRACE.csv'];
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function baseline(root) {
  return Object.fromEntries(FILES.map(file => [file, cp.execFileSync('git', ['show', BASE + ':' + file], {cwd: root})]));
}
function readInputs(root) {
  return {files: Object.fromEntries(FILES.map(file => [file, fs.readFileSync(path.join(root, file))])), state: JSON.parse(fs.readFileSync(path.join(root, 'docs/orchestration/wave5-state.json')))};
}
function verify(inputs, pinned, observeWorktree, trustedObservation) {
  for (const file of FILES) assert.equal(digest(inputs.files[file]), digest(pinned[file]), 'Source register drift: ' + file);
  const requirements = JSON.parse(inputs.files[FILES[0]]).requirements;
  assert.equal(requirements.length, 101); assert.equal(new Set(requirements.map(r => r.id)).size, 101);
  assert.equal(new Set(requirements.map(r => r.workstream)).size, 10);
  assert.equal(JSON.parse(inputs.files[FILES[1]]).details.length, 10);
  assert.equal(JSON.parse(inputs.files[FILES[2]]).cases.length, 57);
  const state = inputs.state;
  assert.equal(state.acceptedBase, BASE); assert.equal(state.productionWritesAuthorized, false);
  assert.equal(state.financialActivation, false); assert.match(state.alex, /^PAUSED/);
  assert.match(state.sourceCompleteness, /PARTIAL.*127.*missing/);
  assert.match(state.pr59, /DRAFT.*NO_GO/);
  assert.equal(state.tasks.length, 4);
  assert.equal(new Set(state.tasks.map(t => t.agent)).size, 4);
  assert(trustedObservation && trustedObservation.source === 'native-tool-observation', 'Independent native observation required');
  const observed = new Set(trustedObservation.tasks);
  assert.deepEqual([...new Set(state.nativeObservation.tasks)].sort(), [...observed].sort(), 'Native observation drift');
  const owned = [];
  for (const task of state.tasks) {
    assert.equal(task.baseSha, BASE); assert.equal(task.dispatch.kind, 'native-spawn-result');
    assert.equal(task.dispatch.taskName, task.agent); assert(observed.has(task.agent), 'No independently captured native dispatch');
    const actual = observeWorktree(task.worktree);
    assert.equal(actual.branch, task.branch, 'Worktree branch mismatch'); assert.equal(actual.descendsFromBase, true);
    assert(task.ownedPaths.length > 0);
    for (const file of task.ownedPaths) {
      assert(typeof file === 'string' && !path.isAbsolute(file) && !file.split('/').includes('..') && !file.startsWith('.git'), 'Unsafe ownership path');
      for (const prior of owned) {
        const overlaps = file === prior.file || (file.endsWith('/') && prior.file.startsWith(file)) || (prior.file.endsWith('/') && file.startsWith(prior.file));
        assert(!overlaps, 'Overlapping lane ownership: ' + file);
      }
      owned.push({file, agent: task.agent});
    }
  }
  return {status: 'PASS_LOCAL_COORDINATION', requirements: 101, detailGroups: 10, workstreams: 10, packages: 57, observedTasks: 4, originalSourceCompleteness: 'NOT_ESTABLISHED', productionAcceptance: false};
}
function observeWorktree(directory) {
  const branch = cp.execFileSync('git', ['branch', '--show-current'], {cwd: directory, encoding: 'utf8'}).trim();
  const result = cp.spawnSync('git', ['merge-base', '--is-ancestor', BASE, 'HEAD'], {cwd: directory});
  return {branch, descendsFromBase: result.status === 0};
}
module.exports = {BASE, FILES, baseline, readInputs, verify, observeWorktree};
if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  process.stdout.write(JSON.stringify(verify(readInputs(root), baseline(root), observeWorktree, JSON.parse(fs.readFileSync(path.join(root, '../deployment-evidence/2026-11-01-wave5/NATIVE_OBSERVATION.json'))))) + '\n');
}
