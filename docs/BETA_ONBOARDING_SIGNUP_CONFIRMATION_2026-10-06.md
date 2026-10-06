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

Deployment SHA, Netlify deploy ID, exact live hashes and responsive results will be added after the staging-only release.
