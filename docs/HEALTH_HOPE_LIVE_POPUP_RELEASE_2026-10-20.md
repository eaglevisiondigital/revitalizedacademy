# Homepage popup — production publication, October 20, 2026

## COMPLETED

Published the owner-reviewed popup on [revitalizedacademy.com](https://revitalizedacademy.com/), deployment **`6ad7ed9be0bd165b997e0be1`**. [Netlify deployment](https://app.netlify.com/sites/revitalizedacademy/deploys/6ad7ed9be0bd165b997e0be1).

The owner explicitly authorized publication while retaining registration holds, Vitality Roadmap functionality and Zoom/email configuration. This release overlays only the three reviewed popup assets from `73b29621db5e74e0d9f42caa7555a0933f1c3994` on the exact current primary production artifact `6ad7cd0111dae0b60c7d9656` / `fa1f490012507319bb93cca64d6cbaf039ceaec3`. It does not deploy the feature branch's registration-readiness backend. Release preparation/tooling commit: `e61aec6a8ac343c26d066c4dd1c310c52c38e62b`.

## CHANGED

- Stronger gold divider/OR marker and a softly tinted, bordered emerald panel distinguish the two popup choices.
- Non-sentence labels use Title Case, including Maybe Later, Reserve My Free Seat and Click To Preview Vitality Roadmap. The question and explanatory sentences retain sentence case.
- Three static paths updated: `index.html`, `css/health-hope-live.css`, `js/vitality-report-preview.js`. The preview script changes only its marketing label string; homepage asset versions request the new CSS/script.
- All **447** published paths retained: **3** updates, **444** exact retained digest references, **0** additions/removals. The current primary portal continuity repair and opaque runtime configuration remain intact.
- All **10** existing Function archives, runtimes, routes/configuration and payment-worker schedule retained. No event Function, worker, staff view or migration entered this release.

## TESTED

Eight existing release-integrity/reconciliation guard cases pass. The exact reviewed three-file hashes matched their current production base before packaging, and protected primary source checks passed.

Unpublished candidate and canonical live verification each compare the three changed files against approved source/candidate bytes (only the established Netlify Pretty URL anchor serialization is normalized). **137** unchanged protected served assets, including Roadmap/portal/member scripts and the held event landing page, match their pre-publication bytes. All ten Function hashes/runtimes and the existing schedule match. The published manifest exactly matches the three-file overlay. Site/beta build settings, beta publication and the production publication lock remain unchanged.

Actual anonymous Chromium and WebKit acceptance covers 1440×1000, 390×1000 and short 390×700 viewports, both before and after publication. It verifies popup bounds/scrolling, stronger divider/tint, Title Case, unchanged destinations, preview open/close and Maybe Later dismissal. It also checks the served event page still has held mode, disabled form controls, no unverified countdown and no event API requests. All six candidate and all six canonical browser runs pass with zero browser errors, participant submissions, event API requests, provider operations or non-read browser requests. [Completion receipt](health-hope-live-popup-release-2026-10-20/completion.json).

Evidence: [release package](health-hope-live-popup-release-2026-10-20/release-package.json), [single-publication journal](health-hope-live-popup-release-2026-10-20/operation-journal.json), [candidate integrity](health-hope-live-popup-release-2026-10-20/unpublished-verification.json), [canonical integrity](health-hope-live-popup-release-2026-10-20/canonical-verification.json), [candidate browsers](health-hope-live-popup-release-2026-10-20/unpublished-browser.json), [canonical browsers](health-hope-live-popup-release-2026-10-20/canonical-browser.json).

Live screenshots: [desktop](health-hope-live-popup-release-2026-10-20/canonical-1440-popup.png) · [mobile](health-hope-live-popup-release-2026-10-20/canonical-390-popup.png).

## SECURITY

**Registration remains held. Zoom/email integrations and Vitality Roadmap functionality are unchanged.** No environment/credential, database/schema/RLS, founder/staff permission, scoring, health/assessment record, enrollment, payment or meeting setting was changed. No real registration, email, Zoom join or participant deletion occurred. All four event migrations and the `8df6f32` backend readiness package remain local/unreleased. The primary worktree was not modified.

Used the established bounded file-digest process with one new unpublished production-context candidate and one first-publication request. Only the three static files needed upload; no Function upload or rebuild occurred. The current locked artifact, manifest, settings and release queue were rechecked before creation and publication. The publication endpoint promoted this newly created/verified candidate; it did not restore a previously published older deploy.

The publication lock remains enabled. A future primary Git release must reconcile the three popup assets with the latest live manifest before publication. Never deploy this entire event branch or overwrite intervening primary work to reproduce the popup patch.

For a critical defect, stop and inspect the actual current publication, then prepare a **new forward-fix candidate** reversing only the affected popup delta while retaining the latest protected manifest/Functions/settings. Revalidate the current state rather than restore an old broad deployment. A failed unpublished candidate leaves the previous publication intact. No forward fix was needed.

Release mechanics follow the [official Netlify file-digest API](https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/#file-digest-method) and the project's existing website-only process. The [Netlify deployment skill](/Users/davesmacbookpro/.codex/plugins/cache/openai-curated-remote/netlify/1.6.0/skills/netlify-deploy/SKILL.md) was applied. No messaging integration was used.

## DOCUMENTATION

Updated CURRENT_BUILD_STATE.md, ARCHITECTURE.md, SECURITY_MODEL.md, DECISIONS.md and current HHL handoffs. Versioned the exact package, deployment journal, preservation receipts and actual served screenshots on isolated `codex/health-hope-live`.

## UNRESOLVED / NEXT RECOMMENDED BUILD

No popup-publication blocker remains. Keep registration and provider integrations held. The separate [registration-activation preparation](HEALTH_HOPE_LIVE_FINAL_ACTIVATION_PREPARATION_2026-10-20.md) still requires essential Zoom invitation/security evidence, secure existing Resend readiness, external-provider retention evidence and separately authorized held hosted acceptance before any later public activation. Nothing in this popup authorization activates that package.

## CHAT HANDOFF

Owner-approved popup is live at https://revitalizedacademy.com/, deploy 6ad7ed9be0bd165b997e0be1. Stronger gold separation, emerald-tinted event panel and Title Case labels are published. Only three static assets changed; all 444 other file digests, 137 checked protected served assets, ten Functions/config/schedule, current primary continuity repair, beta and publication lock are preserved. Registration remains held; Roadmap behavior, Zoom/email, production data and permissions are unchanged. No migration, backend event release or message send occurred. Reconcile this public delta into future primary releases.
