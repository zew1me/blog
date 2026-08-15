# Widgets

Interactive pieces embedded in posts. Two kinds live here, and picking the
wrong one is the most common mistake in this repo.

## The hydration rule

Astro `client:*` directives **only work on components imported directly into an
`.mdx` file**. They do not work in `.md` at all, and they do not work on
components passed through a `components` prop mapping.

So:

| If the thing...                                      | Build it as                                |
| ---------------------------------------------------- | ------------------------------------------ |
| must work in plain `.md` (callouts, figures, asides) | `.astro`, or a remark plugin emitting HTML |
| renders once and never changes                       | `.astro` — zero JS                         |
| responds to the reader                               | `.tsx` React island in an `.mdx` post      |

## Prefer build-time over client-side

For charts specifically: generate the SVG in an `.astro` component at build
time. It ships no JavaScript, renders instantly, prints correctly, and works
with JS disabled. Reach for a React island only when the reader actually
manipulates something — dragging, filtering, stepping through state.

A static chart that ships 45KB of React to redraw the same pixels on every
page load is a bad trade.

## Using one

Rename the post to `.mdx`, import, and hydrate:

```mdx
---
title: 'A post with a widget'
description: '…'
pubDate: 2026-08-15
---

import DecayCurve from '@/widgets/DecayCurve.tsx';

Prose before.

<DecayCurve client:visible />

Prose after.
```

Pick the lightest directive that works:

- `client:visible` — default choice; hydrates when scrolled into view
- `client:idle` — above-the-fold widgets
- `client:load` — only if it must be interactive immediately

## Checking your work

After `pnpm build`, open a `.md` post and confirm the Network tab shows **no**
JS chunks. React should only appear on pages that import a `.tsx` widget. If it
shows up everywhere, something is importing React into shared chrome.
