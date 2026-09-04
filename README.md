# ReVitalized Academy — Production Website Build 2

This build is the ReVitalized Academy corporate/coaching website, not the webinar landing page.

## Locked strategy
- ReVitalized Academy and personalized coaching are the primary focus.
- Approved homepage mockup remains the visual source of truth.
- "Longevity Matrix" is the current name of the roadmap framework section.
- Founder’s Webinar appears only as a small "notify me" teaser; registration/payment are not live yet.
- ReFuel is teased as Coming 2027 with no pricing or multi-pack presentation.
- Future ecosystem tools are teased without suggesting visitors should wait to begin.
- Main conversion paths are Start Enrollment and Start Your Free Vitality Assessment.
- All website form notifications should be configured in Netlify to deliver to contact@revitalizedacademy.com.

## Files
- `index.html` — Academy-first homepage
- `stories.html` — complete 12-video client story library
- `consult.html` — Phase One free vitality assessment form
- `enroll.html` — Phase One enrollment form placeholder/foundation
- `css/styles.css` — responsive design system
- `js/app.js` — mobile navigation behavior
- `assets/images/` — approved/reference assets used in the build
- `netlify.toml` — Netlify configuration

## Future placeholders
The homepage contains prepared placeholders for:
1. Coaching Explanation Video
2. Longevity Matrix Explanation Video
3. Program Overview / How Coaching Works

## Netlify form routing
Netlify Forms captures the consultation, enrollment, and Founder’s Webinar notification forms. Configure form notification recipients in the Netlify dashboard to:

`contact@revitalizedacademy.com`


## Build 4 update
- Uses the exact approved Justyn & Elle hero image asset without facial regeneration or retouching.
- Hero and header expand across more of the viewport on desktop while preserving responsive behavior.
- On mobile/tablet the hero stacks so the approved founder image remains visible without awkward cropping.
- Primary secondary CTA is now “Free Vitality Assessment.”


## Build 5 hero refinement
- Uses the exact approved Justyn & Elle hero artwork without altering faces.
- Hero artwork is now scaled with `object-fit: contain` so heads are never cropped and proportions stay closer to the approved mockup.
- Preserves Build 4 headline and CTA sizing.
- Replaces the header logo asset with the full approved transparent LightBG logo.

## Build 6 hero refinement
- Preserves the approved Justyn & Elle hero artwork exactly as supplied.
- Keeps the current founder image scale/crop behavior from Build 5.
- Moves the desktop hero copy slightly left for better visual balance.
- Increases the desktop headline and supporting copy modestly for a stronger left-side presence.
- Widens CTA padding without changing the mobile layout.


Build 26 updates:
- Replaced the four-phone ecosystem image with a live HTML/CSS phone showcase using the approved dashboard, meal plans, progress, and ReFuel screens.
- Updated the FAQ section with expanded questions/answers plus helpful video links.
- Updated the ReFuel product image so the full pouch displays cleanly without cropping.


Build 32 updates:
- Added founders.html with the approved hero photo, founder bios, and fun-facts placeholders.
- Added free-help.html with featured training, six podcast episodes, ReVitalized Report article cards, topic navigation, assessment CTA, and newsletter form.
- Updated main navigation to include the new About/Founders and Free Help pages.


Build 33 update: replaced the Founders page hero with the final approved Justyn & Elle hero artwork, preserving full headroom and improved headline contrast.


## Build 34 update
- Replaced site-wide logos with the newly approved ReVitalized Academy logo system.
- Added approved dark logo for light backgrounds: `assets/images/revitalized-logo-dark-approved.png`.
- Added approved light logo for dark backgrounds: `assets/images/revitalized-logo-light-approved.png`.
- Updated standard page headers, footers, and form-page brand marks to use the approved dark logo on light backgrounds.
- Refreshed the standalone shield asset to match the approved mark.


## Build 35 update
- Includes Build 34 approved site-wide logo system.
- Replaces all three ReVitalized approach video thumbnails with the newly approved graphics: Coaching, Longevity Matrix, and Your ReVitalized Journey.


## Build 36 — Longevity Matrix lock
- Replaced the Longevity Matrix hero artwork with the newly approved transparent version while preserving the existing website display footprint and clickable hit areas.
- Updated all four connected popup identity icons to the locked approved assets: Athletic blue runner, Energized gold lightning, Refined red crown, Organized purple cubes.
- Updated each popup accent system to the corresponding approved blue/gold/red/purple color.
- Preserved the existing popup layout, accordions, copy, CTA, close controls, responsive behavior, and website interaction.


## Build 38 update
- Restored the approved founders hero text overlay: “Justyn & Elle Oliver” and “About Our Founders.”
- Preserved the new approved founders photo while restoring desktop and mobile text-overlay behavior.


## Build 39
- Updated the About Our Founders hero to the approved final artwork with adjusted text placement and full headroom for Justyn and Elle.
- Removed the separate HTML text overlay on this hero so the approved composition stays exact and cannot drift or crop differently across desktop widths.


## Build 40 — mobile polish
- Reduced mobile header footprint.
- Compacted the home hero image while keeping the approved founders visible.
- Reflowed the six coaching pillars into a two-column mobile grid.
- Tightened mobile CTA cards, future ecosystem, ReFuel, founders CTA, and footer spacing.
- Stacked future-action CTAs to eliminate mobile horizontal overflow.

## Build 42 — Editorial transformation proof prototype
- Added a new emerald Digital Blueprint social-proof section to the homepage, separate from video testimonials.
- Implemented Claudia as the featured editorial story using only a crop of the original supplied image; no AI reconstruction, face/body editing, retouching, or visual enhancement was applied.
- Added one smaller Julien companion card for design review only.
- Stories are driven by structured data in `assets/data/transformation-stories.json` with fields for name, images, headline, summary, tags, full story, timeframe, Matrix categories, video URL, homepage priority, status, claim review, and desktop/mobile image positioning.
- Claudia is flagged `review-required` because the supplied source includes a chronic-pain claim. Final publishing language should receive claim/compliance review.
- Existing video testimonials remain unchanged.


## Build 42 updates
- Refined homepage messaging around clarity, conflicting health information, personalization, and application without redesigning the approved site.
- Kept the approved Longevity Matrix section intact and changed only its section background to Blueprint cream #FCF5EE.
- Added a dedicated Families page and a premium family teaser on the homepage.
- Reduced the webinar on the main website to a small coming-soon teaser; no webinar funnel or registration mechanics are introduced here.
- Added Blueprint emerald/cream/gold rhythm to selected new sections while preserving existing approved design/content.


## Build 43
- Cumulative update on top of Build 42.
- Homepage family section redesigned to match the approved family mockup direction with a happy family image.
- Dedicated Families page redesigned to match the approved kid/family-friendly mockup.
- Family Longevity Matrix uses the supplied approved colorful icons.
- Removed redundant stacked logo from the family final CTA.
- Clarity/conflicting-information cards visually elevated with Blueprint emerald/gold styling.
- Section canvases standardized to Blueprint cream, emerald, or emerald gradients rather than plain white.
- Existing overall ReVitalized Academy look, structure and content remain intact unless specifically updated above.


## Build 45 — Corrected approved visual rollout
This build actually implements the approved visual changes rather than simply repackaging the prior build.

Key updates:
- Blueprint palette applied more consistently across the site.
- Bright UI green replaced in primary buttons/text accents with emerald and gold; approved logo colors remain untouched.
- Homepage hero refined to the approved cream/emerald/gold direction while preserving the approved Justyn & Elle photo.
- Homepage family section rebuilt around a family photo and premium emerald/gold layout.
- Dedicated Families page hero rebuilt around the approved family visual direction.
- Family hero photo and four family Matrix icons are embedded in HTML to prevent deployment/image-path failures.
- “Every Stage of Life” cards upgraded.
- Family Longevity Blueprint cards upgraded with the approved colorful kid-friendly icons.
- Family story callout, final CTA and footer composition polished.
- Plain white section canvases replaced with Blueprint cream, emerald or approved gradient treatments where appropriate.

## Build 46 updates
- Applied the approved emerald-and-gold homepage refinement language.
- Removed the duplicate logo from the “Transformation, made personal” section.
- Updated the homepage hero, family teaser, CTA styling, and section surfaces to better match the latest approved concepts.
- Bumped page references to build 46.

## Build 47 update
- Renamed all user-facing references from Free Health Assessment to Free Vitality Assessment across the site and supporting story/CTA data.

## Build 48 — Homepage hero fidelity correction
- Corrected the Build 47 homepage hero, which had an unintended hard vertical split.
- Rebuilt the hero background as a smooth emerald-to-warm-cream transition.
- Added subtle gold arc detailing to more closely match the approved mockup.
- Kept the approved Justyn & Elle source image untouched; only CSS crop/position/fade behavior changed.
- Preserved the Free Vitality Assessment terminology from Build 47.

## Build 49 — Approved premium refinement pass
- Implemented the approved emerald / cream / gold visual upgrades across the reviewed sections.
- Homepage family teaser moved to the approved deep emerald treatment.
- Coaching comparison and coaching experience cards upgraded.
- Member-story section, next-chapter section, stories page hero/CTA, and older gradient areas polished.
- Webinar teaser rebuilt as a premium MacBook-style coming-soon section with a Netlify email notification form and limited-seating messaging.
- Free Vitality Assessment terminology retained throughout.
- IMPORTANT: every new Justyn & Elle placement in Build 49 uses the existing approved `founders-hero-approved.png` source asset directly. Their photo is not AI-generated, retouched, beautified, reconstructed, or otherwise altered. CSS only controls crop, size, and placement.

## Build 50 — post-49 approved refinement pass
- The user-supplied `Justyn & Elle(1).PNG` is now the single canonical founder photo source.
- `justyn-elle-approved-only.png`, `approved-hero-justyn-elle.png`, `founders-hero-approved.png`, and `justyn-elle-source.png` are byte-for-byte copies of that exact approved file. No facial, hair, body, clothing, or photo-content edits are applied.
- Homepage hero rebuilt with layered CSS/SVG-style backgrounds so the emerald-to-cream boundary curves toward Justyn's lower body and all gold arcs sit BEHIND the founders.
- Founders hero rebuilt as live HTML/CSS using the approved transparent photo over premium cream/emerald/gold layers.
- Founder belief/story/fun-facts/CTA/footer sections receive a premium Blueprint polish.
- Homepage family, member-story, coaching comparison, brand story, next chapter, webinar notification, stories CTA, and page background treatments retain and refine the approved post-49 direction.
- Free Vitality Assessment wording retained.


## Build 51 — approved visual correction pass
- Exact user-approved Justyn & Elle PNG copied byte-for-byte into the build and used for every founder placement.
- No edits, retouching, regeneration, filters, facial/body changes, or image effects are applied to that founder asset.
- Homepage hero upgraded to the approved deeper emerald + warm cream system with the curved boundary and gold arcs behind the founders.
- Homepage family section image vertically rebalanced and lifted into a premium gold-framed photo treatment.
- Meet ReVitalized / webinar founder images explicitly restored and made deployment-safe.
- Founders page hero, belief/story/facts/CTA sections polished into the same cream/emerald/gold system.
- FAQ, footer and family lower CTA areas upgraded to remove older washed-out gradient treatments.
