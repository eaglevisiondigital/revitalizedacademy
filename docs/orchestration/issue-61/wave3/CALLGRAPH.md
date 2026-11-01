# Issue 61 allowance review — initial source checkpoint

Local-only scope, November 1, 2026. Worktree `academy-wave3-allowance`, accepted base `fad394ef683b711ba34866ec614bed71a26cee93`. [Exact assignment](https://github.com/eaglevisiondigital/revitalizedacademy/issues/61). No runtime/canonical migration, production query/write, real row, Auth, or protected-client operation.

This dated checkpoint describes recovered published SQL; it is **not current installed equivalence**. Current metadata receipt is pending and must supersede or confirm every relevant edge before correction claims.

| Edge | Published source | Finding |
| --- | --- | --- |
| authenticated → public review RPC | recovered baseline schema.sql:8332 | SECURITY INVOKER; permission/reason/resolution validation; SELECT + UPDATE ledger; direct private recalculation call |
| review RPC → private recalculation | schema.sql:8364,26756 | helper SECURITY DEFINER owned by postgres, EXECUTE only postgres; denied caller cannot cross this boundary |
| session INSERT/UPDATE → sync entitlement trigger | schema.sql:8173,24043 | existing SECURITY DEFINER trigger upserts usage and calls private recalculation; source reserve/complete/cancel/no-show behavior remains unchanged |
| session status change → status trigger | schema.sql:5101,24045 | prep tasks/completed timestamp/contact activity; review RPC does not update session status and does not invoke this audit |
| ledger row UPDATE → trigger | complete recovered schema search | No usage-table trigger in recovered baseline. Removing explicit PERFORM alone would leave totals stale in this profile |
| ledger SELECT/UPDATE → RLS | schema.sql:25973–25979 | recovered policy checks coaching.view/manage globally; contact-scoped helper is separate. Generic 42501 is not proof of wrong-Coach scope denial |
| entitlement UPDATE → RLS | schema.sql:24935 | recovered staff-existence policy is broad; cannot assume invoker inline UPDATE alone enforces existing assigned contact rules |

Recovered baseline is `../revitalizedacademy/supabase/baselines/2026-09-26/schema.sql`, SHA256 `60f38f157e338cce445e2ca391b1988a69c0586dfed9b289283380f3f3e9edc6`. Its platform scaffold and metadata hashes are pinned separately. No historical authorization repair is silently treated as current installation. Existing Wave2 strict assertions remain byte-identical.

No patch selected at this checkpoint. Blanket private EXECUTE grants, arbitrary new SECURITY DEFINER boundaries, weakened assertions and copied authorization implementations are excluded. Current body/ACL/owner/config/trigger/policy/role metadata is required to choose a compatible least-privilege proposal. No-show policy, holds, lifecycle, ledger unit rules, 49-day program rules and missing Owner choices are outside this correction.

## Subsequent current-catalog checkpoint

The pending state above is preserved as dated history. Current metadata and supplement were received15:07/15:09UTC on November1; they confirm no usage/entitlement triggers and the required explicit recalculation. See REPORT.md, handoff.json and final receipts for the completed40-routine overlay, narrow invoker correction,30passing corrected assertions, original/revert failures and three retained direct-table security failures. No current-operation or whole-case acceptance claim is inferred.
