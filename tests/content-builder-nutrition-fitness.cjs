const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(p)=>fs.readFileSync(p,'utf8');

test('content builder exposes Foods and Exercises tabs',()=>{
  const html=read('portal/index.html');
  assert.match(html,/data-program-content="foods"/);
  assert.match(html,/data-program-content="exercises"/);
  assert.match(html,/<option value="foods">Food \/ Ingredient<\/option>/);
  assert.match(html,/<option value="exercises">Exercise<\/option>/);
});

test('content builder supports catalog-driven recipe nutrition and media',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/nutrition_nutrient_catalog/);
  assert.match(js,/nutritionFieldsMarkup\(\)/);
  assert.match(js,/data-nutrient-key/);
  assert.match(js,/Full Nutrient Profile/);
  assert.match(js,/content-image-url/);
  assert.match(js,/nutritionPayload\(\)/);
  assert.doesNotMatch(js,/id="content-calories"/);
  assert.doesNotMatch(js,/id="content-protein"/);
});

test('content builder supports exercise classification and media',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/primary_muscle_group/);
  assert.match(js,/secondary_muscle_groups/);
  assert.match(js,/movement_type/);
  assert.match(js,/low_impact/);
  assert.match(js,/content-video-url/);
  assert.match(js,/content-equipment/);
});

test('content builder supports workout focus and equipment metadata',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/workout_type/);
  assert.match(js,/muscle_groups/);
  assert.match(js,/equipment/);
});

test('migration adds media to recipes foods exercises workouts and programs',()=>{
  const sql=read('supabase/migrations/20261003165000_content_builder_nutrition_fitness_media.sql');
  for(const table of ['recipes','food_catalog','exercise_catalog','workout_templates','fitness_programs']){
    assert.match(sql,new RegExp('alter table public\\.'+table));
  }
  assert.match(sql,/image_url text/);
});


test('recipe and food payloads match existing schemas',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/descriptionField:false/);
  assert.match(js,/createdBy:false/);
  assert.match(js,/payload\.active=false/);
});

test('exercise types map into compatible legacy categories',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/function legacyExerciseCategory/);
  assert.match(js,/\["strength","core","bodyweight","bands"\]/);
  assert.match(js,/\["cardio","hiit","aquatic"\]/);
  assert.match(js,/\["mobility","stretching"\]/);
  assert.match(js,/payload\.category=legacyExerciseCategory\(payload\.movement_type\)/);
});

test('food lifecycle uses active controls rather than publish fields',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/row\.active\?"Deactivate":"Activate"/);
  assert.match(js,/payload=\{active:nextStatus==="active"/);
});

test('pool is not offered as legacy environment',()=>{
  const js=read('portal/portal-programs.js');
  assert.doesNotMatch(js,/<option value="pool">Pool<\/option>/);
  assert.match(js,/<option value="aquatic">Pool \/ Aquatic<\/option>/);
});
