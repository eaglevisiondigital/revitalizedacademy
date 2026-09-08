BUILD 76 — APPROVED COACHING ART / STATIC REPLACEMENT

BASELINE
Repository: eaglevisiondigital/revitalizedacademy
Current main verified: 8bdeb0840023f8ccaf18656cef196c7f249ba82b (Build 75 assessment update).
No older full-site copy is used as the production baseline. Existing file bytes were checked against current GitHub blob hashes.

UPLOAD
1. Unzip this package.
2. Open the ROOT of eaglevisiondigital/revitalizedacademy on main.
3. Choose Add file > Upload files.
4. Drag the CONTENTS of this package, including index.html and the js, css, assets and tests folders. Do not upload the ZIP itself or an extra containing folder.
5. Commit all uploaded files together. Keep the existing repository folders; this only replaces matching file paths.
6. Check the assessment regression workflow is green, then reload the website. On Mac Safari use Option-Command-R if necessary.

IMPORTANT: This patch requires index.html AND js/app.js, not just the JS file. The new index removes the old coaching markup and requests app.js?v=76 and coaching76.css?v=76. Uploading only app.js will not install the new static section.

WHAT CHANGED
- Both old coaching HTML sections are removed from index.html.
- The Build 73 runtime injector is removed from js/app.js.
- A single new coaching section is present directly in the homepage HTML, even with JavaScript disabled.
- At 1200px and above, the actual approved artwork is the presentation layer, with only the mockup navigation cropped away. No oval-leaf or triangle-mountain substitutes.
- A real keyboard-accessible enrollment link sits over the artwork's visible gold button.
- Below 1200px, real text, comparison cards, approved-art icon extracts, and the CTA reflow. This is deliberately not a tiny cropped desktop image.
- Desktop headings/body typography are part of the approved artwork, not individually editable visible HTML. The same wording has a screen-reader-accessible HTML transcript; mobile/tablet text remains visibly native HTML. If the art fails to load, native HTML is shown instead.
- Leaves stay within the coaching component. Header, homepage hero, Founders hero, webinar, family section and existing assessment links are untouched.
- The approved Favorite way to be active wording behavior is retained.

EXISTING FILES REPLACED
index.html
js/app.js

NEW PRODUCTION FILES
css/coaching76.css
assets/images/coaching76/*

CHECKS
node --check js/app.js
node --test tests/coaching76-integrity.cjs
Then run the existing tests/assessment-person.cjs with its documented jsdom dependency, or use the existing GitHub Actions assessment workflow.
The new tests/** file triggers that existing workflow when uploaded. No workflow or assessment test file is replaced.
See BUILD76-CHECKS.json for the actual test scope and current assessment workflow result.

PROTECTED — NOT INCLUDED OR MODIFIED
consult.html
js/vitality55.js
js/vitality-child.js
css/vitality55.css
disclaimer.html
tests/assessment-person.cjs
.github/workflows/assessment-regression.yml
BUILD71-ASSESSMENT-RESTORE.md
netlify.toml
css/styles.css
founders.html
families.html
stories.html
free-help.html
The homepage assessment popup, assessment includes, results disclaimer, footer and assessment button destinations remain byte-for-byte unchanged.

Do not layer Build 69, Build 73, or another older ZIP over this package. If main changes again before you upload, re-check index.html and js/app.js against the baseline recorded above.
