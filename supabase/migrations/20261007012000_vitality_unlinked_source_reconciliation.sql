-- Operator-only controlled import for verified completed historical Netlify sources.
-- Existing alternate-email identity association requires an explicit operator reason.
alter table private.vitality_historical_reviews add column source_email text;
update private.vitality_historical_reviews h set source_email=c.email from public.contacts c where c.id=h.contact_id;
create function private.reconcile_unlinked_vitality_source(p_source jsonb,p_existing_contact_id uuid default null,p_identity_reason text default null)
returns jsonb language plpgsql set search_path='' as $$
declare
 e text:=lower(trim(p_source->>'email')); first text:=trim(p_source->>'first_name'); last text:=trim(p_source->>'last_name');
 source_phone text:=nullif(trim(p_source->>'phone'),''); summary text:=p_source->>'summary';
 received timestamptz:=(p_source->>'received_at')::timestamptz; submitted timestamptz:=(p_source->>'submitted_at')::timestamptz;
 started timestamptz:=(p_source->>'first_lead_at')::timestamptz; key text; digest text; c uuid; w uuid; duplicate_count integer;
 old private.vitality_historical_reviews%rowtype;
begin
 if p_source->>'status' is distinct from 'Complete - coach review requested'
 or e is null or e !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or coalesce(first,'')='' or coalesce(last,'')=''
 or not coalesce(length(summary) between 1 and 500000,false) or received is null or submitted is null or started is null
 or received>='2026-10-05 00:00:00-05' or started>received or abs(extract(epoch from(submitted-received)))>300 then
 raise exception 'Invalid historical completed source' using errcode='22023'; end if;
 key:='netlify:6a9b44095ad81b0008809a89:'||received::text||':'||e;
 digest:=encode(extensions.digest(convert_to(summary,'UTF8'),'sha256'),'hex');
 lock table public.contacts in share row exclusive mode;
 select * into old from private.vitality_historical_reviews where source_key=key;
 if old.workflow_id is not null then
 if old.source_digest<>digest then raise exception 'Conflicting historical source' using errcode='23505'; end if;
 return jsonb_build_object('result','already_reconciled','contact_id',old.contact_id,'workflow_id',old.workflow_id); end if;
 if p_existing_contact_id is not null then
 if not coalesce(length(trim(p_identity_reason)) between 10 and 500,false)
 or not exists(select 1 from public.contacts where id=p_existing_contact_id and lower(trim(first_name))=lower(first) and lower(trim(last_name))=lower(last)) then
 raise exception 'Explicit confirmed identity association required' using errcode='22023'; end if;
 c:=p_existing_contact_id;
 else
 select count(*) into duplicate_count from public.contacts where lower(trim(email))=e
 or (source_phone is not null and right(regexp_replace(public.contacts.phone,'[^0-9]','','g'),10)=right(regexp_replace(source_phone,'[^0-9]','','g'),10))
 or (lower(trim(first_name))=lower(first) and lower(trim(last_name))=lower(last));
 if duplicate_count<>0 then raise exception 'Existing identity requires explicit reconciliation; no duplicate created' using errcode='23505'; end if;
 insert into public.contacts(first_name,last_name,email,phone,lifecycle_stage,first_source,last_source,created_at,updated_at,
 referral_source,referral_source_other,sales_rep_name)
 values(first,last,e,source_phone,'assessment_lead','website_vitality_assessment','website_vitality_assessment',started,received,
 nullif(p_source->>'referral_source',''),nullif(p_source->>'referral_source_other',''),nullif(p_source->>'sales_rep_name','')) returning id into c;
 end if;
 if exists(select 1 from public.workflow_records where contact_id=c and workflow_type='vitality_assessment' and status<>'abandoned') then
 raise exception 'Existing workflow requires explicit reconciliation; no duplicate created' using errcode='23505'; end if;
 insert into public.workflow_records(contact_id,workflow_type,status,current_step,completion_percent,started_at,completed_at,last_activity_at,created_at,updated_at)
 values(c,'vitality_assessment','completed','complete',100,started,submitted,submitted,started,submitted) returning id into w;
 insert into public.vitality_reports(contact_id,workflow_id,status,created_at,updated_at)
 values(c,w,'awaiting_review',submitted,submitted);
 insert into private.vitality_historical_reviews(workflow_id,contact_id,source_key,source_received_at,source_submitted_at,pathway,assessment_for,assessment_summary,coach_review_flags,source_digest,source_email)
 values(w,c,key,received,submitted,p_source->>'pathway',p_source->>'assessment_for',summary,p_source->>'flags',digest,e);
 insert into public.contact_activity(contact_id,activity_type,title,detail,metadata)
 values(c,'vitality_historical_reconciled','Historical Vitality Assessment reconciled','Original completed submission preserved; no resume credential issued.',
 jsonb_build_object('workflow_id',w,'source_key',key,'identity_reason',p_identity_reason));
 return jsonb_build_object('result','reconciled','contact_id',c,'workflow_id',w);
end $$;
revoke all on function private.reconcile_unlinked_vitality_source(jsonb,uuid,text) from public,anon,authenticated,service_role;
