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

-- Beta ONLY forward contract upgrade; existing atomic receiver retained.
create or replace function private.reusable_content_contract() returns jsonb language sql immutable set search_path='' as $$ select '{"nutrition_methodologies":{"fields":["methodology_key","name","version","status","philosophy","meal_frequency_guidance","portion_guidance","protein_guidance","carbohydrate_guidance","fat_guidance","beverage_guidance","snack_guidance","supplement_guidance","restaurant_travel_guidance","exceptions_guidance","published_at"],"refs":{},"children":{"nutrition_phases":"methodology_id"},"updated":true},"fitness_methodologies":{"fields":["methodology_key","name","version","status","philosophy","progression_guidance","frequency_guidance","duration_guidance","recovery_guidance","walking_cardio_guidance","strength_guidance","mobility_guidance","restrictions_guidance","published_at"],"refs":{},"children":{},"updated":true},"nutrition_phases":{"fields":["methodology_id","phase_key","name","phase_order","description","active"],"refs":{"methodology_id":"nutrition_methodologies"},"children":{},"updated":false},"food_catalog":{"fields":["methodology_id","phase_id","name","category","guidance_status","serving_guidance","notes","tags","active","image_url","image_alt","nutrition","brand","barcode","serving_size","serving_unit","grams_per_serving","data_source","source_record_id","source_verified","provider","fdc_id","source_data_type","source_portions","source_metadata","source_version","source_imported_at","revitalized_approved"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{},"updated":true},"exercise_catalog":{"fields":["methodology_id","name","category","environment","difficulty","equipment","instructions","restriction_notes","video_url","tags","status","published_at","image_url","image_alt","primary_muscle_group","secondary_muscle_groups","movement_type","low_impact","exercise_provider","provider_exercise_id","exercise_source_version","exercise_source","exercise_imported_at","revitalized_approved","rva_muscles","functional_movement","coaching_cues"],"refs":{"methodology_id":"fitness_methodologies"},"children":{},"updated":true},"recipes":{"fields":["methodology_id","phase_id","title","meal_type","servings","prep_minutes","cook_minutes","instructions","nutrition","tags","meal_prep_friendly","freezer_friendly","status","published_at","image_url","image_alt","nutrition_calculated_at","nutrition_calculation_meta"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{"recipe_ingredients":"recipe_id"},"updated":true},"recipe_ingredients":{"fields":["recipe_id","ingredient","quantity","unit","note","sort_order","food_id","weight_grams","calculation_basis","nutrition_multiplier","nutrition_snapshot","source_portion_id"],"refs":{"recipe_id":"recipes","food_id":"food_catalog"},"children":{},"updated":false},"meal_plan_templates":{"fields":["methodology_id","phase_id","title","description","days_count","status","published_at"],"refs":{"methodology_id":"nutrition_methodologies","phase_id":"nutrition_phases"},"children":{"meal_plan_template_items":"template_id"},"updated":true},"meal_plan_template_items":{"fields":["template_id","day_number","meal_slot","recipe_id","custom_title","notes","sort_order"],"refs":{"template_id":"meal_plan_templates","recipe_id":"recipes"},"children":{},"updated":false},"workout_templates":{"fields":["methodology_id","title","description","category","difficulty","environment","duration_minutes","status","published_at","image_url","image_alt","workout_type","muscle_groups","equipment"],"refs":{"methodology_id":"fitness_methodologies"},"children":{"workout_template_exercises":"workout_id"},"updated":true},"workout_template_exercises":{"fields":["workout_id","exercise_id","sort_order","sets","reps","duration_seconds","rest_seconds","notes"],"refs":{"workout_id":"workout_templates","exercise_id":"exercise_catalog"},"children":{},"updated":false},"fitness_programs":{"fields":["methodology_id","title","description","difficulty","environment","weeks","status","published_at","image_url","image_alt"],"refs":{"methodology_id":"fitness_methodologies"},"children":{"fitness_program_workouts":"program_id"},"updated":true},"fitness_program_workouts":{"fields":["program_id","week_number","day_number","workout_id","notes"],"refs":{"program_id":"fitness_programs","workout_id":"workout_templates"},"children":{},"updated":false}}'::jsonb; $$;
revoke all on function private.reusable_content_contract() from public,anon,authenticated,service_role;

-- Reuse beta canonical RepDB IDs before name fallback. No reverse exporter.
create or replace function public.receive_production_content(p_batch jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c jsonb:=private.reusable_content_contract(); nodes jsonb; node jsonb; cfg jsonb; typ text; v_source uuid; target uuid; target_ref uuid; data jsonb; ref record; field text; columns_sql text; update_sql text; select_sql text; outcome jsonb:='[]'; existing private.reusable_content_received%rowtype; mapped public.production_content_sources%rowtype; job uuid; actor uuid; exported timestamptz; has_target boolean; child record; parent jsonb; prune record; invalid integer; display_name text; suffix integer; legacy_exercise boolean; exercise_fields text[]:=array['exercise_provider','provider_exercise_id','exercise_source_version','exercise_source','exercise_imported_at','revitalized_approved','rva_muscles','functional_movement','coaching_cues'];
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
   legacy_exercise:=typ='exercise_catalog' and not(data ?| exercise_fields);
   for field in select jsonb_array_elements_text(cfg->'fields') loop if not data ? field and not(legacy_exercise and field=any(exercise_fields)) then raise exception 'Incomplete content node'; end if; end loop;
   if (select count(*) from jsonb_array_elements(nodes) n where n->>'type'=typ and n->>'source_id'=v_source::text)<>1 then raise exception 'Duplicate source node'; end if;
   if exists(select 1 from public.production_content_sources s where s.content_type=typ and s.source_id=v_source and s.exported_at>exported) then raise exception 'A newer production sync already exists'; end if;
 end loop;
 -- Parent/dependency order is fixed; callers cannot supply table identifiers.
 for typ in select unnest(array['nutrition_methodologies','fitness_methodologies','nutrition_phases','food_catalog','exercise_catalog','recipes','recipe_ingredients','meal_plan_templates','meal_plan_template_items','workout_templates','workout_template_exercises','fitness_programs','fitness_program_workouts']) loop
   cfg:=c->typ;
   for node in select value from jsonb_array_elements(nodes) where value->>'type'=typ loop
     v_source:=(node->>'source_id')::uuid;data:=(node->>'data_serialized')::jsonb;
     -- Accept the complete previous exercise format during staged rollout, never partial new provenance.
     if typ='exercise_catalog' and not(data ?| exercise_fields) then data:='{"exercise_provider":null,"provider_exercise_id":null,"exercise_source_version":null,"exercise_source":{},"exercise_imported_at":null,"revitalized_approved":false,"rva_muscles":[],"functional_movement":null,"coaching_cues":null}'::jsonb||data;end if;
     if typ='exercise_catalog' and data->>'exercise_provider'='repdb' then perform pg_advisory_xact_lock(hashtextextended('repdb:'||(data->>'provider_exercise_id'),0));end if;
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
     if target is null and typ='exercise_catalog' and data->>'exercise_provider'='repdb' then select id into target from public.exercise_catalog where exercise_provider='repdb' and provider_exercise_id=data->>'provider_exercise_id';end if;
     if target is null and typ='food_catalog' then select id into target from public.food_catalog where methodology_id=(data->>'methodology_id')::uuid and name=data->>'name';end if;
     if target is null and typ='exercise_catalog' and data->>'exercise_provider' is null then select id into target from public.exercise_catalog where methodology_id=(data->>'methodology_id')::uuid and name=data->>'name' and exercise_provider is null;end if;
     if target is null and typ='fitness_program_workouts' then select id into target from public.fitness_program_workouts where program_id=(data->>'program_id')::uuid and week_number=(data->>'week_number')::integer and day_number=(data->>'day_number')::integer;end if;
     -- A provider import must never overwrite an unrelated beta custom exercise by name.
     if typ='exercise_catalog' then
       perform pg_advisory_xact_lock(hashtextextended((data->>'methodology_id')||':'||(data->>'name'),0));
       display_name:=data->>'name';suffix:=0;
       while exists(select 1 from public.exercise_catalog where methodology_id=(data->>'methodology_id')::uuid and name=display_name and id is distinct from target) loop
         suffix:=suffix+1;
         display_name:=left(data->>'name',70)||case when data->>'exercise_provider'='repdb' then ' [RepDB '||(data->>'provider_exercise_id') else ' [ReVitalized '||left(v_source::text,8) end||case when suffix>1 then ' #'||suffix::text else '' end||']';
       end loop;
       data:=jsonb_set(data,'{name}',to_jsonb(display_name));
     end if;
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
