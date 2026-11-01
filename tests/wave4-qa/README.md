# Independent Wave 4 QA

Run from this worktree using bundled Node24 and existing pinned dependencies; no new package install.

```
node --test --test-reporter=tap tests/wave4-qa/adapters.test.cjs tests/wave4-qa/member-adversarial.test.cjs tests/wave4-qa/coach-refresh.test.cjs tests/wave4-qa/invariants.test.cjs
node tests/wave4-qa/run-independent-pg.cjs
node tests/wave4-qa/browser-independent.cjs
```

The PG runner is a QA-owned derivative of the author harness. Only focused test selection, input inventory and output path differ; the empty dependency scaffold, metadata overlays, proposals, connection containment and teardown are reused. It accepts no external connection string and creates/removes a private socket-only local PG17 cluster. Baseline and exact revert intentionally fail strict assertions; corrected must pass. Its baseline includes the accepted LOCAL Wave3 RPC proposal, which is NOT installed production SQL. No hosted database is contacted. Do not treat this as a migration or production installation command.

Browser entrypoints use the already installed Playwright1.62.1 and native Chromium1248/WebKit2336. All app traffic is intercepted, no signed-in browser profile is reused. Native execution may need sandbox launch approval. Browser tests are source+DOM tests with fictional transport, not live SDK/RLS or hosted acceptance. Independent screenshot inspection does not certify a whole design system.

Initial strict failures and QA harness expectation errors are retained in owned evidence. The original C status expectation typo (`ok` vs actual `supported_education`) was corrected only in QA code. Modal assertions concern the draft remaining open/intact, regardless of whether the corrected implementation prevents scheduling an obsolete timer or ignores it. No failure assertion was changed to accept a stale or unauthorized result.

The complete57business packages,101requirement groups and10source-detail groups remain separately tracked. This finite package does not resolve missing business/family/allowance policies, managed Auth/MFA proof, actual content approval, real-client processing, financial activation or production release permission. Alex remains paused.
