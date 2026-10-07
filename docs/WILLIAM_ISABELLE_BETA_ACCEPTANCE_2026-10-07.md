# William + Isabelle beta acceptance — 2026-10-07

## Approved continuation

William's confirmed recipient is `williambk83@proton.me`. Normalize casing, preserve existing staff/Auth/invitation/role/scope, approve only that exact beta staff recipient, reconcile the pending email and reissue setup. Capitalization is not the root cause. Isabelle is approved for Holistic Foundations at $89/month using the existing beta synthetic ledger/access mechanism, no live charge. Justyn's existing member account must remain unchanged.

## Initial authoritative state

William's existing Auth `b2bdd784-6a9a-4cba-acff-1715f9269618` and staff invitation `60dc4291-a873-4915-a613-4a5b6d875a1b` still target `williambk83@protonmail.me`, a domain returning NXDOMAIN. Latest original provider email `01a11687-501a-73d7-b02d-33efede989d0` remains delivery_delayed. The earlier `.com` recipient bounced/suppressed. Confirmed `.proton.me` address has no conflicting Auth user and is not yet approved in the staff recipient registry. Existing authoritative staff access is Administrator / assigned / active / onboarding pending; historical invitation role is Coach. Preserve both existing records without using email correction as a role change.

Between the previous report and this continuation, Isabelle's existing contact `a7f74069-c7d0-4119-b316-d13cbef74b11` was enrolled by the beta Owner. Existing activation `f457b617-3a08-455c-b8dc-1f4e6c206cea`, journey `c685347c-301f-49d8-8a1f-9f0ad9e2ce2c`, membership `74a4ed00-c48c-40ed-bc92-71807bad6987` and unsent MK8 agreement `eb6c6c71-5907-4855-8404-b5feccea7771` are retained. Program holistic-foundations, monthly, 8900 USD cents, catalog six-month commitment, configured deposit zero. Access is onboarding/unclaimed; no payment exists. Recipient approval is present. Do not create another enrollment or agreement.

## Observed narrow integration defect and repair

The enrollment Send Invitation entry tries to resend any existing unsigned contract, including the automatic `not_sent` draft with empty merge_values. The published MK8 template requires client/program/date/payment/approval fields; the hosted preparation RPC validates them before send. Two meaningful runtime regressions reproduced the faulty send selection. Unsent/unprepared/incomplete contracts now open the existing preparation form; only an already prepared contract with a rendered hash and all required fields can use resend. The existing preparation RPC upserts the same contact/template agreement. Contact ownership and financial permission checks remain.

Changed `portal-agreements.js`, its cache version to152, and focused runtime regressions. No SQL migration, Edge release, role/permission/feature/provider configuration change. Exact-built focused checks10/10; JS syntax81/81 and guarded staging build319 pass. Full frontend and beta release evidence to follow.

## Hosted acceptance status

Normal beta Owner sign-in is required before the supported approval/correction/contract/payment UI actions. Password/account setup and agreement signing must be completed by each intended recipient through their own actual email. No credentials or raw setup tokens may be extracted to simulate acceptance. Provider delivery must remain distinct from actual receipt, setup and member dashboard acceptance.

Production baseline remains Netlify `6ac5fda10ae8b03a2ddf176e`; no production mutations are authorized for this continuation.
