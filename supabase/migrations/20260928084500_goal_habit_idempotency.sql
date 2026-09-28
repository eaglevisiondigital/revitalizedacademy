-- Add retry-safe member goal/habit creation without changing legacy RPC signatures.
BEGIN;

CREATE FUNCTION public.create_my_goal_idempotent(
  p_request_id uuid,
  p_title text,
  p_description text DEFAULT NULL::text,
  p_target_value numeric DEFAULT NULL::numeric,
  p_target_unit text DEFAULT NULL::text,
  p_target_date date DEFAULT NULL::date,
  p_priority integer DEFAULT 3
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'pg_catalog','public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_contact_id uuid;
  v_membership_id uuid;
  v_existing public.client_goals%rowtype;
  v_title text := trim(p_title);
  v_description text := nullif(trim(p_description),'');
  v_unit text := nullif(trim(p_target_unit),'');
BEGIN
  IF v_user_id IS NULL OR NOT public.member_paid_access_allowed() THEN
    RAISE EXCEPTION 'Full member access is required';
  END IF;
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Goal request ID is required'; END IF;
  IF coalesce(v_title,'')='' THEN RAISE EXCEPTION 'Goal title is required'; END IF;
  IF p_priority NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Priority must be between 1 and 5'; END IF;

  SELECT ca.contact_id,ca.membership_id
  INTO v_contact_id,v_membership_id
  FROM public.client_access ca
  WHERE ca.user_id=v_user_id AND ca.status='active'
  ORDER BY ca.updated_at DESC
  LIMIT 1;
  IF v_contact_id IS NULL THEN RAISE EXCEPTION 'Full member access is required'; END IF;

  SELECT * INTO v_existing FROM public.client_goals WHERE id=p_request_id;
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.contact_id=v_contact_id
       AND v_existing.membership_id IS NOT DISTINCT FROM v_membership_id
       AND v_existing.scope='individual'
       AND v_existing.title=v_title
       AND v_existing.description IS NOT DISTINCT FROM v_description
       AND v_existing.target_value IS NOT DISTINCT FROM p_target_value
       AND v_existing.target_unit IS NOT DISTINCT FROM v_unit
       AND v_existing.target_date IS NOT DISTINCT FROM p_target_date
       AND v_existing.priority=p_priority
       AND v_existing.status='active'
       AND v_existing.created_by_user_id=v_user_id
       AND v_existing.created_by_type='member'
    THEN RETURN v_existing.id;
    END IF;
    RAISE EXCEPTION 'Goal request identity conflict';
  END IF;

  INSERT INTO public.client_goals(
    id,contact_id,membership_id,scope,title,description,target_value,target_unit,
    target_date,priority,status,created_by_user_id,created_by_type
  )
  VALUES(
    p_request_id,v_contact_id,v_membership_id,'individual',v_title,v_description,
    p_target_value,v_unit,p_target_date,p_priority,'active',v_user_id,'member'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO v_existing FROM public.client_goals WHERE id=p_request_id;
  IF v_existing.id IS NULL THEN RAISE EXCEPTION 'Goal request identity conflict'; END IF;
  IF v_existing.contact_id<>v_contact_id
     OR v_existing.title<>v_title
     OR v_existing.description IS DISTINCT FROM v_description
     OR v_existing.target_value IS DISTINCT FROM p_target_value
     OR v_existing.target_unit IS DISTINCT FROM v_unit
     OR v_existing.target_date IS DISTINCT FROM p_target_date
     OR v_existing.priority<>p_priority
     OR v_existing.created_by_user_id IS DISTINCT FROM v_user_id
  THEN RAISE EXCEPTION 'Goal request identity conflict';
  END IF;
  RETURN v_existing.id;
END;
$function$;

CREATE FUNCTION public.create_my_habit_idempotent(
  p_request_id uuid,
  p_title text,
  p_category text DEFAULT NULL::text,
  p_frequency text DEFAULT 'daily'::text,
  p_target_per_period numeric DEFAULT 1,
  p_unit text DEFAULT NULL::text,
  p_starts_on date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'pg_catalog','public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_contact_id uuid;
  v_membership_id uuid;
  v_existing public.client_habits%rowtype;
  v_title text := trim(p_title);
  v_category text := nullif(trim(p_category),'');
  v_unit text := nullif(trim(p_unit),'');
  v_start date := coalesce(p_starts_on,current_date);
BEGIN
  IF v_user_id IS NULL OR NOT public.member_paid_access_allowed() THEN
    RAISE EXCEPTION 'Full member access is required';
  END IF;
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Habit request ID is required'; END IF;
  IF coalesce(v_title,'')='' THEN RAISE EXCEPTION 'Habit title is required'; END IF;
  IF p_frequency NOT IN ('daily','weekly','custom') THEN RAISE EXCEPTION 'Unsupported habit frequency'; END IF;
  IF coalesce(p_target_per_period,0)<=0 THEN RAISE EXCEPTION 'Habit target must be greater than zero'; END IF;

  SELECT ca.contact_id,ca.membership_id
  INTO v_contact_id,v_membership_id
  FROM public.client_access ca
  WHERE ca.user_id=v_user_id AND ca.status='active'
  ORDER BY ca.updated_at DESC
  LIMIT 1;
  IF v_contact_id IS NULL THEN RAISE EXCEPTION 'Full member access is required'; END IF;

  SELECT * INTO v_existing FROM public.client_habits WHERE id=p_request_id;
  IF v_existing.id IS NOT NULL THEN
    IF v_existing.contact_id=v_contact_id
       AND v_existing.membership_id IS NOT DISTINCT FROM v_membership_id
       AND v_existing.title=v_title
       AND v_existing.category IS NOT DISTINCT FROM v_category
       AND v_existing.frequency=p_frequency
       AND v_existing.target_per_period=p_target_per_period
       AND v_existing.unit IS NOT DISTINCT FROM v_unit
       AND v_existing.status='active'
       AND v_existing.starts_on=v_start
       AND v_existing.created_by=v_user_id
    THEN RETURN v_existing.id;
    END IF;
    RAISE EXCEPTION 'Habit request identity conflict';
  END IF;

  INSERT INTO public.client_habits(
    id,contact_id,membership_id,title,category,frequency,target_per_period,unit,
    status,starts_on,created_by
  )
  VALUES(
    p_request_id,v_contact_id,v_membership_id,v_title,v_category,p_frequency,
    p_target_per_period,v_unit,'active',v_start,v_user_id
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO v_existing FROM public.client_habits WHERE id=p_request_id;
  IF v_existing.id IS NULL THEN RAISE EXCEPTION 'Habit request identity conflict'; END IF;
  IF v_existing.contact_id<>v_contact_id
     OR v_existing.title<>v_title
     OR v_existing.category IS DISTINCT FROM v_category
     OR v_existing.frequency<>p_frequency
     OR v_existing.target_per_period<>p_target_per_period
     OR v_existing.unit IS DISTINCT FROM v_unit
     OR v_existing.starts_on<>v_start
     OR v_existing.created_by IS DISTINCT FROM v_user_id
  THEN RAISE EXCEPTION 'Habit request identity conflict';
  END IF;
  RETURN v_existing.id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_my_goal_idempotent(uuid,text,text,numeric,text,date,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.create_my_habit_idempotent(uuid,text,text,text,numeric,text,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_my_goal_idempotent(uuid,text,text,numeric,text,date,integer) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.create_my_habit_idempotent(uuid,text,text,text,numeric,text,date) TO authenticated,service_role;

COMMIT;
