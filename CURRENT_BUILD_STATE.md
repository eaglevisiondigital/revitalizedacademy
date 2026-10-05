# ReVitalized Academy Current Build State

Updated: 2026-10-05

## Production

- Source baseline: `d9eb428866ccf7b6338999f6aecb020721b17540`
- Netlify site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`
- Published deploy: `6ac3eee5383ccf92be4d7a58`
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
- Production migration ledger now ends at `20261005184407 vitality_referral_rollout_compatibility`.
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
