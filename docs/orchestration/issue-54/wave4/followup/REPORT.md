# Wave4 QA followup — modal generations and Coach loader continuity

COMPLETED

Independent QA identified real gaps in author commit7662679: reopening a new goal/habit draft while the old RPC was still pending let old success overwrite status and close the new draft; Coach successful-load then denied refresh retained a prepared workspace, and a pending load could restore it after contact close. Initial QA receipts are preserved here, including96/97 author-harness rerun (one combined-tree scope assertion),3/5 member adversarial,1/3 expanded Coach and0/4 browser adversarial. Earlier author passing counts did not cover these conditions and do not override those failures.

Master explicitly extended runtime ownership. Member edits are exactly openGoalModal/openHabitModal plus the corresponding create handlers: each open increments a form-local generation, resets only that new draft's busy state, and each submit captures its generation before awaits. Old completion/status/timer/finally cannot target or unlock a newer draft. A successful original write still refreshes the authorized dashboard; no old write cancellation or backend idempotency is claimed. Existing identity/epoch/run checks remain intact.

Coach edits are exactly one local load-sequence variable, loadCoaching, a coaching-only clear/hide helper and contact-closed invalidation. Each await is checked against the captured actor/contact/sequence before global state or UI mutation. New contact/close clears and hides the old coaching state promptly; superseded results cannot overwrite a newer contact. Current definite42501/401/403 clears cached access/membership/arrays, closes modal, resets coaching forms and removes coaching-only rendered private lists. Current same-context transient failures show an error while preserving drafts and prepared state. The existing six-field invoker capacity query, staff selection rules, SQL/RLS and shared Auth remain unchanged.

TESTED

Actual suites and counter details are in RESULTS.json. New modal cases:0PASS/8FAIL before,8PASS after. New Coach lifecycle cases:3PASS/8FAIL before,11PASS after. Full lane DOM116/116PASS; inherited Wave2/Wave3 member21/21PASS; real Chromium/WebKit34/34PASS across320/768/1440. Read-only QA assertions executed against repaired sources:7/7DOM and4/4real-browserPASS. QA browser runner redirects only its source root/output declaration to this lane's owned output; its assertions/behavior are unchanged and source hash is recorded. These executions are author reproductions of QA cases, not an independent-QA signoff. Some inherited/author/browser cases intentionally PASS by reproducing dated baseline defects; suite counts are not complete-journey acceptance.

Covered reopened pending success/42501/23505, same-user renewal, newer-form busy ownership, successful-write refresh, Coach denied refresh after success, transient draft retention, close at either await boundary, A/B out-of-order, actor change and unchanged actor. Existing empty capacity/selected-Coach cases still pass. No new browser profile, real credentials, private data, production calls, SQL or Alex action.

PRESERVATION AND DOCUMENTATION

Preservation strips precisely the original six member handler blocks plus two newly cleared modal-open functions, and explicitly named Coach loader/clear/sequence/contact-close blocks; all other source compares byte-identically to the accepted baseline. Master-provided third assertion now scopes to application/protected runtime families and exact two-file runtime allowlist, allowing other lanes' additive tools/evidence; Master independently owns the combined-tree path check. Current source pins updated. No broad runtime allowlist was introduced.

Only member/member110.js, portal/portal-coaching.js, tests/wave4-member and this issue-local evidence changed. Historical reports/results remain, with this followup superseding their current-readiness interpretation. No shared build register, task helper, checkin, CSS/assets/navigation/schema/provider/permissions change. Partial #57N05/N07/C02 continuity evidence only; full packages and paid/family/49-day/allowance journeys remain blocked/unverified.

NEXT / ROLLBACK / CHAT HANDOFF

Run node --test tests/wave4-member/*.test.cjs; inherited command in README; browser.cjs and run-qa-browser-reference.cjs accept RVA_WAVE4_MEMBER_OUTPUT to preserve receipts. Independent QA must rerun this exact followup commit before Master integration. Production remains unapproved. Local rollback to7662679 restores the independent-QA failures; no data/database rollback is involved. Other portal mutation callbacks/SDK provider lifecycle remain outside this loader-only claim. Alex remains paused and untouched.
