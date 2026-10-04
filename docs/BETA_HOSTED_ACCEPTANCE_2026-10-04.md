# Beta Readiness Core v1 — hosted acceptance — 2026-10-04

**BETA NOT READY. The owner gate passed and the coordinated package is deployed to staging; required multi-account acceptance is incomplete.** This supersedes the earlier held-deployment reports, which remain historical evidence.

## Release

- Starting deployed SHA: `1462b34b49716f19fb0db55d4bc11098edfe2b9d`; starting deploy `6ac1fec19f756106b6a84964`.
- Reviewed candidate: implementation `eed4a9dd7eccf00105d33b7d3d47820c47955fd5`, evidence `3996379487554aecf571a5efa1f5457cccf9195e`, owner-preflight documentation `917c00e0e4db0f5c751225e3df1a4f38b4649a09`. Remote staging had not advanced beyond the accepted baseline. No main merge or production push.
- Initial coordinated frontend release: SHA `917c00e0e4db0f5c751225e3df1a4f38b4649a09`, Netlify staging deploy `6ac2c983d14d747462d3c3cf`, site `071b252e-a922-4846-a784-8dca1edad377`.
- Supabase staging `bvooallokgfktssadsrv`: source migration `20261004124537_beta_core_assignment_boundaries.sql` applied once through MCP; actual hosted ledger version **`20261004214656`**. Do not replay either version. No historical migration was replayed.
- `staff-management` deployed version **5**. All four deployed TypeScript files match reviewed source. Existing gateway setting remains `verify_jwt=false`; the handler independently verifies the bearer user, active staff, staff.manage, role boundary, origin and recipient allowlist.
- Hosted checks found 33 candidate policies, four guard triggers, and invoker member detail RPCs with anonymous execution denied. No role/default/override grants or entitlement changes.

## Security review

The new assignment package replaces the broad legacy policies, retains restrictive lifecycle gates, enforces contact scope and protects identity/completion fields. The affected assignment tables were empty before application. Prior native PostgreSQL17 tests covered restoration and authorization boundaries. The release preserved existing paid/agreement/claim gates, shared published content and API signatures.

Advisor counts did not change: five RLS-enabled/no-policy tables, four definer family views, two anonymous-executable guarded definer functions, 24 authenticated definer functions, and one leaked-password-protection warning. The inspected family views explicitly filter auth.uid, active/full membership and existing consent/guardian/sharing rules. The two anonymous-executable functions reject callers without their required effective staff permissions before writes. These are existing findings, not a clean-advisor or global security-certification claim. Remediation references: [view lint](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view), [anonymous function lint](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [RLS policy lint](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Hosted acceptance completed

- User signed into the existing approved owner through normal authentication. Dashboard, Programs, Content Library, Team Permissions and People Directory load. Full refresh before and after deployment retains legitimate owner access. No permission repair was needed.
- Add Person and Invite Staff forms open through intended navigation. Their responsive forms fit 1440×1000, 768×1024 and 390×844. No form was submitted and no identity was repurposed.
- Disposable food: created inactive through the portal, then activated. Blank nutrient keys omitted; genuine fat=0 persisted. Serving size=1, unit=serving, grams per serving=100, energy=100 kcal and protein=10 g are synthetic QA fixture values only.
- Disposable recipe: created with two servings, added 200 g of that food through Build Recipe, completed calculation. Edited servings to four; per-serving result became 50 kcal, 5 g protein and 0 g fat. Published through the normal UI.
- Disposable meal plan: created for one day, composed with the published recipe, saved and published. No assignment to existing clients was made.
- Disposable exercise and workout: created through the UI; exercise published. Workout composition exposed the duration defect below before an exercise row was saved.
- Recipe editor, Recipe Builder, meal composition, exercise form, workout form, client entry and staff invitation showed no page/dialog horizontal overflow at all three sizes (21 geometry checks). These do not prove unexecuted assignment/member views.

## Real defect found and narrow repair

Build Workout defaulted optional `duration_seconds` to zero, but the existing hosted constraint permits NULL or a positive number. A normal sets/repetitions entry therefore failed with `workout_template_exercises_duration_seconds_check`. No invalid row was stored. The repair leaves duration empty by default, uses minimum 1 when specified, and retains zero as valid for rest. No constraint or backend change. Cache reference advances Content Composition from v1 to v2. Three maintained regressions cover blank/null, zero rejection/rest-zero preservation and positive-duration edit/clear; two reproduced the defect before repair. Repair deployment and fresh hosted retest are recorded below when complete.

## Remaining blockers

1. The supplied owner and existing member inboxes are already in use. Preserve those accounts. Proposed disposable Gmail aliases and a narrowly scoped staging recipient-allowlist addition await explicit user confirmation. No invitations, recovery email, new credentials or staff grants have been issued.
2. Hosted `program_entitlement_templates` and `membership_entitlements` both contain **zero rows**. The portal correctly displays no configured benefits. Meal/workout member access requires the existing nutrition_plans / fitness_plans or tracking entitlement. Do not invent benefits or bypass the gate. Primary Chat must approve the intended program-benefit mapping and controlled staging configuration.
3. Client A/B and disposable staff activation, email delivery, login/refresh/logout/recovery/revocation, cross-client denial, delayed hosted responses and member Create→Assign→View remain unproven. Local tests do not substitute for these hosted results. Owner logout/relogin has not yet been exercised after deployment.

## Validation retained

Unchanged backend evidence: PostgreSQL17.11 **215/215**, Edge **30/30**, 19 entrypoints typechecked. Original full frontend:443 pass/0 fail/27 existing skips; original beta runtime20/20 and local responsive33 checks. Health & Progress and Nutrition Targets + Trends passed. The historical nine agreement-origin fixture failures were resolved by explicit fixture setup without weakening application gates. New frontend repair totals and exact final live hashes are recorded with the final release evidence.

## Disposable hosted records

All names begin `Disposable Beta QA 20261004 —`; no real health information is used. Food `c36fdb17-f4f9-48bf-8b12-0e5c136e249e`; recipe `766f614f-8e5f-4c44-b5a9-f9e7f65611e6`; ingredient `f26156ce-6832-432c-9fe7-e76493aca575`; meal plan `a3cfe890-13f0-40d3-84a5-691098d167b7`. Workout/exercise IDs and final archive/deactivation status will be included in the final sanitized inventory. Retain archived audit evidence; do not alter existing owner/member records.

## Production

Production site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06` remains deploy `6ac036d3b48eac0008568e00`. All20 sampled public fingerprints were unchanged after the initial coordinated release. No production configuration, schema, Edge Function or business data changed. No payment provider, SMTP transport, SMS/Twilio, flags or roles changed.
