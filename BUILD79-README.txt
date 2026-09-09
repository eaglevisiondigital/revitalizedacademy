BUILD 79 — FAMILY STORY STRIP + RESTRAINED LOWER-PAGE POLISH

SOURCE
Repository: eaglevisiondigital/revitalizedacademy
GitHub main checked before work and again before packaging:
1af29a8a72e0eb65572b6d5852be067606d6be1a
families.html Git blob: 097626820aa914917bba4daf5c3de2b44d84c1a0
The working source was verified byte-for-byte against this current GitHub blob.
An old site ZIP was NOT used as a replacement site build.

CHANGES
1. A slim emerald family-story strip directly beneath the Kids, Teens, Parents,
   Grandparents cards. It includes the reference walking-family illustration,
   labelled illustrative, gold details, and working manual previous/next controls.
2. Existing Watt and Hynes Family video stories use the existing website's names,
   summaries and original YouTube IDs. Watch opens a dismissible video dialog.
3. The Family Hub Vision has softer cream/sage panels, subtle gold details and
   tidier typography. Every word of the existing section is preserved.
4. Explore Client Stories is an emerald button with gold text and an arrow on
   this light background. Its label stays on one line and its mobile width is
   responsive. Gold assessment buttons elsewhere are unchanged.

TESTIMONIAL ACCURACY
The Johnson Family name/quote in the mockup could not be verified in the existing
client-story source. It is NOT published as a genuine testimonial in this patch.
The strip instead links the existing Watt and Hynes Family video testimonials.
The walking-family picture is decorative and visibly labelled Illustrative image.
No newly invented first-person quotes, medical outcomes or client identities.

INSTALL
Unzip this package. Upload the contents to the repository root with these paths:
  families.html
  css/family-health79.css
  js/family-health79.js
  assets/images/family-health79/family-walk.webp
The included BUILD79 files and tests may be uploaded as well.
Only families.html replaces an existing runtime file. The other runtime files
are new, isolated, and explicitly loaded by the updated family page.
Do not remove other site files, and do not upload an older full-site package.
If families.html has been changed after the source commit above, merge the new
section rather than overwriting those later edits.

PROTECTED
The approved hero, shortened Roadmap gap, pillar cards, generations cards, their
wording, header, existing assessment links, final assessment CTA and footer are
preserved. No shared JavaScript or shared stylesheet is shipped. Homepage,
coaching, webinar, founders, assessment, child assessment, legal files, Netlify
form handlers and disclaimer content are not modified or included.

VERIFICATION
24 viewport widths from 320 to 2560 pixels. No page or new-content horizontal
overflow. One-line stories CTA at every tested width. Manual carousel, both
original video IDs, dialog close/Escape/focus return, keyboard access, mobile
menu, asset loading and no-JavaScript fallback checked in Chromium.
Browser checks used offline inlining of the exact local file bytes because the
runtime browser cannot navigate external/local URLs directly. External YouTube
playback was not fetched; the embed source and dialog behavior were verified.
Current-main assessment CI was already successful (run 34353437348). This is not
a new assessment-suite execution of this unpublished package. Assessment files
are excluded entirely and the source-reversibility check guards the family page.

Run new package integrity tests:
  node --test tests/family-health79-integrity.cjs
Build-specific older outside-region snapshot tests describe their own older build
and are not cumulative; use the current Build 79 snapshot check for this change.
Re-run the existing assessment regression workflow before publishing new commits.

STATUS
Downloadable fixes package, locally built and browser-checked. NOT published.
