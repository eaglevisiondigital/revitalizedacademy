-- Ensure primary client agreement email can establish the authenticated
-- enrollment claim before the agreement center loads the issued agreement.
-- Raw claim tokens exist only in the delivery body and are stored as digests in
-- journey_access_links.

create or replace function private.queue_primary_client_agreement_email()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog','public','private','extensions'
as $$
declare
  v_email text;
  v_origin text;
  v_needs_claim boolean:=false;
  v_journey_id uuid;
  v_token text;
  v_body text;
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

  select coalesce(ca.needs_onboarding_claim,false)
  into v_needs_claim
  from public.client_access ca
  where ca.contact_id=new.contact_id
  limit 1;

  if v_needs_claim then
    select a.journey_id
    into v_journey_id
    from public.journey_enrollment_activations a
    where a.id=new.activation_id
      and a.contact_id=new.contact_id
    limit 1;

    if v_journey_id is null then
      raise exception 'Enrollment journey is required before sending this agreement';
    end if;

    v_token:=encode(extensions.gen_random_bytes(32),'hex');

    insert into public.journey_access_links(
      contact_id,journey_id,token_hash,active,expires_at,created_by
    )
    values(
      new.contact_id,
      v_journey_id,
      encode(extensions.digest(v_token,'sha256'),'hex'),
      true,
      now()+interval '30 days',
      new.created_by
    );

    v_body:='Your personalized ReVitalized Academy agreement is ready to review and sign. '
      ||'Open your secure enrollment link, sign in with this email address, and review your agreement: '
      ||v_origin||'/member/onboarding/#enroll='||v_token;
  else
    v_body:='Your personalized ReVitalized Academy agreement is ready to review and sign. '
      ||'Sign in to your secure member account here: '
      ||v_origin||'/member/onboarding/';
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
    v_body
  );

  return new;
end;
$$;
