BUILD 81 — WEBINAR ALIGNMENT FIX

BASELINE
Repository: eaglevisiondigital/revitalizedacademy
Built against main commit fd260cf0fd633f3491d046d82bc641fafc0512bf.
The input index.html, shared CSS, and shared JavaScript were verified against their current GitHub blob hashes. The downloaded ZIP replaces only index.html; shared CSS/JS are not included.

WHAT CHANGES
- Raises the existing laptop mockup into the top row alongside the main copy.
- Places the original three benefits on the left and original signup form on the right in a dedicated row.
- Aligns both columns by their vertical centers, not staggered.
- Adds subtle vertical dividers and the approved emerald/gold signup treatment.
- Keeps the original signup fields and Netlify form name unchanged.
- Stacks the layout at tablet/mobile sizes with full-width form controls.
- Stops small laptop-screen text from being covered by its bottom ribbon.

UPLOAD
1. Unzip ReVitalized-Build-81-Webinar-Alignment-Fix.zip.
2. In GitHub at the repository root, upload the extracted contents together, including index.html, the css folder, and the tests folder. Preserve the folder paths.
3. Commit the upload. This ZIP must not be uploaded as a single ZIP asset or nested inside another folder.
4. After Netlify finishes deploying, reload the homepage. The signup form should be right of the benefits on desktop, and below them on smaller screens.

Do not replace this with an older full-site ZIP. If main changes again before upload, compare the new changes before overwriting index.html.

PROTECTED
Every byte outside the webinar section and its one new stylesheet include is preserved from the verified current homepage. This includes the hero, coaching, family teaser, resource/video sections, footer, assessment popup, assessment includes, disclaimer disclosure and assessment links.
Assessment files, disclaimer.html, netlify.toml, css/styles.css, js/app.js, the Free Help page, Founders page and Family Health page are not included or replaced.

LOCAL VERIFICATION
Run from the current site root:
  node --test tests/webinar81-integrity.cjs
The included report records actual local browser checks at 25 widths and read-only integrity checks. Browser submissions were intercepted locally using synthetic input. No real signup was sent. Live Netlify delivery has not been tested in this build.
Existing assessment-regression checks are retained; run them before publishing any additional edits. This upload adds a tests/ file, which matches the existing assessment workflow's tests/** trigger.

NOT PUBLISHED
This is an upload-ready fixes-only package, not a deployed update.
