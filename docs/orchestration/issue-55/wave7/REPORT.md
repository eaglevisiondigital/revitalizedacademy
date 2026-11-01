# Issue 55 — Wave 7 local source-review integration

Status: bounded fictional implementation, not production acceptance. Base `38f086792addaa9b131cecaf261ef21f89f5ffc7`; branch `codex/rva-wave7-affiliate-20261101`; worktree `academy-wave7-affiliate`. Alex is paused. No production/network provider, database, financial, messaging or permission action.

## Implemented

The real loopback Share Center now exposes `POST /api/source-review` and a usable resource/source review panel alongside existing manual copy, actual QR, minimal referral stage, educational Companion and Client/Coach progress views. It composes the existing readers rather than implementing a second share, provenance, consent, QR or allowance engine. `tools/wave7-share-review.cjs`, version `rva-share-source-review-fixture-v1-20261101`, is the only new runtime contract.

The caller must pin the exact authority, campaign, creative, catalog revision/hash, approval generation, channel and Driver. The reader checks those pins before work and after every await; stale or mid-read changed authority discards the entire composition. Same-account transport renewal does not invalidate unchanged authority. Strict selectors reject caller identity, health information, consent overrides, financial fields, getters and coercion objects.

Returned fields are the already authorized copy, two-field own synthetic referral projection, exact educational citation metadata and explicit limits. It neither joins an affiliate/referral to a Client identity nor uses an educational lookup as individualized advice. The existing synthetic consent-withdrawal fixture still permits approved material viewing and separately denies event recording. Lookup never calls the touchpoint writer, creates no event, and never equates a click with YouTube viewing, conversion or enrollment. Existing event idempotency and creative/channel replay conflict checks remain unchanged.

UI outputs use textContent; no source text becomes markup. Existing identity/scenario/cross-tab clearing now includes the source review. Delayed results cannot revive a previous Driver/source view. Persona selection continues to be labeled a synthetic test selector, not authentication.

## Actual test evidence

- `node-http.tap`: **44/44 PASS** new source-contract and real loopback HTTP cases. All 12 Drivers, revocation/logout/wrong account/expiry, education withdrawal, consent boundary, same-account renewal, stale creative/catalog/authority pins, hostile fields/getters/coercion, mid-read revocation, 20 concurrent read-only inspections, unchanged event replay/conflict and origin rejection.
- `browser.tap`: **6/6 PASS** Chromium/WebKit at 390/768/1440. Actual copy selection, actual QR encoding independently decoded by macOS Vision, one synthetic event plus duplicate receipt, coherent citations, delayed source response after Driver change, withdrawn consent, assigned/unassigned Coach progress, cross-tab logout, no overflow, no external requests and no unexpected page errors.
- `regressions.tap`: **158/158 PASS** existing Wave 4 adapter, Wave 3 QR, Wave 5 HTTP and Wave 6 progress/HTTP regressions. Existing contracts were not edited.
- `initial-sandbox-block.tap`: 39 unit PASS, four HTTP fixture-start errors from sandbox EPERM. Retained as environment evidence; the reviewed loopback-only escalated run passed all checks. No test assertion was loosened.
- `PRESERVATION.json`: pinned unchanged input contracts and source/asset registries. All exact checks PASS.

Counts are component/loopback/native-browser checks, not complete-package or real managed Auth/RLS acceptance. No PostgreSQL was started or contacted. Master/independent QA owns final integration verdict and the 57-package matrix.

## Preservation and limits

Unchanged: prior Wave 4/5 share/education adapters and catalogs; Wave 6 progress contract; QR encoder/native decoder; all 101 requirements, ten source-detail groups, original 57 definitions and missing 127-section handoff; canonical SQL/migrations, Functions, Auth, member/Coach application runtime, coaching rules, branding assets and protected Roadmap source. No real source or unapproved 113-submission intake was used. No client/guest identifiers or answers exist in new fixtures.

The provider is still invented local state. It is not signed approval, actual managed identity/session verification, durable event storage, cross-device idempotency, actual marketing consent or production affiliate attribution. Progress is a separate fictional scope; no Client identity association is inferred. No commissions, balances, credits, payouts, communication or methodology is activated. Existing complete-journey blockers remain.

## Rollback and next handoff

Local rollback: revert this finite commit only; the prior preview/adapters and in-memory journals remain unchanged. No migration, persistent resource or production rollback is needed. Independent QA should rerun this exact source and challenge stale-tab / mid-read versions and confirm no event emitted during lookups. Next safe implementation is an independently reviewed durable service/approval integration contract when those policy and provider dependencies are established. No production release permission is implied.
