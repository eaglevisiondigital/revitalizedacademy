-- Evaluate enrollment agreement gates against the current program's active
-- agreement requirements. Historical/retired agreement revisions must not keep
-- a client blocked after the current required agreement is satisfied.

create or replace function private.enrollment_gates_complete(a public.journey_enrollment_activations)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog','public','private'
as $$
  select private.enrollment_payment_satisfied(a)
  and (
    case
      when exists (
        select 1
        from public.program_agreement_requirements par
        where par.program_code=a.program_code
          and par.active
          and par.required
      ) then
        not exists (
          select 1
          from public.program_agreement_requirements par
          where par.program_code=a.program_code
            and par.active
            and par.required
            and not exists (
              select 1
              from public.client_agreements ca
              where ca.activation_id=a.id
                and ca.agreement_template_id=par.agreement_template_id
                and private.agreement_signatures_satisfied(ca)
            )
        )
      else
        (
          exists (
            select 1
            from public.client_agreements ca
            join public.agreement_templates t on t.id=ca.agreement_template_id
            where ca.activation_id=a.id
              and (t.status<>'retired' or ca.status in ('signed','waived'))
          )
          and not exists (
            select 1
            from public.client_agreements ca
            join public.agreement_templates t on t.id=ca.agreement_template_id
            where ca.activation_id=a.id
              and (t.status<>'retired' or ca.status in ('signed','waived'))
              and not private.agreement_signatures_satisfied(ca)
          )
        )
        or (
          a.agreement_status='waived'
          and not exists (
            select 1
            from public.client_agreements ca
            join public.agreement_templates t on t.id=ca.agreement_template_id
            where ca.activation_id=a.id
              and (t.status<>'retired' or ca.status in ('signed','waived'))
          )
        )
    end
  );
$$;

create or replace function private.sync_client_agreement_to_activation()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  v_program_code text;
  v_required integer:=0;
  v_satisfied integer:=0;
  v_declined integer:=0;
  v_sent integer:=0;
begin
  if NEW.activation_id is null then return NEW; end if;

  select a.program_code
  into v_program_code
  from public.journey_enrollment_activations a
  where a.id=NEW.activation_id;

  select count(*)
  into v_required
  from public.program_agreement_requirements par
  where par.program_code=v_program_code
    and par.active
    and par.required;

  if v_required>0 then
    select
      count(*) filter (
        where exists (
          select 1
          from public.client_agreements ca
          where ca.activation_id=NEW.activation_id
            and ca.agreement_template_id=par.agreement_template_id
            and private.agreement_signatures_satisfied(ca)
        )
      ),
      count(*) filter (
        where exists (
          select 1
          from public.client_agreements ca
          where ca.activation_id=NEW.activation_id
            and ca.agreement_template_id=par.agreement_template_id
            and ca.status='declined'
        )
      ),
      count(*) filter (
        where exists (
          select 1
          from public.client_agreements ca
          where ca.activation_id=NEW.activation_id
            and ca.agreement_template_id=par.agreement_template_id
            and ca.status in ('sent','viewed','signed','waived')
        )
      )
    into v_satisfied,v_declined,v_sent
    from public.program_agreement_requirements par
    where par.program_code=v_program_code
      and par.active
      and par.required;
  else
    select
      count(*) filter (where private.agreement_signatures_satisfied(ca)),
      count(*) filter (where ca.status='declined'),
      count(*) filter (where ca.status in ('sent','viewed','signed','waived')),
      count(*)
    into v_satisfied,v_declined,v_sent,v_required
    from public.client_agreements ca
    join public.agreement_templates t on t.id=ca.agreement_template_id
    where ca.activation_id=NEW.activation_id
      and (t.status<>'retired' or ca.status in ('signed','waived'));
  end if;

  if v_declined>0 then
    update public.journey_enrollment_activations
    set agreement_status='declined',updated_at=now()
    where id=NEW.activation_id;
  elsif v_required>0 and v_satisfied=v_required then
    update public.journey_enrollment_activations
    set agreement_status='signed',
        agreement_signed_at=coalesce(agreement_signed_at,now()),
        agreement_completion_method=coalesce(agreement_completion_method,'revitalized_esign'),
        updated_at=now()
    where id=NEW.activation_id;
  else
    update public.journey_enrollment_activations
    set agreement_status=case when v_sent>0 then 'sent' else 'not_sent' end,
        updated_at=now()
    where id=NEW.activation_id;
  end if;

  return NEW;
end;
$$;

-- Reconcile existing staged activations through the same current-program rules.
do $$
declare
  r record;
  v_required integer;
  v_satisfied integer;
  v_declined integer;
  v_sent integer;
begin
  for r in
    select a.id,a.program_code
    from public.journey_enrollment_activations a
  loop
    select count(*)
    into v_required
    from public.program_agreement_requirements par
    where par.program_code=r.program_code
      and par.active
      and par.required;

    if v_required>0 then
      select
        count(*) filter (
          where exists (
            select 1 from public.client_agreements ca
            where ca.activation_id=r.id
              and ca.agreement_template_id=par.agreement_template_id
              and private.agreement_signatures_satisfied(ca)
          )
        ),
        count(*) filter (
          where exists (
            select 1 from public.client_agreements ca
            where ca.activation_id=r.id
              and ca.agreement_template_id=par.agreement_template_id
              and ca.status='declined'
          )
        ),
        count(*) filter (
          where exists (
            select 1 from public.client_agreements ca
            where ca.activation_id=r.id
              and ca.agreement_template_id=par.agreement_template_id
              and ca.status in ('sent','viewed','signed','waived')
          )
        )
      into v_satisfied,v_declined,v_sent
      from public.program_agreement_requirements par
      where par.program_code=r.program_code
        and par.active
        and par.required;

      update public.journey_enrollment_activations
      set agreement_status=case
            when v_declined>0 then 'declined'
            when v_satisfied=v_required then 'signed'
            when v_sent>0 then 'sent'
            else 'not_sent'
          end,
          agreement_signed_at=case
            when v_satisfied=v_required then coalesce(agreement_signed_at,now())
            else agreement_signed_at
          end,
          agreement_completion_method=case
            when v_satisfied=v_required then coalesce(agreement_completion_method,'revitalized_esign')
            else agreement_completion_method
          end,
          updated_at=now()
      where id=r.id;
    end if;
  end loop;
end
$$;
