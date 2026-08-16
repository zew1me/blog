# SPEC

What the site does. For _how_ it's built see [ARCHITECTURE.md](./ARCHITECTURE.md);
for visual tokens see [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

## Identity

|                  |                                                                  |
| ---------------- | ---------------------------------------------------------------- |
| Title            | Nigel's Blog                                                     |
| Canonical origin | `https://blog.nigels.dev`                                        |
| Author           | Nigel S.                                                         |
| Related site     | `https://nigels.dev` — separate property, linked from the footer |

Defined once in `src/consts.ts`. `astro.config.mjs` imports `SITE_URL` as its
`site` value, so the origin has a single definition rather than two that could
drift.

## Content model

One collection: `posts`, loaded from `src/content/posts/**/*.{md,mdx}`.

`notes` and `projects` are deliberately deferred. The schema is shaped so they
can be added later without migrating anything.

### Schema

Enforced by Zod in `src/content.config.ts`. A violation fails the build.

| Field         | Type     | Default        | Meaning                                   |
| ------------- | -------- | -------------- | ----------------------------------------- |
| `title`       | string   | — **required** | Display title; also a wikilink target     |
| `description` | string   | — **required** | One-sentence dek. Listings, `<meta>`, RSS |
| `pubDate`     | date     | — **required** | Publication date; drives all ordering     |
| `updatedDate` | date     | —              | Shown only when set                       |
| `heroImage`   | image    | —              | Optional. Most posts have none            |
| `tags`        | string[] | `[]`           | Lowercase, kebab-case, flat               |
| `draft`       | boolean  | `false`        | Hidden in production                      |
| `aliases`     | string[] | `[]`           | Additional wikilink targets               |

Three fields are required because each has a downstream consumer that cannot
degrade gracefully: `title` (listings, links), `description` (RSS, previews),
`pubDate` (ordering, archive grouping).

### Dates

Frontmatter dates carry no timezone, so **all formatting is UTC**. Rendering in
the build machine's local zone would shift posts by a day depending on where
the build ran.

### Slugs and URLs

The filename is the slug. `src/content/posts/hello-world.md` → `/posts/hello-world/`.
Trailing slashes are enforced site-wide.

Renaming a file changes its URL and breaks inbound links. There is no redirect
mechanism; add `aliases` to keep _wikilinks_ working, but note that aliases do
**not** create redirects for external URLs.

## Routes

| Route                | Contents                                                 |
| -------------------- | -------------------------------------------------------- |
| `/`                  | “Hello, world.” landing page, followed by recent writing |
| `/posts/`            | Full archive grouped by year, newest first               |
| `/posts/<slug>/`     | The post, plus its backlinks panel                       |
| `/tags/`             | All tags with counts, most-used first                    |
| `/tags/<tag>/`       | Posts carrying that tag                                  |
| `/search/`           | Client-side search                                       |
| `/rss.xml`           | Feed                                                     |
| `/sitemap-index.xml` | Sitemap (excludes `/search/`)                            |
| `/404`               | Not found                                                |

## Drafts

`draft: true` means the post is **absent from production entirely** — no page
is generated, and it appears in no listing, tag page, RSS item, sitemap entry,
or search result.

In `astro dev` drafts are fully visible and marked with a badge, so you can
work on them normally.

This is enforced in exactly one place: `getPublishedPosts()` in
`src/lib/content.ts`. Pages must never call `getCollection('posts')` directly —
doing so leaks drafts into production, and the mistake is invisible in dev,
where drafts are _supposed_ to show.

## Wikilinks

Syntax: `[[target]]` or `[[target|link text]]`.

### Resolution

Matching is case-insensitive and treats spaces, hyphens, and underscores as
equivalent. A trailing `.md`/`.mdx` is ignored. Order:

1. **Slug** (filename without extension)
2. **`aliases`**
3. **`title`**

Earlier tiers win outright, so an alias can never shadow a real slug. Within
the alias and title tiers, first-writer-wins keeps collisions deterministic.

Drafts are not link targets in production.

### Unresolved links

Render as `<span class="wikilink-missing">` — visible, greyed, not clickable —
and emit a **build warning, never an error**. A prose typo must not block a
deploy.

Warnings only surface for posts that were re-rendered; Astro caches unchanged
Markdown. `pnpm clean` forces a full re-render.

### Backlinks

Every post page lists the posts that link **to** it, under "Linked from",
sorted alphabetically. Derived at build time; nothing is authored by hand.

- Self-links are excluded.
- Two links from the same source count once.
- Drafts neither give nor receive backlinks in production.

## Search

Pagefind, over the built HTML. Entirely static — no server, no API, no account.

- **Indexed:** post body prose only (`data-pagefind-body` on the post layout).
- **Not indexed:** the homepage, archive, tag pages, 404, and — within a
  post — the header, footer, nav, and backlinks panel. Backlinks are excluded
  deliberately: they contain _other_ posts' titles, which would make every
  backlinked post a false hit.
- Results show title and a highlighted excerpt; first 20 rendered.
- `/search/?q=term` pre-fills and runs the query.

**Search only works against a production build.** The index is generated after
`astro build`, so `astro dev` has none; the UI says so rather than failing.

## RSS

At `/rss.xml`. Summary-only — title, description, date, tags, link. The body is
deliberately omitted: posts may contain hydrated components with no meaningful
feed representation, and a broken island in a reader is worse than a link.

## Tags

Lowercase, kebab-case, flat — no hierarchy or nesting. Free-form, not a
controlled vocabulary; a tag page exists for whatever appears in frontmatter.

## Accessibility

- Skip-to-content link on every page.
- Semantic landmarks, one `<h1>` per page.
- Visible focus rings via the accent token.
- Both themes maintain body-text contrast at WCAG AA or better.
- `prefers-reduced-motion` respected globally.
- Atkinson Hyperlegible, chosen for legibility.
- No content requires JavaScript. Search is the sole JS-dependent feature, and
  widgets degrade to their server-rendered markup.

## Non-goals

Explicitly out of scope. Adding any of these is a decision, not an oversight.

- Comments, reactions, analytics, tracking, newsletter signup
- A CMS or admin UI — Git is the interface
- Server runtime, database, or API routes; the output is static files
- Authentication or paywalling
- Generated OG images
- Pagination — the archive is one page until that hurts
- i18n
- Preview/staging deploys — `main` goes straight to production
