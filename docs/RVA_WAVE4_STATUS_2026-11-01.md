# Wave 4 — verified local Academy progress, production NO-GO

The Owner paused Alex and directed continued Academy engineering. No private Alex reads, authentication coordination, issuance, recovery, generation or production operation occurred in this wave. Any later Alex resumption requires explicit direction and independent readback before another action; historical zero-count observations are not current verification.

## Completed implementation

- **Member continuity:** goal/habit creation and updates, habit check-in and progress submission now capture the original identity/payload before waits, verify the actual user, suppress stale completion after logout/account change and prevent concurrent UI submission. Modal-open generations stop an old save/timer from closing a newly reopened draft. These are UI protections, not durable server idempotency.
- **Coach workspace:** restored the missing six-field read from the existing security-invoker capacity view. Loads now bind actor/contact/request sequence, discard superseded responses, clear coaching-only state on genuine access denial and preserve same-context drafts during transient failures. Shared authentication, design and permission rules are unchanged.
- **Coaching allowance proposal:** six restrictive policies, five narrow private functions/four triggers and two existing routine corrections protect direct usage and coaching counters, full-ledger totals, actor attribution and explicit session contact-to-membership relationships. Internal privileged aggregation remains private; the review RPC remains invoker. Non-coaching counters retain existing behavior. SQL is a local layered proposal outside canonical migrations, not an installation-ready production package.
- **Affiliate and V3:** two additive detached adapters resolve current fictional identity/catalog/consent/receipt state across asynchronous operations, reject caller authority and minimize returned data. Affiliate touchpoints serialize duplicates within one in-memory adapter. V3 reuses the unchanged education-only catalog. Injected callbacks/receipts are fictional trust inputs, not real Auth, approvals or distributed durability. No unapproved intake or new methodology was promoted.

## Actual assignments and source

All worktrees are preserved under the project workspace. Three authors ran concurrently; independent QA launched after the affiliate author returned, never exceeding Master plus three active specialists. No persistent chats, scheduled agents or unattended work were created.

| Native agent / issue | Worktree / branch | Local implementation |
| --- | --- | --- |
| `platform_scope_audit` / #61 | `academy-wave4-access` / `codex/rva-wave4-access-20261101` | `fffab8b85e29e302e46ff4f6e5c5ba06a3bbc07b` |
| `roadmap_design_contract_audit` / #54/#53 | `academy-wave4-member` / `codex/rva-wave4-member-repair-20261101` | Initial `7662679a0204037f4d03e0d5159631867f114880`; repair `1c5e6fa881ef52c29ab7152f352501117a3ea5f8` |
| `affiliate_finance_audit` / #55/#57 | `academy-wave4-affiliate` / `codex/rva-wave4-affiliate-20261101` | `00f20235a53983b5a64ded972d548df74a4b880e` |
| `wave4_independent_qa` / #56 | `academy-wave4-qa` / `codex/rva-wave4-qa-20261101` | Exact combined tested source `3d310675487af7197666ce9fad394b148cb09c57`; QA evidence `dd59c62965f241951d19014e4c05d6d30e5e09f7` |
| Master / #58 | `academy-wave4-integration` / `codex/rva-wave4-integration-20261101` | Base `5926b915f60b1be6d009c94362b91356a303cb33`; containing local checkpoint commit recorded outside Git |

No Wave 4 commit was pushed. PR #59 remains OPEN/DRAFT at `fad394ef683b711ba34866ec614bed71a26cee93`, targeting the coordination branch, unmerged and production NO-GO.

## Testing and independent findings

The corrected combined source passes the independently executed **244 Node/DOM checks**, **38 Chromium/WebKit browser checks** and **57 PostgreSQL checks** (48 author contracts plus nine independent probes). Ten Node checks and two browser checks intentionally reproduce old baseline defects; they are labeled, not counted as new user journeys. Seven additional Master source/requirement invariants pass.

Database comparisons retain the same assertions across stages: author baseline/revert each 21 PASS / 27 FAIL versus corrected 48 PASS; independent baseline/revert each 5 PASS / 4 FAIL versus corrected nine PASS. Actual PostgreSQL 17.11 used new disposable UNIX-socket-only clusters, with fictional Auth and data, removed afterward. Browser application traffic was intercepted; no live Auth/provider acceptance is inferred.

Independent QA found and retained evidence of defects beyond the original author cases: pending-save modal reopening, denied refresh retaining old Coach UI, out-of-order contact responses, and own-contact session insertion against an unrelated membership. The scoped repairs were retested independently. The initial integration-only lane allowlist failure was corrected by checking protected runtime families rather than rejecting other approved lanes' additive tools/evidence; exact source-block and combined-scope checks remain strict.

Receipts retain original failures, harness scheduling/fixture-contamination failures and a local shared-memory resource stop. No persistent PostgreSQL server, unexplained IPC segment or kernel setting was modified. Corrected fixtures start fresh; there was no data backfill to make assertions pass. Generated author TAP/log trailing whitespace was normalized for integration; raw/normalized hashes, the immutable author commit and outside-Git raw copies preserve original evidence in `INTEGRATION_EVIDENCE_FORMAT.json`. This formatting changed no source, assertion or result.

The original **57 full integration packages** remain individually recorded in `docs/orchestration/issue-56/wave4/RESULTS_MATRIX.json`. Current full-package status: **0 PASS / 0 FAIL / 45 BLOCKED / 12 NOT RUN**. Passing partial fixtures are not whole-package or production acceptance. Preserve the distinct PASS / FAIL / BLOCKED / NOT RUN classifications in that matrix.

## Integrity and preservation

Only two existing application files changed: `member/member110.js` and `portal/portal-coaching.js`. The two adapters are new detached tool files. No canonical migration, Function source/archive, payment implementation, release configuration, approved asset, CSS, protected Roadmap/authentication source, questionnaire, methodology or voice source changed. The 45-direction/voice files remain byte-identical to the accepted base. All 101 requirement groups, ten source-detail groups, ten workstreams and 57 original package IDs remain preserved.

Last independent canonical observation was November 1 at 16:16:19.542 UTC: deploy `6ae6b971e17bce85e37aa95c`, source `10dec6682e7e87bf637482fc027e54c6800260e4`, 459 paths, all 13 Functions/configuration/schedules and publication lock. Wave 4 made no hosted writes or production publication. The only additional production metadata read inspected the existing capacity view definition/ACL, without row data. Reports, jobs, grants, consent/audit history, HHL, assets and payments were preserved by no-touch scope; no fresh private-record verification is claimed.

Proposed SQL SHA256: `2879f97322fc53c679e6cc83c8516795877ff7518541cc05cb3d1f3635bb89f3`. Local regression revert SHA256: `97da48ea449f4ea4af022a2cc589f50b97d3476191ec228edd4981af0385229d`. The forward proposal expects the separately accepted LOCAL Wave 3 RPC predecessor and is not one approved standalone production migration.

## Unresolved and next safe work

1. **Concurrency availability remains blocked:** opposing session-row/usage-row lock orders can safely deadlock-abort. Rollback and an explicit test retry preserve integrity, but an application retry/lock-order design needs separate local implementation and independent verification before production readiness.
2. Current paid Client access remains held by the actual payment predicate. Shared-family/minor, allowance reset/expiry/no-show/overage policy and the missing full 127-section affiliate handoff are not invented. Non-coaching entitlement isolation is unreviewed and was not silently changed.
3. Real managed Auth/PostgREST, durable adapter service wiring and full cross-role/business journeys remain unverified. Fictional provider authority is not a production authentication solution. The 113 V3 submissions remain unapproved.
4. Next bounded local package: address normal concurrent-write retry/lock order, assemble the next current-schema-equivalent permission journeys, and prepare non-production adapter service integration within explicit ownership. No new Owner approval is needed for already authorized local engineering. No production approval is requested while these gates remain open.

## Rollback and release boundary

There is no production release to roll back. Preserve all branches and worktrees; a new isolated checkout of the accepted base provides the prior local source without resetting another lane. SQL revert is regression evidence that restores known broad access and stale-cache behavior; it is **not** a recommended production rollback. Any later installation needs fresh schema/data integrity preflight under separate authorization, reviewed predecessor ordering, integrated exact hashes, a safe forward/fail-closed response and explicit Owner release approval.

No deployment, migration, live permission change, grant issuance, financial activation, marketing communication, private report processing, export or client delivery was performed.
