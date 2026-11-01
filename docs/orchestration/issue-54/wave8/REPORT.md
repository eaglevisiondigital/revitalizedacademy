# Issue 54 — Wave 8 goal-status continuity, LOCAL ONLY

Base `2cbd6de16097890f501a410a276308ca5c4e000c`; branch `codex/rva-wave8-operations-20261101`; worktree `academy-wave8-operations`. Master owns integration/build-state updates. Only existing application file changed is `member/member110.js`; Coach, Family, SQL and shared Auth source are untouched.

## Actual functional change

The mounted Goals and Goal History actions now coordinate by the current actor and goal ID across replacement renders. Complete, Pause, Resume, Cancel and Reopen preserve their existing RPC names, payloads and status meanings. Buttons freeze the source row and render identity before awaiting `getUser`. A replaced render cancels undispatched work; an established different verified identity ends the private document. Same-account renewal retains the task and unsaved drafts.

An accepted status update reads only the existing authorized `my_goals` projection and re-renders its goal cards. It no longer remounts the entire dashboard and wipes weekly-check-in or unrelated modal drafts. Current status and requested status are attributed to the exact goal title. Pending operations remain locked across re-rendered rows. Read completions cannot replace a newer source view.

Response loss, an unexpected RPC result, or failed post-write readback produces an explicit held status. The subsequent action is **Check status**, using read-only reconciliation; it never silently repeats the mutation. For a lost response, even a matching saved status does not prove that exact request committed: the interface reports the observed state and retains the earlier request as unconfirmed. A conflicting saved status remains held too. This deliberately avoids inventing an idempotency capability absent from the existing RPC.

The captured existing `update_my_goal_status` routine returns boolean `found`. The UI now requires `true` before treating the operation as accepted. `false` holds unavailable/unauthorized goal actions; `null` or another unexpected response remains uncertain. Authoritative 42501 at the RPC or read clears both goal surfaces and prevents later source renders from reviving them. A verified absent user also holds the goal view. Nonauthoritative auth/network errors preserve same-user drafts and send no update.

## Executed evidence

- **135/135 Node/DOM checks PASS:** 28 new mounted goal-handler cases plus 107 retained member continuity, modal-generation and dual-habit checks. Fictional data only; no SQL or hosted service was called.
- **6/6 native cases PASS:** Chromium and WebKit at 390, 768 and 1440px, serving actual dashboard HTML/CSS/JS with fully intercepted fictional SDK transport. Verified one dispatch under double-click and token renewal, narrow readback, retained weekly/modal drafts, lost-response uncertainty, revoked-read clearing, logout-before-dispatch, responsive overflow, zero unexpected page errors and zero external requests.
- **3/3 intentional accepted-baseline reproductions PASS:** full-dashboard draft loss, blind retry after lost response and replacement-row duplicate dispatch. These are historical defect evidence, not corrected acceptance.
- Syntax and diff-whitespace checks PASS. `SOURCE_PINS.json` records runtime/test/input/evidence hashes.

`NODE_INITIAL.tap` retains one initial test failure: changing a pending button's label to Saving made an unchanged double-click test's Pause lookup fail. The final implementation preserves the original action label while disabled/aria-busy; no previous assertion was weakened. `BROWSER_INITIAL.tap` retains all six sandbox launch failures (macOS EPERM/abort before product execution); the separately approved local browser launch then passed. Earlier successful intermediate receipts remain separately labeled; final frozen source receipts are `NODE_RELEASE_SOURCE.tap` and `BROWSER_RELEASE_SOURCE.tap`.

## Security and limitations

No RLS, migration, database function, privilege, grant, stored record, RPC payload, Auth configuration, SDK version, canonical Function, approved asset/CSS, protected Roadmap/methodology/voice, scoring, financial source or household policy was changed. All 101 requirement groups and ten source-detail groups remain intact. Alex stays paused. No production/private read, client processing, issuance, deployment, message, financial activation or source push occurred.

The coordinator is in-memory and same-document only. It does not establish cross-tab/device durable deduplication, actual paid-member positive access, managed Supabase Auth/MFA/JWT/session revocation or complete business acceptance. Existing backend ownership/RLS/transaction semantics remain authoritative. A held uncertain request is not automatically unlocked by a matching observation; a durable request identifier and backend reconciliation policy would require separate engineering review, not a browser-generated assurance.

The existing captured routine/view definitions and prior current-catalog tests were inspected, including the invoker view and false paid-access hold. No disposable PostgreSQL slot was used by this lane; Lane A/QA own SQL execution. The Supabase skill and current getUser/select documentation were consulted. Direct changelog fetching was DNS-blocked in this lane; Master independently confirmed no relevant API change. No dependency/security setting was changed. References: https://supabase.com/docs/reference/javascript/auth-getuser and https://supabase.com/docs/reference/javascript/select .

## Rollback and next checkpoint

Local reversal is the one member JavaScript diff; there is no persistent state or schema rollback. Keep historical receipts and prior branches. Independent QA should run the unchanged 28 new cases and challenge delayed read/RPC, source replacement, false RPC, identity/session change and denied-render revival. Production remains NO-GO. The bounded local checkpoint needs no new Owner approval; any hosted release remains separately authorized after security/business gates pass.
