# Beta Readiness Core v1 — 2026-10-04

Historical snapshot. Superseded by [the later hosted release/acceptance record](BETA_HOSTED_ACCEPTANCE_2026-10-04.md); retain the original evidence below.

**Decision: BETA NOT READY. Candidate implementation is local; staging deployment is held.**

Starting/accepted SHA: `1462b34b49716f19fb0db55d4bc11098edfe2b9d`, branch `codex/staging`, repository `eaglevisiondigital/revitalizedacademy`. The candidate descends from this baseline. The final commit is recorded in the workspace completion receipt to avoid a self-referential commit identifier.

## Release state and evidence

| Environment | Observed state |
| --- | --- |
| Netlify staging | Site `071b252e-a922-4846-a784-8dca1edad377`; still deploy `6ac1fec19f756106b6a84964` |
| Supabase staging | `bvooallokgfktssadsrv`; new candidate migration is **not applied** |
| Production | Site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`; still deploy `6ac036d3b48eac0008568e00`; 20 sampled public fingerprints unchanged |
| Staff browser | Normal session restoration reaches **Account Active / Staff access is pending** |
| Hosted inventory | One active staff identity, one active member, zero pending staff invitations, recipes, foods, workouts, meal assignments and fitness assignments |
| Methodologies | The Living Diet and Functional Fitness remain draft shells; no guidance or content was invented |

[Sanitized evidence](../deployment-evidence/2026-10-04-beta-core/) contains test logs, exact local build hashes, responsive geometry, screenshots, read-only hosted inventory and production comparison. Build hashes describe a local candidate, **not live staging assets**. There was no Netlify deployment, hosted migration, Edge publication, permission/flag change, invitation/email, payment action or hosted business-data write. No real or disposable hosted clients were created; local fixtures were disposable.

## Completed local engineering

1. **Client entry:** existing People → Add Person supports repeated entries. Capture the form before awaiting saves so reset works; escape email lookup metacharacters; reject a phone match that would silently replace a different existing email. Database normalized-email uniqueness remains authoritative. Six separate synthetic identities are exercised.
2. **Staff invitation:** preserve the existing caller permission, role/onboarding, origin and staging-recipient gates. Reject a duplicate staff identity before any contact/profile change, preserving existing owners. Preserve an existing member's profile/contact binding and lifecycle. Use a narrow staff insert instead of an upsert that could overwrite a role. The existing Edge handler is extracted for maintained request-level tests; it has **not** been published.
3. **Content editing/composition:** add ordinary Edit to the existing Content Library. Preserve lifecycle, creator, methodology and hidden nutrient keys; visible blanks remove only their nutrient key and numeric zero stays zero. Use `updated_at` for optimistic stale-edit protection. Calculated recipe serving changes invoke the existing calculator. Add Build Meal Plan, Build Workout and Schedule Workouts over the existing child tables. Retain Recipe Ingredient Builder and nutrition math; guard delayed responses and concurrent mutations.
4. **Assignments:** reuse existing client meal/fitness plans, scheduled items and assignment RPC signatures. Require current health-management permission and contact scope, nonempty valid published composition and active claimed client access. Serialize replacements per contact and type with a transaction advisory lock and retain atomic audit/schedule generation. Grocery generation inherits the same scoped parent contract.
5. **Member use:** add View Meal and View Workout to the existing member lists. Own-assignment RPCs return instructions, ingredients and usable exercise sets/reps/rest. Missing information has a neutral state. User content is rendered as text, and no private storage paths are exposed. Clear dialogs and discard delayed responses on member transitions; guard workout completion identity across asynchronous authentication.
6. **Session privacy:** staff logout/account change destroys the prior document before restarting the portal, preventing old module closures from retaining another user's private content. Staff, directory, dashboard, client and permission loads have request ownership checks. Changed or failed refreshed permissions clear the authenticated document. Existing member Health/Nutrition clearing is retained.

Major files: `portal/portal.js`, `portal-permissions.js`, `portal-people.js`, `portal-programs.js/.css`, `portal-recipe-builder.js`, `portal-wellness.js`, new `portal-content-composition.js`; `member/member110.js/.css`, new `member-assigned-content.js`; HTML/allowlist; `supabase/functions/staff-management/{index,handler}.ts`; the forward migration and tests below.

Candidate cache references (not deployed): portal JS188, permissions JS132, People JS136, Programs JS174/CSS166, Recipe Builder JS102, Wellness JS119/CSS120, new Content Composition JS1; member JS210/CSS202, new Assigned Content JS1. Accepted Health JS1/CSS1, Member Nutrition JS1 and Coach Nutrition Review JS103 are unchanged.

## Intended operator workflow and current limits

| Workflow | Existing architecture / candidate path | Acceptance state |
| --- | --- | --- |
| Create client | People → Add Person → normal journey/enrollment actions → required agreement/payment → member account claim/activation | Local form/database checks pass; hosted create/invite/login not accepted |
| Add staff | Staff directory → Invite Staff → existing invitation, staff agreement/onboarding and approved role/contact scope | Edge contract/security tests pass; live delivery, activation and recovery blocked by operator session |
| Create meal | Content Library → Food/Recipe → Build Recipe → calculate → Edit → publish supported content → Meal Plan → Build Meal Plan | Local exact-built form/payload/composition and native calculation checks pass; hosted end-to-end pending |
| Assign meal | Client drawer → Nutrition & Fitness → published template and start date → Assign → member View Meal | Scoped native assignment/read checks pass; hosted member receipt unproven |
| Create workout | Exercise → Workout → Build Workout → Fitness Program → Schedule Workouts → publish supported content | Local exact-built composition and native checks pass; hosted end-to-end pending |
| Assign workout | Client drawer → Nutrition & Fitness → published program/start date → Assign → member View Workout | Local usable detail and scoped native checks pass; hosted receipt/completion unproven |

Adding a CRM contact does not grant paid access. Enrollment, required current client agreement, authoritative payment ledger, onboarding claim, active access and program entitlements remain in force. Use only the already approved synthetic staging payment path for later synthetic acceptance; do not fabricate payment history, sign agreements or change credentials on a user's behalf. Staging email recipients remain restricted by the existing synthetic-inbox allowlist. This package does not add recipients or change mail settings.

Published recipes/exercises/templates are reusable library content under the existing model. A client's schedule, assignment, notes, completion, grocery list and health data are private. Assignment isolation is not a new rule making every published library recipe secret from all other members. No parallel meal/workout system was created. Existing publish/archive or replacement behavior is retained; no new hard-delete/unassignment flow is claimed.

## Security and database changes

New forward migration: `20261004124537_beta_core_assignment_boundaries.sql`. Tested only on disposable native PostgreSQL 17.11 databases; **not applied to staging**. No existing migration was replayed against any hosted database.

The audit found legacy broad staff-read policies on client meal/workout assignments and overbroad member updates to assignment identity fields. The candidate replaces relevant permissive policies while preserving restrictive lifecycle policies. Staff private reads require `health.private.view` **and** contact scope; assignment writes require existing `health.progress.manage` **and** scope. Reusable content composition writes require `learning.manage`. Member reads require self identity, full paid/claimed active lifecycle and existing nutrition/fitness or tracking entitlement. Triggers enforce parent/contact consistency and limit member updates to intended completion fields. Grocery item writes are checkbox-only for members. `get_my_assigned_meal` and `get_my_assigned_workout` enforce own-assignment access through invoker/RLS contracts.

No roles, defaults, overrides, `plan.override` grants, household/guardian rules or feature flags were broadened. Six independent member identities, ordinary support, scoped coach/operator, inactive staff, wrong-client IDs, entitlement removal, cross-parent completion, and anonymous/private boundaries are covered locally. Existing adult-household isolation and guardian/minor tests pass. These repairs remain **undeployed**; the hosted assignment policy risk still blocks beta release until controlled rollout and independent hosted verification.

## Validation

| Check | Result |
| --- | --- |
| Existing staging build | 313 public files; staging runtime identical to baseline; new modules in allowlist |
| JavaScript syntax | 77 files pass |
| Full frontend | 470 total: 443 pass, 0 fail, 27 existing skips |
| Native PostgreSQL 17.11 | 215/215 pass; complete baseline plus forward migrations restored into newly named loopback databases, then dropped |
| Edge | 30/30 pass; 19 entrypoints typechecked with frozen dependencies |
| New beta runtime | 20/20 pass, also executed against exact `dist` assets |
| New beta database | 36/36 pass, included in native total |
| New staff invitation Edge | 5/5 pass, included in Edge total |
| Responsive browser | 33 checks: 11 dialog/workflow views at each of 1440×1000, 768×1024, 390×844; no horizontal page, dialog or control overflow |
| Browser console | No warning/error in successful final local fixture checks; hosted pending page also clean |

Responsive checks include Recipe Edit, Recipe Builder, meal composition, Workout Edit/composition, fitness schedule, Add Person, Invite Staff, client assignment controls, assigned Meal and assigned Workout. Long uninterrupted exercise text wraps; controls remain in the dialog. This is exact-built UI with a clearly labeled synthetic in-memory transport, not a hosted account or proof of invitation delivery. It is not a complete accessibility certification.

The previously separated nine agreement/onboarding-origin backend fixture failures now pass after adding the fixture's missing explicit synthetic onboarding origin, matching the existing lifecycle fixture contract. No application agreement/payment rule was loosened. The old blank-nutrient source-text assertion was replaced with stronger payload behavior checks covering create/edit blank removal, zero, invalid input and hidden-key preservation. Twenty-seven historical frontend skips remain skips, not passes. Edge logs retain expected denied-request diagnostics and the existing Node punycode deprecation warning; the 30 tests and typechecks pass. A temporary fixture-server restart and JSDOM observer teardown diagnostic were resolved in the local harness; neither is reported as a hosted application success or failure.

Member Health & Progress and Nutrition Targets + Trends remain green in the maintained local suites. Their accepted deployed baseline is unchanged. This does not claim fresh hosted populated-data acceptance for this candidate.

## Remaining release blockers

1. **Working approved operator session unavailable.** The current login authenticates, but has no active approved staff access. This is a protected pending state, not proof that password login failed. Read-only inventory shows an active owner exists; sign in normally with that existing approved staging identity. Do not grant roles to the pending account merely to make testing pass.
2. **Required real staging lifecycle is unproven.** Owner/staff creation, email delivery, invitation expiry/reuse, first activation, refresh, logout, account switching, branded recovery and inactive/revoked behavior need actual authorized owner, scoped staff and at least two member sessions. Local contracts cannot certify hosted Auth/provider behavior.
3. **Hosted meal/workout Create → Assign → View is unproven.** Hosted content/assignments are empty. Use only approved disposable synthetic content and identities through intended UI, with documented cleanup; do not add Justin and Elle's real beta clients.
4. **Security/composition candidate is not released.** Staging retains the previous implementation. The new migration, staff-management Edge candidate and frontend must be reviewed and rolled out together only under the user's release gate. No frontend-only deploy is safe to represent as complete. Do not apply the migration just to bypass the missing operator acceptance.

No further unrelated build has begun. Primary Chat retains the final beta green-flag decision.

## Copy/paste primary Chat handoff

RECOMMENDED THINKING LEVEL: HIGH

CHAT DECISION NEEDED

Beta Readiness Core v1 is BETA NOT READY. A local candidate now covers Content Library editing/composition, scoped meal/workout assignment and member detail, duplicate-safe staff invitations, repeated client entry and session privacy. Local checks: build313, syntax77, frontend443pass/27skip, native PostgreSQL17.11 215/215, Edge30/30 and19typechecks; new maintained beta coverage20runtime/36database/5Edge. Accepted Health and Nutrition regressions remain green. No deployment or hosted writes occurred; staging remains1462b34 / deploy6ac1fec19f756106b6a84964.

The existing browser account still reports Staff access is pending; a distinct active owner exists. Please arrange normal sign-in with the existing approved staging owner and identify approved disposable staging inboxes/accounts through the established process, without posting credentials. Preserve least privilege, paid/agreement/claim gates and the synthetic recipient allowlist. Required hosted multi-account invitation/login/recovery and meal/workout end-to-end acceptance is still outstanding. Review the forward-only assignment boundary migration and staff-management Edge candidate as one release package. Resolve the controlled staging rollout/acceptance sequence while keeping beta closed; do not issue the Justin/Elle green flag or add real beta clients yet. No permission broadening, invented methodology guidance or production work is proposed.

## Copy/paste hosted acceptance handoff

RECOMMENDED THINKING LEVEL: HIGH

WORK TASK NEEDED

Continue Beta Readiness Core v1 evidence collection for ReVitalized Academy staging only: Netlify071b252e-a922-4846-a784-8dca1edad377, Supabase bvooallokgfktssadsrv. Read docs/BETA_READINESS_CORE_V1.md and its completion receipt first. Current live deploy remains6ac1fec19f756106b6a84964; do not assume the local candidate is deployed. Do not deploy or apply the migration as part of this read-only access preflight.

Use the existing legitimately approved owner session through normal sign-in. The prior session says Account Active / Staff access is pending. Do not manufacture access, alter permissions, credentials, roles, flags or the synthetic inbox allowlist. Confirm the operator can reach People, Staff, Content Library and a scoped client drawer. Record access and any blocker. After an explicitly authorized coordinated candidate rollout, perform documented synthetic-only owner/scoped-staff/two-member acceptance through intended UI: creation/invitation, activation, first login, refresh, logout, switching, expiry/reuse and recovery; meals/recipes/ingredients/calculation/edit/publish/composition/assignment/member details; workout/exercise composition/schedule/assignment/member details; wrong-client and revoked denials; private DOM clearing under delay. Keep existing paid/agreement/claim gates. Hand off password entry and agreement acceptance to the user. Do not add real beta clients or touch production. Check1440×1000,768×1024,390×844 and console. Document synthetic records and cleanup. Stop on any privacy/invitation/assignment blocker and return BETA NOT READY. Source hashes and live hashes must match before accepting candidate UI. Primary Chat alone issues the beta green flag.
