-- Payments v1 (Pricing v2 revision): disabled until legal/provider/environment acceptance. No seeds of people,
-- webinar events, role grants, provider secrets or member-access activation.
create table private.payment_configuration (
 singleton boolean primary key default true check(singleton), enabled boolean not null default false,
 provider_mode text not null default 'live' check(provider_mode in ('sandbox','live')),
 canadian_currency_verified boolean not null default false,
 webinar_event_id uuid references public.webinar_events(id),
 webinar_event_date_label text not null default 'October 17, 2026',
 webinar_checkout_disclosure text not null default 'Registration is confirmed once payment is successfully processed. Because seating is limited, webinar registration payments are non-refundable unless ReVitalized Academy cancels the event. If you are unable to attend, contact ReVitalized Academy before the event regarding available options.',
 terms_url text, refund_url text,
 check(length(webinar_event_date_label) between 1 and 120),
 check(length(webinar_checkout_disclosure) between 1 and 1200),
 check(terms_url is null or terms_url ~ '^https://'), check(refund_url is null or refund_url ~ '^https://')
);
insert into private.payment_configuration(singleton) values(true);
create table private.payment_requests (
 id uuid primary key default gen_random_uuid(), contact_id uuid not null references public.contacts(id),
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'), nonce uuid not null unique,
 product text not null check(product in ('webinar','program_plan','coaching','custom')),
 plan_code text references public.program_product_plans(plan_code),
 plan_price_id uuid references public.program_plan_prices(id),
 market_code text check(market_code is null or market_code in ('CA','US','GB')),
 minimum_commitment_months integer,
 coverage_months integer,
 minimum_contract_amount_cents integer,
 post_commitment_behavior text,
 description text not null check(length(description) between 1 and 500), payer_name text not null,
 payer_email text not null, country text not null, currency text not null, merchant_route text not null,
 provider_mode text not null check(provider_mode in ('sandbox','live')),
 plan text not null check(plan in ('one_time','monthly','installments')),
 total_cents integer not null check(total_cents>0), webinar_event_id uuid references public.webinar_events(id),
 created_by uuid references auth.users(id), expires_at timestamptz, created_at timestamptz not null default now(),
 status text not null default 'pending' check(status in ('pending','authorized','paid','settled','failed','voided','refunded','past_due','review')),
 sales_rep text, referral_source text, campaign_source text, internal_reference text,
 consent_at timestamptz, consent_version text, customer_profile_id text, payment_profile_id text,
 subscription_id text unique, subscription_first_number integer not null default 2, subscription_starts_at timestamptz,
 next_subscription_due_at timestamptz, recurring_state text not null default 'not_started',
 check((country='CA' and currency='CAD' and merchant_route='CA_AUTHORIZE_NET') or
       (country='US' and currency='USD' and merchant_route='US_AUTHORIZE_NET') or
       (country='GB' and currency='GBP' and merchant_route='GB_PAYMENT_PROVIDER_PENDING')),
 check((product='program_plan' and plan_code is not null and plan_price_id is not null and market_code is not null) or
       (product<>'program_plan' and plan_code is null and plan_price_id is null))
);
create index payment_requests_contact on private.payment_requests(contact_id,created_at desc);
create unique index payment_request_webinar_once on private.payment_requests(contact_id,webinar_event_id)
 where product='webinar' and status not in ('voided','refunded');
create table private.payment_installments (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references private.payment_requests(id),
 number integer not null check(number>0), amount_cents integer not null check(amount_cents>0), due_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','processing','authorized','paid','settled','failed','voided','refunded','past_due','review')),
 paid_at timestamptz, failed_at timestamptz,
 unique(request_id,number)
);
create index payment_installments_due on private.payment_installments(due_at) where status in ('pending','past_due');
create table private.payment_attempts (
 id uuid primary key default gen_random_uuid(), installment_id uuid not null references private.payment_installments(id),
 reference text not null unique default encode(extensions.gen_random_bytes(10),'hex'),
 kind text not null check(kind in ('hosted','profile_charge')), created_at timestamptz not null default now(),
 status text not null default 'processing' check(status in ('processing','pending','authorized','paid','settled','failed','voided','review')),
 provider_transaction_id text
);
create unique index payment_attempt_one_active on private.payment_attempts(installment_id)
 where status in ('processing','pending','authorized','paid','settled','review');
create table private.payment_provider_transactions (
 merchant_route text not null, provider_mode text not null, transaction_id text not null,
 request_id uuid not null references private.payment_requests(id), installment_id uuid not null references private.payment_installments(id),
 amount_cents integer not null check(amount_cents>0), status text not null,
 last_four text check(last_four ~ '^\d{4}$'), card_brand text, occurred_at timestamptz not null,
 updated_at timestamptz not null default now(), primary key(merchant_route,provider_mode,transaction_id)
);
create index payment_transaction_reconcile_due on private.payment_provider_transactions(updated_at) where status in ('pending','authorized','paid');
create table private.payment_webhook_inbox (
 notification_id text primary key, event_type text not null, entity_id text not null,
 provider_mode text not null, created_at timestamptz not null default now(), processed_at timestamptz,
 claimed_at timestamptz, attempts integer not null default 0, error_code text
);
create table private.payment_receipt_outbox (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references private.payment_requests(id),
 transaction_id text not null, amount_cents integer not null, provider_mode text not null,
 created_at timestamptz not null default now(), claimed_at timestamptz, sent_at timestamptz, cancelled_at timestamptz,
 attempts integer not null default 0, error_code text, unique(request_id,transaction_id)
);
create table private.payment_start_limits(key_hash text primary key,window_at timestamptz not null default now(),count integer not null default 0);
-- Extend the existing authoritative ledger, preserving all manual-payment fields/RPCs.
alter table public.payment_records add column payment_request_id uuid references private.payment_requests(id),
 add column installment_id uuid references private.payment_installments(id), add column merchant_route text,
 add column provider_mode text, add column provider_transaction_id text, add column provider_status text,
 add column sales_rep text, add column referral_source text, add column campaign_source text;
alter table public.payment_records alter column recorded_by drop not null;
alter table public.payment_records add constraint payment_record_automated_actor check(
 recorded_by is not null or (payment_method='integrated_processor' and payment_request_id is not null
 and merchant_route is not null and provider_mode is not null and provider_transaction_id is not null));
create unique index payment_records_provider_unique on public.payment_records(merchant_route,provider_mode,provider_transaction_id)
 where provider_transaction_id is not null;

create function private.can_manage_payment_contact(p_contact uuid,p_write boolean)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff_access s where s.user_id=(select auth.uid()) and s.status='active'
 and (s.role<>'coach' or s.onboarding_status='complete')
 and private.staff_has_permission(s.user_id,case when p_write then 'finance.manage' else 'finance.view' end)
 and private.staff_can_access_contact(s.user_id,p_contact));
$$;

create function private.insert_payment_request(p_contact uuid,p_data jsonb,p_token_hash text,p_nonce uuid,p_actor uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare r uuid; x jsonb; n int:=0; total bigint:=0; expected int; approved_description text; last_due timestamptz; due timestamptz;
 c public.contacts; cfg private.payment_configuration; product text:=p_data->>'product'; plan text:=p_data->>'plan';
 v_market text; v_plan public.program_product_plans%rowtype; v_price public.program_plan_prices%rowtype;
 v_route public.payment_merchant_routes%rowtype; v_eligibility jsonb; v_activation public.journey_enrollment_activations%rowtype;
begin
 select * into cfg from private.payment_configuration;
 select * into strict c from public.contacts where id=p_contact;
 if product='program_plan' then
  v_market:=private.normalized_contact_market(c.country);
  if v_market is null then raise exception 'country_route_unavailable'; end if;
  select * into v_plan from public.program_product_plans where plan_code=p_data->>'plan_code' and active;
  select * into v_price from public.program_plan_prices where plan_code=v_plan.plan_code and market_code=v_market and active and effective_from<=now() and (effective_until is null or effective_until>now());
  select * into v_route from public.payment_merchant_routes where route_key=v_price.merchant_route;
  select * into v_activation from public.journey_enrollment_activations where contact_id=p_contact order by created_at desc limit 1;
  v_eligibility:=private.plan_eligibility(p_contact,v_plan.plan_code);
  if v_plan.plan_code is null or v_price.id is null or v_route.route_key is null or v_activation.plan_code is distinct from v_plan.plan_code
   or v_activation.plan_price_id is distinct from v_price.id or not (v_eligibility->>'eligible')::boolean then raise exception 'plan_not_available'; end if;
  if not cfg.enabled or not v_route.payment_enabled or v_route.configuration_state<>'live_ready' or v_price.checkout_state<>'live_ready' then raise exception 'payments_unavailable'; end if;
  expected:=v_price.amount_cents; approved_description:=v_plan.display_name;
  plan:=case when v_plan.billing_cadence='monthly' then 'monthly' else 'one_time' end;
 elsif product='webinar' then
  if (p_data->>'country') is distinct from 'CA' or (p_data->>'currency') is distinct from 'CAD' or (p_data->>'merchant_route') is distinct from 'CA_AUTHORIZE_NET' then raise exception 'country_route_unavailable'; end if;
  expected:=5000; approved_description:='ReVitalized Roadmap to a Healthy You — October 17, 2026';
 elsif product in ('coaching','custom') and (p_data->>'total_cents') ~ '^[1-9][0-9]{0,9}$' then expected:=(p_data->>'total_cents')::int; approved_description:=trim(p_data->>'description');
 else raise exception 'invalid_product_or_amount'; end if;
 if (product='webinar' and plan<>'one_time') or plan not in ('one_time','monthly','installments')
 or (product='program_plan' and plan is distinct from case when v_plan.billing_cadence='monthly' then 'monthly' else 'one_time' end)
 or (plan='monthly' and product<>'program_plan') then raise exception 'invalid_plan'; end if;
 if product='webinar' and not exists(select 1 from public.webinar_events e where e.id=cfg.webinar_event_id
 and e.registration_open and e.starts_at>now() and e.reservation_amount_cents=5000) then raise exception 'webinar_unconfigured'; end if;
 if jsonb_typeof(p_data->'schedule')<>'array' then raise exception 'invalid_schedule'; end if;
 for x in select value from jsonb_array_elements(p_data->'schedule') loop
  n:=n+1; if not ((x->>'amount_cents') ~ '^[1-9][0-9]{0,9}$') then raise exception 'invalid_amount'; end if;
  total:=total+(x->>'amount_cents')::int; due:=(x->>'due_at')::timestamptz;
  if due is null or due<now()-interval '5 minutes' or due<last_due then raise exception 'invalid_due_date'; end if;
  last_due:=due;
 end loop;
 if (plan='installments' and n not between 2 and 4) or (plan<>'installments' and n<>1) or total<>expected then raise exception 'unbalanced_plan'; end if;
 if length(approved_description) not between 1 and 500 then raise exception 'invalid_description'; end if;
 if p_data->>'expires_at' is not null and (p_data->>'expires_at')::timestamptz<=now() then raise exception 'invalid_expiration'; end if;
 insert into private.payment_requests(contact_id,token_hash,nonce,product,plan_code,plan_price_id,market_code,minimum_commitment_months,coverage_months,minimum_contract_amount_cents,post_commitment_behavior,description,payer_name,payer_email,
 country,currency,merchant_route,provider_mode,plan,total_cents,webinar_event_id,created_by,expires_at,sales_rep,referral_source,campaign_source,internal_reference)
 values(p_contact,p_token_hash,p_nonce,product,
 case when product='program_plan' then v_plan.plan_code end,case when product='program_plan' then v_price.id end,case when product='program_plan' then v_market end,
 case when product='program_plan' then v_plan.minimum_commitment_months end,case when product='program_plan' then v_plan.coverage_months end,
 case when product='program_plan' then v_plan.minimum_contract_amount_cents end,case when product='program_plan' then v_plan.post_commitment_behavior end,
 approved_description,coalesce(p_data->>'payer_name',concat_ws(' ',c.first_name,c.last_name)),
 lower(coalesce(p_data->>'payer_email',c.email)),coalesce(v_market,'CA'),coalesce(v_price.currency,'CAD'),coalesce(v_route.route_key,'CA_AUTHORIZE_NET'),cfg.provider_mode,plan,expected,
 case when product='webinar' then cfg.webinar_event_id end,p_actor,(p_data->>'expires_at')::timestamptz,
 left(coalesce(nullif(trim(p_data->>'sales_rep'),''),c.sales_rep_name),120),
 left(coalesce(nullif(trim(p_data->>'referral_source'),''),c.referral_source),160),
 left(coalesce(nullif(trim(p_data->>'campaign_source'),''),c.first_source),160),
 left(p_data->>'internal_reference',1000)) returning id into r;
 n:=0; for x in select value from jsonb_array_elements(p_data->'schedule') loop
  n:=n+1; insert into private.payment_installments(request_id,number,amount_cents,due_at) values(r,n,(x->>'amount_cents')::int,(x->>'due_at')::timestamptz);
 end loop;
 return r;
end; $$;

create function public.staff_create_payment_request(p_contact uuid,p_data jsonb,p_token_hash text,p_nonce uuid)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not private.can_manage_payment_contact(p_contact,true) then raise exception 'Not authorized'; end if;
 return private.insert_payment_request(p_contact,p_data,p_token_hash,p_nonce,auth.uid());
end; $$;
create function private.payment_request_summary(p_request uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('description',r.description,'payer_name',r.payer_name,'product',r.product,'plan_code',r.plan_code,'plan_price_id',r.plan_price_id,
 'market_code',r.market_code,'merchant_route',r.merchant_route,'minimum_commitment_months',r.minimum_commitment_months,'coverage_months',r.coverage_months,
 'minimum_contract_amount_cents',r.minimum_contract_amount_cents,'post_commitment_behavior',r.post_commitment_behavior,'currency',r.currency,'provider_mode',r.provider_mode,
 'plan',r.plan,'status',r.status,'contract_total_cents',case when r.plan<>'monthly' then r.total_cents end,
 'monthly_amount_cents',case when r.plan='monthly' then r.total_cents end,'recurring_state',r.recurring_state,
 'paid_cents',coalesce((select sum(p.amount_cents) from public.payment_records p where p.payment_request_id=r.id and p.status='recorded' and p.transaction_type='payment'),0),
 'scheduled_cents',case when r.plan='monthly' and r.recurring_state='active' then r.total_cents else coalesce((select sum(i.amount_cents) from private.payment_installments i where i.request_id=r.id and i.status in ('pending','past_due','failed')),0) end,
 'next_due_at',coalesce((select min(i.due_at) from private.payment_installments i where i.request_id=r.id and i.status in ('pending','past_due','failed')),r.next_subscription_due_at),
 'schedule',coalesce((select jsonb_agg(jsonb_build_object('number',i.number,'amount_cents',i.amount_cents,'due_at',i.due_at,'status',i.status,'paid_at',i.paid_at,'failed_at',i.failed_at) order by i.number) from private.payment_installments i where i.request_id=r.id),'[]'::jsonb),
 'event_date_label',case when r.product='webinar' then c.webinar_event_date_label end,
 'checkout_disclosure',case when r.product='webinar' then c.webinar_checkout_disclosure end,
 'terms_url',c.terms_url,'refund_url',c.refund_url)
 from private.payment_requests r cross join private.payment_configuration c where r.id=p_request;
$$;
create function public.staff_list_payment_requests(p_contact uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not private.can_manage_payment_contact(p_contact,false) then raise exception 'Not authorized'; end if;
 return coalesce((select jsonb_agg(private.payment_request_summary(r.id)||jsonb_build_object('id',r.id,'created_at',r.created_at,'sales_rep',r.sales_rep,'referral_source',r.referral_source,'campaign_source',r.campaign_source) order by r.created_at desc) from private.payment_requests r where r.contact_id=p_contact),'[]'::jsonb);
end; $$;

-- Single service-only command boundary. All browser tokens are SHA-256 digests.
-- No raw provider response, PAN, CVV or bearer token is accepted/persisted here.
create function public.payment_service_command(p_action text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r private.payment_requests; i private.payment_installments; a private.payment_attempts;
 cfg private.payment_configuration; cid uuid; rid uuid; t private.payment_provider_transactions;
 result jsonb; pid text; state text; amt int; ref text; v_event public.webinar_events; occupied int;
begin
 select * into cfg from private.payment_configuration;
 if p_action='configuration' then return to_jsonb(cfg); end if;
 if p_action='webinar_start' then
  if not cfg.enabled then raise exception 'payments_unavailable'; end if;
  if p_data->>'ip_hash' !~ '^[a-f0-9]{64}$' or p_data->>'ip_hash' is null then raise exception 'request_not_allowed'; end if;
  insert into private.payment_start_limits(key_hash,count) values(p_data->>'ip_hash',1) on conflict(key_hash) do update
   set count=case when private.payment_start_limits.window_at<now()-interval '10 minutes' then 1 else private.payment_start_limits.count+1 end,
   window_at=case when private.payment_start_limits.window_at<now()-interval '10 minutes' then now() else private.payment_start_limits.window_at end;
  if (select count from private.payment_start_limits where key_hash=p_data->>'ip_hash')>5 then raise exception 'request_rate_limited'; end if;
  if not coalesce(p_data->>'email' ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$',false) or length(p_data->>'email')>254
  or coalesce(length(trim(p_data->>'first_name')),0) not between 1 and 80 or coalesce(length(trim(p_data->>'last_name')),0) not between 1 and 80 then raise exception 'invalid_contact'; end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(p_data->>'email'),0));
  if (select count(*) from public.contacts where lower(email)=lower(p_data->>'email'))>1 then raise exception 'contact_requires_review'; end if;
  select id into cid from public.contacts where lower(email)=lower(p_data->>'email');
  if cid is null then insert into public.contacts(first_name,last_name,email,country,first_source,last_source)
   values(p_data->>'first_name',p_data->>'last_name',lower(p_data->>'email'),'CA','paid_webinar','paid_webinar') returning id into cid; end if;
  if exists(select 1 from private.payment_requests where contact_id=cid and webinar_event_id=cfg.webinar_event_id and status not in ('voided','refunded')) then raise exception 'existing_request_requires_recovery'; end if;
  rid:=private.insert_payment_request(cid,p_data||jsonb_build_object('payer_name',concat_ws(' ',p_data->>'first_name',p_data->>'last_name'),'payer_email',p_data->>'email'),p_data->>'token_hash',(p_data->>'nonce')::uuid,null);
  return jsonb_build_object('request_id',rid);
 end if;
 if p_action in ('summary','begin','poll','card_context') then
  select * into r from private.payment_requests where token_hash=p_data->>'token_hash' for update;
  if r.id is null or r.expires_at<=now() then raise exception 'link_unavailable'; end if;
  if p_data->>'actor_id' is not null and not exists(select 1 from public.profiles where user_id=(p_data->>'actor_id')::uuid and contact_id=r.contact_id)
  and lower(coalesce(p_data->>'actor_email',''))<>r.payer_email then raise exception 'link_unavailable'; end if;
  if p_action='summary' then return private.payment_request_summary(r.id); end if;
  if not cfg.enabled or cfg.provider_mode<>r.provider_mode or r.merchant_route<>'CA_AUTHORIZE_NET' then raise exception 'payments_unavailable'; end if;
  if p_action='poll' then return jsonb_build_object('request',to_jsonb(r),'attempts',coalesce((select jsonb_agg(to_jsonb(x)) from private.payment_attempts x join private.payment_installments ii on ii.id=x.installment_id where ii.request_id=r.id and x.status in ('processing','pending','authorized','review','paid')),'[]'::jsonb)); end if;
  if p_action='card_context' then
   if p_data->>'actor_id' is null then raise exception 'verified_sign_in_required'; end if;
   return to_jsonb(r);
  end if;
  if (p_data->>'consent_version') is distinct from 'payments-v1' then raise exception 'consent_required'; end if;
  if r.plan='monthly' and r.recurring_state in ('active','subscription_processing','attention') then raise exception 'subscription_managed'; end if;
  update private.payment_requests set consent_at=now(),consent_version='payments-v1' where id=r.id;
  select * into i from private.payment_installments where request_id=r.id and status not in ('paid','settled','refunded','voided') order by number limit 1 for update;
  if i.id is null then raise exception 'nothing_due'; end if;
  if i.status not in ('pending','failed','past_due') then raise exception 'payment_processing'; end if;
  if i.due_at>now()+interval '5 minutes' then return jsonb_build_object('profile_only',true,'request',to_jsonb(r)); end if;
  if r.product='webinar' then
   select * into v_event from public.webinar_events where id=r.webinar_event_id for update;
   if not v_event.registration_open or v_event.starts_at<=now() then raise exception 'webinar_unavailable'; end if;
   -- Fail closed for unresolved hosted attempts: never sell a seat twice after timeout.
   select count(*) into occupied from (select contact_id from public.webinar_registrations where event_id=v_event.id and status in ('seat_reserved','confirmed','attended')
    union select rr.contact_id from private.payment_requests rr join private.payment_installments ii on ii.request_id=rr.id where rr.webinar_event_id=v_event.id and ii.status in ('processing','review','authorized','paid','settled')) s;
   if occupied>=v_event.capacity and not exists(select 1 from public.webinar_registrations where event_id=v_event.id and contact_id=r.contact_id and status in ('seat_reserved','confirmed','attended')) then raise exception 'webinar_full'; end if;
  end if;
  insert into private.payment_attempts(installment_id,kind) values(i.id,'hosted') returning * into a;
  update private.payment_installments set status='processing' where id=i.id;
  update private.payment_requests set status='pending' where id=r.id;
  return jsonb_build_object('request',to_jsonb(r),'installment',to_jsonb(i),'attempt',to_jsonb(a));
 end if;
 if p_action='attempt_state' then
  state:=p_data->>'status'; if state not in ('pending','review','failed') then raise exception 'invalid_state'; end if;
  update private.payment_attempts set status=state where id=(p_data->>'attempt_id')::uuid and status='processing' returning * into a;
  if a.id is not null then
   update private.payment_installments set status=case when state='pending' then 'processing' else state end where id=a.installment_id;
   update private.payment_requests set status=state where id=(select request_id from private.payment_installments where id=a.installment_id);
  end if;
  return '{}'::jsonb;
 end if;
 if p_action='profile_claim' then
  update private.payment_requests set recurring_state='profile_processing' where id=(p_data->>'request_id')::uuid and recurring_state='not_started' returning * into r;
  return case when r.id is null then 'null'::jsonb else to_jsonb(r) end;
 end if;
 if p_action='profile_saved' then
  if not (p_data->>'customer_profile_id' ~ '^\d+$') then raise exception 'invalid_profile'; end if;
  update private.payment_requests set customer_profile_id=p_data->>'customer_profile_id',payment_profile_id=p_data->>'payment_profile_id',recurring_state='profile_ready' where id=(p_data->>'request_id')::uuid and recurring_state in ('profile_processing','profile_ready');
  return '{}'::jsonb;
 end if;
 if p_action='subscription_claim' then
  update private.payment_requests set recurring_state='subscription_processing' where id=(p_data->>'request_id')::uuid and plan='monthly' and recurring_state='profile_ready' and payment_profile_id is not null returning * into r;
  return case when r.id is null then 'null'::jsonb else to_jsonb(r) end;
 end if;
 if p_action='subscription_saved' then
  if not (p_data->>'subscription_id' ~ '^\d+$') or (p_data->>'first_number')::int not in (1,2) then raise exception 'invalid_subscription'; end if;
  update private.payment_requests set subscription_id=p_data->>'subscription_id',subscription_first_number=(p_data->>'first_number')::int,
   subscription_starts_at=(p_data->>'start_at')::timestamptz,next_subscription_due_at=(p_data->>'start_at')::timestamptz,
   recurring_state='active' where id=(p_data->>'request_id')::uuid and recurring_state='subscription_processing'; return '{}'::jsonb;
 end if;
 if p_action='recurring_ready' then
  select * into r from private.payment_requests where recurring_state='profile_ready' and plan='monthly' and payment_profile_id is not null and provider_mode=cfg.provider_mode and cfg.enabled limit 1;
  return case when r.id is null then 'null'::jsonb else jsonb_build_object('request',to_jsonb(r),'summary',private.payment_request_summary(r.id)) end;
 end if;
 if p_action='inbox' then
  insert into private.payment_webhook_inbox(notification_id,event_type,entity_id,provider_mode) values(p_data->>'notification_id',p_data->>'event_type',p_data->>'entity_id',cfg.provider_mode) on conflict do nothing;
  return '{}'::jsonb;
 end if;
 if p_action='inbox_claim' then
  with picked as (select notification_id from private.payment_webhook_inbox where processed_at is null and attempts<10 and (claimed_at is null or claimed_at<now()-interval '5 minutes') order by created_at limit 1 for update skip locked), claimed as (
   update private.payment_webhook_inbox set claimed_at=now(),attempts=attempts+1 where notification_id in (select notification_id from picked) returning *) select coalesce(jsonb_agg(to_jsonb(claimed)),'[]'::jsonb) into result from claimed;
  return result;
 end if;
 if p_action='inbox_done' then
  update private.payment_webhook_inbox set processed_at=case when p_data->>'error_code' is null then now() else null end,error_code=p_data->>'error_code' where notification_id=p_data->>'notification_id'; return '{}'::jsonb;
 end if;
 if p_action='subscription_state' then
  update private.payment_requests set recurring_state='attention',status='past_due' where subscription_id=p_data->>'subscription_id' and provider_mode=cfg.provider_mode;
  return '{}'::jsonb;
 end if;
 if p_action='transaction_due' then
  select * into t from private.payment_provider_transactions where provider_mode=cfg.provider_mode
   and status in ('pending','authorized','paid') and updated_at<now()-interval '5 minutes' order by updated_at limit 1 for update skip locked;
  if t.transaction_id is null then return 'null'::jsonb; end if;
  update private.payment_provider_transactions set updated_at=now() where merchant_route=t.merchant_route and provider_mode=t.provider_mode and transaction_id=t.transaction_id;
  return jsonb_build_object('transaction_id',t.transaction_id);
 end if;
 if p_action='due_claim' then
  select ii.* into i from private.payment_installments ii join private.payment_requests rr on rr.id=ii.request_id
   where ii.status in ('pending','past_due') and ii.due_at<=now() and rr.plan='installments' and rr.payment_profile_id is not null
   and rr.consent_at is not null and rr.provider_mode=cfg.provider_mode and cfg.enabled and rr.currency='CAD' and rr.merchant_route='CA_AUTHORIZE_NET'
   and not exists(select 1 from private.payment_installments earlier where earlier.request_id=ii.request_id and earlier.number<ii.number and earlier.status not in ('paid','settled')) order by ii.due_at limit 1 for update of ii skip locked;
  if i.id is null then return 'null'::jsonb; end if;
  select * into r from private.payment_requests where id=i.request_id;
  insert into private.payment_attempts(installment_id,kind) values(i.id,'profile_charge') returning * into a;
  update private.payment_installments set status='processing' where id=i.id;
  return jsonb_build_object('request',to_jsonb(r),'installment',to_jsonb(i),'attempt',to_jsonb(a));
 end if;
 if p_action='reconcile' then
  pid:=p_data->>'provider_transaction_id'; state:=p_data->>'status'; amt:=(p_data->>'amount_cents')::int;
  if pid !~ '^\d+$' or state not in ('pending','authorized','paid','settled','failed','voided','refunded') or amt<=0 then raise exception 'invalid_transaction'; end if;
  select aa.* into a from private.payment_attempts aa where aa.reference=p_data->>'reference';
  if a.id is not null then select * into i from private.payment_installments where id=a.installment_id for update; select * into r from private.payment_requests where id=i.request_id for update;
  elsif p_data->>'subscription_id' is not null then
   select * into r from private.payment_requests where subscription_id=p_data->>'subscription_id' for update;
   if r.id is not null then
    if (p_data->>'pay_number')::int<1 then raise exception 'invalid_subscription_payment'; end if;
    insert into private.payment_installments(request_id,number,amount_cents,due_at) values(r.id,(p_data->>'pay_number')::int+r.subscription_first_number-1,r.total_cents,(p_data->>'occurred_at')::timestamptz) on conflict do nothing;
    select * into i from private.payment_installments where request_id=r.id and number=(p_data->>'pay_number')::int+r.subscription_first_number-1 for update;
   end if;
  end if;
  if r.id is null or r.provider_mode<>p_data->>'provider_mode' or r.merchant_route<>p_data->>'merchant_route' or r.currency<>p_data->>'currency' or i.amount_cents<>amt then raise exception 'transaction_mismatch'; end if;
  select * into t from private.payment_provider_transactions where merchant_route=r.merchant_route and provider_mode=r.provider_mode and transaction_id=pid;
  if t.request_id is not null and (t.request_id<>r.id or t.installment_id<>i.id or t.amount_cents<>amt) then raise exception 'transaction_mismatch'; end if;
  -- Never downgrade a terminal state because an older webhook arrived late.
  if t.status in ('voided','refunded') or (t.status='settled' and state in ('paid','pending','authorized','failed')) or (t.status='paid' and state in ('pending','authorized','failed')) then return '{}'::jsonb; end if;
  if exists(select 1 from private.payment_provider_transactions where installment_id=i.id and transaction_id<>pid and status in ('paid','settled','authorized','pending')) then raise exception 'duplicate_charge_requires_review'; end if;
  insert into private.payment_provider_transactions(merchant_route,provider_mode,transaction_id,request_id,installment_id,amount_cents,status,last_four,card_brand,occurred_at)
   values(r.merchant_route,r.provider_mode,pid,r.id,i.id,amt,state,p_data->>'last_four',p_data->>'card_brand',(p_data->>'occurred_at')::timestamptz)
   on conflict(merchant_route,provider_mode,transaction_id) do update set status=excluded.status,updated_at=now();
  update private.payment_installments set status=state,
   paid_at=case when state in ('paid','settled') then coalesce(paid_at,(p_data->>'occurred_at')::timestamptz) else paid_at end,
   failed_at=case when state='failed' then (p_data->>'occurred_at')::timestamptz else failed_at end where id=i.id;
  if a.id is not null then update private.payment_attempts set status=case when state='refunded' then 'voided' else state end,provider_transaction_id=pid where id=a.id; end if;
  if state in ('paid','settled') then
   if r.plan='monthly' and p_data->>'subscription_id'=r.subscription_id then
    update private.payment_requests set next_subscription_due_at=greatest(next_subscription_due_at,((subscription_starts_at at time zone 'UTC')+(p_data->>'pay_number')::int*interval '1 month') at time zone 'UTC') where id=r.id;
   end if;
   insert into public.payment_records(contact_id,payment_request_id,installment_id,amount_cents,currency,payment_method,provider,reference_number,received_at,merchant_route,provider_mode,provider_transaction_id,provider_status,sales_rep,referral_source,campaign_source)
   values(r.contact_id,r.id,i.id,amt,r.currency,'integrated_processor','authorize_net',pid,(p_data->>'occurred_at')::timestamptz,r.merchant_route,r.provider_mode,pid,state,r.sales_rep,r.referral_source,r.campaign_source)
   on conflict(merchant_route,provider_mode,provider_transaction_id) where provider_transaction_id is not null do update set provider_status=excluded.provider_status;
   if r.product='webinar' then
    insert into public.webinar_registrations(event_id,contact_id,status,payment_status,payment_reference,referral_source,invited_by)
    values(r.webinar_event_id,r.contact_id,'confirmed','paid',pid,r.referral_source,r.sales_rep)
    on conflict(event_id,contact_id) do update set status=case when public.webinar_registrations.status='attended' then 'attended' else 'confirmed' end,payment_status='paid',payment_reference=excluded.payment_reference,updated_at=now();
   end if;
   insert into private.payment_receipt_outbox(request_id,transaction_id,amount_cents,provider_mode) values(r.id,pid,amt,r.provider_mode) on conflict do nothing;
  elsif state in ('voided','refunded') then
   update private.payment_receipt_outbox set cancelled_at=now() where request_id=r.id and transaction_id=pid and sent_at is null;
   update public.payment_records set status=case when state='voided' then 'voided' else 'reversed' end,provider_status=state,reversed_at=now(),reversal_reason='provider_verified_'||state where payment_request_id=r.id and provider_transaction_id=pid;
   if r.product='webinar' then update public.webinar_registrations set payment_status='refunded',status='cancelled',updated_at=now() where event_id=r.webinar_event_id and contact_id=r.contact_id and payment_reference=pid; end if;
  end if;
  update private.payment_requests set status=case when state in ('paid','settled') and exists(select 1 from private.payment_installments where request_id=r.id and status not in ('paid','settled')) then 'pending' else state end where id=r.id;
  return jsonb_build_object('request_id',r.id,'profile_required',r.plan<>'one_time' and state in ('paid','settled') and r.customer_profile_id is null);
 end if;
 if p_action='receipts_claim' then
  with picked as (select id from private.payment_receipt_outbox where sent_at is null and cancelled_at is null and created_at>now()-interval '23 hours' and (claimed_at is null or claimed_at<now()-interval '5 minutes') and attempts<5 order by created_at limit 1 for update skip locked), claimed as (
   update private.payment_receipt_outbox set claimed_at=now(),attempts=attempts+1 where id in(select id from picked) returning *)
   select coalesce(jsonb_agg(to_jsonb(claimed)||jsonb_build_object('request',to_jsonb(rr))),'[]'::jsonb) into result from claimed join private.payment_requests rr on rr.id=claimed.request_id;
  return result;
 end if;
 if p_action='receipt_done' then
  update private.payment_receipt_outbox set sent_at=case when p_data->>'error_code' is null then now() else null end,error_code=p_data->>'error_code' where id=(p_data->>'id')::uuid; return '{}'::jsonb;
 end if;
 raise exception 'invalid_action';
end; $$;

-- No browser role may read even hashed links, provider profiles, inboxes or receipt recipients.
do $$ declare t text; begin
 foreach t in array array['payment_configuration','payment_requests','payment_installments','payment_attempts','payment_provider_transactions','payment_webhook_inbox','payment_receipt_outbox','payment_start_limits'] loop
  execute format('alter table private.%I enable row level security',t);
  execute format('revoke all on private.%I from public,anon,authenticated',t);
 end loop;
end $$;
revoke all on function private.can_manage_payment_contact(uuid,boolean),private.insert_payment_request(uuid,jsonb,text,uuid,uuid),private.payment_request_summary(uuid) from public,anon,authenticated;
revoke all on function public.staff_create_payment_request(uuid,jsonb,text,uuid),public.staff_list_payment_requests(uuid) from public,anon;
grant execute on function public.staff_create_payment_request(uuid,jsonb,text,uuid),public.staff_list_payment_requests(uuid) to authenticated;
revoke all on function public.payment_service_command(text,jsonb) from public,anon,authenticated;
grant execute on function public.payment_service_command(text,jsonb) to service_role;
