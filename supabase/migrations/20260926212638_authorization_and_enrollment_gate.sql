-- Forward fix only. Observed live baseline is outside migrations.
-- Not applied remotely. Review and test against the destination catalog before release.
BEGIN;
CREATE OR REPLACE FUNCTION private.staff_has_permission(p_user_id uuid,p_permission_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT EXISTS(SELECT 1 FROM public.staff_access s WHERE s.user_id=p_user_id
   AND s.status='active' AND (s.role<>'coach' OR s.onboarding_status IN ('complete','waived'))
   AND coalesce((SELECT o.allowed FROM public.staff_permission_overrides o WHERE o.user_id=s.user_id AND o.permission_key=p_permission_key),
                (SELECT d.allowed FROM public.staff_role_permission_defaults d WHERE d.role=s.role AND d.permission_key=p_permission_key),false));
$$;
-- Retain legacy action-specific role limits, while honoring the newer permission overrides.
CREATE FUNCTION private.staff_action_allowed(p_user_id uuid,p_permission_key text,p_contact_id uuid DEFAULT NULL)
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
CREATE FUNCTION public.staff_action_allowed(p_permission_key text,p_contact_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public,private AS $$
 SELECT private.staff_action_allowed(auth.uid(),p_permission_key,p_contact_id);
$$;
REVOKE ALL ON FUNCTION public.staff_action_allowed(text,uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.staff_action_allowed(text,uuid) TO authenticated;

-- Atomic server-selected export + audit. No customer-supplied row count or health columns.
CREATE FUNCTION private.export_people(p_filters jsonb DEFAULT '{}',p_expected_count integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE v_rows jsonb; v_actor uuid:=auth.uid(); v_search text; v_sort text; v_filters jsonb;
BEGIN
 IF v_actor IS NULL OR NOT private.staff_has_permission(v_actor,'people.export') OR NOT private.staff_has_permission(v_actor,'crm.view') THEN
  RAISE EXCEPTION 'People export permission required' USING ERRCODE='42501';
 END IF;
 IF jsonb_typeof(p_filters)<>'object' THEN RAISE EXCEPTION 'Invalid export filters'; END IF;
 v_filters:=jsonb_build_object('search',left(coalesce(p_filters->>'search',''),240),'stage',p_filters->>'stage','assigned',p_filters->>'assigned','source',p_filters->>'source','sort',p_filters->>'sort','quickView',p_filters->>'quickView','type',p_filters->>'type','assessment',p_filters->>'assessment','enrollment',p_filters->>'enrollment');
 v_search:=replace(replace(replace(v_filters->>'search',chr(92),chr(92)||chr(92)),'%',chr(92)||'%'),'_',chr(92)||'_');
 v_sort:=coalesce(v_filters->>'sort','recent');
 SELECT coalesce(jsonb_agg(to_jsonb(e)),'[]') INTO v_rows FROM (
 SELECT d.first_name,d.last_name,d.email,d.phone,d.lifecycle_stage,d.vitality_status,d.enrollment_status,d.assigned_name,d.first_source,d.created_at,d.enrolled_at,d.last_activity_at,d.next_follow_up_at
 FROM public.admin_people_directory d
 WHERE private.staff_can_access_contact(v_actor,d.id)
 AND (v_search='' OR concat_ws(' ',d.first_name,d.last_name,d.email,d.phone) ILIKE '%'||v_search||'%')
 AND (coalesce(v_filters->>'stage','')='' OR d.lifecycle_stage=v_filters->>'stage')
 AND (coalesce(v_filters->>'assigned','')='' OR CASE WHEN v_filters->>'assigned'='unassigned' THEN d.assigned_to IS NULL ELSE d.assigned_to::text=v_filters->>'assigned' END)
 AND (coalesce(v_filters->>'source','')='' OR d.first_source=v_filters->>'source')
 AND (coalesce(v_filters->>'type','')='' OR d.record_kind=v_filters->>'type')
 AND (coalesce(v_filters->>'assessment','')='' OR coalesce(d.vitality_status,'not_started')=v_filters->>'assessment')
 AND (coalesce(v_filters->>'enrollment','')='' OR coalesce(d.enrollment_status,'not_started')=v_filters->>'enrollment')
 AND CASE coalesce(v_filters->>'quickView','all')
 WHEN 'new_leads' THEN d.lifecycle_stage IN ('lead','assessment_lead','webinar_lead') AND d.follow_up_status='new'
 WHEN 'unassigned' THEN d.assigned_to IS NULL WHEN 'needs_followup' THEN d.follow_up_status='needs_follow_up'
 WHEN 'applicants' THEN d.lifecycle_stage='applicant' WHEN 'clients' THEN d.lifecycle_stage='client' ELSE true END
 ORDER BY
 CASE WHEN v_sort='oldest' THEN d.created_at END ASC NULLS LAST,
 CASE WHEN v_sort='first_az' THEN d.first_name END ASC NULLS LAST,
 CASE WHEN v_sort='first_za' THEN d.first_name END DESC NULLS LAST,
 CASE WHEN v_sort='last_az' THEN d.last_name END ASC NULLS LAST,
 CASE WHEN v_sort='last_za' THEN d.last_name END DESC NULLS LAST,
 CASE WHEN v_sort='enrolled_recent' THEN d.enrolled_at END DESC NULLS LAST,
 CASE WHEN v_sort='activity_recent' THEN d.last_activity_at END DESC NULLS LAST,
 CASE WHEN v_sort='followup_soon' THEN d.next_follow_up_at END ASC NULLS LAST,
 d.created_at DESC,d.id LIMIT 5000) e;
 IF p_expected_count IS NOT NULL AND p_expected_count<>jsonb_array_length(v_rows) THEN RAISE EXCEPTION 'Export row count changed. Reload before exporting'; END IF;
 INSERT INTO public.staff_access_audit(staff_user_id,action,actor_user_id,previous_value,new_value,reason)
 VALUES(v_actor,'people_csv_exported',v_actor,'{}',jsonb_build_object('row_count',jsonb_array_length(v_rows),'filters',v_filters),'People Directory CSV export');
 RETURN v_rows;
END; $$;
REVOKE ALL ON FUNCTION private.export_people(jsonb,integer) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.export_people(jsonb,integer) TO authenticated;
CREATE FUNCTION public.export_people(p_filters jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.export_people(p_filters); $$;
REVOKE ALL ON FUNCTION public.export_people(jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.export_people(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.log_people_export(p_row_count integer,p_filters jsonb DEFAULT '{}') RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,private AS $$
BEGIN IF p_row_count IS NULL OR p_row_count<0 THEN RAISE EXCEPTION 'Invalid export row count'; END IF; PERFORM private.export_people(p_filters,p_row_count); END; $$;
REVOKE ALL ON FUNCTION public.log_people_export(integer,jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.log_people_export(integer,jsonb) TO authenticated;

-- Close the direct-table legacy staff-status/scope bypass as well as Edge checks.
DROP POLICY journey_enrollment_activations_owner_admin_insert ON public.journey_enrollment_activations;
DROP POLICY journey_enrollment_activations_owner_admin_update ON public.journey_enrollment_activations;
DROP POLICY journey_enrollment_activations_staff_read ON public.journey_enrollment_activations;
CREATE POLICY journey_enrollment_activations_staff_read ON public.journey_enrollment_activations FOR SELECT TO authenticated USING (
 (private.staff_has_permission(auth.uid(),'finance.view') AND private.staff_can_access_contact(auth.uid(),contact_id))
 OR EXISTS(SELECT 1 FROM public.client_access a WHERE a.user_id=auth.uid() AND a.contact_id=journey_enrollment_activations.contact_id AND a.status='active'));
CREATE POLICY journey_enrollment_activations_owner_admin_insert ON public.journey_enrollment_activations FOR INSERT TO authenticated WITH CHECK (
 private.staff_has_permission(auth.uid(),'finance.manage') AND private.staff_can_access_contact(auth.uid(),contact_id)
 AND EXISTS(SELECT 1 FROM public.staff_access s WHERE s.user_id=auth.uid() AND s.status='active' AND s.role IN ('owner','admin')));
CREATE POLICY journey_enrollment_activations_owner_admin_update ON public.journey_enrollment_activations FOR UPDATE TO authenticated USING (
 private.staff_has_permission(auth.uid(),'finance.manage') AND private.staff_can_access_contact(auth.uid(),contact_id)
 AND EXISTS(SELECT 1 FROM public.staff_access s WHERE s.user_id=auth.uid() AND s.status='active' AND s.role IN ('owner','admin')))
 WITH CHECK(private.staff_has_permission(auth.uid(),'finance.manage') AND private.staff_can_access_contact(auth.uid(),contact_id)
 AND EXISTS(SELECT 1 FROM public.staff_access s WHERE s.user_id=auth.uid() AND s.status='active' AND s.role IN ('owner','admin')));

-- Signing is one transaction under the verified user's JWT, never an admin upsert sequence.
CREATE FUNCTION private.sign_client_agreement(p_id uuid,p_signatures jsonb,p_hash text,p_user_agent text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private,extensions AS $$
DECLARE a public.client_agreements%rowtype; t public.agreement_templates%rowtype; v_hash text; v_id uuid; v_signature jsonb; v_count integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.client_agreements WHERE id=p_id AND EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.contact_id=client_agreements.contact_id AND ca.user_id=auth.uid() AND ca.status='active') FOR UPDATE;
 IF a.id IS NULL THEN RAISE EXCEPTION 'Client agreement not found' USING ERRCODE='42501'; END IF;
 IF a.status IN ('waived','declined') THEN RAISE EXCEPTION 'This agreement cannot be signed in its current status'; END IF;
 SELECT * INTO t FROM public.agreement_templates WHERE id=a.agreement_template_id;
 v_hash:=coalesce(a.rendered_content_hash,a.content_hash);
 IF p_hash IS NULL OR p_hash='' OR p_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'Agreement content changed. Reload the agreement before signing'; END IF;
 IF t.status IS DISTINCT FROM 'published' OR v_hash IS NULL OR
    (a.rendered_content_hash IS NOT NULL AND encode(extensions.digest(convert_to(coalesce(a.rendered_content_text,''),'UTF8'),'sha256'),'hex')<>v_hash) OR
    (a.rendered_content_hash IS NULL AND t.content_hash IS DISTINCT FROM a.content_hash) THEN RAISE EXCEPTION 'Agreement integrity check failed'; END IF;
 IF jsonb_typeof(p_signatures)<>'array' OR jsonb_array_length(p_signatures) NOT BETWEEN 1 AND 2 THEN RAISE EXCEPTION 'Invalid signatures'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_signatures) z WHERE coalesce(z->>'signer_role','') NOT IN ('primary_client','secondary_client') OR coalesce(length(trim(z->>'signer_name')),0) NOT BETWEEN 2 AND 240) OR
    (SELECT count(DISTINCT z->>'signer_role') FROM jsonb_array_elements(p_signatures) z)<>jsonb_array_length(p_signatures) THEN RAISE EXCEPTION 'Invalid or duplicate signer'; END IF;
 FOR v_signature IN SELECT * FROM jsonb_array_elements(p_signatures) LOOP
 INSERT INTO public.agreement_acceptances(client_agreement_id,contact_id,signed_by_user_id,signer_name,signer_email,signature_type,accepted_terms,content_hash,signed_at,user_agent,metadata,signer_role)
 VALUES(a.id,a.contact_id,auth.uid(),trim(v_signature->>'signer_name'),(SELECT email FROM auth.users WHERE id=auth.uid()),'typed',true,v_hash,now(),left(p_user_agent,1000),jsonb_build_object('source','member_app','agreement_key',a.agreement_key,'template_version',a.template_version),v_signature->>'signer_role')
 ON CONFLICT(client_agreement_id,signer_role) DO UPDATE SET signer_name=excluded.signer_name,signer_email=excluded.signer_email,signed_by_user_id=excluded.signed_by_user_id,signature_type='typed',accepted_terms=true,content_hash=excluded.content_hash,signed_at=now(),user_agent=excluded.user_agent,metadata=excluded.metadata RETURNING id INTO v_id;
 END LOOP;
 SELECT count(*) INTO v_count FROM public.agreement_acceptances WHERE client_agreement_id=a.id AND signer_role IN ('primary_client','secondary_client') AND accepted_terms AND content_hash=v_hash;
 UPDATE public.client_agreements SET status=CASE WHEN v_count>=greatest(required_client_signatures,1) THEN 'signed' ELSE 'viewed' END,viewed_at=coalesce(viewed_at,now()),signed_at=CASE WHEN v_count>=greatest(required_client_signatures,1) THEN now() ELSE NULL END,updated_at=now() WHERE id=a.id;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION private.sign_client_agreement(uuid,jsonb,text,text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.sign_client_agreement(uuid,jsonb,text,text) TO authenticated;
CREATE FUNCTION public.sign_client_agreement_atomic(p_client_agreement_id uuid,p_signatures jsonb,p_expected_content_hash text,p_user_agent text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.sign_client_agreement(p_client_agreement_id,p_signatures,p_expected_content_hash,p_user_agent); $$;
REVOKE ALL ON FUNCTION public.sign_client_agreement_atomic(uuid,jsonb,text,text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.sign_client_agreement_atomic(uuid,jsonb,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.sign_my_client_agreement(p_client_agreement_id uuid,p_signer_name text,p_signature_type text DEFAULT 'typed',p_user_agent text DEFAULT NULL,p_expected_content_hash text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ BEGIN
 IF p_signature_type<>'typed' THEN RAISE EXCEPTION 'Typed signature required'; END IF;
 RETURN private.sign_client_agreement(p_client_agreement_id,jsonb_build_array(jsonb_build_object('signer_role','primary_client','signer_name',p_signer_name)),p_expected_content_hash,p_user_agent);
END; $$;

CREATE FUNCTION private.sign_staff_agreement(p_id uuid,p_name text,p_hash text,p_user_agent text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private,extensions AS $$
DECLARE a public.staff_agreements%rowtype; v_hash text; v_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.staff_access s WHERE s.user_id=auth.uid() AND s.status='active') THEN RAISE EXCEPTION 'Active staff access required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.staff_agreements WHERE id=p_id AND staff_user_id=auth.uid() FOR UPDATE;
 IF a.id IS NULL THEN RAISE EXCEPTION 'Staff agreement not found' USING ERRCODE='42501'; END IF;
 IF a.status IN ('waived','declined') THEN RAISE EXCEPTION 'This agreement cannot be signed in its current status'; END IF;
 IF coalesce(length(trim(p_name)),0) NOT BETWEEN 2 AND 240 THEN RAISE EXCEPTION 'Signer name is required'; END IF;
 v_hash:=coalesce(a.rendered_content_hash,a.content_hash);
 IF p_hash IS NULL OR p_hash='' OR p_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'Agreement content changed. Reload the agreement before signing'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.agreement_templates t WHERE t.id=a.agreement_template_id AND t.status='published' AND (a.rendered_content_hash IS NOT NULL OR t.content_hash=a.content_hash)) OR
 (a.rendered_content_hash IS NOT NULL AND encode(extensions.digest(convert_to(coalesce(a.rendered_content_text,''),'UTF8'),'sha256'),'hex')<>v_hash) THEN RAISE EXCEPTION 'Agreement integrity check failed'; END IF;
 INSERT INTO public.staff_agreement_acceptances(staff_agreement_id,staff_user_id,signer_name,signer_email,signature_type,accepted_terms,content_hash,signed_at,user_agent,metadata)
 VALUES(a.id,auth.uid(),trim(p_name),(SELECT email FROM auth.users WHERE id=auth.uid()),'typed',true,v_hash,now(),left(p_user_agent,1000),jsonb_build_object('source','staff_portal','agreement_key',a.agreement_key,'template_version',a.template_version))
 ON CONFLICT(staff_agreement_id) DO UPDATE SET signer_name=excluded.signer_name,signer_email=excluded.signer_email,signature_type='typed',accepted_terms=true,content_hash=excluded.content_hash,signed_at=now(),user_agent=excluded.user_agent,metadata=excluded.metadata RETURNING id INTO v_id;
 UPDATE public.staff_agreements SET status='signed',viewed_at=coalesce(viewed_at,now()),signed_at=coalesce(signed_at,now()),updated_at=now() WHERE id=a.id;
 -- Existing trigger computes ALL required agreements; never unconditionally mark complete.
 INSERT INTO public.staff_access_audit(staff_user_id,action,actor_user_id,previous_value,new_value,reason)
 VALUES(auth.uid(),'staff_agreement_signed',auth.uid(),'{}',jsonb_build_object('staff_agreement_id',a.id,'onboarding_status',(SELECT onboarding_status FROM public.staff_access WHERE user_id=auth.uid())),'Required staff agreement signed');
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION private.sign_staff_agreement(uuid,text,text,text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.sign_staff_agreement(uuid,text,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.sign_my_staff_agreement(p_staff_agreement_id uuid,p_signer_name text,p_signature_type text DEFAULT 'typed',p_user_agent text DEFAULT NULL,p_expected_content_hash text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ BEGIN
 IF p_signature_type<>'typed' THEN RAISE EXCEPTION 'Typed signature required'; END IF;
 RETURN private.sign_staff_agreement(p_staff_agreement_id,p_signer_name,p_expected_content_hash,p_user_agent);
END; $$;
REVOKE ALL ON FUNCTION public.sign_my_staff_agreement(uuid,text,text,text,text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.sign_my_staff_agreement(uuid,text,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.sign_my_client_agreement(uuid,text,text,text,text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.sign_my_client_agreement(uuid,text,text,text,text) TO authenticated;

-- One predicate for readiness, provisioning and activation; existing waivers are explicit.
CREATE FUNCTION private.enrollment_gates_complete(a public.journey_enrollment_activations)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT private.staff_can_access_contact(auth.uid(),a.contact_id)
 AND NOT EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.contact_id=a.contact_id AND ca.user_id=auth.uid() AND ca.status='active') THEN RETURN false; END IF;
 RETURN (a.payment_status='waived' OR (a.payment_status='paid' AND a.amount_cents IS NOT NULL AND
 (SELECT coalesce(sum(CASE WHEN transaction_type IN ('payment','adjustment') THEN amount_cents WHEN transaction_type IN ('refund','reversal') THEN -amount_cents ELSE 0 END),0) FROM public.payment_records WHERE activation_id=a.id AND status='recorded')>=a.amount_cents))
 AND (a.agreement_status='waived' OR (a.agreement_status='signed' AND EXISTS(SELECT 1 FROM public.client_agreements WHERE activation_id=a.id)))
 AND NOT EXISTS(SELECT 1 FROM public.client_agreements ca WHERE ca.activation_id=a.id AND ca.status<>'waived' AND
 (ca.status<>'signed' OR (SELECT count(*) FROM public.agreement_acceptances aa WHERE aa.client_agreement_id=ca.id AND aa.signer_role IN ('primary_client','secondary_client') AND aa.accepted_terms AND aa.content_hash=coalesce(ca.rendered_content_hash,ca.content_hash))<greatest(ca.required_client_signatures,1)));
END; $$;
REVOKE ALL ON FUNCTION private.enrollment_gates_complete(public.journey_enrollment_activations) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.enrollment_gates_complete(public.journey_enrollment_activations) TO authenticated;
CREATE FUNCTION private.guard_enrollment_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF NEW.access_status IN ('ready','active') AND (TG_OP='INSERT' OR OLD.access_status IS DISTINCT FROM NEW.access_status) AND NOT private.enrollment_gates_complete(NEW) THEN
 RAISE EXCEPTION 'Payment and required agreements must be complete or explicitly waived before activation'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_enrollment_access() FROM PUBLIC, anon, service_role;
CREATE TRIGGER guard_enrollment_access BEFORE INSERT OR UPDATE OF access_status ON public.journey_enrollment_activations FOR EACH ROW EXECUTE FUNCTION private.guard_enrollment_access();

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
  if NEW.access_status not in ('ready','active') or not private.enrollment_gates_complete(NEW) then return NEW; end if;

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
    contact_id,household_id,membership_id,user_id,status,ready_at,activated_at,updated_at
  )
  values(
    NEW.contact_id,v_household_id,v_membership_id,v_user_id,
    case when NEW.access_status='active' and v_user_id is not null then 'active' else 'ready' end,
    now(),
    case when NEW.access_status='active' and v_user_id is not null then now() else null end,
    now()
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
CREATE OR REPLACE FUNCTION private.sync_journey_from_activation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  if NEW.payment_status='paid' and NEW.paid_at is null then
    update public.journey_enrollment_activations
    set paid_at=now(),updated_at=now()
    where id=NEW.id;
    NEW.paid_at := now();
  end if;

  if private.enrollment_gates_complete(NEW) then
    update public.contact_journey_steps
    set status='completed',
        completion_source=case
          when NEW.payment_status='waived' or NEW.agreement_status='waived'
            then 'manual_financial_override'
          else 'payment_and_agreement'
        end,
        completed_at=coalesce(completed_at,now()),
        updated_at=now()
    where journey_id=NEW.journey_id
      and step_key='payment_agreement'
      and status not in ('completed','skipped','waived');
  end if;

  if NEW.access_status='active' then
    update public.contact_journey_steps
    set status='completed',
        completion_source=coalesce(NEW.access_completion_method,'member_access_activated'),
        completed_at=coalesce(completed_at,now()),
        updated_at=now()
    where journey_id=NEW.journey_id
      and step_key='backend_activation'
      and status not in ('completed','skipped','waived');
  end if;

  return NEW;
end;
$function$
;
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
            COALESCE(sum(( SELECT count(*) AS count
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

-- Existing decline trigger uses 'blocked'; align the constraint with that behavior.
ALTER TABLE public.staff_access DROP CONSTRAINT staff_access_onboarding_status_check;
ALTER TABLE public.staff_access ADD CONSTRAINT staff_access_onboarding_status_check CHECK(onboarding_status IN ('pending','complete','waived','blocked'));
CREATE OR REPLACE FUNCTION private.issue_required_coach_nda()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'extensions'
AS $function$
declare
  t public.agreement_templates%rowtype;
  v_email text;
  v_rendered text;
  v_hash text;
  v_values jsonb;
  v_approver uuid;
  v_approver_name text;
begin
  if NEW.role<>'coach' or NEW.status<>'active' then
    return NEW;
  end if;

  select * into t
  from public.agreement_templates
  where audience='staff'
    and document_type='coach_nda'
    and status='published'
  order by published_at desc nulls last,created_at desc
  limit 1;

  if t.id is null then update public.staff_access set onboarding_status='pending' where user_id=NEW.user_id; return NEW; end if;

  select email into v_email from auth.users where id=NEW.user_id;
  v_approver:=NEW.updated_by;
  select display_name into v_approver_name
  from public.staff_access
  where user_id=v_approver;

  v_values:=jsonb_build_object(
    'effective_date',to_char(current_date,'FMMonth DD, YYYY'),
    'recipient_name',NEW.display_name,
    'recipient_email',coalesce(v_email,'')
  );

  v_rendered:=private.render_agreement_content(t.content_text,v_values);
  v_hash:=encode(digest(convert_to(v_rendered,'UTF8'),'sha256'),'hex');

  insert into public.staff_agreements(
    staff_user_id,agreement_template_id,agreement_key,template_version,
    content_hash,rendered_content_text,rendered_content_hash,merge_values,
    status,required,sent_at,created_by,
    company_approved_by,company_approved_at,company_approver_name
  )
  values(
    NEW.user_id,t.id,t.agreement_key,t.version,t.content_hash,
    v_rendered,v_hash,v_values,'sent',true,now(),v_approver,
    v_approver,now(),coalesce(v_approver_name,'Authorized ReVitalized Representative')
  )
  on conflict (staff_user_id,agreement_template_id) do update
  set company_approved_by=coalesce(public.staff_agreements.company_approved_by,excluded.company_approved_by),
      company_approved_at=coalesce(public.staff_agreements.company_approved_at,excluded.company_approved_at),
      company_approver_name=coalesce(public.staff_agreements.company_approver_name,excluded.company_approver_name),
      updated_at=now();

  perform private.refresh_staff_onboarding_status(NEW.user_id);

  return NEW;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.refresh_staff_onboarding_status(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_pending integer;
begin
  select count(*) into v_pending
  from public.staff_agreements
  where staff_user_id=p_user_id
    and required
    and status not in ('signed','waived');

  update public.staff_access
  set onboarding_status=case when status<>'active' then onboarding_status when exists(select 1 from public.staff_agreements where staff_user_id=p_user_id and required and status='declined') then 'blocked' when v_pending=0 then 'complete' else 'pending' end,
      updated_at=now()
  where user_id=p_user_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.sync_staff_onboarding_from_agreements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_staff_user_id uuid;
  v_required integer;
  v_incomplete integer;
  v_declined integer;
begin
  v_staff_user_id:=coalesce(new.staff_user_id,old.staff_user_id);

  if v_staff_user_id is null then
    return coalesce(new,old);
  end if;

  select
    count(*) filter(where sa.required)::integer,
    count(*) filter(where sa.required and sa.status not in ('signed','waived'))::integer,
    count(*) filter(where sa.required and sa.status='declined')::integer
  into v_required,v_incomplete,v_declined
  from public.staff_agreements sa
  where sa.staff_user_id=v_staff_user_id;

  update public.staff_access
  set onboarding_status=case
        when status<>'active' then onboarding_status
        when coalesce(v_declined,0)>0 then 'blocked'
        when coalesce(v_required,0)=0 then 'complete'
        when coalesce(v_incomplete,0)=0 then 'complete'
        else 'pending'
      end,
      updated_at=now()
  where user_id=v_staff_user_id;

  return coalesce(new,old);
end;
$function$
;

-- Link-based account creation must also recheck gates; this API is service-role only.
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.enrollment_gates_complete(public.journey_enrollment_activations) TO service_role;
CREATE FUNCTION public.member_activation_ready(p_contact_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public,private AS $$
 SELECT EXISTS(SELECT 1 FROM public.client_access ca JOIN public.client_memberships cm ON cm.id=ca.membership_id
 JOIN public.journey_enrollment_activations a ON a.id=cm.activation_id
 WHERE ca.contact_id=p_contact_id AND cm.primary_contact_id=p_contact_id AND a.contact_id=p_contact_id
 AND ca.status IN ('ready','invited','active') AND cm.status='active' AND private.enrollment_gates_complete(a));
$$;
REVOKE ALL ON FUNCTION public.member_activation_ready(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.member_activation_ready(uuid) TO service_role;

-- Legacy RLS policies consult staff_access directly. Do not expose a usable staff
-- row to revoked/pending actors, while retaining a narrow self-status API for login/NDA UI.
ALTER POLICY staff_access_team_read ON public.staff_access USING (
 (user_id=auth.uid() AND status='active' AND (role<>'coach' OR onboarding_status IN ('complete','waived')))
 OR private.staff_has_permission(auth.uid(),'staff.view'));
CREATE FUNCTION private.my_staff_status() RETURNS TABLE(role text,display_name text,status text,onboarding_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT s.role,s.display_name,s.status,s.onboarding_status FROM public.staff_access s WHERE auth.uid() IS NOT NULL AND s.user_id=auth.uid() LIMIT 1;
$$;
REVOKE ALL ON FUNCTION private.my_staff_status() FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION private.my_staff_status() TO authenticated;
CREATE OR REPLACE FUNCTION public.get_my_staff_access() RETURNS TABLE(role text,display_name text,status text,onboarding_status text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT * FROM private.my_staff_status(); $$;
REVOKE ALL ON FUNCTION public.get_my_staff_access() FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_my_staff_access() TO authenticated;

-- Additive signature-version fields on the existing v2-consumed views.
CREATE OR REPLACE VIEW public.my_agreements WITH (security_invoker=true) AS  SELECT ca.id AS client_agreement_id,
    ca.agreement_key,
    at.name,
    at.document_type,
    ca.template_version,
    at.description,
    COALESCE(ca.rendered_content_text, at.content_text) AS content_text,
    ca.merge_values,
    ca.status,
    ca.required_client_signatures,
    ca.sent_at,
    ca.viewed_at,
    ca.signed_at,
    ( SELECT count(*) AS count
           FROM agreement_acceptances aa
          WHERE ca.status<>'waived' AND aa.client_agreement_id = ca.id AND aa.accepted_terms AND aa.content_hash=coalesce(ca.rendered_content_hash,ca.content_hash) AND (aa.signer_role = ANY (ARRAY['primary_client'::text, 'secondary_client'::text]))) AS signature_count,
    ( SELECT aa.signer_name
           FROM agreement_acceptances aa
          WHERE aa.client_agreement_id = ca.id AND aa.signer_role = 'primary_client'::text
         LIMIT 1) AS primary_signer_name,
    ( SELECT aa.signer_name
           FROM agreement_acceptances aa
          WHERE aa.client_agreement_id = ca.id AND aa.signer_role = 'secondary_client'::text
         LIMIT 1) AS secondary_signer_name,
    ( SELECT max(aa.signed_at) AS max
           FROM agreement_acceptances aa
          WHERE ca.status<>'waived' AND aa.client_agreement_id = ca.id AND aa.accepted_terms AND aa.content_hash=coalesce(ca.rendered_content_hash,ca.content_hash) AND (aa.signer_role = ANY (ARRAY['primary_client'::text, 'secondary_client'::text]))) AS acceptance_signed_at
,
    ca.content_hash,
    ca.rendered_content_hash
   FROM client_access access
     JOIN client_agreements ca ON ca.contact_id = access.contact_id
     JOIN agreement_templates at ON at.id = ca.agreement_template_id
  WHERE access.user_id = (( SELECT auth.uid() AS uid))
  ORDER BY ca.created_at;
CREATE OR REPLACE VIEW public.my_staff_agreements WITH (security_invoker=true) AS  SELECT sa.id AS staff_agreement_id,
    sa.agreement_key,
    at.name,
    sa.template_version,
    at.description,
    sa.rendered_content_text AS content_text,
    sa.status,
    sa.required,
    sa.sent_at,
    sa.viewed_at,
    sa.signed_at,
    acc.signer_name,
    acc.signed_at AS acceptance_signed_at
,
    sa.content_hash,
    sa.rendered_content_hash
   FROM staff_agreements sa
     JOIN agreement_templates at ON at.id = sa.agreement_template_id
     LEFT JOIN staff_agreement_acceptances acc ON acc.staff_agreement_id = sa.id
  WHERE sa.staff_user_id = (( SELECT auth.uid() AS uid))
  ORDER BY sa.created_at;
COMMIT;
