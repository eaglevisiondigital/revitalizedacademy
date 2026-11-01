# Wave 3 local implementation boundaries

Accepted input: `fad394ef683b711ba34866ec614bed71a26cee93` (Wave 2). PR #59 remains draft and production NO-GO. This document records local engineering contracts, not permission to install SQL or publish assets.

## Exclusive ownership

| Lane | Issue | Owner | Allowed source |
| --- | --- | --- | --- |
| Goals | 60 | roadmap_design_contract_audit | tests/wave3-goals, proposals/issue-60, owned issue-60 evidence |
| Allowance review | 61 | platform_scope_audit | tests/wave3-allowance, proposals/issue-61, owned issue-61 evidence |
| Unaffected development | 55 / 54 / 57 | affiliate_finance_audit | fictional QR tool/tests; weekly-checkin listener only in member/member110.js after Master review |
| Independent QA | 56 | wave3_independent_qa | tests/wave3-qa and owned issue-56 evidence; no author implementation or expectation changes |
| Integration | 58 | Master | shared register/build-state documentation and reviewed cherry-picks |

Native capacity is Master plus three specialists. QA actually started after the unaffected author finished; four specialists are not claimed to run concurrently. Earlier worktrees and source snapshots remain preserved.

## Database equivalence

Master captured installed PostgreSQL catalog metadata and non-person role-permission reference configuration on November 1. No client, staff-user, session, per-user override or report rows were read. Raw captures stay in private deployment evidence outside Git. Relevant routines, policy expressions, table shape, restrictive lifecycle policies, ownership, grants and triggers must be compared before a fixture can establish current behavior. Historical empty schema is a dependency scaffold only.

The currently installed payment predicate deliberately returns false. A current-profile Client paid-access success cannot be manufactured by replacing it with a permissive fixture. Managed Auth remains a synthetic boundary in disposable PostgreSQL tests; passing SQL is not hosted JWT/GoTrue acceptance.

Issue 60 may propose a goal-only contact restriction while preserving existing Client and lifecycle expressions. Issue 61 may propose a scoped invoker-RPC correction; it may not grant broad private EXECUTE or change the public RPC to SECURITY DEFINER. Passing the RPC does not prove direct-table allowance access is scoped. Any direct-path failures remain explicit release blockers.

SQL files under proposals are not canonical migrations or installation commands. No migration ledger was changed. A production package would require fresh compatibility preflight, exact SQL/artifact hashes, independently reviewed security scope and separate Owner authorization.

## Member continuity

Only the weekly-checkin submit listener changes: capture current identity/task/member/template before awaited authentication, revalidate the existing epoch/run and verified user before insert, then revalidate before UI completion. Same-user renewal retains the pending action. Account change/logout clears the document; a previously issued request is neither replayed nor claimed cancelled. Server RLS and the existing unique check-in constraint remain authoritative.

## Affiliate and V3 isolation

The QR preview is a loopback-only fictional tool over the existing share contract. Fixed synthetic destinations, manual copy selection, actual QR encoding and an independent native decoder are allowed; live navigation, provider sends, persistence, commissions, credits and payouts are absent. This is not a production authentication or creative-approval source.

Detached V3 tests use invented descriptors and receipts. No intake submission, real founder source, report worker, methodology or protected Alex path is promoted or changed. The 113 submissions remain unapproved intake.

## No-loss and release boundary

All 101 requirement groups, ten source-detail groups, ten workstreams and 57 original acceptance-package IDs remain inputs. Full-package PASS requires the whole named journey, not passing partial assertions. Prior evidence and failed setup/reconstruction attempts remain dated and visible.

Approved branding, source archives, financial contracts, family policy gaps and the missing original 127-section affiliate handoff remain preserved. No default-branch merge, deployment, live RLS/Auth change, grant issuance, real-client processing, messaging or financial activation is included.
