-- Configurable Health Metric framework
-- Core metrics are program defaults; optional metrics can be enabled per program/client.
-- No medical interpretation or composite health score is defined here.

insert into public.health_metric_catalog
  (metric_key,label,category,unit,coaching_use,sensitive,active,display_order)
values
  ('weight','Weight','body_composition','lb','Track body-weight trend over time.',true,true,10),
  ('steps','Steps','activity','steps','Track daily movement volume.',true,true,20),
  ('resting_heart_rate','Resting Heart Rate','cardiovascular','bpm','Track descriptive resting pulse trends.',true,true,30),
  ('sleep_duration','Sleep Duration','sleep','hours','Track nightly sleep duration.',true,true,40),
  ('active_minutes','Active Minutes','activity','min','Track intentional or device-recorded activity time.',true,true,50),
  ('active_energy','Active Energy','activity','kcal','Track device-recorded active energy.',true,true,60),
  ('water_intake','Water / Hydration','nutrition','oz','Track daily hydration.',true,true,70),
  ('energy_level','Energy','wellness','1-10','Track client-reported energy.',true,true,80),
  ('mood_score','Mood','wellness','1-10','Track client-reported mood.',true,true,90),
  ('body_fat_percent','Body Fat','body_composition','%','Track body-composition trend when measured.',true,true,100),
  ('heart_rate_variability','Heart Rate Variability','recovery','ms','Track descriptive HRV measurements from approved sources.',true,true,110),
  ('respiratory_rate','Respiratory Rate','recovery','breaths/min','Track descriptive respiratory-rate measurements.',true,true,120),
  ('oxygen_saturation','Blood Oxygen','recovery','%','Track descriptive oxygen-saturation measurements.',true,true,130),
  ('vo2_max','VO2 Max / Cardio Fitness','fitness','mL/kg/min','Track descriptive cardio-fitness estimates from approved sources.',true,true,140),
  ('blood_pressure_systolic','Blood Pressure - Systolic','clinical_optional','mmHg','Optional coach-enabled blood-pressure tracking.',true,true,150),
  ('blood_pressure_diastolic','Blood Pressure - Diastolic','clinical_optional','mmHg','Optional coach-enabled blood-pressure tracking.',true,true,151),
  ('blood_glucose','Blood Glucose','clinical_optional','mg/dL','Optional coach-enabled glucose tracking from an approved source or manual reading.',true,true,160),
  ('waist_circumference','Waist Circumference','body_composition','in','Optional body-measurement tracking.',true,true,170),
  ('lean_body_mass','Lean Body Mass','body_composition','lb','Optional body-composition tracking.',true,true,180),
  ('protein_intake','Protein','nutrition','g','Optional daily protein tracking.',true,true,190),
  ('fiber_intake','Fiber','nutrition','g','Optional daily fiber tracking.',true,true,200),
  ('stress_level','Stress','wellness','1-10','Optional client-reported stress tracking.',true,true,210),
  ('brain_fog','Brain Fog','wellness','1-10','Optional client-reported focus/brain-fog tracking.',true,true,220),
  ('digestion_score','Digestion','wellness','1-10','Optional client-reported digestion tracking.',true,true,230),
  ('cravings_level','Cravings','wellness','1-10','Optional client-reported cravings tracking.',true,true,240),
  ('pain_level','Pain / Discomfort','wellness','1-10','Optional client-reported discomfort tracking.',true,true,250)
on conflict (metric_key) do update set
  label=excluded.label,
  category=excluded.category,
  unit=excluded.unit,
  coaching_use=excluded.coaching_use,
  sensitive=excluded.sensitive,
  active=excluded.active,
  display_order=excluded.display_order,
  updated_at=now();

insert into public.progress_metric_catalog
  (metric_key,label,category,unit,value_type,minimum_value,maximum_value,member_trackable,active,display_order,metadata)
values
  ('weight','Weight','body_composition','lb','number',50,1000,true,true,10,'{"health_metric":true,"tier":"core","source":"manual_or_connected"}'),
  ('sleep_duration','Sleep Duration','sleep','hours','number',0,24,true,true,40,'{"health_metric":true,"tier":"core","source":"manual_or_connected"}'),
  ('water_intake','Water / Hydration','nutrition','oz','number',0,500,true,true,70,'{"health_metric":true,"tier":"core","source":"manual_or_connected"}'),
  ('energy_level','Energy','wellness','1-10','number',1,10,true,true,80,'{"health_metric":true,"tier":"core","source":"manual"}'),
  ('mood_score','Mood','wellness','1-10','number',1,10,true,true,90,'{"health_metric":true,"tier":"core","source":"manual"}'),
  ('body_fat_percent','Body Fat','body_composition','%','number',1,75,true,true,100,'{"health_metric":true,"tier":"core","source":"manual_or_connected"}'),
  ('waist_circumference','Waist Circumference','body_composition','in','number',10,100,false,true,170,'{"health_metric":true,"tier":"optional","source":"manual"}'),
  ('protein_intake','Protein','nutrition','g','number',0,500,false,true,190,'{"health_metric":true,"tier":"optional","source":"manual"}'),
  ('fiber_intake','Fiber','nutrition','g','number',0,150,false,true,200,'{"health_metric":true,"tier":"optional","source":"manual"}'),
  ('stress_level','Stress','wellness','1-10','number',1,10,false,true,210,'{"health_metric":true,"tier":"optional","source":"manual"}'),
  ('brain_fog','Brain Fog','wellness','1-10','number',1,10,false,true,220,'{"health_metric":true,"tier":"optional","source":"manual"}'),
  ('digestion_score','Digestion','wellness','1-10','number',1,10,false,true,230,'{"health_metric":true,"tier":"optional","source":"manual"}'),
  ('cravings_level','Cravings','wellness','1-10','number',1,10,false,true,240,'{"health_metric":true,"tier":"optional","source":"manual"}'),
  ('pain_level','Pain / Discomfort','wellness','1-10','number',1,10,false,true,250,'{"health_metric":true,"tier":"optional","source":"manual"}')
on conflict (metric_key) do update set
  label=excluded.label,
  category=excluded.category,
  unit=excluded.unit,
  value_type=excluded.value_type,
  minimum_value=excluded.minimum_value,
  maximum_value=excluded.maximum_value,
  active=excluded.active,
  display_order=excluded.display_order,
  metadata=excluded.metadata;

create table if not exists public.program_health_metric_settings (
  program_code text not null references public.program_catalog(program_code) on delete cascade,
  metric_key text not null references public.health_metric_catalog(metric_key) on delete cascade,
  tracking_mode text not null default 'hidden'
    check (tracking_mode in ('hidden','available','highlighted')),
  allow_manual boolean not null default false,
  source_preference text not null default 'connected_or_manual'
    check (source_preference in ('connected','manual','connected_or_manual')),
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (program_code,metric_key)
);

create table if not exists public.client_health_metric_overrides (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  metric_key text not null references public.health_metric_catalog(metric_key) on delete cascade,
  tracking_mode text not null
    check (tracking_mode in ('hidden','available','highlighted')),
  allow_manual boolean,
  source_preference text
    check (source_preference is null or source_preference in ('connected','manual','connected_or_manual')),
  display_order integer,
  notes text,
  set_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (contact_id,metric_key)
);

alter table public.program_health_metric_settings enable row level security;
alter table public.client_health_metric_overrides enable row level security;

revoke all on public.program_health_metric_settings from anon,authenticated;
revoke all on public.client_health_metric_overrides from anon,authenticated;

-- Core defaults for every active RVA program. Clinical/advanced metrics remain hidden
-- unless explicitly configured later at program or client level.
insert into public.program_health_metric_settings
  (program_code,metric_key,tracking_mode,allow_manual,source_preference,display_order)
select p.program_code,v.metric_key,v.tracking_mode,v.allow_manual,v.source_preference,v.display_order
from public.program_catalog p
cross join (
  values
    ('weight','highlighted',true,'connected_or_manual',10),
    ('steps','available',false,'connected',20),
    ('resting_heart_rate','available',false,'connected',30),
    ('sleep_duration','highlighted',true,'connected_or_manual',40),
    ('active_minutes','available',false,'connected',50),
    ('active_energy','available',false,'connected',60),
    ('water_intake','highlighted',true,'connected_or_manual',70),
    ('energy_level','highlighted',true,'manual',80),
    ('mood_score','available',true,'manual',90),
    ('body_fat_percent','available',true,'connected_or_manual',100)
) as v(metric_key,tracking_mode,allow_manual,source_preference,display_order)
where p.active
on conflict (program_code,metric_key) do update set
  tracking_mode=excluded.tracking_mode,
  allow_manual=excluded.allow_manual,
  source_preference=excluded.source_preference,
  display_order=excluded.display_order,
  updated_at=now();

create or replace function public.get_my_health_metric_configuration()
returns table (
  metric_key text,
  label text,
  category text,
  unit text,
  coaching_use text,
  tracking_mode text,
  allow_manual boolean,
  source_preference text,
  display_order integer,
  client_override boolean
)
language sql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
  with me as (
    select p.contact_id
    from public.profiles p
    where p.user_id=auth.uid()
    limit 1
  ),
  membership as (
    select cm.program_code
    from me
    join public.client_access ca on ca.contact_id=me.contact_id
    join public.client_memberships cm on cm.id=ca.membership_id
    where ca.status in ('active','ready','onboarding')
      and cm.status in ('active','pending')
    order by cm.starts_at desc nulls last,cm.created_at desc
    limit 1
  )
  select
    h.metric_key,
    h.label,
    h.category,
    h.unit,
    h.coaching_use,
    coalesce(o.tracking_mode,s.tracking_mode,'hidden') as tracking_mode,
    coalesce(o.allow_manual,s.allow_manual,false) as allow_manual,
    coalesce(o.source_preference,s.source_preference,'connected_or_manual') as source_preference,
    coalesce(o.display_order,s.display_order,h.display_order) as display_order,
    (o.metric_key is not null) as client_override
  from public.health_metric_catalog h
  cross join me
  left join membership m on true
  left join public.program_health_metric_settings s
    on s.program_code=m.program_code and s.metric_key=h.metric_key
  left join public.client_health_metric_overrides o
    on o.contact_id=me.contact_id and o.metric_key=h.metric_key
  where h.active
  order by coalesce(o.display_order,s.display_order,h.display_order),h.metric_key;
$$;

revoke all on function public.get_my_health_metric_configuration() from public,anon;
grant execute on function public.get_my_health_metric_configuration() to authenticated;
