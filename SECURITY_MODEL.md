# RepDB Exercise Library local candidate — 2026-10-07

New exercise-library requests require the exact Netlify site/project/custom origin, matching Auth identity and active Owner/Admin plus learning.manage. Service-only RPC rechecks authority; unchanged RLS plus provenance trigger prevent browser spoofing/imported-global mutations. No permission grants or private-health-policy changes. Raw licensed dataset and service secrets stay private; public/bulk/actor override and reverse sync are denied. Beta source import uses only beta Auth/project secrets. [Release report](docs/REPDB_EXERCISE_LIBRARY_V1_2026-10-07.md). Not deployed.

# Live content sync security acceptance — 2026-10-07

## Beta enrollment control boundary — 2026-10-07

The new public invoker RPC wrappers call private, empty-search-path definer implementations. Every entry checks the exact beta environment/project/origin/synthetic mode, an active fully onboarded Owner/Admin, effective `finance.manage`, and contact scope. Anonymous/service-role entry execution is revoked; no role/default/override grant or table policy changed. A contact lock serializes new enrollment retries. Existing issued agreement/payment/membership terms cannot be replaced by this UI. Saves do not approve recipients, create Auth identities, send mail, record payment or grant paid access. Summaries return only the scoped lifecycle status, not credentials, raw notification bodies or private health answers. Prior-client responses and DOM are cleared on close/account/permission transitions. Eight native PostgreSQL 17 cases cover these gates; existing full-member RLS remains authoritative.


Active Owner/Admin plus effective learning.manage, exact production origin/site/project, fresh bearer identity, service-only SQL ACLs, content field/JSON whitelist, private audited jobs and atomic beta receive were tested. Coach/member/anonymous/reverse actions denied. Credentials remain server Functions-only; beta has no production credential. No existing grants, private-data policies or feature flags changed.

[Final hosted acceptance report](docs/FOODDATA_BETA_SYNC_ACCEPTANCE_2026-10-07.md). Earlier candidate entries below are historical.

# ReVitalized Academy security model

## Restricted member sign-in boundary — 2026-10-06

Member authentication is not paid authorization. `/member/` calls `member_paid_access_allowed()` before any dashboard bootstrap or private module read. A false result now clears all dashboard-private state and renders the local restricted-access view immediately; it does not reuse a previous member's DOM and does not expose lifecycle details beyond the neutral restriction message. The user may open the existing authenticated Enrollment & Signature Center for permitted lifecycle/support functions or sign out. Hosted Client B verification returned `full_member_access=false` after the audited enrollment access suspension, and the exact deployed browser path rendered only the restricted-access view with a clean console. No RLS, permission, role or database policy changed.

## Member password recovery boundary — 2026-10-06

Member recovery is deliberately separate from staff recovery. The public request is non-enumerating for invalid, missing, ambiguous and ineligible identities. Delivery requires exact normalized-email agreement across one contact, one eligible `client_access` row and its linked Supabase Auth user. The staging function also applies the existing exact-recipient allowlist; no domain wildcard is introduced. The generated action link must use the configured Supabase origin, `/auth/v1/verify`, recovery type and a non-empty credential before the branded application link is sent.

The browser reset page uses `no-referrer`, a recovery-only non-persistent Supabase client, disabled auto-refresh and disabled URL auto-detection. It immediately removes the one-time credential from the URL, exchanges it explicitly through `verifyOtp`, and updates only that recovered Auth user's password. This isolates the exchange from stale member/onboarding sessions without clearing another account's browser storage. The page contains no service-role key, direct database write, staff invitation completion, role grant, entitlement change or account-association path. Existing client access and RLS checks still decide whether the user may subsequently sign in to Member Access. Provider delivery and hosted password completion must be verified separately; local tests do not establish receipt.

## Pending staff email reconciliation

The Staff & Access manager may reconcile an uncompleted staff invitation to a corrected synthetic recipient only through the `staff-management` Edge Function. The operation requires an authenticated active actor with `staff.manage` and separately requires the actor's staff role to be Owner. It refuses Owner targets, completed/waived onboarding, invalid or unallowlisted recipients, existing Auth-user collisions, existing contact collisions and missing profile/contact bindings. It preserves the target Auth user, profile/contact, staff-access and pending invitation identities; it does not create a second account or change role, status, scope, permission overrides or agreements. Auth email and linked public records are synchronized with best-effort rollback, both reconciliation and setup-message resend are audited, and the reissued setup uses the existing approved staging redirect. Focused Edge tests cover identity preservation, one setup message, no invite/delete path, owner-only denial, completed-onboarding denial and collision denial.

## Staff-to-member browser identity transition — 2026-10-06

An account change invalidates the staff epoch, stops the retiring Supabase client's auto-refresh, unsubscribes its auth listener, closes contact/private modules through `ra:staff-access-reset`, removes the complete prior portal document and forces a unique same-origin restart. The transition path never calls global Supabase sign-out, preserving the newly authenticated identity in other tabs. Retiring the old auth runtime also prevents a stranded document from removing or overwriting the newer shared browser credential. A safe restart link remains after DOM destruction if browser navigation is interrupted. Explicit user Sign Out remains the only portal path that intentionally calls `auth.signOut()`. Exact-runtime coverage proves the prior staff identity and private DOM are removed, delayed responses cannot repopulate them, the retired listener/refresh loop stop once, the new identity is not signed out, and explicit sign-out still occurs once.

## Membership override and session isolation repair — 2026-10-05

Membership-level benefits require an explicit privileged `membership_override` origin; existing rows default to template-managed behavior. Reconciliation never derives or spreads an override, and all benefits still deactivate when a membership leaves active/pending lifecycle states. Existing RLS remains authoritative. Native tests deny member insert/reactivation/reclassification and prove no cross-membership inheritance.

Member session recovery adds no credential store and exposes no token. The existing Supabase client remains configured for persistent storage and auto refresh. Auth callbacks schedule data work outside the callback lock; logout, invalid session and identity changes synchronously clear private DOM and cancel stale asynchronous ownership. Exact-runtime tests cover delayed restoration, two tabs, logout propagation, invalid sessions and cross-account response isolation. [Repair evidence](docs/BETA_MEMBER_ACCESS_REPAIR_2026-10-05.md).

## Vitality UI cleanup security continuity — 2026-10-05

The dedicated staging entry/completion frontend release preserves all original draft/token/origin/expiry/access/locking boundaries. Email-only recovery remains neutral and cannot restore answers directly or expose identifiers; new duplicate-click suppression sends at most one in-flight request. No schema, policy, permission, token storage or Edge change. Hosted completed record hashes/timestamps/counts and accepted synthetic Netlify Spam capture are unchanged; no hosted form/email was submitted during this package. Completed UI was validated in an isolated exact-built fixture rather than reopening the hosted record. [Release evidence](docs/VITALITY_ENTRY_CLEANUP_2026-10-05.md).

## Private free-assessment resume — 2026-10-05

Approved participant-only verified-email recovery; no staff/household access broadening. Opaque 256-bit random credentials are SHA-256 hashed before RPC/storage. Mail tokens are single-use, rotate to session tokens, and replaced sessions are denied. Successful authenticated saves extend session expiry by 30 days. A new neutral email recovery flow can issue a fresh link after expiry. Email knowledge alone returns no answers or draft identifiers. Completed tokens return a locked state, not editable answers.

`private.vitality_assessment_drafts` and rate-limit table have RLS enabled and no direct anon/authenticated/service-role table grants. Fixed-empty-search-path private SECURITY DEFINER RPC is executable only by service_role through the public invoker wrapper. Edge has custom purpose-scoped credential authentication (`verify_jwt=false`) and exact origin/environment/recipient controls. Browser fragment is removed before analytics; request/provider errors are sanitized, tokens and payloads are never logged by the new code. No service key reaches public output. Per-email mail throttling, exact normalized contact matching, advisory locks, revision CAS, private final payload, unique workflow/draft/event and dispatch permit protect identity/data integrity.

Native tests prove cross-draft read/write denial, random/expired/replaced access denial, direct role bypass denial and completion locking. Hosted schema grants were verified after migration; hosted email/browser lifecycle proof remains pending. Existing invitation and client/staff gates remain open.


2026-10-05: Free Vitality resume is an additional required beta gate, currently **not ready**. New private answer recovery must not trust the public intake email lookup, inherit broad Journey-token authority, or require paid membership. Identity verification, one-draft scope, expiry/revocation, completed-state immutability, exact contact matching, least-privilege draft access and log/URL redaction require implementation and maintained tests. No new health-data storage/access policy has been applied. [Audit and pending identity/privacy contract](docs/VITALITY_RESUME_BETA_GATE.md).

Current staging beta boundary package is deployed: source20261004124537 applied once as ledger20261004214656, staff-managementv5 and frontend86a0bf3. [Hosted security review and limitations](docs/BETA_HOSTED_ACCEPTANCE_2026-10-04.md). No permission/role/entitlement grants. Existing advisor findings remain unchanged and explicitly guarded definer views/functions were reviewed. Required hosted cross-account/member proof is still incomplete, so BETA NOT READY. Previous undeployed descriptions below are historical.

Beta Readiness Core v1 (2026-10-04), **undeployed candidate**: [security findings and validation](docs/BETA_READINESS_CORE_V1.md). Legacy assignment staff reads and member identity-field updates require repair before beta. New scoped policies use `health.private.view` for reads, `health.progress.manage` for assignments, `learning.manage` for reusable composition and existing paid/active/claimed self entitlement for members. Contact scope is mandatory. Parent/contact triggers restrict completion and grocery writes. Duplicate staff invites cannot overwrite an existing role or rebind an existing member profile. Staff document teardown prevents private closure reuse across accounts; refreshed permission errors also clear it. No grants, household/minor rules, payment gates or flags changed. Local36beta database cases supplement existing215native checks; required hosted isolation/login acceptance remains blocked. Hosted policies have NOT received this migration yet.

Member Health & Progress v1 (2026-10-04): [privacy boundaries and tests](docs/MEMBER_HEALTH_PROGRESS_V1.md). Own-contact secure views/RPCs and current paid/entitlement access remain authoritative; no RLS, grant, guardian or household rule changed. The new read-only composition clears private health/progress DOM/caches/forms/dialogs immediately on logout, identity transition, access loss and failed bootstrap; stale successes and errors cannot repaint a new context.16 native boundary cases and52 UI/runtime cases supplement existing coverage. Hosted member acceptance is limited by sign-in and empty optional data; local fixtures are explicitly distinguished.


Nutrition Targets + Trends frontend repair (2026-10-04): all day/target/trend DOM and source/status labels clear immediately on client/date/range, close and permission transitions, denial or transport error. Read success/error and target-write completions require matching generation/contact/date/range, an open panel and current private-health access; edits additionally recheck `plan.override` before dispatch and completion. Request arguments capture the original client. The UI never directly selects private tables. The unchanged database remains authoritative for `health.private.view` plus contact scope on reads and `plan.override` plus contact scope on writes. All 37 database boundary tests and 102 frontend race/ownership tests pass; no grants were added. Hosted access remains pending, so successful authenticated hosted operation is not claimed. Earlier held-candidate findings below describe the pre-repair state.


Nutrition Targets + Trends validation (2026-10-04): target/trend reads require `health.private.view` AND contact scope; override set/clear requires `plan.override` AND contact scope. Thirty-seven new native tests pass, including out-of-scope, inactive, member, override-only read and private-reader-only write denials. Hosted definitions/permissions are unchanged. **Candidate frontend release held:** new trend DOM can retain prior-client data after switching to a denied client, and stale responses lack complete date/generation/open-panel ownership. The earlier day-review guarantees below remain true for that released package, not automatically for its new target/trend extensions. [Evidence and boundaries](docs/NUTRITION_TARGETS_TRENDS_VALIDATION.md).

Coach Nutrition Review repair (2026-10-04): the UI checks existing private-health permission and uses only the unchanged contact-scoped admin RPC. Contact/date/panel/permission transitions invalidate requests and erase rendered private content; delayed success or denial cannot contaminate another review. Management-only and override-only staff are denied private reads in native fixtures. No roles, grants, RLS or migration changes. See [repair contract](docs/COACH_NUTRITION_REVIEW.md).

Current staging addition (2026-10-04): [Nutrition Diary security and tests](docs/NUTRITION_DIARY.md) documents paid/claimed self access, lifecycle-restrictive diary/target RLS, qualified empty-search-path definer functions, explicit anonymous revocation and private helper ACLs. Staff review requires private-health permission plus contact scope; target writes retain their independent override gate. Hosted role/default/override fingerprints are unchanged. Twenty-eight new native PostgreSQL tests validate these boundaries; no production security change was made.

Observed production baseline and IMPLEMENTED undeployed fixes, 2026-09-26. This is a scoped review, not a penetration test or security certification.

## Required boundaries

- Protect live client, assessment, health, household and staff data. Preserve existing access controls and structures.
- Browser clients use publishable credentials; service-role/secret credentials stay on the server.
- Authorization requires active membership/staff status, applicable permissions and contact/household scope. A visible navigation item is not an authorization boundary.
- `people.export` is separate from ordinary staff/admin access. Import is also permissioned. Do not turn on export by broadening a role.
- Preserve guardian/subject authorization and adult/child routing. Family membership must not silently imply unrestricted health-data visibility.
- Signatures must bind to correct parties, exact approved contract/template versions and current content. Retain company approval and auditability.
- Health consent is per metric/provider; AI personalization and health use must remain consent controlled. Privacy deletion must follow the approved workflow rather than immediate browser deletion.

## Verified configuration and code

| Control | Evidence | What it does not prove |
|---|---|---|
| Public table RLS | All 180 listed public tables report RLS enabled | Correct policies for every role/action |
| View execution | All 204 public views report `security_invoker=true` | Absence of privileged-function bypasses |
| Private storage | Six buckets are non-public: personal-videos, vitality-reports, member-message-attachments, client-documents, progress-photos, privacy-exports | Correct signed URL lifetimes and per-object permissions in every flow |
| Contact scope | `private.staff_can_access_contact` checks active staff, crm.view and all/assigned scope; assigned scope considers coach/task ownership | Tested cross-contact or cross-household isolation |
| Export defaults | Owner allowed; admin/coach/financial/support denied for people.export and people.import | That the permitted export path currently succeeds, or that already-readable rows cannot be copied |
| Export UI | `portal/portal-people-directory.js` checks permission and blocks download if audit RPC fails | A server-controlled bulk-export boundary |
| Edge authentication | Six inspected privileged/request functions call `auth.getUser`; public-intake and staff-password-reset are intentionally unauthenticated entry points | Full authorization correctness. All 15 deployed functions have gateway `verify_jwt=false`, so each handler must enforce its own boundary |
| Advisor | One warning: leaked-password protection disabled | A clean authorization audit; the advisor does not validate application business rules |

Advisor remediation reference: [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Enabling it would change production configuration and was not performed.

## Original production findings (still live until release)

1. **Staff-assisted Coach Companion lacks explicit scope/status checks in the inspected handler.** Deployed `coach-companion-request` v1 looks up a staff row by user ID and branches on its existence, then accepts a supplied contact ID using a privileged client. That path does not explicitly require active status, the relevant permission or `staff_can_access_contact`. This is a static authorization concern, not a demonstrated production exploit. Reproduce with synthetic disabled/assigned-scope staff before a narrowly scoped remediation.
2. **Permission overrides can outlive active staff checks.** `private.staff_has_permission` returns an explicit override before consulting active role defaults, except for its pending-coach special case. A remaining override may authorize an inactive staff user where callers do not independently check status. `staff_can_access_contact` and `staff-management` do check active status, but not every caller can be assumed to do so. Test permission revocation centrally and at callers.
3. **CSV audit path appears unable to insert under normal authenticated RLS.** `log_people_export` is security invoker and inserts into `staff_access_audit`. That table has RLS, authenticated has no INSERT grant, and the observed policy inventory contains only SELECT, with no applicable INSERT policy. The UI intentionally aborts when audit logging fails. Treat permitted export success as unverified/likely blocked until an authenticated isolated test proves it. Preserve permission and audit gates when fixing it.
4. **Export gating is narrower than data exfiltration prevention.** The browser already queries `admin_people_directory`; blocking the CSV button/audit RPC cannot prevent copying rows legitimately visible under RLS. Preserve least-privilege row/column access and obtain a decision if stronger bulk-access restrictions are intended.
5. **Acquisition synchronization can fail independently.** Assessment progression waits for Netlify capture, while the Supabase mirror is fire-and-forget and swallows errors. Existing assessment tests do not load that bridge. Add integration/failure-path tests without changing approved question behavior or silently replacing the primary capture mechanism.
6. **Origin/environment mismatch.** Inspected Edge Function allowlists accept the custom domains and localhost ports 3000/5173, but not the Netlify alias or arbitrary preview URLs. A successful public page load on the alias does not prove its forms can call Supabase. Confirm the approved staging origin before adding any allowlist entry.
7. **No reproducible database security test baseline.** Live policy/function code is ahead of repository history. Restore source provenance and isolated role tests before treating historical “security passed” statements as current proof.

## Assessment and sensitive information

First capture saves the respondent's contact details, not the child's contact details or health answers. Child routing is `My child` plus age 0–18 inclusive; age 19+ keeps the adult questionnaire. Questionnaire scope does not redefine legal guardianship. Existing tests cover consent, subject identity, branch clearing, missing child code and no browser persistence of unfinished health answers.

Full public assessment answers and readable summaries are submitted to Netlify Forms; Supabase receives identity, journey events and derived concern/goal tags through the bridge. These tags can themselves be sensitive. Netlify storage/access/retention and notification recipients were not inspected in the control plane. A change to where answers are stored needs explicit design/privacy review.

## Verification still needed

Use isolated fixtures, not live client accounts, for anonymous vs member vs unrelated member; cross-household and guardian cases; coach assigned/unassigned scope; suspended staff with overrides; owner/admin export allowed/denied; staff invitation/NDA readiness; stale/duplicate/wrong-party signatures; provider-consent denial; privacy export ownership and expiration. Verify backend denial as well as UI hiding.

No live role impersonation, data mutation, account reset, email delivery, upload, signature, payment or privacy request was executed during this baseline. No keys or personal records are included in the documentation evidence.

## Previous security package — baseline before the lifecycle extension

- `private.staff_has_permission` requires an active staff record before overrides/defaults and blocks pending/blocked coaches. Explicitly waived onboarding remains supported; active owners/admins retain existing defaults. `staff_access` RLS no longer exposes a usable self row to inactive/pending actors, closing legacy raw-row policy checks. A narrow self-status API preserves login messages and NDA onboarding without exposing other staff.
- Companion requests, knowledge and reviews use `companion.manage`; member-specific actions require contact scope. Manual overrides retain their legacy action-specific role limits plus current permission/status/scope checks. Staff management uses the same central permission gate; journey-link creation and notification delivery reject inactive staff. The current member self-service request RPC is unchanged.
- `export_people` combines permission, explicit row scope, a fixed 13-column ordinary-data allowlist, a 5,000-row cap and server-counted audit insertion. Any audit failure aborts the transaction. The compatibility `log_people_export` RPC validates the scoped count. Neither grants direct audit INSERT access or health/private-health fields.
- Client/staff signing locks the agreement row, checks the caller, requires the displayed version hash, verifies integrity and writes acceptances/state atomically. Stale/missing hashes fail closed. Pending coaches may sign their own NDA; inactive staff cannot sign back into privilege. Multi-agreement onboarding is computed from all required documents, including declined status.
- Readiness uses payment totals/waivers and agreement/signature completion together; marking a short payment “paid” does not satisfy it. The activation transition and member-account entry point enforce the same gate. No live records are backfilled, reactivated or revoked by this package.
- New public RPCs are security invoker wrappers; narrowly scoped definer helpers live in `private` with fixed search paths, caller checks and explicit grants. Tests restore actual default ACLs and verify anonymous RPC denial, preventing default grants from accidentally exposing new functions.

VERIFIED locally: 40 real-Postgres tests and 10 mocked-transport Edge tests cover positive/negative authorization, contact scope, export audit rollback, stale/wrong-user signatures, shortfalls/waivers, NDA aggregation and activation rechecks. All 15 current Edge sources typecheck. Recovery also found and fixed an invalid `now()` call on a timestamp string in companion review, a mixed-record trigger field lookup and the missing allowed `blocked` onboarding value.

Limits: managed Auth/Storage are test fixtures, not a hosted-stack replay; outbound providers are mocked; broad cross-household/minor/health-consent/privacy-export acceptance remains outstanding. Historical permissive policies still need comprehensive role/scope review; the central staff status correction is not a claim that all 426 policies are otherwise correct. At that earlier baseline, secondary signatures used one account and financial reversals did not restrict existing access. Both limitations are addressed by the approved lifecycle extension below.

Live advisors were read without modifying production. [Leaked-password warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remains. Performance notices concern [unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), [multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies), [duplicate indexes](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index) and [Auth connection configuration](https://supabase.com/docs/guides/database/database-linter?lint=0015_auth_db_connections_absolute). No index was removed and no setting was enabled.

## Client lifecycle security extension — 2026-09-27 UTC

The earlier single-account secondary-signature and payment-reversal limitations are now addressed in code under explicit user approval. Each signature requires a distinct authorized Auth identity and exact immutable displayed hash. Secondary recipients must verify their own email; invitation capability does not create primary contact/household/member access. New private invitation rows enable RLS and deny direct client reads. Pending delivery links are service-dispatcher-only and removed after sending/cancellation. Known minors are rejected; no third-party identity/age certification is claimed.

Restricted onboarding and payment-suspended identities fail the shared paid predicate and additional restrictive RLS on paid tables and Storage. Original ownership, consent and relationship rules remain in force. Profile-to-contact relinking is no longer client-writable. Narrow private helpers return only allowed onboarding/agreement fields; public entry points are security invoker. Coaching/companion service paths and private member helpers enforce the same caller/access checks.

Payment/individual-agreement waivers require active scoped owner/admin authority, reasons and recorded audit. Database transitions audit suspension/reactivation and preserve historical health/progress/coaching data. Local tests include direct bypasses, co-signer privacy, negative permissions and two-connection financial contention. [Boundary details](docs/CLIENT_ACCESS_LIFECYCLE.md), [166-case evidence and advisor results](docs/engineering/LIFECYCLE_TEST_RESULTS.md). These checks do not replace hosted Auth/provider acceptance or the wider household/minor privacy review. No live security setting changed.

New client foundations require an explicit enrollment-invitation claim before exposing enrollment or agreement data, independently of automatic Auth email/profile linkage. Invitation delivery fails closed until an approved HTTPS origin is configured in the existing runtime config; staging has no automatic production-domain fallback.


## Staging isolation and deploy artifact controls

The staging package introduces explicit runtime/build environment validation before any Edge database/provider request or browser client initialization. Staging rejects production ref/origin/callbacks and incomplete configuration; build checks dedicated site identity/context/branch. Browser output contains only public config; service/provider keys stay server-side. Root publishing is replaced in tracked configuration by a reviewed 306-file artifact. This does not claim existing live production artifacts were removed.

Provisioning requires a new empty application/Auth state, a matching non-production ref/verified-TLS connection and explicit apply acknowledgement. Staging origin/payment constraints, all existing RLS/signing/paid gates, private buckets and export defaults remain. Raw legal PDFs/template text are ignored private inputs with pinned hashes. No live user/client data is seeded.

Staging email dispatch is restricted to exact controlled inboxes and same-origin callback URLs; SMS is disabled and no checkout endpoints are allowed. Hosted Auth SMTP is a separate boundary requiring a restricted test transport before account creation. Local seeded advisors: zero security findings, eight existing performance warnings, no indexes removed. No hosted Auth setting or production configuration changed. See docs/STAGING_ACCEPTANCE.md for the remaining hosted gate.


## 2026-10-06 — Beta staff recipient approval

Beta staff email approval requires active completed Owner/Admin and staff.manage; exact address/reason/actor are audited. Service-only checkers are purpose-specific. Client and staff approvals never substitute for each other. Dynamic staff exceptions require the isolated beta project and branded beta origin. Direct registry access and anonymous approval are denied; production never consults the registry.

Content sync security: service-role-only export/receive RPCs, empty definer search paths, reviewed content table/field whitelist, active Owner/Admin plus effective `learning.manage` rechecked for each production job action. Browser actor/destination fields are rejected. No creator Auth identities or unrestricted metadata are copied. Beta cannot invoke an export/reverse endpoint and never holds a production service key. Source and target audits are private; browser labels expose reusable-content provenance only through existing authoring RLS. No role grants, feature flags, payment or private-health policies change.
