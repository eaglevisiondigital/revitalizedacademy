-- Queue primary client agreement email delivery through the existing
-- notification delivery system. Keep delivery provider logic in Edge Functions.

alter table public.notification_delivery_jobs
  add column if not exists client_agreement_id uuid
  references public.client_agreements(id) on delete cascade;

create index if not exists notification_delivery_jobs_client_agreement_idx
  on public.notification_delivery_jobs(client_agreement_id, status, scheduled_for);

alter table public.notification_delivery_jobs
  drop constraint if exists notification_delivery_recipient_kind;

alter table public.notification_delivery_jobs
  add constraint notification_delivery_recipient_kind
  check (
    ((notification_id is not null) and (user_id is not null))
    or signer_invitation_id is not null
    or client_agreement_id is not null
  );

create or replace function private.queue_primary_client_agreement_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $$
declare
  v_email text;
  v_origin text;
begin
  if new.status <> 'sent' then
    return new;
  end if;

  if tg_op='UPDATE'
     and old.status='sent'
     and old.sent_at is not distinct from new.sent_at then
    return new;
  end if;

  select lower(trim(c.email))
  into v_email
  from public.contacts c
  where c.id=new.contact_id;

  if v_email is null or v_email='' then
    return new;
  end if;

  select config_value->>'origin'
  into v_origin
  from public.app_runtime_config
  where config_key='client_onboarding' and active
  limit 1;

  if v_origin is null
     or v_origin !~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$' then
    raise exception 'An approved HTTPS onboarding origin must be configured before sending client agreements';
  end if;

  update public.notification_delivery_jobs
  set status='cancelled',
      body='Agreement delivery superseded.',
      updated_at=now()
  where client_agreement_id=new.id
    and status in ('queued','failed','blocked');

  insert into public.notification_delivery_jobs(
    contact_id,
    client_agreement_id,
    channel,
    provider,
    recipient,
    subject,
    body
  )
  values(
    new.contact_id,
    new.id,
    'email',
    'resend',
    v_email,
    'Your ReVitalized Academy agreement is ready',
    'Your personalized ReVitalized Academy agreement is ready to review and sign. Sign in to your secure member account here: '
      ||v_origin||'/member/onboarding/'
  );

  return new;
end;
$$;

drop trigger if exists queue_primary_client_agreement_email_trigger
  on public.client_agreements;

create trigger queue_primary_client_agreement_email_trigger
after insert or update of status,sent_at
on public.client_agreements
for each row
execute function private.queue_primary_client_agreement_email();
