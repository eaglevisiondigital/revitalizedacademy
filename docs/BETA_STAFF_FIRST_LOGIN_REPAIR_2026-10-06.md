# Scoped staff first-login guidance repair

Date: 2026-10-06  
Environment: dedicated ReVitalized Academy staging only  
Status: implemented and locally verified; hosted deployment/acceptance pending

## Hosted defect

The approved existing scoped Coach identity was reconciled from the bounced staging alias to `dfowler4200@gmail.com`. The same Auth user, contact, invitation and staff-access rows remained in place. The confirmation email was delivered and verified the new address, but the browser landed on the generic Staff Portal sign-in form without explaining how to create the first password. The user had to infer that **Forgot your password?** was the next step. After authentication, the fallback copy said the role had not been approved even though authoritative state already held an active Coach role with assigned-only People scope and one required NDA still pending.

## Repair

- Staff invite and reissue callbacks now carry an explicit `?setup=staff` landing intent.
- A callback that establishes an Auth session continues directly to **Choose your password**.
- A callback without a browser session displays a dedicated **Finish setting up your staff account** panel instead of an unexplained sign-in form.
- The fallback requests one secure password setup email through the existing non-enumerating `staff-password-reset` Edge Function.
- Normal **Forgot your password?** uses that same branded function and dedicated password page.
- Saving a password on the dedicated page now clears `staff_invite`, sets `staff_invite_completed`, and accepts the existing invitation.
- Normal password sign-in is no longer forced back through setup solely by stale invitation metadata.
- The true unmatched-account state explains that the signed-in email is not connected to active staff access; it no longer claims an approved role is necessarily absent or offers an unrelated password action.

## Security and preservation

- Passwords and recovery tokens remain handled only by Supabase Auth.
- The public request stays non-enumerating.
- No raw token is logged, returned to the browser, or exposed in the UI.
- Existing Owner authorization, synthetic-recipient allowlist, account-collision checks, roles, permissions, contact scope and NDA gate are unchanged.
- No migration or production change is required.
- No duplicate Auth user, contact, invitation or staff-access record is created.

## Verification

- Focused staff setup/reconciliation tests: 6/6 source and 6/6 exact-built.
- JavaScript syntax: 78/78.
- Full frontend: 489 passed, 0 failed, 27 established skips.
- Staging build: 314 files; runtime configuration byte-identical to the accepted staging runtime.
- Local Deno was unavailable in this desktop runtime. The maintained Edge test was updated to assert `setup=staff`; deployment compilation or a Deno-capable runner must cover it before hosted acceptance.

## Hosted acceptance still required

After staging deployment, use the existing scoped Coach identity only. Reissue at most one setup message if needed, open it normally, confirm the guided setup landing, create the password without sharing it, and verify the required NDA/onboarding path. Do not change the role, assigned-only scope, permission defaults, agreement, or production.
