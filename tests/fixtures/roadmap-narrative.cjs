'use strict';
// FICTIONAL ONLY. These answers are not derived from any participant or screenshot.
const {context}=require('./roadmap-b6.cjs'),M=require('../../config/roadmap-narrative/v1.json'),R=require('../../config/roadmap-b4/source-map.json');
function fictional(){const c=context();c.source.participant_name='SYNTHETIC · River Example';c.source.answers={assessment_for:[{type:'radio',checked:true,value:'Myself'}]};
 const set=(id,value)=>{const m=R.fields[id];if(!m)throw Error('Unknown fixture field '+id);c.source.answers[id]=(Array.isArray(value)?value:[value]).map(value=>({type:m.kind==='select-one'?'select-one':m.kind,value,...(['radio','checkbox'].includes(m.kind)?{checked:true}:{})}));};
 set('primary_goals',['Energy','Sleep']);set('ninety_day_goal','SYNTHETIC: enjoy the weekend walking group with a steadier daily routine');set('most_concerning_symptoms','SYNTHETIC: the reported daily pattern interrupts my chosen activities');set('health_interference','Moderately');set('overall_quality_of_life',6);
 for(const r of Object.values(M.rules))for(const id of r.habits)set(id,'Often');
 set('water_intake_consistency','Sometimes');set('electrolyte_consistency','Rarely');set('hydration_symptoms',['Muscle cramping','Dry lips']);set('hydration_muscle_cramping_frequency','Often');set('hydration_muscle_cramping_disruption','Moderate');set('hydration_muscle_cramping_duration','2–3 months');set('hydration_dry_lips_frequency','Sometimes');set('hydration_dry_lips_disruption','Barely noticeable');set('hydration_dry_lips_duration','Less than 2 weeks');
 set('training_program','Structured progressive program');set('plant_food_diversity','Limited');set('gi_symptoms',['Cramping']);set('gi_cramping_frequency','Often');set('gi_cramping_disruption','Severe');set('gi_cramping_duration','2–3 months');
 set('hormone_pathway','Male');set('hormone_everyone_symptoms',['Energy changes']);set('hormone_everyone_energy_changes_frequency','Sometimes');set('hormone_everyone_energy_changes_disruption','Moderate');set('hormone_everyone_energy_changes_duration','2–3 months');
 set('weekly_rhythm','No');set('routine_restart','Within a week');set('self_talk','Mostly constructive');set('wellness_budget','Somewhat / informal');set('unexpected_health_expense','Slightly prepared');set('money_blocks_health','Often');
 return c;}
module.exports={fictional};
