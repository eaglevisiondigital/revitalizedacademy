# ReVitalized Academy — current build state

Baseline date: **2026-09-26**. Read-only remote investigation; local documentation only.

## Recommended working location

- Implementation: `eaglevisiondigital/revitalizedacademy`.
- Source baseline: `main`, commit `df8aba33cd8bac16e54aded92a4c99439f74f1d5` (Build 192).
- Local documentation branch: `codex/verified-baseline`. Future implementation should use a separate `codex/*` branch from refreshed `origin/main`.
- `revitalizedroadmap` is the Phase One strategy presentation; `revitalized-digital-blueprint` is the ecosystem/design reference. Preserve both.
- No remote branch, commit, deployment, database object or configuration was changed. The original parent workspace files were preserved.

See [baseline report](docs/baseline/BASELINE_REPORT.md), [source register](docs/baseline/SOURCES.md), and [dated evidence](docs/baseline/evidence.json).

## Status by evidence level

| Area | Implemented source / database | Deployment evidence | Verification / remaining work |
|---|---|---|---|
| Public website and brand | Static HTML/CSS/JS; approved assets retained | Custom domain and Netlify alias serve inspected pages; four sampled JS files match source byte-for-byte | Public GET checks only; no new visual/browser acceptance |
| Assessment | Independent first contact save; adult/child questions and conditional routing; Netlify final answer submission; separate Supabase journey bridge | Assessment JS and child module match source on both domains | **20/20 existing assessment tests pass**, using synthetic data and mocked POSTs. Real Netlify/Supabase persistence not exercised |
| Lead, webinar and enrollment | `public-intake` v6 deployed; five program definitions; webinar capacity 50, reservation amount 5000 cents, start date unset | Public frontend and Edge Function deployment metadata verified | No form submissions, seat reservations or payment transactions. Webinar is priority pre-registration, not verified paid checkout |
| Staff portal | CRM, people, journey, team, learning, billing, agreements, permissions, messaging modules | Portal HTML served; observed difference from source is a rewritten internal URL | Authenticated access, invitation/recovery and email delivery need Work validation |
| Member application | Build 192 requests **`my_app_bootstrap_v2`** plus separate datasets; goals, habits, Family Hub requests, health consent and existing agreement UI | Member HTML and JS match source byte-for-byte | Latest database features are not automatically surfaced. No authenticated member acceptance test |
| Backend | **180 public tables, 204 public views, 223 public/private functions, 113 public triggers, 426 public/storage policies, 15 deployed Edge Functions** | Live catalog inspected; views through **v27** exist | Catalog presence is verified; workflow correctness and tenant/household isolation are not certified |
| Database change history | **185 migration entries**, latest `20260926051441` (`index_notification_route_rule_foreign_key`) | v20–v27 views and later objects exist in the live catalog | No migration statement references to v20–v27 were found. Repository contains no migration files or Edge Function source. Reconcile before any replay |
| Wearables/mobile | Provider/consent/observation/device/sync tables and mobile-health batch RPC exist | Backend objects deployed; current UI says native bridge will connect when released | No native iOS/Android project found in these repositories. No device sync/push-delivery test |
| AI Advisor | Knowledge/retrieval, review, feedback, usage and consent foundations exist | `coach-companion-request` v1 deployed | Source explicitly reports `generation_provider_connected:false` and `answer_sent:false`; this is not verified autonomous AI answering |
| Communications | Resend/Twilio adapter code; branded staff recovery source | Email channel marked ready/enabled; SMS disabled, `setup_required` | Configuration flags are not proof of provider delivery; no email/SMS sent |
| Security | All 180 listed public tables have RLS; all 204 public views are security invoker; six private buckets | Live settings/catalog checked | Advisor warns leaked-password protection is disabled. Additional code findings in SECURITY_MODEL.md require tests |

## Tests run on the unchanged application

- `node --check`: **60 JavaScript files pass**.
- Existing `node --test tests/*.cjs`, Node **v24.20.0**, jsdom **26.1.0**: **72 tests; 44 pass, 28 fail**. Includes all 20 passing assessment tests.
- Failures largely reference historical Build 76–82 hashes/markup. Enrollment test expects the older 3-month commitment and an old exact plan label, while current source and live catalog agree on six months. Do not blindly update snapshots or revert approved UI to make tests green.
- Some passing legacy tests inspect saved browser-check JSON; they do not constitute a new browser run.
- No new tests were written, no production submissions were sent, and no authenticated/RLS negative-path test was performed. See [full output](docs/baseline/test-results.txt).

## Next coherent package

**Recover a reproducible backend baseline and establish a reliable permission/regression test gate.** Capture reviewed schema/migration/Edge Function source into version control, account for unrecorded changes without replaying them against production, and run isolated role tests for export, suspended staff, contact scope, household/minor access and privileged Edge Functions. Triage historical test failures against actual approvals. Then plan the member UI connection to the later bootstrap capabilities, preserving current v2 consumers until compatibility is proven.

## Outstanding inputs

- Exact primary Chat authority and a link to **“Build Vitality Assessment”**, which was not discoverable in the accessible task listing.
- Original adult/child assessment approval documents for a verbatim source-to-code audit; repository notes recover their intent but not the originals.
- Netlify deployment record/site settings to verify exact deployed commit and build branch, plus any separate non-production environment.
- Decisions in DECISIONS.md (score methodology, family data sharing, staged release and legacy platform ownership). No credentials are requested.
