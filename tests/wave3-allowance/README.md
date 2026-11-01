# Issue 61 local allowance execution

Run from the repository root:

```sh
RVA_WAVE3_B_OUTPUT=/private/tmp/rva-wave3-independent-b node tests/wave3-allowance/run-pg.cjs
```

Node 24, PostgreSQL 17 binaries default `/opt/homebrew/opt/postgresql@17/bin`; override `RVA_WAVE3_PG_BIN` for another PG17 installation. `pg` **8.16.3** defaults to sibling `../revitalizedacademy/node_modules`; override `RVA_WAVE3_DEPENDENCIES`. No database URL is accepted. A new cluster accepts only a private UNIX socket, has `listen_addresses=''` and rejects TCP Auth. Caller connection environment is not inherited. The runner always stops/removes its own cluster. The sandbox may require approval for local `initdb` shared memory; this authorizes no hosted connection.

`RVA_WAVE3_B_OUTPUT` is required for independent QA to preserve author receipts. The default is `docs/orchestration/issue-61/wave3/receipts`. Input hashes are recorded at execution start and checked again before results. Raw catalog files remain outside Git at the pinned shared evidence paths; the checked-in subset contains only metadata/reference configuration needed by this fixture.

The runner deliberately tests the **same strict assertions** against current-original, corrected, and reverted RPC definitions. Exit 0 means the bounded comparison succeeded: corrected passes while original and reverted reproduce failures. **It does not mean the whole security package passes.** `direct-boundaries.tap` is a separate strict suite and currently has three FAILs. The receipt explicitly records that whole acceptance remains held. Normal test exits and every TAP file are retained.

Final author execution: original 23/30 PASS + seven `42501` helper failures; corrected 30/30 PASS; reverted 23/30 PASS + same seven failures. Direct boundaries 0/3 PASS. No skips. Actual PG17.11, no browser run or hosted acceptance.

`source-pins.json` pins the historical empty dependency schema/platform and published lifecycle migration. `current-pins.json` pins the November 1 current capture, supplement, exact routine/security hashes and scoped overlay. `build-overlay.py` and `build-proposals.py` reproduce the generated SQL from pinned inputs. The overlay installs 40 current routine bodies and current policy/trigger/ACL metadata for 14 supporting tables, plus captured current support columns. It never restores historical authorization repair as if current. Three target tables have exact columns/constraints/session triggers checked. Fake managed Auth is fixture plumbing, not GoTrue/session verification.

Raw ACLs for the public review, private recalculation and all explicit-ACL routines must match. Three noncritical helpers have captured NULL/default ACLs and fixture explicit defaults: `notify_member_access_activation`, `sync_membership_entitlements`, `sync_program_challenges_from_membership`. The test compares PostgreSQL `aclexplode(coalesce(proacl,acldefault('f',owner)))` grantor/grantee/privilege/grantable sets; raw differences and effective rows are retained in `acl-representations.jsonl`. No private-helper grant is added. Earlier raw reconstruction failures are retained as setup/equivalence history.

The proposed correction/revert are **not canonical migrations** and must never be applied to a hosted database by this runner. No business policies are inferred: broader allowance modes, resets/expiry, no-show decisions, overage, hold/payment and 49-day curriculum remain outside this bounded repair.
