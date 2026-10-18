# B6 / Real Intake Calibration — implementation checkpoint

## Request and scope
Owner requested 3–4 **actual** completed questionnaires, exact submitted answers, current candidate algorithm output, independent Justyn judgment, and side-by-side differences, rather than additional fictional personas. This is the definitive product direction. Parent Issue #45.

**This branch is a synthetic-only engineering candidate. No participant lookups, production writes, deployment, migration, scoring activation, or report delivery are authorized by the implementation task.**

## Verified baseline
- Source: PR #44, `d8435d15e6c3da6a8809124836c01194143ff82b`, stacked on PR #42. PR #39 is separate and unreleased.
- Actual production published deploy last verified `6ad2acb16d6d38c15ce3e489`. GitHub main is pre-B4. The nine exact Netlify Function bundles and payment-worker schedule must be preserved; no ordinary Git/Netlify rebuild or mass migration.
- Existing `js/vitality-roadmap-b5-contract.js` analyzes source coverage but returns `overall:null` and `stage:null` for every real intake. B3 `scoreActualSource` intentionally throws. B2.1 engine instead consumes a distinct synthetic numerical measurement-sheet schema. **This is a genuine format/rubric incompatibility, not a hidden switch we can flip.**

## Required minimal sequence

### A. Strict source-evidence adapter (initial engineering)
Use the original pinned registry and saved field/branch shape. For a real Adult/Myself completed record, produce a protected, source-only trace:
`question ID → actual stored answer → conditional applicability → observed/explicit zero/unknown/conflicting/inapplicable → candidate component or unsupported missing measurement`.
Verify authoritative questionnaire code revision from server evidence, never the format version alone. Only existing authorized private server methods may expose actual answers to designated founders.
No stage or numeric Driver score is assigned without an explicitly defined measurement-to-engine conversion. All original answers stay immutable; no opportunistic inference of symptom identity/days, impact, proficiency, function, conditions, or clinical conclusions.

### B. Founder-first review (separate controlled UI)
Require exact matching B4.2 verified founder identity, independently checked source, current session, contact scope, active B4 source-pinned cohort, bounded B5 experimental permission and purpose/SOP authorization.
Select no more than four confirmed eligible records, one supervised first; do not add anyone merely by a suggested first name.
Render one compact page per intake:
1. **What they actually answered:** only the submitted questions/choices, grouped into 12 Drivers.
2. **Justyn's independent assessment first:** expected score/range, Spectrum, 3 priorities, rationale, with no system-result anchoring.
3. **Current candidate engine result:** for each source-supported measure, show exact source/adapter rule/pins and provisional component; show *withheld* for any missing measurement/rubric. No silently invented numeric results.
4. **Side-by-side comparison:** where both valid values exist, show delta and reason; otherwise explicitly `Comparison blocked: missing source measurement or approved conversion rule`.
5. **Controlled what-if:** separately label every founder-entered hypothetical input and its provisional arithmetic; never present hypothetical as a measured actual-answer result.
6. **Roadmap preview:** only source-backed interpretations; no medical diagnosis, non-supported cause, treatment, report release or email.

### C. Necessary measurement decisions
Current questionnaire has 743 reference fields and 190 symptom follow-up registry entries, but current scoring requires independent function/proficiency, exact distinct symptom days, duration, intensity and daily impact, habit opportunity rubrics, symptom grouping/ownership, and founder-approved Spectrum prerequisites. Preserve weights 1.4/1.3/1.2/1.1, Wise Budgeting 1.0 separate, and budget health deduction 0.
Do not claim an actual score is available before mapping validation. If real records produce only withheld results, prioritize a limited founder decision/rubric packet and candidate assumptions separately rather than presenting an artificial score.

### D. Privacy/release gates
B4.2 existing SOP said **no scores**: review and separately approve an experimental real-score purpose and updated founder SOP/privacy basis before any actual-source compute. Original exact identity and date confirmation precede source pin; founder signoff alone does not enroll. Distinct approval for operator B4 read-only cohort, separate B5 pilot, and separate write/feedback permissions. Name Justyn revocation accountable owner, Elle backup, and a privileged operator; source-pinned pilot max 14 days, B4 manual revocation appointment. No outside AI.
Original answers must not be copied into GitHub, local/staging fixtures, public demo URLs, screenshots, PDFs, telemetry, query strings, logs or email. Distinct narrow release authorization required for technical installation, first real calculation, extension to remaining 2–3 cases, and eventual client report.

## Implementation acceptance to finish before any technical release
- Verified exact source and no ambiguity across duplicate names/historical summaries; fail closed on stale source hash, expiry, wrong staff role, logout, session swap, missing consent/purpose.
- Fully synthetic source shapes including completed, child, proxy, historical, ambiguous, unresolved source revision, missing answer, explicit zero, ordinal frequency, multi-choice contradiction, conditional branch, overlap and unknown; no production client copies.
- Independent expected outputs; all 12 Driver trace and separate budget; no made-up numeric stage.
- Founder comparison includes blind manual judgment before score reveal, explicit null/withheld semantics and side-by-side differences only when defensible.
- Chromium/WebKit responsive, native PG17/RLS and concurrency; nine existing Functions/PR29 NDA/marketing/payments/PR39/PR42/PR44 preserved.
- Draft PR, exact SHA, source/adapter/version list, mapping decisions, code/test evidence, rollback and explicit gate register. No automatically publishing Netlify main or rebundling Node22 archives.

## What the owner should expect immediately
Engineering can build source trace and comparison now, but not honestly show full actual numeric results by simply calling B2.1 on the saved questionnaires. The first authorized live-source read-only test should make missing conversions visible. That is the shortest safe path to the owner's desired real-score/manual-score comparison.
