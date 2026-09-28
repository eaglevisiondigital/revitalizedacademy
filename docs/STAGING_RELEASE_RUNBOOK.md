# Staging release runbook

**Scope: a new isolated staging environment only. No production deployment, migration, config change, merge, live data copy or migration-history repair is authorized.** Follow [environment contract](STAGING_ENVIRONMENT.md) and [acceptance](STAGING_ACCEPTANCE.md).

## Before provisioning

1. Pin the reviewed `codex/staging` commit and verify CI. Preserve existing uncommitted work. Record the exact commit and CLI versions in the staging release log.
2. Create a new Supabase project (PostgreSQL 17, supported pgcrypto/uuid-ossp/vector) and separate Netlify site using the team's approved accounts/budget. Record both IDs privately. Do not reuse the known production project or existing Netlify site. Creation/billing/control-plane actions have **not** been performed by this package.
3. Choose `O` (preferred staging subdomain or dedicated Netlify hostname), obtain its project publishable key and private DB connection through secure tooling, and set the variables in STAGING_ENVIRONMENT.md. Do not put credentials in chat or Git. Use direct database or session pooler port 5432 with verified TLS; supply the provider CA via secure local connection configuration if required. Never disable TLS verification to make hosted provisioning work.
4. In the new staging project, confirm managed Auth and Storage schemas exist, public application tables are empty and there are no Auth users. Test platform.sql is **local-only** and must never be uploaded. Review the baseline's extension placements/managed privileges against the new hosted project. Any mismatch is a stop-and-inspect condition, not permission to drop a managed object.

## Original legal inputs

Recovered originals from **Backend Game Plan**, task `6ab547fc-ed48-83ea-a317-3fe668d7d544`: `ReVitalized Academy Contract MK7.pdf` and `The ReVitalized Nation Nondisclosure Agreement MK.1.pdf`. Fresh attachment paths were recovered; both PDFs are locally retained under ignored `.staging-private/legal/` with stable names `client-contract-mk7.pdf` and `coach-nda-mk1.pdf`.

Also recovered **existing published** `agreement_templates` rows read-only from production: keys `revitalized-academy-client-contract` / `revitalized-nation-coach-nda`, versions `MK7` / `MK.1`. Private `templates.json` preserves exact content_text, content_hash, merge_schema and non-personal metadata. No accepted/client-specific agreements were copied. `config/legal-manifest.json` tracks only version/metadata/PDF/content hashes. PDF layout extraction is not used as a replacement for the existing merge template. No wording was rewritten or scoring invented. Exact legal/business equivalence of every merge substitution remains a staging review item, not a new legal opinion.

On another checkout, transfer these three inputs securely from the private package; do not commit/upload them into the public repository or Netlify. If recovering anew, retrieve the same original attachments and select only those two template versions/columns through authorized read-only access. Verify manifest hashes. The provisioner refuses changed bytes, metadata, missing versions or mismatched original PDFs. It publishes the recovered template rows **inside the private/RLS-protected staging database**, with new local IDs and unchanged versions/hashes. Issued agreements link those IDs; rendered-content hashes remain computed by existing database routines.

## Database → seeds → Edge → frontend

1. Install locked Node dependencies (`npm ci --ignore-scripts`), inspect CLI help/version (verified Supabase 2.118.0), and run `node scripts/staging/provision.cjs` with explicit staging variables. Default is validation/plan only; it makes no DB connection. The database URL is never printed.
2. Once the new target is verified, set `RVA_CONFIRM_NEW_PROJECT` to its ref and run `node scripts/staging/provision.cjs --apply`. The runner verifies ref/connection identity and empty application/Auth state, then executes one database transaction:
   - recovered `supabase/baselines/2026-09-26/schema.sql` (structure, not historical production DML);
   - `20260926212638_authorization_and_enrollment_gate.sql`;
   - `20260927020040_client_access_lifecycle.sql`;
   - `20260928064500_privacy_lifecycle_access.sql`;
   - `20260928071500_health_provider_disconnect_hardening.sql`;
   - recovered permission catalog/defaults and six private Storage buckets; original and restrictive storage policies come from baseline/migrations;
   - safe program/journey configuration, 26 journey steps and synthetic 50-capacity webinar; no live prices, records, users, checkout URLs, external integration metadata or scheduled sends copied;
   - exact private MK7/MK.1 template rows, plus **synthetic acceptance-only** Foundations→MK7 requirement;
   - `client_onboarding.active=true`, explicit `O`; private deployment identity; staging-only origin/payment constraints; two recovered referral-view literals mapped to `O` while retaining invoker security;
   - content-hash component receipt in `private.staging_release_components`.
3. Verify the receipt, private buckets, template hashes/version relationships, independent staff export defaults, active onboarding origin and no payment URLs. The snapshot had **no program_agreement_requirements rows** at read-only inspection. The Foundations relationship here is an explicit synthetic test fixture, not proof of a production mapping or authorization for a production backfill. Do not copy it to production implicitly.
4. Configure hosted Auth redirects/confirmation and a restricted test SMTP transport as documented. Set Edge `RVA_ENVIRONMENT=staging`, `RVA_APP_ORIGIN=O`, `RVA_PAYMENT_MODE=synthetic` and recipient allowlist. Use dedicated provider credentials through the secrets UI or `supabase secrets set --project-ref <verified-staging-ref> --env-file <private-staging-secret-file>`. Leave SMS/generation/payment secrets unset. Secret files are ignored and excluded from deploy artifacts. Do not execute a command with the production project ref.
5. Run `node scripts/staging/edge.cjs` to review the required-function plan. After confirming DB/seeds/Auth/secret prerequisites, run it with `--apply`; optional functions can be included with `--include-optional`. It pins every CLI operation to the configured non-production ref and uses `--use-api --no-verify-jwt` to retain the recovered gateway mode. No pruning or unrelated function deletion. Verify each source version and configuration before frontend activation.
6. Configure the **separate Netlify site** to repo `eaglevisiondigital/revitalizedacademy`, production branch `codex/staging`, command `npm run build`, publish `dist`; set explicit staging public/build variables and disable previews/other branch deploys. The separate site uses Netlify's `production` context even though its application environment is staging. Set Node 24 in that site's build configuration. Check no team/shared production variable has leaked into it.
7. Build and inspect the artifact. Confirm config points only to the new project/origin and backend/SQL/docs/private files return 404. Enable Forms only on that new site; disable real-recipient notifications/webhooks. Deploy only to that new staging site after database and Edge readiness. If using the staging subdomain, only add its separate DNS record after ownership/routing review; leave apex/www production records unchanged.
8. Work performs the synthetic hosted acceptance matrix and records deployment commit, project/site IDs, timestamps, outcomes and evidence with tokens/secrets redacted. HTTP 200 alone is not success. Production stays unchanged until a separately approved release.

## Recovery provenance and limitations

This is a fresh-project initializer, not `supabase db push` against production. The 185 observed historical ledger entries are inventory/hash evidence; no placeholder SQL or fake applied history is created. The two genuine new forward files execute as reviewed components, with hashes in a private staging receipt, not fabricated remote historical ledger rows. Subsequent migrations need an explicit project-history workflow; this initializer refuses to rerun on populated application schemas.

Managed Auth/Storage behavior, extension versions/ownership, hosted API/grants exposure, Realtime publications, cron jobs, Vault values, schedules, SMTP, providers, full content catalogs/entitlement configurations and complete business seeds are not reconstructed by this snapshot. Hosted compatibility is **unverified** until actual setup. Stop on a restore failure and examine the managed-schema difference; never upload the local Auth/Storage test scaffold to compensate. The local tests prove structure/constraints/RLS with fixtures, not hosted GoTrue/PostgREST behavior. Broader paid content/native/AI acceptance may need further approved configuration recovery. See [SOURCE_RECOVERY](../supabase/SOURCE_RECOVERY.md).

## Staging rollback and failure handling

1. Stop synthetic tests and outbound dispatcher activity. Point the staging site back to its previous known compatible **staging** artifact or disable only that site. Never select a production artifact/config as a shortcut.
2. Roll back Edge code to the recorded compatible staging commit while keeping the same isolated runtime ref/origin and synthetic recipient restrictions. Deploy only affected functions explicitly to the staging ref. If older Edge code lacks guards, disable staging access instead of reinstalling production-bound handlers.
3. Provisioning is transactional: a SQL/seed failure rolls back its application transaction. Verify no application objects/receipt remain; inspect error privately. No blind retry, dropping managed schemas or down migration is assumed. Published template immutability is intentional.
4. For a later partially applied/non-transactional migration, stop rollout, restore a verified staging-only backup or recreate a new empty staging project and rerun this reviewed bundle. Keep the failed staging environment for diagnosis only if access is restricted. Do not restore live client data or rewrite migration history. Reconcile future migration workflow before changes.
5. Restore versioned staging config/secrets through secure tooling; rotate any exposed staging credentials. Keep DB, Edge and frontend origins aligned. Old email tokens/URLs may need revocation and fresh synthetic invitations after recreation. Record versions/receipt/hosted settings and rerun acceptance.

No down migrations, production rollback, merge or automated production deployment are supplied.
