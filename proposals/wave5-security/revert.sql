-- LOCAL regression proof only; dropping these policies restores known exposure.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DROP POLICY wave5_client_access_scope_update ON public.client_access;
DROP POLICY wave5_client_access_scope_insert ON public.client_access;
DROP POLICY wave5_client_access_scope_select ON public.client_access;
DROP POLICY wave5_client_memberships_scope_update ON public.client_memberships;
DROP POLICY wave5_client_memberships_scope_insert ON public.client_memberships;
DROP POLICY wave5_client_memberships_scope_select ON public.client_memberships;
GRANT TRUNCATE ON TABLE public.coaching_entitlement_usage TO authenticated;
GRANT TRUNCATE ON TABLE public.membership_entitlements TO authenticated;
GRANT TRUNCATE ON TABLE public.client_memberships TO authenticated;
GRANT TRUNCATE ON TABLE public.client_access TO authenticated;
COMMIT;
