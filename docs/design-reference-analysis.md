# Reference Images Design Analysis

This document provides a comprehensive visual and architectural breakdown of the reference dashboard interfaces (YowTrip, Medicore Clinical Dashboard, and MTicket Event Analytics). This analysis establishes the design foundation, tokens, and component guidelines for the UI/UX overhaul of Slotly.

---

## 1. Executive Summary & Aesthetic Identity

The target aesthetic is a **modern, high-precision, border-defined dashboard UI** tailored for scheduling, clinical, and operational workflows. It balances:
- **Calm, clinical precision**: High whitespace, crisp contrast, pure white surfaces floating over a subtle soft-gray canvas.
- **Architectural depth through borders and contrast**: Zero decorative dropshadows, zero gradients, zero blur or glassmorphism. Visual hierarchy is achieved exclusively through 1px crisp borders (`#E4E7EC`), surface color switches (pure white vs soft gray vs deep midnight slate), and intentional typographic weight.
- **Pill and rounded-card geometry**: Outer panels and cards feature generous `16px-20px` (`rounded-2xl`) corners; interactive filters, segmented tab navigations, and primary call-to-actions employ full `9999px` (`rounded-full`) pill geometry.
- **Operational density & instant scannability**: Tabular numbers for all financial figures, clock times, and metrics. Quiet, dot-based or plain-text status indicators rather than bulky colorful badges.

---

## 2. Layout & Shell Architecture

### 2.1 Workspace Shell
- **Canvas Background**: `#F4F5F7` / `#F5F6F8` (a soft, neutral light-gray canvas).
- **Surface Elevation**: Main content areas and dashboards are composed of white floating cards (`#FFFFFF`) with uniform 1px solid borders (`#E4E7EC`).
- **Sidebar (YowTrip style)**:
  - Fixed width: `260px`, white background (`#FFFFFF`), right border `1px solid #E4E7EC`.
  - Brand header: Clean typographic wordmark with a subtle geometric icon glyph.
  - Quick Search: Integrated pill or rounded input (`h-10`, `rounded-xl`, `border #E4E7EC`) with search icon and keyboard shortcut keycap (`⌘K`).
  - Navigation Sections: Categorized under quiet uppercase section labels (`MAIN`, `WORKSPACE`, `CONFIGURATION`) in `11px`, `font-semibold`, tracking `0.05em`, color `#98A2B3`.
  - Navigation Items: `h-10`, `rounded-xl` or `rounded-lg`, `px-3`, text `14px`, weight `500`. 
    - Inactive: `#475467`, hover background `#F8F9FB`.
    - Active: Light blue-tinted background `#EFF4FE`, active text `#2563EB`, stroke width `1.75px` on line icons.
  - User Profile Widget (Bottom of Sidebar): Floating card/pill (`rounded-xl`, `p-2.5`, `border #EAECF0`), displaying user avatar, name (`13px font-semibold`), email (`11px text-muted-foreground`), and disclosure chevron.

### 2.2 Top Header & Navigation (Medicore / YowTrip style)
- **Top Bar**: Transparent or pure white, `h-16`, flex row between breadcrumb/page title and context controls.
- **Segmented Pill Navigation Bar**:
  - Center or page header navigation using pill containers (`rounded-full bg-[#F2F4F7] p-1 border border-[#EAECF0]`).
  - Active tab: Solid vibrant blue pill (`bg-[#2563EB] text-white`) or deep midnight slate (`bg-[#0F172A] text-white`), `px-4 py-1.5 rounded-full text-sm font-medium`.
  - Inactive tabs: Transparent background, text `#475467`, hover `#101828`.
- **Top Actions**:
  - Date Range / Period selector: Pill button with calendar icon, date string (`24 Jul - 30 Jul 2026`), border `#E4E7EC`, background `#FFFFFF`.
  - Action buttons: High-contrast pill button (`#0F172A` with white text) or electric blue primary pill (`#2563EB`).
  - Circular utility buttons (`size-10 rounded-full border border-[#E4E7EC] bg-white`).

---

## 3. Typography & Numerals

### 3.1 Typeface Selection
- **Family**: Plus Jakarta Sans / Inter Variable (clean grotesque / neo-grotesque with wide geometric aperture, open counters, and high legibility at micro sizes).
- **Self-Hosted**: Packaged locally with zero runtime external HTTP requests.
- **Tabular Figures**: Every numeric data point (prices, slots, dates, percentages, phone numbers) strictly utilizes `tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent layout shifts and maintain vertical alignment.

### 3.2 Scale & Hierarchy
| Level | Font Size | Line Height | Weight | Tracking | Color |
|---|---|---|---|---|---|
| Display / Page Title | `26px - 28px` (`text-2xl` / `text-3xl`) | `32px` | `700` (Bold) | `-0.025em` | `#101828` |
| Section Header | `18px - 20px` (`text-lg` / `text-xl`) | `26px` | `600` (Semi-bold) | `-0.015em` | `#101828` |
| Metric Value | `28px - 32px` (`text-3xl`) | `36px` | `700` (Bold, Tabular) | `-0.02em` | `#101828` (or `#FFFFFF` on dark card) |
| Card Subtitle / Label | `14px` (`text-sm`) | `20px` | `500` (Medium) | `0` | `#667085` |
| Micro Label / Category | `11px - 12px` (`text-xs`) | `16px` | `600` (Semi-bold) | `+0.04em` (Uppercase) | `#98A2B3` |
| Table Header | `12px` (`text-xs`) | `16px` | `600` (Semi-bold) | `+0.02em` | `#475467` |
| Table Cell / Body | `14px` (`text-sm`) | `20px` | `400` / `500` | `0` | `#101828` |

---

## 4. Color Palette (Exact Hex Reference)

### 4.1 Light Mode
- **Canvas Background**: `#F4F5F7`
- **Surface / Card Background**: `#FFFFFF`
- **Secondary Surface (Muted / Track)**: `#F2F4F7`
- **Borders & Dividers**: `#E4E7EC` (Subtle 1px border)
- **Active Border / Control Ring**: `#2563EB`
- **Primary Accent (Electric Royal Blue)**: `#2563EB` (Hover: `#1D4ED8`, Active: `#1E40AF`)
- **Primary Foreground**: `#FFFFFF`
- **Secondary Accent (Deep Midnight Slate)**: `#0F172A` (Hover: `#1E293B`)
- **Text Primary (Foreground)**: `#101828`
- **Text Secondary (Muted Foreground)**: `#667085`
- **Text Tertiary / Disabled**: `#98A2B3`
- **Success (Emerald / Mint)**: `#079455` (Soft background: `#ECFDF3`, Text: `#067647`)
- **Warning / Accent (Warm Tangerine)**: `#F79009` (High-impact badge/bar: `#FF5A1F`)
- **Danger / Destructive (Crimson)**: `#D92D20` (Soft background: `#FEF3F2`, Text: `#B42318`)

### 4.2 Dark Mode
- **Canvas Background**: `#0B0F19`
- **Surface / Card Background**: `#111827`
- **Secondary Surface (Muted)**: `#1F2937`
- **Borders & Dividers**: `#1F2937` (1px subtle border)
- **Primary Accent**: `#3B82F6` (Hover: `#2563EB`)
- **Primary Foreground**: `#FFFFFF`
- **Text Primary**: `#F8FAFC`
- **Text Secondary**: `#94A3B8`
- **Text Tertiary**: `#64748B`
- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Danger**: `#EF4444`

---

## 5. Spacing, Borders & Shapes

- **Base Spacing**: 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48px).
- **Corner Radii**:
  - `rounded-full` (`9999px`): Filter pills, navigation tabs, primary CTA buttons, avatar circles, status dots.
  - `rounded-2xl` (`16px - 20px`): Main content cards, metric panels, dashboard widgets, modal containers.
  - `rounded-xl` (`12px`): Input fields, select dropdowns, time slot buttons, table wrappers.
  - `rounded-lg` (`8px`): Sub-controls, popovers, dropdown menu items.
- **Borders**:
  - Exact 1px solid `#E4E7EC` (Light) / `#1F2937` (Dark).
  - No shadows. No `box-shadow` or `drop-shadow` classes.
  - Focus state: `outline-none ring-2 ring-primary ring-offset-2 ring-offset-background`.

---

## 6. Component-Specific Design Analysis

### 6.1 Metric / Stat Cards
- Two key visual treatments from references:
  1. **Standard White Card**: Pure `#FFFFFF` background, 1px `#E4E7EC` border, `rounded-2xl`, `p-5`. Stat title in `#667085`, big bold number in `#101828` (`text-3xl font-bold tabular-nums`), optional linear progress track with subtle rounded fill or trend percentage (`+12%`).
  2. **High-Impact Highlight Card (Medicore Blue / MTicket Slate)**: High-contrast card (`bg-[#2563EB]` or `bg-[#0F172A] text-white`), highlighting key operational KPIs (e.g., active bookings, revenue, or patient/customer focus).

### 6.2 Calendar Widget & Booking Slots
- **Mini Calendar (Medicore style)**:
  - Header: Month and year in clean semi-bold text with subtle previous/next arrow icons.
  - Days of Week: `MON, TUE, WED, THU, FRI, SAT, SUN` in `10px font-semibold text-[#98A2B3]`.
  - Date Grid: Clean circle geometry. Active/selected date is an exact solid blue circle (`bg-[#2563EB] text-white`). Today/urgent date has a soft rose highlight. Other dates are clean text.
- **Time Slots Grid**:
  - Clean pill or `rounded-xl` buttons (`h-10 px-3.5 border border-[#E4E7EC] bg-white text-sm font-medium tabular-nums`).
  - Active slot: `border-[#2563EB] bg-[#EFF4FE] text-[#2563EB] font-semibold`.

### 6.3 Buttons & Actions
- **Primary CTA**: Pill-shaped button (`rounded-full h-11 px-6 bg-[#2563EB] text-white font-medium hover:bg-[#1D4ED8] transition-colors`).
- **Secondary / Outline**: Pill or `rounded-xl` button (`border border-[#E4E7EC] bg-white text-[#344054] hover:bg-[#F9FAFB]`).
- **Dark Pill Action (Share/Apply)**: High contrast `bg-[#0F172A] text-white rounded-full h-10 px-5 hover:bg-[#1E293B]`.
- **Icon Button**: Circular `size-10 rounded-full border border-[#E4E7EC] bg-white flex items-center justify-center hover:bg-[#F9FAFB]`.

### 6.4 Forms & Inputs
- **Inputs & Selects**: Height `42px`, `rounded-xl`, border `1px solid #E4E7EC`, background `#FFFFFF`, text `#101828`, placeholder `#98A2B3`.
- **Labels**: Clean `13px font-medium text-[#344054] mb-1.5 block`.
- **Errors**: Plain text `#D92D20` in `12px font-medium mt-1`, input border `#FDA29B`. No dramatic animation or glowing borders.

### 6.5 Tables & Lists
- **Container**: `rounded-2xl border border-[#E4E7EC] overflow-hidden bg-white`.
- **Header**: `bg-[#F9FAFB] border-b border-[#E4E7EC] text-xs font-semibold uppercase tracking-wider text-[#475467] px-4 py-3`.
- **Rows**: `border-b border-[#F2F4F7] hover:bg-[#F8F9FA] transition-colors px-4 py-3.5 text-sm`.
- **Status Indicator**: Quiet indicator (colored 6px solid dot with clean label e.g., Confirmed, Pending, Cancelled) rather than bulky pills.

### 6.6 Empty, Loading & Error States
- **Loading**: Clean, muted skeleton pulses (`bg-[#F2F4F7] rounded-xl animate-pulse`). No jagged layout shifts.
- **Empty States**: Bordered dashed or solid white container (`rounded-2xl border border-[#E4E7EC] p-8 text-center`). Simple line icon in a clean rounded square, clear human title, short 1-line guidance, single primary pill action button.
- **Errors**: Non-intrusive alert box with 1px border `#FECDCA`, background `#FEF3F2`, text `#B42318`, clear action to retry.

---

## 7. Migration Plan for Slotly UI

1. **Tokens & CSS**: Set up Plus Jakarta Sans font, Tailwind theme tokens matching exact hexes, zero-shadow utility overrides.
2. **App Shell**: Redesign sidebar with categorized navigation, user footer pill, clean wordmark, top bar with segmented pill tabs.
3. **Admin Dashboard**: Implement Medicore/YowTrip-inspired modular card grid (Key Metrics, Today's Appointments with mini calendar, Recent Bookings).
4. **Calendar Page**: Full-screen calendar with clean 1px grid lines and pill appointment markers.
5. **Bookings, Services, Staff, Schedule & Settings**: Apply clean table, modal, and card styling.
6. **Public Booking**: Clean customer appointment flow with pill steps, interactive calendar, tabular time slots, and high-contrast summary checkout.
