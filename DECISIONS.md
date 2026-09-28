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


## 2026-09-27 — Home / Today vNext integration

- **D21 APPROVED:** the first post-staging member integration slice is Home / Today vNext. Preserve `my_app_bootstrap_v2` as the paid-member fallback and do not switch wholesale to v27.
- **D22 APPROVED:** evolve the existing “Needs Your Attention” card using `my_next_best_actions` / `my_home_priority_summary`; do not add a competing duplicate priority card. Preserve legal/payment/message/family-request attention items not represented by the backend action view.
- **D23 APPROVED:** add a compact `my_up_next` presentation and progressively enhance Weekly Momentum with `my_weekly_progress_story`, with existing v2 data as fallback.
- **D24 APPROVED:** Home vNext must be independently reversible behind a dedicated runtime flag (recommended `member_home_vnext`) and additive read failures must degrade to the existing v2 dashboard rather than fail the entire member app.
- **D25 APPROVED:** this first slice explicitly excludes Health Score/Family Score formulas, AI generation, native HealthKit/Health Connect, push-provider activation, GoodBarber integration, assessment scoring, and broader Family Hub health sharing. See `docs/HOME_VNEXT.md`.


## 2026-09-27 — Progress vNext integration

- **D26 APPROVED:** the first Progress vNext slice enhances the existing member Progress experience with `my_goal_progress`, `my_achievements`, and `my_progress_insights`; it does not replace the v2 progress fallback.
- **D27 APPROVED:** Progress vNext must remain independently reversible behind `feature_member_progress_vnext`, default false, and its reads are nonfatal/post-first-paint.
- **D28 APPROVED:** goal progress may show deterministic completion/state only when supported by stored baseline/target/current data. Null progress must remain null/descriptive rather than invented.
- **D29 APPROVED:** progress insights remain descriptive only. Up/down/stable does not automatically mean better/worse, healthy/unhealthy, or medical improvement.
- **D30 APPROVED:** progress photos are excluded from the first Progress vNext slice. Raw private Storage paths must never be surfaced as usable public URLs. A later photo phase requires controlled private delivery/signing, access, upload and retention behavior.
- **D31 APPROVED:** Progress vNext explicitly excludes Health Score, Family Health Score, AI-generated medical interpretation, assessment scoring, cross-adult health sharing, native wearable work and GoodBarber integration. See `docs/PROGRESS_VNEXT.md`.


## 2026-09-27 — Coaching Hub vNext integration

- **D32 APPROVED:** Coaching Hub vNext enriches the existing member Coaching Hub with `my_coaching_momentum`; it does not create a second coaching dashboard.
- **D33 APPROVED:** allowed member-facing momentum data is limited to deterministic operational context: momentum state, 7-day plan completion/planned/full days, last check-in/progress timestamps, active goals and overdue goals.
- **D34 APPROVED:** coaching momentum is not a health score, diagnosis, motivation score, compliance judgment, or AI-generated conclusion.
- **D35 APPROVED:** Coaching Hub vNext is independently reversible behind `feature_member_coaching_vnext`, default false, and must load after first paint with local failure degradation. See `docs/COACHING_VNEXT.md`.


## 2026-09-27 - Family Hub vNext first slice

- **D36 APPROVED:** Family Hub vNext first slice is limited to the member-scoped `my_family_calendar_summary` 14-day shared schedule and enriches the existing Family Hub rather than creating a duplicate.
- **D37 APPROVED:** Family Hub vNext must not use `my_family_progress_dashboard`, `my_family_dashboard_summary_v2`, `my_family_wellness_summary`, family/member health scores, or raw adult health data in this slice.
- **D38 APPROVED:** the family schedule may show only non-health counts for coaching sessions, workouts, meals, goals due, and challenges ending.
- **D39 APPROVED:** Family Hub vNext is entitlement-gated, independently reversible behind `feature_member_family_vnext`, defaults false, and loads post-first-paint with local failure degradation. See `docs/FAMILY_VNEXT.md`.


## 2026-09-27 - Account Privacy Center vNext

- **D40 APPROVED:** first Privacy Center UI is embedded inside My Account and uses existing member-scoped privacy workflows rather than creating a parallel privacy system.
- **D41 APPROVED:** provider disconnect stops future sync and revokes current provider metric consent but does not represent deletion of stored history.
- **D42 APPROVED:** health-data deletion and account deletion remain review/approval workflows. The browser may submit requests but must not execute destructive deletion directly.
- **D43 APPROVED:** data-export request/status may be shown, but internal `available_storage_path` or other private Storage paths must not be surfaced as user download URLs. Controlled signed delivery is a later phase.
- **D44 APPROVED:** this first Privacy Center slice preserves the current backend active-member authorization boundary. Access for payment-suspended/onboarding/former members is a future explicit lifecycle decision, not a frontend bypass.
- **D45 APPROVED:** Privacy Center vNext is independently reversible behind `feature_member_privacy_center`, default false, and loads after first paint with local failure degradation. See `docs/PRIVACY_CENTER_VNEXT.md`.


## 2026-09-27 - Progress Photos vNext Phase 1

- **D46 APPROVED:** Progress Photos vNext Phase 1 is private viewing only. It uses existing member-scoped photo views and private `progress-photos` Storage with 5-minute signed URLs.
- **D47 APPROVED:** progress photo Storage paths must not be exposed as public URLs or visible member-facing paths. The bucket remains private and `getPublicUrl` is prohibited for this feature.
- **D48 APPROVED:** browser upload is deferred until an atomic or compensating Storage+database workflow is implemented and tested. Phase 1 must not create orphan-file risk.
- **D49 APPROVED:** Progress Photos Phase 1 is independently reversible behind `feature_member_progress_photos_vnext`, defaults false, loads post-first-paint, limits the first view to 12 recent photos, and degrades locally.
- **D50 APPROVED:** photo analysis, AI inference, health scoring, cross-adult sharing, and Family Hub photo sharing are out of scope. See `docs/PROGRESS_PHOTOS_VNEXT.md`.


## 2026-09-27 - My Calendar vNext

- **D51 APPROVED:** My Calendar vNext uses existing `my_calendar_feed_60d` and shows only the next 30 days inside the member dashboard.
- **D52 APPROVED:** first calendar slice exposes only item type, title, status, date/time, and safe location URL. Embedded metadata such as adherence, target values, points, or internal IDs is not member-facing in this slice.
- **D53 APPROVED:** client-side filters are All, Coaching, Workouts, Meals, Goals, and Challenges. Journey appointments and coaching sessions both map to Coaching.
- **D54 APPROVED:** Calendar vNext is independently reversible behind `feature_member_calendar_vnext`, defaults false, loads post-first-paint, is nonfatal/sequence-guarded, and is capped at 100 items. See `docs/CALENDAR_VNEXT.md`.


## 2026-09-27 - Notification Settings vNext

- **D55 APPROVED:** existing member notification settings are upgraded in place with quiet hours and time zone rather than creating a second reminder-settings surface.
- **D56 APPROVED:** member preference saves use `public.update_my_notification_preferences` instead of direct browser table upsert.
- **D57 APPROVED:** push toggles remain hidden until hosted push delivery is configured/tested and the authenticated preference update contract explicitly supports push fields.
- **D58 APPROVED:** when quiet hours are enabled, start/end and a valid IANA time zone are required. Browser-resolved time zone may be used as the member default. See `docs/NOTIFICATION_SETTINGS_VNEXT.md`.


## 2026-09-27 - Ask ReVitalized member feedback

- **D59 APPROVED:** answered/resolved Ask ReVitalized responses expose member Helpful / Needs Review feedback using the existing `submit_my_companion_feedback` RPC and `my_companion_feedback` view.
- **D60 APPROVED:** Needs Review uses the existing approved feedback reasons and optional comment, allowing the existing backend quality/human-review workflow to decide escalation.
- **D61 APPROVED:** member feedback does not change AI generation, medical safety classification, confidence thresholds, source governance, or coach authorization. It evaluates an answer after it has already reached answered/resolved state. See `docs/ASK_REVITALIZED_FEEDBACK.md`.


## 2026-09-27 - Health Trends vNext

- **D62 APPROVED:** Health Trends vNext enriches the existing Biometrics card with up to four 30-day descriptive sparklines using `my_health_dashboard_cards_30d` and `get_my_health_metric_trend`.
- **D63 APPROVED:** trend UI may display latest value, unit, absolute 30-day change and time-series shape, but must not characterize movement as good/bad, healthy/unhealthy, improving/worsening, diagnostic, or treatment-relevant.
- **D64 APPROVED:** Health Trends vNext requires Biometrics member access, is independently reversible behind `feature_member_health_trends_vnext`, defaults false, and loads post-first-paint with local failure degradation.
- **D65 APPROVED:** Health Score, Family Health Score, AI health interpretation, cross-adult health sharing, and provider/native connection activation remain outside this slice. See `docs/HEALTH_TRENDS_VNEXT.md`.


## 2026-09-27 - Progress Photo uploads

- **D66 APPROVED:** member Progress Photo uploads use a dedicated authenticated Edge Function rather than direct browser Storage/database mutation.
- **D67 APPROVED:** one submission creates one photo set and supports front, side, back and/or other angles; at least one valid image is required.
- **D68 APPROVED:** JPEG/PNG/WebP only, 15 MB maximum per image, with server-side magic-byte validation in addition to MIME validation.
- **D69 APPROVED:** if any upload/database step fails after a set is created, the function performs compensating cleanup by removing all newly uploaded Storage objects and deleting the new set/rows.
- **D70 APPROVED:** uploads are independently controlled by `feature_member_progress_photo_uploads`, default false. Private viewing may be enabled without enabling writes. See `docs/PROGRESS_PHOTOS_VNEXT.md`.


- **D71 APPROVED:** Progress Photo upload idempotency uses a client-generated UUID as the photo-set primary key. Retries with the same UUID return the completed existing set rather than creating duplicates; incomplete/conflicting reuse returns 409.


## 2026-09-27 - Notification routing vNext

- **D72 APPROVED:** web member notifications use `my_notification_routes.route_key` only as a controlled in-page navigation key. The browser must not follow arbitrary notification `resolved_link_url` values in this first slice.
- **D73 APPROVED:** only known existing dashboard sections may be opened from a notification. Unknown route keys remain non-navigable.
- **D74 APPROVED:** Notification Routing vNext is independently reversible behind `feature_member_notification_routing_vnext`, defaults false, loads after first paint, and preserves Read/Dismiss behavior if routing is unavailable.


- **D75 APPROVED:** ready Privacy Center data exports may be downloaded only through authenticated, 5-minute signed URLs from the private `privacy-exports` bucket. Raw `available_storage_path` values must remain internal and must never be rendered as member-facing links or text.


## 2026-09-27 - Member document upload hardening

- **D76 APPROVED:** member document uploads use a dedicated authenticated Edge Function rather than direct browser table + Storage mutation.
- **D77 APPROVED:** member upload categories remain limited to `general` and `progress`; file limit remains 25 MB and supported MIME/file signatures must be validated server-side.
- **D78 APPROVED:** member document upload retries use a client-generated UUID as the document primary key so successful retries are idempotent rather than duplicative.
- **D79 APPROVED:** partial upload failures must compensate by removing any newly uploaded Storage object and deleting the newly created document row. The browser must never leave archived placeholder rows as its normal rollback mechanism.


## 2026-09-27 - Lifecycle-safe member support

- **D80 APPROVED:** ReVitalized support uses the existing private messaging system with `member_conversations.conversation_type='support'`; no parallel ticket database is introduced.
- **D81 APPROVED:** authenticated support access is allowed for client-access states `ready`, `invited`, `onboarding`, `active`, and `payment_suspended`. Manual `suspended` and `inactive` states do not receive this in-app support channel by default.
- **D82 APPROVED:** support access is independent from `member_paid_access_allowed()`. It must not unlock coaching content, health data, community, courses, Family Hub, AI, or other paid benefits.
- **D83 APPROVED:** support is available from both Enrollment & Signature Center and the active member Messages area, backed by the same support conversation.
- **D84 APPROVED:** support-message retries use client-generated UUID message IDs, and support conversation creation uses a deterministic contact-scoped UUID to avoid duplicate support threads under concurrent requests.


## 2026-09-27 - Message attachment upload hardening

- **D85 APPROVED:** member message attachments use a dedicated authenticated Edge Function rather than direct browser Storage + attachment-row mutation.
- **D86 APPROVED:** attachments remain limited to the existing private-bucket policy: PDF, JPEG, PNG, WebP, MP3/MPEG, MP4/M4A audio and WAV, maximum 10 MB, with server-side file-signature validation.
- **D87 APPROVED:** the server verifies that the authenticated user owns the message and is an active participant in its conversation before accepting an attachment.
- **D88 APPROVED:** attachment uploads use client-generated UUID idempotency and compensating Storage cleanup if the database attachment record cannot be written.
- **D89 APPROVED:** the browser may retry a transient attachment failure once using the same attachment UUID, allowing a lost successful response to resolve as an idempotent replay instead of creating a duplicate.


## 2026-09-28 - Restricted Privacy Center lifecycle access

- **D90 APPROVED:** Privacy Center access is preserved for authenticated client-access states `ready`, `invited`, `onboarding`, `active`, and `payment_suspended`; this does not grant paid member access.
- **D91 APPROVED:** manually `suspended` and `inactive` accounts do not receive the restricted in-app Privacy Center by default.
- **D92 APPROVED:** Enrollment & Signature Center exposes privacy request submission, request history, ready export downloads, and read-only connected-provider context for eligible restricted states.
- **D93 APPROVED:** provider disconnect is intentionally omitted from the restricted Privacy Center until the health-connection write path is separately hardened for restricted lifecycle states.
- **D94 APPROVED:** ready privacy export downloads use authenticated 5-minute signed URLs from the private `privacy-exports` bucket. Raw Storage paths remain internal.


## 2026-09-28 - Health provider disconnect hardening

- **D95 APPROVED:** full-member provider disconnect uses a tightly scoped `SECURITY DEFINER` RPC rather than relying on broad client UPDATE policies.
- **D96 APPROVED:** `disconnect_my_health_provider` requires `private.full_member_access()`, resolves only the authenticated user's own active contact, clears only that user's provider credential/scopes, and revokes only that user's consents for the selected provider.
- **D97 APPROVED:** onboarding, payment-suspended, manually suspended, inactive, and unrelated users cannot use the full-member provider-disconnect RPC.
- **D98 APPROVED:** restricted Privacy Center continues to show provider context read-only and does not expose provider disconnect.


## 2026-09-28 - Idempotent member message sending

- **D99 APPROVED:** member text messages use a client-generated UUID as the message primary key so retries cannot silently create duplicate text messages.
- **D100 APPROVED:** a duplicate message UUID is treated as a successful replay only when the existing row matches the same authenticated sender, conversation, and exact body; otherwise the retry fails visibly.
- **D101 APPROVED:** optional message attachments preserve a separate pending attachment UUID across a failed/retried composition so the hardened attachment endpoint also resolves a lost response idempotently.
- **D102 APPROVED:** editing the message body after a failed attempt creates a new message request identity, and all pending identities clear only after full success or when the conversation modal closes.


## 2026-09-28 - Progress and weekly check-in retry safety

- **D103 APPROVED:** manual member progress entries use client-generated UUID row IDs and preserve the same ID/timestamp across retries of the same metric/value/note payload.
- **D104 APPROVED:** a duplicate progress UUID is accepted as a successful replay only when the existing row matches the same contact, metric, value, timestamp, source, creator, and note.
- **D105 APPROVED:** the existing weekly check-in unique index remains the semantic duplicate guard for one submitted check-in per contact/template/week.
- **D106 APPROVED:** a weekly check-in unique conflict is treated as a successful retry only when the already-submitted answers match the current answers after normalized key ordering; changed answers remain a visible conflict.
- **D107 APPROVED:** progress/check-in submit controls remain disabled while their writes are active, and pending progress retry state resets on a fresh dashboard load.


## 2026-09-28 - Idempotent goal and habit creation

- **D108 APPROVED:** new member goal/habit creation uses dedicated idempotent RPCs rather than changing the existing legacy RPC signatures.
- **D109 APPROVED:** `create_my_goal_idempotent` and `create_my_habit_idempotent` require full paid member access and use a client-generated UUID as the row primary key.
- **D110 APPROVED:** exact replay with the same request UUID and payload returns the existing row ID; reuse of the same UUID with different payload fails with an identity-conflict error.
- **D111 APPROVED:** the member goal/habit forms preserve request UUIDs across failed retries, generate a new UUID when the form payload changes, disable submit while active, and clear retry identity on success or modal close.
- **D112 APPROVED:** the legacy `create_my_goal` and `create_my_habit` RPCs remain unchanged for backward compatibility; the current member frontend moves to the idempotent RPCs.
