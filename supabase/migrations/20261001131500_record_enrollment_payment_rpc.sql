-- Record a staff-entered enrollment payment in the authoritative payment ledger.
-- Enrollment payment completion is ledger-derived; setting an activation label alone
-- must never satisfy the payment gate.

create or replace function public.record_enrollment_payment(
  p_activation_id uuid,
  p_amount_cents integer default null,
  p_payment_method text default 'other',
  p_reference_number text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  a public.journey_enrollment_activations%rowtype;
  v_net bigint:=0;
  v_remaining integer;
  v_amount integer;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  select * into a
  from public.journey_enrollment_activations
  where id=p_activation_id
  for update;

  if a.id is null then
    raise exception 'Enrollment activation not found';
  end if;

  if not private.staff_has_permission(auth.uid(),'finance.manage')
     or not private.staff_can_access_contact(auth.uid(),a.contact_id) then
    raise exception 'Financial management permission required' using errcode='42501';
  end if;

  if a.amount_cents is null or a.amount_cents<0 then
    raise exception 'Enrollment amount must be configured before recording payment';
  end if;

  if p_payment_method not in (
    'integrated_processor','external_card','interac_etransfer','ach_bank_transfer',
    'wire_transfer','paypal','cash','check','complimentary_waived','other'
  ) then
    raise exception 'Unsupported payment method';
  end if;

  select coalesce(sum(
    case
      when transaction_type in ('payment','adjustment') and status='recorded' then amount_cents
      when transaction_type in ('refund','reversal') and status='recorded' then -amount_cents
      else 0
    end
  ),0)
  into v_net
  from public.payment_records
  where activation_id=a.id
    and contact_id=a.contact_id
    and currency=a.currency;

  v_remaining:=greatest(a.amount_cents-v_net,0);
  v_amount:=coalesce(p_amount_cents,v_remaining);

  if v_amount<0 then
    raise exception 'Payment amount cannot be negative';
  end if;

  if v_amount=0 then
    select id into v_id
    from public.payment_records
    where activation_id=a.id
      and contact_id=a.contact_id
      and currency=a.currency
      and status='recorded'
      and transaction_type in ('payment','adjustment')
    order by received_at desc,created_at desc
    limit 1;
    return v_id;
  end if;

  insert into public.payment_records(
    contact_id,journey_id,activation_id,transaction_type,status,amount_cents,currency,
    payment_method,provider,reference_number,received_at,recorded_by,notes,metadata
  )
  values(
    a.contact_id,a.journey_id,a.id,'payment','recorded',v_amount,a.currency,
    p_payment_method,'manual_staff',nullif(trim(coalesce(p_reference_number,'')),''),
    now(),auth.uid(),nullif(trim(coalesce(p_notes,'')),''),
    jsonb_build_object('source','staff_payment_record','manual',true)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_enrollment_payment(uuid,integer,text,text,text) from public,anon;
grant execute on function public.record_enrollment_payment(uuid,integer,text,text,text) to authenticated;
