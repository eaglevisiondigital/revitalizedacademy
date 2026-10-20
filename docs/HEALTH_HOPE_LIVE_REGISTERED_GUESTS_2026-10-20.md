# Health & Hope Live — approved Registered Guest model, 2026-10-20

## Completed — local candidate only

Repository: eaglevisiondigital/revitalizedacademy. Branch: `codex/health-hope-live`; separate worktree: `health-hope-live/`. Started clean at `42bfbd0`. No changes were made to the primary worktree. Public website release `6ad7baf2e7b6f17c96d9dc78` already exists; this package makes no production deployment, hosted migration, provider configuration, notification or participant write.

The owner's new guest decision is implemented in the held backend. Registration activation is still held. Read-only production catalog inspection confirms the existing six CRM lifecycle values, unchanged contact triggers, no event tables and neither event migration installed. No contact rows, private health records or credentials were inspected.

## 1. How guests appear in the existing backend

A new identity is a row in the existing `public.contacts`, with `record_kind=crm`, `lifecycle_stage=registered_guest`, and `first_source/last_source=health_hope_live`. This is explicitly set by registration; the general CRM default remains unchanged for unrelated contact creation. CRM All People renders the existing title-case badge as **Registered Guest**. New Guest/Engaged Guest/Prospective Client filters are added; the existing New Leads quick view excludes these three values. The contact editor recognizes these states without offering unaudited event progression in that selector.

The held Health & Hope Live staff page displays event classification, current CRM relationship, registration/verified attendance counts, individual session history, consent preferences and reviewed outcomes. Existing CRM view permission and contact scope control visibility. Existing complete/waived active Owner/Admin + CRM manage gates control event management and progression. No permission defaults, founder identities or scopes change.

## 2. One master identity, no second CRM

No person/contact table is added. The existing normalized-email advisory lock, conservative name matching, unique per-session email/contact keys, idempotent request IDs and identity-review queue are reused. The existing contact-tags table records `health_hope_live_guest` membership once after a verified association. Ambiguous identities remain unlinked for review, without creating another contact or sending joining information.

Existing clients, prospects and legacy CRM relationships are preserved exactly when they attend. They gain event guest membership and separate session history, not a downgrade of their established relationship. **Event audience membership and current CRM relationship are displayed separately.** Historical lead classifications do not imply that HHL qualified that person.

Registration creates no Auth account/profile, client access, membership, coaching/course enrollment, assessment/workflow, payment or enrollment activation. It grants no portal access. Unrelated existing CRM/onboarding behavior is unchanged.

## 3. Intentional progression and session outcomes

| Relationship | Entry or change |
| --- | --- |
| Registered Guest | Explicit initial classification for a new event contact. Repeat registration/attendance/marketing preference do not promote. |
| Engaged Guest | Deliberate scoped event-manager action with a recorded reason. |
| Prospective Client | A subsequent deliberate manager action recording client interest or a qualification decision. No registration-count or attendance trigger. |
| Active Client | Existing approved enrollment/onboarding process only. Event actions cannot set `client`, create an enrollment, or grant access. The event view labels Active Client only from existing active client access. |

Stage actions serialize on the contact, require an expected current stage and write both CRM activity and private event audit records with actor/reason/from/to. Stale requests, skipped stages, arbitrary legacy reclassification, insufficient permissions and cross-scope actions are denied. Existing qualified relationships continue through their existing CRM process.

Registrations retain their weekly session, time/status/source, independent consent flags and matched attendance. Missing attendance remains **unreviewed**. A manager may record/clear a no-show only after the session ends, with evidence/reason and optimistic status checking. Canceled sessions are distinct. Outstanding unmatched Zoom identities block a guessed no-show; some absences may remain unreviewed until identity reconciliation is complete. Late verified attendance supersedes a reviewed no-show and records a correction audit. None of these outcomes advances a CRM stage.

The API injects the server-only `hhl-guest-v1` contract; public bodies cannot choose the stage/contact/attendance/access fields. The original SQL rejects this unknown contract before participant writes, and the new SQL requires it. This prevents a mismatched old lead-based installation from silently collecting new registrations.

## Changed files and database candidate

- `supabase/migrations/20261020193400_health_hope_live_registered_guests.sql`: CLI-generated, atomic forward migration following the original event candidate. Adds three values to the existing contacts stage check, one private registration outcome column, two private trigger helpers and replacements of the two event-only command helpers. No new table, RLS policy or role/permission change. Timeout-bounded DDL; all six old lifecycle values remain valid. Default flags stay off.
- `netlify/functions/_shared/health-hope-live.mjs`: allowlisted staff actions and required server guest contract; caller JWT is forwarded with the publishable key for staff operations.
- `portal/health-hope-live.html/js`: classification, intentional progression and reviewed no-show presentation; existing session/logout/background clearing is retained.
- `portal/index.html`: only three recognized contact-stage options and three All People filter options. Reconcile these small markup hunks with the primary portal source; never replace its full current file.
- Tests and `scripts/test-health-hope-live-database.cjs`: expanded guest/privacy/permission/contract coverage; test preservation snapshots now stay in memory, avoiding shared temporary files across workstreams.

Original event migration `20261020141529_health_hope_live.sql` remains **37800 bytes**, SHA256 `3c34381dbb2add5bde325e5a932edac977980404b3ae38d848f8a1077a1c79aa`. New guest migration is **37417 bytes**, SHA256 `4bfafeb108713436c2aaf46283bdfb008a4089dd28bfd7bf3ad6750a9d530b24`. Both are unapplied remotely. Install neither separately without the reviewed full activation package. Never blanket-push this branch's partial migration history.

No backfill silently relabels existing contacts. Production has no event rows/schema. If a future staging installation contains older candidate data, review its identities, source history and classification before reconciliation; do not infer qualification or client eligibility from event attendance.

## Tested and security evidence

- 35 feature/scope/API tests passed. All 336 other tracked backend/script/asset files under the protected paths are unchanged from the starting commit; the intentional event files and two CRM selector hunks are explicitly excluded from that comparison.
- 48 PostgreSQL 17 database cases passed, plus an eight-request concurrency test: one master Registered Guest, one session registration, one guest tag and one confirmation job.
- The entire historical schema and 19 branch migration files restored in a uniquely named disposable loopback database. All 319 pre-existing application function definitions, existing table RLS/policies/ACLs, function ownership/ACLs and global-role metadata remained unchanged. The test DB was removed; the existing shared server was left running and other databases were not touched.
- Original-schema rejection of the new API contract tested before the guest migration; new-schema rejection of missing/old contracts tested afterward.
- 106 existing assessment/resume/client lifecycle/payments/content/staff-session regressions passed. Initial invocation lacked the external jsdom module path; the complete run passed with the existing sibling dependency directory, without installing/changing dependencies.
- 336 browser checks passed in Chromium and WebKit at 1440/768/390px, zero page errors/overflow. Verified explicit progression/reasons/expected stages, no direct Active Client action, reviewed no-shows, read-only staff controls and stale history after logout. All application/provider requests intercepted with fictional identities; zero hosted writes/provider calls/external asset requests.
- Production static build: 448 allowlisted files. It is an inspection artifact, not a safe blanket production payload. Existing public event/homepage assets remain unchanged in this package; the registration client stays held.
- Supabase CLI security advisors ran locally before/after the full event candidate: 25 pre-existing findings retained, eight expected INFO notices for private tables with RLS and no allow-policies, zero new warnings/errors or unexpected findings. Those eight tables intentionally deny direct access; scoped guarded commands are their only application path, verified by ACL/RLS tests. No permissive policy was added to silence the [informational notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). The guest migration adds no table or RLS policy. The CLI required an explicit loopback-only PGSSLMODE workaround for its [URL parsing issue](https://github.com/supabase/cli/issues/5873); no hosted TLS setting changed. [Advisor receipt](health-hope-live-guests-2026-10-20/security-advisors.json).
- Current Supabase changelog and [function security documentation](https://supabase.com/docs/guides/database/functions) reviewed. No broad grants, private-health access or credential values were needed.

[Machine-readable receipts](health-hope-live-guests-2026-10-20/validation.json) · [Desktop staff fixture](health-hope-live-guests-2026-10-20/desktop-guest-history.png) · [Mobile staff fixture](health-hope-live-guests-2026-10-20/mobile-guest-history.png). Screenshots contain fictional data only. Browser checks cover the pre-existing held/public paths as well as the new staff workflow. Only the new staff screenshots are retained in this package; public screenshots remain in the earlier website release evidence.

## 4. Effect on launch requirements

This resolves the guest-classification implementation requirement. It does **not** activate participant collection or reopen the approved website design, Thursday schedule, free price or 12-month duration. The existing contact constraint extension, event commands and staff markup become explicit parts of the future reviewed activation package. Public website publication is already complete and does not depend on this local backend change.

## 5. Remaining before live registration

1. Implement the already approved 12-month session-history expiry/de-identification and anonymous aggregates, provider cleanup, and authenticated audited export/deletion. Cover new outcome/audit records and event-derived tag/activity links while preserving separately governed shared contacts and consent/withdrawal policies. Do not reopen the duration decision or delete shared contacts to expire a session.
2. Validate actual Zoom account/app/host/scopes, weekly meeting/occurrence bindings, registrants, signed webhooks and attendance reconciliation; validate event From identity/credentials, delivery/suppression/retry behavior and valid joining details. No test message may go to a real participant without bounded authorization.
3. Reconcile with the then-current production source/ledger and primary workstream; review exact migrations/security/rollback, preserve already-published website assets and existing Function artifacts, then perform separately authorized fictional hosted end-to-end acceptance.
4. After all gates pass, record exact release/activation authority for the named client/server/database package, meeting/session/sender bindings and allowed test recipients. The website-only approval must not be reused to enable unvalidated providers or collection.

No new business decision is required for Registered Guest progression. No production SQL, deployment, integration activation or notifications were performed. The public website remains available with registration held.

## Next recommended build / Chat handoff

Implement the approved retention/export/deletion package against this guest-aware candidate, then obtain masked vendor readiness and bounded hosted acceptance. See the [updated release handoff](HEALTH_HOPE_LIVE_RELEASE_HANDOFF.md) for complete copy-ready next-build and vendor prompts.

**Chat handoff:** Health & Hope Live's held backend now creates deduplicated Registered Guests in the existing CRM, records separate weekly participation and consent, preserves established client/prospect relationships, and supports audited staff-only Guest → Engaged Guest → Prospective Client progression. Active Client still requires existing approved onboarding. Missing attendance stays unreviewed; reviewed no-shows can be corrected by verified attendance. Local feature/DB/concurrency/browser/regression checks pass with existing permission boundaries and 319 legacy functions unchanged. No production release or activation occurred. Remaining activation gates are approved retention/export/deletion implementation, actual Zoom/email readiness, exact source/ledger reconciliation and authorized hosted acceptance.
