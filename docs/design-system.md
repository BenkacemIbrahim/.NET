# Slotly design system

Slotly should feel calm, precise, and trustworthy. The visual language combines
the clarity of a clinical tool with the polish of a modern scheduling product.
Interfaces use generous whitespace, restrained color, and clear hierarchy;
decoration never competes with appointment information.

## Color

The neutral scale is cool slate, with indigo as the product accent and emerald
reserved for successful or available states. Tenant booking pages replace the
accent with the tenant's validated primary color while preserving the same
contrast rules.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#f7f8fc` | `#090d18` | Page canvas |
| `foreground` | `#172033` | `#f4f7fb` | Primary text |
| `card` | `#ffffff` | `#111827` | Raised surfaces |
| `muted` | `#eef1f6` | `#1b2536` | Secondary surfaces |
| `muted-foreground` | `#667085` | `#9aa7ba` | Secondary text |
| `border` | `#dfe4ec` | `#293548` | Dividers and controls |
| `primary` | `#5145cd` | `#8b83f6` | Main actions and focus |
| `primary-foreground` | `#ffffff` | `#090d18` | Text on primary |
| `success` | `#07835d` | `#49d3a5` | Availability and success |
| `warning` | `#b54708` | `#fdb86b` | Caution and pending |
| `destructive` | `#c4324a` | `#fb7185` | Destructive actions |

Every text/background pair must meet WCAG AA. Focus rings use a two-pixel
primary outline with a two-pixel canvas offset. Color is always paired with an
icon, label, or shape for status communication.

## Typography

Inter Variable is bundled through `@fontsource-variable/inter`; no third-party
font request is made at runtime. The body uses 14–16 px text with 1.5 line
height. Display headings use 30–40 px, section headings 20–24 px, and labels
12–14 px. Headings use 620–700 weight and slightly negative tracking. Numeric
times use tabular figures so columns remain stable.

## Spacing, shape, and elevation

The spacing system follows a four-pixel base: 4, 8, 12, 16, 20, 24, 32, 40,
48, and 64 px. Dense administrative controls use 8–12 px internal gaps; booking
steps use 20–32 px to remain comfortable on touch screens.

Radii are 8 px for small controls, 12 px for inputs and buttons, 16 px for
cards, and 24 px for feature panels. Pills use a full radius only for statuses,
avatars, and compact filters. Shadows are subtle: level one separates cards,
level two is reserved for floating menus and dialogs, and level three for modal
overlays. Borders remain visible in both themes.

## Layout and responsive behavior

Mobile is the default. Customer booking uses a single column with a persistent
summary/action area and touch targets of at least 44 px. At 768 px it becomes a
two-panel flow. The admin shell collapses its sidebar below 1024 px and retains
breadcrumbs and the primary action in the top bar. Content width is capped at
1440 px; tables become cards or horizontal scroll regions rather than clipping.

## Components

- Buttons have primary, secondary, outline, ghost, and destructive variants.
  Only one primary action appears in a local decision area.
- Inputs have visible labels, optional help text, inline errors, and persistent
  focus treatment. Placeholder text never replaces a label.
- Cards use a border plus level-one shadow. Interactive cards gain a subtle
  border/translate transition without changing layout.
- Dialogs and menus use Radix primitives for focus trapping, dismissal, and
  keyboard navigation.
- Loading states preserve the final layout with low-contrast animated
  skeletons. Empty states explain why the area is empty and offer one next step.
- Toasts confirm background or cross-page actions; validation and destructive
  errors remain adjacent to the affected control.
- Motion lasts 140–220 ms with standard easing. `prefers-reduced-motion`
  disables nonessential animation.

## Booking-specific rules

Service and staff choices show duration, price, and identity before decorative
content. The date picker exposes full weekday names to assistive technology.
Slots are grouped by morning, afternoon, and evening, use the tenant time zone,
and show an unambiguous offset around daylight-saving transitions. Selection is
never indicated by color alone. A compact order summary remains visible before
the customer submits details or leaves for Stripe Checkout.
