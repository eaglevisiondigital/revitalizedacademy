# Vitality production promotion — 2026-10-05

Status: blocked before production mutation.

The accepted staging release was isolated from `1d649c60abf580f9f696428ff2540a47ee1bf9eb` onto the existing production baseline `d9eb428866ccf7b6338999f6aecb020721b17540`. The two lines diverged at `df8aba33cd8bac16e54aded92a4c99439f74f1d5`; neither release head is an ancestor of the other. Basing the candidate on `d9eb428` preserves the five production cohort-removal commits and avoids merging the intervening staging beta history. The production manifest was derived from the 370 files in the current published deploy and adds only `js/environment.js`, `js/vitality-resume.js`, and the generated `runtime-config.js`. Existing Vitality HTML, CSS, and JavaScript receive the accepted secure-resume integration. The production public-intake bridge retains its existing production endpoint and suppresses duplicate Vitality writes while the secure flow owns the request.

The production database does not contain migration `20261005110245_vitality_assessment_secure_resume`, its private tables, or its RPC. Compatibility was confirmed for every referenced table, column, helper function, extension, and conflict target. The SQL is ready to apply exactly once, but it was not applied because a complete release could not be made functional.

Production Supabase does not contain the required custom Edge secrets `RVA_ENVIRONMENT`, `RVA_APP_ORIGIN`, or `RESEND_API_KEY`. Production Netlify contains no environment values that can supply the approved provider credential. The sender variable `REVITALIZED_EMAIL_FROM` is optional because the accepted code has the approved production sender fallback. The staging secret value was not retrieved, copied, or exposed, and no replacement credential was invented.

No production migration, function, environment value, deployment, email, contact, draft, workflow, payment, staff record, client record, meal, or workout was changed. Production remains on Netlify deploy `6ac036d3b48eac0008568e00` from source `d9eb428866ccf7b6338999f6aecb020721b17540`.
