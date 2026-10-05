-- Distinguish program-template entitlements from explicitly approved
-- membership-level grants. Existing rows retain the historical/template
-- behavior unless a privileged workflow deliberately marks an override.
alter table public.membership_entitlements
  add column provisioning_source text not null default 'program_template';

alter table public.membership_entitlements
  add constraint membership_entitlements_provisioning_source_check
  check (provisioning_source in ('program_template','membership_override'));

comment on column public.membership_entitlements.provisioning_source is
  'Origin of the entitlement: program_template is reconciled from program defaults; membership_override is an explicitly authorized membership-level grant.';

create or replace function private.reconcile_membership_entitlements(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $function$
declare
  v_program_code text;
  v_status text;
begin
  select cm.program_code, cm.status
  into v_program_code, v_status
  from public.client_memberships cm
  where cm.id = p_membership_id;

  if v_program_code is null then
    return;
  end if;

  update public.membership_entitlements me
  set status = 'inactive',
      updated_at = now()
  where me.membership_id = p_membership_id
    and (
      v_status not in ('active','pending')
      or (
        me.provisioning_source = 'program_template'
        and not exists (
          select 1
          from public.program_entitlement_templates pet
          where pet.program_code = v_program_code
            and pet.entitlement_key = me.entitlement_key
            and pet.active
        )
      )
    );

  if v_status in ('active','pending') then
    insert into public.membership_entitlements(
      membership_id, entitlement_key, label, status, limit_value,
      reset_cadence, metadata, provisioning_source, updated_at
    )
    select
      p_membership_id,
      pet.entitlement_key,
      pet.label,
      'active',
      pet.limit_value,
      pet.reset_cadence,
      pet.metadata,
      'program_template',
      now()
    from public.program_entitlement_templates pet
    where pet.program_code = v_program_code
      and pet.active
    on conflict (membership_id, entitlement_key) do update
    set label = excluded.label,
        status = 'active',
        limit_value = excluded.limit_value,
        reset_cadence = excluded.reset_cadence,
        metadata = excluded.metadata,
        provisioning_source = 'program_template',
        updated_at = now();
  end if;
end;
$function$;

revoke all on function private.reconcile_membership_entitlements(uuid) from public, anon, authenticated, service_role;
grant execute on function private.reconcile_membership_entitlements(uuid) to postgres;
