'use strict';
// Entirely fictional; no participant, screenshot, portal proposal or transcript content.
const {fictional} = require('./roadmap-narrative.cjs');
const registry = require('../../config/roadmap-b4/source-map.json');
const habits = require('../../config/roadmap-narrative/v1.json');
function set(c, id, values) {
  const field = registry.fields[id];
  if (!field) throw Error('Unknown fictional field');
  c.source.answers[id] = (Array.isArray(values) ? values : [values]).map(value => ({type: field.kind, value,
    ...(['radio','checkbox'].includes(field.kind) ? {checked:true} : {})}));
}
function cases() {
  const make = (id, change) => {const c=fictional();change(c);return {id,context:c};};
  return [
    make('supporting-routines', c => {
      for (const r of Object.values(habits.rules)) for (const id of r.habits) set(c,id,'Almost always');
      for (const id of Object.keys(c.source.answers)) if (id.endsWith('_symptoms')) set(c,id,'None of these');
    }),
    make('separate-symptom-details', c => {delete c.source.answers.hydration_dry_lips_frequency;}),
    make('high-disruption', c => {set(c,'hydration_muscle_cramping_disruption','Severe');}),
    make('missing-evidence', c => {c.source.answers={assessment_for:[{type:'radio',value:'Myself',checked:true}]};}),
    make('conflicting-selections', c => {set(c,'hydration_symptoms',['None of these','Muscle cramping']);}),
    make('existing-safety-hold', c => {set(c,'self_harm_safety_flag','Yes');}),
    make('cross-driver-context', c => {set(c,'sleep_wake_consistency','Rarely');set(c,'recovery_behavior_regular_sleep_schedule','Sometimes');}),
    make('conditional-and-untrusted-text', c => {
      set(c,'hormone_pathway','Male');set(c,'ninety_day_goal','SYNTHETIC: <img src=x onerror=alert(1)> a workable week');
      set(c,'electrolyte_consistency','Unknown');
    })
  ];
}
module.exports={cases,set};
