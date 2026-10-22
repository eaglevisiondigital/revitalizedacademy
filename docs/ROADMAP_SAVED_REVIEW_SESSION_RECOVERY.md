# Saved Roadmap founder review — local session-recovery repair

Status: LOCAL ONLY, not pushed/deployed. Parent/current verified canonical source `3186f442f8ed8bf523931dd2eebe1043facd3081`, deploy `6ada2143916c7d122518c03c`. Branch `codex/roadmap-review-session-recovery`.

## Behavior repaired

Same-account TOKEN_REFRESHED forces the existing staff permission recheck and increments its guard epoch. The old saved-review listener closed its dialog on every permissions-loaded notification, even unchanged permission reloads. Its background read checker also permanently cleared the report after a single error. Unsaved feedback existed only in those removed DOM nodes.

The core staff lifecycle, authentication settings and permission-refresh logic remain unchanged. Only the independent saved-review adapter and its opt-in controller recovery path change. `portal/index.html` updates their two cache references.

- During token renewal, detach private report nodes into a memory-only fragment and disable interaction. Preserve the report, Driver/tab/search, expanded sections, citations, text, caret and scroll/focus. No browser storage, URL, logging or telemetry contains those values.
- After successful same-account permission reload, capture the current authenticated task and make a protected read. The server rechecks current session, source-specific retained consents, review authority and immutable document hash. The browser additionally requires the exact prior version/revision/document content and a nonextended active expiry before restoring nodes.
- Repeated/overlapping refresh events coalesce; late old reads cannot clear restored state. Same-account multiple tabs remain independent. No worker or processing endpoint is called.
- One transient read failure pauses with **Resume saved review**; it retains edits only in this open tab. Resume performs read only. Confirmed denial, logout, account switch, revoked read/feedback permission, changed source/document/version or expiry clears private content and held memory. Original expiry timer keeps running while suspended.
- Saves are single-flight and retain a unique request key. They are never automatically replayed. After a save interrupted by renewal, a protected read may confirm the exact attributed proposal at its expected feedback revision, matching founder and complete proposal content. Then it reports saved without a second write. If the outcome cannot be confirmed, resubmission remains blocked and the message directs the founder to attributed history. A late acknowledgment cannot interrupt an already-confirmed result.
- Successful feedback updates attributed history without rebuilding all Driver forms, preserving other unsaved edits. Repeated submission of an unchanged confirmed proposal does not write again. Definite validation errors retain editable text; a feedback concurrency conflict requires read-only resume before another explicit save.
- Dirty feedback warns before explicit dialog close/full navigation where supported. Closing/crashing/reloading the tab cannot recover unsaved memory; this patch does not add sensitive browser persistence.

## Preserved boundaries

All twelve Driver sections, evidence checkboxes and cited proposal contract remain. No scoring/interpretation/template, saved document, source fingerprint, consent, grant, audit policy, RLS, SQL/function definition, migration, queue, Function archive, schedule, runtime secret or processing control changes. The existing legacy processing path does not opt into saved-review recovery. All13 hosted Functions and HHL/Founders/payment/beta assets remain unchanged.

The original processing authority remains expired. The independent review-only authority is still bounded by **October22 2026 17:00 America/Chicago /22:00UTC**. This implementation cannot renew it, process/regenerate, approve, export or deliver a report. If that deadline passes, access stays denied even if the patch is later published.

## Tests

- 28 focused new Node/DOM cases plus14 existing saved-review/read-only regressions: **42 PASS**.
- Six full portal Chromium/WebKit cases at1440/768/390: **PASS**. Five-minute virtual inactivity, continued typing/control selection, two tabs and same-account renewal, temporary failures, explicit resume, normal save, duplicate prevention, renewal during a delayed save acknowledgment, durable attributed-history confirmation, actual logout/account transition, revocation and expiry. No console errors, private browser-storage writes, hosted requests or worker calls. All report content/session identities fictional.
- Source/immutable-report/consent/permission/job/Function/configuration preservation independently checked through safe read-only metadata. No live founder action requested and no real feedback or report-generation call made.

## Exact release and rollback

Frozen package and SHA256 inventory are in `deployment-evidence/2026-10-22-review-session-recovery/` in the parent workspace. This includes three runtime artifacts, projected453paths/450retained/3updates/0adds/0removals, all13 unchanged Function hashes/configuration/schedules, screenshots, test receipts and current baseline/source preservation evidence.

Next approval must name the final exact source SHA and authorize push to this branch plus one unpublished production-context candidate. If a coordinated release is authorized, publish only that independently accepted candidate after canonical drift/security/artifact gates; otherwise publication remains separate. Recheck current baseline, actual deadline and grant before any hosted operation. No migration, Function upload/rebuild, permission/grant/secret change or client processing is required.

Rollback is the preserved existing canonical deploy `6ada2143916c7d122518c03c` with its full453path manifest and13Function contracts. Restore that exact existing deployment only if a separately authorized release creates a critical regression; no database rollback or report/grant cleanup. The prior UI has the known renewal defect, so rollback restores that limitation rather than extending authority. Verify source/report hashes, held processing boundaries and schedules after any rollback.
