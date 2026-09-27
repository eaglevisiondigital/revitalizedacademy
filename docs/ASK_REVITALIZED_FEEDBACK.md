# ReVitalized Academy - Ask ReVitalized Member Feedback

Status: IMPLEMENTED on staging branch, not deployed.

## Objective

Connect the existing member feedback backend to answered/resolved Ask ReVitalized responses.

## Member actions

For an answered or resolved response:
- Helpful
- Needs Review

Needs Review collects:
- reason
- optional comment up to 2000 characters

Approved reasons are the existing backend contract:
- not_relevant
- unclear
- incorrect
- missing_context
- too_generic
- needs_coach
- other

## Backend

Feedback is saved through:
`public.submit_my_companion_feedback(...)`

Existing feedback is loaded from:
`public.my_companion_feedback`

The database already upserts one feedback record per request and negative feedback can enter the existing human-review loop.

## Safety

This feature does not change:
- answer generation
- question safety classification
- medical blocking/escalation
- confidence thresholds
- source approval
- coach-review authorization

It only lets the member evaluate an answer that already reached answered/resolved state.

## Definition of done

- feedback only appears for answered/resolved requests with a final answer
- existing feedback state is visible
- Helpful can be saved directly
- Needs Review supports reason/comment
- negative feedback uses existing human-review infrastructure
- no new autonomous health behavior is introduced
