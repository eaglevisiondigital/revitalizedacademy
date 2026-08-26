# ReVitalized Academy Website — Production Build 1

Static, GitHub-ready, Netlify-ready website based on the approved ReVitalized Academy homepage mockup.

## Included
- `index.html` — production homepage
- `consult.html` — free consultation form
- `enroll.html` — Phase One enrollment form with placeholders for final approved questions
- `css/styles.css` — responsive design system
- `js/app.js` — mobile navigation
- `assets/images/` — approved/reference assets used in this build

## Locked visual direction
- Approved mockup is the source of truth.
- Header and hero follow the approved composition as closely as possible.
- ReVitalized Academy remains the focal brand.
- Coaching is the primary conversion focus.
- Longevity section is now labeled **Longevity Matrix**.
- ReFuel appears only as a secondary **Coming 2027** teaser with no pricing.
- Future ecosystem is teased without implying clients should wait.

## Forms
Both forms use Netlify Forms:
- `consultation`
- `enrollment`

After deployment, in Netlify configure **Form submission notifications** to:

`contact@revitalizedacademy.com`

This is required because notification routing is configured in Netlify, not hard-coded into static HTML.

## Future integrations
The forms are intentionally front-end stable so the submission endpoint can later be swapped to:
- ReVitalized CRM
- custom back office
- client portal
- enrollment workflow
- Authorize.Net/payment workflow

## Video placeholders
Three placeholders are included and ready for later YouTube embeds:
1. Coaching Explanation
2. Longevity Matrix Explanation
3. Program Overview / How Coaching Works

## Existing testimonial links used
- Brandy & Mark — https://youtu.be/UDwJV-gW7iI2
- Julien — https://youtu.be/6so5sXskgXA3
- Watt Family — https://youtu.be/9gDp42pU5S86

The remaining supplied testimonial links can be added to a dedicated Stories page in the next build.

## Deploy to Netlify
1. Push this folder to a GitHub repository.
2. Create a new Netlify site from the repository.
3. No build command is required.
4. Publish directory: repository root.
5. Configure Netlify form notifications to `contact@revitalizedacademy.com`.
