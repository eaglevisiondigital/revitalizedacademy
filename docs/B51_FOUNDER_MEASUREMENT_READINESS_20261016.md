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