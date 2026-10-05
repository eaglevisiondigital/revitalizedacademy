# ReVitalized Academy Current Build State

Updated: 2026-10-05

## Production

- Source baseline: `d9eb428866ccf7b6338999f6aecb020721b17540`
- Netlify site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`
- Published deploy: `6ac3ccee3eda881a1fdf1ead`
- Public domain: `https://revitalizedacademy.com`
- Supabase project: `voalfpxiyznnqfcqcymd`

Production now serves the accepted secure Vitality save/resume release from isolated candidate `df611af833ff4c25a51928ffd399ca0178bced47`.

## Accepted Vitality release

- Accepted staging source: `1d649c60abf580f9f696428ff2540a47ee1bf9eb`
- Accepted staging deploy: `6ac3bbaeecd0a269b0a5eef6`
- Isolated production candidate branch: `codex/vitality-production`
- Candidate scope: Vitality entry, secure verified-email recovery, server-backed autosave/resume, completion lock, the production environment mapping, one forward migration, and one Edge Function.
- Excluded scope: Client A/B data, staff beta work, meals, workouts, and all other staging-only beta changes.
- Source relationship: accepted staging and production diverged at `df8aba33cd8bac16e54aded92a4c99439f74f1d5`. The candidate is based on production `d9eb428` so the five production cohort-removal commits remain intact; the staging branch was not merged wholesale.

## Verification

- Production candidate build: 373 public files.
- Focused browser regressions: 50 passed.
- Edge Function regressions: 18 passed.
- JavaScript syntax: passed for all changed and added production files.
- Production schema compatibility: required tables, columns, helper function, extensions, and unique indexes are present.
- Environment isolation: candidate contains the production Supabase project and production domain; staging project, staging URL, synthetic recipient allowlist, and test addresses are absent from the public build.
- Production migration ledger: `20261005161329 vitality_assessment_secure_resume`.
- Production Edge Function: `vitality-resume` version 1, active, bundle SHA-256 `62730d1ed9ae75f251ef1e38a61f199d4e191dc7b1189d732f766fd9cdd75ae3`.
- Exact live hashes match the candidate for `runtime-config.js`, `js/environment.js`, `js/vitality55.js`, `js/vitality-resume.js`, `js/revitalized-data.js`, and `css/vitality55.css`.
- Start New and Resume Existing render and switch correctly at 1280, 768, and 390 pixel widths without horizontal overflow or browser console errors.
- Home, portal, member, enrollment, and webinar pages remain byte-identical to the prior deploy.

## Remaining production acceptance

The configured production environment passes a non-writing preflight, rejects a foreign origin, and returns the approved neutral response for a malformed email. No production contact, draft, workflow, rate-limit record, or email was created.

Actual provider acceptance and external email delivery remain unverified because that test requires a specifically authorized real production address and creates a production contact/draft/workflow. Until that narrow smoke is authorized and passes, the final state remains `VITALITY PRODUCTION NOT READY`.

## Rollback target

- Frontend: Netlify deploy `6ac036d3b48eac0008568e00`
- Source: `d9eb428866ccf7b6338999f6aecb020721b17540`
- Database/Edge: no rollback required because no production changes were applied.
