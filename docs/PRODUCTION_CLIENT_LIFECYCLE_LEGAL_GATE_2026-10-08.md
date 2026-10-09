# Production Client Lifecycle legal gate — 2026-10-08

Status: technically finalized locally; not pushed, migrated, deployed, published, mapped, emailed, or used to create hosted records.

## Approved business terms preserved

- Holistic Foundations Monthly: CAD $89 per month, six-month minimum term, no automatic renewal.
- Holistic Foundations Pay in Full: CAD $960, 12-month paid term, no automatic renewal.
- Seven-calendar-day failed-payment grace period.
- Cancellation notice through either the portal or written email.
- Final-sale/non-refundable business rule after access, subject to applicable non-waivable law.

The exact proposed contract text remains in [PRODUCTION_CONTRACT_RECOMMENDATION_2026-10-08.md](PRODUCTION_CONTRACT_RECOMMENDATION_2026-10-08.md). Business approval does not resolve the Québec classification, installment-payment, cancellation, or refund requirements. The text remains unpublished.

## Technical boundary now enforced

The pending migration `20261007224150_production_client_lifecycle_v1.sql` now installs a fail-closed `production_client_agreement_publication` runtime gate with status `held` and reason `quebec_regulatory_classification_pending`.

While held:

- an Owner/Admin may create or reuse a contact and save a Holistic Foundations billing intent;
- only CAD $89/month with six commitment months or CAD $960 one-time with 12 commitment months is accepted;
- no new production client contract can transition to `published`;
- no active required Holistic Foundations agreement mapping can be inserted or activated;
- agreement preparation, issuance, invitation, and delivery remain unavailable;
- payment recording, paid status, payment URLs, and full member access remain separately held by the existing Payments v1 gate.

Agreement requirements now carry `billing_choice` and `currency`. Issuance, backfill, agreement-state reconciliation, agreement selection, and enrollment gates match the enrollment's program, billing choice, and currency. A monthly contract cannot satisfy or appear for a pay-in-full enrollment, and a missing Holistic Foundations mapping cannot fall back to a legacy agreement.

The Owner UI fixes the approved currency to CAD, labels the six- and 12-month terms, shows the legal hold, and disables Prepare / Send Agreement while the mapping is unavailable. The generic agreement editor also refuses to publish a Holistic Foundations contract while the hold remains.

## Exact held publication/mapping step

After qualified Canadian/Québec legal review resolves the classification and payment issue, create one separately reviewed forward migration. In one transaction it must:

1. verify the lifecycle migration is present and the legal gate is still `held`;
2. insert the final revised MK8 monthly text as a new immutable agreement version in `draft` status;
3. insert the separate final 12-month pay-in-full text as a different immutable agreement version in `draft` status;
4. verify the exact text hashes, merge schemas, CAD amounts, durations, renewal terms, cancellation method, grace rule, statutory savings language, and approved legal version identifiers;
5. change the legal gate to `released` only after all validations pass;
6. publish both versions;
7. create one active required mapping for `holistic-foundations / monthly / CAD` and one for `holistic-foundations / one_time / CAD`;
8. verify MK7 has no active new-enrollment mapping;
9. allow the existing controlled backfill to create only the agreement matching each already-saved enrollment's billing path;
10. retain an auditable record of the approving legal decision and migration.

That forward migration must not change the approved business terms silently. If legal review requires different terms, Primary Chat must approve the revised business terms first.

## Safe release work before the legal determination

The following can proceed without publishing an agreement:

1. reconcile this branch with the then-current production source and re-run the full production isolation diff;
2. review and push the exact candidate source without merging unrelated beta/client/payment work;
3. apply `20261007224150_production_client_lifecycle_v1.sql` once, with the legal gate held and zero Holistic Foundations mappings created;
4. deploy the matching static assets and five prepared Edge Functions;
5. verify Owner/Admin authorization, contact creation/reuse, email normalization, duplicate prevention, exact CAD billing-intent persistence, six-/12-month commitment persistence, refresh/session isolation, recovery rate limits, and responsive UI;
6. verify that contract publication, Holistic Foundations mapping, agreement preparation/delivery, payment recording, paid access, and unauthorized actions all fail closed;
7. do not create the two approved disposable acceptance identities or send agreement/setup emails until the legal mapping is released, because the end-to-end signing acceptance cannot complete while the gate is held.

The two controlled inboxes remain approved for the later hosted lifecycle acceptance only: `rva-client@eaglevision.biz` and `dfowler4232@gmail.com`. No hosted record has been created for this package.

## Local verification

- Production build: 389 public files.
- JavaScript syntax: pass for all portal, member, function-adjacent JavaScript, tests, and scripts.
- Lifecycle DOM tests: 15/15 pass.
- PostgreSQL 17 full production suite: 114/114 pass.
- PostgreSQL concurrency: four race groups pass with eight overlapping sessions.
- Exact-built responsive browser acceptance: 37 checks pass at 1440×1000, 768×1024, and 390×844; no runtime errors or horizontal overflow.
- Focused legal-gate regressions prove publication, mapping, preparation, and delivery are blocked; monthly mapping cannot cross to pay in full; CAD-only amounts and six-/12-month commitments persist correctly.
- Deno Edge checks were not rerun in this checkout because Deno is unavailable. No Edge source changed in this refinement; rerun the existing Edge checks before any release.
