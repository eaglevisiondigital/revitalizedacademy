# Homepage story panels — emerald consistency

October 21, 2026. **Local review candidate, not published.** Isolated branch `codex/homepage-story-emerald`, based on clean `e0bade816ece540981ab8edd61a1386b40554047` from the existing `eaglevisiondigital/revitalizedacademy` repository. The Health & Hope Live and primary/Founders worktrees were not edited.

## Completed / changed

Twenty-two existing `assets/images/social-proof/IMG_*.svg` files now apply the same emerald testimonial-panel treatment as the approved Rodney and Claudia examples. Those two approved graphics remain byte-identical. No carousel HTML, CSS, JavaScript or JSON changes.

The legacy green is part of the original raster graphics embedded inside the SVGs. A clipped SVG background and mask of the original white lettering recolor only their existing lower testimonial panels. Embedded JPEG/PNG data is retained byte for byte: no photo edit, regeneration, recompression, cropping, text transcription, font substitution, resizing or reflow. The original SVG width, height and viewBox are unchanged. The enlarged view naturally uses the same updated graphic.

The existing examples contain a Display P3 profile. The SVG background matches that approved emerald (`#154734` in the source profile), with an sRGB fallback. Browser pixel verification confirms every panel has the same rendered background as the untouched approved examples in both Chromium and WebKit. White text contrast on that rendered emerald is **10.63:1**.

## Tested

- All **24** native graphics compared before/after in **Chromium and WebKit**: zero changed pixels outside the bounded testimonial panel. Photos, logos and Before/After labels remain pixel-identical. Original pure-white lettering remains pure white. The two already approved graphics are entirely pixel-identical.
- Every one of the four six-card carousel groups compared at **1440px desktop and 390px mobile**, in both browsers and both versions: all 24 names, image paths, “View larger +” labels, card/image sizes, positions, object-fit/object-position cropping and card order are identical.
- Pagination remains Showing 1–6, 7–12, 13–18 and 19–24 of 24. Next/previous wrapping and a modal open/close in every group pass. Arrow text/accessible labels and existing modal content are unchanged.
- No unexpected browser script errors or hosted writes. No application dependency, backend, migration, role or permission change. Source checks confirm homepage structure, carousel JS/CSS/data, Health & Hope Live, portal and Founders source remain exact. Diff whitespace and script syntax checks pass.

The initial color check correctly stopped on embedded-profile differences; the final candidate is verified against actual browser-rendered approved examples. No failed candidate was published. The maintained B4 test freezes historical public asset bytes and is not an applicable new-style assertion; unrelated Roadmap/database tests were not rerun for this bounded asset-only change. No full branch build was uploaded or used for release.

[Native/source preservation](homepage-story-emerald-2026-10-21/asset-preservation.json) · [Browser/geometry validation](homepage-story-emerald-2026-10-21/validation.json) · [Scope validation](homepage-story-emerald-2026-10-21/scope-validation.json). Reproducible local analysis, generation, read-only preview and comparison scripts are in the same evidence directory; they are not product/runtime dependencies.

## Before / after screenshots

| View | Before | After |
| --- | --- | --- |
| Desktop, group 1 | [Before](homepage-story-emerald-2026-10-21/before-desktop-group-1.png) | [After](homepage-story-emerald-2026-10-21/after-desktop-group-1.png) |
| Mobile, group 1 | [Before](homepage-story-emerald-2026-10-21/before-mobile-group-1.png) | [After](homepage-story-emerald-2026-10-21/after-mobile-group-1.png) |
| Desktop, group 2 | [Before](homepage-story-emerald-2026-10-21/before-desktop-group-2.png) | [After](homepage-story-emerald-2026-10-21/after-desktop-group-2.png) |
| Desktop, group 3 | [Before](homepage-story-emerald-2026-10-21/before-desktop-group-3.png) | [After](homepage-story-emerald-2026-10-21/after-desktop-group-3.png) |
| Desktop, group 4 | [Before](homepage-story-emerald-2026-10-21/before-desktop-group-4.png) | [After](homepage-story-emerald-2026-10-21/after-desktop-group-4.png) |
| Mobile, group 2 | [Before](homepage-story-emerald-2026-10-21/before-mobile-group-2.png) | [After](homepage-story-emerald-2026-10-21/after-mobile-group-2.png) |
| Mobile, group 3 | [Before](homepage-story-emerald-2026-10-21/before-mobile-group-3.png) | [After](homepage-story-emerald-2026-10-21/after-mobile-group-3.png) |
| Mobile, group 4 | [Before](homepage-story-emerald-2026-10-21/before-mobile-group-4.png) | [After](homepage-story-emerald-2026-10-21/after-mobile-group-4.png) |

Local [before](http://127.0.0.1:61403/before/) / [after](http://127.0.0.1:61403/after/) previews use identical homepage/carousel source and differ only in the 22 story SVG responses. The server rejects writes; preview APIs return no sessions and never connect to the live CRM. Other sections retain their source as-is, including pre-existing heading/pagination styles. The preview is not a full production release or an event activation change.

## Security / documentation / next step

No Health & Hope Live, Founders, Vitality Roadmap, CRM, portal behavior, integrations, release switches or production system changed. No Git push, production upload, deploy, provider mutation, email or database operation occurred. Updated this worktree's CURRENT_BUILD_STATE and added the scoped visual evidence.

No implementation blocker remains. Next is visual approval and an explicitly authorized **22-asset-only** release, freshly reconciled onto the then-current production manifest and preserving all other files/Functions/configuration. Do not deploy this branch wholesale or reuse an old production snapshot: other workstreams may publish independently.

## Chat handoff

All 24 homepage story panels now visually match the approved emerald examples in the local candidate. Twenty-two SVG wrappers change; two approved graphics and every embedded source photo/lettering byte remain unchanged. Both browsers verify zero photo/logo/Before-After pixel changes and identical desktop/mobile card geometry, cropping, content, order, controls and pagination across every group. Before/after screenshots and read-only preview are ready. Nothing published; protected systems untouched.
