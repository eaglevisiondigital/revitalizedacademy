# Engineering validation — 2026-09-26

| Check | Result | Evidence |
|---|---|---|
| Full frontend suite | 56 pass, 0 fail, 27 explicit retired snapshots; includes 20 assessment cases | [Output](frontend-tests.txt) |
| PostgreSQL 17, pgvector 0.8.2 | 40 pass, 0 fail; fresh schema restore + migration on each run | [Output](backend-tests.txt) |
| Edge handler HTTP/authorization | 10 pass, 0 fail; transport mocked, no live side effects | [Output](edge-tests.txt) |
| JavaScript syntax | 60 files pass | [Output](syntax-tests.txt) |
| TypeScript | All 15 Edge entry points and imported modules pass strict Deno 2.9.6 check | [Output](typecheck.txt) |
| Production compile/build | Not configured: static HTML/CSS/JS site; no production bundler/build command | Existing `netlify.toml` publishes `.` |
| Lint | No lint configuration/script in the original application; not claimed as run | Syntax/type checks and `git diff --check` performed |
| Security/performance advisors | Read live; warning/information inventory retained | [Security](../../supabase/baselines/2026-09-26/security-advisor.json), [performance](../../supabase/baselines/2026-09-26/performance-advisor.json) |

The database tests execute recovered SQL, RLS, constraints and triggers; they do not substitute mocked application permission logic. Auth claims and managed storage scaffolding are synthetic. Edge tests exercise the actual handlers and Supabase client requests against stubbed HTTP, including caller-JWT preservation. No live Auth login, e-signature, provider delivery, payment, form submission or data export was performed.

Full original-failure classifications: [28-entry ledger](../baseline/REGRESSION_CLASSIFICATION.md). No tests or product code were changed to restore obsolete three-month commitments. Protected assessment, question modules, mirror helper and webinar source retain their pinned baseline hashes.

GitHub Actions run status belongs to the commit/run links in the completion report; local green results do not imply remote CI ran.
