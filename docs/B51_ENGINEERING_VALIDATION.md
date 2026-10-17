# B5.1 continuation — source audit and signed-out request repair, not released

Issue36; preserve existing draft PR37 and PR38. Production baseline `e02f35267de3159d7b3b2a5e989ccb8edb7e9f7d`, published deploy `6ad2acb16d6d38c15ce3e489`. No hosted mutation, merge, production/beta deployment, migration, participant lookup, enrollment, scoring or draft/release/email activation is part of this continuation.

## Independent PR37 reconciliation

PR37 remains the exact accepted B5 source, seven commits ahead/zero behind main `79debed92925b920f9052d9c522a796bbf929223`. The clean source was independently rebuilt. The complete published434-file manifest matches prior approved deployment evidence.433 rebuilt bytes match published digests; the sole exception is the preserved historical `netlify.toml` artifact, which is not a runtime application script. Case normalization matches the live manifest. No creative, testimonial, Roadmap preview, PR29 NDA, B4/B4.1/B4.2/B5, public allowlist, private source or backend file was lost. Synthetic-only staging interfaces and fixtures are not public allowlisted.

All nine deployed Function digests/IDs/runtime/configs/routes and the `payment-worker` schedule remain unchanged. Independent packaging succeeds for all nine on Node22/APIv2 and source route/schedule assertions pass. **Only two newly produced archives are byte-identical to the deployed archives** (`roadmap-verification`, `roadmap-scoring-lab`). The reason for the other seven archive differences is not proven; it must not be dismissed as harmless generated metadata. Retain the reviewed live bundle pins for any separately approved static-only release. Ordinary rebundling is not a byte-identical no-op.

Read-only inventory of205 production ledger entries confirms all three B4/B4.2/B5 SQL bodies exactly match source hashes, despite different timestamps:

| Source migration | Installed ledger |
|---|---|
|20261016062751 B4|20261016074754|
|20261016195245 B4.2|20261016212348|
|20261016215456 B5|20261016230019|

Do not replay them, move them into default migration discovery, or use blanket `supabase db push`. Only the minimal non-identifying summary is committed; no migration SQL payload or participant records were exported from hosted systems.

### Automatic-deployment safeguards and exact remaining source-sync gate

Live Netlify is Git-connected to main, `stop_builds=false`, allowed branch main, with no observed automatic-build skip/publish lock. Repository TOML supplies the production build command and production-dist output despite older dashboard defaults. GitHub workflows reviewed are test-only and do not apply hosted migrations or explicitly deploy Functions.

An **already-existing** automatic PR37 preview (`6ad2cd0f3df5f6796b7aad95`, created2026-10-17T01:19:11Z) rebuilt all nine Functions on **Node24**, unlike live production Node22. This preview predates this continuation; it was inspected through metadata only, not its app or data. Draft status alone therefore does not prevent deployment. `[skip netlify]` was added to both existing draft titles, and new commits/new draft PR use the same marker. No live build setting was changed and no preview was deliberately published by this continuation.

**PR37 is not authorized or proven safe to merge as a no-op yet.** Separate Owner approval is required for a controlled main-source sync with Git builds/auto-publishing verifiably paused or another independently proven no-publish procedure. Recheck exact live deploy/Function manifest and then synchronize only the accepted source; do not merge the old stack separately, replay SQL or replace Functions. Leave automatic publication held until Node/runtime/toolchain and archive provenance are reviewed and separately accepted. A title marker alone is not proof that every future merge/hook cannot publish.

## Signed-out defect, reproduction and minimal repair

An isolated browser loaded the **full exact-built B5 portal**, with a synthetic SDK and local intercepted authorization backend. No hosted credential or participant response was used. The deterministic reproduction emitted31 unnecessary signed-out operations. `signed-out-reproduction.json` records only table names, module/line initiators and signed-out booleans.

| Module | Unnecessary startup path |
|---|---|
|Programs/Content|Immediate catalog, program-access and content/nutrient loads|
|People Directory|Immediate source-filter → saved-view → directory chain|
|Family Requests|Immediate load|
|Staff Access|500ms timer permission/workload chain|
|Staff Inbox|700ms timer|
|Companion|850ms timer|
|Work Desk|Contact-close during signed-out bootstrap; initial timed load when visible|

The server401 response was correct. The defect was initiating those operational reads before a current staff workspace existed. Existing B4/B4.2/B5 founder modules were already session guarded and did not cause these calls.

The fix reuses existing `captureStaffSession()` / `isStaffSessionCurrent()` before loads and after awaited responses; no new auth architecture. Dependent chains stop when the epoch changes. Local caches/private modal/list state clear on reset. Programs and People initialize on the existing authenticated dashboard event as well as their guarded late-load path, preserving legitimate initialization after a fresh sign-in. People filter refresh preserves current selections without duplicating options. Stale lifecycle callbacks in Directory/Inbox cannot access removed private DOM. Only seven module scripts and their existing HTML cache references change.

`portal.js`, PR29 NDA/onboarding, permissions, every Function, all database/RLS/ACL code, source/scoring contracts, pricing/payments and questionnaire/recovery remain byte-identical. No security error is converted to empty success or globally suppressed. Invalid credential/access-resolution denials, current-session RLS denials, required-NDA denials and explicit unauthorized probes remain genuine denials. The negative browser probe still produces401 and a visible resource error; positive signed-out/valid workflows must have no warnings/errors.

### Validation evidence

Machine results are in [validation.json](evidence/b51/validation.json), [browser matrix](evidence/b51/startup-browser.json), [source/Function inventory](evidence/b51/source-reconciliation.json), [migration inventory](evidence/b51/production-migration-inventory.json), [existing preview runtime audit](evidence/b51/existing-preview-build.json). Tests use fictional actors only. Existing content unit/browser fixtures were updated to implement the real shared session API instead of bypassing it. The old all-public-file B4 parity test permits only the seven explicitly reviewed startup files, still checks their exact built/source bytes, and still compares every other protected artifact to its original baseline. No blanket skip was added. The new runtime-diff test independently enforces the seven-module+HTML allowlist.

Initial harness failures (missing session API in old fixtures, a termination test that incorrectly retained a valid stored session, and stale build parity) were corrected rather than classified as passes. A broad historical wildcard test invocation was stopped; maintained suites and isolated browser scripts were subsequently run explicitly. Final results, not those exploratory runs, govern readiness.

## Workbook continuation and unresolved founder decisions

PR38 preserves the original workbook, adds the exact12-Driver reference matrix707+36 fields/190 symptom observations, proposed branch/answer/unit semantics and ten test-only checks. All current actual-source scores/stages remain withheld. No live questionnaire or formula changed. The approved health weights remain1.4/1.3/1.2/1.1; Budget1.0 is separate and deducts zero from health/stage.

Justyn and Elle must independently supply A/B/C expected ranges/spread and the symptom-free Chaos interpretation; Peace90/95; cognitive/GI qualifications; Chronic/Chaos persistence, grouping and impact prerequisites; primary ownership/overlap handling; eleven distinct function definitions; factual habit/proficiency/opportunity rubrics; exponents/breadth/rankings; and exact follow-ups/version compatibility. Numeric symptom-day counts alone cannot deduplicate shared days. An engineering workbook is not authenticated signoff or actual-person scoring authorization.

## Separate next authorizations

1. Source reconciliation: approve the exact PR37 head and a verified no-publish main-sync procedure. Current automatic build/runtime behavior is a blocker to calling a merge a no-op.
2. Frontend repair: separately approve the final tested new draft SHA and an artifact-preserving production static-only deployment, retaining all nine live Function pins/config/schedule. No migrations or Edge changes.
3. Founder policy: independent worksheet review and versioned decisions. Real identity/SOP/source cohort, bounded B5 pilot, drafts, report approval/release and emails remain distinct held gates.
