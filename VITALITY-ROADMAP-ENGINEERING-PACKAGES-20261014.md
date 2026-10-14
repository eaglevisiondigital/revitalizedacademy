# Vitality Roadmap v1 | implementation ownership and acceptance
Created October 14, 2026 after Justyn's founder response. Only a backlog and interface contract, not a report release. See VITALITY-ROADMAP-JUSTYN-DECISIONS-20261014.md and VITALITY-ROADMAP-FOUNDER-SCORING-WORKBOOK.md.

## Existing implementation landmarks (to inspect before altering)
These are candidate integration points found in the existing repository, not a claim they already implement this new feature.

| Domain | Reuse candidates | Engineering responsibility |
|---|---|---|
| Intake/form/schema | consult.html, js/vitality55.js, js/vitality-child.js, js/vitality-resume.js, portal/vitality-question-catalog.js | Extract actual question IDs/option codes, consent, routing, version, save/resume and reliability |
| Staff review | portal/portal-vitality-assessments.js, portal/portal-vitality-assessments.css, portal/portal-work-desk.js | Founders' queue, raw/source evidence, calculation trace, clarification, override and report regenerated preview |
| Permissions | portal/portal-permissions.js, staff roles, existing auth/RLS/server RPC patterns | Explicit founder/reviewer permissions, allowlisted transitions and person/tenant-scoped report access |
| Free authenticated report | member routes, portal/portal-client-foundation.js, portal/portal-client-lifecycle.js | Claim/login existing person identity, evergreen free entitlement, immutable approved interactive view and PDF |
| Coaching | portal/portal-coaching.js, portal/portal-wellness.js, portal/portal-learning.js | 40-day milestones, repeated 40-day programs and 6-/12-month arrangements; tracking, reflections, coached habits |
| Commerce | portal/portal-billing.js, payment infrastructure, future calendar provider | $250 roadmap review consultation, authorized $50 affiliate discount, secure checkout and actual appointment booking |
| KB / AI Advisor | existing content composition/sync and permissions systems to audit before reusing | Coach suggested rules/content, editorial moderation, versioned publishing, rollback, source/provenance |
| Presentation | draft PR #20 roadmap-experience-preview.html and six-page public report mockup | Premium PDF aesthetic, all 12 Drivers, overall and per-Driver stage once approved, separate Free/Foundations UI, PDF consistency |

## Build packages

### PKG-01 Foundation/inventory (unblocked)
- Reconcile current production default branch, site and staging release; do not transplant obsolete preview files over current release.
- Read schema, existing tables/RPCs/storage/RLS and question IDs; build field/answer registry. Record gaps and versioning; never invent production IDs.
- Identify identity and consent lifecycle for visitor, member, child, coach and affiliate. New report entitlement does not need subscription.
- Confirm import/export of safe, de-identified fixtures for simulation. No real personal data in public preview.

**Acceptance:** field-ID coverage report, actual schema links, known bugs/unsupported pathways, no modification to existing payment, notification or save/resume behavior.

### PKG-02 Scoring founder-review workbench (unblocked UI; algorithm gates blocked)
- Show all shared scales, formulas/candidate flags side-by-side from v0.14; annotate confirmed vs proposed.
- Provide a reviewed Driver definition card for all 12, with questionnaire gap suggestions and three complete scenario cases each.
- Add rule scenario comparisons (incomplete, duplicates, changed sources, 3-Hydration symptom gate, budgeting stage invariance).
- Explicit input/output for 12 separate stage mappings; no fabricated per-Driver stage.
- Expose ranked selections' evidence and WHY explanations.

**Acceptance:** Justyn/Elle can see exactly what is set, change proposed values, attach approval and regenerate fixed de-identified scenarios. Unapproved rules cannot publish.

### PKG-03 Founders' review engine and secure report infrastructure (unblocked foundation; live release gated)
- Build statuses: submitted, incomplete/needs clarification, preliminary calculation, founder review, awaiting approval (if separate), approved/released, withheld and superseded. Make transition model explicit.
- Assign Justyn and Elle as initial designated reviewers in authorized role data; names are not automatic proof of linked auth identities. Permission guards on both RPC/server and UI.
- Allow corrections with immutable source evidence, history, reason, safe recalculation, iterative report preview and regenerations.
- Release one immutable approved version to free authenticated account; HTML and PDF both read same snapshot, with safe email notification.
- Optional read-only original answers view behind person authorization, if reasonably straightforward and privacy-reviewed.
- Reject direct public report access, cross-household leaks, role escalation, draft visibility and duplicate delivery.

**Acceptance:** review/rereview decision logs, source trace, release-only visibility, PDF equality and signoff test.

### PKG-04 Knowledge base proposal/curation (unblocked schema/workflow; populated progressively)
- Create status/versioned entries for explanation, primary finding ownership, rank reasons, conditional action and coaching education.
- Each review may propose a KB candidate for future cases, not publish it. Curators examine consent, specificity, risk and conflict with scoring authority.
- Publish approved versions after regression comparisons, signed content approvals and rollback plan. Isolate different child/adult content.
- Optional AI Advisor retrieval is constrained to approved entries and exact known client answers; AI cannot compute score, override math or invent medical interpretation.

**Acceptance:** one reviewed correction flows to KB suggestion; does not affect another client's report until approval/version; old report stays reproducible.

### PKG-05 Free interactive experience (presentation prototype unblocked; real client release gated)
- Editorial visual direction follows six-page PDF, site-approved logo colors and typography, no disliked three-leaf emblem; preview links on marketing have no icon.
- Free includes overview, all 12 Driver entries, color filters/search, overall and individual stages only once verified, strengths/opportunities/priorities with actionable educational suggestions.
- Secure long-term account access and PDF export; clear distinction between initial report and subsequent updates, one standard free questionnaire.
- Do **not** persist check-off habits or reflection journals for free recipients. Surface paid Foundations functionality as separate, optional offer without blocking report.
- Connect optional paid personal review CTA only when purchase/scheduling flow is ready.

**Acceptance:** free user can reopen same approved report and export PDF without card or active membership; cannot edit score; no premium tracking permission.

### PKG-06 Foundations coaching extension (after auth/entitlements verified)
- Extend original report with coach-specific plan generated using deeper enrollment data, goals, 40-day progress cycles and custom habit libraries.
- Track completed actions, personal reflections and coach-assigned habits, meal plan wellness context, milestones across repeat 40-day and longer 6/12 month engagements.
- Report remains immutable; coach plan entries version and evolve independently. Plan cancellation revokes paid features but not free report.

**Acceptance:** after coaching lapse the report still opens, but paid tracking controls are not writable or visible without entitlement.

### PKG-07 Paid personalized Roadmap consultation (blocked by commerce/calendar)
- Offer code $250 USD, affiliate-eligible $50 discount ($200 price). Verify discount eligibility on server, protect referral attribution, decide stack/refund/commission policy.
- Payment confirmation + available appointment slot + authorized coach access tied to consent and purchaser; idempotent booking/notifications.
- No fake link to payment or calendar until production provider complete and acceptance checked.

**Acceptance:** paid $250 and authorized $200 checkouts book only real available slots; misapplied discounts blocked; no health data exposed via referral link.

### PKG-08 Adult supervised launch and evaluation (blocked by founder scoring approvals)
- Build 10-20 independent expected-outcome scenarios using synthetic or properly permissioned de-identified cases; don't use model outputs as the only benchmark.
- Evaluate logic, content quality, usefulness/clarity, consistency, missing/unknown/duplicate handling, report access and notification.
- Route all initial releases through Justyn/Elle. Track discrepancy types, rollback and controlled version promotion.
- Do not automate coach approval, score children, or initiate repeat Roadmap assessment until explicit separate approval.

**Acceptance:** signed founder scoring/configuration/report versions and quality thresholds, red-flag/escalation SOP, verified release checklist.

## What remains explicitly undecided
- All 12 detailed scoring rubrics, alpha exponents, validation thresholds, separate Driver stage mappings, ranker tie criteria.
- Adult v. child exactly at age 18, proxy/guardian consent, medical safety escalation, legal/privacy retention, regulated-data exposure.
- Model/AI provider and whether personal submissions can be used for training vs internal retrieval. Founder allowed consideration of permissioned learning only.
- Founders' transition to coach approval: numerical quality bar, scope, escalation rights and audit.
- Paid consultation legal/financial/affiliate offer details and booking platform, earliest activation.
- Member questionnaire review feasibility and whether raw responses require masking of sensitive or proxy-entered content.

## Design correction to pending PR #20
Current draft PR #20 depicts saving a checklist and reflections in the free interactive demo and has 7/30/90-day coaching suggestions. After founder response:
1. Keep the fictional demo interactive capabilities for feature demonstration, but make **persistent** checklist/reflections explicitly Holistic Foundations-only. Do not label free entitlement as including saving.
2. Replace the normative 7/30/90 coaching cadence with **40-day** goal blocks. Demo may use an informational preview of 40-day cycle but not claim a live coach plan.
3. Keep a free, static starter-actions section; separate "Talk through your results with a coach" as an optional $250 paid consultation with eligible $50 affiliate discount, **not an enabled checkout or booking link** yet.
4. Show overall Spectrum stage and a per-Driver Spectrum stage slot only if mapping approved; sample placeholders must be labeled fictional, no inference from Driver color.
5. Re-check the JS/HTML review link is still based on the up-to-date production main branch before future merge, so previously shipped popup and social-proof fixes are preserved.
