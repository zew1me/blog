# blog.nigels.dev

Nigel's blog. Plain Markdown in Git, built by [Astro](https://astro.build),
deployed to Vercel. Committing to `main` publishes to production.

- **What the site does** — [SPEC.md](./SPEC.md)
- **How it's built** — [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Visual tokens** — [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)
- **Repo conventions** — [AGENTS.md](./AGENTS.md)
- **Contributing and quality checks** — [CONTRIBUTING.md](./CONTRIBUTING.md)

## Running it

```sh
pnpm install
pnpm dev          # http://localhost:4321
```

| Command        | Does                                                         |
| -------------- | ------------------------------------------------------------ |
| `pnpm dev`     | Dev server. Drafts visible. **Search does not work.**        |
| `pnpm build`   | Production build + search index                              |
| `pnpm preview` | Serve the build. The only way to test search.                |
| `pnpm check`   | Type-check everything                                        |
| `pnpm quality` | Check formatting, lint, types, and static analysis           |
| `pnpm verify`  | Run the complete pre-push gate, including a production build |
| `pnpm audit`   | Check dependencies for high-severity advisories              |
| `pnpm clean`   | Drop build and content caches                                |

---

## Adding a post

Create `src/content/posts/my-post.md`. The filename becomes the URL:
`/posts/my-post/`.

```md
---
title: 'The post title'
description: 'One sentence. Shows in listings, search, RSS, and link previews.'
pubDate: 2026-08-15
tags: ['ai', 'agents']
draft: true
---

Your prose starts here.
```

Delete `draft: true` when it's ready. That's the whole publishing flow.

### Frontmatter

| Field         | Required | Notes                                                |
| ------------- | -------- | ---------------------------------------------------- |
| `title`       | **yes**  | Also a wikilink target                               |
| `description` | **yes**  | One sentence, no markdown                            |
| `pubDate`     | **yes**  | `YYYY-MM-DD`. Interpreted as UTC                     |
| `updatedDate` | no       | Only when materially revising something published    |
| `tags`        | no       | Lowercase, kebab-case, flat. Defaults to `[]`        |
| `draft`       | no       | `true` hides it from production. Defaults to `false` |
| `aliases`     | no       | Extra names wikilinks can use to reach this post     |
| `heroImage`   | no       | Path relative to the `.md` file. Most posts skip it  |

The build **fails** if `title`, `description`, or `pubDate` is missing or
malformed. That's deliberate — those three drive listings, RSS, and SEO.

---

## Writing

### Linking between posts

```md
See [[hello-world]] for the conventions.
See [[hello-world|the intro post]] to change the link text.
```

A link matches, in order: the target's **filename**, then its **aliases**,
then its **title**. Matching ignores case and treats spaces, hyphens, and
underscores as equivalent — so `[[Hello World]]` finds `hello-world.md`.

The target post automatically grows a **"Linked from"** panel. Nothing to
maintain by hand.

A link that matches nothing renders as greyed-out non-link text and logs a
build warning. **It will not fail the build** — a typo in prose shouldn't
block a deploy. Watch the build log.

> Warnings only appear for posts that actually got re-rendered. Astro caches
> unchanged Markdown, so run `pnpm clean` first to see every warning at once.

### Callouts

Work in plain `.md`:

```md
:::note
Standard aside.
:::

:::tip{title="Custom heading"}
The `title` attribute is optional.
:::

:::warn
For things that will bite you.
:::
```

### Everything else

GitHub-Flavored Markdown: tables, task lists, strikethrough, footnotes,
autolinks, and fenced code blocks with syntax highlighting in both themes.

---

## Adding an interactive widget

**A post must be `.mdx` to hold a component.** Astro's `client:*` directives do
nothing in `.md` — that's a framework constraint, not a preference.

1. Rename `my-post.md` → `my-post.mdx`
2. Import the component and hydrate it:

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

`src/content/posts/widgets.mdx` is a working example. See
[`src/widgets/README.md`](./src/widgets/README.md) before building a new one —
particularly the part about preferring build-time SVG over shipping a chart
library.

---

## Publishing

```sh
pnpm verify && pnpm audit
git add -A && git commit -m "post: the post title"
git push
```

Vercel builds and deploys `main` straight to production. There is no preview
or staging environment, so **`pnpm build` passing locally is the only gate.**
