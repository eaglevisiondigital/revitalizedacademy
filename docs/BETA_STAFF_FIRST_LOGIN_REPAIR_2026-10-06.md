# Scoped staff first-login guidance repair

Date: 2026-10-06  
Environment: dedicated ReVitalized Academy staging only  
Status: deployed to staging; fresh hosted onboarding acceptance pending

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

## Staging release

- Source: `1d650e5eab98cfa99638c951e16e15c6450c020f`
- Netlify staging deploy: `6ac4c8e0b424fa9229d0451e`
- `portal.js?v=191`: live/build SHA-256 `48019ae9018fc5d6a55682bd200518c610ea6faed929b67d3eef86a20be87b26`
- `portal/password-reset.html`: live/build SHA-256 `66632fc0d9da488868328ed7e4aecf6b0a99429c7f1e2f3025b3ad42d9555e79`
- Staging `staff-management`: version 12 active; both invite and reconciliation callbacks include `?setup=staff`.
- Production Netlify deploy remains `6ac3eee5383ccf92be4d7a58` and was not touched.

## Hosted acceptance still required

After staging deployment, use the existing scoped Coach identity only. Reissue at most one setup message if needed, open it normally, confirm the guided setup landing, create the password without sharing it, and verify the required NDA/onboarding path. Do not change the role, assigned-only scope, permission defaults, agreement, or production.

## Recovery-link follow-up

The first hosted branded password email exposed an additional handoff defect: its button used the branded page with a raw `token_hash` query value, but the branded page requires the authenticated recovery session normally established by Supabase's action endpoint. Source `f096741` repairs the handoff without changing the password page or account lifecycle. Staging `staff-password-reset` v11 validates the configured Supabase recovery action and fixes its redirect to the branded staging password page before sending. Focused recovery coverage is now 7/7; full frontend is 490 passed, zero failed and 27 established skips. The corrected replacement message reports delivered at `2026-10-06T10:24:16.878Z`; normal user open and password completion remain pending. No production, migration, role, permission, identity or hosted application-data change was made.
