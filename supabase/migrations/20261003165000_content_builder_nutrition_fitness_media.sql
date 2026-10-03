-- Content Builder v1: media, macros, exercise classification.
-- Adds staff-manageable nutrition and fitness metadata without changing existing assignments.

alter table public.recipes
  add column if not exists image_url text,
  add column if not exists image_alt text;

alter table public.food_catalog
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists nutrition jsonb not null default '{}'::jsonb;

alter table public.exercise_catalog
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists primary_muscle_group text,
  add column if not exists secondary_muscle_groups jsonb not null default '[]'::jsonb,
  add column if not exists movement_type text,
  add column if not exists low_impact boolean not null default false;

alter table public.workout_templates
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists workout_type text,
  add column if not exists muscle_groups jsonb not null default '[]'::jsonb,
  add column if not exists equipment jsonb not null default '[]'::jsonb;

alter table public.fitness_programs
  add column if not exists image_url text,
  add column if not exists image_alt text;

comment on column public.recipes.nutrition is
  'Per-serving nutrition/macros JSON. Intended keys include calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg.';

comment on column public.food_catalog.nutrition is
  'Optional per-serving ingredient nutrition/macros JSON using the same macro keys as recipes.';

comment on column public.exercise_catalog.primary_muscle_group is
  'Primary coach-facing classification such as chest, back, shoulders, biceps, triceps, core, glutes, quadriceps, hamstrings, calves, full_body.';

comment on column public.exercise_catalog.secondary_muscle_groups is
  'Optional JSON string array of additional muscle groups.';

comment on column public.exercise_catalog.movement_type is
  'Coach-facing exercise type such as strength, cardio, mobility, hiit, bodyweight, bands, recovery, aquatic.';

comment on column public.workout_templates.workout_type is
  'Coach-facing workout classification such as strength, cardio, hiit, mobility, recovery, aquatic, circuit.';

comment on column public.workout_templates.muscle_groups is
  'JSON string array describing workout muscle-group focus.';

comment on column public.workout_templates.equipment is
  'JSON string array of equipment used in the workout.';
