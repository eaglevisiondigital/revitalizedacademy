# Wave5 security boundary — local proposal

Base024b1c20c802ce6a9470fc46fabdd3bae75ed980. Owner authorizes local engineering and fictional tests, not production. Alex is paused: no private reads, login/session actions, grants or reports. Existing Wave3/Wave4 source and failure receipts remain immutable.

## Reconciled starting point

The three strict direct coaching usage SELECT/UPDATE and allowance UPDATE failures are historical Wave3 cases. Accepted Wave4 already fixes them locally; production was not changed. A fresh actual PostgreSQL17.11 fixture independently reproduced all three passing under the exact accepted Wave4 SQL before any Wave5 change.

Ten discovery assertions:6PASS/4FAIL, with no skip. The four newly failing strict cases are unrelated membership/access visibility, unassigned self-appointment through membership assigned_coach_id, and assigned-contact client_access rebinding to an unrelated membership. These are exact-current-catalog fictional results, not an exploitation of production or inspection of real staff/client rows. The first unrelated-user reassignment probe was blocked by the existing payment hold. A later explicit-ready probe exposed that unrelated identity rebinding was also allowed; it is not attributed to an identity guard.

## Proposed objects sent to Master before implementation

No overlap with LaneB's usage trigger/session lock/retry objects. Proposed additive RESTRICTIVE policies on public.client_memberships and public.client_access only; no altered permissive policy, table/function ACL, public definer, private EXECUTE grant, shared Auth helper or canonical migration.

- Membership SELECT: active existing staff with crm.view and existing primary-contact scope, preserving the current self-member branch and lifecycle hold.
- Membership INSERT and UPDATE: active existing staff with current crm.manage and primary-contact scope. UPDATE uses OLD USING and NEW WITH CHECK so a hidden original row cannot become authorized by assigning it to the caller.
- Access SELECT: active existing staff with crm.view and contact scope, or the existing exact own-user branch.
- Access INSERT and UPDATE: active existing staff with crm.manage and contact scope; nonnull membership uses the EXISTING accepted private.wave4_membership_allowed(membership_id,coaching.manage) boolean predicate. It checks the same authenticated actor and complete participant scope. The initially proposed invoker subquery produced the real existing CA→membership→CA RLS recursion42P17; its failed receipt is retained. Master approved only this dependency refinement, with no new helper, signature or EXECUTE grant. Existing payment/household/profile triggers remain unchanged.

Current captured defaults give Coach crm.manage; membership.access_override is a distinct finance/role-gated exception and is not silently substituted. A policy that tightens all membership writes holds previously broad financial-only direct onboarding; the existing boolean also holds CRM-only Support access updates involving a membership because Support lacks coaching.manage. These are explicit conservative compatibility holds, not newly selected business policy. This requires explicit integration acceptance before any production proposal, not invention of new business permissions. Existing member payment predicate is exactly false and remains held.

Do not infer a full Family sharing policy from primary-contact or client_access facts. No 49-day, allowance limits/resets or financial rule is selected. Ordinary managed Auth/MFA, service routes, historical relationship amendments and every full57 business package remain separate acceptance.

## Validation plan

Retain three historical failures on the pre-Wave4 metadata-equivalent source, confirm they pass under Wave4, then run identical new strict assertions before/corrected/reverted. Add Owner/assigned/unassigned roles, suspended/pending/null actors, direct table versus invoker RPC, permission overrides, valid relation positives, OLD/NEW spoofing, mutation rollback and no private EXECUTE escalation. Rerun accepted Wave4 safety suites under the combined policies. Record immutable input hashes, exact SQL object inventories and disposable cluster cleanup.

The database is PostgreSQL17.11 on an owned temporary UNIX socket, host authentication rejected and listen_addresses empty. No network/database URL is accepted. Source is current metadata overlay with historical empty schema/lifecycle dependencies and synthetic auth.uid/auth.jwt mapping; it is not real GoTrue session certification. See the PG17 [RLS documentation](https://www.postgresql.org/docs/17/ddl-rowsecurity.html) for AND-combined restrictive policies, caller-bound subqueries and OLD/NEW checks. Supabase changelog fetch was attempted; tool rejected text/markdown, and no Supabase SDK/Auth API feature changes are proposed.

## Release/rollback boundary

Any future installation requires independently current catalog compatibility, a separately authorized private-data-free integrity preflight, integrated guarded SQL hashes, exact Owner approval and independent QA. No production operation is included here. A local revert dropping only these new restrictive policies reproduces known exposure and serves regression proof; it is not a recommended production rollback. Prefer a reviewed forward/fail-closed response rather than knowingly restoring the broad policies.

## Separately reviewed technical privilege closure

After six-policy acceptance, actual fictional SQL proved unassigned authenticated TRUNCATE could erase the coaching usage ledger while retaining its cached consumed total. RLS does not protect TRUNCATE. Master separately approved exactly four authenticated TRUNCATE revocations: coaching_entitlement_usage, membership_entitlements, client_memberships and client_access. Forward checks their exact predecessor ACLs; tests require SQLSTATE42501, never accept a foreign-key error as denial, and retain every other table privilege plus postgres/service_role rights. No PostgREST/raw SQL exposure is inferred from the catalog/fixture proof. No DELETE/TRIGGER privilege or permission default was changed.
