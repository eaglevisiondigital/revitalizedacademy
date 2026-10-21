-- Owner-approved October 20: first event October 29, Thursday 18:30 America/New_York.
-- Administrative draft preparation only; no staff impersonation or public activation.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='15s';
DO $$
DECLARE n integer; d date; stamp timestamptz; sid uuid; existing private.hhl_sessions%rowtype;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hhl-privacy',0));
 IF EXISTS(SELECT 1 FROM private.hhl_settings WHERE registration_enabled OR zoom_enabled OR notifications_enabled OR acceptance_case IS NOT NULL)
  OR EXISTS(SELECT 1 FROM private.hhl_registrations) OR EXISTS(SELECT 1 FROM private.hhl_jobs)
  THEN RAISE EXCEPTION 'inaugural_configuration_requires_held_empty_acceptance';END IF;
 IF EXISTS(SELECT 1 FROM private.hhl_sessions WHERE regular_date<date '2026-10-29'
  OR (starts_at AT TIME ZONE 'America/New_York')::date<date '2026-10-29')
  THEN RAISE EXCEPTION 'earlier_session_requires_explicit_review';END IF;
 FOR n IN 0..11 LOOP
  d:=date '2026-10-29'+7*n;
  stamp:=(d+time '18:30') AT TIME ZONE 'America/New_York';
  sid:=NULL;
  INSERT INTO private.hhl_sessions(regular_date,starts_at,closes_at,status,join_mode,manual_join_url,zoom_meeting_id)
   VALUES(d,stamp,stamp,'draft','manual','https://us02web.zoom.us/j/82516112925','82516112925')
   ON CONFLICT(regular_date) DO NOTHING RETURNING id INTO sid;
  IF sid IS NULL THEN
   SELECT * INTO STRICT existing FROM private.hhl_sessions WHERE regular_date=d;
   IF existing.starts_at<>stamp OR existing.closes_at<>stamp OR existing.status<>'draft'
    OR existing.join_mode<>'manual' OR existing.zoom_meeting_id IS DISTINCT FROM '82516112925'
    OR existing.manual_join_url IS DISTINCT FROM 'https://us02web.zoom.us/j/82516112925'
    THEN RAISE EXCEPTION 'existing_schedule_conflict';END IF;
  ELSE
   INSERT INTO private.hhl_audit(actor_id,action,subject_id,reason,provider_event_key)
    VALUES(NULL,'owner-approved-weekly-draft',sid,
     'Owner-approved inaugural schedule, October 20, 2026: October 29 first, then Thursdays at 18:30 America/New_York. Administrative draft preparation; normal staff acceptance remains pending.',
     encode(extensions.digest('hhl-owner-inaugural-2026-10-29:'||d::text,'sha256'),'hex'));
  END IF;
 END LOOP;
END $$;
COMMIT;
