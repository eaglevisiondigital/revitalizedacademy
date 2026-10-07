-- STAGING ONLY. Staff mail approval is separate from the existing client recipient registry.
create table private.beta_staff_test_recipients (
 email text primary key check(email=lower(trim(email)) and email ~ '^[A-Za-z0-9.!#$%&''+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$'),
 approved boolean not null, approved_by uuid not null references auth.users(id),
 reason text not null check(length(trim(reason)) between 3 and 500), updated_at timestamptz not null default now()
);
create table private.beta_staff_test_recipient_audit (
 id bigint generated always as identity primary key, email text not null,
 approved boolean not null, actor_user_id uuid not null references auth.users(id),
 reason text not null, created_at timestamptz not null default now()
);
alter table private.beta_staff_test_recipients enable row level security;
alter table private.beta_staff_test_recipient_audit enable row level security;
revoke all on private.beta_staff_test_recipients,private.beta_staff_test_recipient_audit from public,anon,authenticated,service_role;

-- Approval permits delivery only, never creates Auth/staff identities or grants a role.
create function public.set_beta_staff_test_recipient(p_email text,p_approved boolean,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare e text:=lower(trim(p_email));
begin
 if not exists(select 1 from public.app_runtime_config where config_key='deployment_environment' and active and config_value->>'environment'='staging' and config_value->>'supabase_ref'='bvooallokgfktssadsrv' and config_value->>'payment_mode'='synthetic' and config_value->>'origin'='https://beta.revitalizedacademy.com') then raise exception 'Beta staff recipient approval is staging-only' using errcode='42501'; end if;
 if auth.uid() is null or not exists(select 1 from public.staff_access where user_id=auth.uid() and role in ('owner','admin') and status='active' and onboarding_status='complete') or not private.staff_has_permission(auth.uid(),'staff.manage') then raise exception 'Active Owner or Administrator approval required' using errcode='42501'; end if;
 if p_approved is null or e is null or e !~ '^[A-Za-z0-9.!#$%&''+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$' or not coalesce(length(trim(p_reason)) between 3 and 500,false) then raise exception 'Exact email and approval reason required' using errcode='22023'; end if;
 insert into private.beta_staff_test_recipients(email,approved,approved_by,reason) values(e,p_approved,auth.uid(),trim(p_reason)) on conflict(email) do update set approved=excluded.approved,approved_by=excluded.approved_by,reason=excluded.reason,updated_at=now();
 insert into private.beta_staff_test_recipient_audit(email,approved,actor_user_id,reason) values(e,p_approved,auth.uid(),trim(p_reason));
 return jsonb_build_object('email',e,'approved',p_approved);
end $$;
revoke all on function public.set_beta_staff_test_recipient(text,boolean,text) from public,anon,service_role;
grant execute on function public.set_beta_staff_test_recipient(text,boolean,text) to authenticated;

create function public.beta_staff_test_recipient_approved(p_email text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_runtime_config where config_key='deployment_environment' and active and config_value->>'environment'='staging' and config_value->>'supabase_ref'='bvooallokgfktssadsrv' and config_value->>'payment_mode'='synthetic' and config_value->>'origin'='https://beta.revitalizedacademy.com') and exists(select 1 from private.beta_staff_test_recipients where email=lower(trim(p_email)) and approved)
$$;
revoke all on function public.beta_staff_test_recipient_approved(text) from public,anon,authenticated;
grant execute on function public.beta_staff_test_recipient_approved(text) to service_role;
