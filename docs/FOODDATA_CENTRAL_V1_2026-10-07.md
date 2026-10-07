# FoodData Central + Automated Recipe Nutrition v1

Status: locally implemented; remote release and hosted acceptance pending. `FOOD DATABASE PACKAGE BLOCKED` on the dedicated USDA credential, protected server configuration, and explicit migration/deployment authorization. Production, beta, Payments v1, Authorize.Net, client assignments and private health records were not changed.

Candidate branch: `codex/fooddata-central`, isolated checkout `revitalizedacademy-fooddata`, based on `e6aa1b0a5f35bb9bac78a173fa972b6d2c25eb26`. That base contains the prior Vitality decoder/historical migrations. Do not replay them. The reported production frontend baseline is source `77dbe985c4132503696915b34523dede68beee66`, deploy `6ac52af350af344e34bcfa31`; this package has no new deploy ID.

## Architecture and data quality

The browser uses a bearer-authenticated same-origin Netlify Function, `/.netlify/functions/food-database`. The function verifies the user with the configured environment's Supabase Auth service, then uses a service-only database RPC that independently checks active staff, completed Coach onboarding and effective `learning.manage` for every operation. Browser-supplied actor IDs are ignored. No USDA key or service-role key is in the public allowlist or generated public configuration.

Official USDA endpoints: POST `/foods/search` for search, POST `/foods` with one or multiple FDC IDs for full detail. The adapter supports Foundation, SR Legacy, Survey (FNDDS) and Branded. The default search excludes branded noise; Branded and All remain explicit options. Within generic results, Foundation precedes SR Legacy, then FNDDS. Matching the food, cultivar, preparation and source portion remains essential: Foundation uses analytical commodity samples, SR Legacy is a historical compilation, FNDDS describes foods as consumed, and branded entries use manufacturer label data. These do not have identical analytical coverage. The ranking is a starting point, not a claim that a mismatched Foundation record is preferable to an accurately matched FNDDS food.

The Food Library labels USDA Database Food, Branded Database Food and ReVitalized Custom Food independently of any custom free-text source label. Selecting a USDA food imports an inactive canonical record under an existing approved methodology. A unique provider/FDC-ID index and transaction advisory lock reuse the same food across methodologies and concurrent imports. Recipe Builder now reads all author-visible local foods, not just one methodology's foods. No methodologies, client identities or assignments are created.

Public source fields: `provider`, `fdc_id`, `source_data_type`, `source_portions`, `source_metadata`, `source_version`, `source_imported_at`. Metadata includes source description/brand/barcode, publication/update dates when supplied, per-100-g basis, original nutrient identifiers/units/amounts, mapping version and unmapped IDs. The SHA-256 version identifies the normalized source envelope. Imported compositions and source attribution are read-only in the ordinary editor; internal category, guidance, images and active/inactive lifecycle remain editable.

Owner/Admin with the existing content permission may independently mark/unmark **★ ReVitalized Approved**. Food Library supports All Foods / Approved / USDA / Branded / Custom filters. Approval does not change USDA composition or version and is audited with actor/time. A Coach with effective `learning.manage` can import reusable foods and author recipes, consistent with the existing global content permission; that does not confer any additional private-client access.

## Nutrient mapping and quantities

Adapter v1 explicitly maps **86 USDA nutrient IDs into 82 of the existing 101 catalog keys**. This covers calories, protein, carbohydrate, sugars and individual sugars, fiber/starch, fats, cholesterol, available omega components, vitamins A/C/D/E/K and B vitamins, choline, minerals, amino acids and supported compounds. Alternative energy and total-sugar IDs are prioritized rather than added together. Energy priority: traditional kcal, specific Atwater, general Atwater, then converted kJ. Total folate is mapped to total folate; DFE is not substituted for it. Unqualified 18:2/18:3 fatty acids are not guessed to be specific LA/ALA. No net-carb, aggregate omega, unmeasured clinical value or zero is invented. Unsupported nutrients are retained in source metadata, with no guessed catalog mapping.

`foodNutrients.amount` uses the USDA per-100-g basis, including branded full-detail records; `labelNutrients` is not mixed into that basis. Supported mass units normalize between g/mg/µg; kJ can convert to kcal. Known mapped nutrients with unsupported units, negative/nonfinite/string values or malformed source IDs are rejected. Null/absent amounts are omitted, genuine numeric zero is retained. Public development fixtures contain actual Fuji, Gala, banana, white bread and branded APPLE responses plus the Foundation apple search; no secrets or private data are stored.

Recipe quantities support grams, ounces (28.349523125 g per oz), and specific USDA portions using their supplied amount and gram weight. A source portion can describe a cup, piece, spoon or volume, but is used only when an authoritative gram conversion exists. Branded gram-based label servings become explicit portions. Milliliters without a source-specific conversion remain unsupported/unknown; no universal density or cup weight is assumed. Existing custom serving-size/grams-per-serving conversions remain available.

The existing calculator is extended to version 3. It stores whole-recipe totals, per-serving amounts, total recipe weight where independently calculable, conversion completeness, per-nutrient ingredient coverage, partial totals and ingredient source-version snapshots. A nutrient appears as a full total/per-serving value only when every ingredient has a numeric source value for it. Partial sums remain in metadata; they are not displayed as complete totals. Incomplete ingredients clear stale snapshots/multipliers. Missing serving count gives no per-serving values. Quantity edits/add/remove and serving changes recalculate automatically. A title/image-only edit preserves the stored composition.

Owner/Admin **Refresh from Source** fetches a new source envelope, retains before/after revisions in private history, and updates the canonical food. It never recalculates existing recipes automatically. Explicit ingredient/serving edits or Recalculate Nutrition capture the new source version. Recipe snapshots retain the earlier nutrients and version until then.

## Cache, limits and isolation

Search/detail responses are cached server-side for 30 minutes. Existing imports return their local record without querying USDA again; recipe loads make no provider requests. Expired caches/old quota buckets are removed during use. The atomic database budget limits each staff user to 60 provider calls/hour and this environment to 800/hour, below USDA's published default 1,000/hour/IP limit; provider 429s are handled without leaking request URLs. The function has a 45-second overall deadline and shorter Auth/database/provider timeouts. Development DEMO_KEY was used only for public fixture exploration; the deployed adapter explicitly rejects DEMO_KEY.

One-way production-to-beta content sync is **compatible by data contract**, not newly implemented by this task. Transfer reusable methodology/food/recipe/composition fields, including the full source envelope, independent approval, ingredient source-portion IDs and nutrition snapshots. Preserve/remap content IDs consistently and enforce FDC uniqueness on the receiving environment. The receiver needs this forward schema before sync; don't replay production historical migrations there. Recipes calculate from local imported data without a beta USDA key. Exclude private source-history actors, API cache/quota tables, Auth/staff/client records, diary logs, client targets and assignments. Never resolve sync conflicts by overwriting local custom foods or silently recalculating published recipes.

## DRI and daily nutrient contract

Reviewed beta `client_nutrient_targets` and `nutrition_methodology_targets`: these use nutrient IDs, min/target/max, source and active state; the effective resolver prioritizes coach overrides over program defaults. Production currently has neither target nor diary tables. This package does not promote those private schemas or modify their authorization.

`netlify/lib/nutrient-target-contract.cjs` prepares a pure explicit contract: nutrient key/unit, measured consumed amount, age/sex/life-stage context, independently sourced/versioned reference target, coach target, effective target and effective-source provenance. It preserves an absent target/intake as unknown and requires matching units. Authorized future diary/RPC callers must supply approved reference selection and current authorized coach overrides; the helper never chooses recommendations from demographics or food composition. No DRI values or clinical recommendations are seeded. A later approved target-schema package must preserve reference/source/version and applicability independently of client overrides, behind existing health-private/contact-scope/plan-override gates.

## Migration, build and tests

Only new candidate migration: `supabase/migrations/20261007050706_fooddata_central_recipe_nutrition.sql` (CLI-created). Adds food source fields/unique identity, source portion on ingredients, private RLS cache/quota/history, source-write guard, Owner/Admin approval RPC, service-only provider RPC and the replacement recipe calculator. Existing content RLS remains enabled and unchanged; all new private tables are RLS-enabled with no browser grants/policies. Definer functions have empty search paths; PUBLIC/anon execution is revoked and grants are explicit. No staff role/default/override grants, private-client policy changes or production data imports occur.

Netlify uses the existing production build script and public allowlist, now explicitly `publish=production-dist` with server functions outside the publish directory. This prevents server-source publication. The new function bundles successfully using Netlify zip-it-and-ship-it 14.1.13/esbuild. Package output is local only. Deployment must include the function bundle and matching static build, not just upload the static directory.

Local results:

| Check | Result |
| --- | --- |
| Production build | 380 public files; correct production runtime; new assets included |
| JavaScript syntax | 93/93 passed |
| Existing assessment/content frontend | 63/63 passed |
| Vitality Review frontend | 10/10 passed |
| FDC adapter/server/contract | 10/10 passed |
| Native PostgreSQL 17 | 72/72 passed, disposable databases removed |
| Existing Edge suite | 19/19 passed |
| Existing content/account browser | 36/36 passed, 3 viewports, zero hosted writes |
| New food database browser | 51 checks at 1440×1000, 768×1024, 390×844; read-only source editor, filter/approval/search/portion/quantity behavior; zero hosted writes |
| Older build snapshot tests | 34 passed / 28 failed; identical 28 failures verified on untouched `e6aa1b0`; unrelated historical hashes/markup expectations |

The older failures are not corrected or hidden by this package. The nine previously reported beta agreement/onboarding-origin fixture failures are separate; this production-content branch does not include that beta suite and does not claim to resolve them. Dedicated-key/provider and authenticated hosted acceptance remain untested until configuration/release approval. Development public API retrieval and isolated fixtures are not hosted acceptance.

New live asset expectations after an authorized release: `portal-programs.js?v=177`, `portal-recipe-builder.js?v=104`, `portal-food-database.js?v=100`, `portal-food-database.css?v=100`. Existing `portal-programs.css?v=167` remains unchanged.

## Protected configuration and exact next gate

**First configuration item:** Netlify production project `revitalizedacademy`, site ID `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06` → **Project configuration → Environment variables → Add variable**:

- Name: `USDA_FDC_API_KEY`
- Value: dedicated key obtained directly from [Data.gov](https://api.data.gov/signup/) (never post it in chat)
- Mark secret; scope **Functions** only; deploy context **Production** only.

No Supabase USDA secret or browser variable is required. The same Netlify function also needs matching environment-specific protected server configuration: `RVA_FOOD_DATABASE_SUPABASE_URL` = `https://voalfpxiyznnqfcqcymd.supabase.co`, `RVA_FOOD_DATABASE_SUPABASE_ANON_KEY` = this project's publishable/anon key, and secret `RVA_FOOD_DATABASE_SUPABASE_SERVICE_ROLE_KEY` = this project's service-role key. Populate through protected settings only, Functions/Production context. No key values are requested/displayed in this report. If beta is later authorized, configure its own project/key/context on its separate Netlify site; never copy production service credentials into beta. Netlify runtime secrets take effect on a fresh deploy.

After protected configuration, request explicit approval to publish the reviewed `codex/fooddata-central` candidate, apply **only** `20261007050706_fooddata_central_recipe_nutrition.sql` once to production `voalfpxiyznnqfcqcymd`, and deploy its exact static artifact plus `food-database` function to production site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Do not merge Payments v1 or all staging. No broad migration push. Then perform approved disposable-food/recipe hosted Owner acceptance and cleanup; service-only history references need an explicitly reviewed cleanup method rather than deleting real content. No hosted acceptance records have been created yet.

## Sources

- [USDA API guide](https://fdc.nal.usda.gov/api-guide/): endpoints, key requirement, rate limits and attribution.
- [USDA data documentation](https://fdc.nal.usda.gov/data-documentation.html): data types, nutrient basis, portions and analytical differences.
- [USDA FAQ](https://fdc.nal.usda.gov/faq.html): source coverage/definitions and intended uses.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): policies, roles and data boundaries.

Chat handoff: FoodData Central v1 is implemented locally with 82 catalog keys mapped from 86 USDA IDs, canonical imports, explicit source portions, measured full-recipe/per-serving calculation, independent Owner/Admin approval and source-version preservation. Local functional/security/PG17/responsive gates pass; 28 inherited legacy snapshot failures are unchanged. No remote systems changed. Next is protected `USDA_FDC_API_KEY` configuration, environment-matched server credentials, then explicit single-migration/function+static production release approval and hosted acceptance. `FOOD DATABASE PACKAGE BLOCKED` until those gates pass.
