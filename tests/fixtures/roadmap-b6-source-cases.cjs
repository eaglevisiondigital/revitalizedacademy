// Fictional structural questionnaire-format sources only; not numerical A/B/C profiles.
const A=require('../../js/vitality-roadmap-b6-adapter.cjs');
const row=(value,type='select-one')=>[{type,value}],screen=(...values)=>values.map(value=>({type:'checkbox',checked:true,value}));
const values=[
 {water_intake_consistency:row('Never'),hydration_proficiency:row('Very confident'),hydration_symptoms:screen('None of these')},
 {water_intake_consistency:row('Often'),hydration_symptoms:screen('Strong thirst'),hydration_strong_thirst_frequency:row('Almost Daily'),hydration_strong_thirst_disruption:row('Severe'),hydration_strong_thirst_duration:row('More than one year')},
 {water_intake_consistency:row("I don't know"),hydration_symptoms:screen('None of these','Strong thirst'),hydration_proficiency:row(null)},
 {wellness_budget:row('No'),budget_priority_confidence:row('Not confident'),daily_habit_consistency:row('Sometimes'),fictional_unmapped_zero:row(0,'number')}
];
module.exports=values.map((answers,i)=>({id:'fictional_source_'+(i+1),label:['Fictional fixture1 · minimal symptom context','Fictional fixture2 · ordinal symptom intervals','Fictional fixture3 · unknown and conflicting values','Fictional fixture4 · separate Budget context'][i],context:{report_id:'fictional_source_'+(i+1),source:{status:'completed',pathway:'Adult',assessment_for:'Myself',questionnaire_version:'secure-snapshot-v1',participant_name:'Fictional structural source '+(i+1),completed_at:'2026-01-01T00:00:00Z',answers:{assessment_for:[{type:'radio',checked:true,value:'Myself'}],...answers}},registry_fingerprint:A.pins.registry,adapter_version:'b4-source-coverage-20261016-v1',source_fingerprint:'f'.repeat(64),grant_sequence:1,purpose_sequence:1,can_feedback:false,pins:A.pins,revision:0}}));
