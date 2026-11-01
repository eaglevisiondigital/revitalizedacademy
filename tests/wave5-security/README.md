# Wave5 relationship and allowance security — local only

Use bundled Node24 with pg8.16.3 at sibling ../revitalizedacademy/node_modules and PostgreSQL17 at /opt/homebrew/opt/postgresql@17/bin:

```sh
RVA_WAVE5_SECURITY_OUTPUT=/private/tmp/rva-wave5-security-independent node tests/wave5-security/run-pg.cjs
```

This command accepts no production connection string. It creates a disposable UNIX-socket-only cluster, rejects TCP, drops inherited PG credentials and removes its owned cluster after execution. Coordinate the one-cluster resource slot with other PostgreSQL authors. Do not delete other shared-memory segments or change local server/kernel configuration.

The runner verifies existing Wave3 current-catalog and scaffold pins, then applies only LOCAL accepted predecessors and the proposed SQL. Auth claims are fictional fixture GUCs; no GoTrue/session/MFA certification follows. The current paid-member predicate remains SELECTfalse. No real user overrides, answers or client rows are queried.

Final comparisons:

- Historical strict three, before Wave4:0PASS/3FAIL.
- Accepted local Wave4 plus45 Wave5 assertions:27PASS/18FAIL.
- Proposed six restrictive policies +four exact authenticated TRUNCATE revocations:45PASS/0FAIL.
- Existing Wave4 regressions under the combined policies:40/40 +8/8 PASS.
- Local revert:27PASS/18FAIL, same failure identities.

Two diagnostic tests intentionally demonstrate old self-assignment and foreign-membership charging in baseline/revert; they are labeled diagnostic, not business acceptance. Guard and compatibility-hold assertions also count within45. These are repeated bounded checks, not45 independent end-to-end journeys. No whole57-case acceptance is inferred.

`build-proposals.py` deterministically builds the SQL and manifest from pinned current metadata and the accepted Wave4 boolean helper. New files remain outside canonical migrations. Forward installation rejects relevant original policy/ACL/function drift and collisions. Revert is LOCAL REGRESSION PROOF ONLY: it restores known unsafe TRUNCATE rights and broad relationship access; it is not a recommended production rollback.

Retained first attempts document recursive invoker-subquery42P17, legitimate paid-hold positive-fixture failures, an ordering mistake in the isolated guard test, the six-policy checkpoint and the actual TRUNCATE bypass. Final receipt hashes executable inputs; historical snapshots remain evidence rather than active runners. Do not execute any snapshot in the report directories.
