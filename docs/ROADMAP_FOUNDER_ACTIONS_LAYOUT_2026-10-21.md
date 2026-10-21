# Founder actions: local layout-only correction

Parent source `3fee66773483ab3245f5efd734a26879e6a15336`. Read-only production check: deploy `6ad8db4edcce97d04210f844`, approved source/full452-path manifest/all13Function archives, settings/schedules and publication lock match. No hosted change.

## Root cause and minimal patch

Bootstrap appended the entire processing section to `.rv6-workspace`, after the sticky, independently scrolling original answers and long manual-review form. Grid auto-placement puts actions below the tallest first-row item. Desktop launcher was approximately3,200px down; tablet/mobile3,600–4,200px down. Scrolling answers does not scroll the parent dialog to those actions. Not a missing permission, worker or z-index defect. Justyn's exact remote viewport is unavailable; standard1366/1440/1920 desktops are tested.

Two shipped paths only: `portal/portal-roadmap-processing-bootstrap.js` inserts the unchanged action/storage/report section before the workspace, labels that section and scrolls it into view; `portal/index.html` bumps its reference v101→v102. The fallback for other hosts remains. No CSS, launch/event handler, request/cleanup/session guard, consent, worker, scoring or 12-Driver renderer change. Submitted answers remain in their existing bounded scrollport; report/review controls now render outside that grid.

## Tests and preservation

Six baseline Chromium/WebKit reproductions;14 repaired desktop/tablet/390px/320px/200%-CSS-zoom cases. Mouse/touch and keyboard, hit-testing/minimum target size, scrolling/focus without processing, duplicate-click prevention,12Driver sections,216fictional answer cards, logout and denied role pass. Zero unexpected errors/outside requests/consent calls/real worker invocations. API processing responses are fulfilled in memory; no server handler executes.48existing processing/sealing/session/B6 regressions pass. Backend/RLS/migrations unchanged; completed database tests not repeated.

Public HTML has existing runtime/environment injection and two clean-link transformations relative to source. Release HTML must overlay ONLY the bootstrap version onto captured canonical bytes. Do not deploy raw tracked HTML or rebuild Functions. All other paths, portrait, Founders, HHL, questionnaires, payments, beta, source pins and consent are preserved.

## Actual processing state and next gate

Read-only metadata2026-10-21T16:07Z: Caroline already has one complete job/one attempt and one source-matched12Driver draft, created15:48:42Z/10:48Central with Justyn's matching finish audit, before this layout work. No answers/document content returned. Alex/Johnny each retain one unclaimed pending job. Existing3B6/storage/processing grants and1batch preserved. Process/review=true, ingest/approve/internal_pdf=false. Deadline stays **October22,2026 08:45Central**; no extension.

Next: exact local SHA push and ONE unpublished static-only candidate, all13Functions byte-identical. Publication requires separate exact-ID authorization and fresh canonical acceptance. Recheck current production and stop on substantive drift. Release can fit the remaining window if approval/testing complete before expiry; no promise or renewal is implied. Keep the separate HHL navigation patch out of this release.

Rollback: static forward revert of ONLY the original HTML/bootstrap bytes. Never undo grants, consent, jobs, drafts, database or feature controls for this visual change. Full evidence/hashes/previews/artifact and rollback inventory are outside frozen source at `deployment-evidence/2026-10-21-founder-actions-layout/`. No push, candidate, deployment, migration or production configuration action.
