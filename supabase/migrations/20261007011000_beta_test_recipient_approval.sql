-- STAGING ONLY. Never apply this recipient registry to production.
create table private.beta_test_recipients (
 email text primary key check(email=lower(trim(email)) and email ~ '^[A-Za-z0-9.!#$%&''+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$'),
 contact_id uuid not null references public.contacts(id),
 approved boolean not null,
 approved_by uuid not null references auth.users(id),
 reason text not null check(length(trim(reason)) between 3 and 500),
 updated_at timestamptz not null default now()
);
create table private.beta_test_recipient_audit (
 id bigint generated always as identity primary key,
 email text not null,contact_id uuid not null references public.contacts(id),
 approved boolean not null,actor_user_id uuid not null references auth.users(id),
 reason text not null,created_at timestamptz not null default now()
);
alter table private.beta_test_recipients enable row level security;
alter table private.beta_test_recipient_audit enable row level security;
revoke all on private.beta_test_recipients,private.beta_test_recipient_audit from public,anon,authenticated,service_role;

create function public.set_beta_test_recipient(p_email text,p_approved boolean,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare e text:=lower(trim(p_email)); c uuid; n integer;
begin
 if not exists(select 1 from public.app_runtime_config where config_key='deployment_environment' and active and config_value->>'environment'='staging' and config_value->>'supabase_ref'='bvooallokgfktssadsrv' and config_value->>'payment_mode'='synthetic') then raise exception 'Beta recipient approval is staging-only' using errcode='42501'; end if;
 if auth.uid() is null or not exists(select 1 from public.staff_access where user_id=auth.uid()
 and role='owner' and status='active' and onboarding_status='complete' and contact_scope='all')
 or not private.staff_has_permission(auth.uid(),'staff.manage') then
 raise exception 'Active Owner approval required' using errcode='42501'; end if;
 if p_approved is null or e is null or e !~ '^[A-Za-z0-9.!#$%&''+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$'
 or not coalesce(length(trim(p_reason)) between 3 and 500,false) then
 raise exception 'Exact email and approval reason required' using errcode='22023'; end if;
 select count(*),(array_agg(id))[1] into n,c from public.contacts where lower(trim(email))=e and record_kind='crm';
 if n<>1 then raise exception 'One existing beta client contact required' using errcode='22023'; end if;
 insert into private.beta_test_recipients(email,contact_id,approved,approved_by,reason) values(e,c,p_approved,auth.uid(),trim(p_reason))
 on conflict(email) do update set contact_id=excluded.contact_id,approved=excluded.approved,approved_by=excluded.approved_by,reason=excluded.reason,updated_at=now();
 insert into private.beta_test_recipient_audit(email,contact_id,approved,actor_user_id,reason) values(e,c,p_approved,auth.uid(),trim(p_reason));
 return jsonb_build_object('email',e,'approved',p_approved,'contact_id',c);
end $$;
revoke all on function public.set_beta_test_recipient(text,boolean,text) from public,anon,service_role;
grant execute on function public.set_beta_test_recipient(text,boolean,text) to authenticated;

-- Edge service can check only an exact registered address. Browsers cannot enumerate this registry.
create function public.beta_test_recipient_approved(p_email text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_runtime_config where config_key='deployment_environment' and active and config_value->>'environment'='staging' and config_value->>'supabase_ref'='bvooallokgfktssadsrv' and config_value->>'payment_mode'='synthetic') and exists(select 1 from private.beta_test_recipients r join public.contacts c on c.id=r.contact_id
 where r.email=lower(trim(p_email)) and r.approved and lower(trim(c.email))=r.email and c.record_kind='crm')
$$;
revoke all on function public.beta_test_recipient_approved(text) from public,anon,authenticated;
grant execute on function public.beta_test_recipient_approved(text) to service_role;

-- Branded beta origin replaces the original dedicated-site guard, never production.
-- BEGIN BETA ORIGIN RECONCILIATION
DO $$
begin
 if exists(select 1 from pg_constraint where conrelid='public.app_runtime_config'::regclass and conname='staging_onboarding_origin') then
  if not exists(select 1 from public.app_runtime_config where config_key='deployment_environment' and active and config_value->>'environment'='staging' and config_value->>'supabase_ref'='bvooallokgfktssadsrv' and config_value->>'payment_mode'='synthetic') then
   raise exception 'Staging origin reconciliation requires the isolated beta project';
  end if;
  alter table public.app_runtime_config drop constraint staging_onboarding_origin;
  alter table public.app_runtime_config add constraint staging_onboarding_origin check(config_key<>'client_onboarding' or (active and config_value->>'origin'='https://beta.revitalizedacademy.com')) not valid;
 end if;
 update public.app_runtime_config set config_value=jsonb_set(config_value,'{origin}','"https://beta.revitalizedacademy.com"'::jsonb) where config_key in ('client_onboarding','deployment_environment') and config_value->>'origin'='https://revitalizedacademy-staging.netlify.app' and exists(select 1 from public.app_runtime_config where config_key='deployment_environment' and active and config_value->>'environment'='staging' and config_value->>'supabase_ref'='bvooallokgfktssadsrv' and config_value->>'payment_mode'='synthetic');
 if exists(select 1 from pg_constraint where conrelid='public.app_runtime_config'::regclass and conname='staging_onboarding_origin') then
  alter table public.app_runtime_config validate constraint staging_onboarding_origin;
 end if;
end $$;
-- END BETA ORIGIN RECONCILIATION
