# Vitality Roadmap | Existing Submissions to Coach Approval and Member Delivery
Prepared 2026-10-14. Applies to ReVitalized Academy production project `voalfpxiyznnqfcqcymd`. This is a guarded build specification and non-identifying production inventory, not a record of completed report delivery.

## Production inventory verified (aggregates only, no personal data exported)
- `public.workflow_records`: 15 completed vitality_assessment workflows; 19 in progress; exactly 3 completed Oct 14 in America/Chicago. Since Oct 14 00:00 UTC, 3 started-and-completed and 8 started-still-in-progress (11 started in that UTC window).
- `private.vitality_assessment_drafts`: 11 completed snapshots with saved source responses, 13 drafts with snapshots. Newer assessment data are **not** stored in public.workflow_answers. Do not attempt to score from empty public.workflow_answers.
- `private.vitality_historical_reviews`: 4 reconciled historical reviews, whose question coverage may differ from the new form.
- `public.vitality_reports`: 15 `awaiting_review` placeholders across 15 distinct contacts, no stored PDF asset, no approval timestamp and no sent timestamp. They must **not** be represented as generated Roadmaps.
- Existing staff UI: `/portal/` -> Vitality Roadmaps, accessible through `list_vitality_assessment_reviews(p_filter)` and `get_vitality_assessment_review(p_contact_id)` which delegate to security-definer private functions. Original answers and coach summary can already be reviewed by staff with appropriate scope. Existing RLS is enabled on workflow, answers, contacts, and vitality_reports.
- User report of ~12 people filling questionnaires on Oct 14 is unconfirmed as ~12 *completed*. Confirm via staff review workspace; do not publish or email incomplete records.

## Target workflow (adult-first)
1. Person completes free questionnaire, email/identity linked to one `contact_id` and `workflow_id`, with assessed-person identity preserved separately for any proxy family pathway.
2. Secure source-only intake loads the protected snapshot via existing authorized backend reviewer read, not by copying answers into public assets. Capture questionnaire version and completion/coverage.
3. Adult eligibility check. Unsupported child, proxy, historic/incomplete versions route to clarification/manual review, not auto-adult scoring.
4. Deterministic scoring adapter uses only founder-approved rules and version, with source trace for each of the 12 Driver scores and separate per-Driver Spectrum stages. Missing/unknown/ambiguity -> not scored / needs information. Per-Driver stage definitions **not yet approved**.
5. Controlled interpretation KB selects evidence-backed strengths, opportunities, priorities and starter actions. Preserve algorithm rationale and provenance. No invented symptoms/clinical diagnoses.
6. Private draft report view in existing secure staff back office. Justyn and Elle designated as first approval authorities after their actual staff user identities/roles are confirmed.
7. Reviewer can annotate answers, request clarification, correct source interpretation without silent raw overwrite, adjust recommendations, reorder priorities with an audit reason, and recalculate/regenerate draft from an approved configuration.
8. Approve *one immutable report version* for publication only if validation, privacy/safety flags and approved content pass. Both interactive HTML and PDF reference the same immutable version snapshot.
9. Grant free recipient read access via authenticated member/contact identity or secure claim flow. Unauthenticated visitors, other household members and staff without private-health scope get no report.
10. Send secure email "Your Vitality Roadmap is ready" with login/claim link; do not include private health findings or unencrypted PDF attachments until approved consent/privacy/delivery policy specifically authorizes them. If the user expressly wants emailed PDF attachment, evaluate secure/encrypted delivery separately.
11. Keep released version accessible in the free member dashboard without subscription/payment. Paid Holistic Foundations unlocks saved tracking/reflections/40-day coaching; never revoke the free original.
12. Retrying calculation, approval and notification is idempotent; no double-send, no draft leakage, no reassigning to wrong user.

## Founder review queue
Use `vitality_reports` as the existing report lifecycle anchor, not a second unsupported contact/report identity. During v1, link report to source `workflow_id` and optional `journey_id`, so the 15 existing `awaiting_review` placeholders can be taken through approval without duplicates. Review carefully before any backfill:
- 11 current completed secure snapshots -> adult eligibility, required-answer completeness and version assessment first.
- 4 historical reconciled records -> compare question provenance/coverage and flag gaps, never fill unknowns from defaults.
- 19 in-progress workflows -> hold; completion triggers initial assessment review and future creation of report placeholder only through idempotent existing pattern.
- Run private, aggregate-only readiness checks (counts of completed, adult-eligible, missing material, historical incompatible) before exposing draft generation to coaches.
- Neither direct production personal-data export nor batch report delivery has been authorized by founder scoring approvals.

## Proposed storage/permission contract (do NOT deploy blindly)
Reuse `public.vitality_reports` for lifecycle status, reviewer identity, `storage_path`, `approved_at` and `sent_at`. Add migration-managed:
- `private.vitality_roadmap_versions`: report reference, monotonic version, questionnaire version, approved scoring/KB config versions, non-public detailed normalized inputs, score trace, source refs, fully rendered approved content JSON, PDF file key, checksum, review/approval identity/timestamp, immutable-on-release protections.
- `private.vitality_roadmap_reviews`: report/version reference, reviewer UUID, action enum, source evidence reference, before/after patch, mandatory reason when overriding, timestamp; append-only.
- `private.vitality_roadmap_questions`: clarification request, contact-specific respondent authorization, protected answer handling, needs-review status and linked recomputations.
- `private.vitality_roadmap_kb_candidates`: staff suggestions with no auto-publication, conditional provenance/consent and approved edit workflow.
- Authenticated RPC/edge functions, SECURITY DEFINER narrow search_path, actor checks, mandatory permission + contact scope for staff and verified `auth.uid`-to-recipient for free clients. Default deny direct table access; no client-supplied user IDs accepted to authorize reads.
- Version-consistent HTML/PDF; signed URLs short-lived and recipient-scoped; no public storage buckets.

## Release gates and test plan
- Gate A: Current field mapping, accurate adult-vs-child routing; 11 secured + 4 historical records enumerated without PII.
- Gate B: Founder approves all rules and per-Driver stages; 10-20 de-identified expected-output cases; missing/duplication and symptom/color caps covered.
- Gate C: Coach review and override actor tests; Justyn/Elle authentic staff role acceptance; cross-contact and family read denial.
- Gate D: Client identity/account claim, free access after release and subscription lapse, PDF parity, inaccessible drafts and expired tokens.
- Gate E: Email link reliability, no sensitive information in notifications, audit trail and idempotent retry.
- Gate F: 15 existing records triaged, individually reviewed and released only when validated. No bulk-approve.

## Practical delivery packages
1. **Now (safe)**: show an explicit "Roadmap preparation pending" notice on existing secure staff assessment reviews; no publish buttons and no changes to data.
2. **Next**: schema and authorization contract reviewed on isolated staging, automated auth/RLS tests using fictional records, then production migration after gate signoff.
3. **After founder scoring approval**: genuine adult report draft renderer and staff editor with changed/recalculated trace and owner review; synthetic examples first.
4. **After acceptance**: secure free member Roadmap workspace + export; email release, handling of 15 legacy/new records one at a time.

## Do not confuse
- A "completed" questionnaire with an approved and publishable report.
- An `awaiting_review` placeholder with a generated HTML/PDF report.
- Twelve reported submissions with twelve confirmed completed/validated adult assessments.
- Fictional `roadmap-experience-preview.html` scores/medical content with validated real-scoring output.
- Coaching 40-day milestones with repeat Vitality assessments (generally one-time).
