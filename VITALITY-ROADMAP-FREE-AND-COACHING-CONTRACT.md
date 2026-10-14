# Vitality Roadmap: Free Foundation + Coach-Enhanced Experience

Status: Updated to reflect Justyn's October 14 founder answers. Supersedes preliminary free tracking and 7/30/90 assumptions. Specification only; no assertion these features are in production.

## October 14 founder clarification

- **Free**: full approved report, all 12 Drivers, overall + independently defined individual stages once validated, explanations, priorities/strengths/opportunities, static starter advice, secure account access and PDF.
- **Holistic Foundations**: persistent checklists, reflections, habit tracking and coach plans. Fictional demo interactions do not promise that these are free.
- **Consultation**: separately paid $250 Roadmap review/explanation; eligible affiliates may offer $50 off. Checkout/calendar are not enabled until verified.
- **Cadence**: one-time Roadmap by default, coached 40-day milestone cycles within repeat 40-day, six-month or twelve-month programs.
- **Review and learning**: Justyn and Elle initially approve; reviewers can correct/request clarification/regenerate/override with reasons and propose versioned knowledge-base improvements.
- **Pending**: detailed Driver rubrics, score settings, each Driver's Spectrum-stage mapping, questionnaire additions, child scoring and independent expected cases.
- **Answers**: read-only historical answer review is desirable if feasible and secure, not guaranteed.

## Product promise

Every eligible person who completes the **free Vitality Roadmap questionnaire** receives a meaningful, personal **free Vitality Roadmap** after the required quality and coach/senior approval steps. A coaching purchase, payment card, trial conversion, or sales call is **not required** to receive or continue accessing that free result.

The approved free Roadmap remains in the person's secure ReVitalized Academy account for return visits, with a PDF download/export they can keep. Returning later must not require purchasing or restarting the questionnaire. Support durable account recovery and a documented access/retention policy; do not promise unlimited medical-data storage without defining that policy.

**Coaching enhances the same Roadmap. It must never replace it or revoke the free baseline.** Preserve free entitlements when a paid membership begins, pauses, ends or is canceled. No duplicate client identities, assessments or report records just because a plan changed.

Avoid confusing a public **fictional interactive sample** with an individual's approved report. Pre-approval calculations are private and cannot be viewed as finalized results.

## Entitlement matrix

| Capability | Free completed Roadmap | Coaching package |
| --- | --- | --- |
| Permanent account entry and re-open previously released report | Included | Included |
| Secure approved personal overview, supported overall score/stage, uncertainties | Included | Included |
| All 12 Driver sections, approved explanations and strengths | Included | Included |
| Three verified priorities, opportunities and starter actions | Included | Included |
| Interactive navigation, radar/compass, filters and readable accessibility alternatives | Included | Included |
| Downloadable/printable approved PDF snapshot | Included | Included |
| Static starter actions and educational guidance | Included; no saved progress | Included |\n| Saved checklist, completion tracking and personal reflections | Not included in free Roadmap | Holistic Foundations only |
| Original questionnaire response corrections/clarifications before approval | Supported through controlled review workflow | Supported |
| Personalized coach-designed action plan and revisions | Not included unless explicitly granted | Included |
| Coach notes, feedback, accountability, scheduled check-ins and messaging | Not included by default | Included subject to plan |
| Reassessment and historical report comparisons | Typically a one-time Roadmap; exceptions require policy | Guided plan progression; exceptional reassessment only if authorized |
| Advanced trackers, connected health/progress modules and coaching features | Not included by default | Included according to package |

No misleading locks or empty sections: clearly distinguish **included for free**, **included with coaching**, **coming later**. Do not show premium features as delivered until operational and enabled.

## Free client journey

1. Visitor clicks **Free Vitality Roadmap**, sees accurate explanation of what the questionnaire and results include, plus an optional fictional sample preview.
2. Visitor completes the assessment with proper informed consent, proxy/guardian permissions when supported, save-and-resume and reliable confirmation. No card information is requested for the free Roadmap.
3. Assessment is stored under one stable person/account identity. If the user already has a member account, link the record to it; avoid creating duplicates or crossing family-member boundaries.
4. Score service validates supported adult questionnaire version, required answers, applicability, symptom ownership, coverage, raw-to-normalized mappings, and the approved score version. Unknown/missing data is never silently converted to a favorable or unfavorable score.
5. Create **preliminary**, **needs information** or **needs coach review** status, NOT a public report. Show the applicant a friendly status page and send accurate confirmation. Avoid duplicate emails on retries.
6. Coach and designated senior reviewer resolve needed clarifications, approve score interpretation and recommendation wording, then release one immutable version.
7. Send a minimal-content notification that a Roadmap is available. Use an expiring, one-time account-claim or login link as appropriate; **do not email health scores or sensitive findings**.
8. After authentication, the person accesses the released interactive Roadmap and downloadable PDF at no charge. Show release/review date and clear provenance of the figures.
9. Member may revisit the same approved free Roadmap and static starting recommendations over time. Saved tracking and reflections belong to Holistic Foundations; those actions do not change an approved score.
10. Optional, non-blocking CTA for a personalized $250 coach consultation, with authorized $50 affiliate reduction where eligible. Do not provide working checkout/booking until payment and calendar are ready. Never interrupt free access with a payment gate.

## Coach/membership journey

- Upgrade the existing person's permissions/features, not their identity and not the free report contents.
- Coaching workspace reads the same reviewed Roadmap snapshot, original evidence and approved recommendations under tenant/role-scoped access.
- Coaches can create linked plans, check-ins and follow-up interpretations, with structured provenance and permissions, without overwriting historical report versions.
- If a re-assessment occurs, compare only approved results based on compatible versions. If scoring criteria change, label the comparison limitations clearly or prohibit comparisons until reviewed.
- When membership ends, premium editing, messaging and coaching services may stop, but the **free original Roadmap, included free tools and exported PDF remain accessible** under the retention policy.

## Publication and safety rules

- **Never auto-release unapproved outputs** in initial launch. Human review and senior signoff are required, even for a free report, until the founders explicitly approve a validated broader automation plan.
- The supplied October 12 adult calculator uses normalized data. Complete raw answer mappings, Driver rubrics, selected Green restrictions, child/proxy scoring, and content review are not finished; do not represent demo scores as validated.
- Maintain 11-health-Driver scoring and Wise Budgeting's separate treatment per the current approved handoff, not an independent invented average.
- Child/teen or other unfinished pathways must have explicit handled/awaiting-review status rather than being scored through the adult algorithm without approval.
- Protected data: authentication, role boundaries, RLS/server authorization, access logs, audit trail, encryption/retention/deletion policy, and safe notification contents. Do not store personal health notes in unprotected browser localStorage. Public previews are fictional, noindex, and contain no real payloads.
- Derive interactive and PDF outputs from a single **approved, versioned report artifact** with scoring/configuration IDs and release history.
- Recommendation copy is coaching education, not diagnosis, and must not make unsubstantiated health claims.

## Durable data model (logical contract, not a migration proposal)

- `assessment_submissions`: identity, assessed_person, respondent/consent, questionnaire version, submission/clarification history.
- `roadmap_calculations`: input fingerprint, scoring version, normalized values, coverage/errors, source evidence and deterministic trace.
- `roadmap_reports`: report owner, statuses, draft/current approved version, release timestamp, entitlement baseline.
- `roadmap_report_versions`: immutable report display data with coach-reviewed interpretation/provenance; matching PDF artifact reference.
- `roadmap_reviews`: coach/senior decisions, explanations, requests/corrections, audit actor and timestamps.
- `roadmap_actions`: separately scoped personal starter actions/checkmarks, independent of score version.
- `coaching_roadmap_extensions`: package-scoped plans, feedback, assignments/check-ins and history, authorized only to coaches and appropriate members.

Before any schema work, inventory existing Supabase entities and reusable portal modules and prefer extension over duplicate tables.

## Acceptance checks

- Anonymous visitor cannot access anyone's report or private content.
- Anyone completing an eligible free assessment can receive the eventual reviewed report **without payment** and can download it.
- A subsequent plan upgrade and later cancellation do not revoke the free original report.
- Two persons on one family account cannot view each other's private reports without authorized access.
- User can recover account access and retrieve previously approved report, not rely solely on an expiring emailed URL.
- Unapproved, incomplete, overridden-without-reason, or ineligible results cannot be publicly released.
- Interactive report and PDF show identical approved calculations, priorities and report version.
- Duplicate form submissions, retries, notifications and deliveries are idempotent.
- Basic action progress never recalculates health scores; pending/unsupported data is labeled as such.
- Full mobile, desktop, keyboard, screen reader and print acceptance; avoid misleading medical diagnosis framing.

## Implementation sequence

**A. Now:** finalize approved premium branded visual direction on static fictional preview; identify and reuse existing auth, assessment and portal infrastructure; review missing live marketing/sample popup placement.

**B. Controlled foundation:** versioned report schemas and permissions, draft/coach-review/senior-approval/released statuses, verified report access, PDF snapshots, no payment requirement for free entitlement.

**C. Validated scoring:** map actual questionnaire IDs to approved rules; run independent complete-case calibration with the founders; finish Hydration and other Driver definitions and flags.

**D. Launch:** invite free recipients to persistent account access, provide secure free report and PDF, monitor duplicate/failure metrics, verify secure PDF delivery.

**E. Coaching extension:** add saved Holistic Foundations habit tracking/reflections, coach assignments and 40-day milestones across repeated 40-day programs and six- or twelve-month coaching. Preserve free-report promise.

Unresolved for founder signoff: child/teen launch routing and age-18 boundary, report retention and account deletion behavior, delivery turnaround, notification copy, consultation/affiliate terms, per-Driver stages, scoring and auto-publication gates.
