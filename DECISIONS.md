# Production release decisions

2026-10-07: Implement the user-approved FoodData Central authoring package in an isolated production-content branch, without merging Payments v1 or staging. Prefer matched generic records over branded noise, preserve source-specific analytical definitions/portions, never substitute unknown with zero, reuse canonical FDC IDs, and preserve source versions. Only authorized Owner/Admin controls independent approval and explicit source refresh. Recipe title/image edits do not consume changed source nutrition. Production release is gated on a dedicated protected USDA key, matching server configuration, explicit single-migration/function+static approval and subsequent hosted acceptance. DRI/coach target architecture is prepared as a separate explicit contract; no targets or clinical guidance are invented. [Evidence and remaining gates](docs/FOODDATA_CENTRAL_V1_2026-10-07.md).

2026-10-06: Prepare a content-only production candidate on `codex/production-durable-content`, based on released production rather than merging staging. No remote release action is authorized by preparation alone.

Preserve real production methodology keys/names and their existing draft status. Do not duplicate them with staging methodology shells or invent guidance. Add schema-supported philosophy/version authoring; deeper phase/guidance tools remain separate work.

Reuse accepted Foods/Recipes/Recipe Builder/Exercise/Workout/Composition modules. Isolate only required content metadata/catalog/calculation changes into a new CLI-created production migration. Do not replay staging migrations or promote synthetic records.

Replace the audited legacy content policies with active approved staff plus effective `learning.manage` checks. Preserve role defaults and overrides; do not change client-private policy semantics. Anonymous/member/unsupported/inactive/pending staff cannot author.

Fix the legacy Account event bindings that throw before production auth initialization, while retaining the current Account module as sole handler. Do not replace staff/client onboarding architecture in this release.

Publish only after the reviewed GitHub source, single production migration and explicit production Netlify release are approved. Then use focused disposable-content acceptance and remove exactly those QA records. The release remains blocked until hosted durability, login and authoring pass.

Preserve separate U.S. merchant/U.S. settlement and Canadian merchant/Canadian settlement checkout architecture. USD versus CAD pricing remains unresolved. Payments/checkout/affiliate/provider/AI/wearable promotion is excluded.
