# Slotly Design System

Slotly is a high-precision, border-defined multi-tenant scheduling and clinical operations platform. Inspired directly by modern high-density operational and healthcare dashboards (Medicore, YowTrip, MTicket), the visual language prioritizes architectural clarity, instant data scanning, and generous whitespace over decorative fluff.

---

## 1. Core Principles

1. **Hierarchy Through Borders & Contrast**: No box-shadows, no blur/glassmorphism, and no background gradient washes. Depth and hierarchy are achieved exclusively through crisp 1px borders (`#E4E7EC`), pure white cards on a neutral light-gray canvas (`#F4F5F7`), and deliberate typographic weighting.
2. **Clinical & Operational Scannability**: Numeric values (appointment times, prices, slot counts, statistics) strictly employ tabular figures (`tabular-nums`) to prevent horizontal jitter. Statuses are indicated quietly via minimal 6px colored dots or clear textual labels rather than bulky badges.
3. **Pill & Rounded Geometry**: Main panels and dashboard cards use generous `16px-20px` (`rounded-2xl`) corners. Navigation items, interactive filters, segmented tab bars, and primary CTAs use full `9999px` (`rounded-full`) pill geometry.
4. **Human, Plain-Spoken Microcopy**: Zero robotic, marketing, or pseudo-magical text. Concise, functional labels and instructional guidance.
5. **Strict Zero-Decoration Rule**: No AI-generated artwork, 3D shapes, or decorative sparkles. Icons use Lucide with a consistent `1.75px` stroke and direct semantic intent.

---

## 2. Color Palette

All color pairings exceed WCAG AA contrast standards (minimum 4.5:1 for body copy and 3.0:1 for large display text).

| Token | Light Mode (Hex) | Dark Mode (Hex) | Operational Purpose |
|---|---|---|---|
| `background` | `#F4F5F7` | `#0A0C10` | Application canvas backdrop |
| `foreground` | `#101828` | `#F8FAFC` | High-contrast primary copy and headings |
| `card` | `#FFFFFF` | `#151821` | Floating operational surface / card panel |
| `card-foreground`| `#101828` | `#F8FAFC` | Text on card surfaces |
| `muted` | `#F2F4F7` | `#1C202C` | Secondary tracks, subtle tags, inactive tabs |
| `muted-foreground` | `#667085` | `#94A3B8` | Metadata, secondary labels, helper captions |
| `border` | `#E4E7EC` | `#2B3142` | Crisp 1px structural dividing lines |
| `input` | `#E4E7EC` | `#2B3142` | Input field borders and inactive control boundaries |
| `primary` | `#2563EB` | `#3B82F6` | Vibrant Royal Blue: primary CTA, active pill tabs |
| `primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary elements |
| `accent` | `#EFF4FE` | `#1C2740` | Active sidebar nav highlight, selected slot surface |
| `accent-foreground` | `#2563EB` | `#60A5FA` | Text on accent surfaces |
| `dark-surface` | `#020617` | `#030712` | High-impact dark metric card & secondary action pills |
| `dark-surface-foreground` | `#FFFFFF` | `#FFFFFF` | Text on dark metric cards |
| `success` | `#079455` | `#10B981` | Confirmed bookings, available slots, positive delta |
| `warning` | `#F79009` | `#F59E0B` | Pending approvals, temporary locks, alerts |
| `destructive` | `#D92D20` | `#EF4444` | Cancelled appointments, destructive dialogs |
| `ring` | `#2563EB` | `#3B82F6` | Accessible keyboard focus outline |

---

## 3. Typography & Numerals

- **Typeface**: `Plus Jakarta Sans Variable` (self-hosted locally via `@fontsource-variable/plus-jakarta-sans`). Zero external runtime network requests.
- **Tabular Figures**: Every numeric data point (prices, times, dates, percentages, phone numbers) must use `tabular-nums`.

| Element | Size | Weight | Tracking | Line Height |
|---|---|---|---|---|
| H1 / Page Heading | `28px` (`text-2xl` / `text-3xl`) | `700` (Bold) | `-0.025em` | `1.2` |
| H2 / Section Title | `20px` (`text-xl`) | `600` (Semi-bold) | `-0.02em` | `1.3` |
| H3 / Card Title | `16px` (`text-base`) | `600` (Semi-bold) | `-0.01em` | `1.4` |
| Metric Hero Value | `30px` (`text-3xl`) | `700` (Bold, Tabular) | `-0.02em` | `1.1` |
| Body / Table Rows | `14px` (`text-sm`) | `400` / `500` | `0` | `1.5` |
| Labels / Metadata | `13px` (`text-xs` / `text-sm`) | `500` (Medium) | `0` | `1.4` |
| Micro / Category Caps | `11px` (`text-[11px]`) | `600` (Semi-bold) | `+0.05em` | `1.2` |

---

## 4. Spacing, Borders & Shapes

- **Borders**: Strictly 1px solid `border-border`. Depth is never conveyed through `box-shadow`.
- **Corner Radii**:
  - `rounded-full` (`9999px`): Filter pills, navigation segmented bars, primary CTA buttons, date circle highlights, status dots.
  - `rounded-2xl` (`1.25rem` / `20px`): Outer page cards, dashboard widgets, modal dialog windows.
  - `rounded-xl` (`0.75rem` / `12px`): Form inputs, select dropdowns, appointment time slots.
  - `rounded-lg` (`0.5rem` / `8px`): Sub-controls, menu items, tooltips.
- **Elevation**:
  - Zero `box-shadow`.
  - Accessible focus rings: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.

---

## 5. Component Standards

### 5.1 App Shell
- **Sidebar**: Fixed width `260px`, white background (`bg-card`), right border `border-r border-border`. Categorized with quiet uppercase section headers (`MAIN`, `WORKSPACE`, `ACCOUNT`). Active navigation item has light blue accent background (`bg-accent text-accent-foreground font-semibold rounded-xl`).
- **User Footer**: Profile card at the bottom of the sidebar with user avatar, name, email, and clean options trigger.
- **Top Header**: Breadcrumb or section title on the left; segmented pill navigation or action buttons on the right.

### 5.2 Buttons
- **Primary**: Pill-shaped (`rounded-full h-11 px-6 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors`).
- **Dark Pill (Action)**: Pill-shaped (`rounded-full h-10 px-5 bg-dark-surface text-dark-surface-foreground font-medium hover:bg-dark-surface/90`).
- **Secondary / Outline**: Pill or rounded-xl (`rounded-xl h-10 px-4 border border-border bg-card text-foreground hover:bg-muted`).
- **Ghost**: (`rounded-xl h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted`).

### 5.3 Inputs & Forms
- Text inputs and dropdown triggers have `h-11 rounded-xl border border-input bg-card px-3.5 text-sm`.
- Visible labels in `13px font-medium text-foreground`.
- Inline validation errors in `12px font-medium text-destructive`.

### 5.4 Metric & Operational Cards
- Clean white card (`rounded-2xl border border-border bg-card p-5`).
- High-impact dark metric card (`rounded-2xl bg-dark-surface text-dark-surface-foreground p-5`).
- High-contrast electric blue highlight card (`rounded-2xl bg-primary text-primary-foreground p-5`).

### 5.5 Mini Calendar & Availability Slots
- Calendar dates in a clean grid; today or selected date highlighted with a crisp solid circle (`bg-primary text-white rounded-full size-8 flex items-center justify-center font-semibold`).
- Time slot buttons formatted as tabular strings (`10:00 AM`), `h-10 rounded-xl border border-border bg-card hover:border-primary/50 text-sm font-medium tabular-nums`.

### 5.6 Status Indicators
- Quiet 6px solid dots paired with plain text labels:
  - Confirmed: Green dot (`bg-success`) + "Confirmed"
  - Pending: Amber dot (`bg-warning`) + "Pending"
  - Cancelled: Slate/Red dot (`bg-muted-foreground`) + "Cancelled"
