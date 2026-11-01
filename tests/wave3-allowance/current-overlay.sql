-- TEST ONLY: current metadata overlay; dependency schema is separately pinned.
BEGIN;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "client_agreement_id" uuid;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "signed_by_user_id" uuid;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "signer_name" text;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "signer_email" text;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "signature_type" text DEFAULT 'typed'::text;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "accepted_terms" boolean DEFAULT true;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "content_hash" text;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "signed_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "user_agent" text;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."agreement_acceptances" ADD COLUMN IF NOT EXISTS "signer_role" text DEFAULT 'primary_client'::text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "agreement_key" text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "version" text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "content_text" text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "content_hash" text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "requires_signature" boolean DEFAULT true;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "published_by" uuid;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "audience" text DEFAULT 'client'::text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "document_type" text DEFAULT 'general'::text;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "merge_schema" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."agreement_templates" ADD COLUMN IF NOT EXISTS "source_filename" text;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "challenge_id" uuid;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "household_id" uuid;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "scope" text;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "current_value" numeric DEFAULT 0;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "completion_percent" integer DEFAULT 0;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "points_earned" integer DEFAULT 0;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "enrolled_by" uuid;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "enrolled_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
ALTER TABLE "public"."challenge_enrollments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "activation_id" uuid;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "agreement_template_id" uuid;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "agreement_key" text;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "template_version" text;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "content_hash" text;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'not_sent'::text;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "sent_at" timestamp with time zone;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "viewed_at" timestamp with time zone;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "signed_at" timestamp with time zone;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "declined_at" timestamp with time zone;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "waived_at" timestamp with time zone;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "waived_by" uuid;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "waiver_reason" text;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "merge_values" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "rendered_content_text" text;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "rendered_content_hash" text;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "company_approved_by" uuid;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "company_approved_at" timestamp with time zone;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "company_approver_name" text;
ALTER TABLE "public"."client_agreements" ADD COLUMN IF NOT EXISTS "required_client_signatures" integer DEFAULT 1;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "course_id" uuid;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'program'::text;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "assigned_by" uuid;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "started_at" timestamp with time zone;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "progress_percent" integer DEFAULT 0;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "last_lesson_id" uuid;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "last_activity_at" timestamp with time zone;
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_course_enrollments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "household_id" uuid;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "scope" text DEFAULT 'individual'::text;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "goal_key" text;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "target_value" numeric;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "target_unit" text;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "baseline_value" numeric;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "target_date" date;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "priority" integer DEFAULT 3;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "created_by_type" text DEFAULT 'staff'::text;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_goals" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "frequency" text DEFAULT 'daily'::text;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "target_per_period" numeric DEFAULT 1;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "unit" text;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "starts_on" date DEFAULT CURRENT_DATE;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "ends_on" date;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_habits" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."community_memberships" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."community_memberships" ADD COLUMN IF NOT EXISTS "space_id" uuid;
ALTER TABLE "public"."community_memberships" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "public"."community_memberships" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."community_memberships" ADD COLUMN IF NOT EXISTS "membership_role" text DEFAULT 'member'::text;
ALTER TABLE "public"."community_memberships" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "public"."community_memberships" ADD COLUMN IF NOT EXISTS "joined_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."community_memberships" ADD COLUMN IF NOT EXISTS "left_at" timestamp with time zone;
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "habit_id" uuid;
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "checkin_date" date DEFAULT CURRENT_DATE;
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "value" numeric DEFAULT 1;
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'member'::text;
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."habit_checkins" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "journey_id" uuid;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "journey_step_id" uuid;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "program_code" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "program_name" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "billing_choice" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "commitment_months" integer;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "amount_cents" integer;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'USD'::text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "payment_provider" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "provider_customer_id" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "provider_subscription_id" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "provider_payment_id" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "payment_url" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending'::text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "agreement_status" text DEFAULT 'not_sent'::text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "agreement_url" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "agreement_signed_at" timestamp with time zone;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "access_status" text DEFAULT 'pending'::text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "payment_completion_method" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "payment_reference" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "agreement_completion_method" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "access_completion_method" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "last_manual_override_at" timestamp with time zone;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "last_manual_override_by" uuid;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "payment_waived_by" uuid;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "payment_waived_at" timestamp with time zone;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "payment_waiver_reason" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "plan_code" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "plan_price_id" uuid;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "market_code" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "merchant_route" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "billing_cadence" text;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "coverage_months" integer;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "minimum_contract_amount_cents" integer;
ALTER TABLE "public"."journey_enrollment_activations" ADD COLUMN IF NOT EXISTS "post_commitment_behavior" text;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "billing_plan_id" uuid;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "provider" text;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "provider_customer_id" text;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "provider_subscription_id" text;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "started_at" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "current_period_start" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "current_period_end" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "next_charge_at" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "commitment_ends_at" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "grace_period_ends_at" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "cancel_at_period_end" boolean DEFAULT false;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "ended_at" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "failed_payment_count" integer DEFAULT 0;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "last_payment_at" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "last_payment_amount_cents" integer;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "last_failure_at" timestamp with time zone;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."membership_subscriptions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "program_code" text;
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "agreement_template_id" uuid;
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "required" boolean DEFAULT true;
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true;
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 100;
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "billing_choice" text;
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "currency" text;
ALTER TABLE "public"."program_agreement_requirements" ADD COLUMN IF NOT EXISTS "plan_code" text;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "offer_id" uuid;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "invitation_id" uuid;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending'::text;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "amount_cents" integer;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'USD'::text;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "enrolled_by" uuid;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "enrolled_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "activated_at" timestamp with time zone;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "public"."refuel_enrollments" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "staff_agreement_id" uuid;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "staff_user_id" uuid;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "signer_name" text;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "signer_email" text;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "signature_type" text DEFAULT 'typed'::text;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "accepted_terms" boolean DEFAULT true;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "content_hash" text;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "signed_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "user_agent" text;
ALTER TABLE "public"."staff_agreement_acceptances" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "staff_user_id" uuid;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "agreement_template_id" uuid;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "agreement_key" text;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "template_version" text;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "content_hash" text;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "rendered_content_text" text;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "rendered_content_hash" text;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "merge_values" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'sent'::text;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "required" boolean DEFAULT true;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "sent_at" timestamp with time zone;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "viewed_at" timestamp with time zone;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "signed_at" timestamp with time zone;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "waived_at" timestamp with time zone;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "waived_by" uuid;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "waiver_reason" text;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "company_approved_by" uuid;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "company_approved_at" timestamp with time zone;
ALTER TABLE "public"."staff_agreements" ADD COLUMN IF NOT EXISTS "company_approver_name" text;
CREATE OR REPLACE FUNCTION private.active_staff_session()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.staff_access s WHERE s.user_id=auth.uid() AND s.status='active' AND (s.role<>'coach' OR s.onboarding_status IN ('complete','waived')));
$function$
;
ALTER FUNCTION private.active_staff_session() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.active_staff_session() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.active_staff_session() TO "postgres";
GRANT EXECUTE ON FUNCTION private.active_staff_session() TO "authenticated";
CREATE OR REPLACE FUNCTION private.agreement_signatures_satisfied(a client_agreements)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
 SELECT a.status='waived' OR (a.status='signed' AND
 (SELECT count(DISTINCT aa.signed_by_user_id) FROM public.agreement_acceptances aa WHERE aa.client_agreement_id=a.id AND aa.signer_role IN ('primary_client','secondary_client') AND aa.accepted_terms AND aa.content_hash=coalesce(a.rendered_content_hash,a.content_hash))>=a.required_client_signatures
 AND EXISTS(SELECT 1 FROM public.agreement_acceptances aa WHERE aa.client_agreement_id=a.id AND aa.signer_role='primary_client' AND aa.accepted_terms AND aa.content_hash=coalesce(a.rendered_content_hash,a.content_hash)));
$function$
;
ALTER FUNCTION private.agreement_signatures_satisfied(client_agreements) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.agreement_signatures_satisfied(client_agreements) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.agreement_signatures_satisfied(client_agreements) TO "postgres";
CREATE OR REPLACE FUNCTION private.audit_client_access_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_type text;
BEGIN
 IF TG_OP='UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id THEN RETURN NEW; END IF;
 INSERT INTO public.contact_activity(contact_id,activity_type,title,actor_user_id,metadata) VALUES(NEW.contact_id,'client_access_transition','Client access changed',auth.uid(),jsonb_build_object('from',CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END,'to',NEW.status,'reason',NEW.restriction_reason,'membership_id',NEW.membership_id));
 IF NEW.user_id IS NOT NULL AND NEW.status IN ('onboarding','payment_suspended','active') THEN
 v_type:=CASE WHEN NEW.status='payment_suspended' THEN 'billing_access_suspended' WHEN NEW.status='active' THEN 'billing_access_restored' ELSE 'billing_onboarding_required' END;
 INSERT INTO public.member_notifications(user_id,contact_id,notification_type,title,body,link_url,source_type) VALUES(NEW.user_id,NEW.contact_id,v_type,CASE WHEN NEW.status='active' THEN 'Your member access is ready' WHEN NEW.status='payment_suspended' THEN 'Payment resolution needed' ELSE 'Complete your enrollment' END,'Review your payment and agreement status in your account.','/member/onboarding/','client_access');
 END IF;
 RETURN NEW;
END; $function$
;
ALTER FUNCTION private.audit_client_access_transition() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.audit_client_access_transition() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.audit_client_access_transition() TO "postgres";
CREATE OR REPLACE FUNCTION private.complete_journey_action_from_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  if NEW.status='completed'
     and OLD.status is distinct from NEW.status
     and NEW.journey_action_id is not null then
    update public.journey_step_actions
    set status='completed',
        completed_by=(select auth.uid()),
        completed_at=coalesce(completed_at,now()),
        updated_at=now()
    where id=NEW.journey_action_id
      and status not in ('completed','cancelled');
  end if;
  return NEW;
end;
$function$
;
ALTER FUNCTION private.complete_journey_action_from_task() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.complete_journey_action_from_task() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.complete_journey_action_from_task() TO "postgres";
CREATE OR REPLACE FUNCTION private.create_coaching_session_prep_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_due timestamptz;
begin
  if NEW.status <> 'scheduled' or NEW.scheduled_start is null then
    return NEW;
  end if;

  v_due := greatest(now(),NEW.scheduled_start - interval '24 hours');

  insert into public.follow_up_tasks(
    contact_id,assigned_to,title,due_at,status,priority,task_type,instructions
  )
  select
    NEW.contact_id,
    NEW.coach_user_id,
    'Prepare for coaching session',
    v_due,
    'open',
    case when NEW.scheduled_start <= now()+interval '24 hours' then 'high' else 'normal' end,
    'coaching',
    'Review the client’s latest goals, habits, progress entries, weekly check-in, open assignments and prior coaching notes before the session.'
  where not exists (
    select 1
    from public.follow_up_tasks t
    where t.contact_id=NEW.contact_id
      and t.title='Prepare for coaching session'
      and t.status='open'
      and t.assigned_to=NEW.coach_user_id
      and abs(extract(epoch from (coalesce(t.due_at,v_due)-v_due))) < 300
  );

  return NEW;
end;
$function$
;
ALTER FUNCTION private.create_coaching_session_prep_task() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.create_coaching_session_prep_task() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.create_coaching_session_prep_task() TO "postgres";
CREATE OR REPLACE FUNCTION private.enrollment_gates_complete(a journey_enrollment_activations)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
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
$function$
;
ALTER FUNCTION private.enrollment_gates_complete(journey_enrollment_activations) OWNER TO "postgres";
CREATE OR REPLACE FUNCTION private.enrollment_payment_satisfied(a journey_enrollment_activations)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ SELECT false; $function$
;
ALTER FUNCTION private.enrollment_payment_satisfied(journey_enrollment_activations) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.enrollment_payment_satisfied(journey_enrollment_activations) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.enrollment_payment_satisfied(journey_enrollment_activations) TO "postgres";
CREATE OR REPLACE FUNCTION private.ensure_notification_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  insert into public.notification_preferences(user_id)
  values(NEW.user_id)
  on conflict (user_id) do nothing;
  return NEW;
end;
$function$
;
ALTER FUNCTION private.ensure_notification_preferences() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.ensure_notification_preferences() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.ensure_notification_preferences() TO "postgres";
CREATE OR REPLACE FUNCTION private.full_member_access()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.client_access ca JOIN public.client_memberships cm ON cm.id=ca.membership_id JOIN public.journey_enrollment_activations a ON a.id=cm.activation_id
 WHERE ca.user_id=auth.uid() AND ca.status='active' AND NOT ca.needs_onboarding_claim AND cm.status='active' AND a.access_status='active' AND private.enrollment_gates_complete(a));
$function$
;
ALTER FUNCTION private.full_member_access() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.full_member_access() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.full_member_access() TO "postgres";
GRANT EXECUTE ON FUNCTION private.full_member_access() TO "authenticated";
CREATE OR REPLACE FUNCTION private.guard_client_paid_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
BEGIN
 IF NEW.status='active' AND auth.role() IN ('authenticated','service_role') AND NOT EXISTS(SELECT 1 FROM public.client_memberships cm JOIN public.journey_enrollment_activations a ON a.id=cm.activation_id WHERE cm.id=NEW.membership_id AND cm.primary_contact_id=NEW.contact_id AND private.enrollment_gates_complete(a)) THEN RAISE EXCEPTION 'Payment and required agreements must be complete before full access'; END IF;
 RETURN NEW;
END; $function$
;
ALTER FUNCTION private.guard_client_paid_access() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.guard_client_paid_access() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.guard_client_paid_access() TO "postgres";
CREATE OR REPLACE FUNCTION private.issue_required_agreements_for_membership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
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
END $function$
;
ALTER FUNCTION private.issue_required_agreements_for_membership() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.issue_required_agreements_for_membership() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.issue_required_agreements_for_membership() TO "postgres";
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

  if t.id is null then return NEW; end if;

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

  update public.staff_access
  set onboarding_status='pending',updated_at=now()
  where user_id=NEW.user_id;

  return NEW;
end;
$function$
;
ALTER FUNCTION private.issue_required_coach_nda() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.issue_required_coach_nda() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.issue_required_coach_nda() TO "postgres";
CREATE OR REPLACE FUNCTION private.link_profile_to_client_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
DECLARE v_activation uuid;
BEGIN
 UPDATE public.client_access SET user_id=NEW.user_id,invited_at=coalesce(invited_at,now()),updated_at=now() WHERE contact_id=NEW.contact_id AND (user_id IS NULL OR user_id=NEW.user_id);
 SELECT cm.activation_id INTO v_activation FROM public.client_access ca JOIN public.client_memberships cm ON cm.id=ca.membership_id WHERE ca.contact_id=NEW.contact_id;
 IF v_activation IS NOT NULL THEN PERFORM private.refresh_client_lifecycle(v_activation); END IF;
 RETURN NEW;
END; $function$
;
ALTER FUNCTION private.link_profile_to_client_access() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.link_profile_to_client_access() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.link_profile_to_client_access() TO "postgres";
CREATE OR REPLACE FUNCTION private.notify_member_access_activation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_program_name text;
begin
  if NEW.status <> 'active' or NEW.user_id is null then
    return NEW;
  end if;

  if TG_OP='UPDATE'
     and OLD.status='active'
     and OLD.user_id is not distinct from NEW.user_id then
    return NEW;
  end if;

  select pc.name
  into v_program_name
  from public.client_memberships cm
  join public.program_catalog pc on pc.program_code=cm.program_code
  where cm.id=NEW.membership_id;

  insert into public.member_notifications(
    user_id,contact_id,notification_type,title,body,status,source_type,source_id
  )
  values(
    NEW.user_id,
    NEW.contact_id,
    'account_active',
    'Welcome to ReVitalized Academy',
    case
      when v_program_name is not null then 'Your '||v_program_name||' access is active.'
      else 'Your ReVitalized Academy access is active.'
    end,
    'unread',
    'membership',
    NEW.membership_id
  )
  on conflict do nothing;

  return NEW;
end;
$function$
;
ALTER FUNCTION private.notify_member_access_activation() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION private.production_client_agreement_publication_released()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(
   SELECT 1
   FROM public.app_runtime_config c
   WHERE c.config_key='production_client_agreement_publication'
     AND c.active
     AND c.config_value->>'status'='released'
 );
$function$
;
ALTER FUNCTION private.production_client_agreement_publication_released() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.production_client_agreement_publication_released() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.production_client_agreement_publication_released() TO "postgres";
CREATE OR REPLACE FUNCTION private.recalculate_coaching_entitlement_used_value(p_membership_id uuid, p_entitlement_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  update public.membership_entitlements me
  set used_value=coalesce((
        select sum(ceu.usage_units)
        from public.coaching_entitlement_usage ceu
        where ceu.membership_id=p_membership_id
          and ceu.entitlement_key=p_entitlement_key
          and ceu.status='consumed'
      ),0),
      updated_at=now()
  where me.membership_id=p_membership_id
    and me.entitlement_key=p_entitlement_key;
end;
$function$
;
ALTER FUNCTION private.recalculate_coaching_entitlement_used_value(uuid,text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.recalculate_coaching_entitlement_used_value(uuid,text) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.recalculate_coaching_entitlement_used_value(uuid,text) TO "postgres";
CREATE OR REPLACE FUNCTION private.reconcile_membership_entitlements(p_membership_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
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
      or not exists (
        select 1
        from public.program_entitlement_templates pet
        where pet.program_code = v_program_code
          and pet.entitlement_key = me.entitlement_key
          and pet.active
      )
    );

  if v_status in ('active','pending') then
    insert into public.membership_entitlements(
      membership_id, entitlement_key, label, status, limit_value,
      reset_cadence, metadata, updated_at
    )
    select
      p_membership_id,
      pet.entitlement_key,
      pet.label,
      'active',
      pet.limit_value,
      pet.reset_cadence,
      pet.metadata,
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
        updated_at = now();
  end if;
end;
$function$
;
ALTER FUNCTION private.reconcile_membership_entitlements(uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.reconcile_membership_entitlements(uuid) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.reconcile_membership_entitlements(uuid) TO "postgres";
CREATE OR REPLACE FUNCTION private.refresh_client_lifecycle(p_activation uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
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
END; $function$
;
ALTER FUNCTION private.refresh_client_lifecycle(uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.refresh_client_lifecycle(uuid) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.refresh_client_lifecycle(uuid) TO "postgres";
CREATE OR REPLACE FUNCTION private.render_agreement_content(p_template text, p_values jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare
  v_result text:=coalesce(p_template,'');
  r record;
begin
  for r in
    select key,value
    from jsonb_each_text(coalesce(p_values,'{}'::jsonb))
  loop
    v_result:=replace(v_result,'{{'||r.key||'}}',coalesce(r.value,''));
  end loop;
  return v_result;
end;
$function$
;
ALTER FUNCTION private.render_agreement_content(text,jsonb) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.render_agreement_content(text,jsonb) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.render_agreement_content(text,jsonb) TO "postgres";
CREATE OR REPLACE FUNCTION private.repair_coach_conversation_participants()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_conversation_id uuid;
  v_member_user uuid;
  v_old_coach uuid;
begin
  if NEW.assigned_coach_id is null then
    return NEW;
  end if;

  select user_id into v_member_user
  from public.client_access
  where contact_id=NEW.primary_contact_id
    and status='active'
  limit 1;

  v_conversation_id := private.ensure_coach_client_conversation(
    NEW.primary_contact_id,NEW.id,v_member_user,NEW.assigned_coach_id
  );

  if v_conversation_id is null then
    return NEW;
  end if;

  if TG_OP='UPDATE' and OLD.assigned_coach_id is distinct from NEW.assigned_coach_id and OLD.assigned_coach_id is not null then
    v_old_coach := OLD.assigned_coach_id;

    update public.member_conversation_participants
    set left_at=now()
    where conversation_id=v_conversation_id
      and user_id=v_old_coach
      and left_at is null;
  end if;

  return NEW;
end;
$function$
;
ALTER FUNCTION private.repair_coach_conversation_participants() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.repair_coach_conversation_participants() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.repair_coach_conversation_participants() TO "postgres";
CREATE OR REPLACE FUNCTION private.staff_action_allowed(p_user_id uuid, p_permission_key text, p_contact_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
 SELECT p_user_id IS NOT NULL AND
 CASE WHEN p_permission_key IN ('journey.step.status','journey.step.complete_assisted','journey.step.waive','plan.override','finance.record_payment','finance.reverse_payment','agreement.override','membership.access_override')
 THEN private.staff_has_permission(p_user_id,CASE WHEN p_permission_key LIKE 'journey.%' THEN 'crm.manage' ELSE 'finance.manage' END)
 AND EXISTS(SELECT 1 FROM public.staff_access s JOIN public.staff_role_permissions r ON r.role=s.role WHERE s.user_id=p_user_id AND s.status='active' AND r.permission_key=p_permission_key AND r.allowed)
 ELSE private.staff_has_permission(p_user_id,p_permission_key) END
 AND (p_contact_id IS NULL OR private.staff_can_access_contact(p_user_id,p_contact_id));
$function$
;
ALTER FUNCTION private.staff_action_allowed(uuid,text,uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.staff_action_allowed(uuid,text,uuid) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.staff_action_allowed(uuid,text,uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION private.staff_action_allowed(uuid,text,uuid) TO "authenticated";
CREATE OR REPLACE FUNCTION private.staff_can_access_contact(p_user_id uuid, p_contact_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
  select exists(
    select 1
    from public.staff_access sa
    where sa.user_id=p_user_id
      and sa.status='active'
      and private.staff_has_permission(p_user_id,'crm.view')
      and (
        sa.contact_scope='all'
        or (
          sa.contact_scope='assigned'
          and (
            exists(
              select 1 from public.contacts c
              where c.id=p_contact_id and c.assigned_to=p_user_id
            )
            or exists(
              select 1 from public.client_coach_assignments cca
              where cca.contact_id=p_contact_id
                and cca.coach_user_id=p_user_id
                and cca.status='active'
            )
            or exists(
              select 1 from public.follow_up_tasks t
              where t.contact_id=p_contact_id
                and t.assigned_to=p_user_id
                and t.status='open'
            )
          )
        )
      )
  );
$function$
;
ALTER FUNCTION private.staff_can_access_contact(uuid,uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.staff_can_access_contact(uuid,uuid) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.staff_can_access_contact(uuid,uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION private.staff_can_access_contact(uuid,uuid) TO "anon";
GRANT EXECUTE ON FUNCTION private.staff_can_access_contact(uuid,uuid) TO "authenticated";
CREATE OR REPLACE FUNCTION private.staff_has_permission(p_user_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
  select case
    when exists(
      select 1
      from public.staff_access sa
      where sa.user_id=p_user_id
        and sa.status='active'
        and sa.role='coach'
        and sa.onboarding_status='pending'
    ) then false
    else coalesce(
      (
        select spo.allowed
        from public.staff_permission_overrides spo
        where spo.user_id=p_user_id
          and spo.permission_key=p_permission_key
      ),
      (
        select srpd.allowed
        from public.staff_access sa
        join public.staff_role_permission_defaults srpd
          on srpd.role=sa.role
         and srpd.permission_key=p_permission_key
        where sa.user_id=p_user_id
          and sa.status='active'
      ),
      false
    )
  end;
$function$
;
ALTER FUNCTION private.staff_has_permission(uuid,text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.staff_has_permission(uuid,text) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.staff_has_permission(uuid,text) TO "postgres";
GRANT EXECUTE ON FUNCTION private.staff_has_permission(uuid,text) TO "anon";
GRANT EXECUTE ON FUNCTION private.staff_has_permission(uuid,text) TO "authenticated";
CREATE OR REPLACE FUNCTION private.sync_access_to_community()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  if NEW.status='active' and NEW.user_id is not null and NEW.membership_id is not null then
    perform private.sync_member_community_access_record(NEW.membership_id);
  end if;
  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_access_to_community() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_access_to_community() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_access_to_community() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_coach_client_conversation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_user_id uuid;
  v_coach_id uuid;
  v_membership_id uuid;
begin
  if TG_TABLE_NAME='client_access' then
    if NEW.status <> 'active' or NEW.user_id is null then return NEW; end if;
    v_user_id := NEW.user_id;
    v_membership_id := NEW.membership_id;
    select assigned_coach_id into v_coach_id
    from public.client_memberships where id=NEW.membership_id;
    perform private.ensure_coach_client_conversation(
      NEW.contact_id,v_membership_id,v_user_id,v_coach_id
    );
    return NEW;
  end if;

  if TG_TABLE_NAME='client_memberships' then
    if NEW.assigned_coach_id is null then return NEW; end if;
    select user_id into v_user_id
    from public.client_access
    where contact_id=NEW.primary_contact_id and status='active';
    perform private.ensure_coach_client_conversation(
      NEW.primary_contact_id,NEW.id,v_user_id,NEW.assigned_coach_id
    );
    return NEW;
  end if;

  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_coach_client_conversation() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_coach_client_conversation() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_coach_client_conversation() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_coaching_session_entitlement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_entitlement_id uuid;
  v_new_status text;
  v_review_reason text;
begin
  if NEW.membership_id is null then
    return NEW;
  end if;

  select id into v_entitlement_id
  from public.membership_entitlements
  where membership_id=NEW.membership_id
    and entitlement_key='private_coaching'
    and status='active'
  limit 1;

  -- The ledger can still track a session when there is not yet a numeric limit.
  if NEW.status='scheduled' then
    v_new_status:='reserved';
  elsif NEW.status='completed' then
    v_new_status:='consumed';
  elsif NEW.status='cancelled' then
    v_new_status:='released';
  elsif NEW.status='no_show' then
    v_new_status:='review';
    v_review_reason:='No-show requires staff determination before consuming or releasing an entitlement.';
  else
    return NEW;
  end if;

  insert into public.coaching_entitlement_usage(
    membership_id,entitlement_id,coaching_session_id,contact_id,
    entitlement_key,usage_units,status,reserved_at,consumed_at,released_at,review_reason
  )
  values(
    NEW.membership_id,v_entitlement_id,NEW.id,NEW.contact_id,
    'private_coaching',1,v_new_status,
    case when v_new_status='reserved' then coalesce(NEW.created_at,now()) else null end,
    case when v_new_status='consumed' then coalesce(NEW.completed_at,now()) else null end,
    case when v_new_status='released' then now() else null end,
    v_review_reason
  )
  on conflict (coaching_session_id) do update
  set entitlement_id=coalesce(excluded.entitlement_id,public.coaching_entitlement_usage.entitlement_id),
      status=excluded.status,
      reserved_at=case
        when excluded.status='reserved' then coalesce(public.coaching_entitlement_usage.reserved_at,now())
        else public.coaching_entitlement_usage.reserved_at
      end,
      consumed_at=case when excluded.status='consumed' then coalesce(public.coaching_entitlement_usage.consumed_at,now()) else null end,
      released_at=case when excluded.status='released' then coalesce(public.coaching_entitlement_usage.released_at,now()) else null end,
      review_reason=excluded.review_reason,
      updated_at=now();

  perform private.recalculate_coaching_entitlement_used_value(NEW.membership_id,'private_coaching');

  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_coaching_session_entitlement() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_coaching_session_entitlement() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_coaching_session_entitlement() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_coaching_session_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  if TG_OP='UPDATE' and OLD.status is distinct from NEW.status
     and NEW.status in ('completed','cancelled','no_show') then

    update public.follow_up_tasks
    set status='completed',
        completed_at=coalesce(completed_at,now())
    where contact_id=NEW.contact_id
      and assigned_to=NEW.coach_user_id
      and title='Prepare for coaching session'
      and status='open';

    if NEW.status='completed' and NEW.completed_at is null then
      update public.coaching_sessions
      set completed_at=now(),updated_at=now()
      where id=NEW.id;
    end if;

    insert into public.contact_activity(
      contact_id,activity_type,title,detail,actor_user_id,metadata
    )
    values(
      NEW.contact_id,
      case
        when NEW.status='completed' then 'coaching_session_completed'
        when NEW.status='no_show' then 'coaching_session_no_show'
        else 'coaching_session_cancelled'
      end,
      case
        when NEW.status='completed' then 'Coaching session completed'
        when NEW.status='no_show' then 'Coaching session missed'
        else 'Coaching session cancelled'
      end,
      case when NEW.scheduled_start is not null then NEW.scheduled_start::text else null end,
      NEW.coach_user_id,
      jsonb_build_object('session_id',NEW.id,'status',NEW.status)
    );
  end if;

  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_coaching_session_status() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_coaching_session_status() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_coaching_session_status() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_household_conversation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_household_id uuid;
  v_membership_id uuid;
begin
  if TG_TABLE_NAME='client_access' then
    if NEW.status='active' and NEW.user_id is not null and NEW.household_id is not null then
      perform private.ensure_household_conversation(
        NEW.household_id,NEW.membership_id,NEW.user_id
      );
    end if;
    return NEW;
  end if;

  if TG_TABLE_NAME='household_members' then
    v_household_id := coalesce(NEW.household_id,OLD.household_id);

    select ca.membership_id into v_membership_id
    from public.client_access ca
    where ca.household_id=v_household_id
      and ca.membership_id is not null
    order by ca.created_at
    limit 1;

    perform private.ensure_household_conversation(
      v_household_id,v_membership_id,(select auth.uid())
    );
    return coalesce(NEW,OLD);
  end if;

  return coalesce(NEW,OLD);
end;
$function$
;
ALTER FUNCTION private.sync_household_conversation() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_household_conversation() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_household_conversation() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_member_community_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_user uuid;
  v_space uuid;
  v_household_space uuid;
begin
  if NEW.status<>'active' then return NEW; end if;

  select ca.user_id into v_user
  from public.client_access ca
  where ca.contact_id=NEW.primary_contact_id and ca.status='active';

  if v_user is null then return NEW; end if;

  v_space := private.ensure_program_community_space(NEW.program_code);

  if v_space is not null then
    insert into public.community_memberships(space_id,user_id,contact_id,membership_role,status)
    values(v_space,v_user,NEW.primary_contact_id,'member','active')
    on conflict (space_id,user_id) do update set
      contact_id=excluded.contact_id,status='active',left_at=null;
  end if;

  if NEW.household_id is not null then
    insert into public.community_spaces(
      space_key,name,description,space_type,household_id,status,posting_mode,created_by
    )
    select
      'household:'||NEW.household_id::text,
      coalesce(h.household_name,'ReVitalized Household'),
      'Private ReVitalized family space.',
      'household',NEW.household_id,'active','members',NEW.created_by
    from public.households h
    where h.id=NEW.household_id
    on conflict (space_key) do update set status='active',updated_at=now()
    returning id into v_household_space;

    insert into public.community_memberships(space_id,user_id,contact_id,membership_role,status)
    values(v_household_space,v_user,NEW.primary_contact_id,'owner','active')
    on conflict (space_id,user_id) do update set
      contact_id=excluded.contact_id,membership_role='owner',status='active',left_at=null;
  end if;

  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_member_community_access() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_member_community_access() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_member_community_access() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_membership_entitlements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  perform private.reconcile_membership_entitlements(NEW.id);
  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_membership_entitlements() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_primary_coach_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  if NEW.assigned_coach_id is null then
    update public.client_coach_assignments
    set status='inactive',ended_at=now()
    where contact_id=NEW.primary_contact_id
      and role='primary'
      and status='active';
    return NEW;
  end if;

  update public.client_coach_assignments
  set status='inactive',ended_at=now()
  where contact_id=NEW.primary_contact_id
    and role='primary'
    and status='active'
    and coach_user_id <> NEW.assigned_coach_id;

  insert into public.client_coach_assignments(
    contact_id,membership_id,coach_user_id,role,status,assigned_at,assigned_by
  )
  values(
    NEW.primary_contact_id,NEW.id,NEW.assigned_coach_id,'primary','active',now(),NEW.created_by
  )
  on conflict (contact_id,coach_user_id,role) do update
  set membership_id=excluded.membership_id,
      status='active',
      ended_at=null,
      assigned_at=now();

  update public.contacts
  set assigned_to=NEW.assigned_coach_id,updated_at=now()
  where id=NEW.primary_contact_id;

  update public.contact_journeys
  set assigned_to=NEW.assigned_coach_id,updated_at=now()
  where contact_id=NEW.primary_contact_id
    and status in ('active','paused','nurture');

  update public.follow_up_tasks
  set assigned_to=NEW.assigned_coach_id
  where contact_id=NEW.primary_contact_id
    and status='open'
    and assigned_to is null;

  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_primary_coach_assignment() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_primary_coach_assignment() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_primary_coach_assignment() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_program_challenges_from_membership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  perform private.reconcile_membership_challenge_access(NEW.id);
  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_program_challenges_from_membership() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_program_learning_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  perform private.reconcile_membership_course_access(NEW.id);
  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_program_learning_access() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_program_learning_access() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_program_learning_access() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_referral_profile_from_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  if NEW.status='active' and NEW.user_id is not null then
    perform private.ensure_referral_profile(NEW.contact_id,NEW.user_id);
  end if;
  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_referral_profile_from_access() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_referral_profile_from_access() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_referral_profile_from_access() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_referral_status_from_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  r record;
  p public.referral_programs%rowtype;
begin
  if TG_OP='UPDATE' and OLD.lifecycle_stage is not distinct from NEW.lifecycle_stage then
    return NEW;
  end if;

  if NEW.lifecycle_stage='applicant' then
    update public.referrals
    set status='applicant',updated_at=now()
    where referred_contact_id=NEW.id
      and status in ('referred','engaged');
  elsif NEW.lifecycle_stage='client' then
    update public.referrals
    set status='converted',
        converted_at=coalesce(converted_at,now()),
        updated_at=now()
    where referred_contact_id=NEW.id
      and status not in ('converted','cancelled','ineligible');

    for r in
      select *
      from public.referrals
      where referred_contact_id=NEW.id
        and status='converted'
        and referrer_contact_id is not null
    loop
      if r.referral_program_id is not null then
        select * into p
        from public.referral_programs
        where id=r.referral_program_id
          and status='published';

        if p.id is not null and coalesce(p.reward_type,'none')<>'none' then
          insert into public.referral_rewards(
            referral_id,referrer_contact_id,reward_type,reward_value,currency,status
          )
          select
            r.id,r.referrer_contact_id,p.reward_type,p.reward_value,p.currency,'pending'
          where not exists(
            select 1 from public.referral_rewards rr where rr.referral_id=r.id
          );
        end if;
      end if;
    end loop;
  elsif NEW.lifecycle_stage in ('assessment_lead','webinar_lead') then
    update public.referrals
    set status='engaged',updated_at=now()
    where referred_contact_id=NEW.id
      and status='referred';
  end if;

  return NEW;
end;
$function$
;
ALTER FUNCTION private.sync_referral_status_from_contact() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_referral_status_from_contact() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_referral_status_from_contact() TO "postgres";
CREATE OR REPLACE FUNCTION private.sync_staff_directory()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
begin
  if tg_op = 'DELETE' then
    delete from public.staff_directory where user_id = old.user_id;
    return old;
  end if;

  insert into public.staff_directory (user_id, display_name, role, updated_at)
  values (new.user_id, new.display_name, new.role, now())
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      role = excluded.role,
      updated_at = now();

  return new;
end;
$function$
;
ALTER FUNCTION private.sync_staff_directory() OWNER TO "postgres";
REVOKE ALL ON FUNCTION private.sync_staff_directory() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION private.sync_staff_directory() TO "postgres";
CREATE OR REPLACE FUNCTION public.member_paid_access_allowed()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'private'
AS $function$ SELECT private.full_member_access(); $function$
;
ALTER FUNCTION public.member_paid_access_allowed() OWNER TO "postgres";
REVOKE ALL ON FUNCTION public.member_paid_access_allowed() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.member_paid_access_allowed() TO "postgres";
GRANT EXECUTE ON FUNCTION public.member_paid_access_allowed() TO "authenticated";
CREATE OR REPLACE FUNCTION public.resolve_coaching_entitlement_review(p_usage_id uuid, p_resolution text, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  u public.coaching_entitlement_usage%rowtype;
begin
  if not private.staff_has_permission((select auth.uid()),'coaching.manage') then
    raise exception 'Coaching management permission required';
  end if;

  if p_resolution not in ('consumed','released') then
    raise exception 'Resolution must be consumed or released';
  end if;

  if nullif(trim(p_reason),'') is null then
    raise exception 'Resolution reason is required';
  end if;

  select * into u from public.coaching_entitlement_usage where id=p_usage_id;
  if u.id is null then raise exception 'Entitlement usage record not found'; end if;

  update public.coaching_entitlement_usage
  set status=p_resolution,
      consumed_at=case when p_resolution='consumed' then now() else null end,
      released_at=case when p_resolution='released' then now() else null end,
      review_reason=trim(p_reason),
      updated_by=(select auth.uid()),
      updated_at=now()
  where id=u.id;

  perform private.recalculate_coaching_entitlement_used_value(u.membership_id,u.entitlement_key);
end;
$function$
;
ALTER FUNCTION public.resolve_coaching_entitlement_review(uuid,text,text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION public.resolve_coaching_entitlement_review(uuid,text,text) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.resolve_coaching_entitlement_review(uuid,text,text) TO "postgres";
GRANT EXECUTE ON FUNCTION public.resolve_coaching_entitlement_review(uuid,text,text) TO "authenticated";
GRANT EXECUTE ON FUNCTION public.resolve_coaching_entitlement_review(uuid,text,text) TO "service_role";
CREATE OR REPLACE FUNCTION public.staff_action_allowed(p_permission_key text, p_contact_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
 SELECT private.staff_action_allowed(auth.uid(),p_permission_key,p_contact_id);
$function$
;
ALTER FUNCTION public.staff_action_allowed(text,uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION public.staff_action_allowed(text,uuid) FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.staff_action_allowed(text,uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION public.staff_action_allowed(text,uuid) TO "authenticated";
CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end $function$
;
ALTER FUNCTION public.touch_updated_at() OWNER TO "postgres";
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO "postgres";
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO "anon";
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO "authenticated";
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO "service_role";
ALTER TABLE "public"."client_access" OWNER TO "postgres";
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "household_id" uuid;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'ready'::text;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "ready_at" timestamp with time zone;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "invited_at" timestamp with time zone;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "activated_at" timestamp with time zone;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "last_seen_at" timestamp with time zone;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "restriction_reason" text;
ALTER TABLE "public"."client_access" ADD COLUMN IF NOT EXISTS "needs_onboarding_claim" boolean DEFAULT false;
ALTER TABLE "public"."client_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."client_access" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.client_access'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."client_access"',p.polname); END LOOP; END $x$;
CREATE POLICY "client_access_staff_insert" ON "public"."client_access" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "client_access_staff_or_self_select" ON "public"."client_access" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))) OR (user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "client_access_staff_update" ON "public"."client_access" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.client_access'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."client_access"',t.tgname); END LOOP; END $x$;
CREATE TRIGGER audit_client_access_transition AFTER INSERT OR UPDATE OF status, user_id ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.audit_client_access_transition();
ALTER TABLE "public"."client_access" ENABLE TRIGGER "audit_client_access_transition";
CREATE TRIGGER guard_client_paid_access BEFORE INSERT OR UPDATE ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.guard_client_paid_access();
ALTER TABLE "public"."client_access" ENABLE TRIGGER "guard_client_paid_access";
CREATE TRIGGER notify_member_access_activation_trigger AFTER INSERT OR UPDATE OF status, user_id, membership_id ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.notify_member_access_activation();
ALTER TABLE "public"."client_access" ENABLE TRIGGER "notify_member_access_activation_trigger";
CREATE TRIGGER sync_access_to_community_trigger AFTER INSERT OR UPDATE OF status, user_id, membership_id ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.sync_access_to_community();
ALTER TABLE "public"."client_access" ENABLE TRIGGER "sync_access_to_community_trigger";
CREATE TRIGGER sync_conversation_from_access_trigger AFTER INSERT OR UPDATE OF status, user_id, membership_id ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.sync_coach_client_conversation();
ALTER TABLE "public"."client_access" ENABLE TRIGGER "sync_conversation_from_access_trigger";
CREATE TRIGGER sync_household_conversation_from_access AFTER INSERT OR UPDATE OF status, user_id, household_id, membership_id ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.sync_household_conversation();
ALTER TABLE "public"."client_access" ENABLE TRIGGER "sync_household_conversation_from_access";
CREATE TRIGGER sync_referral_profile_from_access_trigger AFTER INSERT OR UPDATE OF status, user_id ON public.client_access FOR EACH ROW EXECUTE FUNCTION private.sync_referral_profile_from_access();
ALTER TABLE "public"."client_access" ENABLE TRIGGER "sync_referral_profile_from_access_trigger";
REVOKE ALL ON TABLE "public"."client_access" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_access" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_access" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_access" TO "service_role";
ALTER TABLE "public"."client_coach_assignments" OWNER TO "postgres";
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "coach_user_id" uuid;
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'primary'::text;
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "assigned_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "ended_at" timestamp with time zone;
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "assigned_by" uuid;
ALTER TABLE "public"."client_coach_assignments" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "public"."client_coach_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."client_coach_assignments" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.client_coach_assignments'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."client_coach_assignments"',p.polname); END LOOP; END $x$;
CREATE POLICY "client_coach_assignments_select" ON "public"."client_coach_assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((contact_id IN ( SELECT ca.contact_id
   FROM client_access ca
  WHERE (ca.user_id = ( SELECT auth.uid() AS uid)))) OR (private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.view'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id))));
CREATE POLICY "client_coach_assignments_staff_insert" ON "public"."client_coach_assignments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id)));
CREATE POLICY "client_coach_assignments_staff_update" ON "public"."client_coach_assignments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id))) WITH CHECK ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id)));
CREATE POLICY "lifecycle_paid_access" ON "public"."client_coach_assignments" AS RESTRICTIVE FOR ALL TO "authenticated" USING ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))) WITH CHECK ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.client_coach_assignments'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."client_coach_assignments"',t.tgname); END LOOP; END $x$;
REVOKE ALL ON TABLE "public"."client_coach_assignments" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_coach_assignments" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_coach_assignments" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_coach_assignments" TO "service_role";
ALTER TABLE "public"."client_memberships" OWNER TO "postgres";
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "household_id" uuid;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "primary_contact_id" uuid;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "activation_id" uuid;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "program_code" text;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "billing_choice" text;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "amount_cents" integer;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'USD'::text;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "commitment_months" integer;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "starts_at" timestamp with time zone;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "commitment_ends_at" timestamp with time zone;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "ends_at" timestamp with time zone;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "assigned_coach_id" uuid;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "plan_code" text;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "plan_price_id" uuid;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "market_code" text;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "merchant_route" text;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "billing_cadence" text;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "coverage_months" integer;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "minimum_contract_amount_cents" integer;
ALTER TABLE "public"."client_memberships" ADD COLUMN IF NOT EXISTS "post_commitment_behavior" text;
ALTER TABLE "public"."client_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."client_memberships" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.client_memberships'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."client_memberships"',p.polname); END LOOP; END $x$;
CREATE POLICY "client_memberships_staff_insert" ON "public"."client_memberships" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "client_memberships_staff_or_member_select" ON "public"."client_memberships" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))) OR (id IN ( SELECT ca.membership_id
   FROM client_access ca
  WHERE (ca.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "client_memberships_staff_update" ON "public"."client_memberships" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "lifecycle_paid_access" ON "public"."client_memberships" AS RESTRICTIVE FOR ALL TO "authenticated" USING ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))) WITH CHECK ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.client_memberships'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."client_memberships"',t.tgname); END LOOP; END $x$;
CREATE TRIGGER issue_required_agreements_trigger AFTER INSERT OR UPDATE OF program_code, status ON public.client_memberships FOR EACH ROW EXECUTE FUNCTION private.issue_required_agreements_for_membership();
ALTER TABLE "public"."client_memberships" ENABLE TRIGGER "issue_required_agreements_trigger";
CREATE TRIGGER repair_coach_conversation_participants_trigger AFTER INSERT OR UPDATE OF assigned_coach_id, status ON public.client_memberships FOR EACH ROW EXECUTE FUNCTION private.repair_coach_conversation_participants();
ALTER TABLE "public"."client_memberships" ENABLE TRIGGER "repair_coach_conversation_participants_trigger";
CREATE TRIGGER sync_conversation_from_membership_trigger AFTER INSERT OR UPDATE OF assigned_coach_id, status ON public.client_memberships FOR EACH ROW EXECUTE FUNCTION private.sync_coach_client_conversation();
ALTER TABLE "public"."client_memberships" ENABLE TRIGGER "sync_conversation_from_membership_trigger";
CREATE TRIGGER sync_member_community_access_trigger AFTER INSERT OR UPDATE OF status, program_code, household_id ON public.client_memberships FOR EACH ROW EXECUTE FUNCTION private.sync_member_community_access();
ALTER TABLE "public"."client_memberships" ENABLE TRIGGER "sync_member_community_access_trigger";
CREATE TRIGGER sync_membership_entitlements_trigger AFTER INSERT OR UPDATE OF program_code, status ON public.client_memberships FOR EACH ROW EXECUTE FUNCTION private.sync_membership_entitlements();
ALTER TABLE "public"."client_memberships" ENABLE TRIGGER "sync_membership_entitlements_trigger";
CREATE TRIGGER sync_primary_coach_assignment_trigger AFTER INSERT OR UPDATE OF assigned_coach_id ON public.client_memberships FOR EACH ROW EXECUTE FUNCTION private.sync_primary_coach_assignment();
ALTER TABLE "public"."client_memberships" ENABLE TRIGGER "sync_primary_coach_assignment_trigger";
CREATE TRIGGER sync_program_challenges_from_membership_trigger AFTER INSERT OR UPDATE OF program_code, status ON public.client_memberships FOR EACH ROW EXECUTE FUNCTION private.sync_program_challenges_from_membership();
ALTER TABLE "public"."client_memberships" ENABLE TRIGGER "sync_program_challenges_from_membership_trigger";
CREATE TRIGGER sync_program_learning_access_trigger AFTER INSERT OR UPDATE OF status, program_code ON public.client_memberships FOR EACH ROW EXECUTE FUNCTION private.sync_program_learning_access();
ALTER TABLE "public"."client_memberships" ENABLE TRIGGER "sync_program_learning_access_trigger";
REVOKE ALL ON TABLE "public"."client_memberships" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_memberships" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_memberships" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."client_memberships" TO "service_role";
ALTER TABLE "public"."coaching_entitlement_usage" OWNER TO "postgres";
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "entitlement_id" uuid;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "coaching_session_id" uuid;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "entitlement_key" text DEFAULT 'private_coaching'::text;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "usage_units" integer DEFAULT 1;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'reserved'::text;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "reserved_at" timestamp with time zone;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "consumed_at" timestamp with time zone;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "released_at" timestamp with time zone;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "review_reason" text;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "updated_by" uuid;
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."coaching_entitlement_usage" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."coaching_entitlement_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."coaching_entitlement_usage" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.coaching_entitlement_usage'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."coaching_entitlement_usage"',p.polname); END LOOP; END $x$;
CREATE POLICY "coaching_entitlement_usage_access" ON "public"."coaching_entitlement_usage" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((contact_id IN ( SELECT ca.contact_id
   FROM client_access ca
  WHERE (ca.user_id = ( SELECT auth.uid() AS uid)))) OR private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.view'::text)));
CREATE POLICY "coaching_entitlement_usage_staff_insert" ON "public"."coaching_entitlement_usage" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text));
CREATE POLICY "coaching_entitlement_usage_staff_update" ON "public"."coaching_entitlement_usage" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text)) WITH CHECK (private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text));
CREATE POLICY "lifecycle_paid_access" ON "public"."coaching_entitlement_usage" AS RESTRICTIVE FOR ALL TO "authenticated" USING ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))) WITH CHECK ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.coaching_entitlement_usage'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."coaching_entitlement_usage"',t.tgname); END LOOP; END $x$;
REVOKE ALL ON TABLE "public"."coaching_entitlement_usage" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."coaching_entitlement_usage" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."coaching_entitlement_usage" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."coaching_entitlement_usage" TO "service_role";
ALTER TABLE "public"."coaching_sessions" OWNER TO "postgres";
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "coach_user_id" uuid;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "appointment_id" uuid;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "session_number" integer;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'scheduled'::text;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "scheduled_start" timestamp with time zone;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "scheduled_end" timestamp with time zone;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "format" text;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "location_url" text;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "client_agenda" text;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."coaching_sessions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."coaching_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."coaching_sessions" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.coaching_sessions'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."coaching_sessions"',p.polname); END LOOP; END $x$;
CREATE POLICY "coaching_sessions_select" ON "public"."coaching_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((contact_id IN ( SELECT ca.contact_id
   FROM client_access ca
  WHERE (ca.user_id = ( SELECT auth.uid() AS uid)))) OR (private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.view'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id))));
CREATE POLICY "coaching_sessions_staff_insert" ON "public"."coaching_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id)));
CREATE POLICY "coaching_sessions_staff_update" ON "public"."coaching_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id))) WITH CHECK ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'coaching.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id)));
CREATE POLICY "lifecycle_paid_access" ON "public"."coaching_sessions" AS RESTRICTIVE FOR ALL TO "authenticated" USING ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))) WITH CHECK ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.coaching_sessions'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."coaching_sessions"',t.tgname); END LOOP; END $x$;
CREATE TRIGGER create_coaching_session_prep_task_trigger AFTER INSERT OR UPDATE OF status, scheduled_start, coach_user_id ON public.coaching_sessions FOR EACH ROW EXECUTE FUNCTION private.create_coaching_session_prep_task();
ALTER TABLE "public"."coaching_sessions" ENABLE TRIGGER "create_coaching_session_prep_task_trigger";
CREATE TRIGGER sync_coaching_session_entitlement_trigger AFTER INSERT OR UPDATE OF status, membership_id ON public.coaching_sessions FOR EACH ROW EXECUTE FUNCTION private.sync_coaching_session_entitlement();
ALTER TABLE "public"."coaching_sessions" ENABLE TRIGGER "sync_coaching_session_entitlement_trigger";
CREATE TRIGGER sync_coaching_session_status_trigger AFTER UPDATE OF status ON public.coaching_sessions FOR EACH ROW EXECUTE FUNCTION private.sync_coaching_session_status();
ALTER TABLE "public"."coaching_sessions" ENABLE TRIGGER "sync_coaching_session_status_trigger";
REVOKE ALL ON TABLE "public"."coaching_sessions" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."coaching_sessions" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."coaching_sessions" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."coaching_sessions" TO "service_role";
ALTER TABLE "public"."contacts" OWNER TO "postgres";
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "first_name" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "last_name" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "state" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "country" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "lifecycle_stage" text DEFAULT 'lead'::text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "first_source" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "last_source" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "follow_up_status" text DEFAULT 'new'::text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "consultation_status" text DEFAULT 'not_scheduled'::text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "assigned_to" uuid;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "next_follow_up_at" timestamp with time zone;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "record_kind" text DEFAULT 'crm'::text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "referral_source" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "sales_rep_name" text;
ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS "referral_source_other" text;
ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contacts" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.contacts'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."contacts"',p.polname); END LOOP; END $x$;
CREATE POLICY "contacts_member_household_or_staff_select" ON "public"."contacts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.staff_can_access_contact(( SELECT auth.uid() AS uid), id) OR (id IN ( SELECT p.contact_id
   FROM profiles p
  WHERE (p.user_id = ( SELECT auth.uid() AS uid)))) OR (id IN ( SELECT hm.contact_id
   FROM (household_members hm
     JOIN client_access ca ON ((ca.household_id = hm.household_id)))
  WHERE (ca.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "contacts_member_or_staff_update" ON "public"."contacts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((private.staff_has_permission(( SELECT auth.uid() AS uid), 'crm.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), id)) OR (id IN ( SELECT p.contact_id
   FROM profiles p
  WHERE (p.user_id = ( SELECT auth.uid() AS uid)))))) WITH CHECK (((private.staff_has_permission(( SELECT auth.uid() AS uid), 'crm.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), id)) OR (id IN ( SELECT p.contact_id
   FROM profiles p
  WHERE (p.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "contacts_staff_insert" ON "public"."contacts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'crm.manage'::text) AND (EXISTS ( SELECT 1
   FROM staff_access sa
  WHERE ((sa.user_id = ( SELECT auth.uid() AS uid)) AND (sa.status = 'active'::text) AND (sa.contact_scope <> 'none'::text))))));
CREATE POLICY "lifecycle_paid_access" ON "public"."contacts" AS RESTRICTIVE FOR ALL TO "authenticated" USING ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))) WITH CHECK ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.contacts'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."contacts"',t.tgname); END LOOP; END $x$;
CREATE TRIGGER contacts_touch BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
ALTER TABLE "public"."contacts" ENABLE TRIGGER "contacts_touch";
CREATE TRIGGER sync_referral_status_from_contact_trigger AFTER UPDATE OF lifecycle_stage ON public.contacts FOR EACH ROW EXECUTE FUNCTION private.sync_referral_status_from_contact();
ALTER TABLE "public"."contacts" ENABLE TRIGGER "sync_referral_status_from_contact_trigger";
REVOKE ALL ON TABLE "public"."contacts" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."contacts" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."contacts" TO "anon";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."contacts" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."contacts" TO "service_role";
ALTER TABLE "public"."follow_up_tasks" OWNER TO "postgres";
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "assigned_to" uuid;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "title" text;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "due_at" timestamp with time zone;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'open'::text;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'normal'::text;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "task_type" text DEFAULT 'general'::text;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "journey_id" uuid;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "journey_step_id" uuid;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "journey_action_id" uuid;
ALTER TABLE "public"."follow_up_tasks" ADD COLUMN IF NOT EXISTS "instructions" text;
ALTER TABLE "public"."follow_up_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."follow_up_tasks" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.follow_up_tasks'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."follow_up_tasks"',p.polname); END LOOP; END $x$;
CREATE POLICY "follow_up_tasks_staff_delete" ON "public"."follow_up_tasks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'crm.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id)));
CREATE POLICY "follow_up_tasks_staff_insert" ON "public"."follow_up_tasks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'crm.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id)));
CREATE POLICY "follow_up_tasks_staff_select" ON "public"."follow_up_tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id));
CREATE POLICY "follow_up_tasks_staff_update" ON "public"."follow_up_tasks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'crm.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id))) WITH CHECK ((private.staff_has_permission(( SELECT auth.uid() AS uid), 'crm.manage'::text) AND private.staff_can_access_contact(( SELECT auth.uid() AS uid), contact_id)));
CREATE POLICY "lifecycle_paid_access" ON "public"."follow_up_tasks" AS RESTRICTIVE FOR ALL TO "authenticated" USING ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))) WITH CHECK ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.follow_up_tasks'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."follow_up_tasks"',t.tgname); END LOOP; END $x$;
CREATE TRIGGER complete_journey_action_from_task_trigger AFTER UPDATE OF status ON public.follow_up_tasks FOR EACH ROW EXECUTE FUNCTION private.complete_journey_action_from_task();
ALTER TABLE "public"."follow_up_tasks" ENABLE TRIGGER "complete_journey_action_from_task_trigger";
REVOKE ALL ON TABLE "public"."follow_up_tasks" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."follow_up_tasks" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."follow_up_tasks" TO "anon";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."follow_up_tasks" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."follow_up_tasks" TO "service_role";
ALTER TABLE "public"."membership_entitlements" OWNER TO "postgres";
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid();
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "membership_id" uuid;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "entitlement_key" text;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "label" text;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "limit_value" integer;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "used_value" integer DEFAULT 0;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "reset_cadence" text DEFAULT 'none'::text;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "period_started_at" timestamp with time zone;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."membership_entitlements" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."membership_entitlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."membership_entitlements" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.membership_entitlements'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."membership_entitlements"',p.polname); END LOOP; END $x$;
CREATE POLICY "lifecycle_paid_access" ON "public"."membership_entitlements" AS RESTRICTIVE FOR ALL TO "authenticated" USING ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access))) WITH CHECK ((( SELECT private.active_staff_session() AS active_staff_session) OR ( SELECT private.full_member_access() AS full_member_access)));
CREATE POLICY "membership_entitlements_staff_insert" ON "public"."membership_entitlements" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "membership_entitlements_staff_or_member_select" ON "public"."membership_entitlements" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))) OR (membership_id IN ( SELECT ca.membership_id
   FROM client_access ca
  WHERE (ca.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "membership_entitlements_staff_update" ON "public"."membership_entitlements" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.membership_entitlements'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."membership_entitlements"',t.tgname); END LOOP; END $x$;
REVOKE ALL ON TABLE "public"."membership_entitlements" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."membership_entitlements" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."membership_entitlements" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."membership_entitlements" TO "service_role";
ALTER TABLE "public"."profiles" OWNER TO "postgres";
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "contact_id" uuid;
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.profiles'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."profiles"',p.polname); END LOOP; END $x$;
CREATE POLICY "profiles_self_update" ON "public"."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "profiles_staff_manager_select" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = ( SELECT auth.uid() AS uid)) OR private.staff_has_permission(( SELECT auth.uid() AS uid), 'staff.view'::text)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.profiles'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."profiles"',t.tgname); END LOOP; END $x$;
CREATE TRIGGER ensure_notification_preferences_from_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.ensure_notification_preferences();
ALTER TABLE "public"."profiles" ENABLE TRIGGER "ensure_notification_preferences_from_profile";
CREATE TRIGGER link_profile_to_client_access_trigger AFTER INSERT OR UPDATE OF contact_id, user_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.link_profile_to_client_access();
ALTER TABLE "public"."profiles" ENABLE TRIGGER "link_profile_to_client_access_trigger";
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
ALTER TABLE "public"."profiles" ENABLE TRIGGER "profiles_touch";
REVOKE ALL ON TABLE "public"."profiles" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."profiles" TO "postgres";
GRANT SELECT,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."profiles" TO "anon";
GRANT SELECT,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."profiles" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."profiles" TO "service_role";
ALTER TABLE "public"."staff_access" OWNER TO "postgres";
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'coach'::text;
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "display_name" text;
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text;
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "updated_by" uuid;
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "onboarding_status" text DEFAULT 'complete'::text;
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "contact_scope" text DEFAULT 'all'::text;
ALTER TABLE "public"."staff_access" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "public"."staff_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."staff_access" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.staff_access'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."staff_access"',p.polname); END LOOP; END $x$;
CREATE POLICY "staff_access_team_read" ON "public"."staff_access" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR private.staff_has_permission(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'staff.view'::text)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.staff_access'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."staff_access"',t.tgname); END LOOP; END $x$;
CREATE TRIGGER ensure_notification_preferences_from_staff AFTER INSERT ON public.staff_access FOR EACH ROW EXECUTE FUNCTION private.ensure_notification_preferences();
ALTER TABLE "public"."staff_access" ENABLE TRIGGER "ensure_notification_preferences_from_staff";
CREATE TRIGGER issue_required_coach_nda_trigger AFTER INSERT OR UPDATE OF role, status ON public.staff_access FOR EACH ROW EXECUTE FUNCTION private.issue_required_coach_nda();
ALTER TABLE "public"."staff_access" ENABLE TRIGGER "issue_required_coach_nda_trigger";
CREATE TRIGGER sync_staff_directory_trigger AFTER INSERT OR DELETE OR UPDATE ON public.staff_access FOR EACH ROW EXECUTE FUNCTION private.sync_staff_directory();
ALTER TABLE "public"."staff_access" ENABLE TRIGGER "sync_staff_directory_trigger";
REVOKE ALL ON TABLE "public"."staff_access" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_access" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_access" TO "anon";
GRANT SELECT,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_access" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_access" TO "service_role";
ALTER TABLE "public"."staff_permission_catalog" OWNER TO "postgres";
ALTER TABLE "public"."staff_permission_catalog" ADD COLUMN IF NOT EXISTS "permission_key" text;
ALTER TABLE "public"."staff_permission_catalog" ADD COLUMN IF NOT EXISTS "label" text;
ALTER TABLE "public"."staff_permission_catalog" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "public"."staff_permission_catalog" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "public"."staff_permission_catalog" ADD COLUMN IF NOT EXISTS "sensitive" boolean DEFAULT false;
ALTER TABLE "public"."staff_permission_catalog" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 100;
ALTER TABLE "public"."staff_permission_catalog" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true;
ALTER TABLE "public"."staff_permission_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."staff_permission_catalog" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.staff_permission_catalog'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."staff_permission_catalog"',p.polname); END LOOP; END $x$;
CREATE POLICY "staff_permission_catalog_staff_read" ON "public"."staff_permission_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE ((s.user_id = ( SELECT auth.uid() AS uid)) AND (s.status = 'active'::text)))));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.staff_permission_catalog'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."staff_permission_catalog"',t.tgname); END LOOP; END $x$;
REVOKE ALL ON TABLE "public"."staff_permission_catalog" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_permission_catalog" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_permission_catalog" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_permission_catalog" TO "service_role";
ALTER TABLE "public"."staff_permission_overrides" OWNER TO "postgres";
ALTER TABLE "public"."staff_permission_overrides" ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "public"."staff_permission_overrides" ADD COLUMN IF NOT EXISTS "permission_key" text;
ALTER TABLE "public"."staff_permission_overrides" ADD COLUMN IF NOT EXISTS "allowed" boolean;
ALTER TABLE "public"."staff_permission_overrides" ADD COLUMN IF NOT EXISTS "reason" text;
ALTER TABLE "public"."staff_permission_overrides" ADD COLUMN IF NOT EXISTS "updated_by" uuid;
ALTER TABLE "public"."staff_permission_overrides" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
ALTER TABLE "public"."staff_permission_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."staff_permission_overrides" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.staff_permission_overrides'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."staff_permission_overrides"',p.polname); END LOOP; END $x$;
CREATE POLICY "staff_permission_overrides_manage_read" ON "public"."staff_permission_overrides" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = ( SELECT auth.uid() AS uid)) OR private.staff_has_permission(( SELECT auth.uid() AS uid), 'staff.view'::text)));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.staff_permission_overrides'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."staff_permission_overrides"',t.tgname); END LOOP; END $x$;
REVOKE ALL ON TABLE "public"."staff_permission_overrides" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_permission_overrides" TO "postgres";
GRANT SELECT,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_permission_overrides" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_permission_overrides" TO "service_role";
ALTER TABLE "public"."staff_role_permission_defaults" OWNER TO "postgres";
ALTER TABLE "public"."staff_role_permission_defaults" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "public"."staff_role_permission_defaults" ADD COLUMN IF NOT EXISTS "permission_key" text;
ALTER TABLE "public"."staff_role_permission_defaults" ADD COLUMN IF NOT EXISTS "allowed" boolean DEFAULT false;
ALTER TABLE "public"."staff_role_permission_defaults" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."staff_role_permission_defaults" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.staff_role_permission_defaults'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."staff_role_permission_defaults"',p.polname); END LOOP; END $x$;
CREATE POLICY "staff_role_permission_defaults_active_staff_read" ON "public"."staff_role_permission_defaults" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE ((s.user_id = ( SELECT auth.uid() AS uid)) AND (s.status = 'active'::text)))));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.staff_role_permission_defaults'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."staff_role_permission_defaults"',t.tgname); END LOOP; END $x$;
REVOKE ALL ON TABLE "public"."staff_role_permission_defaults" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_role_permission_defaults" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_role_permission_defaults" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_role_permission_defaults" TO "service_role";
ALTER TABLE "public"."staff_role_permissions" OWNER TO "postgres";
ALTER TABLE "public"."staff_role_permissions" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "public"."staff_role_permissions" ADD COLUMN IF NOT EXISTS "permission_key" text;
ALTER TABLE "public"."staff_role_permissions" ADD COLUMN IF NOT EXISTS "allowed" boolean DEFAULT true;
ALTER TABLE "public"."staff_role_permissions" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "public"."staff_role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."staff_role_permissions" NO FORCE ROW LEVEL SECURITY;
DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='public.staff_role_permissions'::regclass LOOP EXECUTE format('DROP POLICY %I ON "public"."staff_role_permissions"',p.polname); END LOOP; END $x$;
CREATE POLICY "staff_role_permissions_staff_read" ON "public"."staff_role_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM staff_access s
  WHERE (s.user_id = ( SELECT auth.uid() AS uid)))));
DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='public.staff_role_permissions'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "public"."staff_role_permissions"',t.tgname); END LOOP; END $x$;
REVOKE ALL ON TABLE "public"."staff_role_permissions" FROM PUBLIC,postgres,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_role_permissions" TO "postgres";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_role_permissions" TO "authenticated";
GRANT INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON "public"."staff_role_permissions" TO "service_role";
COMMIT;
