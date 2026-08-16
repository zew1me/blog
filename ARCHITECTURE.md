# ARCHITECTURE

How the site is built. For _what it does_ see [SPEC.md](./SPEC.md).

## Stack

|             |                           | Why                                               |
| ----------- | ------------------------- | ------------------------------------------------- |
| Astro 7     | Static site generator     | Markdown-first; no component runtime unless asked |
| MDX         | Component-bearing posts   | Only for posts that need one                      |
| Tailwind v4 | Design tokens + utilities | `@theme` block via `@tailwindcss/vite`            |
| React 19    | Interactive widgets       | Islands only, never site chrome                   |
| Pagefind    | Search                    | Static index, no backend                          |
| Vercel      | Hosting                   | Static output on the CDN                          |

Output is `static`. **There is no adapter** — Vercel auto-detects Astro and
serves `dist/`. Adding an adapter would opt into a server runtime the site
doesn't need.

## Build pipeline

```text
src/content/posts/*.{md,mdx}
        │
        ▼
  astro build
        ├─ Zod validates frontmatter        (content.config.ts)
        ├─ remark-directive  → :::  nodes
        ├─ remark-callout    → <aside>      (plugins/remark-callout.ts)
        ├─ remark-wikilink   → <a>/<span>   (plugins/remark-wikilink.ts)
        ├─ Shiki dual-theme highlighting
        ├─ backlink graph                   (lib/backlinks.ts)
        ├─ React islands compiled per-page
        ├─ Tailwind emits one stylesheet
        └─ RSS + sitemap
        │
        ▼
     dist/  ── static HTML, CSS, hashed assets
        │
        ▼
  pagefind --site dist
        └─ writes dist/pagefind/
        │
        ▼
      Vercel CDN
```

Both steps run from one script, so the index can never drift from the HTML:

```json
"build": "astro build && pagefind --site dist"
```

`pagefind` is a devDependency; Vercel installs devDependencies during builds.

## Wikilinks: two mechanisms, on purpose

This is the least obvious thing in the repo.

A remark plugin only ever sees **one file at a time**. It cannot know which
posts link to which. So the work is split:

|                  | Rendering                                 | The graph              |
| ---------------- | ----------------------------------------- | ---------------------- |
| File             | `plugins/remark-wikilink.ts`              | `lib/backlinks.ts`     |
| Runs during      | Markdown transform                        | Page render            |
| Reads posts from | disk (`lib/post-index.ts`)                | `getCollection`        |
| Produces         | `<a>` / `<span class="wikilink-missing">` | forward + reverse maps |

They read posts through **different** mechanisms because of where each runs.
Remark plugins execute inside the Vite/Astro config pipeline, where the
`astro:content` virtual module does not exist — so `post-index.ts` walks the
posts directory with `node:fs` and parses frontmatter with `gray-matter`.
`backlinks.ts` runs inside pages, where `getCollection` is available.

**Both resolve links through `lib/resolve-link.ts`.** That shared module is the
only thing keeping the rendered links and the backlink graph consistent. If the
two ever disagree you get links that render but produce no backlink. Change
resolution logic there and nowhere else.

Both sides memoize: `post-index.ts` caches the index for the process,
`backlinks.ts` caches the _promise_ so concurrent page renders share one
computation rather than racing.

### Dev-server caveat

`post-index.ts` builds its index once per process. In `astro dev` the process
is long-lived, so **adding or renaming a post requires a dev-server restart**
before wikilinks to it resolve.

### Build warnings

`plugins/warn.ts` writes to `process.stderr` directly rather than using
`console.warn`. Astro's build logger swallows console output from inside the
remark pipeline — the warning is emitted but never reaches the terminal. This
was verified empirically; do not "simplify" it back.

Astro also caches rendered Markdown in `node_modules/.astro/data-store.json`.
An unchanged post isn't re-rendered, so its plugins don't re-run and its
warnings don't reappear. `pnpm clean` forces a full pass.

## Islands: the constraint that shapes authoring

**Astro `client:*` directives only work on components imported directly into an
`.mdx` file.** They do nothing in `.md`, and they do not work on components
passed through a `components` prop mapping.

Consequences, which are not negotiable:

- **Callouts can never be React.** They're used from plain `.md`, so they are
  emitted as plain HTML by a remark plugin and styled with CSS.
- **A post must be `.mdx` to hold a widget**, with an explicit import.
- Site chrome (header, footer, theme toggle) is `.astro` + vanilla TS, so no
  framework reaches a page that didn't ask for one.

Verified in the build output: a `.md` post contains no `astro-island` and loads
no React renderer or component chunks; the `.mdx` post carries
`client="visible"` with `component-url` and `renderer-url` pointing at React
chunks. Plain posts still include the small vanilla scripts used by shared
chrome for theme selection. The verification checks that both built HTML files
exist before inspecting their island markers. That property is worth
re-checking after any change to shared layouts.

See [`src/widgets/README.md`](./src/widgets/README.md) for choosing between a
build-time `.astro` component and a React island.

## Theming

Tokens are CSS custom properties in a Tailwind `@theme` block; dark mode
redefines only the ones that change under `[data-theme='dark']`.

Theme is resolved **before first paint** by a small `is:inline` script in
`BaseHead.astro` that reads `localStorage`, falling back to
`prefers-color-scheme`. `is:inline` is required — letting Astro bundle and
defer it would reintroduce the white flash it exists to prevent.

`ThemeToggle.astro` is vanilla TS. It writes `localStorage` and flips the
attribute. Shiki emits both themes into the markup; CSS swaps which is visible,
so code blocks change theme with no re-highlighting.

## Search wiring

`components/Search.astro` is a custom UI over the Pagefind JS API rather than
Pagefind's default widget, so it inherits the design tokens.

Two details that are load-bearing:

- The module path is held in a **variable**, not written as a literal. A literal
  specifier makes TypeScript try to resolve a file that doesn't exist until
  Pagefind runs, failing `astro check` with `ts(2307)`. The `/* @vite-ignore */`
  comment stops Vite resolving it at bundle time.
- The directory is `pagefind/`, **not** `_pagefind/`. Pagefind v1.5 dropped the
  underscore, and Astro won't serve underscore-prefixed directories anyway.

Load failure is caught and surfaced as an explanatory message, which is the
normal path in `astro dev`.

## Deployment

Commit to `main` → Vercel builds → production. **No preview or staging
environment.** The blocking pre-push gate is the last local chance to catch a
problem; GitHub checks provide a second, independently reproducible signal but
run alongside the direct Vercel deployment.

Vercel needs: build command `pnpm build`, output directory `dist`, and Node ≥
22.12 (`engines` in `package.json`). Lefthook blocks pushes on `pnpm verify` and
`pnpm audit`; GitHub Actions repeats the quality, production-build,
island-boundary, and dependency checks. DNS for `blog.nigels.dev` is configured
in the Vercel dashboard.

## Deferred, and how to add it later

Each of these was consciously left out. None requires rework to add.

**More collections (`notes`, `projects`)** — add to `content.config.ts` reusing
the `posts` schema, add routes, and widen `getPublishedPosts()` plus the two
link-index builders to span collections. `resolve-link.ts` would need a
collection-aware href.

**A different island framework** — `npx astro add preact`. Preact is ~4KB
against React's ~45KB and is API-compatible via `preact/compat` for most
libraries. Doesn't touch content, schema, or styles.

**Semantic search** — generate embeddings at build time and run
[Orama](https://oramasearch.com) hybrid search client-side alongside Pagefind.
Adds model download weight and opaque ranking; Pagefind is likely sufficient
into the hundreds of posts.

**Generated OG images** — satori + resvg in an endpoint, feeding
`BaseHead.astro`, which already handles a per-post image.

**Pagination** — the archive is a single page. Astro's `paginate()` slots into
`pages/posts/[...page].astro` when the list gets unwieldy.
