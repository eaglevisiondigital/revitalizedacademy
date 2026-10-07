-- Compatible content columns in BOTH environments; never seed clients/permissions.
alter table public.exercise_catalog
 add column exercise_provider text check(exercise_provider is null or exercise_provider='repdb'),
 add column provider_exercise_id text,
 add column exercise_source_version text,
 add column exercise_source jsonb not null default '{}' check(jsonb_typeof(exercise_source)='object'),
 add column exercise_imported_at timestamptz,
 add column revitalized_approved boolean not null default false,
 add column rva_muscles text[] not null default '{}',
 add column functional_movement text check(functional_movement is null or functional_movement=any(array['Squat','Hinge','Pull','Push','Lunge','Carry','Rotation','Core','Cardio','Mobility / Range of Motion','Balance / Proprioception','Prehab / Corrective','Athletic / Power'])),
 add column coaching_cues text;
create unique index exercise_repdb_identity on public.exercise_catalog(exercise_provider,provider_exercise_id) where exercise_provider is not null;
alter table public.exercise_catalog add constraint exercise_repdb_pair check((exercise_provider is null and provider_exercise_id is null and exercise_source_version is null) or (exercise_provider is not null and exercise_provider='repdb' and provider_exercise_id is not null and exercise_source_version is not null and provider_exercise_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(provider_exercise_id)<=150 and exercise_source_version ~ '^[0-9a-f]{40}$'));
alter table public.exercise_catalog add constraint exercise_rva_muscles check(rva_muscles <@ array['Neck','Shoulders','Chest','Upper Back','Lats','Biceps','Triceps','Forearms & Grip','Abdominals','Spinal / Lower Back','Glutes','Hip Flexors','Hip Adductors & Abductors','Quadriceps','Hamstrings','Calves & Lower Leg','Feet & Ankles']::text[]);
create function private.can_manage_exercise_library(p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff_access s where s.user_id=p_actor and s.status='active' and s.role in ('owner','admin') and private.staff_has_permission(s.user_id,'learning.manage'));
$$;
revoke all on function private.can_manage_exercise_library(uuid) from public,anon;
grant execute on function private.can_manage_exercise_library(uuid) to authenticated;
-- Keep existing RLS, additionally prevent forgery of protected imported provenance.
create function private.guard_exercise_source() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user in ('authenticated','anon') then
  if tg_op='DELETE' then
   if old.exercise_provider is not null and not private.can_manage_exercise_library(auth.uid()) then raise exception 'Owner/Admin required' using errcode='42501';end if;return old;
  end if;
  if tg_op='INSERT' then
   if new.exercise_provider is not null or new.exercise_source<>'{}' or new.exercise_imported_at is not null then raise exception 'Use protected exercise import' using errcode='42501';end if;
  else
   if row(new.exercise_provider,new.provider_exercise_id,new.exercise_source_version,new.exercise_source,new.exercise_imported_at) is distinct from row(old.exercise_provider,old.provider_exercise_id,old.exercise_source_version,old.exercise_source,old.exercise_imported_at) then raise exception 'Use protected exercise refresh' using errcode='42501';end if;
   if old.exercise_provider is not null and not private.can_manage_exercise_library(auth.uid()) then raise exception 'Owner/Admin required' using errcode='42501';end if;
  end if;
  if new.revitalized_approved and (tg_op='INSERT' or new.revitalized_approved is distinct from old.revitalized_approved) and not private.can_manage_exercise_library(auth.uid()) then raise exception 'Owner/Admin required for approval' using errcode='42501';end if;
  if tg_op='UPDATE' and old.revitalized_approved is distinct from new.revitalized_approved and not private.can_manage_exercise_library(auth.uid()) then raise exception 'Owner/Admin required for approval' using errcode='42501';end if;
 end if;return new;
end; $$;
revoke all on function private.guard_exercise_source() from public,anon,authenticated;
create trigger exercise_source_guard before insert or update or delete on public.exercise_catalog for each row execute function private.guard_exercise_source();
create table private.exercise_source_audit(id bigint generated always as identity primary key,exercise_id uuid not null references public.exercise_catalog(id),actor_id uuid not null references auth.users(id),action text not null check(action in ('import','refresh')),old_version text,new_version text not null,recorded_at timestamptz not null default now());
alter table private.exercise_source_audit enable row level security;
revoke all on private.exercise_source_audit from public,anon,authenticated,service_role;
create function public.exercise_library_server(p_actor uuid,p_action text,p_value jsonb default null,p_methodology uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.exercise_catalog%rowtype;v_id uuid;old_version text;source_id text;local_name text;suffix integer;cat text;eq text[];mus text[];
begin
 if not private.can_manage_exercise_library(p_actor) then raise exception 'Owner/Admin required' using errcode='42501';end if;
 if p_action='authorize' then return jsonb_build_object('authorized',true);end if;
 if p_action not in ('import','refresh') or jsonb_typeof(p_value) is distinct from 'object' or octet_length(p_value::text)>40000 or p_value->>'provider' is distinct from 'repdb' or p_value->>'id' is null or p_value->>'id' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_value->>'id')>150 or p_value->>'version' is null or p_value->>'version' !~ '^[0-9a-f]{40}$' or p_value->>'name' is null or length(p_value->>'name') not between 1 and 240 or jsonb_typeof(p_value->'instructions') is distinct from 'array' or jsonb_typeof(p_value->'rva_muscles') is distinct from 'array' or jsonb_typeof(p_value->'equipment') is distinct from 'array' then raise exception 'Invalid RepDB source';end if;
 source_id:=p_value->>'id';perform pg_advisory_xact_lock(hashtextextended('repdb:'||source_id,0));
 select * into v from public.exercise_catalog where exercise_provider='repdb' and provider_exercise_id=source_id for update;
 if found then
  if p_action='import' then return to_jsonb(v);end if;
  old_version:=v.exercise_source_version;v_id:=v.id;
  -- All local coaching/classification/name/instruction/media fields remain unchanged.
  update public.exercise_catalog set exercise_source=p_value-'rva_muscles',exercise_source_version=p_value->>'version',updated_at=now() where id=v_id returning * into v;
 else
  if p_action='refresh' then raise exception 'Import this exercise first';end if;
  if not exists(select 1 from public.fitness_methodologies where id=p_methodology) then raise exception 'Choose existing fitness methodology';end if;
  cat:=case p_value->>'category' when 'cardio' then 'cardio' when 'stretching' then 'mobility' when 'strength' then 'strength' when 'olympic' then 'strength' when 'plyometrics' then 'strength' else 'other' end;
  select coalesce(array_agg(value),'{}') into eq from jsonb_array_elements_text(p_value->'equipment');
  select coalesce(array_agg(value),'{}') into mus from jsonb_array_elements_text(p_value->'rva_muscles');
  -- Preserve the existing methodology/name uniqueness and distinguish provider variants.
  perform pg_advisory_xact_lock(hashtextextended(p_methodology::text||':'||(p_value->>'name'),0));
  local_name:=p_value->>'name';
  suffix:=0;
  while exists(select 1 from public.exercise_catalog where methodology_id=p_methodology and name=local_name) loop
   suffix:=suffix+1;
   local_name:=left(p_value->>'name',70)||' [RepDB '||source_id||case when suffix>1 then ' #'||suffix::text else '' end||']';
  end loop;
  insert into public.exercise_catalog(methodology_id,name,category,movement_type,difficulty,environment,equipment,instructions,status,published_at,created_by,exercise_provider,provider_exercise_id,exercise_source_version,exercise_source,exercise_imported_at,rva_muscles)
  values(p_methodology,local_name,cat,case when cat='mobility' then 'stretching' when cat='cardio' then 'cardio' else 'strength' end,case when p_value->>'difficulty' in ('beginner','intermediate','advanced') then p_value->>'difficulty' else 'beginner' end,'either',to_jsonb(eq),(select string_agg(value,E'\n' order by ordinality) from jsonb_array_elements_text(p_value->'instructions') with ordinality),'published',now(),p_actor,'repdb',source_id,p_value->>'version',p_value-'rva_muscles',now(),mus) returning * into v;
  v_id:=v.id;
 end if;
 insert into private.exercise_source_audit(exercise_id,actor_id,action,old_version,new_version) values(v_id,p_actor,p_action,old_version,v.exercise_source_version);
 return to_jsonb(v);
end; $$;
revoke all on function public.exercise_library_server(uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.exercise_library_server(uuid,text,jsonb,uuid) to service_role;

-- Production ONLY forward contract/export upgrade.
create or replace function private.reusable_content_contract() returns jsonb language sql immutable set search_path='' as $$ select '{"nutrition_methodologies":{"fields":["methodology_key","name","version","status","philosophy","meal_frequency_guidance","portion_guidance","protein_guidance","carbohydrate_guidance","fat_guidance","beverage_guidance","snack_guidance","supplement_guidance","restaurant_travel_guidance","exceptions_guidance","published_at"],"refs":{},"children":{"nutrition_phases":"methodology_id"},"updated":true},"fitness_methodologies":{"fields":["methodology_key","name","version","status","philosophy","progression_guidance","frequency_guidance","duration_guidance","recovery_guidance","walking_cardio_guidance","strength_guidance","mobility_guidance","restrictions_guidance","published_at"],"refs":{},"children":{},"updated":true},"nutrition_phases":{"fields":["methodology_id","phase_key","name","phase_order","description","active"],"refs":{"methodology_id":"nutrition_methodologies"},"children":{},"updated":false},"food_catalog":{"fields":["methodology_id","phase_id","name","category","guidance_status","serving_guidance","notes","tags","active","image_url","image_alt","nutrition","brand","barcode","serving_size","serving_unit","grams_per_serving","data_source","source_record_id","source_verified","provider","fdc_id","source_data_type","source_portions","source_metadata","source_version","source_imported_at","revitalized_approved"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{},"updated":true},"exercise_catalog":{"fields":["methodology_id","name","category","environment","difficulty","equipment","instructions","restriction_notes","video_url","tags","status","published_at","image_url","image_alt","primary_muscle_group","secondary_muscle_groups","movement_type","low_impact","exercise_provider","provider_exercise_id","exercise_source_version","exercise_source","exercise_imported_at","revitalized_approved","rva_muscles","functional_movement","coaching_cues"],"refs":{"methodology_id":"fitness_methodologies"},"children":{},"updated":true},"recipes":{"fields":["methodology_id","phase_id","title","meal_type","servings","prep_minutes","cook_minutes","instructions","nutrition","tags","meal_prep_friendly","freezer_friendly","status","published_at","image_url","image_alt","nutrition_calculated_at","nutrition_calculation_meta"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{"recipe_ingredients":"recipe_id"},"updated":true},"recipe_ingredients":{"fields":["recipe_id","ingredient","quantity","unit","note","sort_order","food_id","weight_grams","calculation_basis","nutrition_multiplier","nutrition_snapshot","source_portion_id"],"refs":{"recipe_id":"recipes","food_id":"food_catalog"},"children":{},"updated":false},"meal_plan_templates":{"fields":["methodology_id","phase_id","title","description","days_count","status","published_at"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{"meal_plan_template_items":"template_id"},"updated":true},"meal_plan_template_items":{"fields":["template_id","day_number","meal_slot","recipe_id","custom_title","notes","sort_order"],"refs":{"template_id":"meal_plan_templates","recipe_id":"recipes"},"children":{},"updated":false},"workout_templates":{"fields":["methodology_id","title","description","category","difficulty","environment","duration_minutes","status","published_at","image_url","image_alt","workout_type","muscle_groups","equipment"],"refs":{"methodology_id":"fitness_methodologies"},"children":{"workout_template_exercises":"workout_id"},"updated":true},"workout_template_exercises":{"fields":["workout_id","exercise_id","sort_order","sets","reps","duration_seconds","rest_seconds","notes"],"refs":{"workout_id":"workout_templates","exercise_id":"exercise_catalog"},"children":{},"updated":false},"fitness_programs":{"fields":["methodology_id","title","description","difficulty","environment","weeks","status","published_at","image_url","image_alt"],"refs":{"methodology_id":"fitness_methodologies"},"children":{"fitness_program_workouts":"program_id"},"updated":true},"fitness_program_workouts":{"fields":["program_id","week_number","day_number","workout_id","notes"],"refs":{"program_id":"fitness_programs","workout_id":"workout_templates"},"children":{},"updated":false}}'::jsonb; $$;
revoke all on function private.reusable_content_contract() from public,anon,authenticated,service_role;
create or replace function public.reusable_content_sync_server(p_actor uuid,p_action text,p_records jsonb default null,p_job uuid default null,p_result jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare c jsonb:=private.reusable_content_contract(); queue jsonb; nodes jsonb:='[]'; seen jsonb:='{}'; node jsonb; data jsonb; cfg jsonb; ref record; child record; child_id uuid; v_source uuid; typ text; columns_sql text; version text; source_time timestamptz; job uuid; item jsonb; v_job private.reusable_content_sync_jobs%rowtype;
begin
 if not exists(select 1 from public.staff_access s where s.user_id=p_actor and s.status='active' and s.role in ('owner','admin') and private.staff_has_permission(s.user_id,'learning.manage')) then raise exception 'Owner/Admin content sync permission required' using errcode='42501'; end if;
 if p_action='authorize' then return jsonb_build_object('authorized',true); end if;
 if p_action='resume' then
   select * into v_job from private.reusable_content_sync_jobs where job_id=p_job and actor_id=p_actor;
   if not found or v_job.status='failed' then raise exception 'Sync job cannot resume';end if;
   return v_job.payload;
 end if;
 if p_action in ('complete','failed') then
   select * into v_job from private.reusable_content_sync_jobs where job_id=p_job and actor_id=p_actor for update;
   if not found then raise exception 'Unknown sync job'; end if;
   if v_job.status<>'pending' then return jsonb_build_object('status',v_job.status); end if;
   if p_action='complete' then
     if jsonb_typeof(p_result) is distinct from 'array' or jsonb_array_length(p_result)<>(select count(*) from private.reusable_content_sync_audit where job_id=p_job) then raise exception 'Invalid sync result'; end if;
     for item in select value from jsonb_array_elements(p_result) loop
       update private.reusable_content_sync_audit set target_id=(item->>'target_id')::uuid,result='complete',recorded_at=now() where job_id=p_job and content_type=item->>'type' and source_id=(item->>'source_id')::uuid and source_version=item->>'version' and result='pending';
       if not found then raise exception 'Unexpected or duplicate sync result'; end if;
     end loop;
   else update private.reusable_content_sync_audit set result='failed',recorded_at=now() where job_id=p_job; end if;
   update private.reusable_content_sync_jobs set status=p_action where job_id=p_job;
   return jsonb_build_object('status',p_action);
 end if;
 if p_action<>'export' or jsonb_typeof(p_records) is distinct from 'array' or jsonb_array_length(p_records) not between 1 and 20 then raise exception 'Select 1–20 reusable content records'; end if;
 queue:=p_records;
 while jsonb_array_length(queue)>0 loop
   node:=queue->0;queue:=queue-0;typ:=node->>'type';v_source:=(node->>'id')::uuid;
   if not c ? typ or v_source is null then raise exception 'Unsupported content type'; end if;
   if seen ? (typ||':'||v_source::text) then continue; end if;
   seen:=seen||jsonb_build_object(typ||':'||v_source::text,true);cfg:=c->typ;
   select string_agg(format('%I',value),',') into columns_sql from jsonb_array_elements_text(cfg->'fields');
   execute format('select to_jsonb(t) from (select %s from public.%I where id=$1) t',columns_sql,typ) into data using v_source;
   if data is null then raise exception 'Reusable content record unavailable'; end if;
   source_time:=null;if (cfg->>'updated')::boolean then execute format('select updated_at from public.%I where id=$1',typ) into source_time using v_source; end if;
   if data ? 'nutrition' then data:=jsonb_set(data,'{nutrition}',coalesce((select jsonb_object_agg(n.key,n.value) from jsonb_each(data->'nutrition') n where jsonb_typeof(n.value)='number' and exists(select 1 from public.nutrition_nutrient_catalog nc where nc.nutrient_key=n.key)), '{}'::jsonb));end if;
   if data ? 'nutrition_snapshot' then data:=jsonb_set(data,'{nutrition_snapshot}',private.content_sync_json_pick(data->'nutrition_snapshot',array['food_id','food_name','food_nutrition','data_source','source_record_id','source_verified','source_version','factor','weight_grams','captured_at']));end if;
   if data ? 'nutrition_calculation_meta' then data:=jsonb_set(data,'{nutrition_calculation_meta}',private.content_sync_json_pick(data->'nutrition_calculation_meta',array['calculation_version','basis','servings','ingredients_used','ingredients_incomplete','complete','recipe_total','partial_recipe_total','nutrient_coverage','total_recipe_weight_grams','missing','calculated_at']));end if;
   if data ? 'source_metadata' then data:=jsonb_set(data,'{source_metadata}',private.content_sync_json_pick(data->'source_metadata',array['provider','fdc_id','data_type','description','brand','publication_date','source_updated_at','barcode','basis_grams','portions','nutrients','mapping_version','unmapped_nutrient_ids']));end if;
   if data ? 'exercise_source' then data:=jsonb_set(data,'{exercise_source}',private.content_sync_json_pick(data->'exercise_source',array['provider','id','version','name','description','primary_muscles','secondary_muscles','body_part','equipment','category','force_type','mechanic','difficulty','goals','tags','met','instructions','tips','images','attribution']));end if;
   version:=md5(data::text);
   nodes:=nodes||jsonb_build_array(jsonb_build_object('type',typ,'source_id',v_source,'version',version,'source_updated_at',source_time,'data_serialized',data::text));
   if jsonb_array_length(nodes)>500 or octet_length(nodes::text)>2000000 then raise exception 'Sync selection exceeds dependency bounds'; end if;
   for ref in select * from jsonb_each_text(cfg->'refs') loop
     if data->>ref.key is not null then queue:=queue||jsonb_build_array(jsonb_build_object('type',ref.value,'id',data->>ref.key)); end if;
   end loop;
   for child in select * from jsonb_each_text(cfg->'children') loop
     for child_id in execute format('select id from public.%I where %I=$1 order by id',child.key,child.value) using v_source loop queue:=queue||jsonb_build_array(jsonb_build_object('type',child.key,'id',child_id)); end loop;
   end loop;
 end loop;
 job:=gen_random_uuid();insert into private.reusable_content_sync_jobs(job_id,actor_id) values(job,p_actor);
 for node in select value from jsonb_array_elements(nodes) loop
   insert into private.reusable_content_sync_audit(job_id,content_type,source_id,source_version,source_updated_at,actor_id) values(job,node->>'type',(node->>'source_id')::uuid,node->>'version',(node->>'source_updated_at')::timestamptz,p_actor);
 end loop;
 data:=jsonb_build_object('protocol',1,'source_project','voalfpxiyznnqfcqcymd','target_project','bvooallokgfktssadsrv','job_id',job,'actor_id',p_actor,'exported_at',now(),'nodes',nodes);
 update private.reusable_content_sync_jobs set payload=data where job_id=job;
 return data;
end; $$;
revoke all on function public.reusable_content_sync_server(uuid,text,jsonb,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.reusable_content_sync_server(uuid,text,jsonb,uuid,jsonb) to service_role;
