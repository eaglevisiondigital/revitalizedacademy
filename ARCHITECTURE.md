## Three-source internal draft capability — unreleased local follow-up

Reuses the existing pipeline and exact storage-purpose UI. A fixed three-source operator batch authorizes metadata enqueue with ingest=false. A private staged HMAC identity binds only to that batch/current founder/job/document lease; it replaces service-role sealing without new Auth/database roles or Functions. Private atomic activation/stop controls leave approval/PDF/delivery closed. See [architecture, protected configuration and release plan](docs/ROADMAP_THREE_SOURCE_DRAFT_PACKAGE.md). No hosted installation or activation.

## Storage-purpose confirmation boundary — local patch, 2026-10-19

Retains existing founder JWT RPC, private idempotent purpose storage and service-only seal. Only launcher confirmation/lifecycle and its version reference change; no new API/database behavior. Historical source enqueue currently depends on ingest=true, so keeping ingest=false requires a separately reviewed narrow operator enqueue path before actual draft activation. [Configuration and activation plan](docs/ROADMAP_STORAGE_PURPOSE_READINESS.md).

B6 continuation reconciles exact PR #46 `94be23a9b07f3825fed3b5c31c4091f5d7977b63` with the existing PR #47 implementation. Its three original preflight files remain byte-identical; the guarded runtime reuses that contract. Controlled session-local recalculation and same-source saved review comparison show exact candidate pins and changed founder judgments without historical code execution or inferred missing numeric scores. All technical and real-participant release gates remain held. See [B6 continuation](docs/B6_PR46_CONTINUATION.md).

# B6 candidate architecture — not installed

Reuses B4.2 identity/SOP, B4 read-only source pins, B5 independent compute/session infrastructure and unchanged B2/B2.1 mathematics. Adds a versioned private incomplete source-to-measurement projection; four private append-only purpose/grant/feedback/audit tables; bounded B6 actions on the existing ninth Function; and a manual-first comparison UI. Exact code/registry/transport pins are stored with private approvals and feedback. Original question wording is reference-only unless independently verifiable; complete actual scores remain withheld.

[Feasibility](docs/B6_FEASIBILITY.md) · [Candidate, SOP, security, tests and exact release boundary](docs/B6_CALIBRATION_CANDIDATE.md). Earlier entries below are historical.

# B5 Founder Scoring Lab candidate — production and all real-data gates held

Prepared from exact live B4.2 `4247e33322c9117b92f68718ed9408070b7b03e2`, preserving PR #29 and all eight existing Functions. Reuses unchanged B2/B2.1 mathematics and 50 fictional cases, deployed B4 coverage, B4.2 identity/SOP/pinned founders, current-session/scope checks and append-only patterns. Adds a versioned independent mapping contract, founder-only scenario/trace/comparison/preview/proposal UI, same-origin `roadmap-scoring-lab` Function, and unapplied forward migration `20261016215456_vitality_roadmap_b5_scoring_lab.sql`. No production migration/deploy, source lookup, participant scoring, cohort enrollment or derivative-write activation. Beta unchanged. Actual scores remain withheld; missing measurements and A/B/C calibration are explicit blockers. [Candidate, security, founder workflow, estimates and exact separate release/rollback gates](docs/VITALITY_ROADMAP_B5_CANDIDATE.md). Prior deployment notes below describe historical checkpoints.

# B4.2 founder identity verification candidate — not deployed

The production B4.1 baseline is preserved. An additive same-origin `roadmap-verification` Function forwards the caller JWT to one bounded metadata/attestation RPC. Four private append-only tables pin founder identity, issued lookup handles, separate SOP attestations and verification decisions. Detailed sources remain in place; only source/identity fingerprints and approval provenance are retained privately. Exact full-name/email lookup can narrow by UTC completion date. The existing Contact/historical review owns full identifier access. Operator preflight and the reviewed cohort procedure remain separate from the browser and release.

No cohort activation, source mutation, Roadmap draft, scoring, approval, release or email is added. All seven existing Functions and the PR #29 NDA correction are preserved. [Full candidate and architecture](docs/VITALITY_ROADMAP_B42_CANDIDATE.md). Older candidate notes below are historical; B4/B4.1 are live, B4.2 is not.

# B4 production founder workspace candidate — 2026-10-16

Production-main standalone review package reuses B1 document/rendering concepts and B3 pinned coverage without merging staging schema or scoring engines. Primary-origin Netlify transport forwards only the caller's JWT to one guarded RPC; private cohort/version/audit tables are append-only, source records remain in place, cohort defaults empty, draft authorization is separate. No PHI snapshots are duplicated in derivative tables, public release or mail endpoints added. [Exact candidate architecture and release boundary](docs/VITALITY_ROADMAP_B4_PRODUCTION_CANDIDATE_2026-10-16.md). NOT DEPLOYED.

# Holistic Foundations Pricing v2 implementation — 2026-10-10

The approved normalized architecture is now represented by an unapplied forward candidate: `program_product_plans` holds stable product structure, `program_plan_prices` holds market/currency/amount/route, and `payment_merchant_routes` holds isolated provider readiness without secrets. Enrollment stores immutable plan/price/market/route/commitment snapshots and accepts only contact plus plan code from staff. Annual eligibility is derived from authoritative membership history with a separately audited override. Agreement lookup is exact-plan/currency and Payments v1 re-resolves the catalog server-side. All agreement and payment switches remain held. [Detailed implementation](docs/HOLISTIC_FOUNDATIONS_PRICING_V2_IMPLEMENTATION_2026-10-10.md).

# Production Client Lifecycle technical foundation — reconciled 2026-10-08

The production lifecycle candidate is layered on the exact deployed Vitality reliability source. It preserves the existing production content, Vitality, reusable-content sync and RepDB architecture. The lifecycle migration adds normalized/idempotent contact and enrollment-intent contracts, verified account/signing/recovery boundaries, service-only delivery leasing and pre-payment member state. Its legal switch is fail closed: while `production_client_agreement_publication` is `held`, no Holistic Foundations agreement requirement can become active and no contract can be prepared or delivered. Payment satisfaction and paid access remain separate unreleased systems. [Reconciliation report](docs/PRODUCTION_CLIENT_LIFECYCLE_TECHNICAL_FOUNDATION_RECONCILIATION_2026-10-08.md).

# Vitality reliability local candidate — 2026-10-08

The existing secure Edge/private-command architecture remains authoritative. New browser protocol `intake_version=2` delegates the initial Netlify lead mirror to a durable new-draft reservation; old browser protocol preserves its existing ownership during rollout. Exact-email advisory serialization, unique initial-start claim and request-key digest suppress concurrent/replayed notifications and email sends. The private attempt journal stores credential digests, result states and provider IDs. Identical-byte provider retries use an environment-specific idempotency key; uncertain Netlify POST is not blindly retried. This is an at-most-one dispatch design, not a guarantee of delivery after process/network failure.

The prominent Contact confirmation and controlled recovery use the existing endpoint. Latest emailed credentials enter the existing exchange directly, including WebKit same-document fragment navigation. Only an opaque pending credential survives reload during startup; answers and identity never enter browser storage. Read/save/finalization SQL remains byte-identical. No member Auth, second verification API, plaintext mail queue, content/client promotion or provider configuration change. [Full local report and hosted release gate](docs/VITALITY_SAVE_RESUME_RELIABILITY_2026-10-08.md). Not deployed.

# Historical RepDB Exercise Library local candidate — 2026-10-07

## 2026-10-07 — Client lifecycle integrated candidate (NOT RELEASED)

Production-only lifecycle integration is locally prepared, not deployed. Authoritative atomic creation/enrollment/signing RPCs feed a compact pre-payment center. Separate private service-only leased outbox delivery and normal verified Auth/recovery replace legacy privileged identity/signature writes. Existing deferred household validation runs through its existing qualified definer trigger at authenticated COMMIT. Full paid access is held false and full beta member modules/assignments remain excluded. [Current release boundary](docs/PRODUCTION_CLIENT_LIFECYCLE_V1_2026-10-07.md).

# Applied RepDB DELETE contract repair — 2026-10-07

The enabled BEFORE ROW INSERT/UPDATE/DELETE source guard now returns OLD for every DELETE, including privileged cleanup; INSERT/UPDATE still return NEW with existing provenance checks. No trigger or dependency changes. Audit FK retention and workout RESTRICT remain enforced; polymorphic beta sync mappings require deliberate bounded cleanup. Normal UI lifecycle remains Archive, not DELETE. Production and beta applied once; no frontend redeploy. [Verified acceptance](docs/REPDB_DELETE_GUARD_REPAIR_2026-10-07.md). Earlier local/pending notes below are historical.

# RepDB Exercise Library local candidate — 2026-10-07

RepDB is a hash-pinned build-time private dataset and protected in-app Netlify adapter, not a live provider-key dependency. Durable exercise source envelopes and immutable slug identity are separate from local coaching/taxonomy/approval fields. Explicit source refresh preserves canonical workout/program references. The beta receiver accepts the complete previous exercise export format, rejects partial new provenance and preserves unrelated custom/provider rows with colliding names, enabling schema-first beta compatibility without interrupting current production exports. Forward content-sync export/receive contracts include only reviewed exercise fields and reuse an existing beta RepDB slug. Separate environment builds and migrations preserve production authority. [Release report](docs/REPDB_EXERCISE_LIBRARY_V1_2026-10-07.md). Not deployed.

# Live content sync architecture — 2026-10-07

Production-only protected Function/export RPC → beta-only atomic receive RPC. Reviewed 13-table reusable-content contract, dependency remapping, stable UUID mapping, version checks and immutable job retry. Production portal bootstrap now supplies the same public environment configuration as its built runtime. Production wins beta conflicts; no reverse or operational/private-data sync.

[Final hosted acceptance report](docs/FOODDATA_BETA_SYNC_ACCEPTANCE_2026-10-07.md). Earlier candidate entries below are historical.

# Production architecture release notes

2026-10-07 local candidate: FoodData Central is a protected Netlify Function adapter; imports become canonical local Foods with per-100-g composition, FDC/source IDs, source portions and versioned provenance. Recipes load local records and store whole/per-serving nutrition, measured weight, per-nutrient coverage and source-version snapshots. Explicit source refresh records history without recalculating published recipes. Approval is an independent ReVitalized classification. Reusable source envelopes/snapshots can travel in future one-way content sync; client/Auth/diary/target/history-actor data cannot. Preserve separate beta runtime configuration; never deploy a production-configured artifact to beta.

Food composition remains separate from reference and coach targets. The pure nutrient-target contract supports intake, age/sex/life stage, independently sourced/versioned reference and coach targets, and effective provenance without selecting recommendations. No production client-target/diary schema is promoted. [Detailed architecture](docs/FOODDATA_CENTRAL_V1_2026-10-07.md).

The released production application uses Supabase `voalfpxiyznnqfcqcymd` and Netlify site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Its runtime origin is `https://revitalizedacademy.com`. Staging uses a separate project, site, configuration and migration history.

The pending durable-content package extends the existing Programs Content Library. Recipes reference Food Library ingredients and store full nutrient JSON plus calculation provenance snapshots. Meal templates compose published recipes; workout templates compose published exercises; fitness programs schedule published workouts by week/day. Nullable program weeks supports the existing ongoing model; no new scheduling architecture is introduced. Foods use active/inactive; reusable parents use draft/published/archived.

Methodology identity and existing production guidance are retained. The editor exposes name, version and philosophy through the existing tables. Dedicated phase editors, phase/program organization, independently modeled meal options, and new clinical logic are not added. Existing hidden phase/guidance fields are preserved on edit.

Authoring uses the shared authenticated production Supabase client. The build manifest explicitly includes both builder scripts. Browser configuration remains production-only; no staging bridges are used. The nutrient catalog is reference metadata, not client targets/diary data.

Vitality Review is already released. Its read RPCs operate on the production secure assessment store and retain private-health/contact-scope gates. The production member/client lifecycle remains an older release and requires a separate coordinated acceptance package. See the current release report for actual deployed versus pending status.

One-way reusable-content sync: production Netlify `reusable-content-sync` verifies the caller and production site, obtains an immutable dependency export, sends it to the fixed beta receiver, then confirms the production audit. The beta receive transaction validates the field contract, remaps foreign keys and cached composition references, uses stable source mappings, and commits content/audit together. Identical job retries return the stored result; stale batches are rejected. The separate environment migration paths must never be applied to the opposite project.


## 2026-10-07 — Production lifecycle preparation (not released)

Production lifecycle draft reuses secure verified invitation claim/signing and pre-payment enrollment foundation. It is NOT applied. Full paid member access is held false until a separate approved payment integration; UI/Edge assembly remains pending. See docs/PRODUCTION_CLIENT_LIFECYCLE_V1_2026-10-07.md.
## Browser Auth initialization boundary — 2026-10-11

The staff portal treats Supabase `INITIAL_SESSION` as the storage-restoration boundary. The initial `getSession()` read is an optimization, not a final signed-out decision; an empty early read stays in a neutral restore view until the Auth event or bounded final read resolves. Bootstrap work is keyed by user/access token and guarded by a session epoch. Same-user token refresh reauthorizes without blanking the authorized workspace. A different user, logout, inactive staff state, or revocation invalidates pending work and uses the existing fresh-document privacy boundary.

### Candidate: source-pinned internal Roadmap processing (2026-10-19)

The isolated candidate adds a metadata-only completion outbox and genuinely authenticated founder worker above existing B4/B4.2/B5/B6 access. Separate private immutable versions/proposals/approvals preserve the read-only B4 source contract. The trusted backend seals exact computed JSON before caller-authorized commit. Existing completion/storage, source fingerprints, nine Functions, schedules and scoring engine remain unchanged. This is not hosted; all controls default off. See `docs/ROADMAP_INTERNAL_PROCESSING_V1.md`.
