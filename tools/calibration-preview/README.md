# Isolated founder calibration rehearsal

This additive local tool reuses the current B2/B2.1/B5/B5.3 implementation and all 50 fictional cases. It does not replace any platform code, answer adapter, public page, Netlify Function or migration. Start from the complete B6 + PR51 baseline, not stale main.

## Run locally

From the repository root:

```sh
node tools/calibration-preview/audit.cjs
node tools/calibration-preview/build.cjs
node tools/calibration-preview/serve.cjs
```

Open `http://127.0.0.1:48958/`, then **Founder Scoring Lab**. Use Person A/B/C or the 50-case dropdown. Inspect the fictional measurement sheet, all 12 Driver calculations, explanations, questionnaire reference and provisional Roadmap. These measurements are not submitted questionnaire answers.

The version is `b2.1-founder-20261015-v1`. The original v0.14 Python package has **not** been located or independently executed. This rehearsal does not claim its eight examples were reproduced. Never substitute the PDF's reported outputs for executed test evidence.

Structured Agree / Disagree / Needs more evidence feedback remains in memory only, does not change calculations, and clears when changing case, closing, simulating logout or refreshing. Reviewer labels are not authenticated identities. This is an operator-machine rehearsal or supervised screen share, not a remotely hosted founder workspace.

No credential, Supabase client, participant source, storage, writes, downloads, external request or Function bundle is included. The loopback server serves exactly three GET paths and applies `connect-src 'none'`; printing is suppressed. Do not enter personal or health information. No public-hosting authorization is implied.

Native browser tests accept `RVA_PLAYWRIGHT_MODULE` and `RVA_CHROME_EXECUTABLE` paths. Run `node tools/calibration-preview/test-browser.cjs` while the loopback server is active. Generated files/evidence are ignored by Git and excluded from the production public allowlist.

## Reference reconciliation gate

See `docs/V014_REFERENCE_RECONCILIATION_2026-10-19.md`. Do not import old constants or adjust current policy until the missing Python/rules/specifications/examples are available and conflicts have been reviewed. All production deployment, pilot, scoring, feedback-write, export, report approval, delivery and email gates remain unchanged.
