# ReVitalized Academy - Family Hub vNext

Status: APPROVED ARCHITECTURE and implementation package. Feature disabled by default. Not deployed.

## First slice

Family Hub vNext adds one compact 14-day shared schedule inside the existing Family Hub using only `public.my_family_calendar_summary`.

Displayed categories:
- coaching sessions
- workouts
- meals
- goals due
- challenges ending

The current household summary, household members, and family request workflow remain unchanged.

## Privacy boundary

This slice explicitly does NOT query:
- `my_family_progress_dashboard`
- `my_family_dashboard_summary_v2`
- `my_family_wellness_summary`
- any family/member health score
- any raw health observation
- another adult's detailed health data

Those views are excluded because current product policy does not approve a Family Health Score methodology or automatic adult-to-adult health sharing.

## Feature flag

`feature_member_family_vnext`

Default: false.

The flag is independent of Home, Progress, and Coaching vNext.

The enhancement only loads when the member currently has the Family Hub entitlement.

## Loading and failure behavior

- post-first-paint
- authenticated browser client
- RLS/security-invoker view
- sequence guarded
- nonfatal
- optional-view failure leaves the existing Family Hub usable

## Definition of done

- no duplicate Family Hub
- compact next-14-day schedule appears when enabled
- feature is entitlement-gated
- no health score or cross-adult health details are exposed
- default remains off
- staging acceptance is required before production enablement
