# DESIGN SYSTEM

The visual contract. Everything lives in `src/styles/global.css`.

**Two rules:**

1. Never hardcode a colour. Use a token.
2. Never hardcode a font size. Use a step.

If something needs a value the tokens don't provide, add a token — don't inline
a one-off. That's what keeps dark mode working without per-component audits.

## Direction

Editorial and text-first. A single measured column, generous leading, no
decoration that isn't doing work. Hero images are optional and most posts won't
have one, so **typography carries the whole design** — the type scale and the
measure matter more than anything else here.

## Colour

Tokens are declared in the Tailwind `@theme` block and consumed as
`var(--color-*)`. Dark mode redefines **only** what changes, under
`[data-theme='dark']`.

All values are `oklch()`, which keeps perceived lightness consistent across
hues — a light and dark pair at the same L read as equally prominent.

| Token                 | Role                               | Light                  | Dark                  |
| --------------------- | ---------------------------------- | ---------------------- | --------------------- |
| `--color-paper`       | Page background                    | `oklch(99% .004 95)`   | `oklch(18% .012 260)` |
| `--color-paper-sunk`  | Recessed surfaces: inputs, widgets | `oklch(96.5% .005 95)` | `oklch(22% .014 260)` |
| `--color-ink`         | Body text, headings                | `oklch(24% .015 260)`  | `oklch(92% .008 260)` |
| `--color-ink-muted`   | Deks, secondary text               | `oklch(52% .02 260)`   | `oklch(72% .015 260)` |
| `--color-ink-faint`   | Dates, counts, captions            | `oklch(68% .015 260)`  | `oklch(56% .015 260)` |
| `--color-rule`        | Borders, dividers                  | `oklch(90% .008 260)`  | `oklch(32% .014 260)` |
| `--color-accent`      | Links, focus, emphasis             | `oklch(52% .19 258)`   | `oklch(76% .14 258)`  |
| `--color-accent-soft` | Accent fills, marks                | `oklch(95% .03 258)`   | `oklch(30% .05 258)`  |
| `--color-warn`        | Warnings, broken links             | `oklch(58% .16 55)`    | `oklch(78% .13 70)`   |
| `--color-warn-soft`   | Warning fills                      | `oklch(96% .04 75)`    | `oklch(30% .045 70)`  |
| `--color-tip`         | Tip callouts                       | `oklch(56% .13 165)`   | `oklch(76% .11 165)`  |
| `--color-tip-soft`    | Tip fills                          | `oklch(96% .035 165)`  | `oklch(28% .04 165)`  |

The paper tokens carry a trace of warm hue in light mode and cool in dark. Pure
`#fff`/`#000` are avoided — both are harsher than they look in a long read.

### Theme resolution

`data-theme` on `<html>`, set before first paint by an inline script in
`BaseHead.astro`. Precedence: stored choice → `prefers-color-scheme` → light.

Any new colour **must** be defined in both palettes. A token defined only in
`@theme` will silently keep its light value in dark mode.

## Type

Atkinson Hyperlegible, self-hosted, 400 and 700, wired through Astro's `fonts`
config and exposed as `--font-atkinson`. Chosen for legibility — it was
designed for low-vision readers. One family for everything; hierarchy comes
from size and weight, not from mixing faces.

The scale is fluid `clamp()` — no breakpoint jumps.

| Step             | Range              | Used for                           |
| ---------------- | ------------------ | ---------------------------------- |
| `--text-step--1` | 0.875 → 0.95rem    | Meta, captions, callout body, code |
| `--text-step-0`  | 1.0625 → 1.1875rem | Body copy                          |
| `--text-step-1`  | 1.33 → 1.5rem      | List titles, deks, `h3`            |
| `--text-step-2`  | 1.66 → 2rem        | `h2` in prose                      |
| `--text-step-3`  | 2.07 → 2.66rem     | Page titles, featured post         |
| `--text-step-4`  | 2.59 → 3.55rem     | Post `h1`                          |

Body line-height is 1.65, prose 1.7. Headings tighten to 1.1–1.3 and take
negative tracking, which large text needs to avoid looking loose.

## Layout

| Token            | Value   | Role                                             |
| ---------------- | ------- | ------------------------------------------------ |
| `--measure`      | `68ch`  | The column. Nearly everything sits in `.measure` |
| `--measure-wide` | `82rem` | Escape hatch; currently unused                   |

`.measure` centres, caps at the measure, and adds inline padding. There is no
grid system — one column is the design.

Radii: `--radius-sm` (0.25rem) for inline chips and small controls,
`--radius-md` (0.5rem) for cards, images, and code blocks.

## Prose

`.prose` uses `@tailwindcss/typography` with every `--tw-prose-*` variable
remapped onto the tokens above, so it themes automatically. Overrides on top:
heading sizes from the scale, thin underlines with `0.18em` offset, non-italic
blockquotes with a 2px accent rule.

Code blocks are highlighted by Shiki in **both** themes at build time
(`github-light` / `github-dark`); CSS chooses which is visible. Never
re-highlight at runtime.

## Components

**Callouts** — `.callout` plus `.callout-note` / `-tip` / `-warn`. Left accent
rule, soft tinted fill, bold title with a small glyph. Pure CSS with no JS,
because they must work in plain `.md`.

**Wikilinks** — `.wikilink` gets a dotted underline, distinguishing an internal
graph link from an ordinary one. `.wikilink-missing` renders faint with a
warning-coloured dotted underline and a `help` cursor: visible enough to fix,
quiet enough not to derail the read.

**Widgets** — `.widget` is a bordered, recessed container. Widgets should draw
using `var(--color-*)` directly, including inside SVG, so they track the theme
without knowing what it is. `DecayCurve.tsx` is the reference.

**`.eyebrow`** — small uppercase tracked label for section headings.

## Non-negotiables

- Focus is always visible: 2px accent outline, 2px offset. Never remove it.
- `prefers-reduced-motion: reduce` kills animation globally. Don't opt out.
- Body text meets WCAG AA in both themes.
- Tap targets ≥ 32px.
- No layout shift from fonts — `display: swap` with a matched fallback.
