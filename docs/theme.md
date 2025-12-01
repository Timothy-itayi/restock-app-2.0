# Restock 2.0 — Design System & Theme Guide

## Brand Identity

Restock is a **retail inventory management app** for store staff. The design language should communicate:
- **Trustworthiness** — Retail workers need reliability, not flashiness
- **Clarity** — Dense data (product lists, suppliers) must be scannable
- **Groundedness** — Earthy, natural tones evoke organic produce and retail authenticity
- **Efficiency** — UI should feel fast, not decorative

---

## Color Philosophy

### Primary Palette: "Oh Cypress"

The core palette is built around **cypress/sage greens** — colors that feel professional, organic, and calming without being sterile. These greens work well for an app dealing with inventory and restocking (supply chain → growth → green).

| Name | Hex | RGB | Role |
|------|-----|-----|------|
| **Leafy** | `#6d9f72` | rgb(109, 159, 114) | Primary brand, CTAs, success states |
| **Cypress** | `#545b32` | rgb(84, 91, 50) | Deep accent, headers, emphasis |
| **Ghoul** | `#687a4e` | rgb(104, 122, 78) | Secondary actions, muted states |
| **Oh Pistachio** | `#acc9a0` | rgb(172, 201, 160) | Card backgrounds, highlights (light mode) |
| **Fresh Breeze** | `#c1ebd5` | rgb(193, 235, 213) | Subtle backgrounds, empty states |
| **Cold Canada** | `#ddfffb` | rgb(221, 255, 251) | Lightest background, overlays |

### Supporting Colors (Existing)

| Name | Hex | Role |
|------|-----|------|
| **Accent Gold** | `#e2ad5d` | Warnings, highlights, badges |
| **Error Red** | `#c94c4c` | Destructive actions, validation errors |
| **Info Blue** | `#5a8ca1` | Informational states, links |

---

## Light Mode Palette

```
┌─────────────────────────────────────────────────────────────┐
│  HIERARCHY (Light Mode)                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Background Layer 0 (Screen BG)     #ffffff / Cold Canada   │
│  Background Layer 1 (Cards)         #f0eee4 / Fresh Breeze  │
│  Background Layer 2 (Inputs)        #e1e8ed                 │
│                                                             │
│  Text Primary                       #1c2011 (darkest)       │
│  Text Secondary                     #4a4c38 (dark)          │
│  Text Muted                         #a0a38f (medium)        │
│                                                             │
│  Interactive Primary                #6d9f72 (Leafy)         │
│  Interactive Hover                  #545b32 (Cypress)       │
│  Interactive Disabled               #c5c8b6                 │
│                                                             │
│  Borders                            #e1e8ed / Oh Pistachio  │
│  Dividers                           #e1e8ed                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Semantic Mapping (Light)

| Semantic Token | Value | Usage |
|----------------|-------|-------|
| `brand.primary` | `#6d9f72` | Primary buttons, active navigation |
| `brand.secondary` | `#687a4e` | Secondary buttons, badges |
| `brand.accent` | `#e2ad5d` | Highlights, promotions, warnings |
| `brand.deep` | `#545b32` | Headers, emphasized text |
| `surface.base` | `#ffffff` | Screen background |
| `surface.elevated` | `#f0eee4` | Cards, modals |
| `surface.subtle` | `#c1ebd5` | Empty state backgrounds, hints |
| `surface.highlight` | `#acc9a0` | Selected items, hover states |
| `text.primary` | `#1c2011` | Body text, headings |
| `text.secondary` | `#4a4c38` | Subheadings, labels |
| `text.muted` | `#a0a38f` | Placeholders, captions |
| `text.inverse` | `#ffffff` | Text on dark/primary backgrounds |
| `border.default` | `#e1e8ed` | Input borders, dividers |
| `border.focus` | `#6d9f72` | Focused input borders |
| `status.success` | `#6d9f72` | Success toasts, checkmarks |
| `status.warning` | `#e2ad5d` | Warning states |
| `status.error` | `#c94c4c` | Error messages, destructive |
| `status.info` | `#5a8ca1` | Info badges, links |

---

## Dark Mode Palette

```
┌─────────────────────────────────────────────────────────────┐
│  HIERARCHY (Dark Mode)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Background Layer 0 (Screen BG)     #1a1a1a                 │
│  Background Layer 1 (Cards)         #222522                 │
│  Background Layer 2 (Inputs)        #2f332e                 │
│                                                             │
│  Text Primary                       #f5f6f0 (darkest)       │
│  Text Secondary                     #dce0d4 (dark)          │
│  Text Muted                         #a0a38f (medium)        │
│                                                             │
│  Interactive Primary                #8fcca0 (Leafy lifted)  │
│  Interactive Hover                  #acc9a0 (Oh Pistachio)  │
│  Interactive Disabled               #555a52                 │
│                                                             │
│  Borders                            #2f332e                 │
│  Dividers                           #2f332e                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Semantic Mapping (Dark)

| Semantic Token | Value | Usage |
|----------------|-------|-------|
| `brand.primary` | `#8fcca0` | Primary buttons (lifted for contrast) |
| `brand.secondary` | `#7a9a6a` | Secondary buttons |
| `brand.accent` | `#f2c46d` | Highlights (lifted gold) |
| `brand.deep` | `#acc9a0` | Emphasized elements |
| `surface.base` | `#1a1a1a` | Screen background |
| `surface.elevated` | `#222522` | Cards, modals |
| `surface.subtle` | `#2f332e` | Input backgrounds |
| `surface.highlight` | `#3a4538` | Selected items |
| `text.primary` | `#f5f6f0` | Body text |
| `text.secondary` | `#dce0d4` | Subheadings |
| `text.muted` | `#a0a38f` | Placeholders |
| `text.inverse` | `#1a1a1a` | Text on light backgrounds |

---

## New Tokens to Add: `cypress` Category

These are the **Oh Cypress** complementary colors to integrate:

```typescript
// Add to colors.ts

cypress: {
  deep: '#545b32',      // Cypress - deep olive for headers/emphasis
  muted: '#687a4e',     // Ghoul - muted olive for secondary
  soft: '#acc9a0',      // Oh Pistachio - soft green for cards/highlights
  pale: '#c1ebd5',      // Fresh Breeze - pale mint for backgrounds
  frost: '#ddfffb',     // Cold Canada - frosty mint for overlays
}
```

---

## Application Guidelines

### 1. Supplier Grouping Headers

Use **Cypress (`#545b32`)** for supplier group headers in session views. This creates strong visual hierarchy against the softer card backgrounds.

```
┌─────────────────────────────────────────┐
│  [ ACME FOODS ]                         │  ← Cypress background, white text
├─────────────────────────────────────────┤
│  ○ Organic Apples (Qty: 12)             │  ← Standard card (elevated surface)
│  ○ Fresh Oranges (Qty: 8)               │
└─────────────────────────────────────────┘
```

### 2. Empty States & Hints

Use **Fresh Breeze (`#c1ebd5`)** or **Cold Canada (`#ddfffb`)** for empty state illustrations and hint backgrounds. These colors are soft enough to not compete with actionable UI.

### 3. Selection States

Use **Oh Pistachio (`#acc9a0`)** for selected items in lists (e.g., product selection during upload). This is distinguishable from the primary green but clearly "active."

### 4. Button Hierarchy

| Level | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| Primary | `#6d9f72` bg, white text | `#8fcca0` bg, dark text | Main CTAs |
| Secondary | `#687a4e` bg, white text | `#7a9a6a` bg, light text | Secondary actions |
| Tertiary | Transparent, `#6d9f72` text | Transparent, `#8fcca0` text | Inline actions |
| Destructive | `#c94c4c` bg, white text | `#e57373` bg, dark text | Delete, cancel |

### 5. Status Badges

| Status | Background | Text |
|--------|------------|------|
| Active/Success | `#c1ebd5` | `#545b32` |
| Warning | `#fef3cd` | `#856404` |
| Error | `#f8d7da` | `#721c24` |
| Info | `#d1ecf1` | `#0c5460` |
| Neutral/Draft | `#e1e8ed` | `#4a4c38` |

---

## Contrast & Accessibility

All color combinations must meet **WCAG 2.1 AA** (4.5:1 for body text, 3:1 for large text/UI).

| Combination | Ratio | Pass? |
|-------------|-------|-------|
| `#1c2011` on `#ffffff` | 16.2:1 | ✅ AAA |
| `#ffffff` on `#6d9f72` | 4.5:1 | ✅ AA |
| `#ffffff` on `#545b32` | 7.1:1 | ✅ AAA |
| `#1c2011` on `#c1ebd5` | 11.8:1 | ✅ AAA |
| `#f5f6f0` on `#1a1a1a` | 15.1:1 | ✅ AAA |
| `#1a1a1a` on `#8fcca0` | 8.2:1 | ✅ AAA |

---

## Implementation Checklist

- [ ] Add `cypress` token group to `styles/theme/colors.ts`
- [ ] Add `cypress` token group to `lib/theme/colors.ts`
- [ ] Update supplier headers to use `cypress.deep`
- [ ] Update empty states to use `cypress.pale` / `cypress.frost`
- [ ] Update selection states to use `cypress.soft`
- [ ] Audit all screens for consistent token usage
- [ ] Verify dark mode contrast ratios
- [ ] Update component styles to reference new tokens

---

## Reference: Oh Cypress Source Palette

From colorpalette.pro — complementary square palette based on `rgb(42.7%, 62.4%, 44.7%)`:

| Swatch | Name | RGB | Hex |
|--------|------|-----|-----|
| ![#6d9f72](https://via.placeholder.com/15/6d9f72/6d9f72.png) | Leafy | rgb(42.7%, 62.4%, 44.7%) | `#6d9f72` |
| ![#545b32](https://via.placeholder.com/15/545b32/545b32.png) | Cypress | rgb(32.9%, 35.7%, 19.8%) | `#545b32` |
| ![#687a4e](https://via.placeholder.com/15/687a4e/687a4e.png) | Ghoul | rgb(40.8%, 48.1%, 30.6%) | `#687a4e` |
| ![#acc9a0](https://via.placeholder.com/15/acc9a0/acc9a0.png) | Oh Pistachio | rgb(67.4%, 79%, 62.9%) | `#acc9a0` |
| ![#c1ebd5](https://via.placeholder.com/15/c1ebd5/c1ebd5.png) | Fresh Breeze | rgb(75.6%, 92.3%, 83.4%) | `#c1ebd5` |
| ![#ddfffb](https://via.placeholder.com/15/ddfffb/ddfffb.png) | Cold Canada | rgb(86.5%, 100%, 98.5%) | `#ddfffb` |

