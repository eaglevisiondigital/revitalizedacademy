# ReVitalized Academy — Codex Agent Instructions (coordination candidate)

> **Status:** coordination instructions on a non-production branch; not a production release or approval for sensitive operations. Created November 1, 2026. Read `docs/RVA_MASTER_ORCHESTRATION.md` and `docs/RVA_WORKSTREAM_REGISTER.md` before assigning or changing tasks.

## Mission
Build one cohesive ReVitalized Academy across public website, CRM/enrollment, Owner administration, Coach and Client portals, Family Hub, Roadmap/approved V3 knowledge, nutrition/fitness/courses, advanced single-level RVA Affiliates/Share Center/commissions/credits/payouts, payments/entitlements, mobile experience, and operations.

## One master coordinator
- The existing **RVA MASTER CODEX** thread is the Owner's point of contact. It owns dependency arbitration, assignment state, integrated acceptance and release proposals.
- Specialist agents/subagents work on bounded tasks with an issue, branch/worktree, file ownership, input contracts and acceptance criteria.
- GitHub issues and the workstream register are the durable queue. **Creating an issue does not automatically start a Codex agent.** The main thread must actually launch supported subagents or prompt distinct specialist threads; record dispatch proof.
- Start no more than 3 implementation lanes plus 1 independent integration/QA lane until conflict avoidance is demonstrated.
- Do not silently fork new persistent agents, run indefinitely, spend money or set up schedulers. Report which orchestration functions are available.

## Production and sensitive changes
- Production currently identified by Netlify deploy `6ae6b971e17bce85e37aa95c`, source `10dec6682e7e87bf637482fc027e54c6800260e4`. Independently refresh identity before a release. Default `main` may not match deployed source.
- This coordination scope authorizes documents, read-only inspections, isolated development, fictional/synthetic tests and unpublished candidate proposals. It does **not** authorize merging into production, publishing, production database migrations, Auth/RLS/grant changes, real-client processing, financial activation or payouts.
- Preserve ongoing protected Roadmap continuation and its existing grants/authorities; never restart recovery, create duplicate real reports or reuse expired authorization.
- Never put real-client answers, protected health data, passwords, tokens, client documents, consent records or private source archives in public Git, issues, agent prompts, logs or test fixtures.
- V3 knowledge submissions are unapproved intake until separately founder-confirmed. MK10 governs terminology; Holistic Clarity is the foundational curriculum; do not infer medical/individualized directions.

## Shared architecture
- Use one authenticated identity/role model, coordinated data ownership, explicit API and event contracts, and one approved design/asset library. Reuse existing modules rather than duplicating.
- RVA's affiliate compensation defaults to **single level**; MLM, genealogy and ranks OFF unless separately approved with appropriate review. Advanced financial features remain in the full completion scope but must be separately authorized before activation.
- Do not make unauthorized edits to shared security, payment, report-processing, migration or integration files. Coordinate ownership first.
- For UI, use the exact approved emerald/cream/gold tokens and current approved logos/photos; **inspect existing assets**. Do not invent replacement branding or stock images for production.
- Feature is only "verified" after specific live/synthetic functional acceptance appropriate to its release; a schema or passing isolated test is not proof of complete business usability.

## Required specialist handoff
For each task, provide: issue link, scope, owner agent/thread, base commit, branch/worktree, files/contracts touched, dependency/approval status, test evidence, negative tests, security/privacy considerations, code SHA, verification results, integration risks, remaining decisions and next safe action.

## Integration gate
A single integration/release role checks contracts and full journey: public lead -> assessment -> consultation -> agreement -> verified payment -> enrollment -> client account -> coach -> activities/lessons -> renewal; optional family participation and affiliate referral/payout scenarios. A blocked workstream must not block unrelated synthetic or read-only work.

Do not call any issue completed solely because a PR exists; do not publish without exact separate authorization.
