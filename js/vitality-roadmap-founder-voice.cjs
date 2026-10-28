'use strict';
// Presentation only. No source retrieval, model calls, numerical rules or new coaching protocols.
// The selected founder directions remain verbatim; this layer supplies connecting prose.
const assert = require('node:assert/strict');
const registry = require('../config/roadmap-b4/source-map.json');
const VERSION = 'founder-coaching-voice-v1-20261028';
const METHOD = '996554e27739dd90effda72adcec60493d640f086b15c07c0ca2c29fe08e440b';
const framing = {
  cellular_hydration: 'Let’s use your drinking routine and the symptoms you reported to decide where to begin, rather than assuming that every symptom has the same explanation.',
  systemic_detoxification: 'The useful starting point here is your actual routine and exposure context. We can discuss the suggestions without treating these answers as proof of a detoxification problem.',
  electrobiology_rhythms: 'Your day-to-day rhythm gives us something practical to work with. We can look at the routine you described alongside your concerns, without assuming that sleep timing explains them all.',
  the_living_diet: 'Your eating routine gives us a starting point for choosing a change that fits your life. The next steps below come from the Academy’s approved food guidance.',
  functional_training: 'Let’s start with the training context you actually described. The approved mobility guidance is a discussion option; these answers do not tell us what exercise is safe or appropriate for every circumstance.',
  holistic_recovery: 'We can build the recovery discussion around the routines you already have and the difficulties you still notice. A helpful habit and a continuing concern can both deserve attention.',
  gastrointestinal_renovation: 'The details of your digestive experience matter when choosing which food or routine suggestion to discuss. We should not assume that one change will explain or resolve every symptom.',
  hormone_balancing: 'These answers give us context for a coaching conversation, not a diagnosis of a hormone imbalance. Any next step needs to fit the pathway and symptoms you actually reported.',
  neural_repatterning: 'Let’s work from the learning, memory and stress context you shared. It can help us choose a relevant coaching discussion without drawing conclusions about a neurological condition.',
  momentum_regimens: 'The goal is to make the habits you choose workable in your real week. Your answers help us see where follow-through needs a closer conversation, rather than treating a difficult week as a personal failure.',
  mentality_realignment: 'Your perspective and the way you respond to setbacks are part of this conversation. We can use what you shared to discuss the Academy’s approach without assuming how you feel beyond your answers.',
  wise_budgeting: 'A useful plan has to respect the resources you actually have. This discussion stays focused on your reported financial context; it is separate from physiological scoring.'
};
const habitPhrases = {
  water_intake_consistency: 'drinking enough water to comfortably meet your needs',
  electrolyte_consistency: 'including food or beverage sources of electrolytes',
  whole_body_movement: 'moving your whole body through the day', walking_regularity: 'walking regularly',
  sleep_wake_consistency: 'keeping a consistent sleep/wake schedule',
  eating_eat_slowly_enough_to_chew_thoroughly: 'taking time to chew thoroughly',
  eating_eat_while_relatively_relaxed: 'eating while relatively relaxed',
  eating_eat_without_significant_distraction: 'eating without significant distraction',
  eating_stop_eating_when_comfortably_satisfied: 'stopping when comfortably satisfied',
  eating_consume_mostly_whole_minimally_processed_foods: 'choosing mostly whole, minimally processed foods',
  eating_include_fermented_foods_if_tolerated: 'including fermented foods when tolerated',
  eating_avoid_habitual_overeating: 'avoiding habitual overeating',
  eating_maintain_an_eating_rhythm_that_works_well_for_you: 'keeping an eating rhythm that works for you',
  recovery_behavior_regular_sleep_schedule: 'keeping a regular sleep schedule',
  recovery_behavior_relaxation_decompression: 'making room for relaxation and decompression',
  recovery_behavior_rest_days: 'taking rest days', recovery_behavior_walking_light_movement: 'walking or doing light movement',
  recovery_behavior_mobility: 'practicing mobility', recovery_behavior_breathwork: 'practicing breathwork',
  recovery_behavior_appropriate_recovery_after_training: 'allowing appropriate recovery after training',
  fermented_foods: 'including fermented foods when tolerated', fiber_whole_foods: 'including fiber-rich whole foods',
  challenging_learning: 'deliberately learning something challenging',
  memory_skill_activities: 'doing activities that use memory, problem-solving or skill',
  daily_habit_consistency: 'completing the health habits you intend to do',
  gratitude: 'recognizing things you appreciate', self_education: 'learning skills or ideas for your health and life'
};
const quote = value => '“' + String(value).slice(0, 2000) + '”';
const usable = o => o && ['known_context', 'known_zero'].includes(o.status) && o.submitted?.length &&
  !o.submitted.some(v => ["I don't know", 'Unknown', 'Not sure', 'Prefer not to answer', 'Prefer not to say', 'Not applicable / prefer not to answer'].includes(v));
function factSentence(fact, observations, symptoms) {
  if (!fact) return '';
  const symptom = symptoms.find(s => s.evidence[0] === fact.evidence[0] && fact.text.startsWith(s.label + ' —'));
  if (symptom) {
    const r = symptom.reported;
    return 'You reported ' + quote(symptom.label) + (r.frequency ? ' at a frequency of ' + quote(r.frequency) : ', without a frequency response') +
      (r.disruption ? ', and described the disruption as ' + quote(r.disruption) : ', without a disruption response') + '.' +
      (r.duration ? ' You said this had lasted ' + quote(r.duration) + '.' : ' The duration is still unclear.');
  }
  const o = observations.find(o => fact.evidence.includes(o.id));
  if (!usable(o)) return fact.text;
  if (habitPhrases[o.id] && o.submitted.length === 1) {
    return 'You chose ' + quote(o.submitted[0]) + ' for ' + habitPhrases[o.id] + '.';
  }
  return 'For ' + quote(o.label) + ', you answered ' + o.submitted.map(quote).join(', ') + '.';
}
function fullText(sections, held) {
  return 'WHAT YOUR ANSWERS SUGGEST\n' + sections.whatYourAnswersSuggest + '\n\nWHY THIS MATTERS\n' + sections.whyThisMatters +
    '\n\nRECOMMENDED NEXT STEPS\n' + (sections.recommendedNextSteps.join('\n') || (held ? 'Routine coaching planning remains on hold.' : 'Let’s clarify the missing information before choosing a step.'));
}
function present(input, observed) {
  assert.equal(input.ruleHash, METHOD, 'Coaching voice requires the frozen founder-methodology V2 ruleset');
  assert.deepEqual(Object.keys(input.drivers).sort(), Object.keys(framing).sort());
  if (input.presentation) { assert.deepEqual(input.presentation, metadata()); return structuredClone(input); }
  const out = structuredClone(input), held = !!out.roadmap.safetyNotice;
  const shared = new Map(input.sharedEvidence.map(o => [o.id, o]));
  const goal = shared.get('ninety_day_goal'), goals = shared.get('primary_goals');
  const naturalFacts = {}, conflicts = {};
  for (const [key, d] of Object.entries(out.drivers)) {
    const observations = observed.drivers[key].observations;
    const symptoms = input.symptomTraces.filter(s => s.driver === key);
    const conflict = observations.filter(o => o.status === 'conflicting');
    const noneConflict = conflict.some(o => registry.fields[o.id]?.options?.includes('None of these') &&
      o.submitted.includes('None of these') && o.submitted.some(v => v !== 'None of these'));
    conflicts[key] = conflict.length > 0;
    const symptomFacts = d.concerns.filter(f => f.kind === 'reported_concern');
    const highRefs = new Set(symptoms.filter(s => ['Severe','Significant'].includes(s.reported.disruption)).flatMap(s => s.evidence.slice(1)));
    symptomFacts.sort((a,b) => Number(b.evidence.some(id => highRefs.has(id))) - Number(a.evidence.some(id => highRefs.has(id))));
    const facts = [...symptomFacts.slice(0, 2), ...d.concerns.filter(f => f.kind !== 'reported_concern').slice(0,1), ...d.strengths.slice(0, 1), ...d.observations.slice(0, 1)];
    naturalFacts[key] = facts.map(f => factSentence(f, observations, symptoms));
    const hasFacts = facts.length > 0;
    let opening = !hasFacts ? 'You haven’t provided enough usable information here for a personal interpretation. We’ll leave this Driver open rather than fill in the blanks.' :
      d.highImpact ? 'You described disruption that deserves attention before we focus on improving routines. The helpful habits you reported still matter, but they don’t cancel that concern.' :
      d.concerns.length && d.strengths.length ? 'There are useful habits to build on here, alongside something that still needs attention. We can keep what is working while looking more closely at the difficulty you described.' :
      d.concerns.length ? 'There is a practical place to begin in what you shared. Let’s look at the difficulty in its own context before deciding which change to try.' :
      d.strengths.length ? 'You already have something to build on here. Let’s keep that routine in view while checking what else matters to you; a helpful habit alone doesn’t tell the whole story.' :
      'What you shared gives us a starting point for this conversation. We’ll keep the interpretation close to those answers.';
    if (conflict.length) opening = 'Your selections need clarification: ' + (noneConflict ? 'you chose “None of these” alongside another response in the same question.' : 'the source contains conflicting responses to a question in this Driver.') + ' We won’t treat either as a settled answer. Please check the question with your coach.';
    const suggest = (conflict.length ? [opening, ...naturalFacts[key]] : [...naturalFacts[key], opening]).join('\n');
    const why = held ? 'The existing safety review takes priority. We’ll keep the information you shared available for that review, with routine coaching recommendations on hold.' :
      !hasFacts ? 'A useful recommendation needs your own context. There isn’t enough here to choose one responsibly yet.' :
      framing[key] + (d.goalMatch ? ' This also connects with a goal you selected.' : '') +
      (d.selectedDirections.length ? ' The suggestions below are options to discuss together, not promises of a particular result.' : ' The available answers don’t yet support a specific next step.');
    const sections = {whatYourAnswersSuggest: suggest, whyThisMatters: why, recommendedNextSteps: [...d.sections.recommendedNextSteps]};
    if(conflict.length) out.roadmap.drivers[key].presentationClarifications = conflict.map(o => ({kind:'conflicting_source_context', evidence:[o.id]}));
    d.sections = sections;
    d.interpretation.text = fullText(sections, held);
    Object.assign(out.roadmap.drivers[key], {sections, summary: d.interpretation.text});
  }
  const firstFact = key => naturalFacts[key][0] || 'We need more context before choosing a step.';
  out.roadmap.summary = [
    goal ? 'You want ' + quote(goal.submitted.join(' · ')) + '. Let’s use that goal to keep this conversation focused on what matters to you.' :
      goals ? 'You selected ' + goals.submitted.map(quote).join(' and ') + ' as goals. We can start there and clarify what progress would mean in your daily life.' :
      'Let’s work with what you’ve shared and be clear about what we still need to ask.',
    held ? 'Your reported safety concern comes first. Routine coaching planning is on hold under the existing safety workflow.' :
      out.roadmap.priorities.length ? 'The starting points below reflect your reported difficulties, helpful routines and selected goals. They are a starting point for our conversation, so you can confirm what fits and correct what doesn’t.' :
      'There isn’t enough context to choose personal priorities yet. Missing answers will stay unanswered.',
    'The 12 Drivers bring those details together. Scores and Health Spectrum stages remain unassigned where the required measurements or rules are incomplete.'
  ].join('\n');
  out.roadmap.strengths = out.roadmap.strengths.map(s => {
    const key = Object.keys(out.drivers).find(k => observed.drivers[k].name === s.summary);
    return {...s, reason: factSentence(out.drivers[key].strengths[0], observed.drivers[key].observations, input.symptomTraces.filter(x => x.driver === key))};
  });
  out.roadmap.priorities = out.roadmap.priorities.map(p => ({...p, reason: firstFact(p.driver) + '\n' +
    (conflicts[p.driver] ? 'Clarify the conflicting selection before choosing a change.' : out.drivers[p.driver].highImpact ?
      'Let’s give this concern room in the conversation before adding more to your routine.' : 'This is one place to start the conversation; we still need to agree what feels workable.') +
    '\n' + out.drivers[p.driver].selectedDirections[0].text}));
  out.roadmap.relationships = out.roadmap.relationships.map(r => ({...r, reason: r.drivers.map(firstFact).join('\n') +
    '\nIt may be useful to explore these together. Your answers don’t tell us that one caused the other, so we’ll keep the connection provisional.'}));
  const titles = ['Choose a starting point', 'Review how it fits your week', 'Return to your goal'];
  const intros = [
    'Start by discussing the source-cited options below with your coach. Choose what fits your circumstances; you don’t need to begin every suggestion at once.',
    'Use this conversation to look at what was workable and what got in the way. The approved direction for this phase is:',
    'Come back to what you wanted from these 90 days. Discuss what to keep or reconsider, without assuming that a completed habit means your symptoms improved. The approved direction is:'
  ];
  out.roadmap.phases = out.roadmap.phases.map((p, i) => ({...p, title: titles[i], instruction: intros[i] + (i ? '\n' + p.instruction : ''),
    focus: p.focus.map(f => ({...f, action: (conflicts[f.driver] ? 'First clarify the conflicting selection in the cited evidence.\n' : '') +
      (i === 0 ? 'Discuss this starting option, using its cited answers:\n' : i === 1 ? 'Revisit the option you agreed to try.\n' : 'Review this option against your goal and your experience.\n') + f.action}))}));
  out.presentation = metadata();
  out.roadmap.presentation = metadata();
  return out;
}
// Canonical source hash pinned before bundling; never hash Function.toString() at runtime.
// Bundlers transform function syntax, so runtime identity must retain this reviewed literal.
const HASH = 'da9f982e58f7bfc4eab42aacf6812e55862b10fe73bdab12d16098757c7add64';
function metadata() { return {version: VERSION, hash: HASH, methodologyHash: METHOD, optIn: true, newMethodologyDirections: 0}; }
function verifyDocument(document) {
  assert.deepEqual(document.narrative.presentation, metadata());
  assert.deepEqual(document.roadmap.presentation, metadata());
  assert.equal(document.narrative.ruleHash, METHOD);
  for (const [key, d] of Object.entries(document.roadmap.drivers)) {
    assert.equal(document.drivers[key].interpretation, fullText(d.sections, !!document.roadmap.safetyNotice));
    for (const step of d.sections.recommendedNextSteps) assert(d.founderDirections.some(a => a.text === step));
  }
  return true;
}
module.exports = {VERSION, HASH, metadata, present, verifyDocument};
