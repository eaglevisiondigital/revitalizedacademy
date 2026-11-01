# Issue #57 Wave 2 — detached fictional catalog validator and lookup

Status: **VERIFIED-LOCAL**, bounded fictional implementation only. Issue #57, real-source admission and live Coach Companion acceptance remain open. Date: 2026-11-01.

Issue: https://github.com/eaglevisiondigital/revitalizedacademy/issues/57

## Completed and ownership

Implemented a self-contained CommonJS catalog-envelope validator and exact educational lookup adapter in `tools/coach-companion-catalog/index.cjs`. It returns deterministic frozen educational results with exact citation pins, or typed hold/no-support statuses. It contains no methodology, source corpus, account system or report engine. The tests contain only visibly marked fictional content and synthetic receipt decisions.

Assigned worktree: `/Users/davesmacbookpro/Documents/ChatGPT/revitalized academy/academy-wave2-v3`; branch `codex/rva-wave2-v3-20261101`; exact clean starting base `cbc1a925913867dab27777bd28c3fc36c9b04b68`. Agent: `/root/issue57_v3_preparation`, existing Master chat `01a0df6c-7089-7d21-9318-865f54ca8100` / #58. Accepted coordination reference: `fc6737415da36b4306afa0060a525eca2f1131ca`. Read that coordination contract/register, the applicable AGENTS instructions and the accepted prior Issue #57 report in the integration worktree. Earlier architecture/security/build-state discovery is retained; no production state was refreshed here.

Exclusive changed paths:

- `tools/coach-companion-catalog/index.cjs`
- `tests/coach-companion-catalog.cjs`
- `docs/orchestration/issue-57/wave2/`

No existing V3 engine/config/source catalog, shared register, Auth, worker, source maps, questionnaires, database/migration or deployed file is edited. No 113-item intake, older 21-source recording corpus, restricted archive, private client input/report or credential is read. The previous 42-engine-test result was not rerun; byte-hash preservation verifies those files remain unchanged. The new adapter imports only `node:crypto` and `node:util`; its tests use Node built-ins only. It can be integrated as new files on the accepted coordination source without importing or merging unrelated V3-base changes. A fresh-process dependency allowlist test verifies that independence.

## Implemented behavior

- Strict bounded JSON data-copying rejects unknown fields, private/person fields, duplicate IDs, accessors, inherited/custom prototypes, prototype keys, symbols, cycles, sparse arrays and extra array properties. Input/catalog/request failure returns bounded reason codes without raw errors or private payload echo.
- Catalog, source and claim hashes bind exact synthetic versions and metadata. An independently pinned **synthetic fixture verifier** must confirm source/claim target hashes, receipt hashes and approval generation. Local `approved` metadata or recomputed hashes alone supply no authority.
- Intake, participant, outsider and unknown-speaker sources are held. Missing attribution/approval, wrong source/version/hash, revoked/superseded state, missing educational scope, case scope, unsupported rule kinds and unresolved conflicts cannot enter supported results. A resolved conflict requires a pinned decision receipt. Unused source holds are visible in validation.
- Retrieval matches the approved fictional Driver/topic exactly; it never falls back to unapproved content or a network search. Results sort by claim ID and obey a bounded limit. Any matching held claim suppresses that topic, including a valid hit beside a conflicting/held item. Claim or request safety flags and clinical/dosing intents return `safety_hold`.
- Source text is returned verbatim as `contentType: untrusted_source_text`. It is never interpreted as HTML, code, tool instructions or approval authority. Future consumers must retain that boundary and render text safely.
- Requests reject client/person/assessment/report/answer/session/organization/tenant/approval payloads and arbitrary free-text query fields. Only `fictional_reviewer` is admitted; all real Coach/Client/Family audiences and case operations are unavailable.
- Every result declares `fixtureOnly=true`, `productionEligible=false`, `persisted=false`, `issued=false`; results include a deterministic integrity hash. All inputs are copied; no source, claim, receipt or approval state is mutated.
- Production, trusted and real-source modes fail before catalog processing or verifier invocation because the authenticated registry is unavailable. There is no cache, persistence, I/O, telemetry, database, network, model/tool call or state-transition API in the adapter.

## API and hashing contract

Exports: `VERSION`, `CATALOG_SCHEMA`, `REQUEST_SCHEMA`, `LIMITS`, `fingerprint(value)`, `validateCatalog(catalog, options)`, `lookupEducational(catalog, request, options)`.

Call options must be an ordinary data object with explicit `mode: fictional-preview`. Optional `fixtureVerifier` is a **synchronous caller-owned fixture callback**; it is not sandboxed or a real authentication mechanism. Without it, any claim needing approval is held. Async verifier results, malformed returns and thrown errors are held. A caller can deliberately fabricate a verifier; the output remains fictional and production-ineligible in every mode.

`fingerprint` is a bounded canonical JSON SHA256 integrity helper, not an approval/signature function. It throws a bounded rejection for unsafe/oversize values; the two validation/lookup entrypoints catch input rejection and return typed results.

| Object | Required fields / scope |
| --- | --- |
| Catalog | `schemaVersion=coach-companion-fictional-catalog-v1`, `dataClass=fictional`, `version`, `foundationHash`, `approvalGeneration`, `sources`, `claims`, `sha256` |
| Source | `id`, `version`, `sha256`, `dataClass=fictional`, `category`, `speakerStatus`, `attributionReceiptHash`, `approval`, `conflict`, `audiences` |
| Claim | `id`, `sourceId`, `sourceVersion`, `sourceHash`, `dataClass=fictional`, `driver`, `topic`, `kind`, `text`, `locator`, `sha256`, `approval`, `conflict`, `scope`, `clinicalProtocol`, `safetyHold`, `audiences` |
| Approval | `state`, `receiptHash`, `targetHash`, `generation`, `scopes` |
| Conflict | `state=none/unresolved/resolved`; optional `decisionReceiptHash`, required to admit resolved conflict |
| Request | `schemaVersion=coach-companion-fictional-request-v1`, `dataClass=fictional`, `operation`, `catalogVersion`, `catalogHash`, `approvalGeneration`, `audience`, `driver`, `topic`, `intent`, `safetyHold`, `limit` |

Only fictional-prefixed source/claim/version IDs are accepted; claim text must start `SYNTHETIC ONLY:`. Driver IDs use the existing twelve stable identifiers, enumerated locally without importing/changing the V3 foundation. No display names, source curriculum, rule wording or individualized methodology is generated. `operation=educational_lookup`, `audience=fictional_reviewer`, `kind=education` and `scope=global` define the implemented supported slice. Other recognized rule kinds are held; clinical/dosing intents are held. Extra keys are rejected, not ignored.

Canonicalization sorts object keys lexically and preserves array order. Definitions:

1. Source approval target = SHA256 of the entire source except its `approval` member. This binds its recorded byte hash, source version, category, speaker/attribution, audience and conflict metadata.
2. Claim `sha256` and approval target = SHA256 of the entire claim except `sha256` and `approval`. This binds text, locator, source/version/hash, Driver/topic, scope, kind and safety/conflict metadata.
3. Catalog `sha256` = SHA256 of the entire catalog except its own `sha256`. The request must pin this hash, catalog version and approval generation exactly.
4. A verifier receives a frozen synthetic metadata record `{fixtureOnly, kind, id, targetHash, receiptHash, generation}` and must return exactly `{fixtureOnly:true, verdict, targetHash, receiptHash, generation}`. The tests capture expected pins independently before mutating test input. `revoked`/`superseded`, mismatches and unavailable/rejected decisions hold.

Limits: 256 KiB canonical serialized JSON (including escaping), 6,000 nodes, depth 12, 32 keys/object, 256 elements/array, 4,096 UTF8 bytes/string, 32 sources, 128 claims, 2,048 UTF8 bytes/claim text, 160 bytes/locator and at most five results. Caps are independent upper bounds, not a promise every maximum can be combined. Serialized JSON data is the intended input; copying rejects getters/custom prototypes but does not sandbox active JavaScript proxies or the injected callback.

Validation statuses: `valid_catalog`, `held_for_review`; output lists accepted fictional claim IDs, held claim reasons and held source reasons. `valid_catalog` means the bounded fictional catalog passed its fixture checks, not real approval or source completeness.

Lookup statuses: `supported_education`, `no_approved_support`, `held_for_review`, `safety_hold`. Supported results include exact text plus source ID/version/hash, claim hash, locator and both receipt hashes. Results also pin the catalog/foundation/approval generation. Held content and raw errors are never returned. Missing topic support yields `no_approved_support`; a relevant held claim yields a hold rather than hidden fallback.

## Actual acceptance evidence and CP matrix

Run: `node --test --test-reporter=tap tests/coach-companion-catalog.cjs`, Node `v24.20.0`. Final output is saved in `node-tests.tap`; machine-readable outcome and preserved hashes are in `handoff.json`. **87 tests passed, zero failed/skipped/cancelled.** `node --check` passed for both code/test files and `git diff --check` passed. No external dependency install was needed.

First run: 83/85 passed; two test helpers tried to build synthetic verifier pins from intentionally malformed inputs before calling the adapter (null approval and oversized text). The fixture setup now captures verifier pins before corruption. Corrected run: 85/85 passed. Two additional aggregate-byte/active-object failure cases were then added, and all 87 passed. These were local test-setup failures, not production incidents; no failed run is represented as passing.

| Prior proposal | Actual fictional coverage | Boundary that remains unverified |
| --- | --- | --- |
| CP-01 | Exact supported educational text; deterministic citations/catalog pins | No real source authenticity |
| CP-02 | Intake, anecdote/participant, outsider, unknown attribution rejected; relevant held item blocks topic; unused source hold visible | No corpus review or source promotion |
| CP-03 | Changed source hash/version/text, missing source, duplicate IDs, envelope/request pin mismatch and unsupported nested manifest rejected | No archive transfer/manifest completeness verification |
| CP-04 | Missing verifier, forged target/receipt/generation, rehashed forgery, malformed/error/async callbacks; production/trusted modes denied before verifier | Synthetic verifier only; no authenticated registry |
| CP-05 | Embedded tool/approval/HTML instructions returned only as inert marked text; no code execution | No LLM/browser consumer integration |
| CP-06 | Pending/revoked/superseded local or verifier states, generation changes and stale requests blocked; adapter has no cache | No actual registry revocation or live cache |
| CP-07 | All seven non-education rule kinds, unsupported sequence/mission, source/claim conflicts, missing resolved-conflict receipt, missing attribution, unapproved source scope and assessment scope held | No founder decisions invented |
| CP-08 | Clinical/dosing requests held before callback; request/claim safety and clinical-protocol flags suppress output | No semantic medical safety classifier or real human escalation |
| CP-09 | Private/person/free-text fields rejected including nested fields and getters; no payload returned | No de-identification guarantee for mislabeled arbitrary source prose |
| CP-10 | Real Coach/Client/Family/other audience, missing audience, tenant/person fields and case operations rejected | No live Auth, organization isolation or RLS certification; there is no account integration |
| CP-11 | Empty catalog/no matching topic or Driver, null/malformed catalog, verifier failures yield bounded statuses | No provider/network behavior; adapter has no provider |
| CP-12 | Stable frozen result/hash, unchanged inputs, sorted bounded results; fresh process admits only Node built-ins | No deployed end-to-end journey |

Additional actual negative tests cover non-JSON/custom prototypes, inherited state, symbols, accessors, cycles, sparse/augmented arrays, prototype pollution, missing/malformed scopes, nonfictional markers, limits on strings/bytes/depth/collections/results and unsafe option objects. No previous 42-engine checks were repeated.

## Security, limits and integration risks

The fixture verifier, `dataClass`, ID prefix and synthetic text marker do not authenticate real people, approval or absence of PHI. The module is not a sandbox for a hostile callback/Proxy and cannot prove raw source-byte integrity because raw sources are not accepted. Catalog integrity and independently pinned fixture receipts are deliberately distinct from real authentication. Explicit flags/intents are enforced; no natural-language clinical classifier is claimed. Consumers must not render source text as HTML or pass it as higher-trust instructions. These limits make this an isolated testable component, not a production security boundary.

No real-source ingestion, source approval, worker/report generation, scoring, PDF, delivery, permission/grant/recovery/consent, migration, push, PR or publication action occurred. Source custody, current MK10/full Holistic Clarity versions, 113-item approvals, speaker provenance, authentic receipt registry, founder conflict/safety decisions, Coach Companion role policy and retention remain unresolved from the prior preparation. Existing V3 source pins and scoring/voice/runtime files remain untouched. Shared CURRENT_BUILD_STATE and registers were not edited because write ownership is exclusive to the assigned new paths; the Master owns their summary.

Local commit uses skip-CI/skip-Netlify markers and contains only new owned files. Its exact SHA is returned separately to the Master (a file inside a commit cannot embed that same commit's hash). No push is authorized or performed.

## Handoff and next safe action

COMPLETED: bounded fictional validator/lookup and negative acceptance suite.

CHANGED: the new pure module, new tests and this wave2 evidence directory only; no migration or shared contract activation.

TESTED: 87 final fictional tests; syntax checks; new-files-only review; preserved engine/config/test hashes; built-in-only dependency smoke. No browser/live/database/real-authority tests claimed.

SECURITY: fail-closed production mode, strict non-person schema, source/scope/version/conflict/safety gates, inert source text and no module I/O. Real authentication and account/RLS boundaries remain absent.

DOCUMENTATION: this report, final TAP evidence and machine-readable handoff. The Master can summarize the verified-local result in its authorized build state.

UNRESOLVED: genuine approval registry/source decisions and live audience/safety/retention/integration policy. Real-source retrieval and production authority remain unavailable.

NEXT RECOMMENDED BUILD: independent QA of this new-file-only patch on the coordination base; then reconcile source manifest and authenticated approval-registry/audience contracts before separately assigning any live integration. Do not promote intake or alter the protected Roadmap lane.

CHAT HANDOFF: “Issue #57 Wave 2 now has a detached fictional catalog-envelope validator and exact educational lookup adapter with 87 passing local tests across CP-01–12. Only new owned code/tests/docs changed; existing V3 source/engine/config/worker remains preserved. Synthetic receipts never authenticate real approval, and production/trusted modes always deny. The patch is independently reviewable on the coordination base using Node built-ins. Actual source custody, scoped founder approvals and live Coach Companion permissions/safety/retention remain separate decisions.”
