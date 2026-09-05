/* Build 72: approved child questions; user-approved ages 0–18. */
(function () {
  'use strict';
  const content = {
  "drivers": [
    {
      "title": "Cellular Hydration",
      "subtitle": "Water & everyday hydration",
      "questions": [
        {
          "name": "child_drinks",
          "kind": "checks",
          "options": [
            "Water",
            "Plain milk or a usual milk alternative",
            "Juice",
            "Sweetened drinks",
            "Sports drinks",
            "Caffeinated drinks",
            "Breast milk",
            "Infant formula",
            "Other"
          ],
          "notes": true,
          "label": "What does your child usually drink during a typical day?",
          "help": "Choose all: water; plain milk or a usual milk alternative; juice; sweetened drinks; sports drinks; caffeinated drinks; other. Optional: usual amount, if known."
        },
        {
          "name": "child_drink_access",
          "kind": "frequency",
          "options": [],
          "notes": true,
          "label": "How often can your child get a drink when thirsty at home, school or childcare, and during play?",
          "help": "Frequency. Include any help, reminders or accommodations they use."
        },
        {
          "name": "child_hydration_concerns",
          "kind": "concerns",
          "options": [
            "Unusually strong thirst",
            "Dry mouth or lips",
            "Noticeably dark urine",
            "Headaches",
            "Dizziness",
            "Trouble drinking enough",
            "A change in urination",
            "None observed"
          ],
          "label": "Have you noticed any of these concerns?",
          "help": "Choose all: unusually strong thirst; dry mouth or lips; noticeably dark urine; headaches; dizziness; trouble drinking enough; a change in urination; none observed. Concerns open the shared follow-ups."
        },
        {
          "name": "child_hydration_barriers",
          "kind": "checks",
          "options": [
            "Taste or texture preferences",
            "Forgetting while busy",
            "Water or bathroom access",
            "Needing assistance",
            "A clinician-directed fluid plan",
            "Other",
            "No difficulty"
          ],
          "notes": true,
          "label": "What makes drinking regularly easier or harder for your child?",
          "help": "Choose all: taste or texture preferences; forgetting while busy; water or bathroom access; needing assistance; a clinician-directed fluid plan; other; no difficulty. Optional notes."
        },
        {
          "name": "child_hydration_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What already works well for keeping your child comfortably hydrated?",
          "help": "Optional examples: a preferred cup; water with meals; a school water bottle; supportive reminders; an existing care plan. This is a strengths question, not a prescription."
        }
      ]
    },
    {
      "title": "Systemic Detoxification",
      "subtitle": "Bathroom comfort & everyday environment",
      "questions": [
        {
          "name": "child_bowel_frequency",
          "kind": "select",
          "options": [
            "More than once daily",
            "About once daily",
            "Every other day",
            "Twice weekly or less",
            "Varies widely",
            "Not sure"
          ],
          "label": "How often does your child usually have a bowel movement?",
          "help": "Choose one: more than once daily; about once daily; every other day; twice weekly or less; varies widely; not sure. Record the pattern without assigning a health score."
        },
        {
          "name": "child_stool_concerns",
          "kind": "concerns",
          "options": [
            "Easy to pass",
            "Hard or pellet-like",
            "Large or painful",
            "Loose or watery",
            "Straining",
            "Avoiding or holding stool",
            "Stool accidents after a previously established pattern",
            "None of these",
            "Not observed"
          ],
          "nonConcerns": [
            "Easy to pass"
          ],
          "label": "What are your child’s stools and bathroom visits usually like?",
          "help": "Choose all: easy to pass; hard or pellet-like; large or painful; loose or watery; straining; avoiding or holding stool; stool accidents after a previously established pattern; none of these; not observed. Follow up only on concerns."
        },
        {
          "name": "child_urination_concerns",
          "kind": "concerns",
          "options": [
            "Pain with urination",
            "Unusual urgency",
            "New daytime accidents after a previously established pattern",
            "Another concern",
            "No concern",
            "Not applicable"
          ],
          "label": "Has your child had a new or concerning change in urination or bathroom comfort?",
          "help": "Choose all: pain with urination; unusual urgency; new daytime accidents after a previously established pattern; another concern; no concern; not applicable. Do not count normal toilet learning as a problem."
        },
        {
          "name": "child_environment",
          "kind": "checks",
          "options": [
            "Tobacco smoke or vape exposure",
            "Noticeable dampness or mold",
            "Heavy dust or irritating fumes",
            "Recurring cough, wheeze or nasal congestion",
            "Other",
            "None known"
          ],
          "label": "Are there everyday environmental or breathing concerns you would like the team to know about?",
          "help": "Choose all: tobacco smoke or vape exposure; noticeable dampness or mold; heavy dust or irritating fumes; recurring cough, wheeze or nasal congestion; other; none known. Exposure answers do not establish a cause."
        },
        {
          "name": "child_environment_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What already helps your child’s bathroom comfort and daily environment?",
          "help": "Optional examples: unhurried bathroom access; a comfortable toilet setup; supportive adults; a smoke-free home; following an existing clinician’s plan."
        }
      ]
    },
    {
      "title": "Electrobiology Rhythms",
      "subtitle": "Daily rhythm, daylight & screens",
      "questions": [
        {
          "name": "child_sleep_schedule",
          "kind": "text",
          "options": [],
          "notes": false,
          "help": "Approximate bedtime and waking times on school or childcare days and days off; include naps. You can enter “not sure” or “not applicable.”",
          "label": "What are your child’s usual bedtime and waking time?"
        },
        {
          "name": "child_sleep_consistency",
          "kind": "select",
          "options": [
            "Very variable",
            "Somewhat variable",
            "Mostly consistent",
            "Very consistent",
            "Not sure"
          ],
          "notes": true,
          "label": "How consistent are those sleep and waking times across the week?",
          "help": "Choose one: very variable; somewhat variable; mostly consistent; very consistent; not sure. Optional: what changes the schedule?"
        },
        {
          "name": "child_daylight",
          "kind": "frequency",
          "options": [],
          "notes": true,
          "label": "How often does your child spend time outdoors in daylight?",
          "help": "Frequency. Optional: when and for roughly how long? Include accessible outdoor activities and any medical restrictions."
        },
        {
          "name": "child_evening_screens",
          "kind": "checks",
          "options": [
            "No screens",
            "Shared viewing",
            "Independent viewing or gaming",
            "A device in the sleeping area",
            "A communication or accessibility aid",
            "Varies",
            "Not sure"
          ],
          "notes": true,
          "label": "How are screens usually part of the hour before bed?",
          "help": "Choose all: no screens; shared viewing; independent viewing or gaming; a device in the sleeping area; a communication or accessibility aid; varies; not sure. Optional: any difficulty transitioning to bedtime?"
        },
        {
          "name": "child_rhythm_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "Which routines already help your child settle into the day and wind down at night?",
          "help": "Optional examples: a predictable morning; outdoor play; a bedtime story; dimmer evening lighting; a familiar transition cue."
        }
      ]
    },
    {
      "title": "The Living Diet",
      "subtitle": "Food, nourishment & mealtime experience",
      "questions": [
        {
          "name": "child_meals",
          "kind": "frequency",
          "options": [],
          "notes": true,
          "label": "How often does your child have regular opportunities for meals and snacks that fit their needs?",
          "help": "Frequency. Optional: school schedules, appetite, access or a prescribed feeding plan that affects this."
        },
        {
          "name": "child_food_groups",
          "kind": "checks",
          "options": [
            "Fruits",
            "Vegetables",
            "Grains or starchy foods",
            "Beans, lentils or other protein foods",
            "Eggs, fish or meat",
            "Dairy or suitable alternatives",
            "Other"
          ],
          "label": "Which food groups does your child usually eat over a week?",
          "help": "Choose all: fruits; vegetables; grains or starchy foods; beans, lentils or other protein foods; eggs, fish or meat; dairy or suitable alternatives; other. Cultural foods are welcome; this is not a food-quality grade."
        },
        {
          "name": "child_mealtime_concerns",
          "kind": "concerns",
          "options": [
            "Generally comfortable",
            "Limited accepted foods",
            "Texture or sensory sensitivities",
            "Worry or conflict around meals",
            "Discomfort during or after eating",
            "Appetite concerns",
            "Chewing or swallowing concerns",
            "Other"
          ],
          "nonConcerns": [
            "Generally comfortable"
          ],
          "label": "What is your child’s experience of eating and mealtimes?",
          "help": "Choose all: generally comfortable; limited accepted foods; texture or sensory sensitivities; worry or conflict around meals; discomfort during or after eating; appetite concerns; chewing or swallowing concerns; other. Use shared follow-ups for concerns."
        },
        {
          "name": "child_feeding_support",
          "kind": "select",
          "options": [
            "Yes",
            "No",
            "Not sure",
            "Prefer not to answer"
          ],
          "notes": true,
          "label": "Are there allergies, prescribed food restrictions, feeding supports or family food-access needs we should plan around?",
          "help": "Choose one: yes; no; not sure; prefer not to answer. Optional details. Keep clinician-directed nutrition plans in place."
        },
        {
          "name": "child_food_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What already works well with food in your family?",
          "help": "Optional examples: familiar nourishing meals; relaxed shared meals; involving the child in food preparation; successful sensory accommodations; support from a feeding professional."
        }
      ]
    },
    {
      "title": "Functional Training",
      "subtitle": "Play, movement & physical confidence",
      "questions": [
        {
          "name": "child_movement_enjoyment",
          "kind": "checks",
          "options": [
            "Active play",
            "Walking or wheeling",
            "Dancing",
            "Swimming",
            "Biking",
            "Playground activities",
            "Sports",
            "Adapted movement",
            "Other",
            "No preferred activity yet"
          ],
          "label": "Which ways of moving does your child enjoy?",
          "help": "Choose all: active play; walking or wheeling; dancing; swimming; biking; playground activities; sports; adapted movement; other. No preferred activity yet is also an answer."
        },
        {
          "name": "child_movement_opportunities",
          "kind": "frequency",
          "options": [],
          "notes": true,
          "label": "How often does your child have opportunities to move in ways that fit their abilities and interests?",
          "help": "Frequency. Optional: typical amount of active time; school, childcare or home opportunities."
        },
        {
          "name": "child_movement_concerns",
          "kind": "concerns",
          "options": [
            "Pain",
            "Stiffness",
            "Unusual fatigue",
            "Balance or coordination concerns",
            "Injury",
            "Fear or low confidence",
            "Inaccessible activities",
            "Other",
            "No concern"
          ],
          "label": "Does anything make movement uncomfortable or limit participation?",
          "help": "Choose all: pain; stiffness; unusual fatigue; balance or coordination concerns; injury; fear or low confidence; inaccessible activities; other; no concern. Describe changes from the child’s usual ability."
        },
        {
          "name": "child_movement_support",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What supports or restrictions should we consider when discussing activity?",
          "help": "Optional: a clinician’s advice; therapy plan; assistive equipment; transport; safe space; sensory preferences; coaching or adult help; none needed."
        },
        {
          "name": "child_movement_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What movement strengths or recent successes would you like us to recognize?",
          "help": "Optional examples: enjoyment; persistence; a new skill; comfortable participation; an activity shared with family or friends."
        }
      ]
    },
    {
      "title": "Holistic Recovery",
      "subtitle": "Rest, sleep quality & calming support",
      "questions": [
        {
          "name": "child_sleep_amount",
          "kind": "text",
          "options": [],
          "help": "Estimate sleep in 24 hours, including naps, or enter “not sure.”",
          "label": "About how much does your child actually sleep in 24 hours, including naps?"
        },
        {
          "name": "child_sleep_concerns",
          "kind": "concerns",
          "options": [
            "Trouble settling",
            "Repeated waking",
            "Frequent snoring",
            "Gasping or pauses in breathing during sleep",
            "Persistent mouth breathing",
            "Waking tired",
            "Daytime sleepiness",
            "None observed"
          ],
          "label": "Have you noticed any sleep or breathing concerns?",
          "help": "Choose all: trouble settling; repeated waking; frequent snoring; gasping or pauses in breathing during sleep; persistent mouth breathing; waking tired; daytime sleepiness; none observed. See the review and safety notes."
        },
        {
          "name": "child_recovery",
          "kind": "select",
          "options": [
            "Usually comfortable after ordinary rest",
            "Often needs extra rest",
            "Frequently too tired for usual activities",
            "Varies",
            "Not sure"
          ],
          "notes": true,
          "label": "How does your child recover after a typical day of school, childcare or play?",
          "help": "Choose one: usually comfortable after ordinary rest; often needs extra rest; frequently too tired for usual activities; varies; not sure. Optional: what has changed?"
        },
        {
          "name": "child_calming_support",
          "kind": "checks",
          "options": [
            "A trusted adult",
            "Quiet time",
            "A familiar routine",
            "Gentle movement",
            "Reading or music",
            "A sensory support",
            "Another approach",
            "Still figuring this out"
          ],
          "label": "What helps your child feel calm and supported when tired or overwhelmed?",
          "help": "Choose all: a trusted adult; quiet time; a familiar routine; gentle movement; reading or music; a sensory support; another approach; still figuring this out."
        },
        {
          "name": "child_recovery_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What already works well in your family’s rest and recovery routine?",
          "help": "Optional: a soothing bedtime practice, balanced activity and downtime, responsive support or an established care plan."
        }
      ]
    },
    {
      "title": "G.I. Renovation",
      "subtitle": "Tummy comfort & digestive patterns",
      "questions": [
        {
          "name": "child_digestion_concerns",
          "kind": "concerns",
          "options": [
            "Tummy pain",
            "Bloating",
            "Troublesome gas",
            "Nausea",
            "Reflux-like discomfort",
            "Vomiting",
            "Other",
            "None observed"
          ],
          "label": "Has your child had tummy or digestive concerns during the last 30 days?",
          "help": "Choose all: tummy pain; bloating; troublesome gas; nausea; reflux-like discomfort; vomiting; other; none observed. Reuse bowel-pattern answers from Systemic Detoxification."
        },
        {
          "name": "child_digestion_timing",
          "kind": "checks",
          "options": [
            "Before meals",
            "During or after meals",
            "Around bowel movements",
            "During stressful situations",
            "After a particular food",
            "No clear pattern",
            "Not sure"
          ],
          "whenConcern": "child_digestion_concerns",
          "label": "If there is a concern, when does it tend to happen?",
          "help": "Conditional. Choose all: before meals; during or after meals; around bowel movements; during stressful situations; after a particular food; no clear pattern; not sure. An association does not establish an allergy or cause."
        },
        {
          "name": "child_fiber_foods",
          "kind": "checks",
          "options": [
            "Fruit",
            "Vegetables",
            "Beans or lentils",
            "Whole grains",
            "Other",
            "Very few at present",
            "Not sure"
          ],
          "notes": true,
          "label": "Which fiber-containing foods does your child currently enjoy and tolerate?",
          "help": "Choose all: fruit; vegetables; beans or lentils; whole grains; other; very few at present; not sure. Optional: foods avoided under medical advice. Respect allergies and safe textures."
        },
        {
          "name": "child_digestive_care",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "Is your child receiving care for digestive concerns, or taking anything the team should know about?",
          "help": "Optional: an existing diagnosis or plan; prescribed medicines; antibiotics in the past year; supplements or probiotics; none; prefer not to answer. Do not interpret prescribed treatment as a failure."
        },
        {
          "name": "child_digestion_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What already helps your child feel comfortable and supported around digestion?",
          "help": "Optional: familiar tolerated foods; an established bathroom routine; responsive adults; following a clinician’s plan. No testing or supplement purchase is required."
        }
      ]
    },
    {
      "title": "Hormone Balancing",
      "subtitle": "Growth & development",
      "questions": [
        {
          "name": "child_growth_concern",
          "kind": "select",
          "options": [
            "No current concern",
            "A parent or child concern",
            "A clinician-identified concern",
            "Both",
            "Not sure"
          ],
          "notes": true,
          "label": "Do you or your child’s healthcare professional have any concerns about growth or development?",
          "help": "Choose one: no current concern; a parent or child concern; a clinician-identified concern; both; not sure. Optional details; no body-weight target or hormone interpretation."
        },
        {
          "name": "child_growth_changes",
          "kind": "concerns",
          "options": [
            "Energy",
            "Skin",
            "Hair",
            "Temperature comfort",
            "Mood",
            "Other",
            "None observed"
          ],
          "label": "Have you noticed a persistent change in energy, skin, hair, temperature comfort or mood that concerns you?",
          "help": "Choose all relevant changes; other; none observed. Use shared follow-ups and avoid assuming the change is hormonal."
        },
        {
          "name": "child_puberty_support",
          "kind": "select",
          "options": [
            "Yes",
            "No",
            "Not applicable",
            "Prefer to discuss privately"
          ],
          "optional": true,
          "notes": true,
          "label": "Are body changes or puberty a topic your child or family would like help discussing?",
          "help": "Optional: yes; no; not applicable; prefer to discuss privately. Show a follow-up only when relevant, regardless of age within this proposed range."
        },
        {
          "name": "child_period_concerns",
          "kind": "select",
          "options": [
            "No concern",
            "Some effect",
            "Substantial effect",
            "Not sure",
            "Prefer to discuss with a healthcare professional"
          ],
          "optional": true,
          "when": "child_periods_begun:Yes",
          "label": "If periods have begun, is pain, bleeding or another period concern affecting usual activities?",
          "help": "Optional and conditional on periods having begun: no concern; some effect; substantial effect; not sure; prefer to discuss with a healthcare professional. No fertility or sexual-function questions."
        },
        {
          "name": "child_growth_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What already helps your child feel informed, comfortable and supported as they grow?",
          "help": "Optional: a trusted adult; age-appropriate information; respectful conversations; an existing healthcare relationship."
        }
      ]
    },
    {
      "title": "Neural Repatterning",
      "subtitle": "Learning, attention & flexibility",
      "questions": [
        {
          "name": "child_learning",
          "kind": "select",
          "options": [
            "Comfortably",
            "Some difficulty",
            "Substantial difficulty",
            "Varies by setting",
            "Not sure"
          ],
          "label": "How is your child managing play, learning and everyday tasks with their usual supports?",
          "help": "Choose one: comfortably; some difficulty; substantial difficulty; varies by setting; not sure. Consider the child’s own abilities and usual pattern, not an adult standard."
        },
        {
          "name": "child_learning_concerns",
          "kind": "concerns",
          "options": [
            "Getting started",
            "Staying engaged",
            "Remembering instructions",
            "Moving between activities",
            "Handling noise or other sensory input",
            "Mental tiredness",
            "Other",
            "None currently"
          ],
          "label": "Are there particular areas where additional support would help?",
          "help": "Choose all: getting started; staying engaged; remembering instructions; moving between activities; handling noise or other sensory input; mental tiredness; other; none currently. Use shared follow-ups for concerns."
        },
        {
          "name": "child_learning_settings",
          "kind": "checks",
          "options": [
            "Home",
            "School or childcare",
            "Group activities",
            "Unfamiliar settings",
            "No clear pattern",
            "Not applicable"
          ],
          "notes": true,
          "label": "Where are these activities easier or harder for your child?",
          "help": "Choose all: home; school or childcare; group activities; unfamiliar settings; no clear pattern; not applicable. Optional: supports that change the experience."
        },
        {
          "name": "child_learning_support",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "Which activities or accommodations help your child learn and engage?",
          "help": "Optional: hands-on play; stories; art; puzzles; movement breaks; predictable instructions; communication aids; school or therapy supports; other."
        },
        {
          "name": "child_learning_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What learning strengths, interests or recent successes should we know about?",
          "help": "Optional free text. Recognize curiosity, creativity and individual strengths without ranking neurodevelopmental differences as poor health."
        }
      ]
    },
    {
      "title": "Momentum Regimens",
      "subtitle": "Family routines & small steps",
      "questions": [
        {
          "name": "child_predictable_routines",
          "kind": "checks",
          "options": [
            "Waking",
            "Meals",
            "School or childcare preparation",
            "Movement",
            "Downtime",
            "Bedtime",
            "None yet",
            "Varies between homes or caregivers"
          ],
          "label": "Which routines feel reasonably predictable for your child?",
          "help": "Choose all: waking; meals; school or childcare preparation; movement; downtime; bedtime; none yet; varies between homes or caregivers."
        },
        {
          "name": "child_routine_effort",
          "kind": "text",
          "options": [],
          "help": "Describe one priority and the child’s experience, or enter “not sure” or “not applicable.”",
          "label": "Which daily transition or routine currently takes the most effort?"
        },
        {
          "name": "child_routine_barriers",
          "kind": "checks",
          "options": [
            "Changing schedules",
            "Caregiver workload",
            "Sleep",
            "Health needs",
            "Sensory or learning needs",
            "Competing demands",
            "Unclear plan",
            "Other",
            "No major barrier"
          ],
          "label": "What most often gets in the way of the routines you would like?",
          "help": "Choose all: changing schedules; caregiver workload; sleep; health needs; sensory or learning needs; competing demands; unclear plan; other; no major barrier."
        },
        {
          "name": "child_routine_restart",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "When a routine is interrupted, what helps your family restart?",
          "help": "Optional: a smaller step; visual reminders; shared planning; help from another adult; a familiar cue; still figuring this out."
        },
        {
          "name": "child_routine_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "Which small routine is already working and could be built on?",
          "help": "Optional: describe one realistic success. A child is not responsible for managing the household’s consistency."
        }
      ]
    },
    {
      "title": "Mentality Realignment",
      "subtitle": "Emotional well-being, connection & confidence",
      "questions": [
        {
          "name": "child_enjoyment",
          "kind": "frequency",
          "options": [],
          "label": "How often does your child seem able to enjoy play, relationships or favorite activities?",
          "help": "Frequency. Include observations and anything the child has shared; a parent cannot know every internal experience."
        },
        {
          "name": "child_emotional_concerns",
          "kind": "concerns",
          "options": [
            "Worry",
            "Sadness",
            "Irritability",
            "Withdrawal",
            "Harsh self-talk",
            "Feeling overwhelmed",
            "Loss of interest",
            "Other",
            "None observed"
          ],
          "label": "Have you noticed recurring emotional concerns or a change from your child’s usual behavior?",
          "help": "Choose all: worry; sadness; irritability; withdrawal; harsh self-talk; feeling overwhelmed; loss of interest; other; none observed. Use shared follow-ups; this does not diagnose a mental-health condition."
        },
        {
          "name": "child_trusted_support",
          "kind": "select",
          "options": [
            "Yes",
            "Sometimes",
            "Not sure",
            "Not currently"
          ],
          "notes": true,
          "label": "Does your child have someone they feel comfortable turning to when upset or worried?",
          "help": "Choose one: yes; sometimes; not sure; not currently. Optional: what helps them communicate, including nonverbal communication?"
        },
        {
          "name": "child_relationships",
          "kind": "checks",
          "options": [
            "Friendship difficulties",
            "Bullying concerns",
            "Loss",
            "A family change",
            "School stress",
            "Another concern",
            "None known"
          ],
          "optional": true,
          "label": "Are relationships or recent life changes affecting how supported your child feels?",
          "help": "Optional: friendship difficulties; bullying concerns; loss; a family change; school stress; another concern; none known. Detailed sensitive disclosures can be discussed with an appropriate professional."
        },
        {
          "name": "child_emotional_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What helps your child feel connected, capable and valued?",
          "help": "Optional examples: warm time together; a trusted relationship; creative play; an encouraging routine; meaningful interests; supportive professional care."
        }
      ]
    },
    {
      "title": "Wise Budgeting",
      "subtitle": "Family resources & practical support",
      "questions": [
        {
          "name": "child_resource_barriers",
          "kind": "checks",
          "options": [
            "Food costs",
            "Time",
            "Transport",
            "Safe activity space",
            "Childcare",
            "Access to healthcare or therapy",
            "Insurance",
            "Other",
            "None currently"
          ],
          "optional": true,
          "label": "What practical barriers make supporting your child’s well-being harder right now?",
          "help": "Optional. Choose all: food costs; time; transport; safe activity space; childcare; access to healthcare or therapy; insurance; other; none currently."
        },
        {
          "name": "child_useful_support",
          "kind": "checks",
          "options": [
            "Affordable meal ideas",
            "Simpler routines",
            "Accessible activity ideas",
            "Help finding community resources",
            "Caregiver support",
            "Help organizing questions for a healthcare visit",
            "Other"
          ],
          "optional": true,
          "max": 3,
          "label": "Which kinds of support would be most useful?",
          "help": "Optional. Choose up to three: affordable meal ideas; simpler routines; accessible activity ideas; help finding community resources; caregiver support; help organizing questions for a healthcare visit; other."
        },
        {
          "name": "child_family_support",
          "kind": "checks",
          "options": [
            "Another caregiver",
            "Relatives",
            "School or childcare",
            "Community groups",
            "A healthcare team",
            "Currently limited support",
            "Other"
          ],
          "optional": true,
          "label": "Who or what can help your family carry out a realistic plan?",
          "help": "Optional: another caregiver; relatives; school or childcare; community groups; a healthcare team; currently limited support; other."
        },
        {
          "name": "child_resource_limits",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What cost, time or access limits should the team respect?",
          "help": "Optional: focus on free options; a small flexible budget; discuss privately; describe available time or another limit. No income, savings or spending amount is required."
        },
        {
          "name": "child_resource_strengths",
          "kind": "text",
          "options": [],
          "optional": true,
          "label": "What is your family already doing that makes good use of the resources you have?",
          "help": "Optional: shared meals; community activities; using existing supports; practical planning; another strength. These answers guide support, not a child’s health rating."
        }
      ]
    }
  ],
  "snapshot": [
    {
      "name": "child_goals",
      "kind": "checks",
      "options": [
        "Energy",
        "Sleep",
        "Digestion or bathroom comfort",
        "Food or mealtimes",
        "Movement or play",
        "Learning or attention",
        "Emotions or stress",
        "Family routines",
        "Growth or development questions",
        "Other"
      ],
      "max": 3,
      "notes": true,
      "label": "What would you most like support with for your child?",
      "help": "Choose up to three: energy; sleep; digestion or bathroom comfort; food or mealtimes; movement or play; learning or attention; emotions or stress; family routines; growth or development questions; other."
    },
    {
      "name": "child_daily_life",
      "kind": "matrix",
      "options": [
        "Energy",
        "Sleep",
        "Digestive comfort",
        "Physical comfort",
        "Play or movement",
        "Learning",
        "Emotional well-being",
        "Enjoyment"
      ],
      "label": "How is your child doing in everyday life during the last 30 days?",
      "help": "For each: energy, sleep, digestive comfort, physical comfort, play or movement, learning, emotional well-being and enjoyment. Choose: going well; some difficulty; substantial difficulty; not sure; not applicable. No numerical total."
    },
    {
      "name": "child_participation",
      "kind": "select",
      "options": [
        "Not at all",
        "A little",
        "Somewhat",
        "A lot",
        "Not sure"
      ],
      "notes": true,
      "label": "Are health concerns affecting participation in home life, school or childcare, play, or friendships?",
      "help": "Choose: not at all; a little; somewhat; a lot; not sure. Optional: the activities most affected."
    },
    {
      "name": "child_health_history",
      "kind": "text",
      "options": [],
      "optional": true,
      "label": "What health history or existing support should the team understand?",
      "help": "Optional: diagnoses; allergies; medicines or supplements; significant injuries or surgery; disability or developmental needs; feeding, school or therapy supports; relevant clinician instructions. Share only what is useful."
    },
    {
      "name": "child_main_concern",
      "kind": "text",
      "options": [],
      "optional": true,
      "label": "What concerns you most, and what has already been discussed with a healthcare professional?",
      "help": "Optional free text, including any current care plan. This avoids duplicating or contradicting existing support."
    },
    {
      "name": "child_goal_90_days",
      "kind": "text",
      "options": [],
      "help": "Describe one change, or enter “not sure yet.”",
      "label": "What one change would make daily life better over the next 90 days?"
    }
  ]
};
  const skipOptions = ['Not sure / not observed', 'Not applicable to age or development', 'Prefer not to answer'];
  const frequency = ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'];
  const neutralOptions = new Set(['None observed','None of these','Not observed','No concern','None known','None currently','No difficulty','No screens','No preferred activity yet','None yet','No major barrier','Not applicable','Not sure', ...skipOptions]);
  const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const escape = value => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  const withSkips = options => [...new Set([...options, ...skipOptions])];
  const optionMarkup = options => '<option value="">Select one</option>' + options.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('');
  let helpers;

  function renderQuestion(question) {
    const {name, label, optional, notes, max} = question;
    let help = question.help || '';
    // Remove authoring directions; keep the approved context and examples.
    help = help.replace(/^(Choose all:|Choose one:|Choose up to three:|Optional\. Choose all:|Optional\. Choose up to three:)[^.]*\.\s*/,'')
      .replace(/^Frequency\.\s*/,'').replace(/^Optional and conditional on periods having begun:[^.]*\.\s*/,'')
      .replace(/Concerns open the shared follow-ups\.|Follow up only on concerns\.|Use shared follow-ups for concerns\.|Use shared follow-ups and avoid assuming the change is hormonal\.|Use shared follow-ups; /g,'')
      .replace(/See the review and safety notes\./g,'').replace(/Show a follow-up only when relevant, regardless of age within this proposed range\./g,'').trim();
    const safeLabel = escape(label);
    let body;
    if (question.kind === 'text') {
      body = helpers.textQuestion(name,safeLabel,escape(help),!optional);
    } else if (question.kind === 'matrix') {
      body = helpers.subsection(label) + question.options.map((item,index) => helpers.selectQuestion(`${name}_${index+1}`,escape(item),['Going well','Some difficulty','Substantial difficulty','Not sure','Not applicable','Prefer not to answer'],'',true)).join('');
    } else if (['checks','concerns'].includes(question.kind)) {
      const options = withSkips(question.options);
      body = helpers.checks(name, `${safeLabel}${optional ? '' : ' '+helpers.requiredMark}`, options, `${max ? `Choose up to ${max}. ` : 'Select all that apply. '}${escape(help)}`, max);
      body = body.replace('<fieldset ',`<fieldset data-child-group="${name}" ${optional ? '' : 'data-child-required'} ${question.kind==='concerns' ? 'data-child-concerns' : ''} `);
      if (question.kind === 'concerns') body = body.replace('</fieldset>', '<div class="vitality-symptom-details" data-child-details></div></fieldset>');
    } else {
      body = helpers.selectQuestion(name,safeLabel,withSkips(question.kind==='frequency' ? frequency : question.options),escape(help),!optional);
    }
    if (notes) body += helpers.textQuestion(name+'_notes','Additional details (optional)','Share any context that would help the team understand this answer.',false,2);
    if (question.when) body = `<div data-show-when="${question.when}" hidden>${body}</div>`;
    if (question.whenConcern) body = `<div data-child-show-concern="${question.whenConcern}" hidden>${body}</div>`;
    return body;
  }

  function buildSections(sharedHelpers) {
    helpers = sharedHelpers;
    const safety = '<div class="vitality-safety"><strong>A note about urgent concerns</strong><p>This form is not continuously monitored and cannot provide emergency care. If your child is in immediate danger, contact local emergency services now. Do not wait for a coach reply.</p></div>';
    const snapshot = {
      key:'child_snapshot', label:'Whole-Child Snapshot',
      html:() => helpers.heading('THE WHOLE CHILD','Whole-Child Snapshot','Help us understand your child’s everyday experience—what feels easy, what feels difficult, and what already helps. Consider the last 30 days unless a question says otherwise. There are no perfect families or “right” answers.')
        + '<div class="vitality-disclaimer">Answer for your child’s age, abilities and usual supports. Choose “Not applicable to age or development” whenever a question does not fit. These questions do not provide feeding, fluid or developmental targets.</div>'
        + content.snapshot.map(renderQuestion).join('')
        + helpers.textQuestion('child_own_words','Your child’s own words (optional)','If comfortable and appropriate, invite your child to share a favorite activity, something that feels difficult, and something that helps. Record their words separately from your observations; communication supports are welcome.',false)
        + safety
    };
    return [snapshot, ...content.drivers.map((driver,index) => ({
      key:'child_driver_'+(index+1), label:driver.title,
      html:() => helpers.heading(`DRIVER ${index+1} OF 12`,driver.title,driver.subtitle)
        + (index===6 ? '<div class="vitality-disclaimer">Your bowel-pattern answers from Systemic Detoxification will be included automatically in the coach’s review.</div>' : '')
        + driver.questions.map(question => (question.name==='child_period_concerns'
          ? helpers.selectQuestion('child_periods_begun','Have periods begun?',['Yes','No','Not sure','Not applicable','Prefer not to answer'],'Optional. This determines whether the period question is relevant.',false)
          : '') + renderQuestion(question)).join('')
        + (index===5 ? '<div class="vitality-safety" data-child-sleep-guidance hidden><strong>Please discuss breathing concerns with your child’s healthcare professional.</strong><p>Frequent snoring or breathing pauses warrant prompt pediatric review. If your child is having severe breathing difficulty now, contact local emergency services.</p></div>' : '')
        + (index===10 ? '<div class="vitality-disclaimer">A parent’s observations cannot capture every internal experience or rule out suicide risk. Emotional concerns deserve appropriate professional follow-up. If your child is in immediate danger, contact local emergency services now.</div>' : '')
        + (index===11 ? helpers.radio('child_final_accuracy','I have answered as accurately as I reasonably can and understand that this educational coaching assessment will be reviewed by the ReVitalized Academy team.',['Yes, submit my child’s assessment'],'This assessment does not diagnose or treat conditions.') : '')
    }))];
  }

  function definition(name) { return [...content.snapshot,...content.drivers.flatMap(d=>d.questions)].find(q=>q.name===name); }
  function concernValues(group) {
    const nonConcerns = definition(group.dataset.childGroup).nonConcerns || [];
    return [...group.querySelectorAll('input[type="checkbox"]:checked')].filter(c=>!c.disabled && !neutralOptions.has(c.value) && !nonConcerns.includes(c.value)).map(c=>c.value);
  }
  function detailCard(prefix, symptom) {
    const name = prefix+'_'+slug(symptom);
    const fields = [
      ['frequency','How often?',withSkips(frequency)],
      ['distress','How uncomfortable or distressing?',['None','Mild','Moderate','Severe',...skipOptions]],
      ['duration','How long has it been present?',['Less than 2 weeks','2–6 weeks','More than 6 weeks to 3 months','More than 3 months to 1 year','More than 1 year',...skipOptions]],
      ['impact','Effect on sleep, play, learning, relationships or family life?',['None','A little','Somewhat','A lot',...skipOptions]],
      ['professional_review','Has a healthcare professional assessed it?',['Yes','No',...skipOptions]]
    ];
    return `<div class="vitality-symptom-card" data-symptom-card="${escape(symptom)}"><strong>${escape(symptom)}</strong><div class="vitality-detail-grid">${fields.map(([key,label,options])=>`<label>${label}<select name="${name}_${key}" required>${optionMarkup(options)}</select></label>`).join('')}</div><label class="vitality-child-plan">Current care plan or additional context (optional)<textarea name="${name}_care_plan" rows="2"></textarea></label></div>`;
  }
  function update(form, target) {
    const group = target && target.closest('[data-child-group]');
    if (group && target.type==='checkbox' && target.checked) {
      const boxes=[...group.querySelectorAll('input[type="checkbox"]')];
      if (neutralOptions.has(target.value)) boxes.filter(c=>c!==target).forEach(c=>{c.checked=false;});
      else boxes.filter(c=>neutralOptions.has(c.value)).forEach(c=>{c.checked=false;});
      // Comfort answers do not coexist with a contradictory concern.
      const nonConcerns = definition(group.dataset.childGroup).nonConcerns || [];
      if (nonConcerns.includes(target.value)) boxes.filter(c=>c!==target).forEach(c=>{c.checked=false;});
      else boxes.filter(c=>nonConcerns.includes(c.value)).forEach(c=>{c.checked=false;});
    }
    form.querySelectorAll('[data-child-concerns]').forEach(screen=>{
      const values=concernValues(screen);
      const host=screen.querySelector('[data-child-details]');
      [...host.querySelectorAll('[data-symptom-card]')].forEach(card=>{if(!values.includes(card.dataset.symptomCard))card.remove();});
      values.forEach(value=>{if(![...host.children].some(card=>card.dataset.symptomCard===value))host.insertAdjacentHTML('beforeend',detailCard(screen.dataset.childGroup,value));});
    });
    form.querySelectorAll('[data-child-show-concern]').forEach(container=>{
      const source=form.querySelector(`[data-child-group="${container.dataset.childShowConcern}"]`);
      const show=source && concernValues(source).length>0;
      container.hidden=!show;
      container.querySelectorAll('input,select,textarea').forEach(c=>{c.disabled=!show;});
    });
    const guidance=form.querySelector('[data-child-sleep-guidance]');
    if(guidance)guidance.hidden=!sleepFlag(form);
  }
  function sleepFlag(form) {
    return [...form.querySelectorAll('[name="child_sleep_concerns"]:checked')].some(c=>['Frequent snoring','Gasping or pauses in breathing during sleep'].includes(c.value));
  }
  function validate(panel) {
    for(const group of panel.querySelectorAll('[data-child-required],[data-child-group][data-max-choices]')) {
      const enabled=[...group.querySelectorAll('input[type="checkbox"]')].filter(c=>!c.disabled);
      const chosen=enabled.filter(c=>c.checked);
      if(enabled.length && group.hasAttribute('data-child-required') && !chosen.length) return {group,message:'Please answer “'+group.querySelector('legend').textContent.replace('*','').trim()+'” above. You can choose not sure, not applicable, or prefer not to answer.'};
      if(group.dataset.maxChoices && chosen.length>Number(group.dataset.maxChoices)) return {group,message:`Please choose no more than ${group.dataset.maxChoices} answers for “${group.querySelector('legend').textContent.replace('*','').trim()}”.`};
    }
    return null;
  }
  window.ReVitalizedChildAssessment = {buildSections, update, validate, reviewFlags:form=>sleepFlag(form) ? ['CHILD: REPORTED SNORING / BREATHING PAUSES — PROFESSIONAL REVIEW'] : []};

})();
