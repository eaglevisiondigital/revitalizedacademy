# B5.1 — Twelve-Driver Measurement Readiness and Founder Decisions

Status: **engineering preparation / proposal only**. Neither source-questionnaire changes nor actual-client scores are approved. No production or beta change. Parent Issue #36. Source baseline: B5 `e02f35267de3159d7b3b2a5e989ccb8edb7e9f7d`, production reference registry `2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced` (743 reference field IDs, 190 symptom entries). Derives from `docs/VITALITY_ROADMAP_B5_CANDIDATE.md`, `js/vitality-roadmap-b5-contract.js`, `js/vitality-roadmap-b4-coverage.js` and `VITALITY-ROADMAP-B3-FOUNDER-DECISIONS.md` on B2.1 reference branch. This is **not** clinical validation.

## Important distinctions

- **Observed answer**: what source actually records. A zero or “None of these” is only a zero for its precise question/screen, not proof of complete wellness.
- **Context-only answer**: relevant narrative or self-assessment, not numerically established health function/proficiency.
- **Missing / unknown / inapplicable / conflicting / historical**: retain distinct states. Never use zero to fill gaps; never infer an exact symptom duration, unique days, diagnosis, full proficiency or per-Driver function from ordinal labels.
- **Candidate mathematics**: deterministic but unapproved B2.1 with fractional weights; A/B/C fictional output approx 70.66, 35.48, 70.00. Candidate band Chaos for B (poor habits, few symptoms) is a calibration warning, not an approved health status.
- **Conditional what-if**: a reviewer-entered hypothetical on a fictional case, not an edit to a participant's answers.
- **Client-ready result**: withheld until a separately signed-off measurement/rubric version, safe assessment-specific review, and release authorization.
- **Wise Budgeting**: distinct planning/preparedness module weighted 1.0 for its own view; **zero** direct deduction from health score or health Spectrum stage.

## Twelve-Driver source coverage and founder decision matrix

The examples below are existing **reference field families**, not guarantees that any participant answered them or that they provide a complete score. Confirm exact field names and branch applicability against the pinned registry before engineering.

| Driver | Existing contextual reference fields | Missing factual measurements / decisions |
| --- | --- | --- |
| Cellular Hydration | `water_intake_consistency`, `electrolyte_consistency`, `hydration_symptoms`, `hydration_proficiency` | Actual amount with units and applicable days; whether body weight is relevant; independent function; factual proficiency criteria and habit opportunities; qualified symptoms/days/impact |
| Systemic Detoxification | urinary/liver-bile/lymphatic/lung screens, `whole_body_movement`, `sedentary_periods`, `walking_regularity` | No assumed detox diagnosis, symptom ownership/deduplication, distinct functional measure and actual habit rubric |
| Electrobiology Rhythms | `sleep_wake_consistency`, `morning_daylight`, `evening_light_exposure`, `outdoor_time`, `grounding_frequency` | Defined applied practice thresholds and opportunities, concrete proficiency and separate Driver function |
| The Living Diet | `eating_*`, `nutrition_*` confidence, `whole_food_percentage` | Evidence-backed dietary counts/amounts/units as applicable, which practices affect score, factual skill criteria (not confidence) and distinct function |
| Functional Training | `training_sessions_weekly`, `training_program`, `performance_*`, `body_allows_activities`, movement confidence | Exercise criteria suitable to limitations, independent functional burden, applicable days; no confidence→proficiency conversion |
| Holistic Recovery | recovery screens and `recovery_behavior_*` | Qualifying symptom unique days, separately captured intensity and daily impact, duration and factual habit behavior rubric |
| Gastrointestinal Renovation | `bowel_movement_frequency`, `bristol_stool_types`, `colon_symptoms`, `gi_symptoms`, `fiber_whole_foods` | Distinguish explicit symptom/condition and time; map independent impact/intensity/frequency; do not turn stool observation into diagnosis; deduplicate overlapping GI entries |
| Hormone Balancing | `hormone_pathway` and its conditional screens | Branch applicability and current evidence; clinical diagnosis never inferred; separate symptom/condition/function/rubric |
| Neural Repatterning | `neural_symptoms`, `stress_*`, `cognitive_*`, learning habits | Qualifying cognitive symptoms with exact days, independently measured disruption/impact; cognitive confidence is not performance; define overlap ownership |
| Momentum Regimens | `daily_habit_consistency`, `weekly_rhythm`, `monthly_goal_review`, `routine_friction`, `restart` | Concrete habit opportunity/consistency denominator, skills/proficiency, separate function and evidence-supported priorities |
| Mentality Realignment | `self_talk`, `gratitude`, `positive_environment`, `life_purpose`, `emotional_patterns_symptoms` | Ethical educational interpretations; no psychiatric/causal diagnosis; defined practices, impact and function, appropriate escalation outside scoring |
| Wise Budgeting | `monthly_health_spending`, `wellness_budget`, spending/planning context | Owner-approved optional planning readiness criteria separate from health; do not derive wellness or worthiness from income/spending |

All health Driver scoring currently **withheld** for existing real detailed questionnaires under current B5 contract. Source availability is not numerical validity. The registered fields listed above provide context, not enough to claim actual 12-Driver health scores.

## Proposed low-burden, branch-aware follow-up questions (NOT yet approved)

These are **candidate** questions for Justyn/Elle to edit before any future questionnaire version. Do not add them to live intake and do not retroactively assume answers for previous submissions.

| Source gap | Proposed exact wording / answer mode | Rules to approve |
| --- | --- | --- |
| Symptom unique days | “During the past 30 days, on how many different days did you experience [the symptom you selected]?” Integer 0–30, “Not sure”, “Prefer not to answer” | Show only for individually selected current symptom, not ‘None’; prevent duplicate counting of the same day across overlapping symptom groups |
| Symptom intensity | “When [selected symptom] occurred in the past 30 days, how intense was it typically?” None / Mild / Moderate / Severe / Not sure | Clinical meaning and threshold remain proposed; do not silently equate with disruption |
| Daily impact | “How much did [selected symptom] interfere with your usual activities during that time?” Not at all / A little / Moderately / A lot / Unable to do usual activities / Not sure | Separate from intensity; threshold for qualifying a ceiling requires founder signoff |
| Persistence | “How long has [selected symptom] been occurring?” Less than 1 week / 1–4 weeks / More than 4–12 weeks / More than 12 weeks / Not sure. “Is it still occurring?” Yes / No / Not sure | Bands alone **do not establish exact >90 days**; for strict gate use an exact start date or explicitly withhold if unknown, and never infer midpoint |
| Condition ownership | “Have you been told by a licensed professional that any selected symptoms are related to the same condition?” Yes / No / Not sure / Prefer not to answer. Optional separately secured description | Avoid requiring diagnosis/disclosing unnecessary health detail; never algorithmically deduplicate based on guessed equivalence |
| Independent Driver-specific function | “In the past 30 days, to what extent have concerns with [Driver-specific day-to-day function] affected activities important to you?” Not at all / A little / Moderately / A lot / Unable / Not sure | Requires Justyn/Elle to write **11 distinct, meaningful Driver definitions**. Do not reuse a global functional answer across Drivers |
| Habit opportunity | “On how many days in the last 7 days was [specific behavior] realistically applicable to your circumstances?” 0–7 / Not sure, then “On how many of those days did you do it?” 0–7 / Not sure | Define behavior precisely, avoid moralizing physical limitations, denominator 0 means inapplicable not failure |
| Proficiency | A **specific observable factual knowledge/skill check** for each Driver, with rubric anchored to correct answer or demonstrated step | Self-rated confidence cannot substitute. Founders must author/approve answers and weights |
| Hydration amount | “Approximately how much plain water did you drink on a typical day over the past 7 days?” Number + explicitly selected fluid units + Not sure | Any target normalized by weight/activity/other factor is not decided; avoid automatic diagnosis or inadequate-intake label |
| Budget context | “Do you have a comfortable plan for optional health-related expenses?” Yes / Working on one / No / Prefer not to answer | Standalone planning/agency indicators only, no health score/stage impact and no presumed income disclosure |

**Implementation guidance for later approved version:** conditional display must honor self/Adult completion boundary, uncertainty states, accessible labels, unit normalization, branch determinism, record provenance, versioned mapping, source immutability, and schema-valid choices. Do not change live form, consent or client eligibility during B5.1.

## Founders' scoring policy decision sheet

For Justyn and Elle to complete **separately**, then reconcile into one versioned approval. An empty answer is **unresolved**, not implicit authorization.

| Decision | Justyn's independently proposed answer | Elle's independently proposed answer | Joint approved rule |
| --- | --- | --- | --- |
| Fictional A expected score range (strong habits, major concern) | ___ | ___ | ___ |
| Fictional B expected score range (poor habits, few symptoms) | ___ | ___ | ___ |
| Fictional C expected score range (moderate/moderate) | ___ | ___ | ___ |
| Maximum acceptable A/B/C spread, and A’s required lead | ___ | ___ | ___ |
| Should poor habits **alone** ever produce an impaired/chronic/Chaos current-health stage? | ___ | ___ | ___ |
| Peace: minimum score 90 or 95; any functional/symptom requirements? | ___ | ___ | ___ |
| Cognitive ceiling: what current symptom intensity, unique days and impact qualify? | ___ | ___ | ___ |
| GI ceiling: same qualification rules; ownership/overlap exclusions? | ___ | ___ | ___ |
| Chronic: distinct conditions vs reported diagnoses vs persistent symptoms; exact >90-day evidence? | ___ | ___ | ___ |
| Chaos: how many distinct persistent conditions AND what daily-impact prerequisite? | ___ | ___ | ___ |
| Overlapping symptom/condition grouping and Driver primary ownership | ___ | ___ | ___ |
| Other Driver-specific stage ceilings and symptom exclusions | ___ | ___ | ___ |
| What evidence is mandatory for score vs “Withheld” vs “Partial”? | ___ | ___ | ___ |
| Habit proficiency/opportunity rubrics, exponents, alpha/breadth math and rankings | ___ | ___ | ___ |
| Approved wellness wording, recommendations and safe escalation language | ___ | ___ | ___ |
| Exact questionnaire follow-up questions and branch rules | ___ | ___ | ___ |

Existing founder-proposed weights to preserve unless explicitly changed by signed-off version: Hydration, Neural, Detox, GI **1.4**; Hormone, Living Diet, Recovery, Mentality **1.3**; Electrobiology, Training **1.2**; Momentum **1.1**; Wise Budgeting **1.0 as a separate indicator**. No budget deduction to health score/stage. Distinguish current reported wellness, habits/opportunities and predictions (not supported).

**Approval record required later:** reviewer(s), UTC time, exact approved questionnaire + registry hash, crosswalk/rubric/scoring-config version, fictional independent expected-output fixtures, unresolved exclusions, privacy disclosure/scope confirmation, tests and controlled release decision. A chat reply or GitHub worksheet alone is not authenticated founder approval to score real participants.

## Developer checklist after founder decisions

1. Convert approved question/rubric contracts to pinned testable rules with independent fixtures; enforce “unknown / unsupported / conflicting” fail-closed.
2. Validate synthetic examples **without tuning to meet expectations arbitrarily**; explain each Driver calculation and any stage restriction.
3. Re-test A/B/C and at least 50 additional synthetic cases including missing/explicit zero, age/Adult/self/branch applicability, reported symptom overlap, time boundary and previously resolved findings.
4. Hold actual source score/stage until verified exact questionnaire provenance, allowed consent/privacy purpose, B4.2 founder identity/SOP, individual B4 source-pinned cohort, B5 experimental pilot, and measured/rubric completeness.
5. Independently approve any future clinical claims or client-release workflow. Never send actual source data to staging, Github, third-party AI, client email or analytics.

**Independent engineering can prepare all of the above, but Justyn and Elle must supply normative scoring and questionnaire decisions.**

## B5.1 engineering review addendum — exact source contracts, no new questionnaire

The original workbook above is preserved. The generated [field-level matrix](evidence/b51/measurement-matrix.json) expands its examples using the exact unchanged B5 `crosswalk()` and pinned reference registry. It covers **707 Driver-specific reference fields, 36 shared/other fields and all 190 symptom observations**. Every row retains the original question ID, label, kind, options and conditional paths. Field presence does not prove an individual answered it or establish measurement sufficiency. No participant record was queried.

| Driver | Reference fields | Health weight | Complete actual score now |
|---|---:|---:|---|
| Cellular Hydration |53|1.4|Withheld|
| Systemic Detoxification |163|1.4|Withheld|
| Electrobiology Rhythms |34|1.2|Withheld|
| The Living Diet |47|1.3|Withheld|
| Functional Training |51|1.2|Withheld|
| Holistic Recovery |79|1.3|Withheld|
| Gastrointestinal Renovation |50|1.4|Withheld|
| Hormone Balancing |130|1.3|Withheld|
| Neural Repatterning |47|1.4|Withheld|
| Momentum Regimens |5|1.1|Withheld|
| Mentality Realignment |40|1.3|Withheld|
| Wise Budgeting |8|Separate1.0|Separate planning rubric unresolved; health deduction0|

Reproduce with `node scripts/generate-b51-readiness.cjs --check` and `node --test tests/b51-measurement-readiness.cjs`. The validator is test-only and absent from every public/runtime allowlist. It exercises proposed answer semantics, not adopted policy or clinical validity. No B5 contract, live question, source mapping, formula or weight changed.

### Exact follow-up implementation proposal for founder review

All proposed field names below are **future names**, not existing questionnaire fields. No choice is preselected. Each optional numeric answer has explicit “Not sure” and “Prefer not to answer” states; blank is unknown, never zero. Existing historical sources remain on their original immutable questionnaire version. Do not retrofit defaults or populate follow-ups from ordinal responses.

| Proposed item | Wording / answer choices | Placement, validation and compatibility |
|---|---|---|
| `b51_symptom_unique_days` | “During the past 30 days, on how many different days did you experience [selected symptom]?” Integer0–30 | After an individually selected, current symptom in Adult/Myself only. No follow-up for None, unselected, child/proxy or historical-only branches. Zero is explicit zero for this observation. |
| `b51_symptom_intensity` | “On days when it occurred, how intense was [selected symptom] typically?” Mild / Moderate / Severe / Not sure / Prefer not to answer | Show only when days>0. Unknown days do not imply current intensity. These labels have **no approved numerical weights**. |
| `b51_symptom_daily_impact` | “On those days, how much did [selected symptom] interfere with activities important to you?” Not at all / A little / Moderately / A lot / Unable to do those activities / Not sure / Prefer not to answer | Separate from intensity. No automatic clinical interpretation, impairment gate or diagnosis. Founder threshold approval required. |
| `b51_symptom_duration_exact_days` | “If you know, for how many days has this concern been recurring?” Integer0–36500 / Not sure / Prefer not to answer; “Is it still occurring?” Yes / No / Not sure | Exact recalled days only; no midpoint from “more than12 weeks.” Founder must decide whether reliable exact start date is preferred and how unknown duration affects provisional classification. Resolved findings cannot silently count as current burden. |
| `b51_habit_applicable_days`, `b51_habit_performed_days` | “On how many days in the past7 days was [approved specific behavior] applicable to your circumstances?” Then “On how many of those days did you do it?” | Integers0–7; performed≤applicable. Zero opportunities means inapplicable and no ratio; it is not failure. Missing either answer gives no ratio. Founders must define each behavior, role and limitation exceptions. |
| `b51_water_amount`, `b51_water_unit` | “Approximately how much plain water did you drink on a typical day over the past7 days?” Number≥0, then mL / L / US fluid ounces / Imperial fluid ounces | Unit required only for a known amount. “Ounces” or “cups” alone is ambiguous. Normalize only for comparison; **no hydration target or intake-adequacy label is approved**. No intake-adequacy threshold or unit-specific plausibility bound has been adopted. Founders must approve justified unit-aware validation before release. |
| `b51_optional_weight`, `b51_weight_unit` | “If you would like to provide it, what is your current body weight?” Number>0 + kg / lb / Not sure / Prefer not to answer | Optional and separately justified. No unit default; no requirement to weigh oneself. Founders must first decide whether weight is necessary at all. No weight-based hydration formula is approved. |
| `b51_budget_plan` | “Do you have a comfortable plan for optional health-related expenses?” Yes / Working on one / No / Prefer not to answer | Budget branch only; no income requirement, client eligibility gate or health/Spectrum deduction. Factual planning criteria remain unresolved. |

**Overlap decision still needed:** per-symptom unique-day counts do not identify the union of days across symptoms. They cannot prove that two observations happened on the same day or belong to one condition. Do not sum them as unique days or deduplicate them with an invented max/min rule. Founders must choose a justified primary-owner model, explicit grouping evidence and, only if required, a low-burden day selection/calendar. A professional diagnosis cannot be inferred from symptom descriptions.

### Independent function and factual proficiency remain founder-authored

Proposed common stem: “During the past30 days, how much did concerns with [specific function below] interfere with activities important to you?” Answer choices: Not at all / A little / Moderately / A lot / Unable / Not sure / Prefer not to answer. These are **eleven separate proposed observations**, not eleven copies of `body_allows_activities`; attribution and score conversion remain unapproved.

| Driver | Proposed function wording to edit/approve | Factual proficiency check still required |
|---|---|---|
| Hydration | maintaining comfortable drinking and usual daily hydration routines | Founder-authored observable skill/check; no self-confidence substitution |
| Detoxification | carrying out the specific everyday elimination/movement functions the founders select | Same; avoid implying measured toxin clearance |
| Electrobiology | maintaining a sleep–wake rhythm compatible with daily responsibilities | Same; no invented circadian diagnosis |
| Living Diet | planning, obtaining and preparing food compatible with one's circumstances | Same; no inferred nutrient adequacy |
| Training | performing the specific daily movements relevant to one's abilities | Same; accommodate limitation and applicability |
| Recovery | recovering enough between usual demands to resume chosen activities | Same; no clinical recovery claim |
| GI | carrying out usual activities without interference from digestive/bowel concerns | Same; stool type is not a diagnosis |
| Hormone | the specific daily functions affected by the selected pathway's reported concerns | Same; branch-aware and not a hormone-level measurement |
| Neural | concentrating, learning or remembering for personally relevant daily tasks | Same; self-rated confidence is not cognitive performance |
| Momentum | planning, beginning and returning to personally chosen routines | Same; distinguish opportunities from compliance |
| Mentality | engaging with personally important activities during emotional/stress-related concerns | Same; no psychiatric diagnosis or causal inference |

### Founder response procedure and explicit unresolved decisions

1. Justyn and Elle independently review the **fictional input sheets first** and fill their own expected ranges, classifications, reasons and maximum A/B/C spread before comparing against the candidate outputs. Record disagreement; do not tune formulas merely to reproduce a preferred number.
2. Review B's symptom-free numeric Chaos separately: distinguish current symptoms/function, habits/readiness and unsupported prediction. No interpretation is adopted by viewing a what-if result.
3. Complete every decision row above, including Peace90/95, cognitive/GI qualifications, Chronic grouping/exact persistence, multiple-condition Chaos impact, Driver-specific gates, exponent/breadth definitions, ownership and Budget's separate factual rubric. Blank means unresolved.
4. Approve exact proposed wording/branches/units and burden limits; define evidence needed for complete/partial/withheld outputs. Decide how incomplete historical versions remain withheld rather than backfilled.
5. Joint record template: reviewer(s) `___`; independent responses `___`; agreed decision version `___`; questionnaire/registry/adapter/config versions `___`; expected-output fixture IDs/ranges/reasons `___`; unresolved exclusions `___`; authenticated approval reference `___`. This static workbook is **not authenticated signoff**.

Actual-person scoring, source reads, cohort/pilot grants, proposal/draft activation, client report approval/release and email remain separately held. No external AI processing, additional consent checkbox or production/beta mutation is part of this package.
