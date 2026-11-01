# Wave 5 operations — local only

Base `024b1c20c802ce6a9470fc46fabdd3bae75ed980`. No production URL, credential, real questionnaire or client source is accepted by these tests. Alex is paused. See `docs/orchestration/issue-54/wave5/REPORT.md` for current PASS/FAIL/BLOCKED boundaries.

- `build-proposal.py` generates a one-function layered local proposal and exact regression revert from the accepted Wave4 source. It does not connect to a database.
- `run-pg.cjs` creates one owned UNIX-socket-only PG17 cluster, applies the pinned historical empty scaffold, current row-free catalog overlay and accepted LOCAL Wave3/Wave4 predecessors, then compares baseline/corrected/reverted behavior. It removes its cluster afterward. It never borrows an existing server, accepts a connection string, deletes unknown IPC segments or changes kernel settings. Coordinate its execution with other lanes.
- `current-operations-catalog.json` contains schema/ACL/policies/indexes/trigger definitions only, independently captured by Master at 21:26:56 UTC November1. It has no guest/client/Auth records. Its outside-Git source hash is verified before PG execution.
- `concurrency.test.cjs` forces opposing actual backend lock order for both direct and RPC writes. Corrected assertions require BOTH transactions to commit, with one ledger row and exact total. The old test requiring a deadlock is retained unchanged in Wave4 and excluded from corrected regressions; these new tests replace its availability criterion.
- `durable-operations.test.cjs` proves current weekly unique-key arbitration, side-effect rollback, minimal readback, existing notification replay, paid Client holds and five strict, currently unresolved staff-scope failures. The runner records the latter in their own FAIL output. A harness exit of zero is not whole-package acceptance.
- `checkin.test.cjs` executes actual member JavaScript in a fictional DOM. `RVA_WAVE5_BASELINE=1` injects only the exact accepted Wave4 member source for old/new comparison. It never persists answers in browser storage.
- `checkin-browser.cjs` executes the actual handler in Chromium and WebKit at390/768/1440px with all requests intercepted. No real SDK/Auth/backend acceptance is claimed.

Run Node/DOM from this worktree with the bundled Node runtime:

```sh
node --test --test-reporter=tap --test-concurrency=1 --test-skip-pattern='actual check-in surfaces duplicate server response' tests/wave5-operations/checkin.test.cjs tests/wave3-unaffected/member-operations.test.cjs tests/wave4-member/continuity.test.cjs tests/wave4-member/modal-generation.test.cjs
node tests/wave5-operations/checkin-browser.cjs
node tests/wave5-operations/run-pg.cjs
```

The excluded old duplicate-response assertion assumes that any23505 proves a saved check-in. The new handler requires an independent minimal readback; an unrelated conflict or failed read remains uncertain. The original assertion and first failed regression receipt remain preserved.

The current exact SQL guard hardening still needs executable independent verification: the last initdb stopped at the Mac's32-segment SysV limit. Prior functional body results remain retained; do not relabel that final resource stop as PASS or rerun initdb in a loop.
