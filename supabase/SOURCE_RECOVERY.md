# Backend source recovery and migration workflow

Status: **VERIFIED live snapshot; IMPLEMENTED branch fixes; NOT DEPLOYED.** Captured 2026-09-26 from `voalfpxiyznnqfcqcymd`. Main source baseline: `df8aba33cd8bac16e54aded92a4c99439f74f1d5`.

## What is authoritative

- `baselines/2026-09-26/catalog.json`: read-only PostgreSQL catalog snapshot. It records 180 application tables, 204 views, 223 non-extension application functions, 114 custom triggers (113 public + one Auth user trigger), 426 public/storage policies, 713 indexes, constraints and object/default grants.
- `baselines/2026-09-26/schema.sql`: deterministic schema-only rendering by `scripts/backend/generate-baseline.py`. **It is a historical live baseline, not a migration, and must never be applied to the existing live project.** It successfully restores to an empty isolated PostgreSQL 17 database with platform fixtures and pgvector 0.8.2.
- `metadata.json` records view dependencies and non-personal permission configuration. `sequences.json` preserves identity ownership, ACLs and exact bigint bounds; sequence data/current values are intentionally excluded.
- `migration-inventory.json`: 185 genuine remote version/name records with statement counts and hashes. Latest: `20260926051441`. No historical statements or timestamps were invented, no fake ledger rows inserted, and no historical SQL replayed remotely. Stored statements did not account for v20–v27 in the earlier investigation; the snapshot captures the actual objects regardless of provenance gaps.
- `edge-functions/` contains the exact 15 recovered original deployments. `edge-source-manifest.json` records source hashes, deployment versions and bundle hashes (bundle and source hashes measure different things). Editable current sources are under `supabase/functions/`; changed handlers differ intentionally from these originals.
- `migrations/20260926212638_authorization_and_enrollment_gate.sql`: the forward change generated with `supabase migration new` (CLI 2.118.0). It is tested locally and **has not been applied remotely**.

## Recovery boundaries

Recovery used supported Supabase MCP read-only catalog queries and `get_edge_function`. The standard CLI `db dump` workflow was inspected, but no remote database password/direct connection or Docker engine was available to this task. We did not seek or print credentials. Catalog rendering is explicitly identified as such; it is not mislabeled as a native remote pg_dump.

The snapshot contains application structure and storage policies/bucket metadata, not customer data, Auth users, files, credentials, provider secrets, billing configuration values or contract contents from live table rows. Supabase-managed Auth/Storage/Vault/Realtime/cron schemas, jobs, extension implementation internals, publications, comments, complete hosted settings, external integrations and business seed data are not recreated. Original business/legal/template seeds require a controlled recovery plan before provisioning a complete new environment. `config.toml` is CLI-generated local configuration, not verified hosted configuration. All 15 observed gateway flags remain `verify_jwt=false`; preserve each handler’s actual authentication requirements.

`tests/backend/platform.sql` is **test-only** minimal Auth/Storage scaffolding. It implements JWT claim accessors for SQL role tests; it does not emulate GoTrue, PostgREST or the hosted Edge Runtime. It must never be run remotely. Restoring structure is verified; this is not a production disaster-recovery backup.

## Reproduce tests

1. Use Node 24, PostgreSQL 17 with pgcrypto/uuid-ossp and pgvector 0.8.2, and Deno 2.9.6.
2. Run `npm ci --ignore-scripts`, `npm test`, and `npm run check:js` from the application repository.
3. Start a dedicated local PostgreSQL cluster. Set `RVA_TEST_PGHOST`, `RVA_TEST_PGPORT` (default 55439) and `RVA_TEST_PGUSER` as needed. Authentication belongs in local secure tooling, never chat or tracked files.
4. Run `npm run test:backend`. The runner rejects remote hosts, creates a uniquely named database, restores baseline + forward migrations, runs synthetic tests with real RLS and triggers, and drops only that database in a finally block. Baseline customer data is never needed.
5. Run Deno check/test with `--frozen --config supabase/functions/deno.json`. Lockfile pins resolved dependencies. Entry points retain unconditional `Deno.serve`; importable handler modules support HTTP tests without starting servers.

CI performs these checks using a disposable PostgreSQL/pgvector service. No Supabase project secrets or deployment jobs are configured.

## Future schema changes and release

Create forward files using the installed CLI’s `supabase migration new <name>` after checking its help/version. Restore the historical baseline in an isolated database, apply existing forward files in order, then test the new change. Never place the baseline in the automatic migrations directory or run `db reset`/`db push` against production from this partial historical checkout.

Before an explicitly authorized release, refresh the live schema and ledger, verify there is no new drift, and check every forward version for collisions. The remote ledger has historical versions absent from `migrations/`; **do not “repair” history by inventing placeholders or marking nonexistent SQL applied**. In a private disposable release checkout, the supported `supabase migration fetch` can recover genuine ledger SQL for reconciliation. Inspect its current `--help`, compare fetched versions/hashes to the inventory, and handle historical seeds as sensitive data. Do not automatically commit those statements to this public repository. Preserve real remote history, dry-run the release, and confirm only the reviewed forward migration is pending. Missing genuine history is a release blocker, not permission to fabricate it.

Stage the database additions first, then compatible Edge Functions and the three frontend callers together. Existing views retain names/column order and gain signing hashes additively; member bootstrap stays v2. Cached old signing clients that omit a displayed hash will fail closed and need a reload. Review the currently configured root-directory Netlify publish behavior before any future release so backend/test source and local tools are excluded from the website artifact. This package does not change live deployment settings.

No merge, deployment, remote migration, production configuration edit, password reset, email, payment or signature was performed. Branch commits use `[skip netlify]` to avoid automatic Netlify deploys while allowing GitHub tests. See [Netlify’s documented skip behavior](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/#skip-a-deploy).

References: [Supabase database dump](https://supabase.com/docs/reference/cli/supabase-db-dump), [migration fetch](https://supabase.com/docs/reference/cli/supabase-migration-fetch), [database functions and privileges](https://supabase.com/docs/guides/database/functions), [pgvector](https://github.com/pgvector/pgvector).

## Client lifecycle forward package

`20260927020040_client_access_lifecycle.sql`, generated by CLI 2.118.0, follows the prior security migration. Restore the snapshot and apply both forward files for local tests. This changes code/local fixtures only; neither migration has been applied remotely. The test Auth scaffold now includes `email_confirmed_at` to distinguish verified recipients. It is still not a hosted Auth implementation. See docs/CLIENT_ACCESS_LIFECYCLE.md for staged release ordering, legacy-record review, and changed cached-client compatibility.


## Fresh isolated staging initializer

The approved staging package adds scripts/staging/provision.cjs and docs/STAGING_RELEASE_RUNBOOK.md. It uses this original structural snapshot unchanged, both genuine forward files, safe configuration seeds and exact private legal inputs. It records component hashes privately without fabricating the 185 historical ledger entries. It refuses populated application/Auth targets and known production. Managed hosted compatibility remains an acceptance gate; tests/backend/platform.sql must never be used remotely. Legal originals/template rows have now been recovered privately, but full business/entitlement/content/integration seeds and hosted settings remain outside this recovery.
