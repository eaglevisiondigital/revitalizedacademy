# Client lifecycle verification

Date: 2026-09-27 UTC (2026-09-26 America/Chicago). Branch: `codex/client-access-lifecycle`; base `018c7441e318b6bde72d8001b796c7d587de7b61`.

| Check | Result | Evidence / limits |
|---|---|---|
| Frontend | 65 passed; 0 failed; 27 previously retired historical snapshots | [Full output](lifecycle/frontend-tests.log); 56 existing active cases plus 9 onboarding cases; protected assessment paths unchanged |
| PostgreSQL 17 + pgvector 0.8.2 | 85 passed, 0 failed | [Full output](lifecycle/database-tests.log); 40 baseline cases plus 45 lifecycle cases, real restored schema + both forward migrations; includes two-connection refund contention |
| Edge HTTP | 16 passed, 0 failed | [Full output](lifecycle/edge-tests.log); original 10 plus 6 lifecycle boundaries; outbound transport mocked |
| TypeScript | All 15 entry points and their handlers passed strict frozen Deno check | [Output](lifecycle/edge-typecheck.log), Deno 2.9.6 |
| JavaScript | 61 files passed syntax checks | [Output](lifecycle/javascript-syntax.log) |
| Browser layout | Synthetic desktop and 390×844 mobile viewport inspected | Local mocked Supabase client, visible billing/signature/support controls; no real contract, invitation, payment or provider request |
| Compilation / lint | Not configured for this static application | No invented build/lint success claim; existing syntax/type checks run |
| GitHub CI | Pending branch push at documentation commit time | Final handoff records the actual remote run outcome |

Total active automated cases: **166 passed**. The original 106-case suite remains in the gate. One former successful same-account/two-name signature expectation now asserts rejection, as explicitly required by the new decision; its readiness-denial coverage remains and new independent two-adult success cases were added. No new tests are skipped.

The backend runner creates an empty unique loopback database, restores the catalog baseline and both forward migrations, seeds synthetic fixtures, runs serial test files, and removes only its disposable database. No live customer data is used. Test Auth now distinguishes confirmed/unconfirmed email. Actual Supabase Auth email handling, PostgREST transport, hosted Storage and provider delivery still require staging acceptance.

## Advisors

Supabase CLI 2.118.0 `db advisors --db-url <dedicated-loopback-db>?sslmode=disable` ran against a fresh schema containing both migrations. Loopback TLS configuration is local only.

- **Local Security Advisor: no findings.** [Raw result](lifecycle/local-security-advisors.json). Hosted password/settings checks are outside the local scaffold.
- **Local Performance Advisor: 8 existing warnings**: 5 [multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies), 3 [duplicate indexes](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index). [Raw result](lifecycle/local-performance-advisors.json). Four request-identity initialization warnings on the existing security-gate policies were corrected without changing their authorization predicates. No indexes were removed.
- **Live Security Advisor, read-only:** 1 warning, [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). [Summary](lifecycle-live-security-advisors.json).
- **Live Performance Advisor, read-only:** 303 unused-index INFO findings, 5 multiple-permissive-policy warnings, 3 duplicate-index warnings, 1 absolute Auth DB connection configuration INFO. [Summary and remediation links](lifecycle-live-performance-advisors.json).

Live advisor results describe production without this branch applied. They do not certify the new code. Local advisor results do not certify production settings or real provider operations.
