# Next bounded LOCAL check: account provisioning compatibility

Wave7 restrictions reject the unchanged direct authenticated nonnull-account INSERT positive. Retain that FAIL; do not relax a guard or relabel it complete. No production approval is requested at this checkpoint.

Source inspection found two existing candidates, not certified alternatives:

- `supabase/migrations/20261007224150_production_client_lifecycle_v1.sql`: `private.provision_client_foundation()` is an existing SECURITY DEFINER enrollment trigger, inserting account/household associations from enrollment/profile data. Trace its actual caller, source trust and lifecycle checks; a privileged fixture INSERT is not sufficient acceptance.
- In the same migration, `public.claim_onboarding_enrollment(text)` invokes the existing private SECURITY DEFINER claim. The private routine checks current authenticated identity, invitation digest/activity/expiry, verified Auth email, matching contact/profile, compatible access/membership and emits `onboarding_access_claimed`. Public profiles mapping alone is not identity attestation. Test all checks together before treating this as an approved replacement for direct binding.

Next implementation package may prepare fictional catalog-equivalent tests for these existing paths and their actual portal call chain. Cover valid source-bound invitation, wrong account/email/contact, self-edited profile, token expiry/revocation/replay, simultaneous claim, suspension, unrelated household, audit actor and transaction rollback. Verify exact current routine/ACL/trigger versions first; preserve the original failing direct-access test. Do not add a new SECURITY DEFINER bypass or extend grants. If the established approved workflow lacks the needed operation, present the narrow product/security decision rather than inventing permission.

This source-only follow-up does not establish managed Auth, real enrollment acceptance, a production migration, financial activation or any Alex authority. Those boundaries remain unchanged.
