# Wave4 coaching allowance isolation — local only

From the repository root:

```sh
RVA_WAVE4_A_OUTPUT=/private/tmp/rva-wave4-independent-a node tests/wave4-access/run-pg.cjs
```

Node24, pg8.16.3 at sibling `../revitalizedacademy/node_modules` (override `RVA_WAVE4_DEPENDENCIES`), PostgreSQL17 binaries `/opt/homebrew/opt/postgresql@17/bin` (override `RVA_WAVE4_PG_BIN`). One disposable UNIX-socket-only cluster, TCP rejected, caller PG connection environment discarded. No database URL or live connection is accepted. Always use a separate output directory for independent QA. Baseline-only mode is `RVA_WAVE4_BASELINE_ONLY=1`; it intentionally exits nonzero when strict assertions fail.

The baseline is **pinned current metadata plus accepted LOCAL Wave3 RPC proposal**, not installed production. The runner verifies Wave3 source/capture hashes, restores the real current overlay and actual lifecycle dependency source, then runs baseline/correction/revert. Baseline concurrency deliberately commits fictional defect reproductions, so a fresh pinned database is restored before correction; no data repair bypasses the proposal integrity guard. Corrected and reverted routines are paired in the second database. Cluster shutdown/removal is recorded.

Final actual PG17.11 results: main suite40/40 corrected versus17/40 baseline and reverted; separate critical session-entry suite8/8 corrected versus4/8 baseline and reverted. No skips. Exit0 means this bounded comparison succeeded, **not** whole E02/Academy or production acceptance. Natural session/direct opposing row locks produce a safe deadlock abort; retry/availability remains an explicit operational blocker. Current paid-member positive remains blocked by unchanged payment hold. Non-coaching counters and their existing broad access are preserved, unreviewed.

The receipt hashes `access.test.cjs`, **`session-entry.test.cjs` separately**, fixture and both proposal SQL files before execution and rejects changes before completion. Wave3 files/receipts remain unchanged. Failed setup, ordering, resource and earlier40-case receipts are retained in the owned report subtree. `build-proposals.py` reproduces SQL/inventory from pinned source; new SQL is a proposal outside canonical migrations. No hosted operation is part of this command.

Default sandbox restrictions can prevent initdb shared-memory use. Run only the authorized isolated cluster through the normal local approval path; never delete unexplained IPC segments or alter kernel settings. The final coordinated execution succeeded and removed its cluster after an earlier shared-memory resource failure.
