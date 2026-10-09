-- Production Client Lifecycle v1 candidate. NOT APPLIED.
-- Reuses the accepted secure beta lifecycle contracts; no beta records/seeds are copied.
-- The production payment contract remains unreleased: no paid access or payment links.
-- Program/template mapping is deliberately excluded pending the required Chat decision.
BEGIN;
SET LOCAL check_function_bodies=true;
-- Deferred validation executes at the authenticated transaction's COMMIT, after
-- the enrollment definer has returned. Keep private validation inaccessible to
-- browsers; let only the existing constraint trigger validate its row.
ALTER FUNCTION private.validate_active_household_after_member_change() SECURITY DEFINER;
ALTER FUNCTION private.validate_active_household_after_member_change() SET search_path='pg_catalog';
REVOKE ALL ON FUNCTION private.validate_active_household_after_member_change() FROM PUBLIC,anon,authenticated,service_role;
-- Retain legacy action-specific role limits, while honoring the newer permission overrides.
CREATE OR REPLACE FUNCTION private.staff_action_allowed(p_user_id uuid,p_permission_key text,p_contact_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT p_user_id IS NOT NULL AND
 CASE WHEN p_permission_key IN ('journey.step.status','journey.step.complete_assisted','journey.step.waive','plan.override','finance.record_payment','finance.reverse_payment','agreement.override','membership.access_override')
 THEN private.staff_has_permission(p_user_id,CASE WHEN p_permission_key LIKE 'journey.%' THEN 'crm.manage' ELSE 'finance.manage' END)
 AND EXISTS(SELECT 1 FROM public.staff_access s JOIN public.staff_role_permissions r ON r.role=s.role WHERE s.user_id=p_user_id AND s.status='active' AND r.permission_key=p_permission_key AND r.allowed)
 ELSE private.staff_has_permission(p_user_id,p_permission_key) END
 AND (p_contact_id IS NULL OR private.staff_can_access_contact(p_user_id,p_contact_id));
$$;
REVOKE ALL ON FUNCTION private.staff_action_allowed(uuid,text,uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.staff_action_allowed(uuid,text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.staff_action_allowed(p_permission_key text,p_contact_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public,private AS $$
 SELECT private.staff_action_allowed(auth.uid(),p_permission_key,p_contact_id);
$$;
REVOKE ALL ON FUNCTION public.staff_action_allowed(text,uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.staff_action_allowed(text,uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.sign_my_client_agreement(p_client_agreement_id uuid,p_signer_name text,p_signature_type text DEFAULT 'typed',p_user_agent text DEFAULT NULL,p_expected_content_hash text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ BEGIN
 IF p_signature_type<>'typed' THEN RAISE EXCEPTION 'Typed signature required'; END IF;
 RETURN private.sign_client_agreement(p_client_agreement_id,jsonb_build_array(jsonb_build_object('signer_role','primary_client','signer_name',p_signer_name)),p_expected_content_hash,p_user_agent);
END; $$;


ALTER TABLE public.client_access DROP CONSTRAINT client_access_status_check;
ALTER TABLE public.client_access ADD CONSTRAINT client_access_status_check CHECK(status IN ('ready','invited','onboarding','active','payment_suspended','suspended','inactive'));
ALTER TABLE public.client_access ADD COLUMN restriction_reason text, ADD COLUMN needs_onboarding_claim boolean NOT NULL DEFAULT false;
ALTER TABLE public.journey_enrollment_activations ADD COLUMN payment_waived_by uuid REFERENCES auth.users(id), ADD COLUMN payment_waived_at timestamptz, ADD COLUMN payment_waiver_reason text;

-- No production URL is assumed when sending from an isolated environment.
INSERT INTO public.app_runtime_config(config_key,config_value,description,member_visible,active)
VALUES('client_onboarding','{"origin":null}'::jsonb,'Approved origin for client onboarding invitation links',false,false)
ON CONFLICT(config_key) DO NOTHING;

-- Agreement publication is a separate, explicit legal release gate. The lifecycle
-- can store a billing intent while this hold is active, but it cannot map, prepare,
-- issue, or send a Holistic Foundations agreement.
ALTER TABLE public.program_agreement_requirements
  ADD COLUMN billing_choice text,
  ADD COLUMN currency text;
ALTER TABLE public.program_agreement_requirements
  ADD CONSTRAINT program_agreement_requirements_billing_choice_check
    CHECK (billing_choice IS NULL OR billing_choice IN ('weekly','monthly','one_time','custom')),
  ADD CONSTRAINT program_agreement_requirements_currency_check
    CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$');
CREATE INDEX program_agreement_requirements_billing_lookup
  ON public.program_agreement_requirements(program_code,billing_choice,currency,agreement_template_id)
  WHERE active AND required;

INSERT INTO public.app_runtime_config(config_key,config_value,description,member_visible,active)
VALUES(
  'production_client_agreement_publication',
  '{"status":"held","reason":"quebec_regulatory_classification_pending"}'::jsonb,
  'Fail-closed legal publication gate for production client agreements',
  false,
  true
)
ON CONFLICT(config_key) DO UPDATE
SET config_value=excluded.config_value,
    description=excluded.description,
    member_visible=false,
    active=true;

CREATE FUNCTION private.production_client_agreement_publication_released()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(
   SELECT 1
   FROM public.app_runtime_config c
   WHERE c.config_key='production_client_agreement_publication'
     AND c.active
     AND c.config_value->>'status'='released'
 );
$$;
REVOKE ALL ON FUNCTION private.production_client_agreement_publication_released() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.guard_production_agreement_requirement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_template public.agreement_templates%rowtype;
BEGIN
 IF NEW.program_code<>'holistic-foundations' OR NOT NEW.active OR NOT NEW.required THEN
   RETURN NEW;
 END IF;
 IF NEW.billing_choice NOT IN ('monthly','one_time') OR NEW.currency IS DISTINCT FROM 'CAD' THEN
   RAISE EXCEPTION 'Holistic Foundations agreement requirements must identify monthly or pay-in-full CAD billing' USING ERRCODE='22023';
 END IF;
 IF NOT private.production_client_agreement_publication_released() THEN
   RAISE EXCEPTION 'Holistic Foundations agreement publication is held pending legal approval' USING ERRCODE='42501';
 END IF;
 SELECT * INTO v_template
 FROM public.agreement_templates
 WHERE id=NEW.agreement_template_id;
 IF v_template.id IS NULL OR v_template.status<>'published' OR v_template.audience<>'client' OR v_template.document_type<>'client_contract' THEN
   RAISE EXCEPTION 'A published client contract is required for this billing path' USING ERRCODE='22023';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_production_agreement_requirement() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER guard_production_agreement_requirement
BEFORE INSERT OR UPDATE OF program_code,agreement_template_id,required,active,billing_choice,currency
ON public.program_agreement_requirements
FOR EACH ROW EXECUTE FUNCTION private.guard_production_agreement_requirement();

CREATE FUNCTION private.guard_production_client_contract_publication()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.status='published'
    AND NEW.audience='client'
    AND NEW.document_type='client_contract'
    AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status)
    AND NOT private.production_client_agreement_publication_released() THEN
   RAISE EXCEPTION 'Production client contract publication is held pending legal approval' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_production_client_contract_publication() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER guard_production_client_contract_publication
BEFORE INSERT OR UPDATE OF status ON public.agreement_templates
FOR EACH ROW EXECUTE FUNCTION private.guard_production_client_contract_publication();

-- Preserve the existing automatic issuance/backfill behavior while binding each
-- billing-specific requirement to the matching enrollment only.
CREATE OR REPLACE FUNCTION private.issue_required_agreements_for_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='pg_catalog','public','private' AS $$
DECLARE r record;
BEGIN
 IF NEW.status NOT IN ('pending','active') THEN RETURN NEW; END IF;
 FOR r IN
   SELECT at.id,at.agreement_key,at.version,at.content_hash
   FROM public.program_agreement_requirements par
   JOIN public.agreement_templates at ON at.id=par.agreement_template_id
   LEFT JOIN public.journey_enrollment_activations a ON a.id=NEW.activation_id
   WHERE par.program_code=NEW.program_code
     AND (par.billing_choice IS NULL OR par.billing_choice=a.billing_choice)
     AND (par.currency IS NULL OR par.currency=a.currency)
     AND par.active AND par.required AND at.status='published'
   ORDER BY par.sort_order
 LOOP
   INSERT INTO public.client_agreements(
     contact_id,membership_id,activation_id,agreement_template_id,
     agreement_key,template_version,content_hash,status,created_by
   ) VALUES(
     NEW.primary_contact_id,NEW.id,NEW.activation_id,r.id,
     r.agreement_key,r.version,r.content_hash,'not_sent',NEW.created_by
   )
   ON CONFLICT(contact_id,agreement_template_id) DO UPDATE
   SET membership_id=excluded.membership_id,
       activation_id=coalesce(excluded.activation_id,public.client_agreements.activation_id),
       updated_at=now();
 END LOOP;
 RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.backfill_program_agreement_requirement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='pg_catalog','public','private' AS $$
DECLARE m record; t public.agreement_templates%rowtype;
BEGIN
 IF NOT NEW.active OR NOT NEW.required THEN RETURN NEW; END IF;
 SELECT * INTO t FROM public.agreement_templates
 WHERE id=NEW.agreement_template_id AND status='published';
 IF t.id IS NULL THEN RETURN NEW; END IF;
 FOR m IN
   SELECT cm.*
   FROM public.client_memberships cm
   LEFT JOIN public.journey_enrollment_activations a ON a.id=cm.activation_id
   WHERE cm.program_code=NEW.program_code
     AND cm.status IN ('pending','active')
     AND (NEW.billing_choice IS NULL OR NEW.billing_choice=a.billing_choice)
     AND (NEW.currency IS NULL OR NEW.currency=a.currency)
 LOOP
   INSERT INTO public.client_agreements(
     contact_id,membership_id,activation_id,agreement_template_id,
     agreement_key,template_version,content_hash,status,created_by
   ) VALUES(
     m.primary_contact_id,m.id,m.activation_id,t.id,
     t.agreement_key,t.version,t.content_hash,'not_sent',m.created_by
   )
   ON CONFLICT(contact_id,agreement_template_id) DO UPDATE
   SET membership_id=excluded.membership_id,
       activation_id=coalesce(excluded.activation_id,public.client_agreements.activation_id),
       updated_at=now();
 END LOOP;
 RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.backfill_agreement_requirement_record(p_requirement_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='pg_catalog','public','private' AS $$
DECLARE r public.program_agreement_requirements%rowtype; t public.agreement_templates%rowtype; m record;
BEGIN
 SELECT * INTO r FROM public.program_agreement_requirements WHERE id=p_requirement_id;
 IF r.id IS NULL OR NOT r.active OR NOT r.required THEN RETURN; END IF;
 SELECT * INTO t FROM public.agreement_templates
 WHERE id=r.agreement_template_id AND status='published';
 IF t.id IS NULL THEN RETURN; END IF;
 FOR m IN
   SELECT cm.*
   FROM public.client_memberships cm
   LEFT JOIN public.journey_enrollment_activations a ON a.id=cm.activation_id
   WHERE cm.program_code=r.program_code
     AND cm.status IN ('pending','active')
     AND (r.billing_choice IS NULL OR r.billing_choice=a.billing_choice)
     AND (r.currency IS NULL OR r.currency=a.currency)
 LOOP
   INSERT INTO public.client_agreements(
     contact_id,membership_id,activation_id,agreement_template_id,
     agreement_key,template_version,content_hash,status,created_by
   ) VALUES(
     m.primary_contact_id,m.id,m.activation_id,t.id,
     t.agreement_key,t.version,t.content_hash,'not_sent',m.created_by
   )
   ON CONFLICT(contact_id,agreement_template_id) DO UPDATE
   SET membership_id=excluded.membership_id,
       activation_id=coalesce(excluded.activation_id,public.client_agreements.activation_id),
       updated_at=now();
 END LOOP;
END;
$$;

-- This is an agreement capability, not another membership or household relationship.
CREATE TABLE private.agreement_signer_invitations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 agreement_id uuid NOT NULL REFERENCES public.client_agreements(id),
 activation_id uuid NOT NULL REFERENCES public.journey_enrollment_activations(id),
 household_id uuid REFERENCES public.households(id),
 recipient_email text NOT NULL CHECK(recipient_email=lower(trim(recipient_email))),
 token_hash text NOT NULL UNIQUE CHECK(length(token_hash)=64),
 content_hash text NOT NULL,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '72 hours',
 redeemed_by uuid REFERENCES auth.users(id), redeemed_at timestamptz,
 revoked_at timestamptz,
 CHECK((redeemed_by IS NULL)=(redeemed_at IS NULL))
);
ALTER TABLE private.agreement_signer_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.agreement_signer_invitations FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX agreement_signer_invitation_agreement ON private.agreement_signer_invitations(agreement_id);
CREATE INDEX agreement_signer_invitation_recipient ON private.agreement_signer_invitations(redeemed_by) WHERE redeemed_by IS NOT NULL;
CREATE INDEX agreement_signer_invitation_activation ON private.agreement_signer_invitations(activation_id);
CREATE INDEX agreement_signer_invitation_household ON private.agreement_signer_invitations(household_id);
CREATE INDEX agreement_signer_invitation_creator ON private.agreement_signer_invitations(created_by);

-- Reuse the delivery outbox for invitations whose recipient has not registered yet.
ALTER TABLE public.notification_delivery_jobs ALTER COLUMN notification_id DROP NOT NULL, ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.notification_delivery_jobs ADD COLUMN signer_invitation_id uuid REFERENCES private.agreement_signer_invitations(id);
ALTER TABLE public.notification_delivery_jobs ADD CONSTRAINT notification_delivery_recipient_kind CHECK((notification_id IS NOT NULL AND user_id IS NOT NULL) OR signer_invitation_id IS NOT NULL);
CREATE INDEX notification_delivery_signer_invitation ON public.notification_delivery_jobs(signer_invitation_id) WHERE signer_invitation_id IS NOT NULL;

CREATE FUNCTION private.enrollment_payment_satisfied(a public.journey_enrollment_activations)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT false; $$;
COMMENT ON FUNCTION private.enrollment_payment_satisfied(public.journey_enrollment_activations)
IS 'Production hold: Payments v1 has not passed separate acceptance. A later approved forward migration must integrate authoritative verified payment states.';
CREATE FUNCTION private.agreement_signatures_satisfied(a public.client_agreements)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT a.status='waived' OR (a.status='signed' AND
 (SELECT count(DISTINCT aa.signed_by_user_id) FROM public.agreement_acceptances aa WHERE aa.client_agreement_id=a.id AND aa.signer_role IN ('primary_client','secondary_client') AND aa.accepted_terms AND aa.content_hash=coalesce(a.rendered_content_hash,a.content_hash))>=a.required_client_signatures
 AND EXISTS(SELECT 1 FROM public.agreement_acceptances aa WHERE aa.client_agreement_id=a.id AND aa.signer_role='primary_client' AND aa.accepted_terms AND aa.content_hash=coalesce(a.rendered_content_hash,a.content_hash)));
$$;
CREATE OR REPLACE FUNCTION private.enrollment_gates_complete(a public.journey_enrollment_activations)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT private.enrollment_payment_satisfied(a)
 AND ((EXISTS(SELECT 1 FROM public.client_agreements ca WHERE ca.activation_id=a.id)
 AND NOT EXISTS(SELECT 1 FROM public.client_agreements ca WHERE ca.activation_id=a.id AND NOT private.agreement_signatures_satisfied(ca)))
 OR (a.agreement_status='waived' AND NOT EXISTS(SELECT 1 FROM public.client_agreements ca WHERE ca.activation_id=a.id)));
$$;
CREATE FUNCTION private.full_member_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.client_access ca JOIN public.client_memberships cm ON cm.id=ca.membership_id JOIN public.journey_enrollment_activations a ON a.id=cm.activation_id
 WHERE ca.user_id=auth.uid() AND ca.status='active' AND NOT ca.needs_onboarding_claim AND cm.status='active' AND a.access_status='active' AND private.enrollment_gates_complete(a));
$$;
CREATE FUNCTION private.active_staff_session()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.staff_access s WHERE s.user_id=auth.uid() AND s.status='active' AND (s.role<>'coach' OR s.onboarding_status IN ('complete','waived')));
$$;
CREATE FUNCTION public.member_paid_access_allowed() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.full_member_access(); $$;

-- Lock the enrollment before any financial mutation. This serializes reconciliation
-- with signatures/waivers and prevents two concurrent ledger writers seeing stale totals.
CREATE FUNCTION private.lock_enrollment_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_OP='UPDATE' AND (NEW.activation_id,NEW.contact_id,NEW.currency) IS DISTINCT FROM (OLD.activation_id,OLD.contact_id,OLD.currency) THEN RAISE EXCEPTION 'Reverse and replace payments; do not move ledger records'; END IF;
 PERFORM 1 FROM public.journey_enrollment_activations WHERE id=coalesce(NEW.activation_id,OLD.activation_id) FOR UPDATE;
 IF TG_OP<>'DELETE' AND NEW.activation_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.journey_enrollment_activations a WHERE a.id=NEW.activation_id AND a.contact_id=NEW.contact_id AND a.currency=NEW.currency) THEN RAISE EXCEPTION 'Payment enrollment or currency mismatch'; END IF;
 RETURN coalesce(NEW,OLD);
END; $$;
CREATE TRIGGER a_lock_enrollment_payment BEFORE INSERT OR UPDATE OR DELETE ON public.payment_records FOR EACH ROW EXECUTE FUNCTION private.lock_enrollment_payment();

CREATE FUNCTION private.refresh_client_lifecycle(p_activation uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE a public.journey_enrollment_activations%rowtype; ca public.client_access%rowtype; cm public.client_memberships%rowtype; v_status text; v_reason text; v_ready boolean; v_paid boolean;
BEGIN
 SELECT * INTO a FROM public.journey_enrollment_activations WHERE id=p_activation FOR UPDATE;
 IF a.id IS NULL THEN RETURN; END IF;
 SELECT * INTO cm FROM public.client_memberships WHERE activation_id=a.id;
 IF cm.id IS NULL THEN RETURN; END IF;
 SELECT * INTO ca FROM public.client_access WHERE membership_id=cm.id FOR UPDATE;
 IF ca.contact_id IS NULL OR ca.status IN ('inactive','suspended') OR cm.status IN ('cancelled','completed') OR (cm.status='paused' AND ca.status<>'payment_suspended') THEN RETURN; END IF;
 v_paid:=private.enrollment_payment_satisfied(a); v_ready:=private.enrollment_gates_complete(a);
 v_status:=CASE WHEN v_ready THEN CASE WHEN ca.user_id IS NOT NULL AND NOT ca.needs_onboarding_claim THEN 'active' ELSE 'ready' END
 WHEN NOT v_paid AND (ca.activated_at IS NOT NULL OR ca.status IN ('active','payment_suspended')) THEN 'payment_suspended' ELSE 'onboarding' END;
 v_reason:=CASE WHEN v_status='payment_suspended' THEN 'payment_required' WHEN v_status='onboarding' THEN CASE WHEN NOT v_paid THEN 'payment_and_agreements' ELSE 'agreement_required' END ELSE NULL END;
 -- Change only when needed; status triggers otherwise recursively re-provision.
 UPDATE public.journey_enrollment_activations SET access_status=CASE WHEN v_status='active' THEN 'active' WHEN v_status='ready' THEN 'ready' WHEN v_status='payment_suspended' THEN 'suspended' ELSE 'pending' END,updated_at=now()
 WHERE id=a.id AND access_status IS DISTINCT FROM CASE WHEN v_status='active' THEN 'active' WHEN v_status='ready' THEN 'ready' WHEN v_status='payment_suspended' THEN 'suspended' ELSE 'pending' END;
 UPDATE public.client_memberships SET status=CASE WHEN v_status IN ('active','ready') THEN 'active' WHEN v_status='payment_suspended' THEN 'paused' ELSE 'pending' END,updated_at=now()
 WHERE id=cm.id AND status IS DISTINCT FROM CASE WHEN v_status IN ('active','ready') THEN 'active' WHEN v_status='payment_suspended' THEN 'paused' ELSE 'pending' END;
 UPDATE public.client_access SET status=v_status,restriction_reason=v_reason,activated_at=CASE WHEN v_status='active' THEN coalesce(activated_at,now()) ELSE activated_at END,updated_at=now()
 WHERE contact_id=ca.contact_id AND (status,restriction_reason) IS DISTINCT FROM (v_status,v_reason);
END; $$;
CREATE FUNCTION private.refresh_lifecycle_from_activation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,private AS $$
BEGIN PERFORM private.refresh_client_lifecycle(NEW.id); RETURN NEW; END; $$;
CREATE TRIGGER zz_refresh_client_lifecycle AFTER INSERT OR UPDATE OF payment_status,agreement_status,amount_cents,program_code ON public.journey_enrollment_activations FOR EACH ROW EXECUTE FUNCTION private.refresh_lifecycle_from_activation();

CREATE FUNCTION private.audit_client_access_transition() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_type text;
BEGIN
 IF TG_OP='UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id THEN RETURN NEW; END IF;
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(NEW.contact_id,'client_access_transition','Client access changed',auth.uid(),jsonb_build_object('from',CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END,'to',NEW.status,'reason',NEW.restriction_reason,'membership_id',NEW.membership_id));
 IF NEW.user_id IS NOT NULL AND NEW.status IN ('onboarding','payment_suspended','active') THEN
 v_type:=CASE WHEN NEW.status='payment_suspended' THEN 'billing_access_suspended' WHEN NEW.status='active' THEN 'billing_access_restored' ELSE 'billing_onboarding_required' END;
 INSERT INTO public.member_notifications(user_id,contact_id,notification_type,title,body,link_url,source_type) VALUES(NEW.user_id,NEW.contact_id,v_type,CASE WHEN NEW.status='active' THEN 'Your member access is ready' WHEN NEW.status='payment_suspended' THEN 'Payment resolution needed' ELSE 'Complete your enrollment' END,'Review your payment and agreement status in your account.','/member/onboarding/','client_access');
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER audit_client_access_transition AFTER INSERT OR UPDATE OF status,user_id ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.audit_client_access_transition();

-- Freeze signed legal content; revised terms require a newly issued agreement.
CREATE FUNCTION private.freeze_signed_agreement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF (NEW.contact_id,NEW.activation_id,NEW.agreement_template_id,NEW.template_version,NEW.content_hash,NEW.rendered_content_text,NEW.rendered_content_hash,NEW.required_client_signatures) IS DISTINCT FROM (OLD.contact_id,OLD.activation_id,OLD.agreement_template_id,OLD.template_version,OLD.content_hash,OLD.rendered_content_text,OLD.rendered_content_hash,OLD.required_client_signatures)
 AND EXISTS(SELECT 1 FROM public.agreement_acceptances WHERE client_agreement_id=OLD.id AND accepted_terms) THEN RAISE EXCEPTION 'Signed agreement content is immutable; issue a new agreement'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER freeze_signed_agreement BEFORE UPDATE ON public.client_agreements FOR EACH ROW EXECUTE FUNCTION private.freeze_signed_agreement();
CREATE OR REPLACE FUNCTION private.provision_client_foundation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_household_id uuid;
  v_membership_id uuid;
  v_user_id uuid;
  v_sex text;
  v_full_name text;
  v_program text;
  v_membership_status text;
  v_household_status text;
begin
  if NEW.access_status='suspended' then return NEW; end if;
  if exists(select 1 from public.client_memberships where activation_id=NEW.id) then return NEW; end if;

  v_program := coalesce(NEW.program_code,'');
  if not exists(select 1 from public.program_catalog where program_code=v_program and active) then
    return NEW;
  end if;

  select concat_ws(' ',first_name,last_name)
  into v_full_name
  from public.contacts
  where id=NEW.contact_id;

  select lower(wa.answer #>> '{}')
  into v_sex
  from public.workflow_records wr
  join public.workflow_answers wa on wa.workflow_id=wr.id and wa.question_key='sex'
  where wr.contact_id=NEW.contact_id
    and wr.workflow_type='enrollment'
  order by wr.created_at desc
  limit 1;

  if v_sex not in ('male','female') then
    v_sex := null;
  end if;

  v_household_status := case when v_sex is not null then 'active' else 'draft' end;

  insert into public.households(
    household_type,status,primary_contact_id,household_name,created_by,updated_at
  )
  values(
    'individual',v_household_status,NEW.contact_id,
    nullif(trim(v_full_name),'') || ' Household',
    NEW.created_by,now()
  )
  on conflict (primary_contact_id) do update
  set updated_at=now()
  returning id into v_household_id;

  insert into public.household_members(
    household_id,contact_id,relationship_type,sex,is_primary,status,updated_at
  )
  values(
    v_household_id,NEW.contact_id,'self',v_sex,true,'active',now()
  )
  on conflict (contact_id) do update
  set household_id=excluded.household_id,
      relationship_type='self',
      sex=coalesce(excluded.sex,public.household_members.sex),
      is_primary=true,
      status='active',
      updated_at=now();

  v_membership_status := case when NEW.access_status='active' then 'active' else 'pending' end;

  insert into public.client_memberships(
    household_id,primary_contact_id,activation_id,program_code,status,
    billing_choice,amount_cents,currency,commitment_months,starts_at,commitment_ends_at,
    assigned_coach_id,created_by,metadata,updated_at
  )
  values(
    v_household_id,NEW.contact_id,NEW.id,v_program,v_membership_status,
    NEW.billing_choice,NEW.amount_cents,NEW.currency,NEW.commitment_months,
    coalesce(NEW.paid_at,now()),
    case
      when NEW.commitment_months is not null
        then coalesce(NEW.paid_at,now()) + make_interval(months=>NEW.commitment_months)
      else null
    end,
    (select assigned_to from public.contact_journeys where id=NEW.journey_id),
    NEW.created_by,
    jsonb_build_object('journey_id',NEW.journey_id),
    now()
  )
  on conflict (activation_id) do update
  set status=excluded.status,
      billing_choice=excluded.billing_choice,
      amount_cents=excluded.amount_cents,
      currency=excluded.currency,
      commitment_months=excluded.commitment_months,
      assigned_coach_id=coalesce(excluded.assigned_coach_id,public.client_memberships.assigned_coach_id),
      updated_at=now()
  returning id into v_membership_id;

  insert into public.membership_entitlements(
    membership_id,entitlement_key,label,limit_value,reset_cadence,metadata
  )
  select
    v_membership_id,t.entitlement_key,t.label,t.limit_value,t.reset_cadence,t.metadata
  from public.program_entitlement_templates t
  where t.program_code=v_program and t.active
  on conflict (membership_id,entitlement_key) do update
  set label=excluded.label,
      limit_value=excluded.limit_value,
      reset_cadence=excluded.reset_cadence,
      metadata=excluded.metadata,
      status='active',
      updated_at=now();

  select user_id into v_user_id
  from public.profiles
  where contact_id=NEW.contact_id
  limit 1;

  insert into public.client_access(
    contact_id,household_id,membership_id,user_id,status,ready_at,activated_at,updated_at,needs_onboarding_claim
  )
  values(
    NEW.contact_id,v_household_id,v_membership_id,v_user_id,
    case when NEW.access_status='active' and v_user_id is not null then 'active' else 'onboarding' end,
    now(),
    case when NEW.access_status='active' and v_user_id is not null then now() else null end,
    now(),true
  )
  on conflict (contact_id) do update
  set household_id=excluded.household_id,
      membership_id=excluded.membership_id,
      user_id=coalesce(public.client_access.user_id,excluded.user_id),
      status=case
        when NEW.access_status='active' and coalesce(public.client_access.user_id,excluded.user_id) is not null then 'active'
        when public.client_access.status='active' then 'active'
        else 'ready'
      end,
      ready_at=coalesce(public.client_access.ready_at,now()),
      activated_at=case
        when NEW.access_status='active' and coalesce(public.client_access.user_id,excluded.user_id) is not null
          then coalesce(public.client_access.activated_at,now())
        else public.client_access.activated_at
      end,
      updated_at=now();

  insert into public.contact_activity(contact_id,activity_type,title,detail,metadata)
  values(
    NEW.contact_id,'client_foundation_ready','Client membership foundation ready',
    (select name from public.program_catalog where program_code=v_program),
    jsonb_build_object(
      'membership_id',v_membership_id,
      'household_id',v_household_id,
      'activation_id',NEW.id,
      'access_status',NEW.access_status
    )
  );

  return NEW;
end;
$function$
;

DROP TRIGGER provision_client_foundation_trigger ON public.journey_enrollment_activations;
CREATE TRIGGER provision_client_foundation_trigger AFTER INSERT OR UPDATE OF program_code ON public.journey_enrollment_activations FOR EACH ROW EXECUTE FUNCTION private.provision_client_foundation();
CREATE OR REPLACE FUNCTION private.sync_payment_record_to_activation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_paid_total bigint;
  v_refund_total bigint;
  v_net_total bigint;
  v_activation public.journey_enrollment_activations%rowtype;
begin
  if coalesce(new.activation_id,old.activation_id) is null then
    return coalesce(new,old);
  end if;

  select * into v_activation
  from public.journey_enrollment_activations
  where id=coalesce(new.activation_id,old.activation_id);

  if v_activation.id is null then
    return coalesce(new,old);
  end if;

  select
    coalesce(sum(amount_cents) filter(
      where transaction_type in ('payment','adjustment')
        and status='recorded'
    ),0),
    coalesce(sum(amount_cents) filter(
      where transaction_type in ('refund','reversal')
        and status='recorded'
    ),0)
  into v_paid_total,v_refund_total
  from public.payment_records
  where activation_id=v_activation.id AND contact_id=v_activation.contact_id AND currency=v_activation.currency;

  v_net_total:=v_paid_total-v_refund_total;

  update public.journey_enrollment_activations
  set payment_status=case
        when v_activation.payment_status='waived' then 'waived'
        when v_activation.amount_cents is not null and v_net_total>=v_activation.amount_cents then 'paid'
        when v_net_total>0 then 'authorized'
        when v_refund_total>0 and v_net_total<=0 then 'refunded'
        else 'pending'
      end,
      paid_at=case
        when v_activation.payment_status='waived' then paid_at
        when v_activation.amount_cents is not null and v_net_total>=v_activation.amount_cents
          then coalesce(paid_at,now())
        else null
      end,
      payment_completion_method=case
        when v_activation.payment_status='waived' then payment_completion_method
        when v_activation.amount_cents is not null and v_net_total>=v_activation.amount_cents
          then coalesce(payment_completion_method,'payment_records_reconciled')
        else payment_completion_method
      end,
      payment_reference=case
        when tg_op<>'DELETE' and new.reference_number is not null then new.reference_number
        else payment_reference
      end,
      updated_at=now()
  where id=v_activation.id;

  return coalesce(new,old);
end;
$function$
;

CREATE OR REPLACE FUNCTION private.link_profile_to_client_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE v_activation uuid;
BEGIN
 UPDATE public.client_access SET user_id=NEW.user_id,invited_at=coalesce(invited_at,now()),updated_at=now() WHERE contact_id=NEW.contact_id AND (user_id IS NULL OR user_id=NEW.user_id);
 SELECT cm.activation_id INTO v_activation FROM public.client_access ca JOIN public.client_memberships cm ON cm.id=ca.membership_id WHERE ca.contact_id=NEW.contact_id;
 IF v_activation IS NOT NULL THEN PERFORM private.refresh_client_lifecycle(v_activation); END IF;
 RETURN NEW;
END; $$;
-- Identity-to-contact linkage is server-owned, never a self-editable profile field.
REVOKE INSERT,UPDATE,DELETE ON public.profiles FROM authenticated,anon;

CREATE FUNCTION private.agreement_signer_role(p_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT CASE
 WHEN EXISTS(SELECT 1 FROM public.client_agreements a JOIN public.client_access ca ON ca.contact_id=a.contact_id WHERE a.id=p_id AND ca.user_id=auth.uid() AND NOT ca.needs_onboarding_claim AND ca.status IN ('active','onboarding','payment_suspended','ready','invited')) THEN 'primary_client'
 WHEN EXISTS(SELECT 1 FROM private.agreement_signer_invitations i JOIN auth.users u ON u.id=i.redeemed_by JOIN public.client_agreements a ON a.id=i.agreement_id
 WHERE i.agreement_id=p_id AND i.redeemed_by=auth.uid() AND i.revoked_at IS NULL AND i.expires_at>now() AND i.content_hash=coalesce(a.rendered_content_hash,a.content_hash) AND lower(u.email)=i.recipient_email AND u.email_confirmed_at IS NOT NULL) THEN 'secondary_client' END;
$$;
CREATE FUNCTION private.invite_agreement_signer(p_id uuid,p_email text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private,extensions AS $$
DECLARE a public.client_agreements%rowtype; v_token text; v_id uuid; v_email text:=lower(trim(p_email)); v_household uuid; v_primary uuid; v_origin text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.client_agreements WHERE id=p_id;
 IF a.activation_id IS NULL THEN RAISE EXCEPTION 'Enrollment agreement required'; END IF;
 PERFORM 1 FROM public.journey_enrollment_activations WHERE id=a.activation_id FOR UPDATE;
 SELECT * INTO a FROM public.client_agreements WHERE id=p_id FOR UPDATE;
 IF NOT (coalesce(private.agreement_signer_role(a.id)='primary_client',false) OR private.staff_action_allowed(auth.uid(),'finance.manage',a.contact_id)) THEN RAISE EXCEPTION 'Agreement invitation not permitted' USING ERRCODE='42501'; END IF;
 IF a.required_client_signatures<>2 OR a.status IN ('signed','waived','declined','not_sent') OR a.rendered_content_hash IS NULL OR a.rendered_content_text IS NULL THEN RAISE EXCEPTION 'Issued two-adult agreement with rendered content required'; END IF;
 SELECT user_id,household_id INTO v_primary,v_household FROM public.client_access WHERE contact_id=a.contact_id;
 IF v_email IS NULL OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(v_email)>254 OR EXISTS(SELECT 1 FROM auth.users WHERE id=v_primary AND lower(email)=v_email) OR EXISTS(SELECT 1 FROM public.contacts WHERE id=a.contact_id AND lower(email)=v_email) THEN RAISE EXCEPTION 'A different adult recipient email is required'; END IF;
 IF EXISTS(SELECT 1 FROM public.agreement_acceptances WHERE client_agreement_id=a.id AND signer_role='secondary_client' AND accepted_terms) THEN RAISE EXCEPTION 'Secondary adult already signed'; END IF;
 IF EXISTS(SELECT 1 FROM private.agreement_signer_invitations WHERE agreement_id=a.id AND created_at>now()-interval '1 minute') THEN RAISE EXCEPTION 'An invitation was recently queued; wait before resending'; END IF;
 UPDATE private.agreement_signer_invitations SET revoked_at=now() WHERE agreement_id=a.id AND revoked_at IS NULL;
 UPDATE public.notification_delivery_jobs SET status='cancelled',body='Invitation superseded.' WHERE signer_invitation_id IN (SELECT id FROM private.agreement_signer_invitations WHERE agreement_id=a.id) AND status IN ('queued','failed','blocked');
 SELECT config_value->>'origin' INTO v_origin FROM public.app_runtime_config WHERE config_key='client_onboarding' AND active;
 IF v_origin IS DISTINCT FROM 'https://revitalizedacademy.com' OR v_origin !~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$' THEN RAISE EXCEPTION 'An approved HTTPS onboarding origin must be configured before sending invitations'; END IF;
 v_token:=encode(extensions.gen_random_bytes(32),'hex');
 INSERT INTO private.agreement_signer_invitations(agreement_id,activation_id,household_id,recipient_email,token_hash,content_hash,created_by)
 VALUES(a.id,a.activation_id,v_household,v_email,encode(extensions.digest(v_token,'sha256'),'hex'),a.rendered_content_hash,auth.uid()) RETURNING id INTO v_id;
 -- The delivery copy must contain the link; only the privileged dispatcher can read it.
 -- The durable invitation and audit contain only the digest/identifier, never the secret.
 INSERT INTO public.notification_delivery_jobs(channel,provider,recipient,subject,body,signer_invitation_id)
 VALUES('email','resend',v_email,'ReVitalized Academy: your agreement invitation','Sign in or create your own account, verify your email, then review and sign your agreement: '||v_origin||'/member/onboarding/#invite='||v_token||E'\nThis invitation expires in 72 hours. It does not grant membership or access to another adult’s private information.',v_id);
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(a.contact_id,'secondary_signer_invited','Secondary adult invitation queued',auth.uid(),jsonb_build_object('agreement_id',a.id,'invitation_id',v_id));
 RETURN v_id;
END; $$;
CREATE FUNCTION public.invite_secondary_signer(p_client_agreement_id uuid,p_email text) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.invite_agreement_signer(p_client_agreement_id,p_email); $$;

CREATE FUNCTION private.redeem_signer_invitation(p_token text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private,extensions AS $$
DECLARE i private.agreement_signer_invitations%rowtype; v_email text; v_contact uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF coalesce(p_token,'') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invitation unavailable'; END IF;
 SELECT * INTO i FROM private.agreement_signer_invitations WHERE token_hash=encode(extensions.digest(p_token,'sha256'),'hex') FOR UPDATE;
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF i.id IS NULL OR i.revoked_at IS NOT NULL OR i.expires_at<=now() OR v_email IS DISTINCT FROM i.recipient_email THEN RAISE EXCEPTION 'Invitation unavailable for this verified account' USING ERRCODE='42501'; END IF;
 IF i.redeemed_by IS NOT NULL AND i.redeemed_by<>auth.uid() THEN RAISE EXCEPTION 'Invitation already used'; END IF;
 SELECT contact_id INTO v_contact FROM public.client_agreements WHERE id=i.agreement_id AND coalesce(rendered_content_hash,content_hash)=i.content_hash;
 IF v_contact IS NULL THEN RAISE EXCEPTION 'Agreement content changed; request a new invitation'; END IF;
 IF EXISTS(SELECT 1 FROM public.client_access WHERE contact_id=v_contact AND user_id=auth.uid()) OR EXISTS(SELECT 1 FROM public.agreement_acceptances WHERE client_agreement_id=i.agreement_id AND signer_role='primary_client' AND signed_by_user_id=auth.uid()) THEN RAISE EXCEPTION 'Two distinct adult accounts required'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles p JOIN public.household_members hm ON hm.contact_id=p.contact_id WHERE p.user_id=auth.uid() AND hm.date_of_birth>current_date-interval '18 years') THEN RAISE EXCEPTION 'An adult signer is required'; END IF;
 IF i.redeemed_by IS NULL THEN
 UPDATE private.agreement_signer_invitations SET redeemed_by=auth.uid(),redeemed_at=now() WHERE id=i.id;
 UPDATE public.notification_delivery_jobs SET status='cancelled',body='Invitation redeemed; secret removed.' WHERE signer_invitation_id=i.id AND status IN ('queued','failed','blocked');
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(v_contact,'secondary_invitation_redeemed','Secondary adult accepted invitation',auth.uid(),jsonb_build_object('invitation_id',i.id,'agreement_id',i.agreement_id));
 END IF;
 RETURN i.agreement_id;
END; $$;
CREATE FUNCTION public.redeem_secondary_signer_invitation(p_token text) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.redeem_signer_invitation(p_token); $$;
CREATE FUNCTION private.revoke_signer_invitation(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE i private.agreement_signer_invitations%rowtype; v_contact uuid;
BEGIN
 SELECT * INTO i FROM private.agreement_signer_invitations WHERE id=p_id FOR UPDATE;
 SELECT contact_id INTO v_contact FROM public.client_agreements WHERE id=i.agreement_id;
 IF auth.uid() IS NULL OR NOT(coalesce(private.agreement_signer_role(i.agreement_id)='primary_client',false) OR private.staff_action_allowed(auth.uid(),'finance.manage',v_contact)) THEN RAISE EXCEPTION 'Invitation revocation not permitted' USING ERRCODE='42501'; END IF;
 UPDATE private.agreement_signer_invitations SET revoked_at=coalesce(revoked_at,now()) WHERE id=i.id;
 UPDATE public.notification_delivery_jobs SET status='cancelled',body='Invitation revoked.' WHERE signer_invitation_id=i.id AND status IN ('queued','failed','blocked');
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(v_contact,'secondary_invitation_revoked','Secondary adult invitation revoked',auth.uid(),jsonb_build_object('invitation_id',i.id));
END; $$;
CREATE FUNCTION public.revoke_secondary_signer_invitation(p_invitation_id uuid) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.revoke_signer_invitation(p_invitation_id); $$;

CREATE OR REPLACE FUNCTION private.sign_client_agreement(p_id uuid,p_signatures jsonb,p_hash text,p_user_agent text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private,extensions AS $$
DECLARE a public.client_agreements%rowtype; t public.agreement_templates%rowtype; v_hash text; v_role text; v_signature jsonb; v_id uuid; v_count integer;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Verified authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.client_agreements WHERE id=p_id;
 -- Global lock order: enrollment -> agreement -> invitation.
 IF a.activation_id IS NOT NULL THEN PERFORM 1 FROM public.journey_enrollment_activations WHERE id=a.activation_id FOR UPDATE; END IF;
 SELECT * INTO a FROM public.client_agreements WHERE id=p_id FOR UPDATE;
 v_role:=private.agreement_signer_role(p_id);
 IF a.id IS NULL OR v_role IS NULL THEN RAISE EXCEPTION 'Client agreement not found for this signer' USING ERRCODE='42501'; END IF;
 IF a.status IN ('waived','declined','not_sent') THEN RAISE EXCEPTION 'This agreement cannot be signed in its current status'; END IF;
 IF jsonb_typeof(p_signatures) IS DISTINCT FROM 'array' OR jsonb_array_length(p_signatures)<>1 THEN RAISE EXCEPTION 'Exactly one authenticated adult signature per request'; END IF;
 v_signature:=p_signatures->0;
 IF v_signature->>'signer_role' IS DISTINCT FROM v_role OR coalesce(length(trim(v_signature->>'signer_name')),0) NOT BETWEEN 2 AND 240 THEN RAISE EXCEPTION 'Invalid signer role or name'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles p JOIN public.household_members hm ON hm.contact_id=p.contact_id WHERE p.user_id=auth.uid() AND hm.date_of_birth>current_date-interval '18 years') THEN RAISE EXCEPTION 'An adult signer is required'; END IF;
 v_hash:=coalesce(a.rendered_content_hash,a.content_hash);
 IF nullif(p_hash,'') IS NULL OR p_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'Agreement content changed. Reload the agreement before signing'; END IF;
 SELECT * INTO t FROM public.agreement_templates WHERE id=a.agreement_template_id;
 IF t.status IS DISTINCT FROM 'published' OR (a.rendered_content_hash IS NOT NULL AND encode(extensions.digest(convert_to(coalesce(a.rendered_content_text,''),'UTF8'),'sha256'),'hex')<>v_hash) OR (a.rendered_content_hash IS NULL AND t.content_hash IS DISTINCT FROM a.content_hash) THEN RAISE EXCEPTION 'Agreement integrity check failed'; END IF;
 IF v_role='secondary_client' THEN
 PERFORM 1 FROM private.agreement_signer_invitations WHERE agreement_id=a.id AND redeemed_by=auth.uid() AND revoked_at IS NULL AND expires_at>now() AND content_hash=v_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invitation unavailable'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public.agreement_acceptances WHERE client_agreement_id=a.id AND signer_role<>v_role AND signer_role IN ('primary_client','secondary_client') AND signed_by_user_id=auth.uid()) THEN RAISE EXCEPTION 'Two distinct adult accounts required'; END IF;
 SELECT id INTO v_id FROM public.agreement_acceptances WHERE client_agreement_id=a.id AND signer_role=v_role AND signed_by_user_id=auth.uid() AND content_hash=v_hash AND accepted_terms;
 IF v_id IS NOT NULL THEN RETURN v_id; END IF; -- Retry is idempotent; never overwrite an acceptance.
 IF EXISTS(SELECT 1 FROM public.agreement_acceptances WHERE client_agreement_id=a.id AND signer_role=v_role) THEN RAISE EXCEPTION 'Signature slot already accepted'; END IF;
 INSERT INTO public.agreement_acceptances(client_agreement_id,contact_id,signed_by_user_id,signer_name,signer_email,signature_type,accepted_terms,content_hash,user_agent,metadata,signer_role)
 VALUES(a.id,a.contact_id,auth.uid(),trim(v_signature->>'signer_name'),(SELECT email FROM auth.users WHERE id=auth.uid()),'typed',true,v_hash,left(p_user_agent,1000),jsonb_build_object('source','authenticated_signer','template_version',a.template_version),v_role) RETURNING id INTO v_id;
 SELECT count(DISTINCT signed_by_user_id) INTO v_count FROM public.agreement_acceptances WHERE client_agreement_id=a.id AND signer_role IN ('primary_client','secondary_client') AND accepted_terms AND content_hash=v_hash;
 UPDATE public.client_agreements SET status=CASE WHEN v_count>=required_client_signatures THEN 'signed' ELSE 'viewed' END,viewed_at=coalesce(viewed_at,now()),signed_at=CASE WHEN v_count>=required_client_signatures THEN now() ELSE NULL END,updated_at=now() WHERE id=a.id;
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(a.contact_id,'agreement_signed','Authenticated adult signature recorded',auth.uid(),jsonb_build_object('agreement_id',a.id,'signer_role',v_role,'content_hash',v_hash));
 RETURN v_id;
END; $$;

CREATE FUNCTION public.sign_client_agreement_atomic(p_client_agreement_id uuid,p_signatures jsonb,p_expected_content_hash text,p_user_agent text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.sign_client_agreement(p_client_agreement_id,p_signatures,p_expected_content_hash,p_user_agent); $$;
REVOKE ALL ON FUNCTION public.sign_client_agreement_atomic(uuid,jsonb,text,text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.sign_client_agreement_atomic(uuid,jsonb,text,text) TO authenticated;

CREATE FUNCTION private.client_onboarding_context() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE ca public.client_access%rowtype; v_enrollments jsonb; v_agreements jsonb; v_notices jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO ca FROM public.client_access WHERE user_id=auth.uid();
 IF ca.needs_onboarding_claim THEN ca.contact_id:=NULL; ca.status:='invitation_required'; END IF;
 IF ca.status IN ('inactive','suspended') THEN RETURN jsonb_build_object('access_state',ca.status,'full_access',false,'enrollments','[]'::jsonb,'agreements','[]'::jsonb,'notifications','[]'::jsonb); END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('activation_id',a.id,'program_name',a.program_name,'program_code',a.program_code,'billing_choice',a.billing_choice,'commitment_months',a.commitment_months,'amount_cents',a.amount_cents,'currency',a.currency,'payment_url',NULL,'payment_status',a.payment_status,'payment_satisfied',private.enrollment_payment_satisfied(a),'requirements_complete',private.enrollment_gates_complete(a),'net_paid_cents',(SELECT coalesce(sum(CASE WHEN transaction_type IN ('payment','adjustment') THEN amount_cents WHEN transaction_type IN ('refund','reversal') THEN -amount_cents ELSE 0 END),0) FROM public.payment_records p WHERE p.activation_id=a.id AND p.status='recorded' AND p.currency=a.currency),'access_status',a.access_status)),'[]') INTO v_enrollments FROM public.journey_enrollment_activations a WHERE a.contact_id=ca.contact_id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('client_agreement_id',a.id,'name',t.name,'template_version',a.template_version,'content_text',coalesce(a.rendered_content_text,t.content_text),'content_hash',coalesce(a.rendered_content_hash,a.content_hash),'status',a.status,'required_client_signatures',a.required_client_signatures,'signer_role',private.agreement_signer_role(a.id),'already_signed',EXISTS(SELECT 1 FROM public.agreement_acceptances aa WHERE aa.client_agreement_id=a.id AND aa.signed_by_user_id=auth.uid() AND aa.accepted_terms),'accepted_signatures',(SELECT count(DISTINCT signed_by_user_id) FROM public.agreement_acceptances aa WHERE aa.client_agreement_id=a.id AND aa.accepted_terms AND aa.signer_role IN ('primary_client','secondary_client') AND aa.content_hash=coalesce(a.rendered_content_hash,a.content_hash)),
 'invitations',CASE WHEN a.contact_id=ca.contact_id THEN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',i.id,'expires_at',i.expires_at,'redeemed',i.redeemed_at IS NOT NULL,'revoked',i.revoked_at IS NOT NULL)),'[]') FROM private.agreement_signer_invitations i WHERE i.agreement_id=a.id) ELSE '[]'::jsonb END)),'[]') INTO v_agreements
 FROM public.client_agreements a JOIN public.agreement_templates t ON t.id=a.agreement_template_id
 WHERE (a.contact_id=ca.contact_id OR private.agreement_signer_role(a.id)='secondary_client' OR EXISTS(SELECT 1 FROM public.agreement_acceptances aa WHERE aa.client_agreement_id=a.id AND aa.signed_by_user_id=auth.uid() AND aa.signer_role='secondary_client')) AND a.status<>'not_sent';
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',n.id,'title',n.title,'body',n.body,'created_at',n.created_at)),'[]') INTO v_notices FROM (SELECT * FROM public.member_notifications WHERE user_id=auth.uid() AND NOT coalesce(ca.needs_onboarding_claim,false) AND (notification_type LIKE 'billing_%' OR notification_type LIKE 'agreement_%' OR notification_type='account_active') ORDER BY created_at DESC LIMIT 30)n;
 RETURN jsonb_build_object('access_state',coalesce(ca.status,'signer_only'),'full_access',private.full_member_access(),'email',(SELECT email FROM auth.users WHERE id=auth.uid()),'enrollments',v_enrollments,'agreements',v_agreements,'notifications',v_notices);
END; $$;
CREATE FUNCTION public.my_onboarding_context() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.client_onboarding_context(); $$;

CREATE FUNCTION private.set_enrollment_waiver(p_activation uuid,p_agreement uuid,p_gate text,p_waived boolean,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE a public.journey_enrollment_activations%rowtype; s public.staff_access%rowtype;
BEGIN
 SELECT * INTO a FROM public.journey_enrollment_activations WHERE id=p_activation FOR UPDATE;
 SELECT * INTO s FROM public.staff_access WHERE user_id=auth.uid();
 IF a.id IS NULL OR auth.uid() IS NULL OR s.role NOT IN ('owner','admin') OR NOT private.staff_action_allowed(auth.uid(),'finance.manage',a.contact_id) THEN RAISE EXCEPTION 'Active authorized owner/admin required' USING ERRCODE='42501'; END IF;
 IF coalesce(length(trim(p_reason)),0) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION 'A waiver or removal reason is required'; END IF;
 IF p_gate='payment' AND p_agreement IS NULL THEN
 UPDATE public.journey_enrollment_activations SET payment_status=CASE WHEN p_waived THEN 'waived' ELSE 'pending' END,payment_waived_by=CASE WHEN p_waived THEN auth.uid() END,payment_waived_at=CASE WHEN p_waived THEN now() END,payment_waiver_reason=p_reason,last_manual_override_by=auth.uid(),last_manual_override_at=now() WHERE id=a.id;
 ELSIF p_gate='agreement' AND p_agreement IS NOT NULL THEN
 UPDATE public.client_agreements SET status=CASE WHEN p_waived THEN 'waived' ELSE 'sent' END,waived_by=CASE WHEN p_waived THEN auth.uid() END,waived_at=CASE WHEN p_waived THEN now() END,waiver_reason=p_reason WHERE id=p_agreement AND activation_id=a.id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Agreement not found for enrollment'; END IF;
 ELSE RAISE EXCEPTION 'Choose payment or an individual agreement waiver'; END IF;
 INSERT INTO public.manual_override_audit(contact_id,journey_id,entity_type,entity_id,action,permission_key,actor_user_id,actor_role,previous_value,new_value,reason)
 VALUES(a.contact_id,a.journey_id,'enrollment',coalesce(p_agreement,a.id),CASE WHEN p_waived THEN 'lifecycle_waiver_recorded' ELSE 'lifecycle_waiver_removed' END,'finance.manage',auth.uid(),s.role,jsonb_build_object('payment_status',a.payment_status),jsonb_build_object('gate',p_gate,'waived',p_waived),trim(p_reason));
 PERFORM private.refresh_client_lifecycle(a.id);
END; $$;
CREATE FUNCTION public.set_enrollment_waiver(p_activation_id uuid,p_agreement_id uuid,p_gate text,p_waived boolean,p_reason text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.set_enrollment_waiver(p_activation_id,p_agreement_id,p_gate,p_waived,p_reason); $$;

-- Ordinary SQL clients cannot manufacture waivers or bypass the audited RPC.
CREATE FUNCTION private.guard_enrollment_waiver() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF NEW.payment_status='waived' AND (TG_OP='INSERT' OR OLD.payment_status IS DISTINCT FROM NEW.payment_status) AND auth.role() IN ('authenticated','service_role') THEN
 IF NEW.payment_waived_by IS NULL OR nullif(trim(NEW.payment_waiver_reason),'') IS NULL OR NOT private.staff_action_allowed(NEW.payment_waived_by,'finance.manage',NEW.contact_id) OR NOT EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=NEW.payment_waived_by AND role IN ('owner','admin')) OR (auth.uid() IS NOT NULL AND auth.uid()<>NEW.payment_waived_by) THEN RAISE EXCEPTION 'Use an authorized recorded payment waiver'; END IF;
 END IF;
 IF NEW.agreement_status='waived' AND (TG_OP='INSERT' OR OLD.agreement_status IS DISTINCT FROM NEW.agreement_status) AND auth.role() IN ('authenticated','service_role') THEN RAISE EXCEPTION 'Waive required agreements individually'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER a_guard_enrollment_waiver BEFORE INSERT OR UPDATE ON public.journey_enrollment_activations FOR EACH ROW EXECUTE FUNCTION private.guard_enrollment_waiver();
CREATE FUNCTION private.guard_agreement_waiver() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF NEW.status='waived' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) AND auth.role() IN ('authenticated','service_role') AND (NEW.waived_by IS NULL OR nullif(trim(NEW.waiver_reason),'') IS NULL OR NOT private.staff_action_allowed(NEW.waived_by,'finance.manage',NEW.contact_id) OR NOT EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=NEW.waived_by AND role IN ('owner','admin')) OR (auth.uid() IS NOT NULL AND auth.uid()<>NEW.waived_by)) THEN RAISE EXCEPTION 'Use an authorized recorded agreement waiver'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_agreement_waiver BEFORE INSERT OR UPDATE ON public.client_agreements FOR EACH ROW EXECUTE FUNCTION private.guard_agreement_waiver();

-- Every authenticated paid-domain table query still needs the original row policy,
-- AND this state gate. No existing ownership/health/household policy is broadened.
DO $block$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (
 'client_access','profiles','staff_access','staff_permission_catalog','staff_permission_overrides','staff_role_permission_defaults','staff_role_permissions','staff_access_audit','staff_agreements','staff_agreement_acceptances','agreement_templates','client_agreements','agreement_acceptances','journey_enrollment_activations','member_notifications'
 ) LOOP
 EXECUTE format('CREATE POLICY lifecycle_paid_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT private.active_staff_session()) OR (SELECT private.full_member_access())) WITH CHECK ((SELECT private.active_staff_session()) OR (SELECT private.full_member_access()))',t.tablename);
 END LOOP;
END; $block$;
-- The exception list serves authenticated signing/status. Preserve existing row
-- checks, while restricting revoked primary clients and unrelated co-signers.
CREATE POLICY lifecycle_agreement_read ON public.client_agreements AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT private.active_staff_session()) OR EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.user_id=(SELECT auth.uid()) AND ca.contact_id=client_agreements.contact_id AND NOT ca.needs_onboarding_claim AND ca.status IN ('active','onboarding','payment_suspended','ready','invited')));
CREATE POLICY lifecycle_acceptance_read ON public.agreement_acceptances AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT private.active_staff_session()) OR EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.user_id=(SELECT auth.uid()) AND ca.contact_id=agreement_acceptances.contact_id AND NOT ca.needs_onboarding_claim AND ca.status IN ('active','onboarding','payment_suspended','ready','invited')));
CREATE POLICY lifecycle_notification_read ON public.member_notifications AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT private.active_staff_session()) OR (user_id=(SELECT auth.uid()) AND NOT EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.user_id=(SELECT auth.uid()) AND ca.needs_onboarding_claim) AND ((SELECT private.full_member_access()) OR notification_type LIKE 'billing_%' OR notification_type LIKE 'agreement_%' OR notification_type='account_active')));
CREATE POLICY lifecycle_invitation_delivery_private ON public.notification_delivery_jobs AS RESTRICTIVE FOR ALL TO authenticated USING (signer_invitation_id IS NULL) WITH CHECK (signer_invitation_id IS NULL);
CREATE POLICY lifecycle_storage ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT private.active_staff_session()) OR (SELECT private.full_member_access())) WITH CHECK ((SELECT private.active_staff_session()) OR (SELECT private.full_member_access()));
CREATE OR REPLACE FUNCTION private.create_member_coaching_request(p_user_id uuid, p_requested_availability jsonb, p_client_notes text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_contact_id uuid;
  v_journey_id uuid;
  v_coach_id uuid;
  v_id uuid;
begin
  if auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() OR NOT private.full_member_access() then raise exception 'Active member access is required' using errcode='42501'; end if;
  select ca.contact_id,cm.assigned_coach_id
  into v_contact_id,v_coach_id
  from public.client_access ca
  left join public.client_memberships cm on cm.id=ca.membership_id
  where ca.user_id=p_user_id
    and ca.status='active'
  limit 1;

  if v_contact_id is null then
    raise exception 'Active member access is required';
  end if;

  select cj.id
  into v_journey_id
  from public.contact_journeys cj
  where cj.contact_id=v_contact_id
    and cj.status in ('active','paused','nurture')
  order by
    case cj.status when 'active' then 1 when 'paused' then 2 else 3 end,
    cj.created_at desc
  limit 1;

  if v_journey_id is null then
    raise exception 'An active client journey is required';
  end if;

  insert into public.journey_appointments(
    contact_id,journey_id,appointment_type,status,requested_availability,
    client_notes,assigned_to,created_by
  )
  values(
    v_contact_id,v_journey_id,'coaching_session','requested',
    coalesce(p_requested_availability,'[]'::jsonb),
    nullif(trim(p_client_notes),''),
    v_coach_id,p_user_id
  )
  returning id into v_id;

  return v_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.cancel_member_coaching_request(p_user_id uuid, p_appointment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  if auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() OR NOT private.full_member_access() then raise exception 'Active member access is required' using errcode='42501'; end if;
  update public.journey_appointments ja
  set status='cancelled',
      updated_at=now()
  where ja.id=p_appointment_id
    and ja.appointment_type='coaching_session'
    and ja.status in ('requested','scheduled')
    and ja.contact_id in (
      select ca.contact_id
      from public.client_access ca
      where ca.user_id=p_user_id
    );

  return found;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.create_family_change_request(p_user_id uuid, p_request_type text, p_target_household_member_id uuid, p_first_name text, p_last_name text, p_relationship_type text, p_sex text, p_date_of_birth date, p_email text, p_notes text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_contact_id uuid;
  v_household_id uuid;
  v_membership_id uuid;
  v_family_limit integer;
  v_active_members integer;
  v_open_adds integer;
  v_id uuid;
begin
  if auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() OR NOT private.full_member_access() then raise exception 'Active member access is required' using errcode='42501'; end if;
  if p_request_type not in ('add_member','remove_member','update_member') then
    raise exception 'Unsupported family request type';
  end if;

  select ca.contact_id,ca.household_id,ca.membership_id
  into v_contact_id,v_household_id,v_membership_id
  from public.client_access ca
  where ca.user_id=p_user_id
    and ca.status='active'
  limit 1;

  if v_contact_id is null or v_membership_id is null then
    raise exception 'Active member access is required';
  end if;

  select me.limit_value
  into v_family_limit
  from public.membership_entitlements me
  where me.membership_id=v_membership_id
    and me.entitlement_key='family_profiles'
    and me.status='active'
  limit 1;

  if v_family_limit is null then
    raise exception 'Family Hub is not included with this membership';
  end if;

  if p_request_type='add_member' then
    if coalesce(trim(p_first_name),'')='' then
      raise exception 'First name is required';
    end if;

    if p_relationship_type not in ('husband','wife','child','dependent') then
      raise exception 'Choose a valid family relationship';
    end if;

    if p_sex not in ('male','female') then
      raise exception 'Sex must be male or female';
    end if;

    if p_relationship_type='husband' and p_sex<>'male' then
      raise exception 'A husband must be recorded as male';
    end if;

    if p_relationship_type='wife' and p_sex<>'female' then
      raise exception 'A wife must be recorded as female';
    end if;

    select count(*)
    into v_active_members
    from public.household_members hm
    where hm.household_id=v_household_id
      and hm.status='active';

    select count(*)
    into v_open_adds
    from public.family_change_requests fcr
    where fcr.household_id=v_household_id
      and fcr.request_type='add_member'
      and fcr.status in ('submitted','in_review','approved');

    if v_active_members+v_open_adds>=v_family_limit then
      raise exception 'This membership has reached its Family Hub profile limit';
    end if;
  else
    if p_target_household_member_id is null then
      raise exception 'Choose the family member to update';
    end if;

    if not exists(
      select 1
      from public.household_members hm
      where hm.id=p_target_household_member_id
        and hm.household_id=v_household_id
        and hm.status='active'
        and not hm.is_primary
    ) then
      raise exception 'That family member is not available for this request';
    end if;
  end if;

  insert into public.family_change_requests(
    user_id,contact_id,household_id,membership_id,request_type,
    target_household_member_id,first_name,last_name,relationship_type,sex,
    date_of_birth,email,notes,status
  )
  values(
    p_user_id,v_contact_id,v_household_id,v_membership_id,p_request_type,
    p_target_household_member_id,
    nullif(trim(p_first_name),''),
    nullif(trim(p_last_name),''),
    p_relationship_type,p_sex,p_date_of_birth,
    nullif(lower(trim(p_email)),''),
    nullif(trim(p_notes),''),
    'submitted'
  )
  returning id into v_id;

  return v_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.submit_member_companion_question(p_user_id uuid, p_question_type text, p_question text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_contact_id uuid;
  v_membership_id uuid;
  v_mode text;
  v_effective_mode text;
  v_requires_coach boolean;
  v_coach_id uuid;
  v_request_id uuid;
  v_has_knowledge boolean;
  v_usage jsonb;
begin
  if auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() OR NOT private.full_member_access() then raise exception 'Active member access is required' using errcode='42501'; end if;
  if coalesce(length(trim(p_question)),0)<2 or length(trim(p_question))>8000 then
    raise exception 'Question must be between 2 and 8000 characters';
  end if;

  select ca.contact_id,ca.membership_id
    into v_contact_id,v_membership_id
  from public.client_access ca
  where ca.user_id=p_user_id
    and ca.status='active'
  order by ca.updated_at desc
  limit 1;

  if v_contact_id is null or v_membership_id is null then
    raise exception 'Active member access is required';
  end if;

  select qt.handling_mode,qt.requires_coach_assignment
    into v_mode,v_requires_coach
  from public.coach_companion_question_types qt
  where qt.question_type=p_question_type
    and qt.active
    and qt.member_visible
  limit 1;

  if v_mode is null then
    raise exception 'Choose a valid question category';
  end if;

  v_usage := private.consume_ai_advisor_entitlement(v_membership_id);

  select exists(
    select 1
    from public.coach_companion_knowledge_chunks ch
    join public.coach_companion_knowledge_sources s on s.id=ch.source_id
    where ch.active
      and ch.embedding is not null
      and s.status='approved'
  ) into v_has_knowledge;

  v_effective_mode:=case
    when v_mode='answer_if_supported' and not coalesce(v_has_knowledge,false)
      then 'coach_review'
    else v_mode
  end;

  if v_requires_coach or v_effective_mode<>'answer_if_supported' then
    select cca.coach_user_id
      into v_coach_id
    from public.client_coach_assignments cca
    where cca.contact_id=v_contact_id
      and cca.role='primary'
      and cca.status='active'
    limit 1;
  end if;

  insert into public.coach_companion_requests(
    contact_id,membership_id,requested_by_user_id,question_type,question,
    handling_mode,status,assigned_coach_id,metadata
  )
  values(
    v_contact_id,v_membership_id,p_user_id,p_question_type,trim(p_question),
    v_effective_mode,
    case when v_effective_mode='answer_if_supported' then 'queued' else 'coach_review' end,
    v_coach_id,
    jsonb_build_object(
      'source','member_app',
      'configured_handling_mode',v_mode,
      'knowledge_available',coalesce(v_has_knowledge,false),
      'usage',v_usage
    )
  )
  returning id into v_request_id;

  insert into public.coach_companion_usage_events(
    request_id,membership_id,contact_id,user_id,event_type,metadata
  )
  values(
    v_request_id,v_membership_id,v_contact_id,p_user_id,'question_submitted',
    jsonb_build_object('question_type',p_question_type,'usage',v_usage)
  );

  if v_effective_mode in ('coach_review','block_and_escalate') then
    perform private.create_companion_review(
      v_request_id,
      case
        when v_mode='answer_if_supported' and not coalesce(v_has_knowledge,false)
          then 'Approved Coach Companion knowledge is not yet available. Routed to human review.'
        when v_effective_mode='block_and_escalate'
          then 'Member question requires human review before any response.'
        else 'Member question routed to coach review.'
      end
    );

    insert into public.coach_companion_usage_events(
      request_id,membership_id,contact_id,user_id,event_type,metadata
    )
    values(
      v_request_id,v_membership_id,v_contact_id,p_user_id,
      case when v_effective_mode='block_and_escalate' then 'escalated' else 'coach_reviewed' end,
      jsonb_build_object('automatic_routing',true,'handling_mode',v_effective_mode)
    );
  end if;

  return v_request_id;
end;
$function$
;

-- Narrow public invoker API, service-only outbox eligibility (no token retrieval).
CREATE FUNCTION private.signer_invitation_deliverable(p_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,private AS $$ SELECT EXISTS(SELECT 1 FROM private.agreement_signer_invitations WHERE id=p_id AND revoked_at IS NULL AND redeemed_at IS NULL AND expires_at>now()); $$;
CREATE FUNCTION public.signer_invitation_deliverable(p_invitation_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.signer_invitation_deliverable(p_invitation_id); $$;
DO $priv$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('private','public') AND p.proname IN (
 'enrollment_payment_satisfied','agreement_signatures_satisfied','full_member_access','active_staff_session','member_paid_access_allowed','lock_enrollment_payment','refresh_client_lifecycle','refresh_lifecycle_from_activation','audit_client_access_transition','freeze_signed_agreement','agreement_signer_role','invite_agreement_signer','invite_secondary_signer','redeem_signer_invitation','redeem_secondary_signer_invitation','revoke_signer_invitation','revoke_secondary_signer_invitation','client_onboarding_context','my_onboarding_context','set_enrollment_waiver','guard_enrollment_waiver','guard_agreement_waiver','signer_invitation_deliverable') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.sig);
 END LOOP;
END; $priv$;
GRANT EXECUTE ON FUNCTION private.full_member_access(),private.active_staff_session(),public.member_paid_access_allowed(),private.agreement_signer_role(uuid),private.invite_agreement_signer(uuid,text),public.invite_secondary_signer(uuid,text),private.redeem_signer_invitation(text),public.redeem_secondary_signer_invitation(text),private.revoke_signer_invitation(uuid),public.revoke_secondary_signer_invitation(uuid),private.client_onboarding_context(),public.my_onboarding_context(),private.set_enrollment_waiver(uuid,uuid,text,boolean,text),public.set_enrollment_waiver(uuid,uuid,text,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.signer_invitation_deliverable(uuid),public.signer_invitation_deliverable(uuid) TO service_role;
-- Pre-activation login uses normal verified Auth; the journey link grants only
-- the recipient's enrollment. A link cannot bind an arbitrary Auth identity.
CREATE FUNCTION private.claim_onboarding_enrollment(p_token text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private,extensions AS $$
DECLARE l public.journey_access_links%rowtype; v_email text; v_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF coalesce(p_token,'') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Enrollment invitation unavailable'; END IF;
 SELECT * INTO l FROM public.journey_access_links WHERE token_hash=encode(extensions.digest(p_token,'sha256'),'hex') AND active AND expires_at>now() FOR UPDATE;
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF l.id IS NULL OR v_email IS NULL OR NOT EXISTS(SELECT 1 FROM public.contacts WHERE id=l.contact_id AND lower(email)=v_email) OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND contact_id=l.contact_id) THEN RAISE EXCEPTION 'Enrollment invitation unavailable for this verified account' USING ERRCODE='42501'; END IF;
 SELECT cm.activation_id INTO v_id FROM public.client_access ca JOIN public.client_memberships cm ON cm.id=ca.membership_id WHERE ca.contact_id=l.contact_id AND ca.status NOT IN ('inactive','suspended') AND cm.status NOT IN ('cancelled','completed') AND (ca.user_id IS NULL OR ca.user_id=auth.uid());
 IF v_id IS NULL THEN RAISE EXCEPTION 'Enrollment access is unavailable; contact support'; END IF;
 UPDATE public.client_access SET user_id=auth.uid(),needs_onboarding_claim=false,invited_at=coalesce(invited_at,now()) WHERE contact_id=l.contact_id;
 UPDATE public.journey_access_links SET last_used_at=now() WHERE id=l.id;
 PERFORM private.refresh_client_lifecycle(v_id);
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(l.contact_id,'onboarding_access_claimed','Verified client opened onboarding',auth.uid(),jsonb_build_object('activation_id',v_id));
 RETURN v_id;
END; $$;
CREATE FUNCTION public.claim_onboarding_enrollment(p_token text) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.claim_onboarding_enrollment(p_token); $$;
REVOKE ALL ON FUNCTION private.claim_onboarding_enrollment(text),public.claim_onboarding_enrollment(text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION private.claim_onboarding_enrollment(text),public.claim_onboarding_enrollment(text) TO authenticated;

CREATE FUNCTION private.guard_client_paid_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF NEW.status='active' AND auth.role() IN ('authenticated','service_role') AND NOT EXISTS(SELECT 1 FROM public.client_memberships cm JOIN public.journey_enrollment_activations a ON a.id=cm.activation_id WHERE cm.id=NEW.membership_id AND cm.primary_contact_id=NEW.contact_id AND private.enrollment_gates_complete(a)) THEN RAISE EXCEPTION 'Payment and required agreements must be complete before full access'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_client_paid_access() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER guard_client_paid_access BEFORE INSERT OR UPDATE ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.guard_client_paid_access();

CREATE FUNCTION private.client_agreement_action(p_id uuid,p_action text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE a public.client_agreements%rowtype;
BEGIN
 SELECT * INTO a FROM public.client_agreements WHERE id=p_id;
 PERFORM 1 FROM public.journey_enrollment_activations WHERE id=a.activation_id FOR UPDATE;
 SELECT * INTO a FROM public.client_agreements WHERE id=p_id FOR UPDATE;
 IF auth.uid() IS NULL OR private.agreement_signer_role(p_id) IS NULL THEN RAISE EXCEPTION 'Agreement not available' USING ERRCODE='42501'; END IF;
 IF p_action='view' THEN
 UPDATE public.client_agreements SET status='viewed',viewed_at=coalesce(viewed_at,now()) WHERE id=p_id AND status='sent';
 ELSIF p_action='decline' THEN
 IF a.status IN ('signed','waived') THEN RAISE EXCEPTION 'Completed agreement cannot be declined'; END IF;
 UPDATE public.client_agreements SET status='declined',declined_at=now() WHERE id=p_id;
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(a.contact_id,'agreement_declined','Agreement declined',auth.uid(),jsonb_build_object('agreement_id',a.id));
 ELSE RAISE EXCEPTION 'Invalid agreement action'; END IF;
END; $$;
CREATE FUNCTION public.client_agreement_action(p_client_agreement_id uuid,p_action text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.client_agreement_action(p_client_agreement_id,p_action); $$;
REVOKE ALL ON FUNCTION private.client_agreement_action(uuid,text),public.client_agreement_action(uuid,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION private.client_agreement_action(uuid,text),public.client_agreement_action(uuid,text) TO authenticated;
CREATE POLICY lifecycle_template_read ON public.agreement_templates AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT private.active_staff_session()) OR EXISTS(SELECT 1 FROM public.client_agreements a WHERE a.agreement_template_id=agreement_templates.id) OR EXISTS(SELECT 1 FROM public.staff_agreements a WHERE a.agreement_template_id=agreement_templates.id AND a.staff_user_id=(SELECT auth.uid())));

CREATE FUNCTION private.audit_lifecycle_gate_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_old text; v_new text; v_reason text; v_actor uuid;
BEGIN
 IF TG_TABLE_NAME='client_agreements' THEN
 v_old:=CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END;v_new:=NEW.status;v_reason:=NEW.waiver_reason;v_actor:=coalesce(auth.uid(),NEW.waived_by);
 ELSE
 v_old:=CASE WHEN TG_OP='UPDATE' THEN OLD.payment_status ELSE NULL END;v_new:=NEW.payment_status;v_reason:=NEW.payment_waiver_reason;v_actor:=coalesce(auth.uid(),NEW.last_manual_override_by);
 END IF;
 IF v_old IS DISTINCT FROM v_new AND (v_old='waived' OR v_new='waived') THEN
 INSERT INTO public.contact_activity(contact_id,activity_type,title,detail,actor_user_id,metadata) VALUES(NEW.contact_id,'enrollment_waiver_change','Enrollment waiver changed',v_reason,v_actor,jsonb_build_object('entity',TG_TABLE_NAME,'entity_id',NEW.id,'from',v_old,'to',v_new));
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.audit_lifecycle_gate_change() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER audit_lifecycle_payment_waiver AFTER INSERT OR UPDATE ON public.journey_enrollment_activations FOR EACH ROW EXECUTE FUNCTION private.audit_lifecycle_gate_change();
CREATE TRIGGER audit_lifecycle_agreement_waiver AFTER INSERT OR UPDATE ON public.client_agreements FOR EACH ROW EXECUTE FUNCTION private.audit_lifecycle_gate_change();
CREATE INDEX enrollment_payment_waiver_actor ON public.journey_enrollment_activations(payment_waived_by) WHERE payment_waived_by IS NOT NULL;

CREATE OR REPLACE FUNCTION public.waive_client_agreement(p_client_agreement_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  a public.client_agreements%rowtype;
  v_role text;
begin
  select role into v_role
  from public.staff_access
  where user_id=(select auth.uid())
    and status='active';

  if v_role not in ('owner','admin') then
    raise exception 'Only Owner/Admin can waive a client agreement';
  end if;

  if nullif(trim(p_reason),'') is null then
    raise exception 'Waiver reason is required';
  end if;

  select * into a from public.client_agreements where id=p_client_agreement_id;
  if a.id is null then raise exception 'Client agreement not found'; end if;
  if a.activation_id IS NOT NULL then
    perform private.set_enrollment_waiver(a.activation_id,a.id,'agreement',true,p_reason);
    return;
  end if;
  if a.status='signed' then raise exception 'Signed agreements cannot be waived'; end if;

  update public.client_agreements
  set status='waived',
      waived_at=now(),
      waived_by=(select auth.uid()),
      waiver_reason=trim(p_reason),
      updated_at=now()
  where id=a.id;

  insert into public.contact_activity(
    contact_id,activity_type,title,detail,actor_user_id,metadata
  )
  values(
    a.contact_id,'agreement_waived','Agreement requirement waived',
    trim(p_reason),(select auth.uid()),
    jsonb_build_object('client_agreement_id',a.id)
  );
end;
$function$
;
-- Cache request identity for the four existing security-gate policies flagged
-- by local Performance Advisor; their permission/scope predicates are unchanged.
DO $policies$ DECLARE p record; stmt text; BEGIN
 FOR p IN SELECT pol.polname,pol.polrelid::regclass AS relation,pg_get_expr(pol.polqual,pol.polrelid) AS qual,pg_get_expr(pol.polwithcheck,pol.polrelid) AS check_expr FROM pg_policy pol WHERE pol.polname IN ('staff_access_team_read','journey_enrollment_activations_owner_admin_insert','journey_enrollment_activations_owner_admin_update','journey_enrollment_activations_staff_read') LOOP
 stmt:=format('ALTER POLICY %I ON %s',p.polname,p.relation);
 IF p.qual IS NOT NULL THEN stmt:=stmt||' USING ('||replace(p.qual,'auth.uid()','(SELECT auth.uid())')||')'; END IF;
 IF p.check_expr IS NOT NULL THEN stmt:=stmt||' WITH CHECK ('||replace(p.check_expr,'auth.uid()','(SELECT auth.uid())')||')'; END IF;
 EXECUTE stmt;
 END LOOP;
END; $policies$;
-- Readiness counts also describe distinct authenticated identities.
CREATE OR REPLACE VIEW public.admin_enrollment_readiness WITH (security_invoker=true) AS  WITH payment_totals AS (
         SELECT pr.activation_id,
            COALESCE(sum(pr.amount_cents) FILTER (WHERE (pr.transaction_type = ANY (ARRAY['payment'::text, 'adjustment'::text])) AND pr.status = 'recorded'::text), 0::bigint) AS gross_paid_cents,
            COALESCE(sum(pr.amount_cents) FILTER (WHERE (pr.transaction_type = ANY (ARRAY['refund'::text, 'reversal'::text])) AND pr.status = 'recorded'::text), 0::bigint) AS refunded_cents
           FROM payment_records pr
          WHERE pr.activation_id IS NOT NULL
          GROUP BY pr.activation_id
        ), agreement_rollup AS (
         SELECT ca.activation_id,
            count(*)::integer AS agreement_count,
            count(*) FILTER (WHERE ca.status = 'signed'::text)::integer AS signed_agreements,
            count(*) FILTER (WHERE ca.status = 'waived'::text)::integer AS waived_agreements,
            count(*) FILTER (WHERE ca.status = 'declined'::text)::integer AS declined_agreements,
            count(*) FILTER (WHERE ca.status <> ALL (ARRAY['signed'::text, 'waived'::text]))::integer AS incomplete_agreements,
            COALESCE(sum(ca.required_client_signatures) FILTER (WHERE ca.status<>'waived'), 0::bigint)::integer AS required_signatures,
            COALESCE(sum(( SELECT count(DISTINCT aa.signed_by_user_id) AS count
                   FROM agreement_acceptances aa
                  WHERE ca.status<>'waived' AND aa.client_agreement_id = ca.id AND aa.accepted_terms AND aa.content_hash=coalesce(ca.rendered_content_hash,ca.content_hash) AND (aa.signer_role = ANY (ARRAY['primary_client'::text, 'secondary_client'::text])))), 0::numeric)::integer AS collected_signatures
           FROM client_agreements ca
          WHERE ca.activation_id IS NOT NULL
          GROUP BY ca.activation_id
        )
 SELECT a.id AS activation_id,
    a.contact_id,
    c.first_name,
    c.last_name,
    c.email,
    a.program_code,
    a.program_name,
    a.billing_choice,
    a.amount_cents AS agreed_amount_cents,
    a.currency,
    a.payment_status,
    COALESCE(pt.gross_paid_cents, 0::bigint) AS gross_paid_cents,
    COALESCE(pt.refunded_cents, 0::bigint) AS refunded_cents,
    GREATEST(COALESCE(pt.gross_paid_cents, 0::bigint) - COALESCE(pt.refunded_cents, 0::bigint), 0::bigint) AS net_paid_cents,
    GREATEST(COALESCE(a.amount_cents, 0) - GREATEST(COALESCE(pt.gross_paid_cents, 0::bigint) - COALESCE(pt.refunded_cents, 0::bigint), 0::bigint), 0::bigint) AS remaining_balance_cents,
    a.agreement_status,
    COALESCE(ar.agreement_count, 0) AS agreement_count,
    COALESCE(ar.signed_agreements, 0) AS signed_agreements,
    COALESCE(ar.waived_agreements, 0) AS waived_agreements,
    COALESCE(ar.declined_agreements, 0) AS declined_agreements,
    COALESCE(ar.incomplete_agreements, 0) AS incomplete_agreements,
    COALESCE(ar.required_signatures, 0) AS required_signatures,
    COALESCE(ar.collected_signatures, 0) AS collected_signatures,
    a.access_status,
    array_remove(ARRAY[
        CASE
            WHEN a.payment_status <> ALL (ARRAY['paid'::text, 'waived'::text]) THEN 'payment_incomplete'::text
            ELSE NULL::text
        END,
        CASE
            WHEN a.payment_status <> 'waived'::text AND a.amount_cents IS NOT NULL AND GREATEST(COALESCE(pt.gross_paid_cents, 0::bigint) - COALESCE(pt.refunded_cents, 0::bigint), 0::bigint) < a.amount_cents THEN 'payment_amount_short'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(ar.declined_agreements, 0) > 0 THEN 'agreement_declined'::text
            ELSE NULL::text
        END,
        CASE
            WHEN a.agreement_status <> ALL (ARRAY['signed'::text, 'waived'::text]) OR COALESCE(ar.incomplete_agreements,0)>0 OR (a.agreement_status='signed' AND COALESCE(ar.agreement_count,0)=0) THEN 'agreement_incomplete'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(ar.collected_signatures, 0) < COALESCE(ar.required_signatures, 0) THEN 'required_signatures_missing'::text
            ELSE NULL::text
        END,
        CASE
            WHEN (a.payment_status = ANY (ARRAY['paid'::text, 'waived'::text])) AND (a.agreement_status = ANY (ARRAY['signed'::text, 'waived'::text])) AND (a.access_status <> ALL (ARRAY['ready'::text, 'active'::text])) THEN 'access_not_ready'::text
            ELSE NULL::text
        END], NULL::text) AS blockers,
    private.enrollment_gates_complete(a) AS ready_for_access,
    a.created_at,
    a.updated_at
   FROM journey_enrollment_activations a
     JOIN contacts c ON c.id = a.contact_id
     LEFT JOIN payment_totals pt ON pt.activation_id = a.id
     LEFT JOIN agreement_rollup ar ON ar.activation_id = a.id
  WHERE private.staff_has_permission(( SELECT auth.uid() AS uid), 'finance.view'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), a.contact_id);
CREATE OR REPLACE VIEW public.my_enrollment_readiness WITH (security_invoker=true) AS  SELECT a.id AS activation_id,
    a.program_code,
    a.program_name,
    a.amount_cents AS agreed_amount_cents,
    a.currency,
    a.payment_status,
    a.agreement_status,
    a.access_status,
    COALESCE(( SELECT count(*)::integer AS count
           FROM client_agreements ca_1
          WHERE ca_1.activation_id = a.id AND (ca_1.status <> ALL (ARRAY['signed'::text, 'waived'::text]))), 0) AS incomplete_agreements,
    COALESCE(( SELECT sum(ca_1.required_client_signatures) FILTER (WHERE ca_1.status<>'waived')::integer AS sum
           FROM client_agreements ca_1
          WHERE ca_1.activation_id = a.id), 0) AS required_signatures,
    COALESCE(( SELECT count(*)::integer AS count
           FROM agreement_acceptances aa
             JOIN client_agreements ca_1 ON ca_1.id = aa.client_agreement_id
          WHERE ca_1.activation_id = a.id AND ca_1.status<>'waived' AND aa.accepted_terms AND aa.content_hash=coalesce(ca_1.rendered_content_hash,ca_1.content_hash) AND (aa.signer_role = ANY (ARRAY['primary_client'::text, 'secondary_client'::text]))), 0) AS collected_signatures,
    private.enrollment_gates_complete(a) AS enrollment_requirements_complete
   FROM journey_enrollment_activations a
     JOIN client_access ca ON ca.contact_id = a.contact_id
  WHERE ca.user_id = (( SELECT auth.uid() AS uid)) AND ca.status = 'active'::text
  ORDER BY a.created_at DESC
 LIMIT 1;
CREATE POLICY lifecycle_enrollment_read ON public.journey_enrollment_activations AS RESTRICTIVE FOR SELECT TO authenticated USING ((SELECT private.active_staff_session()) OR EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.user_id=(SELECT auth.uid()) AND ca.contact_id=journey_enrollment_activations.contact_id AND NOT ca.needs_onboarding_claim AND ca.status IN ('active','onboarding','payment_suspended','ready','invited')));

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

  if v_origin is distinct from 'https://revitalizedacademy.com'
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

  if v_origin is distinct from 'https://revitalizedacademy.com'
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
      when a.program_code='holistic-foundations'
        and not private.production_client_agreement_publication_released()
      then false
      when exists (
        select 1
        from public.program_agreement_requirements par
        where par.program_code=a.program_code
          and (par.billing_choice is null or par.billing_choice=a.billing_choice)
          and (par.currency is null or par.currency=a.currency)
          and par.active
          and par.required
      ) then
        not exists (
          select 1
          from public.program_agreement_requirements par
          where par.program_code=a.program_code
            and (par.billing_choice is null or par.billing_choice=a.billing_choice)
            and (par.currency is null or par.currency=a.currency)
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
      when a.program_code='holistic-foundations' then false
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
  v_activation public.journey_enrollment_activations%rowtype;
  v_required integer:=0;
  v_satisfied integer:=0;
  v_declined integer:=0;
  v_sent integer:=0;
begin
  if NEW.activation_id is null then return NEW; end if;

  select a.*
  into v_activation
  from public.journey_enrollment_activations a
  where a.id=NEW.activation_id;

  select count(*)
  into v_required
  from public.program_agreement_requirements par
  where par.program_code=v_activation.program_code
    and (par.billing_choice is null or par.billing_choice=v_activation.billing_choice)
    and (par.currency is null or par.currency=v_activation.currency)
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
    where par.program_code=v_activation.program_code
      and (par.billing_choice is null or par.billing_choice=v_activation.billing_choice)
      and (par.currency is null or par.currency=v_activation.currency)
      and par.active
      and par.required;
  elsif v_activation.program_code='holistic-foundations' then
    -- Missing or mismatched legal mapping is an unsatisfied required agreement,
    -- never a reason to accept a legacy agreement as a fallback.
    v_required:=1;
    v_satisfied:=0;
    v_declined:=0;
    v_sent:=0;
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


-- Canonical production onboarding origin. No staging identity/recipient/configuration import.
INSERT INTO public.app_runtime_config(config_key,config_value,description,member_visible,active)
VALUES('client_onboarding','{"origin":"https://revitalizedacademy.com"}'::jsonb,'Production verified client onboarding',false,true)
ON CONFLICT(config_key) DO UPDATE SET config_value=excluded.config_value,active=true;
-- Payment status cannot be hand-set or waived, and no browser payment URL is accepted.
CREATE FUNCTION private.guard_production_payment_hold() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.payment_url IS NOT NULL OR NEW.payment_status IN ('paid','waived','partially_paid') THEN
  RAISE EXCEPTION 'Payments v1 is not released. Payment Pending / Payment Link Coming Soon.' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_production_payment_hold() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER a0_production_payment_hold BEFORE INSERT OR UPDATE ON public.journey_enrollment_activations
FOR EACH ROW EXECUTE FUNCTION private.guard_production_payment_hold();
CREATE FUNCTION private.deny_unreleased_production_payment() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Production payment recording is held until Payments v1 acceptance' USING ERRCODE='42501'; END $$;
REVOKE ALL ON FUNCTION private.deny_unreleased_production_payment() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER a_production_payment_record_hold BEFORE INSERT OR UPDATE OR DELETE ON public.payment_records
FOR EACH ROW EXECUTE FUNCTION private.deny_unreleased_production_payment();

-- Production counterpart of the accepted enrollment contract; no recipient registry or synthetic payment path.
create function private.require_production_enrollment_owner(p_contact_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin

 if auth.uid() is null or not exists(select 1 from public.staff_access where user_id=auth.uid() and role in ('owner','admin') and status='active' and onboarding_status='complete') or not private.staff_has_permission(auth.uid(),'finance.manage') or not private.staff_can_access_contact(auth.uid(),p_contact_id) then raise exception 'Authorized Owner/Administrator and contact scope required' using errcode='42501'; end if;
 if not exists(select 1 from public.contacts where id=p_contact_id and record_kind='crm') then raise exception 'Existing client contact required' using errcode='22023'; end if;
end $$;

create function private.production_client_enrollment_state(p_contact_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare a public.journey_enrollment_activations%rowtype; c public.contacts%rowtype; delivery jsonb;
begin
 perform private.require_production_enrollment_owner(p_contact_id);
 select * into c from public.contacts where id=p_contact_id;
 select * into a from public.journey_enrollment_activations where contact_id=p_contact_id order by created_at desc limit 1;
 select jsonb_build_object('status',d.status,'provider_accepted',d.provider_message_id is not null,'updated_at',d.updated_at)
 into delivery from public.notification_delivery_jobs d join public.client_agreements g on g.id=d.client_agreement_id
 where g.activation_id=a.id order by d.created_at desc limit 1;
 return jsonb_build_object('email',c.email,'recipient_approved',true,
 'enrollment_created',a.id is not null,'program_code',a.program_code,'program_name',a.program_name,
 'billing_choice',a.billing_choice,'amount_cents',a.amount_cents,'currency',a.currency,
 'agreement_status',a.agreement_status,'payment_status',a.payment_status,'activation_status',a.access_status,
 'agreement_publication_status',(select config_value->>'status' from public.app_runtime_config where config_key='production_client_agreement_publication' and active),
 'agreement_publication_reason',(select config_value->>'reason' from public.app_runtime_config where config_key='production_client_agreement_publication' and active),
 'agreement_mapping_ready',private.production_client_agreement_publication_released() and exists(select 1 from public.program_agreement_requirements r join public.agreement_templates t on t.id=r.agreement_template_id where r.program_code=a.program_code and (r.billing_choice is null or r.billing_choice=a.billing_choice) and (r.currency is null or r.currency=a.currency) and r.active and r.required and t.status='published' and t.audience='client' and t.document_type='client_contract'),'agreement_count',(select count(*) from public.client_agreements where activation_id=a.id),
 'invitation',delivery,'ready_for_access',case when a.id is not null then private.enrollment_gates_complete(a) else false end,
 'member_access',(select status from public.client_access where contact_id=p_contact_id),
 'account_claimed',(select user_id is not null and not needs_onboarding_claim from public.client_access where contact_id=p_contact_id),
 'membership_status',(select cm.status from public.client_access ca join public.client_memberships cm on cm.id=ca.membership_id where ca.contact_id=p_contact_id));
end $$;

create function private.save_production_client_enrollment(p_contact_id uuid,p_program_code text,p_billing_choice text,p_amount_cents integer,p_currency text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.journey_enrollment_activations%rowtype; p public.program_catalog%rowtype; j uuid; s uuid;
begin
 perform private.require_production_enrollment_owner(p_contact_id);
 -- Contact lock serializes retries, even before an activation exists.
 perform 1 from public.contacts where id=p_contact_id for update;
 select * into p from public.program_catalog where program_code=p_program_code and active;
 if not found or p_program_code<>'holistic-foundations' or (p_billing_choice,p_amount_cents) not in (('monthly',8900),('one_time',96000)) or p_amount_cents is null or p_amount_cents<0 or p_currency is distinct from 'CAD' or p_billing_choice not in ('monthly','one_time') or p_billing_choice is null then raise exception 'Holistic Foundations requires CAD 89/month or CAD 960 pay-in-full billing intent' using errcode='22023'; end if;
 select * into a from public.journey_enrollment_activations where contact_id=p_contact_id order by created_at desc limit 1 for update;
 if a.id is not null then
  if (a.program_code,a.billing_choice,a.amount_cents,a.currency) is not distinct from (p_program_code,p_billing_choice,p_amount_cents,p_currency) then return private.production_client_enrollment_state(p_contact_id); end if;
  if exists(select 1 from public.client_agreements where activation_id=a.id) or exists(select 1 from public.payment_records where activation_id=a.id) or exists(select 1 from public.client_memberships where activation_id=a.id) then raise exception 'Issued enrollment terms are locked. Review the existing agreement/payment workflow instead of replacing it.' using errcode='22023'; end if;
  update public.journey_enrollment_activations set program_code=p.program_code,program_name=p.name,billing_choice=p_billing_choice,amount_cents=p_amount_cents,currency=p_currency,commitment_months=case when p_billing_choice='monthly' then 6 else 12 end,updated_at=now() where id=a.id;
 else
  select cj.id into j from public.contact_journeys cj where cj.contact_id=p_contact_id and cj.status in ('active','paused','nurture') and exists(select 1 from public.contact_journey_steps where journey_id=cj.id and step_key='payment_agreement') order by cj.created_at desc limit 1;
  if j is null then j:=public.ensure_contact_journey(p_contact_id,'direct_membership',jsonb_build_object('source','production_owner_enrollment')); end if;
  select id into s from public.contact_journey_steps where journey_id=j and step_key='payment_agreement';
  if s is null then raise exception 'Existing enrollment journey has no payment/agreement step' using errcode='22023'; end if;
  insert into public.journey_enrollment_activations(contact_id,journey_id,journey_step_id,program_code,program_name,billing_choice,amount_cents,currency,commitment_months,created_by)
  values(p_contact_id,j,s,p.program_code,p.name,p_billing_choice,p_amount_cents,p_currency,case when p_billing_choice='monthly' then 6 else 12 end,auth.uid());
 end if;
 insert into public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) values(p_contact_id,'production_enrollment_configured','Production enrollment configured; invitation not sent',auth.uid(),jsonb_build_object('program_code',p_program_code));
 return private.production_client_enrollment_state(p_contact_id);
end $$;

create function public.production_client_enrollment_state(p_contact_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$ select private.production_client_enrollment_state(p_contact_id) $$;
create function public.save_production_client_enrollment(p_contact_id uuid,p_program_code text,p_billing_choice text,p_amount_cents integer,p_currency text) returns jsonb language sql security invoker set search_path='' as $$ select private.save_production_client_enrollment(p_contact_id,p_program_code,p_billing_choice,p_amount_cents,p_currency) $$;
revoke all on function private.require_production_enrollment_owner(uuid),private.production_client_enrollment_state(uuid),private.save_production_client_enrollment(uuid,text,text,integer,text),public.production_client_enrollment_state(uuid),public.save_production_client_enrollment(uuid,text,text,integer,text) from public,anon,service_role;
grant execute on function private.require_production_enrollment_owner(uuid),private.production_client_enrollment_state(uuid),private.save_production_client_enrollment(uuid,text,text,integer,text),public.production_client_enrollment_state(uuid),public.save_production_client_enrollment(uuid,text,text,integer,text) to authenticated;

-- Included in the pending production forward migration. Not a standalone hosted script.
CREATE TABLE private.production_client_creation_requests (
 request_id uuid PRIMARY KEY,
 actor_user_id uuid NOT NULL REFERENCES auth.users(id),
 payload_hash text NOT NULL,
 contact_id uuid NOT NULL REFERENCES public.contacts(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.production_client_creation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.production_client_creation_requests FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION private.create_production_client(p_request_id uuid,p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
#variable_conflict use_variable
DECLARE c public.contacts%rowtype; r private.production_client_creation_requests%rowtype;
 e text; phone text; source text; h text; ids uuid[]; k text; ref text; rep text; other text;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=auth.uid() AND role IN ('owner','admin') AND status='active' AND onboarding_status='complete')
 OR NOT private.staff_has_permission(auth.uid(),'crm.manage') THEN RAISE EXCEPTION 'Authorized Owner/Administrator required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Request ID and client details required' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload) x WHERE x NOT IN ('first_name','last_name','email','phone','city','state','country','source','referral_source','sales_rep_name','referral_source_other')) THEN RAISE EXCEPTION 'Unsupported client field' USING ERRCODE='22023'; END IF;
 e:=nullif(lower(trim(p_payload->>'email')),'');
 phone:=nullif(regexp_replace(coalesce(p_payload->>'phone',''),'[^0-9]','','g'),'');
 IF length(phone)=11 AND left(phone,1)='1' THEN phone:=substring(phone FROM 2); END IF;
 source:=coalesce(nullif(trim(p_payload->>'source'),''),'manual_staff_entry');
 ref:=nullif(trim(p_payload->>'referral_source'),'');
 rep:=CASE WHEN ref='Sales Rep' THEN nullif(trim(p_payload->>'sales_rep_name'),'') END;
 other:=CASE WHEN ref='Other' THEN nullif(trim(p_payload->>'referral_source_other'),'') END;
 IF coalesce(length(trim(p_payload->>'first_name')),0) NOT BETWEEN 1 AND 100 OR coalesce(length(trim(p_payload->>'last_name')),0) NOT BETWEEN 1 AND 100
 OR (e IS NULL AND phone IS NULL) OR (e IS NOT NULL AND (length(e)>254 OR e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
 OR (phone IS NOT NULL AND length(phone) NOT BETWEEN 8 AND 15) OR length(source)>160 OR length(ref)>160 OR length(rep)>160 OR length(other)>240
 OR (ref='Sales Rep' AND rep IS NULL) OR (ref='Other' AND other IS NULL) THEN RAISE EXCEPTION 'Valid name, contact details and conditional source details required' USING ERRCODE='22023'; END IF;
 h:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 -- Serialize the request and both identities in deterministic order. Never use ILIKE.
 FOR k IN SELECT DISTINCT v FROM unnest(ARRAY['request:'||p_request_id::text,'email:'||e,'phone:'||phone]) v WHERE v IS NOT NULL ORDER BY v LOOP
  PERFORM pg_advisory_xact_lock(hashtextextended('rva-production-client:'||k,0));
 END LOOP;
 SELECT * INTO r FROM private.production_client_creation_requests WHERE request_id=p_request_id;
 IF r.request_id IS NOT NULL THEN
  IF r.actor_user_id<>auth.uid() OR r.payload_hash<>h OR NOT private.staff_can_access_contact(auth.uid(),r.contact_id) THEN RAISE EXCEPTION 'Request is unavailable or details changed' USING ERRCODE='42501'; END IF;
  RETURN r.contact_id;
 END IF;
 SELECT array_agg(id) INTO ids FROM public.contacts WHERE (e IS NOT NULL AND lower(trim(email))=e)
 OR (phone IS NOT NULL AND CASE WHEN length(regexp_replace(coalesce(contacts.phone,''),'[^0-9]','','g'))=11 AND left(regexp_replace(coalesce(contacts.phone,''),'[^0-9]','','g'),1)='1' THEN substring(regexp_replace(coalesce(contacts.phone,''),'[^0-9]','','g') FROM 2) ELSE regexp_replace(coalesce(contacts.phone,''),'[^0-9]','','g') END=phone);
 IF cardinality(ids)>1 THEN RAISE EXCEPTION 'Ambiguous existing identity; review the existing records' USING ERRCODE='22023'; END IF;
 IF cardinality(ids)=1 THEN
  SELECT * INTO c FROM public.contacts WHERE id=ids[1] FOR UPDATE;
  IF NOT private.staff_can_access_contact(auth.uid(),c.id) OR c.record_kind<>'crm' THEN RAISE EXCEPTION 'Contact scope required' USING ERRCODE='42501'; END IF;
  IF e IS NOT NULL AND c.email IS NOT NULL AND lower(trim(c.email))<>e THEN RAISE EXCEPTION 'Phone belongs to a different email; review the existing identity' USING ERRCODE='22023'; END IF;
  -- Preserve original attribution and identity. An existing contact is reused, not renamed.
  UPDATE public.contacts SET email=coalesce(email,e),phone=coalesce(contacts.phone,phone),
   referral_source=coalesce(contacts.referral_source,ref),
   sales_rep_name=CASE WHEN contacts.referral_source IS NULL THEN rep ELSE contacts.sales_rep_name END,
   referral_source_other=CASE WHEN contacts.referral_source IS NULL THEN other ELSE contacts.referral_source_other END,
   first_source=coalesce(first_source,source),last_source=source,updated_at=now() WHERE id=c.id;
 ELSE
  INSERT INTO public.contacts(first_name,last_name,email,phone,city,state,country,first_source,last_source,referral_source,sales_rep_name,referral_source_other)
  VALUES(trim(p_payload->>'first_name'),trim(p_payload->>'last_name'),e,phone,left(p_payload->>'city',160),left(p_payload->>'state',160),left(p_payload->>'country',160),source,source,ref,rep,other) RETURNING * INTO c;
 END IF;
 INSERT INTO private.production_client_creation_requests(request_id,actor_user_id,payload_hash,contact_id) VALUES(p_request_id,auth.uid(),h,c.id);
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(c.id,'production_client_record_prepared','Production client record prepared; enrollment and invitation remain separate',auth.uid(),jsonb_build_object('request_id',p_request_id));
 RETURN c.id;
END $$;
CREATE FUNCTION public.create_production_client(p_request_id uuid,p_payload jsonb) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.create_production_client(p_request_id,p_payload); $$;
REVOKE ALL ON FUNCTION private.create_production_client(uuid,jsonb),public.create_production_client(uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION private.create_production_client(uuid,jsonb),public.create_production_client(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.prepare_client_contract(p_contact_id uuid, p_agreement_template_id uuid, p_merge_values jsonb, p_send boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'extensions'
AS $function$
declare
  t public.agreement_templates%rowtype;
  m public.client_memberships%rowtype;
  a public.client_agreements%rowtype;
  v_rendered text;
  v_hash text;
  v_user uuid;
  v_required_signatures integer:=1;
begin
  perform private.require_production_enrollment_owner(p_contact_id);
  perform 1 from public.contacts where id=p_contact_id for update;
  if not private.production_client_agreement_publication_released() then raise exception 'Production client agreement publication is held pending legal approval' using errcode='42501'; end if;
  if not exists(select 1 from public.journey_enrollment_activations enrollment_row join public.program_agreement_requirements requirement_row on requirement_row.program_code=enrollment_row.program_code and (requirement_row.billing_choice is null or requirement_row.billing_choice=enrollment_row.billing_choice) and (requirement_row.currency is null or requirement_row.currency=enrollment_row.currency) where enrollment_row.contact_id=p_contact_id and requirement_row.agreement_template_id=p_agreement_template_id and requirement_row.active and requirement_row.required) then raise exception 'Approved production billing-specific program/agreement mapping required'; end if;
  if not private.staff_has_permission((select auth.uid()),'finance.manage') then
    raise exception 'Financial management permission required';
  end if;

  select * into t
  from public.agreement_templates
  where id=p_agreement_template_id
    and status='published'
    and audience='client';

  if t.id is null then raise exception 'Published client agreement template not found'; end if;

  perform private.validate_agreement_merge_values(t.merge_schema,p_merge_values);

  select * into m
  from public.client_memberships
  where primary_contact_id=p_contact_id
  order by created_at desc
  limit 1;

  if m.id is null then raise exception 'Client membership not found'; end if;

  v_rendered:=private.render_agreement_content(t.content_text,p_merge_values);
  v_hash:=encode(extensions.digest(convert_to(v_rendered,'UTF8'),'sha256'),'hex');

  if nullif(trim(coalesce(p_merge_values->>'secondary_client_name','')),'') is not null then
    v_required_signatures:=2;
  end if;

  insert into public.client_agreements(
    contact_id,membership_id,activation_id,agreement_template_id,
    agreement_key,template_version,content_hash,status,sent_at,created_by,
    merge_values,rendered_content_text,rendered_content_hash,
    company_approved_by,company_approved_at,company_approver_name,
    required_client_signatures
  )
  values(
    p_contact_id,m.id,m.activation_id,t.id,t.agreement_key,t.version,t.content_hash,
    case when p_send then 'sent' else 'not_sent' end,
    case when p_send then now() else null end,
    (select auth.uid()),
    coalesce(p_merge_values,'{}'::jsonb),v_rendered,v_hash,
    (select auth.uid()),now(),
    (select display_name from public.staff_access where user_id=(select auth.uid())),
    v_required_signatures
  )
  on conflict (contact_id,agreement_template_id) do update
  set membership_id=excluded.membership_id,
      activation_id=coalesce(excluded.activation_id,public.client_agreements.activation_id),
      merge_values=excluded.merge_values,
      rendered_content_text=excluded.rendered_content_text,
      rendered_content_hash=excluded.rendered_content_hash,
      required_client_signatures=excluded.required_client_signatures,
      company_approved_by=excluded.company_approved_by,
      company_approved_at=excluded.company_approved_at,
      company_approver_name=excluded.company_approver_name,
      status=case
        when public.client_agreements.status in ('signed','waived') then public.client_agreements.status
        when p_send then 'sent'
        else 'not_sent'
      end,
      sent_at=case
        when public.client_agreements.status in ('signed','waived') then public.client_agreements.sent_at
        when p_send then now()
        else null
      end,
      updated_at=now()
  returning * into a;

  if p_send and a.status='sent' then
    select ca.user_id into v_user
    from public.client_access ca
    where ca.contact_id=p_contact_id and ca.status='active' and ca.user_id is not null
    limit 1;

    if v_user is not null then
      insert into public.member_notifications(
        user_id,contact_id,notification_type,title,body,link_url,source_type,source_id
      )
      values(
        v_user,p_contact_id,'program_update',
        'Your ReVitalized Academy contract is ready',
        'Your personalized ReVitalized Academy contract is ready to review and sign.',
        '/member/','client_contract',a.id
      )
      on conflict (user_id,notification_type,source_type,source_id)
        where source_id is not null
      do nothing;
    end if;
  end if;

  insert into public.contact_activity(
    contact_id,activity_type,title,detail,actor_user_id,metadata
  )
  values(
    p_contact_id,
    case when p_send then 'client_contract_sent' else 'client_contract_prepared' end,
    case when p_send then 'Client contract sent' else 'Client contract prepared' end,
    t.name||' · v'||t.version,
    (select auth.uid()),
    jsonb_build_object(
      'client_agreement_id',a.id,
      'template_id',t.id,
      'merge_values',p_merge_values
    )
  );

  return a.id;
end;
$function$
;
REVOKE ALL ON FUNCTION public.prepare_client_contract(uuid,uuid,jsonb,boolean) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.prepare_client_contract(uuid,uuid,jsonb,boolean) TO authenticated;
REVOKE ALL ON FUNCTION private.validate_agreement_merge_values(jsonb,jsonb),private.render_agreement_content(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.agreement_acceptances FROM authenticated,anon;


ALTER POLICY lifecycle_invitation_delivery_private ON public.notification_delivery_jobs
USING (signer_invitation_id IS NULL AND client_agreement_id IS NULL)
WITH CHECK (signer_invitation_id IS NULL AND client_agreement_id IS NULL);
-- Legacy unrendered issuance must not bypass production template mapping/merge validation.
REVOKE ALL ON FUNCTION public.issue_client_agreement(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.program_catalog WHERE program_code='holistic-foundations' AND active) THEN RAISE EXCEPTION 'Active production Holistic Foundations catalog entry required'; END IF; END $$;
-- Only the six approved production benefits. No beta template/record is copied.
UPDATE public.program_entitlement_templates SET active=false
WHERE program_code='holistic-foundations' AND entitlement_key NOT IN
 ('platform_access','nutrition_plans','fitness_plans','tracking','biometrics','habit_builder');
INSERT INTO public.program_entitlement_templates(program_code,entitlement_key,label,limit_value,reset_cadence,active,metadata)
SELECT 'holistic-foundations',v.key,v.label,NULL,'none',true,'{}'::jsonb FROM (VALUES
 ('platform_access','Member Dashboard'),('nutrition_plans','Nutrition'),('fitness_plans','Workouts'),
 ('tracking','Nutrition/workout tracking'),('biometrics','Personal biometric recording'),('habit_builder','Habit building')) v(key,label)
WHERE EXISTS(SELECT 1 FROM public.program_catalog WHERE program_code='holistic-foundations' AND active)
ON CONFLICT(program_code,entitlement_key) DO UPDATE SET label=excluded.label,limit_value=NULL,reset_cadence='none',active=true,metadata='{}'::jsonb;

-- Service-only delivery functions. Edge verifies Auth identity before passing p_actor.
CREATE FUNCTION private.require_production_delivery_actor(p_actor uuid,p_contact uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.staff_access WHERE user_id=p_actor AND role IN ('owner','admin') AND status='active' AND onboarding_status='complete')
 OR NOT private.staff_action_allowed(p_actor,'finance.manage',p_contact) THEN RAISE EXCEPTION 'Owner/Admin finance permission and contact scope required' USING ERRCODE='42501'; END IF;
END $$;
CREATE FUNCTION private.claim_production_agreement_delivery(p_actor uuid,p_agreement_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c uuid; job public.notification_delivery_jobs%rowtype;
BEGIN
 SELECT contact_id INTO c FROM public.client_agreements WHERE id=p_agreement_id;
 IF c IS NULL THEN RAISE EXCEPTION 'Agreement unavailable' USING ERRCODE='42501'; END IF;
 PERFORM private.require_production_delivery_actor(p_actor,c);
 SELECT * INTO job FROM public.notification_delivery_jobs WHERE client_agreement_id=p_agreement_id AND channel='email'
 AND (status IN ('queued','failed','blocked') OR (status='processing' AND last_attempt_at<now()-interval '1 minute' AND last_attempt_at>now()-interval '23 hours')) AND attempt_count<5 AND scheduled_for<=now()
 ORDER BY created_at DESC LIMIT 1 FOR UPDATE SKIP LOCKED;
 IF job.id IS NULL THEN RETURN NULL; END IF;
 UPDATE public.notification_delivery_jobs SET status='processing',attempt_count=attempt_count+1,last_attempt_at=now(),updated_at=now() WHERE id=job.id;
 RETURN jsonb_build_object('id',job.id,'recipient',job.recipient,'subject',job.subject,'body',job.body);
END $$;
CREATE FUNCTION private.finish_production_agreement_delivery(p_actor uuid,p_job_id uuid,p_message_id text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job public.notification_delivery_jobs%rowtype;
BEGIN
 SELECT * INTO job FROM public.notification_delivery_jobs WHERE id=p_job_id AND client_agreement_id IS NOT NULL FOR UPDATE;
 IF job.id IS NULL THEN RAISE EXCEPTION 'Delivery unavailable'; END IF;
 PERFORM private.require_production_delivery_actor(p_actor,job.contact_id);
 IF job.status<>'processing' THEN RAISE EXCEPTION 'Delivery lease unavailable'; END IF;
 UPDATE public.notification_delivery_jobs SET status=CASE WHEN nullif(p_message_id,'') IS NULL THEN 'failed' ELSE 'sent' END,
 provider_message_id=nullif(p_message_id,''),sent_at=CASE WHEN nullif(p_message_id,'') IS NOT NULL THEN now() END,
 body=CASE WHEN nullif(p_message_id,'') IS NOT NULL THEN 'Agreement delivery accepted; private link removed.' ELSE body END,
 error_message=CASE WHEN nullif(p_message_id,'') IS NULL THEN 'Provider acceptance not confirmed' END,block_reason=NULL,updated_at=now()
 WHERE id=p_job_id;
END $$;
CREATE FUNCTION public.claim_production_agreement_delivery(p_actor uuid,p_agreement_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.claim_production_agreement_delivery(p_actor,p_agreement_id) $$;
CREATE FUNCTION public.finish_production_agreement_delivery(p_actor uuid,p_job_id uuid,p_message_id text) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.finish_production_agreement_delivery(p_actor,p_job_id,p_message_id) $$;
REVOKE ALL ON FUNCTION private.require_production_delivery_actor(uuid,uuid),private.claim_production_agreement_delivery(uuid,uuid),private.finish_production_agreement_delivery(uuid,uuid,text),public.claim_production_agreement_delivery(uuid,uuid),public.finish_production_agreement_delivery(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.require_production_delivery_actor(uuid,uuid),private.claim_production_agreement_delivery(uuid,uuid),private.finish_production_agreement_delivery(uuid,uuid,text),public.claim_production_agreement_delivery(uuid,uuid),public.finish_production_agreement_delivery(uuid,uuid,text) TO service_role;

-- Recovery rate limits store digests, never addresses/tokens, and run before lookup.
CREATE TABLE private.production_member_recovery_limits(key_hash text PRIMARY KEY,last_requested timestamptz NOT NULL,window_start timestamptz NOT NULL,attempts integer NOT NULL);
ALTER TABLE private.production_member_recovery_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.production_member_recovery_limits FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION private.reserve_production_member_recovery(p_email text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE key text:=encode(extensions.digest(lower(trim(p_email)),'sha256'),'hex');lim private.production_member_recovery_limits%rowtype;
BEGIN
 IF p_email IS NULL OR length(p_email)>254 THEN RETURN false; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('production-member-recovery',0));
 DELETE FROM private.production_member_recovery_limits WHERE last_requested<now()-interval '1 day';
 IF (SELECT coalesce(sum(attempts),0) FROM private.production_member_recovery_limits WHERE window_start>now()-interval '1 hour')>=100 THEN RETURN false; END IF;
 SELECT * INTO lim FROM private.production_member_recovery_limits WHERE key_hash=key;
 IF lim.key_hash IS NOT NULL AND (lim.last_requested>now()-interval '1 minute' OR (lim.window_start>now()-interval '1 hour' AND lim.attempts>=6)) THEN RETURN false; END IF;
 INSERT INTO private.production_member_recovery_limits VALUES(key,now(),now(),1)
 ON CONFLICT(key_hash) DO UPDATE SET last_requested=now(),window_start=CASE WHEN private.production_member_recovery_limits.window_start<now()-interval '1 hour' THEN now() ELSE private.production_member_recovery_limits.window_start END,
 attempts=CASE WHEN private.production_member_recovery_limits.window_start<now()-interval '1 hour' THEN 1 ELSE private.production_member_recovery_limits.attempts+1 END;
 RETURN true;
END $$;
CREATE FUNCTION public.reserve_production_member_recovery(p_email text) RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.reserve_production_member_recovery(p_email) $$;
REVOKE ALL ON FUNCTION private.reserve_production_member_recovery(text),public.reserve_production_member_recovery(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.reserve_production_member_recovery(text),public.reserve_production_member_recovery(text) TO service_role;

COMMIT;
