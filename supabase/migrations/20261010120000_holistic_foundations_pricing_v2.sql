-- Holistic Foundations Pricing v2. FORWARD ONLY; do not replay lifecycle v1.
-- Agreement publication and payment processing remain fail-closed.
BEGIN;
SET LOCAL check_function_bodies = true;

CREATE TABLE public.program_product_plans (
  plan_code text PRIMARY KEY,
  program_code text NOT NULL REFERENCES public.program_catalog(program_code),
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 160),
  billing_cadence text NOT NULL CHECK (billing_cadence IN ('monthly','annual')),
  billing_interval_count integer NOT NULL DEFAULT 1 CHECK (billing_interval_count = 1),
  minimum_commitment_months integer NOT NULL CHECK (minimum_commitment_months BETWEEN 1 AND 120),
  coverage_months integer CHECK (coverage_months IS NULL OR coverage_months BETWEEN 1 AND 120),
  minimum_contract_amount_cents integer CHECK (minimum_contract_amount_cents IS NULL OR minimum_contract_amount_cents > 0),
  post_commitment_behavior text NOT NULL CHECK (post_commitment_behavior IN ('continues_month_to_month','ends')),
  eligibility_months integer NOT NULL DEFAULT 0 CHECK (eligibility_months BETWEEN 0 AND 120),
  active boolean NOT NULL DEFAULT false,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_until timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_until IS NULL OR effective_until > effective_from),
  CHECK ((billing_cadence='annual' AND coverage_months IS NOT NULL) OR billing_cadence='monthly')
);

CREATE TABLE public.payment_merchant_routes (
  route_key text PRIMARY KEY,
  market_code text NOT NULL CHECK (market_code IN ('CA','US','GB')),
  country_code text NOT NULL CHECK (country_code IN ('CA','US','GB')),
  currency text NOT NULL CHECK (currency IN ('CAD','USD','GBP')),
  provider_code text NOT NULL,
  configuration_state text NOT NULL CHECK (configuration_state IN ('configuration_pending','credentials_required','sandbox_ready','live_ready','disabled')),
  payment_enabled boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_code,currency),
  CHECK (market_code=country_code),
  CHECK ((market_code='CA' AND currency='CAD' AND route_key='CA_AUTHORIZE_NET') OR
         (market_code='US' AND currency='USD' AND route_key='US_AUTHORIZE_NET') OR
         (market_code='GB' AND currency='GBP' AND route_key='GB_PAYMENT_PROVIDER_PENDING')),
  CHECK (NOT payment_enabled OR configuration_state='live_ready')
);

CREATE TABLE public.program_plan_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code text NOT NULL REFERENCES public.program_product_plans(plan_code),
  market_code text NOT NULL CHECK (market_code IN ('CA','US','GB')),
  country_code text NOT NULL CHECK (country_code IN ('CA','US','GB')),
  currency text NOT NULL CHECK (currency IN ('CAD','USD','GBP')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  merchant_route text NOT NULL REFERENCES public.payment_merchant_routes(route_key),
  checkout_state text NOT NULL CHECK (checkout_state IN ('held','configuration_pending','sandbox_ready','live_ready','disabled')),
  active boolean NOT NULL DEFAULT true,
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_until timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_code,market_code,currency),
  CHECK (market_code=country_code),
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);

CREATE TABLE public.program_plan_eligibility_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  plan_code text NOT NULL REFERENCES public.program_product_plans(plan_code),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 12 AND 1000),
  approved_by uuid NOT NULL REFERENCES auth.users(id),
  approved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  revoked_at timestamptz,
  revoke_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > approved_at),
  CHECK ((revoked_at IS NULL AND revoked_by IS NULL AND revoke_reason IS NULL) OR
         (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND length(trim(revoke_reason)) BETWEEN 12 AND 1000))
);
CREATE UNIQUE INDEX program_plan_eligibility_override_active
  ON public.program_plan_eligibility_overrides(contact_id,plan_code)
  WHERE revoked_at IS NULL;

ALTER TABLE public.program_product_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_merchant_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_plan_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_plan_eligibility_overrides ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.program_product_plans,public.payment_merchant_routes,public.program_plan_prices,public.program_plan_eligibility_overrides
  FROM PUBLIC,anon,authenticated,service_role;

INSERT INTO public.program_product_plans(
  plan_code,program_code,display_name,billing_cadence,minimum_commitment_months,coverage_months,
  minimum_contract_amount_cents,post_commitment_behavior,eligibility_months,active,metadata
) VALUES
 ('holistic_foundations_monthly_flex','holistic-foundations','Holistic Foundations Monthly Flex','monthly',1,NULL,NULL,'continues_month_to_month',0,true,'{"agreement_status":"held","description":"Flexible monthly; no multi-month minimum."}'),
 ('holistic_foundations_3_month','holistic-foundations','Holistic Foundations 3-Month Commitment','monthly',3,NULL,26700,'continues_month_to_month',0,true,'{"agreement_status":"held","description":"Three-month minimum; continues month-to-month afterward."}'),
 ('holistic_foundations_annual_established','holistic-foundations','Established Member Annual','annual',12,12,94800,'ends',6,true,'{"agreement_status":"held","description":"One annual payment after six qualifying months; affirmative selection required."}');

INSERT INTO public.payment_merchant_routes(route_key,market_code,country_code,currency,provider_code,configuration_state,payment_enabled,metadata) VALUES
 ('CA_AUTHORIZE_NET','CA','CA','CAD','authorize_net','disabled',false,'{"payment_release":"held","credential_scope":"CA_only"}'),
 ('US_AUTHORIZE_NET','US','US','USD','authorize_net','credentials_required',false,'{"payment_release":"held","credential_scope":"US_only"}'),
 ('GB_PAYMENT_PROVIDER_PENDING','GB','GB','GBP','pending','configuration_pending',false,'{"payment_release":"held","reason":"approved_GBP_processor_required"}');

INSERT INTO public.program_plan_prices(plan_code,market_code,country_code,currency,amount_cents,merchant_route,checkout_state,metadata)
SELECT p.plan_code,m.market_code,m.market_code,m.currency,p.amount,m.route_key,
       CASE WHEN m.market_code='GB' THEN 'configuration_pending' ELSE 'held' END,
       jsonb_build_object('payment_release','held','no_fx_conversion',true)
FROM (VALUES
 ('holistic_foundations_monthly_flex',10000),
 ('holistic_foundations_3_month',8900),
 ('holistic_foundations_annual_established',94800)
) AS p(plan_code,amount)
CROSS JOIN (VALUES
 ('CA','CAD','CA_AUTHORIZE_NET'),
 ('US','USD','US_AUTHORIZE_NET'),
 ('GB','GBP','GB_PAYMENT_PROVIDER_PENDING')
) AS m(market_code,currency,route_key);

ALTER TABLE public.journey_enrollment_activations
  ADD COLUMN plan_code text REFERENCES public.program_product_plans(plan_code),
  ADD COLUMN plan_price_id uuid REFERENCES public.program_plan_prices(id),
  ADD COLUMN market_code text,
  ADD COLUMN merchant_route text,
  ADD COLUMN billing_cadence text,
  ADD COLUMN coverage_months integer,
  ADD COLUMN minimum_contract_amount_cents integer,
  ADD COLUMN post_commitment_behavior text;
ALTER TABLE public.journey_enrollment_activations
  ADD CONSTRAINT journey_activation_market_check CHECK (market_code IS NULL OR market_code IN ('CA','US','GB')),
  ADD CONSTRAINT journey_activation_cadence_check CHECK (billing_cadence IS NULL OR billing_cadence IN ('monthly','annual'));

ALTER TABLE public.client_memberships
  ADD COLUMN plan_code text REFERENCES public.program_product_plans(plan_code),
  ADD COLUMN plan_price_id uuid REFERENCES public.program_plan_prices(id),
  ADD COLUMN market_code text,
  ADD COLUMN merchant_route text,
  ADD COLUMN billing_cadence text,
  ADD COLUMN coverage_months integer,
  ADD COLUMN minimum_contract_amount_cents integer,
  ADD COLUMN post_commitment_behavior text;

ALTER TABLE public.program_agreement_requirements ADD COLUMN plan_code text REFERENCES public.program_product_plans(plan_code);
CREATE INDEX program_agreement_requirements_plan_lookup
  ON public.program_agreement_requirements(plan_code,currency,agreement_template_id)
  WHERE active AND required;

CREATE FUNCTION private.normalized_contact_market(p_country text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE regexp_replace(upper(trim(coalesce(p_country,''))),'[^A-Z]','','g')
  WHEN 'CA' THEN 'CA' WHEN 'CANADA' THEN 'CA'
  WHEN 'US' THEN 'US' WHEN 'USA' THEN 'US' WHEN 'UNITEDSTATES' THEN 'US' WHEN 'UNITEDSTATESOFAMERICA' THEN 'US'
  WHEN 'GB' THEN 'GB' WHEN 'UK' THEN 'GB' WHEN 'UNITEDKINGDOM' THEN 'GB' WHEN 'GREATBRITAIN' THEN 'GB'
 END
$$;
REVOKE ALL ON FUNCTION private.normalized_contact_market(text) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.holistic_foundations_qualifying_months(p_contact_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(max(greatest(0,
   extract(year from age(least(coalesce(m.commitment_ends_at,now()),now()),m.starts_at))::integer*12 +
   extract(month from age(least(coalesce(m.commitment_ends_at,now()),now()),m.starts_at))::integer
 )),0)
 FROM public.client_memberships m
 WHERE m.primary_contact_id=p_contact_id AND m.program_code='holistic-foundations'
   AND m.status IN ('active','completed') AND m.starts_at IS NOT NULL
   AND coalesce(m.metadata->>'environment','') NOT IN ('beta','staging','test','synthetic')
   AND lower(coalesce(m.metadata->>'synthetic','false'))<>'true'
$$;
REVOKE ALL ON FUNCTION private.holistic_foundations_qualifying_months(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.plan_eligibility(p_contact_id uuid,p_plan_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.program_product_plans%rowtype; months integer; overridden boolean;
BEGIN
 SELECT * INTO p FROM public.program_product_plans WHERE plan_code=p_plan_code AND active AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now());
 IF p.plan_code IS NULL THEN RAISE EXCEPTION 'Active product plan not found' USING ERRCODE='22023'; END IF;
 months:=private.holistic_foundations_qualifying_months(p_contact_id);
 overridden:=EXISTS(SELECT 1 FROM public.program_plan_eligibility_overrides o WHERE o.contact_id=p_contact_id AND o.plan_code=p_plan_code AND o.revoked_at IS NULL AND (o.expires_at IS NULL OR o.expires_at>now()));
 RETURN jsonb_build_object('eligible',p.eligibility_months=0 OR months>=p.eligibility_months OR overridden,
   'qualifying_months',months,'required_months',p.eligibility_months,'override_active',overridden,
   'reason',CASE WHEN p.eligibility_months=0 OR months>=p.eligibility_months THEN 'eligible'
                 WHEN overridden THEN 'owner_admin_override'
                 ELSE format('%s more qualifying month(s) required',p.eligibility_months-months) END);
END $$;
REVOKE ALL ON FUNCTION private.plan_eligibility(uuid,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.production_client_plan_options(p_contact_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE market text; result jsonb;
BEGIN
 PERFORM private.require_production_enrollment_owner(p_contact_id);
 SELECT private.normalized_contact_market(country) INTO market FROM public.contacts WHERE id=p_contact_id;
 IF market IS NULL THEN RAISE EXCEPTION 'Set the client country to Canada, United States, or United Kingdom before choosing a plan' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'plan_code',p.plan_code,'display_name',p.display_name,'description',p.metadata->>'description',
   'billing_cadence',p.billing_cadence,'minimum_commitment_months',p.minimum_commitment_months,
   'coverage_months',p.coverage_months,'minimum_contract_amount_cents',p.minimum_contract_amount_cents,
   'post_commitment_behavior',p.post_commitment_behavior,'amount_cents',price.amount_cents,
   'market_code',price.market_code,'currency',price.currency,'merchant_route',price.merchant_route,
   'checkout_state',price.checkout_state,'payment_enabled',route.payment_enabled,
   'eligibility',private.plan_eligibility(p_contact_id,p.plan_code)
 ) ORDER BY CASE p.plan_code WHEN 'holistic_foundations_monthly_flex' THEN 1 WHEN 'holistic_foundations_3_month' THEN 2 ELSE 3 END),'[]'::jsonb)
 INTO result
 FROM public.program_product_plans p JOIN public.program_plan_prices price ON price.plan_code=p.plan_code
 JOIN public.payment_merchant_routes route ON route.route_key=price.merchant_route
 WHERE p.program_code='holistic-foundations' AND p.active AND price.active AND price.market_code=market
   AND p.effective_from<=now() AND (p.effective_until IS NULL OR p.effective_until>now())
   AND price.effective_from<=now() AND (price.effective_until IS NULL OR price.effective_until>now());
 RETURN jsonb_build_object('market_code',market,'plans',result,'agreement_publication_status',
  (SELECT config_value->>'status' FROM public.app_runtime_config WHERE config_key='production_client_agreement_publication' AND active));
END $$;

CREATE FUNCTION public.production_client_plan_options(p_contact_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT private.production_client_plan_options(p_contact_id) $$;
REVOKE ALL ON FUNCTION private.production_client_plan_options(uuid),public.production_client_plan_options(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION private.production_client_plan_options(uuid),public.production_client_plan_options(uuid) TO authenticated;

CREATE FUNCTION private.set_program_plan_eligibility_override(p_contact_id uuid,p_plan_code text,p_enabled boolean,p_reason text,p_expires_at timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE existing public.program_plan_eligibility_overrides%rowtype;
BEGIN
 PERFORM private.require_production_enrollment_owner(p_contact_id);
 IF p_plan_code<>'holistic_foundations_annual_established' OR length(trim(coalesce(p_reason,'')))<12 THEN
   RAISE EXCEPTION 'Annual eligibility override and a meaningful reason are required' USING ERRCODE='22023';
 END IF;
 SELECT * INTO existing FROM public.program_plan_eligibility_overrides WHERE contact_id=p_contact_id AND plan_code=p_plan_code AND revoked_at IS NULL FOR UPDATE;
 IF p_enabled THEN
   IF existing.id IS NULL THEN
    INSERT INTO public.program_plan_eligibility_overrides(contact_id,plan_code,reason,approved_by,expires_at)
    VALUES(p_contact_id,p_plan_code,trim(p_reason),auth.uid(),p_expires_at);
   ELSE
    UPDATE public.program_plan_eligibility_overrides SET reason=trim(p_reason),approved_by=auth.uid(),approved_at=now(),expires_at=p_expires_at WHERE id=existing.id;
   END IF;
 ELSE
   IF existing.id IS NULL THEN RAISE EXCEPTION 'No active eligibility override exists' USING ERRCODE='22023'; END IF;
   UPDATE public.program_plan_eligibility_overrides SET revoked_by=auth.uid(),revoked_at=now(),revoke_reason=trim(p_reason) WHERE id=existing.id;
 END IF;
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata)
 VALUES(p_contact_id,'program_plan_eligibility_override',CASE WHEN p_enabled THEN 'Annual plan eligibility override approved' ELSE 'Annual plan eligibility override revoked' END,
 auth.uid(),jsonb_build_object('plan_code',p_plan_code,'enabled',p_enabled,'reason',trim(p_reason),'expires_at',p_expires_at));
 RETURN private.plan_eligibility(p_contact_id,p_plan_code);
END $$;
CREATE FUNCTION public.set_program_plan_eligibility_override(p_contact_id uuid,p_plan_code text,p_enabled boolean,p_reason text,p_expires_at timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.set_program_plan_eligibility_override(p_contact_id,p_plan_code,p_enabled,p_reason,p_expires_at) $$;
REVOKE ALL ON FUNCTION private.set_program_plan_eligibility_override(uuid,text,boolean,text,timestamptz),public.set_program_plan_eligibility_override(uuid,text,boolean,text,timestamptz) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION private.set_program_plan_eligibility_override(uuid,text,boolean,text,timestamptz),public.set_program_plan_eligibility_override(uuid,text,boolean,text,timestamptz) TO authenticated;

CREATE FUNCTION private.save_production_client_plan_intent(p_contact_id uuid,p_plan_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.journey_enrollment_activations%rowtype; p public.program_product_plans%rowtype; price public.program_plan_prices%rowtype;
  route public.payment_merchant_routes%rowtype; program public.program_catalog%rowtype; market text; eligible jsonb; j uuid; s uuid; choice text;
BEGIN
 PERFORM private.require_production_enrollment_owner(p_contact_id);
 PERFORM 1 FROM public.contacts WHERE id=p_contact_id FOR UPDATE;
 SELECT private.normalized_contact_market(country) INTO market FROM public.contacts WHERE id=p_contact_id;
 IF market IS NULL THEN RAISE EXCEPTION 'Set the client country before choosing a plan' USING ERRCODE='22023'; END IF;
 SELECT * INTO p FROM public.program_product_plans WHERE plan_code=p_plan_code AND program_code='holistic-foundations' AND active AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now());
 IF p.plan_code IS NULL THEN RAISE EXCEPTION 'Active Holistic Foundations plan required' USING ERRCODE='22023'; END IF;
 SELECT * INTO price FROM public.program_plan_prices WHERE plan_code=p.plan_code AND market_code=market AND active AND effective_from<=now() AND (effective_until IS NULL OR effective_until>now());
 IF price.id IS NULL THEN RAISE EXCEPTION 'No approved market price exists for this plan' USING ERRCODE='22023'; END IF;
 SELECT * INTO route FROM public.payment_merchant_routes WHERE route_key=price.merchant_route;
 IF route.route_key IS NULL OR route.market_code<>market OR route.currency<>price.currency THEN RAISE EXCEPTION 'Approved market/currency route required' USING ERRCODE='22023'; END IF;
 eligible:=private.plan_eligibility(p_contact_id,p.plan_code);
 IF NOT (eligible->>'eligible')::boolean THEN RAISE EXCEPTION 'Established Member Annual requires six qualifying months or an audited Owner/Admin override' USING ERRCODE='22023'; END IF;
 SELECT * INTO program FROM public.program_catalog WHERE program_code=p.program_code AND active;
 choice:=CASE WHEN p.billing_cadence='monthly' THEN 'monthly' ELSE 'one_time' END;
 SELECT * INTO a FROM public.journey_enrollment_activations WHERE contact_id=p_contact_id ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 IF a.id IS NOT NULL THEN
   IF a.plan_code IS NOT DISTINCT FROM p.plan_code AND a.plan_price_id IS NOT DISTINCT FROM price.id THEN RETURN private.production_client_enrollment_state(p_contact_id); END IF;
   IF EXISTS(SELECT 1 FROM public.client_agreements WHERE activation_id=a.id) OR EXISTS(SELECT 1 FROM public.payment_records WHERE activation_id=a.id)
      OR EXISTS(SELECT 1 FROM public.client_memberships m WHERE m.activation_id=a.id AND m.status NOT IN ('pending','cancelled'))
      OR EXISTS(SELECT 1 FROM public.client_access ca JOIN public.client_memberships m ON m.id=ca.membership_id WHERE m.activation_id=a.id AND ca.status='active')
   THEN RAISE EXCEPTION 'Issued or active enrollment terms are locked' USING ERRCODE='22023'; END IF;
   UPDATE public.journey_enrollment_activations SET program_code=program.program_code,program_name=program.name,
    plan_code=p.plan_code,plan_price_id=price.id,market_code=market,merchant_route=route.route_key,
    billing_choice=choice,billing_cadence=p.billing_cadence,amount_cents=price.amount_cents,currency=price.currency,
    commitment_months=p.minimum_commitment_months,coverage_months=p.coverage_months,
    minimum_contract_amount_cents=p.minimum_contract_amount_cents,post_commitment_behavior=p.post_commitment_behavior,updated_at=now()
   WHERE id=a.id;
 ELSE
   SELECT cj.id INTO j FROM public.contact_journeys cj WHERE cj.contact_id=p_contact_id AND cj.status IN ('active','paused','nurture')
    AND EXISTS(SELECT 1 FROM public.contact_journey_steps WHERE journey_id=cj.id AND step_key='payment_agreement') ORDER BY cj.created_at DESC LIMIT 1;
   IF j IS NULL THEN j:=public.ensure_contact_journey(p_contact_id,'direct_membership',jsonb_build_object('source','production_owner_enrollment')); END IF;
   SELECT id INTO s FROM public.contact_journey_steps WHERE journey_id=j AND step_key='payment_agreement';
   IF s IS NULL THEN RAISE EXCEPTION 'Existing enrollment journey has no payment/agreement step' USING ERRCODE='22023'; END IF;
   INSERT INTO public.journey_enrollment_activations(contact_id,journey_id,journey_step_id,program_code,program_name,
    plan_code,plan_price_id,market_code,merchant_route,billing_choice,billing_cadence,amount_cents,currency,commitment_months,
    coverage_months,minimum_contract_amount_cents,post_commitment_behavior,created_by)
   VALUES(p_contact_id,j,s,program.program_code,program.name,p.plan_code,price.id,market,route.route_key,choice,p.billing_cadence,
    price.amount_cents,price.currency,p.minimum_commitment_months,p.coverage_months,p.minimum_contract_amount_cents,p.post_commitment_behavior,auth.uid());
 END IF;
 UPDATE public.client_memberships m SET plan_code=p.plan_code,plan_price_id=price.id,market_code=market,merchant_route=route.route_key,
  billing_choice=choice,billing_cadence=p.billing_cadence,amount_cents=price.amount_cents,currency=price.currency,
  commitment_months=p.minimum_commitment_months,coverage_months=p.coverage_months,minimum_contract_amount_cents=p.minimum_contract_amount_cents,
  post_commitment_behavior=p.post_commitment_behavior,updated_at=now()
 FROM public.journey_enrollment_activations activation WHERE m.activation_id=activation.id AND activation.contact_id=p_contact_id AND m.status='pending';
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata)
 VALUES(p_contact_id,'production_plan_intent_configured','Production plan intent configured; agreement and payment remain held',auth.uid(),
 jsonb_build_object('plan_code',p.plan_code,'price_id',price.id,'market_code',market,'currency',price.currency,'merchant_route',route.route_key));
 RETURN private.production_client_enrollment_state(p_contact_id);
END $$;

CREATE FUNCTION public.save_production_client_plan_intent(p_contact_id uuid,p_plan_code text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.save_production_client_plan_intent(p_contact_id,p_plan_code) $$;
REVOKE ALL ON FUNCTION private.save_production_client_plan_intent(uuid,text),public.save_production_client_plan_intent(uuid,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION private.save_production_client_plan_intent(uuid,text),public.save_production_client_plan_intent(uuid,text) TO authenticated;

-- Remove the obsolete browser-price contract. Existing historical rows remain readable.
REVOKE EXECUTE ON FUNCTION public.save_production_client_enrollment(uuid,text,text,integer,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION private.save_production_client_enrollment(uuid,text,text,integer,text) FROM authenticated;

CREATE OR REPLACE FUNCTION private.production_client_enrollment_state(p_contact_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.journey_enrollment_activations%rowtype; c public.contacts%rowtype; delivery jsonb; eligibility jsonb;
BEGIN
 PERFORM private.require_production_enrollment_owner(p_contact_id);
 SELECT * INTO c FROM public.contacts WHERE id=p_contact_id;
 SELECT * INTO a FROM public.journey_enrollment_activations WHERE contact_id=p_contact_id ORDER BY created_at DESC LIMIT 1;
 IF a.plan_code IS NOT NULL THEN eligibility:=private.plan_eligibility(p_contact_id,a.plan_code); END IF;
 SELECT jsonb_build_object('status',d.status,'provider_accepted',d.provider_message_id IS NOT NULL,'updated_at',d.updated_at)
 INTO delivery FROM public.notification_delivery_jobs d JOIN public.client_agreements g ON g.id=d.client_agreement_id
 WHERE g.activation_id=a.id ORDER BY d.created_at DESC LIMIT 1;
 RETURN jsonb_build_object('email',c.email,'recipient_approved',true,'enrollment_created',a.id IS NOT NULL,
  'program_code',a.program_code,'program_name',a.program_name,'plan_code',a.plan_code,'plan_price_id',a.plan_price_id,
  'market_code',a.market_code,'merchant_route',a.merchant_route,'billing_choice',a.billing_choice,'billing_cadence',a.billing_cadence,
  'amount_cents',a.amount_cents,'currency',a.currency,'commitment_months',a.commitment_months,'coverage_months',a.coverage_months,
  'minimum_contract_amount_cents',a.minimum_contract_amount_cents,'post_commitment_behavior',a.post_commitment_behavior,'eligibility',eligibility,
  'agreement_status',a.agreement_status,'payment_status',a.payment_status,'activation_status',a.access_status,
  'agreement_publication_status',(SELECT config_value->>'status' FROM public.app_runtime_config WHERE config_key='production_client_agreement_publication' AND active),
  'agreement_publication_reason',(SELECT config_value->>'reason' FROM public.app_runtime_config WHERE config_key='production_client_agreement_publication' AND active),
  'agreement_mapping_ready',private.production_client_agreement_publication_released() AND a.plan_code IS NOT NULL AND EXISTS(
    SELECT 1 FROM public.program_agreement_requirements r JOIN public.agreement_templates t ON t.id=r.agreement_template_id
    WHERE r.program_code=a.program_code AND r.plan_code=a.plan_code AND (r.currency IS NULL OR r.currency=a.currency)
      AND r.active AND r.required AND t.status='published' AND t.audience='client' AND t.document_type='client_contract'),
  'agreement_count',(SELECT count(*) FROM public.client_agreements WHERE activation_id=a.id),'invitation',delivery,
  'ready_for_access',CASE WHEN a.id IS NOT NULL THEN private.enrollment_gates_complete(a) ELSE false END,
  'member_access',(SELECT status FROM public.client_access WHERE contact_id=p_contact_id),
  'account_claimed',(SELECT user_id IS NOT NULL AND NOT needs_onboarding_claim FROM public.client_access WHERE contact_id=p_contact_id),
  'membership_status',(SELECT m.status FROM public.client_access ca JOIN public.client_memberships m ON m.id=ca.membership_id WHERE ca.contact_id=p_contact_id));
END $$;

CREATE OR REPLACE FUNCTION private.guard_production_agreement_requirement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_template public.agreement_templates%rowtype; v_plan public.program_product_plans%rowtype;
BEGIN
 IF NEW.program_code<>'holistic-foundations' OR NOT NEW.active OR NOT NEW.required THEN RETURN NEW; END IF;
 IF NEW.plan_code IS NULL THEN RAISE EXCEPTION 'Holistic Foundations agreement requirements must identify an exact plan' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_plan FROM public.program_product_plans WHERE plan_code=NEW.plan_code AND program_code=NEW.program_code;
 IF v_plan.plan_code IS NULL OR NEW.currency NOT IN ('CAD','USD','GBP') THEN RAISE EXCEPTION 'Exact plan and market currency required' USING ERRCODE='22023'; END IF;
 IF NOT private.production_client_agreement_publication_released() THEN RAISE EXCEPTION 'Holistic Foundations agreement publication is held pending legal approval' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_template FROM public.agreement_templates WHERE id=NEW.agreement_template_id;
 IF v_template.id IS NULL OR v_template.status<>'published' OR v_template.audience<>'client' OR v_template.document_type<>'client_contract' THEN
   RAISE EXCEPTION 'A published client contract is required for this plan' USING ERRCODE='22023'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER guard_production_agreement_requirement ON public.program_agreement_requirements;
CREATE TRIGGER guard_production_agreement_requirement
BEFORE INSERT OR UPDATE OF program_code,agreement_template_id,required,active,billing_choice,currency,plan_code
ON public.program_agreement_requirements FOR EACH ROW EXECUTE FUNCTION private.guard_production_agreement_requirement();

CREATE FUNCTION private.guard_client_agreement_plan_mapping()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.journey_enrollment_activations%rowtype;
BEGIN
 IF NEW.activation_id IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO a FROM public.journey_enrollment_activations WHERE id=NEW.activation_id;
 IF a.program_code='holistic-foundations' AND NOT EXISTS(
   SELECT 1 FROM public.program_agreement_requirements r
   WHERE r.program_code=a.program_code AND r.plan_code=a.plan_code
     AND r.agreement_template_id=NEW.agreement_template_id AND r.active AND r.required
     AND (r.currency IS NULL OR r.currency=a.currency)
 ) THEN RAISE EXCEPTION 'Approved plan-specific production agreement mapping required' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_client_agreement_plan_mapping() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER guard_client_agreement_plan_mapping
BEFORE INSERT OR UPDATE OF activation_id,agreement_template_id ON public.client_agreements
FOR EACH ROW EXECUTE FUNCTION private.guard_client_agreement_plan_mapping();

-- Agreement matching is plan-specific. No template, mapping, or publication row is created here.
CREATE OR REPLACE FUNCTION private.issue_required_agreements_for_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='pg_catalog','public','private' AS $$
DECLARE r record;
BEGIN
 IF NEW.status NOT IN ('pending','active') THEN RETURN NEW; END IF;
 FOR r IN SELECT t.id,t.agreement_key,t.version,t.content_hash FROM public.program_agreement_requirements requirement
  JOIN public.agreement_templates t ON t.id=requirement.agreement_template_id
  LEFT JOIN public.journey_enrollment_activations a ON a.id=NEW.activation_id
  WHERE requirement.program_code=NEW.program_code AND requirement.plan_code=a.plan_code
    AND (requirement.currency IS NULL OR requirement.currency=a.currency) AND requirement.active AND requirement.required AND t.status='published'
  ORDER BY requirement.sort_order
 LOOP
  INSERT INTO public.client_agreements(contact_id,membership_id,activation_id,agreement_template_id,agreement_key,template_version,content_hash,status,created_by)
  VALUES(NEW.primary_contact_id,NEW.id,NEW.activation_id,r.id,r.agreement_key,r.version,r.content_hash,'not_sent',NEW.created_by)
  ON CONFLICT(contact_id,agreement_template_id) DO UPDATE SET membership_id=excluded.membership_id,activation_id=coalesce(excluded.activation_id,public.client_agreements.activation_id),updated_at=now();
 END LOOP;
 RETURN NEW;
END $$;

-- Assert the release boundary inside the migration itself.
DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.app_runtime_config WHERE config_key='production_client_agreement_publication' AND active AND config_value->>'status'='held') THEN
  RAISE EXCEPTION 'Pricing v2 requires the production agreement publication gate to remain held';
 END IF;
 IF EXISTS(SELECT 1 FROM public.program_agreement_requirements WHERE program_code='holistic-foundations' AND active) THEN
  RAISE EXCEPTION 'Pricing v2 requires zero active Holistic Foundations agreement mappings';
 END IF;
 IF EXISTS(SELECT 1 FROM public.payment_merchant_routes WHERE payment_enabled) THEN
  RAISE EXCEPTION 'Pricing v2 must not enable payment processing';
 END IF;
END $$;

COMMIT;
