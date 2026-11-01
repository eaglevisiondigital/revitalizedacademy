# Wave3 unaffected engineering — local QR/share and operation fixtures

Issue55/native lane `/root/affiliate_finance_audit`; branch `codex/rva-wave3-unaffected-20261101`; accepted base `fad394ef683b711ba34866ec614bed71a26cee93`. Final local commit SHA is returned in the handoff message; EVIDENCE.json pins source bytes. No push or activation.

## Implemented

`tools/affiliate-share-preview/` is an actual local fictional Share Center preview. Its loopback-only server calls the unchanged Wave2 share contract with the existing fictional identity/profile fixture, replacing destinations with `academy.synthetic.invalid` and `media.synthetic.invalid`. A user selects channel and fixture state, prepares approved fictional plain copy, manually selects it and sees a real QR PNG encoding the exact personalized URL. There is no live navigation, clipboard write, mailer, provider, asset download, persistence, financial action or production loader. No real approval or authentication is claimed by a fictional snapshot.

QR encoding uses installed ReportLab4.4.9's QRCode implementation with medium error correction and a four-module quiet zone; installed Pillow12.3.0 writes PNG bytes from its actual matrix. This is not an illustrative/hash barcode. The independent oracle is macOS Vision's QR detector in the small Swift test source. Neither the decoder nor its expected result comes from ReportLab. Four channel PNGs and six actual browser-rendered QR screenshots decoded to the exact expected URLs. Only local generated PNGs were read by Vision.

Creative revocation/expiry/account mismatch clears copy, URL and QR immediately. Channel/state changes invalidate pending preview results, so a late active response cannot restore a revoked or different-account preview. Browser requests are restricted to the loopback server; outside requests are blocked and asserted absent. Server rejects foreign Origin/Host, arbitrary payload fields and unknown paths; CSP limits scripts/connect to self and images to data. It is a finite fictional tool, not a secured production backend. No posted caller URL or real identity can replace its fixed fixture.

## Approved narrow member handler fix

Actual `member/member110.js` fixture execution reproduced a weekly-check-in race: after awaiting getUser, an account switch cleared currentMember; the handler then read contact_id from null. The baseline issued no write but threw. Master reviewed the existing dashboard task contract and explicitly authorized only this handler to change.

The handler now captures identity, epoch/run, member IDs and template before the await; verifies the current task and actual returned user before insert; and rechecks the task after insert before updating status/reloading. Null, wrong-user and error responses stop before write. Same-user token renewal preserves the pending operation. An already issued fictional write is not cancelled or replayed after logout; its late completion is ignored by the ended document. The server remains responsible for authorization/idempotency. No Auth, role, RLS, API, table or policy changed. Other goal/habit/progress handlers remain unchanged.

## Actual tests

- 15 QR/preview cases PASS: six Chromium/WebKit cases at1440/768/390 CSS pixels with independent Vision decode of screenshots; four independent direct PNG channel roundtrips; three revoked/expired/wrong-account holds; invalid selection; loopback Origin/arbitrary-input denial.
- 17 member-script cases PASS as assertions: one retained expected BASELINE TypeError reproduction;16 current success/required/denial/duplicate/stale-response checks. Actual full member script and dashboard DOM execute against explicitly mocked transport. Goal/habit payloads, required weekly response, current-member fields, wrong-actor42501 error display, duplicate23505 display, null/wrong/error identity, switch/logout before/after write and same-account refresh are covered. A simulated server denial is not backend/RLS proof.
- Eight new detached V3 regressions PASS against the unchanged catalog tool: two-driver provenance, audience separation, source swap, scope restriction, generation/old verifier, intake hold, real/private input hold and inert instruction-like text. All text/receipts are invented; fictional verifier results are not approval receipts. No113sources, founder source, source engine/config or worker was changed or processed.
- Total40 test assertions/cases:39 current bounded passes plus one expected baseline defect reproduction. OPERATIONS_V3.tap records25 cases. QR_RESULTS.json records the successful15-case runner result and exact decoder outcome; independentQA should rerun the source tests, not treat a receipt as execution.
- Three syntax checks, whitespace, source hashes and owned-path checks pass. No database, RLS, provider, production or real-client acceptance test ran.

Initial Vision decode failed inside the framework sandbox; the same exact generated PNG decoded successfully after approved isolated native-framework execution outside it. No dependency download/install was performed. Browser/decoder runs used no user browser profile. Swift cache and generated PNGs are test-temporary only; no compiled binaries or raw sources were committed. DEPENDENCIES.json records local versions, license provenance and relevant implementation hashes.

## Reproduction

Use the bundled Python runtime with ReportLab/Pillow and installed Playwright/Chromium/WebKit; no network is needed. The Python override is test/tool configuration, not a credential:

```
RVA_PREVIEW_PYTHON=/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 node tools/affiliate-share-preview/server.cjs
```

Open only the printed127.0.0.1 URL. Stop the process when review ends. Tests start/stop their own ephemeral servers.

```
node --test tests/wave3-unaffected/member-operations.test.cjs tests/wave3-unaffected/v3-regression.test.cjs
RVA_PREVIEW_PYTHON=/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 node --test tests/wave3-unaffected/qr.test.cjs tests/wave3-unaffected/preview-browser.cjs
```

Native Vision and browser launch may need the host's normal sandbox exception. No hosted session/project is a fixture input. Swift/macOS is required for this independent decoder; absence is a concrete test prerequisite, not permission to replace it with a fake decoder. Optional test overrides: RVA_PLAYWRIGHT_PATH, RVA_CHROMIUM_EXECUTABLE, RVA_SWIFT_CACHE. There is no runtime encoder download fallback.

## QA scope and remaining gates

QA_PACKAGE_MAPPING.json retains all57 package IDs. A03 gets real local QR roundtrip/UI evidence but still lacks live approved content, authenticated adapter, media download and delivery. J10 gets member goal/habit/checkin operation/race evidence but not full coach operations/backend security. R03 gets detached fictional regression evidence but not V3 knowledge promotion/production approval. Zero full macro packages are newly passed by this lane. Existing two SQL findings remain separate and are neither repaired nor recertified here.

No changes to the original127 trace, Phase0 source/history, existing share helper or existing V3 tool. Full advanced affiliate scope remains; all127 original sections still missing. Single-level RVA, MLM/genealogy/ranks OFF, coach compensation separate, financial/credits/payout decisions pending. No49-day, minor or marketing policy was selected. Alex private issuance remains untouched.

COMPLETED: genuine fictional QR share preview, independently decoded rendered output; approved weekly-checkin race repair; actual operation and detachedV3 regressions. CHANGED: owned tool/tests/docs and exactly one approved member handler. TESTED:40 named bounded cases, including retained baseline reproduction; no live/SQL security claims. SECURITY: clear stale results, safe output, loopback/input boundaries and task/identity checks; backend remains authoritative. DOCUMENTATION: local report, dependency/decoder evidence and57partial mapping; shared currentbuild remains Master-owned. UNRESOLVED: complete original sources, current operational/security gates, authenticated product integration and advanced financial journeys. NEXT: independentQA reproduces this exact commit; then separately scoped authenticated adapter/media/consent integration and remaining member/coach acceptance. CHAT HANDOFF: meaningful unaffected engineering progressed; no project-wide or sensitive activation was inferred.
