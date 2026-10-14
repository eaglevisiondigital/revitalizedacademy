# VITALITY ROADMAP | FOUNDER SCORING & APPROVAL WORKBOOK
Compiled October 14, 2026. Review with Justyn and Elle. Reference: the October 12 v0.14 Developer Handoff and Founder Completion Checklist (F01-F16). This workbook is a **decision aid**. **Candidate formulas and example questions are not approved policy.**

## 1. Single-page current calculation settings
The values below are reported from handoff v0.14. Distinguish **confirmed policy** from **candidate numerical implementation**. The founder expressly has **not finished** the detailed Driver scoring rubrics.

| Item | Existing v0.14 value/behavior | Policy status / founder signoff |
|---|---|---|
| Drivers | 12 total; 11 health plus separate Wise Budgeting | Names/framework established. Full scoring not approved |
| Habit recall | 30 days; use item-specific appropriate opportunities | CONFIRMED |
| Consistency: Never / Rarely / Sometimes / Often / Almost always | 0 / 10 / 30 / 70 / 100 points from 0%; >0 to <25%; 25 to <60%; 60 to <90%; 90 to 100% | Confirmed mapping, but requires appropriate opportunities per habit |
| Proficiency: Not established / Basic / Developing / Strong / Baseline met | 0 / 10 / 30 / 70 / 100 points | Shared tiers, item-specific factual rubrics PENDING |
| Habit support, if both dimensions applicable | 0.70 x consistency + 0.30 x proficiency | CONFIRMED; missing required data remains unscored |
| Role weights | Foundational habit weight 2; supporting habit weight 1 | CONFIRMED; exact set per Driver PENDING |
| Symptom intensity | Barely noticeable 5 / Mild 15 / Moderate 35 / Significant 70 / Severe 100 | CONFIRMED |
| Symptom frequency (unique days in last 30 days) | 1-3 days 10 / 4-14 days 35 / 15-26 days 70 / 27-30 days 100; explicit zero historical-only | CONFIRMED |
| Ongoing/recurrent duration | <2 weeks 0 / 2wk-<2mo 20 / 2-<6mo 40 / 6-<12mo 60 / 1-<3yr 80 / 3-<5yr 90 / >=5yr 100 | CONFIRMED bands, historical answer conversions PENDING |
| Impact over 30 days | Not at all 0 / Slightly 20 / Moderately 50 / Significantly 75 / Severely 100 | Scale confirmed; function/cap use PENDING |
| Health Driver weighted priorities | Six health Drivers with candidate weight 1.3, other five weight 1.0; Wise Budgeting separate | Priority distinction confirmed; exact **1.3:1** ratio PROPOSAL |
| Six higher-weight proposal Drivers | Cellular Hydration, Systemic Detoxification, The Living Diet, Functional Training, Gastrointestinal Renovation, Neural Repatterning | PROPOSAL |
| Concern blend | P_i = max(symptom burden B_i, independent function F_i); MeanP weighted mean; H = 100 - [0.75 x max(P) + 0.25 x MeanP] | PROPOSAL: 75/25 |
| Lifestyle blend | MeanL weighted mean lifestyle support; G=max[(weight_i / highest_health_weight) x (100-L_i)]; J=0.80 x MeanL + 0.20 x (100-G) | PROPOSAL: 80/20 |
| Combined unrounded health score | Raw = H^0.55 x J^0.45; if either factor 0, raw 0 | PROPOSAL: 55/45 |
| Wise Budgeting | BudgetIndex = (Planning + Preparedness)/2; deduction = 10 x (1 - BudgetIndex/100) | Equal internal dimensions and approximately 10-point maximum confirmed; exact curve PROPOSAL |
| Stage versus displayed scores | StagingScore = round-half-up(Raw) BEFORE budgeting deduction; DisplayedScore = round-half-up(max(0,Raw-Deduction)) | Proposed implementation distinction to review |
| Starting overall stages | Peace candidate 95-100; Impaired 80-94; Dysregulated 60-79; Chronic 40-59; Chaos 0-39 | Confirmed **starting bands**; Peace extra gates/other caps PENDING |
| Breadth caps | 3-5 independently Red health Drivers cap stage at best Dysregulated; 6+ cap stage at best Chronic; budget excluded | CONFIRMED |
| Individual Driver score | (100-P)^alpha x L^(1-alpha); alpha differs per Driver in rules.json | Formula/exponents PROPOSAL, needs per-Driver approval |
| Driver colors | Green 80-100, Yellow 50-79, Red 0-49 | PROPOSAL, founder to approve |
| Symptom breadth formula | Item=Intensity*(0.65+0.20*Frequency/100+0.10*Duration/100+0.05*SymptomImpact/100); Peak plus up to next four weighted items, with factor 0.65 | PROPOSAL, symptom-specific impact question unresolved |
| Hydration water benchmark | 0.5 US fl oz drinking water / lb daily, as RVA teaching benchmark only; not a physiological hydration measurement | CONFIRMED |
| Hydration drinking-water proficiency | Evidenced zero 0; >0 to <50% of benchmark 10; 50-<75% 30; 75-100% inclusive 70; above 100% 100 | CONFIRMED |
| Hydration electrolyte sources | 0,1,2,3,4+ mapped to 0,10,30,70,100; 4/day proposed minimum; mineral salt not mandatory | Source count/proficiency interpretation PENDING |
| Hydration Green gates | Any applicable day below benchmark blocks Green; every applicable day requires approved source minimum; 3 distinct current primary Hydration findings block Green | Trigger POLICY confirmed; 79-point numeric cap integration PROPOSAL/NOT IMPLEMENTED |
| Exclusions and missing data | Valid whole-habit exclusion removes weight; unknown required input requests information, never default 0 or 100 | CONFIRMED |
| Separate stage for EVERY Driver | Founder now explicitly requests this as well as overall stage | NEW REQUIREMENT; **no per-Driver stage mapping exists yet**. Do not equate colors to stages or invent mapping |
| Questionnaire | May require additional evidence-based questions for complete normalized inputs | Founder approved investigating amendments; exact fields/options/consent pending |

### Founder review outcomes requested
Provide a column-by-column response: **Approve unchanged / Revise / Need comparison examples**. Ask engineering to simulate fixed scenarios and show why a score/stage changes. Do not ask founders to author code or complete formula algebra themselves.

## 2. F01-F16 completion status after founder reply

| Item | Status after Oct 14 answer | Next required action |
|---|---|---|
| F01 Hydration source rules | OPEN | Confirm 0/1/2/3/4+, distinct sources, mixed dishes, repeats, aliases and Other |
| F02 Hydration questionnaire additions | OPEN | Review weight/water units, 30-day mean, days below, regular source list, days below source threshold, overlaps, impacts and required/optional |
| F03 Hydration Green & function | OPEN | Approve proposed 79 cap, life-impact independent function measure and exclusion interactions |
| F04 Other 10 health-Driver rubrics | OPEN | One scored-habit/recommendation definition card per Driver |
| F05 Wise Budgeting rubrics | OPEN | Define planning/management and preparedness/access questions and evidence |
| F06 Symptom ownership/duplicates | OPEN | Confirm 190-term mapping, Hydration additions, primary owner and strict duplicates |
| F07 Math thresholds/weights | OPEN | Compare scenarios then approve/revise 75/25, 80/20, 55/45, 1.3, exponents, symptom factors, caps, Peace criteria and Driver colors |
| F08 Adaptive/missing Driver logic | OPEN | Clarification versus exclusion, adapted measurement, no valid habits |
| F09 Launch pathways | DECIDED | **Adult-first**; hold unsupported child/teen scores pending separate rubrics. Exact adult/child boundary at age 18 still requires reconciliation |
| F10 Review/override/release owners | PARTLY DECIDED | Justyn and Elle initial primary reviewers, full edit/clarification/regenerate/approve. Design approvals and escalation/conflict handling |
| F11 Flags, consent, escalation, retention | OPEN | Standard nonmedical disclaimer only confirmed; need exact red flags, consent, data reuse, escalation, retention |
| F12 Report content/classification | PARTLY DECIDED | Approved six-page visual style, all 12 searchable/filterable; overall + per-Driver stages. Define each Driver's stage rule and priority tie logic |
| F13 Recommendations/knowledge base | PARTLY DECIDED | Algorithm suggests strengths/opportunities/priorities with explanations; reviewers override and propose improvements to versioned KB. Approve actual text and conditional applicability |
| F14 Brand/delivery/destinations | PARTLY DECIDED | Premium mockup approved, secure website + PDF, standard disclaimer; $250 consultation, eligible affiliate $50 discount; payment/calendar still pending |
| F15 Independent test cases | OPEN | Founder proposed learning on permissioned real submissions, but no independent expected-result set delivered. Build 10-20 founder-verified de-identified/synthetic cases |
| F16 Pilot launch scope and acceptance | PARTLY DECIDED | Adult-only, Justyn/Elle review. Define report quality rubric, acceptance scores, audit and rollout criterion |

## 3. One standard Driver definition card, to complete 12 times

1. **Driver name/definition**: what is actually measured; how is it distinct from other Drivers?
2. **Required scoring inputs**: questionnaire field IDs, answer choices and conditional prompts (engineering extracts actual IDs).
3. **Scored habits**: every intended foundational/supporting habit, item-specific opportunity count, recall period.
4. **Proficiency evidence**: verifiable criteria for 0/10/30/70/100; is an approved consistency-only mode justified?
5. **Symptoms and strict primary ownership**: synonyms, duplicate handling, distinct observations, escalation.
6. **Independent function**: which separate answer measures daily limitation and with what mapped scale?
7. **Life impact / context**: what is a separate score input versus explanation-only context?
8. **Applicable exceptions**: adaptations, reviewed inapplicability, missing/unknown/declined, and whole-Driver handling.
9. **Green/Yellow/Red rules**: score bands, blocking findings, required evidence and caps.
10. **Overall Health Spectrum relation**: can Driver findings cap the overall stage, and under which exact evidence?
11. **Per-Driver Spectrum stage**: exact Chaos/Chronic/Dysregulated/Impaired/Peace thresholds and evidence gates. NEW founder requirement, not inherited automatically from color.
12. **Candidate explanations**: hopeful, non-diagnostic interpretation by stage/color and actual answer evidence.
13. **Recommendations**: approved first steps, prerequisites, avoidances, applicability and when to seek qualified healthcare input.
14. **Ranked priorities/opportunities**: selection signals, tie-breakers and coach override cases.
15. **Three complete raw-answer worked cases**: expected score, color, stage, top-reason, recommended action and explanation.
16. **Owner/version/signoff**: reviewer name, approval date, question/rule/content version and any unresolved items.

One card for each:
1. Cellular Hydration
2. Systemic Detoxification
3. Electrobiology Rhythms
4. The Living Diet
5. Functional Training
6. Holistic Recovery
7. Gastrointestinal Renovation
8. Hormone Balancing
9. Neural Repatterning
10. Momentum Regimens
11. Mentality Realignment
12. Wise Budgeting (use its two distinct financial dimensions, NOT a generic health-Driver blend or stage caps)

## 4. Prioritization/ranker review checklist (founder J04/J05)
Justyn wants auto-ranked **strengths**, **opportunities**, and **priorities** with a coach-facing WHY, plus overrides.

Questions to approve:
- Priority relevance: low Driver score vs symptom severity, long-duration burden, life impact, daily function, core habits, customer stated goal and safety escalation. Which factor can override numeric rank?
- Strength: evidence-supported established habits vs higher Driver score. Require enough answers? What counts as a reliable strength?
- Opportunity: improving one manageable behavior with feasible support; need relevance to chosen goals, resources, life stage, access?
- Should a single finding appear in more than one category? How should ties and overlaps be handled?
- When can a coach remove/reorder/add any selection? Require an override reason, evidence and reviewer identity?
- Display separate justifications internally and hopeful, audience-appropriate approved explanations externally.
- Never rank a low-confidence/incomplete Driver as definitively healthy or unhealthy.

Required engine output **for each item**: category, priority order, linked Driver(s), supporting question/answer references, validated scoring and other rules that triggered, alternatives considered, confidence/coverage, reason displayed to reviewer, approved client-friendly wording, override history, content version.

## 5. Questionnaire modifications: engineering should supply founder-ready change sheets
For each potentially necessary input provide:
- **Existing actual field and option IDs** from production form and current compilation, prompt and response choices, routing and required status.
- **Algorithm measurement that needs it** (symptom days, duration, intensity, independent function, factual proficiency, source counts, habit opportunities, quality of life, other).
- What is already measured and what is missing. Mark uncertain, declined, explicit zero and genuinely inapplicable distinctly.
- Proposed extra wording/options/conditional logic and whether adult/child/proxy applies.
- Small example of how an answer would affect a calculation/score or clarification, with appropriate safety wording.
- Founder response slot: approve wording / revise / drop / need example.

Start with Hydration W1-H2 and one complete Driver, then repeat for remaining Drivers. Maintain original valid save/resume and questionnaire versions without silently converting historical answers.

## 6. Algorithm pilot and learning quality gate
- Separate algorithm calibration, report wording accuracy and marketing/user usefulness evaluations.
- Synthetic and permissioned de-identified real submissions may supply *inputs*; independent Justyn/Elle expected interpretations are the acceptance targets. Do not test the model only against its own previously generated reports.
- Cases cover strong/weak foundations, multiple moderately concerning findings, one severe concern, budgets, explicit unknowns, exclusions, duplicates, thresholds, child routing hold and contradiction.
- Every submitted coach correction can propose a knowledge-base entry but is **not automatically published**.
- Before new rule/KB version: test complete cases, compare interpretations with former version, require editorial/staff approval, version everything and preserve prior released outputs.
- Target user comprehension and actionability via voluntary feedback; keep health information secure, consented and appropriately minimized.
- "Better over time" means fewer unsupported claims, clearer useful steps, safer recommendations and improved alignment with reviewer-expected outcomes; not necessarily larger scores or increased paid conversions.

## 7. Work package order and dependencies
A. Extract actual adult production questionnaire field/answer IDs and current portal review/permissions schema (engineering, can start now).
B. Build scoring-review workbook implementation and scenario comparisons (engineering, founders approve).
C. Implement adult-only versioned scoring adapter and all Driver stages after rubrics signed off (blocked on F01-F08/F12).
D. Build reusable source-grounded interpretation/knowledge-base proposal/review/publish workspaces (structure now; content after founder review).
E. Build founders' review and senior-release workflow and persistent free report/PDF infrastructure with strict RLS (structure now).
F. Build Holistic Foundations action/habit/reflections experience with 40-day milestone plans (after entitlement and plan joins).
G. Integrate $250 paid personal review, authorized affiliate $50 discount and booking **only after** provider, checkout, calendar, commission/refund rules and consent approved.
H. Begin adult-only supervised pilot with independent cases and safety flags, then later revisit coaching self-approval, children and automated release.
