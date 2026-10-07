# FoodData production, beta and reusable-content sync acceptance

Date: 2026-10-07. Status: **FOOD DATABASE + BETA SYNC FULLY ACCEPTED**.

This report supersedes earlier candidate/pending-release checkpoints for this package. It certifies this FoodData/content-sync scope; it does not promote unfinished client/payment features or issue the project's separate final beta green flag.

## Completed and deployed

| Environment | Application source | Final Netlify deploy | URL |
|---|---|---|---|
| Production | `f5eabc1d7427ca6198957f42b46c329ef462baa0` | `6ac5fda10ae8b03a2ddf176e` | https://revitalizedacademy.com/portal/#programs |
| Beta | `888ae5ad74c872464260437be5eeb1c069fe5d9e` | `6ac5fcfa32ab22338c0799a3` | https://beta.revitalizedacademy.com/portal/#programs |

Production branch: `codex/fooddata-beta-sync`. Beta branch: `codex/beta-fooddata-sync`, preserving the accepted beta ancestry. Subsequent documentation/test-only commits do not change these deployed application SHAs. Both final control-plane deploy states are `ready`.

Both sites return HTTP 200 and exact built bytes for `portal-programs.js?v=178`, `portal-programs.css?v=168`, `portal-recipe-builder.js?v=104`, `portal-food-database.js?v=101`, `portal-food-database.css?v=100`, and `portal-content-sync.js?v=100`. Portal HTML differs from the local build only in Netlify's existing pretty-URL rewrite of the Website Programs link (`../plans.html` → `/plans`, attribute quote/order normalization); bootstrap and application assets match the approved release.

## Applied migrations — do not replay

| Environment | Source migration | Applied ledger | Name |
|---|---|---|---|
| Production (previously applied) | `20261007050706` | `20261007062854` | fooddata_central_recipe_nutrition |
| Production | `20261007072413` | `20261007072537` | food_source_unchanged_refresh_audit |
| Production | `20261007073533` | `20261007080049` | reusable_content_sync_export |
| Beta | `20261007072948` | `20261007073128` | beta_fooddata_central_compatible |
| Beta | `20261007073534` | `20261007080053` | reusable_content_sync_receive |

Ledger entries were independently rechecked after hosted acceptance. No migrations were replayed. No Edge Function redeployment was needed.

## Mobile and source-refresh acceptance

Narrow Program Access/card shrink/wrap CSS repair removes inherited horizontal overflow. Actual hosted desktop/tablet/mobile viewports were 1440×1000, 768×1024 and 390×844. Production: 21 Content Library/sync-dialog cases; beta: 18 library cases. Document, rows and dialogs fit at each actual viewport width. The isolated built editor suite additionally covers FoodData/forms and sync controls at the same sizes.

The existing native USDA confirmation was replaced by an accessible in-page confirmation, with cancel/Escape/focus handling. The server refresh architecture is preserved.

Hosted production Owner refreshed one disposable Fuji apple (FDC 1750340): successful provider lookup, 27 nutrients, valid 140 g source portion and source version. There remained one Food. Linked recipe/ingredient references and nutrition snapshots were unchanged. A successful unchanged-source refresh had previously lacked an audit event; the narrow migration now records `refresh_unchanged`. The accepted refresh event was recorded at `2026-10-07T07:28:37.606646Z`, after import at `07:27:04.533998Z`. Before/after food, recipe and ingredient hashes were identical. No silent recalculation or destructive mutation occurred. Disposable records were removed.

## Beta FoodData acceptance

Released only after production mobile and refresh acceptance passed. Existing beta Owner session loaded normally. Hosted USDA search/import, ReVitalized Approved designation, custom food and recipe calculation passed. Imported Fuji: 27 nutrients and valid source portions. Recipe: two servings, 100 g apple, complete measured calculation with no incomplete ingredient; per-serving energy 29.10153 kcal and potassium 51.9 mg illustrate macro/micronutrient calculation. Custom food retained genuine protein zero and omitted unknown blanks. Production had zero corresponding beta test foods/recipes. Beta fixtures were removed; existing beta client-assigned fixtures remained intact.

## Sync architecture and eligible/excluded content

Production Owner/Admin uses **Sync to Beta** on one row or selects multiple rows across Content Library tabs and chooses **Sync Selected to Beta**. Confirmation makes production authority and overwrite behavior explicit. Dependency trees travel automatically. Beta displays **Synced from Production**, source reference, version/update time and last-synced time; it exposes no reverse action.

The production Netlify Function validates exact production site/project/origin, verifies the current bearer identity and rechecks active Owner/Admin plus effective `learning.manage`. A service-role-only production export RPC creates an immutable job and audited content envelope. The server submits that envelope to the beta-only service-role receiver, then records its verified receipt in production. Uncertain delivery/acknowledgment is retryable using the same immutable job rather than inventing a second job.

The explicit 13-table contract includes foods, reviewed nutrient/source metadata, recipes/ingredients, meal-plan templates/items, nutrition methodologies/phases, exercises, workout templates/composition, fitness programs/workout schedules and fitness methodologies. Fields and nested source/snapshot JSON are whitelisted; unconstrained metadata and creator identities are excluded. The program catalog/client entitlements are not indiscriminately copied.

Excluded: contacts, clients, households, Auth/staff identities and permissions, Vitality, health/private notes/goals/logs, assignments and completions, payments/invoices/subscriptions, agreements, messages/notifications/referral activity and all other operational tables. Audit initiator identifiers are recorded as required, without copying any Auth or staff record.

Dependencies are ordered, source UUIDs map to separate stable beta UUIDs, and embedded food/recipe references are remapped. Repeats update copies instead of duplicating them. Production wins over beta edits. Atomic receiving, serialized mapping writes, version verification, stale-export rejection and idempotent job receipts protect consistency. Obsolete mapped composition children are pruned without deleting unrelated beta data. Bounds: 1–20 roots, at most 500 nodes and approximately 2 MB per operation.

## Hosted sync acceptance

All twelve requested cases passed:

1. Production custom Food → beta.
2. Production USDA-backed Food → beta with 27 nutrients/source metadata.
3. Recipe plus two ingredients and required foods → beta; embedded food UUIDs remapped.
4. Meal Plan dependency tree → beta.
5. Exercise → beta.
6. Workout/exercise dependency tree → beta.
7. Fitness Program/workout/exercise tree → beta.
8. Repeated/multi-selected sync retained all 15 beta mapping IDs without duplicate copies.
9. Normal beta recipe edit did not change production title or nutrition.
10. Subsequent production edit/sync overwrote the beta edit, updated source version and retained beta IDs.
11. Private/operational records did not transfer.
12. Both environments retained complete source/target/type/initiator/time/version/result audit evidence.

Seven single-root jobs were followed by a two-root selected sync (15 dependency nodes) and a recipe re-sync. Total: **9 complete jobs, 56 complete record audit events in each environment, zero pending jobs**. Recipe nutrition hashes matched across environments (`dba5fcfffda687237660bc52ef4b1039`), with unknown nutrients still unknown. Hosted production/beta consoles were clean after final acceptance.

## Security and isolation

Hosted Owner exercised normal UI actions. Native PostgreSQL 17 independently proved Owner/Admin authorization and Coach/member/anonymous denial, including Coach with library permission but no Owner/Admin role. Hosted unauthenticated production sync/export and beta receiver calls were denied; beta endpoint rejected reverse invocation even with spoofed production Origin. Hosted distinct-Admin login was not used; Admin role acceptance is independently exercised in native authorization fixtures.

Production USDA/Supabase keys and the production-only `RVA_CONTENT_SYNC_BETA_SERVICE_ROLE_KEY` remain protected Functions-only secrets. Beta has no production service credential. No browser response, public build or log exposed secret values. Endpoint bodies cannot override actor or target. Export/receive definer functions use empty search paths, fixed reviewed identifiers and restrictive execution ACLs; private jobs/audits deny browser access. Beta source labels obey existing content authoring RLS.

Before/after metadata counts and hashes for Auth users, staff, contacts, Vitality reports and workflows were unchanged independently in both projects (production counts 5/4/19/5/17; beta 9/5/12/1/2). No private production data, identity, permissions, assignments, payment state or messaging configuration was promoted. Production remains authoritative; beta never writes back.

## Tests and limitations

| Check | Result |
|---|---|
| Production build / beta build | 381 / 318 public files generated |
| Production JavaScript syntax / beta existing syntax suite | 96/96 / 80/80 |
| Relevant production frontend | 81/81 |
| Beta full frontend | 537 passed, 0 failed, 27 historical expected skips (564 total) |
| Production native PostgreSQL 17 backend | 73/73 |
| Beta native PostgreSQL 17 backend | 268/268 |
| Dual-database PostgreSQL 17 sync | 6/6 |
| Edge tests | 19/19 |
| Sync UI/server/packaging | 8/8 |
| Final production bootstrap + sync/durable-content checks | 19/19 |
| Exact-built isolated responsive FoodData/sync browser checks | 66 checks; no runtime errors or hosted writes |

A broad legacy production test glob separately yielded 114 passed / 30 failed of 144: 28 obsolete Build76–82 byte-snapshot expectations reproduced identically on the untouched starting production baseline, plus two browser entrypoints invoked without their dedicated runtime environment. Relevant current suites and the properly configured browser suite passed. These inherited diagnostic failures were not hidden by changing unrelated homepage/webinar code. Known agreement-onboarding-origin fixture history is separate from this package; the current native beta suite passed all 268 tests.

## Cleanup and documentation

All disposable source-refresh and beta FoodData fixtures were removed. Sync acceptance removed exactly 15 eligible content rows from each environment plus their beta source mappings and QA-specific food histories, after checking foreign-key references to prevent deleting unrelated data. The nine jobs/56 audit events were retained as immutable release evidence. Existing production workout and original beta Food/Recipe/Meal/Exercise/Workout/Fitness Program fixtures were preserved. No hosted operational/client records were deleted or changed.

Main implementation files: `portal-programs.css`, `portal-food-database.js`, `portal-content-sync.js`, `netlify/functions/reusable-content-sync.mjs`, `netlify/lib/content-sync-service.cjs`, reviewed `content-sync-contract.json`, migration generator/production-export/beta-receiver migrations, and production portal runtime bootstrap in `build-production-vitality.cjs`. Updated maintained server/UI/packaging/PostgreSQL/browser tests. CURRENT_BUILD_STATE, ARCHITECTURE, SECURITY_MODEL and DECISIONS record the live state and architecture.

No remaining FoodData/sync acceptance blocker. No unrelated work started. Existing Git continuous-deployment configuration was preserved: future branch integration must retain these accepted application changes or a later unrelated build can replace the manual deploy. No merge to main or deploy lock was performed.

## Next use and Chat handoff

Justyn/Elle can now build permanent reusable content once in production, then deliberately sync selected content/dependency trees to beta as an authorized Owner/Admin. No additional application release is required to use this functionality. Beta edits are local tests and can be overwritten on the next approved production sync.

Chat handoff: FoodData mobile/source-refresh acceptance, beta release and one-way reusable-content sync are deployed and accepted. Production deploy `6ac5fda10ae8b03a2ddf176e`; beta deploy `6ac5fcfa32ab22338c0799a3`. Twelve sync acceptance cases passed, including stable repeat IDs and production-wins overwrite; 9 jobs/56 audits, all disposable content cleaned, secrets private and operational/private data unchanged. Production remains authoritative. **FOOD DATABASE + BETA SYNC FULLY ACCEPTED**.
