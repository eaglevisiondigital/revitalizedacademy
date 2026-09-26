# ReVitalized Academy verified baseline and handoff

Date: 2026-09-26. Recommended thinking level for next engineering package: **High**.

## Completed

Reconciled the five accessible named history tasks, actual blueprint mockups, three repositories and live Supabase metadata/code. Preserved earlier approved requirements and excluded the two explicitly wrong-project posts. Created AGENTS.md, CURRENT_BUILD_STATE.md, ARCHITECTURE.md, SECURITY_MODEL.md and DECISIONS.md in an isolated local checkout of the recommended repository.

## Repository and branch recommendation

| Repository | Likely role | Evidence | Recommendation |
|---|---|---|---|
| `eaglevisiondigital/revitalizedacademy` | Active public site and staff/member application | Build 192 at `df8aba3`; recent portal/member changes; root Netlify publish config; same Supabase project in frontend; sampled production assets match | Use as implementation repository; base new isolated `codex/*` work on current `origin/main` |
| `eaglevisiondigital/revitalizedroadmap` | Phase One executive implementation plan | README/presentation and strategy assets; latest `2122143` on Aug 5; only main, no Supabase app wiring | Preserve as strategy reference |
| `eaglevisiondigital/revitalized-digital-blueprint` | Ecosystem vision and feature mockups | 30-section presentation, actual dashboard/progress/family/coach assets; latest `0eaaa11` on Aug 19; only main | Preserve as design/product reference |

Recommendation follows contents, history, deployment and environment references, not repository naming. All fetched branch tips are recorded in evidence.json. The current local branch is `codex/verified-baseline`; documentation remains uncommitted/unpushed. No existing branch was merged or rewritten. The original parent workspace and its uncommitted files remain intact.

## Findings and evidence

1. **Production frontend and backend are at different integration stages.** Public member JS matches Build 192 and requests bootstrap v2; live Supabase exposes views through v27. Later privacy/mobile/AI/calendar/progress features are not proven fully wired into the member experience. E1/E5/E6.
2. **Backend source provenance is incomplete.** 185 migration records end at `20260926051441`; no recorded statements reference v20–v27 despite those live views existing. No migration or Edge Function source files are tracked in the inspected application tree. Do not replay or recreate them. E1/E5.
3. **Live backend breadth is verified, workflows are not certified.** 180 public tables, 204 invoker views, 223 public/private functions, 15 deployed Edge Functions and six private buckets. No staging branch was returned. E5.
4. **Assessment remains protected and locally tested.** All 20 assessment tests pass, including initial independent contact capture, adult/child pathways and failure handling. Full health answers use Netlify Forms; Supabase mirrors journey state and derived tags. The mirror's success is not enforced by the main capture success UI. E1/E7.
5. **The entire test suite is not green.** 44/72 pass, 28 fail; many failures are old build hashes/markup. The enrollment test contains stale three-month requirements versus approved/current six-month terms. All 60 JavaScript syntax checks pass. E7.
6. **Wearables, AI and communications need accurate labels.** Native app/watch connections and push delivery are not demonstrated; deployed AI request source declares no generation provider; SMS is disabled/setup required. Resend adapter and branded recovery source exist, but delivery/recovery success is untested. E5.
7. **Security needs focused follow-up beyond the advisor.** The advisor reports leaked-password protection disabled. Static review also identifies missing explicit staff/contact checks in a privileged AI handler, an inactive-staff override edge case, and an export audit RPC that appears blocked for ordinary authenticated callers. These were not exercised against live accounts. SECURITY_MODEL.md gives the evidence and limits.

## Changed / tested / security

Only local documentation and sanitized evidence/test reports were added. No application or image files changed; no live data, access controls or configuration changed; no migrations, commits, pushes, merges or deployments occurred. Tests used synthetic mocked submissions. Public HTTP reads and schema/configuration SELECTs were read-only. No credentials or personal records were requested or included.

## Blockers and unresolved sources

- Primary Chat authority is still unnamed.
- “Build Vitality Assessment” and its original assessment approval files are not yet linked. Preserve current code/build notes; do not ask for all history again.
- Exact Netlify deploy SHA/branch/site binding and a suitable test environment are not confirmed. Public asset comparisons support the repository recommendation but not complete control-plane provenance.
- Original contract/NDA attachments and blueprint feature mockups are accessible; no need to re-upload those. Contract-template equivalence still needs a separate audit.
- Native platform, family health sharing/scoring, assessment storage/scoring/resume, paid-launch/activation sequencing and any stronger bulk-export requirement need the decisions listed in DECISIONS.md.

## Next recommended build

**Backend source recovery and regression/security gate**, then member integration.

Acceptance for that next engineering package: reviewed reproducible schema and Edge Function source under version control; each live object accounted for without reapplying production migrations; isolated export/permission/revocation/contact/household tests; legacy test failures classified against approved requirements; no runtime/asset regression; a tested compatibility plan for adding later bootstrap-driven UI. Resolve explicit policy questions before implementing new permissions or scoring. Deployment requires separate authorization.

## Copy-and-paste primary Chat handoff

RECOMMENDED THINKING LEVEL: HIGH

CHAT DECISION NEEDED

ReVitalized Academy baseline investigation recommends eaglevisiondigital/revitalizedacademy, using new codex/* branches from current main (baseline df8aba33cd8bac16e54aded92a4c99439f74f1d5). The other repositories hold the Phase One plan and original ecosystem/mockups. Supabase voalfpxiyznnqfcqcymd has bootstrap views through v27, but deployed member JS still calls v2. Backend migration/source provenance is incomplete; no live changes were made.

Please identify the exact primary Chat authority and resolve only the open product/architecture choices: native app/GoodBarber/Global Propel/Mighty Networks ownership; family health visibility and approved score methodology; payment/assessment/agreement precedence for each membership; whether/when detailed public assessment answers, scoring and resume should move beyond the current Netlify flow; and whether export policy requires more than permission-gated CSV plus row-scoped reading. Preserve the approved initial contact capture, adult/child questions, six-month Foundations commitment, 50-seat priority webinar and existing assets. Exclude CONT 2 turns 26facc0b-aa39-44ef-a8c8-7bda328731c7 and 6eb23145-edb3-4d66-b340-6fafdd1439b4, explicitly disowned by the user.

Recommended next work is backend source recovery and isolated regression/authorization tests before broader feature activation. Alternatives are to wire v27 first or continue adding backend modules; both increase risk while provenance, test coverage and permission concerns remain unresolved. Confirm sequencing and provide the exact Build Vitality Assessment task link/original approval sources if available; no credentials are needed.

## Copy-and-paste Work handoff

RECOMMENDED THINKING LEVEL: HIGH

WORK TASK NEEDED

Validate the ReVitalized baseline using CURRENT_BUILD_STATE.md, ARCHITECTURE.md, SECURITY_MODEL.md, DECISIONS.md and docs/baseline/SOURCES.md from the local codex/verified-baseline checkout. Start with read-only Netlify control-plane verification: identify the site serving revitalizedacademy.com and revitalizedacademy.netlify.app, its linked repository, build branch, current deployment SHA and preview/staging configuration. Do not change settings or deploy.

Recover the exact Build Vitality Assessment conversation and original approved adult/child assessment source files from the ChatGPT project. The contract MK7, coach NDA MK.1 and blueprint dashboard/progress/family/coach mockups are already accessible; do not request them again. Do not incorporate the two excluded wrong-project posts.

Prepare a scoped test plan for first-step contact capture, Netlify/Supabase synchronization failures, adult/child routing, webinar priority capture, enrollment, staff invitation/recovery through branded email, member sign-in, role/export controls, agreements, household visibility and mobile layout. Use a confirmed test environment and approved synthetic accounts for any writes or email delivery; do not run these transactions on production under this read-only baseline authorization. Verify actual provider delivery separately from configuration flags. Current SMS is disabled, AI generation is not connected, and native wearable syncing is not demonstrated.

Return environment/deploy evidence, recovered source links, reproducible issues, permission-sensitive blockers and a checklist of what remains untested. Do not infer that HTTP 200, a database object or a historical “completed” message proves the user journey works. Route policy questions to primary Chat and concrete implementation findings to Codex.
