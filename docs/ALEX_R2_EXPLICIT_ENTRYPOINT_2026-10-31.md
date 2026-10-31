# Explicit Revision 2 entrypoint — local correction only

## Verified defect

The Calibration processing bootstrap supplies `onSavedDraft`. The controller hands an existing document to Saved Roadmap review and returns before rendering its legacy Return for regeneration button. Saved Roadmap review is intentionally read-only. Consequently the normal authenticated saved-report path cannot reach an explicit Revision2 action. This source-level gap is distinct from the pending personal Owner recovery and does not justify regeneration, permission changes or an administrative shortcut.

## Minimal correction

Only runtime assets `portal/portal-roadmap-processing.js`, `portal/portal-roadmap-processing-bootstrap.js` and the two script cache tags in `portal/index.html` change. A separate button opens explicit Revision2 controls and performs only an authenticated read. It does not display editable client content, repeat purpose/consent, issue authority or render approval controls. Normal saved-report opening is unchanged and read-only.

An unchecked confirmation requires the operator to acknowledge **separate generation approval and independently verified recovery**. This is not an authorization grant: every actual operation still uses the unchanged protected production Function and database checks, with current same-account authentication, original issuing Owner recovery, exact source/R1/worker pins, SOP/sealing, expiry/revocation and one-use constraints.

An explicit single click re-reads the same immutable Revision1 and exact window, then sends one existing `regenerate` request with an idempotency UUID and one `process` request. The local attempt remains consumed after uncertain responses; no automatic retry, resumption, duplicate click or background generation is allowed. A successful Revision2 result must identify a new version and the same source, then hands off to existing recoverable read/feedback UI. Existing Revision2 opens read-only and cannot create Revision3. The database remains the authoritative cross-tab/global one-use fence; the UI latch alone is not a security boundary.

No new API, worker archive, migration, grant, report, numerical score or export permission is included. No real client processing is authorized by this change.

## Verification

36 focused Node/DOM checks PASS, including existing read-only/handoff regressions and18new entrypoint/boundary cases. Six Chromium/WebKit desktop/tablet/mobile cases PASS with fictional report/transport/auth events, including one explicit generation, two-tab renewal, simulated five-minute inactivity, transient recovery, citation editing, durable simulated feedback/save reconciliation, duplicate prevention, logout, account switch, revocation and expiry. All browser traffic is intercepted; zero hosted writes or real worker calls. These checks do not prove that a real Alex generation has occurred.

The existing live recovery migration/security metadata and protected preservation digests were independently read back unchanged on October31. Canonical deployment remains6ae3b97c7f4e400e3012f245/source61f1d44f57ca141a9255cd76ffa1c3eb17bd89db,13Functions/458paths/approvedvoiceworker. R1 is the only Alex saved version; zero recovery bindings and no new job at the readback.

## Release and rollback

Local only. A separate exact-SHA approval is required to push and create one unpublished candidate using these three runtime updates, retaining all458paths and13Functions. Hosted acceptance and exact-candidate publication require their specified approvals. No database or Function replacement belongs in this release. Retain the current canonical deploy as rollback, restoring that exact deploy without rebuilding; independently recheck all13Functions/settings and protected record digests. Any uncertain generation must be read back, never rolled back by deleting jobs or reports.

## Founder delivery gates

1. Publish only a separately verified/approved exact candidate.
2. Use the already separately approved single new personal Owner recovery request only while its existing Oct31 11AMCentral ceiling remains valid, with fresh original Owner login<=5minutes and Justyn Calibration<=15minutes, followed by independent binding readback. No old runner or rejected-request replay.
3. Obtain explicit source-bound ONE Revision2 generation approval, then allow Justyn's single action. No generation during release or recovery.
4. Independently verify saved Revision2/source/R1 lineage,45rules/voice,12Drivers/relationships/comparison/30-60-90plan, scoring holds and founder review before reporting availability.
5. If expiry is reached, stop; a separately reviewed prospective authority is required. Nov3 5PMCentral is a proposed successor ceiling, not an edit to the current grant. V3 remains a separately versioned local candidate.
