-- REVIEW ONLY. Never a migration; private bound parameters, not literals in GitHub/logs.
-- Requires separate exact-source pilot approval, B4.2 authenticated identity/SOP evidence,
-- active B4 source-pinned cohort, named owner/operator and UTC revocation appointment.
begin;
-- select private.roadmap_b42_operator_plan(:verified_selection);
-- select private.roadmap_b5_set_pilot(:verified_selection, :approved_utc_expiry, :separate_approval_reference);
-- Draft writes remain held unless separately authorized through existing B4 controls.
-- select private.roadmap_b5_revoke(:private_report, :revocation_reference);
rollback;
