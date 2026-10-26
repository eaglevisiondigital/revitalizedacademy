## Mobile hero realism correction — LOCAL VISUAL REVIEW — 2026-10-26

Owner rejected the illustrated botanical treatment. Replaced that unpublished background with a generated photographic botanical layer, softly overlaid in CSS to keep the headline clear. No founders image was sent to image generation: the tool produced foliage/background only. The original approved portrait remains a separate, byte-identical PNG with natural dimensions and no filter/transform/crop. The cream/gold arch and all text/buttons remain live HTML/CSS. Removed the unused unpublished SVG. All rules remain <=600px; 18 Chromium/WebKit cases PASS, including 10 pixel-identical tablet/desktop comparisons. No other page/backend changes or hosted actions. Preview: http://127.0.0.1:48934/mobile-preview.html . Visual approval remains pending; no push/deploy. The supplied portrait ends at the waist; the mockup's longer body composition cannot be matched without inventing pixels, which was not done.

# Homepage mobile hero — local visual review

Prepared on October 26, 2026 on `codex/homepage-mobile-hero`, based on canonical source `c93d1ae0bfee91399e289255f61ca38ee937b522`, deploy `6adac7d8b359cd28fa92d960`. No push, deployment, production state change or participant access.

## Revision after owner rejected the first preview — October 26

The initial local SHA103890b was not visually approved; do not release it. The revised mobile design changes the headline to locally hosted SIL-OFL DM Serif Display, matches the compact cream header/hamburger control and coaching-label divider, tightens the five-line headline rhythm, and adds editable SVG botanical depth and smooth gold/cream framing. Both coaching phrases already exist in the current desktop source/generated caption; no headline, subheadline, body, CTA or note wording is rewritten. The image source and every image byte remain exact; no transform, filter, image cropping or AI processing. The mockup contains a longer lower-body composition than the supplied original PNG; that area is not fabricated or stretched. Match claims are limited to composition/direction pending owner visual approval.

All changes remain within max-width600px. The shared header/other-page CSS and all JavaScript handlers are unchanged. New assets are the DM Serif Display font/license and a code-native botanical background SVG, containing no portrait or text. The original CSS-radial edge was replaced by a vector arch behind the portrait for smoother rendering.

A separate local-only review page http://127.0.0.1:48934/mobile-preview.html frames the actual homepage at390px with320/430/600px selectors. The earlier in-app panel was685px wide and thus correctly displayed the unchanged tablet layout, which was an inadequate mobile review link. The review frame uses the same real HTML/CSS; it is not a bitmap. Its local-only fixture suppresses the existing40-second promotional popup so the visual comparison stays visible. Production JS and popup behavior are unchanged; the wrapper/fixture are not release artifacts.

The updated18-case Chromium/WebKit matrix passes, including10 pixel-identical tablet/desktop comparisons,8 mobile menu/keyboard/touch/CTA/modal/source-image/ratio cases and new custom-font/hamburger checks. No hosted calls or writes. Revised evidence lives in deployment-evidence/2026-10-26-homepage-mobile-hero/revision2. Original first-preview evidence is historical. Owner approval remains pending; no push/candidate/deploy.

## First-preview implementation (historical)

Only runtime changes are the homepage stylesheet include and new `css/homepage-mobile-hero.css`. Both the HTML link media condition and all CSS rules are restricted to **max-width:600px**. Tablet and desktop widths above 600px retain their existing styling. The shared header stylesheet, all JavaScript/action handlers, portrait, logos and existing decorative assets are unchanged.

The existing homepage copy remains live and byte-identical. A mobile-only grid places the eyebrow/headline above the existing portrait, then the entire approved subheadline/body, original CTAs, preview button and note. No text is rewritten, shortened or copied from the reference. The current desktop visible eyebrow remains Personalized Holistic Health Coaching; the mockup's extra eyebrow wording and punctuation were not introduced.

Cream/gold arches are CSS backgrounds behind the original transparent PNG. The existing emerald botanical artwork provides a subtle background. The original portrait is not edited, cropped, recolored, regenerated, compressed, masked, distorted or filtered on mobile; image height is automatic at native aspect ratio. Its uploaded and repository SHA256 are both:
`83719262d46ad793deccf87964549c4debadd7a51673267b818379098eec8816`
Dimensions remain 1348 x 1254. The mockup bitmap is never used by the website. Its longer composition is interpreted with the actual complete original portrait, not fabricated image extensions.

The mobile header keeps the existing logo, Menu label, nav and toggle handler, with proportional logo sizing and a 44px minimum menu target. The desktop/header copy, branding and button destinations are untouched.

## Current-production reconciliation

The Git source's homepage still contains the historically held HHL marker. The **already published** homepage artifact has `data-hhl-promo="enabled"`. That existing production overlay is retained locally, not newly activated. Reconstructing the base homepage from source plus that one existing overlay yields exactly the frozen deploy manifest SHA1 `0cb19d8025c88313ebc1702acc70cba5ad62e569`. The proposed runtime HTML differs from that verified artifact only by the new mobile stylesheet link. Publicly served HTML additionally has Netlify's existing pretty-URL link rewriting; its content/copy/layout match this baseline. No unrelated link or HHL behavior is changed.

## Verification

18 Chromium/WebKit cases at widths 320,390,430,600,601,768,840,1024,1440 pass. The ten cases above600px have identical header/hero pixels and computed styles before/after. Eight mobile cases verify headline-before-image, natural portrait ratio/no filter/no transform, unchanged live text/links, no hero overflow, keyboard/touch menu toggle and ARIA state, original preview modal open/close, and keyboard activation of both original CTAs. Enlarged-root-text and 44px target checks pass. All scripts execute against loopback-only fixtures; hosted requests are intercepted and all mutations/private routes blocked. Zero worker calls or hosted writes.

Unrelated sections retain the same HTML and computed layout/style. Existing source-preview baseline issues remain unchanged: a small Family-photo horizontal overhang at some widths and the legacy `/css/assets/images/revitalized-shield.png` decorative reference. The mobile hero/header introduces no new overflow, console error or missing asset. These pre-existing issues were not repaired out of scope. The root-font test is not a claim of exhaustive assistive-technology or full browser-zoom certification.

## Preview and release boundary

Loopback preview: http://127.0.0.1:48934/ . Baseline comparison: /baseline.html . Static preview blocks private/API actions and uses an empty fictional HHL availability response; no registration/health/payment operation can run. Evidence and screenshots are in `deployment-evidence/2026-10-26-homepage-mobile-hero/` outside this source checkout.

The release package must overlay only the reviewed index and added mobile stylesheet on the then-current verified production manifest, preserving all other paths and all13 Functions/configuration/schedules. No build of unrelated backend artifacts is needed. Local source includes tests and this continuity documentation. Rollback is the existing canonical index with the new stylesheet link absent; no database or backend rollback required.

Next: owner visual approval of mobile preview, followed by separately scoped exact-SHA candidate/release authorization. No Git push, candidate creation or publication is performed here. Existing Caroline review authorization/history and all HHL, Founders, questionnaire, payments and beta systems remain untouched.
