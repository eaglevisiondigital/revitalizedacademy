# Issue 53 — Architecture, design and identity discovery

Date: 2026-11-01. Status: **VERIFIED-LOCAL — isolated design validator only; runtime/integration clearance pending**. Initial discovery is complete. This is not a policy change, live certification or release approval.

Issue: https://github.com/eaglevisiondigital/revitalizedacademy/issues/53

Native specialist: `/root/roadmap_design_contract_audit`. Master: chat `01a0df6c-7089-7d21-9318-865f54ca8100`, Issue 58. Reports return through the native collaboration channel only.

## 1. Exact scope and provenance

| Item | Observed value / authority |
| --- | --- |
| Worktree | `/Users/davesmacbookpro/Documents/ChatGPT/revitalized academy/academy-architecture-design-core` |
| Specialist branch | `codex/rva-architecture-core-20261101` |
| Starting and current code HEAD | `3baef48590fbcd7955946bcc5e9988b7f88bf6b4` |
| Deployed source base / verified merge base | `10dec6682e7e87bf637482fc027e54c6800260e4` |
| Coordination branch named by Issue 53 | `codex/rva-master-orchestration-20261101` |
| Canonical deploy reference supplied by Master and coordination instructions | `6ae6b971e17bce85e37aa95c` |
| Current live verification | Not performed; production APIs, policies and provider configuration were not contacted |
| Default branch | Not adopted as a development or release baseline; current default-branch contents not independently audited |
| Permitted changes | This report, `handoff.json` and the three subsequently cleared `validation/` files, only under `docs/orchestration/issue-53/` |

Required worktree `AGENTS.md`, `docs/RVA_MASTER_ORCHESTRATION.md` and `docs/RVA_WORKSTREAM_REGISTER.md` were read before work. Issue 53's exact body was read with `gh issue view 53 --json number,title,body,url`. The first sandboxed request failed to connect; a read-only network escalation succeeded. No issue comment, push or PR was made.

Worktree `CURRENT_BUILD_STATE.md`, `ARCHITECTURE.md`, `SECURITY_MODEL.md`, `DECISIONS.md`, relevant lifecycle/payment migrations, application code, tests and build configuration were inspected. Those inherited documents contain historical LOCAL checkpoints. For current release status, the newest root `../CURRENT_BUILD_STATE.md` and Master's execution evidence take precedence over historical branch prose. No inherited document was rewritten.

No private source corpus, real client answers, saved private reports, recordings, credentials, grant execution, recovery, generation, deployment or live database operation was used. The protected continuation remains solely in Master's existing flow.

## 2. Canonical asset contract and the static-overlay trap

**Do not reconstruct approved Founders from this branch's raw page/CSS.** Published releases preserve an approved static overlay that differs from the inherited raw source. Local hashes establish the discrepancy; this is not a claim of a live regression.

| File | Inherited raw source SHA256 | Approved release-static SHA256 |
| --- | --- | --- |
| `founders.html` | `cf456836399c51f170a834aa159d545fb1bd809246fcbc6aafe9fa292dce7aec` | `9a55b56f816f6a1ed24385d9139cbcba72dd4f81bcce9fb75655d8ea987fc020` |
| `css/founders103.css` | `6d44fcc648333c74b9539011cd534a81ba7712ac1d2ee44c89d5bb15fa805089` | `43efe83bc2fd5b56d9fec4c13798894f435a4b2daca1ff72c040a0aba76b0034` |

Approved artifact files are at workspace-root `deployment-evidence/2026-10-21-founders-release-preflight/static/`, with publication evidence at `deployment-evidence/2026-10-21-founders-publication/COMPLETION_REPORT.md`. They contain the final live handwritten script, exact approved copy, final shield and no painted script underline. The approved CSS uses `Founders Handwritten` with the local OoohBaby font and preserves the portrait at natural ratio. Raw historical CSS still paints an underline and has older responsive rules. Frozen artifact copies remain evidence, not editable development sources in this assignment.

Existing approved assets, hashed in this worktree:

| Asset path | SHA256 | Proposed usage constraint |
| --- | --- | --- |
| `assets/images/justyn-elle-professional-approved-102.png` | `83719262d46ad793deccf87964549c4debadd7a51673267b818379098eec8816` | Exact 1348×1254 transparent formal portrait; no re-encoding, crop, mask, filter, distortion or fabricated image extension |
| `assets/images/revitalized-logo-dark-approved-v69.png` | `b00de1a2943bdf26cf70a265f3e2aef5614bdd59698724057f2efecffdcb3ba4` | Existing dark logo; preserve proportional geometry and original file |
| `assets/images/revitalized-logo-light-approved.png` | `23d5ed12350a7e8f960820a9c454f7a80a3c21d819c6c63eabddd8c49001eb0c` | Existing light logo on approved contrasting surfaces |
| `assets/images/revitalized-shield-approved-v69.png` | `b764c6dbed64e86fc1c78a4f8553086bbfde50102392f15e3566184c61193328` | Existing approved legacy shield; do not silently replace the final Founders watermark geometry with it |
| `assets/images/revitalized-shield.png` | `4c806b2646028c96ee50916e5fd43cecc76f2c6daeab1f1654e0477ddbd16933` | Owner-selected final Founders shape, rendered through the existing approved decorative mask |

The portrait was also visually inspected using the local image viewer; byte identity was checked in the earlier audit against the isolated V3 checkout. No replacement asset was generated. These are scoped inspected assets, not an assertion that every website image has been inventoried or approved for every context.

## 3. Proposed token and component contract

There is no single machine-readable shared token library in inspected source. Existing approved surfaces have related but different values. Preserve them as **named surface profiles** until Master/Owner reviews a consolidation proposal; do not globally normalize CSS.

| Surface / authoritative code | Existing values and conventions |
| --- | --- |
| Portal, `portal/portal.css:1` | Emerald `#154734`, deep `#0d3527`, bright `#239408`, cream `#fcf5ee`, gold `#b18845`, gold bright `#d8a62a`, ink `#17221d`, border `#dfe7e2`; Inter/system body, Georgia headings; radius 22px |
| Member, `member/member110.css:1` | Emerald `#154734`, deep `#0d3527`, cream `#fcf5ee`, gold `#b18845`, ink `#17221d`; existing `rm112-*` and later scoped components |
| Public legacy, `css/styles.css:1` | Bright green `#239408`, deep green `#0f5d1d`, cream `#fbfbf8`, gold `#e9a413`; retain actual page overrides and load order |
| HHL, `css/health-hope-live.css` | Scoped `--hhl-*` values and approved later emerald/gold CTA overrides; existing DM Sans/Playfair import is observed, not converted into a new font-hosting policy |
| Homepage mobile, `css/homepage-mobile-hero.css` | Only ≤600px, local DM Serif Display, subtitle gold `#f2c44e`; 18px first line, 19px existing name line; natural portrait ratio |
| Founders | Approved release-static CSS, not inherited raw CSS; responsive transition at 1100/1101px and small-screen rules at 520px |

Proposed reusable contract, for review before runtime extraction:

1. **BrandImage** means a named approved path/hash, native ratio and surface usage; it does not permit a visually similar substitute.
2. **Shell** retains existing public, staff and member navigation boundaries. One shell owner controls routing, menus, active state, Auth restore, logout and cross-account teardown. A Family/Affiliate label is not a new role grant.
3. **Action** retains semantic link versus button, keyboard activation, visible focus, disabled/pending/error state and exact existing destination. Reuse existing handlers; a UI state must not grant authority.
4. **Dialog** specifies role/label, Escape/close behavior, focus restoration, mobile scrolling and error announcements. Current implementations vary; each needs measured acceptance before claiming universal accessibility.
5. **Async boundary** uses current authenticated task guards, stale-response rejection and explicit unavailable versus denied states. Do not replace these with a CSS-only permission check.
6. **Health/report rendering** preserves source/version pinning, immutable document identity, unknown/missing semantics and read-only viewing. A design change must not trigger processing or approval.

No tokens or shared components are implemented by this report.

## 4. Identity and API/schema owner map

These are proposed accountable owners tied to actual source consumers, not a newly approved data model. Many foundational tables predate tracked migrations; source consumers and forward migrations are not a complete live-schema export.

| Contract family | Existing source / interfaces | Accountable owner and required reviewers |
| --- | --- | --- |
| Identity and active staff session | `portal/portal.js` → `get_my_staff_access`, `staff_directory`; `portal/portal-permissions.js` → `my_staff_permissions_view`; `staff_access`, role/permission/scope helpers | Master WS-02 owns Auth/session/RLS; all role lanes consume; WS-10 independently tests |
| Fine-grained staff authority | `private.staff_action_allowed`, `private.staff_has_permission`, `private.staff_can_access_contact`; lifecycle migration begins with explicit permission/contact checks | Master WS-02 exclusively owns shared implementation; finance/health owners approve their own boundaries |
| Contact and enrollment source of truth | `contacts`, `profiles`, `contact_journeys`, `journey_enrollment_activations`, `client_access`, `client_memberships`, `membership_entitlements`; `portal/portal-client-foundation.js`, `portal/portal-journey.js` | WS-03 functional owner; Master controls identity binding and migrations; WS-05/06/09 reviewers |
| Member account/agreement lifecycle | `supabase/functions/member-account/handler.ts`, `agreement-sign`, `member/onboarding/onboarding.js`; `my_onboarding_context`, `claim_onboarding_enrollment`, `sign_client_agreement_atomic`; immutable agreement hash | WS-03 lifecycle owner with Master Auth and WS-09 legal/payment gates; no separate account store |
| Paid access/entitlement | `private.full_member_access`, `member_paid_access_allowed`, lifecycle restrictive policies; member bootstrap views | WS-09 provides verified payment state; WS-03 enrollment transition; WS-05 consumes; Master arbitrates shared schema |
| Client/Coach operations | `member/member110.js` → `my_app_bootstrap_v2`, `my_member_dashboard`, `my_member_entitlements`, goals/habits/assignments; `portal/portal-coaching.js` | WS-05 owns operational contracts; WS-07 owns reusable learning/nutrition/fitness content; Master owns authorization predicates |
| Household/Family | `households`, `household_members`, `family_change_requests`; `my_household`, `request_my_family_change`, `review_family_change_request`; `portal/portal-family-requests.js` | WS-06 owns proposed household UX/consent requirements; WS-03 owns canonical contact links; Master owns cross-person permission changes |
| Referral/Affiliate | `portal/portal-referrals.js`, `#referral-admin-panel`; referral metadata in payment migration; existing `referrals.manage` UI capability | WS-08 owns attribution/referral interface proposals; WS-09 owns financial events/ledger; Master owns identity/security. Existing admin foundation is not a verified full Affiliate portal |
| Billing/payment service | `netlify/functions/payments.mts` and `_shared/payments.mjs` → `/api/payments/*`, `payment_service_command`, `staff_list_payment_requests`; payment webhook/worker and migration | Master retains shared financial/migration files; WS-09 supplies reviewed domain contract; WS-03/05 consume resulting enrollment/entitlement events |
| Protected Roadmap | Existing source-pinned processing/review modules and private authority chain | Existing Master protected-flow owner only; other workstreams have no grant/recovery/generation authority |
| V3 knowledge | Separate `../roadmap-v3-intelligence/config/roadmap-v3/foundation.json`, detached module and local tests | WS-04 proposal owner; founder approval and trusted source registry required; no caller-supplied approval JSON becomes production authority |
| Build/release/public allowlist | `config/production-public-files.json`, `scripts/build-production-vitality.cjs`, `netlify.toml`; deployed static overlays / Function archive inventory | Master integration/release owner WS-10; any specialist change requires explicit collision review |

Observed guard details: portal authorization uses server `get_my_staff_access` and effective permissions. `user_metadata` is observed for invite/setup presentation, not adopted by this plan as an authority source. Member paid-access helper joins access, membership and enrollment gates. The lifecycle migration contains restrictive overlays and source-specific signer capabilities. Payment adapter verifies bearer identity and exact environment/origin, with server-only service commands; no secret values were read.

**Important distinction:** inspected migration text includes historical candidate comments and dependencies on existing schema. Installation/current definitions, all ACLs, RLS and role defaults were not reverified. Do not apply these files to establish the inventory.

## 5. Cross-workstream collision matrix

| Shared area | Likely overlapping lanes | Assigned control for next work |
| --- | --- | --- |
| `portal/portal.js`, `portal/portal-permissions.js`, `portal/index.html` | WS-02/03/04/05/06/08/09 | Master owns edits and integration; specialist submits contract/diff proposal |
| `index.html`, public header/CTA/menu CSS and handlers | WS-01/03/08/10 | Master owns shared navigation; WS-01 proposes scoped page-only changes |
| `portal/portal.css`, `member/member110.css`, `css/styles.css` | WS-01/05/06/08 | Master authorizes one runtime owner per file; preserve named surface profiles |
| Contact/profile/access/household/entitlement tables and policies | WS-02/03/05/06/09 | Master owns migrations/RLS; domain owners provide versioned fields/commands |
| Payments, commissions, credits, settlement and webhook files | WS-03/08/09 | Master shared-financial owner; single-level compensation only; cash/credits/points separate |
| Roadmap rendering/processing, source maps and private permissions | WS-01/02/04/10 | Master protected-flow owner; no design convenience bypass |
| Production allowlist, build script, `netlify.toml`, package scripts, CI | All lanes | Master integration owner; no blind full rebuild from historical raw source |
| `CURRENT_BUILD_STATE.md`, orchestration/register docs | All lanes | Master writes consolidated state; specialists write issue-local handoffs only |

For proposed APIs/events, require an accountable publisher, version, stable entity identifiers, actor/session derivation, allowed consumers, field-level disclosure, idempotency key, retry semantics, failure state and audit expectation before coding. No new API or event name in this document constitutes an implemented endpoint.

## 6. Proposed synthetic negative acceptance

**All cases below are proposed, not run for Issue 53.** Execute only in disposable local fixtures with fictional accounts, household/contact A/B, sources and payment events. Assert both API/SQL denial and no prohibited writes/disclosure; hiding a menu is insufficient.

| ID | Role / attempted action | Required outcome and inspection point |
| --- | --- | --- |
| N01 | Owner account with revoked/expired session reuses a cached sensitive screen | Sensitive action denied, private view cleared; `portal/portal.js` epoch/task guards and server session gates; no restore via stale JWT/UI |
| N02 | Coach assigned to A requests B's private notes/assessment or spoofs contact B | No B rows or payload; `staff_can_access_contact` plus private-health permission, even when direct API bypasses UI |
| N03 | Coach invokes finance override, contract preparation or staff permission change | Denied at server command/helper; no ledger, role, invitation or audit-success mutation |
| N04 | Client A reads/writes Client B documents, messages, goals or health metrics | Denied by ownership/participant checks and storage policy; signed URL cannot be obtained for B |
| N05 | Authenticated but unpaid/suspended Client requests paid lesson/plan/coaching entitlement | Paid feature denied; permitted own billing/agreement recovery remains scoped; cannot self-set active state |
| N06 | Family adult in household A targets member B of another household | Denied before update/attachment; exact request ownership and household relation retained |
| N07 | Family secondary signer treats an agreement invitation as household or health access | Only exact immutable agreement capability allowed; unrelated agreement/health/household data denied; expired/revoked capability denied |
| N08 | Affiliate requests referral assessment answers/private coaching notes, or another affiliate's identifiable referrals | No private health disclosure or cross-affiliate record access; any future consented status projection explicitly allowlisted |
| N09 | Affiliate posts a paid/settled event, rank/MLM activation or payout request as authority | Denied; unverified payment cannot create withdrawable commission; rank/genealogy stay OFF; separate financial-contract test |
| N10 | Any role edits user metadata to claim Owner/Coach/Family/Affiliate | No privilege change; server-owned role, session and relationship checks remain authoritative |
| N11 | Same-user refresh, logout/account switch or transient permission transport failure races an earlier request | Stale response suppressed; authoritative denial clears; temporary failure pauses private actions; no cross-account DOM/cache leak |
| N12 | Anonymous/foreign-origin browser invokes onboarding, payment staff command or Roadmap processing | Denied by existing environment/method/origin/Auth/action boundaries; no duplicate job or delivery |

Existing test references for reuse: `tests/staff-session-runtime.cjs`, `tests/post-logout-module-guards.cjs`, `tests/startup-request-guards.cjs`, `tests/production-client-lifecycle.cjs`, `tests/backend/production-client-lifecycle.test.cjs`, `tests/payments-v1.test.mjs`, `tests/backend/payments-v1.test.cjs`, and existing source-isolation suites. The backend lifecycle suite includes unrelated/stale-hash/unverified agreement denials and Coach/member/out-of-scope Admin contract denials. Source inspection is not a fresh passing run or full role coverage.

Family/minor consent and future Affiliate disclosure rules need explicit Owner decisions; proposed expected denials preserve least privilege and do not invent affirmative access rights. Cross-organization tests require a confirmed organization model rather than an invented tenant column.

## 7. Responsive, accessibility and integration acceptance plan

Use Chromium and WebKit with loopback-only fixtures and all hosted Auth/RPC/storage/payment/email/worker traffic intercepted. No real accounts, provider interaction or production write during these tests.

1. Homepage widths 320, 390, 430, 600, **601**, 768, 840, 1024 and 1440; ≤600px layout and gold subtitle acceptance; >600px baseline pixel/computed-style equality. Existing `tests/homepage-mobile-hero.cjs` and mobile evidence already define this boundary.
2. Founders approved-artifact baseline at 320, 390, 520, 768, 1100, **1101**, 1440 and 1920. Exact portrait bytes/native ratio and visible approved copy, script with no underline, no collisions/overflow; all CTA destinations and Watch Our Story remain exact. Use actual approved overlay and known hash-preserving font-path aliases.
3. Staff/member shell at 320, 390, 768 and 1440: keyboard order/focus, accessible names, menu/dialog ARIA, close/focus return, touch targets, text enlargement, reduced motion, horizontal containment and independently checked contrast. Add VoiceOver/real-device acceptance later only if separately scheduled; no claim of exhaustive assistive-technology certification.
4. Async fixture scenarios: INITIAL_SESSION restore, same-user TOKEN_REFRESHED, cross-tab renewal, five-minute idle, slow response, offline/transport error, revocation, account switch and logout. Confirm no private flashes, unintended duplicate mutation or lost unsaved form where existing recovery applies.
5. Full Owner/Coach/Client/Family/Affiliate journey acceptance belongs to WS-10 with each domain owner. Browser shells and a passing schema test alone do not establish paid beta or full Academy readiness.

Evidence locations already inspected/referenced: root `deployment-evidence/2026-10-21-founders-publication/`, `deployment-evidence/2026-10-21-founders-no-underline/VERIFICATION.json`, `deployment-evidence/2026-10-26-homepage-mobile-subtitle/`, `deployment-evidence/2026-11-01-alex-continuation-review/execution/publication/LIVE_ACCEPTANCE.json` and `PUBLICATION_EVIDENCE_HASHES.json`. These are historical scoped acceptance records, not new tests executed by this assignment.

## 8. Security-adviser evidence and explicit unverified items

Reviewed existing local advisor evidence without calling live advisors: `docs/health-hope-live-repair-acceptance-2026-10-21/security-advisors.json` has notice categories `rls_enabled_no_policy` (INFO), `authenticated_security_definer_function_executable` (WARN) and `auth_leaked_password_protection` (WARN). `docs/REPDB_DELETE_GUARD_REPAIR_2026-10-07.md:67` also records legacy definer-view/RPC and password-protection findings outside that repair. Categories alone do not establish exploitability or safe dismissal. No finding was changed, accepted away or claimed remediated. Master security review must obtain current sanitized evidence and inspect explicit ACL/policy/routine scope under separate clearance.

Unverified: current hosted role defaults/RLS/ACL/routine bodies; installed-migration ledger versus local SQL; current provider/canonical bytes/default branch; full asset inventory and final component extraction API; Client/Coach complete 49-day and entitlement journey; adult-household affirmative sharing, guardianship/minor rules; actual Affiliate portal identity/disclosure/payout lifecycle; legal/merchant/financial activation; full accessibility, real-device testing and disaster recovery. No blanket security, production or feature-completion certification is made.

V3 remains detached and production-ineligible. The earlier read-only audit observed clean `../roadmap-v3-intelligence` at `cbc1a92` and ran 42/42 fictional V3 tests successfully before this Issue 53 dispatch. That is separate local-module evidence, not a test of this branch or real corpus. No 113-submission/old-corpus teaching is promoted and no 40-day mission is inferred.

## 9. Tests actually performed versus proposed

Performed during initial discovery: required-file/Issue-body reads; clean branch/HEAD/base and merge-base checks; five approved-asset SHA256 checks; local source/artifact discrepancy verification reused from the immediately preceding audit; portrait visual inspection; bounded migration/API/consumer/test/advisor-source inspection. Handoff JSON parsing, both original allowed output paths, all evidence-reference existence checks and all 12 denial-plan identifiers passed. No application test suite, browser run, SQL execution or live acceptance ran during initial discovery. The separately cleared validator tests are recorded below.

Earlier same-specialist audit: `node --test tests/roadmap-v3-intelligence.cjs` from isolated V3 worktree passed **42/42**, no network/storage writes; not rerun here. All role-denial and responsive cases above remain proposed. Existing CI has narrow path/branch scopes, and default `npm test` covers assessment/resume only; it is not full Academy or identity certification.

## 10. Blockers and smallest next local slice

1. **Master review required:** approve surface-profile preservation, artifact authority precedence and one-owner-per-shared-file map. Unblock condition: explicit reviewed contract/ownership clearance.
2. **Master/Owner decision required:** affirmative Family/guardian/minor and future Affiliate disclosure rights, not negative least-privilege cases. Domain lanes supply requirements; no new rights invented here.
3. **Live/security verification separately scoped:** current advisor/ACL/RLS/provider state is not available from this local inspection. This does not block independent fictional contract work.

Smallest proposed implementation after later clearance: add a **non-production contract fixture and validator** under a new isolated issue-owned test directory, containing only these public asset hashes, named existing surface-token values and accepted artifact identities. Validator reads source/approved local fixture bytes, detects forbidden substitutions and verifies the ≤600/601 and 1100/1101 boundary declarations. No public allowlist, runtime extraction, navigation/Auth/financial/Roadmap module, migration or deployed path changes. Mark every mismatch against an approved artifact as a review item, not an automatic source rewrite. WS-10 reviews evidence before any later runtime component package.

## Completion / handoff

- Completed: scoped architecture/design/identity evidence and proposed ownership/acceptance contracts.
- Changed: this report and adjacent `handoff.json` only. No runtime, migration or shared-register edits.
- Tested: static/reference/hash/ancestry inspection only for Issue 53; prior V3 42-test result explicitly separated.
- Security: private records and production boundaries preserved; live policy/adviser findings unverified, not modified.
- Documentation: issue-local artifacts only, as explicitly assigned; Master owns consolidated `CURRENT_BUILD_STATE.md` and registers.
- Next: Master reviews contract/owner map and clears the smallest isolated validator slice if desired. This report does not complete the implementation scope of Issue 53 or authorize publication.

## 11. Subsequently cleared local validation-only slice — completed

Master reviewed the concrete approved asset/surface provenance contract and cleared exactly one isolated checker/test slice. Added only `validation/approved-design-contract.json`, `validation/validator.cjs` and `validation/validator.test.cjs`; updated this report and `handoff.json`. Earlier sections remain the initial discovery and broader proposed contracts; this clearance does not implement their APIs, components, permissions, role-denial cases or responsive browser plan.

The JSON pins five existing approved asset hashes, four named **observed source-declaration** profiles (public legacy, portal, member and mobile homepage), exact historical raw and approved Founders artifact hashes, ≤600/601 mobile boundary metadata and 1100/1101 Founders metadata. It forbids implicit global token normalization. The checker reads only allowlisted local public files and approved artifact references, calculates SHA256 and compares literal declarations; it does not execute CSS or parse its cascade. Missing/unreadable references are explicitly `BLOCKED`, including an absent approved artifact even when raw source exists. Wrong raw-as-approved roots, changed identities/declarations, altered origin metadata, path substitutions and symlink references reject. No approved overlay is copied, rewritten or reconstructed.

Verification actually run, from this worktree:

| Command / check | Result | SHA256 of exact stdout |
| --- | --- | --- |
| `node docs/orchestration/issue-53/validation/validator.cjs` | exit 0; `PASS_LOCAL_OBSERVATION`; 13/13 input hashes match; no findings; production/computed-style/pixel/live flags all false | `d004f3ee8beb4616b43517318db3eb3554e74117dacd2b879c27e56827f76816` |
| `node --test --test-reporter=tap docs/orchestration/issue-53/validation/validator.test.cjs` | exit 0; 16 tests, 16 pass, 0 fail/cancelled/skipped; no stderr | `7e4aeff2938b003069380467073da876db47a0ecb8462bb7cd6ecffa45441be9` |
| Tracked-files comparison to `3baef48590fbcd7955946bcc5e9988b7f88bf6b4` | byte-identical tracked/runtime source; HEAD unchanged; only issue-local new files | Not a runtime acceptance test |

Exact local tool file hashes:

- `approved-design-contract.json`: `ad698d5d1d63bb3ed3d778dbdb4eaaa0f7369afdbc560a4afa183c3597bf812d`
- `validator.cjs`: `4b9877b769c4b5bac139680459bf16daf7a24b8d04828f8ae5c1356c23d49b7e`
- `validator.test.cjs`: `07b3f9b0b034496a098baa02865cb0ee12ab5439dd825be52330a806d924bf26`

The checker output's `contractSha256` (`8458bc0e2d043d810c8586b47e081226097cff0f945ee9ea45216b5c06b30dbd`) hashes compact `JSON.stringify` of the parsed contract value; the file SHA256 above hashes exact JSON bytes. Both are recorded distinctly. `handoff.json` retains the full checker output, including all 13 exact input hashes and reference identities. TAP stdout hash identifies this execution, whose timings may differ in a future run; it is not a reproducible timing guarantee.

Synthetic tests use fictional temporary files, cleaned after each case, with no network/private content. Cases cover valid identities, asset mutation, wrong source, raw-as-overlay denial, missing overlay/root with no fallback, incorrect origin, 600/601 boundary changes, explicit non-certification flags, global-normalization refusal, rehashed source with missing observed declarations, traversal/reference substitution, symlink rejection, missing asset and unchanged fixture bytes.

Limits: the reviewed JSON is a trusted local input, not authenticated founder approval or a signed production registry. Editing both contract expectations and files requires renewed review; a pass cannot establish real authorization. Strings and responsive metadata do not prove rendered styles, image display, accessibility, full responsive behavior or live deployment preservation. The twelve role/API denial cases remain proposed and unexecuted; this checker never calls those systems. All shared Auth/schema/API/component extraction, public build configuration and deployment remain unchanged. Independent Issue 56 QA, Master contract integration and final release remain separate and uncleared.

Next integration gate: Master/Issue 56 may review these five issue-local files and rerun the checker/tests against the exact pinned public references. If approved references are absent in another checkout, carry status `BLOCKED`; never substitute inherited raw files. Any relocation of approved reference storage, CI/package integration or runtime design-component extraction requires a new bounded clearance and owner assignment. No commit, push, PR, issue comment or production action is implied.
