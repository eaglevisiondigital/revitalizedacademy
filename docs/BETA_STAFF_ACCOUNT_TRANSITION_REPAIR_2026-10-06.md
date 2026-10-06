# Beta staff account-transition restart repair

Date: 2026-10-06  
Environment: dedicated ReVitalized Academy staging only  
Status: implementation verified locally; staging release pending

## Observed failure

During the required Owner → Client B hosted transition, Client B authenticated successfully and the member dashboard loaded. An already-open owner portal cleared its private DOM and displayed **Refreshing secure staff access…**, but remained on that temporary document. The transition used `window.location.replace(window.location.pathname)`, which requested the exact current portal URL and could be coalesced rather than loading a fresh document.

This was a portal document-restart defect. The member session remained valid: hosted inspection showed Disposable Beta Client B, active Holistic Foundations through April 6, 2027, 50% journey progress, neutral measured-health states, zero meals, zero workouts, and no Client A-only assignment data.

## Repair

- Preserve the existing immediate private-DOM destruction and request-epoch invalidation.
- Build a unique same-origin portal URL with a non-sensitive `staff_session` timestamp.
- Replace the temporary document with a clear account-change message and a **Continue securely** link before automatic navigation.
- Navigate to the unique URL so the browser must initialize a new portal document.
- Do not call `auth.signOut()` during an identity transition.
- Preserve explicit portal Sign Out and its single global Supabase sign-out.
- Advance the portal core cache reference from v188 to v189.

The query marker contains no user, contact, session or credential data and grants no access.

## Validation

| Check | Result |
|---|---|
| Focused beta core runtime | 23 passed / 0 failed |
| Cross-account private-DOM clearing | Passed |
| New identity sign-out count during transition | 0 |
| Explicit portal Sign Out count | 1 |
| Delayed staff response isolation | Passed |
| Permission-refresh fail-closed behavior | Passed |
| JavaScript syntax | 78 passed |
| Full frontend | 483 passed / 0 failed / 27 established skips |
| Staging build | 314 files |
| Built portal JS hash | `4d07c97f595c5a594fa4ff9fc492f5db58b057451d1e200c3c307f5c3af118f5` |

## Hosted-data and environment safety

The repair changes only staff portal frontend code, cache version, tests and documentation. It does not change Supabase schema, migrations, Edge Functions, permissions, roles, feature flags, payment/provider settings or production. No hosted data mutation is required to validate the repair.

## Remaining acceptance

Deploy v189 to the dedicated staging site, verify exact live hash, then switch between the preserved Client B member session and portal. The portal must reach a stable non-staff access state without logging Client B out. Continue the remaining scoped-staff, assignment, recovery, revocation and full cross-account gates only after this check passes.

`BETA NOT READY`
