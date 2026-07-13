# Cursor spotlight and marketing backgrounds

**Date:** 2026-07-13

## Decision

Use one restrained cursor-following spotlight across the marketing experience. Remove the remaining graph-paper backgrounds from Projects and Marketplace so the homepage and ecosystem pages share the same pattern-free atmosphere.

## Behaviour

- the spotlight is part of each broad atmospheric background, not attached to cards;
- a large, low-opacity mint glow follows the pointer with gentle interpolation rather than snapping to it;
- movement is driven by one shared pair of CSS custom properties;
- the animation runs only after pointer movement and stops once the glow reaches its target;
- pointer exit returns the glow slowly to its neutral position;
- touch and coarse-pointer devices use the existing static atmosphere;
- `prefers-reduced-motion: reduce` disables pointer tracking and keeps the static atmosphere;
- the effect never captures clicks, changes layout, or alters text contrast.

## Page scope

- homepage hero, ecosystem, and download sections;
- Projects (`/roadmap`);
- Marketplace index (`/marketplace`);
- Marketplace detail pages keep their current pattern-free treatment.

Documentation pages retain their Starlight background and do not receive the cursor effect.

## Acceptance

- no `bg-grid` layer renders on the homepage, Projects, or Marketplace index;
- the spotlight visibly trails the pointer on a fine-pointer desktop browser;
- no tracking listener is installed for coarse pointer or reduced motion;
- desktop and mobile layouts retain their current width and readability;
- the production build and marketing background contract pass.
