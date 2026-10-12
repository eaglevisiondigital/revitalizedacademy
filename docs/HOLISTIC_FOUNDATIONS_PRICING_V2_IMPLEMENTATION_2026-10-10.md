# Holistic Foundations Pricing v2 implementation

Date: 2026-10-10 (America/Los_Angeles)

Status: reconciled and locally verified on 2026-10-12 against accepted production source `83ad058c1514846a9978dc0132e7b94b060545a8`. No Git push, hosted migration, Edge deployment, Netlify deployment, agreement publication, payment enablement, charge, or paid-access change occurred.

## Result

The approved Holistic Foundations product architecture is implemented as a forward-only candidate on `codex/holistic-foundations-pricing-v2`. It replaces browser-owned prices with catalog-selected `plan_code` input and server-resolved price, market, currency, route, cadence, commitment and eligibility snapshots.

Two unapplied forward migrations comprise the package, in order:

1. `20261010120000_holistic_foundations_pricing_v2.sql`
2. `20261010121000_payments_v1.sql`

The existing applied lifecycle migration is unchanged and must not be replayed. Both new migrations restored successfully with the complete candidate migration sequence in disposable PostgreSQL 17.

The accepted session-restoration and post-logout module files remain byte-identical to production. Pricing v2 retains the null-safe lifecycle teardown and publishes the changed lifecycle module under `portal-client-lifecycle.js?v=103` so production's existing `v=102` response cannot be reused.

## Product-plan catalog

`program_product_plans` separates stable product identity from market prices. It stores plan code, program, display name, billing cadence, interval, minimum commitment, coverage, minimum contractual amount, post-commitment behavior, eligibility months, effective dates and metadata.

| Plan code | Billing | Commitment | Continuation | Eligibility |
| --- | --- | --- | --- | --- |
| `holistic_foundations_monthly_flex` | 100 per month | current monthly period; no multi-month minimum | monthly until cancelled under future approved terms | standard enrollment |
| `holistic_foundations_3_month` | 89 per month | 3 months; minimum 267 | month-to-month after the initial term, without a new minimum | standard enrollment |
| `holistic_foundations_annual_established` | one 948 annual payment | 12-month coverage | ends; renewal requires affirmative selection | six authoritative qualifying months or audited Owner/Admin override |

No 79/month installment plan, former 89/six-month product, or 960/12-month product is seeded.

## Market-price catalog

`program_plan_prices` stores exact plan/market/currency rows, integer cents, explicit merchant route, checkout state, effective dates and non-secret metadata. Nine rows cover the three plans in each approved market:

- CA / CAD: 10000, 8900, 94800 cents; route `CA_AUTHORIZE_NET`; checkout held.
- US / USD: 10000, 8900, 94800 cents; route `US_AUTHORIZE_NET`; checkout held.
- GB / GBP: 10000, 8900, 94800 cents; route `GB_PAYMENT_PROVIDER_PENDING`; configuration pending.

The database has no FX fallback. Missing/unsupported contact country or missing market price blocks plan persistence.

## Merchant-routing catalog

`payment_merchant_routes` enforces one market/currency pair per route and the exact approved pairings:

- Canada / CAD / `CA_AUTHORIZE_NET`
- United States / USD / `US_AUTHORIZE_NET`
- United Kingdom / GBP / `GB_PAYMENT_PROVIDER_PENDING`

All routes are `payment_enabled=false`. Canada is `disabled`, the U.S. is `credentials_required`, and the U.K. is `configuration_pending`. A check constraint permits enablement only with `live_ready`; the migration ends with an assertion that no route is enabled. Provider secrets remain outside database/browser catalogs.

## Server-authoritative enrollment

The staff UI sends only contact ID and plan code to `save_production_client_plan_intent`. The database derives contact market, active plan, exact price and exact route; rechecks eligibility; and snapshots plan, price ID, market, route, cadence, amount, currency, commitment, coverage, minimum contractual amount and post-commitment behavior on enrollment activations and pending memberships.

The old browser-price RPC is revoked from authenticated callers. Issued/active enrollment terms cannot be silently replaced. Staff see catalog labels, price, commitment, eligibility and checkout readiness. The annual option is disabled with the measured eligibility reason until eligible. GB explicitly shows payment configuration pending. Saving confirms that no agreement, payment or access action occurred.

## Annual eligibility and override

`private.holistic_foundations_qualifying_months` reads authoritative active/completed Holistic Foundations membership history. It uses the longest qualifying covered period and excludes records marked beta, staging, test or synthetic. Short periods are not combined.

`private.plan_eligibility` requires six qualifying months for the annual plan. `program_plan_eligibility_overrides` stores contact, plan, reason, approving user, timestamps, expiry/revocation fields and metadata. The mutation path reuses the existing Owner/Admin, finance permission and contact-scope guard; requires a meaningful reason; and adds a contact activity audit. Override approval does not publish an agreement, enable checkout, record payment or grant access.

## Agreement boundary

No agreement template or active mapping is created. `program_agreement_requirements` gains exact `plan_code`; new guards require an exact published client contract for the exact plan and currency, reject cross-plan agreement attachment, and preserve the legal hold. Membership issuance also matches exact plan and currency.

- MK7 remains historical only.
- MK8 remains an immutable editorial source only.
- Monthly Flex, 3-Month Commitment and Established Member Annual each require a separate future reviewed revision and mapping.
- `production_client_agreement_publication` must remain `held`.
- The migration asserts zero active Holistic Foundations mappings.

The held structural agreement specification is in `HOLISTIC_FOUNDATIONS_AGREEMENT_STRUCTURES_V2_2026-10-10.md` and contains no final legal text.

## Payments v1 revision

The unreleased Payments v1 candidate now uses `program_plan` rather than hard-coded Holistic Foundations products. Payment requests snapshot plan code, price ID, market, route, cadence, commitment, coverage and post-commitment behavior. Request creation re-resolves the current enrollment and catalog values server-side, rejects browser amount/currency/route mismatches, and rechecks annual eligibility.

The staff payment UI selects “Current approved enrollment plan” and reads the saved server state. The provider boundary retains hosted card entry, token hashing, idempotency, durable reconciliation, immutable ledger attribution, webhook signature validation and environment isolation. Payment processing still requires all of: the global release switch, a live-ready enabled route, and a live-ready price. The candidate seeds none of those states.

## Validation

- Production build: 394 files, production project `voalfpxiyznnqfcqcymd`.
- JavaScript syntax: 130 source/test files plus three Netlify TypeScript entrypoints passed.
- Pricing/Payments/lifecycle/session unit and DOM tests: 53/53 passed.
- Disposable PostgreSQL 17 restore: 17 candidate migrations applied in order.
- PostgreSQL authorization, plan, market, payment and lifecycle regressions: 55/55 passed.
- PostgreSQL concurrency: one race group, eight overlapping workers, eight distinct backend PIDs; one contact, one enrollment, one signature and one dispatch lease.
- Existing Vitality/assessment frontend regressions: 64/64 passed.
- Exact-built production session regression: 40/40 across Chromium and WebKit with zero console warnings/errors.
- Exact-built lifecycle browser: 37 checks passed at 1440×1000, 768×1024 and 390×844; no runtime errors or overflow.
- Exact-built payment browser: 39 checks passed at the same widths; no runtime errors, provider calls or hosted writes.
- Required payment/lifecycle build artifacts present; obsolete plan/product identifiers absent from application/runtime migrations.
- Production artifact scan found no beta project/origin, synthetic-recipient or synthetic-payment path.
- `git diff --check`: passed.

The host has no Deno executable. No Supabase Edge source changed in this package; the unchanged lifecycle Edge entrypoints and three new Netlify `.mts` entrypoints passed local syntax checks, and payment behavior is covered by the Node unit/database suites.

## Security result

Catalog and override tables have RLS enabled and no direct browser/service table grants. Catalog reads and mutations go through guarded functions. Owner/Admin status, effective finance permission and contact scope are rechecked server-side. Member, anonymous, Coach and out-of-scope staff denial passed. Market/currency/route combinations are constrained in SQL. Direct browser ledger writes and privileged writes remain blocked by the unreleased-payment guard. Cross-plan agreement mapping is rejected. No secret is stored in public metadata or the browser.

## Remaining release gates

1. Qualified legal/regulatory review and final wording for each plan and each applicable market.
2. A separately authorized agreement publication migration creating three immutable plan-specific revisions and exact plan/currency mappings, while preserving MK7/MK8 boundaries.
3. Separate approval to change `production_client_agreement_publication` from held.
4. Canadian payment-provider sandbox acceptance, then separate live-charge approval.
5. A separately configured and accepted U.S. merchant account/credentials; never route USD through Canada.
6. An approved GBP-capable processor, credentials and acceptance; until then GB remains configuration pending.
7. Separate approval to apply the two migrations and deploy revised Payments v1 frontend/functions. Applying schema does not authorize payment enablement.
8. Hosted acceptance after those gates, including explicit client acceptance, payment reconciliation, access gating and cleanup.

Until those approvals, production and beta remain unchanged, all agreement mappings and payment routes stay inactive, and paid access remains fail closed.
