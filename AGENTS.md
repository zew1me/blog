# AGENTS.md

Conventions for working in this repo.

Astro 7 static blog → Vercel. **Committing to `main` publishes to production.**
There is no preview or staging environment.

Read [SPEC.md](./SPEC.md) for behaviour, [ARCHITECTURE.md](./ARCHITECTURE.md)
for build mechanics, [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) for tokens.

## Commands

```sh
pnpm dev        # drafts visible; search does NOT work
pnpm build      # astro build && pagefind --site dist
pnpm preview    # serve the build — only way to test search
pnpm check      # astro check; must be clean
pnpm quality    # formatting, lint, types, and static analysis
pnpm verify     # complete quality gate + production build
pnpm audit      # block high-severity dependency advisories
pnpm clean      # drop dist + content caches
```

pnpm, not npm. Node ≥ 22.12. The package manager is pinned in `package.json`,
and dependency resolution rejects versions published less than five days ago.
`astro check` needs TypeScript 6.x — 7.x drops the API it depends on, so **do
not bump TypeScript to 7**.

## Layout

```text
src/
  components/   Astro UI. No React here.
  layouts/      BaseLayout (chrome) → BlogPost (article)
  pages/        Routes. File-based.
  content/
    posts/      The blog. .md by default, .mdx only when importing.
  lib/          Build-time logic — content queries, link resolution
  plugins/      Remark plugins
  widgets/      React islands for posts. See its README.
  styles/       global.css — all tokens live here
  consts.ts     Site identity. Single source of truth.
```

### Where things go

| Adding                      | Put it in                   | As                                 |
| --------------------------- | --------------------------- | ---------------------------------- |
| Site chrome                 | `components/`               | `.astro`                           |
| Something usable from `.md` | `plugins/` or `components/` | HTML + CSS, never React            |
| An interactive widget       | `widgets/`                  | `.tsx`, imported by an `.mdx` post |
| A content query             | `lib/content.ts`            | reuse `getPublishedPosts()`        |
| A route                     | `pages/`                    | `.astro`                           |
| A colour or size            | `styles/global.css`         | a token                            |

## Hard rules

**Never call `getCollection('posts')` in a page.** Use `getPublishedPosts()`
from `lib/content.ts`. It's the only thing enforcing the draft rule, and a
direct call leaks drafts into production while looking correct in dev.

**Never hardcode a colour or font size.** Use `var(--color-*)` and
`var(--text-step-*)`. A raw hex will not respond to dark mode.

**Never make a `.md`-usable component React.** Astro cannot hydrate anything in
plain Markdown. Callouts and similar prose furniture are remark plugins
emitting HTML.

**Keep posts `.md`.** Convert to `.mdx` only when the post imports a component.

**Change link resolution only in `lib/resolve-link.ts`.** Both the remark plugin
and the backlink graph depend on it. Divergence produces links that render but
generate no backlink.

**Don't add a Vercel adapter.** The site is static; an adapter opts into a
server runtime it doesn't need.

**Don't replace `plugins/warn.ts` with `console.warn`.** Astro's build logger
swallows console output from the remark pipeline. The direct stderr write is
deliberate and was verified empirically.

**Never bypass Lefthook with `--no-verify`.** Pre-commit intentionally applies
safe autofixes; pre-push runs the blocking production gate.

**`pnpm verify` and `pnpm audit` must pass before pushing.** GitHub Actions runs
the same quality, build, island-boundary, and dependency checks.

## Gotchas

- **Search is absent in dev.** The index is generated after `astro build`. Use
  `pnpm preview`.
- **Wikilinks need a dev-server restart** after adding or renaming a post — the
  disk index is built once per process.
- **Build warnings don't repeat.** Astro caches unchanged Markdown, so its
  plugins don't re-run. `pnpm clean` forces a full pass.
- **Pagefind outputs to `dist/pagefind/`**, not `_pagefind/` (v1.5 change).
- **Dates are UTC everywhere.** Frontmatter dates have no timezone; local
  formatting shifts posts by a day.
- **The origin is defined once**, as `SITE_URL` in `consts.ts`; the Astro config
  imports it. Don't reintroduce a second literal.

## Verifying a change

After anything touching layouts, config, or shared components:

```sh
pnpm verify && pnpm audit && pnpm preview
```

Then confirm the island boundary still holds — a `.md` post must ship no JS:

```sh
grep -c 'astro-island' dist/posts/hello-world/index.html   # expect 0
grep -c 'astro-island' dist/posts/widgets/index.html       # expect > 0
```

If React starts appearing on `.md` pages, something imported a `.tsx` into
shared chrome.
