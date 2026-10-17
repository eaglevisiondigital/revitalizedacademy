-- FUTURE INCIDENT ROLLBACK ONLY; not executed by B4 preparation.
-- Preserve source data, immutable history and all unrelated application functions.
begin;
revoke execute on function public.roadmap_b4(text,uuid,jsonb) from authenticated;
commit;
-- Restore the exact pre-release Netlify artifact captured at release time.
-- Do not drop tables, replay migrations or delete cohort/audit/version evidence.
