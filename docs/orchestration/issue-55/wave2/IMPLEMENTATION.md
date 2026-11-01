# Issue55 Wave2 — local nonfinancial Share Center slice

Status: implemented and tested locally; not activated, published or complete Academy/affiliate acceptance. Base `fc6737415da36b4306afa0060a525eca2f1131ca`, branch `codex/rva-wave2-affiliate-20261101`, native lane `/root/affiliate_finance_audit`. Exact committed SHA is returned in the lane completion; EVIDENCE.json pins implementation/test bytes.

## Completed behavior

`js/rva-affiliate-share-contract.cjs` exports an opt-in CommonJS contract with no auto-registration, portal loader, storage, database, network, financial or messaging I/O. It reuses existing `user_id`, `contact_id`, `referral_code`, `referral_profile_status` and `share_url` profile fields. It creates no new identity or backend.

- `shareIntent`: validates own active profile, exact approved destination, current campaign/creative/copy revisions, channel, market, disclosure and availability/revocation. Produces bounded approved plain copy for email/SMS/DM/social, approved asset URL, personalized referral URL and exact QR input. Asset kinds image/video/PDF are supported as metadata, not rendered/downloaded content.
- `projectReferral`: projects only referral ID and consented generic stage under a current viewer/subject-bound disclosure snapshot. Names, contact details, answers, notes, rewards and arbitrary metadata never enter the result. Even a converted stage requires explicit allowed disclosure; no health-specific status is accepted.
- `recordTouchpoint`: an immutable, bounded in-memory reducer for share-created, share-clicked and appointment-booked evidence, with explicit tracking consent and existing affiliate identity/scope. Repeated producer/event/type keys are no-ops; changed attribution conflicts; malformed duplicate prior state fails. No financial event, earning or qualification is supported. Reprojects historical input to avoid carrying private extra fields.

The only existing runtime integration change is `portal/portal-referrals.js`: the failed-load server error is displayed with `textContent` in a newly created `.empty-state` div. This replaces the old interpolated `innerHTML` sink while preserving message and container styling.

## Trust and activation boundary

All approval, authentication, ownership, scope, consent, clock and URL-policy inputs are **contracts from a reauthorized server snapshot**, not authority granted by this utility. Passing browser booleans is not real authentication or an approval receipt. No RLS/signature/receipt verification, durable consent service, server race/transaction enforcement or tenant backend was added. A future integration must independently authenticate, reauthorize and reload current records, verify immutable approval receipts, enforce the same checks server-side and persist events atomically. This module must not be wired to live data by merely setting enabled=true.

The current slice is explicitly authorized as fictional local implementation; this does not resolve the earlier source/architecture gates for an activated product. No approved RVA campaign, agreement, compensation amount, credit policy or tracking/disclosure rule is invented: every new campaign, consent and destination in tests is visibly fictional and uses `.invalid` URLs. Stale browser snapshots cannot provide production authority. Scope_id is a caller-owned namespace for isolated event evidence, not a new tenancy migration.

The new module is not imported by any portal HTML/script or public allowlist. No navigation, build manifest, API, Function, schema, role, grant or financial control changed. Existing privileged financial UI remains unchanged. No activation flag, production payload or caller was added.

## Actual verification

The browser suite runs exact baseline portal source from the pinned base and the changed source in fresh pages. A fictional error containing an image/onerror element was interpreted as DOM and executed its marker in the baseline. Changed source creates no image/handler and shows the exact payload as literal text. This demonstrates a reachable unsafe HTML sink under an adversarial mocked server message; it does not assert a production exploit or a current attacker-controlled server error.

Chromium and WebKit each run at 1440, 768 and 390 CSS pixels: six passing test cases. Each includes baseline reproduction, fixed staff error display, and a standalone fictional share/CRM form using the actual module. Four channels prepare/select plain copy and exact personal QR payload; creative revocation and wrong-account attempts clear copy/QR/CRM. Zero unexpected page errors and zero external requests are asserted. Network routes are intercepted. The fixture is not a production Share Center UI or visual-design acceptance.

**QR payload only:** no QR encoder, image rendering or QR decode acceptance. **Copy preparation/selection only:** no operating-system clipboard write, email/SMS/DM/social send or media download. The module returns asset metadata; it never fetches assets. No new production user flow is exposed.

Initial browser attempt failed before assertions: bundled Playwright expected unavailable Chromium1234 and WebKit launch was sandbox-blocked. The successful run used the already-installed Chromium1248 executable via a test-only environment override and authorized out-of-sandbox isolated browsers. No package/browser download or user profile was used. Final BROWSER.tap records all six cases passing against final source bytes.

UNIT_REGRESSION.tap records the final new contract suite and selected existing assessment/session regressions. EVIDENCE.json records exact test counts and limitations. Syntax and whitespace checks pass. No database, RLS, Auth-provider, current production, merchant or payout test ran.

## Running checks

From repository root, Node24:

```
node --test tests/wave2-affiliate/share-contract.test.cjs
node --check js/rva-affiliate-share-contract.cjs
node --check portal/portal-referrals.js
```

Browser suite requires the environment's Playwright package and installed Chromium/WebKit. Set NODE_PATH to the bundled package directory; if its expected Chromium revision is absent, set RVA_TEST_CHROMIUM_EXECUTABLE to the installed headless executable, then run:

```
node --test tests/wave2-affiliate/browser.test.cjs
```

No network access is needed by tests; browser launch may require the host's normal sandbox exception. Never point these fixtures at a hosted session.

## Integration and QA57 mapping

QA_PACKAGE_MAPPING.json retains all 57 package IDs from Issue56's existing matrix. A02–A05 receive only explicitly named local subsets, not full package PASS; all other integrated journeys remain unexecuted here. A03 still lacks actual QR rendering/decoding, live approved-media selection/download and an authenticated production interface. A04 lacks competing attribution, lead merge and settled enrollment. A05 lacks AI/support/export/telemetry boundary tests. A02 lacks application/agreement/dashboard onboarding. A06/A08/A09/P01/P02 financial acceptance remains NOT_RUN. 100 sequential duplicate click reductions are not a concurrency or durable exactly-once claim.

The original 127 trace and Phase0/history documents are unchanged. All127 controlling sections remain missing. Full advanced application/agreement/Share Center/CRM/AI/commissions/credits/points/recurring/ledger/payout/currency/Owner-control scope remains required; this nonfinancial slice does not redefine it as an MVP. RVA remains single-level; optional MLM/genealogy/ranks stay OFF; coach compensation remains separate. Alex private issuance and other protected systems were not touched.

## Next slice and handoff

Integrator/WS02/03/08 should review the utility's input and current-approval receipt contracts, agree minimal disclosed statuses and server-owned consent/policy sources, then separately authorize an authenticated adapter and approved QR renderer/decoder with scoped persistence tests. No such wiring is cleared by this local package. Financial business decisions, current provider/operational proof and missing original requirements continue independently; do not hold unrelated Academy lanes.

Rollback: omit the unreferenced module and tests; revert only the small portal safe-text commit if necessary. No records, events, credentials or grants require cleanup. Prefer retaining the safe-text repair.

COMPLETED: functional opt-in eligibility/link/copy/privacy/evidence code and existing DOM sink repair. CHANGED: two runtime files, fictional tests and this owned documentation directory only. TESTED: contract negatives, duplicate replay and isolated cross-browser fixture/error flows plus selected regressions; exact counts in EVIDENCE. SECURITY: safe DOM sink, URL/ownership/consent checks and privacy projections; no fresh RLS or real auth claim. DOCUMENTATION: local package, 57-case mapping and evidence only; shared CURRENT_BUILD_STATE is integrator-owned and unchanged. UNRESOLVED: source/approvals/authenticated adapter/durable events/QR/media/financial journeys. CHAT HANDOFF: useful nonfinancial code is locally tested and unactivated; full advanced completion and all sensitive authorities remain independently gated.
