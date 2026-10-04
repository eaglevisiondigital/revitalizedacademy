# Beta Readiness Core v1 — hosted owner preflight — 2026-10-04

Historical snapshot. Superseded by [the later hosted release/acceptance record](BETA_HOSTED_ACCEPTANCE_2026-10-04.md); retain the original evidence below.

**BETA NOT READY. Step1 has not passed; deployment and transactional acceptance remain blocked.**

## Exact owner finding

Read-only inspection confirms one existing staging owner: active, email-confirmed, onboarding complete, contact scope all, not banned. Effective `staff.view`, `staff.manage`, `crm.manage`, `learning.manage`, `health.private.view` and `health.progress.manage` are all true. No staff invitations are pending. These are database eligibility checks, not a successful normal browser login.

The hosted `get_my_staff_access()` calls `private.my_staff_status()`, which returns only the row matching the authenticated user. The deployed portal shows **Staff access is pending** when that successful read returns no row. It shows a different error for inactive/suspended staff or a failed access check. The initial browser showed the pending state; therefore it was not an authenticated session for the existing owner. There is no evidence that the owner needs a new role or approval.

Normal path: sign out of that account, sign in at the staging Staff Portal with the existing approved owner's email/password, then verify dashboard access and refresh. This preflight signed out the pending account and prepared the owner's email on the normal sign-in form. Password entry is left to the user; no credentials are requested in chat. Owner authentication is still pending.

The original staging bootstrap documentation describes an explicit operator-controlled first-owner grant because public signup cannot create owners. That bootstrap has already been fulfilled here. **No additional SQL grant, role change, manual activation or approval is required or justified by this preflight.** Existing authorized owners manage later staff through Staff Directory → Invite/Manage; the pending account cannot approve itself. If the existing owner password is unavailable, use the normal recovery flow and let the user enter the new password; do not manufacture access.

## Source and deployment

- Accepted deployed source: `1462b34b49716f19fb0db55d4bc11098edfe2b9d`.
- Unchanged candidate: `3996379487554aecf571a5efa1f5457cccf9195e`, branch `codex/staging`.
- Candidate commits: implementation `eed4a9dd7eccf00105d33b7d3d47820c47955fd5`, evidence `3996379487554aecf571a5efa1f5457cccf9195e`.
- No application/backend source edits, push or deployment during this preflight. Documentation/evidence changes are separate from the candidate.
- Staging site `071b252e-a922-4846-a784-8dca1edad377` remains deploy `6ac1fec19f756106b6a84964`.
- Supabase `bvooallokgfktssadsrv`; latest recorded migration `20261004055612`. Candidate migration `20261004124537` is absent and was **not applied**.
- Production site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06` remains deploy `6ac036d3b48eac0008568e00`;20of20 public hashes/statuses unchanged.

## Coordinated review before release

Preliminary source/current-state inspection confirms the forward candidate is required alongside the new assignment frontend and staff-management Edge repair. It replaces permissive legacy assignment policies, preserves restrictive lifecycle policies, enforces staff permission plus contact scope, protects parent/contact identity and exposes own-assignment member reads. It contains no hosted record seeding or staff-role permission grants. All12 affected assignment/composition/log/restriction tables are currently empty, reducing data-compatibility risk. Existing accepted RPC signatures are retained; local PostgreSQL17 evidence already covers complete baseline plus candidate restore.

This is **not a full hosted release pass**. The owner gate is still unmet, so no migration, Edge deployment or frontend-only deployment was attempted. Existing broad legacy staff assignment behavior remains on staging and must be replaced through the coordinated release after the gate passes. Do not use live beta clients on this held baseline.

Current role-default inspection shows `plan.override=true` for owner/admin and false for coach/financial/support. These pre-existing rows were read only and unchanged. Do not carry an older historical “zero grants” statement forward as a claim about the current environment.

## Acceptance status

| Requirement | Result |
| --- | --- |
| Owner eligibility | PASS: existing approved owner and six required effective permissions verified |
| Normal owner login / refresh / relogin | BLOCKED: normal sign-in handed to user; no owner session obtained |
| Client invitation/activation/login/recovery/revocation | NOT EXECUTED; blocked by owner gate |
| Staff invitation/activation/scoped access | NOT EXECUTED; blocked by owner gate |
| Meal Create → Assign → View | NOT EXECUTED hosted; prior local candidate evidence retained |
| Workout Create → Assign → View | NOT EXECUTED hosted; prior local candidate evidence retained |
| Invitation generation / external email delivery | Neither executed in this preflight; no new delivery claim |
| Cross-client isolation / delayed requests | Prior local evidence retained; required hosted proof outstanding |
| Session/logout/account transition | Pending account normal Sign Out returned to login; owner and multi-account cycles remain unproven |
| Hosted responsive acceptance | NOT EXECUTED for protected workflows; prior33local checks do not replace it |
| Disposable hosted data / cleanup | None created; no content/account cleanup needed |

No hosted content, roles, permissions, flags, schemas, payments, SMTP, SMS/Twilio or Edge Functions changed. The only hosted UI action was normal logout of the previously pending session; authentication sign-out is not a permission grant. No account creation, email, password change, legal acceptance or business-data mutation occurred.

## Existing test evidence retained, not unnecessarily repeated

Candidate source is unchanged. Previous verified totals: build313files; JavaScript syntax77passed; frontend443passed/0failed/27existing skips; PostgreSQL17.11 215/215; Edge30/30 and19entrypoints typechecked; new exact-built runtime20/20, database36/36 and Edge5/5; responsive33checks. Member Health & Progress and Nutrition Targets + Trends remained green in that run. No fresh hosted acceptance is inferred from these local results. The9historical agreement-origin failures passed after fixture setup correction;27frontend skips and the known Edge dependency warning remain disclosed.

## Exact current live baseline assets

All14 below returned HTTP200 and matched SHA-256 of the accepted source at1462b34. These are the old deployed baseline, **not the beta candidate**.

| Live reference | SHA-256 |
| --- | --- |
| `portal.js?v=187` | `2f27755326d9af204ed079ffcddfe2c62c07a11221f68f0770d78196ce58c46d` |
| `portal-people.js?v=135` | `006f498c5ec023b506b8afe1cad84be16ab34b236a4ff5b252010c04a147bf56` |
| `portal-permissions.js?v=131` | `15499f2a220785adb795728a7bea41140b9853c857d1d07e875d4a976b35bef0` |
| `portal-programs.js?v=173` | `05578c22d4d1defa1eeacaaecde577a22544fbbedfb0893c91850ba395c3cf96` |
| `portal-programs.css?v=165` | `c31691520c5c8400ac9daac531738cbe21333d3ae2b9d975b0076cefd92bc9c7` |
| `portal-recipe-builder.js?v=101` | `8da371a62a7c43c40fa675a976b73233c3e81a7fe71d4887363ea5d60b921c15` |
| `portal-wellness.js?v=118` | `da3d073361414c0c1e694a8ae96a14834ac69d34d2512f5ad03322cfa84bfd37` |
| `portal-wellness.css?v=120` | `e37fc4185fef7c9b6d9d89498a3b45fbdb7753f013857c0faeab1ab68a2b4777` |
| `portal-nutrition-review.js?v=103` | `fec54023b70bc55892dccb356437d97c8d267461c5aa24afa725ebc9e2511502` |
| `member110.js?v=209` | `537975bf8156437ca019730041941668c43b49cb1e2199346898b648cda7629b` |
| `member110.css?v=201` | `617f9ca924ee2eee66df4995836a2bd0b9dd37e83d168f37f359d8daca18b152` |
| `member-health-progress.js?v=1` | `adad63c642c4543511bc80e4b47c44283d27033a9819a364d2b0b754c21252a5` |
| `member-health-progress.css?v=1` | `73eebd10d0f5c2c625ebe1829add25886da000a4035118bd48b91ef63811c2e1` |
| `member-nutrition.js?v=1` | `4e039af489fdf7d031715639d30f1fdb10ba42c6e6ebb894a709fb1665c10e26` |

Raw evidence: [read-only preflight](../deployment-evidence/2026-10-04-beta-hosted-preflight/read-only-preflight.json), [staging/production fingerprints](../deployment-evidence/2026-10-04-beta-hosted-preflight/live-baseline-hashes.json). The owner sign-in screenshot is saved with the workspace handoff, not required as source code.

## Next action / primary Chat handoff

BETA NOT READY. The approved owner is already active, confirmed and fully onboarded; no manual approval or SQL grant is needed. The previous browser user had no staff row. The normal owner sign-in is prepared in Chrome and awaits the user's password entry. Obtain this legitimate owner session first; then finish the coordinated candidate review, apply the forward migration once and publish the matching Edge/frontend only if every deployment prerequisite passes. Complete the user's synthetic owner/staff/two-member lifecycle and meal/workout acceptance matrix. Do not add real beta clients or issue the Justin/Elle green flag yet.

RECOMMENDED THINKING LEVEL: HIGH

WORK TASK NEEDED

Resume the existing RVA owner preflight tab after the user signs in normally with the existing approved staging owner. Read docs/BETA_HOSTED_PREFLIGHT_2026-10-04.md and the Beta Readiness Core report. Confirm normal owner dashboard/refresh, without changing roles or credentials to obtain access. If still pending, stop and report the exact authenticated-access failure. If owner access passes, continue the already authorized coordinated release review for candidate3996379 on codex/staging and migration20261004124537, staging site071b252e-a922-4846-a784-8dca1edad377 and Supabasebvooallokgfktssadsrv only. Do not publish frontend alone or replay migrations. After all release gates pass and matching database/Edge/frontend are deployed, verify exact hashes and perform the requested synthetic owner/scoped-staff/ClientA/ClientB invitation, activation, email, login/refresh/logout/recovery/revocation, meal/workout Create→Assign→View, cross-client denials and stale-private-DOM acceptance. Use intended UI and approved synthetic inboxes only; user handles password entry and legal acceptance. Record and safely clean disposable data, test1440×1000/768×1024/390×844, preserve production and return BETA READY or BETA NOT READY with evidence. Primary Chat owns the final green flag.
