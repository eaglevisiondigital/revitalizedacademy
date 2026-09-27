# ReVitalized Academy — Progress vNext integration

Status: APPROVED ARCHITECTURE, not yet enabled or deployed.

Primary strategy authority: ReVitalized Academy orchestration Chat.

Current engineering base:
- Repository: eaglevisiondigital/revitalizedacademy
- Branch: codex/staging
- Current member contract remains my_app_bootstrap_v2.
- Home / Today vNext is feature-flagged and progressive; Progress vNext must follow the same additive pattern.

## Objective

Upgrade the existing Progress experience using already-built, member-scoped backend views without changing approved scoring policy, exposing another adult's health data, or replacing current v2 behavior.

The first Progress vNext slice should answer:

1. What am I working toward?
2. Am I moving toward my goals?
3. What wins have I unlocked?
4. What changed in the data I chose to track?

## Current frontend

The paid member dashboard already has:
- progress snapshot counts
- goals
- habits
- manual progress entry
- recent progress entries
- weekly check-in
- progress timeline

Do not remove or duplicate these controls in the first slice.

## Approved first Progress vNext slice

### 1. Goal Progress

Use public.my_goal_progress.

Enhance active goal cards with:
- current value when available
- target value/unit
- target date
- deterministic completion percentage when the view can calculate it
- progress state:
  - in_progress
  - awaiting_data
  - past_due
  - completed

Do not create a second goal system.

If completion_percent is null, show a descriptive state rather than inventing progress.

Do not infer medical meaning from the metric.

### 2. Achievements

Use public.my_achievements.

Add a compact member achievement/wins presentation showing:
- title
- description
- category/icon key
- unlocked_at

Keep it celebratory but factual.

Do not generate unsupported claims such as health improvement, disease reversal, or guaranteed outcomes from an achievement unlock.

### 3. Descriptive Progress Trends

Use public.my_progress_insights.

Allowed presentation:
- metric label
- current value
- unit
- absolute 30-day comparison
- deterministic direction (up/down/stable/insufficient data)
- existing deterministic insight_text

The text must remain descriptive, not diagnostic or prescriptive.

Do not relabel an increase/decrease as "better", "worse", "healthy", "unhealthy", "good", or "bad" unless an approved program rule exists for that exact metric.

Examples:
- Allowed: "Weight is down 3 lb across the available 30-day comparison."
- Not automatically allowed: "Your health is improving."

### 4. Existing Progress Snapshot remains

Keep public/my_app_bootstrap_v2 progress_snapshot as the existing summary/fallback.

Do not switch the dashboard wholesale to a later bootstrap.

### 5. Progress photos are NOT in the first slice

The backend has:
- my_progress_photo_sets
- my_progress_photos
- private progress-photos Storage

Do not expose raw storage_path values.

A later Progress Photo sub-phase must implement:
- private signed URL retrieval or equivalent controlled delivery
- expiration
- member ownership verification
- scoped staff access
- upload validation
- deletion/retention behavior
- mobile photo UX

No progress-photo UI is authorized merely from the existence of the views.

## Feature flag

Use the established runtime configuration pattern.

Recommended key:
feature_member_progress_vnext

Default:
false

The feature must be independently reversible and must not depend on Home vNext being enabled.

## Loading behavior

Progress vNext is nonfatal and post-first-paint.

Add only:
- my_goal_progress
- my_achievements
- my_progress_insights

These reads should join the deferred member-data layer or a Progress-specific deferred loader.

Failure of any one Progress vNext view must:
- log/degrade locally
- preserve existing v2 Progress Snapshot, goals, habits, progress entry and check-in UI
- never deny the entire dashboard

## Authorization

Use the authenticated browser client and RLS/security-invoker views.

No service-role browser use.

Paid-access preflight remains required.

Adult health privacy remains unchanged.

Do not use household membership to expose another adult's detailed health/progress data.

## UX structure

Prefer enhancement of existing sections rather than extra repeated cards.

Recommended:
- enrich the current Goals cards with my_goal_progress
- add one compact "Achievements / Wins" strip or card
- add one "Recent Trends" section near Progress
- preserve manual Progress entry and weekly check-in controls

Avoid turning the page into a wall of metrics.

## Explicit exclusions

This first Progress vNext slice does NOT include:
- Health Score
- Family Health Score
- approved scoring methodology changes
- diagnosis
- treatment advice
- AI-generated health interpretation
- progress-photo display/upload
- cross-adult health sharing
- native HealthKit / Health Connect work
- GoodBarber
- assessment scoring

## Staging acceptance

Before production activation test:
- active goal with data
- active goal awaiting data
- past-due goal
- completed goal
- no-goal state
- achievements none / one / several
- insight up / down / stable / insufficient data
- failure of each optional view individually
- direct API access as unrelated member denied
- onboarding/payment_suspended paid-access denial
- desktop and 390x844 mobile
- no raw private Storage paths displayed

## Definition of done

Progress vNext first slice is complete when:
- existing progress UI remains available as fallback
- goal cards can show approved deterministic progress state
- achievements are visible
- descriptive trends are visible without medical interpretation
- no score formula is introduced
- no raw private photo paths are exposed
- all new reads are nonfatal
- RLS boundaries remain intact
- feature flag defaults off
- staging acceptance passes before production enablement
