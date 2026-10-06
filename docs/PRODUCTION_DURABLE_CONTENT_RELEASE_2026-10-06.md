# Production Operationalization + Durable Content Release v1 — prepared, not released

Date: 2026-10-06. Status: **PRODUCTION DURABLE CONTENT BLOCKED**.

Exact blocker: this package still requires remote GitHub publication, one production migration and Netlify deployment approval, followed by focused authenticated production acceptance. No new production schema, configuration, data or deployment was changed during preparation.

## Evidence and environment

- Implementation repository: `eaglevisiondigital/revitalizedacademy`.
- Candidate branch: `codex/production-durable-content`, based on production documentation `c72e328` / deployed application `4a2d293`.
- Production site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`; current deploy remains `6ac520ad289a6b34347af163` (control-plane rechecked).
- Production database: `voalfpxiyznnqfcqcymd`; latest applied ledger entry remains `20261006162255 vitality_assessment_staff_review`.
- Candidate migration: `20261006164158_production_durable_content.sql`, newly CLI-created, **unapplied remotely**.
- Existing staging source/modules were inspected at `88ee646`; no staging configuration, customer records or full staging migration set was copied.
- Live database audit: production foods=0, recipes=0, exercises=0, workouts=1, meal templates=0, fitness programs=0. Existing real rows are preserved. Production methodology keys are `revitalized-nutrition` and `revitalized-fitness`, both draft.
- Production Justyn (`justyn@revitalizedacademy.com`) and Elle (`elle@revitalizedacademy.com`) already have active Owner records with complete onboarding and all-person scope. No new identity/role setup is needed based on current server records. Fresh browser acceptance is still required.

## Module classification

A means existing production-safe narrow functionality; B means candidate ready for narrow deployment/migration plus hosted acceptance; C means one coordinated hosted acceptance/release package required; D means staging-only/unresolved.

| Module | Production status | Notes |
|---|---|---|
| Vitality Assessment / Review | A: released | Secure capture, recovery/referrals and staff Review exist in production; RPC private-health + contact scope verified. Fresh Owner UI acceptance included after login fix. |
| Production staff access | B | Real Owners active; candidate removes legacy Account null-listener crash and refreshes permission/content loading. Fresh credential login remains pending. |
| Foods / ingredients / custom foods | B | Source/barcode/serving metadata, full nutrient JSON, create/edit/activate/deactivate. Food has no archive status model. |
| Recipes / Recipe Builder | B | Ingredient linking, grams/serving conversion, 101 nutrients, numeric-only calculations, provenance snapshots, draft/publish/archive/edit. |
| Meal plans / reusable menus | B | Existing templates and day/slot recipe composition. No newly invented meal-option system or phase editor. |
| Exercises | B | Detailed type, muscle arrays, equipment, cues/restrictions/media. Existing category/environment constraints preserved. |
| Workouts / Workout Builder | B | Exercises, sets/reps/rest/optional duration, metadata/media, edit and lifecycle. |
| Fitness programs | B | Week/day workout scheduling, 4–12-week structures supported by existing weeks field; ongoing uses existing nullable weeks. |
| Methodology | B | Existing records retained; philosophy/version/name editing only. No clinical content invented. |
| Client records / real creation | C | Accepted staging repair/lifecycle/security release must be reconciled with older production and independently accepted. Existing People read-only operations are not replaced. |
| Real staff creation / scoped access | C | Existing real Owners retained. New scoped staff setup/recovery/revocation requires coordinated staging-to-production code/migration review and hosted acceptance. |
| Enrollment | C | Preserve production baseline; no staging activation/payment state promoted. |
| Agreements / member setup | C | Accepted staging lifecycle needs its own reviewed deployment and hosted signer/recovery acceptance. |
| Member dashboard | C | Production old member bundle remains unchanged; premium staging shell/session protections not silently promoted. |
| Health & Progress | C | Configurable metrics, scopes and hosted acceptance require a separate narrow package. |
| Member Nutrition | C | Reusable library authoring does not certify client diary/targets/assignment delivery. |
| Member Workouts | C | Library builders do not promote private member assignment lifecycle. |
| Meal / fitness assignments | C | Preserve existing production data. Require client A/B visibility and scoped staff acceptance on production candidate before real client rollout. |
| Payments | D | No processor/checkout enablement; synthetic ledger state excluded. |
| U.S./Canada checkout | D | Preserve separate merchants/settlement; USD/CAD pricing unresolved. |
| Affiliate/commission, AI, wearables, incomplete providers | D | No promotion or feature/provider change. |

## Candidate implementation and limits

The new content-only migration adds existing accepted media/serving/source columns, the approved reference nutrient catalog, calculation fields and the repaired calculation RPC. It replaces only audited content-table policies. It does not seed methodologies, client data, targets, diaries, roles, grants or mail allowlists. The hardened helper independently denies inactive/pending staff despite residual overrides in the older generic helper.

The exact production build explicitly publishes Recipe Builder and Composition Builder. Sidebar shortcuts open the existing Programs content workspace. Reusable parent content supports editing without replacing hidden phase/guidance metadata; foods use the actual active lifecycle. Methodology philosophy/version editing uses existing schema. The core Account listener exception is removed so auth initialization can run; existing Account module remains the single owner.

Recipe calculation processes real JSON numeric values, preserves zero, ignores null/non-numeric/non-object values, clears stale incomplete snapshots, serializes same-recipe recalculation, and avoids claiming per-serving totals or completion when no positive serving count exists. Empty recipes remain incomplete.

Existing audit fields/snapshots are preserved. No complete immutable library audit history is claimed. Optional nutrient-target/diary modules, dedicated phase organization, new meal-option models and unrestricted production client operations remain outside this package.

## Validation

- Production build: 378 files; configured production ref/origin verified. Both builder bytes match exact source and are allowlisted.
- Public JavaScript syntax: 67/67 pass.
- Existing Vitality frontend suites: 62 pass. Candidate frontend: 11/11 pass after correcting missing browser primitives in the JSDOM fixture. Initial combined run had six fixture-only failures; real Chrome had no corresponding runtime errors.
- Native PostgreSQL 17: 50/50 pass, including 18 content/schema/math/RLS checks plus 32 existing Vitality private-read/save/resume checks. Restored the observed September 26 baseline plus **only five production forward files**, not staging migrations. A new isolated database was dropped after every run. An initial duplicate-name fixture and invalid-serving fixture assumption were corrected; existing serving constraint was preserved.
- Exact-built headless Chrome: 36 responsive/runtime checks pass at 1440×1000, 768×1024, 390×844; 18 editor layouts plus Recipe Builder, three composition builders and both Account entry paths at each viewport. No horizontal overflow, runtime error or fixture write occurred. External requests were blocked.
- Security: Owner/Admin + effective-author Coach allowed; explicit denial, unsupported staff, inactive residual override, pending Coach, member and anonymous writes denied. Draft visibility restricted, published reusable library semantics retained. RLS enabled on all 13 promoted tables; definer fixed empty search paths and anonymous revokes checked. Vitality unassigned-contact/private-table denial regressions pass.
- Known nine agreement-onboarding-origin fixture failures remain outside this content package; no broad staging backend report is claimed.
- Edge runtime not available in the task shell; Edge source unchanged. No Edge deployment/typecheck claim is made for this package.
- Hosted production create/edit/archive/cleanup and refresh persistence remain **not executed** before the approval gate. Local SQL/browser fixtures do not substitute for that acceptance.

## Approval and rollout boundary

Approve publication of this reviewed candidate branch, apply only migration `20261006164158_production_durable_content.sql` to `voalfpxiyznnqfcqcymd` once, and deploy the exact production artifact only to site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Do not merge all staging or use broad migration push. No Edge/provider/payment/domain/staff-permission configuration change is included.

Before applying: recheck production ledger/schema and existing content/staff counts; stop if drift invalidates reviewed assumptions. Save current deploy as frontend rollback target; additive columns/reference catalog should remain on rollback. Do not revert to weak legacy policies just to restore old UI behavior. Apply schema/RLS before publishing dependent assets.

After publication: use an existing real production Owner session; confirm login, Vitality status/completed answer/referral Review, authoring navigation and correct production project/origin. Create one clearly disposable food/recipe/exercise/workout/fitness program and only required composition rows; edit and reload each, publish/archive (activate/deactivate for food), and verify fresh server/browser persistence. Do not create client/payment/workflow/diary data or deliver mail. Capture exact QA IDs before each mutation and remove only those records/children afterward, verifying counts return to the intentional starting baseline. No QA content should remain in the real library. Existing production methodologies and workout are not cleanup targets.

Do not declare durable production ready until the exact live hashes and these hosted gates pass. If an account/profile/delivery issue appears, stop and preserve evidence rather than manufacturing access or broadening permissions.

## Exclusions and production URLs

No Disposable Client A/B, synthetic staff, foods/recipes/meals/exercises/workouts/programs, staging entitlements, test agreement/payment state or recipient allowlists were promoted. No hosted write occurred during preparation. Production deploy and migration ledger remain unchanged.

After acceptance, Justyn/Elle should use [production staff portal](https://revitalizedacademy.com/portal/), [People / Vitality Review](https://revitalizedacademy.com/portal/#people), and [Content Library](https://revitalizedacademy.com/portal/#programs). The new Nutrition/Fitness shortcuts select each editor within that existing workspace. Until approved and accepted, real durable content authoring is not certified ready.

Next coherent package after content release: reconcile only the accepted client/staff lifecycle and private assignment/Health configuration changes against production, prepare security/migration dependency tests, then perform scoped production acceptance. Checkout/provider expansions remain separate.
