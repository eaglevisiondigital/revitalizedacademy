# Founder Scoring Response — Justyn, October 15, 2026

Status: founder-supplied direction for **Phase B2 candidate scoring**. Do not interrupt or replace the in-progress B2 implementation. Apply through a deliberate versioned scoring configuration, synthetic regression fixtures and founder review. Not an authorization to approve or release real client reports. Source is Justyn's written response forwarded by the project owner.

## 1. Relative Driver importance — supersedes earlier 1.3/1.0 proposal

| Driver | Weight |
|---|---:|
| Cellular Hydration | 1.4 |
| Neural Repatterning | 1.4 |
| Systemic Detoxification | 1.4 |
| Gastrointestinal Renovation | 1.4 |
| Hormone Balancing | 1.3 |
| The Living Diet | 1.3 |
| Holistic Recovery | 1.3 |
| Mentality Realignment | 1.3 |
| Electrobiology Rhythms / Regulation | 1.2 |
| Functional Training | 1.2 |
| Momentum Regimens | 1.1 |
| Wise Budgeting | 1.0, separate |

Founder states all twelve Drivers are important to wellness for different reasons, but the above represents their **relative importance in the Vitality Roadmap**. Do not silently rename or alter existing Driver canonical keys when mapping “Electrobiology regulation” to current “Electrobiology Rhythms.”

Wise Budgeting: scored separately. Poor financial preparation or hardship alone must NOT push someone below the classification warranted by direct health answers. Existing candidate budget deduction is therefore **in conflict with the new direction if it reduces displayed health score**; flag for specific approval whether budget is merely a separate indicator, or whether some non-health composite score may reference it. Do not implement budget penalty by assumption.

## 2. Overall Health Spectrum eligibility/ceilings

- **Peace** requires no reported symptoms and no negative impact from health on daily life.
- **Impaired ceiling** if qualifying cognitive dysfunction (brain fog, unclear thinking, memory issues etc.).
- **Dysregulated ceiling** if qualifying gastrointestinal issues (digestive problems, constipation, chronic bloating etc.).
- **Chronic ceiling** when **more than one health condition** has persisted **longer than 90 days**.
- **Chaos** when multiple chronic conditions cause negative effects on daily life.

These are eligibility/ceiling statements, not complete numerical formulas. A ceiling prevents a BETTER stage, not necessarily assigning that stage. Multiple simultaneous findings require the most restrictive applicable ceiling; Chaos has additional impact criteria. Required founder clarifications before hard-coding: symptom vs medically diagnosed health condition; “more than one condition” versus “multiple symptoms”; meaning of “measurable” and frequency; whether each cognitive/GI symptom requires meaningful/current intensity; qualifying daily impact threshold; overlaps and urgency handling. Do not conflate their coaching stage with medical diagnosis.

## 3. Driver-level Health Spectrum

- Start with **the same numerical bands for each Driver**, as currently proposed for overall Spectrum.
- Founder says excellent Driver score reflects little-to-no symptoms, strong habit consistency AND proficiency, and little-to-no daily negative impact; roughly “above 90–95,” NOT an exact approved boundary.
- Driver-level staging may be less restrictive than overall staging because the overall symptom-type ceilings are not automatically applied to individual Drivers.
- Cannot have excellent Driver score if ongoing symptoms and daily limitations.
- Persistent measurable symptom **longer than 90 days** may be classified chronic even at low frequency (example: once monthly across menstrual cycles).
- Founder says “once multiple symptoms have been classified chronic it now becomes chaos,” which may conflict with the earlier “multiple chronic conditions negatively affect daily life” criterion. Resolve whether this is a Driver-local symptom-burden rule, a global rule, or requires functional impact. Do not quietly implement as identical.
- Driver-specific gates can be added later through reviewed rule-version upgrades; old released scores are not retroactively changed.

## 4. Expected comparison for candidate validation

Synthetic Person A: excellent demonstrated habits, one significant ongoing concern. Founder expects A slightly higher than B and C, close scores overall, despite continued need for assistance.

Synthetic Person B: poor habits but few present symptoms. Still should show weak lifestyle foundation, not falsely predict inevitable future disease.

Synthetic Person C: moderate habits and multiple moderate symptoms; similar total score range. Founder sees coaching opportunity but personal suitability must not become automated sales targeting or a medical prediction.

Set independent expected relative ordering/ranges with founder signoff before tuning numbers. Never force arbitrary scores to match these descriptions. Current formula is candidate; separate symptom and habit drivers with explainable rationale.

## 5. Recommendations and explanation

- Current proposed features for strengths/opportunities/priorities are accepted directionally.
- Significant symptoms and poorly established lifestyle habits CLEARLY LINKED to those symptoms should generally be comparably important, but the actual links must be curated, justified and reviewed in the knowledge base.
- Reviewer may change strengths, opportunities, priorities; require explanation, audit and source trace.
- Future knowledge base may deepen links, but never invent causation from correlated questionnaire answers.

## 6. Questionnaire and feedback loop

- Founder authorizes proposing additional/revised questions where they improve report quality; do not arbitrarily expand without measurement justification and user burden review.
- Founder prefers side-by-side **provisional Roadmap + underlying questionnaire answers** for correcting expected outputs, rather than reviewing only raw assessments.
- Provide case review where founders annotate incorrect findings/score/stage/priority/recommendation, approve expected outcomes, and submit separate reusable knowledge-base candidates; candidate changes not auto-published.
- Founder asks for optional participant permission to use their questionnaire/report to improve the system. Implement a **separate, specific, informed, freely optional opt-in** from ordinary service consent with clear scope (internal improvement, de-identified case review, any third-party AI processing only if separately justified/disclosed), ability to decline without losing free report, withdrawal process, retention and data-deletion handling. Do not infer prior clients consented; never quietly repurpose existing submissions.
- Legal/privacy wording and implementation require review before launch, especially regarding sensitive health data. No raw submissions in GitHub or third-party model training by default.

## 7. Application order for B2

1. Record this source in B2 candidate configuration history. Preserve source version and old rules.
2. Change Driver weights to founder-specified values in **candidate** math; ensure distinct Budget indicator rather than penalty pending clarification.
3. Implement displayable, editable rule ceilings as UNAPPROVED candidate policies with missing-data states and a human-readable WHY trace, not final release rules.
4. Generate independent synthetic A/B/C and chronic/cognitive/GI cases with provisional outputs and source answers side-by-side.
5. Founder review dashboard exposes all unresolved definitions/consent workflow.
6. Incorporate approved changes only after explicit founder acceptance; do not activate personal scoring/approval/release/email.
7. No production SQL or real user data modification based on this document.

## Short targeted follow-up (after initial candidate scenarios)

1. Should Wise Budgeting affect **only its separate displayed score**, with **zero deduction from overall health score and stage**? Your newest answer appears to say yes.
2. Overall Chronic requires multiple **health conditions** older than 90 days, while your later statement mentions multiple chronic **symptoms** leading to Chaos. Are these distinct rules? Does Chaos require meaningful negative daily-life impact?
3. For cognitive/GI ceilings, do occasional or mild occurrences count, or only current/meaningful symptoms? What about past/resolved symptoms?
4. Driver Peace numerical cutoff: keep 95+, or allow 90+ subject to additional minimum-habit and no-impact requirements?
5. What exact scope of anonymized/identifiable data use and opt-in withdrawal do you want described? Present separate checkbox wording for approval, not assumed authorization.

## Cross-references
- `VITALITY-ROADMAP-JUSTYN-DECISIONS-20261014.md` on main
- `VITALITY-ROADMAP-FOUNDER-SCORING-WORKBOOK.md` on main
- `VITALITY-ROADMAP-B1-ACCEPTANCE-20261015.md` on PR #26
- Draft B2 scoring work based on B1 branch; maintain stage and data release hold.
