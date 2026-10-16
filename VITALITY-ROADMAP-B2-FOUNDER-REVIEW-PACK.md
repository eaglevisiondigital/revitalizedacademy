# B2 founder review pack — candidate calculations

Built from B1 PR #26, not production main. No rule/stage approval, real-source score, medical interpretation or client release is implied.

## B2.1 is the current calibration profile

Open **B2.1 founder calibration · Candidate / Not Approved** in the isolated Roadmap workspace. Select one of 50 fictional cases; compare the purpose-built answer sheet and provisional Roadmap, expand all twelve Drivers and the WHY/trace, then use **Candidate rules & definitions** for reasoned session-only revisions. **Corrections & review packet** records Agree/Disagree/Need more information and independent expected scores/stages. Downloads contain fictional comparison proposals only, not approved policy or authenticated signoff. Do not enter actual participant information into correction fields. Actual-source review is a separate read-only, unscored tab.

Current health weights: Hydration/Neural/Detox/GI **1.4**; Hormone/Diet/Recovery/Mentality **1.3**; Electrobiology/Functional **1.2**; Momentum **1.1**. Budget **1.0 separate, zero health deduction**. Five provisional bands start at **95/80/60/40/0**, with explicit Peace/current symptoms/impact, cognitive, GI, persistent-condition and daily-effect rules. These definitions remain candidate settings, not approved diagnostic classifications.

**Unresolved calibration:** fictional A=70.65972, B=35.48134, C=70.00000. A is slightly above C but far above B; the current formula does not satisfy the founder's close-score direction. Founders must supply independent expected ranges/spread and confirm the answer sheets before formula changes. Other exact decisions: qualifying intensity/frequency/impact; conditions versus diagnoses versus symptoms; distinct-group deduplication; Chaos each-group versus any-group impact; persistent infrequent Driver-local ceiling; Peace 90 versus 95 and habit/function minimums; overlapping rules; remaining factual rubrics, source conversions and curated symptom–habit links.

The sections below preserve the original B2 profile and 30 cases for historical comparison. The six-Driver 1.3 weight proposal, ten-point budget deduction and unconfigured Driver stages below are superseded in **B2.1**, not current policy. [Current implementation, tests and release boundary](VITALITY-ROADMAP-B21-IMPLEMENTATION-20261015.md).

**B3 readiness continuation:** use [the independent decision worksheet](VITALITY-ROADMAP-B3-FOUNDER-DECISIONS.md) and [the source/data-boundary report](VITALITY-ROADMAP-B3-READINESS-20261016.md). No live scoring or pilot execution is authorized.

## How Justyn and Elle can review

1. Open the isolated B2 staff preview and sign in with an existing beta Owner account.
2. People → Vitality Roadmaps → Founder calculation workbench.
3. Start with fixed scenarios and their disclosed assumptions, then compare proposed parameters.
4. Use the 12 Driver cards to propose each Driver exponent and stage thresholds; blank stages stay unconfigured.
5. Review actual source coverage separately; no real-source score is calculated.
6. Record Agree for candidate testing / Revise / Need comparison with a reason and download the candidate handoff.
7. Return the packet for deliberate repository/founder signoff. Session-only selections are not saved automatically. A download is not authenticated policy approval.

## Shared policy versus engineering proposals

- **habitRecallDays:** confirmed: 30, appropriate opportunities required
- **habitBlend:** confirmed: 70% consistency / 30% factual proficiency
- **roleWeights:** confirmed: foundational 2 / supporting 1; assignments pending
- **symptomScales:** confirmed shared scales; source conversions/ownership pending
- **concernPeak:** proposal: 75% worst / 25% weighted mean
- **lifestyleMean:** proposal: 80% mean / 20% weighted weakest gap
- **healthExponent:** proposal: geometric blend 55% concern / 45% lifestyle
- **higherWeight:** proposal: six Drivers weighted 1.3
- **driverAlpha:** engineering comparison: 0.5 for all health Drivers; no approved exponents supplied
- **symptomBreadth:** engineering comparison variants; workbook does not specify the complete peak/next-four expression
- **electrolyteSourceCount:** proposal: 0/1/2/3/4+ distinct sources → 0/10/30/70/100; source definitions/minimum remain unapproved
- **hydrationCap:** proposal: cap Driver score/color at 79 when Green-blocking evidence exists; H/J are unchanged by this cap, pending founder integration decision
- **colorBands:** proposal: unrounded score >=80 Green, >=50 Yellow, otherwise Red
- **driverStages:** not configured; never inferred from color
- **ranker:** engineering comparison: deterministic score/concern/gap order, canonical Driver tie-break; no clinical recommendations
- **budgetDeduction:** proposal: linear 10-point maximum, excluded from health-stage assignment
- **overallBands:** confirmed starting bands only; Peace gates and interpretation not approved

Additional disclosures: same Driver alpha 0.5 is an illustrative starting comparison because approved per-Driver exponents were not supplied. Symptom peak/next-four expressions are two explicit engineering alternatives; the workbook supplies factors but not a complete expression. The fixed next-four mean divides by four. All proposed colors use unrounded scores. Unconfigured Driver stages remain null; colors are never converted to stages. Driver-only Green caps do not automatically alter overall H/J in this profile; founder integration decision remains pending.

## Current source contract

Compiled from the unchanged adult questionnaire: **743 field IDs**, **190 named symptom observations**. Exact options, routing conditions and required attributes are in config/roadmap-b2/source-map.json; dynamic IDs are generated by the actual questionnaire code in a blocked-network DOM. Source hashes:

- consult.html: aa2cebc36132f32e6f0b7f4032d0dcfc6b91e2ff0ff0bb137b28557667f643f4
- js/vitality55.js: f37245fe91407b8e2b02fbbebf91cf4af32f468ef67e321753f8d91ce0c4af59

Snapshot version 1 alone cannot establish the exact historic questionnaire code hash. Current IDs are reference metadata, not proof of historical calculation coverage. Unmatched questionnaire versions receive context-only review. No hidden answers, participant identities or real submission values are in this pack.

## Actual-source gaps and proposed questionnaire amendments

These are draft measurement proposals only; no field is added to the production questionnaire. Proposed keys below are placeholders for review, not existing source IDs.

| Measurement | Current source | Gap / proposed next question |
| --- | --- | --- |
| Water consistency | water_intake_consistency | Subjective sufficient-water response does not establish amount or applicable opportunities. |
| Water benchmark | No weight/water-volume fields | Proposal: measured weight + lb/kg, typical drinking-water amount + US fl oz/mL/litre, explicit 30-day context. |
| Water daily gate | No exact below-benchmark days | Proposal: applicable days and unique days below benchmark, with Unknown and reviewed inapplicability separate. |
| Electrolyte sources | electrolyte_consistency | Proposal: distinct approved sources, count and days below proposed minimum; source definitions, repeats/aliases/mixed dishes and Other need founder approval. |
| Factual proficiency | hydration_proficiency and movement confidence prompts | Confidence is context, not demonstrated technique/measurement. Define factual criteria for each habit. |
| Symptom frequency | *_frequency: Rarely / Sometimes / Often / Almost Daily | Proposal: unique current days in last 30 (0–30), with explicit Unknown and zero historical-only behavior. No ordinal midpoint conversion. |
| Duration | *_duration | Less than 2wk, 2wk–2mo, 2–3mo fit confirmed bands. >3mo–1yr and >1yr cross bands and remain unknown. Propose exact non-overlapping confirmed bands. |
| Intensity / impact | *_disruption | Current disruption prompt cannot prove two separate intensity and symptom-impact measures. Propose separate approved questions. |
| Independent Driver function | health_interference and QoL are overall/context | Define a separate function question/rubric per Driver; do not reuse one global limitation as eleven independent findings. |
| Budget | wellness_budget, unexpected_health_expense, budget_priority_confidence, spending/context | Define two factual planning/management and preparedness/access rubrics; do not score income/spending amount or confidence by assumption. |

Each proposed amendment still needs exact wording/options, adult/proxy applicability, required/optional behavior, consent/version and save/resume acceptance before any intake change.

## Twelve Driver definition cards

### Cellular Hydration

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **hydration_symptoms**: Which of these have you experienced during the last 30 days? — Strong thirst / Dry mouth / Dry lips / Dark/concentrated urine / Frequent headaches / Lightheadedness when standing / Muscle cramping / Exercise-related cramping / Fatigue / Constipation/hard stool / Feeling unusually thirsty despite drinking frequently / Very frequent urination / Waking repeatedly to urinate / Difficulty tolerating heat / Other / None of these
- **hydration_other**: If you selected Other, tell us more. — textarea context
- **water_source**: What is your primary drinking water source? — Properly filtered/remineralized water / Well water / Spring water / Municipal tap water / Reverse osmosis / Bottled water / Water filter - unsure what type / Other / I don't know
- **water_filtration_mineralization**: Optional: Tell us about your filtration or mineralization approach. — textarea context
- **water_intake_consistency**: How consistently do you drink enough water to comfortably satisfy your body's needs? — Never / Rarely / Sometimes / Often / Almost always / I don't know
- **electrolyte_consistency**: How consistently do you consume meaningful food or beverage sources of electrolytes such as sodium, potassium and magnesium? — Never / Rarely / Sometimes / Often / Almost always
- **hydration_proficiency**: How confident are you that you understand how to hydrate properly rather than simply drinking more water? — I don't understand it yet / Beginner / Somewhat confident / Very confident / I have a strong system that works for me
- **hydration_strengths**: Which are already strengths? — Good drinking water / Consistent water intake / Good electrolyte intake / Minimal excessive alcohol / Appropriate hydration around exercise / I recognize thirst/dehydration signals well

Three complete fictional arithmetic comparisons:

- Cellular Hydration · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Cellular Hydration · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Cellular Hydration · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Systemic Detoxification

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **urinary_symptoms**: Which of these have you experienced during the last 30 days? — Very dark urine / Unusually foamy urine / Strong/unusual urine odor / Excessive urinary frequency / Significant urgency / Facial/hand/ankle swelling / Persistent flank/lower-back discomfort / Blood in urine / Painful urination / None of these
- **pale_yellow_urine**: How often does your urine generally fall in a pale-yellow range? — Never / Rarely / Sometimes / Often / Almost always
- **liver_bile_symptoms**: Which of these have you experienced during the last 30 days? — Pale/clay-colored stool / Frequently greasy/floating stool / Nausea after fatty foods / Discomfort beneath the right ribs / Persistent unexplained itching / Strong food intolerance after high-fat meals / Yellowing of eyes/skin / Persistent severe pain / None of these
- **lymphatic_symptoms**: Which of these have you experienced during the last 30 days? — Persistent puffiness/swelling / Heavy-feeling limbs / Tender/enlarged lymph nodes / Persistent congestion / Frequent unexplained swelling / Generalized tenderness / Difficulty becoming physically warm/sweating during activity / None of these
- **whole_body_movement**: How frequently do you move your whole body throughout the day? — Never / Rarely / Sometimes / Often / Almost always
- **sedentary_periods**: How often are you sedentary for long uninterrupted periods? — Never / Rarely / Sometimes / Often / Almost always
- **walking_regularity**: How regularly do you walk? — Never / Rarely / Sometimes / Often / Almost always
- **overnight_recovery_symptoms**: Which of these have you experienced during the last 30 days? — Wake with brain fog / Morning headache / Morning mental fatigue / Difficulty feeling fully awake / Poor memory in the morning / Frequent nighttime awakening / Wake feeling unrefreshed despite enough time in bed / None of these
- **reproductive_screen_path**: Which screening pathway is relevant to you? — Female / Male
- **reproductive_female_symptoms**: Which of these have you experienced during the last 30 days? — Significant menstrual clotting / Very heavy menstrual bleeding / Significant pelvic pressure/bloating / Spotting between periods / Unusual cycle-associated swelling / Significant pelvic pain / None of these [conditional reproductive_screen_path:Female]
- **reproductive_male_symptoms**: Which of these have you experienced during the last 30 days? — Persistent pelvic discomfort / Painful ejaculation / Urinary changes / Erectile changes / Significant libido decline / None of these [conditional reproductive_screen_path:Male]
- **lungs_symptoms**: Which of these have you experienced during the last 30 days? — Shortness of breath / Difficulty taking a comfortable deep breath / Wheezing / Persistent cough / Chronic throat clearing / Chest congestion / Poor tolerance for normal cardiovascular activity / Frequent mouth breathing / None of these
- **lung_exposures**: Which exposures currently apply? — Smoking / Vaping / Secondhand smoke / Workplace dust/fumes / Mold/dampness concerns / Poor indoor ventilation / None of these

Three complete fictional arithmetic comparisons:

- Systemic Detoxification · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Systemic Detoxification · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Systemic Detoxification · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Electrobiology Rhythms

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **electrobiology_symptoms**: Which of these have you experienced during the last 30 days? — Difficulty falling asleep / Difficulty waking / Inconsistent energy rhythm / Late-night alertness / Morning grogginess / Brain fog / Poor concentration / Headaches / Restlessness at night / None of these
- **sleep_wake_consistency**: How consistent is your sleep/wake schedule? — Never / Rarely / Sometimes / Often / Almost always
- **morning_daylight**: How soon after waking do you normally get outside into natural daylight? — <15 minutes / 15–30 minutes / 30–60 minutes / 1–2 hours / Usually later / Rarely
- **evening_light_exposure**: During the 2 hours before bed, how much bright artificial light or screen exposure do you typically have? — Very little / Low / Moderate / High / Very high
- **device_habits**: Which device habits commonly apply? — Sleep beside my phone / Use screens in bed / Keep Bluetooth devices on my body for long periods / Spend most of the day around screens/electronics / Have Wi-Fi equipment near sleeping areas / None of these
- **outdoor_time**: How much time do you normally spend outdoors? — Very little / Less than 30 minutes/day / 30–60 minutes/day / 1–2 hours/day / More than 2 hours/day
- **grounding_frequency**: How frequently do you spend time barefoot or directly connected with natural outdoor environments? — Never / Rarely / Weekly / Several times a week / Daily

Three complete fictional arithmetic comparisons:

- Electrobiology Rhythms · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Electrobiology Rhythms · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Electrobiology Rhythms · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### The Living Diet

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **living_diet_symptoms**: Which of these have you experienced during the last 30 days? — Reflux / Burping / Heavy/full feeling after eating / Bloating soon after meals / Nausea / Feeling sleepy after meals / Significant energy crash / Poor appetite / Excessive hunger / Strong cravings / None of these
- **eating_eat_slowly_enough_to_chew_thoroughly**: How often do you eat slowly enough to chew thoroughly? — Never / Rarely / Sometimes / Often / Almost always
- **eating_eat_while_relatively_relaxed**: How often do you eat while relatively relaxed? — Never / Rarely / Sometimes / Often / Almost always
- **eating_eat_without_significant_distraction**: How often do you eat without significant distraction? — Never / Rarely / Sometimes / Often / Almost always
- **eating_stop_eating_when_comfortably_satisfied**: How often do you stop eating when comfortably satisfied? — Never / Rarely / Sometimes / Often / Almost always
- **eating_consume_mostly_whole_minimally_processed_foods**: How often do you consume mostly whole/minimally processed foods? — Never / Rarely / Sometimes / Often / Almost always
- **eating_include_fermented_foods_if_tolerated**: How often do you include fermented foods if tolerated? — Never / Rarely / Sometimes / Often / Almost always
- **eating_avoid_habitual_overeating**: How often do you avoid habitual overeating? — Never / Rarely / Sometimes / Often / Almost always
- **eating_maintain_an_eating_rhythm_that_works_well_for_you**: How often do you maintain an eating rhythm that works well for you? — Never / Rarely / Sometimes / Often / Almost always
- **nutrition_protein**: How confident are you that your diet consistently provides enough protein? — Not confident / Slightly confident / Somewhat confident / Very confident / Highly confident
- **nutrition_essential_fats**: How confident are you that your diet consistently provides enough essential fats? — Not confident / Slightly confident / Somewhat confident / Very confident / Highly confident
- **nutrition_carbohydrate_appropriate_for_activity**: How confident are you that your diet consistently provides enough carbohydrate appropriate for activity? — Not confident / Slightly confident / Somewhat confident / Very confident / Highly confident
- **nutrition_fiber**: How confident are you that your diet consistently provides enough fiber? — Not confident / Slightly confident / Somewhat confident / Very confident / Highly confident
- **nutrition_minerals**: How confident are you that your diet consistently provides enough minerals? — Not confident / Slightly confident / Somewhat confident / Very confident / Highly confident
- **nutrition_vitamins**: How confident are you that your diet consistently provides enough vitamins? — Not confident / Slightly confident / Somewhat confident / Very confident / Highly confident
- **nutrition_colorful_plants_antioxidant_rich_foods**: How confident are you that your diet consistently provides enough colorful plants/antioxidant-rich foods? — Not confident / Slightly confident / Somewhat confident / Very confident / Highly confident
- **whole_food_percentage**: Approximately what percentage of your diet is minimally processed whole food? — <25% / 25–49% / 50–69% / 70–79% / 80–89% / 90%+

Three complete fictional arithmetic comparisons:

- The Living Diet · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- The Living Diet · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- The Living Diet · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Functional Training

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **functional_training_symptoms**: Which of these have you experienced during the last 30 days? — Recurring pain during movement / Joint stiffness / Limited range of motion / Poor balance / Poor coordination / Low strength / Low endurance / Frequent exercise-related injury / Fear of certain movements / Difficulty getting off the floor / Difficulty lifting/carrying everyday objects / None of these
- **movement_squatting**: How confident are you with squatting? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **movement_hinging**: How confident are you with hinging? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **movement_pushing**: How confident are you with pushing? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **movement_pulling**: How confident are you with pulling? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **movement_carrying**: How confident are you with carrying? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **movement_lunging**: How confident are you with lunging? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **movement_rotating**: How confident are you with rotating? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **movement_balancing**: How confident are you with balancing? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **movement_running_jumping_when_appropriate**: How confident are you with running/jumping when appropriate? — Not able / not appropriate / Not confident / Somewhat confident / Very confident / Highly confident
- **training_sessions_weekly**: How many purposeful training sessions do you average per week? — 0 / 1–2 / 3–4 / 5–6 / 7+
- **training_program**: Which best describes your current training? — No program / Exercise randomly / Basic routine / Structured progressive program / Structured individualized program
- **performance_strength**: How would you rate your strength? — range context
- **performance_mobility**: How would you rate your mobility? — range context
- **performance_cardiovascular_fitness**: How would you rate your cardiovascular fitness? — range context
- **performance_speed_power_where_relevant**: How would you rate your speed/power where relevant? — range context
- **performance_athletic_confidence**: How would you rate your athletic confidence? — range context
- **body_allows_activities**: Does your body allow you to physically do the things you want to do? — Never / Rarely / Sometimes / Often / Almost always

Three complete fictional arithmetic comparisons:

- Functional Training · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Functional Training · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Functional Training · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Holistic Recovery

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **recovery_sleep_symptoms**: Which of these have you experienced during the last 30 days? — Difficulty falling asleep / Frequent waking / Early waking / Snoring / Waking unrefreshed / Daytime sleepiness / Needing stimulants to function / Irregular sleep schedule / None of these
- **recovery_breathing_symptoms**: Which of these have you experienced during the last 30 days? — Habitual mouth breathing / Shallow breathing / Breath holding under stress / Poor tolerance for nasal breathing / Feeling chronically “air hungry” / None of these
- **recovery_nervous_system_symptoms**: Which of these have you experienced during the last 30 days? — Feeling wired but tired / Difficulty relaxing / Easily startled / Constant internal tension / Unable to mentally switch off / None of these
- **recovery_capacity_symptoms**: Which of these have you experienced during the last 30 days? — Excessive soreness / Poor recovery after exercise / Constant fatigue / Need several days to recover from normal activity / None of these
- **recovery_behavior_regular_sleep_schedule**: How consistent are you with regular sleep schedule? — Never / Rarely / Sometimes / Often / Almost always
- **recovery_behavior_relaxation_decompression**: How consistent are you with relaxation/decompression? — Never / Rarely / Sometimes / Often / Almost always
- **recovery_behavior_rest_days**: How consistent are you with rest days? — Never / Rarely / Sometimes / Often / Almost always
- **recovery_behavior_walking_light_movement**: How consistent are you with walking/light movement? — Never / Rarely / Sometimes / Often / Almost always
- **recovery_behavior_mobility**: How consistent are you with mobility? — Never / Rarely / Sometimes / Often / Almost always
- **recovery_behavior_breathwork**: How consistent are you with breathwork? — Never / Rarely / Sometimes / Often / Almost always
- **recovery_behavior_appropriate_recovery_after_training**: How consistent are you with appropriate recovery after training? — Never / Rarely / Sometimes / Often / Almost always
- **temperature_tolerance**: How well do you tolerate normal changes in hot and cold environments? — Very poorly / Poorly / Moderately / Well / Very well
- **temperature_practices**: Optional: Do you use any hot or cold exposure practices? — textarea context

Three complete fictional arithmetic comparisons:

- Holistic Recovery · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Holistic Recovery · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Holistic Recovery · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Gastrointestinal Renovation

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **bowel_movement_frequency**: How often do you usually have a bowel movement? — 2–4/day / 1/day / Every other day / Fewer than 3/week / Highly variable / Multiple loose movements/day
- **bristol_stool_types**: Which Bristol Stool Chart types are most common for you? — Type 1 - separate hard lumps / Type 2 - lumpy sausage / Type 3 - cracked sausage / Type 4 - smooth, soft sausage / Type 5 - soft blobs / Type 6 - mushy pieces / Type 7 - watery
- **colon_symptoms**: How often do you experience these bowel patterns? — Straining / Incomplete evacuation / Bloating/pressure / Urgency / Diarrhea / Constipation / None of these
- **colon_follow_up**: If bowel habits concern you, optionally describe bathroom duration, pain, major changes, or worsening with dietary/supplement changes. — textarea context
- **gi_symptoms**: Which of these have you experienced during the last 30 days? — Gas / Cramping / Abdominal pain / Reflux / Food-triggered symptoms / Mucus / Unpredictable stools / None of these
- **plant_food_diversity**: In a typical week, how diverse is your intake of plant foods (such as vegetables, fruit, beans, nuts, and seeds)? — Very limited / Limited / Moderate / Diverse / Very diverse
- **fermented_foods**: How regularly do you eat fermented foods (such as yogurt, kefir, or sauerkraut) if tolerated? — Never / Rarely / Sometimes / Often / Almost always
- **fiber_whole_foods**: How consistently do you consume fiber-rich whole foods (such as chia seeds, carrots, and legumes)? — Never / Rarely / Sometimes / Often / Almost always
- **antibiotics_last_year**: Have you used antibiotics within the last 12 months? — No / Yes / Prefer not to answer
- **microbiome_testing**: Have you previously completed microbiome/stool testing? — No / Yes
- **microbiome_testing_details**: Optional notes about prior testing. — textarea context [conditional microbiome_testing:Yes]

Three complete fictional arithmetic comparisons:

- Gastrointestinal Renovation · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Gastrointestinal Renovation · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Gastrointestinal Renovation · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Hormone Balancing

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **hormone_pathway**: Which pathway best fits you right now? — Male / Female cycling / Pregnant / Postpartum / Perimenopause / Menopause / Prefer not to answer
- **hormone_everyone_symptoms**: Which of these have you experienced during the last 30 days? — Libido changes / Energy changes / Recovery changes / Body composition changes / Hair changes / Skin changes / Temperature regulation changes / Mood instability / Sleep changes / Fertility concerns / None of these
- **cycle_length**: What is your typical cycle length? — textarea context [conditional hormone_pathway:Female cycling]
- **hormone_cycling_symptoms**: Which of these have you experienced during the last 30 days? — Irregular cycles / Heavy bleeding / Significant cramping / PMS / Changes in ovulation signs / Mid-cycle pain / Spotting / Breast tenderness / Menstrual migraines / Fertility concerns / None of these [conditional hormone_pathway:Female cycling]
- **pregnancy_trimester**: Current trimester — First / Second / Third / Prefer not to answer [conditional hormone_pathway:Pregnant]
- **hormone_pregnancy_symptoms**: Which of these have you experienced during the last 30 days? — Low energy / Sleep challenges / Nausea / Emotional well-being concerns / None of these [conditional hormone_pathway:Pregnant]
- **pregnancy_medical_support**: Do you currently have medical support for your pregnancy? — Yes / No / Prefer not to answer [conditional hormone_pathway:Pregnant]
- **months_postpartum**: How many months postpartum are you? — textarea context [conditional hormone_pathway:Postpartum]
- **breastfeeding**: Are you breastfeeding? — Yes / No / Prefer not to answer [conditional hormone_pathway:Postpartum]
- **cycle_returned**: Has your cycle returned? — Yes / No / Not applicable / prefer not to answer [conditional hormone_pathway:Postpartum]
- **hormone_postpartum_symptoms**: Which of these have you experienced during the last 30 days? — Recovery challenges / Sleep challenges / Libido changes / Pelvic symptoms / Mood changes / Fatigue / None of these [conditional hormone_pathway:Postpartum]
- **hormone_menopause_symptoms**: Which of these have you experienced during the last 30 days? — Hot flashes / Night sweats / Cycle changes / Sleep disruption / Libido changes / Vaginal symptoms / Mood changes / Body composition changes / Cognition changes / None of these [conditional hormone_pathway:Perimenopause|Menopause]
- **hormone_exposure_markers**: How frequently do these exposure markers apply? — Heating food in plastic / Heavy fragrance use / Occupational chemical exposure / Frequent pesticide exposure / High reliance on highly processed packaged food / None of these

Three complete fictional arithmetic comparisons:

- Hormone Balancing · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Hormone Balancing · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Hormone Balancing · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Neural Repatterning

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **neural_symptoms**: Which of these have you experienced during the last 30 days? — Memory problems / Difficulty concentrating / Difficulty starting tasks / Difficulty completing tasks / Slower thinking / Decision fatigue / Difficulty problem-solving / Excessive worry/prediction / Intrusive thinking / Lack of creativity/imagination / Mental fatigue / None of these
- **stress_overwhelm**: How frequently do you feel overwhelmed by stress? — Never / Rarely / Sometimes / Often / Almost always
- **stress_return_to_baseline**: How quickly do you return to baseline after stressful situations? — Very slowly / Slowly / It varies / Quickly / Very quickly
- **stimulation_habits**: Which stimulation patterns regularly apply? — Check my phone automatically / Struggle to tolerate boredom / Need constant entertainment / Jump rapidly between tasks / Consume short-form content for long periods / Feel unable to focus without stimulation / Use caffeine/stimulation to overcome mental fatigue / None of these
- **challenging_learning**: How frequently do you deliberately learn something challenging? — Never / Rarely / Sometimes / Often / Almost always
- **memory_skill_activities**: How often do you perform activities that require memory, problem-solving or skill development? — Never / Rarely / Sometimes / Often / Almost always
- **cognitive_attention**: Attention — range context
- **cognitive_memory**: Memory — range context
- **cognitive_executive_function**: Executive function — range context
- **cognitive_processing_speed**: Processing speed — range context
- **cognitive_emotional_regulation**: Emotional regulation — range context
- **cognitive_creativity**: Creativity — range context
- **cognitive_learning**: Learning — range context
- **cognitive_mental_stamina**: Mental stamina — range context

Three complete fictional arithmetic comparisons:

- Neural Repatterning · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Neural Repatterning · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Neural Repatterning · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Momentum Regimens

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **daily_habit_consistency**: How consistently do you complete the health habits you intend to complete? — Never / Rarely / Sometimes / Often / Almost always
- **weekly_rhythm**: Do you have a predictable weekly rhythm for meals, training, recovery and preparation? — No / Somewhat / Yes
- **monthly_goal_review**: How often do you intentionally review your goals and adjust your plan? — Never / A few times a year / Monthly / Several times a month / Weekly
- **routine_friction**: Which best describes you? — I know what I should do but rarely do it / I frequently start and stop / I'm somewhat consistent / I'm consistent unless life gets stressful / My routines remain stable even when life gets busy
- **routine_restart**: When you fall out of routine, how quickly do you usually restart? — Same/next day / Within a few days / Within a week / Several weeks / I often don't restart

Three complete fictional arithmetic comparisons:

- Momentum Regimens · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Momentum Regimens · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Momentum Regimens · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Mentality Realignment

Confirmed shared habit scales/weights are available. This Driver’s habit set, factual criteria, primary finding ownership and independent function rubric remain unapproved.

Existing fields (no automatic scoring role assigned):

- **self_talk**: How does your internal dialogue usually sound? — Very destructive / Mostly destructive / Mixed / Mostly constructive / Highly constructive
- **gratitude**: How regularly do you intentionally recognize things you appreciate? — Never / Rarely / Sometimes / Often / Almost always
- **emotional_patterns_symptoms**: Which recurring emotional experiences have you noticed during the last 30 days? — Chronic worry / Anger / Resentment / Shame / Hopelessness / Loneliness / Feeling overwhelmed / Fear / Low self-worth / Emotional numbness / Difficulty enjoying life / None of these
- **positive_environment**: How much of your regular environment reinforces the person you want to become? — range context
- **self_education**: How regularly do you intentionally learn skills or ideas that improve your health and life? — Never / Rarely / Sometimes / Often / Almost always
- **life_purpose**: Do you feel that your life has meaningful direction and purpose? — range context
- **self_harm_safety_flag**: Are you currently having thoughts of harming yourself or feeling that you may not be safe? — No / Yes

Three complete fictional arithmetic comparisons:

- Mentality Realignment · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Mentality Realignment · mixed: expected candidate Driver/index 59.16079783099616; approved stage **not assigned**.
- Mentality Realignment · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

### Wise Budgeting

Separate two-dimension index; exclude from health weighting and breadth caps.

Existing fields (no automatic scoring role assigned):

- **monthly_health_spending**: Approximately how much do you currently spend on your health each month? — <$100 / $100–249 / $250–499 / $500–999 / $1,000–2,499 / $2,500+ / Prefer not to answer
- **health_spending_categories**: Optional: What does most of this money go toward? — textarea context
- **health_spending_waste**: How much of your current health spending do you believe is unnecessary, redundant or not producing results? — Almost none / A little / Some / A lot / I honestly don't know
- **wellness_budget**: Do you have a dedicated health/wellness budget? — No / Somewhat / informal / Yes
- **unexpected_health_expense**: If an unexpected health expense appeared tomorrow, how prepared would you feel? — Completely unprepared / Slightly prepared / Moderately prepared / Well prepared / Very well prepared
- **optional_health_savings_range**: Optional: What range have you set aside for unexpected health expenses? — textarea context
- **money_blocks_health**: How frequently does money stop you from doing something you believe would meaningfully improve your health? — Never / Rarely / Sometimes / Often / Very often
- **budget_priority_confidence**: How confident are you that you spend your health budget on the highest-value priorities first? — Not confident / Slightly confident / Somewhat confident / Very confident / Highly confident

Three complete fictional arithmetic comparisons:

- Wise Budgeting · strong: expected candidate Driver/index 100; approved stage **not assigned**.
- Wise Budgeting · mixed: expected candidate Driver/index 70; approved stage **not assigned**.
- Wise Budgeting · weak: expected candidate Driver/index 0; approved stage **not assigned**.

Founder decision slots: approve/revise habit definitions and roles; factual proficiency criteria; applicable opportunities; primary symptom ownership; independent function measure; missing/exclusion rules; Driver exponent (health only); distinct color/stage/Green gates; rank interpretation and safe client wording. No diagnosis, treatment advice or reusable recommendation text is invented here.

## Fixed independent arithmetic references

These are engineering arithmetic contracts, not founder-verified clinical/interpretive outcomes. Expected constants were written independently of engine outputs. They cannot substitute for independent founder review.

| ID | Scenario | Expected contract | Reason |
| --- | --- | --- | --- |
| all_supported | All hypothetical health inputs supported | {"raw":100,"displayScore":100,"stagingScore":100,"redCount":0} | H=J=100. This does not establish approved Peace criteria. |
| all_mixed | All concern=30 and lifestyle=70 | {"raw":70,"displayScore":70,"stagingScore":70} | H=70. MeanL=70 and G=30, so J=70. Geometric blend remains 70. |
| all_weak | Explicitly unsupported foundations | {"raw":0,"displayScore":0,"stagingScore":0,"redCount":11} | F=100 in every health Driver means H=0. Explicit zero is not missing data. |
| budget_zero | Budget deduction cannot change health staging | {"raw":100,"displayScore":90,"stagingScore":100,"deduction":10} | Budget index 0 gives 10-point deduction after health staging. |
| budget_half | Half-supported budget dimensions | {"raw":100,"displayScore":95,"stagingScore":100,"deduction":5} | Index=(100+0)/2=50; deduction=5. |
| budget_unknown | Unknown budget remains unknown | {"raw":100,"displayScore":null,"stagingScore":100,"deduction":null} | Do not assume zero budget deduction. Health staging remains separate. |
| missing_driver | Missing one health Driver | {"overall":null,"missing":"neural_repatterning"} | No reweighting an unknown Driver out of the overall score. |
| unknown_proficiency | Unknown factual proficiency | {"overall":null,"missing":"the_living_diet"} | Confidence or unknown evidence cannot become full/zero proficiency. |
| zero_function | Known zero independent function concern | {"raw":100,"displayScore":100} | Explicit zero is valid. |
| unknown_function | Unknown independent function | {"overall":null,"missing":"functional_training"} | Unknown is distinct from a known zero limitation. |
| habit_exclusion | Valid whole-habit exclusion | {"raw":100,"displayScore":100} | Exclude the whole reviewed habit and its weight, not unknown required data. |
| all_excluded | No applicable habits | {"overall":null,"missing":"holistic_recovery"} | No valid habits is not lifestyle=100. |
| water_below_day | One day below hydration benchmark | {"driver":"cellular_hydration","driverScore":79,"color":"Yellow"} | Confirmed Green block; numeric cap 79 is a proposal. |
| sources_below_day | One day below proposed source threshold | {"driver":"cellular_hydration","driverScore":79,"color":"Yellow"} | Source minimum/ownership still need approval; this is explicit hypothetical evidence. |
| symptom_incomplete | Selected symptom lacks exact days | {"overall":null,"missing":"cellular_hydration"} | Legacy labels cannot supply exact day counts. |
| historical_only | Explicit zero current symptom days | {"raw":100,"displayScore":100} | Historical-only finding contributes no current burden. |
| duplicate_exact | Exact repeated finding counted once | {"driver":"neural_repatterning","driverScore":0,"color":"Red","burdenCount":1} | Canonical finding ID retains one primary owner and one contribution. |
| duplicate_conflict | Conflicting duplicate stops comparison | {"overall":null,"issuePrefix":"conflicting_duplicate_finding"} | Do not pick an arbitrary owner or value. |
| child_hold | Child pathway held | {"overall":null,"issuePrefix":"unsupported_or_unknown_pathway"} | No adult rubric fallback. |
| proxy_hold | Proxy pathway held | {"overall":null,"issuePrefix":"unsupported_or_unknown_pathway"} | Person/guardian policy is a separate gate. |
| symptom_none_conflict | None conflicts with a current finding | {"overall":null,"missing":"cellular_hydration"} | Contradiction requests clarification instead of producing a healthy score. |
| unknown_green_evidence | Hydration gate evidence unknown | {"overall":null,"missing":"cellular_hydration"} | Missing daily benchmark/source evidence is not a pass. |
| lifestyle_asymmetry | One foundational lifestyle gap with no stated concern | {"raw":87.69232104987019,"displayScore":88,"stagingScore":88} | Independent arithmetic: H=100; weighted MeanL=90.859375; G=90; J=74.6875. Compare overall exponents. |
| higher_driver_concern | A single higher-weight Driver concern | {"raw":58.706266911521276,"displayScore":59,"stagingScore":59} | Independent arithmetic: MeanP=8.125; H=37.96875; J=100. Compare 1.3 weighting and 75/25 blend. |
| other_driver_concern | Same concern in another health Driver | {"raw":59.10378898370111,"displayScore":59,"stagingScore":59} | Independent arithmetic: MeanP=6.25; H=38.4375; J=100. Weight distinction is a proposal. |
| driver_alpha_tradeoff | Asymmetric concern/lifestyle for Driver exponent review | {"driver":"holistic_recovery","driverScore":59.16079783099616,"color":"Yellow"} | Driver reference is sqrt(50 × 70). Vary alpha to compare concern emphasis with lifestyle emphasis. |
| three_independent_red | Three independently Red health Drivers | {"raw":86.81311964437805,"displayScore":87,"stagingScore":87,"redCount":3,"candidateBand":"Dysregulated"} | Three separate hypothetical lifestyle records score 21 each, giving Driver scores sqrt(2100). Breadth caps the candidate band at Dysregulated. |
| six_independent_red | Six independently Red health Drivers | {"raw":75.20895082387939,"displayScore":75,"stagingScore":75,"redCount":6,"candidateBand":"Chronic"} | Six independent health Drivers, budgeting excluded. H=100, J=53.09375; breadth caps candidate Dysregulated at Chronic. |
| foundational_weight | One supported foundational habit plus unsupported supporting habit | {"driver":"neural_repatterning","driverScore":81.6496580927726,"color":"Green"} | L=(2×100 + 1×0)/3 = 66⅔. With P=0 and alpha 0.5, Driver=sqrt(100×66⅔). Habit role assignments remain hypothetical. |
| supporting_weight | Same evidence with explicitly reversed hypothetical habit roles | {"driver":"neural_repatterning","driverScore":57.735026918962575,"color":"Yellow"} | L=(1×100 + 2×0)/3 = 33⅓. Same shared scale, different proposed role assignment. |

## Exact next Primary Chat/founder request

> Review the B2 fixed scenarios and source-change sheet with Justyn and Elle. Return the candidate handoff with independent reasons/outcomes: accept or revise concern/lifestyle/geometric blends; six priority weights; per-Driver alpha and five-stage mappings; symptom breadth expression and fixed-divisor choice; canonical symptom ownership/duplicates; Hydration gate integration and source rules; habit sets/factual rubrics/opportunities; the two Budgeting dimensions; ranking/ties; Peace/safety criteria. Approve exact questionnaire amendments separately. Keep policy publication, client report scoring/release, emails, production changes and paid features held. No permissioned real cases should be used as the only expected-result benchmark.
