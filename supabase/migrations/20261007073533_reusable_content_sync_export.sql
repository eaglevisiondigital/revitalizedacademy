-- Production ONLY: no receiving function or beta credentials in this migration.

create function private.reusable_content_contract() returns jsonb language sql immutable set search_path='' as $$ select '{"nutrition_methodologies":{"fields":["methodology_key","name","version","status","philosophy","meal_frequency_guidance","portion_guidance","protein_guidance","carbohydrate_guidance","fat_guidance","beverage_guidance","snack_guidance","supplement_guidance","restaurant_travel_guidance","exceptions_guidance","published_at"],"refs":{},"children":{"nutrition_phases":"methodology_id"},"updated":true},"fitness_methodologies":{"fields":["methodology_key","name","version","status","philosophy","progression_guidance","frequency_guidance","duration_guidance","recovery_guidance","walking_cardio_guidance","strength_guidance","mobility_guidance","restrictions_guidance","published_at"],"refs":{},"children":{},"updated":true},"nutrition_phases":{"fields":["methodology_id","phase_key","name","phase_order","description","active"],"refs":{"methodology_id":"nutrition_methodologies"},"children":{},"updated":false},"food_catalog":{"fields":["methodology_id","phase_id","name","category","guidance_status","serving_guidance","notes","tags","active","image_url","image_alt","nutrition","brand","barcode","serving_size","serving_unit","grams_per_serving","data_source","source_record_id","source_verified","provider","fdc_id","source_data_type","source_portions","source_metadata","source_version","source_imported_at","revitalized_approved"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{},"updated":true},"exercise_catalog":{"fields":["methodology_id","name","category","environment","difficulty","equipment","instructions","restriction_notes","video_url","tags","status","published_at","image_url","image_alt","primary_muscle_group","secondary_muscle_groups","movement_type","low_impact"],"refs":{"methodology_id":"fitness_methodologies"},"children":{},"updated":true},"recipes":{"fields":["methodology_id","phase_id","title","meal_type","servings","prep_minutes","cook_minutes","instructions","nutrition","tags","meal_prep_friendly","freezer_friendly","status","published_at","image_url","image_alt","nutrition_calculated_at","nutrition_calculation_meta"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{"recipe_ingredients":"recipe_id"},"updated":true},"recipe_ingredients":{"fields":["recipe_id","ingredient","quantity","unit","note","sort_order","food_id","weight_grams","calculation_basis","nutrition_multiplier","nutrition_snapshot","source_portion_id"],"refs":{"recipe_id":"recipes","food_id":"food_catalog"},"children":{},"updated":false},"meal_plan_templates":{"fields":["methodology_id","phase_id","title","description","days_count","status","published_at"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{"meal_plan_template_items":"template_id"},"updated":true},"meal_plan_template_items":{"fields":["template_id","day_number","meal_slot","recipe_id","custom_title","notes","sort_order"],"refs":{"template_id":"meal_plan_templates","recipe_id":"recipes"},"children":{},"updated":false},"workout_templates":{"fields":["methodology_id","title","description","category","difficulty","environment","duration_minutes","status","published_at","image_url","image_alt","workout_type","muscle_groups","equipment"],"refs":{"methodology_id":"fitness_methodologies"},"children":{"workout_template_exercises":"workout_id"},"updated":true},"workout_template_exercises":{"fields":["workout_id","exercise_id","sort_order","sets","reps","duration_seconds","rest_seconds","notes"],"refs":{"workout_id":"workout_templates","exercise_id":"exercise_catalog"},"children":{},"updated":false},"fitness_programs":{"fields":["methodology_id","title","description","difficulty","environment","weeks","status","published_at","image_url","image_alt"],"refs":{"methodology_id":"fitness_methodologies"},"children":{"fitness_program_workouts":"program_id"},"updated":true},"fitness_program_workouts":{"fields":["program_id","week_number","day_number","workout_id","notes"],"refs":{"program_id":"fitness_programs","workout_id":"workout_templates"},"children":{},"updated":false}}'::jsonb; $$;
revoke all on function private.reusable_content_contract() from public,anon,authenticated,service_role;
create function private.content_sync_json_pick(p_data jsonb,p_keys text[]) returns jsonb language sql immutable set search_path='' as $$ select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each(case when jsonb_typeof(p_data)='object' then p_data else '{}'::jsonb end) where key=any(p_keys); $$;
revoke all on function private.content_sync_json_pick(jsonb,text[]) from public,anon,authenticated,service_role;


create table private.reusable_content_sync_jobs(job_id uuid primary key,actor_id uuid not null references auth.users(id),exported_at timestamptz not null default now(),status text not null default 'pending' check(status in ('pending','complete','failed')),payload jsonb);
create table private.reusable_content_sync_audit(id bigint generated always as identity primary key,job_id uuid not null references private.reusable_content_sync_jobs,content_type text not null,source_id uuid not null,target_id uuid,source_version text not null,source_updated_at timestamptz,actor_id uuid not null references auth.users(id),result text not null default 'pending',recorded_at timestamptz not null default now(),unique(job_id,content_type,source_id));
alter table private.reusable_content_sync_jobs enable row level security;
alter table private.reusable_content_sync_audit enable row level security;
revoke all on private.reusable_content_sync_jobs,private.reusable_content_sync_audit from public,anon,authenticated,service_role;
create function public.reusable_content_sync_server(p_actor uuid,p_action text,p_records jsonb default null,p_job uuid default null,p_result jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
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
