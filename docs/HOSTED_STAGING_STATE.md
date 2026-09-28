# Hosted staging state

Updated 2026-09-28 UTC.

This document records the isolated hosted staging checkpoint only. It does **not** authorize production changes, a merge to `main`, production migrations, production deploys, real payments, SMS, or customer-data copying.

## Isolated targets

- GitHub: `eaglevisiondigital/revitalizedacademy`, branch `codex/staging`
- Supabase staging: `bvooallokgfktssadsrv`
- Supabase production remains `voalfpxiyznnqfcqcymd` and was used only for read-only configuration parity checks
- Netlify staging site: `071b252e-a922-4846-a784-8dca1edad377`
- Staging origin: `https://revitalizedacademy-staging.netlify.app`
- Payments: synthetic only

## Hosted database checkpoint

The observed 2026-09-26 baseline was replayed into the previously empty isolated staging project in statement-safe batches because the management migration endpoint rejected the approximately 2 MB baseline as one request.

Forward-reference prerequisites were installed using the exact later baseline definitions before their callers. The later health timeline view was replayed with `CREATE OR REPLACE VIEW` only because that exact view had been pre-created to satisfy an earlier SQL-language function dependency.

The final baseline tail was applied except for 12 `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin` statements. Hosted Supabase rejected changing the managed `supabase_admin` role's default privileges. The remaining 467 statements in that tail were applied.

The five reviewed forward migrations were then applied in branch order:

1. `20260926212638_authorization_and_enrollment_gate.sql`
2. `20260927020040_client_access_lifecycle.sql`
3. `20260928064500_privacy_lifecycle_access.sql`
4. `20260928071500_health_provider_disconnect_hardening.sql`
5. `20260928084500_goal_habit_idempotency.sql`

Latest hosted staging object counts after those migrations:

- 180 public tables
- 204 public views
- 578 public RLS policies
- 123 public non-internal triggers
- 0 Auth users at this checkpoint

## Non-customer staging configuration

Seeded and verified:

- 19 staff permission catalog entries
- 95 role permission defaults
- 40 legacy permission rules
- 6 private storage buckets
- 5 program shells
- 3 journeys
- 26 journey steps
- 1 synthetic Founders webinar
- staging deployment identity
- exact staging onboarding origin
- all additive member vNext feature flags OFF
- MK7 client agreement template and MK.1 coach NDA template using locked manifest filenames/content hashes
- Holistic Foundations agreement requirement

Staging-only DB guardrails now enforce:

- exact staging onboarding origin
- `journey_enrollment_activations.payment_url IS NULL`
- a private `staging_release_components` registry
- staging ambassador share links instead of production links

No production customer/auth/storage objects were copied.

## Hosted Edge Functions

ACTIVE:

- `public-intake` (`verify_jwt=false`)
- `journey-link` (`verify_jwt=false`)
- `health-profile-intake` (`verify_jwt=false`)
- `member-account` (`verify_jwt=false`)
- `journey-override` (`verify_jwt=false`)
- `member-coaching` (`verify_jwt=false`)
- `staff-management` (`verify_jwt=false`)
- `staff-password-reset` (`verify_jwt=false`)
- `notification-delivery` (`verify_jwt=false`)
- `member-document-upload` (`verify_jwt=true`)
- `member-message-attachment-upload` (`verify_jwt=true`)
- `member-support` (`verify_jwt=true`)
- `progress-photo-upload` (`verify_jwt=true`)

All deployed bundles include their tracked shared environment/auth dependencies.

Not yet deployed from this chat because the platform blocked those deployment actions before execution:

- `agreement-sign`
- `staff-agreement-sign`
- optional `video-message-view`

The remaining optional Coach Companion functions have not yet been promoted to hosted acceptance.

## Remaining hosted blockers

Before synthetic user acceptance:

1. Configure Edge secrets/config required by `_shared/environment.ts`: staging environment, exact app origin, synthetic payment mode, and controlled synthetic recipient allowlist. Do not add Twilio.
2. Configure hosted Auth Site URL and exact redirect allowlist for the staging origin.
3. Configure a dedicated test SMTP/sink for Supabase Auth before creating synthetic accounts.
4. Publish the built `codex/staging` site to the dedicated Netlify staging site. The Netlify connector confirms deployment requires an actual checked-out repository directory.
5. Resolve/deploy the two core signing functions without bypassing their existing authorization/environment guards.
6. Run the approved synthetic hosted acceptance matrix.
7. Keep all vNext flags OFF until baseline acceptance passes.

Production remains unchanged and release remains blocked.
