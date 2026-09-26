# Baseline evidence and source register

Observed 2026-09-26. Commit-pinned links below avoid confusing future source changes with this baseline. Raw conversations and private attachments were not copied into this public-origin repository.

## E1 — Application repository

[ReVitalized application, pinned Build 192](https://github.com/eaglevisiondigital/revitalizedacademy/tree/df8aba33cd8bac16e54aded92a4c99439f74f1d5).

- [Netlify configuration](https://github.com/eaglevisiondigital/revitalizedacademy/blob/df8aba33cd8bac16e54aded92a4c99439f74f1d5/netlify.toml): root publish directory and protected-route headers.
- [Member application](https://github.com/eaglevisiondigital/revitalizedacademy/blob/df8aba33cd8bac16e54aded92a4c99439f74f1d5/member/member110.js): line 3018 requests `my_app_bootstrap_v2`; line 592 passes agreement signatures through the existing Edge flow.
- [Public data bridge](https://github.com/eaglevisiondigital/revitalizedacademy/blob/df8aba33cd8bac16e54aded92a4c99439f74f1d5/js/revitalized-data.js): public-intake endpoint, mirrored contact events, progress/completion and derived tags.
- [Assessment engine](https://github.com/eaglevisiondigital/revitalizedacademy/blob/df8aba33cd8bac16e54aded92a4c99439f74f1d5/js/vitality55.js): lines 560 onward await independent first contact submission.
- [People directory](https://github.com/eaglevisiondigital/revitalizedacademy/blob/df8aba33cd8bac16e54aded92a4c99439f74f1d5/portal/portal-people-directory.js): lines 222–258 contain export permission, data fetch, audit RPC and fail-closed download.
- Build 71, 72 and 74 notes preserve assessment restoration, approval/routing and review requirements. They are historical notes; current tests add a twentieth case for child Male/Female choices.
- All fetched branch refs and recent default-branch commits are recorded in [evidence.json](evidence.json). Clones used depth 30 with all remote branches; this is not a full merge/ancestry audit. No unrelated branch was merged or altered.

## E2 — Strategy repository

[Phase One plan at `2122143`](https://github.com/eaglevisiondigital/revitalizedroadmap/tree/212214307d38369f92d8bf545c105f46b24ecc93).

README and HTML identify a responsive executive implementation presentation, with phase sequencing, webinar conversion, ReFuel/affiliate growth and complete ecosystem goals. Files consist of the presentation and assets; no Supabase application wiring or operational portal was found. Latest inspected commit is 2026-08-05; only `main` returned.

## E3 — Blueprint and actual mockups

[Blueprint at `0eaaa11`](https://github.com/eaglevisiondigital/revitalized-digital-blueprint/tree/0eaaa11ba42e6045bfaa5f4a18fb3b0d29f4f810), latest inspected commit 2026-08-19, only `main` returned.

The 30-section presentation provides long-term product intent. These actual images were recovered and visually inspected:

- [Dashboard](https://github.com/eaglevisiondigital/revitalized-digital-blueprint/blob/0eaaa11ba42e6045bfaa5f4a18fb3b0d29f4f810/assets/images/dashboard.webp)
- [Progress](https://github.com/eaglevisiondigital/revitalized-digital-blueprint/blob/0eaaa11ba42e6045bfaa5f4a18fb3b0d29f4f810/assets/images/progress.webp)
- [Family Hub](https://github.com/eaglevisiondigital/revitalized-digital-blueprint/blob/0eaaa11ba42e6045bfaa5f4a18fb3b0d29f4f810/assets/images/family-hub.webp)
- [Coach Dashboard](https://github.com/eaglevisiondigital/revitalized-digital-blueprint/blob/0eaaa11ba42e6045bfaa5f4a18fb3b0d29f4f810/assets/images/coach-dashboard.webp)

An `app-overview.webp` and supporting coaching/community/courses/nutrition/workout/ReFuel/ambassador images also exist. Hashes of key references are in the manifest. Their presence does not turn every proposed feature or illustrative number into a released capability.

## E4 — Accessible project history

All pages returned by `read_thread` were retrieved to the oldest available turn for these five tasks, totaling **219 turns**. Per-item text was limited to 18,000–20,000 characters by retrieval; older tool traces and full image sets were not exhaustively exported. User decisions, explicit corrections and relevant build claims were reconciled; do not describe this as a complete original project-source export.

| Exact title | Task ID | Returned turns |
|---|---|---:|
| Resume backend buildout | `6ab739b0-3488-83ea-a3e5-fa8358d82c21` | 17 |
| BACKEND BUILDOUT CONT 2 RVA | `6ab5dacb-3268-83ea-89d0-5079a66cef49` | 81 |
| Backend Game Plan | `6ab547fc-ed48-83ea-a317-3fe668d7d544` | 55 |
| Locate Academy Mockup | `6ab72fe8-68c8-83ea-8407-76ce915f7aa5` | 2 |
| Webinar Launch System Design | `6a748eaa-2c04-83ea-a8f2-0ab7271c8f7a` | 64 |

The new operating instructions in “Revitalized Academy main - WORK #1” were read during initial intake. The current task's engineering instructions control this package.

Available attachments were checked for existence: **ReVitalized Academy Contract MK7.pdf** and **The ReVitalized Nation Nondisclosure Agreement MK.1.pdf**. They do not need to be re-uploaded for access. Their contents were not audited against seeded agreement templates during this baseline. Original exact PNG names cited in Locate Academy Mockup were not returned there, but the blueprint's actual feature mockups were recovered.

Missing/inaccessible for complete provenance: exact “Build Vitality Assessment” task link, original adult assessment PDF/annotated review source, `ReVitalized_Child_Assessment_Approval_Draft.docx`, and any Global Propel architecture source not contained in these five tasks/repositories. Do not request wholesale history or credentials; request only these specific sources when their decisions are needed.

## E5 — Live Supabase inspection

Project `voalfpxiyznnqfcqcymd`, [project dashboard](https://supabase.com/dashboard/project/voalfpxiyznnqfcqcymd).

Read-only connector calls: project listing, table listing, migrations, development branches, Edge Function listing/source, security advisors, catalog and configuration SELECTs. No member records were selected. Catalog inventory covered public views, public/private function definitions, public/storage policies, non-internal public triggers and bucket metadata.

Source sampled for eight deployed functions: public-intake v6, staff-management v3, staff-password-reset v2, coach-companion-request v1, coach-companion-knowledge v1, notification-delivery v1, agreement-sign v3 and staff-agreement-sign v2. Remaining seven function bodies were not audited. The manifest lists all 15 deployment versions and provider hashes.

Reproduction of the migration discrepancy used a SELECT over `supabase_migrations.schema_migrations`, checking `array_to_string(statements, E'\n')` against the regex `my_app_bootstrap_v(2[0-7])\M`; no rows matched. The live view catalog contains those views. This proves missing ledger references, not exactly who applied those changes or how.

Permission defaults were read without staff identities. A separate catalog check confirmed `staff_access_audit` is owned by postgres, RLS enabled, and `authenticated` lacks INSERT privilege. Together with the security-invoker export RPC and lack of INSERT policy, this supports the documented export-path concern.

## E6 — Deployment and CI evidence

- Ten known public paths were fetched from both [custom domain](https://revitalizedacademy.com) and [Netlify alias](https://revitalizedacademy.netlify.app): all 20 GETs returned HTTP 200.
- Member HTML plus `member/member110.js`, `js/revitalized-data.js`, `js/vitality55.js` and `js/vitality-child.js` matched pinned repository bytes on both hosts.
- Other sampled HTML differs through internal-link/form attribute processing; inspected diffs were consistent with Netlify transformations. This is not a whole-site hash audit.
- Public GitHub deployment lists were empty and commit status contexts absent for the compared repositories; this does not mean there is no deployment. Netlify's exact deploy record is still needed for commit-level provenance.
- [Latest returned assessment workflow run](https://github.com/eaglevisiondigital/revitalizedacademy/actions/runs/36138654008) succeeded at `48d5be8894da151468894de02dd9f985a0b90ba4`, not the current Build 192 head. The workflow filters assessment-related paths and uses Node 22. It omits `js/revitalized-data.js`, despite that file participating in capture synchronization.
- No authenticated page testing, forms, email/SMS, transactions, device sync or control-plane changes occurred.

## E7 — Current local verification

Node 24.20.0 and the repository-pinned jsdom 26.1.0 installed in a temporary directory. All existing `.cjs` tests ran once on unchanged application code: 44 pass / 28 fail / 72 total, including 20 passing assessment cases. All 60 JavaScript files passed syntax checks. [Full output](test-results.txt).

Static literal `.from()` / `.rpc()` references in JavaScript were compared to live catalog names. The only unmatched “relations” were actual Storage bucket names, all present. This validates names only, not selected columns, permissions, runtime results or dynamic API construction.

## Evidence retention

The checked-in-ready manifest contains sanitized metadata, object-definition hashes, source refs and test results. Raw retrieved conversations, live catalog definitions and Edge Function source were retained only in the task's temporary investigation directory, not in this documentation package. They are not a durable migration/source backup; recovering a reviewed reproducible backend is the next package.
