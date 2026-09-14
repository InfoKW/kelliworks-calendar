# Kelliworks CSS Style Guide
**Source:** kelliworks.com (Wix)  
**Extracted:** April 2026  
**For use in:** Claude Code projects replicating the Kelliworks brand

---

## How to Use These Files

Import in this order in your project:

```html
<!-- 1. Tokens (required first — everything references this) -->
<link rel="stylesheet" href="kelliworks-tokens.css">

<!-- 2. Typography -->
<link rel="stylesheet" href="kelliworks-typography.css">

<!-- 3. Buttons & Interactions -->
<link rel="stylesheet" href="kelliworks-buttons.css">
```

Or in CSS:

```css
@import './kelliworks-tokens.css';
@import './kelliworks-typography.css';
@import './kelliworks-buttons.css';
```

---

## Fonts

Kelliworks uses a mix of Adobe/Wix-hosted fonts and Google Fonts.

### Primary Font — Myriad Pro
Used for almost all text: headings, body, buttons, labels. It is a Wix-hosted font — not available on Google Fonts.

**Options for your projects:**
- **Adobe Fonts (recommended):** Add `myriad-pro` from [fonts.adobe.com/fonts/myriad](https://fonts.adobe.com/fonts/myriad) via an Adobe Fonts embed code.
- **System fallback:** `'Liberation Sans', Arial, sans-serif` — acceptable for prototyping.
- **Google Fonts alternative:** `Source Sans 3` is the closest open-source match to Myriad Pro.

```html
<!-- Adobe Fonts embed (replace PROJECT_ID with yours) -->
<link rel="stylesheet" href="https://use.typekit.net/PROJECT_ID.css">
```

### Supporting Fonts

| Font | Usage | Source |
|------|-------|--------|
| **Myriad Pro** | Primary — all headings, body, buttons | Adobe Fonts |
| **Questrial** | Subheadings, FAQ questions/answers | Google Fonts ✓ |
| **Montserrat** | Alternate body text (some sections) | Google Fonts ✓ |
| **DIN Next W01 Light** | Navigation, captions, XS text | Adobe Fonts |
| **Proxima Nova** | H3/H4 level headings in some sections | Adobe Fonts |
| **The Philadelphia Story** | Decorative display / page titles | Wix-only font |

```css
/* Google Fonts import (Questrial + Montserrat) */
@import url('https://fonts.googleapis.com/css2?family=Questrial&family=Montserrat:wght@400;500;600;700&display=swap');
```

### Type Scale

| Token | Size | Line Height | Font | Use |
|-------|------|-------------|------|-----|
| `--kw-font-size-hero` | 79px | 1.1 | Myriad Pro | Homepage H1 |
| `--kw-font-size-title` | 44px | 1.4em | Myriad Pro / Philly Story | Section titles |
| `--kw-font-size-h2` | 22px | 1.4em | Myriad Pro | Heading XL |
| `--kw-font-size-h3` | 19px | 1.4em | Proxima Nova | Heading L |
| `--kw-font-size-body-l` | 17px | 1.4em / 21px | Myriad / Questrial | Large body |
| `--kw-font-size-body-m` | 15px | 1.4em | Myriad Pro | Body medium |
| `--kw-font-size-body-s` | 13px | 32px | Myriad Pro | Default paragraph, nav, contact |
| `--kw-font-size-body-xs` | 12px | 1.4em | DIN Next | Caption |
| **Nav links** | **13px** | 1.4em | Myriad Pro | **ALL CAPS text content, not CSS** |
| `--kw-font-size-button` | 16px | 1.4em | Myriad Pro | Buttons |

Note: The body paragraph line-height is unusually tall at **32px** — this is intentional on the site and gives the text a very open, airy feel.

> **Navigation note (confirmed via Script C):** Nav items (HOME, ABOUT, ACCOUNTING) are written in ALL CAPS as actual text content — there is no `text-transform: uppercase` in CSS. Font size is **13px**, not the 16px listed in the Wix font token. Use Myriad Pro (not DIN Next) for nav items.

---

## Colors

### Core Brand Palette

The Kelliworks palette is built around **Deep Navy** as the primary brand color and **Brand Blue** as the primary action/interactive color. The site also has terracotta, green, and gold as accent palettes.

### Link Colors (confirmed via Script C)

| Context | Color | Hex | Class used |
|---------|-------|-----|------------|
| In-content links (email, phone, rich text) | Dark blue | `#015989` | `.wixui-rich-text__text` |
| CTA / action links | Primary blue | `#C3A862` | `.kw-link-action` |
| Gold accent (FAQ answers, highlights) | Gold | `#C3A862` | `.kw-link-accent` |
| Nav items | Text primary on transparent | `#1A1A1A` | Hover → `#C3A862` |

The site uses the **darker blue `#015989`** for inline/content links, reserving the brighter `#C3A862` for CTAs and buttons. Keep this distinction in your projects.

---

#### Neutrals & Text

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| `--kw-color-white` | `#FFFFFF` | 255,255,255 | Backgrounds, button text |
| `--kw-color-bg-secondary` | `#F0F2F4` | 240,242,244 | Section backgrounds, card fills |
| `--kw-color-text-primary` | `#1A1A1A` | 26,26,26 | Headings, labels |
| `--kw-color-text-secondary` | `#484848` | 72,72,72 | Secondary text |
| `--kw-color-text-muted` | `#767676` | 118,118,118 | Body paragraphs |

#### Navy — Primary Brand Color

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| `--kw-color-navy-lightest` | `#A9B9D3` | 169,185,211 | Tints, decorative |
| `--kw-color-navy-light` | `#7A8BA6` | 122,139,166 | Supporting elements |
| `--kw-color-navy-medium` | `#495C7A` | 73,92,122 | Mid-tone navy |
| **`--kw-color-navy`** | **`#122620`** | **16,40,77** | **Primary brand — H1 color, titles** |
| `--kw-color-navy-dark` | `#081427` | 8,20,39 | Deep shadows |

#### Blue — Primary Action Color

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| `--kw-color-blue-lightest` | `#A0D2EF` | 160,210,239 | Tints, backgrounds |
| `--kw-color-blue-light` | `#70B7DE` | 112,183,222 | Supporting |
| **`--kw-color-blue`** | **`#C3A862`** | **2,133,206** | **Buttons, links, CTAs** |
| `--kw-color-blue-dark` | `#015989` | 1,89,137 | Hover darken, accents |
| `--kw-color-blue-darkest` | `#012C45` | 1,44,69 | Deep accent |

#### Accent Palettes

**Terracotta**

| Token | Hex | Use |
|-------|-----|-----|
| `--kw-color-terra-lightest` | `#E9CFC4` | Backgrounds |
| `--kw-color-terra-light` | `#D2AFA0` | Supporting |
| `--kw-color-terra` | `#BC7D62` | Accent elements |
| `--kw-color-terra-dark` | `#7D5341` | Dark variant |
| `--kw-color-terra-darkest` | `#3F2A21` | Deep accent |

**Green**

| Token | Hex | Use |
|-------|-----|-----|
| `--kw-color-green-lightest` | `#B6D1BB` | Backgrounds |
| `--kw-color-green-light` | `#83A48A` | Supporting |
| `--kw-color-green` | `#477651` | Accent |
| `--kw-color-green-dark` | `#2F4F36` | Dark |
| `--kw-color-green-darkest` | `#18271B` | Deepest |

**Gold & Feedback**

| Token | Hex | Use |
|-------|-----|-----|
| `--kw-color-gold` | `#C3A862` | Accent links, highlights |
| `--kw-color-error` | `#DF3131` | Error states |

---

## Buttons

Buttons use **pill shape** (`border-radius: 99px`), **uppercase text** with `letter-spacing: 0.08em`, `font-size: 12px`, `font-weight: 700`. Brand colors: Forest `#122620`, Gold `#C3A862`.

### Primary Button

```html
<button class="kw-btn kw-btn-primary">Get Started</button>
```

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | `#C3A862` | `#C3A862` | `#FFFFFF` |
| Hover | `#122620` | `#C3A862` | `#FFFFFF` |
| Active | `#A88640` | `#A88640` | `#FFFFFF` |
| Disabled | `#767676` | `#767676` | `#FFFFFF` |

### Secondary Button (Outline)

```html
<button class="kw-btn kw-btn-secondary">Learn More</button>
```

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | `#122620` | `#C3A862` | `#FFFFFF` |
| Hover | `#C3A862` | `#C3A862` | `#FFFFFF` |
| Active | `#A88640` | `#A88640` | `#FFFFFF` |
| Disabled | `#122620` | `#767676` | `#767676` |

### Other Button Variants

```html
<!-- Ghost: text-only, underline on hover -->
<button class="kw-btn kw-btn-ghost">View all →</button>

<!-- Navy: for dark section CTAs -->
<button class="kw-btn kw-btn-navy">Contact Us</button>

<!-- Gold: for accent CTAs -->
<button class="kw-btn kw-btn-gold">Join Now</button>
```

### Button Sizes

```html
<button class="kw-btn kw-btn-primary kw-btn-sm">Small</button>
<button class="kw-btn kw-btn-primary">Default</button>
<button class="kw-btn kw-btn-primary kw-btn-lg">Large</button>
<button class="kw-btn kw-btn-primary kw-btn-block">Full Width</button>
```

---

## Interactions & Motion

All transitions sourced from Wix `--trns` variables.

| Token | Value | Use |
|-------|-------|-----|
| `--kw-transition-fast` | `0.4s ease` | Most interactive elements |
| `--kw-transition-medium` | `0.5s ease` | Sections, overlays |
| `--kw-transition-colors` | `color/bg/border 0.4s ease` | Buttons, links |
| `--kw-transition-opacity` | `opacity 0.4s ease` | Fades |

Image gallery items on the site use a **gradient overlay fade** on hover:
- Overlay: `linear-gradient(180deg, rgba(72,72,72,0) 0%, rgba(0,0,0,0.47) 100%)`
- Opacity: 0 → 1 at 0.4s ease

---

## Layout

| Token | Value | Notes |
|-------|-------|-------|
| `--kw-site-width` | `980px` | Max content width |
| `--kw-border-radius-none` | `0px` | Buttons — sharp |
| `--kw-border-radius-s` | `8px` | Gallery thumbnails |
| `--kw-border-radius-m` | `15px` | Cards, containers |
| `--kw-border-radius-full` | `50%` | Avatars |
| `--kw-shadow-card` | `0px 1px 4px 0px rgba(0,0,0,0.6)` | Card shadows |

---

## Additional Colors — Confirmed via Rendered Page Scan (Script D)

These colors appeared on the actual rendered page beyond the Wix token palette.

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| `--kw-color-surface-warm` | `#FBF8F9` | 251,248,249 | Warm near-white — card/section backgrounds |
| `--kw-color-cream` | `#FFFDF2` | 255,253,242 | Warm cream — form text on dark backgrounds |
| `--kw-color-peach` | `#FFF7EE` | 255,247,238 | Warm off-white peach — accent surface |
| `--kw-color-gold-bright` | `#C3A862` | 195,168,98 | Brighter gold — carousel arrows & nav dots |
| `--kw-color-slate` | `#324158` | 50,65,88 | Slate blue — UI elements, mid-tone |
| `--kw-color-teal` | `#82B5BF` | 130,181,191 | Soft teal — accent element |
| `--kw-color-border-light` | `#DEDEDE` | 222,222,222 | Light gray borders |
| `--kw-color-border-mid` | `#E3E3E3` | 227,227,227 | Mid gray borders |
| `--kw-color-gray-dark` | `#323232` | 50,50,50 | Dark text variant |

### Dark Form Widget Colors

The site has a contact form styled with a dark forest teal background — distinctive and intentional. Replicate it with the `.kw-form-dark` class.

| Token | Hex | Use |
|-------|-----|-----|
| `--kw-color-form-bg` | `#12261F` | Form widget background (dark forest teal) |
| `--kw-color-form-border` | `#0A2323` | Input borders on dark form |
| `--kw-color-form-text` | `#FFFDF2` | Input text & labels on dark form (cream) |

```html
<div class="kw-form-dark">
  <label class="kw-label">Your Name</label>
  <input type="text" placeholder="Enter your name">
  <button class="kw-btn kw-btn-primary">Submit</button>
</div>
```

---

## Quick Reference — Common Patterns

```css
/* Hero section */
.hero-heading {
  font-family: var(--kw-font-primary);
  font-size: var(--kw-font-size-hero);    /* 79px */
  color: var(--kw-color-navy);            /* #122620 */
}

/* Section heading */
.section-heading {
  font-family: var(--kw-font-primary);
  font-size: var(--kw-font-size-title);   /* 44px */
  color: var(--kw-color-navy);
}

/* Body paragraph */
.body-text {
  font-family: var(--kw-font-primary);
  font-size: 13px;
  line-height: 32px;
  color: var(--kw-color-text-muted);      /* #767676 */
}

/* Primary CTA */
.cta {
  background-color: var(--kw-color-blue); /* #C3A862 */
  color: white;
  border: 1px solid var(--kw-color-blue);
  padding: 12px 28px;
  border-radius: 0;
  transition: color 0.4s ease, background-color 0.4s ease, border-color 0.4s ease;
}
.cta:hover {
  background-color: white;
  color: var(--kw-color-blue);
}

/* Gold accent link */
.accent-link {
  color: var(--kw-color-gold);            /* #C3A862 */
}
```

---

## Font Availability Note for Claude Code Projects

Since Myriad Pro is an Adobe/Wix-hosted font, you have three paths:

1. **Adobe Fonts (best fidelity):** Sign up for [Adobe Fonts](https://fonts.adobe.com), create a web project with `myriad-pro`, and embed the provided `<link>` tag.

2. **Source Sans 3 (Google Fonts, closest match):** Geometric humanist sans-serif, very similar weight and feel.
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
   ```

3. **System fallback:** `Arial, Helvetica, sans-serif` — acceptable for wireframes/prototypes.

The tokens file (`--kw-font-primary`) uses the Adobe Fonts CSS name `myriad-pro` first, then falls back gracefully.
