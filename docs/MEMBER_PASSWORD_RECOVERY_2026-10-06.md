# Member Password Recovery — 2026-10-06

## Reason for the package

Final hosted beta acceptance required Client B password recovery, but Member Access exposed only email/password sign-in. The branded staff recovery flow could not be reused safely because it is scoped to active staff and staff-invitation completion.

## Implemented boundary

- Member Access exposes **Forgot your password?** and a compact recovery form.
- A successful request replaces the form with a prominent **Check Your Email** confirmation while preserving the same non-enumerating language.
- The browser invokes only `member-password-reset` with the entered normalized email.
- Every valid request receives the same neutral response.
- Delivery requires one exact-email contact, one eligible linked `client_access` row and the same email on the linked Auth user.
- Staging delivery remains limited to exact approved synthetic recipients.
- The generated Supabase action URL is validated before its one-time credential is placed in the branded reset URL.
- `/member/password-reset.html` removes the credential from browser history before exchange, calls `verifyOtp` with recovery type, and updates only the signed-in Auth user's password.
- The reset page uses an isolated, non-persistent client with auto-refresh and automatic URL detection disabled so an obsolete session cannot race the explicit recovery exchange.
- The flow does not alter client access, memberships, entitlements, staff records, invitations, roles or permissions.

## Verification

- Focused source checks: 4 passed.
- Focused exact-built checks: 4 passed.
- JavaScript syntax: 78 passed.
- Full frontend: 494 passed, 0 failed, 27 established skips.
- Staging build: 315 files.
- Local native Edge typecheck: unavailable because Deno is not installed; staging deployment compile is required.

## Remaining hosted acceptance

The first hosted email was received and its one-time credential exchanged successfully. A simultaneous stale Safari refresh failed and cleared that recovery session before any password update reached Supabase; replay of the consumed email correctly failed. Deploy the isolated-client repair, request one fresh recovery email, and have the user open it and choose the new password normally. Then verify Client B member access and isolation. No production change is part of this package.
