REVITALIZED ACADEMY — BUILD 77 — FAMILY HEALTH
FIXES ONLY. Built against GitHub main d96602bba2da6476a884dd5baa1eb1c347d67b73.

INSTALL
1. Unzip ReVitalized-Build-77-Family-Health-Fix.zip.
2. In the repository ROOT, upload the extracted contents: families.html, js, css,
   assets, tests and the Build77 notes. Preserve the folder paths.
3. Commit all of these files together. Do not upload the ZIP itself, put the files
   inside an extra enclosing folder, delete existing folders, or upload an old full-site ZIP.
4. Wait for the Netlify deployment to complete, then reload the page.
   On Safari, Option-Command-R reloads from the origin when a cached script remains.

This package is a PATCH, not a complete standalone Netlify site. Existing site files
and assets must remain in place. If another chat has changed families.html or
js/app.js since the baseline above, rebase this patch first rather than overwriting it.

WHAT CHANGED
- The old family-page hero is removed from families.html.
- The approved four-icon family artwork is the desktop presentation, not an
  approximation made from CSS shapes. Text in the desktop artwork is baked in.
- Both visible desktop buttons have real, accessible, keyboard-operable links.
- Small-screen layouts use live, readable text and the approved family image crop.
- The CTA hierarchy is gold Free Vitality Assessment and white Explore Client Stories.
- Your Family’s Longevity Roadmap replaces the Blueprint heading.
- The existing four pillar cards now follow that roadmap introduction directly.
  Their existing text and icon assets are unchanged. Other family sections are retained.
- Sitewide navigation labels to families.html become Family Health through the
  shared app.js. The Family Health page itself has the label in its static HTML too.
- The existing families.html URL remains; existing links/bookmarks do not break.
- Tablet navigation remains above the art rather than overlapping it.

FILES
families.html
js/app.js (existing Build76 code byte-for-byte, plus navigation-label code only)
js/family-health77.js
css/family-health77.css
assets/images/family-health77/approved-desktop.png
assets/images/family-health77/approved-family-mobile.webp
assets/images/family-health77/together-signature.png
Plus build notes, verification report and a dependency-free integrity test.

PROTECTED
No index.html or shared css/styles.css is included.
No assessment-owned file, questionnaire, child pathway, form, popup, submission
logic, disclaimer, disclaimer footer link, Netlify form definition or Netlify setting
is included or replaced. No Founders-page or homepage coaching/hero/webinar asset
is replaced. The original family footer is also unchanged.

CHECKS
- 22 viewport widths from 320 to 2560 pixels; no page horizontal overflow.
- Real CTA targets, keyboard focus/activation, mobile menu and image-error fallback.
- Original family-card/other-section/footer preservation and unchanged Build76 app prefix.
- Original desktop artwork preserved byte-for-byte. Isolated 1448px browser
  rendering matches it pixel-for-pixel. The full-page preview retains the site's
  existing sticky-header shadow, which naturally falls on the first rows of the art.
- Assessment regression checks were re-run on the unchanged latest GitHub main
  (run 34280993742; job 102453572635) and passed. This was not a published Build77 run.
- Local navigation-delta test confirms it does not modify assessment/form/legal DOM.

Run in the repository after applying:
  node --test tests/family-health77-integrity.cjs
  NODE_PATH=<your-jsdom-node-modules> node --test tests/assessment-person.cjs

This ZIP has been built and tested locally; production deployment has not been performed.
