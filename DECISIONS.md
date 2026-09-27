# ReVitalized Academy decisions and unresolved questions

Baseline: 2026-09-26. A newer build report does not supersede an earlier approved requirement unless an explicit change can be traced. Assistant suggestions and completion claims are not equivalent to user approval or verified implementation.

## Authority and evidence

- Latest build continuity: **Resume backend buildout**.
- Supporting sources: **BACKEND BUILDOUT CONT 2 RVA**, **Backend Game Plan**, **Locate Academy Mockup**, **Webinar Launch System Design**, current repository build notes and the two presentation repositories.
- **Build Vitality Assessment** was not discoverable through the available task listing. Its underlying approval files are not in the inspected repositories. Preserve current code and documented approvals while requesting that exact source link.
- Primary authority: the current ReVitalized Academy orchestration Chat in the ChatGPT Project (designated by the user on 2026-09-26). The Work conversation handles research/validation; it does not independently approve a new product policy.
- Current user engineering instructions authorize source recovery, isolated fixes/tests, commits and a branch push. Production remains read-only; no merge, deployment or production configuration change is authorized.

## Preserved approved requirements

| ID | Requirement | Provenance / status |
|---|---|---|
| D01 | Chat decides, Work investigates/validates, Codex implements/tests/documents | Current user instructions and operating-model attachment |
| D02 | Preserve public website, approved branding/images, integrations and protected data flows | Current instructions; README/build protection notes. No asset or runtime changes in this baseline |
| D03 | Save respondent contact details on the initial Next/Save & Continue before health questions | Current instructions; Build 71/72/74 notes; code and 20 assessment tests |
| D04 | Preserve full approved adult/child question banks and branching | Build 72 records approval of ages 0–18 inclusive and defers proposed age splits; Build 74 carries specific review corrections; current tests include age 19 adult fallback |
| D05 | CSV export needs explicit permission; ordinary staff/admin access must not grant it | Backend Game Plan turn `581e5682-c281-4eb1-a6c9-3459a8f31ef0`; current user reaffirms. Live defaults deny all non-owner roles |
| D06 | Contracts have approved personalized amounts/terms, company approval and client signatures; coach NDA belongs in staff onboarding | Same Backend Game Plan turn; original MK7 contract and MK.1 NDA files were recovered as accessible attachments, not newly approved or rewritten |
| D07 | Staff can be added separately from lead acquisition with granular access chosen by leadership | Backend Game Plan turn `f3a21bb3-5a67-4c34-9405-8bb1afa57f3d`; staff modules deployed |
| D08 | Preserve dashboard, Progress and Family Hub targets including charts, goals and family profiles | Locate Academy Mockup; blueprint assets; CONT 2 turns `e4dbc54d-dcd1-47b1-90bd-ae48b9a0d413`, `757f7405-fe01-4451-87a4-65b8ce310c28`; Resume turn `535b8675-074c-4d37-9834-79cd9f965650` |
| D09 | Clear branded staff dashboard with important information/quick actions and sidebar categories; readable spacing/contrast | CONT 2 turn `e562aa42-d4ab-4bf8-991e-a5ec031b157c` and subsequent user approvals. Church screenshot is a navigation reference, not replacement branding |
| D10 | Hot-lead and assessment-first journeys differ; gently follow up stalled steps and assign next actions | Backend Game Plan turns `0224aec1-66f1-47d9-8f5c-1fed69a61686`, `a79ab089-bbd9-4665-aac8-643395b9109b` |
| D11 | Holistic Foundations $25/week or $89/month with six-month minimum; preserve existing private pricing treatment | Hot-lead instruction, current plans/enrollment markup and live program catalog agree. Build 82 test's three-month wording is stale evidence |
| D12 | Webinar One: 50 seats, $50 reservation intent, initially priority pre-registration while payment is unavailable | Webinar turn `38a63379-9e64-4b21-906b-47ae6d8d1bcf`, newer page and live event config agree. Earlier 30–40-seat plan is superseded on this point only |
| D13 | Preserve actual founder imagery/logos; do not regenerate or distort their appearance | Website README and repeated Webinar corrections; source assets retained |
| D14 | Branded recovery email must come from ReVitalized, lead to password change, and provide a clear completion flow | CONT 2 turns `1600ae61-a207-48c6-af0e-7a441db6d03d`, `7e686928-1c29-407c-946b-adb4630e4ea2`; deployed Resend recovery source exists, delivery untested |
| D15 | Build an owned AI Advisor foundation, with approved knowledge and human review; GoodBarber optional | Resume question `0c2066e7-4a83-42f1-9194-d6d27d1d69b8` followed by user agreement `ee4d2f71-cde8-4236-b415-99f507632de7`. Backend foundation exists, generation not connected |
| D16 | Preserve the recorded Male/Female field choices and husband/wife couple-package policy pending any explicit policy change | Backend Game Plan turn `5b58fb19-fe5b-4918-835f-77b14f99472f`; current assessment tests. Do not infer additional identity/access restrictions from this wording |
| D17 | Larger coherent build batches; avoid many tiny deploys | CONT 2 repeated instructions, especially credit/build concern `e589b7ff-6248-4321-a9c5-1580ad2d8bf6`. No deploy is authorized by this baseline |

## Explicitly excluded wrong-project posts

In **BACKEND BUILDOUT CONT 2 RVA**, correction turn `b1cc705d-fcfd-43ad-8ba9-26e3713f01e7` says the previous two posts belong to the wrong chat and must not cause changes. Exclude both their content and any assistant-derived requirements:

- `26facc0b-aa39-44ef-a8c8-7bda328731c7` — “floor, not the ceiling,” with 13 attached images.
- `6eb23145-edb3-4d66-b340-6fafdd1439b4` — “Let's go ahead and take it from here,” with 17 attached images.

Do not conflate these with the earlier explicitly ReVitalized dashboard references. The migration ledger records `20260925211016 add_events_attendance_operations` immediately followed by `20260925211149 revert_accidental_events_attendance_changes`. This supports a historical reversal, but does not by itself certify every artifact from the wrong posts was removed. No new event-attendance scope is approved here.

## Reconciled differences, not open product conflicts

- README's early “webinar teaser only” description is stale against later explicit webinar approvals, actual pre-registration code and live event configuration.
- Roadmap's 30–40 seats changed explicitly to 50; its other future webinar funnel requirements remain planning inputs.
- Enrollment tests' three-month minimum conflicts with six-month approved instruction, source and catalog; preserve six months and review the tests.
- “Bootstrap v27 completed” refers to existing database objects, not a fully released v27 UI. Frontend v2 and backend v27 are different status layers.
- “Mobile health bridge complete” supports a backend ingestion claim, not proof of native apps or connected watches.
- Historical “security passed” is narrower than the current authorization concerns. Advisor output is not a substitute for tests.

## Remaining decisions and missing evidence

Repository and primary authority, system ownership, adult-health privacy defaults, guardian-aware access, six-month Foundations, 50-seat webinar, export requirements and the independent payment/agreement gates are now APPROVED (see below). Do not request them again.

UNKNOWN / requiring primary Chat or Work resolution before the relevant release:

1. Justyn/Elle’s Health Score/Family Health Score methodology and detailed family aggregation rules; no formula is approved by mockup numbers.
2. Native app vendor/release path, after preserving owned GitHub/Supabase architecture and optional shell boundaries.
3. Hosted staging origin, Netlify binding, real provider/payment/webinar readiness and coordinated release acceptance.
4. Original assessment source materials; detailed answers/scoring/resume stay in Netlify until a later explicit change.
5. RESOLVED by the approved client lifecycle assignment below: onboarding sequencing, independent secondary signatures and post-activation payment reversal/access lifecycle. Current implementation does not invent new rules for these cases or rewrite existing records.
6. Any stronger restriction on bulk copying beyond explicit CSV permission and least-privilege readable rows.

## Approved engineering-package decisions — 2026-09-26

APPROVED by the user’s attached orchestration instructions:

1. ReVitalized-owned GitHub/Supabase is the system of record.
2. GoodBarber may be an app shell; core business logic, data and AI remain owned by ReVitalized.
3. Mighty Networks is not the core system of record.
4. Reuse Global Propel concepts without depending on unfinished Global Propel work in production.
5. Detailed adult family health is private by default.
6. Guardian/minor access is relationship and permission aware.
7. Health Score and Family Health Score methodology requires explicit Justyn/Elle approval; do not invent a production formula.
8. Payment and required agreements are independent gates. Full access requires both complete or explicitly waived.
9. Foundations commitment is six months.
10. Preserve the public Vitality Assessment pending recovery of approved sources and regression behavior.
11. Detailed assessment answers, scoring and resume must not be moved away from the current Netlify flow in this package.
12. People CSV export requires `people.export`, contact/row scope and audit logging.
13. Coaches do not receive export permission by default.
14. Ordinary people exports exclude health/private-health data.
15. Preserve the approved 50-seat priority webinar behavior.

The confirmed implementation repository is `eaglevisiondigital/revitalizedacademy`. Continue on an isolated `codex/*` branch based on refreshed `origin/main`; source baseline remains `df8aba33cd8bac16e54aded92a4c99439f74f1d5`. Preserve the v2 frontend contract during backend recovery.

## Approved lifecycle decisions — user assignment, 2026-09-26

- **D18 APPROVED:** authenticated onboarding is limited to enrollment/program/payment/agreement/basic-account/notices/support surfaces. Full membership requires both independent payment and agreement gates. Implemented on codex/client-access-lifecycle; not deployed.
- **D19 APPROVED:** a two-signature contract requires two distinct authenticated adult identities. Secondary invitations are recipient-bound, expiring, replay-safe and scoped to the exact rendered agreement. Co-signing never implicitly grants household or adult health access.
- **D20 APPROVED:** confirmed refunds/reversals that reduce net paid amount below the requirement restrict paid benefits while preserving account/history and resolution surfaces. Partial refunds above the threshold do not suspend. Restoration requires both gates; administrative revocation is not automatically reversed. All transitions and waivers are audited.

These decisions resolve the earlier three-question Chat handoff. The old successful two-name/single-account test expectation is explicitly superseded; approved terms, assessment content and scoring are unchanged. Technical implementation details and compatibility limits are recorded in docs/CLIENT_ACCESS_LIFECYCLE.md. Work's external validation assignment remains outstanding.


## 2026-09-27 — approved isolated staging preparation

- **Approved by assignment:** separate codex/staging branch, separate Netlify site and separate Supabase project; preferred staging.revitalizedacademy.com, dedicated Netlify hostname acceptable. Production untouched.
- **Implemented:** explicit shared environment configuration, fail-closed staging targeting, dist allowlist, all 15 Edge environment guards, synthetic payment/email boundaries, new-project bootstrap and release/rollback/acceptance docs. No v27 upgrade or assessment scoring.
- **Recovered:** original MK7 and MK.1 PDFs; exact existing published template text/hashes/merge schemas; safe program/journey/permission configuration. No legal wording changes or client-data export. Private seeds stay outside public repo/artifact.
- **Engineering test fixture:** Foundations→MK7 required relation exists only in new staging because read-only production had zero program requirement rows. This is not an approved production mapping/backfill. Primary Chat prompt in docs/STAGING_ACCEPTANCE.md requests the missing production decision.
- **Pending external work:** actual new resource creation, hosted baseline/Auth/SMTP/Edge/Forms verification, synthetic end-to-end acceptance and existing Netlify provenance. No production merge/deploy/DDL/config write has occurred.
