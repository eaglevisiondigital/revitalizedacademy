# Beta staff account-transition restart repair

Date: 2026-10-06  
Environment: dedicated ReVitalized Academy staging only  
Status: final stale-auth-runtime repair verified locally; staging v190 release pending

## Observed failure

During the required Owner → Client B hosted transition, Client B authenticated successfully and the member dashboard loaded. An already-open owner portal cleared its private DOM and displayed **Refreshing secure staff access…**, but remained on that temporary document. The transition used `window.location.replace(window.location.pathname)`, which requested the exact current portal URL and could be coalesced rather than loading a fresh document.

This was a portal document-restart defect. The member session remained valid: hosted inspection showed Disposable Beta Client B, active Holistic Foundations through April 6, 2027, 50% journey progress, neutral measured-health states, zero meals, zero workouts, and no Client A-only assignment data.

The first v189 hosted repair forced the portal onto a unique URL and correctly reached the stable **Staff access is pending** screen. A subsequent member reload then exposed the second half of the race: a stranded old portal document could retain its Supabase auto-refresh timer and auth-state subscription after its private DOM was destroyed. Server inspection proved Client B had no staff row and still had two valid Auth session records, so this was browser credential removal by the retired client rather than server revocation or an authorization denial.

## Repair

- Preserve the existing immediate private-DOM destruction and request-epoch invalidation.
- Build a unique same-origin portal URL with a non-sensitive `staff_session` timestamp.
- Replace the temporary document with a clear account-change message and a **Continue securely** link before automatic navigation.
- Navigate to the unique URL so the browser must initialize a new portal document.
- Stop the retiring Supabase client's auto-refresh loop and unsubscribe its auth-state listener before destroying the old document.
- Do not call `auth.signOut()` during an identity transition.
- Preserve explicit portal Sign Out and its single global Supabase sign-out.
- Advance the portal core cache reference from v188 through v189 to final v190.

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
| Final v190 built portal JS hash | `4549616cddaa440b89428c1618e55ee79bf011096e8073b81c0fd7ad33803261` |
| Retired auth listener count | 1 |
| Retired auto-refresh stop count | 1 |
| Intermediate source SHA | `aeec4e053baa4e33ea783046da44defcb7fe6885` |
| Intermediate Netlify deploy | `6ac4b468875ac7a4504cb4fd` — ready; v189 navigation passed, credential persistence failed |
| Production | `6ac3eee5383ccf92be4d7a58` — unchanged |

## Hosted-data and environment safety

The repair changes only staff portal frontend code, cache version, tests and documentation. It does not change Supabase schema, migrations, Edge Functions, permissions, roles, feature flags, payment/provider settings or production. No hosted data mutation is required to validate the repair.

## Remaining acceptance

Deploy v190, sign Client B in once through the normal member flow, reload the portal and then reload the member page. The portal must reach a stable non-staff access state and the member dashboard must survive its reload. Continue the remaining scoped-staff, assignment, recovery, revocation and full cross-account gates only after this check passes.

`BETA NOT READY`
