# Wave 5 Lane C — integrated local Share Center and education-only Companion

Issue #55/#57; native specialist `/root/wave5_affiliate`; worktree `academy-wave5-affiliate`, branch `codex/rva-wave5-affiliate-20261101`, base `024b1c20c802ce6a9470fc46fabdd3bae75ed980`. This is a local fictional tool, not production affiliate/Coach authentication or a business-acceptance claim. Master reviewed and approved the exact three existing preview-tool edits and one additive fixture-provider file before implementation. Alex remains completely paused and untouched.

## Implemented integration

The existing loopback Share Preview now invokes the unchanged Wave 4 adapter through actual HTTP and the existing real ReportLab QR encoder. The UI shows approved synthetic channel copy and its own referral URL, supports manual selection, projects one disclosure-bound fictional referral stage, and records an explicit synthetic `share.created` event with a retry receipt. No preparation/opening/lookup automatically creates a tracking event, consent, communication or financial record.

The same local tool includes a detached Coach Companion interface for all 12 existing MK10 Driver keys. It invokes the unchanged asynchronous receipt/catalog validator and education-only engine, displaying plain text and unique source/version/hash/locator/claim citations. Twelve invented, explicitly labeled educational fixture passages demonstrate integration only. They are not founder doctrine, protocols, individualized advice, V3 intake promotion or actual source approval. No real recording/source archive, 113-intake material, report or questionnaire answer was introduced.

Changed existing files: `tools/affiliate-share-preview/server.cjs`, `preview.js`, `index.html`. Added provider: `tools/wave5-fixture-providers.cjs`. Existing `adapter.cjs`, share helper, catalog engine, async catalog wrapper, encoder and independent native decoder remain byte-identical. No member/portal runtime, shared Auth, SQL, canonical migration, Function, design asset, build/Netlify allowlist or financial file changed.

## HTTP and provider contract

CLI still binds `127.0.0.1` on an ephemeral port. Strict Host, Origin and cross-site Fetch Metadata checks, no-store responses, CSP, fixed paths, bounded JSON and bounded HTTP timeouts apply. Static GET and `/api/bootstrap` are read-only. Bootstrap exposes only fictional selectors/version pins; no identity, session, contact, private row or receipt collection.

- `POST /api/preview`: compatibility shape `{channel,state}`. State is compared to the *current* explicit synthetic scenario. It cannot restore/change authority. Current server-owned source pins go through the real Wave 4 adapter before the QR encoder.
- `POST /api/scenario`: exact `{state}` allowlist. This is a visibly labeled, local-only synthetic scenario control, never a credential, approval or production configuration endpoint. The fixture states are active/revoked/expired/wrong-account/renewed/consent-revoked/education-revoked/logout.
- `POST /api/share`: exact existing adapter request shapes for own share/referral/nonfinancial event; caller identity, links, copy, permissions, approval, time and consent are rejected.
- `POST /api/education`: exact existing wrapper request shape; caller answers, client/report data, audience, receipts and clinical intent are rejected.

Providers own truthful fixture identity, profile, current campaign/creative/disclosure/consent, current catalog and independent fictional receipt snapshots. Their shared monotonic authority revision increments on explicit scenario change. Ordinary same-account transport renewal preserves the authorization revision and existing event journal. Renewal cannot restore a revoked/expired/wrong-account/logout fixture. This is not JWT verification, authenticated founder approval, RLS, an external provider or a distributed consistency guarantee.

The UI keeps no sensitive persistent storage. An in-memory BroadcastChannel carries only an inert reset signal after a local fixture change; other tabs clear old copy/QR/referral/event/education views and read current public fixture selectors. It carries no identity or approval. Epoch checks discard late results, including an approved education response delivered after fixture revocation. Page refresh drops view state and is not claimed to restore an uncertain event ID.

## Retry and attribution semantics

One event ID is retained in memory for the exact visible actor/campaign/creative/revision/channel preview. A lost response can be retried with the same ID; the actual adapter commits one event and returns a duplicate receipt. Changing channel/scenario clears the prior ID, QR and receipt. Different attribution with the same ID conflicts rather than silently changing the original event. A separate instance has a separate journal. There is no database persistence, restart durability, multi-process exactly-once promise, real click ingress or earning ledger. The manual synthetic event button does not claim YouTube viewing, message sending or conversion.

## Executed tests

- `HTTP.tap`: **30 PASS / 0 FAIL**. Actual HTTP-to-adapter/QR/referral integration, all12 educational Driver lookups, 100 parallel retries (one first receipt/99 duplicates), attribution conflict, current revocation/expiry/logout/wrong-account denial, same-account renewal, consent withdrawal, source/hash mismatch, forged caller authority/client fields, unsupported financial operations, origin/Host/Fetch Metadata, body/path/JSON negatives and isolated fresh instances.
- `BROWSER.tap`: **6 PASS / 0 FAIL**, Chromium1248 and WebKit2336 at1440/768/390. Actual rendered QR independently decoded by macOS Vision; copy selection, minimal referral, event retry and response loss after commit, source citations, channel attribution reset, same-origin cross-tab clearing, refresh, network failure/recovery, education revocation and late-response clearing; no external requests or uncaught page errors; no horizontal overflow.
- `PRESERVED_CONTRACTS.tap`: **88 PASS / 0 FAIL** = unchanged Wave4 adapters79 + prior QR/HTTP compatibility9. Counted as regression executions, not 88 new implementation features.
- Syntax and whitespace checks PASS. Source preservation checks pin unchanged helpers/catalog/encoder/decoder, 101 requirements/10 detail groups and original57 package matrix.

Initial local execution was sandbox-blocked at loopback listen, then ran with the authorized local sandbox exception. `INITIAL_HTTP.tap` retains four harness failures (trailing whitespace only normalized for Git): three missing bundled-Python encoder configuration and one fetch-client override of security-test headers. The suite now explicitly uses the installed Python and raw HTTP for exact security headers; it did not weaken server checks. `INITIAL_BROWSER_PASS.tap` retains the earlier six-case pass before the extra late-approved-response assertion and final bootstrap state adoption. Current final receipts are named above; historical results are not erased or represented as production findings.

## Limits, preservation, next action

Five partial local package slices A02/A03/A04/A05/R03 advanced; **zero full business integration packages are newly certified**. Full application/agreement/onboarding, real approved campaign services, actual Auth/RLS, persistent attribution/CRM and approved real educational source ingestion remain blocked prerequisites. The missing original127-section affiliate handoff remains explicit; full advanced affiliate commission/credit/reward/ledger/payout requirements are retained, inactive. No financial activation, messages, grant, real-client processing, production query/write/deploy or Alex action occurred.

No new Owner approval is needed for further already-authorized bounded local tests. Next: independent QA should execute this exact source, adversarial HTTP/UI races and macro-package boundaries. Actual backend/product wiring needs separately reviewed identity/current approval/consent/data contracts; any production release remains separately gated. Do not publish this diagnostic tool or add it to the production allowlist.

Rollback is local Git reversion of these additive/provider/tool edits; it restores the prior detached preview. There are no persisted client records, grants, SQL or production changes to reverse. Master owns the integrated CURRENT_BUILD_STATE and consolidated release status. All101 requirement groups, ten source-detail groups,10 workstreams and13 Functions are untouched.
