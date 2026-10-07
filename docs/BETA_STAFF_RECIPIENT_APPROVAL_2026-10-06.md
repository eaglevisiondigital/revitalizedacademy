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

## Hosted delivery acceptance — latest user approval

The latest explicit approval replaced Administrator/All People with **Drew Davies / Coach / Assigned People Only**, exact email `drewgdavies@protonmail.com`, phone `2502677473`.

Normal Owner UI saved one purpose-specific staff recipient approval, audited to Dave Fowler - Staging Owner. Then sent one normal staff invitation. One Auth user `f9a34e2e-b363-460c-a305-bda9fa874192`, one invitation `738d473b-87c5-4401-ae6d-e1f11fff0625`, Coach/assigned active directory state, pending onboarding. No duplicate or synthetic identity reuse. Provider message `01a11493-a013-76ab-ba8a-0b6bccce1caa` (subject `You've been invited`) reports **delivered**. This is provider delivery evidence, not a claim of actual human receipt or completed setup.

Only safe origin/path metadata was emitted during invitation inspection; no raw credential was exposed or consumed. The normal Supabase invitation verifies through the isolated beta project at `/auth/v1/verify`, then redirects exclusively to `https://beta.revitalizedacademy.com/portal/` with staff setup. No production destination is present. The literal verification-link hostname is Supabase, so a requirement that the first-hop href itself have only the beta hostname is not met by this existing normal Auth architecture; the beta-only application return is verified. This task did not replace or redesign secure Auth verification.

Unrelated unapproved recipient checker remains false. Production deploy remains `6ac52af350af344e34bcfa31`; no production mail permission/config changes, no original static staging allowlist changes.

**Hosted acceptance remains pending Drew:** email unverified, no last sign-in, onboarding pending at send-time checkpoint. Drew must open the newest invitation normally, complete password/account setup (and any required NDA himself), then sign in to the beta portal. Effective Coach role and Assigned People Only scope must then be verified in his fresh session. The sender Owner's directory view alone is not a substitute for Drew's hosted acceptance. No credentials or token-bearing links requested from the user. Stop until the user reports setup completed or an error.
