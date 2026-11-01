# Issue #54 — Client, Coach, CRM, Family and activity discovery

Date: 2026-11-01. Owner: native specialist `/root/platform_scope_audit`, dispatched by RVA MASTER CODEX. Scope: WS-03, WS-05, WS-06, WS-07 discovery and acceptance planning. Issue: https://github.com/eaglevisiondigital/revitalizedacademy/issues/54 (OPEN when read).

Worktree: `/Users/davesmacbookpro/Documents/ChatGPT/revitalized academy/academy-client-coach-family`. Branch: `codex/academy-client-coach-family`. Pinned starting commit: `3baef48590fbcd7955946bcc5e9988b7f88bf6b4`; production-derived source reference: `10dec6682e7e87bf637482fc027e54c6800260e4`; last recorded canonical deploy: `6ae6b971e17bce85e37aa95c`. No current hosted verification was performed. File references below resolve against this worktree unless a different historical checkout is explicitly named.

## Outcome and limits

Substantial CRM, coaching, content, scheduling and Family request code already exists. The full lead-to-renewal journey is **BUILT-UNVERIFIED**, with specific **BLOCKED** requirements and selected historically verified components. Nothing found justifies rebuilding the platform from scratch. Nothing found certifies complete Academy operations.

A material route distinction: `member/index.html:1` is an **Enrollment & Signature Center**, loading `/member/onboarding/onboarding.js`. It does not mount the client dashboard. The allowlist retains `member/member110.js` and CSS, and that script includes many client features, but a source search found no HTML reference to `member110`. An allowlisted script is not a reachable, accepted client dashboard. This may be an intentional held release boundary; it requires Master reconciliation with the accepted beta member experience before any route/navigation edit.

No live data, table counts, real-client sources, credentials, private authority documents, reports or answers were accessed. An empty table was never used as evidence of absent implementation. No functional tests, builds, database runners, hosted sessions, provider requests or migrations were executed. Only the exact public GitHub issue body was fetched, using read-only `gh issue view 54 --repo eaglevisiondigital/revitalizedacademy --json number,title,body,url,state`; the first sandbox request failed to connect and the approved network read succeeded. No GitHub mutation occurred.

## Required source reconciliation

Read first: `AGENTS.md`, `docs/RVA_MASTER_ORCHESTRATION.md`, `docs/RVA_WORKSTREAM_REGISTER.md`, exact Issue #54. Existing architecture/security/decision/current-state documentation and relevant source, migrations and tests were inspected; earlier native read-only findings were reused.

The orchestration/register/issue explicitly name original **Option 3 Complete Coaching Ecosystem** and the **platform information checklist**. Their complete original documents, section IDs and acceptance text were **not located in this checkout**. Searching tracked text for Option 3/Complete Coaching Ecosystem/platform information checklist/49-day/seven-week located coordination references, not an authoritative requirements package. This report preserves the entire named Issue #54 scope; it cannot honestly claim line-by-line reconciliation of unavailable originals.

Master must recover the original sources from the Owner's existing records or an authorized connected source, pin their location/version, and map each original requirement to the provisional IDs below. This is a source-retrieval dependency, not a request to redesign or reduce scope. Further requirements may remain undiscovered. No original source content was invented. Holistic Clarity and MK10 are governing curriculum/terminology directions in the orchestration instructions, but a complete approved lesson manifest and their detailed original acceptance sources are not supplied here.

Status vocabulary:

- **BUILT+VERIFIED**: a named, bounded component has explicit functional acceptance evidence. Date/environment/limitations are always included. It does not mean current live operation was checked today.
- **BUILT-UNVERIFIED**: code/interface exists; complete current journey, role policy or route acceptance remains unproved.
- **PLANNED**: named scope or proposed test/development slice; no complete implementation established.
- **BLOCKED**: required authoritative source, product/policy contract, environment reconciliation or separate approval is missing. Existing infrastructure is still recorded.

## Evidence catalog

| Ref | Exact source/evidence | What it establishes; limitations |
| --- | --- | --- |
| S01 | `portal/portal.js:43`, `:58`, `:76`, `:491`, `:971`; `portal/portal-permissions.js:23` | Shared session epochs/task guards, contact events, `RA_PORTAL`, permission-loaded/readiness contract. UI gates do not substitute for DB authorization. |
| S02 | `portal/portal-shell.js:28`; `portal/index.html:293`, `:325`, `:351`, `:376`, `:399`, `:469`; `:3029` onward | Existing staff workspaces/contact sections and loaded activity modules. These are same-document panels, not independent URLs. |
| S03 | `consult.html:71`, `:101`, `:174`; `js/revitalized-data.js:2`; `enroll.html:55`, `:244` | Public assessment/start/resume/intake and enrollment forms/bridge. Submissions and private assessment processing were not exercised. |
| S04 | `portal/portal-client-lifecycle.js:66`, `:80`, `:93`; `supabase/migrations/20261007224150_production_client_lifecycle_v1.sql` | Atomic client preparation, server plan resolution, intent, verified claim/signing and held legal/payment boundaries. File presence is not installation proof. |
| S05 | `member/index.html:1`; `member/onboarding/onboarding.js:1`; `supabase/functions/member-account/handler.ts:1` | Actual source-mounted enrollment center; own verified identity, invitation claim, exact-document signing, neutral recovery and pending-payment state. |
| S06 | `member/member110.js:60`, `:193`, `:319`, `:415`, `:3018`; `config/production-public-files.json:243` | Older client dashboard implementation references self-scoped views/RPCs, Family, activities and account features. Dashboard mount is unlocated in current HTML. |
| S07 | `portal/portal-action-center.js:557`, `:627`, `:706`; `portal/portal-journey.js:186`; `portal/portal-pipeline.js:121`; `portal/portal-work-desk.js:177` | Appointments, enrollment activation, journey steps/jobs, pipeline and follow-up queue exist. Full automatic progression/provider execution is unverified. |
| S08 | `portal/portal-coaching.js:172`, `:608`, `:637`, `:779`, `:826`, `:878`; `portal/portal-coach-capacity.js:34`, `:201`, `:269` | Coach assignment, goals/habits/tasks/check-in review, progress entries, sessions/notes, availability and entitlement review interfaces. |
| S09 | `portal/portal-team-calendar.js:123`, `:142`, `:156` | Team calendar/status updates/conflict and availability views. Timezone/DST/race/booking acceptance remains needed. |
| S10 | `portal/portal-family-requests.js:43`, `:124`; `portal/portal-client-foundation.js:138`, `:156`, `:357`, `:410`; S06 | Existing household foundation and reviewed family change-request workflow; not a complete sharing-policy proof. |
| S11 | `portal/portal-learning.js:43`, `:60`, `:242`; `portal/portal-programs.js:667`, `:712`, `:867` | Published course/resource assignment, course modules/lessons/order/media/required completion authoring. No approved 49-day curriculum/timing manifest located. |
| S12 | `portal/portal-wellness.js:90`, `:108`, `:303`, `:323`, `:345`; `portal/portal-recipe-builder.js`; `portal/portal-food-database.js`; `portal/portal-exercise-library.js` | Canonical content, meal/fitness assignment and grocery composition interfaces. Client intake/targets and reusable composition have separate boundaries. |
| S13 | `portal/portal-member-messaging.js:27`, `:151`, `:184`, `:292`; `portal/portal-documents.js:22`, `:121`, `:153` | Scoped staff inbox/messages/attachments and categorized client documents; signed URLs have 900-second TTL in these modules. Current Storage/RLS not remotely checked. |
| S14 | `portal/portal-challenges.js:40`, `:241`; S06 | Challenge enrollment/catalog and client progress/activity references exist. Not proof of scoring methodology or populated program. |
| S15 | `portal/portal-billing.js:33`, `:114`; `portal/portal-payment-requests.js`; `supabase/migrations/20261010121000_payments_v1.sql`; `20261010120000_holistic_foundations_pricing_v2.sql` | Subscription/installment/term/route/price structures, private service boundary and release guards. Renewal experience not certified. Financial ownership WS-09. |
| E01 | `docs/PRODUCTION_CLIENT_LIFECYCLE_TECHNICAL_FOUNDATION_RELEASE_2026-10-08.md` | Dated production rollback-only lifecycle acceptance, source `4fe1e812e007c840b0211cc61989f7b66fd28ba8`, deploy `6ac870e0a8239709a2ab5d23`, applied ledger `20261009043913`. Normalized reuse, Owner/scoped denials/legal/payment holds and signed-out responsive routes. No Auth identity, email, payment or paid client created. Old business terms in this report are historical. |
| E02 | `docs/FOODDATA_BETA_SYNC_ACCEPTANCE_2026-10-07.md` | Dated normal-Owner hosted disposable source/recipe/content-sync acceptance, production `f5eabc1…`/deploy `6ac5fda…`, beta `888ae5…`/deploy `6ac5fc…`; explicit 13-table one-way reusable-content contract. Excludes private clients/households/assignments/health/financial records. Does not certify client meal adherence. |
| E03 | `docs/REPDB_DELETE_GUARD_REPAIR_2026-10-07.md` | Dated repaired native production 93/93, beta 296/296; hosted unauthorized deletion denial and bounded privileged QA cleanup after retained evidence. Earlier RepDB candidate status is superseded for this narrow repair. No current provider/media check. |
| E04 | `docs/HOLISTIC_FOUNDATIONS_PRICING_V2_IMPLEMENTATION_2026-10-10.md` | Reconciled local evidence dated Oct12: 53 unit/DOM, 55 PG, 37 lifecycle and 39 payment browser checks, no provider/hosted writes; its release/policy gates remain distinct. Do not reuse Oct8 prices as today's pricing contract. |
| E05 | `docs/PRODUCTION_CLIENT_LIFECYCLE_TECHNICAL_FOUNDATION_RECONCILIATION_2026-10-08.md` | Recorded 106 frontend, 40 Edge, 126 maintained PG17, 37 Chromium and 75 WebKit checks; synthetic/restored environment limits. Not newly rerun. |
| T01 | `tests/production-client-lifecycle.cjs:10`, `:12`, `:14`, `:15`, `:50`; `tests/backend/production-client-lifecycle.test.cjs:1`; concurrency peer | Existing success/denial/stale-account/invitation/signature/legal/payment tests. Backend requires disposable loopback DB and imports permission metadata from sibling staging baseline. Test existence differs from execution. |
| T02 | `tests/staff-session-runtime.cjs`; `tests/post-logout-module-guards.cjs`; `tests/startup-request-guards.cjs`; `tests/helpers/staff-task-fixture.cjs` | Reusable fictional session/transport fixture patterns. Coverage of selected modules does not establish every coach/family panel. |
| T03 | `tests/fooddata.cjs`; `tests/repdb-exercise-library.cjs`; `tests/backend/content-sync.test.cjs`; `tests/backend/production-durable-content.test.cjs` | Composition/provenance/unknowns/role/isolation/concurrency tests available. Some require built output/private provider bundle; no fetching/building was attempted. |
| T04 | `scripts/test-production-durable-content.cjs:1` | Existing runner creates disposable loopback PG17 DB, imports sibling `../revitalizedacademy` baseline and globs local migration directory. Current branch adds later protected migration dependencies; do not blindly run this historical all-migrations path as a platform certification. Pin explicit reviewed local subset and fixture dependencies first. |

Historical staging evidence from the earlier read-only audit: older `revitalizedacademy` checkout at `88ee646…` has full family consent/guardian/lifecycle repairs and newer member nutrition/health modules/tests; accepted beta benefit/session report dated Oct5 is limited to empty Nutrition/Workouts, refresh/two-tab/logout. It is a separate Git common-directory lineage and is not silently incorporated here. The Master/core lane must reconcile it. No newer beta runtime was copied or executed by this task.

## Complete named-scope requirement matrix (provisional IDs)

This matrix covers every area explicitly named in Issue #54 and its orchestration scope. Original Option3/checklist IDs must be added when recovered; these IDs are not a replacement specification.

| ID | Requirement | Status | Evidence and exact remaining acceptance |
| --- | --- | --- | --- |
| R01 | Full Option3 + platform checklist trace | BLOCKED | Originals unavailable; recover/pin authoritative text, map every original item without dropping scope. |
| R02 | Public acquisition/forms/contact dedupe | BUILT-UNVERIFIED | S03/S04, E01 contact-reuse subset verified Oct8. Full form-to-CRM attributed request/retry/validation route not currently accepted. |
| R03 | Adult and dependent intake/assessment | BUILT-UNVERIFIED | S03 assessment/child script/form pathways exist. Separate authority for minors/guardians and full hosted consent semantics needed; no protected-source use. |
| R04 | Lead pipeline/stages/qualification | BUILT-UNVERIFIED | S07 admin journey/pipeline/contact status exists; transition policy and full current conversion need acceptance. |
| R05 | Consultation intake + booking | BUILT-UNVERIFIED | S07/S09 staff journey appointments exist. `consult.html` is an assessment route; do not equate it to proven self-service consultation booking. |
| R06 | Calendar/availability/conflict/no-show/reschedule | BUILT-UNVERIFIED | S09/S08; require DST, concurrency, late changes, private scope and requested-vs-confirmed state tests. |
| R07 | Program/pricing/enrollment intent | BUILT-UNVERIFIED | S04/S15; local E04 catalog rules. Server owns price/currency/route; current legal/financial readiness not verified. |
| R08 | Agreement generation/exact version/independent adult signing | BUILT-UNVERIFIED | S04/S05/T01; E01 held denials verified. Full approved document mapping, own verified identities, delivery/sign acceptance not proven current. |
| R09 | Account verification/claim/recovery/logout | BUILT-UNVERIFIED | S05, E01 signed-out/negative route and T01 tests. Current real managed Auth/delivery acceptance remains separate. |
| R10 | Payment -> activation -> entitlements | BLOCKED | Structures and guards S15 exist. Merchant/legal/current operational approvals and WS09 accepted synthetic contract needed; never mark paid manually. |
| R11 | Entitlement/access lifecycle | BUILT-UNVERIFIED | S06/S08/S10/S15, older beta repair evidence; full current enrollment/pause/expiry/revocation/template-vs-override consistency needed. |
| R12 | Reachable Client dashboard/mobile shell | BLOCKED | S05 source currently mounts signature center; S06 dashboard script unmounted in located HTML. Master choose approved reconciliation path; no route change authorized here. |
| R13 | Owner operations/dashboard/People | BUILT-UNVERIFIED | S01/S02/S07; role/UI code exists, current full hosted operations unverified. |
| R14 | Coach assigned caseload/capacity/work queue | BUILT-UNVERIFIED | S08/S07; scope + inactive/onboarding + reassignment/concurrency acceptance needed. |
| R15 | 49-day program, curriculum/day release/completion | BLOCKED | S11 generic module/lesson ordering and duration fields do not establish exactly 49 days. Recover authoritative curriculum/start/pause/timezone/unlock/completion/renewal policy. |
| R16 | Courses/resources/lessons/media/completion | BUILT-UNVERIFIED | S11/S06; authoring/assignments exist. Approved content, client delivery, progression, accessible media and completion persistence unaccepted. |
| R17 | Scheduled coaching sessions | BUILT-UNVERIFIED | S08/S09/S06; client request != confirmed session. Capacity/entitlement consumption/cancel/no-show/privacy tests needed. |
| R18 | Private coach notes/session agendas | BUILT-UNVERIFIED | S08 notes; S06 agenda. Staff-private versus client-visible fields require authoritative contract and read/denial evidence. |
| R19 | Messages/inbox/attachments | BUILT-UNVERIFIED | S13/S06; attachment Storage/RLS, membership lifecycle, recipient isolation, reset and failed-send recovery needed. |
| R20 | Check-ins and coach follow-up | BUILT-UNVERIFIED | S08/S06 template and review writes exist; idempotent submission/review/escalation and ownership need acceptance. |
| R21 | Goals/habits/tasks/adherence | BUILT-UNVERIFIED | S08/S06; distinguish actual logged completion from assignment and use synthetic duplicate/day/timezone tests. |
| R22 | Progress metrics/charts/trends/photos | BUILT-UNVERIFIED | S08/S06/S13; configured metrics and summaries are not evidence of complete requested chart suite. Approved chart requirements, unknown/baseline semantics and scoped-photo acceptance needed. |
| R23 | Food provenance/recipe calculation/content sync | BUILT+VERIFIED | E02 Oct7 bounded production+beta acceptance; T03. Current operation and client assignment are separate. |
| R24 | Exercise library/source protection | BUILT+VERIFIED | E03 Oct7 bounded repair/security acceptance; T03. Full prescribed program and live third-party media not thereby certified. |
| R25 | Meal plans/recipes/grocery planning | BUILT-UNVERIFIED | S12/S06; template assignment/composition exists. Approved plan content, client schedule/substitutions/completion and grocery authorization needed. |
| R26 | Client nutrition diary/targets/trends | BUILT-UNVERIFIED | Historical staging modules/tests exist; production composition code does not promote private diary/target schema. Reconcile accepted beta source/API/policy before production implementation. |
| R27 | Fitness programs/workouts/logging | BUILT-UNVERIFIED | S12/S06; generic weeks/assignments and completion interfaces exist. Approved content/schedule/entitlement and logging lifecycle needed. |
| R28 | Challenges/shared activities/community | BUILT-UNVERIFIED | S14/S06 code references exist. Define approved scoring/visibility/enrollment and synthetic isolation; no invented health arithmetic. |
| R29 | Adult Family profiles/change requests | BUILT-UNVERIFIED | S10/S06; existing request-review-apply model. Independent adult identity/consent and request state transitions not certified current. |
| R30 | Family shared goals/calendar/meals/activity | BUILT-UNVERIFIED | Household/activity primitives and earlier staging planned schedule slice exist; exact current mounted Hub and sharing contracts unaccepted. No Family Health Score inferred. |
| R31 | Guardianship/dependent/minor consent/access | BLOCKED | Historical staging repairs exist; current approved adult/minor policy/source+schema reconciliation not supplied. Family membership is not blanket health sharing. |
| R32 | Privacy/export/deletion/consent/audit | BUILT-UNVERIFIED | Shared private lifecycle foundations/historical staging privacy modules; no current full scope/retention/processor acceptance. Preserve independent record classes and audits. |
| R33 | Program completion/reassessment/renewal | BLOCKED | S15 recurring states/post-commitment fields exist; no accepted 49-day completion-to-next-program/renewal UX/policy located. Coordinate WS09 rules; no charge/renewal inferred from course completion. |
| R34 | Unified mobile/accessibility/offline behavior | BUILT-UNVERIFIED | E01/E02 dated responsive subsets. Full mounted Client/Coach/Family routes, keyboard/screen-reader/zoom/touch/network interruption not accepted. |
| R35 | Notifications/automation/retry/observability | BUILT-UNVERIFIED | S07 jobs/Edge delivery and S06 preferences references exist. Provider operation, suppression, dedupe, failure/reconciliation and support procedures need acceptance. |
| R36 | Full integrated lead-to-renewal acceptance | PLANNED | Test plan below; all stage interfaces exist partially, but one coherent role journey has not been demonstrated by this audit. |

## Lead-to-renewal workflow and ownership

1. Public approved CTA -> `enroll.html` or assessment route `consult.html` -> public intake/mirror -> one canonical contact + source/referral attribution. **WS03**, owner verification: normalization, honeypot/input errors, retries and consent separation. Marketing/contact consent is not assessment/family/private-health permission.
2. Canonical contact -> one appropriate journey/pipeline + follow-up -> assessment completion/review (only existing separately authorized WS04 mechanisms) -> consultation request. **WS03/WS04**, preserve protected Roadmap lane; this issue uses fictional metadata only and never regenerates reports.
3. Consultation request -> staff assignment/capacity -> confirmed appointment -> reschedule/cancel/attended/no-show -> explicit qualification/plan choice. **WS03/WS05**. A stored request, attendance and enrollment decision are separate states.
4. Server-approved plan/country/eligibility -> saved enrollment intent -> exact published/mapped agreement -> each independent adult's verified claim/signature -> verified payment prerequisite -> activation. **WS03/WS09/core**. Exact commercial ordering and release guards must be verified against current approved contracts; do not override legal holds or reuse historic terms.
5. Activation -> one Auth/profile/contact binding + membership/access/entitlements/household foundation -> reachable client app. **WS02/WS05**. Current source route gap must be resolved before claiming this stage works; no duplicate identity or manual grant workaround.
6. Coach assignment -> capacity/session entitlement -> initial goals/approved curriculum/meal/workout assignments -> Client sees only own eligible content. **WS05/WS07**. Assignment, availability, entitlement and content publication are independent prerequisites.
7. Day-based approved program -> lessons/activities/check-ins/goals/habits -> actual completion/logging -> scoped coach review/notes/messages -> accurate charts and follow-up. **WS05/WS07**. The 49-day release/pause model remains a source dependency; generic order does not define it.
8. Optional independent adult household joining/change review -> consented shared schedule/activities -> guardian/dependent flow only under approved policy. **WS06/core**. A shared paid household cannot expose another adult's private progress automatically.
9. Program completion -> founder-approved completion criteria/reassessment -> explicit next-plan/renewal offer + terms -> verified financial renewal/continuation -> entitlement update or lapse/offboarding. **WS05/WS09/WS03**. Subscription machinery exists; full policy/UX is blocked, and failed payment/completion cannot imply renewal.
10. Throughout: consent/revocation, account suspension, contact reassignment, audit, retry/reconciliation, privacy/export/deletion and support. **WS02/WS10**. Preserve historical agreements/completions/audits; no invented deletion/retention rule.

## Permission matrix — evidence boundaries and required denials

This is a contract-reconciliation/test grid, **not a new approved grant matrix**. `Scoped` means current active/onboarded staff + effective existing key + contact scope and DB policy must all permit the operation; role labels alone grant nothing. Owner is not an automatic exception to private founder/Roadmap gates. Client/family columns describe self/explicit consent boundaries to preserve and prove; exact current role defaults/ACLs were not remotely read.

| Data/action | Owner / permitted Admin | Assigned Coach | Client self | Other adult Family | Guardian/dependent | Existing interface / required negative test |
| --- | --- | --- | --- | --- | --- | --- |
| People CRM/contact/journey | Scoped `crm.view/manage` | Assigned + existing keys only | Own approved self view; no staff directory | No arbitrary relatives' CRM | Only approved dependent subset | S01/S04/S07; unassigned Coach, unrelated Client and Family deny. |
| Enrollment/plan intent | Existing Owner/Admin guarded RPC | Denied by tested lifecycle contract | Claim own invitation; cannot choose authoritative price/route | Own invitation only | No proxy adult signature | E01/T01; forged actor/plan/route/currency/request replay denied. |
| Agreements/signature | Authorized scoped preparation/approved mapping | No implicit preparation/waiver | Own verified adult + exact immutable hash | Each adult separately signs own required role | Minor must not impersonate adult; guardian policy needed | S05/T01; stale hash, wrong email, same-account second-adult signing denied. |
| Payment/paid activation | WS09 guarded server boundary | No manual ledger/paid override | Own secure provider flow when released | No household payment-data entitlement by association | No bypass | S15; spoofed webhook/amount/paid state/duplicate event denied. |
| Membership/benefit management | Existing privileged scoped contract | Read/use only granted subset | Effective own benefits only | Explicit own applicable household benefits | Policy-scoped dependent benefit | S08/S10; expired/suspended/revoked and cross-membership isolation. |
| Coach assignment/capacity | Existing scoped management | Own capacity/assigned caseload per policy | Own assigned coach/session request | No caseload access | Approved dependent session rules only | S08/S09; another coach/user ID and concurrent overbooking denied. |
| Schedule/appointment status | Scoped authorized operator | Assigned + scheduling key | Own request/cancel window | Explicit consented shared schedule only | Guardian-approved subset | S07/S09; unassigned contact, race/double-consumption and DST tests. |
| Session notes/clinical-private text | Existing explicit permitted scoped read/write | Assigned + required notes/private permission | Only deliberately client-visible field, never all notes | No default sharing | No default proxy-health sharing | S08; client/Family/reassigned Coach cannot read staff-private note. |
| Messages/attachments | Existing `messaging.manage` + participant scope | Assigned/participant scope + permission | Own participant conversation | Only actual authorized participant | Specific approved guardian conversation | S13; guessed thread/path/message ID and signed URL leakage denied. |
| Documents | Category-specific key and contact scope | Category + assigned scope | Own member-visible documents | No default file sharing | Approved dependent scope only | S13: general `crm.manage`, coaching `coaching.manage`, health/progress `health.progress.manage`, finance/agreement `finance.manage`; cross-category denial. |
| Goals/habits/tasks | Scoped existing management | Assigned + coaching permission | Own allowed create/check/status | Explicit sharing only | Approved guardian controls | S08/S06; ownership reassignment, duplicate/day logging and cross-client deny. |
| Check-ins/private progress | Existing private-health/progress policy | Assigned + applicable private-health key | Own configured measurements/check-in | Explicit scope consent only | Verified guardian policy only | S08/S06; coaching-view-only is not blanket private-health permission. |
| Charts/photos/health integrations | Explicit private-health scoped gate | Assigned + required private read key | Own consented observations | No automatic adult sharing | Narrow source/scope/guardian contract | S01/S13; unknown values stay unknown, storage path/expired URL and revoked consent tests. |
| Global food/exercise/course authoring | Existing role + `learning.manage`; source import/approval Owner/Admin boundary | Existing authoring permission only; imported-source restrictions preserved | Published assigned consumer only | Published entitled consumer only | Age/guardian-approved consumer | S11/S12/E02/E03; no source-provenance forgery/bulk provider export. |
| Course/meal/workout assignment | Scoped `learning.manage` / existing wellness management | Assigned + required key | Own entitled published assignment | No writing another adult's plan | Approved guardian subset | S11/S12; unpublished/inactive/wrong-client/wrong-membership denied. |
| Nutrient target override | Reconcile production/beta contract; existing override key only | Assigned + `plan.override` where implemented | Read own effective targets; no staff override | No implicit access | Policy needed | Existing FoodData target helper is pure; do not silently promote staging target schema or clinical recommendations. |
| Family profiles/change requests | Existing review RPC + staff scope | Existing `crm.view` read gate; mutation DB proof needed | Own membership/request rights | Own independent consent/request | Explicit verified guardian authority | S10/S06; forged household/subject/guardian, request replay and out-of-order status denied. |
| Adult sharing/revocation | No inferred override; audited legal support only | No implicit private family sharing | Subject chooses approved scope | Recipient sees only current explicit scope | Cannot grant another adult's consent | Core/family contract reconciliation needed; revoke clears cached UI and late responses. |
| Minors/guardian data | Approved legal guardian and organization policy | Scoped authorized staff only | Age/competency policy required | Relationship label alone insufficient | Verified authority, scope and lifecycle | BLOCKED policy/source reconciliation; test separated households/adults/non-guardian/minor actor. |
| Export/delete/privacy actions | Existing audited authorized scope | No broad export from caseload alone | Own accepted workflow | No export of relatives' private records | Approved guardian subset | Core privacy contract required; preserve unrelated records/audits and downstream retention obligations. |
| Renewal/cancellation/financial terms | WS09 approved server rules | No financial override | Own consented choice within contract | No proxy adult financial action | Policy-specific payer action only | S15; failed/replayed payment, expired offer and course completion do not activate term. |

No current fine-grained organization/tenant model was established in this lane. Tests must cover contact/user/household isolation now and any actual organization key found by WS02; do not invent a new org schema to satisfy a generic test label.

## Route-level acceptance grid

Route inspection is source-only. `ready for fictional test` is a proposed next activity, not an observed pass. Master owns route/nav/auth edits.

| Route/workspace | Actual source binding | Current scope/status | Acceptance before readiness |
| --- | --- | --- | --- |
| `/enroll.html` | enrollment form + `js/enrollment82.js`, `enrollment83-bridge.js`, `enrollment88-family.js`, intake bridge | BUILT-UNVERIFIED | Valid/invalid individual/adult-household selections, no private data in URL, one idempotent contact, server ownership, failure/retry, keyboard/mobile. |
| `/enrollment-thank-you.html` | public completion page | BUILT-UNVERIFIED | Must acknowledge actual capture only; no paid/account/assessment completion inferred. |
| `/consult.html` (pretty `/consult` provider behavior unverified) | Vitality lead/assessment/resume scripts | BUILT-UNVERIFIED | Fictional route/form/error tests only; no actual assessment/session/source/consent request. Consult booking distinction remains. |
| `/portal/` and `#dashboard` | core Auth + staff shell | BUILT-UNVERIFIED for full operations; E01 signed-out subset | Owner/Coach inactive/pending/onboarded, refresh, two tabs, reset, 401/transient errors and no eager private reads. |
| `/portal/#people` + directory/contact drawer | People/Client Lifecycle/Foundation | BUILT-UNVERIFIED | Assigned-only Coach, read-only user, normalized creation, plan intent, client switch/late response, household boundary. |
| `/portal/#journey` | pipeline + journey/contact action center | BUILT-UNVERIFIED | Stage/assignment/automation failures, repeated actions, owner-of-record/audit, no accidental payment/report operation. |
| `/portal/#calendar` | Team Calendar panel | BUILT-UNVERIFIED | Timezone/DST, request vs confirmed, conflicts, simultaneous claim, no-show/cancel/reschedule and entitlement use. |
| `/portal/#coaching` | Work Desk + Companion; selected contact opens coaching section | BUILT-UNVERIFIED | Assigned caseload, queue/notes/session/goal/check-in scope, reassignment/reset, no protected Companion processing. |
| `/portal/#messages` | Coach Inbox | BUILT-UNVERIFIED | Current conversation participants, unread reconciliation, fail/duplicate send, attachment validation/private URL and reset. |
| `/portal/#programs` | Program Catalog/Access Rules/Content Library | BUILT-UNVERIFIED globally; E02/E03 bounded content verified | Author/publisher/consumer roles, source/version/unknowns, unpublished content and content-sync private-data exclusion. |
| `/portal/#billing` | Billing & Agreements panels + contact agreement/payment sections | BUILT-UNVERIFIED / financial activation BLOCKED | Server plan/mapping/current terms, negative UI without provider calls; WS09 owns synthetic provider contract and release. |
| People -> Family Requests | same-document `#family-requests-panel`; no standalone Family URL established | BUILT-UNVERIFIED | Valid request transitions/authorized apply, subject/household forged IDs, reviewer scope, duplicate apply and revoked membership. |
| Contact -> Coaching/Learning/Wellness/Documents | loaded modules at `portal/index.html:3029` onward | BUILT-UNVERIFIED | Correct contact/generation/permission/open context, immediate clearing on switch/deny/logout, no stale private repaint; prescribed role grid. |
| `/member/` and `/member/index.html` | **Enrollment & Signature Center**, onboarding script | Built enrollment route; complete dashboard BLOCKED | Preserve verified email/exact claim/signature/payment gates. Do not attach dashboard script to incompatible DOM. Master must determine approved dashboard route. |
| `/member/onboarding/` | same secure enrollment implementation | BUILT-UNVERIFIED full managed identity; E01 signed-out subset | Fictional verified/unverified/wrong-account/hash/claim/suspended/recovery/revoked-token cases. |
| `/member/password-reset.html` | recovery implementation referenced by T01 | BUILT-UNVERIFIED full managed delivery | One exchange, stripped credential, invalid/expired/replayed reset, neutral response; no Auth/provider real request. |
| `/member/activate/` | legacy activate112 source exists | BUILT-UNVERIFIED legacy compatibility | Trace incoming links and approved redirect/claim contract; no legacy privileged account/signing bypass. |
| Client dashboard's Courses/Workouts/Meals/Family/Progress | S06 code only; current HTML mount unlocated | BLOCKED route integration; features BUILT-UNVERIFIED | Recover beta-approved shell/content APIs and product source, then isolated route-level acceptance under Master file ownership. |
| `/pay/*` | `netlify.toml:109` rewrites to `pay/index.html` | BUILT-UNVERIFIED / separate financial gate | Read-only invalid/expired/wrong amount/session fictional flows; no actual payment/provider action here. |

No new URL or route was proposed as an approved product decision. Existing staff hash workspaces are navigation state; scoped contact panels require opening a permitted contact and server authorization.

## 49-day program contract still required

Generic courses/modules/lessons, meal `days_count`, fitness `weeks`, ordered lessons and scheduled activity dates are implemented primitives. They can support duration-based programs, but they do not prove an exact approved 49-day experience, seeded content, unlock engine or delivered curriculum. No lesson content was authored by this audit.

Master should bind the authoritative Option3/checklist/founder curriculum to a versioned program manifest covering: approved title/content source and MK10 vocabulary; 49-day/day-1 anchor; local timezone/calendar-day versus elapsed-time semantics; enrollment prerequisites; fixed/cohort/rolling start; lesson/meal/workout/coach-session schedule; release/preconditions and missed-day/pause/restart behavior; entitlement expiry; completion/reassessment; accessible media; consent/dependent adaptation; version retention for an active client; and next-plan/renewal decision. These are questions to recover/resolve, not defaults chosen by engineering.

Proposed fictional acceptance once the contract is approved: day0 denial/day1 availability/day49 final availability/day50 terminal behavior; DST crossings without shifted days; leap/month boundaries; pause/resume exactly as specified; inactive/unpaid/unassigned/revoked user denial; duplicate completion and concurrent actions; version changes preserve enrolled history; required/optional lesson completion; queued/released/future content distinction; accessible reading/video transcripts; correct 49-day completion distinct from commercial term/renewal. No medical scores, dosing or cross-adult sharing are inferred.

## Proposed synthetic personas and acceptance plan

Personas use `example.invalid`, generated local UUIDs and fabricated nonclinical text only:

- O1 active completed Owner with existing effective permissions; O2 same role with denied specific permission/inactive state.
- C1 active completed assigned Coach; C2 other Coach/unassigned; C3 pending NDA/onboarding or suspended Coach.
- A1 verified enrolled entitled adult; A2 unrelated adult; A3 unverified/pending/unpaid/expired/suspended variant.
- F1 independent adult in A1 household with no sharing grant; F2 same adult after one explicit approved sharing scope and subsequent revocation.
- G1 verified guardian + M1 fictional dependent; G2 relationship label without verified authority; M2 dependent in another household. No real minor source is needed.
- P1 publisher/admin and P2 ordinary content consumer for global-vs-assigned publication tests; provider is a deterministic local stub.

| Plan ID / owner | Smallest test package | Existing reuse | Pass and negative criteria; status |
| --- | --- | --- | --- |
| P01 / Master+WS02 | Source/route/permission contract inventory | S01/S02/T02 | Pin route mounts/API names/DOM events/role requirements; fail on unbound claimed dashboard or missing accepted requirement. PLANNED. |
| P02 / WS03 | Intake->canonical contact->journey | S03/S04/T01 fictional fixture | Valid/invalid input, duplicates/request replay, normalized collisions, existing attribution, transport uncertainty, no unauthorized stage/identity. PLANNED. |
| P03 / WS03+WS05 | Consult/schedule/availability | S07/S09 | Synthetic requests/staff confirmation/timezone/DST, cancellation/no-show, concurrency/conflict and out-of-scope denials. PLANNED. |
| P04 / WS03+WS09 | Plan/agreement/claim boundaries | T01/E01/E04 | Wrong plan/currency/hash/identity, unverified adult, legal hold, idempotent issuance, stale context, each adult independently. No provider/mail. PLANNED. |
| P05 / WS02+WS09 | Payment state -> access -> entitlement | Existing local payment/lifecycle tests | Fake signed/replayed/failed/uncertain provider events; no paid access until exact verified policy; expiry/revocation/template override isolation. Requires WS09/core contract; BLOCKED dependent slice. |
| P06 / WS05+Master | Client shell reconciliation | S05/S06 + accepted beta evidence | Approved own-route mount with proper DOM, no enrollment overwrite/second Auth, minimal first network wave, stale responses, cross-tab logout/access loss. Route choice/source contract BLOCKED. |
| P07 / WS05 | Coach/contact operation harness | T02 pattern + S08/S13 | Goal/habit/task/check-in/session/note/message ownership and switching A->denied B; late success/error and permission reset cannot expose A. Test-only isolated package can start after file ownership approval. PLANNED. |
| P08 / WS07 | Course/49-day progression | S11 content primitives | Generic authoring/assignment role tests independent now; exact 49-day boundary/timing content manifest tests need source. PLANNED generic / BLOCKED 49-day rules. |
| P09 / WS07 | Nutrition/Fitness/Grocery consumption | T03/S12 | Local source/provenance/unknowns; entitled published assignment, actual logging vs assignment, wrong-client/late response/date, duplicate grocery/completion. Provider all stubbed. PLANNED. |
| P10 / WS06+WS02 | Adult Family request + sharing | S10 plus reconciled staging policy/tests | Own adult request, reviewer scope, transition/idempotency, same household without consent denied, explicit one-scope/revoked grant, no raw health leak. Schema/policy reconciliation required before interpreting sharing passes. PLANNED/BLOCKED policy subset. |
| P11 / WS06+WS02 | Guardian/minor controls | Historical repair contracts only after Master recovery | Verified vs asserted guardian, different household, age transitions and consent withdrawal; exact legal/product policy required. BLOCKED; no guessed policy. |
| P12 / WS05+WS07 | Check-in/progress/chart unknown-state suite | S08/S06/T02 | Valid zero vs absent, sparse intervals/date-only labels, approved metric units, inaccessible private metric, no fabricated overall health score, photo ID/URL denial. PLANNED. |
| P13 / WS03+WS09 | Completion -> renewal/lapse | S15 | Completed curriculum does not extend access; explicit consent/current terms/provider state/audit, failed payment and cancellation preserve history. Renewal policy/source BLOCKED. |
| P14 / WS10 | Unified fictional lead-to-renewal | All approved isolated slices | One contact/user/membership per actor, exact states/audit/events and all negative personas, cross-role paths, responsive/keyboard/zoom and network recovery. PLANNED; no live acceptance substitute. |

All plans are proposals; **0 tests executed** in Issue54 discovery. No passing result is implied by the presence of a plan, test filename or prior release receipt. Existing tests requiring PG must use synthetic loopback-only disposable clusters and a reviewed migration subset; this initial task explicitly does not run DB tests or write DBs.

## Ownership, conflicts and smallest safe slices

Current specialist owns **only** `docs/orchestration/issue-54/REPORT.md` and `handoff.json`. Runtime, schema, migration, navigation, Auth, API, config, shared register, base docs, protected Roadmap and production are unchanged.

Master/integration owns `AGENTS.md`, root/current build docs, workstream register, `portal/index.html`, `member/index.html`, shared shell/permission/core client, public allowlist/build/runtime configuration, release/migration manifests and integration decisions. WS02 owns identities/RLS/permission/consent/household policy contracts. WS09 owns payment/term/entitlement-trigger/renewal financial contracts. WS03 owns intake/contact/journey APIs. WS05 owns coach operations after explicit isolated assignment. WS06 owns family request/sharing implementation only after approved privacy interfaces. WS07 owns reusable content/activities/curriculum provenance; shared table changes route through core.

Smallest safe next slices, in parallel without runtime overlap:

1. **Requirements/source recovery + route contract (Master):** retrieve/pin original Option3/checklist/49-day sources, reconcile source-mounted signature center with accepted beta client shell, and add original source IDs to this report. This is highest information-value work and requires no production mutation.
2. **Coach fictional test-design package (WS05):** specify a reusable scoped contact fixture and expected stale/denied/reset behavior for Coaching/Notes/Check-ins/Messages. Once authorized, add test-only files under an isolated issue subdirectory; existing shared Auth/nav untouched. No policy changes required to design negative cases.
3. **Content/course assignment contract (WS07):** extract explicit existing table/API fields for generic published course/resource/meal/workout assignment and build fictional expected results. Keep 49-day semantics and content publication blocked on recovered approval; do not wait to inspect existing generic composition.
4. **Adult Family policy trace (WS06/core):** recover the accepted staging repair tests/schema and current approved consent policy; produce per-field adult-self/shared-schedule/private-health matrix and exact test cases. Do not combine consent and raw-row permissions or presume all household data is shared. Minor implementation remains separate.
5. **Unified E2E harness contract (WS10):** compose stage transitions from above with deterministic local provider/Auth adapters, separate actual managed-provider acceptance, and explicit preconditions for payment/legal/access. No financial or report activation to clear test blockers.

No automatic branch merge, push, PR, comment, release, migration, financial activation, scheduled agent or message to another chat is authorized by this report. Local dependency gaps do not block independent source/fictional planning.

## Blockers and decision handoff

| Blocker | Responsible owner / unblock evidence | Independent work that can continue |
| --- | --- | --- |
| Original full Option3/checklist not supplied | Master recover authoritative version/location and map original IDs | Existing source/API/route/status inventory and test design. |
| Approved 49-day curriculum/release/completion policy absent | Founders/product via Master; complete pinned manifest/policy | Generic authoring/assignment/provenance/role test plan. |
| Current Client dashboard route not source-mounted | Master/WS02/WS05 reconcile accepted beta vs production reference and propose exact route/DOM/Auth boundary | Coach/Family staff-panel fixtures and source tracing. |
| Current fine-grained role/Family/guardian policy incomplete in this source | Master/core recover approved policy/schema/test contract | Test denial matrix; adult-self/request review isolation design. |
| Legal/agreement/merchant/renewal acceptance | WS09/core/Owner; exact approved current terms/provider readiness/synthetic acceptance | Guard-denial, own-signature and price-tamper fictional tests. |
| Historical test runner imports sibling baseline/globs later migrations | QA/core create explicitly bounded reproducible local dependency manifest | Source/DOM fixture tests after authorization; no runner execution now. |
| Current operation not verified | Independent integration later performs separately authorized exact-release and managed-provider acceptance | No claim of complete live Academy readiness. |

RECOMMENDED THINKING LEVEL: HIGH

CHAT DECISION NEEDED (copy-and-paste prompt for Master to recover/resolve sources; not a demand for fresh approval of already authorized discovery):

> Reconcile ReVitalized Academy Issue54 against the complete original Option3 Complete Coaching Ecosystem, platform information checklist, later founder decisions and approved 49-day curriculum. The deployed-derived source has CRM/coach/family/content primitives, but `/member/` currently mounts the Enrollment & Signature Center; the older dashboard script exists without a located HTML mount. Supply or locate authoritative original sources and confirm the approved Client dashboard reconciliation path, day-start/timezone/unlock/pause/completion/renewal semantics, and adult/guardian/minor data-sharing boundaries. Options include reusing the accepted beta client shell under an explicit production contract or extending the existing approved route boundary; assess lifecycle/security compatibility and exact retained enrollment behavior before choosing. Preserve existing identity/contact/membership/consent architecture, private notes and protected Roadmap workflows. Do not infer missing 49-day content, health arithmetic, automatic adult sharing, clinical rules or financial activation. Approve a concrete implementation slice only after Master/core review; independent fictional test design can proceed now.

No Work/live-browser task is necessary to finish this discovery report. Later real managed Auth/mail/Storage/merchant/role-route acceptance must be assigned separately under appropriate authorization and may not be represented by this source audit.

## Completion/handoff

COMPLETED: exact Issue54/coordination source pinned; named-scope status matrix, full lead-to-renewal map, permission/route grid, synthetic personas/test plan, blockers/owners and smallest safe slices documented.

CHANGED: this report and `handoff.json` only. No code SHA change, commit or runtime modification.

TESTED: source/path/contract inspection only; no functional/DB/browser test run. Prior dated evidence is explicitly scoped and not recertified.

SECURITY: no real-client/protected source access, credentials, live DB/data/provider operation, grants, migrations, auth/session interaction, private report processing or deployment. Negative acceptance requirements cover cross-user/contact/household/lifecycle/permission/Storage/financial boundaries.

DOCUMENTATION: lane-local report + machine-readable handoff only; Master owns integrating current-state/register updates.

UNRESOLVED: original full requirements, approved exact 49-day semantics/content, reachable approved client dashboard, reconciled role/Family/minor policy, financial/legal/renewal acceptance and reproducible bounded local baseline.

NEXT RECOMMENDED BUILD: Master source/route contract recovery plus independent coach scoped-contact fictional test package; keep generic course/activity contract planning moving.

CHAT HANDOFF: Issue54 discovery is complete as a bounded documentation package, not feature implementation or platform launch. Existing code covers far more than empty-content counts suggest. Full original requirements and 49-day policy remain unavailable; `/member/` mounts signing rather than the dormant dashboard script. Preserve all existing architecture and dated verified content/lifecycle subcomponents, recover source contracts, then implement/test small owned slices with one Master integrating shared identity/navigation/schema/financial boundaries. Alex remains separate and untouched.
