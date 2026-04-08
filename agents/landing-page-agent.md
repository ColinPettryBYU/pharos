# Landing Page Agent — Pharos

> Reference `CLAUDE.md` for project context, design system, color palette, and animation standards.
> Reference `agents/design-system-agent.md` for the Digital Atelier design philosophy.

You are responsible for completely redesigning the landing page at `frontend/src/pages/public/LandingPage.tsx` to be visually stunning, image-rich, and premium-feeling — not just icons and text cards.

---

## Current State

**File:** `frontend/src/pages/public/LandingPage.tsx` (165 lines)
**Route:** `/` inside `PublicLayout`

Current structure:
1. Hero — gradient background, headline "A Beacon of Hope for Every Girl", 2 CTAs
2. Stats strip — 4 animated numbers with icons
3. Four Pillars — 4 icon cards
4. How It Works — 3 numbered circles
5. CTA block — solid primary-colored panel

**Problems:**
- No images at all — only icons and gradients
- Very generic/template-like appearance
- No visual depth, geometry, or flowing shapes
- Feels like a standard admin landing page, not a nonprofit mission page

---

## Available Images

Two stock photos have been placed in the project root. **First, move them:**

```bash
mkdir -p frontend/public/images
mv girlsreadingstock.png frontend/public/images/
mv girlwomentalkingstock.png frontend/public/images/
```

Then reference them in JSX as:
```html
<img src="/images/girlsreadingstock.png" alt="Girls reading together" />
<img src="/images/girlwomentalkingstock.png" alt="Mentoring conversation" />
```

---

## New Design — Section by Section

### Section 1: Hero

Full-viewport hero with image background and text overlay.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ┌────────────────────────────────────────┐                │
│   │ (Image: girlsreadingstock.png)         │                │
│   │  Full-width background, object-cover    │                │
│   │  Gradient overlay from left (dark)      │                │
│   │                                         │                │
│   │  Left-aligned content:                  │                │
│   │  ─────────────────────                  │                │
│   │  "A Beacon of Hope"                     │                │
│   │  "for Every Girl"  ← primary color      │                │
│   │                                         │                │
│   │  Subtitle paragraph                     │                │
│   │                                         │                │
│   │  [See Our Impact] [Learn More]          │                │
│   └────────────────────────────────────────┘                │
│                                                              │
│  ~~~~ SVG wave divider ~~~~                                  │
└──────────────────────────────────────────────────────────────┘
```

**Implementation details:**
- Use `girlsreadingstock.png` as the hero image
- Apply a gradient overlay: `bg-gradient-to-r from-background/95 via-background/70 to-transparent` over the image so text is readable
- Text is left-aligned (not centered) on desktop, centered on mobile
- Headline: `text-5xl lg:text-7xl font-bold tracking-tight`
- Subtitle: `text-lg lg:text-xl text-muted-foreground max-w-xl`
- Two CTA buttons: primary "See Our Impact" + outline "Learn More"
- Min height: `min-h-[80vh]` or `min-h-screen` on the hero
- Use Motion for staggered text entrance (opacity + translateY)

**SVG Wave Divider** after the hero:
```html
<div className="relative -mt-1">
  <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
    <path
      d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z"
      className="fill-background"
    />
  </svg>
</div>
```

This creates a smooth wave transition from the hero to the next section. The `fill-background` class makes it match the page background in both light and dark mode.

### Section 2: Impact Stats Strip

Keep the animated numbers but make the section more visually impactful.

**Design:**
- Full-width section with `bg-muted/30` background
- 4 stat cards in a grid, each with:
  - Subtle `bg-card` background with `shadow-sm` and `rounded-xl`
  - Icon in a colored circle (keep current icons)
  - Large animated number (`text-4xl font-bold tabular-nums`)
  - Label below (`text-sm text-muted-foreground`)
- Hover: `scale(1.03)` with spring animation via Motion
- Stagger entrance animation when scrolling into view

### Section 3: Mission + Image Split

Side-by-side layout with the second image.

**Layout (desktop):**
```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│  "Our Mission"      │  ┌───────────────┐  │
│                     │  │  (Image:       │  │
│  Mission text       │  │  girlwomen     │  │
│  paragraph          │  │  talkingstock  │  │
│                     │  │  .png)         │  │
│  Four Pillar cards  │  │               │  │
│  in a 2x2 grid     │  │  Rounded       │  │
│                     │  │  corners       │  │
│                     │  └───────────────┘  │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

On mobile: stack vertically (image on top, content below).

**Pillar cards:**
- 2x2 grid on the left side
- Each card has: colored icon circle + title + short description
- Subtle hover lift (Motion `whileHover={{ y: -4 }}`)
- Glass-morphism effect: `bg-card/80 backdrop-blur-sm border border-border/50`

### Section 4: How It Works — Visual Timeline

Redesign as a horizontal timeline (desktop) / vertical timeline (mobile).

**Desktop layout:**
```
    ①────────────────②────────────────③
  We Rescue      We Rehabilitate    We Reintegrate
  Description     Description        Description
```

**Implementation:**
- Three numbered circles connected by a horizontal line
- Each circle: `h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg`
- The connecting line: `h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50`
- Below each circle: title + description
- Motion: stagger entrance, circles scale in first, then text fades in

**Mobile:** Switch to vertical with line going down the left side.

### Section 5: Testimonial / Impact Quote (NEW)

Add a new section between "How It Works" and the CTA. This provides emotional depth.

**Design:**
```
┌──────────────────────────────────────┐
│                                      │
│  Large decorative quote marks (SVG)  │
│                                      │
│  "Every girl who walks through       │
│   our doors deserves a chance        │
│   to dream again."                   │
│                                      │
│   — Lighthouse Sanctuary             │
│                                      │
│  Soft gradient background blob       │
│                                      │
└──────────────────────────────────────┘
```

- Centered text, `text-2xl lg:text-3xl font-semibold italic`
- Subtle gradient background orb behind the quote (CSS `radial-gradient`)
- Motion: text fades in on scroll

### Section 6: CTA Block (Redesigned)

Use `girlsreadingstock.png` again as a background with a frosted glass overlay.

**Design:**
```
┌──────────────────────────────────────────┐
│  (Background image, blurred slightly)    │
│  ┌────────────────────────────────────┐  │
│  │  Frosted glass card (backdrop-blur) │  │
│  │                                     │  │
│  │  "Join Our Mission"                 │  │
│  │  "Every contribution brings..."     │  │
│  │                                     │  │
│  │  [Become a Supporter] [View Impact] │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ~~~~ Top SVG wave divider ~~~~          │
└──────────────────────────────────────────┘
```

- Background: image with `brightness-50` or dark overlay
- Card: `bg-background/80 backdrop-blur-xl rounded-2xl shadow-2xl p-12`
- SVG wave divider at the top of this section (inverted from Section 1's wave)

---

## Geometric / Decorative Elements

Scatter these throughout the page for visual richness:

### 1. Gradient Orbs (CSS)
Place 2-3 gradient blobs as `position: absolute` decorative elements:

```html
<div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
<div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
```

These create soft ambient color behind content sections. Place them in the hero and mission sections.

### 2. SVG Wave Dividers
Use between sections for smooth transitions. Vary the wave shape:

```html
<!-- Gentle wave -->
<svg viewBox="0 0 1440 80" className="w-full block">
  <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" className="fill-muted/30" />
</svg>

<!-- Double wave -->
<svg viewBox="0 0 1440 100" className="w-full block">
  <path d="M0,50 C240,100 480,0 720,50 C960,100 1200,0 1440,50 L1440,100 L0,100 Z" className="fill-background" />
</svg>
```

### 3. Dot Grid Pattern (optional)
A subtle dot grid behind the stats section:

```html
<div className="absolute inset-0 opacity-5"
  style={{
    backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
    backgroundSize: "24px 24px"
  }}
/>
```

---

## Animation Specifications

All animations use Motion (from `motion/react`):

| Element | Animation | Trigger |
|---|---|---|
| Hero headline | `opacity: 0→1, y: 30→0` over 0.7s | On mount |
| Hero subtitle | Same, 0.2s delay | On mount |
| Hero CTAs | Same, 0.3s delay | On mount |
| Stats cards | `opacity: 0→1, scale: 0.9→1` staggered | Scroll into view (`useInView`) |
| Animated numbers | Spring-animated counting | Scroll into view |
| Pillar cards | Stagger fade-in, 0.05s interval | Scroll into view |
| Timeline circles | `scale: 0→1` with spring | Scroll into view |
| Timeline text | `opacity: 0→1, y: 20→0` | After circles animate |
| Quote | `opacity: 0→1` over 1s | Scroll into view |
| CTA card | `opacity: 0→1, y: 30→0` | Scroll into view |
| Hover on cards | `y: -4, scale: 1.02` with spring | Hover |

Use the existing `AnimatedSection` wrapper pattern (already in the current file) for scroll-triggered animations.

---

## Responsive Behavior

| Breakpoint | Changes |
|---|---|
| Mobile (< 640px) | Hero text centered, image fills viewport with stronger overlay. Pillar cards stack 1-col. Timeline vertical. |
| Tablet (640-1024px) | Hero text left-aligned. Pillar cards 2-col. Mission section stacks (image on top). |
| Desktop (> 1024px) | Full side-by-side layouts. Horizontal timeline. Hero with left-aligned text over right image. |

---

## Dark Mode

All elements must work in both light and dark mode:
- Images: add slight brightness reduction in dark mode (`dark:brightness-90`)
- Gradients: use CSS variable colors (`from-background`, `to-background`)
- Cards: `bg-card` (auto-adapts)
- Wave SVGs: use `fill-background` or `fill-muted/30` (CSS variable classes)
- Gradient orbs: use `/5` opacity suffixes so they're subtle in both modes

---

## Existing Components to Reuse

- `Button` from `@/components/ui/button`
- `Card` / `CardContent` from `@/components/ui/card`
- `AnimatedNumber` from `@/components/shared/StatCard`
- `motion` / `useInView` from `motion/react`
- `Link` from `react-router-dom`
- Lucide icons: `Shield`, `Heart`, `Scale`, `Sparkles`, `ArrowRight`, `ChevronRight`, `Users`, `Building2`, `HandHeart`, `Globe`
- `usePublicSafehouses` from `@/hooks/usePublicData` (for real stats)

---

## Files to Modify

| File | Changes |
|---|---|
| `frontend/src/pages/public/LandingPage.tsx` | Complete rewrite with new design |

## Files to Create/Move

| Action | Path |
|---|---|
| Move | `girlsreadingstock.png` → `frontend/public/images/girlsreadingstock.png` |
| Move | `girlwomentalkingstock.png` → `frontend/public/images/girlwomentalkingstock.png` |

---

## Checklist

- [ ] Move images from project root to `frontend/public/images/`
- [ ] Rewrite hero section with image background + gradient overlay + left-aligned text
- [ ] Add SVG wave divider after hero
- [ ] Redesign stats strip with card-style stat blocks
- [ ] Create side-by-side mission + image layout with 2x2 pillar cards
- [ ] Redesign How It Works as visual timeline
- [ ] Add quote/testimonial section with decorative elements
- [ ] Redesign CTA block with image background + frosted glass card
- [ ] Add gradient orbs as decorative background elements
- [ ] Add all Motion animations (mount, scroll, hover)
- [ ] Verify responsive behavior (mobile, tablet, desktop)
- [ ] Verify dark mode compatibility
- [ ] Verify frontend builds cleanly
