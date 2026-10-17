# B5.2 — release provenance and two separate authorization gates

Issue #40. **Review candidate only; no hosted writes performed.** PR37/38/39 and their heads are preserved. This branch adds offline/read-only tooling, evidence, documentation and test-only CI; it does not change the application, Functions, SQL, security policy, scoring or questionnaires.

## Exact preserved sources

| Purpose | Exact SHA |
|---|---|
| Current GitHub main | `79debed92925b920f9052d9c522a796bbf929223` |
| PR37 / deployed B5 / proposed main target | `e02f35267de3159d7b3b2a5e989ccb8edb7e9f7d` |
| PR38 founder workbook | `83560cf674a4edbc235d52e60d759a01e41fb9fc` |
| PR39 / exact static repair source | `cf590b576388e61100cc1b88222723fb016a0381` |

Production remains deploy `6ad2acb16d6d38c15ce3e489`, site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Beta remains `6acc33161511aa93c289bbcc`, site `071b252e-a922-4846-a784-8dca1edad377`. Current main is seven commits behind B5, zero ahead. Do not merge the old stacked B4/B5 drafts separately or deploy main before reconciliation.

## Proven archive root cause

All nine deployed SHA256 digests have now been reproduced exactly, without downloading private runtime code or invoking hosted Functions. Seven require the retained **Netlify CLI23.11.1 / ZISI14.1.13 / esbuild0.25.11 / bootstrap2.7.1** toolchain. Verification and Scoring Lab require **CLI27.12.0 / ZISI16.3.0 / esbuild0.28.1 / bootstrap2.24.0**. These versions were not dependencies pinned by the application lockfile. Although `esbuild` is requested, modern APIv2 packaging reports the `nft` bundler. See the reproduction script and complete ZIP-entry hashes, not just tool names.

The seven mismatches are actual generated-code changes: all seven change bootstrap, instrumentation/telemetry and metadata. Exercise Library, Food Database, Reusable Content Sync and Founder also change the bundled application entry; the three payment entry contents remain identical. Source files themselves remain identical. ZIP timestamps are fixed at1980-01-01 and entry modes are stable. Repeated Node24 packaging reproduces the same digests; random timestamps are not the cause.

There is a separate host-compression effect. Official Node22.23.3 (`zlib1.3.1-e00f703`) versus this machine's Node24.20.0 (`zlib1.2.12`) gives different ZIP bytes for **all nine**, despite identical uncompressed entries under each fixed toolchain. The retained Node24 executable SHA256 is in `reproduction.json`. A mixed-toolchain rebuild on that exact host reproduces **9/9** production hashes. Merely specifying the Lambda target as Node22 does not specify the host compressor. Changing the target22→24 on the retained Node24 host leaves these archive bytes unchanged but changes deployment runtime metadata. Pin both artifact digests and runtime metadata.

The pre-existing automatic PR37 preview runs all nine Functions on Node24; production runs Node22. The repo has no Node engine/version pin and the production build command only prepares RepDB and public static files. Function packaging is a separate platform/toolchain operation. Official Netlify documentation says runtime follows a supported build Node version, otherwise its default fallback. **The historical preview's exact build-host/toolchain and context-selection inputs have not been recovered**; runtime metadata alone cannot prove which build-host selection/fallback was used. No privileged environment values or build logs were fetched. Do not claim that replacing `nodejs24.x` alone would make an automatic build byte-identical.

Local exact archives are retained outside Git under `deployment-evidence/2026-10-16-roadmap-b52/bundles/exact-live-archives`. They are not public website files. No raw RepDB dataset/API is exposed. The planned static release reuses existing server-side digests and permits **zero Function uploads**; archive reproduction is evidence, not permission to replace Functions.

## Gate A — no-publish main synchronization, not yet executed

Netlify Git production builds are active against main, with no publish lock. Draft PRs and skip markers do not establish safety. Official platform controls and local contract/fictional-Git tests support the following procedure; **the live pause/lock itself remains untested until separately authorized**.

Prerequisites: authorized Netlify Developer/Owner able to manage builds/deploy locks, normal GitHub main write permission satisfying branch protection, a coordinated no-other-push/manual-deploy window, and fresh read-only inventory. Do not bypass branch protection, unlink/relink Git, edit hooks, alter environment variables or change CI publish settings.

1. Recheck exact main and PR37 target/ancestry, production/beta deploy IDs, all434 file digests, all9 full Function pins/configs/routes, schedule,205-entry ledger and zero cohort/pilot/proposals. Recheck all test-only GitHub workflows. Inspect all queued/running production-site deploys; **abort/wait if any exist**. Never infer this from only the most recent deploy. Paginate if the first100 entries do not establish an idle window.
2. Lock **the currently published baseline deploy** using Netlify's Lock to stop auto publishing control (`POST /deploys/6ad2acb16d6d38c15ce3e489/lock`). GET it again and verify `locked=true` and the published ID is unchanged. If lock fails, stop before any Git update.
3. Stop builds for **production site only** using Continuous deployment → Build settings → Build status → Stopped builds (API `PATCH /sites/<production-site>` with `build_settings.stop_builds=true`, preserving other settings). Read back the state, repository/branch settings and published manifest. If stopping fails, leave the successful lock held and stop. Do not compensate by unlocking.
4. Recheck both controls, no active/queued deploy, exact manifest/Functions/schedule, exact main head, and beta exclusion immediately before the Git operation. Beta currently tracks only `codex/staging`, allows only that branch and has `skip_prs=true`; **do not change beta**. If that exclusion changes, stop. `assertNoPublishReady()` tests all these conditions.
5. Fast-forward main from `79debed…` to **exactly `e02f352…`**, no force/rebase/squash/new merge commit. Use the normal authorized GitHub ref update or `git push origin e02f35267de3159d7b3b2a5e989ccb8edb7e9f7d:refs/heads/main`. Local disposable-remote testing proves the exact Git operation/tree. If branch protection requires a different operation, stop and request review of that exact alternative; do not bypass it.
6. Recheck remote main SHA/tree, production published ID, every file and Function pin, schedule, beta ID and stopped/locked controls. Inspect deploy list after webhook processing and again after the reconciliation CI completes. A new build is a failure of the no-build gate even if the lock prevented publication. No build hook, retry, preview or Function rebundle is authorized.
7. **Leave production builds stopped and publishing locked.** Do not automatically restore automatic deployment. A later fully pinned rebuild/runtime release requires separate review. Do not merge PR38/39 or B4 stacks as part of this source-only operation.

Failure handling: before Git changes, leave the lock/stopped controls held for investigation; restoring their former state needs an explicit decision after queue review. After main reaches the exact already-deployed B5 source, do not force main backward or issue a production rollback: the application did not change. If published artifacts drift, stop and use the separately approved artifact-recovery procedure. A failure is not permission to publish anything. Netlify may send platform build-status notifications when stopping/activating builds; this is distinct from client mail and should be included in authorization.

## Gate B — PR39 static-only production release, not yet executed

The machine review is `docs/evidence/b52/static-release.json`: full434-path file digest map, all9 Function digests and exact configuration, schedule, eight upload/rollback SHA1+SHA256 pins,434-file local-build SHA256 map, immutable source-tree hashes and canonical body hashes. The complete Netlify body is cloned from the accepted B5 release, not regenerated by a generic CLI deployment.

Only these runtime files change:

| Script | New version |
|---|---|
| `portal-work-desk.js` |161|
| `portal-member-messaging.js` |167|
| `portal-companion.js` |123|
| `portal-programs.js` |180|
| `portal-people-directory.js` |145|
| `portal-staff-access.js` |182|
| `portal-family-requests.js` |167|

The eighth file is `portal/index.html`, changing those seven references only. Core/PR29 NDA, B4/B4.2/B5 assets, other426 paths, all9 Function IDs/digests/runtime/config/routes and `payment-worker: * * * * *` remain unchanged. Source SHA is **PR39 `cf590b…`**, not the B5.2 tooling head.

One preserved historical `/netlify.toml` blob has API SHA1 `f0026c2bb5b6c9aa0db2af18048d6ce98a13c3dc`, size2771, but is not publicly served (404). Its SHA256 remains explicitly unknown. No retained original file/source-history candidate matches it. Both forward and rollback bodies preserve its existing digest; **never upload the rebuilt config**.433 other proposed public files have SHA256 pins; all434 local build files have SHA256 pins. This limitation does not authorize assuming the opaque blob equals source.

Future authorized execution:

1. Require Gate A safeguards, build in an isolated temporary Git-archive checkout outside the synced workspace, and use fresh exact baseline inventory and `assertFreshLive()`; ensure beta still excluded. Rebuild clean exact PR39 with the unchanged approved entrypoint. Run the offline preparation against the recorded inventory/accepted B5 body and compare all manifest hashes. Keep all existing production deployment/platform configuration. No migration or Edge deployment.
2. Create an **unpublished manual digest deploy** using reviewed `stage_body` (`draft=true`). Do not run a Netlify Git build or generic CLI deploy. The digest body contains all434 files and all9 existing Function digests/configs/schedule, not an eight-file partial site.
3. Inspect required uploads **before uploading anything**. `required_functions`/Edge/server must be empty; any unexpected file digest aborts. Upload only reviewed static bytes, each checked against both hashes. Preserve the full Function pins from production. Never upload the locally reproduced archives as a substitute.
4. When ready, compare complete resulting file/Function/config/schedule inventory. Perform signed-out/invalid-session probes and exact-asset synthetic browser replay against this deploy without looking up actual participant records. Do not sign in to an unexpected origin or expose production credentials to local mocks.
5. Explicitly publish **only that reviewed ready deploy** through Netlify's manual Publish deploy control/API, within the separate static-release authorization. Do not unlock automatic publishing as a shortcut. If the platform refuses publication while locked, stop for an explicit safe operator action; no speculative unlock/retry. Read back the published ID, re-lock the new published deploy if necessary, and verify builds remain stopped. Existing worker schedule is retained, never directly invoked for this acceptance.
6. Verify eight exact live hashes, all426 preserved digests, nine full Function pins/routes/configs/schedule, signed-out/authenticated session/NDA/logout/stale-response behavior, and Chromium/WebKit desktop/tablet/mobile. Real authorization denials must remain genuine401s; zero *unnecessary* requests/warnings is the target, not globally suppressed401s. Normal real-founder sign-in, if unavailable, must remain a separately reported hosted acceptance limitation.

Rollback: retain all eight old static bytes in the local reviewed rollback directory. The reviewed `rollback_body` restores exactly the current B5 file map and identical Functions/scheduler. Within an explicitly approved rollback, prepare/publish that full digest snapshot with only eight old static uploads; **zero Function upload/rebundle, SQL, permissions or data rollback**. A missing old Function cache/request aborts. Alternatively an explicitly authorized manual atomic return to retained baseline deploy is possible; do not use an arbitrary older deploy or CLI retry. Recheck complete baseline manifest and all9 pins afterward, keep builds/publishing held and report failure. No rollback was executed now.

## Reviewed artifact fingerprints

| Artifact | SHA256 |
|---|---|
|Complete434-file local build manifest|`5f9590a1621793f344300df7f412a142730a29d57315fea5de50e5a306fb96a1`|
|Full production digest body|`dae4dfebb2480549b9eea67cce901a77102ca99480e6756cf3fe304e7fe8e1a7`|
|Unpublished staging digest body|`5a64b401e1f0b99e6613937db8b7840aa6ecb0b84fae9a4624fd48a846b61da0`|
|Full baseline rollback body|`4539495b9c462d2416481cfbca8f67fd8bb592deee2c87f5625359a0a68e1cad`|

Exact PR39 source tree: `f7ede43d642dc275ce4caeb963b71c8fab263813`. All eight asset SHA256 values and all nine Function pins are in the machine review. Canonical manifest hashing sorts object keys recursively; it does not depend on JSON whitespace.

## Verification and limits

New B5.2 evidence:38/38 offline release contracts on each of Node22.23.3 and Node24.20.0; five new JS syntax checks and Python parse;911 production-site deploy entries inspected with no unfinished deploy; exact9/9 mixed-toolchain archive matches; repeatable Node24 packaging;18 host comparisons (two toolchains ×9 archives) with identical decompressed contents and compression-only differences; all434 static bytes identical under Node22 and Node24; focused release contracts under both hosts; local disposable Git fast-forward; GET-only inspector; safe SQL aggregate/ledger/body-hash reads. No participant data was queried. SQL ledger remains205/latest20261016230019, B4/B42/B5 exact body hashes match their actual installed timestamps, cohort0/versions0/pilot0/proposals0/audit0. Never replay by filename.

Retained PR39 evidence is independently tied to unchanged source, not relabeled as a new hosted run: maintained260; guards23 (22 overlap); nativePG17/RLS201; session39; Chromium/WebKit startup/security/NDA126 at1440/768/390; FoodData66/RepDB46/content36; mockedEdge40; syntax178; build434. B5's unchanged50 fictional cases and founder-only coverage remain passing under that evidence. PR38's10 readiness checks remain separate. Per Issue40, these were not rerun without a runtime/database source change. New tooling CI is read-only and has no deployment credentials or mutation commands.

A synchronized working build directory acquired untracked duplicate files during review; the manifest guard rejected it before any hosted action. An isolated immutable Git-archive rebuild reproduced the original434-file hashes. This is why release artifacts must be built outside the synced workspace.

Remaining discrepancies: opaque historical config SHA256; historical preview build-host/context-selection details; actual hosted pause/lock/manual-publish behavior and positive real-founder hosted acceptance are not claimed from local mocks. A future uniform pinned runtime/toolchain rebuild is a separate release, not part of this static fix. There is no pending code/scoring-policy fix hidden in these limitations.

## Short founder workbook instructions

Justyn/Elle: open PR38's measurement-readiness document and work only with its fictional cases. Independently write expected A/B/C ranges/order/spread before comparing engine output; decide whether symptom-free B may have numeric Chaos; select Peace90/95 or leave it unresolved. Review cognitive/GI gates, persistent-condition/Chaos rules, primary Driver ownership and how overlap/unique days should work. Define factual habit opportunities, proficiency evidence, units and missing/declined/inapplicable treatment; review the proposed follow-up wording and conditional placement. Distinguish business expectations from claims needing qualified clinical review. Do not approve invented diagnoses, missing measurements or a formula merely because it fits A/B/C. Return explicit versioned decisions; worksheet edits alone are not authenticated policy approval.

Actual participant lookup, pilot grants/enrollment/calculation, draft writes, report approval/release, emails and external AI remain held. Wise Budgeting stays separate with zero health deduction; A/B/C calibration remains an unresolved founder issue.

## Separate exact approval texts

**A — source synchronization only:**

> I approve the B5.2 documented no-publish main synchronization only: verify the unchanged production baseline6ad2acb16d6d38c15ce3e489, lock that deploy and stop builds on Netlify production site ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06, read back both controls and an idle queue, then fast-forward GitHub main from79debed92925b920f9052d9c522a796bbf929223 to exact deployed B5 SHA e02f35267de3159d7b3b2a5e989ccb8edb7e9f7d using normal branch permissions. Stop on drift or branch-policy conflict. Preserve all434 public artifacts, nine Function pins/configs and worker schedule; verify no build/publish and no beta change. Leave builds stopped and publishing locked. Do not deploy PR39, merge other drafts, apply migrations or activate any real-data gates.

**B — separate static-only release, only after A succeeds:**

> I approve exact PR39 source cf590b576388e61100cc1b88222723fb016a0381 for the documented static-only release to production Netlify site ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06, using the B5.2 reviewed manifest/hash pins. Create an unpublished manual digest deploy, upload only the seven repaired scripts and portal/index.html, retain every other published path and all nine existing Function artifacts/IDs/runtime/configs/routes and payment-worker schedule, verify before explicit manual publication, then perform bounded hosted session/security/browser acceptance. Allow the documented narrow static rollback on failure. Abort if any Function upload/rebundle or unreviewed byte is requested. Keep Git builds stopped/auto-publishing locked, beta unchanged, no migrations/Edge changes or participant lookup/scoring/cohort/draft/client release/email activation.

The B5.2 tooling PR is not approval to execute either gate. No unrelated work follows.

## Primary references

- [Netlify stop/activate builds](https://docs.netlify.com/build/configure-builds/stop-or-activate-builds/): stopped builds cover production/previews/branches; manual API deploys remain possible; activation does not itself trigger a build.
- [Manage deploys/locks](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/): a publish lock alone still permits builds; skip markers are not a lasting control.
- [Digest deployment API](https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/): complete file/function digests and required-upload checks.
- [Function configuration/runtime](https://docs.netlify.com/build/functions/configuration/): runtime selection and override are distinct from archive contents.
- [Netlify OpenAPI](https://github.com/netlify/open-api/blob/master/swagger.yml): GET site/deploy/files, updateSite, lockDeploy and explicit publish/restore operations. No write endpoint was called in B5.2.
