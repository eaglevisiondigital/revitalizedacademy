# Beta staff account-transition restart repair

Date: 2026-10-06  
Environment: dedicated ReVitalized Academy staging only  
Status: v190 deployed and hosted Client B refresh persistence accepted

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
| Final source SHA | `648f0a619544f6372fc85f175aa9478c39b0c96e` |
| Final Netlify deploy | `6ac4b5d58967a57b74321138` — ready |
| Live portal asset | `portal.js?v=190` — exact built hash matched |
| Client B explicit logout and normal re-login | Passed; dashboard identified **Disposable Beta Client B** |
| Client B visible-browser refresh persistence | Passed; dashboard remained open |
| Fresh server Auth login evidence | `2026-10-06 09:22:29.94778+00`; one current session |
| Production | `6ac3eee5383ccf92be4d7a58` — unchanged |

## Hosted-data and environment safety

The repair changes only staff portal frontend code, cache version, tests and documentation. It does not change Supabase schema, migrations, Edge Functions, permissions, roles, feature flags, payment/provider settings or production. No hosted data mutation is required to validate the repair.

## Remaining acceptance

The v190 release and Client B logout/re-login/refresh persistence gate pass. Continue the remaining Client A assignment visibility versus Client B denial, scoped-staff lifecycle and contact/private-health boundaries, Client B and staff recovery, staff revocation, supported Client B deactivation, and remaining cross-account transitions. Do not reopen this portal-transition repair unless new evidence reproduces a defect.

`BETA NOT READY`
