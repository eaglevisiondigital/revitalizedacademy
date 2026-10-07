# Beta staff invitation recipient repair

## Finding and change

The existing beta recipient approval applied only to client notification delivery. Hosted `staff-management` v16 and `staff-password-reset` v16 called the static `assertSyntheticRecipient` directly. An approved client recipient did not permit staff invite/setup mail. Drew's specified email had no beta contact, Auth/staff identity or saved invitation; a rejected invite therefore cannot be safely treated as an existing account to resend.

Added a purpose-specific, exact-email staff approval registry and append-only-through-RPC audit in `private`. The authenticated approval RPC requires an active onboarding-complete Owner or Administrator with `staff.manage`. Approval/revocation records actor, email, reason and time. Approval itself creates no Auth identity, staff role, client record or invitation. The service-only checker is constrained to the isolated beta runtime marker and beta origin. Direct registry access is revoked and RLS denies direct access. Existing client approvals and staff approvals do not substitute for one another.

The unchanged static allowlist remains valid. Dynamic staff approvals now cover normal staff invite, pending email reissue and branded password setup/recovery. Existing active-staff eligibility, role restrictions, contact identity collision checks and recovery's neutral response remain. Pending email reconciliation remains Owner-only; this repair does not broaden who can change existing staff identities. No production migration, Edge deployment, role grant, provider secret or configuration change was performed.

## Deployment

- App source: `1b5fd7a7c214b3a4341fa8c389d43b9fadd7c71d`, isolated `codex/beta-recipient-approval`, pushed.
- Beta Netlify site: `071b252e-a922-4846-a784-8dca1edad377`.
- Deploy: `6ac5c5de7cf112896cd1d9c8`, ready.
- Primary URL: https://beta.revitalizedacademy.com/portal/
- Live asset: `portal-staff-access.js?v=185`.
- Exact built/live SHA-256: `6e2c3541b5198e82587b7308a96655c90b378f3e89e034efd074e4be146823bf` (same site's Netlify fallback used for shell fetch; browser verified custom beta origin).
- Staging Supabase: `bvooallokgfktssadsrv`.
- Migration source: `20261007040256_beta_staff_recipient_approval.sql`; hosted ledger: `20261007040620`.
- `staff-management` v17; `staff-password-reset` v17. Downloaded deployed files match reviewed source; unchanged shared environment and authorization files match v16. Existing verify_jwt=false retained because handlers use their existing custom authentication / eligibility logic.
- Production deploy remains `6ac52af350af344e34bcfa31`; production has no staff beta registry/migration.

## Verification

| Coverage | Result |
|---|---|
| Full frontend | 519 passed, 0 failed, 27 established skips |
| JS syntax | 78 passed |
| Native Deno Edge suites | 55 passed, 0 failed |
| Affected Edge type checks | Both entrypoints pass |
| Native PostgreSQL 17 staff approval | 9 passed, 0 failed |
| Existing PostgreSQL 17 client approval | 9 passed, 0 failed |
| Exact built client/staff approval forms | 6 passed, 0 failed |
| Actual branded staff-reset handler runtime | 4 passed, 0 failed |
| Live default viewport | 1280px viewport/page width, no page horizontal overflow |

Coverage includes Owner/Admin approval, permission denial, inactive/pending denial, Coach-with-permission denial, member/anonymous denial, exact normalization/wildcard rejection, revocation, actor audit, service-only lookup, purpose isolation, production refusal, static allowlist preservation, new invitation beta redirect, pending reissue identity preservation, no send/identity changes before approval, active staff password setup and neutral unapproved recovery. Fixtures create/drop disposable local databases only. The known nine unrelated agreement-onboarding-origin fixtures were not run or changed by this narrow package.

Security advisors report the new private RLS/no-policy tables and authenticated SECURITY DEFINER approval endpoint, both intentional and protected by explicit grants/role checks. Existing unrelated family views and other findings remain out of scope. [RLS policy advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [authenticated function advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Hosted delivery gate

User identified `drewgdavies@protonmail.com` and selected Administrator / All People. No existing identity was found. The normal staff form requires an approved name and phone, which have been requested. Owner approval form is prepared in the authenticated beta Owner session, with exact address and reason. Browser policy requires immediate confirmation before saving this mail permission; confirmation was requested. No approval, staff identity or email has been created yet.

After approval and required contact details arrive: save the normal Owner approval; verify actor audit and exact allowed/unrelated blocked state; send one normal staff invitation with the selected role/scope; verify provider acceptance/delivery and configured beta-only redirect. Do not count provider delivery as actual human receipt, and never inspect/output credential URLs or tokens. Do not claim final hosted acceptance before those steps pass. No further unrelated work is authorized.
