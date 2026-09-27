# ReVitalized Academy — Home / Today vNext integration

Status: APPROVED ARCHITECTURE, not yet implemented or deployed.

Primary strategy authority: ReVitalized Academy orchestration Chat.

Current engineering base:
- Repository: eaglevisiondigital/revitalizedacademy
- Branch: codex/staging
- Commit baseline: 5467e0d4089633b8a2a39d2967322e7f481f5952
- Current paid-member frontend contract remains my_app_bootstrap_v2.

## Objective

Improve the member Home / Today experience using already-built backend capabilities without replacing the current v2 bootstrap, introducing a new member app, activating unapproved score formulas, or depending on AI generation/native wearable delivery.

The first integration slice should be bounded, reversible, and low-risk.

## Current verified frontend shape

The paid dashboard already contains:
- Needs Your Attention
- Daily Action Center
- Everything Moving With You
- Program Hub
- Membership Overview
- Weekly Momentum
- Progress Timeline
- Journey
- Next Appointment
- Coaching Hub

member/member110.js currently:
- loads my_app_bootstrap_v2
- performs many additional direct reads
- renders a local renderAttentionCenter() from agreements, billing, assignments, conversations, Family Hub requests, and notifications
- renders the existing Today checklist from bootstrap daily_actions
- renders the existing Weekly Momentum block from bootstrap weekly_summary

Do not add competing duplicate cards.

## Approved first integration slice

### 1. Evolve, do not duplicate, "Needs Your Attention"

Use public.my_next_best_actions as the backend-driven action source for paid-member actions such as:
- overdue assignment
- upcoming coaching appointment
- today's workout
- today's meal
- today's habit
- goal follow-up
- course continuation
- Ask ReVitalized response follow-up

Preserve important current local attention items not yet represented by my_next_best_actions:
- unsigned/unwaived agreements
- billing past due / payment failure
- unread coaching messages
- pending Family Hub requests
- unread notifications

Merge these into one ranked UI list.

Do not show two separate priority/action cards.

Priority rule:
1. legal/payment blockers
2. overdue coaching work
3. time-sensitive appointments
4. today's assigned actions
5. goal follow-up
6. learning continuation
7. informational unread/follow-up items

The UI may keep the current card title or evolve it to "Your Priorities" after visual review.

### 2. Keep Daily Action Center

Do not replace the existing daily_actions contract immediately.

Preserve:
- habits
- meals
- workouts
- challenge/course focus
- completion buttons
- current member write flows

Any future change to the retry-safe mobile RPCs must be separately tested before replacing current browser RPC calls.

### 3. Add "Up Next" without duplicating appointment cards

Use public.my_up_next for the next small set of upcoming items across:
- coaching sessions
- journey appointments
- workouts
- meals
- goal due dates
- challenge end dates

Do not create a large calendar on Home.

Home should show a compact "Up Next" strip/list, normally 3-5 items.

The detailed calendar remains a separate future/member screen.

The existing "Your Next Appointment" card can remain until staging confirms whether the unified Up Next presentation makes it redundant. Do not remove it in the first slice.

### 4. Upgrade Weekly Momentum progressively

Keep bootstrap weekly_summary as fallback.

Where available, public.my_weekly_progress_story can enhance the existing Weekly Momentum block with:
- plan completion for current 7 days
- prior-week comparison
- habit check-ins
- workouts completed
- meals completed
- progress entries
- goals completed
- achievements unlocked
- upcoming 7 days
- coaching momentum
- deterministic descriptive summary text

Do not surface:
- unapproved Health Score formulas
- Family Health Score
- medical interpretation
- AI-generated coaching conclusions

Progress-insight text may only be used if it remains deterministic/descriptive and non-medical.

### 5. Home Priority Summary

public.my_home_priority_summary may power counts/chips for the merged priority card.

Do not expose internal priority_rank numbers to the member.

## Feature flag / rollout

This slice must be independently reversible.

Use the established runtime/feature configuration pattern.

Recommended feature key:
member_home_vnext

Default:
false until hosted staging acceptance passes.

When false:
- existing v2 Home behavior remains unchanged.

When true:
- additive Home vNext reads/rendering activate.

Do not tie this flag to unrelated mobile, AI, Family Hub, or health-integration flags.

## Data-loading strategy

Do not replace my_app_bootstrap_v2 with my_app_bootstrap_v27.

For the first slice, add only the minimum extra reads required for Home vNext:
- my_next_best_actions
- my_home_priority_summary
- my_up_next
- my_weekly_progress_story

These should be loaded after the existing paid-access preflight.

Failure of an additive vNext read must degrade gracefully to the existing v2 UI rather than fail the entire dashboard.

Do not add these reads to the current global fatal-error gate.

This is important because the current dashboard already performs many initial reads and treats initial errors broadly.

## Authorization

All new reads must use the authenticated browser client and RLS/security-invoker views.

No service-role key in browser code.

Paid-access preflight remains required.

Restricted onboarding/payment_suspended identities must not load the paid Home vNext data.

Adult health privacy, household privacy, and contact scope remain unchanged.

## Performance acceptance

Before production activation, staging should record:
- total initial request count
- payload size for each new view
- p50/p95 latency where practical
- full Home interactive/load timing on desktop and 390x844 mobile

The vNext slice must not make dashboard failure more likely.

Future optimization may consolidate reads after equivalent data/authorization behavior is proven.

## UX acceptance

Home should answer four questions quickly:

1. What needs my attention?
2. What should I do today?
3. What is coming next?
4. How did my week go?

Avoid duplicate modules that answer the same question.

Premium ReVitalized visual language must remain consistent with the existing dashboard and approved mockups.

## Explicitly out of scope for this slice

- switching wholesale to my_app_bootstrap_v27
- Health Score methodology
- Family Health Score methodology
- AI generation
- autonomous medical/wellness advice
- Apple Health native code
- Android Health Connect native code
- APNs/FCM provider delivery
- GoodBarber integration
- assessment scoring
- Family Hub detailed health sharing
- removing the current v2 fallback
- production deployment before staging acceptance

## Implementation sequence after staging lifecycle gate

1. Add member_home_vnext runtime flag.
2. Add nonfatal additive reads for the four approved views.
3. Merge my_next_best_actions into existing renderAttentionCenter instead of adding a new competing card.
4. Add compact Up Next markup/rendering.
5. Enhance Weekly Momentum with my_weekly_progress_story while preserving weekly_summary fallback.
6. Add responsive styles.
7. Add frontend tests for empty/null/error states.
8. Add authorization/regression tests.
9. Run full existing suite.
10. Work validates the feature in isolated staging with the flag enabled.
11. Production activation requires separate release approval.

## Definition of done

Home / Today vNext is complete when:
- existing v2 dashboard remains a valid fallback
- no duplicate priority cards exist
- priorities are backend-driven but preserve legal/billing/message attention
- Today remains functional
- Up Next is visible and compact
- Weekly Momentum is richer without unapproved scoring
- additive failures degrade safely
- paid-access/RLS boundaries remain intact
- desktop/mobile acceptance passes
- feature can be disabled without reverting schema or unrelated features
