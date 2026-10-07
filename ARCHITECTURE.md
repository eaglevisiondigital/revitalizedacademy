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
