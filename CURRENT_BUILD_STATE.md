# ReVitalized Academy Current Build State

## Historical Vitality reconciliation — 2026-10-06

This current entry supersedes older pending-release descriptions below. Production frontend remains deploy `6ac52af350af344e34bcfa31`, source `77dbe985c4132503696915b34523dede68beee66`; no Netlify release was needed for this database-only repair.

- Root cause: staff review RPCs selected only the secure draft system introduced Oct. 5. Eight older production workflows were omitted. Two completed workflow/report records also lacked their original Netlify summaries.
- Applied ledger: `20261007030224 vitality_historical_review` (source migration `20261007010000`), `20261007030817 vitality_unlinked_source_reconciliation` (source `20261007012000`). Do not replay.
- Restored all eight existing historical workflow contacts to the secured review list. Preserved original workflows, contact identity, report flags/status/timestamps and source attribution. Added an inaccessible-to-browser historical source archive and operator-only idempotent import functions.
- Restored two matching completed summaries/coach flags. Imported two verified missing completed sources: Brandy into one new assessment-lead contact, and Sept. 5 Justyn into his existing contact with explicit user approval. Existing Justyn contact checksum remains unchanged; original submitted email remains separately preserved in the private archive. No Auth identity, resume draft/token, enrollment, invitation or client payment created.
- Netlify audit: 4 verified completed submissions plus 3 spam-index submissions. Two spam-index entries match legitimate existing completed workflows; no spam status was changed. One Oct. 5 source already belongs to the secure system. Two verified old sources (David Fowler/Forest Gump) appear to be test records and remain held pending classification. Pre-Oct. 5 lead metadata: 24 submissions across 12 normalized emails; retries are not duplicated into contacts.
- Result: 10 pre-Oct. 5 workflows visible (4 completed, 6 unfinished); 13 total current review entries including 3 secure records. Four original completed summaries archived. Existing incomplete records remain status-only; their unsaved answers cannot be invented.
- Validation: 64/64 PostgreSQL 17 production backend checks, 10/10 Vitality frontend checks. Health-private permission and contact scope enforced; operator import calls denied to browser and service roles. Production Owner portal refreshed to 13 review entries; Justyn’s historical summary opens. Authoritative Justyn and Elle permission contexts each return 13 entries. Nine of twelve pre-Oct. 5 lead emails map to represented assessments; three are held (two test-like completed sources and one lead-only inbox without completion evidence).
- Historical private payloads remain outside Git. Beta recipient registry is a separate staging-only branch and migration; no cross-environment data copy.


Updated: 2026-10-06

## Production durable content candidate — approval pending

- Branch: `codex/production-durable-content`, based on the released production branch (`c72e328` documentation / `4a2d293` deployed application source). No staging merge or customer-data transfer.
- Prepared migration: `20261006164158_production_durable_content.sql`; **not applied remotely**. It adds content media/food provenance/serving metadata, a 101-entry reference nutrient catalog, repaired recipe calculations and content-only authoring policies. No client diary/targets, role grants, payment/provider configuration or methodology seed is included.
- Prepared frontend: Foods/Recipes/Exercises/Workouts/Meal Plans/Fitness Programs, recipe/composition builders, edit/lifecycle controls, methodology philosophy/version editing, sidebar shortcuts, and the narrow legacy Account initialization repair.
- Authoring requires active approved staff plus `learning.manage`; existing permission defaults/overrides are preserved. Food uses Activate/Deactivate; other reusable content uses draft/publish/archive.
- Local validation: production build 378 files; 67 JS syntax checks; 62 existing frontend checks plus 11 candidate checks; 50 PostgreSQL 17 database checks; 36 exact-built Chrome responsive/runtime cases at 1440×1000, 768×1024 and 390×844. No live data was written.
- Production control plane still reports deploy `6ac520ad289a6b34347af163`; latest production migration remains Vitality Review `20261006162255`. Production content hosted acceptance is pending release approval.
- Justin/Elle already have active production Owner records; fresh production login/authoring remains unaccepted until the candidate is deployed.
- Status: **PRODUCTION DURABLE CONTENT BLOCKED** — remote migration/deployment approval and subsequent focused hosted acceptance outstanding.
- [Full release boundary, module classifications and acceptance plan](docs/PRODUCTION_DURABLE_CONTENT_RELEASE_2026-10-06.md).

## Production Vitality Assessment Review released

- Deployed application source: `4a2d293` on `codex/vitality-production`; feature implementation commit: `e1e14d3`.
- Scope: a production-only staff Vitality Assessments workspace, two narrow secured read RPCs, the approved Adult/Child question catalog, focused browser/backend regressions, and production build allowlist entries.
- Authoritative source: `private.vitality_assessment_drafts` plus the existing production contact and staff-scope model. No Netlify Forms runtime scraping or cross-environment data bridge was introduced.
- Permission boundary: both RPCs require `health.private.view` and `staff_can_access_contact`; unfinished assessments expose status metadata only, while completed assessments expose a sanitized submitted answer set, existing coach summary, existing coach-review flags, and existing assessment-derived tags. Direct private-table reads remain denied.
- Verification: production build generated 376 files; focused browser regressions passed 62/62; PostgreSQL 17 authorization regressions passed 10/10; JavaScript syntax passed; responsive review passed at 1440×1000, 768×1024, and 390×844 without horizontal overflow.
- Isolation: the production artifact contains the production Supabase/project origin only and does not contain staging project references, beta URLs, synthetic beta identities, or staging fixtures.
- Release status: GitHub branch pushed, migration `20261006162255 vitality_assessment_staff_review` applied to production Supabase, and Netlify production deploy `6ac520ad289a6b34347af163` published on 2026-10-06.
- Exact live asset hashes match the reviewed production artifact for `portal-vitality-assessments.js`, `portal-vitality-assessments.css`, and `vitality-question-catalog.js`.
- Supabase verification: both RPCs are `SECURITY DEFINER` with a fixed empty search path, authenticated execution only, and anonymous execution revoked. The intentional authenticated SECURITY DEFINER advisor findings correspond to the two guarded RPC entry points; no unrelated schema or permission changes were made.
- Hosted limitation: the signed-out production portal loads the current sign-in screen and the new assets without module-specific errors. Its existing baseline scripts still emit unauthenticated initialization errors from `portal.js?v=182` and permission-dependent panels; these files were not changed by this release.

## Production

- Deployed application source: `4a2d293`
- Netlify site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`
- Published deploy: `6ac520ad289a6b34347af163`
- Public domain: `https://revitalizedacademy.com`
- Supabase project: `voalfpxiyznnqfcqcymd`

Production now serves the accepted secure Vitality save/resume release with required first-page referral attribution. The public application candidate is `a79102c52f474b8af2750a27c4e8dda1dafa8af1`; the isolated branch head is `99d1ed4` after rollback-compatibility hardening.

## Vitality referral attribution

- The initial Contact step requires one of 14 approved referral sources and has no preselected marketing source.
- `Sales Rep` reveals a required Sales Rep Name; `Other` reveals a required source-detail field. Switching away hides, disables, and clears the obsolete conditional value.
- Initial secure capture persists `referral_source`, `sales_rep_name`, and `referral_source_other` on `contacts` and in the unfinished draft identity. Existing `first_source` and `last_source` semantics remain unchanged.
- Production migrations: `20261005183813 vitality_referral_source_tracking` and `20261005184407 vitality_referral_rollout_compatibility`.
- Production Edge Function: `vitality-resume` version 2, bundle SHA-256 `93f44b2c69dd8ef7272c5df56b7b49fa8272c115fdc4a3be5723759c818ae3d8`.
- The current Edge handler requires referral attribution. The private service-only RPC accepts the previous start payload solely so the accepted prior release remains a functional rollback target; anonymous and authenticated roles still cannot execute it.

## Accepted Vitality release

- Accepted staging source: `1d649c60abf580f9f696428ff2540a47ee1bf9eb`
- Accepted staging deploy: `6ac3bbaeecd0a269b0a5eef6`
- Isolated production candidate branch: `codex/vitality-production`
- Candidate scope: Vitality entry, secure verified-email recovery, server-backed autosave/resume, completion lock, the production environment mapping, one forward migration, and one Edge Function.
- Excluded scope: Client A/B data, staff beta work, meals, workouts, and all other staging-only beta changes.
- Source relationship: accepted staging and production diverged at `df8aba33cd8bac16e54aded92a4c99439f74f1d5`. The candidate is based on production `d9eb428` so the five production cohort-removal commits remain intact; the staging branch was not merged wholesale.

## Verification

- Production candidate build: 373 public files.
- Focused browser regressions: 52 passed.
- PostgreSQL 17 secure-resume regressions: 22 passed against the full baseline and every forward migration.
- Edge Function regressions: 19 passed.
- JavaScript syntax: passed for all changed and added production files.
- Production schema compatibility: required tables, columns, helper function, extensions, and unique indexes are present.
- Environment isolation: candidate contains the production Supabase project and production domain; staging project, staging URL, synthetic recipient allowlist, and test addresses are absent from the public build.
- Production migration ledger now ends at `20261006162255 vitality_assessment_staff_review`.
- Production Edge Function: `vitality-resume` version 2, active, bundle SHA-256 `93f44b2c69dd8ef7272c5df56b7b49fa8272c115fdc4a3be5723759c818ae3d8`.
- Exact live hashes match the candidate for `runtime-config.js`, `js/environment.js`, `js/vitality55.js`, `js/vitality-resume.js`, `js/revitalized-data.js`, and `css/vitality55.css`.
- Start New and Resume Existing render and switch correctly at 1280, 768, and 390 pixel widths without horizontal overflow or browser console errors.
- The live referral dropdown contains the approved placeholder and 14 options; required/conditional validation and stale-value clearing pass at 1280, 768, and 390 pixel widths without horizontal overflow or browser console warnings/errors.
- Home, portal, member, enrollment, and webinar pages remain byte-identical to the prior deploy.

## Production acceptance

The configured production environment passes a non-writing preflight, rejects a foreign origin, and returns the approved neutral response for a malformed email.

The authorized production smoke used `rva-assessment@eaglevision.biz`. It created exactly one contact, one unfinished draft, one Vitality workflow, one active journey, and one `vitality_started` event. External delivery was confirmed by the user. Opening the link consumed and cleared the single-use emailed credential, verified the email, and created one active session on the same draft without duplicates. The unfinished draft remains at Whole-Person Snapshot, 7%, revision 4; it was not completed.

The accepted smoke contact, draft, workflow, journey, section, percentage, and revision remained unchanged throughout the referral rollout. No hosted validation contact was created.

Final state: `VITALITY PRODUCTION READY`.

## Rollback target

- Frontend: Netlify deploy `6ac3ccee3eda881a1fdf1ead`
- Source: `df611af833ff4c25a51928ffd399ca0178bced47`
- Edge: restore `vitality-resume` version 1 source if the prior frontend is restored.
- Database: additive nullable columns may remain. Migration `20261005184407` keeps the prior service-only start payload compatible, so no destructive database rollback is required.


## Owner access reconciliation — 2026-10-06

Production completed Vitality Review had a server timeout misreported by the UI as a permission/contact-scope denial. The existing decoder made a representative completed review take 12,681.643 ms, above the authenticated API 8-second statement timeout. A single private decoder optimization was applied as production migration `20261006211025 vitality_review_decoder_performance`. The same completed review now executes in 15.285 ms. Neither API timeout nor review authorization was broadened.

Both real production owners retain separate confirmed Auth users, active Owner roles, completed onboarding, all-contact scope, and all 19 current Owner permissions. Authenticated-role checks for each owner return the identical completed-review hash before/after the repair. Review, permission and contact-scope function definitions, all role defaults, all overrides, and the private helper ACL were verified unchanged. No contact, answer, summary, or workflow data was changed.

The hosted production review now opens normally in the existing Dave Owner session: 299 answer elements, stored Coach Summary, and referral/source presentation render with a clean warning/error console. This proves the hosted repair, not fresh login acceptance for Justyn or Elle.

Tests: 52/52 PostgreSQL 17 content/review/resume tests; 10/10 Vitality Review frontend tests. New fixtures cover separate default Owners, long Unicode summaries under a 2-second timeout, malformed encoding and invalid UTF-8. Existing scope/private-health/member/anonymous denials pass.

Production frontend remains Netlify deploy `6ac52af350af344e34bcfa31`, source `77dbe985c4132503696915b34523dede68beee66`. No frontend deployment or Edge redeployment was needed. Isolated repair branch: `codex/owner-access-reconciliation`.

Pending: normal fresh production sign-in acceptance for each real owner; beta Owner invitations/setup and independent acceptance. Exact owner emails are absent from staging Auth/invitations. Beta provisioning awaits an existing beta Owner session and approved staging invitation phone numbers; no invitation sent yet. Production Vitality Review is not currently released in beta, so beta Vitality acceptance cannot be claimed. Do not copy production health/profile data to obtain staging coverage or reuse synthetic identities.
