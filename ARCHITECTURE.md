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
