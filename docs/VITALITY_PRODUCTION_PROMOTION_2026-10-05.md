# Vitality production promotion — 2026-10-05

Status: production ready.

The accepted staging release was isolated from `1d649c60abf580f9f696428ff2540a47ee1bf9eb` onto the existing production baseline `d9eb428866ccf7b6338999f6aecb020721b17540`. The two lines diverged at `df8aba33cd8bac16e54aded92a4c99439f74f1d5`; neither release head is an ancestor of the other. Basing the candidate on `d9eb428` preserves the five production cohort-removal commits and avoids merging the intervening staging beta history. The production manifest was derived from the 370 files in the current published deploy and adds only `js/environment.js`, `js/vitality-resume.js`, and the generated `runtime-config.js`. Existing Vitality HTML, CSS, and JavaScript receive the accepted secure-resume integration. The production public-intake bridge retains its existing production endpoint and suppresses duplicate Vitality writes while the secure flow owns the request.

Migration `20261005110245_vitality_assessment_secure_resume` was applied once to production under ledger version `20261005161329`. The private tables and RPC exist. Anonymous and authenticated roles cannot execute the RPC or select from the private draft table; only `service_role` can execute the public wrapper, and direct service-role table reads remain revoked.

Production `vitality-resume` version 1 is active with bundle SHA-256 `62730d1ed9ae75f251ef1e38a61f199d4e191dc7b1189d732f766fd9cdd75ae3`, matching accepted staging. Production-origin preflight returned 200, foreign origin returned 403, and an invalid email returned the approved neutral response without a database write.

Netlify production deploy `6ac3ccee3eda881a1fdf1ead` serves the 373-file isolated candidate from source `df611af833ff4c25a51928ffd399ca0178bced47`. Exact hashes match for all Vitality production assets and runtime configuration. The production page shows Start New and Resume Existing; the recovery panel opens; and browser checks at 1280, 768, and 390 pixel widths have no horizontal overflow or console errors. Home, portal, member, enrollment, and webinar pages are byte-identical to the previous deploy.

The authorized external-delivery smoke used `rva-assessment@eaglevision.biz`. Before the smoke, the address had zero production contacts, drafts, and Vitality workflows. Start New created exactly one contact (`5140dd53-8890-4072-8b6b-7cf7c56ef1c1`), one draft (`6683dba3-5190-4ceb-b09b-577caef4013a`), one workflow (`b0d49898-da36-4de0-9877-050e3d7322a2`), one active journey, and one `vitality_started` event. The provider accepted the message, the user confirmed external receipt, and the user opened the link once normally. The mailed credential is consumed and cleared; the email is verified; an active session exists on the same draft; and counts remain one contact, one draft, and one workflow. The unfinished draft is at Whole-Person Snapshot, 7%, revision 4 and was not completed. No client, staff, meal, workout, payment, or unrelated production data was created or changed.

Final decision: `VITALITY PRODUCTION READY`.

Rollback remains Netlify deploy `6ac036d3b48eac0008568e00`, source `d9eb428866ccf7b6338999f6aecb020721b17540`; the forward database and Edge additions require a reviewed non-destructive rollback plan if removal is ever needed.
