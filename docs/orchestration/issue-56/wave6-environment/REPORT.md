# Wave 6 Lane A — disposable PostgreSQL recovery

**Result: BLOCKED safely; no disposable SQL execution claimed.** November 1, 2026, local-only. Base `9beae3bb40c154d2bfd623e8d2355b3a6c3cd306`.

## Verified cause and inventory

The Mac has exactly **32 occupied System V shared-memory IDs / SHMMNI 32**. Each segment is only 56 bytes (1,792 bytes total), so this is identifier exhaustion, not evidence of low RAM or disk space. One segment has six attachments and belongs to the existing unrelated Homebrew PostgreSQL parent PID 1041. It and its five children were preserved. The other 31 segments are unattached, same-user resources, but those properties do **not** establish RVA ownership.

Read-only process inventory found no running RVA disposable PostgreSQL server. Scanned existing RVA-named temporary PostgreSQL directories had no `postmaster.pid`. No stale RVA test socket/process/lock was positively attributable for cleanup. The new wrapper's own exclusive lease was created and removed successfully. No unknown temporary directory or socket was deleted.

A 56-byte, unattached candidate was inspected using `IPC_STAT`, `SHM_RDONLY` and `shmdt`, compiled against the installed PG17 header. Its PostgreSQL magic/provenance was uninitialized. An exact key/timing correlation in retained execution evidence independently identifies that candidate as another project's bootstrap; it is explicitly **excluded**, without copying that project's content. Attribution was not established for the remaining segments. The cause of their original incomplete creation is **unconfirmed**; a sandbox/bootstrap interruption remains a possibility, not a verified conclusion.

The probe changes only the kernel's attach/detach observation timestamps and last-attaching PID. It never writes segment contents, removes IPC, attaches to active segments or reads database payloads. Unknown ownership is never inferred from a PID, zero attachments or a small size.

No Docker, Podman or Colima executable is available. No runtime was installed or started, no image pulled, no kernel setting changed and no persistent, staging or production database used as a substitute.

## Exact pinned test gate

`tools/wave6-postgres/run-pinned-wave5.cjs` independently verified all **1,823 tracked Git blobs**, a clean tracked tree, exact accepted HEAD, and the unchanged combined runner:

- Accepted source: `9beae3bb40c154d2bfd623e8d2355b3a6c3cd306`
- Combined runner SHA256: `006dfd43f23b9e918a38d30eb4311b59e3838db17a17a3697be3900e7c8b05a9`
- Actual result: `BLOCKED_SYSV_CAPACITY`, `runnerInvoked: false`.

The wrapper requires an external evidence directory, an exclusive local lease, metadata availability and at least two free IDs. It cannot delete IPC or stop services. Once capacity is independently made safe, it can execute only the exact unchanged accepted Wave 5 runner, retaining that runner's baseline/corrected/reverted results and five expected strict failures. It rechecks source pins and flags any newly retained IPC after the runner. Existing runner cleanup is retained; timeout/interruption or unexplained retained resources remains a stop requiring ownership review, never automatic broad cleanup.

This wrapper intentionally does **not** execute arbitrary new policy packages. Independent Wave 6 QA must explicitly pin its new combined sources and lifecycle before invoking its own suite. No production connection route or authorization semantics are altered.

## Tests and evidence

- **19/19** fictional Node tests PASS: metadata parsing/denial, malformed metadata, exact capacity limits, no weakened reserve, exclusive lease collisions, exception/success cleanup, unrelated-file preservation, absolute paths, normalized/symlink output isolation, prohibited mutation/credential primitives.
- Installed PG17 header reader compiled; candidate inspection returned `postgresHeaderValid:false` and `provenanceAvailable:false`.
- Actual pinned preflight BLOCKED before `initdb`; **zero PostgreSQL test assertions executed** in this lane.
- Receipts: `receipts/resource-inventory.json`, `receipts/postgres-process-metadata.txt`, `receipts/candidate-header.json`, `receipts/pinned-wave5/resource-wrapper-receipt.json`, `receipts/resource-gate.tap`.

## Preservation and next action

Zero process terminations, IPC removals, preexisting directory deletions, kernel/configuration changes, new `initdb` attempts, hosted/database calls, source policy/runtime modifications, grants or real-client access. Alex remains paused. Existing failed SQL evidence is retained, not relabeled.

**Next:** independently establish ownership of enough obsolete local test segments before any removal, or use a separately verified disposable environment when available. Do not remove unknown segments or restart unrelated services. Lane B/C work and non-database QA can continue now. Final combined PostgreSQL security, concurrency, rollback and five-failure correction acceptance remain **BLOCKED / NOT RUN** until a safe slot exists.

Primary references checked: [PG17 kernel resources](https://www.postgresql.org/docs/17/kernel-resources.html), [PG17 interlock implementation](https://github.com/postgres/postgres/blob/REL_17_STABLE/src/backend/port/sysv_shmem.c), [PG17 header](https://github.com/postgres/postgres/blob/REL_17_STABLE/src/include/storage/pg_shmem.h). The installed PG17.11 header, rather than an assumed struct layout, is used by the metadata probe.
