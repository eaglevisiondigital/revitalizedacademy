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

- Build: 319 public files, isolated beta configuration, synthetic payment mode, exact beta primary/fallback origins.
- Syntax: 80/80 JavaScript.
- Frontend: 544 passed, zero failed, 27 established skips (571 total). Includes normalization, single submission, no approval auto-invite, navigation without duplicate identities, cross-account reset/late-response suppression, every selected staff role/scope payload, and explicit onboarding gate explanations. Updated the old cache/copy snapshot assertions to the new acknowledged semantics.
- Native PostgreSQL 17.11: 268/268 backend checks. Includes exact recipient approval, Owner/Admin eligibility, contact binding, scope restrictions, RLS and ledger-derived access. No agreement-origin fixture failures in this current baseline.
- Deno Edge: 55/55. Unapproved recipients remain denied; static allowlist retained; separate client/staff registries and wrong-origin/project rejection preserved.
- Provider verification routing: isolated beta Supabase Auth verification first hop, then `https://beta.revitalizedacademy.com/portal/?setup=staff`. Raw tokens never printed, used or exposed.

## Release and remaining hosted acceptance

Pending beta deployment/live hash verification and read-only responsive checks. Fresh Justyn personal-Gmail member login requested separately. William's correct receiving address, actual delivery and setup/login remain unverified. Isabelle needs approved enrollment/program issuance before invitation acceptance can be tested. Do not claim full flow acceptance while these checks remain outstanding.

Production baseline: Netlify `6ac5fda10ae8b03a2ddf176e` ready. No production code, database, identity, health/private data, recipient permissions, secrets, payment settings or configuration changed.
