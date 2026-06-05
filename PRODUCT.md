# Product

## Register

brand

## Users

Home Assistant developers and makers evaluating how to build a custom dashboard. They already run HA, know React (or want an excuse to), and are frustrated that their only options are Lovelace cards (still Lovelace) or a separately hosted web app (an auth and CORS nightmare). They land here from r/homeassistant, Hacker News, a HACS listing, or a "Show HN". They are technical, skeptical of marketing, and decide in seconds by reading code, not copy. Job-to-be-done on this page: understand in one screen what Glasshopper is, see the hook API, and believe it is real, maintained, and worth `npx create-glasshopper`. Global audience, English only.

## Product Purpose

Marketing landing for Glasshopper, an open-core platform for building React dashboards that run inside Home Assistant as native sidebar panels. The page sells the developer experience: five hooks (`useEntity`, `useService`, `useHistory`, `useArea`, `useTheme`), zero auth (the panel iframe inherits HA's session), zero CORS, multi-dashboard config flow, kiosk-ready, HACS-installable, Apache-2.0. Success = a developer copies the install command or clicks through to the quickstart. Secondary: communicate that the core is free and open, premium templates (Jarvis) are the paid tier. The design IS the credibility: a sloppy landing for a dev tool reads as an abandoned weekend project.

## Brand Personality

Three words: **precise, transparent, light-footed.** Developer-grade craft (Linear, Vercel, Resend altitude) with a quiet sense of play that earns the name. "Transparent" is literal and figurative: you can see straight through to your home's live state, and the project is open about being open-core. "Light-footed" is the grasshopper: it gets you from idea to running panel in one hop, no infrastructure. The voice is plain, confident, slightly dry. It respects that the reader is an engineer: it shows the hook, it doesn't gush about it. Never cute, never mascot-forward in the copy, never exclamation-heavy.

## Anti-references

**Explicitly must NOT look like:**

- **Generic dev-tool SaaS slop**: violet-to-blue gradient hero, the big-number-plus-substats metric template, three identical icon+heading+text cards, a Lottie that means nothing, "Trusted by" logo wall with fake logos. The first thing a skeptical dev dismisses.
- **Crypto / gaming neon-green-on-black**: acid green glow, RGB everywhere, terminal-green on pure black, glitch text. The lazy reflex for "green brand + dev + dark," and exactly the trap the grasshopper-green could fall into. Avoid hard.
- **Blurry glassmorphism everywhere**: frosted backdrop-blur cards stacked across the whole page just because the product is named Glass-something. The name earns ONE purposeful refractive moment, not a blur on every surface.
- **Smart-home consumer cartoon**: giant emoji, house-with-eyes illustration, pastel, bouncy spring micro-interactions. This is a tool for builders, not an Alexa app.
- **Mascot landing**: a cartoon grasshopper hero filling the fold. The grasshopper lives in the logo mark (designed separately) and in restraint, not as a clip-art centerpiece.

## Design Principles

1. **Show the code, not adjectives.** The hook API is the strongest sales asset. A real, syntax-accurate code surface is above or beside the fold, not buried. Developers trust code they can read.
2. **One green, carried with discipline.** Glasshopper green is the single protagonist color and it does real work (CTA, links, code keywords, the hero light). Tinted near-black neutrals hold most of the surface so the green never tips into neon-gaming. Rarity is the signal.
3. **Glass is a precision instrument, used once.** Exactly one signature refractive/optical moment (the hero). Everywhere else: hairline-framed flat panels that merely *evoke* a clean pane of glass. No decorative backdrop-blur.
4. **Negative space is a feature.** Dev landings convert on clarity. Generous, varied spacing; never wall-to-wall cards; never the same padding everywhere.
5. **Light-footed motion, no bounce.** Reveals ease-out (expo/quint), short, once. The "hop" is in the copy and the accent, never in elastic spring animation. Respect `prefers-reduced-motion`.
6. **Earn trust with specifics.** Version badge, Apache-2.0, "inherits HA's session, no tokens" stated plainly. Concrete claims, not superlatives.

## Accessibility & Inclusion

- Dark theme; maintain WCAG AA contrast on all text including muted/faint labels and the green-on-dark CTAs (verify the green hits AA on its background).
- Status and meaning never carried by color alone.
- `prefers-reduced-motion`: disable reveals and any ambient motion.
- Visible focus ring on every interactive element (Nav links, CTAs, the copy-install button).
- Copy-to-clipboard install button announces success to assistive tech.
- English, `en` locale.
