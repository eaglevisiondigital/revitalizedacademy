# Production Client Lifecycle v1 — technical foundation release

Date: 2026-10-08 (America/Los_Angeles)

## Released package

- Exact application source: `4fe1e812e007c840b0211cc61989f7b66fd28ba8`
- Branch: `codex/production-client-lifecycle-v1-reconciled`
- Production Netlify deploy: `6ac870e0a8239709a2ab5d23`
- Production Supabase project: `voalfpxiyznnqfcqcymd`
- Source migration: `20261007224150_production_client_lifecycle_v1.sql`
- Applied ledger: `20261009043913` (`production_client_lifecycle_v1`)
- Edge versions: `member-account` v6, `agreement-sign` v7, `member-password-reset` v1, `client-lifecycle-delivery` v1, `notification-delivery` v5

The deploy preserved the existing `exercise-library`, `food-database` and `reusable-content-sync` Netlify Functions. Live lifecycle JavaScript and CSS matched the reviewed production artifact byte for byte. Netlify's normal post-processing canonicalized one internal HTML link; the deployed lifecycle and Vitality script/style assets were otherwise exact.

## Hosted acceptance

The database acceptance used transaction-local rollback records only. The transaction created no Auth identity and rolled back every contact, journey and enrollment row. Results:

| Boundary | Result |
| --- | --- |
| Contact normalization and request-id reuse | Passed; one normalized contact and no duplicate |
| Monthly intent | Passed; CAD 8,900 cents, six months, payment pending |
| Pay-in-full intent | Passed; CAD 96,000 cents, 12 months, payment pending |
| Currency enforcement | Passed; USD rejected |
| Owner authorization | Passed with an existing active production Owner |
| Admin authorization contract | Passed; deployed functions require active Owner/Admin and production Admin defaults include CRM/finance management |
| Scoped Coach, member and anonymous calls | Denied |
| Agreement gate and MK7 fallback | Denied while publication is held |
| Browser payment write | Denied by table privileges |
| Privileged payment write | Denied by the production Payments v1 trigger |
| Paid access | Denied; payment satisfaction false, gates incomplete and activation not active |
| Agreement/email creation | None |
| Session isolation | Unrelated authenticated identity received no access row |

The five Edge endpoints were probed without credentials or recipient data. Account, signature, delivery and notification calls returned authentication denials. Password recovery returned the same neutral response for an empty email and rejected the beta origin. No email was sent.

Fresh browser contexts verified the signed-out portal, member onboarding and password-reset pages at 1440×1000, 768×1024 and 390×844. Private account/workspace panels stayed hidden, agreement content remained empty, and no horizontal overflow or unexpected runtime exception occurred. The existing portal emits signed-out 401/RLS-denial console noise; the denials are fail-closed and disclosed no private data.

## Final production state

- `production_client_agreement_publication`: `held`
- Hold reason: `quebec_regulatory_classification_pending`
- Active Holistic Foundations agreement mappings: 0
- Client agreements: 0
- Agreement delivery jobs: 0
- Payment records: 0
- Client memberships: 0
- Client access rows: 0
- Rollback acceptance contacts: 0
- Enrollment/agreement emails sent by this release: 0
- Payments or paid access enabled by this release: 0

Vitality reliability remained intact: the live Vitality scripts and styles match the exact approved artifact, and `vitality-resume` remains active at v3 with the pre-release bundle hash. Beta was not mutated and remains on Netlify deploy `6ac6b620e735903c2285ec3f`.

## Remaining legal release

The technical foundation migration must not be edited or replayed. After a qualified Québec legal determination and separate approval, publish the approved monthly and pay-in-full agreements through a new forward migration, create billing-specific mappings, and perform the separately authorized agreement/payment lifecycle acceptance. MK7 remains historical only.
