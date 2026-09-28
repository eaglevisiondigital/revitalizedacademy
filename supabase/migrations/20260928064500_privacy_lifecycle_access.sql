-- Preserve privacy/data-control access through non-terminal restricted lifecycle states.
-- This does not grant paid member access or alter paid-domain RLS.
BEGIN;


DROP POLICY IF EXISTS lifecycle_paid_access ON public.member_privacy_requests;
DROP POLICY IF EXISTS lifecycle_paid_access ON public.member_privacy_exports;

DROP POLICY IF EXISTS privacy_request_lifecycle_access ON public.member_privacy_requests;
CREATE POLICY privacy_request_lifecycle_access
ON public.member_privacy_requests
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (SELECT private.active_staff_session())
  OR (
    user_id=(SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.client_access ca
      WHERE ca.user_id=(SELECT auth.uid())
        AND ca.contact_id=member_privacy_requests.contact_id
        AND ca.status IN ('ready','invited','onboarding','active','payment_suspended')
    )
  )
)
WITH CHECK (
  (SELECT private.active_staff_session())
  OR (
    user_id=(SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.client_access ca
      WHERE ca.user_id=(SELECT auth.uid())
        AND ca.contact_id=member_privacy_requests.contact_id
        AND ca.status IN ('ready','invited','onboarding','active','payment_suspended')
    )
  )
);

DROP POLICY IF EXISTS privacy_export_lifecycle_access ON public.member_privacy_exports;
CREATE POLICY privacy_export_lifecycle_access
ON public.member_privacy_exports
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (SELECT private.active_staff_session())
  OR (
    user_id=(SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.client_access ca
      WHERE ca.user_id=(SELECT auth.uid())
        AND ca.contact_id=member_privacy_exports.contact_id
        AND ca.status IN ('ready','invited','onboarding','active','payment_suspended')
    )
  )
);

DROP POLICY IF EXISTS lifecycle_storage ON storage.objects;
CREATE POLICY lifecycle_storage
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  (SELECT private.active_staff_session())
  OR (SELECT private.full_member_access())
  OR (
    bucket_id='privacy-exports'
    AND EXISTS (
      SELECT 1
      FROM public.member_privacy_exports e
      JOIN public.client_access ca
        ON ca.contact_id=e.contact_id
       AND ca.user_id=(SELECT auth.uid())
      WHERE e.user_id=(SELECT auth.uid())
        AND e.storage_path=objects.name
        AND e.status='ready'
        AND (e.expires_at IS NULL OR e.expires_at>now())
        AND ca.status IN ('ready','invited','onboarding','active','payment_suspended')
    )
  )
)
WITH CHECK (
  (SELECT private.active_staff_session())
  OR (SELECT private.full_member_access())
);

CREATE OR REPLACE VIEW public.my_privacy_center
WITH (security_invoker=true)
AS
SELECT
  ca.user_id,
  ca.contact_id,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'provider_key',hc.provider_key,
        'provider_name',p.name,
        'status',hc.status,
        'connected_at',hc.connected_at,
        'last_sync_at',hc.last_sync_at,
        'last_successful_sync_at',hc.last_successful_sync_at
      )
      ORDER BY p.name
    )
    FROM public.health_integration_connections hc
    JOIN public.health_integration_providers p ON p.provider_key=hc.provider_key
    WHERE hc.contact_id=ca.contact_id
      AND hc.user_id=(SELECT auth.uid())
  ),'[]'::jsonb) AS health_connections,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'request_id',r.id,
        'request_type',r.request_type,
        'scope',r.scope,
        'status',r.status,
        'requested_at',r.requested_at,
        'reviewed_at',r.reviewed_at,
        'completed_at',r.completed_at
      )
      ORDER BY r.requested_at DESC
    )
    FROM public.member_privacy_requests r
    WHERE r.user_id=(SELECT auth.uid())
  ),'[]'::jsonb) AS privacy_requests,
  (
    SELECT count(*)::integer
    FROM public.health_observations ho
    WHERE ho.contact_id=ca.contact_id
  ) AS stored_health_observation_count,
  (
    SELECT max(ho.observed_at)
    FROM public.health_observations ho
    WHERE ho.contact_id=ca.contact_id
  ) AS latest_health_observation_at
FROM public.client_access ca
WHERE ca.user_id=(SELECT auth.uid())
  AND ca.status IN ('ready','invited','onboarding','active','payment_suspended')
ORDER BY ca.updated_at DESC
LIMIT 1;

DROP POLICY IF EXISTS member_privacy_requests_self_insert ON public.member_privacy_requests;
CREATE POLICY member_privacy_requests_self_insert
ON public.member_privacy_requests
FOR INSERT
TO authenticated
WITH CHECK (
  user_id=(SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.client_access ca
    WHERE ca.user_id=(SELECT auth.uid())
      AND ca.contact_id=member_privacy_requests.contact_id
      AND ca.status IN ('ready','invited','onboarding','active','payment_suspended')
  )
);

CREATE OR REPLACE FUNCTION public.submit_my_privacy_request(
  p_request_type text,
  p_scope jsonb DEFAULT '{}'::jsonb,
  p_member_note text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'pg_catalog','public'
AS $function$
DECLARE
  v_contact_id uuid;
  v_request_id uuid;
BEGIN
  IF p_request_type NOT IN ('data_export','health_data_delete','account_delete','correction','other') THEN
    RAISE EXCEPTION 'Invalid privacy request type';
  END IF;

  IF p_member_note IS NOT NULL AND length(p_member_note)>4000 THEN
    RAISE EXCEPTION 'Privacy request note must be 4000 characters or fewer';
  END IF;

  SELECT ca.contact_id INTO v_contact_id
  FROM public.client_access ca
  WHERE ca.user_id=(SELECT auth.uid())
    AND ca.status IN ('ready','invited','onboarding','active','payment_suspended')
  ORDER BY ca.updated_at DESC
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    RAISE EXCEPTION 'Eligible account access is required for privacy requests';
  END IF;

  INSERT INTO public.member_privacy_requests(
    user_id,contact_id,request_type,scope,status,member_note
  )
  VALUES(
    (SELECT auth.uid()),v_contact_id,p_request_type,coalesce(p_scope,'{}'::jsonb),
    'submitted',nullif(trim(p_member_note),'')
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_my_privacy_request(text,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_my_privacy_request(text,jsonb,text) TO authenticated,service_role;

COMMIT;
