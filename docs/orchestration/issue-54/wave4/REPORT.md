# Wave4 Lane B — member / Coach continuity (LOCAL ONLY)

COMPLETED

At accepted base5926b915f60b1be6d009c94362b91356a303cb33, actual full member JS/DOM reproduced stale progress identity access, duplicate pending submissions and stale goal/habit errors. Master reviewed and approved six handler-only repairs. A separate source defect prevented Coach workspace loading: twelve destructured results but eleven queries. Master separately verified existing invoker admin_coach_capacity metadata and approved only the missing six-field query plus error aggregation.

CHANGED

- member/member110.js: markHabit, updateGoalStatus, updateHabitStatus, createGoal, createHabit, and progress submit only. Capture user/epoch/run, payload and member IDs before await; actual getUser identity/error validation before writes; reject stale completion/error/reload; form/per-row busy guards clear in finally. Existing RPC names/argument schemas and progress table/payload remain intact.
- Create timers also require their still-current task, success-status marker and idle captured form. Existing modal-open functions clear that marker, so reopening a new draft survives an old timer. No modal lifecycle helper was changed.
- portal/portal-coaching.js: append admin_coach_capacity.select(user_id,accepts_new_clients,max_active_clients,max_sessions_per_week,active_clients,scheduled_sessions_this_week), then include capacityResult in failure checks. No new capacity/permissions/view/defaults.
- Tests/evidence only under tests/wave4-member/ and docs/orchestration/issue-54/wave4/.

Actual DOM/API contract: goal/habit forms keep existing required typed fields, status aria-live=polite and existing RPCs; progress keeps metric catalog min/max and zero semantics. Current form busy is aria-busy plus disabled submit; captured node references in finally cannot unlock a replacement form after account reset. Row busy covers a rendered row object, not every UI surface or server request. Same-user token renewal retains the existing task. Auth/helper/checkin/CSS/assets/navigation/migrations/provider/config/source lineages remain unchanged, proved by byte comparison outside the owned blocks and exact Coach diff.

TESTED

Final: lane DOM97/97 PASS (including9 expected baseline reproductions), inherited21/21 PASS (including1 expected baseline reproduction), and browser34/34 PASS (including2 expected baseline reproductions). These are separate suite counts, not full-journey acceptance. Detailed counts are listed in RESULTS.json. Before: original44 continuity cases15PASS/29FAIL. Eight member baseline defect reproductions plus one Coach loader reproduction PASS when they observe those defects. A later modal-reopen edge produced2FAIL before its bounded guard. These retained receipts describe earlier source; they are not unresolved final runtime failures.

Current:80 continuity cases plus3 preservation checks,8 member baseline reproductions,1 Coach baseline reproduction,2 unchanged Coach mutation denial/payload checks,3 corrected loader checks and21 inherited Wave2/Wave3 member regressions. Browser uses actual scripts and CSS with fictional transport in Chromium/WebKit at320/768/1440: form focus, live errors, retry, zero horizontal overflow, pending dedupe, renewal, progress logout/switch, and modal reopen guard. Screenshots retained. One intermediate timer-test run had4 selector failures because its locator targeted the backdrop under the dialog; fixed to the real Close button without runtime changes, with receipt retained.

SECURITY / PRESERVATION

Null/wrong-user/auth-error responses deny before each affected RPC/write. Pending logout/switch before verification dispatches no new write; already-issued writes cannot be canceled or undone by these client guards. Their late errors, success, timers and reloads are ignored. Server42501 and23505 remain visible errors without clearing submitted input; retry unlocks. Concurrent requests are suppressed per form/row only: no server idempotency, cross-tab/exactly-once or committed-write cancellation claim.

Coach loader tests execute actual module and portal DOM. Existing selected Coach remains enabled even when capacity says no new clients; unselected unavailable Coach remains disabled; empty capacity remains "capacity not configured". A denied initial capacity query surfaces the backend error and keeps the initially hidden workspace hidden. Existing broader portal contact-switch/lifecycle semantics were not refactored or certified. No backend RLS or private-note authorization assertion is derived from transport mocks.

Master metadata receipt: ../deployment-evidence/2026-11-01-wave4/coach-capacity-metadata.json SHA256 a9818db385c93e6242b1f0d20564ea93e4d224dc6157ebe4f3b0e9472e1563eb; existing security_invoker=true view. This lane made no live calls, private/Alex reads, Auth actions, grants, processing, SQL changes or deployment. Source/runtime hashes in source-pins.json. Wave3 test/results unchanged. Paid Client positives remain blocked by the existing exact SELECTfalse payment predicate; these allowed transport fixtures do not release paid access.

DOCUMENTATION / #57 PARTIAL MAPPING

This report, RESULTS.json, source pins and handoff are issue-local; Master owns CURRENT_BUILD_STATE and shared registers. N05 stale-response/account-change and N07 failure UX gain local subcases; N02 Coach selection and N06 held-session boundaries remain partial; C02 goal/habit/progress continuity gains frontend-only evidence. No full #57 package, full Coach private-data permission or multi-organization journey is promoted to PASS.

UNRESOLVED / NEXT GATE

Independent QA exact commit rerun, Master integration, then separate release review. Real SDK broadcast/revocation/provider/backend/session integration, paid activation, complete family/49-day/allowance/business journeys and other mutation handlers remain outside this package. No new policies were invented. The strongest next local slice is independent whole-shell Coach contact-change and denied refresh continuity review with its own bounded ownership; it must not imply protected portal authorization.

ROLLBACK / CHAT HANDOFF

Local runtime rollback is to restore exactly these two source files from5926b915; it reintroduces the demonstrated member races and Coach loader exception. No database/data rollback is involved. Current candidate is unpublished: six member handlers hardened and one missing existing Coach query restored, with fictional browser/DOM evidence. Review exact commit in independent QA and integrate under Master; production/private actions remain unapproved.
