# Alex founder-methodology V2 acceptance — local only

Canonical production independently checked October 27: deploy `6adfcfb2d24ef51d0596c95a`, source `1d31209c12eb8304d4a4698b38d2257e40842f2e`. Its worker archive `2f15b43e1677d12b117948180ce5f17a5c53508b4d6f96a76ce4f0ceffcacc32` matches the retained baseline ZIP, which contains neither the V2 directions nor a V2-enabled entrypoint. **V2 LIVE ENGINE BLOCKED. No real generation is permitted.** The previous V2 candidate is unpublished and is not this updated package.

## Actual local generation path

`netlify/functions/roadmap-processing.mjs` explicitly enables founderDirection. The handler verifies the reviewed ruleset, authenticates a source-bound read, then proves the worker's restricted key custody before any claim. `processOne` checks the ruleset before claiming, builds from the caller-authorized pinned source, validates the complete V2 document before signing, then uses the existing sealed finish/read path. There is no V1 fallback on failure. The new Alex SQL branch also rejects missing V2 attestation/comparison at challenge and finish. Existing non-Alex authorities are not revived.

Engine: `roadmap-founder-methodology-v2-20261027`.
Narrative identifier (retained literally): `founder-direction-narrative-20261027-v2-local`.
SHA256 of JSON.stringify of the reviewed ruleset: `996554e27739dd90effda72adcec60493d640f086b15c07c0ca2c29fe08e440b`.

All 45 verbatim directions and source hashes/pages are loaded and frozen across 12 Drivers. Loaded does not mean applied. Applicability requires that Driver's own usable evidence. Uncollected details stay unknown. The three medication passages requiring Owner attribution approval remain unchanged in source/comparison and unapplied. Scores/ranges are not silently adopted.

Each Driver has the three requested sections, source-grounded strengths/concerns, symptom-owned follow-ups and provisional discussion steps. Historical disruption is not relabeled as independently measured severity or life impact. Global life-impact evidence is not copied into individual symptoms. Wise Budgeting remains outside physiological aggregation. Unsupported complete Driver scores and Spectrum remain null.

## Saved founder-only comparison

Each newly generated V2 document carries a collapsed, founder-preview-only comparison with twelve rows: original founder direction and source page/hash, V2 direction ID, applied/deferred status, same-source evidence references/questions/responses, three-section report location and gaps. This is part of the immutable document and later protected review path, not a public preview of actual clients. No actual Alex matrix exists before authorized generation. Fictional browser artifacts contain fictional records only.

## Separate operating authority

The proposed empty guarded migration is not installed. It does not issue grants or touch existing jobs/documents. It binds a single new authority to the independently pinned existing Alex source, Justyn identity, generation-1 job, retained consent/storage and fresh session confirmation. It permits one initial founder-only generation/read/cited feedback; prohibits regeneration, manual numerical scoring, approval, export or delivery. Historical B5/B6/SOP/batch/key deadlines remain expired; only a separately approved new source/SOP/sealing authority may operate.

Proposed exact window, pending Owner approval: October 27 at 2 PM to October 30 at 2 PM America/Chicago (19:00 UTC both dates), exactly 72 hours. Issuance must precede its start. A missed start blocks; no backdating or automatic time shift. Private Owner runner/arming and final hosted preservation acceptance are not yet complete and must not be claimed ready. No old private runner is suitable.

## Evidence and release boundary

External local evidence: `deployment-evidence/2026-10-27-alex-authority/` in the parent workspace. Node/DOM gates, disposable PostgreSQL/RLS/sealing tests and Chromium/WebKit fictional desktop/tablet/mobile cases cover the real source generation path. Tests include V1/missing-rule rejection, wrong source and scores, independently missing symptom qualifiers, deny paths, one-time issuance/concurrency, cited corrections and read-only reopening.

The single worker was bundled twice reproducibly; twelve other Functions were not rebuilt. B2.1, the 743-field registry, founder wording/weights and all completed client records are unchanged. A future release must bind the exact new commit, candidate, static inventory and worker ZIP, pass verify-v2-release with independently read canonical metadata, then independently verify new Alex-only authority before one explicit founder invocation. No push, candidate creation, publication, hosted migration, grant issuance or real processing is performed by this local package.
