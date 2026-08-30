# Renato & Marília — Wedding Design System

A design system for the wedding of **Renato Peres and Marília** (ceremony December 20, 2026, Condomínio Mirante do Lago, Palmas TO). Not a company — this is stationery + web branding for one event, generated from a single reference asset supplied by the couple.

## Source material
- `uploads/WhatsApp Image 2026-08-18 at 07.44.30.jpeg` — the couple's own invitation design (script names, sage-green watercolor leaves, gold brushstrokes, Bible verse 1 Corinthians 13:12, ceremony date/venue). This is the only source; there is no codebase, Figma file, or existing brand guide. Colors and type were extracted directly from this image (see run_script pixel sampling in the build history) — no illustrations were copied out (see Iconography).

## What's here
- `styles.css` + `tokens/` — colors, type, spacing custom properties.
- `guidelines/` — foundation specimen cards (Design System tab: Colors, Type, Spacing, Brand groups).
- `components/core/` — Button, Input, Textarea, Card.
- `components/brand/` — SectionLabel, ScriptHeading, DateBlock, Monogram.
- `components/navigation/` — NavBar.
- `ui_kits/invitation-suite/` — Save-the-date, formal invitation, RSVP card (print-style recreations).
- `ui_kits/wedding-website/` — one-page wedding site (hero, verse, venue, RSVP form, footer).
- `assets/` — empty; see Iconography.
- `SKILL.md` — portable skill file for use in Claude Code.

## Components
Button, Input, Textarea, Card (core); SectionLabel, ScriptHeading, DateBlock, Monogram (brand); NavBar (navigation). This is an original, from-scratch primitive set (no source codebase/Figma defined an inventory) sized to what the invitation suite and website actually need — no unused primitives (no Toast, Tabs, Dialog, etc.) were added.

## Content fundamentals
- **Language:** Brazilian Portuguese throughout. Formal, warm register — "Você está convidado" (you're invited), not casual slang.
- **Voice:** first-person-plural from the couple ("nossa cerimônia de casamento" — our wedding ceremony). Short, declarative sentences for logistics (date, time, venue); one scripture quotation carries the emotional register.
- **Casing:** section labels and the date/time lockup are set in full uppercase with wide letter-spacing (e.g. "VOCÊ ESTÁ CONVIDADO PARA A NOSSA CERIMÔNIA DE CASAMENTO!", "DOMINGO", "ÀS 11 DA MANHÃ"). Body copy (the verse, the address) is sentence case.
- **No emoji, no exclamation-heavy copy** beyond the single invite line's "!". Tone stays reverent, not festive/loud.
- **Numerals:** day-of-month set large and isolated ("20"), always paired with weekday + time as a three-part lockup.

## Visual foundations
- **Color:** ivory/cream page background, deep botanical green and antique gold as the two accents, charcoal for body text. Max two accent hues (green, gold) plus neutrals — see `tokens/colors.css`.
- **Type:** three families, strict roles. `Alex Brush` (script) — couple's names and hero words only, used sparingly. `Cormorant Garamond` (serif) — all reading copy, quotations, addresses. `Oswald` (condensed bold sans) — uppercase labels, dates, times, nav. Never mix script with body copy in one line.
- **Backgrounds:** flat color fields only (ivory, deep green). No gradients, no photography, no repeating pattern/texture in this system — the invitation reference uses watercolor washes and hand-painted leaves, but those aren't reproduced (see Iconography); flat color stands in for them.
- **Spacing:** generous whitespace, 4px-based scale (`tokens/spacing.css`), sections breathe at 80–120px vertical padding.
- **Borders & dividers:** hairline (1px) gold or neutral rules — no heavy borders, no rounded pill outlines. The "SECTION LABEL" pattern (short gold rule — label — short gold rule) is the system's signature divider, replacing illustrated flourishes.
- **Corners:** near-square, 2–4px radius on buttons/cards only. Nothing pill-shaped, nothing heavily rounded.
- **Shadows:** one soft ambient card shadow (`--shadow-card`), used sparingly — invitations and forms sit as flat cards with a hairline border, shadow is secondary.
- **Animation:** none specified — this system has no motion foundation; treat all interactive states as instant/CSS-transition only (200ms ease on hover, no bounce/spring).
- **Hover / press states:** hover deepens gold to `--color-gold-deep` (buttons fill or text darkens); no lightening, no scale/shrink press effect defined — keep interactions understated.
- **Imagery:** none in this system (no photos included). If the couple supplies real photos later, treat them as warm-toned, natural light to match the botanical/gold palette — avoid cool/blue grading.
- **Transparency/blur:** not used anywhere in this system.

## Iconography
No icon set, icon font, or SVG sprite exists in the source material — the invitation uses illustrated botanical motifs (watercolor leaves, gold brushstroke swashes, scattered gold dots), not icons. Those illustrations were **not extracted or reproduced** (they read as a stock/template asset, not the couple's own artwork) — the `motif-*` cards in `guidelines/` explain the typographic substitute (gold hairline rules + overline labels standing in for flourishes). No emoji, no unicode-glyph icons are used. If the couple wants real botanical or photographic assets, drop files into `assets/` and they can be wired into the hero/section backgrounds.

## Logo / monogram
No logo file exists. `components/brand/Monogram.jsx` is a plain typographic "R & M" lockup (serif + script ampersand) standing in for a mark — not a designed crest. Swap it out if the couple has one.

## Fonts
Alex Brush, Cormorant Garamond, and Oswald are matched from Google Fonts (closest available match to the invitation's brush-script and classic serif) and loaded via `@import` in `tokens/typography.css` — no font files were supplied, so nothing is self-hosted. Flag to the couple: if they have the exact licensed fonts from their invitation template, share them and this can switch to self-hosted `@font-face`.

## Caveats / open questions
- Colors and fonts are inferred from one JPEG of a templated invitation, not brand-supplied hex values or font files — treat as a strong starting point, not final production values.
- No logo/crest exists; the monogram is placeholder typography.
- No illustrated/botanical assets were extracted (see Iconography) — the system is currently flat-color + type only.
