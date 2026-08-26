# ReVitalized Academy — Production Website Build 2

This build is the ReVitalized Academy corporate/coaching website, not the webinar landing page.

## Locked strategy
- ReVitalized Academy and personalized coaching are the primary focus.
- Approved homepage mockup remains the visual source of truth.
- "Longevity Matrix" is the current name of the roadmap framework section.
- Founder’s Webinar appears only as a small "notify me" teaser; registration/payment are not live yet.
- ReFuel is teased as Coming 2027 with no pricing or multi-pack presentation.
- Future ecosystem tools are teased without suggesting visitors should wait to begin.
- Main conversion paths are Start Enrollment and Schedule a Free Consultation.
- All website form notifications should be configured in Netlify to deliver to contact@revitalizedacademy.com.

## Files
- `index.html` — Academy-first homepage
- `stories.html` — complete 12-video client story library
- `consult.html` — Phase One free consultation form
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
- Primary secondary CTA is now “Free Health Assessment.”


## Build 5 hero refinement
- Uses the exact approved Justyn & Elle hero artwork without altering faces.
- Hero artwork is now scaled with `object-fit: contain` so heads are never cropped and proportions stay closer to the approved mockup.
- Preserves Build 4 headline and CTA sizing.
- Replaces the header logo asset with the full approved transparent LightBG logo.
