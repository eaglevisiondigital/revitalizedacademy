# Beta Client Activation + Invitation + Enrollment repair — 2026-10-07

## Findings

**Justyn:** `justynjamesoliver@gmail.com` retains Auth `fc425e7b-0ae3-46d0-a3ba-53b888582bc5`, contact `b06bc862-1e7b-489c-bad9-6da7f7321d6d`, activation `58e5f230-0521-44ea-8929-25b5205ee22f`, membership `bf14cf46-ae2c-4ca7-b1ad-8fddd93c780c`, and the existing signed agreement/synthetic ledger payment. Access/membership are active, account claimed, paid RPC true, enrollment gates true. Auth last sign-in observed at 2026-10-07 15:17:04 UTC. His exact bootstrap renders in an isolated runtime with no error. No hosted failure was reproduced yet: the current browser has an Owner session, not his member session. The original frontend catch conflated any critical read/render failure with inactive access; that real message defect is repaired with a retryable load state and safe error-code diagnostic. A fresh hosted login is still needed to identify the reported denial’s actual failing request. Zero program entitlement templates/rows remain unchanged; they do not prevent the base dashboard in the runtime tests.

**William:** existing staff Auth `b2bdd784-6a9a-4cba-acff-1715f9269618`, invitation `60dc4291-a873-4915-a613-4a5b6d875a1b`, Administrator/assigned scope and pending setup are preserved. He is currently a staff invite, not a client enrollment. Original `williambk83@protonmail.com` bounced and was suppressed. Current `williambk83@protonmail.me` message `01a11687-501a-73d7-b02d-33efede989d0` is delivery_delayed. DNS at 15:43 UTC returns NXDOMAIN for protonmail.me, while proton.me/protonmail.com have Proton MX records. [Official Proton domains](https://proton.me/support/addresses-and-aliases) excludes protonmail.me. No domain/address was guessed and no resend/suppression removal was performed. Existing setup redirect was verified beta-only; raw credentials were not exposed or consumed.

**Isabelle:** existing `isabelle.carle@protonmail.com`, contact `a7f74069-c7d0-4119-b316-d13cbef74b11`, is approved in the beta recipient registry. No journey/activation/agreement/Auth identity or provider request exists. Approval did not send mail. Existing controls were gated behind payment_agreement/backend_activation current journey steps; no-journey contacts had no usable start/program action. The new drawer hub corrects that dead end.

## Changes

- `portal-enrollment.js` and allowlisted drawer markup: visible program chooser, Save Enrollment, Send Invitation, Review Payment & Access, lifecycle summary and exact next action.
- `20261007154421_beta_client_enrollment_controls.sql`: beta-only scoped summary and atomic, audited enrollment save. Contact lock/idempotence; existing journey reuse; issued terms lock; no gate bypass or mail creation.
- `portal-action-center.js`: payment review can target the existing payment step without advancing the active assessment.
- `portal-agreements.js`: existing contract flow/resend reused and contact-bound; configured activation supplies program/terms before a member exists.
- `member110.js` / HTML: critical loading failure is distinct from inactive access; Retry Dashboard rechecks authoritative access. False paid access still denies before private reads.
- Meaningful DOM/race, database authorization/idempotence and action-routing regressions. Nutrition test cache assertion aligned with member v215.

## Validation

319-file staging build; 81 JS syntax checks. Maintained frontend 553 passed/27 skipped, plus two focused action-routing cases passed. Full native PostgreSQL 17 backend 276 passed; final focused enrollment 8/8 passed. Edge 55/55 passed. Exact-built enrollment DOM tests 6/6. Existing 52 Health/Progress cases passed. No hosted identity, payment, role, flag, mail configuration or health data changed in this package.

Beta migration applied once under MCP ledger 20261007154421; CLI-created local candidate was aligned to that authoritative ledger before commit. No prior migration replay. No production migration/deploy/config mutation.

## Remaining hosted acceptance

Justyn must sign in normally in the test browser; prove dashboard/refresh/logout/relogin and capture any load diagnostic. Confirm William’s exact working recipient before using supported pending-email reconciliation and resend; provider delivery and actual setup remain unaccepted. Owner must select Isabelle’s program/terms before hosted enrollment and invitation issuance. Do not label any of these complete from local fixtures.

Release SHA/deploy and hosted UI evidence to follow.
