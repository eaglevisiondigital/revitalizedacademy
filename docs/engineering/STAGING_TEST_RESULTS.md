# Staging package verification

Prepared 2026-09-27 UTC on `codex/staging`, based on lifecycle `feef92e1c0809cbd035edf35ebc70050d958b46b`. No remote writes/deployment/transactions were performed. Read-only production queries recovered non-personal legal and configuration seeds only.

| Check | Result | Evidence / limitation |
|---|---|---|
| Existing frontend + initial environment suite | 87 active pass, 0 fail, 27 already-retired historical snapshots | [Full log](staging/frontend-tests.log): 65 existing + 22 new |
| Completed environment suite | 25 pass, 0 fail | [Log](staging/environment-tests.log): includes three additional tests for immediate contact mirror failure legal hash tampering and unknown-secret field exclusion; total current frontend active cases = 90 |
| Existing PostgreSQL authorization/lifecycle | 85 pass, 0 fail | [Log](staging/database-tests.log); restored schema, RLS, cross-account and concurrent refund checks |
| Fresh staging provision/seed validation | 8 pass, 0 fail | [Log](staging/provision-tests.log); actual recovered private legal template/PDF inputs locally; CI uses clearly labeled synthetic legal bodies while preserving schema/version/hash relationships |
| Edge HTTP/environment checks | 25 pass, 0 fail | [Log](staging/edge-tests.log); 16 previous + 9 environment/provider isolation cases; external transport mocked |
| Edge types | All 15 entry points pass | [Log](staging/edge-typecheck.log); frozen Deno 2.9.6, Supabase JS 2.57.4 |
| JavaScript syntax | 69 files pass | Public JS plus build/provision/release scripts |
| Production/staging artifact | 306 explicit public files | Production config build and synthetic staging artifact tests pass; private/SQL/docs excluded, local asset references compared |
| Local Security Advisor | 0 findings | [Raw result](staging/security-advisors.json), seeded staging-equivalent schema |
| Local Performance Advisor | 8 existing warnings | [Raw result](staging/performance-advisors.json): 5 multiple permissive policy, 3 duplicate index; no index deletion |
| GitHub CI | Run required after push; final handoff records actual result | Workflow now includes fresh staging provisioning tests and environment suite; no deployment jobs |

**208 current active cases** = 90 frontend + 85 existing DB + 8 staging DB + 25 Edge. All previous 166 active cases remain. No new skipped tests. The protected bridge hash test still verifies its entire original implementation after normalizing only the two approved configuration expressions; original digest unchanged. Protected HTML/questions/CSS/images remain source-byte unchanged except password-reset's two config expressions. Netlify build injects config loaders in artifact HTML before application scripts.

The seven missing outreach dependencies predate this branch; the artifact check explicitly records that known gap and fails on additional missing dependencies. No unapproved substitute imagery was added.

Local Auth/Storage scaffolding does not certify managed GoTrue, PostgREST, SMTP, Storage signed URLs, hosted extension privilege compatibility or provider operation. No production advisor/config/setting was changed. Native health, generation, SMS and push readiness labels are unchanged. Legal source hashes and the exact existing published template rows were recovered; full source-to-merge-substitution acceptance remains part of hosted review.
