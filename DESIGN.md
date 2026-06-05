---
name: Glasshopper
description: Marketing landing for an open-core platform that builds React dashboards inside Home Assistant
register: brand
colors:
  bg-base: "oklch(15% 0.018 162)"
  bg-elev: "oklch(19% 0.021 162)"
  bg-sunk: "oklch(12% 0.015 162)"
  hop-green: "oklch(80% 0.17 156)"
  hop-green-deep: "oklch(64% 0.16 158)"
  hop-green-soft: "oklch(80% 0.17 156 / 0.12)"
  glass-edge: "oklch(96% 0.03 165 / 0.55)"
  glass-cyan: "oklch(82% 0.09 205)"
  text-primary: "oklch(97% 0.006 162)"
  text-muted: "oklch(75% 0.012 162)"
  text-faint: "oklch(60% 0.013 162)"
  hairline: "oklch(100% 0 0 / 0.08)"
  focus-ring: "oklch(80% 0.17 156 / 0.6)"
typography:
  display:
    fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif'
    fontSize: "clamp(2.75rem, 6vw, 5rem)"
    fontWeight: 500
    lineHeight: "1.02"
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif'
    fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)"
    fontWeight: 500
    lineHeight: "1.1"
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.3"
    letterSpacing: "-0.01em"
  body:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: "1.55"
  label:
    fontFamily: '"Inter", system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1.2"
    letterSpacing: "0.14em"
  code:
    fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.6"
rounded:
  pane: "20px"
  panel: "14px"
  control: "10px"
  pill: "9999px"
spacing:
  tight: "8px"
  base: "12px"
  comfortable: "20px"
  generous: "36px"
  section: "120px"
---

# Design System: Glasshopper landing

## 1. Overview

**Creative North Star: "Looking through a clean pane."**

Glasshopper sells transparency, literally. The landing reads like looking at your home's live state through a single, perfectly clean sheet of glass: dark, calm, lit from one edge by a cool green. It is a developer-grade marketing page (the altitude of Linear, Vercel, Resend) with one optical signature that earns the name, and a single green that does all the work. Restraint is the whole game: the page that converts a skeptical engineer is clear, fast, and specific, not decorated.

The name pulls toward two cliché traps and the design refuses both. It is **not** acid neon-green on pure black (the crypto/gaming reflex), and it is **not** frosted glassmorphism cards stacked on every surface (the literal-name reflex). Green is rationed. Glass appears once, as a real refractive moment in the hero, and elsewhere only as the *idea* of a clean hairline-framed pane.

**Key characteristics:**
- Dark, near-black neutrals tinted green (chroma 0.015–0.021), never pure black.
- One protagonist color: Hop Green, disciplined to roughly 15–20% of any viewport.
- Exactly one true glass/refraction moment (hero). Everywhere else: flat panels, hairline borders.
- Space Grotesk display for character, Inter for body, JetBrains Mono for code surfaces.
- Generous, varied vertical rhythm; long section breathing room; no card-grid monotony.
- Motion is ease-out, short, once. No bounce, no parallax theatrics.

## 2. Colors

Committed strategy, disciplined: green is unmistakably the brand color and carries the hero light, CTAs, links, and code keywords, but tinted-dark neutrals hold most of the surface so it never reads as neon.

### Primary
- **Hop Green** (`oklch(80% 0.17 156)`): the single protagonist. Primary CTA fill, inline links, code keyword highlight, the hero edge-light, the live status pulse. Target ~15–20% of any viewport, never a full-bleed green field. Verify AA: on `bg-base` for text, use it at large/semibold sizes; for body-size green text step toward `text-primary`.
- **Hop Green Deep** (`oklch(64% 0.16 158)`): hover/pressed state of green fills, and green text that must pass AA at body size.

### Secondary
- **Glass Cyan** (`oklch(82% 0.09 205)`): a cool, low-chroma cyan reserved for code-syntax variety (strings, types) and the cooler side of the hero refraction. Never a second CTA color, never decorative blocks. It exists so the green stays rare.

### Neutrals (surface)
- **Pane Black** (`oklch(15% 0.018 162)`): base background. Near-black with a green tint, never `#000`.
- **Pane Elevated** (`oklch(19% 0.021 162)`): raised surfaces, code window chrome, the nav on scroll.
- **Pane Sunk** (`oklch(12% 0.015 162)`): the darkest recess, code editor body, footer.
- **Whisper** (`oklch(97% 0.006 162)`): primary text. Not `#fff`; a green whisper kills glare on dark.
- **Text Muted** (`oklch(75% 0.012 162)`): body paragraphs, secondary copy.
- **Text Faint** (`oklch(60% 0.013 162)`): labels, captions, code comments, metadata.

### Optical accents
- **Glass Edge** (`oklch(96% 0.03 165 / 0.55)`): the bright refracted highlight along the lit edge of the hero glass pane and along the top hairline of elevated panels. The only near-white in the system, always at low alpha.
- **Hairline** (`oklch(100% 0 0 / 0.08)`): all borders. Frames panels as clean glass edges, never as boxes.
- **Hop Green Soft** (`oklch(80% 0.17 156 / 0.12)`): green wash behind active states, the hero light bloom, code keyword background on hover.

### Named rules
- **The One-Green Rule.** Hop Green is the only saturated brand color. Glass Cyan is a quiet code accent, not a second brand color. Never introduce violet, amber, or pink for decoration.
- **The No-Neon-Field Rule.** Green is light and accent, never a large filled surface on black. A full green-on-black block is the gaming cliché; refuse it.
- **The No-Pure rule.** Never `#fff` / `#000`. Whisper and Pane Black are canonical.

## 3. Typography

- **Display / Headline: Space Grotesk, weight 500.** Tight tracking, slightly mechanical character that reads "engineering" without going full monospace. Carries the hero and section heads.
- **Body / Title: Inter.** Neutral, legible, the workhorse for paragraphs and feature copy. Body at 17px, line length capped 65–72ch.
- **Code: JetBrains Mono.** Every code surface (hero/CodeWindow, install command, inline `useEntity`). Real syntax color using Hop Green (keywords), Glass Cyan (strings/types), Text Faint (comments), Whisper (identifiers).

### Named rules
- **The Scale-Jump Rule.** Contrast comes from the Space Grotesk display (500, huge, tight) dropping to Inter body (400, 17px). Ratio ≥1.25 between steps; no flat scales.
- **The Uppercase-Only-With-Tracking Rule.** Labels uppercase only at letter-spacing ≥0.12em. Otherwise sentence case.
- **The Real-Code Rule.** Code on the page must be valid, runnable Glasshopper code. No lorem-ipsum pseudo-API.

## 4. Elevation

Flat by default, separated by tonal layering and hairlines, not drop shadows. Depth cues:
1. **One ambient light source.** A single soft green-cyan bloom behind the hero glass, top-edge origin, suggesting light entering through the pane. Nowhere else.
2. **Tonal layering.** `bg-sunk` < `bg-base` < `bg-elev` to separate the code window and nav from the page.
3. **Hairline framing.** `hairline` borders + a `glass-edge` top highlight on elevated panels read as the lit edge of glass.

### Named rules
- **The Single-Bloom Rule.** Only the hero gets the green light bloom. No glow behind static panels, no neon outer-glow.
- **The Glass-Edge, Not-Blur Rule.** Panels evoke glass through a bright top hairline + crisp border, **not** `backdrop-filter: blur`. The only place real blur/refraction is allowed is the one hero optical element.

## 5. Components

- **Nav.** Transparent at top, gains `bg-elev/80` + bottom hairline on scroll. Wordmark slot (logo from Gemini) left, links + GitHub star + green "Get started" pill right. Focus-visible on all.
- **Hero.** Display headline ("Glass panels for your smart home. In React."), one-line sub, two CTAs (green pill primary `Get started`, ghost copy-button `npx create-glasshopper`), and the single signature glass/refraction visual. Eyebrow: `v0.x · Open source · Apache-2.0` with a Hop Green pulse dot.
- **Code window.** Pane Sunk body, Pane Elevated title bar with three hairline dots, JetBrains Mono, real syntax colors. Shows a `useEntity` + `useService` snippet. This is the hero proof, promote it high.
- **Features.** The five hooks + zero-auth + multi-dashboard, as a non-uniform layout (one wide "five hooks" feature with the hook names as a mono list, smaller supporting points around it). Never five identical icon cards.
- **Templates.** Jarvis premium template, one rich preview panel, not a grid of placeholders.
- **Install.** The `npx create-glasshopper my-dashboard` command as a large copy-able mono block, plus the three-step (scaffold, dev, deploy) as plain numbered text, not cards.
- **Footer.** Pane Sunk, wordmark, links (Docs, GitHub, License), Apache-2.0 line. Quiet.

## 6. Do's and Don'ts

### Do
- Use OKLCH for every color; the frontmatter is normative.
- Keep Hop Green rare and working: CTA, links, code keywords, one hero light.
- Make every code sample valid Glasshopper code.
- Use one real refractive glass moment in the hero; hairline-frame everything else.
- Vary vertical spacing; give sections `section` (120px) breathing room.
- Reveal on scroll with ease-out, short, once; honor `prefers-reduced-motion`.
- Leave a clean, centered wordmark slot for the Gemini logo (don't bake in a placeholder eye).

### Don't
- No `#fff` / `#000`, no violet/amber decoration, no gradient text (`background-clip: text`).
- No neon-green-on-black fields, no RGB glow, no glitch, no terminal-green cliché.
- No `backdrop-filter: blur` on panels; glass is hairline + edge highlight, except the one hero element.
- No five-identical-card grid, no hero-metric template, no fake "Trusted by" logo wall.
- No bounce/elastic motion, no scroll-jacking parallax.
- No em dashes in copy. No exclamation-heavy hype. No mascot grasshopper as hero art.
- No leftover Scry concepts: no eye/scrying metaphor, no "See your home" verb framing.
