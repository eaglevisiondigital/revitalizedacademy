# ReVitalized Academy - My Calendar vNext

Status: APPROVED first slice and implementation package. Feature disabled by default. Not deployed.

## Scope

My Calendar vNext exposes the next 30 days from `public.my_calendar_feed_60d` inside the existing member dashboard.

Displayed fields are intentionally limited to:
- item type
- title
- status
- date/time
- appointment/session location URL when present

The first slice does NOT expose the feed's embedded metadata payload.

## Filters

- All
- Coaching
- Workouts
- Meals
- Goals
- Challenges

Journey appointments and coaching sessions both map to the Coaching filter.

## Privacy boundary

The UI does not surface:
- meal adherence
- goal target values
- challenge points
- coach user IDs
- embedded metadata JSON
- health observations
- family health scores

## Feature flag

`feature_member_calendar_vnext`

Default false.

## Loading

- post-first-paint
- authenticated
- member-scoped security-invoker feed
- nonfatal
- sequence guarded
- maximum 100 items over the next 30 days

## Definition of done

- one unified member calendar
- no duplicate calendar backend
- filtering works client-side
- location link only shown when available
- metadata remains hidden
- default off
- staging acceptance before production enablement
