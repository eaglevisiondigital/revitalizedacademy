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

test('content builder supports recipe macros and media',()=>{
  const js=read('portal/portal-programs.js');
  assert.match(js,/content-calories/);
  assert.match(js,/content-protein/);
  assert.match(js,/content-carbs/);
  assert.match(js,/content-fat/);
  assert.match(js,/content-fiber/);
  assert.match(js,/content-image-url/);
  assert.match(js,/nutritionPayload\(\)/);
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
