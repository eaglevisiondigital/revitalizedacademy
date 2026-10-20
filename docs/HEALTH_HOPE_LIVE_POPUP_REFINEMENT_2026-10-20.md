**Publication update, October 20, 2026:** The separately authorized popup-only update is now live as deploy `6ad7ed9be0bd165b997e0be1`; three public assets over the exact current primary manifest, with registration held and Roadmap/Zoom/email unchanged. [Release report and live verification](HEALTH_HOPE_LIVE_POPUP_RELEASE_2026-10-20.md). All registration-readiness backend changes and four event migrations remain unreleased. Earlier local/unpublished website status below is historical.

# Homepage popup — clearer choices and Title Case

2026-10-20 · local `codex/health-hope-live` candidate. The owner requested more defined separation between the two popup options and initial capitals for non-sentence labels, using “Maybe Later” as the example.

## COMPLETED / CHANGED

- Preserved the premium cream, emerald and gold design, both destinations, popup timing/dismissal and sample-preview behavior.
- Strengthened the gold divider and outlined its OR marker. Placed the Health & Hope Live choice in a subtle emerald-tinted, bordered panel with its own padding.
- Updated non-sentence popup labels to Title Case: Free Vitality Roadmap, both option labels, the event badge/heading, Reserve My Free Seat and Maybe Later. The question and explanatory sentences stay in sentence case.
- Used “Click To Preview Vitality Roadmap” consistently for the marketing preview label. The preview script changes only that string; no scoring, assessment, report calculation or permission code changes.
- Kept shared `styles.css`, `vitality55.css` and assessment runtime unchanged. Added popup-scoped styles to `css/health-hope-live.css`; updated `index.html` labels and asset versions. Pin exact authorized source hashes in [source-changes.json](health-hope-live-popup-refinement-2026-10-20/source-changes.json).

## TESTED / SECURITY

Production static build and existing feature scope/reconciliation checks pass. Desktop/mobile local review exercises the preview, its close button, Maybe Later and both unchanged destinations, with no participant submissions or provider sends. Popup width and scrolling are checked at 1440 and 390 pixels (20 local checks, zero browser errors). The existing unrelated homepage family-photo section extends 8 pixels beyond the 390-pixel viewport; the popup stays within bounds. Its underlying section source/styles are unchanged and that separate layout issue was left out of this narrow refinement. The visual review uses local production-build files with public font GETs only; all other external services are intercepted.

[Desktop screenshot](health-hope-live-popup-refinement-2026-10-20/desktop.png) · [Mobile screenshot](health-hope-live-popup-refinement-2026-10-20/mobile.png) · [Visual validation](health-hope-live-popup-refinement-2026-10-20/visual-validation.json).

## DOCUMENTATION / UNRESOLVED / NEXT RECOMMENDED BUILD

CURRENT_BUILD_STATE.md and this review record document the refinement. This package is local and unpublished; production, registration activation, Zoom/email and migrations were not changed. Publish only the reviewed public presentation delta through the established website-only release process, preserving current primary assets and all registration/provider holds. Backend activation remains subject to the separate [controlled acceptance package](HEALTH_HOPE_LIVE_FINAL_ACTIVATION_PREPARATION_2026-10-20.md).

## CHAT HANDOFF

The homepage popup now distinguishes the two choices with a stronger gold divider and an emerald-tinted event panel. Non-sentence labels use Title Case, including Maybe Later and Click To Preview Vitality Roadmap. Existing design, destinations, preview and Roadmap behavior are preserved. Desktop/mobile screenshots are available for review. Changes remain isolated on codex/health-hope-live and have not been deployed.
