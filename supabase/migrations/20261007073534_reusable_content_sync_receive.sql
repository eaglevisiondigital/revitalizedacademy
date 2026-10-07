-- Beta ONLY: service-role receiver; no export route or production service key.

create function private.reusable_content_contract() returns jsonb language sql immutable set search_path='' as $$ select '{"nutrition_methodologies":{"fields":["methodology_key","name","version","status","philosophy","meal_frequency_guidance","portion_guidance","protein_guidance","carbohydrate_guidance","fat_guidance","beverage_guidance","snack_guidance","supplement_guidance","restaurant_travel_guidance","exceptions_guidance","published_at"],"refs":{},"children":{"nutrition_phases":"methodology_id"},"updated":true},"fitness_methodologies":{"fields":["methodology_key","name","version","status","philosophy","progression_guidance","frequency_guidance","duration_guidance","recovery_guidance","walking_cardio_guidance","strength_guidance","mobility_guidance","restrictions_guidance","published_at"],"refs":{},"children":{},"updated":true},"nutrition_phases":{"fields":["methodology_id","phase_key","name","phase_order","description","active"],"refs":{"methodology_id":"nutrition_methodologies"},"children":{},"updated":false},"food_catalog":{"fields":["methodology_id","phase_id","name","category","guidance_status","serving_guidance","notes","tags","active","image_url","image_alt","nutrition","brand","barcode","serving_size","serving_unit","grams_per_serving","data_source","source_record_id","source_verified","provider","fdc_id","source_data_type","source_portions","source_metadata","source_version","source_imported_at","revitalized_approved"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{},"updated":true},"exercise_catalog":{"fields":["methodology_id","name","category","environment","difficulty","equipment","instructions","restriction_notes","video_url","tags","status","published_at","image_url","image_alt","primary_muscle_group","secondary_muscle_groups","movement_type","low_impact"],"refs":{"methodology_id":"fitness_methodologies"},"children":{},"updated":true},"recipes":{"fields":["methodology_id","phase_id","title","meal_type","servings","prep_minutes","cook_minutes","instructions","nutrition","tags","meal_prep_friendly","freezer_friendly","status","published_at","image_url","image_alt","nutrition_calculated_at","nutrition_calculation_meta"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{"recipe_ingredients":"recipe_id"},"updated":true},"recipe_ingredients":{"fields":["recipe_id","ingredient","quantity","unit","note","sort_order","food_id","weight_grams","calculation_basis","nutrition_multiplier","nutrition_snapshot","source_portion_id"],"refs":{"recipe_id":"recipes","food_id":"food_catalog"},"children":{},"updated":false},"meal_plan_templates":{"fields":["methodology_id","phase_id","title","description","days_count","status","published_at"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{"meal_plan_template_items":"template_id"},"updated":true},"meal_plan_template_items":{"fields":["template_id","day_number","meal_slot","recipe_id","custom_title","notes","sort_order"],"refs":{"template_id":"meal_plan_templates","recipe_id":"recipes"},"children":{},"updated":false},"workout_templates":{"fields":["methodology_id","title","description","category","difficulty","environment","duration_minutes","status","published_at","image_url","image_alt","workout_type","muscle_groups","equipment"],"refs":{"methodology_id":"fitness_methodologies"},"children":{"workout_template_exercises":"workout_id"},"updated":true},"workout_template_exercises":{"fields":["workout_id","exercise_id","sort_order","sets","reps","duration_seconds","rest_seconds","notes"],"refs":{"workout_id":"workout_templates","exercise_id":"exercise_catalog"},"children":{},"updated":false},"fitness_programs":{"fields":["methodology_id","title","description","difficulty","environment","weeks","status","published_at","image_url","image_alt"],"refs":{"methodology_id":"fitness_methodologies"},"children":{"fitness_program_workouts":"program_id"},"updated":true},"fitness_program_workouts":{"fields":["program_id","week_number","day_number","workout_id","notes"],"refs":{"program_id":"fitness_programs","workout_id":"workout_templates"},"children":{},"updated":false}}'::jsonb; $$;
revoke all on function private.reusable_content_contract() from public,anon,authenticated,service_role;
create function private.content_sync_json_pick(p_data jsonb,p_keys text[]) returns jsonb language sql immutable set search_path='' as $$ select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each(case when jsonb_typeof(p_data)='object' then p_data else '{}'::jsonb end) where key=any(p_keys); $$;
revoke all on function private.content_sync_json_pick(jsonb,text[]) from public,anon,authenticated,service_role;


create table public.production_content_sources(content_type text not null,source_id uuid not null,target_id uuid not null,source_version text not null,source_updated_at timestamptz,synced_at timestamptz not null default now(),exported_at timestamptz not null,primary key(content_type,source_id),unique(content_type,target_id));
alter table public.production_content_sources enable row level security;
revoke all on public.production_content_sources from public,anon,authenticated;
grant select on public.production_content_sources to authenticated;
create policy production_content_sources_staff_read on public.production_content_sources for select to authenticated using ((select private.can_author_durable_content()));
create table private.reusable_content_received(job_id uuid primary key,payload_hash text not null,production_actor uuid not null,received_at timestamptz not null default now(),result jsonb not null);
create table private.reusable_content_receive_audit(id bigint generated always as identity primary key,job_id uuid not null,production_actor uuid not null,content_type text not null,source_id uuid not null,target_id uuid not null,source_version text not null,result text not null,recorded_at timestamptz not null default now());
alter table private.reusable_content_received enable row level security;
alter table private.reusable_content_receive_audit enable row level security;
revoke all on private.reusable_content_received,private.reusable_content_receive_audit from public,anon,authenticated,service_role;
create function private.remap_content_cache(p_value jsonb) returns jsonb language plpgsql set search_path='' as $$
declare result jsonb; item record; target uuid; typ text;
begin
 if jsonb_typeof(p_value)='array' then select coalesce(jsonb_agg(private.remap_content_cache(value) order by ordinality),'[]') into result from jsonb_array_elements(p_value) with ordinality;return result;end if;
 if jsonb_typeof(p_value)<>'object' then return p_value;end if;
 result:='{}';for item in select * from jsonb_each(p_value) loop
   typ:=case item.key when 'food_id' then 'food_catalog' when 'ingredient_id' then 'recipe_ingredients' when 'recipe_id' then 'recipes' end;
   if typ is not null then select s.target_id into target from public.production_content_sources s where s.content_type=typ and s.source_id=(item.value #>> '{}')::uuid;result:=result||jsonb_build_object(item.key,target);
   else result:=result||jsonb_build_object(item.key,private.remap_content_cache(item.value));end if;
 end loop;return result;
end; $$;
revoke all on function private.remap_content_cache(jsonb) from public,anon,authenticated,service_role;
create function public.receive_production_content(p_batch jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c jsonb:=private.reusable_content_contract(); nodes jsonb; node jsonb; cfg jsonb; typ text; v_source uuid; target uuid; target_ref uuid; data jsonb; ref record; field text; columns_sql text; update_sql text; select_sql text; outcome jsonb:='[]'; existing private.reusable_content_received%rowtype; mapped public.production_content_sources%rowtype; job uuid; actor uuid; exported timestamptz; has_target boolean; child record; parent jsonb; prune record; invalid integer;
begin
 if p_batch->>'source_project' is distinct from 'voalfpxiyznnqfcqcymd' or p_batch->>'target_project' is distinct from 'bvooallokgfktssadsrv' or p_batch->>'protocol' is distinct from '1' or octet_length(p_batch::text)>2100000 then raise exception 'Only approved production-to-beta content accepted'; end if;
 nodes:=p_batch->'nodes';job:=(p_batch->>'job_id')::uuid;actor:=(p_batch->>'actor_id')::uuid;exported:=(p_batch->>'exported_at')::timestamptz;
 if job is null or actor is null or exported is null or exported>now()+interval '2 minutes' or jsonb_typeof(nodes) is distinct from 'array' or jsonb_array_length(nodes) not between 1 and 500 then raise exception 'Invalid sync batch'; end if;
 perform pg_advisory_xact_lock(1877021003);
 select * into existing from private.reusable_content_received where job_id=job;
 if found then if existing.payload_hash<>md5(p_batch::text) then raise exception 'Sync job payload mismatch'; end if; return existing.result; end if;
 -- Validate the complete batch before writing a single content row.
 for node in select value from jsonb_array_elements(nodes) loop
   typ:=node->>'type';cfg:=c->typ;data:=(node->>'data_serialized')::jsonb;v_source:=(node->>'source_id')::uuid;
   if cfg is null or v_source is null or jsonb_typeof(data) is distinct from 'object' or node->>'version' is distinct from md5(data::text) then raise exception 'Invalid reusable content node'; end if;
   for field in select jsonb_object_keys(data) loop if not (cfg->'fields') ? field then raise exception 'Disallowed content field'; end if; end loop;
   for field in select jsonb_array_elements_text(cfg->'fields') loop if not data ? field then raise exception 'Incomplete content node'; end if; end loop;
   if (select count(*) from jsonb_array_elements(nodes) n where n->>'type'=typ and n->>'source_id'=v_source::text)<>1 then raise exception 'Duplicate source node'; end if;
   if exists(select 1 from public.production_content_sources s where s.content_type=typ and s.source_id=v_source and s.exported_at>exported) then raise exception 'A newer production sync already exists'; end if;
 end loop;
 -- Parent/dependency order is fixed; callers cannot supply table identifiers.
 for typ in select unnest(array['nutrition_methodologies','fitness_methodologies','nutrition_phases','food_catalog','exercise_catalog','recipes','recipe_ingredients','meal_plan_templates','meal_plan_template_items','workout_templates','workout_template_exercises','fitness_programs','fitness_program_workouts']) loop
   cfg:=c->typ;
   for node in select value from jsonb_array_elements(nodes) where value->>'type'=typ loop
     v_source:=(node->>'source_id')::uuid;data:=(node->>'data_serialized')::jsonb;
     select * into mapped from public.production_content_sources s where s.content_type=typ and s.source_id=v_source;
     target:=mapped.target_id;
     if target is not null then execute format('select exists(select 1 from public.%I where id=$1)',typ) into has_target using target;if not has_target then target:=null;end if; end if;
     for ref in select * from jsonb_each_text(cfg->'refs') loop
       if data->>ref.key is not null then
         select s.target_id into target_ref from public.production_content_sources s where s.content_type=ref.value and s.source_id=(data->>ref.key)::uuid;
         if target_ref is null then raise exception 'Missing synced content dependency'; end if;
         data:=jsonb_set(data,array[ref.key],to_jsonb(target_ref));
       end if;
     end loop;
     -- Match existing beta catalog identities where uniqueness already requires it.
     if target is null and typ in ('nutrition_methodologies','fitness_methodologies') then execute format('select id from public.%I where methodology_key=$1',typ) into target using data->>'methodology_key'; end if;
     if target is null and typ='nutrition_phases' then select id into target from public.nutrition_phases where methodology_id=(data->>'methodology_id')::uuid and phase_key=data->>'phase_key'; end if;
     if target is null and typ='food_catalog' and data->>'provider'='usda_fdc' then select id into target from public.food_catalog where provider='usda_fdc' and fdc_id=(data->>'fdc_id')::integer;end if;
     if target is null and typ in ('food_catalog','exercise_catalog') then execute format('select id from public.%I where methodology_id=$1 and name=$2',typ) into target using (data->>'methodology_id')::uuid,data->>'name';end if;
     if target is null and typ='fitness_program_workouts' then select id into target from public.fitness_program_workouts where program_id=(data->>'program_id')::uuid and week_number=(data->>'week_number')::integer and day_number=(data->>'day_number')::integer;end if;
     target:=coalesce(target,gen_random_uuid());
     for prune in select s.* from public.production_content_sources s where s.content_type=typ and s.target_id=target and s.source_id<>v_source loop
       if exists(select 1 from jsonb_array_elements(nodes) n where n->>'type'=typ and n->>'source_id'=prune.source_id::text) then raise exception 'Conflicting canonical source identity';end if;
       delete from public.production_content_sources s where s.content_type=typ and s.source_id=prune.source_id;
       insert into private.reusable_content_receive_audit(job_id,production_actor,content_type,source_id,target_id,source_version,result) values(job,actor,typ,prune.source_id,target,prune.source_version,'canonical_source_replaced');
     end loop;
     data:=data||jsonb_build_object('id',target);
     select string_agg(format('%I',value),','),string_agg(format('%I=excluded.%I',value,value),','),string_agg(format('r.%I',value),',') into columns_sql,update_sql,select_sql from jsonb_array_elements_text(jsonb_build_array('id')||(cfg->'fields'));
     if (cfg->>'updated')::boolean then update_sql:=update_sql||',updated_at=now()'; end if;
     execute format('insert into public.%I(%s) select %s from jsonb_populate_record(null::public.%I,$1) r on conflict(id) do update set %s',typ,columns_sql,select_sql,typ,update_sql) using data;
     insert into public.production_content_sources values(typ,v_source,target,node->>'version',(node->>'source_updated_at')::timestamptz,now(),exported) on conflict(content_type,source_id) do update set target_id=excluded.target_id,source_version=excluded.source_version,source_updated_at=excluded.source_updated_at,synced_at=now(),exported_at=excluded.exported_at;
     insert into private.reusable_content_receive_audit(job_id,production_actor,content_type,source_id,target_id,source_version,result) values(job,actor,typ,v_source,target,node->>'version','complete');
     outcome:=outcome||jsonb_build_array(jsonb_build_object('type',typ,'source_id',v_source,'target_id',target,'version',node->>'version'));
   end loop;
 end loop;
 -- Remap calculated cache references only after the complete dependency map exists.
 for node in select value from jsonb_array_elements(nodes) where value->>'type' in ('recipes','recipe_ingredients') loop
   typ:=node->>'type';select s.target_id into target from public.production_content_sources s where s.content_type=typ and s.source_id=(node->>'source_id')::uuid;
   if typ='recipes' then update public.recipes set nutrition_calculation_meta=private.remap_content_cache(((node->>'data_serialized')::jsonb)->'nutrition_calculation_meta') where id=target;
   else update public.recipe_ingredients set nutrition_snapshot=private.remap_content_cache(((node->>'data_serialized')::jsonb)->'nutrition_snapshot') where id=target;end if;
 end loop;
 -- Remove obsolete synced composition rows only; preserve unrelated beta rows.
 for parent in select value from jsonb_array_elements(nodes) loop
   for child in select * from jsonb_each_text(c->(parent->>'type')->'children') loop
     if child.key='nutrition_phases' then continue;end if;
     select s.target_id into target from public.production_content_sources s where s.content_type=parent->>'type' and s.source_id=(parent->>'source_id')::uuid;
     for prune in execute format('select s.source_id,s.target_id,s.source_version from public.production_content_sources s join public.%I r on r.id=s.target_id where s.content_type=$1 and r.%I=$2',child.key,child.value) using child.key,target loop
       if not exists(select 1 from jsonb_array_elements(nodes) n where n->>'type'=child.key and n->>'source_id'=prune.source_id::text) then
         execute format('delete from public.%I where id=$1',child.key) using prune.target_id;
         insert into private.reusable_content_receive_audit(job_id,production_actor,content_type,source_id,target_id,source_version,result) values(job,actor,child.key,prune.source_id,prune.target_id,prune.source_version,'obsolete_composition_removed');
       end if;
     end loop;
   end loop;
 end loop;
 insert into private.reusable_content_received(job_id,payload_hash,production_actor,result) values(job,md5(p_batch::text),actor,outcome);
 return outcome;
end; $$;
revoke all on function public.receive_production_content(jsonb) from public,anon,authenticated;
grant execute on function public.receive_production_content(jsonb) to service_role;
