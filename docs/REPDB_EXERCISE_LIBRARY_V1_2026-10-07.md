# RepDB Exercise Library v1 — local release candidate

Date: 2026-10-07. **EXERCISE LIBRARY READY FOR RELEASE**, subject to explicit hosted release approval. This is local implementation/test evidence, not deployed acceptance. No remote push, migration, configuration change, hosted content write or deployment occurred.

## Source and license gate

Publisher: [RepDB official distribution](https://github.com/RepDB/exercise-dataset). Reviewed [Free Tier v1.0 license](https://github.com/RepDB/exercise-dataset/blob/a360f87f9064de42a9c90228cfebae941a5016d5/LICENSE-DATA.md) permits this commercial in-app use with attribution. No material discrepancy found. Earlier MuscleWiki/API Ninjas durable-storage blockers are superseded for this package; neither provider is used.

Pinned source: `a360f87f9064de42a9c90228cfebae941a5016d5`, schema 3, **609 exercises** (publisher expanded the earlier approximately 601 count). `config/repdb-source.json` records commit, count and exact dataset/license SHA-256. Builds verify both hashes and schema/unique IDs; changed bytes fail the build rather than silently changing source/license. No RepDB key is required.

Visible **Exercise data by RepDB (repdb.co)** links appear in the project README, exercise tools, source search/refresh dialogs, imported rows and source details. The publisher license is retained in the private server bundle. JSON is fetched at build time into ignored `netlify/private-repdb`, never committed as a republished dataset or included in either public manifest. Search is a bounded authenticated in-app operation, not a public/bulk data service. Paid preview animations and AI-derived imagery are excluded.

Media: pinned free flat-style WebP references only; no transformations or image training. A representative Goblet Squat source illustration returned HTTP 200 / image/webp. Metadata/records are durable locally; image availability depends on the pinned publisher host. Isolated browser traffic is blocked, so screenshots intentionally show image fallback rather than proving live media delivery.

## Application and database behavior

Production: `codex/repdb-exercise-library` in `revitalizedacademy-repdb`, based on accepted production ancestry `c20630135ffb211db92d6eaf5c7229b829fbe097`. Beta: separate `codex/repdb-exercise-library-beta` in `revitalizedacademy-repdb-beta`, based on latest local beta ancestry `986d0a9e134f8885deb92ebb9d89fa16a74f3e66`. Narrow shared patches preserve beta enrollment/invitation fixes; a production-configured artifact must never be deployed to beta. Original accepted checkouts and uncommitted provider-gate documentation are preserved.

Programs → Content Library → Exercises now exposes **Search Exercise Library**, **Create Custom Exercise**, source/approval/muscle/equipment/movement filters, source attribution and thumbnails. Search covers squat, deadlift, push-up, row, shoulder press, lunge, curl and plank. Add imports into an existing fitness methodology as published exercises, immediately selectable by the existing Workout Builder. Approval remains independent.

Canonical UUIDs use a unique `(exercise_provider, provider_exercise_id)` RepDB identity. Different variants remain distinct; repeated import reuses the UUID. Existing methodology/name uniqueness is retained; colliding provider display names gain a stable RepDB slug suffix while original source naming is preserved. Transactions serialize source imports.

Stored source: slug/version/name/description, primary/secondary/body muscles, equipment, category, force/mechanic/difficulty, goals/tags, MET, instructions/tips, free media references and attribution; plus import time. Null MET remains unknown and genuine zero survives. RVA fields are separate: approved flag, all 17 approved muscle labels, all 13 functional classifications, coaching cues and existing local instructions/name/notes/tags/media. Original source muscle fields remain intact. Deterministic anatomy mapping covers the publisher catalog; `serratus_anterior` lacks an unambiguous approved label and remains source-only for manual review. Functional movement starts unclassified, without guesses from name/force.

Owner/Admin may correct local taxonomy, classify movement, mark/unmark approval and explicitly refresh one source. Dataset updates require reviewing/re-pinning commit/hashes/count, running tests and releasing the new package; **Refresh from Dataset** then applies that reviewed snapshot. No uncontrolled URL upload/latest lookup is exposed. Refresh changes source/version only, preserves all local overrides and workout/program UUID references, and appends a private actor/time/version audit event. Existing permitted custom authoring remains available; unauthorized staff cannot mutate imported global records.

Exercise → Workout → Fitness Program uses existing sets, reps, duration, rest, order and coaching notes. Four-week, twelve-week and ongoing program references pass native database checks; no new schedule architecture is introduced.

## Security and production → beta

`exercise-library` is a protected Netlify Function. It binds the exact site/project/custom origin, verifies the bearer via that environment's Auth and rechecks active Owner/Admin plus effective `learning.manage` in SQL. It reuses existing Functions-only FoodData Supabase secrets; no new provider secret or browser service key. Search returns at most 20 matching records; public download, arbitrary actor/destination, offset/bulk and unapproved-origin actions are rejected.

The new server RPC is service-role-only; browser and anonymous execute are revoked. Empty definer search paths and qualified references are retained. Existing RLS is unchanged. A source trigger blocks browser provenance forgery, imported record edits by unauthorized staff and unauthorized approval changes. Nullable source-identity constraints fail closed; taxonomy is constrained. No role defaults/overrides, permission catalog, private-health rules, clients, feature flags, payments, SMTP/SMS or Edge Functions change.

The accepted one-way sync is already live. Beta receiver compatibility permits applying its schema first while current production exports continue working; partial new provenance remains rejected. Custom/provider name collisions preserve both records, never convert one into the other. This package extends its explicit contract with reviewed exercise source/local fields. Production Exercise, Workout dependencies and Program dependencies travel with stable beta mapping; beta-only imports of the same RepDB slug are reused. Beta edits do not change production; deliberate resync restores production authority. No reverse endpoint, bulk publisher export or client/health/Auth/staff/assignment/payment/message transfer is introduced. Earlier export/receive migrations are replaced forward through this new migration, never replayed.

## Prepared migration/files

**Unapplied:** `20261007201539_repdb_exercise_library.sql` in production `supabase/migrations`, with a distinct compatible beta file in production `supabase/environment-migrations/beta` and beta candidate `supabase/migrations`. Apply the appropriate file once per environment after checking the live ledger. Production extends the export; beta extends the receiver. No old migration replay.

Major files: `netlify/functions/exercise-library.mjs`, `netlify/lib/repdb.cjs`, `netlify/lib/exercise-library-service.cjs`, `netlify/lib/content-sync-contract.json`, `config/repdb-source.json`, `scripts/prepare-repdb.cjs`, new portal Exercise Library JS/CSS, narrow Programs integration, public allowlists, build/bundle configuration and maintained tests. Documentation: CURRENT_BUILD_STATE, ARCHITECTURE, SECURITY_MODEL, DECISIONS, README and this report.

Prepared assets in both: `portal-programs.js?v=179`, `portal-programs.css?v=168`, `portal-exercise-library.js?v=100`, `portal-exercise-library.css?v=100`.

## Validation

- Production build: 383 public files. Beta build: 321, separate staging runtime/project; isolated local public-key fixture only, release build must use existing protected site configuration.
- Production syntax: 108 checks passed. Beta standard syntax: 83 passed.
- RepDB maintained source/adapter/API/DOM tests: 16/16 in each candidate, real pinned catalog/search/hash/media/mapping and anonymous/member/unauthorized/origin/environment denials.
- Production PostgreSQL 17.11: 84/84 (73 existing plus 11 new RepDB tests).
- Beta PostgreSQL 17.11: 287/287 (276 existing plus 11 new RepDB tests).
- Dual disposable PostgreSQL 17 sync: 11/11, including direct exercise, workout/program dependency trees, stable mapping, separately imported beta slug reuse, same-name custom/provider preservation in both directions, old-format rollout compatibility, production-wins resync, rollback and forbidden-data/reverse denial.
- Existing Vitality Edge tests: 19/19; no Edge source changes.
- Exact-built isolated Chrome: 46 checks per environment at 1440×1000, 768×1024, 390×844. Search/import, attribution, approval, local edit, custom entry, controlled refresh and access reset; no runtime warnings/errors or horizontal overflow. Visual mobile screenshots reviewed.
- Netlify's actual packaging utility produced the protected Function ZIP with the reviewed license/private dataset and existing FoodData/sync Functions. No dataset exists in public build output.
- Broad legacy production sweep: 130 pass / 28 inherited obsolete snapshot failures at the sweep checkpoint. Unmodified baseline: 115 pass / the identical 28 failures. No new failing assertion. Additional beta-isolation test passed after that sweep. These obsolete page/hash expectations do not certify current production or block this tested feature package. The historical nine agreement-origin fixture failures are not present in the current beta native suite; no claim is made about unexecuted hosted agreement behavior.

Current maintained production frontend suites: **107/107**. Full beta frontend sweep: **573 passed, zero failed, 27 expected skips** (600 total). Hosted acceptance has **not** run; local tests must not be described as a production/beta launch.

## Exact release gate and next package

User approval is required for pushing these new candidates, applying the two new environment-specific migrations, and production/beta Netlify deployments. Earlier approvals were for exact different packages, not this migration/release. This stop follows the current task's explicit hosted-release gate and AGENTS.md protection of production-sensitive systems.

After approval: recheck remote branch/site/ledger state and secret-name configuration without displaying values; push reviewed candidates without merging unrelated systems; apply the beta-compatible schema/receiver migration first (it accepts complete old exercise exports and rejects partial new provenance), then apply only the new production migration; deploy production Functions/public allowlist; verify exact assets and normal Owner/Admin search/import/custom/approval/edit/archive/refresh/workout/program operation at required sizes. Use bounded disposable acceptance content and preserve audit evidence; remove those records in dependency order through a reviewed cleanup path (source audit foreign keys require deliberate audit-aware cleanup). Verify denials without granting roles. After production passes, deploy the separate beta frontend/Function candidate (its compatible migration is already applied); repeat acceptance and deliberate prod→beta dependency sync with repeat/resync/no-private-data/no-writeback checks. Confirm cleanup and existing USDA/Vitality/operational fingerprints remain intact.

Do not claim deployed acceptance or change unrelated systems. No additional provider/license/key decision is outstanding. Remaining gate: approval and controlled hosted release/acceptance.
