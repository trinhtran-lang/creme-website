# CRÈME — Website Brief (Phase A: Static Hero)

## Product and intent
Build a responsive **one-page ordering demo** for a fictional croissant-only bakery called CRÈME. Users browse eight pastries, check ingredients and allergens, add to basket, select pickup/delivery, or submit a demo wholesale/event inquiry. The purpose is to preview a polished product experience; no payments or live transactions.

## Content structure and behavior
### 1. Hero
- Full-width and essentially full-viewport; **no hero title, subtitle, buttons, section cards or captions**. Brand/navigation and basket appear in fixed top navigation.
- Background is a SINGLE fixed image (`assets/hero/hero-bg.jpg`) throughout the page, not separate images per section. Maintain photographic luminosity, never apply a page-wide dark overlay.
- Nav links: Home, Find Your Filling, Wholesale, About Us; basket count updates.

### 2. Find Your Filling
- Small section tag slides in from LEFT. No extra heading “The Croissant Collection”.
- Eight product cards in horizontal scroll-snap carousel with previous/next buttons on **outer left/right edges**.
- Each card uses its corresponding asset and exact product data in `docs/products.json`: flavor, small category tag, USD price, description; two actions Ingredients and Add to Cart.
- Ingredient details modal: complete list and allergen tags; close via X, overlay, Escape. Disclaimer: illustrative recipes and shared preparation may create cross-contact.
- Hover scale ~1.8% and light creamy outline/glow. The **top border of hovered cards must remain fully visible**, so include sufficient internal carousel padding.

### 3. Wholesale & Event Catering
- One section tag; slides in from RIGHT, together with two separate equal-weight translucent blocks.
- Wholesale: cafés, restaurants and retail supply; CTA “Request Wholesale Pricing”; dedicated inquiry form.
- Event Catering: meetings, launches, parties, gatherings; CTA “Plan Your Event”; dedicated inquiry form.
- Forms may collect name, email, business/event, estimated quantity, preferred date, location, notes; validation and clear demo-only acknowledgment; no backend or actual delivery claim.
- Both panels get same subtle hover scale/light border as product cards.

### 4. About CRÈME
- Section tag and single large panel slide in from LEFT.
- Left: fictional bakery story, hours (Daily 7:30 AM–6:30 PM), pickup notes, illustrative contact.
- Right: clearly **illustrative map** and pickup-location indication, labeled fictitious District 1, Ho Chi Minh City. Do not embed an actual place pin or claim the shop exists.

### 5. Footer
- “CRÈME · Demo bakery ordering experience” and restrained Privacy / Terms / Instagram placeholders; do not pretend links lead to real policy pages.

## Basket and ordering rules
- Open a side drawer on Add to Cart and Basket click.
- Product quantities can be increased/decreased; remove lines when quantity becomes zero; subtotal calculated in USD.
- **Pickup:** available with 1+ croissants.
- **Delivery:** available only with >=10 **total units** combined across flavors; a progress indicator shows remaining quantity. Before threshold, checkout action remains disabled for delivery.
- Date and preferred time required; address required for delivery. Order notes optional.
- Order action gives demo-only local confirmation; no submission/payment.

## Visual/interaction acceptance
- Follow `docs/brand-kit.md`. Warm cream text over warm-brown translucent card surfaces, with consistent 12px blur and clear readable contrast.
- No dark hero-wide scrim or film grain.
- Cards/images maintain fit and proportions; product photos visible.
- Reveal/hide on scroll (also when scrolling upward), generous spacing, no layout jumps or clipped hover borders.
- Keyboard navigation, meaningful alt text, labeled form inputs, focus states, Escape/outside close; accessible reduced-motion fallback.
- Mobile product swipe and usable modal/cart.

## Phase boundary
This first build uses only the **still hero image**. Do not integrate, reference, or generate a hero video until a later explicit user instruction. Treat the hero as a normal approved static background in Phase A.
