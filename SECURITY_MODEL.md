# Vitality reliability local candidate — 2026-10-08

Preserve opaque hashed single-use mail/session credentials, 30-day inactivity, completion locking, stale revision rejection, neutral recovery and existing staff health-private/contact-scope gates. The new private delivery journal is RLS-enabled; PUBLIC/anon/authenticated/service-role direct table and sequence access are revoked. Internal mail/lead-result commands are reachable only through the existing service-only command boundary; public Edge actions cannot invoke them. No raw credentials, private answers, recipient addresses or provider bodies are logged/persisted in the journal.

Same-document resume links reload through the existing exchange instead of merging a previous participant's form. Malformed links do not display an earlier stored private session. Pending opaque credentials are removed after exchange/denial; history stripping remains in place. Provider acknowledgement cannot reactivate consumed/superseded credentials. A definite rejection preserves a previous accepted link; uncertain acceptance preserves the possibly delivered newest link. Request replay and rate limits remain server-enforced.

Native PostgreSQL17 permission/completion/revision tests96/96, eight-session race, Edge24/24 and isolated WebKit75/75 pass. Real records were inspected only as minimal metadata; no answers or raw provider links were retrieved. No remote writes, permission grants, provider configuration, Auth, payments or beta changes. [Full evidence and limitations](docs/VITALITY_SAVE_RESUME_RELIABILITY_2026-10-08.md). Release/hosted acceptance remain blocked pending explicit approval.

# Historical RepDB Exercise Library local candidate — 2026-10-07

# Verified RepDB cleanup authorization — 2026-10-07

The new forward repair changes only the privileged DELETE row return. Guard remains security invoker with empty search_path, original owner/ACL, and all source/approval checks. No browser permissive DELETE policy, role, permission or grant added. Actual hosted staff/member/anonymous/Owner browser deletion denied; authorized privileged QA cleanup succeeds only after retained audit evidence and dependency checks. Original policies/grants/other functions and private-data fingerprints unchanged. Archive remains normal UI behavior. [Acceptance and remaining unrelated advisor findings](docs/REPDB_DELETE_GUARD_REPAIR_2026-10-07.md).

# RepDB Exercise Library local candidate — 2026-10-07

New exercise-library requests require the exact Netlify site/project/custom origin, matching Auth identity and active Owner/Admin plus learning.manage. Service-only RPC rechecks authority; unchanged RLS plus provenance trigger prevent browser spoofing/imported-global mutations. No permission grants or private-health-policy changes. Raw licensed dataset and service secrets stay private; public/bulk/actor override and reverse sync are denied. Beta source import uses only beta Auth/project secrets. [Release report](docs/REPDB_EXERCISE_LIBRARY_V1_2026-10-07.md). Not deployed.

# Live content sync security acceptance — 2026-10-07

Active Owner/Admin plus effective learning.manage, exact production origin/site/project, fresh bearer identity, service-only SQL ACLs, content field/JSON whitelist, private audited jobs and atomic beta receive were tested. Coach/member/anonymous/reverse actions denied. Credentials remain server Functions-only; beta has no production credential. No existing grants, private-data policies or feature flags changed.

[Final hosted acceptance report](docs/FOODDATA_BETA_SYNC_ACCEPTANCE_2026-10-07.md). Earlier candidate entries below are historical.

# Production security release notes

2026-10-07 local FDC candidate: bearer identity is verified by environment-specific Supabase Auth; the server-only RPC independently rechecks active/approved staff and effective `learning.manage` on every action. Approval and source refresh additionally require Owner/Admin. Canonical source/approval fields reject ordinary browser forgery or overwrite; custom composition follows existing content RLS. API keys/service credentials stay Functions-scoped server secrets. New private cache, quota and immutable source/approval history tables are RLS-enabled without browser grants/policies. Definer functions use fixed empty search paths with explicit execution ACLs. Source nutrient/ID/unit bounds, atomic provider budgets, cache expiry, request deadlines and sanitized errors are enforced. PostgreSQL 17 fixtures prove browser/member/inactive/denied-Coach boundaries. No role/default grants or private-client policy changes. Full details and release gates: [package report](docs/FOODDATA_CENTRAL_V1_2026-10-07.md).

Pending content authoring requires `private.can_author_durable_content()`: the authenticated user has an active staff record, Coach onboarding is complete, and the existing effective `learning.manage` permission is allowed. Explicit permission denial remains authoritative. This independently blocks inactive staff with residual overrides without globally changing other permission helpers.

RLS remains enabled on all promoted content tables. Parent insert/update and composition insert/update/delete require the helper. Draft reads require it; published reusable-library reads retain the existing authenticated-public-library semantics. Food visibility additionally retains the published-methodology rule. The nutrient reference catalog allows authenticated active-entry reads and no browser mutation policy. Anonymous mutation and draft reads are denied.

Recipe recalculation is an authenticated-only SECURITY DEFINER RPC with an empty fixed search path, explicit author gate, qualified table names, and same-recipe row locking. It processes JSON numbers only; incomplete ingredients clear stale snapshots, zero remains numeric, and missing serving counts never invent per-serving totals. Empty ingredient recipes are incomplete. Calculated snapshots record provenance/time. Anonymous/PUBLIC execution is revoked.

No staff defaults, role grants, client-private policies, diary/target permissions, feature flags or provider settings change. A scoped Coach's library permission concerns reusable global content; it does not grant access to any additional client record. Vitality Review still requires private-health read permission AND contact scope; unfinished answers and direct private-table reads remain denied.

Current audit support is existing created_by/updated_at where available and recipe calculation snapshots. Foods lack created_by in the existing schema; no immutable cross-library change history is claimed.

The production legacy client lifecycle/private-data policies require their own coordinated release and cross-account acceptance. This candidate does not certify or broaden those workflows. No staging synthetic data, grants, identities or mail allowlists are copied. Remote application and hosted acceptance are pending explicit approval.

Content sync security: service-role-only export/receive RPCs, empty definer search paths, reviewed content table/field whitelist, active Owner/Admin plus effective `learning.manage` rechecked for each production job action. Browser actor/destination fields are rejected. No creator Auth identities or unrestricted metadata are copied. Beta cannot invoke an export/reverse endpoint and never holds a production service key. Source and target audits are private; browser labels expose reusable-content provenance only through existing authoring RLS. No role grants, feature flags, payment or private-health policies change.


## 2026-10-07 — Production lifecycle preparation (not released)

Unapplied production lifecycle candidate tests exact caller role/permission/contact scope, hashed verified invitation claim, immutable/idempotent signing and no browser signature forgery. Production-only mail origin and unpaid access/payment-record holds are tested locally. Existing RLS/scope is preserved; no production role grants or data changes. Hosted and account-transition acceptance remain required.
