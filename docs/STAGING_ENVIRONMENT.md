# Isolated staging environment

Prepared 2026-09-27 UTC from lifecycle commit `feef92e1c0809cbd035edf35ebc70050d958b46b` on `codex/staging`. **Implemented/local verification only. No hosted staging project/site has been created or configured by this package.**

## Topology and trust boundaries

Production remains `main` → existing Netlify production site → Supabase `voalfpxiyznnqfcqcymd`. Staging requires `codex/staging` → a **separate Netlify site** → a **new separate Supabase project**. Never use a preview attached to the production database. Exact production Netlify site ID/provenance remains unverified; do not change it.

Use one explicit HTTPS origin `O` for this static application's public pages, member app, onboarding, Auth returns, secondary signer and notifications. Prefer `https://staging.revitalizedacademy.com`; a dedicated `https://<staging-site>.netlify.app` works without code edits. Set it consistently before seeding. The staged database binds its onboarding origin; changing it later requires a reviewed staging config change or recreation, not silently sending stale invitations between hosts.

## Configuration contract

| Variable / file | Visibility | Required use |
|---|---|---|
| `RVA_ENVIRONMENT` | Public | Explicit `staging`, `production` or `local`; no default |
| `RVA_SUPABASE_URL` | Public | `https://<20-letter-staging-ref>.supabase.co` for frontend/provisioner |
| `RVA_SUPABASE_PUBLISHABLE_KEY` | Public | Staging publishable key; matching legacy anon JWT also accepted; never secret/service role |
| `RVA_APP_ORIGIN` | Public | Exact `O`, no trailing slash/path; derives every callback/public URL |
| `RVA_PAYMENT_MODE` | Public | `synthetic` outside production; no provider checkout |
| `RVA_EXPECTED_NETLIFY_SITE_ID` | Build metadata | Exact dedicated staging site's ID; must match Netlify `SITE_ID` |
| `RVA_STAGING_PROJECT_REF` | Operator metadata | Must equal frontend/project target; never production ref |
| `RVA_STAGING_DATABASE_URL` | **Secret, operator only** | New staging direct DB or session pooler URL, `sslmode=verify-full`; never a Netlify browser/build input |
| `RVA_CONFIRM_NEW_PROJECT` | Operator acknowledgement | Explicit staging ref, only for provision/deploy `--apply` |
| `RVA_LEGAL_SEED_DIR` | Private operator path | Directory containing original PDFs and `templates.json`; default `.staging-private/legal` |
| `RVA_SUPABASE_CLI` | Operator path | Optional pinned CLI executable; verified version 2.118.0 |
| `SUPABASE_URL` | Edge runtime | Runtime staging project URL; environment guard checks deployment ID when available |
| `SUPABASE_SECRET_KEYS` / `SUPABASE_SERVICE_ROLE_KEY` | **Edge secrets** | Existing server administrative client; caller JWT and permission/RLS gates still required |
| `RVA_SYNTHETIC_EMAIL_ALLOWLIST` | **Edge-only recipient configuration** | Comma-separated exact test inboxes controlled by the team; empty means delivery denied |
| `RESEND_API_KEY`, `REVITALIZED_EMAIL_FROM` | **Edge secrets/config** | Dedicated staging sender/account credentials and sender identity; only approved synthetic inboxes |
| Twilio keys | **Server only; leave unset** | SMS is blocked by staging guard even if keys are present |

Netlify needs only the first six public/build variables. Edge needs `RVA_ENVIRONMENT`, `RVA_APP_ORIGIN`, `RVA_PAYMENT_MODE`, the synthetic recipient allowlist and approved provider secrets; hosted Supabase supplies its own runtime URL/keys. Never override reserved runtime Supabase values to route to another project.

`config/production.json` preserves the known public production mapping for a later authorized release. `js/environment.js` validates browser/build configuration; `supabase/functions/_shared/environment.ts` validates every Edge request before data access. Browser config is generated as `/runtime-config.js` from an allowlisted set of fields; arbitrary process environment values never enter it. All application callers now consume this configuration, including admin/account, assessment, journey, health, video, staff and onboarding. Read-only report articles and branded support email remain the existing public content.

Build locally with explicit variables and `npm run build`, then serve **dist**, never the repository root. Local configuration also requires an isolated project, synthetic payments and an explicit origin. Example synthetic build values for tests only: URL `https://abcdefghijklmnopqrst.supabase.co`, key `sb_publishable_synthetic`, origin `https://stage.example.invalid`. These are not deployable credentials/projects.

Staging rejects production project/ref/origin/Edge endpoint, mismatched callback origins, missing inputs, secret keys and real payment modes. Runtime host mismatch prevents client initialization. Netlify additionally requires the expected site ID, primary URL matching `O`, `BRANCH=codex/staging`, and `CONTEXT=production` **on the separate staging site**. Branch/deploy-preview contexts fail closed. A later production build requires explicit production mode, approved site identity and `main`. `[skip netlify]` is only an additional safeguard.

## Exact hosted Auth settings

These are **requirements, not configured settings**. Let `O` be the exact approved staging origin.

| Setting / operation | Exact value |
|---|---|
| Auth Site URL | `O/member/onboarding/` |
| Allowed redirect URLs | `O/member/onboarding/`, `O/portal/`, `O/portal/password-reset.html` |
| Signup confirmation `emailRedirectTo` | `O/member/onboarding/` |
| Primary enrollment link | `O/member/onboarding/#enroll=<token>` |
| Secondary signer link | `O/member/onboarding/#invite=<token>` |
| Member confirmation return | `O/member/onboarding/`; reopen original invitation after verification |
| Existing branded password recovery | `O/portal/password-reset.html` |
| Staff invite `redirectTo` | `O/portal/` |
| Custom staff recovery landing | `O/portal/password-reset.html?token_hash=<hashed-token>` |

Enable email confirmation; invited secondary adults must have verified recipient email. No wildcard production origins, localhost or arbitrary Netlify preview patterns in staging's hosted redirect list. Use the built-in verification link with the requested redirect; if customizing templates, follow Supabase's `RedirectTo` guidance and verify both confirmation and recovery. Never log full token-bearing URLs.

Configure a dedicated test SMTP/sink for **Supabase Auth emails** before creating synthetic accounts. Edge allowlisting does not control GoTrue's separate SMTP delivery. Restrict that transport/account to the approved test recipients, then verify delivery in controlled inboxes. Keep signup abuse/rate controls enabled. Branded reset HTML is preserved; successful delivery and token exchange require hosted acceptance.

## Edge inventory

All 15 recovered sources remain tracked; all now check environment and CORS before operations. Existing `verify_jwt=false` gateway flags remain: handlers enforce token/Auth/staff/permission checks themselves; do not mistake public gateway admission for authorization.

| Required for core staging acceptance | Purpose |
|---|---|
| public-intake | First contact mirror, webinar, enrollment |
| journey-link | Private journey/access links |
| health-profile-intake | Protected health intake regression |
| member-account | Authenticated enrollment claim |
| journey-override | Permissioned synthetic ledger and enrollment operations |
| agreement-sign | Exact-hash, one-authenticated-adult signing |
| staff-agreement-sign | Coach NDA acceptance |
| staff-management | Staff invitations and permissions |
| staff-password-reset | Branded recovery |
| notification-delivery | Recipient-restricted signer/NDA notices |
| member-coaching | Paid-access API boundary regression |
| member-document-upload | Private member document writes with rollback/idempotency |

Optional: `video-message-view` (private video), `coach-companion-knowledge`, `coach-companion-request`, `coach-companion-review` (retrieval/review Ask ReVitalized smoke tests), and `progress-photo-upload` (private member Progress Photo writes). Deploy these too when their existing features enter acceptance; they share the same guard. No AI generation provider is newly connected. No native app, wearable sync, APNs/FCM or GoodBarber integration is certified here.

Secondary signer outbox jobs retain only their existing service-accessible delivery copy until sent/redeemed/revoked; durable invitation records remain hashed. Dispatcher refuses non-allowlisted recipients, non-staging URLs and SMS in staging. Preserve its deliverability check and token redaction. Provider keys present does not prove a delivered message.

## Synthetic payments

Staging browser payment links are disabled, and staging-only DB constraint `staging_no_payment_endpoint` requires activation `payment_url IS NULL`. Use existing permissioned ledger actions against synthetic enrollments: below requirement → satisfied → refund/reversal → repayment, plus reasoned authorized waiver. No payment processor, real charge or production merchant credential is involved. Only production mapping retains the existing HTTPS link behavior. A genuine provider sandbox requires a separately approved adapter/allowlist and tests; changing one env value cannot enable it.

## Public deploy surface

Netlify now builds with `npm run build` and publishes `dist`. `config/public-files.json` enumerates **305 reviewed public files**, plus generated `runtime-config.js`: 306 files total. It includes root website HTML/images, assets, CSS/JS/data, member/portal/journey/video routes. Build injects config scripts before application scripts without rewriting approved page/form content. Source HTML requires the build; do not manually upload raw source.

Everything else is excluded by default: `supabase`, raw SQL, snapshots, all docs/reports/evidence, tests/fixtures, scripts, config templates, source legal files, node_modules, Git/GitHub metadata and stale `site-build`. Adding a file requires explicit manifest review. Netlify Forms declarations and same-site form POSTs remain present. Account pages remain RLS/Auth protected; excluding backend source is not a substitute for that boundary. Existing live production still has its previous publish configuration until a future authorized release; this package has not retroactively removed public production artifacts.

Seven already-missing dependencies in `outreach.html` were found at the lifecycle baseline (`assets/css/styles.css`, `assets/js/site.js`, logo-gold, three outreach photos and footer image). They are recorded as an existing limitation, not silently replaced with unapproved branding.

References: [Netlify file configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Edge environment/secrets](https://supabase.com/docs/guides/functions/secrets), [Supabase changelog](https://supabase.com/changelog). PostgreSQL 17.11 is used locally; the September 25 ltree/btree_gist/legacy encryption upgrade notice does not authorize a hosted upgrade or index removal.
