# Holistic Foundations pricing and billing architecture v2

Date: 2026-10-10 (America/Los_Angeles)

Status: architecture implemented in a locally verified, unapplied candidate; agreement publication and all live payment processing remain held. See `HOLISTIC_FOUNDATIONS_PRICING_V2_IMPLEMENTATION_2026-10-10.md` for the exact schema, runtime and test result.

## Superseded assumptions

The former CAD 89/month six-month plan and CAD 960/12-month pay-in-full plan are no longer valid product choices. The deployed production lifecycle foundation still contains those values in `portal/portal-client-lifecycle.js`, `portal/index.html`, `portal/portal-agreements.js`, and the applied `20261007224150_production_client_lifecycle_v1.sql`. The unreleased Payments v1 candidate also hard-codes those two products in `20261006191218_payments_v1.sql`.

The applied lifecycle migration is not edited or replayed. Forward migrations `20261010120000_holistic_foundations_pricing_v2.sql` and `20261010121000_payments_v1.sql` now implement the replacement schema and runtime locally; both remain unapplied pending separate release authorization.

The production legal switch remains:

`production_client_agreement_publication = held`

There must remain zero active Holistic Foundations agreement mappings until a qualified legal review and separate release approval.

## Product-plan model

Product identity and market pricing must be separate. Product plans define commercial structure; price rows define a market, currency, amount, and merchant route. Payment and enrollment code must accept a `plan_code` and resolve all financial fields server-side. Browser-submitted prices are descriptive only and never authoritative.

| Plan code | Staff label | Cadence | Amount | Minimum commitment | Eligibility |
| --- | --- | --- | ---: | --- | --- |
| `holistic_foundations_monthly_flex` | Holistic Foundations Monthly | monthly | 100.00 | current billing period only | none beyond normal enrollment eligibility |
| `holistic_foundations_3_month` | Holistic Foundations 3-Month Commitment | monthly | 89.00 | 3 months; minimum total 267.00 | normal enrollment eligibility |
| `holistic_foundations_annual_established` | Established Member Annual | annual, paid once | 948.00 | 12-month paid term | six qualifying Holistic Foundations months or audited Owner/Admin override |

The annual plan is one annual payment. A 79/month installment product is not present and must not be inferred from the annual equivalent.

Recommended normalized tables:

- `program_product_plans`: `plan_code`, `program_code`, display name, cadence, cadence count, minimum commitment months, coverage months, eligibility rule, active state, effective dates, metadata.
- `program_plan_prices`: plan code, market code, ISO country code, ISO currency, integer amount cents, merchant route key, checkout configuration state, effective dates, active state.
- `payment_merchant_routes`: route key, market, currency, provider identifier, configuration state, environment enablement, and non-secret metadata. Provider credentials remain only in protected function configuration.
- `program_plan_eligibility_overrides`: contact, plan, reason, approving Owner/Admin, effective/expiry dates, revocation actor/time, and audit metadata.
- Add immutable plan/market/route snapshots to enrollment activations, memberships, agreements, payment requests, and ledger records. Historical records retain their original values.

Each table requires RLS. Catalog reads should be exposed through scoped RPCs; writes require active Owner/Admin plus the applicable finance permission. Members may read only the plan snapshot attached to their own enrollment. Anonymous users receive no private catalog or eligibility data.

## Market and currency model

No FX conversion is performed. Each market has explicit price rows using the same approved numeric price unless a future market-specific value is approved.

| Market | Country | Currency | Flex monthly | 3-month monthly | Established annual |
| --- | --- | --- | ---: | ---: | ---: |
| Canada | CA | CAD | 100.00 | 89.00 | 948.00 |
| United States | US | USD | 100.00 | 89.00 | 948.00 |
| United Kingdom | GB | GBP | 100.00 | 89.00 | 948.00 |

The United Kingdom rows may be stored for planning but their checkout state must be `configuration_pending` until an approved GBP-capable merchant route exists. No generic “Europe” row should be seeded: each additional European country/market requires an approved market code, currency, legal terms, and merchant route.

Contact country is the authoritative default market. Missing or unsupported country data blocks plan persistence with a clear staff action; it must not silently default to Canada or infer currency from browser locale. An Owner/Admin correction to contact country remains audited under the existing contact-management controls.

## Merchant routing

- Canada resolves only to `CA_AUTHORIZE_NET` and CAD.
- United States resolves only to a separately configured `US_AUTHORIZE_NET` (or a subsequently approved U.S. route) and USD.
- United Kingdom resolves to a future approved GBP route. Until one exists, its route state is `configuration_pending` and checkout is unavailable.
- The server derives route from the active market-price row. The browser may not choose an arbitrary route/currency pair.
- Route configuration and credential readiness are separate from product activation. No catalog seed may enable a gateway.
- The Canadian Authorize.Net credentials are never reused as an implicit USD/GBP fallback.

## Annual eligibility

Eligibility is computed from authoritative `client_memberships` and their activation history, not a checkbox. A conservative initial rule should accept either:

1. a current uninterrupted active Holistic Foundations membership whose qualifying start is at least six calendar months ago; or
2. a completed Holistic Foundations membership with at least six months of actual covered participation.

Cancelled, voided, test, overlapping duplicate, unpaid/pending, and synthetic beta periods do not count in production. Multiple short historical periods should not be combined until the allowed gap/continuity rule is explicitly approved.

An Owner/Admin override requires a reason, actor, timestamp, and audit event. Normal staff can see “Annual Discount Eligible” or the measured remaining eligibility time but cannot self-approve an override.

## Enrollment UX

The current two hard-coded options must be replaced by catalog-driven cards showing label, market currency, price, cadence, commitment, eligibility, and checkout readiness.

- Flex: `100/month`, “Flexible monthly; no multi-month minimum.”
- 3-Month: `89/month`, “Three-month minimum; 267 minimum total.”
- Annual: `948/year`, “Available after six qualifying months.”

For an ineligible client, the annual plan is disabled with the eligibility reason. An Owner/Admin sees a separate audited override action. For GB, choices may be displayed for planning but must say “Payment configuration pending” and must not offer checkout.

Saving an enrollment passes only contact ID and plan code. The database snapshots program, amount, currency, cadence, minimum commitment, market, and merchant route. Agreement issuance and payment actions remain disabled while their respective gates are held.

## Agreement mapping recommendation

- MK7 remains historical only.
- Existing published MK8 does not exactly match any new plan. Its monthly/deposit structure and section 4.4 were reviewed against the former six-month plan; it does not state a flexible 100/month product, a three-month 89/month commitment, or a 948 annual product. Published MK8 must remain immutable.
- Use MK8 only as editorial source material for a new immutable revision for `holistic_foundations_3_month` if qualified review approves the resulting three-month language.
- Prepare a separate flexible-monthly revision for `holistic_foundations_monthly_flex`.
- Prepare a separate annual-established revision for `holistic_foundations_annual_established`.

Mappings must include exact `plan_code`, market/currency applicability, and effective version. Billing choice plus currency is no longer specific enough. No fallback agreement is permitted when a plan-specific mapping is absent.

No draft should be published or mapped until the Canadian/Québec classification, cancellation, installment-payment, renewal/continuation, refund, annual prepayment, and access-suspension language is approved. The stated final-sale business intent remains subject to non-waivable law.

## Payments v1 revision

The unreleased candidate must replace `holistic_foundations_monthly` and `holistic_foundations_full` hard-coded validation with catalog resolution:

- Store `plan_code`, `market_code`, `price_id`, `minimum_commitment_months`, `coverage_months`, and route snapshot on each request.
- Resolve amount/currency/route from the database catalog and reject browser mismatches.
- Support flex and three-month plans as recurring billing with different contractual minimums; provider cancellation must not silently erase an outstanding contractual state.
- Support annual-established as a single annual payment only after server-side eligibility succeeds.
- Preserve contact/client and sales-rep attribution, immutable ledger entries, paid/remaining calculations, idempotency, and independently verified provider reconciliation.
- Keep Canadian, U.S., and future GBP gateway credentials and provider configuration isolated.
- Keep all payment configuration disabled. Existing Authorize.Net credential gates remain unchanged.

The payment UI should receive a server-generated summary. It must not manufacture a lifetime total for the flexible plan, should show a 267 minimum commitment for the three-month plan, and should show 948/12-month coverage for the annual plan.

## Safe engineering sequence

The following can be prepared and tested locally now:

1. a forward product/price/route/eligibility schema and RLS;
2. plan-specific enrollment snapshots and RPCs;
3. catalog-driven staff enrollment UI;
4. authoritative annual eligibility plus audited override support;
5. plan-specific agreement mapping columns and fail-closed lookup;
6. Payments v1 catalog integration with all gateways disabled;
7. PostgreSQL authorization, amount tampering, eligibility, history, market/route, duplicate, and concurrency tests;
8. frontend responsive and accessibility tests.

Release remains blocked on:

- qualified agreement/legal approval for all three plan structures and applicable markets;
- explicit agreement publication/mapping approval;
- U.S. merchant credentials/capability acceptance;
- an approved GBP-capable merchant and credentials;
- Canadian/Québec treatment of the three-month commitment and 948 annual prepayment;
- sandbox acceptance for each enabled route and a separate live-charge approval.

## Current-state safety result

This architecture review did not modify a hosted database, agreement, mapping, payment configuration, merchant credential, production/beta content, client, or session. The current production agreement publication gate remains held and the existing production lifecycle/payment protections remain unchanged.
