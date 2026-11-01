# Wave4 member / Coach continuity

All application source is executed intact against invented transport responses. No SQL, real SDK session, external traffic or saved browser profile is used. Dependencies reuse tests/wave2-client/dependencies.cjs (jsdom26.1.0) and the bundled Playwright runtime. Browser contexts are new and app traffic intercepted. Only fictional actor IDs are kept in isolated browser sessionStorage for reload simulation; health/progress/note payloads remain in RAM.

Run from the worktree:

```
node --test tests/wave4-member/*.test.cjs
node --test tests/wave3-unaffected/member-operations.test.cjs tests/wave2-architecture/contracts.test.cjs
RVA_WAVE4_MEMBER_OUTPUT=/absolute/qa-output node tests/wave4-member/browser.cjs
```

Baseline.test and coach-discovery deliberately execute the exact5926b915 source and PASS when the original defects reproduce. Continuity.test runs current source. Browser runs both a pinned expected baseline reproduction and current cases; `RVA_WAVE4_MEMBER_BASELINE_ONLY=1` selects only the two browser baseline checks. Optional runtime overrides: RVA_PLAYWRIGHT_PATH and RVA_CHROMIUM_EXECUTABLE. All evidence stays in the supplied output directory; source baseline and runtime hashes are in source-pins.json. The before-continuity receipt contains the original44-case pre-repair execution; the final suite expanded to80 continuity cases plus3 preservation checks. No full journey or backend-policy acceptance is inferred.

QA followup: modal-generation and Coach loader lifecycle regressions are in modal-generation.test.cjs and coach-lifecycle.test.cjs. Source pins reflect the followup. Read-only QA browser references can be reproduced with RVA_WAVE4_MEMBER_OUTPUT=/absolute/qa-ref node tests/wave4-member/run-qa-browser-reference.cjs; only root/output are redirected, assertions remain unchanged. This requires the sibling academy-wave4-qa fixture source. Current status: docs/orchestration/issue-54/wave4/followup/REPORT.md.
