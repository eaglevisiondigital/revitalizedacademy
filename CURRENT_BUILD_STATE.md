## Health & Hope Live — approved website-only release preparation, 2026-10-20

Owner approved the visual design, final gold CTA palette, exact new homepage promotion and conditional production publication. Gold `#D8A62A` / hover `#B18845` with dark emerald text passes 7.59:1 / 5.23:1 contrast. Homepage uses “RESERVE MY FREE SEAT” and links directly to `/health-hope-live#register`. The public page explicitly holds registration: all fields disabled, no availability/registration requests, no unconfirmed date/countdown. The existing enabled client behavior remains covered by explicit fictional fixtures; server/database controls remain independent.

Owner separately approved identifiable event history for 12 months after each session, then removal of participant identifiers with anonymous aggregate counts only. Master contacts/consent follow their own approved policies; authenticated audited event export/deletion must be implemented before collection. [Exact recorded policy](docs/HEALTH_HOPE_LIVE_RETENTION_APPROVAL_2026-10-20.md). This resolves the policy decision, not the pending expiry/export implementation.

Fresh read-only production preflight confirms deploy `6ad765fd237458b0eb9d8f18` / source `17fa5533856138ecdf853f23955a5b1f19fc2aa9`, production lock on, all ten Function archives and schedules/settings exact, beta unchanged. No event/Zoom environment keys found; event schema and candidate ledger absent. Resend `auth.revitalizedacademy.com` is verified/sending-enabled, but event sender/credentials/Zoom account/meeting/scopes and provider acceptance remain unvalidated. No credentials inspected, provider call, SQL write or real notification.

Local validation: 32 feature/scope checks, 106 existing regressions, 288 Chromium/WebKit checks at 1440/768/390px, zero page errors/overflow; static build 448. Preparing a bounded digest retaining all 442 existing published paths, updating only five event-related public files and adding the three event page assets plus explicit routing/header files (447 total). Existing ten Functions remain byte-identical; no event API, worker, staff event view, migration or activation is included. Source production drift/manifest/lock checks must pass immediately before publication, followed by canonical verification. [Release evidence](docs/health-hope-live-release-2026-10-20/readiness.json).

## Health & Hope Live — conversion design refinements, LOCAL / NOT RELEASED, 2026-10-20

On the same isolated `codex/health-hope-live` branch/worktree, application commit `3cbe25fef3425ee3a898526e2827f0b537b6c95e` adds the requested hero headline/copy, one compact hero countdown, stronger Thursday CTAs, educational benefits, the three already-published story thumbnails/video links, post-story invitation, clearer distinct consent presentation and tighter responsive spacing. Matched the homepage's Health & Hope Live promotion and event CTA only. Approved logo, founder imagery and existing premium design are preserved. [Refinement report and refreshed desktop/mobile screenshots](docs/HEALTH_HOPE_LIVE_DESIGN_REFINEMENTS_2026-10-20.md).

Validation: 32 feature/scope tests, 106 existing regressions, 234 checks across Chromium/WebKit at 1440/768/390px, zero page errors/horizontal overflow, production static build 448 files. Public fonts and the three existing public thumbnails were the only permitted external browser GETs; application/auth/registration traffic was intercepted with fictional data. All 337 tracked files under the protected backend/script/config/asset paths remain unchanged from pre-refinement `aea9211`. The original event migration retains its exact hash below and remains unapplied remotely. No new schema, backend, permission, Roadmap, live Zoom/email, deployment, activation setting or primary-worktree change. [Validation receipts](docs/health-hope-live-refinements/validation.json).

Next: visual approval, then the existing retention/erasure/export policy and implementation, masked Zoom/sender readiness, separately authorized synthetic hosted acceptance and reconciliation with the primary release source. Publication and participant activation remain separately held; [updated exact release handoff](docs/HEALTH_HOPE_LIVE_RELEASE_HANDOFF.md). The local preview uses explicitly fictional sessions and saves no registrations.

## Health & Hope Live — local parallel review package, 2026-10-20

Isolated branch `codex/health-hope-live`, worktree `health-hope-live/`, implementation `22683c369618d75b772d88504e016833eac133b3`, based on workspace-recorded production source `17fa5533856138ecdf853f23955a5b1f19fc2aa9`. This entry describes this workstream only; older Roadmap entries below are historical and this task did not alter the primary session or its parent-workspace state.

Completed the free Thursday 6:30 PM America/New_York / 30-minute public experience, legacy redirects and promotions, per-session registration against existing master contacts, staff participation history/search, scheduling/cancellation/rescheduling, consent withdrawal, reliable attendance review and held Zoom/email adapters. Added eight private event tables and five guarded functions in CLI-generated forward candidate `20261020141529_health_hope_live.sql`, SHA256 `3c34381dbb2add5bde325e5a932edac977980404b3ae38d848f8a1077a1c79aa`; **unapplied remotely**. Both runtime and database activation layers remain off. No contact/client duplication, assessment/scoring change, permission broadening, payment activation or real notification.

Validated 32 feature/scope checks, 37 PG17 cases plus eight-request race, 106 existing regressions and 120 responsive-browser checks across Chromium/WebKit 1440/768/390. Production static build 448 files / six additions / zero removals; 765 protected source files and 319 pre-existing restored DB functions unchanged. Disposable test DB removed/global roles unchanged. See [review report](docs/HEALTH_HOPE_LIVE_REVIEW_2026-10-20.md) and [release/Chat/Work handoffs](docs/HEALTH_HOPE_LIVE_RELEASE_HANDOFF.md).

Unresolved before activation: retention/erasure-export policy and implementation, masked hosted Zoom/sender readiness and synthetic provider acceptance, primary release reconciliation and explicit production/integration authority. No push, PR, production API call, migration, deployment or live provider operation. Local preview is fictional only. Next build: resolve these narrow gates, then prepare an authorized exact release without disturbing primary Roadmap work.

## Complete three-source draft package — local only, release/activation held — 2026-10-19

Branch codex/roadmap-three-source-draft-package starts at exact validated UI repair ea550adccdf511305c703e0cc703f7feddc84f0c. That UI is byte-identical. Adds a single forward migration for fixed three-source scope, private explicit enqueue, staged purpose-restricted sealing identity, atomic activation/revocation and live finish checks. Worker no longer uses a service-role key; new key alone cannot read sources/bypass RLS. Nine retained archives and all existing scoring/coverage/questionnaires/consents remain unchanged. All production gates remain held; no remote activity, secret handling or real source processing. [Complete implementation, release package, tests and precise approvals](docs/ROADMAP_THREE_SOURCE_DRAFT_PACKAGE.md). Earlier entries below are historical.

## Storage-purpose confirmation repair — local candidate, all hosted gates held — 2026-10-19

Isolated from exact deployed1511211068b1c5259162125b951cd8cf4f88edad on codex/roadmap-storage-purpose-confirmation. Fixed HTTP200/unavailable false confirmation with strict persisted acknowledgment, visible states, idempotent retry and source/session/SDK-user teardown guards. Two public assets only; no SQL/Function/backend change. Current-baseline preservation, synthetic native browser, PG17/RLS and concurrency results are linked below; two obsolete historical snapshot assertions fail identically on the unchanged baseline and are disclosed.

Worker remains unconfigured/held: existing implementation expects a protected legacy service-role JWT; a narrower seal-only identity needs separate reviewed backend work. Ingest=false prevents existing historical grants from enqueueing jobs; no hidden flag toggle or source touch is authorized. Valid Justyn B6 records remain valid; each participating founder still needs separate storage consent and source grants. No hosted query/write, secret handling, push, deploy, processing or scoring. Fourth source and production unchanged by non-operation. [Full repair, configuration, founder instructions, queue gap and exact release/activation gates](docs/ROADMAP_STORAGE_PURPOSE_READINESS.md). Earlier entries below are historical.

B6 continuation reconciles exact PR #46 `94be23a9b07f3825fed3b5c31c4091f5d7977b63` with the existing PR #47 implementation. Its three original preflight files remain byte-identical; the guarded runtime reuses that contract. Controlled session-local recalculation and same-source saved review comparison show exact candidate pins and changed founder judgments without historical code execution or inferred missing numeric scores. All technical and real-participant release gates remain held. See [B6 continuation](docs/B6_PR46_CONTINUATION.md).

# B6 source-backed calibration candidate — engineering only

Issue #45 is implemented from exact PR #44 d8435d15e6c3da6a8809124836c01194143ff82b. Current-source audit: 0/12 complete numeric Drivers; original labels/revision were not archived. New private source-supported component adapter, independent/manual-first comparison, explicit hypothetical mode and separately gated append-only feedback remain candidate only. One unapplied production-specific migration and one additive update to the existing ninth Function are prepared. No production/beta deploy, hosted SQL, participant lookup/read/scoring, cohort or write activation. PR39/42/44, nine-function inventory, staff NDA and payment gates are preserved.

[Feasibility](docs/B6_FEASIBILITY.md) · [Candidate, SOP, security, tests and exact release boundary](docs/B6_CALIBRATION_CANDIDATE.md). Earlier entries below are historical.

# B5.3 — readable fictional founder Lab candidate, not released

Issue #43 is implemented on exact PR #42 head `e142c394750720a8c39dffc62db31a7726c7b225`, preserving its A/B/C navigation and all 50 cases. Adds pinned fictional input sheets, all 12 readable Driver calculations, 707 exact public questionnaire contexts/gaps, provisional fictional Roadmap and unsaved founder judgment. JSON is engineering-only. No participant answers are fabricated or paired with fictional measurements. B2/B2.1/B5 calculations, all nine Functions, migrations, permissions, source/pilot/draft/release/email gates and PR #29 remain unchanged. PR #39 remains separate/unreleased. Production and beta are untouched. See [implementation, founder walkthrough, security and separate static-release gate](docs/B53_FOUNDER_READABLE_LAB.md) and [validation](docs/evidence/b53/validation.json). Historical preparation notes below do not describe current deployment status.

# B5 Founder Scoring Lab candidate — production and all real-data gates held

Prepared from exact live B4.2 `4247e33322c9117b92f68718ed9408070b7b03e2`, preserving PR #29 and all eight existing Functions. Reuses unchanged B2/B2.1 mathematics and 50 fictional cases, deployed B4 coverage, B4.2 identity/SOP/pinned founders, current-session/scope checks and append-only patterns. Adds a versioned independent mapping contract, founder-only scenario/trace/comparison/preview/proposal UI, same-origin `roadmap-scoring-lab` Function, and unapplied forward migration `20261016215456_vitality_roadmap_b5_scoring_lab.sql`. No production migration/deploy, source lookup, participant scoring, cohort enrollment or derivative-write activation. Beta unchanged. Actual scores remain withheld; missing measurements and A/B/C calibration are explicit blockers. [Candidate, security, founder workflow, estimates and exact separate release/rollback gates](docs/VITALITY_ROADMAP_B5_CANDIDATE.md). Prior deployment notes below describe historical checkpoints.

# B4.2 founder verification candidate — not deployed

Built from the exact live B4.1 source `0ae7726e8e60718af0ab8f674c058e6c50227d01`, preserving B4 production deploy `6ad2320001df1be7217aca20`, PR #29 and all seven existing Functions. Only founder metadata lookup, exact identity/SOP confirmation and private append-only evidence are added. No source answers leave production, no automatic enrollment occurs and all scoring/draft/approval/release/email gates stay held. One production-only forward migration is prepared, unapplied: `20261016195245_vitality_roadmap_b42_identity_verification.sql`. Exact-name/email plus optional UTC date lookup supports privately proposed alternatives without putting real clue/identity data into code, fixtures, logs or GitHub. Read-only operator preflight and reviewed manual revocation procedure remain separately authorized. [Candidate, architecture, security, tests and release/rollback gates](docs/VITALITY_ROADMAP_B42_CANDIDATE.md).

Final candidate validation: build431, syntax156, maintained unit/frontend185, native PG17 backend/RLS192, B4 browser168 plus B4.2 browser186 (12 Chromium/WebKit desktop/tablet/mobile runs), session39, mocked Edge40 plus six entrypoint type checks. Four new eight-worker race groups and nine retained groups pass. Zero browser warnings/errors or horizontal overflow. All local disposable databases removed and task PG cluster stopped. No hosted release/migration, real candidate lookup, identity confirmation or cohort enrollment occurred. Real alternative-candidate eligibility is deliberately uncounted pending the protected founder workflow and separate authorization. [Exact validation and artifact evidence](docs/evidence/b42/validation.json).

B4/B4.1 are already deployed; older preparation-only statements below are historical. B4.2 is a new unreleased candidate, not a pilot activation.

## B4 — production founder workspace candidate, NOT RELEASED — 2026-10-16

Prepared from current production main `79debed92925b920f9052d9c522a796bbf929223`, published deploy `6ad137d38d394a5c89beedc4`, preserving PR #29 and all unrelated accepted production code. A minimal standalone production SQL/RPC + same-origin Netlify Function + founder portal view is prepared; B1–B3 stacked PRs are references, not merged. Verified founder/current-session/private-health/CRM/contact checks, empty explicit source-pinned cohort, separate draft authorization, unscored coverage and append-only correction/version/audit are local-tested. No hosted SQL, deployment, real source read, cohort enrollment, scoring, release or email occurred. Production/beta remain unchanged. Existing approved public preview/testimonial paths omitted from main's allowlist are restored in the candidate without changing their bytes. [Complete review, tests, rollback and separate release/pilot gates](docs/VITALITY_ROADMAP_B4_PRODUCTION_CANDIDATE_2026-10-16.md). Prior release notes below are historical and do not authorize deploying this branch.

## RECONCILED / VALIDATED — Holistic Foundations Pricing v2 technical release — 2026-10-12

The Pricing v2 candidate is reconciled onto exact accepted production source `83ad058c1514846a9978dc0132e7b94b060545a8` (Netlify deploy `6acd526473b23c9fbbbb5c6f`). The accepted session-restoration and post-logout files remain byte-identical. The catalog-driven lifecycle integration preserves the null-safe logout cleanup and advances only the changed lifecycle asset to `portal-client-lifecycle.js?v=103`.

The two forward migrations remain unapplied: `20261010120000_holistic_foundations_pricing_v2.sql`, then `20261010121000_payments_v1.sql`. Agreement publication remains held, zero active Holistic Foundations agreement mappings are created, every merchant route is disabled, provider execution is disabled, and no paid access can be granted. No push, migration, deployment, email, agreement, payment, identity, beta, or hosted-data mutation occurred. Validation: production build 394 files; JavaScript syntax 130 source/test files plus three Netlify TypeScript entrypoints; focused unit/DOM 53/53; PostgreSQL 17 restore plus 55/55 and one eight-worker overlap race; existing Vitality/assessment frontend 64/64; exact-built Chromium/WebKit session checks 40/40; lifecycle responsive 37/37 and Payments responsive 39/39 at 1440/768/390 with zero browser errors, provider calls, hosted writes, or horizontal overflow. The exact candidate SHA is reported after the final documentation commit. [Implementation and release gates](docs/HOLISTIC_FOUNDATIONS_PRICING_V2_IMPLEMENTATION_2026-10-10.md).

## LIVE ACCEPTED — Production post-logout console repair — 2026-10-12

Exact source `83ad058c1514846a9978dc0132e7b94b060545a8` is live as production Netlify deploy `6acd526473b23c9fbbbb5c6f`. Permissions, Staff Onboarding, ReFuel, Community, and Executive Pulse terminate on logout, cancel stale work, skip signed-out/invalid-session queries, and reinitialize only for a valid staff session. Live assets are `portal.js?v=193`, Permissions `v=133`, Staff Onboarding `v=145`, and Executive/Community/ReFuel `v=167`.

Hosted production Owner logout, two-tab propagation, signed-out refresh, invalid-session bootstrap, account-boundary cleanup and private-DOM removal passed with zero captured console warnings/errors from all five repaired modules. No migration, Edge Function, secret, permission, RLS, hosted data, payment, or beta state changed. [Evidence and release boundary](docs/SESSION_REFRESH_PERSISTENCE_REPAIR_2026-10-11.md).

## LOCAL VERIFIED — Holistic Foundations Pricing v2 implementation — 2026-10-10

The approved three-plan architecture is implemented locally on `codex/holistic-foundations-pricing-v2`: Monthly Flex 100/month, 3-Month Commitment 89/month with 267 minimum and month-to-month continuation, and Established Member Annual 948/year after six authoritative qualifying months or an audited Owner/Admin override. Explicit CA/CAD, US/USD and GB/GBP catalogs use isolated merchant routes with no FX fallback. Enrollment submits only contact/plan; the server snapshots exact price, market, route, cadence, commitment and eligibility. The unreleased Payments v1 candidate is catalog-driven and contains none of the obsolete 89/six-month or 960/12-month products.

Unapplied forward migrations: `20261010120000_holistic_foundations_pricing_v2.sql`, then `20261010121000_payments_v1.sql`. No agreement revision or active mapping is created; MK7 remains historical and MK8 editorial only. `production_client_agreement_publication` stays held, all merchant routes stay disabled, and no payment or paid access is enabled. No push or hosted mutation occurred. Validation: production build 394; JavaScript 127 plus eight runtime entrypoints; unit/DOM 40/40; PostgreSQL 17 restore plus 55/55 and one eight-worker race; maintained Vitality/assessment 54/54; exact-built responsive lifecycle 37 and Payments 39 at 1440/768/390 with no runtime errors/overflow/provider calls/hosted writes. [Full implementation, security evidence and remaining gates](docs/HOLISTIC_FOUNDATIONS_PRICING_V2_IMPLEMENTATION_2026-10-10.md).

## ARCHITECTURE APPROVED — Holistic Foundations pricing/billing v2 — 2026-10-10

The prior $89/month six-month and $960/12-month assumptions are superseded. The approved architecture now separates product plans from market-specific prices: flexible monthly 100, three-month commitment 89/month (267 minimum), and established-member annual 948 after six qualifying months. CA/CAD, US/USD and GB/GBP are explicit catalog rows with no FX; Canada, U.S. and future GBP merchant routes remain isolated. Existing published MK8 matches none of the new plans exactly and remains immutable; MK7 stays historical. Three separate future agreement revisions/mappings are recommended, with `production_client_agreement_publication=held` and zero active mappings preserved.

No application, migration or hosted configuration was changed in this architecture package. The deployed lifecycle UI/RPC and unreleased Payments v1 candidate still contain obsolete hard-coded prices and require forward-only replacement before further lifecycle release. Legal/classification, agreement publication, U.S./GBP merchant and provider acceptance gates remain closed. See [the exact plan, currency, routing, eligibility, agreement and Payments v1 design](docs/HOLISTIC_FOUNDATIONS_PRICING_BILLING_ARCHITECTURE_V2_2026-10-10.md).

## LIVE ACCEPTED — Production Client Lifecycle technical foundation — 2026-10-08

**PRODUCTION CLIENT LIFECYCLE TECHNICAL FOUNDATION ACCEPTED — AGREEMENT PUBLICATION HELD.** Exact release source `4fe1e812e007c840b0211cc61989f7b66fd28ba8` was pushed and deployed to production Netlify as `6ac870e0a8239709a2ab5d23`. Production migration `20261007224150_production_client_lifecycle_v1.sql` applied once as ledger `20261009043913`. Five active Edge versions: `member-account` v6, `agreement-sign` v7, `member-password-reset` v1, `client-lifecycle-delivery` v1 and `notification-delivery` v5. The existing USDA, RepDB and reusable-content-sync Netlify Functions remain deployed.

Hosted rollback-only acceptance passed contact normalization/reuse and duplicate prevention; CAD $89 monthly/six-month and CAD $960 one-time/12-month intent; CAD enforcement; Owner authorization plus the deployed Admin permission contract; scoped Coach/member/anonymous denial; session isolation; neutral recovery/origin boundaries; MK7/legal-gate denial; browser and privileged payment denials; and paid-access denial. Fresh-browser signed-out isolation and horizontal-overflow checks passed at 1440×1000, 768×1024 and 390×844. The signed-out portal continues to log its established 401/RLS-denial noise while exposing no private workspace; there were no unexpected runtime errors.

The legal gate remains `held` with reason `quebec_regulatory_classification_pending`. Active Holistic Foundations agreement mappings, client agreements, agreement delivery jobs, payment records, memberships and client-access rows remain zero. Rollback acceptance left zero disposable contacts. No enrollment/agreement email was sent, no payment recorded and no paid access enabled. Vitality assets remained exact and `vitality-resume` remains v3. Beta remains unchanged at deploy `6ac6b620e735903c2285ec3f`. The only remaining lifecycle release is a separately authorized forward agreement publication/mapping package after qualified Québec legal determination; never replay the technical foundation migration.

[Full production release and hosted acceptance evidence](docs/PRODUCTION_CLIENT_LIFECYCLE_TECHNICAL_FOUNDATION_RELEASE_2026-10-08.md).

## RECONCILED / VALIDATED — Production Client Lifecycle technical foundation — 2026-10-08

The lifecycle candidate is reconciled onto the exact current production application source `2748528dfc0ec72aef7fdcc1eb2d71725c01ec76` (Netlify deploy `6ac8236336cbba557f2f8cd3`). Every Vitality reliability application, migration, Edge and regression file remains byte-identical to that deployed source. The resulting local branch is `codex/production-client-lifecycle-v1-reconciled`; its exact release SHA is reported from Git after this documentation commit.

Validation passes: production build 389 files; JavaScript syntax 114/114; frontend 106/106; Edge 40/40 plus all six entrypoint type checks; PostgreSQL 17 maintained checks 126/126 plus the one eight-worker Vitality race and four eight-worker lifecycle race groups; exact-built lifecycle Chromium 37/37 and Vitality WebKit 75/75 at 1440×1000, 768×1024 and 390×844; production environment isolation and `git diff --check`. A synced-folder artifact restored 112 non-manifest duplicate files after the build; they were quarantined outside the repository and the verified artifact contains exactly the 389 allowlisted/runtime files.

No remote mutation occurred because reconciliation changed the candidate SHA and the user required the new exact SHA before mutation. Production remains deploy `6ac8236336cbba557f2f8cd3`, latest migration ledger `20261008230843` (`vitality_start_delivery_reliability`). Read-only production verification found zero active Holistic Foundations agreement mappings and zero client agreements, payment records, memberships or client-access rows. Candidate migration `20261007224150_production_client_lifecycle_v1.sql` remains unapplied. It installs `production_client_agreement_publication = held`, allows only CAD $89 monthly/six-month or CAD $960 one-time/12-month intent, and blocks agreement mapping/preparation/delivery, payments and paid activation while held. No enrollment/agreement email, identity, payment or paid access was created. [Reconciliation evidence and remaining release step](docs/PRODUCTION_CLIENT_LIFECYCLE_TECHNICAL_FOUNDATION_RECONCILIATION_2026-10-08.md).

## LOCAL VERIFIED — Production Vitality reliability repair — 2026-10-08

**VITALITY SAVE/RESUME FLOW BLOCKED — explicit release approval and fresh hosted iPhone/external-inbox acceptance pending.** Isolated branch `codex/vitality-resume-reliability`, based on deployed production source `862f4b6e2edb9b6af5332a389c0081fefec6adae`. Production deploy remains `6ac6b471ac8ed68bec8bd8d6`; beta, real participant records and the parked client-lifecycle package were not modified.

Read-only incident trace found five initial Netlify lead submissions but one contact/workflow/draft/start event; three participant emails have provider-delivered status. Individual staff delivery and actual inbox timing are not proven. Local repair deduplicates server-owned initial lead dispatch, captures provider outcomes with bounded same-key retries, locks initial submission, presents a focused Check Your Email panel and controlled recovery, and handles WebKit same-document email-link navigation/interrupted startup. No second verification email is required. Existing answers, completion locks, stale revisions and private-health gates are preserved.

Only new release migration: `20261008192530_vitality_start_delivery_reliability.sql` (**unapplied**). Update only Edge `vitality-resume` and assessment frontend. Already-applied RepDB parity source `20261007220506_repdb_delete_guard_return_contract.sql` corresponds to existing production ledger `20261007221345`; never replay it or use unfiltered production `db push`.

Local validation: production build383; exact public-build JavaScript syntax70/70; maintained frontend109/109 (existing55, secure resume34, questionnaire20); restored native PostgreSQL17 96/96 plus one eight-session overlap race; Edge24/24 plus type check; exact-built WebKit75/75 across1440/768/390 including older Safari UUID fallback. No hosted writes, emails, push or deployment. Nine parked agreement-origin fixtures remain separate and are not claimed repaired. Assets: Vitality55 JS `reliability-1`, Resume JS3, Vitality55 CSS89.

[Full redacted trace, implementation, security, limitations and exact release gate](docs/VITALITY_SAVE_RESUME_RELIABILITY_2026-10-08.md). Next: approve the immutable candidate returned in the completion report, then single-migration/Edge/frontend release and controlled existing-synthetic-draft hosted acceptance.

Earlier local RepDB checkpoints below are historical: RepDB is now deployed; its DELETE guard forward repair is applied. This entry is the current local package only.

## NOT DEPLOYED — Production Client Lifecycle v1 preparation — 2026-10-07

## Production Client Lifecycle business terms approved; legal publication held — 2026-10-08

Primary Chat approved CAD $89/month for a six-month minimum and CAD $960 one-time for 12 months, both ending without automatic renewal, with seven-day failed-payment grace, portal-or-email cancellation, and the final-sale rule subject to non-waivable law. Québec classification/payment review remains unresolved, so neither agreement may be published, mapped, activated, or sent. The local lifecycle candidate now enforces that hold in the database and UI, requires billing-specific CAD mappings, persists six-/12-month intent correctly, and prevents legacy/wrong-path fallback. Build389, PostgreSQL 17 114/114 plus four eight-session race groups, lifecycle DOM15/15, responsive37, and JavaScript syntax pass. No push, migration, deployment, email, identity, or hosted record occurred. [Exact technical boundary and release sequence](docs/PRODUCTION_CLIENT_LIFECYCLE_LEGAL_GATE_2026-10-08.md).

## NOT DEPLOYED — Production Client Lifecycle v1 integrated candidate — 2026-10-07

**PRODUCTION CLIENT LIFECYCLE LEGAL RELEASE HELD.** Local staff Add Client/enrollment/agreement UI, compact verified account/signing/recovery flow, five coordinated Edge candidates and unapplied migration `20261007224150_production_client_lifecycle_v1.sql` are implemented. Business terms and disposable production inboxes are approved. The remaining legal gate is qualified resolution of the Québec classification/payment issue followed by one controlled publication/mapping migration. Payments v1 and paid access remain separately unreleased by design. Exact final release approval and genuine hosted acceptance remain required.

Production deploy `6ac6b471ac8ed68bec8bd8d6`, ledger `20261007221345`; beta deploy `6ac6b620e735903c2285ec3f`, unchanged. No remote push/deploy/migration/mail/identity/content/payment change. Payments and full member dashboard/Nutrition/Workouts/Health/assignments are held; no synthetic production activation. [Current candidate, module table, evidence and exact remaining decisions](revitalizedacademy-client-lifecycle/docs/PRODUCTION_CLIENT_LIFECYCLE_V1_2026-10-07.md).

## NOT DEPLOYED — Production Client Lifecycle v1 integrated candidate — 2026-10-07

**PRODUCTION CLIENT LIFECYCLE BLOCKED.** Local staff Add Client/enrollment/agreement UI, compact verified account/signing/recovery flow, five coordinated Edge candidates and unapplied migration `20261007224150_production_client_lifecycle_v1.sql` are implemented. Native PG17 112 checks plus four eight-session race groups pass; Frontend121, Edge35, build389, syntax111 and responsive34 pass; evidence is in the detailed report. Production legal revision/HF mapping/pay-in-full terms, disposable production inbox approval, exact final release approval and genuine hosted acceptance remain required.

Production deploy `6ac6b471ac8ed68bec8bd8d6`, ledger `20261007221345`; beta deploy `6ac6b620e735903c2285ec3f`, unchanged. No remote push/deploy/migration/mail/identity/content/payment change. Payments and full member dashboard/Nutrition/Workouts/Health/assignments are held; no synthetic production activation. [Current candidate, module table, evidence and exact remaining decisions](docs/PRODUCTION_CLIENT_LIFECYCLE_V1_2026-10-07.md).

## LIVE ACCEPTED — RepDB DELETE guard repair — 2026-10-07

**EXERCISE LIBRARY + BETA SYNC FULLY ACCEPTED.** This supersedes the historical cleanup blocker below. Forward source migration `20261007220506_repdb_delete_guard_return_contract.sql` applied once: production ledger `20261007221345`, beta `20261007221355`. Never replay original RepDB migrations. Privileged BEFORE DELETE now returns OLD; INSERT/UPDATE, RLS, ACLs, Archive and FKs unchanged. No frontend deployment: production `6ac6b471ac8ed68bec8bd8d6`, beta `6ac6b620e735903c2285ec3f` remain current.

Native PG17.11 production93/93, beta296/296; 9 new focused delete/dependency/security cases each; source/API16/16 each. One hosted disposable import/delete each passed with normal triggers; exact source audit exported before bounded cleanup. Staff/member/anonymous/Owner browser DELETE denied; hosted Archive passed with rollback. All original content, 176 protected table/identity fingerprints each, 9 production/14 beta private tables and beta mapping fingerprints unchanged. No unrelated/Auth/client/payment/config changes. [Full repair acceptance and evidence](docs/REPDB_DELETE_GUARD_REPAIR_2026-10-07.md).

## DEPLOYED — RepDB Exercise Library — hosted gates passed; DELETE defect remains — 2026-10-07

This supersedes the historical local/pending checkpoint below. Exact production `862f4b6e2edb9b6af5332a389c0081fefec6adae`, deploy `6ac6b471ac8ed68bec8bd8d6`; exact beta `0eea05af0c05c4b46dbf79d9f5adcabc0d1c2a6e`, deploy `6ac6b620e735903c2285ec3f`. Source migration `20261007201539_repdb_exercise_library.sql` applied once each: production ledger `20261007210608`, beta `20261007210558`. Do not replay.

All requested hosted import/variation/duplicate/taxonomy/movement/approval/custom/refresh/workout/program/one-way-sync/security/responsive gates passed. Exact live Programs JS179/CSS168 and Exercise Library JS/CSS100 match build hashes. Four sync jobs and 18 record audits each retained; beta edits isolated and production-wins resync passed. Free Tier attribution visible, only pinned free media, no provider key/public raw dataset.

All disposable acceptance content removed. Existing content row hashes and 176 protected table/identity fingerprints per environment unchanged. QA source audit archived before removal; immutable sync audits stay hosted. No client/private/payment/identity/role/permission changes.

**Full acceptance withheld:** `private.guard_exercise_source()` returns NEW on privileged DELETE and silently suppresses it. Normal Archive UI passes. Guarded transaction-local cleanup completed without permanent protection changes; zero remaining QA rows/orphans. Required next package is a new forward trigger-only repair with privileged delete/cascade native regressions; preserve existing RLS/provenance guards. No additional source/backend repair applied to these exact approved candidates.

[Full deployed acceptance, evidence, cleanup and exact blocker](docs/REPDB_HOSTED_RELEASE_2026-10-07.md).

## HISTORICAL LOCAL READY — RepDB Exercise Library v1 — 2026-10-07

**EXERCISE LIBRARY READY FOR RELEASE; NOT DEPLOYED.** This supersedes the earlier MuscleWiki/API Ninjas provider-blocker for this package. Reviewed RepDB Free Tier v1.0 permits the requested in-app durable use with visible attribution. Pinned schema-3 snapshot `a360f87f9064de42a9c90228cfebae941a5016d5` has 609 exercises; source/license hashes verified; raw dataset is server-only, ignored and excluded from public manifests. No provider secret.

Implemented separate production/beta candidates: source search/import, unique slug + canonical UUID, exact RVA muscle/movement taxonomies, approval/filter/custom workflow, local-field-preserving source refresh/audit, workout/program integration and forward one-way sync contract/receiver updates. All remote systems and original checkouts preserved. **Unapplied** new environment-specific migration `20261007201539_repdb_exercise_library.sql`; never replay older export/receive/FoodData/Vitality migrations.

Local verification: production PG17 84/84, beta PG17 287/287, dual sync 11/11, source/API/DOM 16/16 per environment, Edge 19/19, exact-built browser 46 checks per environment at desktop/tablet/mobile with clean runtime/no overflow. Production build383 / beta321; syntax108 production /83 beta. The same 28 obsolete production snapshot failures reproduce on unchanged baseline; no new failure. Current production frontend107/107; full beta frontend573 passed, zero failed, 27 expected skips. Normal hosted acceptance/deploy and cleanup remain pending approval.

Prepared assets: Programs JS179/CSS168; Exercise Library JS/CSS100. [Complete licensing, architecture, security, test evidence and exact release gate](docs/REPDB_EXERCISE_LIBRARY_V1_2026-10-07.md).

# ReVitalized Academy Current Build State

## LIVE ACCEPTED — FoodData + one-way beta content sync — 2026-10-07

**FOOD DATABASE + BETA SYNC FULLY ACCEPTED.** This entry supersedes older local/pending checkpoints below for this package; those are historical.

Production application source `f5eabc1d7427ca6198957f42b46c329ef462baa0`, deploy `6ac5fda10ae8b03a2ddf176e`. Beta source `888ae5ad74c872464260437be5eeb1c069fe5d9e`, deploy `6ac5fcfa32ab22338c0799a3`. Both ready; released assets JS/CSS 178/168, Recipe Builder 104, Food Database JS/CSS 101/100, Sync 100 match exact built bytes.

Applied (do not replay): production FoodData ledger `20261007062854`, unchanged-refresh audit `20261007072537`, sync export `20261007080049`; beta compatible FoodData `20261007073128`, sync receive `20261007080053`.

Mobile 1440/768/390, hosted audited USDA refresh and beta FoodData passed. Single/selected dependency sync passed all twelve requested cases: 9 jobs, 56 record audits per environment, 15 stable beta targets, production-wins resync and no beta writeback. All disposable acceptance content removed; immutable audit retained. Auth/staff/contact/Vitality/workflow fingerprints unchanged, no private-data/identity/assignment/payment transfer. Server-only USDA/receiver credentials, Owner/Admin authorization, Coach/member/anonymous/reverse denial validated. Production remains authoritative.

Tests: relevant production frontend 81/81; beta frontend 537 pass, zero fail, 27 expected skips; native PG17 production 73/73, beta 268/268, dual-sync 6/6; Edge 19/19; sync 8/8; isolated responsive browser 66 checks; syntax 96/96 production, 80/80 beta. Inherited obsolete production snapshot failures remain separately documented.

[Complete release, security, acceptance and cleanup evidence](docs/FOODDATA_BETA_SYNC_ACCEPTANCE_2026-10-07.md). Justyn/Elle can author in production and use Sync to Beta. Preserve these changes during later Git integration; manual deploys are not a substitute for integrating accepted branches. No unrelated work begun.


## FoodData Central authoring candidate — 2026-10-07

Implemented locally on isolated `codex/fooddata-central`, based on `e6aa1b0`. Protected USDA search/details/multi-ID imports reuse canonical FDC foods, preserve nutrient/portion provenance and source versions, and support independent Owner/Admin ReVitalized Approved classification and explicit source refresh. Recipe calculation v3 uses local measured composition, mass/source portions, whole/per-serving totals, recipe weight and per-nutrient coverage. Unknown stays unknown; custom foods remain supported. Source refresh and title/image-only edits preserve stored recipe snapshots.

New migration `20261007050706_fooddata_central_recipe_nutrition.sql` is local only. No push, remote migration/deploy, hosted content, assignment, private-data, Payments v1 or Authorize.Net change. Local checks: build 380 files; syntax 93/93; assessment/content frontend 63/63; Vitality frontend 10/10; FDC adapter/server/contract 10/10; PostgreSQL 17 72/72; Edge 19/19; existing responsive UI 36/36; FDC UI 51/51 at all three requested sizes, no runtime errors/warnings or horizontal overflow. Legacy snapshot tests retain 28 failures, reproduced identically on untouched `e6aa1b0`. Beta agreement-origin fixtures remain separate.

Next gate: protected Netlify Functions/Production `USDA_FDC_API_KEY` and matching server Supabase configuration, then explicit single-migration/function+static release approval and disposable hosted acceptance/cleanup. No credentials in chat. `FOOD DATABASE PACKAGE BLOCKED` until those gates pass. [Full implementation and release report](docs/FOODDATA_CENTRAL_V1_2026-10-07.md).

## Historical Vitality reconciliation — 2026-10-06

This current entry supersedes older pending-release descriptions below. Production frontend remains deploy `6ac52af350af344e34bcfa31`, source `77dbe985c4132503696915b34523dede68beee66`; no Netlify release was needed for this database-only repair.

- Root cause: staff review RPCs selected only the secure draft system introduced Oct. 5. Eight older production workflows were omitted. Two completed workflow/report records also lacked their original Netlify summaries.
- Applied ledger: `20261007030224 vitality_historical_review` (source migration `20261007010000`), `20261007030817 vitality_unlinked_source_reconciliation` (source `20261007012000`). Do not replay.
- Restored all eight existing historical workflow contacts to the secured review list. Preserved original workflows, contact identity, report flags/status/timestamps and source attribution. Added an inaccessible-to-browser historical source archive and operator-only idempotent import functions.
- Restored two matching completed summaries/coach flags. Imported two verified missing completed sources: Brandy into one new assessment-lead contact, and Sept. 5 Justyn into his existing contact with explicit user approval. Existing Justyn contact checksum remains unchanged; original submitted email remains separately preserved in the private archive. No Auth identity, resume draft/token, enrollment, invitation or client payment created.
- Netlify audit: 4 verified completed submissions plus 3 spam-index submissions. Two spam-index entries match legitimate existing completed workflows; no spam status was changed. One Oct. 5 source already belongs to the secure system. Two verified old sources (David Fowler/Forest Gump) appear to be test records and remain held pending classification. Pre-Oct. 5 lead metadata: 24 submissions across 12 normalized emails; retries are not duplicated into contacts.
- Result: 10 pre-Oct. 5 workflows visible (4 completed, 6 unfinished); 13 total current review entries including 3 secure records. Four original completed summaries archived. Existing incomplete records remain status-only; their unsaved answers cannot be invented.
- Validation: 64/64 PostgreSQL 17 production backend checks, 10/10 Vitality frontend checks. Health-private permission and contact scope enforced; operator import calls denied to browser and service roles. Production Owner portal refreshed to 13 review entries; Justyn’s historical summary opens. Authoritative Justyn and Elle permission contexts each return 13 entries. Nine of twelve pre-Oct. 5 lead emails map to represented assessments; three are held (two test-like completed sources and one lead-only inbox without completion evidence).
- Historical private payloads remain outside Git. Beta recipient registry is a separate staging-only branch and migration; no cross-environment data copy.


Updated: 2026-10-06

## Production durable content candidate — approval pending

- Branch: `codex/production-durable-content`, based on the released production branch (`c72e328` documentation / `4a2d293` deployed application source). No staging merge or customer-data transfer.
- Prepared migration: `20261006164158_production_durable_content.sql`; **not applied remotely**. It adds content media/food provenance/serving metadata, a 101-entry reference nutrient catalog, repaired recipe calculations and content-only authoring policies. No client diary/targets, role grants, payment/provider configuration or methodology seed is included.
- Prepared frontend: Foods/Recipes/Exercises/Workouts/Meal Plans/Fitness Programs, recipe/composition builders, edit/lifecycle controls, methodology philosophy/version editing, sidebar shortcuts, and the narrow legacy Account initialization repair.
- Authoring requires active approved staff plus `learning.manage`; existing permission defaults/overrides are preserved. Food uses Activate/Deactivate; other reusable content uses draft/publish/archive.
- Local validation: production build 378 files; 67 JS syntax checks; 62 existing frontend checks plus 11 candidate checks; 50 PostgreSQL 17 database checks; 36 exact-built Chrome responsive/runtime cases at 1440×1000, 768×1024 and 390×844. No live data was written.
- Production control plane still reports deploy `6ac520ad289a6b34347af163`; latest production migration remains Vitality Review `20261006162255`. Production content hosted acceptance is pending release approval.
- Justin/Elle already have active production Owner records; fresh production login/authoring remains unaccepted until the candidate is deployed.
- Status: **PRODUCTION DURABLE CONTENT BLOCKED** — remote migration/deployment approval and subsequent focused hosted acceptance outstanding.
- [Full release boundary, module classifications and acceptance plan](docs/PRODUCTION_DURABLE_CONTENT_RELEASE_2026-10-06.md).

## Production Vitality Assessment Review released

- Deployed application source: `4a2d293` on `codex/vitality-production`; feature implementation commit: `e1e14d3`.
- Scope: a production-only staff Vitality Assessments workspace, two narrow secured read RPCs, the approved Adult/Child question catalog, focused browser/backend regressions, and production build allowlist entries.
- Authoritative source: `private.vitality_assessment_drafts` plus the existing production contact and staff-scope model. No Netlify Forms runtime scraping or cross-environment data bridge was introduced.
- Permission boundary: both RPCs require `health.private.view` and `staff_can_access_contact`; unfinished assessments expose status metadata only, while completed assessments expose a sanitized submitted answer set, existing coach summary, existing coach-review flags, and existing assessment-derived tags. Direct private-table reads remain denied.
- Verification: production build generated 376 files; focused browser regressions passed 62/62; PostgreSQL 17 authorization regressions passed 10/10; JavaScript syntax passed; responsive review passed at 1440×1000, 768×1024, and 390×844 without horizontal overflow.
- Isolation: the production artifact contains the production Supabase/project origin only and does not contain staging project references, beta URLs, synthetic beta identities, or staging fixtures.
- Release status: GitHub branch pushed, migration `20261006162255 vitality_assessment_staff_review` applied to production Supabase, and Netlify production deploy `6ac520ad289a6b34347af163` published on 2026-10-06.
- Exact live asset hashes match the reviewed production artifact for `portal-vitality-assessments.js`, `portal-vitality-assessments.css`, and `vitality-question-catalog.js`.
- Supabase verification: both RPCs are `SECURITY DEFINER` with a fixed empty search path, authenticated execution only, and anonymous execution revoked. The intentional authenticated SECURITY DEFINER advisor findings correspond to the two guarded RPC entry points; no unrelated schema or permission changes were made.
- Hosted limitation: the signed-out production portal loads the current sign-in screen and the new assets without module-specific errors. Its existing baseline scripts still emit unauthenticated initialization errors from `portal.js?v=182` and permission-dependent panels; these files were not changed by this release.

## Production

- Deployed application source: `4a2d293`
- Netlify site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`
- Published deploy: `6ac520ad289a6b34347af163`
- Public domain: `https://revitalizedacademy.com`
- Supabase project: `voalfpxiyznnqfcqcymd`

Production now serves the accepted secure Vitality save/resume release with required first-page referral attribution. The public application candidate is `a79102c52f474b8af2750a27c4e8dda1dafa8af1`; the isolated branch head is `99d1ed4` after rollback-compatibility hardening.

## Vitality referral attribution

- The initial Contact step requires one of 14 approved referral sources and has no preselected marketing source.
- `Sales Rep` reveals a required Sales Rep Name; `Other` reveals a required source-detail field. Switching away hides, disables, and clears the obsolete conditional value.
- Initial secure capture persists `referral_source`, `sales_rep_name`, and `referral_source_other` on `contacts` and in the unfinished draft identity. Existing `first_source` and `last_source` semantics remain unchanged.
- Production migrations: `20261005183813 vitality_referral_source_tracking` and `20261005184407 vitality_referral_rollout_compatibility`.
- Production Edge Function: `vitality-resume` version 2, bundle SHA-256 `93f44b2c69dd8ef7272c5df56b7b49fa8272c115fdc4a3be5723759c818ae3d8`.
- The current Edge handler requires referral attribution. The private service-only RPC accepts the previous start payload solely so the accepted prior release remains a functional rollback target; anonymous and authenticated roles still cannot execute it.

## Accepted Vitality release

- Accepted staging source: `1d649c60abf580f9f696428ff2540a47ee1bf9eb`
- Accepted staging deploy: `6ac3bbaeecd0a269b0a5eef6`
- Isolated production candidate branch: `codex/vitality-production`
- Candidate scope: Vitality entry, secure verified-email recovery, server-backed autosave/resume, completion lock, the production environment mapping, one forward migration, and one Edge Function.
- Excluded scope: Client A/B data, staff beta work, meals, workouts, and all other staging-only beta changes.
- Source relationship: accepted staging and production diverged at `df8aba33cd8bac16e54aded92a4c99439f74f1d5`. The candidate is based on production `d9eb428` so the five production cohort-removal commits remain intact; the staging branch was not merged wholesale.

## Verification

- Production candidate build: 373 public files.
- Focused browser regressions: 52 passed.
- PostgreSQL 17 secure-resume regressions: 22 passed against the full baseline and every forward migration.
- Edge Function regressions: 19 passed.
- JavaScript syntax: passed for all changed and added production files.
- Production schema compatibility: required tables, columns, helper function, extensions, and unique indexes are present.
- Environment isolation: candidate contains the production Supabase project and production domain; staging project, staging URL, synthetic recipient allowlist, and test addresses are absent from the public build.
- Production migration ledger now ends at `20261006162255 vitality_assessment_staff_review`.
- Production Edge Function: `vitality-resume` version 2, active, bundle SHA-256 `93f44b2c69dd8ef7272c5df56b7b49fa8272c115fdc4a3be5723759c818ae3d8`.
- Exact live hashes match the candidate for `runtime-config.js`, `js/environment.js`, `js/vitality55.js`, `js/vitality-resume.js`, `js/revitalized-data.js`, and `css/vitality55.css`.
- Start New and Resume Existing render and switch correctly at 1280, 768, and 390 pixel widths without horizontal overflow or browser console errors.
- The live referral dropdown contains the approved placeholder and 14 options; required/conditional validation and stale-value clearing pass at 1280, 768, and 390 pixel widths without horizontal overflow or browser console warnings/errors.
- Home, portal, member, enrollment, and webinar pages remain byte-identical to the prior deploy.

## Production acceptance

The configured production environment passes a non-writing preflight, rejects a foreign origin, and returns the approved neutral response for a malformed email.

The authorized production smoke used `rva-assessment@eaglevision.biz`. It created exactly one contact, one unfinished draft, one Vitality workflow, one active journey, and one `vitality_started` event. External delivery was confirmed by the user. Opening the link consumed and cleared the single-use emailed credential, verified the email, and created one active session on the same draft without duplicates. The unfinished draft remains at Whole-Person Snapshot, 7%, revision 4; it was not completed.

The accepted smoke contact, draft, workflow, journey, section, percentage, and revision remained unchanged throughout the referral rollout. No hosted validation contact was created.

Final state: `VITALITY PRODUCTION READY`.

## Rollback target

- Frontend: Netlify deploy `6ac3ccee3eda881a1fdf1ead`
- Source: `df611af833ff4c25a51928ffd399ca0178bced47`
- Edge: restore `vitality-resume` version 1 source if the prior frontend is restored.
- Database: additive nullable columns may remain. Migration `20261005184407` keeps the prior service-only start payload compatible, so no destructive database rollback is required.


## Owner access reconciliation — 2026-10-06

Production completed Vitality Review had a server timeout misreported by the UI as a permission/contact-scope denial. The existing decoder made a representative completed review take 12,681.643 ms, above the authenticated API 8-second statement timeout. A single private decoder optimization was applied as production migration `20261006211025 vitality_review_decoder_performance`. The same completed review now executes in 15.285 ms. Neither API timeout nor review authorization was broadened.

Both real production owners retain separate confirmed Auth users, active Owner roles, completed onboarding, all-contact scope, and all 19 current Owner permissions. Authenticated-role checks for each owner return the identical completed-review hash before/after the repair. Review, permission and contact-scope function definitions, all role defaults, all overrides, and the private helper ACL were verified unchanged. No contact, answer, summary, or workflow data was changed.

The hosted production review now opens normally in the existing Dave Owner session: 299 answer elements, stored Coach Summary, and referral/source presentation render with a clean warning/error console. This proves the hosted repair, not fresh login acceptance for Justyn or Elle.

Tests: 52/52 PostgreSQL 17 content/review/resume tests; 10/10 Vitality Review frontend tests. New fixtures cover separate default Owners, long Unicode summaries under a 2-second timeout, malformed encoding and invalid UTF-8. Existing scope/private-health/member/anonymous denials pass.

Production frontend remains Netlify deploy `6ac52af350af344e34bcfa31`, source `77dbe985c4132503696915b34523dede68beee66`. No frontend deployment or Edge redeployment was needed. Isolated repair branch: `codex/owner-access-reconciliation`.

Pending: normal fresh production sign-in acceptance for each real owner; beta Owner invitations/setup and independent acceptance. Exact owner emails are absent from staging Auth/invitations. Beta provisioning awaits an existing beta Owner session and approved staging invitation phone numbers; no invitation sent yet. Production Vitality Review is not currently released in beta, so beta Vitality acceptance cannot be claimed. Do not copy production health/profile data to obtain staging coverage or reuse synthetic identities.

## FoodData acceptance follow-up — 2026-10-07 (in progress)

Authorized package closes mobile overflow and USDA refresh acceptance before beta release and one-way reusable-content sync. The production FoodData migration is already applied as ledger `20261007062854`; do not replay it.

Program Access grid children now permit shrinking within the available document width. USDA refresh uses a keyboard-accessible in-page confirmation and reports success; the authenticated server API and source audit behavior are unchanged. Exact production-built isolated browser coverage includes real representative Program Access cards, cancel-without-request and single confirmed refresh at 1440×1000, 768×1024 and 390×844: 63 checks, no runtime errors and no document/modal overflow. Core frontend regressions: 73/73.

Hosted proof, beta FoodData rollout and production-to-beta content sync remain pending. No sync functionality is deployed yet. Production remains authoritative; private/person/operational data is excluded from the planned sync.

Production narrow frontend deployed as `6ac5f36e1e1ab1a152b18e85`, source `9901664`. Native PostgreSQL 17 now passes 73/73 backend tests, including unchanged source refresh audit and snapshot immutability. One new production migration, `food_source_unchanged_refresh_audit`, records successful unchanged USDA checks without altering food or recipe data; existing source permission/ACL checks remain intact. Hosted refresh acceptance is in progress.

## 2026-10-07 FoodData and one-way reusable content sync release candidate

Mobile document overflow is repaired and hosted production USDA source refresh is accepted, including the audited unchanged-source case. Production source-refresh migration ledger: `20261007072537`; source `20261007072413`. Its disposable USDA/recipe records were removed. Beta compatible FoodData source `20261007072948` is applied as ledger `20261007073128`; beta deploy `6ac5f5f470e2f10b4379b278` passed hosted USDA import, approval, custom food and macro/micronutrient recipe calculation, with zero matching production writebacks. Those beta fixtures were removed.

The new production-only export / beta-only receive migrations have now been applied. No migration was replayed. The prepared protected Netlify Function validates the production site/origin and fresh production Owner/Admin authorization; it exports only the reviewed 13-table reusable-content contract, remaps dependencies to stable beta UUIDs, updates existing copies atomically, audits source/version/initiator/target/result and supports immutable job retries. A production-only Functions secret authorizes the beta receiver; beta has no production service credential or export RPC. Public content labels and Owner/Admin single/selected actions are added. Client/Auth/staff/health/Vitality/assignment/payment/message/other operational tables are outside the contract. Hosted sync acceptance and final deploy IDs are pending; do not claim fully accepted yet.

Verification: native PostgreSQL 17 production 73/73, beta 268/268, dual-database sync 6/6; Edge 19/19; sync server/UI/packaging 8 tests; isolated built FoodData/sync UI 66 checks at 1440/768/390, zero runtime errors or hosted writes. Historical Build76–82 byte-snapshot tests do not describe the current production baseline and remain separate; no public homepage/webinar files were changed by this package.

## 2026-10-11 production session refresh hosted follow-up

Production session refresh source `0d0c9f7218ebf26402efbefc67ef73eed171b55d` was superseded after Owner normal refresh, hard refresh and second-tab restoration passed but logout uncovered an existing `portal-client-lifecycle.js` cleanup callback that dereferenced modal nodes after the core had removed the private portal shell. Auth cleared, but the page remained on **Signing out…**.

The approved narrow replacement `d4c34653bde9d1a7dce62a31f97e305f95c0a666` is live as production Netlify deploy `6acbe82d68f1fde80c369183`. Lifecycle cleanup is tolerant of the already-removed shell and `portal-client-lifecycle.js?v=102` matches the exact built artifact. Production Owner normal refresh, hard refresh, second-tab restoration, logout propagation, logged-out reload persistence, and private-DOM cleanup pass. Build 389, JavaScript syntax, 132 maintained unit/runtime checks, 37 lifecycle/responsive Chrome checks, and 23 exact-built Chrome/WebKit session checks pass. No database, migration, Edge Function, secret, permission, RLS, hosted client, payment, or beta state changed.

## 2026-10-12 production post-logout console repair

Hosted acceptance of the `d4c3465` release exposed five modules that still ran startup or in-flight database work after the core invalidated the staff session. Their late authorization failures were logged after private-DOM removal. The local repair adds a shared staff user/session-epoch task guard and module-specific teardown for Permissions, Staff Onboarding, ReFuel, Community, and Executive Pulse. Exact-built Chromium and WebKit now complete authenticated initialization, logout, stale-response delivery, logged-out refresh, inactive-session denial, and new-account initialization with zero warning/error console events. The candidate remains local and must receive exact-SHA approval before a production-only Netlify deployment.


## 2026-10-19 — Isolated reference reconciliation and numerical rehearsal

Branch `codex/v014-calibration-reconciliation` starts at the complete published B6 + PR51 source a0e4692c5954ec21c1de7517ed706cf71b86a15c. Only additive local developer tools and documentation were prepared. All 696 prior tracked paths remain; all existing application/configuration/Function/migration/public assets are byte-identical, with this history appended only. No push, deployment, hosted mutation, scoring activation, permission change, beta or payment change.

Found original illustrative HTML and October12 handoff PDF. The actual v0.14 Python/rules.json/Part1–3/eight-input source package is missing; its claimed130 checks and8 results are NOT independently verified. Conflicts with newer Driver weights and zero Budget health deduction are documented, with no silent model mixing or old build restoration.

Reused unchanged B2/B2.1/B5/B5.3/B6 logic and50 fictional cases in a loopback-only local rehearsal. Current A/B/C reproduce70.65971946180456,35.481338923357555,70; discrepancy remains unresolved. Generated743-field metadata coverage matrix, memory-only founder review and three synthetic13-page print drafts. No participant answers or identifiers are included. Actual source contract still supports zero complete numeric Drivers; no actual-person numerical calculation or PDF was produced.

Validation: current engine28/28, focused B2.1/B5.3/B6 111/111, maintained native PG17/RLS192/192, B42 native browsers228 checks/six runs, four8-worker concurrency groups, synthetic preview150 checks/six runs, new preservation/coverage/print guards6/6; zero browser warnings/errors/external requests/overflow. Broad baseline218/220 initially; one missing build artifact passed its isolated rerun; historical pre-PR51 B5 asset snapshot assertion remains stale and was not modified. Current live439-path/nine-Function preservation independently passes.

Read-only protected metadata audit reconfirmed all3 owner-designated consultation sources have genuine founder confirmation, seven SOP acknowledgments, eligible unchanged source/identity pins and one active readonly cohort each. Existing fourth source remains. No health answers extracted. B4versions/B5pilot/B6purpose/grants/feedback remain0; ledger207/latest20261019013356 unchanged. Existing Oct22 08:45 Central manual revocation ceiling remains. Available local browser is supervising Owner, not a founder; a founder’s remote session cannot be reused here. No new blanket privacy approval is requested.

Production remains locked deploy6ad591a42c055bca5df5c2d4;439 published paths, nine exact Node22 Function digests/configuration/routes/payment-worker schedule and beta preserved. Remaining gates: obtain exact original prototype package, resolve approved factual source rubrics/revision evidence and independent expected cases, then separately authorize any exact-source B5/B6 compute or controlled export. See docs/V014_REFERENCE_RECONCILIATION_2026-10-19.md and tools/calibration-preview/README.md.

## 2026-10-19 — isolated internal Roadmap processing implementation

- Branch `codex/roadmap-internal-processing-v1`, preserving deployed PR51/B6 source and local audit work.
- Implemented metadata completion queue, authenticated source-scoped worker, server-sealed immutable all-12-Driver evidence versions, append-only founder proposals, idempotent regeneration and exact-version internal approval.
- Candidate-only forward SQL `20261019180611_roadmap_internal_processing_v1.sql`; no hosted migration, deployment, push, participant processing, grants, exports or delivery.
- Reused the existing B2.1/B6 adapter, coverage matrix, auth/SOP/source controls and approved renderer. All real-source complete numerical Driver results remain withheld; missing mapping/provenance/rubric requirements are explicit.
- Existing nine Function sources, runtime configuration, NDA, payments, source data and beta remain unchanged. New additive Function is not deployed. All five new controls default false.
- See `docs/ROADMAP_INTERNAL_PROCESSING_V1.md` and sanitized `docs/evidence/roadmap-processing-v1/` for implementation, test evidence, preservation, limitations and separate technical-release/source-write gates.


## 2026-10-19 — Unreleased protected-loader frontend repair

Reuses only seven PR39 loader patches on current live PR51/B6 source. All anonymous startup/cleanup entry points now require the current verified staff session; CRM/Messaging/Companion queues additionally wait for existing permission resolution. Existing task guard prevents stale same-account/account-switch responses from painting or continuing load chains. Startup/debounce timers and cached rows clear on reset. Work Desk loading lock is task-bound so a same-user refresh cannot stall behind an old epoch. No core Auth/NDA, RLS/SQL, scoring, Functions, schedules, payment, beta or questionnaire change.

Runtime diff is exactly seven module files plus seven cache-reference edits in portal/index.html. Maintained content fixtures now provide the real existing session/task API. Local-only tests use synthetic identities and intercepted network, not hosted sessions. Signed-out request count and positive-path console errors are required to be zero; an explicit unauthorized negative probe must retain its denial/error. See docs/PROTECTED_LOADER_REPAIR_2026-10-19.md and its maintained guard/browser tests for exact request provenance, preserved authority and release sequencing. No push, hosted migration, deploy, lock/config change, real participant access or processing activation authorized/performed. Final exact commit/test evidence recorded externally after local validation.

Final local validation:276 unique Node/JSDOM tests,12 Chromium/WebKit responsive configurations across two source variants/372 checks,148 existing content-browser checks pass. Zero anonymous protected requests and zero positive-path console warnings/errors; intentional forbidden probe remains observable. Live original deploy/lock, original unpublished candidate,9 original+reviewed additive archive, all5 false controls,4 current source pins and beta preserved by read-only postflight. See docs/evidence/protected-loader-repair/validation.json. No hosted mutation or push.


## 2026-10-19 — B6 purpose feedback/idempotency repair, LOCAL ONLY

Additive codex/b6-purpose-feedback starts at combined748ed0c0ceb98bf1687c60874fa4611e1bff3e19. Fixes offscreen consent feedback, missing saving/recorded/blocked states and identical retry duplication. Three static paths plus one guarded forward B6 function migration20261019213244; no Function source/config or scoring change. All seven explicit statements, authenticated founder/source/session chain, immutable history, independent operator activation and five held processing controls preserved. No push, hosted migration, deploy, consent/permission write, source answer read, grant or processing occurred.

218 PG17/RLS tests,192 maintained B6 browser checks,186 focused responsive consent checks,7 eight-worker races,237 processing compatibility tests with six native browsers/four race properties,93 focused Node tests pass. Existing legacy questionnaire/person tests also retained in diagnostics. All test sources fictional.

Production publication is BLOCKED by independently observed live artifact drift: current canonical deploy6acf752848babaf7dc540581/source07e968b43efd1bedcf15a95056c8674853992e19,394 paths/six Node24 Functions,lockON; B6 scripts/endpoint404. Expected baseline6ad591a42c055bca5df5c2d4 differs. Existing748ed combinedcandidate6ad68572d4ed12219645bdb4 remains unpublished. Do not reuse an earlier baseline-bound approval or silently restore/rebuild Functions. Reconcile this drift before exact new release approval.

See docs/B6_PURPOSE_FEEDBACK_REPAIR.md and private external deployment-evidence/2026-10-19-b6-acknowledgment-diagnosis. No actual client identifiers, source pins or health answers were added to repository artifacts.
