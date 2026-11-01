# Wave4 LaneC — fixture-owned share and education adapters

Issue55 with detached Issue57 slice. Base5926b915f60b1be6d009c94362b91356a303cb33; branch codex/rva-wave4-affiliate-20261101; native owner `/root/affiliate_finance_audit`. Final local SHA is returned in the completion. EVIDENCE.json pins implementation/test bytes. This is useful executable local code, not production authentication/approval acceptance. Alex is paused: no protected reads, authentication, grant/report actions or production calls occurred.

Master received the request/dependency/output proposal before code and explicitly approved the new share adapter, including synchronous currentAuthority and monotonic authority_revision. Master separately approved the exact additive V3 wrapper file. Existing helper, preview server/UI/encoder/decoder, catalog engine, member/portal, schema/RLS and source archives remain unchanged. No network or package installation is required by the new tests.

## Share adapter interface

`tools/affiliate-share-preview/adapter.cjs` exports `createFixtureAdapter(deps)` returning `{execute}`. Factory mode must be `fictional-preview`. Required injected callbacks:

- `getSession()`: async current fixture session.
- `currentAuthority()`: synchronous current fixture session/authority read; an async result fails closed and its rejection is consumed.
- `resolveShare({actor,selectors})`: async minimal own-profile, URL policy, campaign, creative and optional tracking-consent snapshot.
- `resolveReferral({actor,selectors})`: async own-profile, minimal referral and viewer/subject-bound disclosure snapshot. It must not return private contact/health rows.
- `clock()`: synchronous server-owned ISO timestamp; async or malformed values fail closed.

Session fields are fixtureOnly, authenticated, scope_id, user_id, contact_id, market, role, allowed_actions, authorization_epoch and authority_revision, with optional transport_revision. This is a dependency contract over the existing user/contact/profile identity fields, not a new account store or role grant. Only fictional/synthetic identifiers are admitted. `owner` does not bypass explicit action scope or the existing own-affiliate profile checks. No arbitrary affiliate target or privileged impersonation interface exists.

Request shapes are exact allowlists:

```
share: {action:'share',campaign_id,creative_id,expected_campaign_revision,expected_creative_revision,channel}
referral: {action:'referral',referral_id}
touchpoint: {action:'touchpoint',campaign_id,creative_id,expected_campaign_revision,expected_creative_revision,channel,event_id,event_type}
```

Allowed channels remain email/sms/dm/social. Allowed event types remain share.created/share.clicked/appointment.booked. Caller identity/profile/permission/approval/policy/URL/copy/consent/clock/journal snapshots are rejected before dependency calls. Only `.invalid` HTTPS resolver destinations are admitted; the unchanged helper applies stricter exact destination/own-code/media-origin rules. No outbound send, media retrieval, HTTP route or loader is registered.

The session is pinned at request entry, before queueing, so an A request cannot later execute as B. Async resolver results and current session are checked twice. Snapshot scope/version pins and canonical snapshot equality catch drift; caller expected revision pins are comparisons, not authority. After all awaits, the adapter reads synchronous currentAuthority and performs helper projection/local journal commit without another await. Same-account token transport changes do not alter the authorization binding; identity/epoch/scope/action/market/revision changes do.

**Required fixture invariant:** currentAuthority and resolver snapshots are truthful server-owned fixture reads. Any auth/profile/catalog/policy/disclosure/consent change increments the shared monotonic authority_revision; ordinary same-account token renewal does not. A callback lying about current state cannot be authenticated by this wrapper. This is not a distributed transaction, JWT verifier, approval-receipt verifier, consent service or RLS substitute. An actual backend integration must supply independently authorized, consistent current sources and real atomic persistence; this code is intentionally not wired to one.

Outputs are frozen and marked fixtureOnly:true, productionEligible:false, persisted:false. Share returns the unchanged helper's approved plain copy/URL/QR input; referral returns only referral_id and consented generic status. Touchpoint returns event_id/type, duplicate and count, never session/profile/raw records/journal. Callback exceptions/getters/unsafe objects are rejected with fixed reasons; private exception text is never returned.

## Atomic isolated fixture journal

Touchpoint calls serialize through one bounded promise queue per adapter. After final authorization and creative/consent checks, the unchanged recordTouchpoint reducer builds the next state and commits synchronously. Journals are isolated by server scope+user+contact and adapter instance. Event producer and occurrence timestamp are server-owned; duplicate replay reuses its original timestamp. Request campaign/creative revision/channel pins also bind retries, so altered attribution conflicts rather than overwriting the first record. There is no earning, settlement, financial balance, credit, payout or signed commercial ingress.

100 parallel identical calls create one row/one first receipt and99duplicates. Parallel changed retries conflict. Distinct actors/instances stay isolated. The queue admits128pending writes and rejects overflow; the helper's1000-event and adapter's32-actor resource bounds are implementation limits, not product policy. They are in-memory only: restart loses fixture data, separate processes/instances are not jointly atomic, and distributed exactly-once semantics are not claimed.

## Additive detached V3 wrapper

`tools/coach-companion-catalog/async-fixture-adapter.cjs` exports `createFictionalLookupAdapter(deps)` with getSession/currentAuthority/resolveCatalog/resolveReceipts and fictional mode. No edit to existing index.cjs.

Its exact request allowlist is catalog_id, expected_catalog_version/hash/approval_generation, driver, topic and limit. Audience, principal, sources, content, receipts, approval flags, operation and intent cannot come from the caller. Session supplies a fictional principal_ref, authorization_epoch, authority_revision, audience, approval_generation, educationAllowed and optional transport_revision. No identity/session payload enters the catalog engine.

Catalog and receipt snapshots are resolved twice across async boundaries, scoped to the principal's audience/generation and immutable request pins. Receipt records have exact source/claim IDs, verdict, targetHash, receiptHash and generation; duplicates and malformed records fail. All snapshots share the monotonic authority revision. After final synchronous authority check, a sync fixtureVerifier is formed only from independently injected receipt records; the unchanged strict catalog validator and education-only lookup run synchronously. Invalid/held catalogs remain held. Correct results retain the existing citation/source/version/hash/audience contract and inert untrusted_source_text designation.

**These receipt records/verifiers are fictional trust inputs, not authenticated founder approvals.** No client-supplied hash/flag becomes verifier authority. No real113source, curriculum promotion, clinical rule, personalized direction, report processing, engine/config/worker or production registry was introduced. This wrapper intentionally requires complete fictional catalog admission before its educational lookup; it does not silently promote a held unrelated source.

## Actual tests and evidence

`ADAPTERS.tap`:79 PASS,0unexpected failures:55 share/CRM/journal tests plus24 detached V3 tests. `ADAPTER.tap` preserves the primary55-case receipt. Tests execute actual new code with invented `.invalid` fixtures and injected callback barriers, not a reimplementation of the helper/catalog policies.

Named negatives include forged request fields, non-invoked getters/prototype pollution, caller mutation while awaiting, logout/switch/scope/role/epoch/action changes, revocation/expiry/catalog/source drift, wrong expected revisions/subjects, disclosure withdrawal, private extra rows, foreign nonfixture destinations, redacted errors and malformed async synchronous dependencies. Same-account renewal succeeds. Queued A requests cannot migrate to B. Journal parallel duplicate/conflict and overflow paths pass. V3 adds principal/audience/receipt generation/current-revision races, missing/duplicate/forged receipts, caller-authority injection and no-real-mode behavior.

Run from repository root with Node24:

```
node --test tests/wave4-affiliate/adapter.test.cjs tests/wave4-affiliate/v3-async.test.cjs
```

Both adapters pass syntax and whitespace checks. No browser, QR encoder/decoder, database/RLS, hosted Auth, real approval, provider or production tests ran in this wave. Existing real QR/independent Vision proof and preview behavior are preserved byte-for-byte from the accepted baseline, not counted again. There are no new dependencies.

## Integration, scope and next action

QA_PACKAGE_MAPPING.json retains all57package IDs with only named local partial evidence for A02/A03/A04/A05/R03. Zero full macro packages or production acceptance newly pass. Current SQL findings are not repaired or recertified. Full advanced affiliate application/agreement/ShareCenter/CRM/AI/bonuses/credits/points/commissions/recurring/ledger/disputes/payout/currency/Owner-control scope remains required. All127original source rows remain missing; no blueprint numbering or source content substituted. RVA single-level, MLM/genealogy/ranks OFF; coach compensation separate. Financial and product-policy holds remain.

Next: independentQA executes this exact commit and adversarial callback/queue invariants. Only after separately reviewed current identity/approval/consent/service contracts should a product or preview integration be considered. No existing preview/UI wiring was requested or performed. Existing sources and worktrees remain preserved. Reverting this local commit removes only additive adapters/tests/docs; no persistent data or grants require rollback.

COMPLETED: two functional fixture adapters over existing helpers, actual async authorization/source/receipt tests and atomic isolated nonfinancial evidence. CHANGED: two new tool files plus owned tests/docs only. TESTED:79local cases, syntax and ownership/source preservation. SECURITY: explicit request/resolver separation and current fixture checks; no realAuth/RLS/approval guarantee. DOCUMENTATION: owned Wave4 report/interfaces/evidence/57partial mapping; Master owns CURRENT_BUILD_STATE updates. UNRESOLVED: authenticated product integration, durable events, original127, current operational/security and financial approvals. CHAT HANDOFF: independent engineering advanced without protected/production calls; fixtures remain detached and sensitive authority unchanged.
