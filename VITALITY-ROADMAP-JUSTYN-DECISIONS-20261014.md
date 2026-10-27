# REViTALIZED ACADEMY | VITALITY ROADMAP FOUNDER RESPONSE MAPPING
Date: October 14, 2026
Source: Justyn Oliver's direct written reply forwarded by the project owner. Supersedes conflicting assumptions in earlier concept/design documents. Product decisions and founder intentions below do **not** imply implementation is complete.
Status keywords: CONFIRMED = founder intent, PENDING = unanswered/needs founder review, PROPOSAL = engineering recommendation, FUTURE = desired subsequent phase.

## Product north star and quality bar
**CONFIRMED:** The free Roadmap should help recipients feel they received unusually substantial, individual educational value. It should explain their present self-reported health/lifestyle patterns, strengths, priorities, likely connections and realistic first actions in a way more valuable than a typical introductory health consultation. This is a product-experience ambition, **not** a guarantee of diagnosis, comparative professional effectiveness, clinical accuracy, or outcome.

**CONFIRMED:** Every eligible adult completing the free questionnaire gets an expert-reviewed interactive Roadmap on a secure site, plus an optional downloadable PDF, without paying for coaching. Keep it available in their account under a documented access/retention policy; don't demand re-assessment or purchase to revisit it.

**CONFIRMED:** Build a curated and versioned interpretation/recommendation knowledge base that becomes more useful as submissions and human reviews accumulate. Coach can propose corrections and new content during report review, with provenance, approval and future rule applicability. Do **not** let raw submissions or one review automatically retrain or silently modify rules used for other people.

## Explicit founder decisions routed to product/engineering areas

| ID | Founder decision | Area / implementation destination | Status |
|---|---|---|---|
| J01 | All scoring rules incomplete; engineering must supply detailed questions/checklists; founder wants consolidated calculation/threshold view | scoring approval workbook, question/rule registry, coach validation | CONFIRMED process, formulas PENDING |
| J02 | Overall Spectrum stage AND separate stage for each Driver | report UI, report/PDF schema, scoring engine | CONFIRMED feature, per-Driver stage thresholds PENDING |
| J03 | May need additional precise questionnaire fields to collect evidence actually required for algorithm | assessment field inventory, conditional question specs, versioned release | CONFIRMED intent, exact fields PENDING |
| J04 | Algorithm suggests top 3 priorities, strengths, and opportunities with evidence/explanation on coach side; reviewers may override each | recommendation ranker and explainability drawer, review UI and audit | CONFIRMED workflow, tie/selection formulas PENDING |
| J05 | Knowledge base should gain explanations and approved actions per Driver during review, similar to AI Advisor content workflow | revision/proposal queue, editorial review, versioned taxonomy, future retrieval | CONFIRMED workflow intent, publishing authorization details PENDING |
| J06 | Show all 12 named Drivers; retain color filters; combined categories later only | client interactive Driver explorer, accessible PDF section | CONFIRMED; optional category aggregation FUTURE |
| J07 | Justyn and Elle primary initial reviewers; later trusted coach-level approval, optionally escalate to founders | staffing/RBAC, status machine, reviewer inbox, audit | CONFIRMED initial responsibility; delegation FUTURE with approval gate |
| J08 | Reviewers can correct interpretations, request clarification, change recommendations, regenerate and approve | coach portal assessment drawer, source-linked snapshots, clarification workflow | CONFIRMED |
| J09 | Secure browser report is primary, downloadable PDF secondary | authenticated member portal and export, email notification | CONFIRMED |
| J10 | Saved checklist progress and personal reflections are for Holistic Foundations members | membership entitlements, protected habit/action workspace | CONFIRMED; not baseline free-tier persistence |
| J11 | Free users may ask questions in context of a paid $250 personalized review/explanation consultation; affiliates may offer $50 off | consultation sales offer, affiliate attribution, payment, booking | CONFIRMED price/discount, payment/calendar integration FUTURE |
| J12 | Read-only display of original questionnaire answers desired if relatively low effort | member report read-only answer review, person-scoped access | CONDITIONAL; feasibility review required |
| J13 | Coaching uses 40-day milestones; offers repeated 40-day programs, 6-month and 12-month engagements | program planner, coaching goals/habits, timeline UX | CONFIRMED; abandon generic 7/30/90 schedule as governing cycle |
| J14 | Vitality Roadmap is typically once per person, not repeating each coaching interval | assessment lifecycle, identity/deduplication | CONFIRMED default; exceptional re-evaluation policy PENDING |
| J15 | Coaching enrollment questionnaire supplies deeper data for coach plan generation | existing enrollment + coaching module, source joins and planning engine | CONFIRMED FUTURE enhancement, no replacement of Roadmap |
| J16 | Standard and coach-personalized habits, meal plan integration and coaching adjustments | coaching habits module / wellness and progress workspaces | CONFIRMED FUTURE enhancement |
| J17 | Adults first; translate to children only after adult system learned/validated | questionnaire routing, scorer eligibility, staged access | CONFIRMED release scope |
| J18 | Founder proposes learning from generated reports and permitted real questionnaire submissions | calibration cases, consent policy, editorial knowledge base | INPUT SOURCE PROPOSAL; requires permission, independent validation and privacy controls |
| J19 | Six-page printed report look approved; normal non-medical-advice disclaimer | premium design system, print/export + disclaimer | CONFIRMED visual direction and standard disclaimer |
| J20 | Paid consultation CTA should link to checkout and appointment scheduling **once payments/calendar are ready** | consultation offer, booking/payments connectors | CONFIRMED destination intent; not currently claim bookability |
| J21 | Client secure-page + PDF delivery as previously planned | report publication/notification | CONFIRMED |

## What free Roadmap clients receive
- Questionnaire, access confirmation, report-pending state, coach/Justyn/Elle review and secure delivery.
- Personalized overview, **12 complete Driver sections** with filterable Red/Yellow/Green status, overall and per-Driver stages when scoring definitions are approved, prioritized strengths/opportunities, individual explanatory content and realistic starter habit recommendations.
- Interactive navigation of an approved immutable report, optionally static starter action suggestions, secure account re-access, downloadable/printable approved PDF.
- **No saved completion/checklist progress and no free personal reflections** as product promises. Those are Holistic Foundations member features (J10).
- Optional read-only answers if low effort after privacy, identity and formatting feasibility check (J12).
- Optional conversion link to $250 personal roadmap consultation; authenticated/validated affiliate discount of $50 where applicable. No forced purchase, no fabricated booking calendar or checkout link.

## Holistic Foundations / coached journey
- Preserve the same original free report and secure account across upgrades, program completion, pause and cancellation.
- Coach-created, individually revised 40-day objectives and milestones. Track in 40-day blocks for repeated 40-day programs, across longer 6- or 12-month memberships. A 6-month/12-month contract need not comprise an exact number of 40-day periods; milestones roll naturally.
- Persistent checklists, reflection journal and habit tracking including standard and personal habits, alongside existing wellness, nutrition, meal plans and coaching.
- Coach may use a **separate, more detailed enrollment questionnaire** to generate/update client plans. Do not repeat/free-reissue the Vitality Roadmap routinely, or confuse original snapshot with continuously edited plan.
- Historical Roadmap comparison should NOT imply frequent re-assessment. A follow-up display requires separately approved reassessment policy and comparable versions.

## Coach review and approval workflow
1. Questionnaire submission -> validation, scored/unscored coverage, versioned raw evidence -> preliminary draft kept private.
2. Queue to Justyn and Elle during first launch; assign accountability and review timestamps.
3. Coach screen shows sourced raw answers, normalized measurements, explanations of top ranking, pending clarifications, color/cap/stage reasons, rule/question version.
4. Reviewer requests clarifications; stores responses as structured revisions (no silent overwrite), may correct interpretation or override top rankings with original values, reviewer, timestamp, reason and supporting evidence.
5. Recompute from corrected approved inputs using frozen scoring version, regenerate draft report and PDF preview, retain previous draft/audit history.
6. Final approval by authorized Justyn or Elle, then immutable report release to a secure person-scoped account and matching PDF. **Never publish a revised report without review.**
7. During review, reviewer may submit a reusable recommendation, dictionary/synonym, rubric or educational explanation improvement to a **separate knowledge-base candidate queue**. It is not live for another report until an editorial/content approver validates safety, applicability, wording, evidence, and a publish-version transition.
8. Record rule/knowledge-base version attached to every report; new KB entries do not retroactively edit published reports. Later one-coach approval model requires quality thresholds and founder signoff (unresolved).

## Knowledge-base architecture requirements (engineering proposed, based on J05/J18)
- Structured types: 12 Driver explanations; red/yellow/green or per-stage context; symptom terminology/ownership; appropriate starting actions; habit templates; conditional applicability; disallowed/inappropriate recommendations; escalation/disclaimer guidance.
- Provenance: original consented submission **reference**, de-identified evidence or synthetic case; source questionnaire and scoring version; staff proposal/editor/approval; author; timestamps; audience adult/child; safe applicability constraints.
- Separate **scoring engine** (approved deterministic formulas) from **content retrieval/AI assistance**. AI may draft grounded prose but not invent symptoms, scores, diagnoses, causal relationships or countermand rule gates.
- Promote improvements through review stages: suggestion -> queued -> evaluated against regression cases -> approved -> published version. Audit and rollback required.
- Use real completed submissions for development only with specific applicable permissions and safeguards; minimize/redact identifying and medical details, avoid training external models without explicit permitted basis, honor retention/deletion/consent rules.
- **Founder suggestion to use incoming cases does not replace independent expected-outcome fixtures.** Build de-identified or synthetic representative cases and founder-approved reference outcomes before live scoring publication.

## Consultation pathway (deferred until commerce/calendar ready)
- Product: personalized report explanation/review consultation, **$250 base USD**. Affiliate-authorized offer: **$50 off**, net **$200 USD** before applicable adjustments. Eligibility/stacking/refund policy and commission treatment not supplied; do not invent.
- The free report remains free; the personal appointment is a separately paid service.
- Do not imply that a consultation slot is available, that booking occurred or payment succeeded if checkout/calendar integration is incomplete. For now a non-purchasing "Consultations coming soon" or contact-information CTA may be considered only with explicit marketing approval.
- When implemented: server verifies discount/referral ownership and one-time/idempotent payment, confirms calendar inventory after payment/deposit terms defined, creates booked appointment and acknowledgment, authorizes coach read access to that person's roadmap only with consent. Capture attribution and audit; no client PHI in public booking links.

## Implementation destinations (existing repository components to inventory/extend, not proof of functionality)
- Assessment intake/version/answers: consult.html, js/vitality55.js, js/vitality-resume.js, portal/vitality-question-catalog.js, portal/portal-vitality-assessments.js.
- Reviewer/queue: portal/portal-vitality-assessments.js, portal/portal-work-desk.js, portal/portal-permissions.js and role enforcement/RLS.
- Free/member account: portal/portal-client-foundation.js, portal/portal-client-lifecycle.js, portal/portal-people.js, member routes.
- Holistic Foundations habits/plans: portal/portal-coaching.js, portal/portal-wellness.js, portal/portal-learning.js, wellness/meal plan integrations.
- Billing and consultations: portal/portal-billing.js, future validated payment and calendar endpoints; affiliate referral attribution architecture to review, no assumption an affiliate discount service already exists.
- PDF/interactive: draft roadmap-experience-preview.html from PR #20 is ONLY a fictional design; use same approved versioned report data in authorized future client view and PDF.

## QA / acceptance
- No client report released without founder approval during pilot.
- Explain why each priority/strength/opportunity was selected and record reasons for overrides.
- Unknown/missing answers never become zero or full points. Individual Driver stages are withheld where mapping not yet approved.
- Genuine free result contains the 12 Driver explanations, actions and downloadable PDF; optional $250 consultation never blocks it.
- No free storage permissions for Holistic Foundations saved tracking/reflections; no covert persistence in browser.
- Auth user can view own approved report; cannot see others' assessments or coach draft; staff roles cannot exceed granted review scopes.
- No repeated automatic questionnaire requests during 40-day coaching windows; plan cadence and assessment cadence are separate.
- No knowledge-base item automatically publishes from a correction or incoming client submission.
- Approval/version traces reproduce exact interactive and PDF content; upgrades/cancellations do not remove free entitlement.

## Founder decisions still needed after this reply
- All 12 detailed rubrics and mappings (F01-F08), including per-Driver stage thresholds and questionnaire additions.
- Distinct red/yellow/green and stage cap approval, case-based mathematical calibration and conflict resolution.
- Review assignment when Justyn and Elle disagree or a reviewer edits one's own report; later coach delegation criteria.
- Privacy consent and retention, notification wording and turnaround targets, escalation/medical flags.
- Exact operational eligibility for $50 affiliate discount, refunds, stacking, lead attribution and checkout/booking rules.
- Whether the optional read-only questionnaire answer list passes effort/security review.
- Launch benchmark cases and success metrics, beyond use of live submitted cases.


## October 27, 2026 — Owner override and primary supplement provenance

Preserve the founders' original coaching wording, intent, requested information, methodology and proposed ranges. Do not substitute generic wellness/AI philosophy or broadly soften/reinterpret their voice. Distinguish questionnaire evidence, founder interpretation and private consultation. Audit existing questions for full equivalence before additions; collect only missing qualifiers. Numerical proposals are not adopted scoring rules. Flag only specific material legal/regulatory or major safety issues with exact source and minimum proposed safeguard; never silently edit/remove them.

Owner clarified that portal bugs caused most feedback after the first Driver to be supplied in the nine-page supplement. Protected metadata verifies one saved portal Driver proposal with five citations, not twelve saved portal submissions. The supplement covers all twelve Drivers. Keep both sources separate; do not require portal re-entry or repeated consent. Exact original participant-specific source remains private and excluded from shared rules.

The local versioned founder-direction composer uses verbatim reusable directions and source-grounded provisional pattern analysis. Old source mappings, engine weights, saved reports, feedback and the pinned October 20 seven-principle record remain unchanged. Questionnaire changes, numerical adoption, technical release and a renewed source-specific operating window require their respective applicable approval. See docs/founder-methodology/LOCAL_PACKAGE.md and OWNER_DECISION_REGISTER.md.
