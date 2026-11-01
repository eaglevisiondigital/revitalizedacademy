# Independent Wave 5 QA

Run from this worktree with the existing bundled Node runtime. No dependency installation, live database string, logged-in browser profile, hosted account, credential or private source is accepted.

```
node --test --test-reporter=tap tests/wave5-qa/invariants.test.cjs
node --test --test-reporter=tap tests/wave5-qa/http-adversarial.test.cjs tests/wave5-qa/browser-adversarial.cjs
node tests/wave5-qa/run-combined-pg.cjs
```

HTTP/native browser commands require the same installed Python QR encoder and sandbox permission for loopback/native process execution as the author suites. The owned loopback server uses explicitly fictional providers. The browser probe delays a real scenario response, changes a separate selector while it is pending and requires controls to recover without displaying revoked content. Initial two-engine failures remain historical evidence; a corrected result must execute the same assertion.

The QA-owned PostgreSQL runner reuses the reviewed author's disposable cluster scaffold and metadata overlays, layers both independently authored local proposals and executes baseline/corrected/exact-revert stages. It accepts no external connection string. Only one PG cluster runs at a time after coordinating authors; no unowned cluster or IPC resource is removed. Actual PostgreSQL 17.11 uses a private UNIX socket, synthetic Auth GUCs and invented records. This is not managed Auth/MFA/PostgREST or production authorization proof.

Strict unresolved check-in, assignment and household tests are retained separately from corrected targeted contracts. A reported denial must be row invisibility or the specified PostgreSQL security/integrity SQLSTATE; a generic exception does not satisfy a negative assertion. Local regression reverts restore known old weaknesses and are not a recommended production rollback.

Current package outcomes and historical failures remain separate. A passing component test cannot certify an entire integration package. The unchanged 57 package definitions, 101 requirement groups, ten source-detail groups and source completeness gaps remain authoritative. Alex is paused; zero private production reads or actions are permitted in this task.
