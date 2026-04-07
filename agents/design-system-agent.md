# Design System Agent — Pharos

> Reference `CLAUDE.md` for project context. This agent handles the complete visual overhaul of the Pharos frontend.

You are responsible for transforming the Pharos UI from its current cold, blue-tinted, generic admin look into a warm, premium, editorially-inspired design system. The guiding philosophy is **"Digital Atelier"** — generous whitespace, tonal surface layering instead of hard borders, warm neutrals, and Manrope headlines that give the interface the feel of a curated editorial tool rather than a database admin panel.

---

## Creative North Star

The interface should feel like a physical workspace made of fine paper, layered glass, and ambient light. The user's content is the hero — the chrome recedes. No harsh lines. No cold blue tints. No aggressive hover states. Everything is quiet, warm, and intentional.

**Key principles:**
- **Tonal Architecture** — Define space with background color shifts, not borders
- **Breathing Room** — If you think there's enough whitespace, add 20% more
- **Warm, Not Cold** — Base whites are cream-tinted, not pure. Dark mode is charcoal grey, not blue
- **Typography-Driven Hierarchy** — Large contrast between Manrope headlines and Inter body text
- **Subtle Interactions** — Hover states whisper, they don't shout

---

## File Targets

| File | What to change |
|---|---|
| `frontend/src/index.css` | All CSS variables (colors, fonts, radii), base layer styles |
| `frontend/src/components/shared/DataTableWrapper.tsx` | Table row hover fix |
| `frontend/src/components/ui/dialog.tsx` | Overlay/backdrop fix |
| `frontend/src/components/ui/sheet.tsx` | Overlay fix + body padding/margin fix |
| `frontend/src/components/ui/alert-dialog.tsx` | Overlay fix |
| `frontend/src/components/ui/button.tsx` | Primary button gradient, refined variants |
| `frontend/src/components/ui/card.tsx` | Softer styling, border removal, larger radii |
| `frontend/src/components/ui/table.tsx` | Row hover and border refinement |
| `frontend/src/components/layout/AdminLayout.tsx` | Sidebar tonal surfaces, no hard borders |
| `frontend/src/components/layout/PublicLayout.tsx` | Header glassmorphism refinement |

---

## 1. Color Palette — Complete Replacement

### Current State (BROKEN — too cold/blue)

The current `index.css` uses OKLCH values with hue 250-260 (blue) throughout. In dark mode, `--background: oklch(0.145 0.014 260)` is visibly blue-tinted. The muted/secondary colors all carry blue chroma. This makes the UI feel clinical and cold.

### New Light Mode Palette

Replace the entire `:root` block in `frontend/src/index.css`. The new palette uses warm neutrals as the base with a deep authority blue as the primary action color and a warm gold accent.

```css
:root {
  --radius: 0.75rem;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Manrope", ui-sans-serif, system-ui, sans-serif;

  /* Warm neutral base — cream-tinted whites */
  --background: oklch(0.985 0.003 80);       /* #fbf9f8 — warm off-white */
  --foreground: oklch(0.155 0.01 260);        /* #1b1c1c — near-black, never #000 */
  --card: oklch(1 0 0);                       /* #ffffff — pure white cards on warm bg */
  --card-foreground: oklch(0.155 0.01 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.155 0.01 260);

  /* Deep authority blue primary */
  --primary: oklch(0.40 0.14 260);            /* #003b93 — trust, authority */
  --primary-foreground: oklch(0.985 0 0);

  /* Warm surface tiers — for "no-line" tonal architecture */
  --secondary: oklch(0.975 0.003 80);         /* surface_container_low — warm light grey */
  --secondary-foreground: oklch(0.25 0.01 260);
  --muted: oklch(0.965 0.004 80);             /* surface_container — one step darker */
  --muted-foreground: oklch(0.45 0.015 260);  /* #434653 — legible secondary text */

  /* Gold accent — hope, warmth */
  --accent: oklch(0.65 0.14 85);              /* #785a00 — warm gold */
  --accent-foreground: oklch(0.985 0 0);

  /* Semantic colors */
  --destructive: oklch(0.577 0.245 27.325);
  --success: oklch(0.627 0.194 149.214);
  --warning: oklch(0.75 0.16 75);

  /* Borders — very subtle, warm-tinted */
  --border: oklch(0.93 0.004 80);             /* Warm grey border */
  --input: oklch(0.93 0.004 80);
  --ring: oklch(0.40 0.14 260);               /* Matches primary */

  /* Chart colors */
  --chart-1: oklch(0.40 0.14 260);            /* Primary blue */
  --chart-2: oklch(0.627 0.194 149.214);      /* Success green */
  --chart-3: oklch(0.65 0.14 85);             /* Gold accent */
  --chart-4: oklch(0.577 0.245 27.325);       /* Destructive red */
  --chart-5: oklch(0.55 0.12 300);            /* Purple */

  /* Sidebar — warm off-white, slightly tinted */
  --sidebar: oklch(0.975 0.003 80);           /* surface_container_low */
  --sidebar-foreground: oklch(0.30 0.01 260);
  --sidebar-primary: oklch(0.40 0.14 260);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.965 0.004 80);
  --sidebar-accent-foreground: oklch(0.30 0.01 260);
  --sidebar-border: oklch(0.93 0.004 80);
  --sidebar-ring: oklch(0.40 0.14 260);
}
```

### New Dark Mode Palette

Replace the entire `.dark` block. The critical fix: **dark mode must be dark GREY, not blue.** Drop chroma to near-zero and shift hue toward neutral.

```css
.dark {
  /* Dark charcoal base — NO blue tint */
  --background: oklch(0.145 0.004 250);       /* Dark grey, near-zero chroma */
  --foreground: oklch(0.93 0.004 80);         /* Warm light text */
  --card: oklch(0.185 0.005 250);             /* Slightly lifted cards */
  --card-foreground: oklch(0.93 0.004 80);
  --popover: oklch(0.185 0.005 250);
  --popover-foreground: oklch(0.93 0.004 80);

  /* Brighter primary for dark bg contrast */
  --primary: oklch(0.60 0.16 255);
  --primary-foreground: oklch(0.145 0.004 250);

  /* Dark surface tiers */
  --secondary: oklch(0.22 0.005 250);
  --secondary-foreground: oklch(0.93 0.004 80);
  --muted: oklch(0.20 0.005 250);
  --muted-foreground: oklch(0.60 0.01 250);

  /* Gold accent — slightly brighter for dark */
  --accent: oklch(0.75 0.15 85);
  --accent-foreground: oklch(0.145 0.004 250);

  /* Semantic (unchanged) */
  --destructive: oklch(0.577 0.245 27.325);
  --success: oklch(0.627 0.194 149.214);
  --warning: oklch(0.75 0.15 85);

  /* Borders — subtle warm grey */
  --border: oklch(0.27 0.005 250);
  --input: oklch(0.27 0.005 250);
  --ring: oklch(0.60 0.16 255);

  /* Chart colors (brighter for dark bg) */
  --chart-1: oklch(0.60 0.16 255);
  --chart-2: oklch(0.627 0.194 149.214);
  --chart-3: oklch(0.75 0.15 85);
  --chart-4: oklch(0.577 0.245 27.325);
  --chart-5: oklch(0.65 0.12 300);

  /* Sidebar */
  --sidebar: oklch(0.165 0.004 250);
  --sidebar-foreground: oklch(0.93 0.004 80);
  --sidebar-primary: oklch(0.60 0.16 255);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.22 0.005 250);
  --sidebar-accent-foreground: oklch(0.93 0.004 80);
  --sidebar-border: oklch(0.27 0.005 250);
  --sidebar-ring: oklch(0.60 0.16 255);
}
```

### @theme inline updates

In the `@theme inline` block, add the new font variables:

```css
@theme inline {
  /* ... all existing --color-* mappings stay the same ... */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-display);
  /* Increase base radius for softer containers */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) * 2);
  --radius-3xl: calc(var(--radius) * 2.5);
  --radius-4xl: calc(var(--radius) * 3);
  /* ... animations stay the same ... */
}
```

---

## 2. Typography — Manrope + Inter

### Install Manrope

Add a `@font-face` declaration to `index.css` right after the existing Inter `@font-face`, or install via npm:

```bash
npm install @fontsource/manrope
```

Then in `frontend/src/main.tsx` (or index.css):

```css
@font-face {
  font-family: "Manrope";
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
  src: url("https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk59FO_F87jxeN7B.woff2")
    format("woff2");
}
```

### Typography Hierarchy Rules

Apply these conventions across all pages:

| Role | Font | Weight | Size | Letter-spacing | Color |
|---|---|---|---|---|---|
| Page title (H1) | Manrope (`font-heading`) | 700 (bold) | text-3xl to text-4xl | -0.02em (tracking-tight) | foreground |
| Section heading (H2) | Manrope | 600 (semibold) | text-xl to text-2xl | -0.01em | foreground |
| Card title | Manrope | 500 (medium) | text-base | normal | foreground |
| Stat number | Inter (tabular-nums) | 700 (bold) | text-3xl to text-5xl | -0.02em | foreground |
| Body text | Inter | 400 (normal) | text-sm to text-base | normal | foreground |
| Labels / captions | Inter | 500 (medium) | text-xs to text-sm | normal | muted-foreground |
| Table data | Inter | 400 | text-sm | normal | foreground |

### CSS utility for display text

Add to the `@layer base` section in `index.css`:

```css
@layer base {
  h1, h2, h3 {
    font-family: var(--font-display);
    letter-spacing: -0.01em;
  }
}
```

---

## 3. The "No-Line" Rule — Tonal Architecture

### Philosophy

1px solid borders between sections are the hallmark of generic admin UIs. Replace them with **background color shifts**.

### Implementation

**Sidebar boundary** — In `AdminLayout.tsx`, the sidebar currently has `border-r`. Remove the border and instead let the sidebar background (`--sidebar`) contrast naturally against the content area background (`--background`). The sidebar is already `oklch(0.975 ...)` vs content at `oklch(0.985 ...)` — this difference is the boundary.

```tsx
// AdminLayout sidebar: REMOVE border-r, use surface contrast
// Before:  className="... border-r ..."
// After:   className="... ..." (no border-r)
```

**Table rows** — In `table.tsx`, the `TableRow` component currently has `border-b`. Replace with spacing or a very subtle separator:

```tsx
// Before: "border-b transition-colors hover:bg-muted/50 ..."
// After:  "transition-colors hover:bg-muted/30 ..."
```

Only use `border-b` on the last row before the footer, or on the header row.

**Cards** — In `card.tsx`, the Card has `ring-1 ring-foreground/10`. This is acceptable as a "ghost border" — but soften it:

```tsx
// Before: "ring-1 ring-foreground/10"
// After:  "ring-1 ring-foreground/[0.04]"
```

This creates a barely-visible edge that passes accessibility while not looking "boxed in."

**Card footer** — Currently has `border-t bg-muted/50`. Replace the border with just the background shift:

```tsx
// Before: "border-t bg-muted/50 p-4"
// After:  "bg-muted/40 p-4"
```

**Where borders ARE allowed:**
- Input fields in their focused state (ghost border using `ring`)
- Explicit data table headers (single top-level separator between header and body)
- Separators within dropdown menus (these are small and expected)

---

## 4. Table Row Hover Fix

### Current Problem

In `frontend/src/components/shared/DataTableWrapper.tsx`, line 160:

```tsx
whileHover={onRowClick ? { backgroundColor: "var(--muted)" } : undefined}
```

This sets the row to the FULL muted color on hover, which in both light and dark mode is aggressively dark. Combined with the CSS `hover:bg-muted/50`, the Motion override wins and makes the row flash very dark.

### Fix

Replace the `whileHover` with a much subtler effect:

```tsx
// Before:
whileHover={onRowClick ? { backgroundColor: "var(--muted)" } : undefined}

// After:
whileHover={onRowClick ? { backgroundColor: "oklch(0 0 0 / 0.02)" } : undefined}
```

This applies a near-invisible 2% darkening — just enough to signal interactivity without the aggressive color flash.

Also update the CSS class on the same `motion.tr`:

```tsx
// Before:
className={`border-b transition-colors hover:bg-muted/50 ${onRowClick ? "cursor-pointer" : ""}`}

// After:
className={`transition-colors hover:bg-muted/20 ${onRowClick ? "cursor-pointer" : ""}`}
```

The changes:
1. Remove `border-b` (no-line rule — rows are separated by the rhythm of cells)
2. Change `hover:bg-muted/50` to `hover:bg-muted/20` (much subtler)

---

## 5. Overlay / Backdrop Fix

### Current Problem

All three overlay components (`dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx`) use:

```
bg-black/10 supports-backdrop-filter:backdrop-blur-xs
```

The user finds the blur distracting. They want a slight darkening instead.

### Fix — All Three Files

Replace the overlay/backdrop className in each file:

**`dialog.tsx`** — `DialogOverlay` (line 34):
```tsx
// Before:
"fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"

// After:
"fixed inset-0 isolate z-50 bg-black/25 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
```

**`sheet.tsx`** — `SheetOverlay` (line 29):
```tsx
// Before:
"fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs"

// After:
"fixed inset-0 z-50 bg-black/25 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
```

**`alert-dialog.tsx`** — `AlertDialogOverlay` (line 33):
```tsx
// Before:
"fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"

// After:
"fixed inset-0 isolate z-50 bg-black/25 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
```

Changes: `bg-black/10` → `bg-black/25` (slightly darker dim), and remove `supports-backdrop-filter:backdrop-blur-xs` (no blur).

---

## 6. Sheet Margin / Padding Fix

### Current Problem

`SheetContent` in `sheet.tsx` has `gap-4` but no `padding` on the popup container itself. Only `SheetHeader` (`p-4`) and `SheetFooter` (`p-4`) have padding. Any body content between header and footer has no horizontal padding unless the consumer adds it — leading to content that bumps against the edges.

### Fix

Add padding to the `SheetContent` popup container. The simplest fix: add `p-6` to the `SheetPrimitive.Popup` className. Also widen the max-width since `sm:max-w-sm` (24rem / 384px) is quite narrow for forms:

```tsx
// In SheetContent, update the className on SheetPrimitive.Popup:
// Add: p-6 at the start of the className
// Change: sm:max-w-sm to sm:max-w-md (28rem / 448px)
```

Then remove the existing `p-4` from `SheetHeader` and `SheetFooter` since the parent now provides padding, and use negative margins to let them span full width if needed:

```tsx
// SheetHeader: change "p-4" to "pb-2" (just bottom spacing, parent provides horizontal padding)
// SheetFooter: change "p-4" to "pt-4" (just top spacing)
```

Alternatively, keep SheetHeader and SheetFooter padding as-is and only add horizontal padding (`px-6`) to a body wrapper. Choose whichever approach is simpler — the key requirement is that **all sheet content has consistent horizontal padding of at least 1.5rem (p-6)**.

---

## 7. Button Refinement

### Current State

In `button.tsx`, the default variant is `bg-primary text-primary-foreground`. This is flat.

### Changes

**Primary variant** — Add a subtle gradient for depth (the "visual soul" rule):

```tsx
// Before:
default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80"

// After:
default: "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-sm hover:from-primary/90 hover:to-primary/75 active:from-primary active:to-primary"
```

**Secondary variant** — Use surface fill instead of the current secondary color:

```tsx
// Before:
secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 ..."

// After:
secondary: "bg-muted text-foreground hover:bg-muted/70 ..."
```

**Ghost variant** — Make hover even subtler:

```tsx
// Before:
ghost: "hover:bg-muted hover:text-foreground ... dark:hover:bg-muted/50"

// After:
ghost: "hover:bg-muted/50 hover:text-foreground ... dark:hover:bg-muted/30"
```

---

## 8. Card Refinement

### Changes to `card.tsx`

**Card container** — Softer ring, larger radius:

```tsx
// Before:
"... rounded-xl ... ring-1 ring-foreground/10 ..."

// After:
"... rounded-2xl ... ring-1 ring-foreground/[0.04] shadow-sm ..."
```

Use `rounded-2xl` (1rem+) for the main card container. The barely-visible ring plus a tiny shadow gives floating depth without a hard border.

**CardFooter** — Remove border, just use background shift:

```tsx
// Before:
"... border-t bg-muted/50 p-4 ..."

// After:
"... bg-muted/30 p-4 ..."
```

---

## 9. AdminLayout Sidebar Refinement

In `frontend/src/components/layout/AdminLayout.tsx`, the sidebar should feel like a warm panel sitting beside the content — not boxed in by borders.

**Remove `border-r`** from the sidebar `motion.aside` element.

**Active nav item** — Instead of a left border accent, use a surface background shift:

```tsx
// Active state on nav link:
// Before: left border + background
// After: rounded-lg bg-primary/10 text-primary font-medium
```

**Collapsed state icon-only mode** — Keep the warm sidebar background, no vertical border line.

---

## 10. Additional Refinements

### Input Fields

In `input.tsx` (if not already handled by the theme vars), ensure:
- Default state: `bg-muted/30` background (surface_container_low feel), no heavy border
- Focus state: `bg-background` (lighten to pure white) + ghost ring using `ring-1 ring-primary/20`

### Skeleton Loaders

If skeleton shimmer uses a blue tint, update to use warm grey tints matching the new muted palette.

### Recharts / Chart Colors

The `--chart-1` through `--chart-5` variables are already updated in the palette above. Verify that Recharts components in the frontend use these CSS variables (via `hsl(var(--chart-1))` or equivalent). If they use hardcoded hex values anywhere, replace with the CSS variable references.

### Sonner Toasts

`frontend/src/components/ui/sonner.tsx` imports `useTheme` from `next-themes` but the app uses a custom `ThemeProvider` from `@/lib/theme`. Verify this is aligned — if toasts don't follow the theme, update the Sonner import to use the custom theme hook.

---

## Summary Checklist

- [ ] Replace `:root` color variables in `index.css` with warm neutral palette
- [ ] Replace `.dark` color variables with grey-toned (not blue) dark mode
- [ ] Add Manrope font-face and `--font-display` / `--font-heading` variables
- [ ] Update `@theme inline` block with new font vars and radius values
- [ ] Add base layer heading styles (font-family: var(--font-display))
- [ ] Fix table row hover in `DataTableWrapper.tsx` (subtle, not aggressive)
- [ ] Fix overlays in `dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx` (darken, no blur)
- [ ] Fix sheet padding/margins in `sheet.tsx`
- [ ] Update button variants in `button.tsx` (gradient primary, softer ghost/secondary)
- [ ] Update card styling in `card.tsx` (softer ring, no border footer, larger radius)
- [ ] Remove sidebar border in `AdminLayout.tsx`
- [ ] Update table row borders in `table.tsx` (minimize, use spacing)
- [ ] Verify chart colors use CSS variables
- [ ] Verify Sonner theme alignment
- [ ] Test light mode and dark mode thoroughly
- [ ] Test all overlay/dialog/sheet components visually
