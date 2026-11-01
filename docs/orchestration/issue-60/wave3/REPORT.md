# Issue 60 Wave3 Lane A — local current-catalog goal-policy proof

COMPLETED

The exact captured current profile reproduces six strict contact-isolation failures. One additive RESTRICTIVE ALL policy, `client_goals_contact_scope_v1`, resolves all six locally while preserving the original policies and restrictive lifecycle gate. This is a tested SQL proposal, not an applied migration or production acceptance.

- Branch: `codex/rva-wave3-goals-20261101`; accepted base: `fad394ef683b711ba34866ec614bed71a26cee93`.
- Current main metadata: `94322f192cda7bdaeae45c7fb2137745933bf66eef2816467c012f41d380e757`, observed 2026-11-01 15:07:11 UTC, PG17.6. Master captured metadata only; this lane made zero production calls. Raw wrapper SHA256: `26018c0d318252c775c6c059999e2d82371fddfdf6d83b6559abc8de12cd4ad9`.
- Every source and supplemental capture hash is pinned in `tests/wave3-goals/source-pins.json`; broad captures remain outside Git. Historical baseline/platform/lifecycle files are scaffolding only, followed by exact current overlays and fail-fast comparisons.

CHANGED

Only `tests/wave3-goals/`, `proposals/issue-60/`, and this issue's Wave3 evidence directory. No runtime, helper, shared schema, canonical migration, asset, build or deployment files changed.

The proposal adds BOTH USING and WITH CHECK with the existing `private.staff_can_access_contact(auth.uid(), contact_id)` plus the original self-client contact branch. It does not invent a permission or family-sharing rule. An unassigned Coach, or an assigned Coach accessing another contact, cannot inherit contact access merely from an active staff session. Cross-contact reassignment is checked as well.

TESTED

Actual disposable `postgres (PostgreSQL) 17.11 (Homebrew)` on private Unix socket, TCP disabled, fresh cluster removed after execution:

| Stage | PASS | FAIL | BLOCKED |
|---|---:|---:|---:|
| Current original | 29 | 6 | 0 |
| Current + restrictive contact policy | 35 | 0 | 0 |
| Exact local reversion | 29 | 6 | 0 |

The six retained failures are unassigned Coach direct SELECT/INSERT/UPDATE, assigned Coach SELECT of unrelated contact B, SELECT of an adult sharing A's household, and A-to-B goal reassignment. They are intentionally retained in original/revert receipts. These are fictional executions of the captured installed definitions, not evidence that a real user accessed production rows.

Before behavior: compared 25 current tables' columns, constraints, owners, RLS/force-RLS, ACLs, every policy and trigger definition/state; 80 captured routines' definitions/owners/definer flags/config/effective ACLs; four captured role attribute sets; and the exact invoker `my_goals` definition. Exact reference permission active/sensitive flags/default/legacy allowed values populate fictional fixtures. Auth uses exact captured auth.uid/jwt with fictional GUC claims; no managed GoTrue/session transport is claimed.

Active Owner and assigned Coach positive SELECT/INSERT/UPDATE pass. Current sync-event triggers execute and positive writes add one event; denied inserts add none. Suspended Owner/Coach, pending Coach, null identity, anonymous ACL, unrelated Client, held self Client, and household peer denials pass. Real invoker RPCs validate malformed inputs and cannot mutate unrelated/held goals.

Original and corrected metadata hashes: `cb7b2e6846e07c3683ff02cb82e3c51b74846b3d7e33cac075fe28ba9e98c0d5` / `b910261dcb90e564e6f16ef25ca9ba2fd85d90152ced4f2535c77a1c19f8854c`. Original drift rejection, corrected rollback drift rejection, repeated-apply refusal and exact metadata reversion all pass. Forward/revert generated SQL ran locally with 5s lock timeout and 30s statement timeout; PostgreSQL public search path is explicit. Guard hashes cover goal table security definition, constraints/triggers and eight named authoritative helper/RPC definitions and ACL/config/ownership, not every production dependency/reference-row value.

Run from this worktree: `node tests/wave3-goals/run.cjs`. Independent QA should set `RVA_WAVE3_GOALS_OUTPUT` to its own absolute directory to preserve author receipts. Requires bundled sibling `revitalizedacademy/node_modules/pg` 8.16.3, pinned sibling baseline/platform files, read-only capture files and local PG17 binaries. `RVA_WAVE3_PG_BIN` optionally selects PG17 binaries. Three node syntax checks also pass.

SECURITY AND LIMITS

Current `private.enrollment_payment_satisfied` is exactly `SELECT false`. It was never replaced or stubbed. Future positive enrolled-Client access remains **1 BLOCKED acceptance item**; current self-contact predicate branch is true while effective paid gate denies it. The fictional active memberships have no activation row, so a released positive enrollment/payment/agreement transition is not executed or certified.

Fictional setup alone uses session_replication_role=replica to avoid unrelated lifecycle/setup delivery triggers. All policy behavior uses origin mode, ordinary authenticated/anon roles and actual captured bodies. Completion notification delivery, external plumbing, full managed-auth revocation, family consent, multi-organization isolation, storage, other tables/surfaces and future payment activation remain unverified. Dependency auth.users and unrelated historical scaffold tables are minimal/reused, not a full managed platform recovery. Capture PG17.6 versus local PG17.11 is an explicit minor-version difference.

The original restrictive lifecycle policy does close suspended/pending/Client hold access; it does **not** constrain an otherwise-active Coach to assigned contacts. This conclusion follows the actual AND/OR policy execution, consistent with PostgreSQL17 RLS semantics: https://www.postgresql.org/docs/17/ddl-rowsecurity.html and Supabase RLS guidance: https://supabase.com/docs/guides/database/postgres/row-level-security .

DOCUMENTATION AND #57 MAPPING

`PG_RESULTS.json`, this report, handoff and README are issue-local. Shared CURRENT_BUILD_STATE/registers remain Master-owned; Master must integrate these facts rather than this lane editing reserved files.

- N02: current goal contact-scope subcase reproduced, corrected and reverted; other fields/exports/notes and surfaces remain open.
- N03: goal cross-client and adult-household denials covered; organization/storage coverage remains blocked.
- N04: exact ACL/RLS/invoker view and direct goal DML tested; no full self-role/definer/storage acceptance.
- N06: current paid hold and suspended/pending staff denial preserved; positive paid lifecycle remains blocked.
- C02: goal ownership/status validation only; no diary/nutrition/full assignment acceptance.

No full #57 package is marked PASS by these partial results.

UNRESOLVED / NEXT RECOMMENDED BUILD

Independent QA rerun of this exact commit, Master integration review with Lane B's retained issues, and separately approved forward production migration review. Refresh metadata and permission reference snapshots before any production action; the proposal's bounded guard must match exactly and no correction is authorized by this report alone. No deployment, grant, production mutation or real-data verification occurred.

ROLLBACK

`goal-contact-scope-local-revert.sql` is a guarded **local regression demonstration**. It restores the six known failures. Production should hold/fail closed and use a forward repair if a problem is found; never automatically reopen broad staff access. Production application or reversion needs separate explicit authorization.

CHAT HANDOFF

Issue60 now has a current-catalog-equivalent, locally tested goal-only restrictive contact-policy proposal: original/revert 29PASS+6FAIL, corrected35PASS, with current paid hold preserved. Review the pinned commit through independent QA, then approve any production migration separately. No product/runtime release is implied.
