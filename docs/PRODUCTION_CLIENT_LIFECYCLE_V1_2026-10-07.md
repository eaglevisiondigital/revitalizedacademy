# Production Client Lifecycle v1 — integrated candidate, NOT RELEASED

**PRODUCTION CLIENT LIFECYCLE BLOCKED.** Local frontend, database and Edge integration is implemented and tested. No push, migration application, Edge deployment, Netlify deployment, mail, hosted identity creation or hosted cleanup was performed. This is an engineering review candidate, not production acceptance.

## Current authoritative state

Isolated branch `codex/production-client-lifecycle-v1` in `revitalizedacademy-client-lifecycle`, based on accepted production source `862f4b6e2edb9b6af5332a389c0081fefec6adae`, resumes database draft `2dff74fe5b51fc1980960a36dbee54efb31677cc`. The final local commit printed in the handoff identifies the exact reviewed source; no remote release commit exists for this package yet.

Production remains Netlify `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`, deploy `6ac6b471ac8ed68bec8bd8d6`, Supabase `voalfpxiyznnqfcqcymd`, latest ledger `20261007221345`. Read-only recheck found zero client memberships/access/agreements/payment records and no candidate client-creation API. Beta remains site `071b252e-a922-4846-a784-8dca1edad377`, deploy `6ac6b620e735903c2285ec3f`, project `bvooallokgfktssadsrv`. Neither environment was modified.

Production publishes MK7, with **no required active Holistic Foundations agreement mapping**. Beta has the approved MK8 program-name revision. This candidate neither publishes a legal revision nor invents a mapping. There are eleven current active production Holistic Foundations defaults; the unapplied candidate retains exactly the six user-approved defaults, deactivating the other five.

## Module status

| Module | Production status | Candidate / remaining gate |
| --- | --- | --- |
| Client creation | NOT RELEASED | Atomic normalized/idempotent Owner/Admin Add Client form and API; original source attribution preserved. Hosted creation pending. |
| Enrollment | NOT RELEASED | Visible client-drawer Start Enrollment / Choose Program, authenticated atomic save, clear status and next action. |
| Holistic Foundations billing | NOT RELEASED | $89/month or $960 pay in full; explicit USD/CAD selection, six-month enrollment; no payment processing. Future custom/installment schema retained without exposing unaccepted choices. |
| Agreements | BLOCKED | Mapped published contract only; immutable hash, verified self-signature, idempotence, service-only delivery lease. Production legal revision/mapping decision, pay-in-full wording and genuine hosted signature acceptance pending. |
| Account setup | NOT RELEASED | Normal verified-email signup; separate confirmation screen, normal login, invitation reopen and claim. No privileged account creation or auto-verification. |
| Password recovery | NOT RELEASED | Branded neutral request confirmation and isolated one-time recovery exchange/password form. Actual receipt/open/reset acceptance pending. |
| Member access gate | NOT RELEASED | Clear Agreement/Payment Required/Awaiting Payment; full access false; no synthetic/waived/zero-price/payment-URL/ledger bypass. |
| Member Dashboard | BETA ONLY | Compact pre-payment account/agreement center is prepared. Full paid dashboard not promoted. |
| Nutrition | BETA ONLY for members | Existing production food/recipe authoring remains accepted. Client paid workspace remains held. |
| Workouts | BETA ONLY for members | Existing production exercise/workout/program authoring remains accepted. Client paid workspace remains held. |
| Health & Progress | BETA ONLY | Configurable/private member workspace not promoted. |
| Meal assignment | BETA ONLY | No assignment UI release or production client assignment writes. |
| Fitness assignment | BETA ONLY | No assignment UI release or production client assignment writes. |
| Coach scope | LOCAL SECURITY PASS; HOSTED PENDING | Existing assigned-contact/private-health gates tested; no role grants. Lifecycle creation/enrollment/preparation remains Owner/Admin. |
| Payment integration | SEPARATE RELEASE / BLOCKED | No real or synthetic production payment. Authorize.Net Payments v1 requires its own approval/acceptance. |

Approved defaults prepared in the migration: `platform_access`, `nutrition_plans`, `fitness_plans`, `tracking`, `biometrics`, `habit_builder`. These are pending membership template configuration, not paid-access grants. Messaging/resources/basic check-in workflows are not rewritten or promoted by this package.

## Implemented changes

- Updated **unapplied** migration `20261007224150_production_client_lifecycle_v1.sql`. This is still the original draft filename, not a replay of any applied migration. One atomic transaction with function-body validation enabled; signing wrapper defined after its implementation.
- Production-only normalized client creation and duplicate prevention, attribution retention, HF billing intent and enrollment foundation. No beta recipient approval restrictions or operational records copied.
- Existing deferred household membership trigger exposed a genuine COMMIT failure: after a definer enrollment API returned, the authenticated transaction could not call the private validator. The same existing trigger now runs as a narrowly scoped definer with fixed `pg_catalog` search path and qualified validator call. Private helper execution remains revoked to browser/service roles; no household validity rule relaxed.
- Private agreement mail jobs hidden from browser roles. Service-only Owner/Admin/contact-scoped claim/finish APIs, one-minute lease, bounded attempts, provider idempotency and secret-body redaction. Legacy notification dispatcher excludes client/signer invitation jobs to prevent competing dispatch.
- Staff `portal-client-lifecycle.js/css`, Add Client and drawer Program & Next Steps. Existing agreement module uses mapped templates, current enrollment values, one-request submission, contact/user/modal epochs and cleared private fields. The program-name merge control supports a subsequently approved MK8 mapping. A pay-in-full total is **never autofilled as a monthly fee**; approved pay-in-full contract terms remain a legal/product gate.
- Replaced unused production member entry with compact pre-payment onboarding; legacy activation entry redirects to this same verified flow. No full beta member bundle/assignments/configurable health UI promoted.
- Normal email verification/signup, neutral signup confirmation, neutral recovery request confirmation, one-adult current-hash signing, immediate logout/private DOM clearing and delayed prior-account response guards.
- Isolated member password reset uses memory-only recovery Auth, credential URL removal, one exchange despite repeated Auth callbacks, duplicate-submit guard and local recovery-session signout. Passwords/tokens are not logged.
- Prepared five production Edge entrypoints: `member-account`, `agreement-sign`, `notification-delivery`, `client-lifecycle-delivery`, `member-password-reset`. Old production member-account auto-verified privileged account creation and old agreement-sign service upsert paths were identified and replaced in the candidate with authenticated caller-scoped database contracts. No hosted Edge was redeployed.

## Validation evidence

See `docs/deployment-evidence/2026-10-07-production-client-lifecycle/`.

- Native **PostgreSQL 17.11** disposable schema restore: **112/112** maintained database checks, plus **1/1** concurrency test covering four true race groups. Eight independent sessions, distinct backend IDs and server barrier establish actual overlap: one contact, one enrollment, one immutable signature and one delivery lease. All disposable local databases dropped.
- Existing durable-content/Vitality/resume/USDA/RepDB database regressions pass. Role, contact scope, unverified/wrong-account/anonymous/member denial, browser signature forgery, exact hash, signed immutability, pending access, six defaults, strict prices and payment bypass denial covered. Do not equate native fixture results with live GoTrue/PostgREST acceptance.
- Maintained frontend suites and final focused lifecycle regressions: **121/121 pass, zero skipped**, including **14 lifecycle checks**; final output in `frontend-tests.txt`; no skipped failure used to claim acceptance. Focused tests exercise actual portal core account clearing, actual agreement module delayed prefill/submit, current member signup/reset/signing and stale responses.
- Edge: **35/35** tests pass, including retained Vitality tests. Five lifecycle Edge entrypoints type-check with pinned Supabase SDK 2.57.4.
- Public build: **389 files**, production project/origin validated. New browser assets explicitly allowlisted; database/Edge server source and private datasets excluded.
- JavaScript syntax: **111/111** files; inline reset behavior additionally executed by maintained tests.
- Exact-built isolated browser: **34 checks**, no page errors. Add Client, conditional referral fields, enrollment, actual agreement form, pre-payment member center and private field clearing tested at **1440×1000, 768×1024, 390×844**; no page/dialog/card overflow. All browser external requests blocked; this is not hosted device acceptance.
- `git diff --check` passes.

No production/staging test content, identities, measurements, payment state, invitations or mail were created. No hosted cleanup was needed. No beta private data was copied. Current public assessment/content/sync deploy and migration ledger remain unchanged.

## Required Primary Chat decision

**RECOMMENDED THINKING LEVEL: HIGH — CHAT DECISION NEEDED**

> Project: ReVitalized Academy — Production Client Lifecycle v1. The local engineering candidate is tested; production release is blocked by the approved legal document/mapping. Production has published MK7 and no required Holistic Foundations mapping. Beta has approved MK8 with actual enrolled-program wording. Confirm which exact published revision to use for new production HF enrollments: adopt MK8 while retaining MK7 history, retain MK7 with explicit approved program-level mapping, or hold for review. Recommendation: adopt the existing approved MK8 program-name revision if approved for production. Do not alter old issued documents.
>
> Also confirm approved contract presentation for both $89/month and $960 pay in full. Existing contract merge fields contain monthly fee/adjusted monthly payment; $960 must not be represented as a monthly fee. Confirm deposit/Appendix A/commitment/currency and any separate pay-in-full clause required, without guessing new legal terms. The enrollment UI saves explicit currency and amount; no charge or paid access occurs.
>
> Confirm whether `rva-client@eaglevision.biz` and `dfowler4232@gmail.com` are approved controlled receiving inboxes for two fresh disposable **production** acceptance identities, or provide alternatives. Their previous staging use does not itself authorize new production identities. The recipient must open verification/recovery emails and sign their own disposable agreement normally.
>
> Payment integration and full paid member/assignment modules remain held for separate accepted Payments v1. No synthetic production payment or access bypass is proposed.

These questions were presented during implementation and remain unanswered. Elapsed time is not approval.

## Release and hosted acceptance plan — NOT AUTHORIZED/APPLIED YET

1. Resolve the production template/terms decision; add only its approved forward template/mapping changes, preserving history. Validate actual mapped $89/month and $960 terms and signing security locally. Finalize and report a complete exact release SHA and migration/Edge manifest.
2. Obtain explicit approval for that final exact candidate's GitHub push, production migration(s), the five required production Edges and production Netlify deploy. Do not approve/deploy this intermediate checkpoint as if legal and hosted gates had passed. Targets: production Supabase `voalfpxiyznnqfcqcymd`, Netlify `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`; do not change beta.
3. Recheck ledger and hosted drift; apply each previously unapplied approved migration once. Confirm production Auth redirect allowlist, branded verification template/provider and normal setup/recovery path before issuing mail; no SMTP/secret/role configuration changes without concrete scope and approval.
4. Deploy coordinated Edges/frontend from the approved candidate; verify exact public hashes, production-only origin and no server secret disclosure. Read-only regression for Owner/staff/current content/Vitality/sync.
5. With separately approved disposable inboxes, use normal Owner UI to create/normalize/retry client, save HF billing intent, prepare/send approved agreement. Verify actual external receipt, normal verification/password/login/invitation reopen/self-signature, immutable duplicate retry and no wrong-account signing. Use two distinct identities for cross-client/private DOM boundary acceptance. Owner and assigned/unassigned Coach checks must preserve independent private-health permission.
6. Verify Payment Required/Awaiting Payment and full paid access denial; no synthetic ledger/activation or assignment acceptance fabricated. Verify actual recovery receipt/open/password change, refresh/logout/relogin, responsive hosted layouts and no stale account state.
7. Document/cancel disposable mail/jobs where safe; remove only bounded disposable production artifacts/identities through supported privileged cleanup, preserving necessary immutable signature/audit evidence. Obtain legal retention disposition if signed acceptance cannot safely be deleted; never claim immutable audit evidence erased. Report exact cleanup/retained audit IDs. Leave unrelated production state unchanged.

## URLs

Current accepted Owner portal: `https://revitalizedacademy.com/portal/`.
Proposed normal member entry: `https://revitalizedacademy.com/member/`.
Proposed agreement/account center: `https://revitalizedacademy.com/member/onboarding/`.
Proposed emailed recovery landing: `https://revitalizedacademy.com/member/password-reset.html` (requires the recipient's valid private recovery credential).

The proposed new client pages/behavior are **not deployed**. Do not direct real clients to this candidate yet. Existing production deploy remains `6ac6b471ac8ed68bec8bd8d6`.
