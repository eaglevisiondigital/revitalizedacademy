# Wave 6 Lane C — local functional checkpoint; production NO-GO

**Latest narrow follow-up:** the verified different-account/getUser boundary is corrected in both new daily helpers. See `IDENTITY_CORRECTION_REPORT.md`, `IDENTITY_FINAL_COMBINED.tap` and `IDENTITY_BROWSER.tap`. The first-checkpoint results below remain retained historical evidence. The latest EVIDENCE.json preserves and explicitly supersedes its predecessor.

Native author `/root/wave6_features`; Issues #54/#55/#57; branch `codex/rva-wave6-features-20261101`, worktree `academy-wave6-features`, accepted base `9beae3bb40c154d2bfd623e8d2355b3a6c3cd306`. No source push, production access/write, Auth/RLS change, grant, financial activation, messages or real-client processing. Alex stays paused. The Master owns the consolidated CURRENT_BUILD_STATE and 57-package dispositions.

## Completed

**Actual member daily habit action.** The existing dashboard's Check In action now captures the current actor/task, habit, exact target and existing UTC RPC date before awaiting. A document-local habit/day map suppresses rapid duplicate actions and retains successful or uncertain outcomes across rerenders. A real target of zero remains zero. Malformed/negative targets do not dispatch. The existing `check_in_my_habit` RPC, its arguments and server ownership/uniqueness remain authoritative; no new RPC, database table, client contact selector, permission or backend was introduced.

A lost/non-authoritative response displays an explicit uncertain state. Its **Check status** action performs only the existing authorized `my_app_bootstrap_v2` projection read (`select('daily_actions').single()`); it never automatically repeats the RPC. A successful response is distinguished from a successful refresh. The same user/token renewal preserves the task; changed identity/logout invalidates it and prevents late UI activity. Date is frozen before a midnight boundary; a previous-day completion cannot mark today's card complete.

Previously, this action reloaded the entire dashboard, destroying an unrelated weekly draft. It now refreshes only the existing daily-actions projection and leaves other forms mounted. No questionnaire answers or extra source records are read. The new read contract is derived from the existing dashboard's bootstrap `daily_actions` field, not a new privileged service.

**Independent QA found an additional race.** Concurrent uncertain-status reads could deliver a 42501 denial followed by an old success, restoring a protected daily card. The final helper serializes status reads, fences them with a monotonic read sequence and the existing session/task epoch, and establishes a document-lifetime hold on authoritative 42501. A stale read, pending write or later renderer cannot undo that denial. Ordinary network failures preserve the uncertain card/draft; they do not establish a denial. Restoration requires a fresh authorized full document load, rather than merely another token/getUser check. The exact independent assertion passed unchanged; its original failing evidence remains in the QA worktree.

**Connected fictional Client/Coach progress.** The existing detached Share Center/Companion loopback UI now invokes `POST /api/progress`, backed by additive `tools/wave6-progress-contract.cjs`. It projects invented habits, goals, weekly activity and coaching usage into a minimal read-only view. Own Client and explicitly assigned active Coach fixtures pass; unassigned/inactive/mismatched fixtures and arbitrary caller role/contact/household/health/financial/approval fields fail closed. No household, personal notes, clinical values, identities or editable balance controls are returned. Unknown values remain null/Unknown, real zero remains zero, and over-limit usage is held for review rather than silently clamped or changed.

The detached reader compares independently injected current fixture authority and two consistent source snapshots across asynchronous boundaries before projecting. Same-account transport renewal is distinct from changed authority. The native UI clears stale persona responses, reports network failure without writes and clears content on cross-tab fixture logout. The current Share Center's actual QR rendering, approved synthetic copy, nonfinancial attribution/event journal and detached educational source citations continue functioning alongside the new view.

**Important:** persona selectors and provider snapshots are explicitly invented local test scenarios. This is not managed Auth, MFA, production Coach permission verification, a persistent backend or proof of actual founder-source approval. No new methodology, medical advice, clinical score, coaching program policy, 49-day content or 113-submission promotion was added.

## Owned changes and preserved contracts

- Existing application file: `member/member110.js`, only daily-action state/render/helper/handler and teardown of its new in-memory state.
- Existing local tool: `tools/affiliate-share-preview/index.html`, `preview.js`, `server.cjs`.
- New detached reader/fixture provider: `tools/wave6-progress-contract.cjs`.
- Tests: `tests/wave6-features/`; evidence and report in this directory.

Existing alternate `markHabit` (Mark Today), both meal/workout definitions, shared Auth subscription and `loadDashboard` are byte-identical to the accepted base. **The new daily-card guard does not claim to serialize the separate Mark Today surface or different tabs/devices.** Historical executable contract `tests/wave2-client/sql-contracts.test.cjs` records habit/date upsert and cross-client denial, but current combined PostgreSQL execution is blocked and was not repeated here. No stronger durable cross-surface exactly-once guarantee is claimed.

Canonical SQL/migrations, all 13 Functions, portal/Coach runtime, protected Roadmap/engine/45 directions/voice/scoring/questionnaire, assets/styles/logos/portraits, production settings and financial source remain unchanged. Existing affiliate/education adapters, catalog engine, fixture providers and QR encoder are byte-identical. All101 requirements, ten detail groups and original57 full-package definitions remain exact. The approved design assets and current classes remain in use; no public website or production build allowlist changed.

## Tests and retained evidence

Final pinned runs, after the QA-denial correction:

| Receipt | Actual outcome | Boundary |
| --- | --- | --- |
| `DAILY_PINNED_FINAL.tap` | 25 PASS / 0 FAIL | 24 author actual-renderer/handler DOM cases plus the unchanged independent QA denial-race assertion. Includes auth mismatch/logout, late completion, exact target/date, same-account renewal, draft preservation, double action, lost response/readback, genuine denial and denial persistence. |
| `REGRESSION_PINNED.tap` | 192 PASS / 0 FAIL | 190 Node/DOM/HTTP checks: 50 new detached progress cases,14 new real loopback HTTP cases,126 retained member/check-in/share cases; plus2 retained native scenario-race cases. |
| `BROWSER_VERIFIED.tap` | 12 PASS / 0 FAIL | Chromium1248/WebKit2336, each390/768/1440: six actual member cases and six connected loopback UI cases. Member service/SDK transport is entirely fictional/intercepted. No external requests, page errors or overflow. |
| `PRESERVATION_PINNED.tap` | 6 PASS / 0 FAIL | Actual Git object equality over protected tracked source families, exact101/10/57 registers, alternate application handlers, unchanged foundational adapters/encoder and no new privileged/external transport in reader. |
| `BASELINE_REPRODUCTIONS.tap` | 3 expected historical defects reproduced | Exact Wave5 source: daily double action emits two RPCs; verified getUser is skipped; whole-dashboard action refresh erases an unrelated draft. These are historical defect evidence, not corrected-business acceptance. |

Final aggregate author execution: **221 Node/DOM/HTTP/source checks and14 native browser cases PASS** (235 executions), including one unchanged independent QA assertion. The3 intentional old-defect reproductions are separate. Independent QA must still execute the final integrated source; these are not 235 complete journeys or independent original tests.

Initial failures remain retained: `INITIAL_DAILY.tap` (17PASS/3FAIL), `DAILY.tap` (19PASS/1FAIL), `HTTP.tap` (sandbox loopback EPERM), `BROWSER.tap` (9PASS/3FAIL), `BROWSER_PINNED.tap` (11PASS/1FAIL), `PRESERVATION.tap` (3PASS/3FAIL). Two first daily failures exposed the real unrelated-draft loss; one was a shared mutable fixture snapshot fixed to model real JSON responses. Chromium browser assertions originally counted public fresh-login inputs as retained private data; the corrected assertion verifies private check-in content is gone after actual logout navigation. A later WebKit execution-context race in that assertion is retained; final tests explicitly await main-frame navigation/DOMContentLoaded and inspect a fictional-only dispatch counter across the document transition, so late old-document dispatch cannot be hidden by a fresh fixture. Preservation initially referenced two incorrect register filenames and exceeded the default child-process buffer on a public image; corrected paths and Git-object comparison retain exact byte-equality checks. No runtime denial was relaxed to fix these harness issues.

## Remaining limits and next safe action

No new complete integration package is certified by this lane. The current five real operations scope failures and the combined PostgreSQL/rollback blockage remain Lane A/B/QA responsibilities; passing local UI fixtures do not close them. Real managed identity, production permission/source checks, full paid access, Support/financial compatibility, household/minor policy, persistent attribution and full-business journeys remain held. The missing127-section affiliate source remains explicitly missing.

The daily habit guard is memory-only, not persistent cross-tab deduplication. The alternate Mark Today path remains unchanged; broad goal/assignment retry/idempotency policy is not invented. Coach progress is a connected fictional projection, not a newly released staff dashboard or a grant of real visibility. Usage is read-only and never consumes, extends or alters entitlements.

Next: independently execute this exact source, reconcile Lane B scope corrections and run the combined security/rollback suite when a positively owned disposable PostgreSQL environment is available. No new Owner approval is needed for that bounded local work. Any production migration, release, paid operation or protected-client action remains separately authorized. PR59 stays draft, unpushed and production NO-GO.

Rollback is local Git reversion of the five source/tool files plus additive tests/docs. There are no stored client records, grants, SQL or production settings to reverse. This restores the older daily action's known weaknesses, so it is development history rather than a recommended production rollback.
