(function () {
  'use strict';

  const esc = (value) => String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
  const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const requiredMark = '<span class="vitality-required" aria-hidden="true">*</span>';
  const frequency = ['Rarely', 'Sometimes', 'Often', 'Almost Daily'];
  const disruption = ['Barely noticeable', 'Mild', 'Moderate', 'Significant', 'Severe'];
  const duration = ['Less than 2 weeks', '2–6 weeks', '6 weeks–3 months', '3–12 months', 'More than one year'];
  const neverAlways = ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'];
  const confidence = ["I don't understand it yet", 'Beginner', 'Somewhat confident', 'Very confident', 'I have a strong system that works for me'];

  function heading(number, title, copy, disclaimer) {
    return `<header class="vitality-panel-head"><span class="vitality-driver-number">${esc(number)}</span><h2>${esc(title)}</h2><p>${esc(copy)}</p>${disclaimer ? `<div class="vitality-disclaimer">${esc(disclaimer)}</div>` : ''}</header>`;
  }

  function subsection(title) { return `<div class="vitality-subsection">${esc(title)}</div>`; }

  function selectOptions(options, placeholder) {
    return `<option value="">${esc(placeholder || 'Select one')}</option>${options.map((option) => `<option value="${esc(option)}">${esc(option)}</option>`).join('')}`;
  }

  function radio(name, label, options, help, required = true) {
    return `<fieldset class="vitality-question"><legend>${label} ${required ? requiredMark : ''}</legend>${help ? `<span class="vitality-question-help">${help}</span>` : ''}<div class="vitality-options">${options.map((option) => `<label class="vitality-choice"><input type="radio" name="${esc(name)}" value="${esc(option)}" ${required ? 'required' : ''}><span>${esc(option)}</span></label>`).join('')}</div></fieldset>`;
  }

  function checks(name, label, options, help, max) {
    return `<fieldset class="vitality-question" ${max ? `data-max-choices="${max}"` : ''}><legend>${label}</legend>${help ? `<span class="vitality-question-help">${help}</span>` : ''}<div class="vitality-options">${options.map((option) => `<label class="vitality-choice"><input type="checkbox" name="${esc(name)}" value="${esc(option)}"><span>${esc(option)}</span></label>`).join('')}</div></fieldset>`;
  }

  function textQuestion(name, label, help, required = false, rows = 3) {
    return `<div class="vitality-question"><label class="vitality-question-label" for="${esc(name)}">${label} ${required ? requiredMark : ''}</label>${help ? `<span class="vitality-question-help">${help}</span>` : ''}<div class="vitality-control"><textarea id="${esc(name)}" name="${esc(name)}" rows="${rows}" ${required ? 'required' : ''}></textarea></div></div>`;
  }

  function selectQuestion(name, label, options, help, required = true) {
    return `<div class="vitality-question"><label class="vitality-question-label" for="${esc(name)}">${label} ${required ? requiredMark : ''}</label>${help ? `<span class="vitality-question-help">${help}</span>` : ''}<div class="vitality-control"><select id="${esc(name)}" name="${esc(name)}" ${required ? 'required' : ''}>${selectOptions(options)}</select></div></div>`;
  }

  function scale(name, label, help, low = 'Low', high = 'High') {
    return `<div class="vitality-question"><label class="vitality-question-label" for="${esc(name)}">${label} ${requiredMark}</label>${help ? `<span class="vitality-question-help">${help}</span>` : ''}<div class="vitality-control"><div class="vitality-range-row"><input id="${esc(name)}" name="${esc(name)}" type="range" min="1" max="10" value="5" required data-range><output class="vitality-range-value" for="${esc(name)}">5</output></div><div class="vitality-range-labels"><span>1 · ${esc(low)}</span><span>10 · ${esc(high)}</span></div></div></div>`;
  }

  function symptomScreen(prefix, symptoms, label = 'Which of these have you experienced during the last 30 days?') {
    const choices = [...symptoms, 'None of these'];
    return `<fieldset class="vitality-question vitality-symptom-screen" data-symptom-screen="${esc(prefix)}"><legend>${esc(label)}</legend><span class="vitality-question-help">Select all that apply. Only selected symptoms will expand for more detail.</span><div class="vitality-options">${choices.map((symptom) => `<label class="vitality-choice"><input type="checkbox" name="${esc(prefix)}_symptoms" value="${esc(symptom)}"><span>${esc(symptom)}</span></label>`).join('')}</div><div class="vitality-symptom-details" data-symptom-details></div></fieldset>`;
  }

  function yesDetails(prefix, label, detailLabel, required = true) {
    return `<div data-conditional-group>${radio(prefix, label, ['No', 'Yes'], '', required)}<div data-show-when="${esc(prefix)}:Yes" hidden>${textQuestion(`${prefix}_details`, detailLabel, 'Share only what you are comfortable sharing.', false)}</div></div>`;
  }

  const sections = [
    {
      key: 'introduction', label: 'Introduction', html: () => `${heading('BEFORE YOU BEGIN', 'Your Vitality Roadmap', 'Your health is not a light switch. It exists on a spectrum.')}
        <div class="vitality-disclaimer">The Vitality Roadmap looks at current symptoms, lifestyle, environment, habits, strengths and quality of life across the 12 Drivers of Health. It helps identify patterns and practical areas to investigate and improve. It does not diagnose disease or determine the cause of symptoms.</div>
        <div class="vitality-question"><span class="vitality-question-label">How the assessment works</span><div class="vitality-options compact"><div class="vitality-choice"><span><strong>Symptoms</strong><br>What your body is experiencing</span></div><div class="vitality-choice"><span><strong>Weaknesses</strong><br>What may be working against you</span></div><div class="vitality-choice"><span><strong>Strengths</strong><br>What you are already doing well</span></div></div></div>
        ${radio('assessment_consent', 'I understand this is a coaching assessment—not a medical diagnosis—and that my answers will be submitted to the ReVitalized Academy coaching team for review.', ['Yes, continue'], '', true)}
        <fieldset class="vitality-question vitality-legal-check"><legend>I acknowledge the ReVitalized Academy Health &amp; Results Disclaimer. ${requiredMark}</legend><span class="vitality-question-help">Individual experiences and results vary. ReVitalized Academy does not guarantee specific outcomes. The content and assessment are educational and are not a substitute for professional medical advice, diagnosis or treatment. <a href="disclaimer.html" target="_blank" rel="noopener">Read the complete disclaimer.</a></span><label class="vitality-choice"><input type="checkbox" name="disclaimer_acknowledgment" value="Acknowledged" required><span>I have read and acknowledge the disclaimer.</span></label></fieldset>`
    },
    {
      key: 'snapshot', label: 'Whole-Person Snapshot', html: () => `${heading('SECTION 1', 'Whole-Person Snapshot', 'Begin with your goals, quality of life and the ways your health currently affects your day-to-day life.')}
        ${checks('primary_goals', 'What would you most like to improve about your health right now?', ['Energy','Digestion','Sleep','Pain','Strength','Mobility','Body composition','Hormones','Fertility','Mental clarity','Stress','Mood','Athletic performance','Healthy aging/longevity','Prevention','Other'], 'Select up to 3.', 3)}
        ${textQuestion('primary_goals_other', 'If you selected Other, tell us more.', '', false, 2)}
        ${scale('overall_quality_of_life', 'How would you rate your current overall quality of life?', '', 'Very low', 'Excellent')}
        ${subsection('Quality of Life by Area')}
        ${['Energy','Sleep','Digestion','Physical comfort','Strength/mobility','Mental clarity','Emotional well-being','Ability to handle stress','Ability to work/parent/study','Ability to enjoy life'].map((area) => scale(`qol_${slug(area)}`, area, '', 'Very limited', 'Excellent')).join('')}
        ${radio('health_interference', 'How much does your current health affect what you can do?', ['Not at all','Slightly','Moderately','Significantly','My health controls much of my life'])}
        ${subsection('Medical Background')}
        ${yesDetails('diagnosed_conditions', 'Are you currently living with any diagnosed health conditions?', 'Tell us as much as you would like.')}
        ${yesDetails('prescription_medications', 'Are you currently taking prescription medications?', 'Optional medication details.')}
        ${yesDetails('regular_supplements', 'Do you regularly take supplements?', 'Optional supplement details.')}
        ${yesDetails('surgeries_injuries', 'Have you experienced any significant surgeries or injuries?', 'Optional surgery or injury details.')}
        ${textQuestion('most_concerning_symptoms', 'What symptoms concern you the most right now?', '', true)}
        ${textQuestion('ninety_day_goal', 'If you could improve ONE thing about your health over the next 90 days, what would it be?', 'Your exact words will be highlighted for the ReVitalized coaching team.', true)}
        ${subsection('Health Spectrum Self-Perception')}
        <div class="vitality-disclaimer"><strong>Peace:</strong> resilient with little limitation. <strong>Impaired:</strong> early, mild weaknesses. <strong>Dysregulated:</strong> recurring symptoms that are harder to ignore. <strong>Chronic:</strong> persistent patterns affecting daily life. <strong>Chaos:</strong> health substantially dominates daily life.</div>
        ${radio('self_perceived_spectrum', 'Before your results are reviewed, where do YOU think you currently fall?', ['Peace','Impaired','Dysregulated','Chronic','Chaos',"I'm not sure"], 'This answer is recorded separately and is not used to calculate a score.')}
        ${subsection('Immediate Safety Check')}
        ${radio('urgent_safety_flag', 'Are you currently experiencing any potentially urgent concern such as severe breathing difficulty, severe chest pain, new neurological impairment, major bleeding, suicidal thoughts, or a serious pregnancy-related warning symptom?', ['No','Yes'], 'This question is separate from your Vitality Roadmap classification.')}
        <div class="vitality-safety-response" data-safety-message><strong>Please seek appropriate help now.</strong><br>This assessment cannot evaluate urgent symptoms. Contact emergency services or an appropriate medical professional now. If you may hurt yourself, call or text 988 in the United States or use your local emergency/crisis service. Your response will also be flagged for ReVitalized Academy review.</div>`
    },
    {
      key: 'hydration', label: 'Cellular Hydration', html: () => `${heading('DRIVER 1 OF 12', 'Cellular Hydration', 'Explore hydration symptoms, water quality, consistency, electrolytes and the habits already supporting you.')}
        ${symptomScreen('hydration', ['Strong thirst','Dry mouth','Dry lips','Dark/concentrated urine','Frequent headaches','Lightheadedness when standing','Muscle cramping','Exercise-related cramping','Fatigue','Constipation/hard stool','Feeling unusually thirsty despite drinking frequently','Very frequent urination','Waking repeatedly to urinate','Difficulty tolerating heat','Other'])}
        ${textQuestion('hydration_other', 'If you selected Other, tell us more.', '', false, 2)}
        ${selectQuestion('water_source', 'What is your primary drinking water source?', ['Properly filtered/remineralized water','Well water','Spring water','Municipal tap water','Reverse osmosis','Bottled water','Water filter — unsure what type','Other',"I don't know"])}
        ${textQuestion('water_filtration_mineralization', 'Optional: Tell us about your filtration or mineralization approach.', '', false, 2)}
        ${selectQuestion('water_intake_consistency', "How consistently do you drink enough water to comfortably satisfy your body's needs?", neverAlways)}
        ${selectQuestion('electrolyte_consistency', 'How consistently do you consume meaningful food or beverage sources of electrolytes such as sodium, potassium and magnesium?', neverAlways)}
        ${selectQuestion('hydration_proficiency', 'How confident are you that you understand how to hydrate properly rather than simply drinking more water?', confidence)}
        ${checks('hydration_strengths', 'Which are already strengths?', ['Good drinking water','Consistent water intake','Good electrolyte intake','Minimal excessive alcohol','Appropriate hydration around exercise','I recognize thirst/dehydration signals well'])}`
    },
    {
      key: 'detoxification', label: 'Systemic Detoxification', html: () => `${heading('DRIVER 2 OF 12', 'Systemic Detoxification', 'Review patterns related to the systems involved in processing or removing bodily waste.', 'We use the term drainage pathways to describe several systems involved in removing or processing bodily waste. This screening identifies patterns worth discussing; it does not determine organ function or diagnose disease.')}
        ${subsection('Colon Screen')}
        ${selectQuestion('bowel_movement_frequency', 'How often do you usually have a bowel movement?', ['2–4/day','1/day','Every other day','Fewer than 3/week','Highly variable','Multiple loose movements/day'])}
        ${checks('bristol_stool_types', 'Which Bristol Stool Chart types are most common for you?', ['Type 1 — separate hard lumps','Type 2 — lumpy sausage','Type 3 — cracked sausage','Type 4 — smooth, soft sausage','Type 5 — soft blobs','Type 6 — mushy pieces','Type 7 — watery'], 'Select all that regularly apply.')}
        ${symptomScreen('colon', ['Straining','Incomplete evacuation','Bloating/pressure','Urgency','Diarrhea','Constipation'], 'How often do you experience these bowel patterns?')}
        ${textQuestion('colon_follow_up', 'If bowel habits concern you, optionally describe bathroom duration, pain, major changes, or worsening with dietary/supplement changes.', '', false)}
        ${subsection('Kidneys / Urinary')}
        ${symptomScreen('urinary', ['Very dark urine','Unusually foamy urine','Strong/unusual urine odor','Excessive urinary frequency','Significant urgency','Facial/hand/ankle swelling','Persistent flank/lower-back discomfort','Blood in urine','Painful urination'])}
        ${selectQuestion('pale_yellow_urine', 'How often does your urine generally fall in a pale-yellow range?', neverAlways)}
        ${subsection('Liver / Bile Patterns')}
        ${symptomScreen('liver_bile', ['Pale/clay-colored stool','Frequently greasy/floating stool','Nausea after fatty foods','Discomfort beneath the right ribs','Persistent unexplained itching','Strong food intolerance after high-fat meals','Yellowing of eyes/skin','Persistent severe pain'])}
        ${subsection('Lymphatic Patterns')}
        ${symptomScreen('lymphatic', ['Persistent puffiness/swelling','Heavy-feeling limbs','Tender/enlarged lymph nodes','Persistent congestion','Frequent unexplained swelling','Generalized tenderness','Difficulty becoming physically warm/sweating during activity'])}
        ${selectQuestion('whole_body_movement', 'How frequently do you move your whole body throughout the day?', neverAlways)}
        ${selectQuestion('sedentary_periods', 'How often are you sedentary for long uninterrupted periods?', neverAlways)}
        ${selectQuestion('walking_regularity', 'How regularly do you walk?', neverAlways)}
        ${subsection('Overnight Brain Recovery')}
        <div class="vitality-disclaimer">These questions assess sleep and morning neurological patterns associated with overnight recovery. They do not measure glymphatic function directly.</div>
        ${symptomScreen('overnight_recovery', ['Wake with brain fog','Morning headache','Morning mental fatigue','Difficulty feeling fully awake','Poor memory in the morning','Frequent nighttime awakening','Wake feeling unrefreshed despite enough time in bed'])}
        ${subsection('Reproductive Drainage')}
        ${selectQuestion('reproductive_screen_path', 'Which screening pathway is relevant to you?', ['Female','Male','Neither / prefer not to answer'], '', true)}
        <div data-show-when="reproductive_screen_path:Female" hidden>${symptomScreen('reproductive_female', ['Significant menstrual clotting','Very heavy menstrual bleeding','Significant pelvic pressure/bloating','Spotting between periods','Unusual cycle-associated swelling','Significant pelvic pain'])}</div>
        <div data-show-when="reproductive_screen_path:Male" hidden>${symptomScreen('reproductive_male', ['Persistent pelvic discomfort','Painful ejaculation','Urinary changes','Erectile changes','Significant libido decline'])}</div>
        ${subsection('Lungs')}
        ${symptomScreen('lungs', ['Shortness of breath','Difficulty taking a comfortable deep breath','Wheezing','Persistent cough','Chronic throat clearing','Chest congestion','Poor tolerance for normal cardiovascular activity','Frequent mouth breathing'])}
        ${checks('lung_exposures', 'Which exposures currently apply?', ['Smoking','Vaping','Secondhand smoke','Workplace dust/fumes','Mold/dampness concerns','Poor indoor ventilation','None of these'])}`
    },
    {
      key: 'electrobiology', label: 'Electrobiology Rhythms', html: () => `${heading('DRIVER 3 OF 12', 'Electrobiology Rhythms', 'Explore circadian rhythm, artificial-light and device habits, outdoor exposure and grounding.')}
        ${symptomScreen('electrobiology', ['Difficulty falling asleep','Difficulty waking','Inconsistent energy rhythm','Late-night alertness','Morning grogginess','Brain fog','Poor concentration','Headaches','Restlessness at night'])}
        ${selectQuestion('sleep_wake_consistency', 'How consistent is your sleep/wake schedule?', neverAlways)}
        ${radio('morning_daylight', 'How soon after waking do you normally get outside into natural daylight?', ['<15 minutes','15–30 minutes','30–60 minutes','1–2 hours','Usually later','Rarely'])}
        ${selectQuestion('evening_light_exposure', 'During the 2 hours before bed, how much bright artificial light or screen exposure do you typically have?', ['Very little','Low','Moderate','High','Very high'])}
        ${checks('device_habits', 'Which device habits commonly apply?', ['Sleep beside my phone','Use screens in bed','Keep Bluetooth devices on my body for long periods','Spend most of the day around screens/electronics','Have Wi-Fi equipment near sleeping areas','None of these'])}
        ${selectQuestion('outdoor_time', 'How much time do you normally spend outdoors?', ['Very little','Less than 30 minutes/day','30–60 minutes/day','1–2 hours/day','More than 2 hours/day'])}
        ${selectQuestion('grounding_frequency', 'How frequently do you spend time barefoot or directly connected with natural outdoor environments?', ['Never','Rarely','Weekly','Several times a week','Daily'])}`
    },
    {
      key: 'living_diet', label: 'The Living Diet', html: () => `${heading('DRIVER 4 OF 12', 'The Living Diet', 'Look at digestive performance during meals, holistic eating habits and performance nutrition.')}
        ${subsection('Digestive Performance During Meals')}${symptomScreen('living_diet', ['Reflux','Burping','Heavy/full feeling after eating','Bloating soon after meals','Nausea','Feeling sleepy after meals','Significant energy crash','Poor appetite','Excessive hunger','Strong cravings'])}
        ${subsection('Holistic Eating Habits')}
        ${['Eat slowly enough to chew thoroughly','Eat while relatively relaxed','Eat without significant distraction','Stop eating when comfortably satisfied','Consume mostly whole/minimally processed foods','Include fermented foods if tolerated','Avoid habitual overeating','Maintain an eating rhythm that works well for you'].map((item) => selectQuestion(`eating_${slug(item)}`, `How often do you ${item.charAt(0).toLowerCase()}${item.slice(1)}?`, neverAlways)).join('')}
        ${subsection('Performance Nutrition')}
        ${['Protein','Essential fats','Carbohydrate appropriate for activity','Fiber','Minerals','Vitamins','Colorful plants/antioxidant-rich foods'].map((item) => selectQuestion(`nutrition_${slug(item)}`, `How confident are you that your diet consistently provides enough ${item.toLowerCase()}?`, ['Not confident','Slightly confident','Somewhat confident','Very confident','Highly confident'])).join('')}
        ${radio('whole_food_percentage', 'Approximately what percentage of your diet is minimally processed whole food?', ['<25%','25–49%','50–69%','70–79%','80–89%','90%+'])}`
    },
    {
      key: 'functional_training', label: 'Functional Training', html: () => `${heading('DRIVER 5 OF 12', 'Functional Training', 'Assess movement limitations, bodily control, consistency, programming and physical performance.')}
        ${symptomScreen('functional_training', ['Recurring pain during movement','Joint stiffness','Limited range of motion','Poor balance','Poor coordination','Low strength','Low endurance','Frequent exercise-related injury','Fear of certain movements','Difficulty getting off the floor','Difficulty lifting/carrying everyday objects'])}
        ${subsection('Bodily Control')}
        ${['Squatting','Hinging','Pushing','Pulling','Carrying','Lunging','Rotating','Balancing','Running/jumping when appropriate'].map((item) => selectQuestion(`movement_${slug(item)}`, `How confident are you with ${item.toLowerCase()}?`, ['Not able / not appropriate','Not confident','Somewhat confident','Very confident','Highly confident'])).join('')}
        ${selectQuestion('training_sessions_weekly', 'How many purposeful training sessions do you average per week?', ['0','1','2','3','4','5','6+'])}
        ${radio('training_program', 'Which best describes your current training?', ['No program','Exercise randomly','Basic routine','Structured progressive program','Structured individualized program'])}
        ${['Strength','Mobility','Cardiovascular fitness','Speed/power where relevant','Athletic confidence'].map((area) => scale(`performance_${slug(area)}`, `How would you rate your ${area.toLowerCase()}?`, '', 'Very low', 'Excellent')).join('')}
        ${selectQuestion('body_allows_activities', 'Does your body allow you to physically do the things you want to do?', neverAlways)}`
    },
    {
      key: 'recovery', label: 'Holistic Recovery', html: () => `${heading('DRIVER 6 OF 12', 'Holistic Recovery', 'Review sleep, breathing, nervous-system patterns, recovery capacity and supportive recovery behaviors.')}
        ${subsection('Sleep')}${symptomScreen('recovery_sleep', ['Difficulty falling asleep','Frequent waking','Early waking','Snoring','Waking unrefreshed','Daytime sleepiness','Needing stimulants to function','Irregular sleep schedule'])}
        ${subsection('Breathing')}${symptomScreen('recovery_breathing', ['Habitual mouth breathing','Shallow breathing','Breath holding under stress','Poor tolerance for nasal breathing','Feeling chronically “air hungry”'])}
        ${subsection('Nervous System')}${symptomScreen('recovery_nervous_system', ['Feeling wired but tired','Difficulty relaxing','Easily startled','Constant internal tension','Unable to mentally switch off'])}
        ${subsection('Recovery Capacity')}${symptomScreen('recovery_capacity', ['Excessive soreness','Poor recovery after exercise','Constant fatigue','Need several days to recover from normal activity'])}
        ${subsection('Recovery Behaviors')}
        ${['Regular sleep schedule','Relaxation/decompression','Rest days','Walking/light movement','Mobility','Breathwork','Appropriate recovery after training'].map((item) => selectQuestion(`recovery_behavior_${slug(item)}`, `How consistent are you with ${item.toLowerCase()}?`, neverAlways)).join('')}
        ${selectQuestion('temperature_tolerance', 'How well do you tolerate normal changes in hot and cold environments?', ['Very poorly','Poorly','Moderately','Well','Very well'])}
        ${textQuestion('temperature_practices', 'Optional: Do you use any hot or cold exposure practices?', '', false, 2)}`
    },
    {
      key: 'gi', label: 'G.I. Renovation', html: () => `${heading('DRIVER 7 OF 12', 'G.I. Renovation', 'Take a dedicated look at intestinal symptoms, transit and microbiome-supporting behaviors.')}
        <div class="vitality-disclaimer">Your bowel frequency and Bristol stool-type answers from Systemic Detoxification will be included here automatically so you do not have to answer them twice.</div>
        ${symptomScreen('gi', ['Bloating','Gas','Cramping','Abdominal pain','Diarrhea','Constipation','Reflux','Food-triggered symptoms','Mucus','Unpredictable stools'])}
        ${selectQuestion('plant_food_diversity', 'In a typical week, how diverse is your intake of plant foods?', ['Very limited','Limited','Moderate','Diverse','Very diverse'])}
        ${selectQuestion('fermented_foods', 'How regularly do you eat fermented foods if tolerated?', neverAlways)}
        ${selectQuestion('fiber_whole_foods', 'How consistently do you consume fiber-rich whole foods?', neverAlways)}
        ${radio('antibiotics_last_year', 'Have you used antibiotics within the last 12 months?', ['No','Yes','Prefer not to answer'], '', false)}
        ${yesDetails('microbiome_testing', 'Have you previously completed microbiome/stool testing?', 'Optional notes about prior testing.', false)}`
    },
    {
      key: 'hormones', label: 'Hormone Balancing', html: () => `${heading('DRIVER 8 OF 12', 'Hormone Balancing', 'Choose the pathway that fits your current life stage, then answer only the questions relevant to you.', 'This assessment records symptoms and exposure markers. It does not prove hormonal disruption or diagnose a hormone condition.')}
        ${radio('hormone_pathway', 'Which pathway best fits you right now?', ['Male','Female cycling','Pregnant','Postpartum','Perimenopause','Menopause','Prefer not to answer'])}
        ${subsection('Everyone')}
        ${symptomScreen('hormone_everyone', ['Libido changes','Energy changes','Recovery changes','Body composition changes','Hair changes','Skin changes','Temperature regulation changes','Mood instability','Sleep changes','Fertility concerns'])}
        <div data-show-when="hormone_pathway:Female cycling" hidden>${subsection('Female Cycling')}${textQuestion('cycle_length', 'What is your typical cycle length?', 'Normal cycles vary; this is not evaluated against a single required 28-day cycle.', false, 2)}${symptomScreen('hormone_cycling', ['Irregular cycles','Heavy bleeding','Significant cramping','PMS','Changes in ovulation signs','Mid-cycle pain','Spotting','Breast tenderness','Menstrual migraines','Fertility concerns'])}</div>
        <div data-show-when="hormone_pathway:Pregnant" hidden>${subsection('Pregnancy')}${selectQuestion('pregnancy_trimester', 'Current trimester', ['First','Second','Third','Prefer not to answer'], '', false)}${symptomScreen('hormone_pregnancy', ['Low energy','Sleep challenges','Nausea','Emotional well-being concerns'])}${radio('pregnancy_medical_support', 'Do you currently have medical support for your pregnancy?', ['Yes','No','Prefer not to answer'], '', false)}<div class="vitality-disclaimer">ReVitalized Academy will not provide automated corrective hormone advice during pregnancy.</div></div>
        <div data-show-when="hormone_pathway:Postpartum" hidden>${subsection('Postpartum')}${textQuestion('months_postpartum', 'How many months postpartum are you?', '', false, 2)}${radio('breastfeeding', 'Are you breastfeeding?', ['Yes','No','Prefer not to answer'], '', false)}${radio('cycle_returned', 'Has your cycle returned?', ['Yes','No','Not applicable / prefer not to answer'], '', false)}${symptomScreen('hormone_postpartum', ['Recovery challenges','Sleep challenges','Libido changes','Pelvic symptoms','Mood changes','Fatigue'])}</div>
        <div data-show-when="hormone_pathway:Perimenopause|Menopause" hidden>${subsection('Perimenopause / Menopause')}${symptomScreen('hormone_menopause', ['Hot flashes','Night sweats','Cycle changes','Sleep disruption','Libido changes','Vaginal symptoms','Mood changes','Body composition changes','Cognition changes'])}</div>
        ${subsection('Environmental Exposure')}${checks('hormone_exposure_markers', 'How frequently do these exposure markers apply?', ['Heating food in plastic','Heavy fragrance use','Occupational chemical exposure','Frequent pesticide exposure','High reliance on highly processed packaged food','None of these'], 'Select those that happen regularly. These are exposure markers, not proof of hormonal disruption.')}`
    },
    {
      key: 'neural', label: 'Neural Repatterning', html: () => `${heading('DRIVER 9 OF 12', 'Neural Repatterning', 'Assess behaviors and symptoms relevant to cognitive function, stress, stimulation, learning and mental stamina.')}
        ${subsection('Cognitive Symptoms')}${symptomScreen('neural', ['Memory problems','Difficulty concentrating','Difficulty starting tasks','Difficulty completing tasks','Slower thinking','Decision fatigue','Difficulty problem-solving','Excessive worry/prediction','Intrusive thinking','Lack of creativity/imagination','Mental fatigue'])}
        ${selectQuestion('stress_overwhelm', 'How frequently do you feel overwhelmed by stress?', neverAlways)}
        ${selectQuestion('stress_return_to_baseline', 'How quickly do you return to baseline after stressful situations?', ['Very slowly','Slowly','It varies','Quickly','Very quickly'])}
        ${checks('stimulation_habits', 'Which stimulation patterns regularly apply?', ['Check my phone automatically','Struggle to tolerate boredom','Need constant entertainment','Jump rapidly between tasks','Consume short-form content for long periods','Feel unable to focus without stimulation','Use caffeine/stimulation to overcome mental fatigue','None of these'])}
        ${selectQuestion('challenging_learning', 'How frequently do you deliberately learn something challenging?', neverAlways)}
        ${selectQuestion('memory_skill_activities', 'How often do you perform activities that require memory, problem-solving or skill development?', neverAlways)}
        ${subsection('Cognitive Function Self-Rating')}${['Attention','Memory','Executive function','Processing speed','Emotional regulation','Creativity','Learning','Mental stamina'].map((area) => scale(`cognitive_${slug(area)}`, area, '', 'Very low', 'Excellent')).join('')}`
    },
    {
      key: 'momentum', label: 'Momentum Regimens', html: () => `${heading('DRIVER 10 OF 12', 'Momentum Regimens', 'Explore daily consistency, weekly rhythms, monthly review, friction and how quickly you restart after interruptions.')}
        ${selectQuestion('daily_habit_consistency', 'How consistently do you complete the health habits you intend to complete?', neverAlways)}
        ${radio('weekly_rhythm', 'Do you have a predictable weekly rhythm for meals, training, recovery and preparation?', ['No','Somewhat','Yes'])}
        ${selectQuestion('monthly_goal_review', 'How often do you intentionally review your goals and adjust your plan?', ['Never','A few times a year','Monthly','Several times a month','Weekly'])}
        ${radio('routine_friction', 'Which best describes you?', ['I know what I should do but rarely do it','I frequently start and stop',"I'm somewhat consistent","I'm consistent unless life gets stressful",'My routines remain stable even when life gets busy'])}
        ${radio('routine_restart', 'When you fall out of routine, how quickly do you usually restart?', ['Same/next day','Within several days','Within a week','Several weeks',"I often don't restart"])}`
    },
    {
      key: 'mentality', label: 'Mentality Realignment', html: () => `${heading('DRIVER 11 OF 12', 'Mentality Realignment', 'Reflect on self-talk, gratitude, recurring emotional patterns, influence, learning and purpose.')}
        ${selectQuestion('self_talk', 'How does your internal dialogue usually sound?', ['Very destructive','Mostly destructive','Mixed','Mostly constructive','Highly constructive'])}
        ${selectQuestion('gratitude', 'How regularly do you intentionally recognize things you appreciate?', neverAlways)}
        ${symptomScreen('emotional_patterns', ['Chronic worry','Anger','Resentment','Shame','Hopelessness','Loneliness','Feeling overwhelmed','Fear','Low self-worth','Emotional numbness','Difficulty enjoying life'], 'Which recurring emotional experiences have you noticed during the last 30 days?')}
        ${scale('positive_environment', 'How much of your regular environment reinforces the person you want to become?', 'Consider relationships, social media, entertainment, workplace, community and home.', 'Very little', 'Almost all')}
        ${selectQuestion('self_education', 'How regularly do you intentionally learn skills or ideas that improve your health and life?', neverAlways)}
        ${scale('life_purpose', 'Do you feel that your life has meaningful direction and purpose?', '', 'Not at all', 'Very strongly')}
        ${radio('self_harm_safety_flag', 'Are you currently having thoughts of harming yourself or feeling that you may not be safe?', ['No','Yes'], 'This private safety question is separate from your assessment classification.')}
        <div class="vitality-safety-response" data-self-harm-message><strong>Please get support now.</strong><br>Call or text 988 in the United States, contact local emergency services, or reach a trusted person who can stay with you. This assessment cannot provide crisis care. Your response will also be flagged for ReVitalized Academy review.</div>`
    },
    {
      key: 'budgeting', label: 'Wise Budgeting', html: () => `${heading('DRIVER 12 OF 12', 'Wise Budgeting', 'Look at current health spending, perceived waste, planning, emergency preparedness, financial stress and spending confidence.')}
        ${radio('monthly_health_spending', 'Approximately how much do you currently spend on your health each month?', ['<$100','$100–249','$250–499','$500–999','$1,000–2,499','$2,500+','Prefer not to answer'])}
        ${textQuestion('health_spending_categories', 'Optional: What does most of this money go toward?', '', false)}
        ${radio('health_spending_waste', 'How much of your current health spending do you believe is unnecessary, redundant or not producing results?', ['Almost none','A little','Some','A lot',"I honestly don't know"])}
        ${radio('wellness_budget', 'Do you have a dedicated health/wellness budget?', ['No','Somewhat / informal','Yes'])}
        ${radio('unexpected_health_expense', 'If an unexpected health expense appeared tomorrow, how prepared would you feel?', ['Completely unprepared','Slightly prepared','Moderately prepared','Well prepared','Very well prepared'])}
        ${textQuestion('optional_health_savings_range', 'Optional: What range have you set aside for unexpected health expenses?', '', false, 2)}
        ${selectQuestion('money_blocks_health', 'How frequently does money stop you from doing something you believe would meaningfully improve your health?', ['Never','Rarely','Sometimes','Often','Very often'])}
        ${selectQuestion('budget_priority_confidence', 'How confident are you that you spend your health budget on the highest-value priorities first?', ['Not confident','Slightly confident','Somewhat confident','Very confident','Highly confident'])}
        ${radio('final_accuracy', 'I have answered as accurately as I reasonably can and understand my assessment will be reviewed as coaching information, not a medical diagnosis.', ['Yes, submit my assessment'])}`
    }
  ];

  const leadForm = document.querySelector('[data-vitality-lead-form]');
  const assessmentForm = document.querySelector('[data-assessment-form]');
  const assessmentStage = document.querySelector('[data-assessment-stage]');
  if (assessmentForm && assessmentStage) {
    assessmentStage.innerHTML = sections.map((section, index) => `<section class="vitality-panel" data-panel="${index}" ${index ? 'hidden' : ''}>${section.html()}</section>`).join('');
  }

  function encodeForm(form) {
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => params.append(key, value));
    return params.toString();
  }

  async function postForm(form) {
    const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: encodeForm(form) });
    if (!response.ok) throw new Error(`Submission failed: ${response.status}`);
  }

  function buildAssessmentSummary() {
    const lines = [];
    sections.forEach((section, index) => {
      const panel = assessmentForm.querySelector(`[data-panel="${index}"]`);
      lines.push('', `=== ${section.label.toUpperCase()} ===`);
      const handled = new Set();
      panel.querySelectorAll('input:not([type="hidden"]),select,textarea').forEach((control) => {
        if (control.disabled || !control.name || handled.has(control.name)) return;
        handled.add(control.name);
        let values = [];
        if (control.type === 'radio' || control.type === 'checkbox') {
          values = [...panel.querySelectorAll(`[name="${CSS.escape(control.name)}"]:checked`)].map((item) => item.value);
        } else if (control.value.trim()) values = [control.value.trim()];
        if (!values.length) return;
        const question = control.closest('.vitality-question');
        const symptomCard = control.closest('.vitality-symptom-card');
        const baseLabel = question && (question.querySelector('legend') || question.querySelector('.vitality-question-label'));
        let label = baseLabel ? baseLabel.textContent.replace('*', '').trim() : control.name.replaceAll('_', ' ');
        if (symptomCard) {
          const symptom = symptomCard.querySelector('strong');
          const detail = control.closest('label');
          label = `${symptom ? symptom.textContent.trim() : label} — ${detail ? detail.childNodes[0].textContent.trim() : label}`;
        }
        lines.push(`${label}: ${values.join(', ')}`);
      });
    });
    return lines.join('\n').trim();
  }

  function updateConditionalFields() {
    document.querySelectorAll('[data-show-when]').forEach((container) => {
      const [name, rawValues] = container.dataset.showWhen.split(':');
      const allowed = rawValues.split('|');
      const selected = document.querySelector(`[name="${CSS.escape(name)}"]:checked`) || document.querySelector(`[name="${CSS.escape(name)}"]`);
      const show = selected && allowed.includes(selected.value);
      container.hidden = !show;
      container.querySelectorAll('input,select,textarea').forEach((control) => { control.disabled = !show; });
    });
  }

  function symptomDetail(prefix, symptom) {
    const safe = slug(symptom);
    return `<div class="vitality-symptom-card" data-symptom-card="${esc(symptom)}"><strong>${esc(symptom)}</strong><div class="vitality-detail-grid"><label>How often?<select name="${esc(prefix)}_${safe}_frequency" required>${selectOptions(frequency)}</select></label><label>How disruptive?<select name="${esc(prefix)}_${safe}_disruption" required>${selectOptions(disruption)}</select></label><label>How long?<select name="${esc(prefix)}_${safe}_duration" required>${selectOptions(duration)}</select></label></div></div>`;
  }

  function updateSymptomScreen(screen) {
    const host = screen.querySelector('[data-symptom-details]');
    const prefix = screen.dataset.symptomScreen;
    const boxes = [...screen.querySelectorAll('input[type="checkbox"]')];
    const none = boxes.find((box) => box.value === 'None of these');
    if (none && none.checked) boxes.filter((box) => box !== none).forEach((box) => { box.checked = false; });
    const selected = boxes.filter((box) => box.checked && box.value !== 'None of these').map((box) => box.value);
    [...host.querySelectorAll('[data-symptom-card]')].forEach((card) => { if (!selected.includes(card.dataset.symptomCard)) card.remove(); });
    selected.forEach((symptom) => { if (!host.querySelector(`[data-symptom-card="${CSS.escape(symptom)}"]`)) host.insertAdjacentHTML('beforeend', symptomDetail(prefix, symptom)); });
  }

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-range]')) event.target.nextElementSibling.value = event.target.value;
    if (event.target.closest('[data-symptom-screen]')) {
      const screen = event.target.closest('[data-symptom-screen]');
      if (event.target.type === 'checkbox' && event.target.value !== 'None of these' && event.target.checked) {
        const none = [...screen.querySelectorAll('input[type="checkbox"]')].find((box) => box.value === 'None of these');
        if (none) none.checked = false;
      }
      updateSymptomScreen(screen);
    }
    if (event.target.name === 'urgent_safety_flag') document.querySelector('[data-safety-message]').classList.toggle('show', event.target.value === 'Yes');
    if (event.target.name === 'self_harm_safety_flag') document.querySelector('[data-self-harm-message]').classList.toggle('show', event.target.value === 'Yes');
    updateConditionalFields();
  });

  document.querySelectorAll('[data-max-choices]').forEach((group) => {
    group.addEventListener('change', (event) => {
      const selected = group.querySelectorAll('input:checked');
      if (selected.length > Number(group.dataset.maxChoices)) {
        event.target.checked = false;
        const help = group.querySelector('.vitality-question-help');
        if (help) help.textContent = `Please select no more than ${group.dataset.maxChoices}.`;
      }
    });
  });

  let currentSection = 0;
  const backButton = document.querySelector('[data-back]');
  const nextButton = document.querySelector('[data-next]');
  const assessmentError = document.querySelector('[data-assessment-error]');

  function showSection(index) {
    currentSection = Math.max(0, Math.min(index, sections.length - 1));
    document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = Number(panel.dataset.panel) !== currentSection; });
    const percent = Math.round((currentSection / sections.length) * 100);
    document.querySelector('[data-section-label]').textContent = sections[currentSection].label;
    document.querySelector('[data-progress-bar]').style.width = `${percent}%`;
    document.querySelector('[data-progress-percent]').textContent = `${percent}%`;
    backButton.disabled = currentSection === 0;
    nextButton.innerHTML = currentSection === sections.length - 1 ? 'Submit My Assessment <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
    assessmentError.classList.remove('show');
    updateConditionalFields();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateCurrentSection() {
    const panel = document.querySelector(`[data-panel="${currentSection}"]`);
    const invalid = [...panel.querySelectorAll('[required]:not([disabled])')].find((control) => !control.checkValidity());
    if (invalid) {
      assessmentError.classList.add('show');
      invalid.reportValidity();
      invalid.focus({ preventScroll: true });
      invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    const unansweredSymptoms = [...panel.querySelectorAll('[data-symptom-screen]')].find((screen) => !screen.querySelector('input[type="checkbox"]:checked'));
    if (unansweredSymptoms) {
      assessmentError.textContent = 'Please select any symptoms that apply, or choose “None of these,” before continuing.';
      assessmentError.classList.add('show');
      unansweredSymptoms.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (currentSection === 1 && !panel.querySelector('[name="primary_goals"]:checked')) {
      assessmentError.textContent = 'Please select at least one primary health goal before continuing.';
      assessmentError.classList.add('show');
      panel.querySelector('[name="primary_goals"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    assessmentError.textContent = 'Please complete the required questions above before continuing.';
    return true;
  }

  if (backButton) backButton.addEventListener('click', () => showSection(currentSection - 1));
  if (nextButton) nextButton.addEventListener('click', async () => {
    if (!validateCurrentSection()) return;
    if (currentSection < sections.length - 1) return showSection(currentSection + 1);
    const original = nextButton.innerHTML;
    nextButton.disabled = true;
    nextButton.textContent = 'Submitting…';
    try {
      assessmentForm.querySelector('[data-submitted-at]').value = new Date().toISOString();
      const flags = [];
      if (assessmentForm.elements.urgent_safety_flag && assessmentForm.elements.urgent_safety_flag.value === 'Yes') flags.push('URGENT SYMPTOM / SAFETY RESPONSE');
      if (assessmentForm.elements.self_harm_safety_flag && assessmentForm.elements.self_harm_safety_flag.value === 'Yes') flags.push('SELF-HARM / IMMEDIATE SAFETY RESPONSE');
      assessmentForm.querySelector('[data-coach-review-flags]').value = flags.length ? flags.join(' | ') : 'None reported';
      assessmentForm.querySelector('[data-assessment-summary]').value = buildAssessmentSummary();
      await postForm(assessmentForm);
      document.querySelector('[data-assessment-step]').hidden = true;
      document.querySelector('[data-complete-step]').hidden = false;
      document.querySelector('[data-progress-assessment]').classList.remove('active');
      document.querySelector('[data-progress-complete]').classList.add('active');
      document.querySelector('[data-progress-complete]').classList.remove('future');
      const firstName = assessmentForm.querySelector('[data-copy-field="first_name"]').value;
      document.querySelector('[data-complete-name]').textContent = firstName || 'your assessment is complete';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      assessmentError.textContent = 'We couldn’t submit your assessment. Your contact information is already saved. Please check your connection and try again.';
      assessmentError.classList.add('show');
      nextButton.disabled = false;
      nextButton.innerHTML = original;
    }
  });

  if (leadForm) {
    const button = leadForm.querySelector('button[type="submit"]');
    const error = leadForm.querySelector('.vitality-error');
    leadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!leadForm.reportValidity()) return;
      button.disabled = true;
      const original = button.innerHTML;
      button.textContent = 'Saving…';
      try {
        await postForm(leadForm);
        ['first_name','last_name','email','phone'].forEach((name) => {
          assessmentForm.querySelector(`[data-copy-field="${name}"]`).value = leadForm.elements[name].value;
        });
        document.querySelector('[data-lead-step]').hidden = true;
        document.querySelector('[data-assessment-step]').hidden = false;
        document.querySelector('[data-progress-contact]').textContent = '✓ Contact Saved';
        document.querySelector('[data-progress-assessment]').classList.add('active');
        document.querySelector('[data-progress-assessment]').classList.remove('future');
        showSection(0);
      } catch (submissionError) {
        error.classList.add('show');
        button.disabled = false;
        button.innerHTML = original;
      }
    });
  }

  updateConditionalFields();

  // Site-wide assessment invitation popup retained for pages that include it.
  const popup = document.querySelector('.vitality-popup-backdrop');
  if (popup) {
    const key = 'ra_vitality_popup_last';
    const wait = 5 * 86400000;
    const last = Number(localStorage.getItem(key) || 0);
    let shown = false;
    const show = () => {
      if (shown || Date.now() - last <= wait) return;
      shown = true;
      popup.classList.add('show');
      localStorage.setItem(key, String(Date.now()));
      document.body.style.overflow = 'hidden';
    };
    const close = () => { popup.classList.remove('show'); document.body.style.overflow = ''; };
    setTimeout(show, 40000);
    addEventListener('scroll', () => {
      const maximum = document.documentElement.scrollHeight - innerHeight;
      if (maximum > 0 && scrollY / maximum >= .45) show();
    }, { passive: true });
    popup.querySelectorAll('[data-vitality-popup-close]').forEach((control) => control.addEventListener('click', close));
    popup.addEventListener('click', (event) => { if (event.target === popup) close(); });
    addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  }
})();
