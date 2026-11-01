# Wave4 Issue61 — proposed local boundary contract

Accepted local base5926b915f60b1be6d009c94362b91356a303cb33. No production, Auth, source/report or protected Alex operation. Alex is paused. Current evidence remains the exact pinned Wave3 metadata captures; Wave3 files/results are preserved unchanged.

The test baseline is explicitly **current catalog plus accepted LOCAL Wave3 RPC correction**, not a claim that this code is installed. The current tables permit shared memberships: client_memberships has household_id and primary_contact_id; client_access associates contact_id and membership_id; coaching_sessions carries its own contact_id and membership_id. Primary-contact-only validity would invent a restriction. Usage must instead match its existing authoritative session and optional entitlement reference.

Proposed boundaries sent to Master before any helper/trigger implementation:

- Restrictive usage read/mutation scope uses existing active staff, coaching permission and contact-scope helpers. Existing held member read is preserved; no future paid-member positive is simulated.
- INSERT/UPDATE usage relationships must agree with session contact/membership and entitlement membership/key. Caller-supplied cross-client/program tuples are rejected. Existing session-backed shared membership data is not rejected merely for being nonprimary.
- Entitlement aggregate visibility/mutation requires staff authority across the membership's primary, access and existing session contacts. This is a conservative fail-closed boundary; family sharing is not inferred.
- New internal trigger(s), postgres-only EXECUTE, validate relationships, serialize OLD/NEW membership+key pairs in stable order, and recalculate complete totals using the existing private helper. No caller executes the recalculation helper. A private boolean RLS predicate may expose only an authorization result, never rows or totals, if Master approves that exact boundary.
- Remove caller-filtered inline SUM and conflicting early allowance lock from the invoker review RPC. Otherwise contact RLS can silently undercount shared membership usage. Keep existing actor/reason/resolution/scope validation and fail closed on an unavailable allowance.
- Session membership moves must either synchronize ledger contact/membership plus OLD/NEW totals or fail closed. No silent stranded consumption. No no-show/reset/limit/family/49-day business rule is selected.
- Direct used_value must remain equal to the consumed-usage source, including authorized staff attempts. A target that exists but is not updated must cause rollback. Legitimate existing session tracking without an entitlement must be distinguished from a failed target update.

This is a local proposal contract, pending Master refinement. Multirow deadlocks/serialization aborts must preserve transactional safety and be reported with explicit retry limits; they must not be described as universal race-free operations.

## Reference and first baseline execution

PostgreSQL17 documents that VOLATILE procedural functions obtain fresh snapshots per executed query, while STABLE functions retain the calling-query snapshot. Locking/recalculation code must therefore remain VOLATILE; RLS predicates are read-only. See [function volatility](https://www.postgresql.org/docs/17/xfunc-volatility.html), [transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html), and [restrictive RLS](https://www.postgresql.org/docs/17/ddl-rowsecurity.html). Default READ COMMITTED interleavings require actual verification; no universal isolation-level claim follows. Supabase changelog fetch was attempted but the browser tool rejected its text/markdown content type; no Supabase client/API/library feature is being changed.

First actual unchanged-baseline run: PostgreSQL17.11,20assertions,7PASS/13FAIL, no skips; receipts in initial-baseline/. Failures include the original three strict isolation cases, allowance reads, malformed relationships and stale totals on direct updates. They are retained and will run unchanged through correction/revert comparisons. No helper/trigger proposal was installed for this baseline run.

## Master-approved and executed checkpoint

Master approved the bounded internal trigger/boolean predicate boundary, then separately required coaching-only entitlement policy/counter scope and the critical primary-or-explicit-client_access session-entry relation check. Existing session sync remains unchanged; no transfer support was added. Final48correctedassertions pass, baseline/revert each21PASS/27FAIL. Session/direct opposing row order still safely aborts and remains an operational blocker. See REPORT.md and final receipt; earlier pending states above are historical.
