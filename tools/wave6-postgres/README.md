# Local disposable PG resource gate

This tool **does not recover unknown resources automatically**. It safely prevents another `initdb` attempt when the host's small SysV identifier pool is exhausted. No IPC removal/process termination/hosted connections exist in the tooling.

Run metadata inventory using the bundled Node runtime:

```sh
node tools/wave6-postgres/resource-gate.cjs
node --test tests/wave6-environment/resource-gate.test.cjs
```

The exact-source wrapper accepts absolute source and output paths. Source must remain clean at accepted Wave 5 `9beae3bb40c154d2bfd623e8d2355b3a6c3cd306`; output must be outside it. It verifies every tracked Git blob and the original runner, serializes with a `mkdir` lease, requires two free IDs, and passes only a small nonsecret environment. It neither reuses stale locks nor auto-removes unknown segments. It returns exit 2 on a resource/security block. A successful source check is not proof of SQL execution.

```sh
node tools/wave6-postgres/run-pinned-wave5.cjs /absolute/accepted-wave5-worktree /absolute/external-evidence
```

Do not call the wrapper repeatedly while capacity is blocked. New combined Wave 6 policies need their own independently pinned test execution; this wrapper cannot substitute different code silently.

`shim-metadata.c` is an optional metadata-only attribution aid for a **specifically reviewed**, same-user, unattached, exactly 56-byte candidate. Compile against installed PG17 server/internal headers plus Homebrew gettext includes/libs. It uses the actual PGShmemHeader size and refuses other sizes. It exposes only valid PostgreSQL provenance fields, or `provenanceAvailable:false`; it cannot remove or write IPC and must not be used to read database payloads or active segments. Read-only attachment affects kernel attachment timestamps/last PID. An invalid header remains unattributed, never safe to delete.
