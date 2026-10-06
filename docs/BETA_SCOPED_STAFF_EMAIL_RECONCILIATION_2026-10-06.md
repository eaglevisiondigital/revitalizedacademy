# Scoped staff email reconciliation repair

Date: 2026-10-06  
Environment: dedicated ReVitalized Academy staging only  
Status: staging release verified; hosted action pending

## Problem

The preserved synthetic Coach record uses `dave+rva-beta-staff@eaglevision.biz`, an email form that the receiving server rejects. The approved real alias is `rva-staff@eaglevision.biz`. Creating another invitation would duplicate the Auth identity, contact, invitation and staff-access lifecycle that final beta acceptance is required to preserve.

## Repair

- Add **Pending staff email** and **Update Email & Reissue Setup** to the existing Staff & Access manager.
- Require active `staff.manage` authorization and an Owner actor.
- Limit the action to non-Owner targets that have not completed or waived staff onboarding.
- Apply the staging synthetic-recipient allowlist before any privileged change.
- Refuse Auth-user and contact email collisions.
- Preserve the existing Auth user ID, profile/contact ID, `staff_access` row and pending invitation row.
- Synchronize the Auth, linked contact and pending invitation email without changing role, status, assigned-only scope, permissions or NDA state.
- Attempt to restore the prior email association if linked public-record synchronization fails.
- Reissue one normal Auth setup confirmation to the corrected email and audit the reconciliation and resend separately.

## Verification

| Check | Result |
|---|---|
| JavaScript syntax | 78 passed |
| Focused browser contract | 2 passed |
| Staff-management Edge | 8 passed |
| Full Edge | 51 passed |
| Full frontend | 485 passed / 0 failed / 27 established skips |
| Staging build | 314 files |
| Duplicate Auth/contact/invitation creation | Absent |
| Role/status/scope/permission mutation | Absent |
| Owner-only enforcement | Passed |
| Completed-onboarding denial | Passed |
| Auth/contact collision denial | Passed |

## Staging release

- Source: `da6ad68ff0f5c5784dc8d6a42a9ec055b5f1336e`
- Netlify staging deploy: `6ac4c18b42169f9430d6bd2d`
- Live asset: `portal-staff-access.js?v=183`
- Exact build/live SHA-256: `13018d5887e72312ec836ed5394ca6678e08be6d5a7cbde8f1c72ca28e841d2d`
- Staging `staff-management` Edge Function: version 10, active
- Production deploy remains `6ac3eee5383ccf92be4d7a58`

## Hosted action boundary

The candidate does not change hosted data merely by being deployed. The existing owner must explicitly submit the corrected email and reason. That submission changes the existing staff account recipient and sends one external setup message, so hosted execution remains pending action-time authorization. The existing meal plan and fitness program also remain archived and unassigned pending authorization for their separate synthetic assignment check.

Production, payments, SMS/Twilio, feature flags, Supabase schema and migrations are unchanged.

`BETA NOT READY`
