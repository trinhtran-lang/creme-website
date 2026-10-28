# CRÈME — Brand Kit (approved V4 design specification)

**Status:** design target for a new build; NOT an existing HTML/CSS implementation. Brand and shop are fictional.

## Identity
- Name/wordmark: **CRÈME** (accent important).
- Category: premium croissant-only bakery and demo online ordering.
- Mood: refined, warm, appetizing, editorial, cinematic, calm. Premium without being cold.
- Hero imagery: one realistic golden croissant floating in warm caramel-toned space, no website text baked into image.

## Colors
| Token | Hex | Use |
|---|---|---|
| Cream | `#F6ECDF` | primary light text |
| Butter | `#F0D2A1` | supporting accents |
| Tan | `#B8875F` | secondary accent |
| Caramel | `#8A5A38` | warm accents |
| Brown | `#3E2619` | dark text/brand surface |
| Deep | `#251710` | deeper contrast |

## Type
- Display / headings: **Cormorant Garamond**, serif, light/medium editorial styling.
- UI and body: **DM Sans**, sans-serif, restrained small uppercase labels where appropriate.
- Fallbacks must be defined if Google Fonts unavailable.

## Background and panel treatment
- One full-screen fixed hero background extending behind all sections, using `assets/hero/hero-bg.jpg` in Phase A.
- **No global dark scrim, grain or dark overlay on the hero.** Preserve image brightness and pastry details.
- Product panels: warm brown `rgba(62,35,22,0.68)` with `backdrop-filter: blur(12px)`.
- Wholesale and Event Catering: warm brown `rgba(62,35,22,0.70)` + 12px blur.
- About panel: warm brown `rgba(62,35,22,0.73)` + 12px blur.
- Border: light cream outline approximately `rgba(255,241,221,0.40)`, nuanced hover glow. Hover opacity can increase to `0.76` for readability.
- Product cards have gently rounded corners (~24px); sections/cards must not be enclosed in a heavy giant opaque background.
- Hover scale approx 1.018 on mouse/pointer devices; avoid clipping the top/side outline, preserve adequate carousel padding and overflow clearance.
- Navigation may have its own subtle local shading for white text legibility, but do not tint the entire image.

## Visual behavior
- Initial viewport only hero visual + top nav and basket; no overlaid hero text.
- Large vertical gaps between floating UI sections to showcase background.
- Product and About enter from left; Wholesale/Event enter from right; exit/re-enter while scrolling.
- Responsive desktop/mobile; avoid fixed widths that force horizontal page overflow.
