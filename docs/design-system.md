# Slotly design system

Slotly's interface is a flat, scheduling-first system inspired by the clarity and polish of Calendly while remaining recognizably Slotly. All application screens use the tokens below; authentication keeps its existing component composition.

## Principles

1. **Scheduling first.** Dates, time zones, durations, availability, and booking state receive the strongest visual hierarchy.
2. **Flat surfaces.** Use background changes and `1px` borders. Do not use box shadows, drop shadows, gradients, glass, or blur.
3. **Calm density.** Marketing pages use generous space; the product uses compact controls and readable working areas.
4. **One accent.** Blue indicates primary actions, links, selection, and focus. Navy carries headlines and high-contrast sections.
5. **Accessible by default.** Minimum `44px` touch targets, visible focus, semantic labels, and AA contrast.

## Foundations

### Typography

- Family: `Inter Variable`, stored in the application bundle through `@fontsource-variable/inter`.
- Display: `64/68`, weight 700, tracking `-0.04em`.
- Page title: `30/38`, weight 700, tracking `-0.025em`.
- Section title: `20/28`, weight 650.
- Card title: `16/24`, weight 600.
- Body: `15/24`, weight 400.
- Product body: `14/20`, weight 400–500.
- Metadata: `12/18`, weight 500.
- Dates, times, metrics, and prices use tabular figures.

### Color tokens

| Token | Light | Dark | Use |
|---|---:|---:|---|
| `background` | `#F8FAFC` | `#0B1620` | App canvas |
| `card` | `#FFFFFF` | `#122331` | Primary surface |
| `foreground` | `#0B3558` | `#F7FAFC` | Headings and primary text |
| `body` | `#476788` | `#B9C9D6` | Supporting copy |
| `muted` | `#F2F6F9` | `#19303F` | Quiet control/background |
| `border` | `#D9E2EA` | `#2B4658` | All structural lines |
| `primary` | `#006BFF` | `#4D9BFF` | CTA, selection, link, focus |
| `primary-hover` | `#0056D6` | `#74B1FF` | Hover state |
| `navy` | `#0B3558` | `#07121B` | Marketing contrast surface |
| `success` | `#18794E` | `#46C98B` | Confirmed/available |
| `warning` | `#9A6700` | `#F3BA63` | Pending/attention |
| `danger` | `#C83232` | `#FF7A7A` | Destructive/error |

Tenant branding may replace `primary` on public booking pages only. Contrast must remain AA.

### Spacing and layout

- Base unit: `4px`.
- Marketing content rail: `1200px`; product content rail: `1440px`.
- Marketing section padding: `112px` desktop, `72px` mobile.
- App page padding: `32px` desktop, `20px` tablet, `16px` mobile.
- App sidebar: `248px` expanded and `72px` collapsed.
- Top bar: `64px`.

### Geometry

- `6px`: compact calendar/event items.
- `8px`: buttons, inputs, nav rows, table controls.
- `12px`: cards, dialogs, booking surface.
- `16px`: large marketing/product previews only.
- `9999px`: avatars, selected calendar dates, status dots, and true pill controls only.

## Components

### Buttons

- Primary: blue, white label, `44px` height, `8px` radius, `16–20px` horizontal padding.
- Secondary: white/card background, navy label, `1px` border.
- Tertiary: transparent, blue or body-colored label.
- Destructive: red text/border by default; solid red only for final confirmation.
- No button shadow. Disabled controls retain readable text and clearly reduced contrast.

### Inputs and selects

- `44px` minimum height, `8px` radius, white/card surface, `1px` border.
- Labels are visible and sit `6px` above the field.
- Focus changes the border to blue and adds a two-pixel external focus ring.
- Errors use red border plus plain helper text; color is never the sole signal.

### Cards and panels

- White/card background, `1px` border, `12px` radius.
- Typical product padding: `20–24px`; marketing preview padding: `24–32px`.
- Avoid nested card stacks. Use dividers or background bands for internal grouping.

### Navigation

- Sidebar rows: `40px`, `8px` radius, `14px` weight 500.
- Active row: pale blue background, blue icon and text, optional blue leading rule.
- Section labels: `11px`, uppercase, body color, `0.08em` tracking.
- Mobile sidebar is a modal drawer with a backdrop and explicit close action.

### Tables and lists

- Header uses muted background, `12px` semibold labels, and a bottom border.
- Rows are `52–60px`, separated by lines; hover uses the muted background.
- Mobile transforms each row into a bordered information group with visible field labels.
- Status uses a `6px` dot plus text, never a large badge.

### Calendar

- Grid lines use `border`; headers use `muted`.
- Today receives a pale blue cell and blue date label.
- Events use a pale blue surface, blue leading border, navy/blue text, and `6px` radius.
- View switcher uses an enclosed segmented control; selected view is white/card with a border.

### Public booking surface

- Maximum width `1060px`, centered on the page.
- Desktop columns: `280px minmax(360px, 1fr) 260px` when a time list is visible.
- Summary column uses a right divider; time column uses a left divider.
- Date cells are circular only when selected/available; time options are rectangular outline buttons.
- Details and confirmation reuse the same frame so the journey feels continuous.

## Prohibited patterns

- Gradients, shadows, blurred backgrounds, glass effects, 3D art, decorative blobs, emoji, floating decorative badges, oversized pill cards, or arbitrary accent colors.
- Copied Calendly wording, logos, screenshots, or customer marks.
- Placeholder content, fake production data paths, inaccessible icon-only controls, or hover-only information.
