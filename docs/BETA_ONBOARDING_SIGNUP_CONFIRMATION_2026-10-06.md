# Enrollment account-creation confirmation repair

Date: 2026-10-06  
Environment: dedicated ReVitalized Academy staging only  
Branch: `codex/staging`

## Hosted defect

During the approved Client B beta lifecycle, the user selected **Create my account** on the mobile Enrollment & Signature Center. Supabase created the account and immediately delivered the verification email, but the visible form did not change. The existing implementation updated only the page-level status above the mobile viewport, leaving the button area visually unchanged.

This is a presentation failure at a security boundary. Account creation, verification delivery, invitation ownership and agreement association continued to work, but the user could reasonably retry and create confusion.

## Repair

- Preserve the existing Supabase `signUp` call and approved verification redirect.
- When signup succeeds without an immediate session, replace the form in place with **Check your email to finish creating your account**.
- Display the address the user submitted and explain the two distinct next steps: verify the email, then reopen the original private enrollment/agreement invitation.
- Move keyboard focus to the confirmation and scroll it into view.
- Provide **Use a different email or sign in** without attempting another signup automatically.
- Advance `member/onboarding/onboarding.js` and `.css` cache versions from v2 to v3.

No enrollment, agreement, payment, invitation-token, membership, Supabase schema, RLS, permission, feature-flag or production behavior changes.

## Verification

- Focused onboarding lifecycle: **10/10 passed**.
- JavaScript syntax: **78/78 passed**.
- Full frontend suite: **483 passed, 0 failed, 27 established skips**.
- Staging build: **314 files**.
- Regression asserts that the original form is hidden, the confirmation is visible at the form location, the submitted email and invitation instructions render, and returning to sign-in restores the form.

## Hosted state

Client B `dfowler4232@gmail.com` already created and verified its single account through the normal flow before this repair. Preserve that identity and continue by reopening the original agreement invitation. Do not create a second account.

## Staging release

- Source: `3cb8ba4e18f73179e2de9ee7fdf88e516225fe2a`
- Netlify staging site: `071b252e-a922-4846-a784-8dca1edad377`
- Deploy: `6ac4ad32ad37f1281a60f6e8` (`ready`)
- Branch/context: `codex/staging` / the dedicated staging site's production context
- Published: `2026-10-06T08:11:34.028Z`
- Live HTML requests `onboarding.js?v=3` and `onboarding.css?v=3` and contains the new confirmation heading.
- Live JS SHA-256: `1714b1cb780160445b5122b3b25a855a2a7dc1328ac8abe3c83d3986cea6cc9a`
- Live CSS SHA-256: `649d1bfef6b78f9c7d32d983d4487a13d1b62cbc155ef67a058c20789589056b`
- Both live hashes match the exact staging build.

Netlify reports only the onboarding page and its two assets changed. No Functions or Edge Functions deployed. Production remains published deploy `6ac3eee5383ccf92be4d7a58` and was not touched.

The repaired confirmation state is covered in the exact source/build regression. A second hosted signup was intentionally not performed because Client B's account already exists and duplicate identity creation is prohibited. The next hosted step is reopening Client B's original agreement invitation while the newly verified Client B account remains signed in.
