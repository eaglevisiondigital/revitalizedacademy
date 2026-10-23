# Caroline saved-review continuity, citations and renewal blocker — October 22

Status: **local UI repair tested; production unchanged; review access expired**. This supersedes any earlier claim that fictional acceptance alone established production reliability. No founder retry, consent repetition, real report read, regeneration or hosted write was performed.

## Access and saved feedback independently verified

At 19:56–20:03 America/Chicago, production remained deploy `6ada47cd5b407f6c854d1b24`, source `5917360a170e439bc0f1159ad29364571c2fe7d0`. Four public lifecycle scripts match the published artifact digests. Full 453-path/13-Function metadata, settings, schedules, beta and publication-lock comparison passes.

Exactly one historical Justyn-only, Caroline exact saved Revision 2/source/document grant exists, unrevoked but **expired October 22 at 17:00 Central / 22:00 UTC**. Both saved revisions recompute to their immutable hashes; their source pins, document/job digest, consent/grant/cohort digest, permission digest and installed function/migration digests match the prior publication receipt. Alex/Johnny remain pending/unattempted; the fourth source remains excluded. Controls remain process/review true and ingest/approve/internal_pdf false; original batch and sealing authority are expired, so those flags do not authorize processing.

**One proposal was durably saved:** Cellular Hydration; feedback revision 1 on saved document Revision 2; Justyn attribution and matching review audit; assessment, reason and proposed interpretation present; five citations belonging to that saved Driver. Zero duplicate request keys or identical proposals; no feedback after the old review cutoff. No answer, symptom, reason or interpretation body was retrieved. Saving metadata is not a claim about any later unsaved typing.

The proposal is append-only attributed feedback, returned with saved review history under **Attributed founder proposals**. The read/review RPC returns `rules_adopted:false`; no report or rule is updated. The existing worker applies prior proposals to a new attributed document only during a separately authorized future generation (`netlify/lib/roadmap-processing.cjs` → `pipeline.applyReviews`). That operation is neither permitted by the proposed review-only grant nor executed here. Founders can critique the proposal; adoption into a future report or numerical policy remains a separate controlled decision/version.

## Genuine renewal blocker; do not rerun the old private command

The requested new cutoff is **October 24, 2026 08:00 America/Chicago = 2026-10-24T13:00:00Z**. This exact instant governs rather than a rounded relative duration.

The installed reviewed migration `20261022135700_roadmap_saved_revision_review_only.sql` (ledger 20261022144239) enforces:

- A primary key on `singleton`, allowing one immutable grant total.
- A table CHECK and private authorizer hard-capped at `2026-10-22T22:00:00Z`.
- An authorizer that rejects changed expiry/identity/source/document/operator/reference and an API assuming one grant.
- Immutable UPDATE/DELETE/TRUNCATE protection and private RLS/ACLs.

The reviewed `deployment-evidence/2026-10-22-saved-review-release/private-review.sh` is a **completed one-shot**, with matching fixed cutoff, old baseline, and an empty-authority prerequisite. The correct confirmation was two separate prompts, `REVIEW ONLY`, then `JUSTYN SIGNED IN`; changing those words cannot solve the current constraints. Do not rerun, rearm, edit the completed package, change an old row, bypass a CHECK, silently rotate authority, or prompt for credentials.

**A valid replacement procedure does not yet exist.** Merely obtaining Owner credentials cannot unblock it. The smallest next authority package is one guarded, locally tested forward renewal migration that preserves the historical grant/audit byte-for-byte and permits exactly one separately audited, immutable replacement for the same founder/source/saved-R2 hash, no later than the requested cutoff. It must retain live founder/actual privileged Owner authentication, retained consent validation, source/document checks, revocation, RLS/ACLs and server-clock denial. Only saved read/cited feedback are permitted; expired batch/key and all processing endpoints remain untouched. Install empty authority only after the exact SQL/hash/security tests are reviewed and explicitly authorized. Then prepare one new integrity-pinned runner using the existing private no-echo, bound-parameter, direct-IPv6/TLS/Owner-audit pathway; fresh personal confirmation and Owner authentication remain outside Codex. There is no safe executable old command to hand out now. No new consent is required.

This is a material protected authority change, outside the instruction to reuse the **existing reviewed** grant path. No migration, replacement grant, session impersonation or private credential prompt was attempted. The UI fix below is independent and does not renew access.

## Remaining production failure paths and local correction

The published recovery code repaired report-controller state but left core staff reauthorization and permission loading unchanged. Exact live paths:

1. `TOKEN_REFRESHED` forces `resolveStaff`; any `get_my_staff_access` error calls `showLogin`, which calls `endStaffDocument` for an existing user and `location.replace`. This destroys RAM even after the report controller preserved its DOM.
2. The same renewal reloads the staff directory and dashboard. A transient directory failure empties the role lookup; the saved-review permission/focus gate treats the missing role as denial and purges the review.
3. `loadPermissions` empties permissions on any transport failure and emits no completion event. The saved-review focus/ten-second fallback then treats that temporary state as permanent denial and purges feedback.
4. A transient `getSession` error with a null result is checked as identity loss before its error classification.

All three first paths reproduce against the exact published source: 18 fictional Chromium/WebKit desktop/tablet/mobile cases, including a real full-document navigation for the staff-RPC failure. Actual Justyn browser request/event telemetry was not recorded; these are proven code triggers consistent with the incident, not a claim that a specific historical request is known.

Small correction in five runtime files: unchanged-authority token refresh rechecks staff access and permissions without rebuilding the directory/dashboard; transport failures mark access as temporarily unavailable and invalidate task guards, pause/hide private content but hold original DOM/feedback only in RAM. Explicit Resume revalidates current staff access/permissions and exact saved document/grant before restoring it. An authoritative denied response, changed role/scope, logout/account switch, source/hash mismatch or expiration clears private state. No cached permission permits a request while revalidation is incomplete. Same-account callbacks stay synchronous; async work remains outside the SDK notification callback. No write replay is added; the existing single-flight/idempotent save and durable-history reconciliation remain authoritative.

Actual pinned public SDK 2.57.4 uses BroadcastChannel to deliver auth changes to other tabs, and visibility-driven auto-refresh. Inspected public bundle SHA256 `9f73dc4c7325b9eca904f9f2798eb7fe96b3caaabcddcf5f4563e90cf52bd835`. Two additional browser cases use that exact SDK with fictional tokens, actual refreshSession/BroadcastChannel/logout, and fully intercepted Auth/data endpoints. Both tabs recover their own text after same-account renewal, one tab's staff-RPC failure pauses without reload, and cross-tab logout purges both. No real authentication or provider traffic. Reference: https://supabase.com/docs/reference/javascript/auth-onauthstatechange .

## Citation correction without changing the saved document

Only the renderer changes. It uses the saved document's existing per-symptom computation trace and exact field association to display symptom + follow-up question, parent question, that citation's own recorded response and unique source field/status. It never spreads a symptom's answer to another. Protected aggregate metadata confirms **all 180 generic follow-up citations** in the existing saved R2 have exact trace ownership available; no actual answers were retrieved to establish that count.

Unknown parent ownership is disclosed rather than inferred. Empty answers are labelled; shared values are not duplicated. Drivers with no citations show a clear message and disabled cited-save control; no evidence is fabricated. Text is inserted with textContent, never interpreted as HTML. Existing citation values, initial selections and server allowlists remain unchanged. New labels are authorized-view-only, not stored in browser persistence or telemetry.

## Tests, preservation and release boundary

- 56/56 Node/DOM/core-session checks pass: renewal, transport error/throw, null-session transport error, source/version/expiry/role/write denial, concurrency, uncertain save, durable reconciliation, duplicate prevention, citation context, no evidence and escaped labels/storage.
- 18/18 baseline defect cases reproduce the three remaining triggers.
- 6/6 integrated Chromium/WebKit desktop1440/tablet768/mobile390 pass: five-minute idle, typing/controls/caret/tab, two tabs, both access transport failures, permission failure, no directory/dashboard rebuild, read recovery, keyboard/touch/scroll, exact source context, uncertain save reconciliation, denial, expiry, logout/account switch. Zero ordinary-renewal document restarts, zero worker calls/hosted requests.
- 2/2 additional actual-pinned-SDK two-tab Chromium/WebKit cases pass. They are still fictional local evidence, **not founder production acceptance**.
- No database or Function source changed; no push, migration, deployment, publication, grant, feedback write, processing or configuration change. Both revisions and the one existing proposal remain untouched. HHL/Founders/portrait/financial/beta assets remain unchanged.

Local branch `codex/roadmap-review-continuity-citations`, direct parent 5917360. Runtime inventory: portal/index.html (four cache refs), portal/portal.js, portal/portal-permissions.js, portal/portal-roadmap-processing.js, portal/portal-roadmap-saved-review.js. Tests/docs only otherwise. Exact final SHA, source/deployed hashes, 453-path overlay (448 retained/five updates/zero additions/removals), 13 Function metadata and rollback are recorded in `deployment-evidence/2026-10-22-review-continuity-citations/RELEASE_PACKAGE.json`. Existing production index injections are retained byte-for-byte apart from the four cache references. Never replace production with an unreviewed full branch build.

UI release requires separate exact-SHA push/candidate verification and publication authorization. Rollback is the unchanged existing canonical deploy; no database rollback accompanies this UI patch. Access renewal requires the separate protected authority correction above; **no production-ready renewal runner or migration is claimed**.
