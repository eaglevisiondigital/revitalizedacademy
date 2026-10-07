-- Beta only. Enrollment configuration never substitutes for agreement/payment gates.
create function private.require_beta_enrollment_owner(p_contact_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.app_runtime_config where config_key='deployment_environment' and active and config_value->>'environment'='staging' and config_value->>'supabase_ref'='bvooallokgfktssadsrv' and config_value->>'origin'='https://beta.revitalizedacademy.com' and config_value->>'payment_mode'='synthetic') then raise exception 'Beta enrollment controls are staging-only' using errcode='42501'; end if;
 if auth.uid() is null or not exists(select 1 from public.staff_access where user_id=auth.uid() and role in ('owner','admin') and status='active' and onboarding_status='complete') or not private.staff_has_permission(auth.uid(),'finance.manage') or not private.staff_can_access_contact(auth.uid(),p_contact_id) then raise exception 'Authorized Owner/Administrator and contact scope required' using errcode='42501'; end if;
 if not exists(select 1 from public.contacts where id=p_contact_id and record_kind='crm') then raise exception 'Existing client contact required' using errcode='22023'; end if;
end $$;

create function private.beta_client_enrollment_state(p_contact_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a public.journey_enrollment_activations%rowtype; c public.contacts%rowtype; delivery jsonb;
begin
 perform private.require_beta_enrollment_owner(p_contact_id);
 select * into c from public.contacts where id=p_contact_id;
 select * into a from public.journey_enrollment_activations where contact_id=p_contact_id order by created_at desc limit 1;
 select jsonb_build_object('status',d.status,'provider_accepted',d.provider_message_id is not null,'updated_at',d.updated_at)
 into delivery from public.notification_delivery_jobs d join public.client_agreements g on g.id=d.client_agreement_id
 where g.activation_id=a.id order by d.created_at desc limit 1;
 return jsonb_build_object('email',c.email,'recipient_approved',public.beta_test_recipient_approved(c.email),
 'enrollment_created',a.id is not null,'program_code',a.program_code,'program_name',a.program_name,
 'billing_choice',a.billing_choice,'amount_cents',a.amount_cents,'currency',a.currency,
 'agreement_status',a.agreement_status,'payment_status',a.payment_status,'activation_status',a.access_status,
 'agreement_count',(select count(*) from public.client_agreements where activation_id=a.id),
 'invitation',delivery,'ready_for_access',case when a.id is not null then private.enrollment_gates_complete(a) else false end,
 'member_access',(select status from public.client_access where contact_id=p_contact_id),
 'account_claimed',(select user_id is not null and not needs_onboarding_claim from public.client_access where contact_id=p_contact_id),
 'membership_status',(select cm.status from public.client_access ca join public.client_memberships cm on cm.id=ca.membership_id where ca.contact_id=p_contact_id));
end $$;

create function private.save_beta_client_enrollment(p_contact_id uuid,p_program_code text,p_billing_choice text,p_amount_cents integer,p_currency text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.journey_enrollment_activations%rowtype; p public.program_catalog%rowtype; j uuid; s uuid;
begin
 perform private.require_beta_enrollment_owner(p_contact_id);
 -- Contact lock serializes retries, even before an activation exists.
 perform 1 from public.contacts where id=p_contact_id for update;
 select * into p from public.program_catalog where program_code=p_program_code and active;
 if not found or p_amount_cents is null or p_amount_cents<0 or p_currency not in ('USD','CAD') or p_currency is null or p_billing_choice not in ('weekly','monthly','one_time','custom') or p_billing_choice is null then raise exception 'Active program, billing, nonnegative amount and supported currency required' using errcode='22023'; end if;
 select * into a from public.journey_enrollment_activations where contact_id=p_contact_id order by created_at desc limit 1 for update;
 if a.id is not null then
  if (a.program_code,a.billing_choice,a.amount_cents,a.currency) is not distinct from (p_program_code,p_billing_choice,p_amount_cents,p_currency) then return private.beta_client_enrollment_state(p_contact_id); end if;
  if exists(select 1 from public.client_agreements where activation_id=a.id) or exists(select 1 from public.payment_records where activation_id=a.id) or exists(select 1 from public.client_memberships where activation_id=a.id) then raise exception 'Issued enrollment terms are locked. Review the existing agreement/payment workflow instead of replacing it.' using errcode='22023'; end if;
  update public.journey_enrollment_activations set program_code=p.program_code,program_name=p.name,billing_choice=p_billing_choice,amount_cents=p_amount_cents,currency=p_currency,commitment_months=p.default_commitment_months,updated_at=now() where id=a.id;
 else
  select cj.id into j from public.contact_journeys cj where cj.contact_id=p_contact_id and cj.status in ('active','paused','nurture') and exists(select 1 from public.contact_journey_steps where journey_id=cj.id and step_key='payment_agreement') order by cj.created_at desc limit 1;
  if j is null then j:=public.ensure_contact_journey(p_contact_id,'direct_membership',jsonb_build_object('source','beta_owner_enrollment')); end if;
  select id into s from public.contact_journey_steps where journey_id=j and step_key='payment_agreement';
  if s is null then raise exception 'Existing enrollment journey has no payment/agreement step' using errcode='22023'; end if;
  insert into public.journey_enrollment_activations(contact_id,journey_id,journey_step_id,program_code,program_name,billing_choice,amount_cents,currency,commitment_months,created_by)
  values(p_contact_id,j,s,p.program_code,p.name,p_billing_choice,p_amount_cents,p_currency,p.default_commitment_months,auth.uid());
 end if;
 insert into public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) values(p_contact_id,'beta_enrollment_configured','Beta enrollment configured; invitation not sent',auth.uid(),jsonb_build_object('program_code',p_program_code));
 return private.beta_client_enrollment_state(p_contact_id);
end $$;

create function public.beta_client_enrollment_state(p_contact_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.beta_client_enrollment_state(p_contact_id) $$;
create function public.save_beta_client_enrollment(p_contact_id uuid,p_program_code text,p_billing_choice text,p_amount_cents integer,p_currency text) returns jsonb language sql security invoker set search_path='' as $$ select private.save_beta_client_enrollment(p_contact_id,p_program_code,p_billing_choice,p_amount_cents,p_currency) $$;
revoke all on function private.require_beta_enrollment_owner(uuid),private.beta_client_enrollment_state(uuid),private.save_beta_client_enrollment(uuid,text,text,integer,text),public.beta_client_enrollment_state(uuid),public.save_beta_client_enrollment(uuid,text,text,integer,text) from public,anon,service_role;
grant execute on function private.require_beta_enrollment_owner(uuid),private.beta_client_enrollment_state(uuid),private.save_beta_client_enrollment(uuid,text,text,integer,text),public.beta_client_enrollment_state(uuid),public.save_beta_client_enrollment(uuid,text,text,integer,text) to authenticated;
