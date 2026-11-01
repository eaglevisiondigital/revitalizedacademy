# Wave 4 local implementation contracts — November 1, 2026

Base: `5926b915f60b1be6d009c94362b91356a303cb33`. Alex is paused by the Owner. No private Alex reads/actions, production writes, permission installation, deployment, real-client processing or financial activation are in scope. PR #59 remains draft and production NO-GO.

## Allowance isolation — Issue #61

Own `proposals/issue-61/wave4/`, `tests/wave4-access/` and the lane's evidence directory. Preserve the installed schema as a metadata-derived fictional baseline. Restrict direct usage and entitlement access using existing contact authorization, not a new household policy. Shared totals require conservative scope over all contributing membership contacts. Client access remains held where the current payment predicate is false.

Any narrow private authorization lookup derives its actor from `auth.uid()`, returns only a boolean, fixes its search path and receives only indispensable execution rights. Aggregate maintenance remains internal, using full-ledger visibility and consistently ordered locks. Direct writes, session synchronization and review RPC must share atomic ledger/cache integrity. Forged totals, mismatched session tuples and ambiguous transfers fail closed. No public privileged wrapper or broad private helper grants. Session-transfer behavior is not expanded without another contract review. Independent QA also identified the session INSERT path as a privileged-sync input: require the existing membership primary-contact or exact `client_access` relationship before a consuming session or usage tuple can affect an allowance. Apply the same consistency requirement to installation guards. Nullable non-consuming sessions remain unchanged; unsupported household-only relationships fail closed pending policy, rather than creating an implicit grant.

## Member and Coach continuity — Issues #54 / #53

Own `tests/wave4-member/`, lane evidence and only these `member/member110.js` handlers: goal/habit creation, goal/habit status updates, habit check-in and progress submit. Capture payload and current task identity before awaits; verify the actual user before progress insertion; suppress stale UI completion after identity change; serialize duplicate UI actions and permit retry after failure. Independent QA subsequently reproduced reopening while an earlier create is still pending. The reviewed follow-up also owns `openGoalModal`/`openHabitModal` solely to track modal-open generations, so completion/timers cannot close a replacement draft. Preserve shared authentication, previous weekly-check-in correction, routes, design and database contracts. UI serialization is not server idempotency.

Separate reviewed Coach change: `portal/portal-coaching.js` currently destructures twelve results but issues eleven reads. Add the missing existing `admin_coach_capacity` read with only fields used by the selector, and include its error in the existing failure handling. The existing view was independently checked via system metadata; it is a security-invoker view. Independent QA subsequently found that a denied refresh can retain an old visible workspace. The reviewed follow-up is limited to `loadCoaching`, one load-sequence variable, a coaching-only clear/hide helper and contact-close invalidation: bind actor/contact/request identity across both awaits, discard superseded results, clear protected coaching state on genuine denial, preserve same-context drafts through transient transport errors. No new data permissions, view, capacity policy or unrelated portal refactor.

## Fictional affiliate adapter — Issue #55

Own only the new `tools/affiliate-share-preview/adapter.cjs`, `tests/wave4-affiliate/` and lane evidence. Resolve actor, catalog, consent and approval state through injected trusted fictional providers; caller input supplies selectors only. Reuse the existing pure share/referral/touchpoint contract. Pin session identity and monotonically changing authority revision across asynchronous work; perform the final fixture authority check and journal commit synchronously. Isolate journals by scope and identity; prevent duplicate/conflicting parallel events; return minimal redacted results.

This adapter is not production authentication, an approval verifier or distributed transactional storage. Existing helper, preview server/UI, financial calculations and communications remain unchanged. V3 intake sources are not promoted.

## Independent QA — Issue #56

Launch after an author returns, preserving the four-agent capacity limit. QA owns its separate worktree/tests/evidence. Rerun the combined exact local source, add adversarial cases independent of authors, and distinguish original known failures, corrected results, blocked policies and unexecuted integration packages. Preserve the original 57-package inventory, 101 requirement groups, ten source-detail groups and ten ecosystem workstreams. Do not call a fictional fixture pass a production acceptance pass.

## V3 — Issue #57

Existing education-only detached adapter and source approval boundaries remain in force. Approved additive file: `tools/coach-companion-catalog/async-fixture-adapter.cjs`, with tests in the affiliate lane. Its trusted fictional session, catalog and receipt providers pin principal, audience, receipt generation, catalog version/hash and authority revision across awaits before calling the unchanged education-only projection. It cannot receive caller-supplied source content, permissions or receipts. This is an injected fictional trust contract, not a real approval verifier. No unapproved 113-submission intake, new clinical methodology, Alex processing or report integration.

## Release boundary

Every change remains local and unpushed. New SQL is a proposal outside canonical migrations. Integration evidence and rollback design do not authorize production installation. Any eventual release requires a separate exact reviewed source/artifact/SQL authorization after outstanding security and policy gates are resolved.
