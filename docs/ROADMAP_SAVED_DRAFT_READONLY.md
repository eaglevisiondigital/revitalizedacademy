# Saved founder draft viewing — local release package

## Scope

Narrow forward patch on approved production source `39ebc602e5a4fbc9ce235ef8bc5e8b36a4352af4`, deploy `6ad92cca86f0c640fed9e575`. No backend, SQL, Function, scoring, consent, permission or feature-control changes. Only two shipped static paths change: `portal/index.html` (controller cache reference) and `portal/portal-roadmap-processing.js`.

Opening the source-specific workflow now requests `read` only. Repeated concurrent opens share an in-flight read. Saved reports display the actual server revision under the unchanged confidential header, with the existing Overview/12 Drivers/Action Plan appearance and feedback controls. Unknown revision metadata is never fabricated as Revision 1. Missing drafts show a separate explicit generation button; the existing source-scoped `process` action runs only on that click. Regeneration remains a separate explicit action using the saved version ID, existing idempotency key and server authorization. Generation/regeneration is guarded against overlapping clicks. No automatic retry is added.

All host authentication/task/source guards, server-side source/storage/B5/B6/grant/operator/expiry controls, immutable versions, review-write permission and sealing checks remain unchanged. Logout/source close/account reset clears private DOM; late responses cannot restore it. Expired authorization renders no private report or generation action. Read failures show a clear message and never fall back to processing.

“Read-only” means no document/version/feedback/consent/grant/job or processing-state mutation. The existing protected RPC still records its normal security read-access audit and takes its existing authorization locks. This patch does not remove or bypass audit logging and does not represent the RPC as a SQL `BEGIN READ ONLY` transaction.

## Tests and evidence

Twenty-two Node/DOM tests pass, including existing narrative/cited feedback/storage-purpose regressions plus repeated opens, concurrent reads, explicit generation/regeneration, expiry, logout, failure and source separation. Four actual local PostgreSQL 17/RPC/handler/renderer tests pass: preserved saved version/document and existing attributed feedback; unchanged other pending jobs/consents/grants/controls; rejected wrong role/fourth source/missing personal consent; expired session, processing hold and actual expired batch denial. The handler's sealing identity accessor is configured to throw in these read tests, proving read does not request it. Only fictional local sources and a disposable database are used.

Six intercepted-network Chromium/WebKit desktop/tablet/mobile cases pass: revision label/all twelve cards/three tabs, visible actions outside manual grid, keyboard/touch, reopen, full page refresh, denied source/authorization, account switching/logout, failed network without retry. No processing action occurs. Screenshots and logs are under the workspace's `deployment-evidence/2026-10-22-saved-draft-readonly/`. Deliberate network failures are recorded separately from unexpected errors. Test harness setup corrections are documented there and did not change production or relax a security rule.

The two existing full worker browser tests now explicitly click generation for fictional pending jobs, matching the corrected behavior. Their complete worker suites were not repeated for this frontend patch; focused native and browser tests cover the new behavior. No production worker was invoked.

## Release and rollback

Prepare a digest overlay on the exact current composed production manifest: two reviewed updates, 450 retained paths, zero additions/removals, all thirteen existing Function archive hashes/configurations/schedules retained. Preserve runtime-config injection in the composed HTML; do not perform a whole-site rebuild or rebuild Functions. Candidate and publication both require separately scoped owner approval and a fresh canonical drift check. The existing exact production deploy is the rollback target; preserve both replaced static byte streams and original hashes.

After publication, verify canonical artifacts and fictional-source read-only acceptance. A genuine founder can then use People → Vitality Roadmaps → Assessment Calibration → Caroline → Open authorized internal draft workflow, read the visible Revision 1 and use its three tabs. No manual scoring, new B6 or repeated storage consent is required. Do not click regeneration while merely reading.

## Caroline Revision 2

The already recorded one-Caroline regeneration authorization is separate from this local patch. It remains conditional on the exact live narrative source, actual current founder session, pinned source, existing consents/grants/operator/key and the original deadline of October 22, 2026 08:45 America/Chicago (13:45 UTC). This work neither invokes generation nor extends the window. The existing live `Return for regeneration` action supports the separately authorized one-time action if all live gates pass before expiry; a UI repair is not a new scoring-policy approval or processing grant. If this frontend patch is released first, explicitly reconfirm the generation authorization covers the new frontend source while the narrative/worker remains unchanged. Stop on expiry or a failed gate; no re-consent, admin impersonation or automatic retries.
