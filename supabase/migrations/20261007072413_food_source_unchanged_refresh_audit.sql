-- Record successful provider checks even when composition/version is unchanged.
-- Preserve the existing actor permission checks, ACLs and recipe snapshots.
create or replace function public.food_database_server(p_actor uuid,p_action text,p_key text default null,p_value jsonb default null,p_methodology uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.food_catalog%rowtype; v_id uuid; n record; p jsonb; v_hour timestamptz:=date_trunc('hour',now()); v_count integer; v_admin boolean;
begin
  if not exists(select 1 from public.staff_access s where s.user_id=p_actor and s.status='active' and (s.role<>'coach' or s.onboarding_status='complete') and private.staff_has_permission(p_actor,'learning.manage')) then raise exception 'Food authoring access denied' using errcode='42501'; end if;
  select exists(select 1 from public.staff_access where user_id=p_actor and role in ('owner','admin') and status='active') into v_admin;
  if p_action='authorize' then return jsonb_build_object('admin',v_admin); end if;
  if p_action='cache_get' then return (select value from private.food_database_cache where cache_key=p_key and expires_at>now()); end if;
  if p_action='cache_put' then
    if length(p_key)>200 or octet_length(p_value::text)>1000000 then raise exception 'Cache bounds exceeded'; end if;
    delete from private.food_database_cache where expires_at<now();
    insert into private.food_database_cache values(p_key,p_value,now()+interval '30 minutes') on conflict(cache_key) do update set value=excluded.value,expires_at=excluded.expires_at;
    return '{}'::jsonb;
  end if;
  if p_action='budget' then
    perform pg_advisory_xact_lock(1877021001);
    delete from private.food_database_usage where hour<now()-interval '2 hours';
    select coalesce(sum(requests),0) into v_count from private.food_database_usage where hour=v_hour;
    if v_count>=800 or exists(select 1 from private.food_database_usage where actor_id=p_actor and hour=v_hour and requests>=60) then raise exception 'Food database request limit reached' using errcode='P0001'; end if;
    insert into private.food_database_usage values(p_actor,v_hour,1) on conflict(actor_id,hour) do update set requests=private.food_database_usage.requests+1;
    return '{}'::jsonb;
  end if;
  if p_action='get' then
    return (select to_jsonb(f) from public.food_catalog f where provider='usda_fdc' and fdc_id=p_key::integer);
  end if;
  if p_action not in ('import','refresh') then raise exception 'Invalid food action'; end if;
  if p_action='refresh' and not v_admin then raise exception 'Owner/Admin required to refresh' using errcode='42501'; end if;
  if not exists(select 1 from public.nutrition_methodologies where id=p_methodology) then raise exception 'Select an existing nutrition methodology'; end if;
  if jsonb_typeof(p_value) is distinct from 'object' or jsonb_typeof(p_value->'fdc_id') is distinct from 'number' or (p_value->>'fdc_id')::numeric<>trunc((p_value->>'fdc_id')::numeric) or (p_value->>'fdc_id')::numeric not between 1 and 2147483647
    or nullif(p_value->>'name','') is null or length(p_value->>'name')>500
    or coalesce(p_value->>'source_data_type','') not in ('Foundation','SR Legacy','Survey (FNDDS)','Branded')
    or coalesce(p_value->>'source_version','') !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(p_value->'nutrition') is distinct from 'object'
    or jsonb_typeof(p_value->'source_portions') is distinct from 'array'
    or jsonb_typeof(p_value->'source_metadata') is distinct from 'object' then raise exception 'Invalid canonical food'; end if;
  for n in select * from jsonb_each(p_value->'nutrition') loop
    if jsonb_typeof(n.value)<>'number' or (n.value::text)::numeric not between 0 and 1e9 or not exists(select 1 from public.nutrition_nutrient_catalog where nutrient_key=n.key and active) then raise exception 'Invalid canonical nutrient'; end if;
  end loop;
  for p in select * from jsonb_array_elements(p_value->'source_portions') loop
    if jsonb_typeof(p->'gram_weight') is distinct from 'number' or jsonb_typeof(p->'amount') is distinct from 'number' or (p->>'gram_weight')::numeric<=0 or (p->>'amount')::numeric<=0 or nullif(p->>'id','') is null then raise exception 'Invalid source portion'; end if;
  end loop;
  perform pg_advisory_xact_lock(1877021002,(p_value->>'fdc_id')::integer);
  select * into v from public.food_catalog where provider='usda_fdc' and fdc_id=(p_value->>'fdc_id')::integer for update;
  if found and p_action='import' then return to_jsonb(v); end if;
  if found and p_action='refresh' and v.source_version=p_value->>'source_version' then
    insert into private.food_source_history(food_id,actor_id,action,source_version,snapshot)
      values(v.id,p_actor,'refresh_unchanged',v.source_version,jsonb_build_object('source_checked',true,'source_version',v.source_version));
    return to_jsonb(v);
  end if;
  if p_action='refresh' and v.id is null then raise exception 'Import food before refreshing'; end if;
  if v.id is null then
    insert into public.food_catalog(methodology_id,name,active,provider,fdc_id,source_version) values(p_methodology,p_value->>'name',false,'usda_fdc',(p_value->>'fdc_id')::integer,p_value->>'source_version') returning id into v_id;
  else
    v_id:=v.id;
    insert into private.food_source_history(food_id,actor_id,action,source_version,snapshot) values(v.id,p_actor,'before_refresh',v.source_version,to_jsonb(v));
  end if;
  update public.food_catalog set name=p_value->>'name',brand=p_value->>'brand',barcode=p_value->>'barcode',nutrition=p_value->'nutrition',source_data_type=p_value->>'source_data_type',source_portions=p_value->'source_portions',source_metadata=p_value->'source_metadata',source_version=p_value->>'source_version',source_imported_at=now(),serving_size=100,serving_unit='g',grams_per_serving=100,data_source='USDA FoodData Central',source_record_id=p_value->>'fdc_id',source_verified=true,updated_at=now() where id=v_id returning * into v;
  insert into private.food_source_history(food_id,actor_id,action,source_version,snapshot) values(v_id,p_actor,p_action,v.source_version,to_jsonb(v));
  return to_jsonb(v);
end; $$;
revoke all on function public.food_database_server(uuid,text,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.food_database_server(uuid,text,text,jsonb,uuid) to service_role;

