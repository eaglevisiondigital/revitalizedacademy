BUILD 78 — FAMILY HEALTH SPACING + ILLUSTRATED GENERATION CARDS

FIXES ONLY. THIS IS NOT A COMPLETE SITE DEPLOYMENT.
Baseline: eaglevisiondigital/revitalizedacademy main
70ebc02a35615c15131789489e886f37f47886d2

UPLOAD
1. Extract this ZIP.
2. At the repository ROOT (where families.html is), upload the contents:
   families.html, css/, assets/, tests/ and the BUILD78 documentation.
3. Keep folder paths. Do not upload the enclosing folder or the ZIP itself.
   Do not delete existing assets or any other folders/files.
4. Commit the changes and let the existing Netlify deployment finish.
5. Open Family Health and refresh. The new stylesheet uses ?v=78.

Only one existing production file is replaced: families.html.
Its current version was verified by Git blob hash against latest main.
Other than the generation-card section and one new CSS include, that
file's content is byte-for-byte unchanged.

WHAT CHANGED
- Desktop gap between the Roadmap introduction and the four pillar cards
  is reduced by 50%. Only blank cream below the artwork is clipped; the
  original picture, words, four icons, visible buttons, and click areas
  retain their original size and position.
- The Kids, Teens, Parents and Grandparents cards use the actual cartoon
  character illustrations extracted from the reference artwork.
- Sage, warm gold, soft blue and lavender card backgrounds, numbered
  badges, subtle outlined decorations and a compact portrait/text layout.
- All four existing card titles and descriptions are retained verbatim.
- Four columns on desktop, two on tablet, one on narrow phones.
- No testimonial or invented family quote has been added from the mockup.

UNCHANGED
The Family Health hero artwork, mobile hero, four Longevity Matrix pillars,
CTA destinations and colors, site navigation, page footer, other Family
Health sections, and all other pages remain unchanged. No homepage,
coaching, webinar, Founders, assessment, legal, shared stylesheet, shared
JavaScript or Netlify configuration is included in this upload.

TESTS
27 viewport widths from 320 to 2560 CSS pixels: no page or card overflow.
Desktop gap measured at 50% of the previous gap across all desktop sizes.
Hero before/after browser pixels identical through the end of its text.
Hero image and CTA hotspot geometry/destinations unchanged.
All four card portraits load, text fits and mobile menu still opens/closes.
The existing assessment regression job was rerun on unchanged main and
passed. This ZIP has not been published and is not a test of live Netlify.
Local browser rendering used supplied production resources in memory
because outbound network navigation was unavailable in the test runtime.

Run current-build integrity checks from the repository root:
  node --test tests/family-health78-integrity.cjs
These are the Build78 checks; earlier Build77 package-hash checks are
historical snapshot checks and are not the acceptance test for new cards.
The assessment workflow and assessment test files are not modified.

If families.html has been changed again after the baseline above, merge
this specific change into that newer version instead of overwriting it.
