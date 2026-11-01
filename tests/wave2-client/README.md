# Wave2 Client synthetic contract suite

This suite executes existing application JavaScript and exact existing SQL in bounded fictional fixtures. It does not change runtime code, permissions, policies, schema history, commercial rules or production.

## Reproduce

From repository root:

```sh
node --test --test-reporter=tap tests/wave2-client/onboarding.test.cjs
node tests/wave2-client/run-pg.cjs
RVA_WAVE2_CHROMIUM='/path/to/installed/Chromium' node tests/wave2-client/run-browser.cjs
```

Dependencies are read from `../revitalizedacademy/node_modules` by default (`pg` 8.16.3 and `jsdom` 26.1.0), or set `RVA_WAVE2_DEPENDENCIES` to a directory with those exact versions. No installation/network access is performed. Playwright 1.62.1 is read from the bundled runtime by default or `RVA_WAVE2_PLAYWRIGHT`; set `RVA_WAVE2_CHROMIUM` when its bundled revision is absent. The actual accepted browser versions are recorded in receipts. PostgreSQL binaries default to Homebrew PG17, overridable with `RVA_WAVE2_PG_BIN`.

The PG runner checks `source-pins.json` before initialization. Its only database is a newly initialized, disposable PG17 cluster with TCP disabled, unique temporary UNIX socket/port and explicit source inputs. It does not consume `DATABASE_URL`, Supabase keys or caller `PG*` connection settings. Managed Auth/Storage definitions are minimal existing synthetic test scaffolding. No live database connection is supported. All fixture rows use generated UUIDs and `example.invalid` email addresses. It stops/removes its cluster even when assertions fail. Platform roles are created only within that new cluster.

Two separate fresh source profiles run:

1. `baseline_auth`: recovered Sep26 empty catalog + exact Sep26 authorization/enrollment repair file. It tests historical source behavior, not the current installed catalog.
2. `production_hold`: fresh recovered empty catalog + exact existing staff-permission helper extracted without rewriting from the authorization file + exact production lifecycle source `20261007224150`. The source-required active program-catalog precondition is a labeled fictional fixture. Production migration history is not fabricated or replayed. No migration glob, Roadmap migration or private command is used.

These profiles intentionally do not reconstruct every later production migration. Hashes pin the historical inputs. They cannot certify current production RLS, real managed Auth/JWT refresh/revocation, current payments, application organizations, family/guardian policy or the entire client journey.

## Current strict failures are retained

The PG command currently exits **1** because its `baseline_auth` profile reproduces two substantive problems in that bounded source composition:

- An unrelated active Coach reads another Client's goal through the old permissive `client_goals_select` policy, despite the scoped permission helper correctly denying the contact.
- An assigned permitted Coach's public entitlement review RPC fails on EXECUTE privilege for `private.recalculate_coaching_entitlement_used_value`, rolling the adjustment back.

No assertion is skipped, inverted or marked expected-pass. Fixing production authorization is outside this lane. These results require exact current catalog reconciliation before a runtime correction is proposed. The `production_hold` profile and browser/DOM subtests have their own independent passing receipts; no entire Issue56 business case is marked complete.

The browser runner fulfills all requests from local source or a labeled fake SDK/Auth/RPC transport at `academy-fixture.invalid`. It executes actual onboarding HTML, environment.js and onboarding.js in Chromium/WebKit, at desktop/mobile sizes. It is not a real Supabase SDK/Auth/provider acceptance or the newly restored dashboard route; Lane A owns that runtime and QA integrates the lanes.

See `docs/orchestration/issue-54/wave2/REPORT.md` and `results.json` for exact matrix IDs, execution results, initial fixture errors, blockers and evidence limits.
