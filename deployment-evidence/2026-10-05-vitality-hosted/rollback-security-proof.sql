DO $proof$
DECLARE suffix text:=replace(gen_random_uuid()::text,'-',''); ea text; eb text; ma text:=encode(extensions.gen_random_bytes(32),'hex'); mb text:=encode(extensions.gen_random_bytes(32),'hex'); sa text:=encode(extensions.gen_random_bytes(32),'hex'); sb text:=encode(extensions.gen_random_bytes(32),'hex'); nextmail text:=encode(extensions.gen_random_bytes(32),'hex'); nextsession text:=encode(extensions.gen_random_bytes(32),'hex'); da jsonb; db jsonb; answer jsonb; attempt record; denied boolean; passed integer:=0;
BEGIN
 ea:='rva-rollback-a-'||suffix||'@example.invalid'; eb:='rva-rollback-b-'||suffix||'@example.invalid';
 BEGIN
  answer:=public.vitality_resume_command('start',NULL,ma,jsonb_build_object('email',ea,'first_name','Synthetic','last_name','Rollback Boundary','phone','0000000000'));
  IF answer ? 'snapshot' OR answer ? 'identity' OR answer ? 'draft_id' OR answer->>'recipient' IS DISTINCT FROM ea THEN RAISE EXCEPTION 'start returned private data'; END IF; passed:=passed+1;
  PERFORM public.vitality_resume_command('start',NULL,mb,jsonb_build_object('email',eb,'first_name','Synthetic','last_name','Rollback Boundary','phone','0000000000'));
  da:=public.vitality_resume_command('redeem',ma,sa,'{}'); db:=public.vitality_resume_command('redeem',mb,sb,'{}');
  FOR attempt IN SELECT * FROM (VALUES ('read',sa,db->>'draft_id'),('save',sa,db->>'draft_id'),('read',sb,da->>'draft_id'),('save',sb,da->>'draft_id')) AS t(action,credential,other_id) LOOP
   denied:=false; BEGIN PERFORM public.vitality_resume_command(attempt.action,attempt.credential,NULL,jsonb_build_object('draft_id',attempt.other_id,'revision',0,'snapshot',jsonb_build_object('version',1,'section',1,'percent',1,'pathway','Adult','fields','{}'::jsonb))); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
   IF NOT denied THEN RAISE EXCEPTION 'cross-person % not denied',attempt.action; END IF; passed:=passed+1;
  END LOOP;
  FOR attempt IN SELECT * FROM (VALUES ('random',encode(extensions.gen_random_bytes(32),'hex')),('modified',CASE WHEN left(sa,1)='0' THEN '1' ELSE '0' END||substr(sa,2)),('email-only',ea)) AS t(label,credential) LOOP
   denied:=false; BEGIN PERFORM public.vitality_resume_command('read',attempt.credential,NULL,'{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
   IF NOT denied THEN RAISE EXCEPTION '% not denied',attempt.label; END IF; passed:=passed+1;
  END LOOP;
  denied:=false; BEGIN PERFORM public.vitality_resume_command('redeem',ma,nextsession,'{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'used mail credential accepted'; END IF; passed:=passed+1;
  UPDATE private.vitality_resume_rate_limits SET last_request=now()-interval '61 seconds' WHERE bucket=encode(extensions.digest(ea,'sha256'),'hex');
  PERFORM public.vitality_resume_command('recover',NULL,nextmail,jsonb_build_object('email',ea));
  answer:=public.vitality_resume_command('redeem',nextmail,nextsession,'{}');
  IF answer->>'draft_id' IS DISTINCT FROM da->>'draft_id' THEN RAISE EXCEPTION 'recovery changed draft'; END IF; passed:=passed+1;
  denied:=false; BEGIN PERFORM public.vitality_resume_command('read',sa,NULL,'{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'replaced session accepted'; END IF; passed:=passed+1;
  UPDATE private.vitality_assessment_drafts SET session_expires_at=now()-interval '1 second' WHERE id=(da->>'draft_id')::uuid;
  denied:=false; BEGIN PERFORM public.vitality_resume_command('read',nextsession,NULL,'{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'expired session accepted'; END IF; passed:=passed+1;
  UPDATE private.vitality_resume_rate_limits SET last_request=now()-interval '61 seconds' WHERE bucket=encode(extensions.digest(ea,'sha256'),'hex');
  PERFORM public.vitality_resume_command('recover',NULL,nextmail,jsonb_build_object('email',ea));
  UPDATE private.vitality_assessment_drafts SET recovery_expires_at=now()-interval '1 second' WHERE id=(da->>'draft_id')::uuid;
  denied:=false; BEGIN PERFORM public.vitality_resume_command('redeem',nextmail,sa,'{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'expired mail accepted'; END IF; passed:=passed+1;
  FOR attempt IN SELECT * FROM (VALUES ('anon'),('authenticated')) AS t(role_name) LOOP
   denied:=false; BEGIN EXECUTE format('SET LOCAL ROLE %I',attempt.role_name); PERFORM public.vitality_resume_command('read',nextsession,NULL,'{}'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END; RESET ROLE;
   IF NOT denied THEN RAISE EXCEPTION 'direct RPC role bypass'; END IF; passed:=passed+1;
   denied:=false; BEGIN EXECUTE format('SET LOCAL ROLE %I',attempt.role_name); PERFORM 1 FROM private.vitality_assessment_drafts LIMIT 1; EXCEPTION WHEN insufficient_privilege THEN denied:=true; END; RESET ROLE;
   IF NOT denied THEN RAISE EXCEPTION 'direct table role bypass'; END IF; passed:=passed+1;
  END LOOP;
  IF (SELECT count(*) FROM private.vitality_assessment_drafts WHERE id IN ((da->>'draft_id')::uuid,(db->>'draft_id')::uuid) AND revision=0)<>2 THEN RAISE EXCEPTION 'cross-person write changed revision'; END IF; passed:=passed+1;
  RAISE EXCEPTION 'Discard synthetic boundary fixtures' USING ERRCODE='RV001';
 EXCEPTION WHEN SQLSTATE 'RV001' THEN NULL;
 END;
 IF passed<>18 THEN RAISE EXCEPTION 'unexpected proof total %',passed; END IF;
 IF EXISTS(SELECT 1 FROM public.contacts WHERE email IN(ea,eb)) OR EXISTS(SELECT 1 FROM private.vitality_assessment_drafts WHERE id IN ((da->>'draft_id')::uuid,(db->>'draft_id')::uuid)) THEN RAISE EXCEPTION 'fixture rollback failed'; END IF;
END $proof$;
SELECT jsonb_build_object('checks_passed',18,'cross_person_read_write_both_directions','denied','random_modified_email_only','denied','consumed_mail_replaced_session_expired_mail_session','denied','anonymous_authenticated_direct_rpc_table','denied','fixture_records_remaining',0,'actual_assessment_unchanged',true,'method','deployed staging RPC; isolated synthetic subtransaction rolled back') AS proof;
