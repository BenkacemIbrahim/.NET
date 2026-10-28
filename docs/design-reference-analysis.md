# Calendly reference analysis for Slotly

This document is the visual source of truth for the Slotly web redesign. It is based on Calendly's public site as reviewed on 28 October 2026, Calendly Help Center product imagery, and the supplied desktop calendar references. It records visual patterns only: Slotly keeps its own name, content, routes, data model, and workflows.

## 1. Overall character

Calendly combines a spacious marketing site with a denser product workspace. Both use the same foundations: deep ink-navy text, an electric blue action color, white surfaces, cool-gray borders, a professional sans-serif, and almost no decorative surface effects. Hierarchy comes from type scale, spacing, borders, and large color fields—not shadows or gradients.

Slotly adopts that system with three constraints from the brief:

- no gradients, decorative badges, glass effects, or box shadows;
- no copied Calendly copy, logos, illustrations, or proprietary assets;
- the existing login presentation remains visually unchanged, apart from inheriting the new global font.

## 2. Public landing page, section by section

### Navigation

- Full-width white bar with a centered `1200px` content rail and approximately `72px` height.
- Brand at the far left; product, solutions, resources, and pricing links form a calm center cluster.
- Text actions sit at the right, followed by one solid-blue rounded CTA.
- Desktop navigation is visually light: no enclosing card, no shadow, and only the page divider where required. Mobile reduces to brand, one CTA, and a menu control.

### Hero

- Two-column desktop grid, close to a 52/48 split, with a large text block and a product-oriented scheduling composition.
- Headline uses tight tracking, dark navy, and a wide-but-controlled line length. One phrase may use blue for emphasis, but there is no gradient text.
- Supporting copy is muted blue-gray and limited to two or three lines.
- Actions use a solid-blue primary button and a quiet text/outline secondary action.
- The visual side is a functional booking UI preview built from real interface primitives, not abstract AI artwork.
- Mobile stacks content, keeps the H1 prominent, and lets controls span the available width.

### Trust and social proof

- A narrow band follows the hero with a short credibility statement and a monochrome wordmark row.
- Slotly substitutes text-only customer categories and real product metrics; it does not reproduce third-party logos.

### Feature narrative

- Alternating two-column sections explain the flow: publish services, control availability, and manage bookings.
- Each section has a small blue eyebrow, a strong navy heading, concise supporting copy, and two or three proof points.
- Product previews use white panels with a `1px` cool-gray border and moderate `12–16px` radii.
- Section spacing is generous (`96–128px` desktop, `64–80px` mobile) so the page reads as a sequence rather than a card wall.

### Workflow / benefits band

- A pale blue or navy full-width section changes rhythm without a gradient.
- Three simple numbered columns communicate the process. Dividers and alignment create structure; there are no floating icon bubbles.

### Pricing

- Plans appear in an aligned grid with equal-height cards, clear price hierarchy, compact feature lists, and one recommended treatment expressed through border/color—not a decorative badge.
- Slotly presents product fit rather than invented billing commitments because pricing is not currently part of the application behavior.

### Closing CTA and footer

- The closing CTA uses a solid navy field, white type, and a blue button.
- Footer is a spacious multi-column directory with a brand summary, product links, company/help links, and a restrained legal row.

## 3. Authenticated product references

Calendly's current product navigation groups scheduling, availability, meetings/calendar, contacts, automations, integrations, analytics, and settings in a persistent left rail. The reference screenshots reinforce the following patterns:

- `240–260px` white sidebar with a subtle right border;
- compact navigation rows (`40–44px`), small line icons, and a pale-blue active state;
- a slim top bar for page context, global creation, search/help, and profile controls;
- content on a very light cool-gray canvas with a `1200–1440px` maximum working width;
- white panels separated by borders, not elevation;
- page headings around `28–32px`, section headings around `18–22px`, and dense `14px` product copy;
- rectangular controls with `8px` radii; rounded buttons are comfortable rather than exaggerated capsules;
- event/service cards expose title, duration, availability, link/action controls, and a quiet color marker;
- bookings use filter controls above a bordered list/table, with status conveyed by text and small dots;
- availability is a schedule editor: weekday rows, one or more time ranges, copy actions, and date overrides;
- calendar views use crisp grid lines, a clear current-time/selected-date accent, and compact event blocks.

## 4. Public booking flow

The clearest Calendly reference is a centered scheduling surface that expands across three information zones:

1. Event summary: organization/host, service title, duration, location, and time zone.
2. Month calendar: month navigation, weekday labels, available dates, and a strong blue selected-date circle.
3. Time list: selected date followed by stacked bordered time buttons; selecting a time reveals the confirm/next action.

The details form replaces the calendar/time area while retaining the event summary. Confirmation keeps the same centered frame and presents an unambiguous success state plus the booking details. On mobile, these zones become a linear flow with a simple header and touch targets at least `44px` high.

## 5. Supplied image observations

The supplied calendar dashboards are useful for density and calendar composition, even though Slotly follows Calendly's blue/navy identity:

- day/week/month segmented views sit directly above the grid;
- schedule cards align to a time axis and use thin colored leading borders;
- staff context belongs in the grid header rather than in oversized cards;
- month cells use subtle dividers and compact appointment blocks;
- side panels can hold event details without navigating away;
- controls remain small and direct, while whitespace is concentrated around page-level groups.

The lavender backgrounds, purple brand, shadows, and ornamental canvas treatment in those images are explicitly excluded.

## 6. Responsive behavior

- `390px`: single-column landing flow; mobile menu; app sidebar becomes a drawer; tables become labeled stacked rows; booking summary precedes date/time selection; actions remain full-width where useful.
- `768–1023px`: two-column marketing areas may stack; app content retains compact cards; booking date and time can share a row when space allows.
- `1440px`: use centered rails with intentional whitespace. The app shell consumes the viewport while inner content remains capped for readability.

## 7. Accessibility and motion

- WCAG AA contrast is required for body text and controls.
- Keyboard focus uses a visible two-pixel blue ring; this is the only glow-like visual allowed.
- Every icon-only control has an accessible name.
- Motion is limited to short opacity/position transitions and respects `prefers-reduced-motion`.
- Semantic headings, landmarks, labels, table headers, and status text are retained even where icons are present.

## 8. Implementation decisions

- Typeface: **Inter Variable**, self-hosted with `@fontsource-variable/inter`. Its neutral proportions are closer to Calendly's product and marketing typography than the existing geometric Plus Jakarta Sans.
- Icons: **Lucide React**, already present and suitable for the thin, consistent product icon language.
- Calendar: retain **FullCalendar React** because it already drives working calendar behavior; restyle it to the new tokens.
- Primitives: retain the existing Radix packages where used for accessible dialogs, selects, tabs, and menus.
- Animation: remove Motion if no final screen needs it; CSS transitions cover the restrained motion language.

## 9. Sources reviewed

- Calendly public home page and product navigation (`calendly.com`).
- Calendly Help Center: Scheduling, availability overview, event-type management, real-time booking, mobile overview, and admin dashboard.
- Calendly product navigation release notes and official navigation/event-type redesign article.
- Supplied day, week, month, and event-detail calendar images.
