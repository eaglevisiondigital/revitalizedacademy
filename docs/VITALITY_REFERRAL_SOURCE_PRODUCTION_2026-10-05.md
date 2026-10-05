# Vitality Referral Source Production Release — 2026-10-05

## Completed

The live Free Vitality Assessment Contact step now requires an approved referral source with no preselected marketing value. `Sales Rep` and `Other` reveal their required detail fields; switching sources clears and excludes stale detail values. The existing assessment questions, scoring, adult/child pathways, secure recovery, save/resume lifecycle, completion locking, Journey handling, and production integrations were not redesigned.

## Production provenance

- Repository: `eaglevisiondigital/revitalizedacademy`
- Branch: `codex/vitality-production`
- Public application commit: `a79102c52f474b8af2750a27c4e8dda1dafa8af1`
- Compatibility branch head: `99d1ed4`
- Netlify site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`
- Netlify deploy: `6ac3eee5383ccf92be4d7a58`
- Live URL: `https://revitalizedacademy.com/consult.html`
- Supabase project: `voalfpxiyznnqfcqcymd`
- Migration ledger: `20261005183813 vitality_referral_source_tracking`; `20261005184407 vitality_referral_rollout_compatibility`
- Edge Function: `vitality-resume` v2, bundle `93f44b2c69dd8ef7272c5df56b7b49fa8272c115fdc4a3be5723759c818ae3d8`

## Tested

- Production build: 373 files.
- Browser/assessment regressions: 52/52 passed.
- PostgreSQL 17 secure-resume regressions against the full baseline and forward migration set: 22/22 passed.
- Edge Function regressions: 19/19 passed before deployment; hosted preflight rejects missing referral data with HTTP 400 and a foreign origin with HTTP 403 before any database or mail operation.
- JavaScript syntax and diff checks: passed.
- Live UI: approved placeholder plus 14 sources; Sales Rep and Other conditional required behavior; stale-value clearing; no console warnings/errors.
- Responsive UI: no horizontal overflow at 1280×900, 768×1024, or 390×844.
- Exact live JS/CSS hashes match the 373-file candidate. Netlify's processed `consult.html` on the live domain matches the immutable deploy exactly.
- Home, staff portal, member portal, enrollment, and webinar HTML remain byte-identical to deploy `6ac3ccee3eda881a1fdf1ead`.

## Security and data integrity

The new contact fields are nullable for existing records and constrained to the approved source vocabulary, valid conditional combinations, and bounded detail lengths. The secure RPC remains executable only by `service_role`; anonymous and authenticated roles have no direct execute permission. Current Edge v2 requires referral attribution, while the private service-only function retains prior-payload compatibility for safe rollback.

The previously accepted production smoke contact remains the same contact, draft, workflow, and journey at revision 4, section 1, 7%. Its new attribution fields remain null because historical data was not invented or backfilled. No new hosted contact, draft, workflow, email, assessment answer, or completion was created during this validation.

## Existing advisories

Supabase advisors reported existing project-wide items, including leaked-password protection being disabled, private secure-resume tables with RLS and no policies by design, one unindexed private draft foreign key, and legacy index/policy performance notices. The referral migration introduced no new public grant, RLS policy, role grant, or direct client access.

## Rollback

Restore Netlify deploy `6ac3ccee3eda881a1fdf1ead` and the v1 Edge source from `df611af833ff4c25a51928ffd399ca0178bced47`. The additive nullable columns may remain. Compatibility migration `20261005184407` lets the prior service-only start payload function without a destructive database rollback.
