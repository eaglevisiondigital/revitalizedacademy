# ReVitalized Academy Current Build State

Updated: 2026-10-05

## Production

- Source baseline: `d9eb428866ccf7b6338999f6aecb020721b17540`
- Netlify site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`
- Published deploy: `6ac036d3b48eac0008568e00`
- Public domain: `https://revitalizedacademy.com`
- Supabase project: `voalfpxiyznnqfcqcymd`

Production has not yet received the accepted secure Vitality save/resume release. The existing site, database schema, and Edge Functions remain unchanged.

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

## Release blocker

Production Supabase has no `vitality-resume` function and no custom Edge secrets. `RVA_ENVIRONMENT`, `RVA_APP_ORIGIN`, and `RESEND_API_KEY` are required by the accepted function. `REVITALIZED_EMAIL_FROM` is optional because the accepted function has the approved production sender fallback. Production Netlify has no environment values to reuse.

No migration, Edge Function, Netlify deploy, provider configuration, or production data was changed after this blocker was found. The release may resume after the approved production Resend credential is configured directly in the production Supabase project together with the known production environment and origin values. Do not place credentials in chat or repository files.

## Rollback target

- Frontend: Netlify deploy `6ac036d3b48eac0008568e00`
- Source: `d9eb428866ccf7b6338999f6aecb020721b17540`
- Database/Edge: no rollback required because no production changes were applied.
