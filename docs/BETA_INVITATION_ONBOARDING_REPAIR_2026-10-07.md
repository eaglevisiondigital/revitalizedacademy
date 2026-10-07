# Beta invitation delivery and onboarding repair — 2026-10-07

## Verified root causes

- Client recipient approval is contact-bound permission to send; it does not issue an enrollment or mail. Isabelle's approved exact address has a contact but zero journeys, activations, agreements, access links and Auth identities. No provider request exists for that beta invitation. No duplicate enrollment or speculative program was created.
- Justyn's exact personal Gmail approval is active. The existing Holistic Foundations agreement was issued and its notification processed once: Resend `01a11473-779b-7b91-82d1-b0ef799b1cca` is delivered. Auth confirmation `01a11480-56fe-7969-943c-c759fb9f13d0` is delivered. Email verified and agreement signed. The first unmet gate was payment: no ledger entry, pending activation/membership/access, no payment URL. Approval or Add Person was not sufficient to complete enrollment.
- William's initial staff invitation to `williambk83@protonmail.com` passed recipient approval, created the separate Auth/staff invitation, reached Resend `01a11668-ca96-7595-8ae4-a93690a6aae8`, then bounced. The suppression is retained. After prior supported reconciliation, the same identity/invitation uses `williambk83@protonmail.me`. Two confirmation mails (`01a11686-616b-7585-be2a-f51ddfcebefd`, `01a11687-501a-73d7-b02d-33efede989d0`) are provider-accepted/sent, not delivered. The recipient must confirm the address and actual receipt; do not repeatedly resend or remove bounce protection.
- Drew's separate approved Coach/Assigned People invitation `01a11493-a013-76ab-ba8a-0b6bccce1caa` is delivered. His existing Auth email is verified and staff onboarding complete. Current authoritative role/scope remain Coach/Assigned People; no synthetic identity reused.
- The staff form omitted the selected `contact_scope` from its request. The server used its role default; this could differ from the Owner's selection. This frontend contract is repaired without changing existing staff grants.

## Narrow application repair

`portal-staff-access.js?v=186` preserves explicit invitation scope; approval reports **Recipient approved. No invitation has been sent yet.** Client approval exposes Open Client Enrollment for the existing contact. Staff approval exposes a prefilled invitation form and refuses to create a second account when a staff record already exists. Both actions clear across identity changes. Approval never creates accounts or sends mail.

Staff invitation/reconciliation acknowledgements distinguish request acceptance from delivery. The old UI described mail as sent when Supabase accepted the request; it had no provider-delivery confirmation. No evidence showed a client agreement UI claiming sent without a provider request.

`portal-action-center.js?v=134` explains the authorized synthetic beta payment step. `member/onboarding/onboarding.js?v=4` identifies missing/unsigned agreements, missing enrollment, unpaid beta gate, unavailable production payment link and pending activation. It preserves authoritative access gates and neutral restricted states.

No database migration, Edge deployment, role grant, mail-provider configuration or allowlist change was needed. Existing beta staff-management/password-reset v17 and notification-delivery v16 retained.

## Existing Justyn enrollment recovery

The already approved staging-only synthetic mechanism was used through `record_enrollment_payment`, with the verified active Owner actor, financial permission and contact scope checked by the RPC. Transaction first asserted the exact isolated beta runtime and the existing signed Holistic Foundations activation/contact. Ledger entry `59a7ce48-5830-43dc-b1d9-255305004758` records 8900 USD cents, provider `manual_staff`, reference `BETA-SYNTHETIC-ACCEPTANCE-20261007`, notes explicitly stating no real money received or card charge. It does not invoke any payment processor.

Existing activation `58e5f230-0521-44ea-8929-25b5205ee22f`, membership `bf14cf46-ae2c-4ca7-b1ad-8fddd93c780c`, contact `b06bc862-1e7b-489c-bad9-6da7f7321d6d` and Auth identity remain unchanged. Lifecycle triggers now return payment paid, agreement signed, activation active, membership active, client access active, no claim required. Under authenticated client context, `member_paid_access_allowed=true` and `my_onboarding_context` reports active/full_access=true, one enrollment and one signed agreement. This is server authorization evidence, not a substitute for fresh credential-based hosted login.

No program entitlement templates exist in this staging catalog, so no new membership entitlements were invented or granted. Existing explicitly approved membership overrides elsewhere are preserved. A broader Holistic Foundations feature entitlement policy requires approved program configuration if expected; it is not a payment-gate bypass.

The existing agreement invite was not regenerated. Four lifecycle notices remain queued without provider IDs (Complete your enrollment, Agreement completed, Your member access is ready, Welcome). Global outbox processing was not invoked because it could send unrelated mail. These queued follow-up notices must not be confused with the delivered agreement invitation.

## Validation

- Build: 318 public files, isolated beta configuration, synthetic payment mode, exact beta primary/fallback origins.
- Syntax: 80/80 JavaScript.
- Frontend: 544 passed, zero failed, 27 established skips (571 total). Includes normalization, single submission, no approval auto-invite, navigation without duplicate identities, cross-account reset/late-response suppression, every selected staff role/scope payload, and explicit onboarding gate explanations. Updated the old cache/copy snapshot assertions to the new acknowledged semantics.
- Native PostgreSQL 17.11: 268/268 backend checks. Includes exact recipient approval, Owner/Admin eligibility, contact binding, scope restrictions, RLS and ledger-derived access. No agreement-origin fixture failures in this current baseline.
- Deno Edge: 55/55. Unapproved recipients remain denied; static allowlist retained; separate client/staff registries and wrong-origin/project rejection preserved.
- Provider verification routing: isolated beta Supabase Auth verification first hop, then `https://beta.revitalizedacademy.com/portal/?setup=staff`. Raw tokens never printed, used or exposed.

## Release and remaining hosted acceptance

Application commit `6c5a31eac8415e81a4775eb2675830f045495aca` pushed on `codex/beta-invitation-onboarding-repair`. Existing beta Netlify site deployed as `6ac652f5ef350e486b80df26`, primary https://beta.revitalizedacademy.com. All three changed JavaScript assets, runtime configuration and environment helper return HTTP 200 and match the exact built SHA-256 hashes. No production deployment or branch merge. [Deploy receipt](../deployment-evidence/2026-10-07-beta-invitations/deploy.json) and [asset receipt](../deployment-evidence/2026-10-07-beta-invitations/live-assets.json).

Hosted Owner session restored normally after the release. Re-saving the same already-approved Justyn/Drew recipients records audit reasons only, leaves permission/identity scope unchanged and sends no new invitation. The exact acknowledgement and next actions render; client action opens the existing contact; Drew action detects the existing staff account and advises its setup action rather than creating a duplicate. Current Justyn drawer shows signed agreement, active membership/access and zero included features. Staff invite form preserves Administrator/Assigned People selection; it was closed without submission. Owner UI console has no warning/error. Approval forms and invitation modal have no page/form horizontal overflow at 1440×1000, 768×1024 and 390×844. Viewport restored.

Hosted exact recipient checkers accept normalized approved client/staff addresses, reject an unrelated unapproved test address and reject using a client approval for staff mail. Existing static allowlist and production mail configuration unchanged.

Fresh Justyn personal-Gmail member login remains unaccepted: last sign-in still predates this repair. William's .me email remains unverified with no login; correct receiving address, actual delivery and setup/login remain unverified. Isabelle needs approved enrollment/program issuance before invitation acceptance can be tested. No duplicate invitation, contact, agreement, membership or Auth identity was created. Justyn has exactly one contact, Auth user, agreement, membership and synthetic payment.

**BETA INVITATION + ONBOARDING FLOW BLOCKED — pending Justyn fresh member login, William delivery/setup, and approved enrollment issuance for the additional client.**

Production baseline: Netlify `6ac5fda10ae8b03a2ddf176e` ready. No production code, database, identity, health/private data, recipient permissions, secrets, payment settings or configuration changed.


## Exact next user actions

1. Justyn: sign in through https://beta.revitalizedacademy.com/member/ with `justynjamesoliver@gmail.com`. Confirm Dashboard opens. His existing agreement is signed and his synthetic gate is now satisfied; do not create another account or sign another agreement.
2. William: confirm whether `.me` is the real receiving address and whether the latest confirmation email arrived. If received, open it normally, follow staff setup, complete his own password/setup and sign in. Do not disclose links/passwords. If not received, resolve the exact receiving address before any resend; the original `.com` bounce/suppression is preserved.
3. Additional client Isabelle: an approved program/enrollment must be issued through the existing workflow; approval alone did not send mail. No program choice was invented.

## Chat decision needed: program entitlements

RECOMMENDED THINKING LEVEL: HIGH

CHAT DECISION NEEDED

ReVitalized Academy beta has an active Holistic Foundations catalog entry but zero program entitlement template rows. Justyn's personal-Gmail test enrollment now has a signed agreement and authorized synthetic ledger payment; membership and client access are active. His member authorization succeeds, but the staff drawer reports zero included features. Existing explicitly approved Client A feature overrides are preserved and have not been copied to this account.

Confirm whether Holistic Foundations beta should retain its current base dashboard access or receive a defined standard program entitlement set. Supply the exact approved entitlement keys/limits/cadences, including Nutrition, Fitness, tracking/coaching/family only where intended. A program-default change affects every membership on that program; a membership override affects only the specified test account and must be audited. Do not treat active payment/access as authority to enable unapproved modules. Engineering will use the supported program/entitlement workflow and preserve RLS, existing overrides and production isolation.

## Completion handoff

Completed: narrow beta UI/scope repair deployed; exact recipient and provider traces audited; Justyn's existing first unmet gate satisfied using the approved synthetic mechanism. Changed: portal staff-access/action-center, onboarding HTML/JS, focused regressions, state/evidence documentation. No new backend/config/schema package. Tested: 544 frontend pass/27 skips, 268 native backend pass, 55 Edge pass, 80 syntax pass; live hashes and read-only Owner responsive acceptance pass. Security: exact recipient controls, origin/project isolation, financial/contact checks, no arbitrary grants, no live charge, no duplicate identities, no token exposure. Unresolved: fresh Justyn login, William valid mailbox/delivery/setup and additional client's issued enrollment; absent program entitlements and queued follow-up notices disclosed. Next package: complete only these beta hosted acceptance checks after the necessary user/Chat decisions. Production remains on `6ac5fda10ae8b03a2ddf176e`, rechecked before and after beta release.
