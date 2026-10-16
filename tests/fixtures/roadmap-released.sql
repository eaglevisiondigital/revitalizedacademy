-- Fictional local-only pre-B1 fixture. Never applied to a hosted project.
insert into contacts(id,email,first_name,last_name) values('aaaaaaaa-0000-4000-8000-000000000003','roadmap-local@example.invalid','Local','Fixture');
insert into auth.users(id,email,email_confirmed_at) values('aaaaaaaa-0000-4000-8000-000000000001','roadmap-local@example.invalid',now());
insert into auth.sessions(id,user_id) values('aaaaaaaa-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000001');
insert into workflow_records(id,contact_id,workflow_type,status) values('aaaaaaaa-0000-4000-8000-000000000004','aaaaaaaa-0000-4000-8000-000000000003','health_profile','completed');
insert into vitality_reports(id,contact_id,workflow_id) values('aaaaaaaa-0000-4000-8000-000000000005','aaaaaaaa-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000004');
insert into private.vitality_roadmap_versions(report_id,contact_id,source_workflow_id,version,state,scoring_version,approved_by,approved_at,released_at,approved_snapshot)
values('aaaaaaaa-0000-4000-8000-000000000005','aaaaaaaa-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000004',1,'released','local-fixture-unscored','aaaaaaaa-0000-4000-8000-000000000001',now(),now(),'{"summary":"Synthetic released content","reviewer_notes":"PRIVATE","answers":{"private":"NEVER LEAK"}}');
insert into vitality_roadmap_access(contact_id,user_id,verified_at) values('aaaaaaaa-0000-4000-8000-000000000003','aaaaaaaa-0000-4000-8000-000000000001',now());
