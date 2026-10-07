# Beta Client Activation + Invitation + Enrollment repair — 2026-10-07

## Findings

**Justyn:** `justynjamesoliver@gmail.com` retains Auth `fc425e7b-0ae3-46d0-a3ba-53b888582bc5`, contact `b06bc862-1e7b-489c-bad9-6da7f7321d6d`, activation `58e5f230-0521-44ea-8929-25b5205ee22f`, membership `bf14cf46-ae2c-4ca7-b1ad-8fddd93c780c`, and the existing signed agreement/synthetic ledger payment. Access/membership are active, account claimed, paid RPC true, enrollment gates true. Auth last sign-in observed at 2026-10-07 15:17:04 UTC. His exact bootstrap renders in an isolated runtime with no error. No hosted failure was reproduced yet: the current browser has an Owner session, not his member session. The original frontend catch conflated any critical read/render failure with inactive access; that real message defect is repaired with a retryable load state and safe error-code diagnostic. A fresh hosted login is still needed to identify the reported denial’s actual failing request. Zero program entitlement templates/rows remain unchanged; they do not prevent the base dashboard in the runtime tests.

**William:** existing staff Auth `b2bdd784-6a9a-4cba-acff-1715f9269618`, invitation `60dc4291-a873-4915-a613-4a5b6d875a1b`, Administrator/assigned scope and pending setup are preserved. He is currently a staff invite, not a client enrollment. Original `williambk83@protonmail.com` bounced and was suppressed. Current `williambk83@protonmail.me` message `01a11687-501a-73d7-b02d-33efede989d0` is delivery_delayed. DNS at 15:43 UTC returns NXDOMAIN for protonmail.me, while proton.me/protonmail.com have Proton MX records. [Official Proton domains](https://proton.me/support/addresses-and-aliases) excludes protonmail.me. No domain/address was guessed and no resend/suppression removal was performed. Existing setup redirect was verified beta-only; raw credentials were not exposed or consumed.

**Isabelle:** existing `isabelle.carle@protonmail.com`, contact `a7f74069-c7d0-4119-b316-d13cbef74b11`, is approved in the beta recipient registry. No journey/activation/agreement/Auth identity or provider request exists. Approval did not send mail. Existing controls were gated behind payment_agreement/backend_activation current journey steps; no-journey contacts had no usable start/program action. The new drawer hub corrects that dead end.

## Changes

- `portal-enrollment.js`, allowlisted drawer markup and scoped `portal.css` v175: visible program chooser, Save Enrollment, Send Invitation, Review Payment & Access, lifecycle summary and exact next action; wrapped action labels stay within the drawer.
- `20261007154421_beta_client_enrollment_controls.sql`: beta-only scoped summary and atomic, audited enrollment save. Contact lock/idempotence; existing journey reuse; issued terms lock; no gate bypass or mail creation.
- `portal-action-center.js`: payment review can target the existing payment step without advancing the active assessment.
- `portal-agreements.js`: existing contract flow/resend reused and contact-bound; configured activation supplies program/terms before a member exists.
- `member110.js` / HTML: critical loading failure is distinct from inactive access; Retry Dashboard rechecks authoritative access. False paid access still denies before private reads.
- Meaningful DOM/race, database authorization/idempotence and action-routing regressions. Nutrition test cache assertion aligned with member v215.

## Validation

319-file staging build; 81 JS syntax checks. Final maintained frontend 555 passed/27 skipped. Full native PostgreSQL 17 backend 276 passed; final focused enrollment 8/8 passed. Edge 55/55 passed. Exact-built enrollment DOM tests 6/6. Existing 52 Health/Progress cases passed. No hosted identity, payment, role, flag, mail configuration or health data changed in this package.

Beta migration applied once under MCP ledger 20261007154421; CLI-created local candidate was aligned to that authoritative ledger before commit. No prior migration replay. No production migration/deploy/config mutation.

## Remaining hosted acceptance

Justyn must sign in normally in the test browser; prove dashboard/refresh/logout/relogin and capture any load diagnostic. Confirm William’s exact working recipient before using supported pending-email reconciliation and resend; provider delivery and actual setup remain unaccepted. Owner must select Isabelle’s program/terms before hosted enrollment and invitation issuance. Do not label any of these complete from local fixtures.

## Released package and hosted evidence

Application SHA `3ffe71c190604360c078647a0f2427382caba4a3` is pushed on isolated branch `codex/beta-client-enrollment-repair`; no merge/main/staging branch overwrite. Netlify beta site `071b252e-a922-4846-a784-8dca1edad377` is serving deploy `6ac66d487372c39f5f36ab19` at https://beta.revitalizedacademy.com. This primary-site deployment is on the beta site only. A future Git-triggered beta build can supersede the manual release; no deploy lock or Git configuration was changed.

Exact live/built SHA-256 matches:

| Asset | Version | SHA-256 |
| --- | --- | --- |
| portal.css | 175 | f49030c87aabe693488a5eef20dc38342d0e3275dc9685b92a1530fe3b89026a |
| portal-enrollment.js | 100 | 32b81cb890dd123bd74a82d9643862f7c2e0efa7ef3df4e13f4fc18a4db2955e |
| portal-action-center.js | 135 | 44e21fb3e5ccea9c320a1a2ddfbfa51a40ed2c5e828464ee5569000c550c28d8 |
| portal-agreements.js | 151 | 6159eb4b4c2afc94a09845219d3f7fd3f7cfe2c3b97bb3cdd856a7a49e46c7ad |
| member110.js | 215 | 7104faf6d2491a55420825f24a3303a458ae188cccf3b3c0978f8dbfdc96429b |
| member110.css | 204 | c00ebb070ae91666069c2a73a8f3b7662c3f239435fa84ebf87e22fdda209572 |

All return HTTP200; beta runtime configuration also matches the guarded build exactly. Production control plane still reports deploy `6ac5fda10ae8b03a2ddf176e`; no production release/configuration/database mutation was performed.

Normal hosted Owner acceptance: Isabelle's drawer shows approval, no enrollment/program, not-sent invitation and exact next action. Start Enrollment opens the active existing catalog plus billing/amount/currency; no program or billing is preselected. Send Invitation and payment review remain disabled until enrollment is configured. Initial hosted page/drawer widths matched the three viewports, but screenshot inspection revealed action-label overlap. Replaced generic Journey action classes with dedicated wrapping enrollment styles, styled Save consistently, and cache-busted portal.css to v175. Final exact-built isolated browser acceptance at 1440×1000, 768×1024 and 390×844 confirms all nine controls inside page/drawer boundaries, no internal overflow and every button label contained. Screenshots `enrollment-layout-fixed-desktop.jpg` and `enrollment-layout-fixed-mobile.jpg` explicitly identify the isolated fixture. The original hosted screenshot is retained as defect evidence; a fresh Owner hosted check of final styling remains pending after normal reauthentication.

Justyn's Owner-visible summary shows existing Holistic Foundations, signed agreement, paid ledger, active access. Review Payment & Access opens the existing payment/agreement activation panel without changing the current assessment step or submitting anything. Console warnings/errors: zero observed during these checks. Owner sign-out followed by navigation displays the normal member login, now prepared for Justyn's own password entry. This does not prove Justyn's fresh member session; actual dashboard/refresh/logout/relogin remain pending.

Post-release preservation: Justyn Auth/contact/activation/agreement/payment/membership counts each remain one. William retains the existing Auth identity. Isabelle has zero activation/agreement/Auth records, as before. No acceptance mail was sent, no arbitrary recipient allowed, and no hosted identity/enrollment/payment/role/permission/flag/content data changed. Only the beta function migration and frontend/functions build release were applied.

## Exact next user actions / Primary Chat handoff

- Justyn: sign in at https://beta.revitalizedacademy.com/member/ as `justynjamesoliver@gmail.com` using his existing password. Then verify dashboard, refresh, sign out and sign back in. If denied, report the exact new message; do not recreate his identity or synthetic payment. His reported failure's actual root cause is not yet proven, although the misleading inactive-access error handling is repaired.
- William: confirm the exact working receiving email. Current `williambk83@protonmail.me` cannot receive mail; original `.com` bounced. Once confirmed, reconcile/reissue the existing staff setup invitation through the supported audited beta approval workflow, retaining the same identity/role/scope. No guessed address, suppression removal or resend was performed.
- Isabelle: Owner opens People → Isabelle Davies → Start Enrollment / Choose Program, selects the existing approved program and agreed billing/amount/currency, then Save Enrollment → Send Invitation. The latter opens the existing agreement preparation workflow. Program/financial terms must be supplied before hosted save/issuance; no manual database step is required.

**BETA CLIENT ENROLLMENT FLOW BLOCKED** — pending fresh Justyn hosted session, William's confirmed deliverable address/setup, and Isabelle's program/terms/save/send acceptance. Production remains unchanged. Do not interpret local fixtures or provider request acceptance as external receipt or completed user setup. Do not begin unrelated work.

## Chat decision needed — Isabelle

RECOMMENDED THINKING LEVEL: MEDIUM

Confirm the existing beta program, billing choice, agreed amount and currency for Isabelle Davies (`isabelle.carle@protonmail.com`). The new supported Owner drawer flow is deployed, but she has no enrollment or invitation. Available active programs include Holistic Foundations, Vitality Accelerator, Vitality Accelerator Cohort, 6-Month Intensive and 12-Month Intensive. Choose approved terms; do not invent a new program or waive agreement/payment gates. Save configures the existing contact only; Send Invitation then uses the published contract workflow. These beta terms do not enable real charges or affect production.
