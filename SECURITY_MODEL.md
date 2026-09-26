# ReVitalized Academy security model

Read-only baseline, 2026-09-26. This is a scoped review, not a penetration test or security certification.

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

## Findings requiring isolated verification

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
