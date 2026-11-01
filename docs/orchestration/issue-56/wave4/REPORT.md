# Wave4 independent QA — local checkpoint, production NO-GO

The Owner paused Alex. No private Alex reads, session authentication, grants/recovery/issuance, processing, production connections or mutations occurred in this lane. QA owns only tests/wave4-qa and this evidence directory. Master actually dispatched QA after authorC returned, within four total native agents. Source was not pushed.

## Exact source and executed results

Accepted base5926b915f60b1be6d009c94362b91356a303cb33. Final combined runtime/proposals tested at3d310675487af7197666ce9fad394b148cb09c57: C00f20235, B7662679a plus bounded followup1c5e6fa8, Afffab8b8 (full SHAs/input hashes in EVIDENCE.json). The QA commit adds no implementation changes.

| Final independently executed suite | Actual result |
| --- | --- |
| Node/DOM/adapters/invariants |244/244PASS, includes10 intentional old-baseline defect reproductions |
| Native Chromium/WebKit |38/38PASS, includes2 intentional old-baseline reproductions |
| PostgreSQL author isolation/concurrency |corrected40/40; baseline and exact revert17PASS/23FAIL each |
| PostgreSQL critical session-entry |corrected8/8; baseline and exact revert4PASS/4FAIL each |
| PostgreSQL independent adversarial |corrected9/9; baseline and exact revert5PASS/4FAIL each |

The57 corrected focused SQL tests are **not** the57 complete business packages. SQL across three stages is171 executions:109PASS/62expected original/reverted defect failures. Actual PG17.11/pg8.16.3 uses disposable socket-only clusters, listen_addresses empty; all clusters stopped/removed and execution-input hashes remained unchanged. No live credential or external connection string is accepted. Baseline includes the accepted **LOCAL Wave3 RPC proposal**, not installed production SQL; this is not a standalone production migration package.

Actual application scripts and DOM run against fictional transport. Fresh native Chromium1248/WebKit2336 contexts intercept app traffic and assert no external request. The320/768/1440 authored browser checks cover focus, error/retry, source payloads, stale identity, dedupe and renewal; independent390px cases cover the newly found in-flight modal race. Screenshot inspection confirms the retained emerald/cream presentation and visible status without a new layout. No SDK/server/RLS assertion is inferred from a browser transport fixture.

## Independently found defects and bounded corrections

1. In-flight goal/habit creation could close a newly reopened draft. Initial independent DOM3PASS/2strictFAIL and native0PASS/4strictFAIL are retained. Master authorized an exact followup: modal-open generation pins status/timer/finally behavior. All5 own member cases and4 native cases pass afterward. Request payload snapshots and a shared rendered-row guard also pass. UI serialization is not server/cross-tab exactly-once or cancellation of a dispatched write.
2. Successful Coach load followed by42501 refresh left prior prepared UI visible; a delayed old-contact response could overwrite a newly loaded contact. Initial expanded independent1PASS/2strictFAIL is retained. Master authorized staged results with actor/contact/load-sequence guards and definite-denial cleanup. All3 own Coach probes pass afterward; authored lifecycle tests also cover401/403, close, identity changes and transient same-context draft preservation. The original missing capacity query uses exactly the existing six-field invoker view, without new permissions.
3. Direct usage RLS alone did not guard the privileged session synchronization entry: a contact-scoped Coach could insert own-contact sessions against an unrelated membership. QA identified the source path before finalization; author added primary-contact OR explicit client_access relationship checks at session INSERT/tuple UPDATE, usage validation and existing-state preflight. No household affiliation is inferred. The independent exact probe requires SQLSTATE23514 with the relation-guard message and verifies both totals remain unchanged. All9 own PG probes pass; author separately passes8 critical entry cases.

## Security review

The five new private functions have fixed empty search paths. Only the read-only membership authorization predicate receives authenticated EXECUTE; it derives actor from auth.uid(), accepts only coaching.view/manage and returns boolean after existing staff/contact checks. Trigger functions and existing aggregate helper remain postgres-only; no public definer or broad private EXECUTE grant is introduced. The public review RPC remains invoker with its current ACL. Own PG cases verify metadata impersonation denial, current scope withdrawal, exact helper ACLs, immutable actor attribution, full-ledger maintenance despite partial caller visibility, outer rollback and read-only actor denials.

Restrictive policies preserve current lifecycle/payment hold. The cache is derived from the complete ledger through internal maintenance; callers cannot forge used_value or transfer referenced bindings. Preexisting malformed data/cache is rejected without backfill. Shared fixtures declare an explicit ready/unpaid affiliation; no paid positive or family/minor policy is fabricated. Existing non-coaching broad staff access is deliberately unchanged and remains unreviewed.

**Operational concurrency remains BLOCKED:** natural session-row→usage-row ordering can oppose direct usage-row→session-share ordering. A real deadlock/timeout abort and explicit subsequent retry preserve exact totals. The passing safety assertion does not certify uninterrupted competing writes. An application retry/lock-order design is still required before production readiness.

Both detached adapters keep caller selectors separate from injected fictional authority. Own16 adversarial cases cover monotonic-revision ABA, final current-authority changes, consent withdrawal, scope journal isolation, source getters, redacted exceptions, overflow/parallel duplicates, V3 receipt changes and same-principal renewal. Providers must truthfully update their shared monotonic authority revision. They are not real Auth/approval verifiers, distributed transactions, durable ingress, financial services or activated communications. No unapproved113-source or new individualized methodology was added.

## Preservation and remaining packages

Exact101 requirements, ten source-detail groups, ten workstreams and all57 original package definitions/hash remain unchanged. Only approved member handlers/modal-open generations and Coach loader lifecycle change within existing runtime families. Existing helper/catalog/QR code is byteexact; Functions, canonical migrations, Netlify config, assets/styles, payments, shared Auth and protected Roadmap source stay unchanged. Production preservation is a no-touch source guarantee for this lane, not a new live database/client audit.

RESULTS_MATRIX retains all57IDs:0PASS/0FAIL/45BLOCKED/12NOT_RUN. Previously failing direct-table subcases now pass **locally**; full N02/E02 and all other incomplete business journeys remain blocked. Missing business/family/allowance rules, current SELECTfalse paid access, original127affiliate source, managed Auth/MFA/session proof, real approval providers, complete Coach mutation lifecycle, full immutable operational audit and integrated financial/business journeys remain unresolved. No complete business package or production acceptance is promoted from partial checks.

## Retained diagnostics, rollback and next action

Initial combined member96/97 included a lane-only source allowlist rejecting other approved lanes' additive paths. The reviewed test-only correction checks protected runtime families instead; independent combined invariants remain strict. An initial own V3 assertion expected `ok` instead of actual documented `supported_education`; only the QA status expectation changed. Both receipts remain. First native launch was sandbox-blocked by MachPort permission; approved isolated native execution succeeded. Modal assertions require intact/open drafts regardless of whether obsolete timers are unscheduled or ignored.

All SQL remains an unapplied proposal outside canonical migrations. Exact local revert restores demonstrated broad access/stale totals and is regression evidence, **not a recommended production rollback**. Prefer a separately reviewed forward fix or fail-closed response if ever installed. UI rollback reintroduces demonstrated races; removing detached tools needs no persistent data change.

The finite next checkpoint is Master integration of this QA commit and build-state documentation, then a bounded local concurrency/retry and remaining policy/integration package. No production approval is sought by this QA report. Publication, live permissions, financial activation and private client processing remain separately gated; Alex stays paused until the Owner explicitly resumes it.

Evidence hygiene: machine-generated TAP/log trailing blank-line whitespace was normalized only after execution; EVIDENCE.json retains raw and normalized SHA256 mappings. Outcomes, SQLSTATEs, timings and source-input hashes are unchanged.
