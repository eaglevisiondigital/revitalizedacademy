# Issue54 Wave5 — local operations and durable retry checkpoint

**LOCAL implementation; production NO-GO.** Base `024b1c20c802ce6a9470fc46fabdd3bae75ed980`; branch `codex/rva-wave5-operations-20261101`; worktree `academy-wave5-operations`. Owner's Alex pause is preserved: no private reads, session coordination, recovery, grant, generation or protected record action. No push, migration, deployment, live permission change, financial activation, message or production write occurred.

## Implemented

### One-function allowance lock-order proposal

Only `private.wave4_usage_before()` changes, in `proposals/wave5-operations/correction.sql`; nothing enters canonical migrations. All existing RLS, ACLs, tuple/entitlement/contact-membership validation, actor derivation, private aggregate maintenance and one-row-per-session constraint remain intact.

The old cycle has two parts. A direct usage UPDATE already holds the usage row; session synchronization holds the session row and its BEFORE INSERT branch could take the allowance advisory key before `ON CONFLICT` waits for that usage row. Meanwhile the direct update requests the same key/session SHARE lock. Removing the SHARE lock alone does not resolve that upsert cycle.

The correction validates/locks the authoritative session first only for a new INSERT. It does **not** acquire an allowance advisory lock in BEFORE INSERT: a successful insert reaches the unchanged AFTER aggregation trigger, which acquires that lock; an upsert first resolves the unique usage row and then its BEFORE UPDATE acquires the key. An existing UPDATE validates via an MVCC read without another session lock. This relies on the preserved immutable ledger tuple plus the existing session-binding guard that prohibits transfers while a ledger row exists. The source/guard now pins the latter's body, definer/Owner/ACL/search path and trigger events/columns. Existing UPDATE and DELETE advisory serialization is retained.

Actual PostgreSQL barriers force the former cycle; corrected direct and RPC writers both commit without retry. First-insertion/session-transfer races remain safely rejected, duplicate completion upserts remain one row, explicit same-state replay remains one unit, rollback leaves no charge and unrelated/revoked actors remain denied. This bounded result is not a guarantee that arbitrary multi-row application transactions can never deadlock; it does not introduce blind retries after an unknown commit.

### Actual weekly check-in handler

Only `rm-checkin-form`'s submit handler in `member/member110.js` changes. Source prefix/suffix equality is recorded in `source-scope.json`; shared Auth, other member handlers, CSS, routes, Coach source and protected Roadmap source are untouched.

- Per-form busy state blocks concurrent dispatch while retaining the existing identity/epoch/payload snapshot and actual `getUser` verification.
- Before each user-initiated submit or retry, read **only id/status**, scoped to own contact, template, exact period and non-draft status.
- If a saved record exists, say a saved check-in already exists and no answers were replaced. Do not claim the currently edited answers were saved.
- An absent read permits one INSERT. The independently confirmed current partial UNIQUE index arbitrates concurrent tabs and an earlier still-running commit.
- On23505, independently read back that exact natural key. An error without readback is never proof of persistence.
- Read/transport failure keeps the answers and recoverable warning; no automatic write retry, UPDATE/upsert overwrite or browser persistence is added. An explicit later action checks durable status again first.

The current unique index is `(contact_id,template_id,period_start)` where period is nonnull and status is not draft. Current metadata was independently captured by Master on November1 at21:26:56UTC. Actual paid Client positive remains held by the existing exact payment predicate; the fictional UI transport is not production authorization.

## Tests and retained evidence

| Actual execution | Result |
| --- | --- |
| Node/DOM combined current operations/member regression | **115PASS**, including one explicitly labeled historical stale-account error reproduction |
| New check-in cases alone, included above | **11PASS** |
| Exact old Wave4 check-in source against new11cases | **5PASS/6FAIL**, retained separately |
| Chromium/WebKit390/768/1440px | **6PASS**, intercepted fictional traffic only |
| PG17.11 lock-order baseline | **11PASS/2FAIL** |
| PG17.11 corrected lock-order | **13PASS** |
| PG17.11 exact function revert | **11PASS/2FAIL**, same original cycle |
| Corrected applicable Wave4 main/session/independent suites | **39+8+9=56PASS** |
| Current check-in/assignment durable and hold checks | **10PASS** |
| Newly identified current staff-scope negatives | **0PASS/5FAIL**, unresolved |

Thus the last successful PG functional execution retained79 positive passes plus five unresolved scope failures. Current check-in columns, indexes, ownership/RLS/ACL, exact policy bodies and submitted-trigger body were compared. Two real backends raced submitted INSERTs: one commit, one23505, one saved row, one activity and one follow-up; a rolled-back insertion left neither record nor side effects. Existing assignment completion replay produced one notification.

The final SQL-only guard hardening did not change the tested function body (`correctedProsrcMd5` remains `68255a89069e6d25d761357c9ed68985`). Its final initdb verification hit the local32-segment SysV limit before SQL could execute. That last attempt is explicitly **BLOCKED**, preserved in `resource-stop/postgres-receipt.json`; `receipts/postgres-receipt.json` records the same final attempt, while the preceding stage TAPs remain intact. No disposable server remains. Read-only process inspection showed one unrelated persistent Homebrew PostgreSQL server; no unknown segments, persistent process or kernel settings were altered. Independent QA must execute the exact final guard once an owned disposable cluster can run. Do not claim that final SQL hash already passed executable verification.

Initial historical test-criterion/exclusion and baseline fixture-cleanup issues are retained in `first-comparison/`, `member-regression-first.tap` and `checkin-baseline-first.tap`. The old Wave4 assertion intentionally requires a deadlock; the new13cases require both commits. The old Wave3 duplicate assertion treats23505 alone as saved; new cases demand readback. These exact superseded criteria remain unchanged in their historical files and are narrowly excluded from corrected regression runs; no actual new failure was relabeled PASS.

## Five current-catalog security failures — do not hide

Strict fictional current-policy tests show an active, unassigned Coach can:

1. Read another Client's check-in identity.
2. Read another Client's assignment.
3. Insert an assignment for another Client with an unrelated, valid membership FK.
4. Read another household relationship.
5. Set an unrelated valid contact as a household member's guardian; forced immediate deferred checks still permit it.

Their current policies use broad staff existence plus lifecycle gating rather than contact scope/relationship consistency. These are **fictional catalog-equivalent reproductions**, not real-client exposure probes. No production rows were read. They are outside this one-function/UI correction and outside Lane A's membership/access table scope; Master and independent QA must retain them as unresolved package failures and coordinate a narrow next local permission/integrity slice. No household/minor/business policy was invented.

## Other incomplete durability and policy

Goals and new assignments have no existing durable request key for create retries. UI serialization cannot solve an ambiguous committed create, and content equality must not suppress legitimate separate goals/assignments. Do not blindly retry those RPC/INSERT actions; a separately reviewed source-bound request-key API is the next engineering contract. Existing coaching usage uses unique session binding and explicit state changes; it is not a new allowance/reset/no-show/overage business policy. Client paid-positive, managed Auth, provider service wiring, broader family decisions and complete business journeys remain unverified. No57-package completion follows from these partial fixtures.

## Preservation and rollback

All101requirements, ten detail groups, original worktrees/history, approved branding/portraits,13Functions, V2 methodology/voice, scoring/Spectrum holds, reports/source pins and production configuration remain outside the edit scope. PR59 remains draft; the lane does not merge or push it.

There is no live change to roll back. The local SQL revert restores only this existing trigger function; it retains Wave4 security boundaries but restores the known concurrency abort. It is regression evidence, not permission to install or automatically reverse anything. A clean isolated checkout of the accepted base gives the prior application handler without resetting another lane. Any future production package needs fresh compatibility/integrity preflight, predecessor reconciliation, exact hashes, independent SQL execution, all remaining security gates and separate explicit Owner approval.

Next safe work: independent combined-source QA, resource-safe exact guard execution, narrow current check-in/assignment/household isolation contracts and durable create request identifiers. No new Owner permission is needed for already authorized local engineering; production remains NO-GO.

Generated TAP trailing spaces were normalized solely for Git whitespace checks. Exact raw outside-Git copies and both hashes are retained in `EVIDENCE_FORMAT.json`; no result text, counts, test source or assertions changed.
