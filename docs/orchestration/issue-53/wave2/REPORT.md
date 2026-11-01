# Wave 2 / Lane A / Issue 53 — explicit Client dashboard mount

Status: **VERIFIED-LOCAL; production build integration and release held**. Date: 2026-11-01.

Issue: https://github.com/eaglevisiondigital/revitalizedacademy/issues/53. Master: Issue 58, chat `01a0df6c-7089-7d21-9318-865f54ca8100`.

Worktree: `/Users/davesmacbookpro/Documents/ChatGPT/revitalized academy/academy-wave2-architecture`.
Branch: `codex/rva-wave2-architecture-20261101`.
Exact base: `fc6737415da36b4306afa0060a525eca2f1131ca`.
Implementation commit: **`38c16c9baeaa013e867e1230d775c179e91410e4`**, local only, with `[skip ci] [skip netlify]` markers. A subsequent issue-local documentation commit carries this report/evidence; implementation code is unchanged by that commit.

## Completed and contract

The current source `/member/` and `/member/onboarding/` both mount the Enrollment & Signature Center through `onboarding.js`, not `member110.js`. Master independently confirmed those public routes at `2026-11-01T13:46:11.832Z`: HTTP200, same3209bytes/SHA256 `bf672eb1bb5f936a6fc34e7b76517bc3f21efb89dbfb8d96a13347e07dcbf423`, runtime-config/environment/SDK2.57.4/onboarding scripts. Evidence: workspace-root `deployment-evidence/2026-11-01-wave2/PUBLIC_MEMBER_MOUNT_READ.json`. This lane read that public receipt; it did not contact production.

Historical Git source `670bd73c35e3c2330bedca5ca4240b55047e7075` (`54d3cb9^`) supplies the complete existing `rm-*` member shell. Its member script and CSS are identical to the pre-change canonical-source versions. Restored that compatible shell as **`/member/dashboard.html`**, retained the existing member CSS, exact approved logo and pinned SDK reference, added clear enrollment links and changed only the dashboard script cache reference to `v193` for the bounded guard fix.

| Route | Contract after this local change |
| --- | --- |
| `/member/` / `member/index.html` | Existing enrollment/signature HTML and script, with only one added accessible link: “Open Member Dashboard” → `/member/dashboard.html` |
| `/member/onboarding/` | Byte-identical existing enrollment/signature entry; private invitation/claim/signing behavior unchanged |
| `/member/dashboard.html` | Explicit dashboard entry, 283 unique IDs matching all271 literal DOM targets used by the existing script; no blind script injection into signing DOM |
| Dashboard sign-in/denied screens | Explicit links back to enrollment; active access is still determined from existing server views, never from the link |

The new path is deliberately **absent from `config/production-public-files.json`**, which is reserved to Master. No deployment artifact was built. A future integration must add the reviewed path, preserve current approved static overlays/all13 Functions and routes, verify hosted pretty-URL behavior and existing cache headers, then obtain its separate exact release authorization. This source change is not currently a published dashboard.

## API, design and authority boundaries

No new endpoint, role, permission, schema, credential or Auth/session persistence store was added. Existing Supabase client and server contracts remain authoritative. The loader still calls the existing29 queries (bootstrap, own dashboard/entitlements/household/journey/goals/habits/assignments/progress/content/connections/community/refuel/documents/coaching/companion/health views), with existing conditional check-in field/current-week reads. API names and payloads are unchanged. `my_member_dashboard.access_status === "active"` remains the existing client display gate; all queries still require real server RLS/authorization. A client-side display gate does not authorize or secure their data.

The historical dashboard includes existing feature surfaces and content placeholders. Mounting it does not certify Client/Coach/Family/Affiliate completeness, enable entitlements, adopt a49-day curriculum or approve paid access. PWA manifest start routing remains unchanged and is not certified as a dashboard installation experience.

`member/member110.css`, all shared portal/Auth/CSS/build files and approved asset bytes remain unchanged. The five approved asset identities and existing13-input surface/Founders-overlay checker pass. The preserved member surface remains emerald `#154734`, cream `#fcf5ee`, gold `#b18845`; no global token normalization or new design was introduced. Fictional Chromium390 and WebKit1440 screenshots were visually inspected; Master separately inspected320/1440. This is scoped visual review, not full pixel/a11y certification.

## Bounded session correction

Reproduced the dormant script's actual bug in both browsers: a pending initial dashboard load finishes after `SIGNED_OUT` and makes the old dashboard visible again. The unpatched script was loaded from exact base Git bytes into the new compatible shell with fictional transports; both expected defect reproductions passed.

Master then explicitly cleared these changes in the owned `member110.js` only:

- Local session epoch and load sequence reject stale dashboard completions after the29-query batch, conditional check-in fields, current-week check-in query and final render boundary. Initial `getSession` completion/error is also epoch checked; an obsolete load error cannot override a newer loader run.
- Actual logout or established identity change clears member caches, current/private form DOM and overlays before a same-route fresh-document navigation. Sign Out clears immediately before awaiting SDK logout; a logout transport failure stays on a neutral cleared document.
- Same-account `TOKEN_REFRESHED` preserves workspace and unsaved form values. Ambiguous null `INITIAL_SESSION` does not trigger reload loops. No token or role is copied/reissued.
- Appointment/session display data arrive through the existing bootstrap batch; late appointment/bootstrap completion is tested with account switch. No separate calendar loader exists in the inspected member script.

This is a loader/document-lifecycle correction, not a full member or portal security audit. Existing action-specific write, upload, course, messaging, referral and booking functions are not independently certified here. Real server Auth/RLS/private storage and actor/contact authorization remain untested by this lane. A fresh-document boundary clears obsolete UI/cached references; it is not a claim to erase already delivered user data or revoke backend credentials.

## Tests actually performed

| Evidence | Final result |
| --- | --- |
| `node --test tests/wave2-architecture/contracts.test.cjs` | **4PASS /0FAIL /0BLOCKED**: signing-only delta, complete/unique dashboard DOM, exact existing CSS/5 assets, reserved build/Auth/shared paths unchanged |
| `node tests/wave2-architecture/browser.cjs` | **36PASS /0FAIL /0BLOCKED** across Chromium/WebKit: 34 patched cases plus2 expected baseline defect reproductions |
| `node --check member/member110.js` | PASS |
| Existing `docs/orchestration/issue-53/validation/validator.cjs` | PASS_LOCAL_OBSERVATION;13 exact public input hashes match, no findings; live/pixel/computed/production flags false |

Browser coverage: actual normal-route HTML/CSS/application scripts;320/390/768/1440 widths with no page horizontal overflow; logout during bootstrap, check-in field and current-week loads; pending Auth result after logout; pending bootstrap/appointment result after account switch; established A→B replacement without A content; immediate cleared DOM before navigation; same-user renewal with unsaved form; ambiguous null initial Auth event; missing membership, permission-query denial and session-lookup failure; explicit sign-out; and enrollment→dashboard→enrollment with an actual `onboarding.js` fictional agreement submission preserving signer role and immutable expected hash.

Every browser request is intercepted. Actual HTML/CSS and baseline/patched application scripts run; the SDK client, Auth events, query results and signing RPC are fictional adapters. External SDK download is replaced with the preinstalled fixture, not exercised against GoTrue/PostgREST. No private data, real provider call, production write or real signature exists. All tests use invented identities, agreements and amounts. No real paid/access decision is inferred.

Initial harness corrections: one static test hit Node's1MB `execFileSync` buffer while comparing the2.2MB approved portrait; the fixture limit was raised and all4 tests passed. Bundled Playwright's default Chromium revision was absent; reused installed Google Chrome and existing WebKit as prior project harnesses do. Sandbox browser startup was blocked; the authorized fictional-only test runner succeeded with reviewed browser-process escalation. Initial30-case browser run passed; pending-Auth/appointment/null-initial/signing checks were then added for the final36-case run. No runtime defect was hidden by those harness fixes.

Exact source/test/receipt hashes, Node/Playwright versions and historical provenance are in `INPUTS.json`; complete browser outcomes in `BROWSER_RESULTS.json`; static/checker stdout and hashes in `CONTRACT_RESULTS.json`. Eight screenshots contain fictional data only. All test artifacts are within this lane's owned paths.

At independent QA's request, the subsequent documentation commit adds a one-line test-runner output override: `RVA_WAVE2_A_OUTPUT=/absolute/qa/evidence node tests/wave2-architecture/browser.cjs`. The default output location is unchanged. Runner SHA256 is now `18794d7e096ad55add64e6e36a40063c07fc66ddbc00cba9e613702f172e168b`; syntax check passes. `INPUTS.json` distinguishes the runner hash actually used for the36-case execution from this output-only follow-up. Runtime remains exact38c16c9; independent QA can avoid overwriting author receipts.

## Mapping to the57 QA packages

No global QA case is marked complete by this lane. The following are **partial local evidence** for independent Issue56 review; all remaining requirements/provider/DB/role/full-journey checks stay unexecuted.

| QA package | This slice's evidence / remaining gap |
| --- | --- |
| S01 approved assets/overlay identity | Existing CSS/logo/5asset byte preservation and13-input checker; later actual release artifact preservation remains gated |
| J04 agreement and independent signature | Actual existing signing script issues fictional own-signer/current-hash RPC through unchanged root route; real identity, server signing, second adult and RLS unverified |
| J05 verified account/onboarding hold | Enrollment route and adapter-rendered held state preserved; real verification/claim/payment transition not tested |
| J10 reachable member/coach operations | Client mount and own-display path verified locally; Coach operations and complete program flow remain separate LaneB/QA scope |
| N03 isolation | A→B UI document boundary and stale data suppression tested; no cross-client/organization database denial or tenant-model claim |
| N06 paid-access denial | Missing context, denied entitlement query and failed Auth lookup keep dashboard hidden; server unpaid/suspended/cancelled enforcement remains unverified |
| O02 responsive/mobile account journeys | Four viewport widths in two engines, signing roundtrip, refresh/logout; full accessibility, native device, PWA and hosted Auth acceptance remain open |

## Preservation, rollback and next gate

Only six code/test files are in the implementation commit: `member/index.html`, new `member/dashboard.html`, `member/member110.js`, and three files under `tests/wave2-architecture/`. Evidence/docs are under `docs/orchestration/issue-53/wave2/` only. No shared build/register/migration/Auth/portal/payment/report files, assets or production controls changed. Previous worktrees remain preserved.

Local rollback: revert implementation commit `38c16c9baeaa013e867e1230d775c179e91410e4` to remove the explicit dashboard/link and restore the prior dormant script; retain sanitized evidence as historical context. No SQL/backend/grant rollback is needed. This does not authorize restoring obsolete deployed artifacts or changing the live site.

Next independent slice: Issue56 reproduces exact scripts from the local commit and reviews API/RLS fixture limits. LaneB consumes the explicit route/DOM contract through Master and can add bounded fictional Client/Coach operation tests without editing these owned runtime files. Master alone considers reviewed public allowlist/cache/PWA-route integration and later exact release. Full real Auth/RLS, live user acceptance and all57 business packages remain separate gates.

## Completion report / Chat handoff

COMPLETED: explicit locally reachable dashboard, preserved signing route, reproduced/fixed stale loader/document identity race.
CHANGED: six exact implementation/test files plus issue-local evidence/docs.
TESTED:4 static cases,36 browser cases, syntax and existing13-input checker pass; adapters and baseline reproductions identified above.
SECURITY: existing server identity/permissions unchanged; stale UI blocked; no live RLS certification or protected workflow action.
DOCUMENTATION: this report, `handoff.json`, input/receipt hashes and screenshots; Master owns aggregate current-build/register updates.
UNRESOLVED: production allowlist/route/cache acceptance, all real Auth/RLS/provider journeys, independent QA and broader business capabilities.
NEXT RECOMMENDED BUILD: independent Issue56 rerun, then separately cleared build-route integration and LaneB operation fixtures.
CHAT HANDOFF: Local dashboard mount is implemented/tested at38c16c9 with enrollment preserved. No publish or backend activation occurred; keep global acceptance statuses partial until independently tested and separately released.
