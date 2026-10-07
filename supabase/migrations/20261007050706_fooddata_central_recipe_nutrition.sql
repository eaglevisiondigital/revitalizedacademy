-- Food composition only. No client, payment, target, permission-grant or mail changes.
alter table public.food_catalog
  add column provider text check (provider is null or provider='usda_fdc'),
  add column fdc_id integer check (fdc_id>0),
  add column source_data_type text check (source_data_type in ('Foundation','SR Legacy','Survey (FNDDS)','Branded')),
  add column source_portions jsonb not null default '[]' check(jsonb_typeof(source_portions)='array'),
  add column source_metadata jsonb not null default '{}' check(jsonb_typeof(source_metadata)='object'),
  add column source_version text,
  add column source_imported_at timestamptz,
  add column revitalized_approved boolean not null default false,
  add constraint food_catalog_fdc_identity check ((provider is null and fdc_id is null) or (provider='usda_fdc' and fdc_id is not null and source_version is not null));
create unique index food_catalog_fdc_unique on public.food_catalog(fdc_id) where provider='usda_fdc';
alter table public.recipe_ingredients add column source_portion_id text;

create table private.food_database_cache (cache_key text primary key, value jsonb not null, expires_at timestamptz not null);
create table private.food_database_usage (actor_id uuid not null, hour timestamptz not null, requests integer not null, primary key(actor_id,hour));
create table private.food_source_history (
  id bigint generated always as identity primary key,
  food_id uuid not null references public.food_catalog(id),
  actor_id uuid not null references auth.users(id),
  action text not null,
  source_version text,
  snapshot jsonb not null,
  recorded_at timestamptz not null default now()
);
alter table private.food_database_cache enable row level security;
alter table private.food_database_usage enable row level security;
alter table private.food_source_history enable row level security;
revoke all on private.food_database_cache,private.food_database_usage,private.food_source_history from public,anon,authenticated,service_role;

-- Defense in depth: browser writes may edit custom foods/internal metadata, but
-- cannot forge or overwrite canonical source provenance or approval classification.
create function private.guard_food_source() returns trigger language plpgsql set search_path='' as $$
begin
  if current_user in ('authenticated','anon') then
    if tg_op='INSERT' then
      if new.provider is not null or new.fdc_id is not null or new.source_version is not null
        or new.source_metadata<>'{}' or new.source_portions<>'[]' or new.source_imported_at is not null
        or new.source_data_type is not null or new.revitalized_approved then
        raise exception 'Use authorized food source/approval workflow';
      end if;
    else
      if new.revitalized_approved is distinct from old.revitalized_approved
        or row(new.provider,new.fdc_id,new.source_version,new.source_metadata,new.source_portions,new.source_imported_at,new.source_data_type)
        is distinct from row(old.provider,old.fdc_id,old.source_version,old.source_metadata,old.source_portions,old.source_imported_at,old.source_data_type) then
        raise exception 'Use authorized food source/approval workflow';
      end if;
      if old.provider='usda_fdc' and row(new.name,new.brand,new.barcode,new.nutrition,new.serving_size,new.serving_unit,new.grams_per_serving,new.data_source,new.source_record_id,new.source_verified)
        is distinct from row(old.name,old.brand,old.barcode,old.nutrition,old.serving_size,old.serving_unit,old.grams_per_serving,old.data_source,old.source_record_id,old.source_verified) then
        raise exception 'USDA composition is read-only; use Refresh from Source';
      end if;
    end if;
  end if;
  return new;
end; $$;
revoke all on function private.guard_food_source() from public,anon,authenticated;
create trigger food_catalog_source_guard before insert or update on public.food_catalog for each row execute function private.guard_food_source();

create function public.set_food_revitalized_approved(p_food uuid,p_approved boolean) returns void language plpgsql security definer set search_path='' as $$
declare v public.food_catalog%rowtype;
begin
  if not private.can_author_durable_content() or not exists(select 1 from public.staff_access where user_id=auth.uid() and status='active' and role in ('owner','admin')) then raise exception 'Owner/Admin content permission required'; end if;
  if p_approved is null then raise exception 'Approval value required'; end if;
  select * into v from public.food_catalog where id=p_food for update;
  if not found then raise exception 'Food not found'; end if;
  update public.food_catalog set revitalized_approved=p_approved,updated_at=now() where id=p_food;
  insert into private.food_source_history(food_id,actor_id,action,source_version,snapshot) values(p_food,auth.uid(),'approval',v.source_version,jsonb_build_object('was',v.revitalized_approved,'approved',p_approved));
end; $$;
revoke all on function public.set_food_revitalized_approved(uuid,boolean) from public,anon;
grant execute on function public.set_food_revitalized_approved(uuid,boolean) to authenticated;

-- Only the server may call this API. Actor UUID must come from verified Auth
-- getUser, never request JSON. Every action rechecks current permission/status.
create function public.food_database_server(p_actor uuid,p_action text,p_key text default null,p_value jsonb default null,p_methodology uuid default null)
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
  if found and (p_action='import' or v.source_version=p_value->>'source_version') then return to_jsonb(v); end if;
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

-- Version 3: local composition only, source-weight portions, exact mass units,
-- full-recipe nutrient coverage. Unknown in one ingredient is not a zero.
create or replace function public.recalculate_recipe_nutrition(p_recipe_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_recipe public.recipes%rowtype; r record; n record; p jsonb;
 v_partial jsonb:='{}'; v_total jsonb:='{}'; v_per jsonb:='{}'; v_counts jsonb:='{}'; v_missing jsonb:='[]'; v_meta jsonb;
 v_factor numeric; v_weight numeric; v_total_weight numeric:=0; v_weight_known boolean:=true;
 v_basis text; v_used integer:=0; v_all integer:=0; v_count integer; v_amount numeric; v_valid integer;
begin
 if not private.can_author_durable_content() then raise exception 'Not authorized to calculate recipe nutrition'; end if;
 select * into v_recipe from public.recipes where id=p_recipe_id for update;
 if not found then raise exception 'Recipe not found'; end if;
 for r in select ri.*,f.name food_name,f.nutrition,f.serving_size,f.serving_unit,f.grams_per_serving,f.provider,f.fdc_id,f.source_version,f.source_portions,f.data_source,f.source_record_id,f.source_verified
   from public.recipe_ingredients ri left join public.food_catalog f on f.id=ri.food_id where ri.recipe_id=p_recipe_id order by ri.sort_order,ri.id loop
   v_all:=v_all+1; v_factor:=null;v_weight:=null;v_basis:=null;v_valid:=0;
   if r.weight_grams>0 and r.grams_per_serving>0 then
     v_weight:=r.weight_grams;v_factor:=v_weight/r.grams_per_serving;v_basis:='weight_grams';
   elsif r.quantity>0 and r.grams_per_serving>0 and lower(trim(r.unit)) in ('g','gram','grams','oz','ounce','ounces') then
     v_weight:=r.quantity*case when lower(trim(r.unit)) in ('oz','ounce','ounces') then 28.349523125 else 1 end;
     v_factor:=v_weight/r.grams_per_serving;v_basis:='weight_grams';
   elsif r.quantity>0 and r.source_portion_id is not null and r.grams_per_serving>0 then
     select value into p from jsonb_array_elements(r.source_portions) where value->>'id'=r.source_portion_id;
     if (p->>'amount')::numeric>0 and (p->>'gram_weight')::numeric>0 then
       v_weight:=r.quantity*(p->>'gram_weight')::numeric/(p->>'amount')::numeric;
       v_factor:=v_weight/r.grams_per_serving;v_basis:='serving_unit';
     end if;
   elsif r.quantity>0 and r.serving_size>0 and nullif(lower(trim(r.unit)),'')=nullif(lower(trim(r.serving_unit)),'') then
     v_factor:=r.quantity/r.serving_size;v_basis:='serving_unit';v_weight:=v_factor*r.grams_per_serving;
   elsif r.quantity>0 and r.provider is null and lower(trim(r.unit)) in ('serving','servings') then
     v_factor:=r.quantity;v_basis:='servings';v_weight:=v_factor*r.grams_per_serving;
   end if;
   if v_factor is not null and jsonb_typeof(r.nutrition)='object' then
     for n in select e.key,e.value from jsonb_each(r.nutrition) e join public.nutrition_nutrient_catalog c on c.nutrient_key=e.key and c.active where jsonb_typeof(e.value)='number' loop
       if (n.value::text)::numeric<0 then continue; end if;
       v_amount:=(n.value::text)::numeric*v_factor;
       v_partial:=jsonb_set(v_partial,array[n.key],to_jsonb(coalesce((v_partial->>n.key)::numeric,0)+v_amount));
       v_counts:=jsonb_set(v_counts,array[n.key],to_jsonb(coalesce((v_counts->>n.key)::integer,0)+1));
       v_valid:=v_valid+1;
     end loop;
   end if;
   if v_weight is null then v_weight_known:=false; else v_total_weight:=v_total_weight+v_weight; end if;
   if v_valid=0 then
     update public.recipe_ingredients set calculation_basis=null,nutrition_multiplier=null,nutrition_snapshot='{}' where id=r.id;
     v_missing:=v_missing||jsonb_build_array(jsonb_build_object('ingredient_id',r.id,'reason',case when v_factor is null then 'serving_conversion_unavailable' else 'food_nutrition_has_no_numeric_values' end));
     continue;
   end if;
   update public.recipe_ingredients set calculation_basis=v_basis,nutrition_multiplier=v_factor,nutrition_snapshot=jsonb_build_object('food_id',r.food_id,'food_name',r.food_name,'food_nutrition',r.nutrition,'data_source',r.data_source,'source_record_id',r.source_record_id,'source_verified',r.source_verified,'source_version',r.source_version,'factor',v_factor,'weight_grams',v_weight,'captured_at',now()) where id=r.id;
   v_used:=v_used+1;
 end loop;
 for n in select * from jsonb_each(v_partial) loop
   if (v_counts->>n.key)::integer=v_all then
     v_total:=jsonb_set(v_total,array[n.key],n.value);
     if v_recipe.servings>0 then v_per:=jsonb_set(v_per,array[n.key],to_jsonb(round((n.value::text)::numeric/v_recipe.servings,6))); end if;
   end if;
 end loop;
 v_meta:=jsonb_build_object('calculation_version',3,'basis','ingredient_food_catalog','servings',v_recipe.servings,'ingredients_used',v_used,'ingredients_incomplete',v_all-v_used,'complete',coalesce(v_all>0 and v_all=v_used and v_recipe.servings>0,false),'recipe_total',v_total,'partial_recipe_total',v_partial,'nutrient_coverage',v_counts,'total_recipe_weight_grams',case when v_weight_known and v_all>0 then v_total_weight else null end,'missing',v_missing,'calculated_at',now());
 update public.recipes set nutrition=v_per,nutrition_calculation_meta=v_meta,nutrition_calculated_at=now(),updated_at=now() where id=p_recipe_id;
 return v_meta||jsonb_build_object('recipe_id',p_recipe_id,'nutrition_per_serving',v_per);
end; $$;
revoke all on function public.recalculate_recipe_nutrition(uuid) from public,anon;
grant execute on function public.recalculate_recipe_nutrition(uuid) to authenticated;
