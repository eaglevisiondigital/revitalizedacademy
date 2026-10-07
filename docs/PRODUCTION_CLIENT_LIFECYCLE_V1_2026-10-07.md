# Production Client Lifecycle v1 — preparation checkpoint

**PRODUCTION CLIENT LIFECYCLE BLOCKED. No release was performed.**

The database candidate is tested locally; this is not a deployable, accepted end-to-end package. Production contract selection/mapping and disposable receiving-inbox confirmation are pending. Frontend/Edge integration, genuine hosted acceptance and responsive acceptance remain required. Do not onboard real clients using this candidate yet.

## Authoritative baseline

- Production repository: `eaglevisiondigital/revitalizedacademy`; isolated branch `codex/production-client-lifecycle-v1` starts from accepted production source `862f4b6e2edb9b6af5332a389c0081fefec6adae`.
- Production site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`; current deploy remains `6ac6b471ac8ed68bec8bd8d6`.
- Production Supabase: `voalfpxiyznnqfcqcymd`; latest migration ledger remains `20261007221345` (already accepted RepDB DELETE repair).
- Beta source audited: `0eea05af0c05c4b46dbf79d9f5adcabc0d1c2a6e`; beta project `bvooallokgfktssadsrv`; deploy `6ac6b620e735903c2285ec3f`.
- Production currently has zero enrollment activations, client-access rows, memberships, client agreements/acceptances and payment records. Final read reverified zero activations, access, agreements and payments and absence of the candidate enrollment API.
- Production publishes client contract MK7. Beta publishes MK8 with actual program-name language. Production has **zero active required Holistic Foundations agreement mappings**. The precise MK8 text-replacement anchor exists in production MK7; no legal content was changed.
- Active production programs include Holistic Foundations, Vitality Accelerator/Cohort and six/twelve-month Total Wellness. No beta pricing, deposit, contract terms, identities or operational records were promoted.

Evidence: `PRODUCTION_CLIENT_LIFECYCLE_AUDIT_2026-10-07.json`; existing beta `CLIENT_ACCESS_LIFECYCLE.md`, `BETA_READINESS_CORE_V1.md`, final beta acceptance entry in `CURRENT_BUILD_STATE.md`, and later individual-client acceptance documents. The older core multi-account acceptance passed; later recipient setup/fresh-login gates must not be described as passed merely because their server state is active.

## Module classification

| Lifecycle module | Production status | Evidence / remaining gate |
| --- | --- | --- |
| Client creation | NEEDS NARROW REPAIR/ACCEPTANCE | Atomic normalized, idempotent, attribution-preserving database API prepared. Staff form still needs integration and hosted/concurrency acceptance. |
| Enrollment | NEEDS NARROW REPAIR/ACCEPTANCE | Owner/Admin + permission + contact-scope contract prepared; pending membership/access foundation; no synthetic payment. UI integration required. |
| Program selection | NEEDS NARROW REPAIR/ACCEPTANCE | Existing active production catalog and billing/amount/currency validated locally. No price/currency inferred from beta. |
| Agreements | NEEDS NARROW REPAIR/ACCEPTANCE | Secure preparation/signing/claim/outbox contracts prepared and locally tested. Required production template mapping decision outstanding; mail dispatcher/UI integration and actual signature acceptance outstanding. |
| Account setup | NEEDS NARROW REPAIR/ACCEPTANCE | Reuse normal verified Auth and accepted invitation claim. Current production member-account Edge is older; integrate accepted secure version and prove real email setup. |
| Member access | NEEDS NARROW REPAIR/ACCEPTANCE | Candidate holds full access false, blocks manual paid/waived states and payment URLs/ledger writes. Hosted unpaid denial must be proven. |
| Member dashboard | KEEP BETA ONLY | No independently accepted production payment entitlement; do not promote the full dashboard yet. |
| Nutrition | KEEP BETA ONLY | Reusable food/recipe authoring remains accepted production functionality; client Nutrition workspace is a separate paid feature. |
| Workouts | KEEP BETA ONLY | Reusable exercise/workout/program authoring remains accepted; paid member workspace is not released by this preparation. |
| Health & Progress | KEEP BETA ONLY | Configurable metrics/private health workspace needs production schema, scope and entitled hosted acceptance separately. |
| Meal assignment | KEEP BETA ONLY | Content templates already live; no staging assignments copied. Production A/B assignment acceptance not performed. |
| Fitness assignment | KEEP BETA ONLY | Content templates already live; no production assignment promotion or acceptance. |
| Coach scope | NEEDS NARROW REPAIR/ACCEPTANCE | Existing production permission/scope retained; local existing Vitality denial regressions pass. New lifecycle hosted assigned/unassigned proof outstanding. |
| Password recovery | NEEDS NARROW REPAIR/ACCEPTANCE | Accepted beta recovery architecture identified; production lacks member-password-reset Edge. No recovery implementation deployed. |
| Payments integration | KEEP BETA ONLY / separate release | No live Authorize.Net, synthetic production payment, recurring/installment charges or payment links introduced. Payments v1 needs its own acceptance. |

## Completed / changed

Prepared **unapplied** forward migration `20261007224150_production_client_lifecycle_v1.sql`. It reuses the accepted beta secure lifecycle definitions in a production-only candidate, without restoring beta history or data. Includes pre-payment foundation, hashed verified invitation claim, one-adult authenticated signing, immutable rendered agreement protection, role/scope-restricted preparation, canonical production mail origin and explicit production payment hold.

Added server-side contact creation with normalized email/phone, deterministic transaction locks, exact identity matching, ambiguous/different-email collision rejection, request-ID/payload-bound retry handling and preservation of original referral/Sales Rep attribution. Added production enrollment APIs from the accepted beta enrollment pattern, removing beta recipient/synthetic-payment dependence.

Closed legacy unrendered agreement issuance and browser acceptance-write paths in the candidate. Invitation-bearing outbox jobs are withheld from browser roles. Existing production permissions/defaults are not granted or broadened. Existing accepted RepDB repair source/docs were carried into the isolated checkout because its migration is already applied; it must not be replayed.

## Tested

- Disposable native PostgreSQL 17.11 restore: recovered schema baseline plus production forward migrations and this candidate. **107/107 database tests pass**, including **14 new lifecycle/security tests**.
- Cases include normalized/idempotent contact reuse; source/Sales Rep preservation; phone/email conflict denial; role/scope/inactive/anonymous denial; atomic enrollment retry; payment URL/manual paid/waived/ledger holds; verified/wrong-account invitation claim; production-only origin; signature idempotence; stale hash, duplicate adult signature and unverified-signature denial; immutable signed contract; browser acceptance forgery denial; missing mapping denial; tampered beta-origin denial.
- Existing Vitality Review/resume, durable content, USDA calculation and RepDB delete/dependency/security regressions remain passing. The published-library member test now explicitly expects denial for an unactivated account under the new paid gate; this is an intentional access-contract change, not a skipped failure.
- Existing production public build passes: **383 files**. **106 JavaScript syntax checks pass**. No new lifecycle frontend was added to the public build; these results do not establish frontend lifecycle acceptance.
- `git diff --check` passes.
- Maintained beta/Edge suites were not rerun or claimed as current production acceptance. True overlapping contact-creation concurrency, current GoTrue/PostgREST integration, live email/setup/sign/recovery, cross-account DOM clearing and 1440/768/390 responsive lifecycle checks remain outstanding.
- Disposable local test databases were dropped by the runner. No hosted acceptance identities or records were created; no hosted cleanup was necessary.

## Required decisions / next action

**RECOMMENDED THINKING LEVEL: HIGH — CHAT DECISION NEEDED**

> Project: ReVitalized Academy — Production Client Lifecycle v1.
>
> Production publishes MK7 and has no Holistic Foundations program/agreement mapping. Beta uses the previously approved MK8 revision, replacing generic program level with the actual enrolled program name. Repository instructions explicitly require a Primary Chat production mapping decision before any backfill or issuance.
>
> Please choose: (1) use approved MK8 for new production Holistic Foundations enrollments, preserving MK7 history; (2) keep MK7 for those new enrollments; or (3) hold the release pending legal/product review. Recommendation: MK8 aligns with the approved program-name workflow, provided Primary Chat confirms its production use.
>
> Confirm the exact production program/template mapping. Do not infer production prices, currency, deposit, Appendix A wording or co-signer requirements from synthetic beta records. Owner-entered approved agreement terms must remain explicit. Other unmapped programs must not silently receive a guessed contract.
>
> Payments v1 remains unreleased. Enrollment/agreement/account setup can proceed only with Payment Pending / Payment Link Coming Soon and no paid access or synthetic production payment.

Pending inbox clarification: whether `rva-client@eaglevision.biz` and `dfowler4232@gmail.com` may be used as the two controlled disposable **production** acceptance inboxes. Read-only audit found neither as an existing production Auth/contact identity. User must receive/open verification/recovery emails and sign their own disposable agreement normally; credentials/signatures will not be manufactured.

## Remaining implementation and release work

After decisions, finish the production staff form/enrollment/agreement wiring and compact onboarding/recovery UI, update only required production member-account/agreement/notification/recovery Edges, and run their maintained tests. Preserve current staff portal/Vitality/content/one-way-sync behavior. Do not copy the full beta application or expose held modules.

Produce a complete exact candidate, run frontend/Edge/environment and responsive tests, perform drift preflight, apply only its approved new forward migration(s) once, deploy exact assets/functions, then complete minimum hosted disposable client/claim/sign/unpaid-denial/recovery/scoped and cross-account acceptance. Preserve audit/signature evidence securely and remove only disposable acceptance records. Do not claim acceptance based on HTTP 200, provider acceptance alone, historical completion statements or fixture-only Auth.

## URLs / hosted state

- Existing released Owner portal: https://revitalizedacademy.com/portal/
- Intended future client enrollment/signing route: https://revitalizedacademy.com/member/onboarding/ — **not released by this task checkpoint**.
- Intended member recovery route: https://revitalizedacademy.com/member/password-reset.html — **not released by this checkpoint**.
- Beta remains https://beta.revitalizedacademy.com; no beta records/configuration were modified.
- No lifecycle production source was pushed, migration applied, Edge deployed, Netlify deployment performed, mail sent, identity created or payment recorded.

## Chat handoff

Production Client Lifecycle v1 is blocked pending explicit production contract mapping and controlled disposable receiving inboxes. The database draft passes 107 native PostgreSQL 17 regressions, but frontend/Edge integration and genuine hosted lifecycle acceptance remain unfinished. Current production deploy and ledger are unchanged. Full paid member modules/assignments remain beta-only; no synthetic production payment or payment link is enabled. Resolve the mapping/inbox questions, then complete this same release package and its hosted acceptance; do not begin unrelated work.
