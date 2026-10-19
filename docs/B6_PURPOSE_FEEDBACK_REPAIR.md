# B6 purpose acknowledgment — local repair, production held

This additive branch starts at the exact combined Roadmap/loader candidate `748ed0c0ceb98bf1687c60874fa4611e1bff3e19`. It preserves all processing code, seven loader repairs, scoring pins/formulas, source access, source fingerprints, founder-only permissions, immutable consent history and existing Function source. Nothing has been pushed or installed hosted.

## Findings

The previous purpose form writes progress and success to the dialog’s header status, above the source cards. A fictional three-source reproduction in Chromium/WebKit at 1440, 768 and 390 shows that message outside the viewport when the button is clicked. There is no saving label, and successful submission leaves the button enabled. Seven sequential fictional clicks generate seven attestation requests. The existing SQL appends each identical request, which can also supersede an operator grant’s purpose reference. This is a feedback/retry defect; a recorded acknowledgment does not authorize operator activation.

Production deployment drift was independently detected before any publication. The canonical calibration scripts and scoring Function were unavailable on the currently published artifact. That incident must be reconciled separately; a local UI patch alone cannot restore a missing deployed Function. No deployment, configuration or consent mutation was performed to investigate it.

## Minimal change

- `portal/portal-roadmap-calibration.js`: source-local live status immediately below the button, visible validation/saving/success/blocked states, disabled in-flight and completed submission, status read before a retry, stale-session clearing and clean reauthorization. Existing recorded consent is displayed as a server fact; checkboxes are not silently checked or submitted. No source answers are requested by this workflow.
- `portal/portal-roadmap-calibration-bootstrap.js`: explicitly reject unavailable HTTP services and expired sessions with visible fail-closed UI. No raw provider error or credential is displayed/logged.
- `portal/index.html`: only two cache references change (`calibration.js?v=102`, `calibration-bootstrap.js?v=101`). No CSS or redesign.
- Forward migration `20261019213244_b6_purpose_acknowledgment_feedback.sql`: verify the exact original B6 function-body hash before replacing only `public.roadmap_b6(text,uuid,jsonb)`. List metadata gains one source/actor/session/pins/seven-statement boolean. Attest takes the existing source advisory lock, validates the original seven statements and reuses only an identical latest event for that same actor, session, source, B5 purpose and rule pins. New consent, withdrawal or new session remains append-only. No historic event is edited/deleted; no grant/control is created or changed. CREATE OR REPLACE retains function ownership, ACL and empty search_path.

No Function source/rebundle/update is required for this repair: the existing B6 transport already carries the list and attest results. Existing source-only consent/activation gates remain unchanged.

## Validation

- 218 maintained PostgreSQL17/RLS/regression tests pass, including four focused consent tests.
- Seven genuine eight-worker race groups pass. Concurrent identical purpose retries: eight successes, one new canonical event, seven idempotent replies. Existing grant references remain valid.
- Maintained B6 Chromium/WebKit1440/768/390:192 checks, no warnings/errors, overflow, downloads or source changes.
- Focused offline purpose Chromium/WebKit1440/768/390:186 checks. Missing statements, saving, repeated clicks, persisted status, response lost after commit, invalid payload, HTTP denial, expired SDK session, account reset and denied Coach are covered. Intentional negative transport diagnostics are retained; positive flows have no unexpected errors or outside requests.
- Processing compatibility:237 PostgreSQL17 tests, six native full processing browser workflows and four eight-worker processing race properties pass. Only fictional sources and disposable local databases were used; all runtime features remain held hosted.
- 93 focused Node/JSDOM/engine/session/loader tests pass; build, syntax and diff checks pass. The original loader package is checked at its exact commit and the new repair has a separate strict runtime-diff boundary.

## Required release and rollback gates

STOP before push, migration, candidate creation or publication. First reconcile the unexpected live production baseline and complete the source/asset/Function preservation review. The earlier publication authorization was bound to a different live baseline and does not authorize bypassing this failed gate.

Then request exact-SHA approval for this patch: one new forward SQL function migration, followed by the three reviewed static assets; preserve all exact approved Function archives/configuration/schedules. Do not replay the installed processing migration. Keep ingest/process/review/approve/internal_pdf false. Do not activate B5/B6 grants, process participants, collect new consent on behalf of founders, export, email or deliver reports.

Pre-publication failure: stop with the old publication/lock unchanged. Post-publication critical failure: use a newly verified manual forward-revert artifact, preserving current immutable database history. SQL rollback requires a reviewed forward replacement of the original function body, not deleting consent, dropping tables or replaying historical migrations.

## Founder instructions

Pause repeated clicks while the live deployment issue is resolved. After a reviewed release, sign in normally at `https://revitalizedacademy.com/portal/` → People → Vitality Roadmaps → Assessment Calibration → the exact source → Review experimental purpose / SOP. If the UI says recorded, do not submit again. Otherwise read and check all seven statements, click once and wait for the nearby recorded status. Operator activation is a separate authorized action; do not infer that an acknowledgment opens answers or grants calculation access. After an uncertain response, close/reopen to read server status before considering a retry. Never share credentials or session tokens.
