# Hosted staging state

Updated 2026-09-28 UTC.

This document records the isolated hosted staging checkpoint only. It does **not** authorize production changes, a merge to `main`, production migrations, production deploys, real payments, SMS, or customer-data copying.

## Isolated targets

- GitHub: `eaglevisiondigital/revitalizedacademy`, branch `codex/staging`
- Supabase staging: `bvooallokgfktssadsrv`
- Supabase production remains `voalfpxiyznnqfcqcymd` and has not been changed by staging work
- Netlify staging site: `071b252e-a922-4846-a784-8dca1edad377`
- Live staging origin: `https://revitalizedacademy-staging.netlify.app`
- Payments: synthetic only
- SMS/Twilio: disabled / not configured

## Hosted database checkpoint

The observed 2026-09-26 baseline was replayed into the previously empty isolated staging project in statement-safe batches because the management migration endpoint rejected the approximately 2 MB baseline as one request.

Forward-reference prerequisites were installed using the exact later baseline definitions before their callers. The later health timeline view was replayed with `CREATE OR REPLACE VIEW` only because that exact view had been pre-created to satisfy an earlier SQL-language function dependency.

The final baseline tail was applied except for 12 `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin` statements. Hosted Supabase rejected changing the managed `supabase_admin` role's default privileges. The remaining supported statements were applied.

The five reviewed forward migrations were then applied in branch order:

1. `20260926212638_authorization_and_enrollment_gate.sql`
2. `20260927020040_client_access_lifecycle.sql`
3. `20260928064500_privacy_lifecycle_access.sql`
4. `20260928071500_health_provider_disconnect_hardening.sql`
5. `20260928084500_goal_habit_idempotency.sql`

Latest verified hosted staging structure:

- 180 public tables
- 204 public views
- 578 public RLS policies
- 123 public non-internal triggers
- all 180 public tables have RLS enabled
- 0 Auth users before acceptance
- 6 private Storage buckets
- 0 Storage objects before acceptance

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

Staging-only DB guardrails enforce:

- exact staging onboarding origin
- `journey_enrollment_activations.payment_url IS NULL`
- a private `staging_release_components` registry
- staging ambassador share links instead of production links

No production customer/auth/storage objects were copied.

## Security reconciliation

Staging execute grants for these `SECURITY DEFINER` functions were reconciled to the established production ACLs:

- `coach_companion_match_chunks`: service role only; no anon/authenticated execute
- `handle_new_user`: trigger/auth-admin path retained; no anon/authenticated execute
- `my_staff_permissions`: no anon/authenticated execute
- `disconnect_my_health_provider`: authenticated execute intentionally retained because the function validates `auth.uid()`, full member access, active contact ownership and provider ownership

The remaining Security Advisor warning is the intentional authenticated `disconnect_my_health_provider` RPC. The informational `private.agreement_signer_invitations` notice remains closed by table privileges; anon/authenticated have no table access.

## Hosted Edge Functions

All 15 core hosted functions are ACTIVE v1:

- `public-intake`
- `journey-link`
- `health-profile-intake`
- `member-account`
- `journey-override`
- `member-coaching`
- `staff-management`
- `staff-password-reset`
- `notification-delivery`
- `agreement-sign`
- `staff-agreement-sign`
- `member-document-upload`
- `member-message-attachment-upload`
- `member-support`
- `progress-photo-upload`

Optional `video-message-view` and Coach Companion hosted functions remain outside the baseline acceptance requirement.

## Netlify staging

The exact tracked source from `codex/staging` checkpoint `3b696d0e886ed3c7d336a259fb436cf9f9630b9c` is live on the dedicated staging site.

Verified:

- live URL: `https://revitalizedacademy-staging.netlify.app/`
- 306-file public build
- private/source paths excluded
- synthetic-payment runtime mapping
- Netlify Forms enabled on the staging site

## Hosted Auth configuration

Verified manually in the staging Supabase dashboard on 2026-09-28:

Site URL:

`https://revitalizedacademy-staging.netlify.app/member/onboarding/`

Allowed redirect URLs are exactly:

- `https://revitalizedacademy-staging.netlify.app/member/onboarding/`
- `https://revitalizedacademy-staging.netlify.app/portal/`
- `https://revitalizedacademy-staging.netlify.app/portal/password-reset.html`

Authentication settings verified:

- Email provider enabled
- Confirm email enabled
- Anonymous sign-ins disabled
- Phone sign-in disabled

## Auth SMTP

Staging Supabase Auth SMTP is now configured and saved using the existing Revitalized Academy Resend setup.

Verified non-secret settings:

- sender: `noreply@auth.revitalizedacademy.com`
- sender name: `ReVitalized Academy`
- host: `smtp.resend.com`
- port: `465`
- username: `resend`
- minimum interval per user: 60 seconds
- password remains stored/masked and is not recorded in Git/chat

Approved controlled staging inboxes:

- `dave@theboss.biz`
- `dave@eaglevision.biz`

## Edge environment secrets

The following custom Edge Function secrets were manually created and saved in the staging project on 2026-09-28:

- `RVA_ENVIRONMENT=staging`
- `RVA_APP_ORIGIN=https://revitalizedacademy-staging.netlify.app`
- `RVA_PAYMENT_MODE=synthetic`
- `RVA_SYNTHETIC_EMAIL_ALLOWLIST=dave@theboss.biz,dave@eaglevision.biz,dave+rva-client-a@eaglevision.biz,dave+rva-client-b@eaglevision.biz,dave+rva-beta-staff@eaglevision.biz` — updated 2026-10-04 with explicit approval for remaining synthetic beta acceptance, preserving the original two recipients. Saved SHA-256 `9642867372ec8b16d549d313fb88772080557260a2fc7744a0ddf80a1595e820`. Actual alias delivery is still unproven; entries retained for the unfinished acceptance window. See [continuation receipt](BETA_REMAINING_ACCEPTANCE_2026-10-04.md).

Supabase-managed default secrets were not modified.

## Current pre-acceptance gate

Completed:

- staging site live
- Netlify Forms enabled
- Auth Site URL verified
- exact redirect allowlist verified
- email confirmation enabled
- Resend SMTP configured and saved
- controlled synthetic inboxes approved
- four required Edge environment secrets saved
- real payment endpoints blocked by staging DB guardrail
- SMS disabled
- production unchanged

Still required before synthetic accounts are created:

1. Live invoke one staging Edge Function and verify the environment guard no longer returns `Environment configuration unavailable; connections disabled`.
2. If the guard passes, enable staging user signup for acceptance if it remains disabled.
3. Create synthetic accounts only with the approved inboxes.
4. Run the hosted synthetic acceptance matrix.
5. Keep all vNext flags OFF until baseline acceptance passes.

No implementation defect is currently established. Codex is not required unless hosted acceptance reveals one.

Production remains unchanged and release remains blocked.
