# William + Isabelle beta acceptance — 2026-10-07

## Approved continuation

William's confirmed recipient is `williambk83@proton.me`. Normalize casing, preserve existing staff/Auth/invitation/role/scope, approve only that exact beta staff recipient, reconcile the pending email and reissue setup. Capitalization is not the root cause. Isabelle is approved for Holistic Foundations at $89/month using the existing beta synthetic ledger/access mechanism, no live charge. Justyn's existing member account must remain unchanged.

## Initial authoritative state

William's existing Auth `b2bdd784-6a9a-4cba-acff-1715f9269618` and staff invitation `60dc4291-a873-4915-a613-4a5b6d875a1b` still target `williambk83@protonmail.me`, a domain returning NXDOMAIN. Latest original provider email `01a11687-501a-73d7-b02d-33efede989d0` remains delivery_delayed. The earlier `.com` recipient bounced/suppressed. Confirmed `.proton.me` address had no conflicting Auth user and was not yet approved in the staff recipient registry at the initial checkpoint. Existing authoritative staff access is Administrator / assigned / active / onboarding pending; historical invitation role is Coach. Preserve both existing records without using email correction as a role change.

Between the previous report and this continuation, Isabelle's existing contact `a7f74069-c7d0-4119-b316-d13cbef74b11` was enrolled by the beta Owner. Existing activation `f457b617-3a08-455c-b8dc-1f4e6c206cea`, journey `c685347c-301f-49d8-8a1f-9f0ad9e2ce2c`, membership `74a4ed00-c48c-40ed-bc92-71807bad6987` and unsent MK8 agreement `eb6c6c71-5907-4855-8404-b5feccea7771` are retained. Program holistic-foundations, monthly, 8900 USD cents, catalog six-month commitment, configured deposit zero. Access is onboarding/unclaimed; no payment exists. Recipient approval is present. Do not create another enrollment or agreement.

## Observed narrow integration defect and repair

The enrollment Send Invitation entry tries to resend any existing unsigned contract, including the automatic `not_sent` draft with empty merge_values. The published MK8 template requires client/program/date/payment/approval fields; the hosted preparation RPC validates them before send. Two meaningful runtime regressions reproduced the faulty send selection. Unsent/unprepared/incomplete contracts now open the existing preparation form; only an already prepared contract with a rendered hash and all required fields can use resend. The existing preparation RPC upserts the same contact/template agreement. Contact ownership and financial permission checks remain.

Changed `portal-agreements.js`, its cache version to152, and focused runtime regressions. No SQL migration, Edge release, role/permission/feature/provider configuration change. Exact-built focused checks10/10; JS syntax81/81 and guarded staging build319 pass. Full frontend: 557 passed, 27 established skips, zero failures (584 total). SQL and Edge implementations did not change; the previous native PostgreSQL17 276 and Edge55 results were not rerun or claimed as fresh results.

## Hosted acceptance status

Normal beta Owner sign-in is required before the supported approval/correction/contract/payment UI actions. Password/account setup and agreement signing must be completed by each intended recipient through their own actual email. No credentials or raw setup tokens may be extracted to simulate acceptance. Provider delivery must remain distinct from actual receipt, setup and member dashboard acceptance.

Production baseline remains Netlify `6ac5fda10ae8b03a2ddf176e`; no production mutations are authorized for this continuation.

## Released package and hosted results

Application SHA `0c5ac4063d197aca35e238dc85ce1aa87e2f1b75`, pushed on `codex/beta-client-enrollment-repair`. Beta Netlify deploy `6ac6a15f82e024f3429710bf` is ready/current. Live Agreements JS152, Enrollment JS100, ActionCenter JS135, Portal CSS175, Member JS215/CSS204 and runtime configuration return HTTP200 and exact built SHA256 hashes. No new migration or Edge deployment.

The normal authenticated beta Owner saved the exact staff recipient approval for `williambk83@proton.me` with an audit reason, then used William's existing Update Email & Reissue Setup action. Existing Auth `b2bdd784-6a9a-4cba-acff-1715f9269618` and invitation `60dc4291-a873-4915-a613-4a5b6d875a1b` now both reference that normalized address. Exactly one matching Auth and invitation remain. Staff Administrator / Assigned People Only / active / pending onboarding are preserved, not changed to match the historical invitation's Coach role. An unrelated unapproved staff recipient still returns false; the static allowlist was not modified.

Provider message `01a117e9-5b43-7344-8d70-216f2e5d1377`, subject Confirm your email address, reports delivered at 2026-10-07 19:48:51UTC. The first-hop verification uses the beta Auth service and redirects to `https://beta.revitalizedacademy.com/portal/` with staff setup. No raw credential was exposed or consumed. Provider delivered is distinct from actual receipt, verification and login. Auth email verification and last sign-in remain absent at this checkpoint, so William's setup acceptance is pending his action.

For Isabelle, the supported Owner drawer shows the existing Holistic Foundations / monthly / 8900USD enrollment. Send Invitation opens the current published MK8 preparation modal. Enrollment defaults populate Isabelle Davies, Holistic Foundations, $89 monthly, six months, zero configured deposit, adjusted monthly $89 and Program: Holistic Foundations. No client signature or terms were invented. Assign Agreement prepares and sends the same agreement `eb6c6c71-5907-4855-8404-b5feccea7771`; it is now sent/prepared/unsigned. Provider message `01a117eb-c2be-727d-889c-906ad340ce6f`, subject Your ReVitalized Academy agreement is ready, reports delivered at 2026-10-07 19:51:29UTC. Its onboarding destination is beta-only, no production member link.

The Owner's Review Payment & Access opens the existing activation form. Its supported beta instruction explicitly requires the agreement to be signed before selecting Paid and saving the synthetic ledger payment. Therefore no payment was recorded prematurely, no signature/payment/access bypass was used, and no real charge occurred. Access remains onboarding/unclaimed, payment pending, no Auth created yet. One Isabelle contact, activation, membership and agreement remain. Justyn's existing activation stays signed/paid/active; no changes were made to his account.

Owner refresh restored the normal session. Hosted drawer controls fit at 1440x1000, 768x1024 and390x844: scrollWidth equals clientWidth and all four enrollment action buttons are within drawer bounds. No observed console warnings/errors. Viewport override reset. Recipient member/login/session acceptance is not substituted by these Owner checks.

Production Netlify remains `6ac5fda10ae8b03a2ddf176e`, ready/current. No production deployment, data, mail configuration, roles, flags, schema or provider settings changed.

## Exact remaining user actions and acceptance blocker

William must open the newest confirmation email at `williambk83@proton.me`, complete normal personal setup and sign in to beta. Isabelle must open the agreement email at `isabelle.carle@protonmail.com`, create/verify her own account, reopen the original invitation and review/sign herself. After authoritative signature verification, use the existing Owner beta synthetic-payment action, then verify her actual member dashboard, refresh and logout/relogin. No password or email link should be shared in chat.

Current status: **WILLIAM + ISABELLE BETA ACCEPTANCE BLOCKED — delivered invitations, awaiting recipient setup/signature and final hosted member acceptance.** This is not a delivery failure, nor a claim that the final beta gates passed.

Evidence: `deployment-evidence/2026-10-07-william-isabelle-beta/` in the parent workspace contains sent-status screenshots, deployment receipt, frontend log and live asset verification. Browser tab is retained for the next hosted continuation.
