# ReVitalized Academy — Coaching Hub vNext integration

Status: APPROVED ARCHITECTURE and implementation package, feature disabled by default; not deployed.

## Objective

Enrich the existing member Coaching Hub with already-built deterministic coaching momentum context without creating a second coaching dashboard or changing the current v2 member contract.

## Approved first slice

Use public.my_coaching_momentum to add a compact momentum section inside the existing Coaching Hub.

Allowed fields:
- momentum_state
- plan_completion_7d
- planned_days_7d
- full_days_7d
- last_checkin_at
- last_progress_at
- active_goals
- overdue_goals

The existing Coaching Hub remains authoritative for:
- assigned coach
- open assignments
- due next 7 days
- overdue assignments
- unread coaching messages
- coaching request actions

Do not duplicate those elements.

## Language

Momentum labels are deterministic operational states, not medical or psychological judgments.

Allowed examples:
- Steady
- Strong Momentum
- Check-In Due
- Progress Due
- Goal Follow-Up
- Needs Attention

Do not infer diagnosis, motivation, compliance, character, or health outcome from the state.

## Feature flag

Runtime key:
feature_member_coaching_vnext

Default:
false

Independent from Home vNext and Progress vNext.

## Loading

The flag lookup and my_coaching_momentum read occur after the core dashboard is visible.

The read is nonfatal and sequence guarded.

If unavailable:
- existing Coaching Hub remains usable
- momentum section degrades locally
- the dashboard must not fail

## Privacy / authorization

Use authenticated RLS/security-invoker access only.

Do not surface raw health observations.

The last_progress_at field is a freshness timestamp only.

No cross-adult household health data is included.

## Explicit exclusions

- coach scoring
- health scoring
- AI-generated coaching conclusions
- medical interpretation
- family health sharing
- native wearable activation
- push-provider activation
- changing coaching entitlement limits
- changing assigned coach logic

## Staging acceptance

Test:
- no momentum history
- steady
- strong_momentum
- checkin_due
- progress_due
- goal_follow_up
- needs_attention
- optional-view failure
- unrelated-member denial
- onboarding/payment_suspended paid-access denial
- desktop and 390x844 mobile
- feature toggle off removes momentum section on refresh

## Definition of done

The first slice is complete when:
- existing Coaching Hub remains intact
- momentum data enriches the same card
- feature defaults off
- load is post-first-paint and nonfatal
- no raw health values are exposed
- RLS remains intact
- staging acceptance passes before production enablement
